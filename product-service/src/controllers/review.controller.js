import mongoose from "mongoose";
import ProductModel from "../models/Product.model.js";
import ProductReviewModel from "../models/ProductReview.model.js";
import { syncProductToElastic } from "../config/elasticsearchSync.js";

// Recalculate product rating
async function updateProductRating(productId) {
  const stats = await ProductReviewModel.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats.length
    ? Math.round(stats[0].averageRating * 10) / 10
    : 0;

  const numReviews = stats.length
    ? stats[0].numReviews
    : 0;

  const product = await ProductModel.findByIdAndUpdate(
    productId,
    {
      averageRating,
      numReviews,
    },
    { new: true }
  );

  // Update Elasticsearch product data
  if (product) {
    try {
      await syncProductToElastic(product);
    } catch (error) {
      console.error(
        "Product rating Elasticsearch sync failed:",
        error.message
      );
    }
  }

  return { averageRating, numReviews };
}

// CREATE REVIEW
export async function createReviewController(req, res) {
  try {
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can submit product reviews",
      });
    }

    const { productId } = req.params;
    const { rating, title, comment } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid product ID",
      });
    }

    if (
      rating === undefined ||
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Rating must be between 1 and 5",
      });
    }

    if (
      !title?.trim() ||
      !comment?.trim()
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Review title and comment are required",
      });
    }

    const product = await ProductModel.findOne({
      _id: productId,
      status: "ACTIVE",
    });

    if (!product) {
      return res.status(404).json({
        status: "failed",
        message: "Product not found",
      });
    }

    const review = await ProductReviewModel.create({
      productId,
      customerId: req.user.userId,
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
    });

    const summary = await updateProductRating(productId);

    return res.status(201).json({
      status: "success",
      message: "Review submitted successfully",
      data: review,
      summary,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "failed",
        message: "You have already reviewed this product",
      });
    }

    console.error("Create review error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Unable to submit review",
    });
  }
}

// GET PRODUCT REVIEWS
export async function getProductReviewsController(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid product ID",
      });
    }

    const product = await ProductModel.findOne({
      _id: productId,
      status: "ACTIVE",
    });

    if (!product) {
      return res.status(404).json({
        status: "failed",
        message: "Product not found",
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    const [reviews, totalReviews] = await Promise.all([
      ProductReviewModel.find({ productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      ProductReviewModel.countDocuments({ productId }),
    ]);

    return res.status(200).json({
      status: "success",
      data: reviews,
      summary: {
        averageRating: product.averageRating,
        numReviews: product.numReviews,
      },
      pagination: {
        currentPage: page,
        totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
        hasNextPage: page * limit < totalReviews,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Unable to fetch product reviews",
    });
  }
}

// UPDATE OWN REVIEW
export async function updateReviewController(req, res) {
  try {
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can update reviews",
      });
    }

    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid review ID",
      });
    }

    const review = await ProductReviewModel.findOne({
      _id: reviewId,
      customerId: req.user.userId,
    });

    if (!review) {
      return res.status(404).json({
        status: "failed",
        message: "Review not found or access denied",
      });
    }

    if (rating !== undefined) {
      if (
        !Number.isInteger(Number(rating)) ||
        Number(rating) < 1 ||
        Number(rating) > 5
      ) {
        return res.status(400).json({
          status: "failed",
          message: "Rating must be between 1 and 5",
        });
      }

      review.rating = Number(rating);
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          status: "failed",
          message: "Review title cannot be empty",
        });
      }

      review.title = title.trim();
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({
          status: "failed",
          message: "Review comment cannot be empty",
        });
      }

      review.comment = comment.trim();
    }

    await review.save();

    const summary = await updateProductRating(
      review.productId
    );

    return res.status(200).json({
      status: "success",
      message: "Review updated successfully",
      data: review,
      summary,
    });
  } catch (error) {
    console.error("Update review error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Unable to update review",
    });
  }
}

// DELETE OWN REVIEW
export async function deleteReviewController(req, res) {
  try {
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can delete reviews",
      });
    }

    const { reviewId } = req.params;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid review ID",
      });
    }

    const review = await ProductReviewModel.findOne({
      _id: reviewId,
      customerId: req.user.userId,
    });

    if (!review) {
      return res.status(404).json({
        status: "failed",
        message: "Review not found or access denied",
      });
    }

    const productId = review.productId;

    await ProductReviewModel.deleteOne({
      _id: reviewId,
      customerId: req.user.userId,
    });

    const summary = await updateProductRating(productId);

    return res.status(200).json({
      status: "success",
      message: "Review deleted successfully",
      summary,
    });
  } catch (error) {
    console.error("Delete review error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Unable to delete review",
    });
  }
}

// GET CURRENT CUSTOMER'S REVIEW
export async function getMyReviewController(req, res) {
  try {
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can access their reviews",
      });
    }

    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid product ID",
      });
    }

    const review = await ProductReviewModel.findOne({
      productId,
      customerId: req.user.userId,
    });

    return res.status(200).json({
      status: "success",
      data: review,
    });
  } catch (error) {
    console.error("Get my review error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Unable to fetch your review",
    });
  }
}

