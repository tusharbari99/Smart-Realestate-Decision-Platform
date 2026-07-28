import { useEffect, useState } from "react";
import {
  Bell,
  BrainCircuit,
  Settings2,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Clock3,
  EyeOff,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import api from "../services/api";

function BuyerAiMenu() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const active =
    location.pathname.startsWith(
      "/buyer/recommendations",
    ) ||
    location.pathname.startsWith(
      "/buyer/smart-suggestions",
    ) ||
    location.pathname.startsWith(
      "/buyer/notifications",
    );

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const response = await api.get(
          "/personalization/notifications",
        );

        if (!cancelled) {
          setUnreadCount(
            Number(
              response.data?.unread_count || 0,
            ),
          );
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();

    function handleAlertCountUpdate(event) {
      setUnreadCount(
        Number(event.detail?.unreadCount || 0),
      );
    }

    window.addEventListener(
      "smartestate-alert-count-updated",
      handleAlertCountUpdate,
    );

    const interval = window.setInterval(
      loadUnreadCount,
      60000,
    );

    return () => {
      cancelled = true;

      window.clearInterval(interval);

      window.removeEventListener(
        "smartestate-alert-count-updated",
        handleAlertCountUpdate,
      );
    };
  }, [location.pathname]);

  return (
    <div className="group relative">
      <Link
        to="/buyer/recommendations"
        className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
          active
            ? "bg-white/20 text-white"
            : "bg-white/[0.03] text-white/90 hover:bg-white/10"
        }`}
      >
        <BrainCircuit size={16} />

        <span>AI Recommendations</span>

        <ChevronDown
          size={14}
          className="transition duration-200 group-hover:rotate-180"
        />

        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-lg">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </Link>

      <div className="pointer-events-none invisible absolute left-0 top-full z-[160] mt-2 w-64 -translate-y-2 rounded-2xl border border-white/30 bg-slate-950/95 p-2 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <Link
          to="/buyer/recommendations"
          className="flex items-start gap-3 rounded-xl px-3 py-3 text-white transition hover:bg-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
            <BrainCircuit size={18} />
          </div>

          <div>
            <p className="text-sm font-black">
              AI Recommendations
            </p>

            <p className="mt-1 text-[11px] leading-4 text-white/55">
              Explore AI property rankings.
            </p>
          </div>
        </Link>

        <Link
          to="/buyer/smart-suggestions"
          className="mt-1 flex items-start gap-3 rounded-xl px-3 py-3 text-white transition hover:bg-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
            <Sparkles size={18} />
          </div>

          <div>
            <p className="text-sm font-black">
              Smart Suggestions
            </p>

            <p className="mt-1 text-[11px] leading-4 text-white/55">
              Matches based on your activity.
            </p>
          </div>
        </Link>

        <Link
          to="/buyer/notifications"
          className="mt-1 flex items-start gap-3 rounded-xl px-3 py-3 text-white transition hover:bg-white/10"
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {unreadCount > 9
                  ? "9+"
                  : unreadCount}
              </span>
            )}
          </div>

          <div>
            <p className="text-sm font-black">
              Property Alerts
            </p>

            <p className="mt-1 text-[11px] leading-4 text-white/55">
              {unreadCount > 0
                ? `${unreadCount} new matching alert${
                    unreadCount === 1 ? "" : "s"
                  }.`
                : "No unread property alerts."}
            </p>
          </div>
        </Link>


        <Link
          to="/buyer/recently-viewed"
          className="mt-1 flex items-start gap-3 rounded-xl px-3 py-3 text-white transition hover:bg-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
            <Clock3 size={18} />
          </div>

          <div>
            <p className="text-sm font-black">
              Recently Viewed
            </p>

            <p className="mt-1 text-[11px] leading-4 text-white/55">
              Continue exploring previous properties.
            </p>
          </div>
        </Link>


        <Link
          to="/buyer/hidden-properties"
          className="mt-1 flex items-start gap-3 rounded-xl px-3 py-3 text-white transition hover:bg-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-500/20 text-slate-300">
            <EyeOff size={18} />
          </div>

          <div>
            <p className="text-sm font-black">
              Hidden Properties
            </p>

            <p className="mt-1 text-[11px] leading-4 text-white/55">
              Restore properties marked Not Interested.
            </p>
          </div>
        </Link>


        <Link
          to="/buyer/property-preferences"
          className="mt-1 flex items-start gap-3 rounded-xl px-3 py-3 text-white transition hover:bg-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300">
            <SlidersHorizontal size={18} />
          </div>

          <div>
            <p className="text-sm font-black">
              Set Preferences
            </p>

            <p className="mt-1 text-[11px] leading-4 text-white/55">
              Choose property type, budget and location.
            </p>
          </div>
        </Link>

        <Link
          to="/buyer/recommendation-settings"
          className="mt-1 flex items-start gap-3 rounded-xl px-3 py-3 text-white transition hover:bg-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
            <Settings2 size={18} />
          </div>

          <div>
            <p className="text-sm font-black">
              Recommendation Settings
            </p>

            <p className="mt-1 text-[11px] leading-4 text-white/55">
              Manage personalization and alerts.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default BuyerAiMenu;
