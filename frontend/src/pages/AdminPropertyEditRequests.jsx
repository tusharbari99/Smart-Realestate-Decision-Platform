import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
} from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

function getUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}",
    );
  } catch {
    return {};
  }
}

function labelFor(field) {
  const labels = {
    title: "Property Title",
    description: "Description",
    price: "Seller Expected Price",
    property_type: "Property Type",
    area_sqft: "Area",
    address: "Address",
    city: "City",
    state: "State",
    latitude: "Latitude",
    longitude: "Longitude",
    amenities: "Facilities",
    known_issues: "Known Issues",
    needs_3d_shoot: "3D / 360° Shoot",
  };

  return labels[field] || field;
}

function displayValue(field, value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not specified";
  }

  if (field === "price") {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }

  if (field === "area_sqft") {
    return `${Number(value).toLocaleString("en-IN")} sq.ft`;
  }

  if (field === "needs_3d_shoot") {
    return value ? "Requested" : "Not requested";
  }

  if (field === "amenities") {
    if (Array.isArray(value)) {
      return value.join(", ") || "None";
    }

    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.join(", ") || "None";
      }
    } catch {
      return String(value);
    }
  }

  return String(value);
}


const changePriority = [
  "price",
  "title",
  "property_type",
  "area_sqft",
  "address",
  "city",
  "state",
  "latitude",
  "longitude",
  "amenities",
  "known_issues",
  "description",
  "needs_3d_shoot",
];

function normaliseComparableValue(field, value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (field === "needs_3d_shoot") {
    const normalised = String(value)
      .trim()
      .toLowerCase();

    return [
      "true",
      "1",
      "yes",
      "requested",
    ].includes(normalised);
  }

  if (
    [
      "price",
      "area_sqft",
      "latitude",
      "longitude",
    ].includes(field)
  ) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue)
      ? numberValue
      : String(value).trim();
  }

  if (field === "amenities") {
    let facilities = value;

    if (typeof facilities === "string") {
      try {
        const parsed = JSON.parse(facilities);

        facilities = Array.isArray(parsed)
          ? parsed
          : facilities.split(",");
      } catch {
        facilities = facilities.split(",");
      }
    }

    if (!Array.isArray(facilities)) {
      facilities = [facilities];
    }

    return facilities
      .map((item) =>
        String(item).trim().toLowerCase(),
      )
      .filter(Boolean)
      .sort()
      .join("|");
  }

  return String(value).trim();
}

function valuesAreSame(field, currentValue, requestedValue) {
  return (
    normaliseComparableValue(field, currentValue) ===
    normaliseComparableValue(field, requestedValue)
  );
}

function sortChangedEntries(entries) {
  return [...entries].sort(([fieldA], [fieldB]) => {
    const priorityA = changePriority.indexOf(fieldA);
    const priorityB = changePriority.indexOf(fieldB);

    const safePriorityA =
      priorityA === -1
        ? changePriority.length
        : priorityA;

    const safePriorityB =
      priorityB === -1
        ? changePriority.length
        : priorityB;

    return safePriorityA - safePriorityB;
  });
}

