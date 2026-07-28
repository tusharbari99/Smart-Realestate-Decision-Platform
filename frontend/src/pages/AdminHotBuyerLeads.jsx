import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  Bookmark,
  Building2,
  Eye,
  Flame,
  LoaderCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { useSearchParams } from "react-router";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import AdminBuyerLeadFollowup from "../components/AdminBuyerLeadFollowup";

function LeadBadge({ level }) {
  const styles = {
    Hot: "bg-red-100 text-red-700",
    Warm: "bg-amber-100 text-amber-700",
    New: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${
        styles[level] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {level}
    </span>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  description,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0b84e5]">
        <Icon size={21} />
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </article>
  );
}

function formatDate(value) {
  if (!value) return "No recent activity";

  return new Date(value).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function AdminHotBuyerLeads() {
  const [searchParams] = useSearchParams();

  const focusedBuyerId = Number(
    searchParams.get("buyer") || 0,
  );

  const focusedLeadRef = useRef(null);

  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState("");
  const [leadFilter, setLeadFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/personalization/admin/hot-buyer-leads",
        {
          params: {
            days,
            limit: 100,
          },
        },
      );

      setData(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load buyer leads.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, [days]);

  useEffect(() => {
    if (
      loading ||
      !focusedBuyerId ||
      !focusedLeadRef.current
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      focusedLeadRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    loading,
    focusedBuyerId,
    data,
  ]);

  const filteredBuyers = useMemo(() => {
    const buyers = data?.buyers || [];

    const normalizedQuery = query
      .trim()
      .toLowerCase();

    return buyers.filter((buyer) => {
      const matchesLevel =
        leadFilter === "all" ||
        String(
          buyer.lead_level,
        ).toLowerCase() === leadFilter;

      const matchesSearch =
        !normalizedQuery ||
        String(buyer.buyer_name || "")
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(buyer.email || "")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesLevel && matchesSearch;
    });
  }, [data, query, leadFilter]);

  const summary = data?.summary || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-orange-300">
            <Flame size={18} />
            Sales Intelligence
          </p>

          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-black">
                Hot Buyer Leads
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Find buyers showing strong purchase
                interest from their recent website
                activity.
              </p>
            </div>

            <button
              type="button"
              onClick={loadLeads}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh Leads
            </button>
          </div>
        </section>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            title="Active Buyers"
            value={summary.total || 0}
            description={`Last ${days} days`}
          />

          <StatCard
            icon={Flame}
            title="Hot Leads"
            value={summary.hot || 0}
            description="High purchase intent"
          />

          <StatCard
            icon={Activity}
            title="Warm Leads"
            value={summary.warm || 0}
            description="Growing engagement"
          />

          <StatCard
            icon={Building2}
            title="New Leads"
            value={summary.new || 0}
            description="Early activity"
          />
        </section>

        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row">
            <label className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search buyer name or email"
                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#0b84e5]"
              />
            </label>

            <select
              value={leadFilter}
              onChange={(event) =>
                setLeadFilter(event.target.value)
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none"
            >
              <option value="all">
                All Lead Levels
              </option>

              <option value="hot">
                Hot Leads
              </option>

              <option value="warm">
                Warm Leads
              </option>

              <option value="new">
                New Leads
              </option>
            </select>

            <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-4">
              <SlidersHorizontal
                size={17}
                className="text-slate-400"
              />

              <select
                value={days}
                onChange={(event) =>
                  setDays(
                    Number(event.target.value),
                  )
                }
                className="bg-transparent py-3 text-sm font-bold text-slate-700 outline-none"
              >
                <option value={7}>
                  Last 7 Days
                </option>

                <option value={30}>
                  Last 30 Days
                </option>

                <option value={90}>
                  Last 90 Days
                </option>
              </select>
            </label>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-96 items-center justify-center">
            <LoaderCircle
              size={42}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : (
          <section className="mt-7 space-y-4">
            {filteredBuyers.map((buyer) => (
              <article
                key={buyer.buyer_id}
                ref={
                  buyer.buyer_id === focusedBuyerId
                    ? focusedLeadRef
                    : null
                }
                className={`rounded-3xl border bg-white p-5 shadow-sm transition sm:p-6 ${
                  buyer.buyer_id === focusedBuyerId
                    ? "border-orange-400 ring-4 ring-orange-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div>
                    {buyer.buyer_id ===
                      focusedBuyerId && (
                      <p className="mb-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-700">
                        Selected Follow-up
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-slate-900">
                        {buyer.buyer_name ||
                          "Buyer"}
                      </h2>

                      <LeadBadge
                        level={
                          buyer.lead_level
                        }
                      />
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {buyer.email}
                    </p>

                    <p className="mt-2 text-xs font-bold text-slate-400">
                      Last active:{" "}
                      {formatDate(
                        buyer.last_active_at,
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-950 px-6 py-4 text-center text-white">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Intent Score
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      {buyer.intent_score}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <Eye
                      size={16}
                      className="text-blue-600"
                    />

                    <p className="mt-2 text-lg font-black">
                      {buyer.views}
                    </p>

                    <p className="text-xs text-slate-500">
                      Views
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <Search
                      size={16}
                      className="text-violet-600"
                    />

                    <p className="mt-2 text-lg font-black">
                      {buyer.searches}
                    </p>

                    <p className="text-xs text-slate-500">
                      Searches
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <Bookmark
                      size={16}
                      className="text-amber-600"
                    />

                    <p className="mt-2 text-lg font-black">
                      {buyer.saved_properties}
                    </p>

                    <p className="text-xs text-slate-500">
                      Saved
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <Building2
                      size={16}
                      className="text-green-600"
                    />

                    <p className="mt-2 text-lg font-black">
                      {buyer.explored_properties}
                    </p>

                    <p className="text-xs text-slate-500">
                      Properties
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <Activity
                      size={16}
                      className="text-orange-600"
                    />

                    <p className="mt-2 text-lg font-black">
                      {buyer.site_visits}
                    </p>

                    <p className="text-xs text-slate-500">
                      Site Visits
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <Flame
                      size={16}
                      className="text-red-600"
                    />

                    <p className="mt-2 text-lg font-black">
                      {Number(
                        buyer.price_talks || 0,
                      ) +
                        Number(
                          buyer.interests || 0,
                        )}
                    </p>

                    <p className="text-xs text-slate-500">
                      Strong Actions
                    </p>
                  </div>
                </div>

                <AdminBuyerLeadFollowup
                  buyerId={buyer.buyer_id}
                />
              </article>
            ))}

            {filteredBuyers.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center">
                <Users
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-4 font-black text-slate-700">
                  No matching buyer leads found.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Buyer activity will appear here
                  automatically.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default AdminHotBuyerLeads;
