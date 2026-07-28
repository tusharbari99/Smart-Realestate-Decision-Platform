import { useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleUserRound,
  Flame,
  LoaderCircle,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

const columns = [
  {
    key: "new",
    title: "New Leads",
  },
  {
    key: "contacted",
    title: "Contacted",
  },
  {
    key: "site_visit_planned",
    title: "Site Visit",
  },
  {
    key: "negotiating",
    title: "Negotiating",
  },
  {
    key: "converted",
    title: "Converted",
  },
];

const statusOptions = [
  {
    value: "new",
    label: "New",
  },
  {
    value: "contacted",
    label: "Contacted",
  },
  {
    value: "site_visit_planned",
    label: "Site Visit Planned",
  },
  {
    value: "negotiating",
    label: "Negotiating",
  },
  {
    value: "converted",
    label: "Converted",
  },
  {
    value: "not_interested",
    label: "Not Interested",
  },
];

function formatDate(value) {
  if (!value) return "No follow-up";

  return new Date(value).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function LeadCard({
  lead,
  updatingBuyer,
  onStatusChange,
}) {
  const updating =
    updatingBuyer === lead.buyer_id;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-900">
            {lead.buyer_name}
          </p>

          <p className="mt-1 break-all text-xs text-slate-500">
            {lead.email}
          </p>
        </div>

        <div className="rounded-xl bg-orange-50 px-3 py-2 text-center">
          <Flame
            size={15}
            className="mx-auto text-orange-600"
          />

          <p className="mt-1 text-sm font-black text-orange-700">
            {lead.intent_score}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-lg font-black text-slate-900">
            {lead.total_actions}
          </p>

          <p className="text-[11px] text-slate-500">
            Actions
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-lg font-black text-slate-900">
            {lead.explored_properties}
          </p>

          <p className="text-[11px] text-slate-500">
            Properties
          </p>
        </div>
      </div>

      {lead.followup_date && (
        <p className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
          <CalendarClock size={14} />
          {formatDate(lead.followup_date)}
        </p>
      )}

      {lead.admin_note && (
        <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {lead.admin_note}
        </p>
      )}

      <select
        value={lead.lead_status}
        disabled={updating}
        onChange={(event) =>
          onStatusChange(
            lead,
            event.target.value,
          )
        }
        className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-black text-slate-700 outline-none disabled:opacity-60"
      >
        {statusOptions.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <Link
        to={`/admin/hot-buyer-leads?buyer=${lead.buyer_id}`}
        className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
      >
        <CircleUserRound size={15} />
        Open Lead Details
      </Link>
    </article>
  );
}

function AdminLeadPipeline() {
  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [updatingBuyer, setUpdatingBuyer] =
    useState(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] =
    useState("");
  const [error, setError] = useState("");

  async function loadPipeline() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/personalization/admin/lead-pipeline",
      );

      setData(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load lead pipeline.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(
    lead,
    nextStatus,
  ) {
    try {
      setUpdatingBuyer(lead.buyer_id);
      setMessage("");
      setError("");

      await api.patch(
        `/personalization/admin/hot-buyer-leads/${lead.buyer_id}/followup`,
        {
          lead_status: nextStatus,
          admin_note:
            lead.admin_note || "",
          followup_date:
            lead.followup_date || null,
        },
      );

      setMessage(
        `${lead.buyer_name} moved successfully.`,
      );

      await loadPipeline();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update lead status.",
      );
    } finally {
      setUpdatingBuyer(null);
    }
  }

  useEffect(() => {
    loadPipeline();
  }, []);

  const pipeline = data?.pipeline || {};
  const summary = data?.summary || {};

  const normalizedQuery = query
    .trim()
    .toLowerCase();

  function filteredLeads(status) {
    const leads = pipeline[status] || [];

    if (!normalizedQuery) return leads;

    return leads.filter((lead) => {
      return (
        String(lead.buyer_name || "")
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(lead.email || "")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
            <Users size={18} />
            Sales Workflow
          </p>

          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-black">
                Lead Pipeline
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Move buyers through each stage from
                first interest to completed conversion.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPipeline}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh Pipeline
            </button>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase text-slate-400">
              Total Leads
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary.total || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase text-slate-400">
              Negotiating
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary.negotiating || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase text-slate-400">
              Converted
            </p>

            <p className="mt-2 text-3xl font-black text-green-700">
              {summary.converted || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase text-slate-400">
              Closed
            </p>

            <p className="mt-2 text-3xl font-black text-slate-500">
              {summary.not_interested || 0}
            </p>
          </div>
        </section>

        <label className="relative mt-7 block max-w-xl">
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
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#0b84e5]"
          />
        </label>

        {message && (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-700">
            <CheckCircle2 size={17} />
            {message}
          </p>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
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
            <section className="mt-7 grid gap-4 xl:grid-cols-5">
              {columns.map((column) => {
                const leads =
                  filteredLeads(column.key);

                return (
                  <div
                    key={column.key}
                    className="min-w-0 rounded-3xl bg-slate-100 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-black text-slate-900">
                        {column.title}
                      </h2>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                        {leads.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {leads.map((lead) => (
                        <LeadCard
                          key={lead.buyer_id}
                          lead={lead}
                          updatingBuyer={
                            updatingBuyer
                          }
                          onStatusChange={
                            changeStatus
                          }
                        />
                      ))}

                      {leads.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-10 text-center">
                          <Users
                            size={26}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-3 text-xs font-bold text-slate-500">
                            No leads
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>

            {(pipeline.not_interested || [])
              .length > 0 && (
              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">
                <h2 className="font-black text-slate-900">
                  Not Interested
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Closed buyer leads.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredLeads(
                    "not_interested",
                  ).map((lead) => (
                    <LeadCard
                      key={lead.buyer_id}
                      lead={lead}
                      updatingBuyer={
                        updatingBuyer
                      }
                      onStatusChange={
                        changeStatus
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default AdminLeadPipeline;
