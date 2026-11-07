import redis from "../config/redis.js";
import axios from 'axios'

const getCartKey = (userId) => `cart:${userId}`;

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
        `http://localhost:3003/api/products/${productId}`
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

    const cartKey = getCartKey(req.user.userId);
    const existingQuantity = await redis.hget(cartKey, productId);
    const newQuantity =
      Number(existingQuantity || 0) + Number(quantity);

    console.log("Product stock:", product.stock);
    console.log("Existing quantity:", existingQuantity);
    console.log("New quantity:", newQuantity);

    // Check total cart quantity against stock
    if (newQuantity > Number(product.stock)) {
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

// Get customer cart
export async function getCartController(req, res) {
  try {
    const cartKey = getCartKey(req.user.userId);

    const cartItems = await redis.hgetall(cartKey);

    const items = Object.entries(cartItems).map(
      ([productId, quantity]) => ({
        productId,
        quantity: Number(quantity),
      })
    );

    return res.status(200).json({
      status: "success",
      results: items.length,
      data: items,
    });
  } catch (error) {
    console.error("Get cart error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

// Remove product from cart
export async function removeFromCartController(req, res) {
  try {
    const { productId } = req.params;

    const cartKey = getCartKey(req.user.userId);

    const removed = await redis.hdel(cartKey, productId);

    if (!removed) {
      return res.status(404).json({
        status: "failed",
        message: "Product not found in cart",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Product removed from cart successfully",
    });
  } catch (error) {
    console.error("Remove from cart error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

// Update product quantity in cart
export async function updateCartQuantityController(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return res.status(400).json({
        status: "failed",
        message: "Quantity must be a positive integer",
      });
    }

    const cartKey = getCartKey(req.user.userId);

    const existingProduct = await redis.hexists(cartKey, productId);

    if (!existingProduct) {
      return res.status(404).json({
        status: "failed",
        message: "Product not found in cart",
      });
    }

    // Verify product from Product Service
    let productResponse;

    try {
      productResponse = await axios.get(
        `http://localhost:3003/api/products/${productId}`
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
    if (Number(quantity) > Number(product.stock)) {
      return res.status(400).json({
        status: "failed",
        message: `Only ${product.stock} items are available in stock`,
      });
    }

    await redis.hset(cartKey, productId, Number(quantity));

    return res.status(200).json({
      status: "success",
      message: "Cart quantity updated successfully",
      data: {
        productId,
        quantity: Number(quantity),
      },
    });
  } catch (error) {
    console.error("Update cart error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

// Clear customer cart
export async function clearCartController(req, res) {
  try {
    const cartKey = getCartKey(req.user.userId);

    await redis.del(cartKey);

    return res.status(200).json({
      status: "success",
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear cart error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}
