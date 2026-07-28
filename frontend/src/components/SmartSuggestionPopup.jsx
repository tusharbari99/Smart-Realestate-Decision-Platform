import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "react-router";

import api from "../services/api";

function getBuyer() {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null",
    );

    if (
      !user ||
      String(user.role || "").toLowerCase() !== "buyer"
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

function getPropertyId(property) {
  return property?.property_id || property?.id;
}

function getPrice(property) {
  const amount = Number(
    property?.display_price ||
      property?.price ||
      property?.seller_price ||
      0,
  );

  if (!amount) {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getLocation(property) {
  return (
    [property?.locality, property?.city]
      .filter(Boolean)
      .join(", ") ||
    property?.location ||
    "View property details"
  );
}

function isRecentlyAdded(property) {
  if (!property?.created_at) return false;

  const createdAt = new Date(
    property.created_at,
  ).getTime();

  if (!Number.isFinite(createdAt)) {
    return false;
  }

  const ageInDays =
    (Date.now() - createdAt) /
    (1000 * 60 * 60 * 24);

  return ageInDays >= 0 && ageInDays <= 14;
}

function SmartSuggestionPopup({ enabled }) {
  const [property, setProperty] = useState(null);
  const [visible, setVisible] = useState(false);
  const [newMatch, setNewMatch] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const buyer = getBuyer();

    if (!buyer) return;

    /*
     * First website visit only records the visit.
     * From the second visit, show one popup per session.
     */
    const firstVisitKey =
      "smartestate_first_buyer_visit_done";

    if (!localStorage.getItem(firstVisitKey)) {
      localStorage.setItem(firstVisitKey, "true");
      return;
    }

    const shownKey =
      "smartestate_suggestion_popup_shown_v2";

    if (sessionStorage.getItem(shownKey)) {
      return;
    }

    let hideTimer;

    const loadTimer = window.setTimeout(
      async () => {
        try {
          const response = await api.get(
            "/personalization/recommendations?limit=1",
          );

          const match =
            response.data?.recommendations?.[0];

          if (!match) return;

          setProperty(match);
          setNewMatch(isRecentlyAdded(match));
          setVisible(true);

          sessionStorage.setItem(
            "smartestate_suggestion_popup_shown_v2",
            "true",
          );

          hideTimer = window.setTimeout(() => {
            setVisible(false);
          }, 7000);
        } catch (error) {
          console.warn(
            "Suggestion popup skipped:",
            error.response?.data?.message ||
              error.message,
          );
        }
      },
      900,
    );

    return () => {
      window.clearTimeout(loadTimer);

      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
    };
  }, [enabled]);

  function closePopup() {
    setVisible(false);

    localStorage.setItem(
      "smartestate_popup_dismissed_at",
      String(Date.now()),
    );
  }

  if (!enabled || !visible || !property) {
    return null;
  }

  return (
    <aside className="smart-suggestion-drop absolute left-0 top-full z-[140] mt-2 w-72 overflow-hidden rounded-2xl border border-white/40 bg-white/95 text-slate-800 shadow-2xl backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Sparkles size={18} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-violet-600">
                {newMatch
                  ? "New Match"
                  : "Suggested For You"}
              </p>

              <p className="text-[10px] text-slate-400">
                Based on your activity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closePopup}
            aria-label="Close suggestion"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0b84e5]">
            <Building2 size={19} />
          </div>

          <div className="min-w-0">
            <h2 className="line-clamp-1 text-sm font-black text-slate-900">
              {property.title ||
                property.property_title ||
                "Matching Property"}
            </h2>

            <p className="mt-1 truncate text-[11px] text-slate-500">
              {getLocation(property)}
            </p>

            <p className="mt-1 text-xs font-black text-slate-900">
              {getPrice(property)}
            </p>
          </div>
        </div>

        {(property.recommendation_reasons || [])
          .slice(0, 1)
          .map((reason) => (
            <p
              key={reason}
              className="mt-2 truncate rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700"
            >
              ✓ {reason}
            </p>
          ))}

        <Link
          to={`/properties/${getPropertyId(property)}`}
          onClick={() => setVisible(false)}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-3 py-2.5 text-xs font-extrabold text-white"
        >
          View Property
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="h-1 origin-left animate-[suggestionTimer_7s_linear_forwards] bg-blue-500" />
    </aside>
  );
}

export default SmartSuggestionPopup;
