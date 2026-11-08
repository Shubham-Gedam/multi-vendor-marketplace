import ProductModel from "../models/Product.model.js";
import { uploadToS3, deleteFromS3 } from "../utils/s3Upload.js";
import {
  syncProductToElastic,
  deleteProductFromElastic,
} from "../config/elasticsearchSync.js";
import elasticClient from "../config/elasticsearch.js";
import axios from "axios";

// Create product with S3 image upload
export async function createProductController(req, res) {
  const uploadedKeys = [];

  try {
    const { name, description, price, category, brand, stock } = req.body;

    if (!name || !description || price == null || !category) {
      return res.status(400).json({
        status: "failed",
        message: "Name, description, price and category are required",
      });
    }

    const imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadedImage = await uploadToS3(file);

        imageUrls.push(uploadedImage.url);
        uploadedKeys.push(uploadedImage.key);
      }
    }

    const product = await ProductModel.create({
      vendorId: req.vendor.userId,
      name,
      description,
      price: Number(price),
      category,
      brand,
      images: imageUrls,
      stock: stock == null ? 0 : Number(stock),
    });

    // Sync product to Elasticsearch
    try {
      await syncProductToElastic(product);
    } catch (elasticError) {
      console.error("Elasticsearch sync failed:", elasticError.message);
    }

    return res.status(201).json({
      status: "success",
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    for (const key of uploadedKeys) {
      try {
        await deleteFromS3(key);
      } catch (cleanupError) {
        console.error("S3 cleanup error:", cleanupError.message);
      }
    }

    console.error("Create product error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Product creation failed",
    });
  }
}

