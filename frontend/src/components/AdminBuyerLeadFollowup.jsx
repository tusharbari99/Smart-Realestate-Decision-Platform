import { useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";

import api from "../services/api";

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

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

function AdminBuyerLeadFollowup({
  buyerId,
}) {
  const [form, setForm] = useState({
    lead_status: "new",
    admin_note: "",
    followup_date: "",
  });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFollowup() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/personalization/admin/hot-buyer-leads/${buyerId}/followup`,
        );

        const saved =
          response.data?.followup || {};

        setForm({
          lead_status:
            saved.lead_status || "new",

          admin_note:
            saved.admin_note || "",

          followup_date:
            toDateTimeLocal(
              saved.followup_date,
            ),
        });
      } catch (requestError) {
        setError(
          requestError.response?.data
            ?.message ||
            "Could not load follow-up.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadFollowup();
  }, [buyerId]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveFollowup(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await api.patch(
        `/personalization/admin/hot-buyer-leads/${buyerId}/followup`,
        {
          lead_status:
            form.lead_status,

          admin_note:
            form.admin_note,

          followup_date:
            form.followup_date
              ? new Date(
                  form.followup_date,
                ).toISOString()
              : null,
        },
      );

      setMessage(
        response.data?.message ||
          "Follow-up saved.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.message ||
          "Could not save follow-up.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
        <LoaderCircle
          size={17}
          className="animate-spin"
        />
        Loading follow-up
      </div>
    );
  }

  return (
    <form
      onSubmit={saveFollowup}
      className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <label>
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Lead Status
          </span>

          <select
            value={form.lead_status}
            onChange={(event) =>
              updateField(
                "lead_status",
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#0b84e5]"
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
        </label>

        <label>
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <CalendarClock size={15} />
            Follow-up Date
          </span>

          <input
            type="datetime-local"
            value={form.followup_date}
            onChange={(event) =>
              updateField(
                "followup_date",
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#0b84e5]"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {saving
              ? "Saving"
              : "Save Follow-up"}
          </button>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
          Private Admin Note
        </span>

        <textarea
          rows={3}
          value={form.admin_note}
          onChange={(event) =>
            updateField(
              "admin_note",
              event.target.value,
            )
          }
          placeholder="Write discussion details, buyer requirement or next action..."
          className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#0b84e5]"
        />
      </label>

      {message && (
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-green-700">
          <CheckCircle2 size={16} />
          {message}
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}

export default AdminBuyerLeadFollowup;
