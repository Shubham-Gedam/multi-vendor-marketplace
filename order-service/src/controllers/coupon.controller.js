import mongoose from "mongoose";
import CouponModel from "../models/Coupon.model.js";
import axios from "axios";
import CouponRedemptionModel from "../models/CouponRedemption.model.js";

// Helper: coupon code validation
function normalizeCouponCode(code) {
  if (typeof code !== "string") return null;

  const normalized = code.trim().toUpperCase();

  if (
    normalized.length < 3 ||
    normalized.length > 30 ||
    !/^[A-Z0-9_-]+$/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

// Helper: number validation
function validNumber(value, min = 0) {
  const number = Number(value);

  return Number.isFinite(number) && number >= min ? number : null;
}

// Helper: prepare and validate coupon fields
function validateCouponFields(data, existing = {}) {
  const result = { ...existing };

  if (data.code !== undefined) {
    const code = normalizeCouponCode(data.code);

    if (!code) {
      return { error: "Invalid coupon code format" };
    }

    result.code = code;
  }

  if (data.description !== undefined) {
    if (typeof data.description !== "string") {
      return { error: "Description must be a string" };
    }

    result.description = data.description.trim();
  }

  if (data.discountType !== undefined) {
    if (!["PERCENTAGE", "FIXED"].includes(data.discountType)) {
      return { error: "Discount type must be PERCENTAGE or FIXED" };
    }

    result.discountType = data.discountType;
  }

  if (data.discountValue !== undefined) {
    const value = validNumber(data.discountValue, 0.01);

    if (value === null) {
      return { error: "Discount value must be greater than zero" };
    }

    result.discountValue = value;
  }

  if (data.minOrderAmount !== undefined) {
    const value = validNumber(data.minOrderAmount, 0);

    if (value === null) {
      return { error: "Minimum order amount cannot be negative" };
    }

    result.minOrderAmount = value;
  }

  if (data.maxDiscountAmount !== undefined) {
    if (data.maxDiscountAmount === null || data.maxDiscountAmount === "") {
      result.maxDiscountAmount = null;
    } else {
      const value = validNumber(data.maxDiscountAmount, 0);

      if (value === null) {
        return { error: "Maximum discount cannot be negative" };
      }

      result.maxDiscountAmount = value;
    }
  }

  if (data.usageLimit !== undefined) {
    if (data.usageLimit === null || data.usageLimit === "") {
      result.usageLimit = null;
    } else {
      const value = Number(data.usageLimit);

      if (!Number.isInteger(value) || value < 1) {
        return { error: "Usage limit must be a positive integer" };
      }

      result.usageLimit = value;
    }
  }

  if (data.perCustomerLimit !== undefined) {
    const value = Number(data.perCustomerLimit);

    if (!Number.isInteger(value) || value < 1) {
      return { error: "Per-customer limit must be a positive integer" };
    }

    result.perCustomerLimit = value;
  }

  if (data.startsAt !== undefined) {
    const date = new Date(data.startsAt);

    if (Number.isNaN(date.getTime())) {
      return { error: "Invalid coupon start date" };
    }

    result.startsAt = date;
  }

  if (data.expiresAt !== undefined) {
    const date = new Date(data.expiresAt);

    if (Number.isNaN(date.getTime())) {
      return { error: "Invalid coupon expiry date" };
    }

    result.expiresAt = date;
  }

  if (data.isActive !== undefined) {
    if (typeof data.isActive !== "boolean") {
      return { error: "isActive must be true or false" };
    }

    result.isActive = data.isActive;
  }

  // Validate combined values
  if (result.discountType === "PERCENTAGE" && result.discountValue > 100) {
    return { error: "Percentage discount cannot exceed 100%" };
  }

  if (
    result.discountType === "PERCENTAGE" &&
    result.maxDiscountAmount === undefined
  ) {
    result.maxDiscountAmount = null;
  }

  if (
    result.startsAt &&
    result.expiresAt &&
    result.expiresAt <= result.startsAt
  ) {
    return { error: "Expiry date must be after start date" };
  }

  if (
    result.usageLimit !== null &&
    result.usageLimit !== undefined &&
    existing.usedCount !== undefined &&
    result.usageLimit < existing.usedCount
  ) {
    return {
      error: "Usage limit cannot be less than coupons already redeemed",
    };
  }

  return { data: result };
}

// 1. Create coupon (Admin)
export async function createCouponController(req, res) {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      perCustomerLimit,
      startsAt,
      expiresAt,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiresAt) {
      return res.status(400).json({
        status: "failed",
        message:
          "Code, discount type, discount value and expiry date are required",
      });
    }

    const validation = validateCouponFields({
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      perCustomerLimit,
      startsAt,
      expiresAt,
    });

    if (validation.error) {
      return res.status(400).json({
        status: "failed",
        message: validation.error,
      });
    }

    const coupon = await CouponModel.create({
      ...validation.data,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      status: "success",
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "failed",
        message: "Coupon code already exists",
      });
    }

    console.error("Create coupon error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Unable to create coupon",
    });
  }
}

