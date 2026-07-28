import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  Eye,
  Flame,
  LoaderCircle,
  MapPin,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import { Link } from "react-router";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

const actionLabels = {
  view: "Property Views",
  details: "Details Opened",
  search: "Searches",
  save: "Properties Saved",
  compare: "Comparisons",
  site_visit: "Site Visits",
  price_talk: "Price Talks",
  interest: "Interest Requests",
};

const pipelineLabels = {
  new: "New",
  contacted: "Contacted",
  site_visit_planned: "Site Visit",
  negotiating: "Negotiating",
  converted: "Converted",
  not_interested: "Not Interested",
};

function formatPrice(value) {
  const amount = Number(value || 0);

  if (!amount) return "Price on request";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
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

function ProgressRow({
  label,
  value,
  maximum,
  description,
}) {
  const percentage =
    maximum > 0
      ? Math.max(
          4,
          Math.min(
            100,
            (Number(value || 0) /
              maximum) *
              100,
          ),
        )
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-800">
            {label}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <p className="text-sm font-black text-slate-900">
          {value}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#0b84e5]"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/personalization/admin/analytics",
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
          "Could not load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const summary = data?.summary || {};

  const actionBreakdown =
    data?.action_breakdown || [];

  const popularLocations =
    data?.popular_locations || [];

  const popularProperties =
    data?.popular_properties || [];

  const pipeline =
    data?.lead_pipeline || {};

  const maxAction = useMemo(() => {
    return Math.max(
      1,
      ...actionBreakdown.map(
        (item) =>
          Number(item.total || 0),
      ),
    );
  }, [actionBreakdown]);

  const maxLocation = useMemo(() => {
    return Math.max(
      1,
      ...popularLocations.map(
        (item) =>
          Number(item.total_actions || 0),
      ),
    );
  }, [popularLocations]);

  const maxPipeline = useMemo(() => {
    return Math.max(
      1,
      ...Object.values(pipeline).map(
        Number,
      ),
    );
  }, [pipeline]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
            <BarChart3 size={18} />
            Business Intelligence
          </p>

          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-black">
                Admin Analytics
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Understand buyer activity, property
                demand and sales conversion.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={days}
                onChange={(event) =>
                  setDays(
                    Number(event.target.value),
                  )
                }
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white outline-none"
              >
                <option
                  value={7}
                  className="text-slate-900"
                >
                  Last 7 Days
                </option>

                <option
                  value={30}
                  className="text-slate-900"
                >
                  Last 30 Days
                </option>

                <option
                  value={90}
                  className="text-slate-900"
                >
                  Last 90 Days
                </option>
              </select>

              <button
                type="button"
                onClick={loadAnalytics}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-black text-white"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>
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
          <>
            <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Activity}
                title="Buyer Actions"
                value={
                  summary.total_actions || 0
                }
                description={`Last ${days} days`}
              />

              <StatCard
                icon={Users}
                title="Active Buyers"
                value={
                  summary.active_buyers || 0
                }
                description="Buyers showing activity"
              />

              <StatCard
                icon={Building2}
                title="Active Properties"
                value={
                  summary.active_properties ||
                  0
                }
                description="Properties with buyer activity"
              />

              <StatCard
                icon={Eye}
                title="Property Views"
                value={summary.views || 0}
                description="Total recorded views"
              />

              <StatCard
                icon={Flame}
                title="Strong Actions"
                value={
                  summary.strong_actions || 0
                }
                description="Saves, comparisons and inquiries"
              />

              <StatCard
                icon={MapPin}
                title="Site Visits"
                value={
                  summary.site_visits || 0
                }
                description="Site-visit requests"
              />

              <StatCard
                icon={CheckCircle2}
                title="Converted Leads"
                value={
                  summary.converted_leads || 0
                }
                description="Marked as converted"
              />

              <StatCard
                icon={TrendingUp}
                title="Conversion Rate"
                value={`${
                  summary.conversion_rate || 0
                }%`}
                description="Converted managed leads"
              />
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-black text-slate-900">
                  Buyer Action Breakdown
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Actions recorded during the
                  selected period.
                </p>

                <div className="mt-6 space-y-6">
                  {actionBreakdown.map(
                    (item) => (
                      <ProgressRow
                        key={item.action_type}
                        label={
                          actionLabels[
                            item.action_type
                          ] ||
                          item.action_type
                        }
                        value={item.total}
                        maximum={maxAction}
                      />
                    ),
                  )}

                  {actionBreakdown.length ===
                    0 && (
                    <p className="py-10 text-center text-sm text-slate-500">
                      No buyer activity found.
                    </p>
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-black text-slate-900">
                  Popular Locations
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Locations receiving the most
                  buyer activity.
                </p>

                <div className="mt-6 space-y-6">
                  {popularLocations.map(
                    (location) => (
                      <ProgressRow
                        key={
                          location.location_name
                        }
                        label={
                          location.location_name
                        }
                        value={
                          location.total_actions
                        }
                        maximum={maxLocation}
                        description={`${
                          location.interested_buyers
                        } buyers • ${
                          location.properties
                        } properties`}
                      />
                    ),
                  )}

                  {popularLocations.length ===
                    0 && (
                    <p className="py-10 text-center text-sm text-slate-500">
                      No location activity found.
                    </p>
                  )}
                </div>
              </article>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Lead Conversion Pipeline
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Current lead status distribution.
                  </p>
                </div>

                <Link
                  to="/admin/lead-pipeline"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white"
                >
                  Open Lead Pipeline
                </Link>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(
                  pipelineLabels,
                ).map(([key, label]) => (
                  <ProgressRow
                    key={key}
                    label={label}
                    value={pipeline[key] || 0}
                    maximum={maxPipeline}
                  />
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Most Popular Properties
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Properties ranked by buyer
                    activity and strong interest.
                  </p>
                </div>

                <Link
                  to="/admin/property-buyer-interest"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-black text-slate-700"
                >
                  Full Property Interest
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {popularProperties.map(
                  (property, index) => (
                    <article
                      key={property.property_id}
                      className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                          {index + 1}
                        </div>

                        <div>
                          <p className="font-black text-slate-900">
                            {property.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {[
                              property.locality,
                              property.city,
                            ]
                              .filter(Boolean)
                              .join(", ") ||
                              "Location unavailable"}
                          </p>

                          <p className="mt-2 text-sm font-black text-blue-700">
                            {formatPrice(
                              property.price,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700">
                          {property.views} views
                        </span>

                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700">
                          {
                            property.interested_buyers
                          } buyers
                        </span>

                        <span className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                          {
                            Number(
                              property.site_visits ||
                                0,
                            ) +
                            Number(
                              property.price_talks ||
                                0,
                            ) +
                            Number(
                              property.interests ||
                                0,
                            )
                          } strong
                        </span>

                        <Link
                          to={`/properties/${property.property_id}`}
                          className="rounded-lg bg-[#0b84e5] px-4 py-2 text-xs font-black text-white"
                        >
                          View
                        </Link>
                      </div>
                    </article>
                  ),
                )}

                {popularProperties.length ===
                  0 && (
                  <p className="py-12 text-center text-sm text-slate-500">
                    No property activity found.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default AdminAnalytics;
