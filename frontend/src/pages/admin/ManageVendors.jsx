import { useEffect, useState } from "react";
import {
  getAllVendorApplications,
  updateVendorStatus,
} from "../../services/vendorService";

export default function ManageVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadVendors() {
    try {
      setLoading(true);
      setError("");

      const response = await getAllVendorApplications();
      setVendors(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vendor applications"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, []);

  async function handleStatusUpdate(vendorId, status) {
    try {
      setUpdatingId(vendorId);
      setError("");

      await updateVendorStatus(vendorId, status);

      // Update the selected vendor without reloading the page.
      setVendors((prev) =>
        prev.map((vendor) =>
          vendor._id === vendorId
            ? { ...vendor, status }
            : vendor
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update vendor status"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const getStatusStyle = (status) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const pendingCount = vendors.filter(
    (vendor) => vendor.status === "PENDING"
  ).length;

  const approvedCount = vendors.filter(
    (vendor) => vendor.status === "APPROVED"
  ).length;

  const rejectedCount = vendors.filter(
    (vendor) => vendor.status === "REJECTED"
  ).length;

  // LOADING STATE

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10">
        <div className="h-36 rounded-2xl bg-slate-200" />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 rounded-xl bg-slate-200"
            />
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-56 rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">

        {/* HEADER */}

        <section className="rounded-2xl bg-gradient-to-r from-slate-950 to-blue-900 px-6 py-10 text-white sm:px-10">

          <p className="text-xs font-bold tracking-[2px] text-blue-200">
            MARKETLY ADMINISTRATION
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl">
                Manage Vendors
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Review seller applications, verify business
                information and manage vendor account approvals.
              </p>
            </div>

            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-4xl">
              🏪
            </div>

          </div>
        </section>

        {/* SUMMARY CARDS */}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

          {/* TOTAL */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Applications
              </p>

              <span className="text-2xl">📋</span>
            </div>

            <h2 className="mt-4 text-3xl font-extrabold text-slate-900">
              {vendors.length}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              All vendor applications
            </p>
          </div>

          {/* PENDING */}

          <div className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pending Applications
              </p>

              <span className="text-2xl">⏳</span>
            </div>

            <h2 className="mt-4 text-3xl font-extrabold text-yellow-600">
              {pendingCount}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Waiting for admin review
            </p>
          </div>

          {/* APPROVED */}

          <div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Approved Vendors
              </p>

              <span className="text-2xl">✅</span>
            </div>

            <h2 className="mt-4 text-3xl font-extrabold text-green-600">
              {approvedCount}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Approved seller accounts
            </p>
          </div>

        </div>

        {/* SECTION HEADER */}

        <div className="mb-6 mt-10 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Vendor Applications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review business details and application status.
            </p>
          </div>

          <button
            type="button"
            onClick={loadVendors}
            className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            ↻ Refresh Applications
          </button>

        </div>

        {/* STATUS LEGEND */}

        <div className="mb-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-yellow-100 px-4 py-2 text-xs font-bold text-yellow-700">
            Pending: {pendingCount}
          </span>

          <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700">
            Approved: {approvedCount}
          </span>

          <span className="rounded-full bg-red-100 px-4 py-2 text-xs font-bold text-red-700">
            Rejected: {rejectedCount}
          </span>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            <span>⚠️ {error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* EMPTY STATE */}

        {vendors.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">

            <span className="text-7xl">🏪</span>

            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
              No Vendor Applications
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              Vendor applications will appear here when
              customers apply to become marketplace sellers.
            </p>

          </div>

        ) : (

          /* VENDOR LIST */

          <div className="space-y-5">

            {vendors.map((vendor) => {

              const isUpdating = updatingId === vendor._id;

              return (
                <article
                  key={vendor._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >

                  {/* VENDOR HEADER */}

                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:px-7">

                    <div className="flex items-center gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                        🏪
                      </div>

                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {vendor.businessName}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Vendor ID: {vendor._id}
                        </p>
                      </div>

                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-xs font-bold ${getStatusStyle(
                        vendor.status
                      )}`}
                    >
                      {vendor.status}
                    </span>

                  </div>

                  <div className="space-y-6 p-5 sm:p-7">

                    {/* BUSINESS DETAILS */}

                    <div>
                      <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-slate-400">
                        Business Information
                      </h4>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <div className="rounded-xl border border-slate-200 p-4">
                          <p className="text-xs font-semibold text-slate-400">
                            Business Email
                          </p>

                          <p className="mt-2 break-all text-sm font-bold text-slate-900">
                            {vendor.businessEmail || "N/A"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                          <p className="text-xs font-semibold text-slate-400">
                            Contact Phone
                          </p>

                          <p className="mt-2 text-sm font-bold text-slate-900">
                            {vendor.phone || "N/A"}
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* DESCRIPTION */}

                    <div>
                      <h4 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-slate-400">
                        Business Description
                      </h4>

                      <p className="rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                        {vendor.description || "No description provided."}
                      </p>
                    </div>

                    {/* ADDRESS */}

                    <div>
                      <h4 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-slate-400">
                        Business Address
                      </h4>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-sm leading-7 text-slate-700">
                          {[
                            vendor.address?.street,
                            vendor.address?.city,
                            vendor.address?.state,
                            vendor.address?.zip ||
                              vendor.address?.pincode,
                            vendor.address?.country,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Address not provided."}
                        </p>

                      </div>
                    </div>

                    {/* ACTION BUTTONS */}

                    {vendor.status === "PENDING" ? (

                      <div className="flex flex-col justify-between gap-4 rounded-xl border border-yellow-200 bg-yellow-50 p-5 sm:flex-row sm:items-center">

                        <div>
                          <h4 className="font-extrabold text-slate-900">
                            Application Requires Review
                          </h4>

                          <p className="mt-1 text-sm text-slate-600">
                            Approve or reject this vendor application.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleStatusUpdate(
                                vendor._id,
                                "APPROVED"
                              )
                            }
                            className="flex-1 rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          >
                            {isUpdating
                              ? "Updating..."
                              : "✓ Approve"}
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleStatusUpdate(
                                vendor._id,
                                "REJECTED"
                              )
                            }
                            className="flex-1 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          >
                            {isUpdating
                              ? "Updating..."
                              : "✕ Reject"}
                          </button>

                        </div>

                      </div>

                    ) : (

                      <div
                        className={`rounded-xl p-4 ${
                          vendor.status === "APPROVED"
                            ? "border border-green-200 bg-green-50"
                            : "border border-red-200 bg-red-50"
                        }`}
                      >
                        <p
                          className={`text-sm font-bold ${
                            vendor.status === "APPROVED"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {vendor.status === "APPROVED"
                            ? "✓ This vendor application has been approved."
                            : "✕ This vendor application has been rejected."}
                        </p>
                      </div>

                    )}

                  </div>

                </article>
              );
            })}

          </div>

        )}

      </div>
    </div>
  );
}