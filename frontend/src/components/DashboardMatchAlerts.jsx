import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCheck,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

import api from "../services/api";

function DashboardMatchAlerts() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadAlerts() {
    try {
      const response = await api.get(
        "/personalization/notifications",
      );

      const allNotifications =
        response.data?.notifications || [];

      setNotifications(
        allNotifications
          .filter(
            (notification) =>
              !Boolean(notification.is_read),
          )
          .slice(0, 3),
      );

      setUnreadCount(
        Number(response.data?.unread_count || 0),
      );
    } catch (error) {
      console.warn(
        "Dashboard alerts skipped:",
        error.response?.data?.message ||
          error.message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function markRead(notificationId) {
    try {
      await api.patch(
        `/personalization/notifications/${notificationId}/read`,
      );

      setNotifications((current) =>
        current.filter(
          (item) =>
            item.notification_id !== notificationId,
        ),
      );

      setUnreadCount((count) =>
        Math.max(count - 1, 0),
      );

      window.dispatchEvent(
        new CustomEvent(
          "smartestate-alert-count-updated",
          {
            detail: {
              unreadCount: Math.max(
                unreadCount - 1,
                0,
              ),
            },
          },
        ),
      );
    } catch (error) {
      console.warn(
        "Alert read update skipped:",
        error.response?.data?.message ||
          error.message,
      );
    }
  }

  async function markAllRead() {
    try {
      await api.patch(
        "/personalization/notifications/read-all",
      );

      setNotifications([]);
      setUnreadCount(0);

      window.dispatchEvent(
        new CustomEvent(
          "smartestate-alert-count-updated",
          {
            detail: {
              unreadCount: 0,
            },
          },
        ),
      );
    } catch (error) {
      console.warn(
        "Mark all alerts skipped:",
        error.response?.data?.message ||
          error.message,
      );
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  if (loading) {
    return (
      <section className="mt-8 flex min-h-28 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <LoaderCircle
          size={28}
          className="animate-spin text-[#0b84e5]"
        />
      </section>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 bg-gradient-to-r from-slate-950 to-violet-950 p-5 text-white sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-violet-300">
            <Sparkles size={16} />
            New Matches
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Properties Matching Your Preferences
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            You have {unreadCount} unread property
            {unreadCount === 1 ? " alert" : " alerts"}.
          </p>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/20"
        >
          <CheckCheck size={16} />
          Mark All Read
        </button>
      </div>

      <div className="divide-y divide-slate-200">
        {notifications.map((notification) => (
          <article
            key={notification.notification_id}
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Building2 size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-black text-slate-900">
                  {notification.title ||
                    "Matching Property"}
                </h3>

                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black text-violet-700">
                  {Number(
                    notification.recommendation_score || 0,
                  )}
                  % Match
                </span>
              </div>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                {notification.message}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() =>
                  markRead(
                    notification.notification_id,
                  )
                }
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-600"
              >
                Dismiss
              </button>

              {notification.property_id && (
                <Link
                  to={`/properties/${notification.property_id}`}
                  onClick={() =>
                    markRead(
                      notification.notification_id,
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-4 py-2.5 text-xs font-black text-white"
                >
                  View Property
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {unreadCount > 3 && (
        <Link
          to="/buyer/notifications"
          className="flex items-center justify-center gap-2 border-t border-slate-200 px-5 py-4 text-sm font-black text-[#0b84e5]"
        >
          <Bell size={16} />
          View All {unreadCount} Alerts
        </Link>
      )}
    </section>
  );
}

export default DashboardMatchAlerts;
