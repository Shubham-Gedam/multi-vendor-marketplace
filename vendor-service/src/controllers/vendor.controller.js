
import VendorModel from "../models/Vendor.model.js";
import axios from "axios";

export async function applyVendorController(req, res) {
  try {
    const {
      businessName,
      businessEmail,
      phone,
      description,
      address,
    } = req.body;

    if (!businessName || !businessEmail || !phone) {
      return res.status(400).json({
        status: "failed",
        message: "Business name, email and phone are required",
      });
    }

    const userId = req.user.userId;

    const existingVendor = await VendorModel.findOne({ userId });

    if (existingVendor) {
      return res.status(409).json({
        status: "failed",
        message: "You have already submitted a vendor application",
      });
    }

    const vendor = await VendorModel.create({
      userId,
      businessName,
      businessEmail,
      phone,
      description,
      address,
    });

    return res.status(201).json({
      status: "success",
      message: "Vendor application submitted successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("Vendor application error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function getMyVendorApplicationController(req, res) {
  try {
    const vendor = await VendorModel.findOne({
      userId: req.user.userId,
    });

    if (!vendor) {
      return res.status(404).json({
        status: "failed",
        message: "Vendor application not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: vendor,
    });
  } catch (error) {
    console.error("Get vendor application error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function updateVendorStatusController(req, res) {
  try {
    const { vendorId } = req.params;
    const { status } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        status: "failed",
        message: "Status must be APPROVED or REJECTED",
      });
    }

    const vendor = await VendorModel.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        status: "failed",
        message: "Vendor application not found",
      });
    }

    const previousStatus = vendor.status;

    // Update user role in Auth Service
    const newRole = status === "APPROVED" ? "VENDOR" : "CUSTOMER";

    try {
      await axios.patch(
        `${process.env.AUTH_SERVICE_URL}/api/auth/internal/users/role`,
        {
          userId: vendor.userId,
          role: newRole,
        },
        {
          headers: {
            "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
          },
        }
      );
    } catch (error) {
      console.error("Auth Service role update error:", error.message);

      return res.status(502).json({
        status: "failed",
        message: "Could not synchronize user role with Auth Service",
      });
    }

    // Update vendor application status
    vendor.status = status;
    await vendor.save();

    return res.status(200).json({
      status: "success",
      message: `Vendor application ${status.toLowerCase()} successfully`,
      data: vendor,
    });
  } catch (error) {
    console.error("Update vendor status error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function getAllVendorApplicationsController(req, res) {
  try {
    const vendors = await VendorModel.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: "success",
      results: vendors.length,
      data: vendors,
    });
  } catch (error) {
    console.error("Get vendor applications error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Unable to fetch vendor applications",
    });
  }
}

