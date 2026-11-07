import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(formData);
      const role = response.user.role;

      if (role === "ADMIN") {
        navigate("/admin");
      } else if (role === "VENDOR") {
        navigate("/vendor");
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT BRANDING SECTION */}

        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-12 text-white lg:flex">

          <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full border-[40px] border-white/5" />

          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border-[40px] border-white/5" />

          {/* LOGO */}

          <Link
            to="/"
            className="relative z-10 flex items-center gap-3"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-2xl font-black text-slate-950">
              M
            </span>

            <span className="text-2xl font-extrabold tracking-tight">
              Marketly
            </span>
          </Link>

          {/* MAIN CONTENT */}

          <div className="relative z-10 max-w-lg">

            <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-200">
              Your Marketplace
            </span>

            <h1 className="mt-7 text-5xl font-extrabold leading-tight">
              Everything you need,
              <span className="text-yellow-400">
                {" "}all in one place.
              </span>
            </h1>

            <p className="mt-6 text-base leading-8 text-blue-100">
              Discover amazing products, shop from trusted
              vendors and enjoy a seamless shopping experience
              with Marketly.
            </p>

            {/* BENEFITS */}

            <div className="mt-10 space-y-5">

              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xl">
                  🛍️
                </span>

                <p className="text-sm font-medium text-blue-100">
                  Discover products from multiple vendors
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xl">
                  🔒
                </span>

                <p className="text-sm font-medium text-blue-100">
                  Secure account and payment experience
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xl">
                  🚚
                </span>

                <p className="text-sm font-medium text-blue-100">
                  Convenient order and delivery tracking
                </p>
              </div>

            </div>

          </div>

          <p className="relative z-10 text-xs text-blue-200">
            © {new Date().getFullYear()} Marketly. All rights reserved.
          </p>

        </div>

        {/* RIGHT LOGIN SECTION */}

        <div className="flex items-center justify-center px-4 py-10 sm:px-8">

          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}

            <Link
              to="/"
              className="mb-9 flex items-center justify-center gap-2 lg:hidden"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400 text-xl font-black text-slate-950">
                M
              </span>

              <span className="text-2xl font-extrabold text-slate-900">
                Marketly
              </span>
            </Link>

            {/* LOGIN CARD */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">

              <div className="mb-8">

                <p className="text-xs font-bold uppercase tracking-[2px] text-blue-600">
                  Welcome Back
                </p>

                <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
                  Login to your account
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Enter your credentials to access your
                  Marketly marketplace account.
                </p>

              </div>

              {/* ERROR MESSAGE */}

              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <span className="text-lg">⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-5 py-4 text-sm font-extrabold text-slate-950 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-800/30 border-t-slate-900" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login to Marketly
                      <span>→</span>
                    </>
                  )}
                </button>

              </form>

              {/* REGISTER LINK */}

              <div className="mt-8 border-t border-slate-100 pt-6 text-center">

                <p className="text-sm text-slate-500">
                  Don't have an account?{" "}

                  <Link
                    to="/register"
                    className="font-extrabold text-blue-600 transition hover:text-blue-800"
                  >
                    Create Account
                  </Link>
                </p>

              </div>

            </div>

            {/* FOOTER */}

            <p className="mt-7 text-center text-xs leading-6 text-slate-400">
              By continuing, you agree to use Marketly
              responsibly and securely.
            </p>

            <Link
              to="/"
              className="mt-4 block text-center text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              ← Back to Home
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}