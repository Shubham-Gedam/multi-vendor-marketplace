import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAllOrdersAdmin } from "../../services/orderService";
import { getAllPaymentsAdmin } from "../../services/paymentService";
import { getAllCoupons } from "../../services/couponService";

const formatINR = (paise) =>
  `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatRupees = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getId = (value) => {
  if (value && typeof value === "object") {
    return value._id || value.id || "N/A";
  }

  return value || "N/A";
};

const dashboardItems = [
  {
    title: "Manage Vendors",
    description: "Review vendor applications and manage seller registrations.",
    link: "/admin/vendors",
    button: "Manage Vendors",
    icon: "🏪",
    color: "blue",
  },
  {
    title: "Manage Orders",
    description: "View customer orders and monitor order status.",
    link: "/admin/orders",
    button: "View Orders",
    icon: "📦",
    color: "purple",
  },
  {
    title: "Manage Payments",
    description: "Review payment records, commission and vendor earnings.",
    link: "/admin/payments",
    button: "View Payments",
    icon: "💳",
    color: "green",
  },
  {
    title: "Manage Coupons",
    description: "Create discount coupons and track coupon redemptions.",
    link: "/admin/coupons",
    button: "Manage Coupons",
    icon: "🎟️",
    color: "orange",
  },
];

const colorStyles = {
  blue: {
    icon: "bg-blue-100 text-blue-700",
    button: "bg-blue-600 hover:bg-blue-700",
    border: "hover:border-blue-300",
  },
  purple: {
    icon: "bg-purple-100 text-purple-700",
    button: "bg-purple-600 hover:bg-purple-700",
    border: "hover:border-purple-300",
  },
  green: {
    icon: "bg-green-100 text-green-700",
    button: "bg-green-600 hover:bg-green-700",
    border: "hover:border-green-300",
  },
  orange: {
    icon: "bg-orange-100 text-orange-700",
    button: "bg-orange-600 hover:bg-orange-700",
    border: "hover:border-orange-300",
  },
};

const orderStatuses = [
  {
    name: "PLACED",
    color: "bg-blue-500",
    text: "text-blue-700",
  },
  {
    name: "PACKED",
    color: "bg-indigo-500",
    text: "text-indigo-700",
  },
  {
    name: "SHIPPED",
    color: "bg-purple-500",
    text: "text-purple-700",
  },
  {
    name: "DELIVERED",
    color: "bg-green-500",
    text: "text-green-700",
  },
  {
    name: "CANCELLED",
    color: "bg-red-500",
    text: "text-red-700",
  },
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalVendorEarnings, setTotalVendorEarnings] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        ordersResponse,
        paymentsResponse,
        couponsResponse,
      ] = await Promise.all([
        getAllOrdersAdmin(),
        getAllPaymentsAdmin(),
        getAllCoupons({ page: 1, limit: 50 }),
      ]);

      setOrders(ordersResponse.data || []);
      setPayments(paymentsResponse.data || []);
      setCoupons(couponsResponse.data || []);

      setTotalSales(paymentsResponse.totalSales || 0);
      setTotalRevenue(paymentsResponse.totalRevenue || 0);
      setTotalVendorEarnings(
        paymentsResponse.totalVendorEarnings || 0
      );
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard analytics"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // Order statistics
  const totalOrders = orders.length;

  const paidOrders = orders.filter(
    (order) => order.paymentStatus === "PAID"
  ).length;

  const pendingOrders = orders.filter(
    (order) => order.paymentStatus === "PENDING"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.orderStatus === "CANCELLED"
  ).length;

  // Coupon statistics
  const activeCoupons = coupons.filter(
    (coupon) =>
      coupon.isActive &&
      new Date(coupon.expiresAt) > new Date()
  ).length;

  const totalRedemptions = coupons.reduce(
    (total, coupon) =>
      total + Number(coupon.usedCount || 0),
    0
  );

  // Vendor earnings from successful payments
  const vendorEarnings = Object.values(
    payments
      .filter((payment) => payment.status === "PAID")
      .reduce((result, payment) => {
        const vendorId = getId(payment.vendorId);

        if (!result[vendorId]) {
          result[vendorId] = {
            vendorId,
            earnings: 0,
            payments: 0,
          };
        }

        result[vendorId].earnings += Number(
          payment.vendorAmount || 0
        );

        result[vendorId].payments += 1;

        return result;
      }, {})
  )
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  // Recent orders
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 5);

  const metricCards = [
    {
      title: "Total Sales",
      value: formatINR(totalSales),
      description: "Successful customer payments",
      icon: "💰",
      color: "blue",
    },
    {
      title: "Platform Revenue",
      value: formatINR(totalRevenue),
      description: "Calculated marketplace commission",
      icon: "📈",
      color: "green",
    },
    {
      title: "Vendor Earnings",
      value: formatINR(totalVendorEarnings),
      description: "Calculated vendor share",
      icon: "🏪",
      color: "purple",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      description: "Vendor-specific orders created",
      icon: "📦",
      color: "orange",
    },
  ];

  const metricColors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10">
        <div className="h-40 rounded-2xl bg-slate-200" />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 rounded-xl bg-slate-200"
            />
          ))}
        </div>

        <div className="mt-8 h-80 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">

        {/* HEADER */}

        <section className="rounded-2xl bg-gradient-to-r from-slate-950 to-blue-900 px-6 py-10 text-white sm:px-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

            <div>
              <p className="text-xs font-bold tracking-[2px] text-blue-200">
                MARKETLY ADMINISTRATION
              </p>

              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Admin Analytics Dashboard
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Monitor marketplace sales, platform revenue,
                vendor earnings, orders and coupon performance
                from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="w-fit rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/20"
            >
              ↻ Refresh Analytics
            </button>

          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadDashboard}
              className="font-bold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* FINANCIAL ANALYTICS */}

        <div className="mb-8 mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${metricColors[item.color]}`}
                >
                  {item.icon}
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {item.title}
                </span>
              </div>

              <p className="mt-5 break-words text-2xl font-extrabold text-slate-900">
                {item.value}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* ORDER AND COUPON STATISTICS */}

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ORDER STATUS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">
              Order Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current order status distribution.
            </p>

            <div className="mt-6 space-y-5">
              {orderStatuses.map((status) => {
                const count = orders.filter(
                  (order) =>
                    order.orderStatus === status.name
                ).length;

                const percentage =
                  totalOrders > 0
                    ? (count / totalOrders) * 100
                    : 0;

                return (
                  <div key={status.name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className={`font-bold ${status.text}`}>
                        {status.name}
                      </span>

                      <span className="font-bold text-slate-700">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${status.color}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
              <div>
                <p className="text-xl font-extrabold text-green-700">
                  {paidOrders}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Paid Orders
                </p>
              </div>

              <div>
                <p className="text-xl font-extrabold text-yellow-600">
                  {pendingOrders}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Pending Payment
                </p>
              </div>

              <div>
                <p className="text-xl font-extrabold text-red-600">
                  {cancelledOrders}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Cancelled Orders
                </p>
              </div>
            </div>
          </section>

          {/* COUPON ANALYTICS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">
              Coupon Performance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Overview of available promotional coupons.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-orange-50 p-5">
                <p className="text-sm font-semibold text-orange-700">
                  Total Coupons
                </p>

                <p className="mt-2 text-3xl font-extrabold text-orange-800">
                  {coupons.length}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-5">
                <p className="text-sm font-semibold text-green-700">
                  Active Coupons
                </p>

                <p className="mt-2 text-3xl font-extrabold text-green-800">
                  {activeCoupons}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-5">
                <p className="text-sm font-semibold text-blue-700">
                  Successful Redemptions
                </p>

                <p className="mt-2 text-3xl font-extrabold text-blue-800">
                  {totalRedemptions}
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-5">
                <p className="text-sm font-semibold text-purple-700">
                  Pending Reservations
                </p>

                <p className="mt-2 text-3xl font-extrabold text-purple-800">
                  {coupons.reduce(
                    (total, coupon) =>
                      total + Number(coupon.reservedCount || 0),
                    0
                  )}
                </p>
              </div>
            </div>

            <Link
              to="/admin/coupons"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              Manage All Coupons →
            </Link>

          </section>
        </div>

        {/* VENDOR EARNINGS */}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              Top Vendors by Earnings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Calculated vendor shares from successful payments.
            </p>
          </div>

          {vendorEarnings.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No successful vendor payments available.
            </p>
          ) : (
            <div className="space-y-4">
              {vendorEarnings.map((vendor, index) => (
                <div
                  key={vendor.vendorId}
                  className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-extrabold text-purple-700">
                      {index + 1}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Vendor {vendor.vendorId.slice(-6)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {vendor.payments} successful payments
                      </p>
                    </div>
                  </div>

                  <p className="text-lg font-extrabold text-purple-700">
                    {formatINR(vendor.earnings)}
                  </p>
                </div>
              ))}
            </div>
          )}

        </section>

        {/* RECENT ORDERS */}

        <section className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest marketplace order activity.
              </p>
            </div>

            <Link
              to="/admin/orders"
              className="text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No orders available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Order ID</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Order Status</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-5 py-4 font-bold text-slate-800">
                        #{order._id.slice(-8)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {String(getId(order.customerId)).slice(-8)}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatRupees(order.totalAmount)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {order.orderStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            order.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>

        {/* MANAGEMENT NAVIGATION */}

        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-900">
            Marketplace Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage different marketplace operations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {dashboardItems.map((item) => {
            const styles = colorStyles[item.color];

            return (
              <div
                key={item.title}
                className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.border}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl ${styles.icon}`}
                  >
                    {item.icon}
                  </div>

                  <span className="text-2xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600">
                    →
                  </span>
                </div>

                <div className="mt-6 flex-1">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {item.description}
                  </p>
                </div>

                <Link
                  to={item.link}
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-bold text-white transition ${styles.button}`}
                >
                  {item.button}
                  <span>→</span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* PAYMENT INFORMATION */}

        <section className="mt-9 rounded-xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">ℹ️</span>

            <div>
              <h3 className="font-extrabold text-slate-900">
                Analytics Information
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Sales, platform revenue and vendor earnings are
                calculated from successful payment records.
                Vendor earnings shown here represent calculated
                shares, not confirmation of actual bank payouts.
                Coupon statistics include up to 50 coupons retrieved
                by the dashboard.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}