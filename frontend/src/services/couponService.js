import api from "./api";

// Admin: Create coupon
export async function createCoupon(couponData) {
  const response = await api.post(
    "/orders/admin/coupons",
    couponData
  );

  return response.data;
}

// Admin: Get all coupons
export async function getAllCoupons(params = {}) {
  const response = await api.get(
    "/orders/admin/coupons",
    { params }
  );

  return response.data;
}

// Admin: Update coupon
export async function updateCoupon(couponId, couponData) {
  const response = await api.patch(
    `/orders/admin/coupons/${couponId}`,
    couponData
  );

  return response.data;
}