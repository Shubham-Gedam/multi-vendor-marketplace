import axios from "axios";
import OrderModel from "../models/Order.model.js";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import CouponModel from "../models/Coupon.model.js";
import CouponRedemptionModel from "../models/CouponRedemption.model.js";

export async function createOrderController(req, res) {
  let reservedCouponId = null;
  let redemptionId = null;
  let checkoutId = null;

  try {
    const { shippingAddress, couponCode } = req.body;

    // Validate shipping address
    const requiredFields = [
      "fullName",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
    ];

    if (
      !shippingAddress ||
      requiredFields.some(
        (field) =>
          !shippingAddress[field] || !String(shippingAddress[field]).trim(),
      )
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Complete shipping address is required",
      });
    }

    const normalizedCode =
      typeof couponCode === "string" ? couponCode.trim().toUpperCase() : "";

    if (couponCode && !normalizedCode) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid coupon code",
      });
    }

    // Fetch customer cart
    let cartResponse;

    try {
      cartResponse = await axios.get(
        `${process.env.CART_SERVICE_URL}/api/cart`,
        {
          headers: {
            Cookie: req.headers.cookie || "",
          },
        },
      );
    } catch (error) {
      console.error("Cart Service error:", error.message);

      return res.status(503).json({
        status: "failed",
        message: "Cart Service is unavailable",
      });
    }

    const cartItems = cartResponse.data.data;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "Your cart is empty",
      });
    }
    // Generate one checkout ID for all vendor orders
    checkoutId = randomUUID();

    // Verify products and group them by vendor
    const vendorOrders = new Map();
    let grandSubtotalPaise = 0;

    for (const item of cartItems) {
      const quantity = Number(item.quantity);

      if (!item.productId || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          status: "failed",
          message: "Invalid cart item",
        });
      }

      let productResponse;

      try {
        productResponse = await axios.get(
          `${process.env.PRODUCT_SERVICE_URL}/api/products/${item.productId}`,
        );
      } catch (error) {
        if (error.response?.status === 404) {
          return res.status(400).json({
            status: "failed",
            message: `Product ${item.productId} is unavailable`,
          });
        }

        return res.status(503).json({
          status: "failed",
          message: "Product Service is unavailable",
        });
      }

      const product = productResponse.data.data;

      if (!product || product.status !== "ACTIVE") {
        return res.status(400).json({
          status: "failed",
          message: "Product is not available",
        });
      }

      if (quantity > Number(product.stock)) {
        return res.status(400).json({
          status: "failed",
          message: `Insufficient stock for ${product.name}. Available stock: ${product.stock}`,
        });
      }

      const vendorId = product.vendorId;

      if (!vendorId) {
        return res.status(400).json({
          status: "failed",
          message: "Product vendor information is missing",
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          status: "failed",
          message: "Invalid product price",
        });
      }

      // Work in paise to avoid floating-point rounding issues
      const pricePaise = Math.round(price * 100);
      const itemSubtotalPaise = pricePaise * quantity;

      if (!vendorOrders.has(vendorId)) {
        vendorOrders.set(vendorId, {
          customerId: req.user.userId,
          vendorId,
          items: [],
          shippingAddress,
          subtotalPaise: 0,
          orderStatus: "PLACED",
          paymentStatus: "PENDING",
        });
      }

      const vendorOrder = vendorOrders.get(vendorId);

      vendorOrder.items.push({
        productId: product._id,
        productName: product.name,
        price: pricePaise / 100,
        quantity,
        subtotal: itemSubtotalPaise / 100,
      });

      vendorOrder.subtotalPaise += itemSubtotalPaise;
      grandSubtotalPaise += itemSubtotalPaise;
    }

    // Coupon validation and discount calculation
    let coupon = null;
    let discountPaise = 0;

    if (normalizedCode) {
      coupon = await CouponModel.findOne({
        code: normalizedCode,
      });

      if (!coupon) {
        return res.status(404).json({
          status: "failed",
          message: "Invalid coupon code",
        });
      }

      const now = new Date();

      if (
        !coupon.isActive ||
        coupon.startsAt > now ||
        coupon.expiresAt <= now
      ) {
        return res.status(400).json({
          status: "failed",
          message: "Coupon is inactive or expired",
        });
      }

      // Check global usage limit
      if (
        coupon.usageLimit !== null &&
        coupon.usedCount + coupon.reservedCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          status: "failed",
          message: "Coupon usage limit has been reached",
        });
      }

      // Check customer usage limit
      const customerUsage = await CouponRedemptionModel.countDocuments({
        couponId: coupon._id,
        customerId: req.user.userId,
        status: { $in: ["RESERVED", "REDEEMED"] },
      });

      if (customerUsage >= coupon.perCustomerLimit) {
        return res.status(400).json({
          status: "failed",
          message: "You have reached your coupon usage limit",
        });
      }

      const subtotalRupees = grandSubtotalPaise / 100;

      if (subtotalRupees < coupon.minOrderAmount) {
        return res.status(400).json({
          status: "failed",
          message: `Minimum order amount is ₹${coupon.minOrderAmount}`,
        });
      }

      if (coupon.discountType === "PERCENTAGE") {
        discountPaise = Math.round(
          (grandSubtotalPaise * coupon.discountValue) / 100,
        );

        if (coupon.maxDiscountAmount !== null) {
          discountPaise = Math.min(
            discountPaise,
            Math.round(coupon.maxDiscountAmount * 100),
          );
        }
      } else {
        discountPaise = Math.round(coupon.discountValue * 100);
      }

      discountPaise = Math.min(discountPaise, grandSubtotalPaise);

      if (discountPaise <= 0 || discountPaise >= grandSubtotalPaise) {
        return res.status(400).json({
          status: "failed",
          message: "Coupon must leave a positive payable amount",
        });
      }

      // Reserve the coupon atomically
      const reservationFilter = {
        _id: coupon._id,
        isActive: true,
        startsAt: { $lte: now },
        expiresAt: { $gt: now },
      };

      if (coupon.usageLimit !== null) {
        reservationFilter.$expr = {
          $lt: [
            {
              $add: ["$usedCount", "$reservedCount"],
            },
            "$usageLimit",
          ],
        };
      }

      const reservedCoupon = await CouponModel.findOneAndUpdate(
        reservationFilter,
        {
          $inc: { reservedCount: 1 },
        },
        {
          new: true,
        },
      );

      if (!reservedCoupon) {
        return res.status(409).json({
          status: "failed",
          message: "Coupon is no longer available. Please try again.",
        });
      }

      reservedCouponId = coupon._id;

      // Create one redemption for the entire multi-vendor checkout
      const redemption = await CouponRedemptionModel.create({
        couponId: coupon._id,
        customerId: req.user.userId,
        checkoutId,
        discountAmount: discountPaise / 100,
        status: "RESERVED",
      });

      redemptionId = redemption._id;
    }

    // Allocate discount proportionally across vendor orders
    const vendorOrderEntries = Array.from(vendorOrders.entries());
    let allocatedDiscountPaise = 0;

    const orderDocuments = vendorOrderEntries.map(
      ([vendorId, vendorOrder], index) => {
        let vendorDiscountPaise = 0;

        if (coupon) {
          if (index === vendorOrderEntries.length - 1) {
            // Last vendor receives the rounding remainder
            vendorDiscountPaise = discountPaise - allocatedDiscountPaise;
          } else {
            vendorDiscountPaise = Math.floor(
              (discountPaise * vendorOrder.subtotalPaise) / grandSubtotalPaise,
            );
          }
        }

        allocatedDiscountPaise += vendorDiscountPaise;

        return {
          customerId: req.user.userId,
          vendorId,
          items: vendorOrder.items,
          shippingAddress: vendorOrder.shippingAddress,

          subtotalAmount: vendorOrder.subtotalPaise / 100,

          discountAmount: vendorDiscountPaise / 100,

          couponId: coupon ? coupon._id : null,
          couponCode: coupon ? coupon.code : null,
          checkoutId,

          // Razorpay will use this discounted amount
          totalAmount: (vendorOrder.subtotalPaise - vendorDiscountPaise) / 100,

          orderStatus: "PLACED",
          paymentStatus: "PENDING",
        };
      },
    );

    // Create separate orders for each vendor
    const orders = await OrderModel.insertMany(orderDocuments);

    // Link all vendor orders to the single coupon redemption
    if (coupon) {
      await CouponRedemptionModel.findByIdAndUpdate(redemptionId, {
        $set: {
          orderIds: orders.map((order) => String(order._id)),
        },
      });
    }

    // Clear customer cart after order creation
    let cartCleared = false;

    try {
      await axios.delete(`${process.env.CART_SERVICE_URL}/api/cart`, {
        headers: {
          Cookie: req.headers.cookie || "",
        },
      });

      cartCleared = true;
    } catch (error) {
      console.error("Cart clearing error:", error.message);
    }

    return res.status(201).json({
      status: "success",
      message: "Order placed successfully",
      checkoutId,
      cartCleared,
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Create order error:", error);

    // Roll back this checkout's orders and coupon reservation
    if (checkoutId) {
      try {
        await OrderModel.deleteMany({ checkoutId });
      } catch (cleanupError) {
        console.error("Order cleanup error:", cleanupError.message);
      }
    }

    if (redemptionId) {
      try {
        await CouponRedemptionModel.deleteOne({
          _id: redemptionId,
          status: "RESERVED",
        });
      } catch (cleanupError) {
        console.error("Redemption cleanup error:", cleanupError.message);
      }
    }

    if (reservedCouponId) {
      try {
        await CouponModel.updateOne(
          {
            _id: reservedCouponId,
            reservedCount: { $gt: 0 },
          },
          {
            $inc: { reservedCount: -1 },
          },
        );
      } catch (cleanupError) {
        console.error(
          "Coupon reservation cleanup error:",
          cleanupError.message,
        );
      }
    }

    return res.status(500).json({
      status: "failed",
      message: "Unable to create order",
    });
  }
}

