import { useEffect, useState } from "react";
import { getAllPaymentsAdmin } from "../../services/paymentService";

const formatINR = (paise) =>
  `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ManagePayments() {
  const [payments, setPayments] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalVendorEarnings, setTotalVendorEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const response = await getAllPaymentsAdmin();
      

      setPayments(response.data || []);
      setTotalSales(response.totalSales || 0);
      setTotalRevenue(response.totalRevenue || 0);
      setTotalVendorEarnings(response.totalVendorEarnings || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load payment records"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const getPaymentStyle = (status) => {
    const styles = {
      PAID: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      FAILED: "bg-red-100 text-red-700",
      CREATED: "bg-blue-100 text-blue-700",
      REFUNDED: "bg-purple-100 text-purple-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getId = (value) => {
    if (value && typeof value === "object") {
      return value._id || value.id || "N/A";
    }

    return value || "N/A";
  };

  // LOADING STATE

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10">
        <div className="h-36 rounded-2xl bg-slate-200" />

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 rounded-xl bg-slate-200"
            />
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-48 rounded-xl bg-slate-200"
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

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Manage Payments
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            Monitor successful customer payments, platform
            commission and calculated vendor earnings across
            the marketplace.
          </p>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            <span>⚠️ {error}</span>

            <button
              type="button"
              onClick={loadPayments}
              className="font-bold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* PAYMENT SUMMARY */}

        <div className="mb-9 mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

          {/* TOTAL SALES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                💰
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Sales
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-500">
              Total Sales
            </p>

            <h2 className="mt-2 break-words text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {formatINR(totalSales)}
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Total successful customer payments.
            </p>

          </div>

          {/* PLATFORM REVENUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                📈
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-green-600">
                Commission
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-500">
              Platform Revenue
            </p>

            <h2 className="mt-2 break-words text-2xl font-extrabold text-green-700 sm:text-3xl">
              {formatINR(totalRevenue)}
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Total platform commission from successful payments.
            </p>

          </div>

          {/* VENDOR EARNINGS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                🏪
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Vendors
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-500">
              Vendor Earnings
            </p>

            <h2 className="mt-2 break-words text-2xl font-extrabold text-purple-700 sm:text-3xl">
              {formatINR(totalVendorEarnings)}
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Calculated vendor share from successful payments.
            </p>

          </div>

        </div>

        {/* PAYMENT RECORDS HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Payment Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review individual marketplace transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPayments}
            className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            ↻ Refresh Payments
          </button>

        </div>

        {/* EMPTY STATE */}

        {payments.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">

            <span className="text-7xl">💳</span>

            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
              No Payment Records
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              Payment transactions will appear here when
              customers make purchases on the marketplace.
            </p>

          </div>

        ) : (

          /* PAYMENT LIST */

          <div className="space-y-5">

            {payments.map((payment) => (

              <article
                key={payment._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >

                {/* PAYMENT HEADER */}

                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:px-7">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Payment ID
                    </p>

                    <h3 className="mt-1 break-all text-sm font-extrabold text-slate-900">
                      #{payment._id}
                    </h3>
                  </div>

                  <span
                    className={`w-fit rounded-full px-4 py-2 text-xs font-bold ${getPaymentStyle(
                      payment.status
                    )}`}
                  >
                    {payment.status}
                  </span>

                </div>

                <div className="space-y-6 p-5 sm:p-7">

                  {/* AMOUNT */}

                  <div className="rounded-xl bg-blue-50 p-5">

                    <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                      Transaction Amount
                    </p>

                    <h2 className="mt-2 text-3xl font-extrabold text-blue-950">
                      {formatINR(payment.amount)}
                    </h2>

                    <p className="mt-2 text-xs text-blue-600">
                      Currency: {payment.currency || "INR"}
                    </p>

                  </div>

                  {/* TRANSACTION DETAILS */}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Order ID
                      </p>

                      <p className="mt-2 break-all text-sm font-bold text-slate-900">
                        {getId(payment.orderId)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Customer ID
                      </p>

                      <p className="mt-2 break-all text-sm font-bold text-slate-900">
                        {getId(payment.customerId)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Vendor ID
                      </p>

                      <p className="mt-2 break-all text-sm font-bold text-slate-900">
                        {getId(payment.vendorId)}
                      </p>
                    </div>

                  </div>

                  {/* PAYMENT BREAKDOWN */}

                  <div className="border-t border-slate-100 pt-6">

                    <h3 className="mb-4 font-extrabold text-slate-900">
                      Payment Breakdown
                    </h3>

                    <div className="space-y-3">

                      <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-4">
                        <span className="text-sm text-slate-600">
                          Total Payment
                        </span>

                        <span className="font-extrabold text-slate-900">
                          {formatINR(payment.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-lg bg-green-50 p-4">
                        <span className="text-sm text-green-700">
                          Platform Commission
                        </span>

                        <span className="font-extrabold text-green-700">
                          {formatINR(payment.platformCommission)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-lg bg-purple-50 p-4">
                        <span className="text-sm text-purple-700">
                          Vendor Share
                        </span>

                        <span className="font-extrabold text-purple-700">
                          {formatINR(payment.vendorAmount)}
                        </span>
                      </div>

                    </div>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

        {/* INFORMATION */}

        <section className="mt-9 rounded-xl border border-blue-100 bg-blue-50 p-5 sm:p-6">

          <div className="flex items-start gap-4">

            <span className="text-3xl">ℹ️</span>

            <div>
              <h3 className="font-extrabold text-slate-900">
                Payment Information
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Platform commission and vendor share are calculated
                amounts stored in payment records. They do not
                represent confirmation of an actual bank payout
                to the vendor.
              </p>
            </div>

          </div>

        </section>

      </div>
    </div>
  );
}