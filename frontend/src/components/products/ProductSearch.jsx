export default function ProductSearch({
  search,
  setSearch,
  onSearch,
}) {
  function handleSubmit(e) {
    e.preventDefault();
    onSearch();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition focus-within:border-blue-300 focus-within:shadow-md sm:flex-row"
    >
      {/* SEARCH INPUT */}

      <div className="relative flex-1">

        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">
          🔍
        </span>

        <input
          type="text"
          placeholder="Search products by name, brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-0 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />

      </div>

      {/* SEARCH BUTTON */}

      <button
        type="submit"
        className="flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]"
      >
        <span>Search</span>
        <span>→</span>
      </button>

    </form>
  );
}