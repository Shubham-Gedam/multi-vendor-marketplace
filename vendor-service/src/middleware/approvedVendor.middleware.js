import VendorModel from "../models/Vendor.model.js";

export async function approvedVendorMiddleware(req, res, next) {
  try {
    const vendor = await VendorModel.findOne({
      userId: req.user.userId,
      status: "APPROVED",
    });

    if (!vendor) {
      return res.status(403).json({
        status: "failed",
        message: "Your vendor account is not approved",
      });
    }

    req.vendor = vendor;

    next();
  } catch (error) {
    console.error("Approved vendor middleware error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}