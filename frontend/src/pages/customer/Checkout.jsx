import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createOrder, validateCoupon } from "../../services/orderService";
import {
  createCheckoutPayment,
  verifyCheckoutPayment,
} from "../../services/paymentService";
import loadRazorpay from "../../utils/loadRazorpay";

const initialAddress = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shippingAddress, setShippingAddress] = useState(initialAddress);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  function handleChange(e) {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  }

  function openRazorpay(paymentData) {
    return new Promise((resolve) => {
      let settled = false;

      function finish(result) {
        if (settled) return;
        settled = true;
        resolve(result);
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "Marketly Marketplace",
        description: "Product Order",
        order_id: paymentData.razorpayOrderId,

        prefill: {
          name: shippingAddress.fullName,
          email: user?.email || "",
          contact: shippingAddress.phone,
        },

        theme: {
          color: "#2563eb",
        },

        handler: async function (response) {
          try {
            await verifyCheckoutPayment(response);

            finish({
              success: true,
            });
          } catch (err) {
            finish({
              success: false,
              error:
                err.response?.data?.message || "Payment verification failed",
            });
          }
        },

        modal: {
          ondismiss: function () {
            finish({
              success: false,
              dismissed: true,
            });
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (response) {
        finish({
          success: false,
          error: response.error?.description || "Payment failed",
        });
      });

      checkout.open();
    });
  }

  async function handleCheckout(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      // Load Razorpay SDK
      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error("Unable to load Razorpay Checkout");
      }

      // Create separate vendor orders
      const orderResponse = await createOrder(
        shippingAddress,
        appliedCoupon?.coupon?.code || "",
      );

      const orders = orderResponse.data || [];
      const checkoutId = orderResponse.checkoutId;

      if (!orders.length || !checkoutId) {
        throw new Error("Unable to create checkout orders");
      }

      // Create ONE Razorpay payment for all vendor orders
      const paymentResponse = await createCheckoutPayment(checkoutId);

      const result = await openRazorpay(paymentResponse.data);

      if (!result.success) {
        if (result.dismissed) {
          setMessage("Payment cancelled. Your vendor orders remain pending.");
        } else {
          setError(result.error || "Payment failed");
        }

        return;
      }

      setMessage(
        `Payment successful! ${orders.length} vendor orders have been submitted.`,
      );

      navigate("/my-orders");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const response = await validateCoupon(couponCode);

      setAppliedCoupon(response.data);
      setCouponCode(response.data.coupon.code);
    } catch (err) {
      setAppliedCoupon(null);

      setCouponError(err.response?.data?.message || "Unable to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8">
        {/* HEADER */}

        <div className="mb-8">
          <p className="text-xs font-bold tracking-[2px] text-blue-600">
            MARKETLY SHOPPING
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Enter your delivery information to complete your purchase.
          </p>
        </div>

        {/* CHECKOUT LAYOUT */}

        <div className="grid items-start gap-7 lg:grid-cols-[1fr_340px]">
          {/* SHIPPING FORM */}

          <form
            onSubmit={handleCheckout}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            {/* SECTION HEADER */}

            <div className="mb-7 flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                📍
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Shipping Address
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Where should we deliver your order?
                </p>
              </div>
            </div>

            {/* FULL NAME */}

            <div className="mb-5">
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Full Name *
              </label>

              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={shippingAddress.fullName}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="name"
                className="mb-0 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            {/* PHONE */}

            <div className="mb-5">
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Phone Number *
              </label>

              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                value={shippingAddress.phone}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="tel"
                className="mb-0 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            {/* ADDRESS */}

            <div className="mb-5">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Full Address *
              </label>

              <textarea
                id="address"
                name="address"
                placeholder="House number, street, area and landmark"
                value={shippingAddress.address}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="street-address"
                rows={4}
                className="mb-0 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            {/* CITY AND STATE */}

            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  City *
                </label>

                <input
                  id="city"
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  value={shippingAddress.city}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="address-level2"
                  className="mb-0 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  State *
                </label>

                <input
                  id="state"
                  type="text"
                  name="state"
                  placeholder="Enter state"
                  value={shippingAddress.state}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="address-level1"
                  className="mb-0 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* PINCODE */}

            <div className="mb-7">
              <label
                htmlFor="pincode"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                PIN Code *
              </label>

              <input
                id="pincode"
                type="text"
                name="pincode"
                placeholder="Enter PIN code"
                value={shippingAddress.pincode}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="postal-code"
                className="mb-0 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 sm:max-w-xs"
              />
            </div>

            {/* ERROR MESSAGE */}

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                ⚠️ {error}
              </div>
            )}

            {/* SUCCESS / PENDING MESSAGE */}

            {message && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                {message}
              </div>
            )}

            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-yellow-400 py-4 text-base font-extrabold text-slate-950 shadow-md transition hover:bg-yellow-300 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-lg"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
                  Processing Your Order...
                </>
              ) : (
                "Place Order & Pay →"
              )}
            </button>

            <p className="mt-4 text-center text-xs text-slate-400">
              Your order will be created and payment will be processed through
              Razorpay.
            </p>
          </form>

          {/* RIGHT INFORMATION PANEL */}

          <aside className="space-y-5">
            {/* PAYMENT INFORMATION */}

            {/* COUPON SECTION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900">Apply Coupon</h3>

              <p className="mt-1 text-xs text-slate-500">
                Have a discount code? Apply it here.
              </p>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError("");
                  }}
                  placeholder="Enter coupon code"
                  disabled={loading || couponLoading || !!appliedCoupon}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                {!appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={loading || couponLoading}
                    className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {couponLoading ? "Applying..." : "Apply"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={loading}
                    className="rounded-lg border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>

              {couponError && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {couponError}
                </p>
              )}

              {appliedCoupon && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="font-bold text-green-700">
                    ✓ {appliedCoupon.coupon.code} applied successfully
                  </p>

                  <div className="mt-4 space-y-3 border-t border-green-200 pt-3 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Cart Subtotal</span>
                      <span>₹{appliedCoupon.subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between font-semibold text-green-700">
                      <span>Coupon Discount</span>
                      <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between border-t border-green-200 pt-3 font-extrabold text-slate-900">
                      <span>Final Payable</span>
                      <span>₹{appliedCoupon.payableAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-2xl">
                  💳
                </span>

                <div>
                  <h3 className="font-extrabold text-slate-900">
                    Secure Payment
                  </h3>

                  <p className="text-xs text-slate-500">Powered by Razorpay</p>
                </div>
              </div>

              <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <p className="text-sm text-slate-600">UPI Payments</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <p className="text-sm text-slate-600">
                    Debit and Credit Cards
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <p className="text-sm text-slate-600">Net Banking</p>
                </div>
              </div>
            </div>

            {/* ORDER INFORMATION */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <h3 className="font-extrabold text-slate-900">
                Before You Order
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💳</span>

                  <p className="text-xs leading-6 text-slate-600">
                    Pay once for all vendor orders through a single secure
                    Razorpay transaction.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">💳</span>

                  <p className="text-xs leading-6 text-slate-600">
                    Each vendor order will be paid separately through Razorpay.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">🚚</span>

                  <p className="text-xs leading-6 text-slate-600">
                    You can track your purchases from the My Orders section.
                  </p>
                </div>
              </div>
            </div>

            {/* SUPPORT */}

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>

                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Protected Checkout
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Payment verification is handled by the backend.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
