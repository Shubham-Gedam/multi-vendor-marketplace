import express from "express";
import cookieParser from "cookie-parser";

import paymentRoutes from "./routes/payment.routes.js";
import { razorpayWebhookController } from "./controllers/payment.controller.js";

const app = express();

app.use(cookieParser());

// Razorpay webhook: raw body must be available for signature verification
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhookController
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Payment Service is running",
  });
});

app.use("/api/payments", paymentRoutes);

export default app;