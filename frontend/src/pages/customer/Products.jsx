import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProducts } from "../../services/productService";

const initialFilters = {
  category: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  sortBy: "createdAt",
  order: "desc",
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price || 0));

function getProductImage(product) {
  const image = product.images?.[0];

  if (typeof image === "string") return image;

  return image?.url || image?.location || "";
}

export default function Products() {
  const [products, setProducts] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [appliedSearch, setAppliedSearch] = useState(urlSearch);

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const activeFilterCount = [
    appliedFilters.category,
    appliedFilters.minPrice,
    appliedFilters.maxPrice,
    appliedFilters.minRating,
  ].filter(Boolean).length;

  const hasActiveSearch = Boolean(appliedSearch);

  // FETCH PRODUCTS

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await getProducts({
          search: appliedSearch,
          ...appliedFilters,
          page,
          limit: 12,
        });

        if (!ignore) {
          setProducts(response.data || []);
          setPagination(response.pagination || null);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              "Unable to load products. Please try again.",
          );

          setProducts([]);
          setPagination(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, [page, appliedSearch, appliedFilters, retryKey]);

  // SYNC URL SEARCH

  useEffect(() => {
    setSearchInput(urlSearch);
    setAppliedSearch(urlSearch);
    setPage(1);
  }, [urlSearch]);

  // HANDLE INPUT CHANGES

  function handleFilterChange(e) {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // APPLY FILTERS

  function handleApplyFilters() {
    const min = Number(filters.minPrice);
    const max = Number(filters.maxPrice);

    if (filters.minPrice !== "" && filters.maxPrice !== "" && min > max) {
      setError("Minimum price cannot be greater than maximum price.");
      return;
    }

    setError("");

    const query = searchInput.trim();

    setAppliedSearch(query);
    setAppliedFilters({ ...filters });
    setPage(1);

    setSearchParams(query ? { search: query } : {});

    setFiltersOpen(false);
  }

  // RESET ALL

  function handleResetFilters() {
    setSearchInput("");
    setAppliedSearch("");

    setFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });

    setPage(1);
    setPagination(null);
    setError("");

    setSearchParams({});
    setFiltersOpen(false);
  }

  // RETRY API REQUEST

  function handleRetry() {
    setRetryKey((prev) => prev + 1);
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* PAGE HEADER */}

      <section className="bg-linear-to-r from-[#101d3c] via-blue-900 to-[#254f91]">
        <div className="mx-auto flex max-w-375 flex-col justify-between gap-6 px-4 py-9 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-blue-200">
              MARKETLY MARKETPLACE
            </p>

            <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Explore Products
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
              Discover products from trusted vendors. Find your favourites and
              enjoy shopping.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-white">
            <span className="text-3xl">🛍️</span>

            <div>
              <p className="text-2xl font-extrabold">
                {pagination?.totalProducts ?? products.length}
              </p>

              <p className="text-xs text-blue-100">Products Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}

      <div className="mx-auto max-w-375 px-4 py-8 sm:px-6 lg:px-8">
        {/* BREADCRUMB */}

        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/" className="transition hover:text-blue-600">
            Home
          </Link>

          <span>/</span>

          <span className="font-bold text-slate-800">Shop All Products</span>

          {appliedSearch && (
            <>
              <span>/</span>
              <span className="max-w-48 truncate text-blue-600">
                {appliedSearch}
              </span>
            </>
          )}
        </div>

        {/* MOBILE FILTER BUTTON */}

        <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-blue-300"
          >
            <span>☷</span>
            Filters & Sorting
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm">
            {pagination?.totalProducts ?? products.length} Results
          </div>
        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          {/* FILTER SIDEBAR */}

          <aside
            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${
              filtersOpen ? "block" : "hidden lg:block"
            }`}
          >
            {/* FILTER HEADER */}

            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Filters
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Refine your selection
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-blue-600 transition hover:text-blue-800"
              >
                Reset All
              </button>
            </div>

            {/* CATEGORY */}

            <div className="mb-6">
              <label
                htmlFor="category"
                className="mb-3 block text-sm font-extrabold text-slate-800"
              >
                Category
              </label>

              <input
                id="category"
                type="text"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                placeholder="e.g. Electronics"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              <p className="mt-2 text-[11px] text-slate-400">
                Enter a product category.
              </p>
            </div>

            {/* PRICE FILTER */}

            <div className="mb-6 border-t border-slate-100 pt-6">
              <h3 className="mb-4 text-sm font-extrabold text-slate-800">
                Price Range
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="minPrice"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Minimum
                  </label>

                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 focus-within:border-blue-500">
                    <span className="text-sm text-slate-400">₹</span>

                    <input
                      id="minPrice"
                      type="number"
                      name="minPrice"
                      min="0"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      placeholder="0"
                      className="w-full min-w-0 bg-transparent px-1.5 py-3 text-sm text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="maxPrice"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Maximum
                  </label>

                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 focus-within:border-blue-500">
                    <span className="text-sm text-slate-400">₹</span>

                    <input
                      id="maxPrice"
                      type="number"
                      name="maxPrice"
                      min="0"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      placeholder="Any"
                      className="w-full min-w-0 bg-transparent px-1.5 py-3 text-sm text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* RATING FILTER */}

            <div className="mb-6 border-t border-slate-100 pt-6">
              <label
                htmlFor="minRating"
                className="mb-3 block text-sm font-extrabold text-slate-800"
              >
                Customer Rating
              </label>

              <select
                id="minRating"
                name="minRating"
                value={filters.minRating}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="">All Ratings</option>
                <option value="4">⭐ 4 Stars & Above</option>
                <option value="3">⭐ 3 Stars & Above</option>
                <option value="2">⭐ 2 Stars & Above</option>
                <option value="1">⭐ 1 Star & Above</option>
              </select>

              <p className="mt-2 text-[11px] text-slate-400">
                Show products based on customer ratings.
              </p>
            </div>

            

            {/* SORTING */}

            <div className="mb-6 border-t border-slate-100 pt-6">
              <h3 className="mb-4 text-sm font-extrabold text-slate-800">
                Sort Products
              </h3>

              <label
                htmlFor="sortBy"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                Sort by
              </label>

              <select
                id="sortBy"
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="mb-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="createdAt">Newest First</option>

                <option value="price">Price</option>

                <option value="name">Product Name</option>
              </select>

              <label
                htmlFor="order"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                Order
              </label>

              <select
                id="order"
                name="order"
                value={filters.order}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="asc">Ascending</option>

                <option value="desc">Descending</option>
              </select>
            </div>

            {/* APPLY BUTTON */}

            <button
              type="button"
              onClick={handleApplyFilters}
              className="w-full rounded-lg bg-blue-600 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Clear All
            </button>
          </aside>

          {/* PRODUCT RESULTS */}

          <main className="min-w-0">
            {/* RESULTS HEADER */}

            <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Marketly Collection
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                    {appliedSearch
                      ? `Results for "${appliedSearch}"`
                      : "Explore All Products"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {pagination
                      ? `${pagination.totalProducts} products available`
                      : "Discover our latest collection"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {hasActiveSearch && (
                    <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                      Search Active
                    </span>
                  )}

                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                      {activeFilterCount} Filters Applied
                    </span>
                  )}

                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                    {pagination?.totalProducts ?? products.length} Results
                  </span>
                </div>
              </div>

              {/* ACTIVE SEARCH CHIP */}

              {(hasActiveSearch || activeFilterCount > 0) && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <span className="mr-1 text-xs font-semibold text-slate-500">
                    Active:
                  </span>

                  {hasActiveSearch && (
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      Search: {appliedSearch}
                    </span>
                  )}

                  {appliedFilters.category && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                      {appliedFilters.category}
                    </span>
                  )}

                  {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                      Price: {appliedFilters.minPrice || "0"} –{" "}
                      {appliedFilters.maxPrice || "Any"}
                    </span>
                  )}
                  {appliedFilters.minRating && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      ⭐ {appliedFilters.minRating} Stars & Above
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="ml-auto text-xs font-bold text-red-500 hover:text-red-700"
                  >
                    Clear All ×
                  </button>
                </div>
              )}
            </section>

            {/* LOADING */}

            {loading ? (
              <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="h-48 rounded-xl bg-slate-200 sm:h-56" />

                    <div className="mt-5 h-3 w-1/3 rounded bg-slate-200" />

                    <div className="mt-3 h-5 w-3/4 rounded bg-slate-200" />

                    <div className="mt-5 h-7 w-1/2 rounded bg-slate-200" />

                    <div className="mt-5 h-10 rounded-lg bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : error ? (
              /* ERROR STATE */

              <div className="rounded-2xl border border-red-200 bg-white px-5 py-16 text-center shadow-sm">
                <span className="text-5xl">⚠️</span>

                <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                  Something went wrong
                </h3>

                <p className="mt-2 text-sm text-red-600">{error}</p>

                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-6 rounded-lg bg-blue-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              /* EMPTY STATE */

              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
                  🛍️
                </div>

                <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                  No Products Found
                </h3>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">
                  We couldn't find products matching your search. Try different
                  keywords or adjust your filters.
                </p>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-7 rounded-lg bg-blue-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Explore All Products
                </button>
              </div>
            ) : (
              /* PRODUCT GRID */

              <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => {
                  const imageUrl = getProductImage(product);
                  const available = Number(product.stock) > 0;

                  return (
                    <Link
                      key={product._id}
                      to={`/products/${product._id}`}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                    >
                      {/* PRODUCT IMAGE */}

                      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-b from-white to-slate-50 p-5 sm:h-56">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-contain transition duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-6xl">📦</span>

                            <p className="mt-3 text-xs font-medium text-slate-400">
                              No Image Available
                            </p>
                          </div>
                        )}

                        {/* STOCK BADGE */}

                        <span
                          className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-extrabold tracking-wide ${
                            available
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {available ? "IN STOCK" : "OUT OF STOCK"}
                        </span>

                        {/* CATEGORY */}

                        {product.category && (
                          <span className="absolute right-3 top-3 max-w-28 truncate rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm">
                            {product.category}
                          </span>
                        )}
                      </div>

                      {/* PRODUCT DETAILS */}

                      <div className="flex flex-1 flex-col p-4 sm:p-5">
                        <div className="flex min-h-5 items-center justify-between gap-2">
                          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            {product.brand ||
                              product.category ||
                              "Marketly Product"}
                          </p>

                          <span className="shrink-0 text-[10px] text-slate-400">
                            {product.stock > 0 ? `${product.stock} left` : ""}
                          </span>
                        </div>

                        <h3 className="mt-3 line-clamp-2 min-h-12 text-sm font-extrabold leading-6 text-slate-900 transition group-hover:text-blue-700 sm:text-base">
                          {product.name}
                        </h3>

                        {/* PRICE */}

                        <div className="mt-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Price
                          </p>

                          <p className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
                            {formatPrice(product.price)}
                          </p>
                        </div>

                        {/* AVAILABILITY */}

                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              available ? "bg-green-500" : "bg-red-500"
                            }`}
                          />

                          <span
                            className={`text-xs font-semibold ${
                              available ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {available
                              ? "Available for purchase"
                              : "Currently unavailable"}
                          </span>
                        </div>

                        {/* VIEW DETAILS BUTTON */}

                        <div
                          className={`mt-5 rounded-lg py-3 text-center text-xs font-extrabold transition sm:text-sm ${
                            available
                              ? "bg-blue-600 text-white group-hover:bg-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          View Product Details →
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* PAGINATION */}

            {!loading && !error && pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  Page{" "}
                  <span className="font-extrabold text-slate-900">
                    {pagination.currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-extrabold text-slate-900">
                    {pagination.totalPages}
                  </span>
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!pagination.hasPrevPage || loading}
                    onClick={() => {
                      setPage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-sm"
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    disabled={!pagination.hasNextPage || loading}
                    onClick={() => {
                      setPage((prev) => prev + 1);
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
