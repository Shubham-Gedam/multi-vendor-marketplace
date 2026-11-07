import express from "express";

import * as cartController from "../controllers/cart.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", cartController.addToCartController);
router.get("/", cartController.getCartController);
router.patch("/:productId", cartController.updateCartQuantityController);
router.delete("/:productId", cartController.removeFromCartController);
router.delete("/", cartController.clearCartController);

export default router;