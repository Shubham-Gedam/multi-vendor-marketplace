import api from "./api";

// Create Razorpay payment order
export async function createPaymentOrder(orderId) {
  const response = await api.post("/payments/create-order", {
    orderId,
  });

  return response.data;
}

// Verify Razorpay payment
export async function verifyPayment(paymentData) {
  const response = await api.post(
    "/payments/verify",
    paymentData
  );

  return response.data;
}

// Get customer payment history
export async function getMyPayments() {
  const response = await api.get("/payments/my-payments");

  return response.data;
}

// Admin: Get all marketplace payments
export async function getAllPaymentsAdmin() {
  const response = await api.get("/payments/admin/all");
  return response.data;
}
// Create one payment for multiple vendor orders
export async function createCheckoutPayment(checkoutId) {
  const response = await api.post(
    "/payments/create-checkout-payment",
    { checkoutId }
  );

  return response.data;
}

// Verify combined checkout payment
export async function verifyCheckoutPayment(paymentData) {
  const response = await api.post(
    "/payments/verify-checkout",
    paymentData
  );

  return response.data;
}