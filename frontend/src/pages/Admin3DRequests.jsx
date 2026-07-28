import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Box,
  CalendarDays,
  LoaderCircle,
  MapPin,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";

const statusOptions = [
  "requested",
  "scheduled",
  "captured",
  "published",
  "cancelled",
];

function formatDate(value) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Admin3DRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/3d-requests");

      setRequests(
        Array.isArray(response.data?.requests)
          ? response.data.requests
          : [],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load 3D requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  function updateLocalValue(requestId, field, value) {
    setRequests((current) =>
      current.map((request) =>
        request.request_id === requestId
          ? { ...request, [field]: value }
          : request,
      ),
    );
  }

  async function saveRequest(request) {
    try {
      setUpdatingId(request.request_id);
      setError("");
      setMessage("");

      await api.patch(
        `/admin/3d-requests/${request.request_id}`,
        {
          status: request.status,
          scheduled_at: request.scheduled_at || null,
          admin_notes: request.admin_notes || null,
        },
      );

      setMessage("3D request updated.");
      await loadRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update 3D request.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b84e5] text-white">
              <Box size={23} />
            </div>

            <div>
              <p className="text-lg font-black text-slate-900">
                3D Shoot Requests
              </p>

              <p className="text-xs font-semibold text-slate-500">
                Company Dashboard
              </p>
            </div>
          </div>

          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#0b84e5]">
              3D Operations
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Shoot Requests
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Schedule and manage property 3D shoots.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
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

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center">
            <Box size={42} className="text-slate-400" />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No 3D requests
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              New seller requests will appear here.
            </p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="mt-8 space-y-5">
            {requests.map((request) => (
              <article
                key={request.request_id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      {request.title || "Property 3D Request"}
                    </h2>

                    <p className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                      <MapPin size={16} className="mt-0.5 shrink-0" />

                      {[request.address, request.city, request.state]
                        .filter(Boolean)
                        .join(", ") || "Location not available"}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                    {request.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <section className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="font-black text-slate-900">
                      Seller Details
                    </h3>

                    <p className="mt-3 text-sm text-slate-700">
                      {request.seller_name || "Name not available"}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {request.seller_phone || "Phone not available"}
                    </p>

                    <p className="mt-2 break-all text-sm text-slate-600">
                      {request.seller_email || "Email not available"}
                    </p>

                    <p className="mt-4 text-sm text-slate-500">
                      Seller note:{" "}
                      {request.seller_notes || "No note provided"}
                    </p>
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-4">
                    <label className="text-sm font-bold text-slate-700">
                      Request Status
                    </label>

                    <select
                      value={request.status}
                      onChange={(event) =>
                        updateLocalValue(
                          request.request_id,
                          "status",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm capitalize outline-none"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <label className="mt-4 block text-sm font-bold text-slate-700">
                      Shoot Date
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        request.scheduled_at
                          ? String(request.scheduled_at).slice(0, 16)
                          : ""
                      }
                      onChange={(event) =>
                        updateLocalValue(
                          request.request_id,
                          "scheduled_at",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none"
                    />

                    <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <CalendarDays size={14} />
                      {formatDate(request.scheduled_at)}
                    </p>

                    <textarea
                      rows={3}
                      value={request.admin_notes || ""}
                      onChange={(event) =>
                        updateLocalValue(
                          request.request_id,
                          "admin_notes",
                          event.target.value,
                        )
                      }
                      placeholder="Team notes"
                      className="mt-4 w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none"
                    />

                    <button
                      type="button"
                      disabled={updatingId === request.request_id}
                      onClick={() => saveRequest(request)}
                      className="mt-4 w-full rounded-xl bg-[#0b84e5] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                    >
                      {updatingId === request.request_id
                        ? "Saving..."
                        : "Save Request"}
                    </button>
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Admin3DRequests;
