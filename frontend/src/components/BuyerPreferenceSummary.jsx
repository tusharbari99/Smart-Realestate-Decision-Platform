import { useEffect, useState } from "react";
import {
  Building2,
  IndianRupee,
  LoaderCircle,
  MapPin,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

import api from "../services/api";

function formatPrice(value) {
  const amount = Number(value || 0);

  if (!amount) {
    return "Learning your budget";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function BuyerPreferenceSummary() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const response = await api.get(
          "/personalization/preferences",
        );

        if (!cancelled) {
          setPreferences(
            response.data?.preferences || null,
          );
        }
      } catch (error) {
        console.warn(
          "Buyer preference summary skipped:",
          error.response?.data?.message ||
            error.message,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="mt-8 flex min-h-36 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <LoaderCircle
          size={30}
          className="animate-spin text-[#0b84e5]"
        />
      </section>
    );
  }

  if (!preferences) {
    return null;
  }

  const saved = preferences.saved || {};

  const topType =
    saved.preferred_property_type ||
    preferences.property_types?.[0]?.property_type ||
    "Still learning";

  const topLocation =
    saved.preferred_locality ||
    saved.preferred_city ||
    preferences.locations?.[0]?.locality ||
    preferences.locations?.[0]?.city ||
    "Still learning";

  const preferredBedrooms =
    saved.preferred_bedrooms ||
    preferences.bedrooms?.[0]?.bedrooms ||
    null;

  const minimumPrice =
    saved.minimum_price ||
    preferences.price_range?.minimum_viewed_price ||
    null;

  const maximumPrice =
    saved.maximum_price ||
    preferences.price_range?.maximum_viewed_price ||
    null;

  const personalizationEnabled =
    saved.personalization_enabled === undefined
      ? true
      : Boolean(saved.personalization_enabled);

  const cards = [
    {
      icon: Building2,
      label: "Property Type",
      value: topType,
    },
    {
      icon: IndianRupee,
      label: "Usual Budget",
      value:
        minimumPrice && maximumPrice
          ? `${formatPrice(minimumPrice)} – ${formatPrice(
              maximumPrice,
            )}`
          : "Still learning",
    },
    {
      icon: MapPin,
      label: "Preferred Area",
      value: topLocation,
    },
    {
      icon: Sparkles,
      label: "Preferred BHK",
      value: preferredBedrooms
        ? `${preferredBedrooms} BHK`
        : "Still learning",
    },
  ];

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-5 bg-slate-950 p-6 text-white sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-300">
            <Sparkles size={16} />
            AI Preference Profile
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Your Property Preferences
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Based on your views, saves, comparisons and requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-4 py-2 text-xs font-black ${
              personalizationEnabled
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-amber-500/20 text-amber-300"
            }`}
          >
            {personalizationEnabled
              ? "Personalization On"
              : "Personalization Off"}
          </span>

          <Link
            to="/buyer/recommendation-settings"
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/20"
          >
            <Settings2 size={15} />
            Edit Settings
          </Link>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        {cards.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0b84e5]">
              <Icon size={19} />
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              {label}
            </p>

            <p className="mt-1 truncate font-black text-slate-900">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 px-6 py-4">
        <p className="text-xs font-bold text-slate-500">
          Recorded activities:{" "}
          <span className="text-slate-900">
            {Number(preferences.total_activities || 0)}
          </span>
        </p>
      </div>
    </section>
  );
}

export default BuyerPreferenceSummary;
