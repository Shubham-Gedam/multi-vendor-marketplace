import api from "./api";

// Submit vendor application
export async function applyVendor(vendorData) {
  const response = await api.post(
    "/vendors/apply",
    vendorData
  );

  return response.data;
}

// Get current user's vendor application
export async function getMyVendorApplication() {
  const response = await api.get(
    "/vendors/my-application"
  );

  return response.data;
}

// Admin: Update vendor application status
export async function updateVendorStatus(vendorId, status) {
  const response = await api.patch(
    `/vendors/${vendorId}/status`,
    { status }
  );

  return response.data;
}

// Admin: Get all vendor applications
export async function getAllVendorApplications() {
  const response = await api.get("/vendors/admin/all");
  return response.data;
}