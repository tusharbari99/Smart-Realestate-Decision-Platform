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

const filters = ["all", "new", "seen", "closed"];

function formatDate(value) {
  if (!value) return "Date not available";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function escapeCsv(value) {
  const text = String(value ?? "");

  return `"${text.replaceAll('"', '""')}"`;
}

function AdminSupportMessages() {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/admin/support-messages",
      );

      setMessages(
        Array.isArray(response.data?.messages)
          ? response.data.messages
          : [],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load support messages.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const counts = useMemo(
    () => ({
      all: messages.length,
      new: messages.filter(
        (item) => item.status === "new",
      ).length,
      seen: messages.filter(
        (item) => item.status === "seen",
      ).length,
      closed: messages.filter(
        (item) => item.status === "closed",
      ).length,
    }),
    [messages],
  );

  const visibleMessages = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return messages.filter((item) => {
      const matchesStatus =
        filter === "all" || item.status === filter;

      const searchableText = [
        item.name,
        item.phone,
        item.email,
        item.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [messages, filter, searchText]);

  async function updateStatus(messageId, status) {
    try {
      setUpdatingId(messageId);
      setError("");

      await api.patch(
        `/admin/support-messages/${messageId}`,
        { status },
      );

      setMessages((current) =>
        current.map((message) =>
          message.message_id === messageId
            ? { ...message, status }
            : message,
        ),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update support message.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function exportMessages() {
    if (visibleMessages.length === 0) {
      setError("There are no messages to export.");
      return;
    }

    const headings = [
      "Message ID",
      "Name",
      "Phone",
      "Email",
      "Message",
      "Status",
      "Received At",
    ];

    const rows = visibleMessages.map((item) => [
      item.message_id,
      item.name,
      item.phone,
      item.email || "",
      item.message,
      item.status,
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
    link.download = `support-messages-${new Date()
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
              Support Inbox
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
              Customer Support
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Support Messages
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Search, review, update, and export customer
              messages.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={exportMessages}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              <Download size={17} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={loadMessages}
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
            placeholder="Search name, phone, email, or message"
            className="min-h-14 w-full bg-transparent text-sm outline-none"
          />
        </div>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <MessageSquare
              size={40}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No matching messages
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Change the search text or status filter.
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-5">
            {visibleMessages.map((item) => (
              <article
                key={item.message_id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      {item.name}
                    </h2>

                    <div className="mt-3 space-y-2 text-sm text-slate-500">
                      <p className="flex items-center gap-2">
                        <Phone size={16} />
                        {item.phone}
                      </p>

                      <p className="flex items-center gap-2">
                        <Mail size={16} />
                        {item.email || "Email not provided"}
                      </p>

                      <p className="flex items-center gap-2">
                        <Clock3 size={16} />
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`h-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      item.status === "new"
                        ? "bg-amber-100 text-amber-700"
                        : item.status === "seen"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {item.message}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {item.status === "new" && (
                    <button
                      type="button"
                      disabled={
                        updatingId === item.message_id
                      }
                      onClick={() =>
                        updateStatus(
                          item.message_id,
                          "seen",
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 px-4 py-3 text-sm font-bold text-amber-700 disabled:opacity-60"
                    >
                      <Clock3 size={17} />
                      Start Working
                    </button>
                  )}

                  {item.status !== "closed" && (
                    <button
                      type="button"
                      disabled={
                        updatingId === item.message_id
                      }
                      onClick={() =>
                        updateStatus(
                          item.message_id,
                          "closed",
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                    >
                      <CheckCircle2 size={17} />
                      Close Message
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminSupportMessages;
