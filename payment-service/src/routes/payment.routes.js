import express from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, paymentController.createPaymentOrderController);

router.post("/create-checkout-payment", authMiddleware, paymentController.createCheckoutPaymentController);

router.post("/verify", authMiddleware, paymentController.verifyPaymentController);

router.post("/verify-checkout", authMiddleware, paymentController.verifyCheckoutPaymentController);

router.get("/my-payments", authMiddleware, paymentController.getMyPaymentsController);

router.get("/admin/all", authMiddleware, paymentController.getAllPaymentsAdminController);

export default router;
