import mongoose from "mongoose";

const couponRedemptionSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },

    customerId: {
      type: String,
      required: true,
      index: true,
    },

    checkoutId: {
      type: String,
      required: true,
    },

    orderIds: {
      type: [String],
      default: [],
    },

    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["RESERVED", "REDEEMED", "RELEASED"],
      default: "RESERVED",
    },

    redeemedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

couponRedemptionSchema.index(
  { couponId: 1, checkoutId: 1 },
  { unique: true }
);

couponRedemptionSchema.index({
  couponId: 1,
  customerId: 1,
  status: 1,
});

const CouponRedemptionModel = mongoose.model(
  "CouponRedemption",
  couponRedemptionSchema
);

export default CouponRedemptionModel;