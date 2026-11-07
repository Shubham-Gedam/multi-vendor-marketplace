import mongoose from "mongoose";

const vendorDB = mongoose.createConnection(
  process.env.VENDOR_MONGODB_URI
);

const vendorSchema = new mongoose.Schema(
  {
    userId: String,
    status: String,
  },
  { collection: "vendors" }
);

const VendorModel =
  vendorDB.model("Vendor", vendorSchema);

export async function approvedVendorMiddleware(req, res, next) {
  try {
    await vendorDB.asPromise();

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
    console.error("Vendor verification error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Vendor verification failed",
    });
  }
}