export async function getMyOrdersController(req, res) {
  try {
    const orders = await OrderModel.find({
      customerId: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function getOrderByIdController(req, res) {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid order ID",
      });
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      customerId: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        status: "failed",
        message: "Order not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (error) {
    console.error("Get order details error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function cancelOrderController(req, res) {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid order ID",
      });
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      customerId: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        status: "failed",
        message: "Order not found",
      });
    }

    if (order.orderStatus !== "PLACED") {
      return res.status(400).json({
        status: "failed",
        message: "Only placed orders can be cancelled",
      });
    }

    if (order.paymentStatus !== "PENDING") {
      return res.status(400).json({
        status: "failed",
        message: "Order cannot be cancelled after payment",
      });
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    // Release coupon only when every order in this checkout
    // has been cancelled without any successful payment.
    if (order.couponId && order.checkoutId) {
      const checkoutOrders = await OrderModel.find({
        checkoutId: order.checkoutId,
      }).select("orderStatus paymentStatus");

      const allOrdersCancelled = checkoutOrders.every(
        (item) =>
          item.orderStatus === "CANCELLED" && item.paymentStatus !== "PAID",
      );

      if (allOrdersCancelled) {
        const redemption = await CouponRedemptionModel.findOneAndUpdate(
          {
            couponId: order.couponId,
            checkoutId: order.checkoutId,
            status: "RESERVED",
          },
          {
            $set: {
              status: "RELEASED",
            },
          },
          {
            new: true,
          },
        );

        if (redemption) {
          const couponUpdate = await CouponModel.updateOne(
            {
              _id: redemption.couponId,
              reservedCount: { $gt: 0 },
            },
            {
              $inc: {
                reservedCount: -1,
              },
            },
          );

          if (couponUpdate.modifiedCount !== 1) {
            throw new Error("Unable to release coupon reservation");
          }
        }
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel order error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function getVendorOrdersController(req, res) {
  try {
    const orders = await OrderModel.find({
      vendorId: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get vendor orders error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function updateOrderStatusController(req, res) {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid order ID",
      });
    }

    const allowedTransitions = {
      PLACED: ["PACKED"],
      PACKED: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
    };

    const order = await OrderModel.findOne({
      _id: orderId,
      vendorId: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        status: "failed",
        message: "Order not found",
      });
    }

    if (!allowedTransitions[order.orderStatus]?.includes(orderStatus)) {
      return res.status(400).json({
        status: "failed",
        message: `Cannot change order status from ${order.orderStatus} to ${orderStatus}`,
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function getAllOrdersAdminController(req, res) {
  try {
    const orders = await OrderModel.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function updateOrderPaymentStatusInternalController(req, res) {
  try {
    const serviceKey = req.headers["x-internal-service-key"];

    if (
      !process.env.PAYMENT_INTERNAL_SERVICE_KEY ||
      serviceKey !== process.env.PAYMENT_INTERNAL_SERVICE_KEY
    ) {
      return res.status(403).json({
        status: "failed",
        message: "Internal service access denied",
      });
    }

    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid order ID",
      });
    }

    if (paymentStatus !== "PAID") {
      return res.status(400).json({
        status: "failed",
        message: "Invalid payment status",
      });
    }

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        status: "failed",
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "PAID") {
      if (order.orderStatus !== "PLACED" || order.paymentStatus !== "PENDING") {
        return res.status(409).json({
          status: "failed",
          message: "Order is not eligible for payment update",
        });
      }

      order.paymentStatus = "PAID";
      await order.save();
    }

    // Redeem coupon only once for the entire checkout
    if (order.couponId && order.checkoutId) {
      const redemption = await CouponRedemptionModel.findOneAndUpdate(
        {
          couponId: order.couponId,
          checkoutId: order.checkoutId,
          status: "RESERVED",
        },
        {
          $set: {
            status: "REDEEMED",
            redeemedAt: new Date(),
          },
        },
        {
          new: true,
        },
      );

      if (redemption) {
        const couponUpdate = await CouponModel.updateOne(
          {
            _id: redemption.couponId,
            reservedCount: { $gt: 0 },
          },
          {
            $inc: {
              reservedCount: -1,
              usedCount: 1,
            },
          },
        );

        if (couponUpdate.modifiedCount !== 1) {
          // Restore reservation so a retry can process it
          await CouponRedemptionModel.updateOne(
            {
              _id: redemption._id,
              status: "REDEEMED",
            },
            {
              $set: {
                status: "RESERVED",
                redeemedAt: null,
              },
            },
          );

          throw new Error("Unable to update coupon usage counters");
        }
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Order payment status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Internal payment status update error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function getCheckoutOrdersInternalController(req, res) {
  try {
    const serviceKey = req.headers["x-internal-service-key"];

    if (
      !process.env.PAYMENT_INTERNAL_SERVICE_KEY ||
      serviceKey !== process.env.PAYMENT_INTERNAL_SERVICE_KEY
    ) {
      return res.status(403).json({
        status: "failed",
        message: "Internal service access denied",
      });
    }

    const { checkoutId } = req.params;
    const { customerId } = req.query;

    if (!checkoutId || !customerId) {
      return res.status(400).json({
        status: "failed",
        message: "Checkout ID and customer ID are required",
      });
    }

    const orders = await OrderModel.find({
      checkoutId,
    }).sort({ createdAt: 1 });

    if (orders.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Checkout orders not found",
      });
    }

    // Verify ownership of every vendor order
    const isOwner = orders.every(
      (order) => String(order.customerId) === String(customerId)
    );

    if (!isOwner) {
      return res.status(403).json({
        status: "failed",
        message: "Checkout does not belong to this customer",
      });
    }

    // All orders must be eligible for payment
    const allPending = orders.every(
      (order) =>
        order.orderStatus === "PLACED" &&
        order.paymentStatus === "PENDING"
    );

    if (!allPending) {
      return res.status(409).json({
        status: "failed",
        message: "One or more orders are not eligible for payment",
      });
    }

    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    return res.status(200).json({
      status: "success",
      results: orders.length,
      totalAmount,
      data: orders,
    });
  } catch (error) {
    console.error("Get checkout orders error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Unable to fetch checkout orders",
    });
  }
}