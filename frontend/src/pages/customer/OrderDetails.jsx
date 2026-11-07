import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getOrderById,
  cancelOrder,
  downloadInvoice,
} from "../../services/orderService";

export default function OrderDetails() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const response = await getOrderById(orderId);
      setOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load order details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function handleCancelOrder() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) return;

    try {
      setCancelLoading(true);
      setError("");

      await cancelOrder(orderId);
      await loadOrder();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel order");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleDownloadInvoice() {
    try {
      setInvoiceLoading(true);
      setError("");

      await downloadInvoice(orderId);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to download invoice");
    } finally {
      setInvoiceLoading(false);
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price || 0));

  const discountAmount = Number(order?.discountAmount || 0);

  const displaySubtotal =
    order?.subtotalAmount !== undefined &&
    order?.subtotalAmount !== null &&
    Number(order.subtotalAmount) > 0
      ? Number(order.subtotalAmount)
      : Number(order?.totalAmount || 0) + discountAmount;

  const getOrderStatusStyle = (status) => {
    const styles = {
      PLACED: "bg-blue-100 text-blue-700",
      PACKED: "bg-indigo-100 text-indigo-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getPaymentStatusStyle = (status) => {
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
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-12">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="mt-8 h-48 rounded-2xl bg-slate-200" />
        <div className="mt-6 h-60 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  // Error
  if (error && !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <span className="text-6xl">📦</span>

        <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
          Unable to Load Order
        </h2>

        <p className="mt-3 text-sm text-red-600">{error}</p>

        <Link
          to="/my-orders"
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* BREADCRUMB */}

        <Link
          to="/my-orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          ← Back to My Orders
        </Link>

        {/* PAGE HEADER */}

        <div className="mb-7 mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              ORDER INFORMATION
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Order Details
            </h1>

            <p className="mt-2 break-all text-sm text-slate-500">
              Order ID: {order._id}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${getOrderStatusStyle(
                order.orderStatus,
              )}`}
            >
              {order.orderStatus}
            </span>

            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${getPaymentStatusStyle(
                order.paymentStatus,
              )}`}
            >
              PAYMENT {order.paymentStatus}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ORDER SUMMARY */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Order Status
            </p>

            <h3 className="mt-3 text-xl font-extrabold text-slate-900">
              {order.orderStatus}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Payment Status
            </p>

            <h3 className="mt-3 text-xl font-extrabold text-slate-900">
              {order.paymentStatus}
            </h3>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Total Amount
            </p>

            <h3 className="mt-3 text-2xl font-extrabold text-blue-900">
              {formatPrice(order.totalAmount)}
            </h3>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          {/* LEFT CONTENT */}

          <div className="space-y-6">
            {/* PRODUCTS */}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Order Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {order.items?.length || 0} items in this order
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items?.map((item, index) => (
                  <div
                    key={item.productId || index}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                        📦
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          {item.productName}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          Price: {formatPrice(item.price)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Subtotal
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-slate-900">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SHIPPING ADDRESS */}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-2xl">
                  📍
                </span>

                <div>
                  <h2 className="font-extrabold text-slate-900">
                    Shipping Address
                  </h2>

                  <p className="text-xs text-slate-500">Delivery information</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-bold text-slate-900">
                  {order.shippingAddress?.fullName}
                </p>

                <p>{order.shippingAddress?.phone}</p>

                <p>{order.shippingAddress?.address}</p>

                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>

                <p>PIN Code: {order.shippingAddress?.pincode}</p>
              </div>
            </section>
          </div>

          {/* RIGHT SUMMARY */}

          <aside className="space-y-5">
            {/* ORDER TOTAL */}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">
                Order Summary
              </h2>

              <div className="mt-5 space-y-4 border-b border-slate-100 pb-5">
                <div className="flex justify-between gap-3 text-sm text-slate-600">
                  <span>Items</span>
                  <span>{order.items?.length || 0}</span>
                </div>

                {(order.couponCode || discountAmount > 0) && (
                  <>
                    <div className="flex justify-between gap-3 text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(displaySubtotal)}</span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm text-slate-600">
                      <span>Coupon Applied</span>
                      <span className="font-bold text-green-700">
                        {order.couponCode}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-green-700">Coupon Discount</span>

                      <span className="font-bold text-green-700">
                        -{formatPrice(discountAmount)}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between gap-3 text-sm text-slate-600">
                  <span>Payment Status</span>

                  <span className="font-semibold text-slate-800">
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-5">
                <span className="font-bold text-slate-900">Total Amount</span>

                <span className="text-xl font-extrabold text-blue-700">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
              {order.paymentStatus === "PAID" && (
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={invoiceLoading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {invoiceLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Generating Invoice...
                    </>
                  ) : (
                    <>
                      <span>📄</span>
                      Download Invoice PDF
                    </>
                  )}
                </button>
              )}
            </section>

            {/* ORDER TRACKING */}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">
                Order Tracking
              </h2>

              <div className="mt-6 space-y-5">
                {["PLACED", "PACKED", "SHIPPED", "DELIVERED"].map(
                  (status, index) => {
                    const steps = ["PLACED", "PACKED", "SHIPPED", "DELIVERED"];

                    const currentIndex = steps.indexOf(order.orderStatus);

                    const completed =
                      order.orderStatus !== "CANCELLED" &&
                      currentIndex >= index;

                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            completed
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {completed ? "✓" : index + 1}
                        </div>

                        <div>
                          <p
                            className={`text-sm font-bold ${
                              completed ? "text-green-700" : "text-slate-400"
                            }`}
                          >
                            {status}
                          </p>
                        </div>
                      </div>
                    );
                  },
                )}

                {order.orderStatus === "CANCELLED" && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">
                    This order has been cancelled.
                  </p>
                )}
              </div>
            </section>

            {/* CANCEL ORDER */}

            {order.orderStatus === "PLACED" &&
              order.paymentStatus === "PENDING" && (
                <section className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900">
                    Cancel This Order?
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    You can cancel this order while it is still in the placed
                    stage and payment is pending.
                  </p>

                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelLoading}
                    className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {cancelLoading ? "Cancelling..." : "Cancel Order"}
                  </button>
                </section>
              )}
          </aside>
        </div>

        {/* FOOTER LINK */}

        <div className="mt-9">
          <Link
            to="/my-orders"
            className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800"
          >
            ← Continue to My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
