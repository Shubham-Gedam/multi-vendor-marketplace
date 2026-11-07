import express from "express";

import * as orderController from "../controllers/order.controller.js";
import * as couponController from "../controllers/coupon.controller.js";

import {downloadInvoiceController} from "../controllers/invoice.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

// CUSTOMER: Create order
router.post("/",authMiddleware,roleMiddleware("CUSTOMER"),orderController.createOrderController);

// CUSTOMER: My orders
router.get("/my-orders",authMiddleware,roleMiddleware("CUSTOMER"),orderController.getMyOrdersController);

// CUSTOMER: Validate coupon
router.post("/coupons/validate",authMiddleware,roleMiddleware("CUSTOMER"),couponController.validateCouponController);

// CUSTOMER: Cancel order
router.patch("/:orderId/cancel",authMiddleware,roleMiddleware("CUSTOMER"),orderController.cancelOrderController);

// CUSTOMER:order invoice
router.get("/:orderId/invoice",authMiddleware,roleMiddleware("CUSTOMER"),downloadInvoiceController);

// VENDOR: My orders
router.get("/vendor/my-orders",authMiddleware,roleMiddleware("VENDOR"),orderController.getVendorOrdersController);

// VENDOR: Update order status
router.patch("/:orderId/status",authMiddleware,roleMiddleware("VENDOR"),orderController.updateOrderStatusController);

// ADMIN: Create coupon
router.post("/admin/coupons",authMiddleware,roleMiddleware("ADMIN"),couponController.createCouponController);

// ADMIN: Get all coupons
router.get("/admin/coupons",authMiddleware,roleMiddleware("ADMIN"),couponController.getAllCouponsController);

// ADMIN: Update coupon
router.patch("/admin/coupons/:couponId",authMiddleware,roleMiddleware("ADMIN"),couponController.updateCouponController);

// ADMIN: Get all orders
router.get("/admin/all",authMiddleware,roleMiddleware("ADMIN"),orderController.getAllOrdersAdminController);

// INTERNAL: Update order payment status
router.patch("/internal/:orderId/payment-status",orderController.updateOrderPaymentStatusInternalController);

// INTERNAL: Get all vendor orders for one checkout
router.get("/internal/checkouts/:checkoutId/orders",orderController.getCheckoutOrdersInternalController);

// CUSTOMER: Get order by ID
router.get("/:orderId",authMiddleware,roleMiddleware("CUSTOMER"),orderController.getOrderByIdController);

export default router;