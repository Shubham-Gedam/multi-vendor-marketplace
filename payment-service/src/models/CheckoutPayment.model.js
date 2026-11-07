import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
    },
    vendorId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    platformCommission: {
      type: Number,
      default: 0,
    },
    vendorAmount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const checkoutPaymentSchema = new mongoose.Schema(
  {
    checkoutId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderIds: {
      type: [String],
      required: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    allocations: {
      type: [allocationSchema],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
    },
    platformCommission: {
      type: Number,
      default: 0,
    },
    vendorAmount: {
      type: Number,
      default: 0,
    },
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED"],
      default: "CREATED",
    },
  },
  {
    timestamps: true,
  }
);

const CheckoutPaymentModel =
  mongoose.models.CheckoutPayment ||
  mongoose.model("CheckoutPayment", checkoutPaymentSchema);

export default CheckoutPaymentModel;