// 2. Get all coupons (Admin)
export async function getAllCouponsController(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      CouponModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),

      CouponModel.countDocuments(),
    ]);

    return res.status(200).json({
      status: "success",
      data: coupons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get coupons error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Unable to fetch coupons",
    });
  }
}

// 3. Update coupon (Admin)
export async function updateCouponController(req, res) {
  try {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid coupon ID",
      });
    }

    const coupon = await CouponModel.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        status: "failed",
        message: "Coupon not found",
      });
    }

    // Usage count and creator cannot be changed by this endpoint
    const validation = validateCouponFields(req.body, coupon.toObject());

    if (validation.error) {
      return res.status(400).json({
        status: "failed",
        message: validation.error,
      });
    }

    Object.assign(coupon, validation.data);

    await coupon.save();

    return res.status(200).json({
      status: "success",
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "failed",
        message: "Coupon code already exists",
      });
    }

    console.error("Update coupon error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Unable to update coupon",
    });
  }
}

// 4. Validate coupon for customer checkout
export async function validateCouponController(req, res) {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        status: "failed",
        message: "Coupon code is required",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Find coupon
    const coupon = await CouponModel.findOne({
      code: normalizedCode,
    });

    if (!coupon) {
      return res.status(404).json({
        status: "failed",
        message: "Invalid coupon code",
      });
    }

    const now = new Date();

    if (!coupon.isActive) {
      return res.status(400).json({
        status: "failed",
        message: "This coupon is inactive",
      });
    }

    if (coupon.startsAt > now) {
      return res.status(400).json({
        status: "failed",
        message: "This coupon is not active yet",
      });
    }

    if (coupon.expiresAt <= now) {
      return res.status(400).json({
        status: "failed",
        message: "This coupon has expired",
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount + coupon.reservedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Coupon usage limit has been reached",
      });
    }

    // Check customer's successful coupon redemptions
    const customerUsage = await CouponRedemptionModel.countDocuments({
      couponId: coupon._id,
      customerId: req.user.userId,
      status: { $in: ["RESERVED", "REDEEMED"] },
    });

    if (customerUsage >= coupon.perCustomerLimit) {
      return res.status(400).json({
        status: "failed",
        message: "You have already used this coupon maximum number of times",
      });
    }

    // Fetch actual cart from Cart Service
    let cartResponse;

    try {
      cartResponse = await axios.get(
        `${process.env.CART_SERVICE_URL}/api/cart`,
        {
          headers: {
            Cookie: req.headers.cookie || "",
          },
        },
      );
    } catch (error) {
      console.error("Cart Service error:", error.message);

      return res.status(503).json({
        status: "failed",
        message: "Cart Service is unavailable",
      });
    }

    const cartItems = cartResponse.data.data;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "Your cart is empty",
      });
    }

    // Calculate subtotal using actual Product Service prices
    let subtotalPaise = 0;

    for (const item of cartItems) {
      const quantity = Number(item.quantity);

      if (!item.productId || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          status: "failed",
          message: "Invalid cart item",
        });
      }

      let productResponse;

      try {
        productResponse = await axios.get(
          `${process.env.PRODUCT_SERVICE_URL}/api/products/${item.productId}`,
        );
      } catch (error) {
        if (error.response?.status === 404) {
          return res.status(400).json({
            status: "failed",
            message: "A product in your cart is unavailable",
          });
        }

        return res.status(503).json({
          status: "failed",
          message: "Product Service is unavailable",
        });
      }

      const product = productResponse.data.data;

      if (!product || product.status !== "ACTIVE") {
        return res.status(400).json({
          status: "failed",
          message: "A product in your cart is not available",
        });
      }

      if (quantity > Number(product.stock)) {
        return res.status(400).json({
          status: "400",
          message: `Insufficient stock for ${product.name}`,
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          status: "failed",
          message: "Invalid product price",
        });
      }

      subtotalPaise += Math.round(price * 100) * quantity;
    }

    // Convert paise to rupees
    const subtotal = subtotalPaise / 100;

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        status: "failed",
        message: `Minimum cart value for this coupon is ₹${coupon.minOrderAmount}`,
      });
    }

    // Calculate discount in paise
    let discountPaise;

    if (coupon.discountType === "PERCENTAGE") {
      discountPaise = Math.round((subtotalPaise * coupon.discountValue) / 100);

      if (coupon.maxDiscountAmount !== null) {
        const maxDiscountPaise = Math.round(coupon.maxDiscountAmount * 100);

        discountPaise = Math.min(discountPaise, maxDiscountPaise);
      }
    } else {
      discountPaise = Math.round(coupon.discountValue * 100);
    }

    // Discount cannot exceed cart subtotal
    discountPaise = Math.min(discountPaise, subtotalPaise);

    // Current Razorpay checkout does not support zero-value orders
    if (discountPaise >= subtotalPaise) {
      return res.status(400).json({
        status: "failed",
        message: "Coupon discount cannot make the payable amount zero",
      });
    }

    const discountAmount = discountPaise / 100;
    const payableAmount = (subtotalPaise - discountPaise) / 100;

    return res.status(200).json({
      status: "success",
      message: "Coupon applied successfully",
      data: {
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        subtotal,
        discountAmount,
        payableAmount,
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Unable to validate coupon",
    });
  }
}
