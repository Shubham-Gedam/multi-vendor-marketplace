import { Link } from "react-router-dom";

export default function VendorDashboard() {
  const dashboardItems = [
    {
      icon: "📦",
      title: "My Products",
      description:
        "View, edit and manage all your listed products and inventory.",
      link: "/vendor/products",
      button: "View Products",
      color: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: "➕",
      title: "Add New Product",
      description:
        "List new products in the marketplace and reach more customers.",
      link: "/vendor/products/add",
      button: "Add Product",
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      icon: "🛒",
      title: "Customer Orders",
      description:
        "View incoming orders and manage order delivery status.",
      link: "/vendor/orders",
      button: "Manage Orders",
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">

        {/* WELCOME BANNER */}

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-700 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">

          <div className="relative z-10 max-w-2xl">

            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-widest text-blue-100">
              MARKETLY SELLER CENTER
            </span>

            <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              Vendor Dashboard
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              Welcome to your seller dashboard. Manage your
              products, monitor customer orders and grow your
              business with Marketly.
            </p>

            <Link
              to="/vendor/products/add"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-3.5 font-bold text-slate-950 shadow-md transition hover:bg-yellow-300"
            >
              + Add New Product
            </Link>

          </div>

          <div className="absolute -right-16 -top-16 hidden h-80 w-80 rounded-full border-[35px] border-white/10 lg:block" />

          <div className="absolute -bottom-24 right-36 hidden h-64 w-64 rounded-full bg-blue-400/20 blur-3xl lg:block" />

          <span className="absolute bottom-5 right-10 hidden text-8xl opacity-20 lg:block">
            🏪
          </span>

        </section>

        {/* DASHBOARD HEADING */}

        <div className="mb-7 mt-10">

          <p className="text-xs font-bold tracking-widest text-blue-600">
            STORE MANAGEMENT
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
            Manage Your Business
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Everything you need to manage your marketplace store.
          </p>

        </div>

        {/* DASHBOARD CARDS */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

          {dashboardItems.map((item) => (

            <div
              key={item.title}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-8"
            >

              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} ${item.iconColor} text-3xl transition group-hover:scale-110`}>
                {item.icon}
              </div>

              <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-3 min-h-14 text-sm leading-7 text-slate-500">
                {item.description}
              </p>

              <Link
                to={item.link}
                className="mt-7 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {item.button}
                <span>→</span>
              </Link>

            </div>

          ))}

        </div>

        {/* QUICK INFORMATION */}

        <section className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-6 sm:p-8">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
              💡
            </div>

            <div>

              <h3 className="font-extrabold text-slate-900">
                Seller Tips
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Keep your product information accurate, maintain
                sufficient stock and process customer orders
                promptly to provide a better shopping experience.
              </p>

              <Link
                to="/vendor/products"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
              >
                Manage Your Products →
              </Link>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}