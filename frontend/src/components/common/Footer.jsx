import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="mt-16 bg-slate-950 text-white">

      {/* BACK TO TOP */}

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-full bg-slate-800 py-4 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Back to Top ↑
      </button>

      {/* MAIN FOOTER */}

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">

        {/* BRAND */}

        <div>
          <Link to="/" className="inline-block text-3xl font-extrabold">
            Market<span className="text-yellow-400">ly</span>
          </Link>

          <p className="mt-5 text-sm leading-7 text-slate-400">
            Welcome to Marketly, your one-stop multi-vendor
            marketplace. Discover amazing products, explore
            different categories and shop from multiple
            trusted vendors in one convenient place.
          </p>

          <div className="mt-6">
            <p className="text-sm font-bold text-white">
              Shop More. Discover More.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Your marketplace, your choice.
            </p>
          </div>
        </div>

        {/* QUICK LINKS */}

        <div>
          <h3 className="mb-6 text-lg font-bold text-white">
            Quick Links
          </h3>

          <div className="flex flex-col gap-4 text-sm text-slate-400">
            <Link to="/" className="transition hover:text-yellow-400">
              Home
            </Link>

            <Link to="/products" className="transition hover:text-yellow-400">
              Explore Products
            </Link>

            <Link to="/products" className="transition hover:text-yellow-400">
              Shop by Category
            </Link>

            {!user && (
              <>
                <Link to="/login" className="transition hover:text-yellow-400">
                  Login
                </Link>

                <Link to="/register" className="transition hover:text-yellow-400">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* CUSTOMER SECTION */}

        <div>
          <h3 className="mb-6 text-lg font-bold text-white">
            Customer Section
          </h3>

          <div className="flex flex-col gap-4 text-sm text-slate-400">

            {user?.role === "CUSTOMER" ? (
              <>
                <Link to="/cart" className="transition hover:text-yellow-400">
                  My Shopping Cart
                </Link>

                <Link to="/my-orders" className="transition hover:text-yellow-400">
                  My Orders
                </Link>

                <Link to="/vendor/apply" className="transition hover:text-yellow-400">
                  Become a Vendor
                </Link>
              </>
            ) : (
              <>
                <Link to="/products" className="transition hover:text-yellow-400">
                  Browse Products
                </Link>

                <Link to="/login" className="transition hover:text-yellow-400">
                  Manage Your Account
                </Link>
              </>
            )}

            <Link to="/products" className="transition hover:text-yellow-400">
              Discover New Products
            </Link>
          </div>
        </div>

        {/* SELLER SECTION */}

        <div>
          <h3 className="mb-6 text-lg font-bold text-white">
            Sell With Marketly
          </h3>

          <p className="mb-5 text-sm leading-7 text-slate-400">
            Grow your business by listing your products
            on our multi-vendor marketplace and reach
            more potential customers.
          </p>

          <Link
            to={
              user?.role === "VENDOR"
                ? "/vendor"
                : user?.role === "CUSTOMER"
                ? "/vendor/apply"
                : "/register"
            }
            className="inline-block rounded-lg bg-yellow-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-yellow-300"
          >
            {user?.role === "VENDOR"
              ? "Vendor Dashboard →"
              : "Start Selling →"}
          </Link>

        </div>

      </div>

      {/* FEATURES STRIP */}

      <div className="border-y border-slate-800 bg-slate-900">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-3 lg:px-12">

          <div className="flex items-center gap-4">
            <span className="text-3xl">🛒</span>
            <div>
              <h4 className="text-sm font-bold text-white">
                Easy Shopping
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Explore multiple vendors in one place.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl">💳</span>
            <div>
              <h4 className="text-sm font-bold text-white">
                Secure Checkout
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Convenient Razorpay payment experience.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl">📦</span>
            <div>
              <h4 className="text-sm font-bold text-white">
                Order Tracking
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Track your purchases and order status.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* PAYMENT METHODS */}

      <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-5 px-6 py-8 sm:flex-row lg:px-12">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Payment Methods
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            {["UPI", "Cards", "Net Banking", "Razorpay"].map((method) => (
              <span
                key={method}
                className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center sm:text-right">
          <p className="text-sm font-semibold text-white">
            Marketly Marketplace
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Built for customers and vendors.
          </p>
        </div>

      </div>

      {/* COPYRIGHT */}

      <div className="border-t border-slate-800 px-5 py-6 text-center">
        <Link
          to="/"
          className="text-lg font-extrabold text-white"
        >
          Market<span className="text-yellow-400">ly</span>
        </Link>

        <p className="mt-3 text-xs text-slate-500">
          © {new Date().getFullYear()} Marketly. All rights reserved.
        </p>

        <p className="mt-2 text-xs text-slate-600">
          Your one-stop multi-vendor shopping destination.
        </p>
      </div>

    </footer>
  );
}