import { useEffect, useState } from "react";
import { getAllOrdersAdmin } from "../../services/orderService";

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await getAllOrdersAdmin();
      setOrders(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load marketplace orders"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price || 0));

  const getId = (value) => {
    if (value && typeof value === "object") {
      return value._id || value.id || "N/A";
    }

    return value || "N/A";
  };

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

  // LOADING STATE

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10">
        <div className="h-36 rounded-2xl bg-slate-200" />

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
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">

        {/* HEADER */}

        <section className="rounded-2xl bg-gradient-to-r from-slate-950 to-blue-900 px-6 py-10 text-white sm:px-10">

          <p className="text-xs font-bold tracking-[2px] text-blue-200">
            MARKETLY ADMINISTRATION
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Manage Orders
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            Monitor customer purchases, review vendor orders
            and track order and payment statuses across the marketplace.
          </p>

        </section>

        {/* SUMMARY */}

        <div className="mb-7 mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Marketplace Orders
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
              {orders.length}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              All orders returned by the admin API
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Paid Orders
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-green-600">
              {
                orders.filter(
                  (order) => order.paymentStatus === "PAID"
                ).length
              }
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Orders with successful payment status
            </p>
          </div>

        </div>

        {/* SECTION HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              All Orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review orders placed across the marketplace.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            ↻ Refresh Orders
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            <span>⚠️ {error}</span>

            <button
              type="button"
              onClick={loadOrders}
              className="font-bold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}

        {orders.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">

            <span className="text-7xl">📦</span>

            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
              No Orders Found
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              Marketplace orders will appear here when customers
              purchase products from vendors.
            </p>

          </div>

        ) : (

          /* ORDERS LIST */

          <div className="space-y-6">

            {orders.map((order) => (

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

                <div className="space-y-6 p-5 sm:p-7">

                  {/* CUSTOMER AND VENDOR */}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Customer ID
                      </p>

                      <p className="mt-2 break-all text-sm font-bold text-slate-900">
                        {getId(order.customerId)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Vendor ID
                      </p>

                      <p className="mt-2 break-all text-sm font-bold text-slate-900">
                        {getId(order.vendorId)}
                      </p>
                    </div>

                  </div>

                  {/* ORDER TOTAL */}

                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-blue-50 p-5">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                        Total Order Amount
                      </p>

                      <h2 className="mt-2 text-2xl font-extrabold text-blue-950">
                        {formatPrice(order.totalAmount)}
                      </h2>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-blue-500">
                        Total Items
                      </p>

                      <p className="mt-2 text-2xl font-extrabold text-blue-950">
                        {order.items?.length || 0}
                      </p>
                    </div>

                  </div>

                  {/* ORDER ITEMS */}

                  <div className="border-t border-slate-100 pt-6">

                    <h3 className="mb-4 text-base font-extrabold text-slate-900">
                      Order Items
                    </h3>

                    <div className="space-y-3">

                      {order.items?.map((item, index) => (

                        <div
                          key={item.productId || index}
                          className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
                        >

                          <div className="flex items-center gap-4">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xl">
                              📦
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900">
                                {item.productName}
                              </h4>

                              <p className="mt-1 text-xs text-slate-500">
                                Quantity: {item.quantity}
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

                </div>

              </article>

            ))}

          </div>

        )}

      </div>
    </div>
  );
}