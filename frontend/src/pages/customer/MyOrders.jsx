import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../../services/orderService";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);

        const response = await getMyOrders();
        setOrders(response.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load orders"
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

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
      CREATED: "bg-blue-100 text-blue-700",
      FAILED: "bg-red-100 text-red-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  // Loading
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
        <div className="h-9 w-56 rounded bg-slate-200" />

        <div className="mt-8 space-y-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-48 rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-5 text-center">
        <span className="text-6xl">⚠️</span>

        <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
          Unable to Load Orders
        </h2>

        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-950 to-blue-700 px-6 py-9 text-white sm:px-10">

          <p className="text-xs font-bold tracking-[2px] text-blue-200">
            YOUR MARKETLY ACCOUNT
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            My Orders
          </h1>

          <p className="mt-3 text-sm text-blue-100">
            View your purchases and track your orders.
          </p>

        </div>

        {/* ORDER COUNT */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">

          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Order History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {orders.length} orders found in your account
            </p>
          </div>

          <Link
            to="/products"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Continue Shopping →
          </Link>

        </div>

        {/* EMPTY STATE */}

        {orders.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">

            <span className="text-7xl">🛍️</span>

            <h2 className="mt-6 text-2xl font-extrabold text-slate-900">
              No Orders Yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              You haven't placed any orders yet.
              Explore our marketplace and discover products
              you would love to purchase.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-block rounded-lg bg-yellow-400 px-7 py-3 font-bold text-slate-950 transition hover:bg-yellow-300"
            >
              Start Shopping
            </Link>

          </div>

        ) : (

          /* ORDER LIST */

          <div className="space-y-5">

            {orders.map((order) => (

              <div
                key={order._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >

                {/* ORDER HEADER */}

                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:px-7">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Order ID
                    </p>

                    <h3 className="mt-1 break-all text-sm font-bold text-slate-800">
                      #{order._id}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">

                    <span
                      className={`rounded-full px-3 py-2 text-xs font-bold ${getOrderStyle(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus}
                    </span>

                    <span
                      className={`rounded-full px-3 py-2 text-xs font-bold ${getPaymentStyle(
                        order.paymentStatus
                      )}`}
                    >
                      PAYMENT {order.paymentStatus}
                    </span>

                  </div>

                </div>

                {/* ORDER BODY */}

                <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7">

                  <div>

                    {/* PRODUCTS */}

                    <div className="flex items-start gap-4">

                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                        📦
                      </div>

                      <div>

                        <p className="font-bold text-slate-900">
                          {order.items?.length || 0} Products
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          {order.items
                            ?.map((item) => item.productName)
                            .join(", ")}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {order.items?.reduce(
                            (total, item) =>
                              total + Number(item.quantity || 0),
                            0
                          )}{" "}
                          Total Units
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* AMOUNT AND BUTTON */}

                  <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:min-w-[190px] sm:items-end sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">

                    <div className="sm:text-right">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Total Amount
                      </p>

                      <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                        {formatPrice(order.totalAmount)}
                      </h3>

                    </div>

                    <Link
                      to={`/orders/${order._id}`}
                      className="block rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      View Details →
                    </Link>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* BOTTOM INFO */}

        {orders.length > 0 && (
          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-5">

            <div className="flex items-start gap-3">
              <span className="text-2xl">📦</span>

              <div>
                <h3 className="font-bold text-slate-800">
                  Track Your Orders
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Open any order to view its details, payment
                  information, shipping address and delivery
                  progress.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}