import { useEffect, useState } from "react";
import {
  applyVendor,
  getMyVendorApplication,
} from "../../services/vendorService";

const initialForm = {
  businessName: "",
  businessEmail: "",
  phone: "",
  description: "",
  address: {
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  },
};

export default function VendorApplication() {
  const [formData, setFormData] = useState(initialForm);
  const [application, setApplication] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadApplication() {
    try {
      const response = await getMyVendorApplication();
      setApplication(response.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(
          err.response?.data?.message ||
            "Unable to check application status"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplication();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];

      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await applyVendor(formData);

      setApplication(response.data);
      setMessage(response.message);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Vendor application failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100";

  const labelClass =
    "mb-2 block text-sm font-bold text-slate-700";

  // LOADING STATE

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-10">
        <div className="h-10 w-64 rounded bg-slate-200" />
        <div className="mt-8 h-96 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  // APPLICATION STATUS

  if (application) {
    const statusConfig = {
      PENDING: {
        icon: "⏳",
        title: "Application Under Review",
        description:
          "Your vendor application has been submitted successfully. Our admin team will review your business details.",
        badge: "bg-yellow-100 text-yellow-800",
        panel: "border-yellow-200 bg-yellow-50",
      },
      APPROVED: {
        icon: "✅",
        title: "Congratulations! You're Approved",
        description:
          "Your vendor application has been approved. You can now access your seller dashboard and manage your products.",
        badge: "bg-green-100 text-green-800",
        panel: "border-green-200 bg-green-50",
      },
      REJECTED: {
        icon: "❌",
        title: "Application Rejected",
        description:
          "Unfortunately, your vendor application was rejected. Please contact the marketplace administrator for further information.",
        badge: "bg-red-100 text-red-800",
        panel: "border-red-200 bg-red-50",
      },
    };

    const status =
      statusConfig[application.status] || statusConfig.PENDING;

    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">

        <div className="mx-auto max-w-3xl">

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="bg-gradient-to-r from-blue-950 to-blue-700 px-6 py-12 text-center text-white sm:px-10">

              <span className="text-6xl">{status.icon}</span>

              <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">
                {status.title}
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-blue-100">
                {status.description}
              </p>

              <span className={`mt-6 inline-block rounded-full px-5 py-2 text-xs font-extrabold ${status.badge}`}>
                {application.status}
              </span>

            </div>

            <div className="p-6 sm:p-9">

              <h2 className="text-xl font-extrabold text-slate-900">
                Business Information
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

                {[
                  {
                    label: "Business Name",
                    value: application.businessName,
                  },
                  {
                    label: "Business Email",
                    value: application.businessEmail,
                  },
                  {
                    label: "Phone Number",
                    value: application.phone,
                  },
                  {
                    label: "Business Description",
                    value: application.description || "Not provided",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-semibold text-slate-400">
                      {item.label}
                    </p>

                    <p className="mt-2 break-words text-sm font-bold text-slate-800">
                      {item.value}
                    </p>
                  </div>
                ))}

              </div>

              <div className="mt-8 border-t border-slate-100 pt-7">

                <h2 className="text-xl font-extrabold text-slate-900">
                  Business Address
                </h2>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">

                  <p className="font-bold text-slate-800">
                    {application.address?.street || "N/A"}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {[
                      application.address?.city,
                      application.address?.state,
                      application.address?.zip,
                      application.address?.country,
                    ].filter(Boolean).join(", ") || "Address not provided"}
                  </p>

                </div>

              </div>

              {message && (
                <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                  ✓ {message}
                </div>
              )}

              <div className={`mt-7 rounded-xl border p-5 ${status.panel}`}>

                <h3 className="font-bold text-slate-900">
                  What's Next?
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {application.status === "PENDING"
                    ? "Please wait while the admin reviews your application. Your seller features will become available after approval."
                    : application.status === "APPROVED"
                    ? "You can now manage your product listings, upload images and process customer orders."
                    : "Your existing application has been rejected. Contact the admin to discuss the decision."}
                </p>

                {application.status === "APPROVED" && (
                  <a
                    href="/vendor"
                    className="mt-5 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Open Vendor Dashboard →
                  </a>
                )}

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // APPLICATION FORM

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-5xl px-4 py-9 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-700 px-6 py-10 text-white sm:px-10">

          <p className="text-xs font-bold tracking-[2px] text-blue-200">
            MARKETLY SELLER CENTER
          </p>

          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Become a Vendor
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100">
            Join our multi-vendor marketplace, showcase your
            products and grow your business with Marketly.
          </p>

          <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-blue-100">
            <span>✓ Reach More Customers</span>
            <span>✓ Manage Your Products</span>
            <span>✓ Grow Your Business</span>
          </div>

        </div>

        {/* MAIN LAYOUT */}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">

          {/* APPLICATION FORM */}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >

            <div className="mb-7 border-b border-slate-100 pb-5">

              <h2 className="text-xl font-extrabold text-slate-900">
                Business Information
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Fill in your business details to submit your application.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                ⚠️ {error}
              </div>
            )}

            {/* BUSINESS NAME */}

            <div className="mb-5">
              <label htmlFor="businessName" className={labelClass}>
                Business Name *
              </label>

              <input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="Enter your business name"
                value={formData.businessName}
                onChange={handleChange}
                required
                disabled={submitting}
                className={inputClass}
              />
            </div>

            {/* BUSINESS EMAIL */}

            <div className="mb-5">
              <label htmlFor="businessEmail" className={labelClass}>
                Business Email *
              </label>

              <input
                id="businessEmail"
                type="email"
                name="businessEmail"
                placeholder="business@example.com"
                value={formData.businessEmail}
                onChange={handleChange}
                required
                disabled={submitting}
                className={inputClass}
              />
            </div>

            {/* PHONE */}

            <div className="mb-5">
              <label htmlFor="phone" className={labelClass}>
                Phone Number *
              </label>

              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Enter contact number"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={submitting}
                className={inputClass}
              />
            </div>

            {/* DESCRIPTION */}

            <div className="mb-7">
              <label htmlFor="description" className={labelClass}>
                Business Description
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Tell us about your business and products..."
                value={formData.description}
                onChange={handleChange}
                disabled={submitting}
                rows={5}
                className={`${inputClass} resize-y`}
              />
            </div>

            {/* ADDRESS */}

            <div className="border-t border-slate-100 pt-7">

              <h2 className="text-xl font-extrabold text-slate-900">
                Business Address
              </h2>

              <p className="mb-6 mt-2 text-sm text-slate-500">
                Provide your business location details.
              </p>

              <div className="mb-5">
                <label htmlFor="street" className={labelClass}>
                  Street Address
                </label>

                <input
                  id="street"
                  name="address.street"
                  placeholder="House number, street and area"
                  value={formData.address.street}
                  onChange={handleChange}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>

              <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label htmlFor="city" className={labelClass}>
                    City
                  </label>

                  <input
                    id="city"
                    name="address.city"
                    placeholder="Enter city"
                    value={formData.address.city}
                    onChange={handleChange}
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="state" className={labelClass}>
                    State
                  </label>

                  <input
                    id="state"
                    name="address.state"
                    placeholder="Enter state"
                    value={formData.address.state}
                    onChange={handleChange}
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>

              </div>

              <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label htmlFor="zip" className={labelClass}>
                    ZIP / PIN Code
                  </label>

                  <input
                    id="zip"
                    name="address.zip"
                    placeholder="Enter PIN code"
                    value={formData.address.zip}
                    onChange={handleChange}
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="country" className={labelClass}>
                    Country
                  </label>

                  <input
                    id="country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>

              </div>

            </div>

            {/* SUBMIT */}

            <div className="border-t border-slate-100 pt-6">

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-yellow-400 py-4 font-extrabold text-slate-950 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
                    Submitting Application...
                  </>
                ) : (
                  "Submit Vendor Application →"
                )}
              </button>

              <p className="mt-4 text-center text-xs leading-6 text-slate-400">
                Your application will be reviewed by the marketplace admin.
              </p>

            </div>

          </form>

          {/* INFORMATION SIDEBAR */}

          <aside className="space-y-5">

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

              <h3 className="font-extrabold text-slate-900">
                Why Sell With Marketly?
              </h3>

              <div className="mt-5 space-y-5">

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌍</span>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Reach More Customers
                    </h4>

                    <p className="mt-1 text-xs leading-6 text-slate-600">
                      Showcase your products in a multi-vendor marketplace.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">📦</span>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Manage Your Store
                    </h4>

                    <p className="mt-1 text-xs leading-6 text-slate-600">
                      Manage listings, stock and customer orders.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">📈</span>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Grow Your Business
                    </h4>

                    <p className="mt-1 text-xs leading-6 text-slate-600">
                      Expand your online presence through Marketly.
                    </p>
                  </div>
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <span className="text-3xl">🔐</span>

              <h3 className="mt-4 font-extrabold text-slate-900">
                Admin Approval
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Every vendor application is reviewed by the marketplace administrator before seller access is granted.
              </p>

            </div>

          </aside>

        </div>

      </div>

    </div>
  );
}