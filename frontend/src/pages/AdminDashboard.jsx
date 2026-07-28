import {
  useCallback,
  useEffect,
  useState } from "react";
import { Link,
  useNavigate } from "react-router";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Cuboid,
  Home,
  LoaderCircle,
  LogOut,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Users,
  Bell,
  Flame,
  KanbanSquare,
  BarChart3
} from "lucide-react";

import api from "../services/api";
import AdminFollowupReminders from "../components/AdminFollowupReminders";

const initialStats = {
  total_users: 0,
  total_listings: 0,
  pending_listings: 0,
  verified_listings: 0,
  rejected_listings: 0,
  total_inquiries: 0,
  open_3d_requests: 0,
  open_support_messages: 0,
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard");

      setStats({
        ...initialStats,
        ...(response.data?.statistics || {}),
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load the dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/auth", { replace: true });
  }

  const cards = [
    {
      label: "Total Users",
      value: stats.total_users,
      icon: Users,
      note: "Registered accounts",
    },
    {
      label: "Total Properties",
      value: stats.total_listings,
      icon: Building2,
      note: "All property listings",
    },
    {
      label: "Pending Review",
      value: stats.pending_listings,
      icon: Clock3,
      note: "Waiting for approval",
    },
    {
      label: "Verified",
      value: stats.verified_listings,
      icon: CheckCircle2,
      note: "Live properties",
    },
    {
      label: "Rejected",
      value: stats.rejected_listings,
      icon: ShieldAlert,
      note: "Rejected listings",
    },
    {
      label: "Buyer Requests",
      value: stats.total_inquiries,
      icon: MessageSquare,
      note: "Property requests",
    },
    {
      label: "Open 3D Requests",
      value: stats.open_3d_requests,
      icon: Cuboid,
      note: "3D work in progress",
    },
    {
      label: "Support Messages",
      value: stats.open_support_messages,
      icon: MessageSquare,
      note: "Open customer messages",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}homeasy-brand-logo.webp`}
              alt="The homeasy logo"
              className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
            />

            <div>
              <p className="text-lg font-black text-slate-900">
                Smart Real Estate
              </p>

              <p className="text-xs font-semibold text-slate-500">
                Company Dashboard
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
            >
              <Home size={17} />
              <span className="hidden sm:inline">Website</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#0b84e5]">
              Admin Overview
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Business Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View properties, customer requests, and platform activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {cards.map(({ label, value, icon: Icon, note }) => (
                <article
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        {label}
                      </p>

                      <p className="mt-3 text-3xl font-black text-slate-900">
                        {Number(value || 0).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0b84e5]">
                      <Icon size={22} />
                    </div>
                  </div>

                  <p className="mt-4 text-xs font-semibold text-slate-400">
                    {note}
                  </p>
                </article>
              ))}
            </div>


            <AdminFollowupReminders />

            <section className="mt-8 rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-300">
                Quick Action
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Manage Buyer Requests
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Check site visits, property questions, and price requests
                from buyers.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/admin/inquiries"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-extrabold text-white"
                >
                  <MessageSquare size={18} />
                  Open Property Requests
                </Link>

                <Link
                  to="/admin/properties/pending"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
                >
                  <Building2 size={18} />
                  Review Pending Properties
                </Link>

                <Link
                  to="/admin/users"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
                >
                  <Users size={18} />
                  Manage Users
                </Link>

                <Link
                  to="/admin/support-messages"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
                >
                  <MessageSquare size={18} />
                  Support Messages
                </Link>

                <Link
                  to="/admin/3d-requests"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
                >
                  <Cuboid size={18} />
                  Manage 3D Requests
                </Link>
                





                <Link
                  to="/admin/analytics"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-400/40 bg-green-500/10 px-5 py-3 text-sm font-extrabold text-green-100 transition hover:bg-green-500/20"
                >
                  <BarChart3 size={18} />
                  Admin Analytics
                </Link>

                <Link
                  to="/admin/property-buyer-interest"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/10 px-5 py-3 text-sm font-extrabold text-blue-100 transition hover:bg-blue-500/20"
                >
                  <Building2 size={18} />
                  Property Buyer Interest
                </Link>

                <Link
                  to="/admin/lead-pipeline"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/10 px-5 py-3 text-sm font-extrabold text-violet-100 transition hover:bg-violet-500/20"
                >
                  <KanbanSquare size={18} />
                  Lead Pipeline
                </Link>

                <Link
                  to="/admin/hot-buyer-leads"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400/40 bg-orange-500/10 px-5 py-3 text-sm font-extrabold text-orange-100 transition hover:bg-orange-500/20"
                >
                  <Flame size={18} />
                  Hot Buyer Leads
                </Link>

                <Link
                  to="/admin/notification-control"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
                >
                  <Bell size={18} />
                  Notification Control
                </Link>

                <Link
                  to="/admin/properties"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
                >
                  <Building2 size={18} />
                  Manage Properties
                </Link>
              <a
                href="/admin/property-media-requests"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/60 bg-violet-500/15 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-500/25"
              >
                Media Review Requests
              </a>

              <a
                href="/admin/property-edit-requests"
                className="inline-flex items-center gap-2 rounded-xl border border-violet-400/60 bg-violet-500/15 px-5 py-3 text-sm font-black text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/25"
              >
                <span aria-hidden="true">✎</span>
                Property Edit Requests
              </a>

              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
