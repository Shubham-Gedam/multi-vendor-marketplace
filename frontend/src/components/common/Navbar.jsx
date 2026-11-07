import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const closeMenu = () => setMobileMenu(false);

  // Sync search with URL
  useEffect(() => {
    setSearchQuery(
      new URLSearchParams(location.search).get("search") || ""
    );
  }, [location.search]);

  // Close profile dropdown on navigation
  useEffect(() => {
    setProfileOpen(false);
    setLogoutError("");
  }, [location.pathname]);

  // Search
  function handleSearch(e) {
    e.preventDefault();

    const query = searchQuery.trim();

    navigate(
      query
        ? `/products?search=${encodeURIComponent(query)}`
        : "/products"
    );

    closeMenu();
  }

  // Logout
  async function handleLogout() {
    try {
      setLogoutLoading(true);
      setLogoutError("");

      await logout();

      setProfileOpen(false);
      setMobileMenu(false);

      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(
        error.response?.data?.message ||
          "Logout failed. Please try again."
      );
    } finally {
      setLogoutLoading(false);
    }
  }

  // Role-based navigation
  const navLinks = [
    { label: "Home", to: "/", icon: "⌂" },
    { label: "Shop All", to: "/products", icon: "▦" },
  ];

  if (user?.role === "CUSTOMER") {
    navLinks.push(
      { label: "My Cart", to: "/cart", icon: "🛒" },
      { label: "My Orders", to: "/my-orders", icon: "▤" },
      { label: "Become a Vendor", to: "/vendor/apply", icon: "♧" }
    );
  }

  if (user?.role === "VENDOR") {
    navLinks.push(
      { label: "Dashboard", to: "/vendor", icon: "▦" },
      { label: "My Products", to: "/vendor/products", icon: "□" },
      { label: "Add Product", to: "/vendor/products/add", icon: "＋" },
      { label: "Orders", to: "/vendor/orders", icon: "▤" }
    );
  }

  if (user?.role === "ADMIN") {
    navLinks.push(
      { label: "Admin Dashboard", to: "/admin", icon: "▦" },
      { label: "Manage Vendors", to: "/admin/vendors", icon: "♙" },
      { label: "Manage Orders", to: "/admin/orders", icon: "▤" },
      { label: "Payments", to: "/admin/payments", icon: "₹" }
    );
  }

  function getLinkStyle(path) {
    const active =
      path === "/"
        ? location.pathname === "/"
        : location.pathname === path ||
          location.pathname.startsWith(`${path}/`);

    return active
      ? "border-b-2 border-amber-400 bg-white/10 text-white"
      : "border-b-2 border-transparent text-slate-300 hover:bg-white/10 hover:text-white hover:border-slate-400";
  }

  const profileName = user?.name || "User";
  const profileInitial = profileName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">

      {/* MAIN HEADER */}

      <div className="bg-[#131921] text-white">

        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">

          {/* LOGO */}

          <Link
            to="/"
            onClick={closeMenu}
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-2xl font-black text-slate-950">
              M
            </span>

            <span className="text-2xl font-extrabold tracking-tight">
              Market<span className="text-amber-400">ly</span>
            </span>
          </Link>

          {/* DESKTOP SEARCH */}

          <form
            onSubmit={handleSearch}
            className="mx-auto hidden max-w-2xl flex-1 lg:block"
          >
            <div className="flex h-11 overflow-hidden rounded-lg bg-white transition focus-within:ring-2 focus-within:ring-amber-400">

              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands and categories..."
                aria-label="Search products"
                className="min-w-0 flex-1 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                aria-label="Search"
                className="flex w-14 shrink-0 items-center justify-center bg-amber-400 text-xl text-slate-950 transition hover:bg-amber-300"
              >
                ⌕
              </button>

            </div>
          </form>

          {/* DESKTOP ACCOUNT */}

          <div className="ml-auto hidden shrink-0 items-center gap-3 lg:flex">

            {user ? (

              <div className="relative">

                {/* PROFILE TRIGGER */}

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((prev) => !prev);
                    setLogoutError("");
                  }}
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                    profileOpen
                      ? "border-amber-400 bg-white/10"
                      : "border-transparent hover:border-white/20 hover:bg-white/10"
                  }`}
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-sm font-extrabold text-white shadow">
                    {profileInitial}
                  </div>

                  <div className="text-left leading-tight">
                    <p className="text-[11px] text-slate-300">
                      Hello, {profileName.split(" ")[0]}
                    </p>

                    <p className="mt-1 text-xs font-bold text-white">
                      My Account
                    </p>
                  </div>

                  <span className="text-xs text-slate-300">
                    {profileOpen ? "▲" : "▼"}
                  </span>

                </button>

                {/* PROFILE DROPDOWN */}

                {profileOpen && (

                  <div className="absolute right-0 top-full z-[60] mt-3 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">

                    {/* USER DETAILS */}

                    <div className="border-b border-slate-100 bg-slate-50 p-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-lg font-extrabold text-white">
                          {profileInitial}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900">
                            {profileName}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {user.email}
                          </p>

                          <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-blue-700">
                            {user.role}
                          </span>
                        </div>

                      </div>

                    </div>

                    {/* PROFILE LINKS */}

                    <div className="p-2">

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span className="text-lg">👤</span>
                        My Profile
                      </Link>

                      {user.role === "CUSTOMER" && (
                        <>
                          <Link
                            to="/my-orders"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <span className="text-lg">📦</span>
                            My Orders
                          </Link>

                          <Link
                            to="/cart"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <span className="text-lg">🛒</span>
                            My Cart
                          </Link>
                        </>
                      )}

                      {user.role === "VENDOR" && (
                        <Link
                          to="/vendor"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <span className="text-lg">🏪</span>
                          Seller Dashboard
                        </Link>
                      )}

                      {user.role === "ADMIN" && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <span className="text-lg">🛡️</span>
                          Admin Dashboard
                        </Link>
                      )}

                    </div>

                    {/* LOGOUT */}

                    <div className="border-t border-slate-100 p-3">

                      {logoutError && (
                        <p className="mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">
                          {logoutError}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {logoutLoading ? (
                          "Logging out..."
                        ) : (
                          <>
                            <span>↪</span>
                            Logout
                          </>
                        )}
                      </button>

                    </div>

                  </div>

                )}

              </div>

            ) : (

              <div className="flex items-center gap-4">

                <Link
                  to="/login"
                  className="leading-tight transition hover:text-amber-300"
                >
                  <p className="text-[11px] text-slate-300">
                    Welcome
                  </p>

                  <p className="text-sm font-bold">
                    Sign In
                  </p>
                </Link>

                <Link
                  to="/register"
                  className="rounded-md bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition hover:bg-amber-300"
                >
                  Create Account
                </Link>

              </div>

            )}

          </div>

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            onClick={() => setMobileMenu((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenu}
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 text-xl text-white transition hover:bg-white/10 lg:hidden"
          >
            {mobileMenu ? "✕" : "☰"}
          </button>

        </div>

      </div>

      {/* MOBILE SEARCH */}

      <div className="bg-[#131921] px-4 pb-3 lg:hidden">

        <form onSubmit={handleSearch} className="mx-auto max-w-3xl">

          <div className="flex h-10 overflow-hidden rounded-lg bg-white focus-within:ring-2 focus-within:ring-amber-400">

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products and categories..."
              aria-label="Search products"
              className="min-w-0 flex-1 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              aria-label="Search"
              className="w-12 shrink-0 bg-amber-400 text-xl text-slate-950 hover:bg-amber-300"
            >
              ⌕
            </button>

          </div>

        </form>

      </div>

      {/* SECONDARY NAVIGATION */}

      <nav className="hidden border-b border-slate-700 bg-[#232f3e] lg:block">

        <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">

          <span className="mr-3 shrink-0 text-xs font-bold text-amber-400">
            EXPLORE
          </span>

          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-semibold transition ${getLinkStyle(
                link.to
              )}`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}

        </div>

      </nav>

      {/* MOBILE MENU */}

      {mobileMenu && (

        <div className="border-t border-slate-700 bg-[#1c2733] px-4 py-4 shadow-xl lg:hidden">

          {/* MOBILE USER PROFILE */}

          {user && (

            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">

              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {profileInitial}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {profileName}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {user.role} Account
                  </p>
                </div>

                <span className="text-xs text-slate-400">
                  View Profile →
                </span>

              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="mt-4 w-full rounded-lg border border-red-400/20 bg-red-500/10 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
              >
                {logoutLoading ? "Logging out..." : "↪ Logout"}
              </button>

              {logoutError && (
                <p className="mt-2 text-xs text-red-300">
                  {logoutError}
                </p>
              )}

            </div>

          )}

          {/* NAVIGATION LINKS */}

          <div className="grid grid-cols-1 gap-1">

            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  location.pathname === link.to
                    ? "bg-white/10 text-amber-400"
                    : "text-slate-200 hover:bg-white/10 hover:text-amber-400"
                }`}
              >
                <span className="w-6 text-center">
                  {link.icon}
                </span>

                {link.label}
              </Link>
            ))}

          </div>

          {/* GUEST AUTH LINKS */}

          {!user && (

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">

              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-lg border border-white/20 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="rounded-lg bg-amber-400 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-amber-300"
              >
                Register
              </Link>

            </div>

          )}

        </div>

      )}

    </header>
  );
}