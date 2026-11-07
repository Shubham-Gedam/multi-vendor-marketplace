import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const image = product.images?.[0];

  const imageUrl =
    typeof image === "string"
      ? image
      : image?.url || image?.location;

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price || 0));

  return (
    <div className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">

      {/* PRODUCT IMAGE */}

      <Link
        to={`/products/${product._id}`}
        className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-50 p-4 sm:h-56"
      >
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
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold ${
            product.stock > 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {product.stock > 0 ? "IN STOCK" : "OUT OF STOCK"}
        </span>
      </Link>

      {/* PRODUCT INFORMATION */}

      <div className="flex flex-1 flex-col p-4">

        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {product.brand || product.category || "MARKETLY"}
        </p>

        <Link
          to={`/products/${product._id}`}
          className="mt-2 line-clamp-2 min-h-10 text-sm font-bold leading-6 text-slate-800 transition hover:text-blue-600 sm:text-base"
        >
          {product.name}
        </Link>

        <div className="mt-3">
          <p className="text-xl font-extrabold text-slate-900">
            {formatPrice(product.price)}
          </p>

          <p
            className={`mt-2 text-xs font-semibold ${
              product.stock > 0
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {product.stock > 0
              ? "✓ Available"
              : "Currently Unavailable"}
          </p>
        </div>

        {/* VIEW DETAILS */}

        <Link
          to={`/products/${product._id}`}
          className="mt-5 block rounded-lg bg-yellow-400 px-4 py-3 text-center text-xs font-extrabold text-slate-950 transition hover:bg-yellow-300 sm:text-sm"
        >
          View Details →
        </Link>

      </div>
    </div>
  );
}