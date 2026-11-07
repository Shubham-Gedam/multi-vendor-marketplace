import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },

    eventType: {
      type: String,
      required: true,
    },

    razorpayPaymentId: {
      type: String,
    },

    razorpayOrderId: {
      type: String,
    },

    status: {
      type: String,
      enum: ["RECEIVED", "PROCESSED", "FAILED"],
      default: "RECEIVED",
    },

    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const WebhookEventModel = mongoose.model(
  "WebhookEvent",
  webhookEventSchema
);

export default WebhookEventModel;