// Get active products with search, filters and sorting
export async function getProductsController(req, res) {
  try {
    const {
      search: searchParam,
      q,
      category,
      minPrice,
      maxPrice,
      minRating,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const search = String(searchParam ?? q ?? "").trim();

    const allowedSortFields = ["price", "createdAt", "name"];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeOrder = order === "asc" ? "asc" : "desc";

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10));

    const skip = (pageNumber - 1) * limitNumber;

    // Elasticsearch filters
    const filters = [{ term: { status: "ACTIVE" } }];

    if (category) {
      filters.push({
        term: { category: category },
      });
    }
    // Minimum rating validation and filter
    if (minRating !== undefined) {
      const rating = Number(minRating);

      if (
        minRating === "" ||
        !Number.isFinite(rating) ||
        rating < 0 ||
        rating > 5
      ) {
        return res.status(400).json({
          status: "failed",
          message: "Minimum rating must be between 0 and 5",
        });
      }

      filters.push({
        range: {
          averageRating: {
            gte: rating,
          },
        },
      });
    }

    const priceRange = {};

    if (minPrice !== undefined) {
      priceRange.gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      priceRange.lte = Number(maxPrice);
    }

    if (Object.keys(priceRange).length > 0) {
      filters.push({
        range: { price: priceRange },
      });
    }

    // Elasticsearch search query
    const query = {
      bool: {
        must: search
          ? [
              {
                multi_match: {
                  query: search,
                  type: "best_fields",
                  fields: ["name^5", "brand^2", "description"],
                  operator: "and",
                  fuzziness: "AUTO",
                },
              },
            ]
          : [],
        filter: filters,
      },
    };

    const sortField = safeSortBy === "name" ? "name.keyword" : safeSortBy;

    const response = await elasticClient.search({
      index: "products",
      from: skip,
      size: limitNumber,
      query,
      sort: [
        {
          [sortField]: {
            order: safeOrder,
          },
        },
      ],
    });

    const hits = response.hits.hits;

    const productIds = hits.map((hit) => hit._id);

    // Get complete product data from MongoDB
    const mongoProducts = await ProductModel.find({
      _id: { $in: productIds },
      status: "ACTIVE",
    });

    // Maintain Elasticsearch sorting order
    const productMap = new Map(
      mongoProducts.map((product) => [product._id.toString(), product]),
    );

    const products = productIds.map((id) => productMap.get(id)).filter(Boolean);

    const totalProducts =
      typeof response.hits.total === "number"
        ? response.hits.total
        : response.hits.total.value;

    const totalPages = Math.ceil(totalProducts / limitNumber);

    return res.status(200).json({
      status: "success",
      results: products.length,
      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalProducts,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

// Update own product
export async function updateProductController(req, res) {
  const uploadedKeys = [];

  try {
    const { productId } = req.params;

    const product = await ProductModel.findOne({
      _id: productId,
      vendorId: req.vendor.userId,
    });

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "brand",
      "stock",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    let oldImageUrls = [];

    if (req.files && req.files.length > 0) {
      oldImageUrls = [...product.images];

      const uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadToS3(file);
          uploadedKeys.push(result.key);
          return result.url;
        }),
      );

      product.images = uploadedImages;
    }

    await product.save();

    // Sync updated product to Elasticsearch
    try {
      await syncProductToElastic(product);
    } catch (elasticError) {
      console.error("Elasticsearch sync failed:", elasticError.message);
    }

    // Delete old S3 images after successful update
    for (const imageUrl of oldImageUrls) {
      try {
        const url = new URL(imageUrl);

        const expectedHost = `${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

        if (url.hostname === expectedHost) {
          const key = decodeURIComponent(url.pathname.slice(1));
          await deleteFromS3(key);
        }
      } catch (error) {
        console.error("Old S3 image deletion failed:", error.message);
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    for (const key of uploadedKeys) {
      try {
        await deleteFromS3(key);
      } catch (deleteError) {
        console.error("S3 cleanup failed:", deleteError.message);
      }
    }

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// Delete own product
export async function deleteProductController(req, res) {
  try {
    const { productId } = req.params;

    const product = await ProductModel.findOne({
      _id: productId,
      vendorId: req.vendor.userId,
    });

    if (!product) {
      return res.status(404).json({
        status: "failed",
        message: "Product not found or access denied",
      });
    }

    // Delete from MongoDB
    await ProductModel.deleteOne({ _id: product._id });

    // Delete from Elasticsearch
    try {
      await deleteProductFromElastic(product._id.toString());
    } catch (elasticError) {
      console.error("Elasticsearch delete failed:", elasticError.message);
    }

    // Delete images from S3
    for (const imageUrl of product.images) {
      try {
        const url = new URL(imageUrl);

        const expectedHost = `${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

        if (url.hostname === expectedHost) {
          const key = decodeURIComponent(url.pathname.slice(1));
          await deleteFromS3(key);
        }
      } catch (s3Error) {
        console.error("S3 image deletion failed:", s3Error.message);
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Product and associated data deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

// Get single active product by ID
export async function getProductByIdController(req, res) {
  try {
    const { productId } = req.params;

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

    return res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    console.error("Get product by ID error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

// Add product to cart
export async function addToCartController(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;

    if (
      !productId ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Valid productId and quantity are required",
      });
    }

    // Verify product from Product Service
    let productResponse;

    try {
      productResponse = await axios.get(
        `http://localhost:3003/api/products/${productId}`,
      );
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({
          status: "failed",
          message: "Product not found or inactive",
        });
      }

      throw error;
    }

    const product = productResponse.data.data;

    // Check available stock
    if (Number(quantity) > product.stock) {
      return res.status(400).json({
        status: "failed",
        message: `Only ${product.stock} items are available in stock`,
      });
    }

    const cartKey = getCartKey(req.user.userId);
    const existingQuantity = await redis.hget(cartKey, productId);
    const newQuantity = Number(existingQuantity || 0) + Number(quantity);

    // Check total cart quantity against stock
    if (newQuantity > product.stock) {
      return res.status(400).json({
        status: "failed",
        message: `Only ${product.stock} items are available in stock`,
      });
    }

    await redis.hset(cartKey, productId, newQuantity);

    return res.status(200).json({
      status: "success",
      message: "Product added to cart successfully",
      data: {
        productId,
        quantity: newQuantity,
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}