function AdminPropertyEditRequests() {
  const [requests, setRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] =
    useState(null);
  const [error, setError] = useState("");

  const user = getUser();
  const token = localStorage.getItem("token");

  const role = String(
    user.role ||
      user.user_type ||
      user.account_type ||
      "",
  ).toLowerCase();

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/property-edit-requests/admin/pending",
      );

      setRequests(response.data?.requests || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load edit requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function reviewRequest(
    requestId,
    status,
  ) {
    try {
      setUpdatingId(requestId);
      setError("");

      await api.patch(
        `/property-edit-requests/admin/${requestId}/status`,
        {
          status,
          admin_note: notes[requestId] || "",
        },
      );

      setRequests((current) =>
        current.filter(
          (request) =>
            request.request_id !== requestId,
        ),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not review edit request.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (!token) {
    return (
      <Navigate
        to="/auth?redirect=/admin/property-edit-requests"
        replace
      />
    );
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#075aa8]"
            >
              <ArrowLeft size={18} />
              Back to Admin Dashboard
            </Link>

            <p className="mt-7 text-sm font-black uppercase tracking-wider text-blue-600">
              Listing Change Verification
            </p>

            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Property Edit Requests
            </h1>

            <p className="mt-3 text-slate-500">
              Review every seller-requested change before it appears publicly.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <LoaderCircle
              size={42}
              className="animate-spin text-blue-600"
            />
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <CheckCircle2
              size={48}
              className="mx-auto text-emerald-500"
            />

            <h2 className="mt-5 text-2xl font-black text-slate-900">
              No pending edit requests
            </h2>

            <p className="mt-2 text-slate-500">
              All seller property changes have been reviewed.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-7">
            {requests.map((request) => {
              const changes =
                request.proposed_changes || {};

              const changedEntries = sortChangedEntries(
                Object.entries(changes).filter(
                  ([field, requestedValue]) => {
                    const currentValue =
                      request[`current_${field}`];

                    return !valuesAreSame(
                      field,
                      currentValue,
                      requestedValue,
                    );
                  },
                ),
              );

              const mainChange =
                changedEntries[0]?.[0] || null;

              return (
                <article
                  key={request.request_id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <header className="flex flex-col justify-between gap-5 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                        <Clock3 size={15} />
                        Pending Admin Review
                      </div>

                      <h2 className="mt-3 text-2xl font-black text-slate-900">
                        {request.current_title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Seller:{" "}
                        <strong>
                          {request.seller_name}
                        </strong>{" "}
                        · {request.seller_email}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 px-5 py-3">
                      <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                        Request ID
                      </p>
                      <p className="mt-1 font-black text-slate-900">
                        #{request.request_id}
                      </p>
                    </div>
                  </header>

                  <div className="p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <ShieldCheck
                        size={22}
                        className="text-[#075aa8]"
                      />
                      <h3 className="text-lg font-black text-slate-900">
                        Requested Changes
                      </h3>
                    </div>

                    <div
                      className={`mb-6 flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${
                        changedEntries.length > 0
                          ? "border-blue-200 bg-blue-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                          ACTUAL EDIT SUMMARY
                        </p>

                        <h4 className="mt-1 text-lg font-black text-slate-900">
                          {changedEntries.length === 0
                            ? "No real changes detected"
                            : `${changedEntries.length} actual ${
                                changedEntries.length === 1
                                  ? "change"
                                  : "changes"
                              } requested`}
                        </h4>

                        <p className="mt-1 text-sm text-slate-600">
                          {changedEntries.length === 0
                            ? "The seller submitted the same information already saved in the listing."
                            : "Only fields with different current and requested values are shown below."}
                        </p>
                      </div>

                      {mainChange && (
                        <div className="shrink-0 rounded-xl border border-blue-200 bg-white px-5 py-3">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Main Request
                          </p>

                          <p className="mt-1 font-black text-[#075aa8]">
                            {labelFor(mainChange)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      {changedEntries.map(
                        ([field, newValue]) => {
                          const oldValue =
                            request[`current_${field}`];

                          return (
                            <div
                              key={field}
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <p className="text-sm font-black text-slate-900">
                                {labelFor(field)}
                              </p>

                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl bg-red-50 p-3">
                                  <p className="text-xs font-black uppercase text-red-500">
                                    Current
                                  </p>
                                  <p className="mt-1 break-words text-sm font-bold text-slate-700">
                                    {displayValue(
                                      field,
                                      oldValue,
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-emerald-50 p-3">
                                  <p className="text-xs font-black uppercase text-emerald-600">
                                    Requested
                                  </p>
                                  <p className="mt-1 break-words text-sm font-bold text-slate-700">
                                    {displayValue(
                                      field,
                                      newValue,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>

                    <label className="mt-6 block">
                      <span className="mb-2 block text-sm font-bold text-slate-700">
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
                        className="w-full resize-none rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500"
                      />
                    </label>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          request.request_id
                        }
                        onClick={() =>
                          reviewRequest(
                            request.request_id,
                            "rejected",
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-300 px-5 py-4 font-black text-red-600 disabled:opacity-60"
                      >
                        <XCircle size={20} />
                        Reject Request
                      </button>

                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          request.request_id
                        }
                        onClick={() =>
                          reviewRequest(
                            request.request_id,
                            "approved",
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white disabled:opacity-60"
                      >
                        {updatingId ===
                        request.request_id ? (
                          <LoaderCircle
                            size={20}
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCircle2 size={20} />
                        )}

                        Approve and Update Property
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default AdminPropertyEditRequests;
