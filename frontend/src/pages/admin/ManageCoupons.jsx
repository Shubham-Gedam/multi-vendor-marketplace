import { useEffect, useState } from "react";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
} from "../../services/couponService";

function getDateTimeValue(date) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function getInitialForm() {
  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + 7);

  return {
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderAmount: "0",
    maxDiscountAmount: "",
    usageLimit: "",
    perCustomerLimit: "1",
    startsAt: getDateTimeValue(now),
    expiresAt: getDateTimeValue(expiry),
  };
}

function formatDate(date) {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(getInitialForm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function fetchCoupons() {
    try {
      setLoading(true);
      setError("");

      const response = await getAllCoupons({
        page: 1,
        limit: 50,
      });

      setCoupons(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to fetch coupons"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscountAmount:
          form.discountType === "PERCENTAGE" &&
          form.maxDiscountAmount !== ""
            ? Number(form.maxDiscountAmount)
            : null,
        usageLimit:
          form.usageLimit !== ""
            ? Number(form.usageLimit)
            : null,
        perCustomerLimit: Number(form.perCustomerLimit),
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
      };

      await createCoupon(payload);

      setMessage("Coupon created successfully!");
      setForm(getInitialForm());

      await fetchCoupons();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create coupon"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(coupon) {
    try {
      setUpdatingId(coupon._id);
      setError("");
      setMessage("");

      await updateCoupon(coupon._id, {
        isActive: !coupon.isActive,
      });

      setMessage(
        `${coupon.code} ${
          coupon.isActive ? "deactivated" : "activated"
        } successfully`
      );

      await fetchCoupons();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update coupon"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">
          <p className="text-xs font-bold tracking-[2px] text-blue-600">
            MARKETPLACE ADMINISTRATION
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Manage Coupons
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create and manage marketplace discount coupons.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Coupons
            </p>

            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {coupons.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active Coupons
            </p>

            <p className="mt-2 text-3xl font-extrabold text-green-600">
              {coupons.filter((coupon) => coupon.isActive).length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Redemptions
            </p>

            <p className="mt-2 text-3xl font-extrabold text-blue-600">
              {coupons.reduce(
                (total, coupon) =>
                  total + Number(coupon.usedCount || 0),
                0
              )}
            </p>
          </div>

        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* CREATE COUPON FORM */}

        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

          <div className="mb-7 border-b border-slate-100 pb-5">
            <h2 className="text-xl font-extrabold text-slate-900">
              Create New Coupon
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure discount rules and coupon validity.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {/* CODE */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Coupon Code *
                </label>

                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="WELCOME10"
                  required
                  maxLength={30}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* DISCOUNT TYPE */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Discount Type *
                </label>

                <select
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="PERCENTAGE">
                    Percentage (%)
                  </option>

                  <option value="FIXED">
                    Fixed Amount (₹)
                  </option>
                </select>
              </div>

              {/* DISCOUNT VALUE */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Discount Value *
                </label>

                <input
                  type="number"
                  name="discountValue"
                  value={form.discountValue}
                  onChange={handleChange}
                  placeholder={
                    form.discountType === "PERCENTAGE"
                      ? "10"
                      : "200"
                  }
                  min="0.01"
                  step="0.01"
                  max={
                    form.discountType === "PERCENTAGE"
                      ? "100"
                      : undefined
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Description
                </label>

                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Welcome discount for customers"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* MINIMUM ORDER */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Minimum Order Amount (₹)
                </label>

                <input
                  type="number"
                  name="minOrderAmount"
                  value={form.minOrderAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* MAX DISCOUNT */}

              {form.discountType === "PERCENTAGE" && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Maximum Discount (₹)
                  </label>

                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={form.maxDiscountAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              )}

              {/* USAGE LIMIT */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Total Usage Limit
                </label>

                <input
                  type="number"
                  name="usageLimit"
                  value={form.usageLimit}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* PER CUSTOMER LIMIT */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Uses Per Customer *
                </label>

                <input
                  type="number"
                  name="perCustomerLimit"
                  value={form.perCustomerLimit}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* START DATE */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Start Date *
                </label>

                <input
                  type="datetime-local"
                  name="startsAt"
                  value={form.startsAt}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* EXPIRY DATE */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Expiry Date *
                </label>

                <input
                  type="datetime-local"
                  name="expiresAt"
                  value={form.expiresAt}
                  onChange={handleChange}
                  min={form.startsAt}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-7 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating Coupon..." : "+ Create Coupon"}
            </button>

          </form>
        </div>

        {/* COUPON LIST */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                All Coupons
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review and manage existing discount coupons.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchCoupons}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
              <p className="font-bold text-slate-700">
                No coupons created yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Create your first coupon using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">

                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-4">Coupon</th>
                    <th className="px-4 py-4">Discount</th>
                    <th className="px-4 py-4">Usage</th>
                    <th className="px-4 py-4">Expiry</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {coupons.map((coupon) => {
                    const expired =
                      new Date(coupon.expiresAt) <= new Date();

                    const active =
                      coupon.isActive && !expired;

                    return (
                      <tr
                        key={coupon._id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-5">
                          <p className="font-extrabold text-slate-900">
                            {coupon.code}
                          </p>

                          <p className="mt-1 max-w-48 text-xs text-slate-500">
                            {coupon.description || "No description"}
                          </p>
                        </td>

                        <td className="px-4 py-5 font-bold text-slate-800">
                          {coupon.discountType === "PERCENTAGE"
                            ? `${coupon.discountValue}%`
                            : `₹${coupon.discountValue}`}

                          {coupon.maxDiscountAmount !== null &&
                            coupon.discountType === "PERCENTAGE" && (
                              <p className="mt-1 text-xs font-normal text-slate-500">
                                Max ₹{coupon.maxDiscountAmount}
                              </p>
                            )}
                        </td>

                        <td className="px-4 py-5 text-slate-600">
                          <p>
                            Used: {coupon.usedCount || 0}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Reserved: {coupon.reservedCount || 0}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Limit: {coupon.usageLimit ?? "Unlimited"}
                          </p>
                        </td>

                        <td className="px-4 py-5 text-xs text-slate-600">
                          {formatDate(coupon.expiresAt)}
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {expired
                              ? "EXPIRED"
                              : coupon.isActive
                                ? "ACTIVE"
                                : "INACTIVE"}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          {!expired && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(coupon)}
                              disabled={updatingId === coupon._id}
                              className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${
                                coupon.isActive
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              {updatingId === coupon._id
                                ? "Updating..."
                                : coupon.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}