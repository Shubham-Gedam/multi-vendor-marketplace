import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getProducts,
  deleteProduct,
} from "../../services/productService";

export default function VendorProducts() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await getProducts({ limit: 100 });

      const currentUserId = user?.userId || user?._id;

      const myProducts = (response.data || []).filter(
        (product) =>
          String(product.vendorId) === String(currentUserId)
      );

      setProducts(myProducts);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(productId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(productId);
      setError("");

      await deleteProduct(productId);

      setProducts((prev) =>
        prev.filter((product) => product._id !== productId)
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete product"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price || 0));

  const getStatusStyle = (status) => {
    const styles = {
      ACTIVE: "bg-green-100 text-green-700",
      INACTIVE: "bg-slate-100 text-slate-600",
      DRAFT: "bg-yellow-100 text-yellow-700",
    };

    return styles[status] || "bg-slate-100 text-slate-600";
  };

  // LOADING STATE

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] animate-pulse px-4 py-10">
        <div className="h-36 rounded-2xl bg-slate-200" />

        <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-80 rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-[1400px] px-4 py-9 sm:px-6 lg:px-8">

        {/* HEADER */}

        <section className="mb-8 flex flex-col justify-between gap-6 rounded-2xl bg-gradient-to-r from-blue-950 to-blue-700 px-6 py-9 text-white sm:flex-row sm:items-center sm:px-10">

          <div>
            <p className="text-xs font-bold tracking-[2px] text-blue-200">
              MARKETLY SELLER CENTER
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              My Products
            </h1>

            <p className="mt-3 text-sm leading-7 text-blue-100">
              Manage your product listings, pricing and inventory.
            </p>
          </div>

          <Link
            to="/vendor/products/add"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-yellow-400 px-6 py-3.5 font-extrabold text-slate-950 transition hover:bg-yellow-300"
          >
            <span className="text-xl">+</span>
            Add New Product
          </Link>

        </section>

        {/* SUMMARY */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Products
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
              {products.length}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Products in your listing
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available Stock
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-green-600">
              {products.reduce(
                (total, product) =>
                  total + Number(product.stock || 0),
                0
              )}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Total available units
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Products
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-blue-600">
              {
                products.filter(
                  (product) => product.status === "ACTIVE"
                ).length
              }
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Currently active listings
            </p>
          </div>

        </div>

        {/* SECTION HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Your Product Listings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage and update your marketplace products.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            ↻ Refresh
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            <span>⚠️ {error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* EMPTY STATE */}

        {products.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">

            <span className="text-7xl">📦</span>

            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
              No Products Yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              You haven't added any products to your store.
              Start listing your products to reach more customers.
            </p>

            <Link
              to="/vendor/products/add"
              className="mt-7 inline-block rounded-lg bg-yellow-400 px-7 py-3.5 font-extrabold text-slate-950 transition hover:bg-yellow-300"
            >
              + Add Your First Product
            </Link>

          </div>

        ) : (

          /* PRODUCT GRID */

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

            {products.map((product) => {

              const image = product.images?.[0];

              const imageUrl =
                typeof image === "string"
                  ? image
                  : image?.url || image?.location;

              return (

                <article
                  key={product._id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                >

                  {/* PRODUCT IMAGE */}

                  <div className="relative flex h-52 items-center justify-center bg-slate-50 p-5">

                    {imageUrl ? (

                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                      />

                    ) : (

                      <div className="flex flex-col items-center">
                        <span className="text-6xl">📦</span>

                        <p className="mt-3 text-xs text-slate-400">
                          No Image Available
                        </p>
                      </div>

                    )}

                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-bold ${getStatusStyle(
                        product.status
                      )}`}
                    >
                      {product.status}
                    </span>

                  </div>

                  {/* PRODUCT INFORMATION */}

                  <div className="flex flex-1 flex-col p-5">

                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      {product.category}
                    </p>

                    <h3 className="mt-2 line-clamp-2 min-h-12 text-lg font-extrabold text-slate-900">
                      {product.name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Brand: {product.brand || "N/A"}
                    </p>

                    {/* PRICE AND STOCK */}

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-blue-500">
                          Price
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-blue-900">
                          {formatPrice(product.price)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-green-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-green-600">
                          Stock
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-green-800">
                          {product.stock} Units
                        </p>
                      </div>

                    </div>

                    {/* ACTION BUTTONS */}

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <Link
                        to={`/vendor/products/edit/${product._id}`}
                        className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        ✏️ Edit
                      </Link>

                      <button
                        type="button"
                        disabled={deletingId === product._id}
                        onClick={() => handleDelete(product._id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === product._id
                          ? "Deleting..."
                          : "🗑 Delete"}
                      </button>

                    </div>

                  </div>

                </article>

              );
            })}

          </div>

        )}

        {/* INFORMATION */}

        <section className="mt-9 rounded-xl border border-blue-100 bg-blue-50 p-5 sm:p-6">

          <div className="flex items-start gap-4">

            <span className="text-3xl">💡</span>

            <div>
              <h3 className="font-extrabold text-slate-900">
                Seller Tip
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Keep your inventory updated, provide accurate
                product descriptions and upload quality images
                to improve your product listings.
              </p>
            </div>

          </div>

        </section>

      </div>

    </div>
  );
}