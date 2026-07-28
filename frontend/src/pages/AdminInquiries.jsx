import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  LoaderCircle,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react";

import api from "../services/api";

const filters = ["all", "new", "seen", "replied"];

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

function getInquiryId(item) {
  return (
    item.inquiry_id ||
    item.request_id ||
    item.id
  );
}

function getBuyerName(item) {
  return (
    item.buyer_name ||
    item.user_name ||
    item.name ||
    "Buyer"
  );
}

function getBuyerEmail(item) {
  return (
    item.buyer_email ||
    item.user_email ||
    item.email ||
    ""
  );
}

function getBuyerPhone(item) {
  return (
    item.buyer_phone ||
    item.user_phone ||
    item.phone ||
    ""
  );
}

function getPropertyTitle(item) {
  return (
    item.property_title ||
    item.title ||
    `Property #${item.property_id || ""}`
  );
}

function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/inquiries");

      setInquiries(
        Array.isArray(response.data?.inquiries)
          ? response.data.inquiries
          : Array.isArray(response.data)
            ? response.data
            : [],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load buyer requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const counts = useMemo(
    () => ({
      all: inquiries.length,
      new: inquiries.filter(
        (item) => (item.status || "new") === "new",
      ).length,
      seen: inquiries.filter(
        (item) => item.status === "seen",
      ).length,
      replied: inquiries.filter(
        (item) => item.status === "replied",
      ).length,
    }),
    [inquiries],
  );

  const visibleInquiries = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return inquiries.filter((item) => {
      const status = item.status || "new";

      const matchesFilter =
        filter === "all" || status === filter;

      const searchableText = [
        getBuyerName(item),
        getBuyerEmail(item),
        getBuyerPhone(item),
        getPropertyTitle(item),
        item.message,
        item.request_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesFilter &&
        (!query || searchableText.includes(query))
      );
    });
  }, [inquiries, filter, searchText]);

  async function updateStatus(item, status) {
    const inquiryId = getInquiryId(item);

    if (!inquiryId) {
      setError("Request ID is missing.");
      return;
    }

    try {
      setUpdatingId(inquiryId);
      setError("");

      await api.patch(
        `/admin/inquiries/${inquiryId}`,
        { status },
      );

      setInquiries((current) =>
        current.map((request) =>
          getInquiryId(request) === inquiryId
            ? { ...request, status }
            : request,
        ),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update the buyer request.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function exportCsv() {
    if (visibleInquiries.length === 0) {
      setError("There are no requests to export.");
      return;
    }

    const headings = [
      "Request ID",
      "Buyer",
      "Phone",
      "Email",
      "Property",
      "Request Type",
      "Message",
      "Status",
      "Received At",
    ];

    const rows = visibleInquiries.map((item) => [
      getInquiryId(item),
      getBuyerName(item),
      getBuyerPhone(item),
      getBuyerEmail(item),
      getPropertyTitle(item),
      item.request_type || "Property Details",
      item.message || "",
      item.status || "new",
      formatDate(item.created_at),
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
    link.download = `buyer-requests-${new Date()
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
              Buyer Requests
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-[#0b84e5]">
              Property Support
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Manage Buyer Requests
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Review site visits, property details, and price
              discussion requests.
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
              onClick={loadInquiries}
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
              className={`rounded-2xl border p-4 text-left ${
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
            placeholder="Search buyer, property, phone, or request"
            className="min-h-14 w-full bg-transparent text-sm outline-none"
          />
        </div>

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : visibleInquiries.length === 0 ? (
          <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <MessageSquare
              size={42}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No matching buyer requests
            </h2>
          </div>
        ) : (
          <div className="mt-7 space-y-5">
            {visibleInquiries.map((item) => {
              const inquiryId = getInquiryId(item);
              const status = item.status || "new";

              return (
                <article
                  key={inquiryId}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-[#0b84e5]">
                        {item.request_type ||
                          "Property Request"}
                      </p>

                      <h2 className="mt-2 text-xl font-black text-slate-900">
                        {getPropertyTitle(item)}
                      </h2>

                      <p className="mt-2 font-bold text-slate-700">
                        {getBuyerName(item)}
                      </p>

                      <div className="mt-3 space-y-2 text-sm text-slate-500">
                        <p className="flex items-center gap-2">
                          <Phone size={16} />
                          {getBuyerPhone(item) ||
                            "Phone not provided"}
                        </p>

                        <p className="flex items-center gap-2">
                          <Mail size={16} />
                          {getBuyerEmail(item) ||
                            "Email not provided"}
                        </p>

                        <p className="flex items-center gap-2">
                          <Clock3 size={16} />
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`h-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        status === "new"
                          ? "bg-amber-100 text-amber-700"
                          : status === "seen"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                      {item.message ||
                        "No additional message provided."}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {status === "new" && (
                      <button
                        type="button"
                        disabled={updatingId === inquiryId}
                        onClick={() =>
                          updateStatus(item, "seen")
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 px-4 py-3 text-sm font-bold text-amber-700 disabled:opacity-60"
                      >
                        <Clock3 size={17} />
                        Start Working
                      </button>
                    )}

                    {status !== "replied" && (
                      <button
                        type="button"
                        disabled={updatingId === inquiryId}
                        onClick={() =>
                          updateStatus(item, "replied")
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                      >
                        <CheckCircle2 size={17} />
                        Mark Replied
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

export default AdminInquiries;
