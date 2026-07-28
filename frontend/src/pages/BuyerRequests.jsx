import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import Navbar from "../components/Navbar";
import api from "../services/api";

function statusLabel(status) {
  if (status === "seen") return "In Progress";
  if (status === "replied") return "Completed";
  return "New";
}

function statusStyle(status) {
  if (status === "seen") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "replied") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-blue-100 text-blue-700";
}

function formatDate(value) {
  if (!value) return "Date not available";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function BuyerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/buyer/inquiries");

      setRequests(
        Array.isArray(response.data?.inquiries)
          ? response.data.inquiries
          : [],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load your requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#075aa8]"
        >
          <ArrowLeft size={17} />
          Home
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#0b84e5]">
              Buying Support
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              My Requests
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Track your property questions, site visits, and price talks.
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

        {!loading && !error && requests.length === 0 && (
          <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <MessageSquare size={42} className="text-slate-400" />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No requests yet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Open a property and select “I'm Interested” to send
              your first request.
            </p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="mt-8 space-y-4">
            {requests.map((request) => (
              <article
                key={request.inquiry_id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {request.title || "Property Request"}
                    </h2>

                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin size={15} />
                      Property #{request.property_id}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyle(
                      request.status,
                    )}`}
                  >
                    {statusLabel(request.status)}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {request.message}
                  </p>
                </div>

                <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    {request.status === "replied" ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <Clock3 size={15} />
                    )}

                    {formatDate(request.created_at)}
                  </p>

                  <Link
                    to={`/properties/${request.property_id}`}
                    className="rounded-xl bg-blue-50 px-4 py-2 text-center text-sm font-bold text-[#075aa8]"
                  >
                    View Property
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default BuyerRequests;
