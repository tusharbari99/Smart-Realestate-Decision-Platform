import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CheckCheck,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

function BuyerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);

      const response = await api.get(
        "/personalization/notifications",
      );

      setNotifications(
        response.data?.notifications || [],
      );

      setUnreadCount(
        Number(response.data?.unread_count || 0),
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not load alerts.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function scanMatches() {
    try {
      setScanning(true);
      setMessage("");

      const response = await api.post(
        "/personalization/notifications/scan",
      );

      setMessage(
        response.data?.message ||
          "Match scan completed.",
      );

      await loadNotifications();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not scan new matches.",
      );
    } finally {
      setScanning(false);
    }
  }

  async function markRead(notificationId) {
    try {
      await api.patch(
        `/personalization/notifications/${notificationId}/read`,
      );

      setNotifications((current) =>
        current.map((item) =>
          item.notification_id === notificationId
            ? { ...item, is_read: 1 }
            : item,
        ),
      );

      setUnreadCount((count) =>
        Math.max(count - 1, 0),
      );
    } catch {
      // Keep page usable if update fails.
    }
  }

  async function markAllRead() {
    try {
      await api.patch(
        "/personalization/notifications/read-all",
      );

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: 1,
        })),
      );

      setUnreadCount(0);
    } catch {
      setMessage(
        "Could not mark all alerts as read.",
      );
    }
  }

  useEffect(() => {
    async function startPage() {
      try {
        await api.post(
          "/personalization/notifications/scan",
        );
      } catch {
        // Notification list can still be loaded.
      }

      await loadNotifications();
    }

    startPage();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
                <Bell size={18} />
                Property Alerts
              </p>

              <h1 className="mt-3 text-3xl font-black">
                New Matches For You
              </h1>

              <p className="mt-3 text-sm text-slate-300">
                We show verified properties that match your activity.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 text-center">
              <p className="text-3xl font-black">
                {unreadCount}
              </p>
              <p className="text-xs text-slate-300">
                Unread alerts
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={scanMatches}
            disabled={scanning}
            className="flex items-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={scanning ? "animate-spin" : ""}
            />
            Check New Matches
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              <CheckCheck size={17} />
              Mark All Read
            </button>
          )}
        </div>

        {message && (
          <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
            {message}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle
              size={40}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : notifications.length === 0 ? (
          <section className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <Bell
              size={45}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No property alerts yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Browse, save and compare properties to improve your matches.
            </p>

            <Link
              to="/properties"
              className="mt-6 inline-flex rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-bold text-white"
            >
              Browse Properties
            </Link>
          </section>
        ) : (
          <div className="mt-7 space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.notification_id}
                className={`rounded-2xl border p-5 transition ${
                  notification.is_read
                    ? "border-slate-200 bg-white"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b84e5] shadow-sm">
                    <Building2 size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-violet-600">
                          {notification.recommendation_score}% Match
                        </p>

                        <h2 className="mt-1 font-black text-slate-900">
                          {notification.title}
                        </h2>
                      </div>

                      {!notification.is_read && (
                        <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase text-white">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {notification.property_id && (
                        <Link
                          to={`/properties/${notification.property_id}`}
                          onClick={() =>
                            markRead(
                              notification.notification_id,
                            )
                          }
                          className="rounded-xl bg-[#0b84e5] px-4 py-2.5 text-xs font-bold text-white"
                        >
                          View Property
                        </Link>
                      )}

                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() =>
                            markRead(
                              notification.notification_id,
                            )
                          }
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-600"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default BuyerNotifications;
