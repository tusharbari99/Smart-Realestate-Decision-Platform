import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Clock3,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { Link } from "react-router";

import api from "../services/api";

function getPropertyId(property) {
  return property?.property_id || property?.id;
}

function getTitle(property) {
  return (
    property?.title ||
    property?.property_title ||
    property?.name ||
    "Property"
  );
}

function getLocation(property) {
  return (
    [property?.locality, property?.city]
      .filter(Boolean)
      .join(", ") ||
    property?.location ||
    "Location not available"
  );
}

function getPrice(property) {
  const amount = Number(
    property?.display_price ||
      property?.price ||
      property?.seller_price ||
      property?.expected_price ||
      0,
  );

  if (!amount) return "Price on request";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(value) {
  if (!value) return "Recently viewed";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently viewed";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function DashboardRecentlyViewed() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRecentProperties() {
      try {
        const response = await api.get(
          "/personalization/recently-viewed?limit=4",
        );

        if (!cancelled) {
          setProperties(
            response.data?.properties || [],
          );
        }
      } catch (error) {
        console.warn(
          "Recently viewed properties skipped:",
          error.response?.data?.message ||
            error.message,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecentProperties();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && properties.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700">
            <Clock3 size={16} />
            Continue Exploring
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900">
            Recently Viewed
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Quickly return to properties you opened recently.
          </p>
        </div>

        <Link
          to="/buyer/recently-viewed"
          className="flex items-center gap-2 text-sm font-black text-[#0b84e5]"
        >
          View History
          <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-32 items-center justify-center">
          <LoaderCircle
            size={30}
            className="animate-spin text-[#0b84e5]"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {properties.map((property) => (
            <article
              key={getPropertyId(property)}
              className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Building2 size={19} />
                </div>

                <span className="max-w-28 truncate rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500">
                  {formatTime(
                    property.last_viewed_at,
                  )}
                </span>
              </div>

              <h3 className="mt-4 line-clamp-2 font-black text-slate-900">
                {getTitle(property)}
              </h3>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin size={14} />

                <span className="truncate">
                  {getLocation(property)}
                </span>
              </p>

              <p className="mt-3 text-sm font-black text-slate-900">
                {getPrice(property)}
              </p>

              <Link
                to={`/properties/${getPropertyId(property)}`}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-black text-slate-700 hover:border-[#0b84e5] hover:text-[#0b84e5]"
              >
                Continue Viewing
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default DashboardRecentlyViewed;
