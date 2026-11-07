import api from "./api";

// Validate coupon before checkout
export async function validateCoupon(code) {
  const response = await api.post("/orders/coupons/validate", {
    code,
  });

  return response.data;
}

// Place customer order with optional coupon
export async function createOrder(shippingAddress, couponCode = "") {
  const response = await api.post("/orders", {
    shippingAddress,
    couponCode: couponCode.trim(),
  });

  return response.data;
}

// Get customer orders
export async function getMyOrders() {
  const response = await api.get("/orders/my-orders");
  return response.data;
}

// Get order details
export async function getOrderById(orderId) {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
}

// Cancel order
export async function cancelOrder(orderId) {
  const response = await api.patch(`/orders/${orderId}/cancel`);
  return response.data;
}

// Get vendor orders
export async function getVendorOrders() {
  const response = await api.get("/orders/vendor/my-orders");
  return response.data;
}

// Update vendor order status
export async function updateOrderStatus(orderId, orderStatus) {
  const response = await api.patch(
    `/orders/${orderId}/status`,
    { orderStatus }
  );

  return response.data;
}

// Admin: Get all marketplace orders
export async function getAllOrdersAdmin() {
  const response = await api.get("/orders/admin/all");
  return response.data;
}

// Download paid order invoice
export async function downloadInvoice(orderId) {
  const response = await api.get(
    `/orders/${orderId}/invoice`,
    {
      responseType: "blob",
    }
  );

  const blob = new Blob(
    [response.data],
    { type: "application/pdf" }
  );

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `INV-${orderId.slice(-8).toUpperCase()}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}