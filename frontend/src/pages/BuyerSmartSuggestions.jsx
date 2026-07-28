import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  IndianRupee,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

function propertyId(property) {
  return property.property_id || property.id;
}

function propertyPrice(property) {
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

function propertyLocation(property) {
  return [
    property.locality,
    property.city,
  ]
    .filter(Boolean)
    .join(", ") ||
    property.location ||
    "Location not available";
}

function BuyerSmartSuggestions() {
  const [data, setData] = useState({
    profile: null,
    recommendations: [],
    message: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] =
    useState("");

  async function loadSuggestions() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/personalization/recommendations?limit=12",
      );

      setData({
        profile: response.data?.profile || null,
        recommendations:
          response.data?.recommendations || [],
        message: response.data?.message || "",
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load your suggestions.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function markNotInterested(property) {
    const id = propertyId(property);

    if (!id) return;

    try {
      await api.put(
        `/personalization/feedback/${id}`,
        {
          feedback_type: "not_interested",
        },
      );

      setData((current) => ({
        ...current,
        recommendations:
          current.recommendations.filter(
            (item) => propertyId(item) !== id,
          ),
      }));

      setFeedbackMessage(
        "Property removed. Future suggestions will improve.",
      );

      window.setTimeout(() => {
        setFeedbackMessage("");
      }, 3500);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update this suggestion.",
      );
    }
  }

  useEffect(() => {
    loadSuggestions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
                <Sparkles size={17} />
                Smart Suggestions
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                Properties Selected For You
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Recommendations improve as you view, save,
                compare, and request properties.
              </p>
            </div>

            <button
              type="button"
              onClick={loadSuggestions}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {data.profile?.totalActivities > 0 && (
            <div className="mt-7 flex flex-wrap gap-3">
              {data.profile.preferredType && (
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                  Type: {data.profile.preferredType}
                </span>
              )}

              {data.profile.preferredLocation && (
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                  Area: {data.profile.preferredLocation}
                </span>
              )}

              {data.profile.preferredBedrooms && (
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                  {data.profile.preferredBedrooms} BHK
                </span>
              )}
            </div>
          )}
        </section>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        {feedbackMessage && (
          <p className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-700">
            {feedbackMessage}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-96 items-center justify-center">
            <LoaderCircle
              size={42}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : data.recommendations.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <Building2
              size={44}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No suggestions available
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Browse more properties to improve your matches.
            </p>

            <Link
              to="/properties"
              className="mt-6 inline-flex rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-bold text-white"
            >
              Browse Properties
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Recommended For You
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {data.message}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.recommendations.map((property) => (
                <article
                  key={propertyId(property)}
                  className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0b84e5]">
                      <Building2 size={23} />
                    </div>

                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                      {property.recommendation_score || 0}% Match
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black text-slate-900">
                    {property.title ||
                      property.property_title ||
                      "Property"}
                  </h3>

                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={16} />
                    {propertyLocation(property)}
                  </p>

                  <p className="mt-3 flex items-center gap-2 font-black text-slate-900">
                    <IndianRupee size={17} />
                    {propertyPrice(property)}
                  </p>

                  <div className="mt-5 space-y-2">
                    {(property.recommendation_reasons || [])
                      .slice(0, 3)
                      .map((reason) => (
                        <p
                          key={reason}
                          className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
                        >
                          ✓ {reason}
                        </p>
                      ))}
                  </div>

                  <Link
                    to={`/properties/${propertyId(property)}`}
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-4 py-3 text-sm font-extrabold text-white"
                  >
                    View Property
                    <ArrowRight size={17} />
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default BuyerSmartSuggestions;
