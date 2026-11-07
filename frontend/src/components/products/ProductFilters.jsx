export default function ProductFilters({
  filters,
  setFilters,
  onApply,
  onReset,
}) {
  function handleChange(e) {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  }

  const inputClass =
    "mb-0 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

  const labelClass =
    "mb-2 block text-sm font-bold text-slate-700";

  return (
    <aside className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* HEADER */}

      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg font-extrabold text-slate-900">
          Filters
        </h2>

        <button
          type="button"
          onClick={onReset}
          className="text-xs font-bold text-blue-600 transition hover:text-blue-800"
        >
          Reset All
        </button>
      </div>

      {/* CATEGORY */}

      <div className="mb-6">
        <label className={labelClass} htmlFor="category">
          Category
        </label>

        <input
          id="category"
          type="text"
          name="category"
          placeholder="Enter category"
          value={filters.category}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {/* PRICE RANGE */}

      <div className="mb-6 border-t border-slate-100 pt-5">
        <h3 className="mb-3 text-sm font-bold text-slate-800">
          Price Range
        </h3>

        <div className="space-y-3">
          <input
            type="number"
            name="minPrice"
            placeholder="Minimum Price ₹"
            min="0"
            value={filters.minPrice}
            onChange={handleChange}
            className={inputClass}
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="Maximum Price ₹"
            min="0"
            value={filters.maxPrice}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      {/* SORTING */}

      <div className="mb-6 border-t border-slate-100 pt-5">
        <h3 className="mb-3 text-sm font-bold text-slate-800">
          Sort Products
        </h3>

        <div className="space-y-3">
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="createdAt">Newest First</option>
            <option value="price">Price</option>
            <option value="name">Product Name</option>
          </select>

          <select
            name="order"
            value={filters.order}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* ACTION BUTTONS */}

      <div className="space-y-3">
        <button
          type="button"
          onClick={onApply}
          className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Clear Filters
        </button>
      </div>

    </aside>
  );
}