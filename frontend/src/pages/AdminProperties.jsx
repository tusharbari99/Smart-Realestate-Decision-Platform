import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import api from "../services/api";

const filters = [
  "all",
  "pending",
  "verified",
  "rejected",
];

function getPropertyId(property) {
  return (
    property.property_id ||
    property.id
  );
}

function getSellerName(property) {
  return (
    property.seller_name ||
    property.owner_name ||
    property.user_name ||
    "Seller"
  );
}

function getLocation(property) {
  return [
    property.locality,
    property.city,
  ]
    .filter(Boolean)
    .join(", ") || property.location || "Location not provided";
}

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Price not available";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "Date not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await api.get("/admin/properties");

      setProperties(
        Array.isArray(response.data?.properties)
          ? response.data.properties
          : Array.isArray(response.data)
            ? response.data
            : [],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load properties.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const counts = useMemo(
    () => ({
      all: properties.length,
      pending: properties.filter(
        (property) =>
          (property.status || "pending") === "pending",
      ).length,
      verified: properties.filter(
        (property) => property.status === "verified",
      ).length,
      rejected: properties.filter(
        (property) => property.status === "rejected",
      ).length,
    }),
    [properties],
  );

  const visibleProperties = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return properties.filter((property) => {
      const status = property.status || "pending";

      const matchesStatus =
        filter === "all" || status === filter;

      const searchableText = [
        property.title,
        property.property_type,
        property.locality,
        property.city,
        property.location,
        getSellerName(property),
        property.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [properties, filter, searchText]);

  async function updateStatus(property, status) {
    const propertyId = getPropertyId(property);

    if (!propertyId) {
      setError("Property ID is missing.");
      return;
    }

    try {
      setUpdatingId(propertyId);
      setError("");
      setMessage("");

      await api.post(
        `/admin/properties/${propertyId}/status`,
        { status },
      );

      setProperties((current) =>
        current.map((item) =>
          getPropertyId(item) === propertyId
            ? { ...item, status }
            : item,
        ),
      );

      setMessage(
        status === "verified"
          ? "Property verified successfully."
          : "Property rejected successfully.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update property status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function exportCsv() {
    if (visibleProperties.length === 0) {
      setError("There are no properties to export.");
      return;
    }

    setError("");

    const headings = [
      "Property ID",
      "Title",
      "Property Type",
      "Location",
      "Seller",
      "Seller Price",
      "Status",
      "3D Shoot Required",
      "Created At",
    ];

    const rows = visibleProperties.map((property) => [
      getPropertyId(property),
      property.title || "",
      property.property_type || "",
      getLocation(property),
      getSellerName(property),
      property.price ||
        property.seller_price ||
        "",
      property.status || "pending",
      property.needs_3d_shoot ? "Yes" : "No",
      formatDate(property.created_at),
    ]);

    const csv = [
      headings.map(escapeCsv).join(","),
      ...rows.map((row) =>
        row.map(escapeCsv).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `properties-${filter}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-lg font-black text-slate-900">
              Manage Properties
            </p>

            <p className="text-xs font-semibold text-slate-500">
              Company Dashboard
            </p>
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
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-[#0b84e5]">
              Property Review
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              All Property Listings
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Search, review, verify, reject, and export property
              listings.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              <Download size={17} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={loadProperties}
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
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-2xl border p-4 text-left transition ${
                filter === item
                  ? "border-[#0b84e5] bg-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                {item}
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {counts[item]}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <Search size={19} className="text-slate-400" />

          <input
            type="search"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
            placeholder="Search property, seller, location, or type"
            className="min-h-14 w-full bg-transparent text-sm outline-none"
          />
        </div>

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : visibleProperties.length === 0 ? (
          <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <Building2
              size={42}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No matching properties
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Change the search text or status filter.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {visibleProperties.map((property) => {
              const propertyId = getPropertyId(property);
              const status = property.status || "pending";
              const price =
                property.price ||
                property.seller_price;

              return (
                <article
                  key={propertyId}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0b84e5]">
                        <Building2 size={25} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-black text-slate-900">
                          {property.title || "Untitled Property"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {getLocation(property)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        status === "verified"
                          ? "bg-emerald-100 text-emerald-700"
                          : status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        Seller
                      </p>

                      <p className="mt-1 font-bold text-slate-700">
                        {getSellerName(property)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        Property Type
                      </p>

                      <p className="mt-1 font-bold capitalize text-slate-700">
                        {property.property_type || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        Seller Price
                      </p>

                      <p className="mt-1 font-bold text-slate-700">
                        {formatPrice(price)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        Submitted
                      </p>

                      <p className="mt-1 font-bold text-slate-700">
                        {formatDate(property.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      to={`/properties/${propertyId}`}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
                    >
                      <Eye size={17} />
                      View Details
                    </Link>

                    {status !== "verified" && (
                      <button
                        type="button"
                        disabled={updatingId === propertyId}
                        onClick={() =>
                          updateStatus(property, "verified")
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                      >
                        <CheckCircle2 size={17} />
                        Verify
                      </button>
                    )}

                    {status !== "rejected" && (
                      <button
                        type="button"
                        disabled={updatingId === propertyId}
                        onClick={() =>
                          updateStatus(property, "rejected")
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-300 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-60"
                      >
                        <XCircle size={17} />
                        Reject
                      </button>
                    )}
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

export default AdminProperties;
