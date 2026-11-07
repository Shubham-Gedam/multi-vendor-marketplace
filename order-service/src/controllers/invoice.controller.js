import PDFDocument from "pdfkit";
import mongoose from "mongoose";
import OrderModel from "../models/Order.model.js";

export async function downloadInvoiceController(req, res) {
  try {
    const { orderId } = req.params;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid order ID",
      });
    }

    // Customer can only access their own order
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

    // Invoice available only for successful payments
    if (order.paymentStatus !== "PAID") {
      return res.status(400).json({
        status: "failed",
        message: "Invoice is available only for paid orders",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    const invoiceNumber =
      `INV-${order._id.toString().slice(-8).toUpperCase()}`;

    const formatPrice = (amount) =>
      `INR ${Number(amount || 0).toFixed(2)}`;

    const subtotal =
      order.subtotalAmount > 0
        ? order.subtotalAmount
        : order.items.reduce(
            (total, item) =>
              total + Number(item.subtotal || 0),
            0
          );

    const discount = Number(order.discountAmount || 0);
    const total = Number(order.totalAmount || 0);

    // PDF response headers
    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoiceNumber}.pdf"`
    );

    doc.pipe(res);

    // HEADER
    doc.rect(0, 0, 595.28, 115).fill("#0f172a");

    doc
      .fillColor("#ffffff")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("MARKETLY", 50, 35);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#cbd5e1")
      .text("MULTI-VENDOR MARKETPLACE", 52, 67);

    doc
      .fontSize(25)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("INVOICE", 390, 43, {
        width: 155,
        align: "right",
      });

    // INVOICE INFORMATION
    doc.fillColor("#0f172a");

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("INVOICE DETAILS", 50, 140);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text(`Invoice Number: ${invoiceNumber}`, 50, 162)
      .text(
        `Invoice Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
        50,
        178
      )
      .text(`Order ID: ${order._id}`, 50, 194);

    doc
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("PAYMENT INFORMATION", 330, 140);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text("Payment Status: PAID", 330, 162)
      .text("Payment Gateway: Razorpay", 330, 178)
      .text(
        `Order Status: ${order.orderStatus}`,
        330,
        194
      );

    // CUSTOMER AND SELLER INFORMATION
    doc
      .moveTo(50, 225)
      .lineTo(545, 225)
      .strokeColor("#e2e8f0")
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#0f172a")
      .text("BILL TO", 50, 245);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text(order.shippingAddress.fullName, 50, 265)
      .text(order.shippingAddress.phone, 50, 281)
      .text(order.shippingAddress.address, 50, 297, {
        width: 220,
      })
      .text(
        `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
        50,
        doc.y + 4
      )
      .text(
        `PIN Code: ${order.shippingAddress.pincode}`,
        50,
        doc.y + 4
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#0f172a")
      .text("SELLER INFORMATION", 330, 245);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text(`Vendor ID: ${order.vendorId}`, 330, 265, {
        width: 210,
      })
      .text("Marketplace: Marketly", 330, 283);

    // PRODUCT TABLE
    const tableTop = Math.max(doc.y + 35, 365);

    doc
      .rect(50, tableTop, 495, 30)
      .fill("#eff6ff");

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#1e40af")
      .text("PRODUCT", 60, tableTop + 10)
      .text("PRICE", 285, tableTop + 10)
      .text("QTY", 375, tableTop + 10)
      .text("SUBTOTAL", 430, tableTop + 10);

    let rowY = tableTop + 40;

    order.items.forEach((item) => {
      if (rowY > 700) {
        doc.addPage();
        rowY = 60;
      }

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#334155")
        .text(item.productName, 60, rowY, {
          width: 210,
        })
        .text(formatPrice(item.price), 285, rowY, {
          width: 80,
        })
        .text(String(item.quantity), 375, rowY, {
          width: 40,
        })
        .text(formatPrice(item.subtotal), 430, rowY, {
          width: 110,
        });

      rowY += 35;

      doc
        .moveTo(50, rowY - 12)
        .lineTo(545, rowY - 12)
        .strokeColor("#e2e8f0")
        .stroke();
    });

    // ORDER TOTALS
    rowY += 15;

    if (rowY > 690) {
      doc.addPage();
      rowY = 60;
    }

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text("Subtotal", 345, rowY)
      .text(formatPrice(subtotal), 430, rowY, {
        width: 110,
        align: "right",
      });

    rowY += 23;

    if (order.couponCode || discount > 0) {
      doc
        .font("Helvetica-Bold")
        .fillColor("#15803d")
        .text(
          `Coupon Discount${order.couponCode ? ` (${order.couponCode})` : ""}`,
          300,
          rowY
        )
        .text(`-${formatPrice(discount)}`, 430, rowY, {
          width: 110,
          align: "right",
        });

      rowY += 25;
    }

    doc
      .moveTo(300, rowY)
      .lineTo(545, rowY)
      .strokeColor("#cbd5e1")
      .stroke();

    rowY += 15;

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#0f172a")
      .text("TOTAL PAID", 300, rowY)
      .fillColor("#15803d")
      .text(formatPrice(total), 430, rowY, {
        width: 110,
        align: "right",
      });

    // FOOTER
    const footerY = Math.max(rowY + 55, 760);

    doc
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .strokeColor("#e2e8f0")
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#64748b")
      .text(
        "Thank you for shopping with Marketly!",
        50,
        footerY + 15,
        {
          width: 495,
          align: "center",
        }
      );

    doc
      .fontSize(8)
      .text(
        "This is a computer-generated invoice.",
        50,
        footerY + 30,
        {
          width: 495,
          align: "center",
        }
      );

    doc.end();
  } catch (error) {
    console.error("Invoice generation error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        status: "failed",
        message: "Unable to generate invoice",
      });
    }

    res.destroy(error);
  }
}