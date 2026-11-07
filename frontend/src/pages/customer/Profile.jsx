import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  const name = user?.name || "User";
  const initial = name.charAt(0).toUpperCase();

  const dashboardLink = {
    CUSTOMER: "/my-orders",
    VENDOR: "/vendor",
    ADMIN: "/admin",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

        {/* HEADER */}

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            MARKETLY ACCOUNT
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View your account information and marketplace details.
          </p>
        </div>

        {/* PROFILE CARD */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="bg-gradient-to-r from-slate-950 to-blue-800 px-6 py-10">
            <div className="flex flex-col items-center gap-4 sm:flex-row">

              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-amber-400 text-4xl font-extrabold text-slate-950 shadow-lg">
                {initial}
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-extrabold text-white">
                  {name}
                </h2>

                <p className="mt-2 text-sm text-blue-100">
                  {user?.email}
                </p>

                <span className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                  {user?.role} ACCOUNT
                </span>
              </div>

            </div>
          </div>

          {/* ACCOUNT INFORMATION */}

          <div className="p-6 sm:p-8">

            <h3 className="mb-5 text-lg font-extrabold text-slate-900">
              Account Information
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Full Name
                </p>

                <p className="mt-2 break-words font-bold text-slate-900">
                  {name}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </p>

                <p className="mt-2 break-all font-bold text-slate-900">
                  {user?.email || "Not available"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Account Type
                </p>

                <p className="mt-2 font-bold text-blue-700">
                  {user?.role || "CUSTOMER"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Account Status
                </p>

                <p className="mt-2 font-bold text-green-600">
                  Active
                </p>
              </div>

            </div>

            {/* QUICK ACTION */}

            <div className="mt-8 border-t border-slate-100 pt-7">

              <h3 className="mb-4 text-lg font-extrabold text-slate-900">
                Quick Access
              </h3>

              <Link
                to={dashboardLink[user?.role] || "/"}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                {user?.role === "CUSTOMER"
                  ? "View My Orders"
                  : user?.role === "VENDOR"
                    ? "Seller Dashboard"
                    : "Admin Dashboard"}

                <span>→</span>
              </Link>

              <Link
                to="/"
                className="ml-3 inline-flex items-center rounded-lg border border-slate-200 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Continue Shopping
              </Link>

            </div>

          </div>

        </section>

      </div>
    </div>
  );
}