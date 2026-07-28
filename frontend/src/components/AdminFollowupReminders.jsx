import { useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router";

import api from "../services/api";

function formatDate(value) {
  if (!value) return "No date";

  return new Date(value).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function DueBadge({ status }) {
  const styles = {
    overdue: "bg-red-100 text-red-700",
    today: "bg-amber-100 text-amber-700",
    upcoming: "bg-blue-100 text-blue-700",
  };

  const labels = {
    overdue: "Overdue",
    today: "Due Today",
    upcoming: "Upcoming",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function AdminFollowupReminders() {
  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [updatingId, setUpdatingId] =
    useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] =
    useState("");

  async function loadReminders() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/personalization/admin/hot-buyer-leads/followups/due",
      );

      setData(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load follow-up reminders.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateReminder(
    item,
    action,
  ) {
    try {
      setUpdatingId(item.followup_id);
      setError("");
      setMessage("");

      let nextDate = null;

      if (action === "tomorrow") {
        const date = new Date();

        date.setDate(date.getDate() + 1);
        date.setHours(10, 0, 0, 0);

        nextDate = date.toISOString();
      }

      if (action === "next_week") {
        const date = new Date();

        date.setDate(date.getDate() + 7);
        date.setHours(10, 0, 0, 0);

        nextDate = date.toISOString();
      }

      await api.patch(
        `/personalization/admin/hot-buyer-leads/${item.buyer_id}/followup`,
        {
          lead_status:
            item.lead_status || "new",

          admin_note:
            item.admin_note || "",

          followup_date: nextDate,
        },
      );

      setMessage(
        action === "done"
          ? "Follow-up marked as done."
          : "Follow-up reminder updated.",
      );

      await loadReminders();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update follow-up reminder.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    loadReminders();
  }, []);

  const reminders =
    data?.reminders || [];

  const summary =
    data?.summary || {};

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600">
            <CalendarClock size={16} />
            Follow-up Reminders
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-900">
            Buyer Follow-ups Due
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {summary.overdue || 0} overdue,{" "}
            {summary.today || 0} due today and{" "}
            {summary.upcoming || 0} upcoming.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReminders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-60"
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

      {message && (
        <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
          <TriangleAlert size={17} />
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center">
          <LoaderCircle
            size={32}
            className="animate-spin text-[#0b84e5]"
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {reminders.slice(0, 8).map(
            (item) => {
              const updating =
                updatingId ===
                item.followup_id;

              return (
                <article
                  key={item.followup_id}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-black text-slate-900">
                          {item.buyer_name ||
                            "Buyer"}
                        </p>

                        <DueBadge
                          status={
                            item.due_status
                          }
                        />
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.buyer_email}
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Clock3 size={14} />

                        {formatDate(
                          item.followup_date,
                        )}
                      </p>
                    </div>

                    <Link
                      to={`/admin/hot-buyer-leads?buyer=${item.buyer_id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                    >
                      Open Lead
                      <ChevronRight size={16} />
                    </Link>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        updateReminder(
                          item,
                          "done",
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-green-100 px-4 py-2.5 text-xs font-black text-green-700 disabled:opacity-50"
                    >
                      {updating ? (
                        <LoaderCircle
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Check size={15} />
                      )}

                      Mark Done
                    </button>

                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        updateReminder(
                          item,
                          "tomorrow",
                        )
                      }
                      className="rounded-xl bg-amber-100 px-4 py-2.5 text-xs font-black text-amber-700 disabled:opacity-50"
                    >
                      Tomorrow
                    </button>

                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        updateReminder(
                          item,
                          "next_week",
                        )
                      }
                      className="rounded-xl bg-blue-100 px-4 py-2.5 text-xs font-black text-blue-700 disabled:opacity-50"
                    >
                      Next Week
                    </button>
                  </div>
                </article>
              );
            },
          )}

          {reminders.length === 0 && (
            <div className="rounded-2xl bg-green-50 py-10 text-center">
              <CalendarClock
                size={34}
                className="mx-auto text-green-600"
              />

              <p className="mt-3 font-black text-green-800">
                No follow-ups are due.
              </p>

              <p className="mt-1 text-sm text-green-700">
                Your buyer lead follow-ups are up to date.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default AdminFollowupReminders;
