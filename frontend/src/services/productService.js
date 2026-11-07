import api from "./api";

export async function getProducts(params = {}) {
  const cleanedParams = Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) =>
        value !== "" &&
        value !== undefined &&
        value !== null
    )
  );

  const response = await api.get("/products", {
    params: cleanedParams,
  });

  return response.data;
}

// Get single product details
export async function getProductById(productId) {
  const response = await api.get(`/products/${productId}`);

  return response.data;
}

// Create product with S3 image upload
export async function createProduct(productData) {
  const response = await api.post("/products", productData);
  return response.data;
}

// Update product
export async function updateProduct(productId, productData) {
  const response = await api.patch(
    `/products/${productId}`,
    productData
  );

  return response.data;
}

// Delete product
export async function deleteProduct(productId) {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
}

// Get product reviews
export async function getProductReviews(productId, params = {}) {
  const response = await api.get(
    `/products/${productId}/reviews`,
    { params }
  );

  return response.data;
}

// Create product review
export async function createProductReview(productId, reviewData) {
  const response = await api.post(
    `/products/${productId}/reviews`,
    reviewData
  );

  return response.data;
}

// Update own product review
export async function updateProductReview(reviewId, reviewData) {
  const response = await api.patch(
    `/products/reviews/${reviewId}`,
    reviewData
  );

  return response.data;
}

// Delete own product review
export async function deleteProductReview(reviewId) {
  const response = await api.delete(
    `/products/reviews/${reviewId}`
  );

  return response.data;
}
// Get current customer's review
export async function getMyProductReview(productId) {
  const response = await api.get(
    `/products/reviews/my/${productId}`
  );

  return response.data;
}
