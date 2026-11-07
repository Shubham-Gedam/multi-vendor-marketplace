import express from "express";
import * as venderController from "../controllers/vendor.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Submit vendor application
router.post("/apply", authMiddleware, (req, res, next) => {
  if (req.user.role !== "CUSTOMER") {
    return res.status(403).json({
      status: "failed",
      message: "Only customers can apply to become vendors",
    });
  }

  next();
}, venderController.applyVendorController);

// Get my vendor application status
router.get("/my-application", authMiddleware, venderController.getMyVendorApplicationController);

router.patch("/:vendorId/status",authMiddleware,allowRoles("ADMIN"),venderController.updateVendorStatusController);

// Admin: Get all vendor applications
router.get("/admin/all",authMiddleware,allowRoles("ADMIN"),venderController.getAllVendorApplicationsController);

export default router;