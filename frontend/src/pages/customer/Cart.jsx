import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCart,
  updateCartQuantity,
  removeFromCart,
} from "../../services/cartService";
import { getProductById } from "../../services/productService";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  async function loadCart(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const cartResponse = await getCart();
      const cartItems = cartResponse.data || [];

      const detailedItems = await Promise.all(
        cartItems.map(async (item) => {
          const response = await getProductById(item.productId);

          return {
            ...item,
            product: response.data,
          };
        })
      );

      setItems(detailedItems);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load cart"
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleQuantityChange(productId, quantity) {
    try {
      setUpdatingId(productId);

      await updateCartQuantity(productId, quantity);

      await loadCart(false);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to update quantity"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(productId) {
    try {
      setRemovingId(productId);

      await removeFromCart(productId);

      await loadCart(false);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to remove product"
      );
    } finally {
      setRemovingId(null);
    }
  }

  const subtotal = items.reduce(
    (total, item) =>
      total + Number(item.product.price) * item.quantity,
    0
  );

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price || 0));

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
        <div className="h-9 w-64 rounded bg-slate-200" />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-44 rounded-xl bg-slate-200"
              />
            ))}
          </div>

          <div className="h-64 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <span className="text-6xl">⚠️</span>

        <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
          Unable to Load Cart
        </h2>

        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() => loadCart()}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-[65vh] bg-slate-50 px-4 py-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-50 text-6xl">
            🛒
          </div>

          <h1 className="mt-7 text-3xl font-extrabold text-slate-900">
            Your Cart is Empty
          </h1>

          <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
            Looks like you haven't added anything to your cart yet.
            Explore our marketplace and discover something you love.
          </p>

          <Link
            to="/products"
            className="mt-7 rounded-lg bg-yellow-400 px-8 py-3.5 font-bold text-slate-950 transition hover:bg-yellow-300"
          >
            Start Shopping →
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-950 to-blue-700 px-6 py-9 text-white sm:px-10">

          <p className="text-xs font-bold tracking-[2px] text-blue-200">
            YOUR MARKETLY SHOPPING
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            My Shopping Cart
          </h1>

          <p className="mt-3 text-sm text-blue-100">
            Review your items before proceeding to checkout.
          </p>

        </div>

        {/* CART HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">

          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Shopping Cart
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {totalItems} items in your cart
            </p>
          </div>

          <Link
            to="/products"
            className="text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            ← Continue Shopping
          </Link>

        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* MAIN CART LAYOUT */}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">

          {/* CART ITEMS */}

          <div className="space-y-4">

            {items.map((item) => (

              <div
                key={item.productId}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >

                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">

                  {/* PRODUCT IMAGE */}

                  <Link
                    to={`/products/${item.productId}`}
                    className="flex h-40 w-full shrink-0 items-center justify-center rounded-xl bg-slate-50 p-4 sm:h-32 sm:w-32"
                  >

                    {item.product.images?.length > 0 ? (

                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-contain"
                      />

                    ) : (

                      <span className="text-5xl">📦</span>

                    )}

                  </Link>

                  {/* PRODUCT INFORMATION */}

                  <div className="min-w-0 flex-1">

                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      {item.product.brand || item.product.category}
                    </p>

                    <Link
                      to={`/products/${item.productId}`}
                      className="mt-2 block text-lg font-extrabold text-slate-900 transition hover:text-blue-600"
                    >
                      {item.product.name}
                    </Link>

                    <p className="mt-2 text-xl font-extrabold text-slate-900">
                      {formatPrice(item.product.price)}
                    </p>

                    <p className="mt-2 text-xs font-semibold text-green-600">
                      {item.product.stock > 0
                        ? `${item.product.stock} units available`
                        : "Out of Stock"}
                    </p>

                    {/* QUANTITY AND REMOVE */}

                    <div className="mt-5 flex flex-wrap items-center gap-4">

                      <div className="flex items-center overflow-hidden rounded-lg border border-slate-300">

                        <button
                          type="button"
                          disabled={
                            updatingId === item.productId ||
                            removingId === item.productId ||
                            item.quantity <= 1
                          }
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          className="h-10 w-10 bg-slate-50 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                        >
                          −
                        </button>

                        <span className="flex h-10 min-w-12 items-center justify-center border-x border-slate-300 px-3 text-sm font-bold text-slate-900">
                          {updatingId === item.productId
                            ? "..."
                            : item.quantity}
                        </span>

                        <button
                          type="button"
                          disabled={
                            updatingId === item.productId ||
                            removingId === item.productId ||
                            item.quantity >= item.product.stock
                          }
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          className="h-10 w-10 bg-slate-50 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                        >
                          +
                        </button>

                      </div>

                      <button
                        type="button"
                        disabled={removingId === item.productId}
                        onClick={() => handleRemove(item.productId)}
                        className="text-sm font-bold text-red-500 transition hover:text-red-700 disabled:opacity-50"
                      >
                        {removingId === item.productId
                          ? "Removing..."
                          : "Remove"}
                      </button>

                    </div>

                  </div>

                  {/* ITEM SUBTOTAL */}

                  <div className="border-t border-slate-100 pt-4 sm:min-w-32 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Item Total
                    </p>

                    <p className="mt-2 text-xl font-extrabold text-blue-700">
                      {formatPrice(
                        item.product.price * item.quantity
                      )}
                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>

          {/* ORDER SUMMARY */}

          <aside className="space-y-5">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-extrabold text-slate-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 border-b border-slate-100 pb-5">

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Items</span>
                  <span className="font-semibold text-slate-900">
                    {totalItems}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Products</span>
                  <span className="font-semibold text-slate-900">
                    {items.length}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Delivery</span>
                  <span className="font-semibold text-green-600">
                    Calculated at checkout
                  </span>
                </div>

              </div>

              <div className="mt-5 flex justify-between gap-3">
                <span className="font-bold text-slate-900">
                  Subtotal
                </span>

                <span className="text-xl font-extrabold text-slate-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Final vendor-wise order totals are calculated during checkout.
              </p>

              <Link
                to="/checkout"
                className="mt-7 block w-full rounded-xl bg-yellow-400 py-4 text-center font-extrabold text-slate-950 shadow-sm transition hover:bg-yellow-300 hover:shadow-md"
              >
                Proceed to Checkout →
              </Link>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>🔒</span>
                Secure Razorpay Checkout
              </div>

            </div>

            {/* SHOPPING BENEFITS */}

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">

              <h3 className="font-bold text-slate-900">
                Shop With Confidence
              </h3>

              <div className="mt-4 space-y-4">

                <div className="flex items-center gap-3">
                  <span className="text-xl">🛍️</span>
                  <p className="text-xs text-slate-600">
                    Multiple trusted vendors
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <p className="text-xs text-slate-600">
                    Secure payment verification
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xl">📦</span>
                  <p className="text-xs text-slate-600">
                    Track your orders
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