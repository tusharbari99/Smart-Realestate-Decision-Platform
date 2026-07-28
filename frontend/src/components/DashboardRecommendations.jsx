import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  LoaderCircle,
  MapPin,
  Sparkles,
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
    "Location available on details page"
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

function DashboardRecommendations() {
  const [properties, setProperties] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      try {
        const response = await api.get(
          "/personalization/recommendations?limit=3",
        );

        if (cancelled) return;

        setProperties(
          response.data?.recommendations || [],
        );

        setMessage(response.data?.message || "");
      } catch (error) {
        console.warn(
          "Dashboard recommendations skipped:",
          error.response?.data?.message ||
            error.message,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-violet-600">
            <Sparkles size={16} />
            Personalized Matches
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900">
            Recommended For You
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {message ||
              "Properties selected from your recent activity."}
          </p>
        </div>

        <Link
          to="/buyer/smart-suggestions"
          className="flex items-center gap-2 text-sm font-black text-[#0b84e5]"
        >
          View All
          <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center">
          <LoaderCircle
            size={32}
            className="animate-spin text-[#0b84e5]"
          />
        </div>
      ) : properties.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
          <Building2
            size={34}
            className="mx-auto text-slate-400"
          />

          <p className="mt-3 text-sm font-bold text-slate-600">
            Browse some properties to improve your matches.
          </p>

          <Link
            to="/properties"
            className="mt-4 inline-flex rounded-xl bg-[#0b84e5] px-4 py-2.5 text-xs font-black text-white"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {properties.map((property) => (
            <article
              key={getPropertyId(property)}
              className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0b84e5]">
                  <Building2 size={19} />
                </div>

                {Number(
                  property.recommendation_score || 0,
                ) > 0 && (
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black text-violet-700">
                    {property.recommendation_score}% Match
                  </span>
                )}
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

              {(property.recommendation_reasons || [])
                .slice(0, 1)
                .map((reason) => (
                  <p
                    key={reason}
                    className="mt-3 truncate rounded-lg bg-white px-3 py-2 text-[10px] font-bold text-violet-700"
                  >
                    ✓ {reason}
                  </p>
                ))}

              <Link
                to={`/properties/${getPropertyId(property)}`}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-3 py-2.5 text-xs font-black text-white"
              >
                View Property
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default DashboardRecommendations;
