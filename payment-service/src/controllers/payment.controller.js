import crypto from "crypto";
import axios from "axios";
import razorpay from "../config/razorpay.js";
import PaymentModel from "../models/Payment.model.js";
import WebhookEventModel from "../models/WebhookEvent.model.js";
import CheckoutPaymentModel from "../models/CheckoutPayment.model.js";

function formatCheckoutPayment(payment) {
  const data = payment.toObject();

  return {
    ...data,
    paymentType: "MULTI_VENDOR",
    orderId: data.orderIds?.join(", ") || data.checkoutId,
    vendorId: [
      ...new Set(
        (data.allocations || []).map((allocation) => allocation.vendorId),
      ),
    ].join(", "),
  };
}

export async function createPaymentOrderController(req, res) {
  try {
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can initiate payments",
      });
    }
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        status: "failed",
        message: "Order ID is required",
      });
    }

    // Fetch order from Order Service
    let orderResponse;

    try {
      orderResponse = await axios.get(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}`,
        {
          headers: {
            Cookie: req.headers.cookie || "",
          },
        },
      );
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({
          status: "failed",
          message: "Order not found",
        });
      }

      return res.status(503).json({
        status: "failed",
        message: "Order Service is unavailable",
      });
    }

    const order = orderResponse.data.data;

    // Verify order ownership
    if (order.customerId !== req.user.userId) {
      return res.status(403).json({
        status: "failed",
        message: "You cannot pay for another customer's order",
      });
    }

    if (order.orderStatus !== "PLACED") {
      return res.status(400).json({
        status: "failed",
        message: "Only placed orders can be paid",
      });
    }

    if (order.paymentStatus !== "PENDING") {
      return res.status(400).json({
        status: "failed",
        message: "Order payment is not pending",
      });
    }

    // Convert INR into paise
    const amount = Math.round(Number(order.totalAmount) * 100);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid order amount",
      });
    }

    // Calculate platform commission
    const commissionPercent = Number(
      process.env.PLATFORM_COMMISSION_PERCENT || 0,
    );

    if (
      !Number.isFinite(commissionPercent) ||
      commissionPercent < 0 ||
      commissionPercent > 100
    ) {
      return res.status(500).json({
        status: "failed",
        message: "Invalid platform commission configuration",
      });
    }

    const platformCommission = Math.round((amount * commissionPercent) / 100);

    const vendorAmount = amount - platformCommission;

    // Check existing payment
    let payment = await PaymentModel.findOne({ orderId });

    if (payment?.status === "PAID") {
      return res.status(409).json({
        status: "failed",
        message: "Payment has already been completed",
      });
    }

    // Reuse an existing Razorpay order for retry safety
    if (payment?.status === "CREATED" && payment.razorpayOrderId) {
      return res.status(200).json({
        status: "success",
        message: "Payment order already exists",
        data: {
          paymentId: payment._id,
          razorpayOrderId: payment.razorpayOrderId,
          amount: payment.amount,
          currency: payment.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: orderId,
      notes: {
        orderId,
        customerId: req.user.userId,
        vendorId: order.vendorId,
      },
    });

    if (!payment) {
      payment = new PaymentModel({
        orderId,
        customerId: req.user.userId,
        vendorId: order.vendorId,
        amount,
        currency: "INR",
        platformCommission,
        vendorAmount,
      });
    }

    payment.amount = amount;
    payment.platformCommission = platformCommission;
    payment.vendorAmount = vendorAmount;
    payment.razorpayOrderId = razorpayOrder.id;
    payment.razorpayPaymentId = null;
    payment.razorpaySignature = null;
    payment.status = "CREATED";

    await payment.save();

    return res.status(201).json({
      status: "success",
      message: "Payment order created successfully",
      data: {
        paymentId: payment._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Unable to create payment order",
    });
  }
}

export async function createCheckoutPaymentController(req, res) {
  try {
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can initiate payments",
      });
    }

    const { checkoutId } = req.body;

    if (!checkoutId) {
      return res.status(400).json({
        status: "failed",
        message: "Checkout ID is required",
      });
    }

    // Fetch all vendor orders belonging to this checkout
    let orderResponse;

    try {
      orderResponse = await axios.get(
        `${process.env.ORDER_SERVICE_URL}/api/orders/internal/checkouts/${encodeURIComponent(checkoutId)}/orders`,
        {
          params: {
            customerId: req.user.userId,
          },
          headers: {
            "x-internal-service-key": process.env.PAYMENT_INTERNAL_SERVICE_KEY,
          },
        },
      );
    } catch (error) {
      console.error(
        "Checkout orders fetch error:",
        error.response?.data || error.message,
      );

      return res.status(error.response?.status || 503).json({
        status: "failed",
        message:
          error.response?.data?.message || "Unable to fetch checkout orders",
      });
    }

    const orders = orderResponse.data.data || [];

    if (!orders.length) {
      return res.status(404).json({
        status: "failed",
        message: "No vendor orders found",
      });
    }

    // Calculate combined amount and vendor-wise allocations
    const allocations = orders.map((order) => {
      const amount = Math.round(Number(order.totalAmount) * 100);

      if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error("Invalid vendor order amount");
      }

      return {
        orderId: String(order._id),
        vendorId: String(order.vendorId),
        amount,
        platformCommission: 0,
        vendorAmount: 0,
      };
    });

    const amount = allocations.reduce((sum, item) => sum + item.amount, 0);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid combined payment amount",
      });
    }

    // Validate platform commission
    const commissionPercent = Number(
      process.env.PLATFORM_COMMISSION_PERCENT || 0,
    );

    if (
      !Number.isFinite(commissionPercent) ||
      commissionPercent < 0 ||
      commissionPercent > 100
    ) {
      return res.status(500).json({
        status: "failed",
        message: "Invalid platform commission configuration",
      });
    }

    // Calculate commission on the combined payment
    const totalCommission = Math.round((amount * commissionPercent) / 100);

    // Allocate commission proportionally across vendors
    let allocatedCommission = 0;

    allocations.forEach((allocation, index) => {
      let vendorCommission;

      if (index === allocations.length - 1) {
        // Last vendor gets the rounding remainder
        vendorCommission = totalCommission - allocatedCommission;
      } else {
        vendorCommission = Math.floor(
          (totalCommission * allocation.amount) / amount,
        );
      }

      allocation.platformCommission = vendorCommission;

      allocation.vendorAmount = allocation.amount - vendorCommission;

      allocatedCommission += vendorCommission;
    });

    // Combined vendor earnings
    const totalVendorAmount = amount - totalCommission;

    // Check existing checkout payment
    let payment = await CheckoutPaymentModel.findOne({
      checkoutId,
      customerId: req.user.userId,
    });

    if (payment?.status === "PAID") {
      return res.status(409).json({
        status: "failed",
        message: "This checkout has already been paid",
      });
    }

    // Reuse existing Razorpay order for retries
    if (
      payment?.status === "CREATED" &&
      payment.razorpayOrderId &&
      payment.amount === amount
    ) {
      return res.status(200).json({
        status: "success",
        message: "Checkout payment already exists",
        data: {
          paymentId: payment._id,
          checkoutId: payment.checkoutId,
          razorpayOrderId: payment.razorpayOrderId,
          amount: payment.amount,
          currency: payment.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    // Create one Razorpay order for all vendors
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `checkout_${checkoutId.slice(-25)}`,
      notes: {
        checkoutId,
        customerId: req.user.userId,
        orderCount: String(orders.length),
      },
    });

    if (!payment) {
      payment = new CheckoutPaymentModel({
        checkoutId,
        customerId: req.user.userId,
      });
    }

    payment.orderIds = allocations.map((item) => item.orderId);

    payment.allocations = allocations;
    payment.amount = amount;
    payment.currency = "INR";
    payment.platformCommission = totalCommission;
    payment.vendorAmount = totalVendorAmount;
    payment.razorpayOrderId = razorpayOrder.id;
    payment.razorpayPaymentId = null;
    payment.razorpaySignature = null;
    payment.status = "CREATED";

    await payment.save();

    return res.status(201).json({
      status: "success",
      message: "Combined checkout payment created successfully",
      data: {
        paymentId: payment._id,
        checkoutId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderCount: orders.length,
      },
    });
  } catch (error) {
    console.error("Create checkout payment error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Unable to create combined payment",
    });
  }
}

export async function verifyPaymentController(req, res) {
  try {
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can verify payments",
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: "failed",
        message: "Payment verification details are required",
      });
    }

    // Find payment record
    const payment = await PaymentModel.findOne({
      razorpayOrderId: razorpay_order_id,
      customerId: req.user.userId,
    });

    if (!payment) {
      return res.status(404).json({
        status: "failed",
        message: "Payment record not found",
      });
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Verify signature safely
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid payment signature",
      });
    }

    // Fetch actual payment from Razorpay
    let razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    // Verify payment details
    if (
      razorpayPayment.order_id !== payment.razorpayOrderId ||
      razorpayPayment.amount !== payment.amount ||
      razorpayPayment.currency !== payment.currency
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Payment details mismatch",
      });
    }

    // Capture payment if authorized
    if (razorpayPayment.status === "authorized") {
      razorpayPayment = await razorpay.payments.capture(
        razorpay_payment_id,
        payment.amount,
        payment.currency,
      );
    }

    // Only captured payments can be marked PAID
    if (razorpayPayment.status !== "captured") {
      return res.status(400).json({
        status: "failed",
        message: "Payment has not been captured",
      });
    }

    // Prevent duplicate payment processing
    if (payment.status === "PAID") {
      if (payment.razorpayPaymentId !== razorpay_payment_id) {
        return res.status(409).json({
          status: "failed",
          message: "Payment already completed with another payment ID",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Payment already verified",
        data: payment,
      });
    }

    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "PAID";

    await payment.save();

    // Synchronize payment status with Order Service
    try {
      await syncOrderPaymentStatus(payment.orderId);
    } catch (error) {
      console.error("Order payment sync error:", error.message);

      return res.status(502).json({
        status: "failed",
        message:
          "Payment verified, but order status synchronization is pending. Retry verification.",
      });
    }

    try {
      await syncOrderPaymentStatus(payment.orderId);
    } catch (error) {
      return res.status(502).json({
        status: "failed",
        message: "Order payment synchronization is pending",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Payment verified successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Payment verification failed",
    });
  }
}

export async function syncOrderPaymentStatus(orderId) {
  return axios.patch(
    `${process.env.ORDER_SERVICE_URL}/api/orders/internal/${orderId}/payment-status`,
    {
      paymentStatus: "PAID",
    },
    {
      headers: {
        "x-internal-service-key": process.env.PAYMENT_INTERNAL_SERVICE_KEY,
      },
    },
  );
}

export async function razorpayWebhookController(req, res) {
  let webhookEvent;

  try {
    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];

    if (!Buffer.isBuffer(req.body) || !signature || !eventId) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid webhook request",
      });
    }

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(500).json({
        status: "failed",
        message: "Webhook secret is not configured",
      });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (
      !/^[a-f0-9]{64}$/i.test(signature) ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid webhook signature",
      });
    }

    // Parse verified payload
    const payload = JSON.parse(req.body.toString("utf8"));

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    if (!["payment.captured", "payment.failed"].includes(event)) {
      return res.status(200).json({
        status: "success",
        message: "Webhook event ignored",
      });
    }

    if (!paymentEntity?.order_id || !paymentEntity?.id) {
      return res.status(400).json({
        status: "failed",
        message: "Payment details missing",
      });
    }

    // Find combined checkout payment first
    let payment = await CheckoutPaymentModel.findOne({
      razorpayOrderId: paymentEntity.order_id,
    });

    let isCheckoutPayment = Boolean(payment);

    // If not found, check normal single payment
    if (!payment) {
      payment = await PaymentModel.findOne({
        razorpayOrderId: paymentEntity.order_id,
      });
    }

    if (!payment) {
      return res.status(404).json({
        status: "failed",
        message: "Payment record not found",
      });
    }

    // Verify amount and currency
    if (
      paymentEntity.amount !== payment.amount ||
      paymentEntity.currency !== payment.currency
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Payment details mismatch",
      });
    }

    // Check duplicate event
    webhookEvent = await WebhookEventModel.findOne({ eventId });

    if (webhookEvent?.status === "PROCESSED") {
      return res.status(200).json({
        status: "success",
        message: "Duplicate webhook already processed",
      });
    }

    // Store new event
    if (!webhookEvent) {
      try {
        webhookEvent = await WebhookEventModel.create({
          eventId,
          eventType: event,
          razorpayPaymentId: paymentEntity.id,
          razorpayOrderId: paymentEntity.order_id,
          status: "RECEIVED",
        });
      } catch (error) {
        if (error.code === 11000) {
          webhookEvent = await WebhookEventModel.findOne({ eventId });
        } else {
          throw error;
        }
      }
    }

    if (webhookEvent?.status === "PROCESSED") {
      return res.status(200).json({
        status: "success",
        message: "Duplicate webhook already processed",
      });
    }

    // Captured payment
    if (event === "payment.captured") {
      if (payment.status !== "PAID") {
        payment.status = "PAID";
        payment.razorpayPaymentId = paymentEntity.id;

        await payment.save();
      }

      // Synchronize payment status with all vendor orders
      if (isCheckoutPayment) {
        const orderIds = [...new Set((payment.orderIds || []).filter(Boolean))];

        if (orderIds.length === 0) {
          throw new Error("Combined payment does not contain valid order IDs");
        }

        const syncResults = await Promise.allSettled(
          orderIds.map((orderId) => syncOrderPaymentStatus(orderId)),
        );

        const failedSyncs = syncResults.filter(
          (result) => result.status === "rejected",
        );

        if (failedSyncs.length > 0) {
          throw new Error(
            `Failed to synchronize ${failedSyncs.length} vendor orders`,
          );
        }
      } else {
        if (!payment.orderId) {
          throw new Error("Single payment order ID is missing");
        }

        await syncOrderPaymentStatus(payment.orderId);
      }
    }

    // Failed payment
    if (event === "payment.failed" && payment.status !== "PAID") {
      payment.status = "FAILED";
      payment.razorpayPaymentId = paymentEntity.id;

      await payment.save();
    }

    webhookEvent.status = "PROCESSED";
    webhookEvent.errorMessage = null;

    await webhookEvent.save();

    return res.status(200).json({
      status: "success",
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Razorpay webhook error:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    if (webhookEvent) {
      webhookEvent.status = "FAILED";
      webhookEvent.errorMessage = error.message;

      await webhookEvent.save().catch((saveError) => {
        console.error("Webhook event save error:", saveError.message);
      });
    }

    return res.status(500).json({
      status: "failed",
      message: "Webhook processing failed",
    });
  }
}

export async function getMyPaymentsController(req, res) {
  try {
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can view payment history",
      });
    }

    const [payments, checkoutPayments] = await Promise.all([
      PaymentModel.find({
        customerId: req.user.userId,
      }),
      CheckoutPaymentModel.find({
        customerId: req.user.userId,
      }),
    ]);

    const combinedPayments = [
      ...payments.map((payment) => ({
        ...payment.toObject(),
        paymentType: "SINGLE",
      })),
      ...checkoutPayments.map(formatCheckoutPayment),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      status: "success",
      results: combinedPayments.length,
      data: combinedPayments,
    });
  } catch (error) {
    console.error("Get my payments error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Unable to fetch payment history",
    });
  }
}

export async function getAllPaymentsAdminController(req, res) {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        status: "failed",
        message: "Only admins can view all payments",
      });
    }

    const [payments, checkoutPayments] = await Promise.all([
      PaymentModel.find(),
      CheckoutPaymentModel.find(),
    ]);

    const allPayments = [
      ...payments.map((payment) => ({
        ...payment.toObject(),
        paymentType: "SINGLE",
      })),
      ...checkoutPayments.map(formatCheckoutPayment),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Only successful payments
    const paidPayments = allPayments.filter(
      (payment) => payment.status === "PAID",
    );

    // Total sales in paise
    const totalSales = paidPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    // Platform revenue in paise
    const totalRevenue = paidPayments.reduce(
      (sum, payment) => sum + Number(payment.platformCommission || 0),
      0,
    );

    // Vendor earnings in paise
    const totalVendorEarnings = paidPayments.reduce(
      (sum, payment) => sum + Number(payment.vendorAmount || 0),
      0,
    );

    return res.status(200).json({
      status: "success",
      results: allPayments.length,
      totalSales,
      totalRevenue,
      totalVendorEarnings,
      currency: "INR",
      data: allPayments,
    });
  } catch (error) {
    console.error("Get all payments error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Unable to fetch payments",
    });
  }
}

export async function verifyCheckoutPaymentController(req, res) {
  try {
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can verify payments",
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: "failed",
        message: "Payment verification details are required",
      });
    }

    const payment = await CheckoutPaymentModel.findOne({
      razorpayOrderId: razorpay_order_id,
      customerId: req.user.userId,
    });

    if (!payment) {
      return res.status(404).json({
        status: "failed",
        message: "Checkout payment not found",
      });
    }

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid payment signature",
      });
    }

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid payment signature",
      });
    }

    // Verify actual Razorpay payment
    let razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      razorpayPayment.order_id !== payment.razorpayOrderId ||
      razorpayPayment.amount !== payment.amount ||
      razorpayPayment.currency !== payment.currency
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Payment details mismatch",
      });
    }

    // Capture authorized payment
    if (razorpayPayment.status === "authorized") {
      razorpayPayment = await razorpay.payments.capture(
        razorpay_payment_id,
        payment.amount,
        payment.currency,
      );
    }

    if (razorpayPayment.status !== "captured") {
      return res.status(400).json({
        status: "failed",
        message: "Payment has not been captured",
      });
    }

    // Prevent duplicate payment processing
    if (payment.status === "PAID") {
      if (payment.razorpayPaymentId !== razorpay_payment_id) {
        return res.status(409).json({
          status: "failed",
          message: "Checkout already paid with another payment ID",
        });
      }
    } else {
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      payment.status = "PAID";

      await payment.save();
    }

    // Synchronize every vendor order
    const syncResults = await Promise.allSettled(
      payment.orderIds.map((orderId) => syncOrderPaymentStatus(orderId)),
    );

    const failedSyncs = syncResults.filter(
      (result) => result.status === "rejected",
    );

    if (failedSyncs.length > 0) {
      console.error(
        "Some vendor orders could not be synchronized:",
        failedSyncs,
      );

      return res.status(502).json({
        status: "failed",
        message:
          "Payment verified, but some vendor orders are awaiting synchronization. Retry verification.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Combined payment verified successfully",
      results: payment.orderIds.length,
      data: payment,
    });
  } catch (error) {
    console.error("Combined payment verification error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Combined payment verification failed",
    });
  }
}
