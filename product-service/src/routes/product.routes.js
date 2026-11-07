import express from "express";

import * as productController from "../controllers/product.controller.js";
import * as reviewController from "../controllers/review.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { approvedVendorMiddleware } from "../middleware/approvedVendor.middleware.js";
import { uploadImages } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public: Get all reviews of a product
router.get("/:productId/reviews",reviewController.getProductReviewsController);

// Customer only: Create product review
router.post("/:productId/reviews",authMiddleware,reviewController.createReviewController);

// Customer only: Update own review
router.patch("/reviews/:reviewId",authMiddleware,reviewController.updateReviewController);

// Customer only: Delete own review
router.delete("/reviews/:reviewId",authMiddleware,reviewController.deleteReviewController);

// Customer: Get own review for a product
router.get("/reviews/my/:productId",authMiddleware,reviewController.getMyReviewController);

// Customer: Get own review for a product
router.get("/reviews/my/:productId",authMiddleware,reviewController.getMyReviewController
);

// Public: Get all active products
router.get("/", productController.getProductsController);

// Public: Get single active product
router.get("/:productId", productController.getProductByIdController);

// Approved vendors only: Create product
router.post("/",authMiddleware,approvedVendorMiddleware,uploadImages.array("images", 5),productController.createProductController);

// Approved vendors only: Update own product
router.patch("/:productId",authMiddleware,approvedVendorMiddleware,uploadImages.array("images", 5),productController.updateProductController);

// Approved vendors only: Delete own product
router.delete("/:productId",authMiddleware,approvedVendorMiddleware,productController.deleteProductController);

export default router;