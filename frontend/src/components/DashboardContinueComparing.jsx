import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  GitCompareArrows,
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

function DashboardContinueComparing() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadComparedProperties() {
      try {
        const response = await api.get(
          "/personalization/continue-comparing?limit=4",
        );

        if (!cancelled) {
          setProperties(
            response.data?.properties || [],
          );
        }
      } catch (error) {
        console.warn(
          "Compared properties skipped:",
          error.response?.data?.message ||
            error.message,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComparedProperties();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && properties.length === 0) {
    return null;
  }

  const compareIds = properties
    .map(getPropertyId)
    .filter(Boolean)
    .join(",");

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-700">
            <GitCompareArrows size={16} />
            Your Comparison
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900">
            Continue Comparing
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Review properties you compared earlier.
          </p>
        </div>

        {properties.length >= 2 && (
          <Link
            to={`/buyer/compare?ids=${compareIds}`}
            className="flex items-center gap-2 text-sm font-black text-[#0b84e5]"
          >
            Compare Again
            <ArrowRight size={16} />
          </Link>
        )}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Building2 size={19} />
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
                View Again
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default DashboardContinueComparing;
