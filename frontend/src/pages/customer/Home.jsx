import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProducts } from "../../services/productService";

export default function Home() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await getProducts({
          limit: 8,
          sortBy: "createdAt",
          order: "desc",
        });

        setProducts(response.data || []);
      } catch (err) {
        setError("Unable to load products.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = [
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const getCategoryIcon = (category) => {
    const name = category.toLowerCase();

    if (name.includes("elect")) return "⚡";
    if (name.includes("fashion") || name.includes("cloth")) return "👕";
    if (name.includes("book")) return "📚";
    if (name.includes("home")) return "🏠";
    if (name.includes("beauty")) return "✨";

    return "🛍️";
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HERO SECTION */}

      <section className="relative mx-auto mt-4 max-w-[1440px] overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-700 px-6 py-14 text-white sm:px-12 lg:px-20 lg:py-20">

        <div className="grid items-center gap-12 md:grid-cols-2">

          <div className="relative z-10">

            <span className="inline-block rounded-full border border-blue-300/30 bg-white/10 px-4 py-2 text-xs font-bold tracking-[2px] text-blue-200">
              WELCOME TO MULTIVENDOR
            </span>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Discover More.
              <br />
              Shop Your Way.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-blue-100 sm:text-lg">
              Explore amazing products from multiple vendors.
              Find what you love, compare products and shop
              everything in one marketplace.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">

              <Link
                to="/products"
                className="rounded-lg bg-yellow-400 px-7 py-3.5 font-bold text-slate-950 shadow-lg transition hover:bg-yellow-300"
              >
                Shop Now →
              </Link>

              {!user && (
                <Link
                  to="/register"
                  className="rounded-lg border border-white/40 bg-white/10 px-7 py-3.5 font-semibold text-white transition hover:bg-white/20"
                >
                  Create Account
                </Link>
              )}

              {user?.role === "CUSTOMER" && (
                <Link
                  to="/vendor/apply"
                  className="rounded-lg border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/20"
                >
                  Become a Vendor
                </Link>
              )}

              {user?.role === "VENDOR" && (
                <Link
                  to="/vendor"
                  className="rounded-lg border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/20"
                >
                  Vendor Dashboard
                </Link>
              )}

            </div>
          </div>

          {/* HERO ART */}

          <div className="relative flex min-h-[280px] items-center justify-center">

            <div className="absolute h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="relative flex h-64 w-64 flex-col items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md sm:h-72 sm:w-72">

              <span className="text-8xl">🛍️</span>

              <p className="mt-5 font-bold tracking-wide text-blue-100">
                Discover Your Favourites
              </p>

            </div>

            <div className="absolute right-0 top-5 rounded-xl bg-white px-4 py-3 text-slate-800 shadow-xl sm:right-4">
              <p className="text-sm font-bold">✨ Explore</p>
              <p className="text-xs text-slate-500">New Products</p>
            </div>

            <div className="absolute bottom-5 left-0 rounded-xl bg-white px-4 py-3 text-slate-800 shadow-xl sm:left-4">
              <p className="text-sm font-bold">📦 Shop</p>
              <p className="text-xs text-slate-500">Multiple Vendors</p>
            </div>

          </div>

        </div>
      </section>

      {/* BENEFITS SECTION */}

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6">

        {[
          {
            icon: "🛒",
            title: "Easy Shopping",
            desc: "Discover multiple products in one place.",
          },
          {
            icon: "💳",
            title: "Secure Checkout",
            desc: "Convenient online payment experience.",
          },
          {
            icon: "📦",
            title: "Order Tracking",
            desc: "Track your order from placed to delivered.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-3xl">
              {item.icon}
            </div>

            <div>
              <h3 className="font-bold text-slate-800">
                {item.title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {item.desc}
              </p>
            </div>
          </div>
        ))}

      </section>

      {/* CATEGORY SECTION */}

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">

        <div className="mb-7 flex items-end justify-between gap-4">

          <div>
            <p className="text-xs font-bold tracking-widest text-blue-600">
              EXPLORE OUR COLLECTION
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Shop by Category
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Discover products that match your interests.
            </p>
          </div>

          <Link
            to="/products"
            className="shrink-0 text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            View All →
          </Link>

        </div>

        {categories.length > 0 ? (

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

            {categories.map((category) => (

              <Link
                key={category}
                to="/products"
                className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
              >

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl transition group-hover:bg-blue-100">
                  {getCategoryIcon(category)}
                </div>

                <h3 className="mt-4 font-bold text-slate-800">
                  {category}
                </h3>

                <span className="mt-2 text-xs font-semibold text-blue-600">
                  Explore Products →
                </span>

              </Link>

            ))}

          </div>

        ) : (

          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Categories will appear when products are available.
          </p>

        )}

      </section>

      {/* FEATURED PRODUCTS */}

      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">

        <div className="mb-7 flex items-end justify-between gap-4">

          <div>
            <p className="text-xs font-bold tracking-widest text-blue-600">
              LATEST COLLECTION
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Recently Added Products
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Explore the latest products from our vendors.
            </p>
          </div>

          <Link
            to="/products"
            className="shrink-0 text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            See All →
          </Link>

        </div>

        {loading ? (

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>

        ) : error ? (

          <p className="rounded-lg bg-red-50 p-5 text-red-600">
            {error}
          </p>

        ) : products.length === 0 ? (

          <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            No products available right now.
          </p>

        ) : (

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

            {products.slice(0, 4).map((product) => (

              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="flex h-40 items-center justify-center bg-slate-50 p-4 sm:h-52">

                  {product.images?.length > 0 ? (

                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-contain transition group-hover:scale-105"
                    />

                  ) : (

                    <div className="text-center text-5xl">
                      📦
                      <p className="mt-2 text-xs text-slate-400">
                        No Image
                      </p>
                    </div>

                  )}

                </div>

                <div className="p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {product.brand || product.category}
                  </p>

                  <h3 className="mt-2 line-clamp-2 min-h-10 font-bold text-slate-800 group-hover:text-blue-600">
                    {product.name}
                  </h3>

                  <p className="mt-3 text-xl font-extrabold text-slate-900">
                    {formatPrice(product.price)}
                  </p>

                  <p className="mt-2 text-xs font-semibold text-green-600">
                    {product.stock > 0 ? "In Stock" : "Out of Stock"}
                  </p>

                </div>

              </Link>

            ))}

          </div>

        )}

      </section>

      {/* SELLER BANNER */}

      <section className="mx-auto mb-10 max-w-[1400px] px-4 sm:px-6">

        <div className="flex flex-col items-start justify-between gap-7 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:p-12">

          <div>

            <p className="text-xs font-bold tracking-widest text-blue-300">
              GROW WITH MULTIVENDOR
            </p>

            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
              Have a Business?
              <br />
              Start Selling With Us.
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
              Bring your products to our marketplace and
              reach more customers.
            </p>

          </div>

          <Link
            to={
              user?.role === "CUSTOMER"
                ? "/vendor/apply"
                : user?.role === "VENDOR"
                ? "/vendor"
                : "/register"
            }
            className="shrink-0 rounded-lg bg-yellow-400 px-7 py-3.5 font-bold text-slate-950 transition hover:bg-yellow-300"
          >
            {user?.role === "VENDOR"
              ? "Vendor Dashboard →"
              : "Start Selling →"}
          </Link>

        </div>

      </section>

    </div>
  );
}