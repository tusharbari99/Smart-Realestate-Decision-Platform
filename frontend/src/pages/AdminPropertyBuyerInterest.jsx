import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bookmark,
  Building2,
  ChevronDown,
  ChevronUp,
  Eye,
  Flame,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import { Link } from "react-router";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

function formatPrice(value) {
  const amount = Number(value || 0);

  if (!amount) return "Price on request";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function InterestBadge({ level }) {
  const styles = {
    Hot: "bg-red-100 text-red-700",
    Warm: "bg-amber-100 text-amber-700",
    New: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
        styles[level] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {level}
    </span>
  );
}

function AdminPropertyBuyerInterest() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function loadInterest() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/personalization/admin/property-buyer-interest",
        {
          params: {
            days,
          },
        },
      );

      setData(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load property interest.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterest();
  }, [days]);

  const filteredProperties = useMemo(() => {
    const properties =
      data?.properties || [];

    const normalized = query
      .trim()
      .toLowerCase();

    if (!normalized) return properties;

    return properties.filter((property) =>
      [
        property.title,
        property.city,
        property.locality,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(normalized),
        ),
    );
  }, [data, query]);

  const summary = data?.summary || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
            <Building2 size={18} />
            Property Intelligence
          </p>

          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-black">
                Property Buyer Interest
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                See which properties attract serious
                buyers and identify the strongest leads.
              </p>
            </div>

            <button
              type="button"
              onClick={loadInterest}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-black"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <Building2 className="text-blue-600" />

            <p className="mt-4 text-3xl font-black">
              {summary.properties || 0}
            </p>

            <p className="text-sm text-slate-500">
              Active Properties
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <Users className="text-violet-600" />

            <p className="mt-4 text-3xl font-black">
              {summary.interested_buyers || 0}
            </p>

            <p className="text-sm text-slate-500">
              Interested Buyers
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <MapPin className="text-green-600" />

            <p className="mt-4 text-3xl font-black">
              {summary.site_visits || 0}
            </p>

            <p className="text-sm text-slate-500">
              Site Visits
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <Flame className="text-red-600" />

            <p className="mt-4 text-3xl font-black">
              {summary.strong_actions || 0}
            </p>

            <p className="text-sm text-slate-500">
              Strong Actions
            </p>
          </article>
        </section>

        <section className="mt-7 flex flex-col gap-3 sm:flex-row">
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
              placeholder="Search property or location"
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#0b84e5]"
            />
          </label>

          <select
            value={days}
            onChange={(event) =>
              setDays(Number(event.target.value))
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"
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
        </section>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-96 items-center justify-center">
            <LoaderCircle
              size={42}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : (
          <section className="mt-7 space-y-5">
            {filteredProperties.map(
              (property) => {
                const expanded =
                  expandedId ===
                  property.property_id;

                return (
                  <article
                    key={property.property_id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                        <div>
                          <h2 className="text-xl font-black text-slate-900">
                            {property.title}
                          </h2>

                          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                            <MapPin size={16} />
                            {[
                              property.locality,
                              property.city,
                            ]
                              .filter(Boolean)
                              .join(", ") ||
                              "Location unavailable"}
                          </p>

                          <p className="mt-2 font-black text-blue-700">
                            {formatPrice(
                              property.price,
                            )}
                          </p>
                        </div>

                        <Link
                          to={`/properties/${property.property_id}`}
                          className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white"
                        >
                          View Property
                        </Link>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <Users size={16} />

                          <p className="mt-2 text-xl font-black">
                            {property.interested_buyers}
                          </p>

                          <p className="text-xs text-slate-500">
                            Buyers
                          </p>
                        </div>

                        <div className="rounded-xl bg-red-50 p-3">
                          <Flame
                            size={16}
                            className="text-red-600"
                          />

                          <p className="mt-2 text-xl font-black">
                            {property.hot_buyers}
                          </p>

                          <p className="text-xs text-slate-500">
                            Hot Buyers
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <Eye size={16} />

                          <p className="mt-2 text-xl font-black">
                            {property.views}
                          </p>

                          <p className="text-xs text-slate-500">
                            Views
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <Bookmark size={16} />

                          <p className="mt-2 text-xl font-black">
                            {property.saves}
                          </p>

                          <p className="text-xs text-slate-500">
                            Saves
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <MapPin size={16} />

                          <p className="mt-2 text-xl font-black">
                            {property.site_visits}
                          </p>

                          <p className="text-xs text-slate-500">
                            Site Visits
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <Flame size={16} />

                          <p className="mt-2 text-xl font-black">
                            {property.strong_actions}
                          </p>

                          <p className="text-xs text-slate-500">
                            Strong Actions
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(
                            expanded
                              ? null
                              : property.property_id,
                          )
                        }
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700"
                      >
                        {expanded ? (
                          <ChevronUp size={17} />
                        ) : (
                          <ChevronDown size={17} />
                        )}

                        {expanded
                          ? "Hide Interested Buyers"
                          : "Show Interested Buyers"}
                      </button>
                    </div>

                    {expanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
                        <div className="space-y-3">
                          {property.buyers.map(
                            (buyer) => (
                              <article
                                key={buyer.buyer_id}
                                className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-4 sm:flex-row sm:items-center"
                              >
                                <div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <p className="font-black text-slate-900">
                                      {buyer.buyer_name}
                                    </p>

                                    <InterestBadge
                                      level={
                                        buyer.interest_level
                                      }
                                    />
                                  </div>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {buyer.email}
                                  </p>

                                  <p className="mt-2 text-xs font-bold text-orange-700">
                                    Intent score:{" "}
                                    {buyer.intent_score}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold">
                                    {buyer.views} views
                                  </span>

                                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold">
                                    {buyer.saves} saves
                                  </span>

                                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold">
                                    {buyer.site_visits} visits
                                  </span>

                                  <Link
                                    to={`/admin/hot-buyer-leads?buyer=${buyer.buyer_id}`}
                                    className="rounded-lg bg-[#0b84e5] px-4 py-2 text-xs font-black text-white"
                                  >
                                    Open Lead
                                  </Link>
                                </div>
                              </article>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              },
            )}

            {filteredProperties.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center">
                <Building2
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-4 font-black text-slate-700">
                  No property interest data found.
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

export default AdminPropertyBuyerInterest;
