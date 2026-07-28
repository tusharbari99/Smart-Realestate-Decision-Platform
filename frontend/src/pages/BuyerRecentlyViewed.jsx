import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Clock3,
  IndianRupee,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { Link } from "react-router";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

function getPropertyId(property) {
  return property.property_id || property.id;
}

function getTitle(property) {
  return (
    property.title ||
    property.property_title ||
    property.name ||
    "Property"
  );
}

function getLocation(property) {
  return (
    [property.locality, property.city]
      .filter(Boolean)
      .join(", ") ||
    property.location ||
    "Location not available"
  );
}

function getPrice(property) {
  const amount = Number(
    property.display_price ||
      property.price ||
      property.seller_price ||
      property.expected_price ||
      0,
  );

  if (!amount) return "Price on request";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatViewedTime(value) {
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

function BuyerRecentlyViewed() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecentlyViewed() {
      try {
        const response = await api.get(
          "/personalization/recently-viewed?limit=30",
        );

        setProperties(
          response.data?.properties || [],
        );
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Could not load recently viewed properties.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRecentlyViewed();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
            <Clock3 size={18} />
            Your Activity
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Recently Viewed Properties
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Continue exploring properties you opened recently.
          </p>
        </section>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-96 items-center justify-center">
            <LoaderCircle
              size={42}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : properties.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <Clock3
              size={45}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No recently viewed properties
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Properties you open will appear here.
            </p>

            <Link
              to="/properties"
              className="mt-6 inline-flex rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-bold text-white"
            >
              Browse Properties
            </Link>
          </section>
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <article
                key={getPropertyId(property)}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0b84e5]">
                    <Building2 size={21} />
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">
                    {formatViewedTime(
                      property.last_viewed_at,
                    )}
                  </span>
                </div>

                <h2 className="mt-5 line-clamp-2 text-lg font-black text-slate-900">
                  {getTitle(property)}
                </h2>

                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={16} />
                  <span className="truncate">
                    {getLocation(property)}
                  </span>
                </p>

                <p className="mt-3 flex items-center gap-2 font-black text-slate-900">
                  <IndianRupee size={17} />
                  {getPrice(property)}
                </p>

                {Number(property.view_count) > 1 && (
                  <p className="mt-3 text-xs font-bold text-violet-600">
                    Viewed {property.view_count} times
                  </p>
                )}

                <Link
                  to={`/properties/${getPropertyId(property)}`}
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-4 py-3 text-sm font-extrabold text-white"
                >
                  Continue Viewing
                  <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default BuyerRecentlyViewed;
