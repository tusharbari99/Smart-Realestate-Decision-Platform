import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Video,
  XCircle,
} from "lucide-react";

import api from "../services/api";

const API_ORIGIN = String(
  import.meta.env.VITE_API_URL ||
    "http://localhost:5001/api",
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

function assetUrl(url) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_ORIGIN}${url}`;
}

function AdminPropertyMediaRequests() {
  const [requests, setRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/property-media/admin/requests?status=pending",
      );

      setRequests(response.data?.requests || []);
    } catch (requestError) {
      console.error(
        "Admin media request load error:",
        requestError,
      );

      setError(
        requestError.response?.data?.message ||
          "Could not load property media requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function reviewRequest(requestId, action) {
    try {
      setWorkingId(`${action}-${requestId}`);
      setError("");
      setMessage("");

      const response = await api.patch(
        `/property-media/admin/requests/${requestId}`,
        {
          action,
          admin_note: notes[requestId]?.trim() || "",
        },
      );

      setMessage(
        response.data?.message ||
          `Media request ${
            action === "approve"
              ? "approved"
              : "rejected"
          }.`,
      );

      setRequests((current) =>
        current.filter(
          (request) =>
            Number(request.request_id) !==
            Number(requestId),
        ),
      );
    } catch (requestError) {
      console.error(
        "Admin media review error:",
        requestError,
      );

      setError(
        requestError.response?.data?.message ||
          "Could not review this media request.",
      );
    } finally {
      setWorkingId("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Smart Real Estate
            </p>

            <h1 className="mt-1 text-xl font-black text-slate-950">
              Company Dashboard
            </h1>
          </div>

          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            Admin Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
              Admin Media Review
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Property Photo and Video Requests
            </h2>

            <p className="mt-3 max-w-3xl text-slate-600">
              Seller-uploaded photos and videos become
              visible to buyers only after your approval.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-black text-white disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
            Refresh Requests
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-bold text-blue-700">
            Pending media requests
          </p>

          <p className="mt-1 text-3xl font-black text-blue-950">
            {requests.length}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">
            <CheckCircle2 size={20} />
            {message}
          </div>
        )}

        {loading ? (
          <div className="mt-10 flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16">
            <LoaderCircle
              size={38}
              className="animate-spin text-blue-600"
            />
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-14 text-center">
            <CheckCircle2
              size={48}
              className="mx-auto text-emerald-600"
            />

            <h3 className="mt-5 text-2xl font-black text-emerald-900">
              No media requests are pending
            </h3>

            <p className="mt-2 text-emerald-700">
              All property photos and videos have been
              reviewed.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-7 lg:grid-cols-2">
            {requests.map((request) => {
              const isImage =
                request.media_type === "image";

              return (
                <article
                  key={request.request_id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                          Pending Review
                        </span>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          Request #{request.request_id}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-black text-slate-950">
                        {request.property_title ||
                          `Property #${request.property_id}`}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {request.address ||
                          "Address not specified"}
                        {request.city
                          ? `, ${request.city}`
                          : ""}
                      </p>

                      <p className="mt-3 text-sm text-slate-600">
                        Seller:{" "}
                        <span className="font-bold text-slate-900">
                          {request.seller_name ||
                            `Seller #${request.seller_id}`}
                        </span>
                      </p>

                      {request.seller_email && (
                        <p className="mt-1 text-sm text-slate-500">
                          {request.seller_email}
                        </p>
                      )}
                    </div>

                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isImage
                          ? "bg-blue-50 text-blue-600"
                          : "bg-violet-50 text-violet-600"
                      }`}
                    >
                      {isImage ? (
                        <ImageIcon size={24} />
                      ) : (
                        <Video size={24} />
                      )}
                    </div>
                  </div>

                  <div className="flex h-[360px] items-center justify-center bg-slate-950">
                    {isImage ? (
                      <img
                        src={assetUrl(
                          request.pending_url,
                        )}
                        alt={
                          request.file_name ||
                          "Pending property"
                        }
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <video
                        src={assetUrl(
                          request.pending_url,
                        )}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="p-5">
                    <p className="truncate text-sm font-black text-slate-800">
                      {request.file_name ||
                        `Property ${request.media_type}`}
                    </p>

                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {request.media_type}
                    </p>

                    <label className="mt-5 block">
                      <span className="text-sm font-black text-slate-700">
                        Admin Note
                      </span>

                      <textarea
                        rows={3}
                        value={
                          notes[request.request_id] || ""
                        }
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [request.request_id]:
                              event.target.value,
                          }))
                        }
                        placeholder="Optional approval note or rejection reason"
                        className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={Boolean(workingId)}
                        onClick={() =>
                          reviewRequest(
                            request.request_id,
                            "reject",
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 font-black text-red-600 disabled:opacity-50"
                      >
                        {workingId ===
                        `reject-${request.request_id}` ? (
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <XCircle size={18} />
                        )}
                        Reject Request
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(workingId)}
                        onClick={() =>
                          reviewRequest(
                            request.request_id,
                            "approve",
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-50"
                      >
                        {workingId ===
                        `approve-${request.request_id}` ? (
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}
                        Approve and Publish
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPropertyMediaRequests;
