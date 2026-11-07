import api from "./api";

// Add product to cart
export async function addToCart(productId, quantity = 1) {
  const response = await api.post("/cart", {
    productId,
    quantity,
  });

  return response.data;
}

// Get customer cart
export async function getCart() {
  const response = await api.get("/cart");
  return response.data;
}

// Update product quantity
export async function updateCartQuantity(productId, quantity) {
  const response = await api.patch(`/cart/${productId}`, {
    quantity,
  });

  return response.data;
}

// Remove product from cart
export async function removeFromCart(productId) {
  const response = await api.delete(`/cart/${productId}`);
  return response.data;
}

// Clear complete cart
export async function clearCart() {
  const response = await api.delete("/cart");
  return response.data;
}