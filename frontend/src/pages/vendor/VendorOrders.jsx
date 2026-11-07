import { useEffect, useState } from "react";
import {
  getVendorOrders,
  updateOrderStatus,
} from "../../services/orderService";

const nextStatus = {
  PLACED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadOrders(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const response = await getVendorOrders();
      setOrders(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load orders"
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStatusUpdate(orderId, orderStatus) {
    try {
      setUpdatingId(orderId);
      setError("");

      await updateOrderStatus(orderId, orderStatus);

      await loadOrders(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update order status"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price || 0));

  const getOrderStyle = (status) => {
    const styles = {
      PLACED: "bg-blue-100 text-blue-700",
      PACKED: "bg-indigo-100 text-indigo-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getPaymentStyle = (status) => {
    const styles = {
      PAID: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      FAILED: "bg-red-100 text-red-700",
      CREATED: "bg-blue-100 text-blue-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  // Loading State

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
        <div className="h-10 w-64 rounded bg-slate-200" />

        <div className="mt-8 space-y-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8">

        {/* HEADER */}

        <section className="mb-8 rounded-2xl bg-gradient-to-r from-blue-950 to-blue-700 px-6 py-10 text-white sm:px-10">

          <p className="text-xs font-bold tracking-[2px] text-blue-200">
            MARKETLY SELLER CENTER
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Customer Orders
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
            Manage customer purchases, review shipping
            information and update order delivery progress.
          </p>

        </section>

        {/* ORDER SUMMARY */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              My Orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {orders.length} orders received
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrders()}
            className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            ↻ Refresh Orders
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* EMPTY STATE */}

        {orders.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">

            <span className="text-7xl">📦</span>

            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
              No Orders Received
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              Your customer orders will appear here when
              someone purchases your products.
            </p>

          </div>

        ) : (

          /* ORDERS LIST */

          <div className="space-y-6">

            {orders.map((order) => {
              const next = nextStatus[order.orderStatus];

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >

                  {/* ORDER HEADER */}

                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:px-7">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Order ID
                      </p>

                      <h3 className="mt-1 break-all text-sm font-extrabold text-slate-900">
                        #{order._id}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">

                      <span
                        className={`rounded-full px-4 py-2 text-xs font-bold ${getOrderStyle(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>

                      <span
                        className={`rounded-full px-4 py-2 text-xs font-bold ${getPaymentStyle(
                          order.paymentStatus
                        )}`}
                      >
                        PAYMENT {order.paymentStatus}
                      </span>

                    </div>

                  </div>

                  <div className="space-y-7 p-5 sm:p-7">

                    {/* ORDER AMOUNT */}

                    <div className="flex flex-wrap items-center justify-between gap-4">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Order Total
                        </p>

                        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                          {formatPrice(order.totalAmount)}
                        </h2>
                      </div>

                      <div className="rounded-xl bg-blue-50 px-5 py-3 text-right">
                        <p className="text-xs text-blue-500">
                          Products
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-blue-800">
                          {order.items?.length || 0}
                        </p>
                      </div>

                    </div>

                    {/* ORDER PRODUCTS */}

                    <div className="border-t border-slate-100 pt-6">

                      <h3 className="mb-4 text-base font-extrabold text-slate-900">
                        Order Items
                      </h3>

                      <div className="space-y-4">

                        {order.items?.map((item, index) => (

                          <div
                            key={item.productId || index}
                            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
                          >

                            <div className="flex items-center gap-4">

                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-2xl">
                                📦
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900">
                                  {item.productName}
                                </h4>

                                <p className="mt-1 text-xs text-slate-500">
                                  Price: {formatPrice(item.price)}
                                  {" "} × {item.quantity}
                                </p>
                              </div>

                            </div>

                            <div className="sm:text-right">
                              <p className="text-xs text-slate-400">
                                Subtotal
                              </p>

                              <p className="mt-1 font-extrabold text-slate-900">
                                {formatPrice(item.subtotal)}
                              </p>
                            </div>

                          </div>

                        ))}

                      </div>

                    </div>

                    {/* SHIPPING ADDRESS */}

                    <div className="border-t border-slate-100 pt-6">

                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl">
                          📍
                        </span>

                        <div>
                          <h3 className="font-extrabold text-slate-900">
                            Shipping Address
                          </h3>

                          <p className="text-xs text-slate-500">
                            Customer delivery information
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

                        <p className="font-bold text-slate-900">
                          {order.shippingAddress?.fullName}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          {order.shippingAddress?.phone}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {order.shippingAddress?.address}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {order.shippingAddress?.city},{" "}
                          {order.shippingAddress?.state}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          PIN Code: {order.shippingAddress?.pincode}
                        </p>

                      </div>

                    </div>

                    {/* ORDER TRACKING */}

                    <div className="border-t border-slate-100 pt-6">

                      <h3 className="mb-4 font-extrabold text-slate-900">
                        Order Progress
                      </h3>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                        {["PLACED", "PACKED", "SHIPPED", "DELIVERED"].map(
                          (status, index, steps) => {
                            const currentIndex = steps.indexOf(
                              order.orderStatus
                            );

                            const completed =
                              order.orderStatus !== "CANCELLED" &&
                              currentIndex >= index;

                            return (
                              <div
                                key={status}
                                className={`rounded-lg p-3 text-center ${
                                  completed
                                    ? "bg-green-50 text-green-700"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >

                                <p className="text-lg">
                                  {completed ? "✓" : index + 1}
                                </p>

                                <p className="mt-1 text-xs font-bold">
                                  {status}
                                </p>

                              </div>
                            );
                          }
                        )}

                      </div>

                    </div>

                    {/* STATUS UPDATE */}

                    <div className="border-t border-slate-100 pt-6">

                      {order.orderStatus === "CANCELLED" ? (

                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                          <p className="text-sm font-bold text-red-700">
                            This order has been cancelled.
                          </p>
                        </div>

                      ) : next ? (

                        <div className="flex flex-col justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center">

                          <div>
                            <h3 className="font-extrabold text-slate-900">
                              Next Order Action
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              Update this order to {next}.
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={updatingId === order._id}
                            onClick={() =>
                              handleStatusUpdate(order._id, next)
                            }
                            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId === order._id
                              ? "Updating..."
                              : `Mark as ${next} →`}
                          </button>

                        </div>

                      ) : (

                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                          <p className="text-sm font-bold text-green-700">
                            ✓ Order successfully delivered.
                          </p>
                        </div>

                      )}

                    </div>

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