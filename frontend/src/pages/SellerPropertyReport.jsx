import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Eye,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function normaliseAmenities(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function MetricCard({ icon: Icon, label, value, description }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#075aa8]">
          <Icon size={23} />
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
          AI Estimated
        </span>
      </div>

      <p className="mt-5 text-sm font-bold text-slate-500">{label}</p>

      <div className="mt-1 flex items-end gap-1">
        <span className="text-4xl font-black text-slate-900">{value}</span>
        <span className="pb-1 font-bold text-slate-400">/100</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#075aa8] to-sky-400"
          style={{ width: `${value}%` }}
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}

function SellerPropertyReport() {
  const { id } = useParams();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  let storedUser = {};

  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    storedUser = {};
  }

  const token = localStorage.getItem("token");
  const role = String(
    storedUser.role ||
      storedUser.user_type ||
      storedUser.account_type ||
      "",
  ).toLowerCase();

  useEffect(() => {
    let active = true;

    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/properties/${id}`);

        if (active) {
          setDetails(response.data);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Could not load the property report.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      active = false;
    };
  }, [id]);

  const property = details?.property || null;
  const intelligence = details?.intelligence || null;

  const report = useMemo(() => {
    if (!property) return null;

    const amenities = normaliseAmenities(property.amenities);

    const completedFields = [
      property.title,
      property.description,
      property.address,
      property.city,
      property.state,
      property.area_sqft,
      property.primary_image,
      property.known_issues,
      amenities.length > 0,
    ].filter(Boolean).length;

    const completeness = clampScore((completedFields / 9) * 100);

    const growth = clampScore(intelligence?.growth_score || 55);
    const investment = clampScore(intelligence?.investment_score || 55);
    const livability = clampScore(intelligence?.livability_score || 55);
    const risk = clampScore(intelligence?.risk_score || 25);

    const verifiedBonus =
      String(property.status).toLowerCase() === "verified" ? 20 : 5;

    const trustStrength = clampScore(
      45 +
        verifiedBonus +
        (property.known_issues ? 12 : 0) +
        Math.min(amenities.length * 3, 23),
    );

    const visibility = clampScore(
      completeness * 0.42 +
        growth * 0.28 +
        investment * 0.3,
    );

    const buyerAttraction = clampScore(
      investment * 0.4 +
        livability * 0.35 +
        (100 - risk) * 0.25,
    );

    const reachLabel =
      visibility >= 80
        ? "Excellent visibility potential"
        : visibility >= 65
          ? "Strong visibility potential"
          : visibility >= 50
            ? "Good visibility potential"
            : "Visibility can be improved";

    const reasons = [];

    if (String(property.status).toLowerCase() === "verified") {
      reasons.push("Admin verified listing");
    }

    if (property.growth_tag) {
      reasons.push(property.growth_tag);
    }

    if (amenities.length > 0) {
      reasons.push(`${amenities.length} buyer-friendly facilities`);
    }

    if (property.description) {
      reasons.push("Detailed property description");
    }

    if (intelligence) {
      reasons.push("AI intelligence report available");
    }

    if (property.needs_3d_shoot) {
      reasons.push("3D / 360° presentation requested");
    }

    const improvements = [];

    if (!property.primary_image) {
      improvements.push("Add high-quality property photographs.");
    }

    if (amenities.length < 4) {
      improvements.push("Add more available facilities and amenities.");
    }

    if (!property.known_issues) {
      improvements.push(
        "Add an honest disclosure to increase buyer confidence.",
      );
    }

    if (!property.description || property.description.length < 70) {
      improvements.push(
        "Add a more detailed description covering rooms, condition and nearby landmarks.",
      );
    }

    if (!property.latitude || !property.longitude) {
      improvements.push(
        "Select the exact map location for stronger location intelligence.",
      );
    }

    if (improvements.length === 0) {
      improvements.push(
        "Your listing is well prepared. Keep the information and images updated.",
      );
    }

    return {
      amenities,
      completeness,
      trustStrength,
      visibility,
      buyerAttraction,
      reachLabel,
      reasons,
      improvements,
    };
  }, [property, intelligence]);

  if (!token) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(
          `/seller/properties/${id}/report`,
        )}`}
        replace
      />
    );
  }

  if (role !== "seller" && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="bg-gradient-to-br from-[#06345f] via-[#075aa8] to-[#1597e5] text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <Link
              to="/seller/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-100 transition hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to Seller Dashboard
            </Link>

            {loading ? (
              <div className="py-20 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                <p className="mt-4 font-bold">Preparing your seller report...</p>
              </div>
            ) : error ? (
              <div className="mt-8 rounded-3xl border border-red-300/30 bg-red-500/10 p-7">
                <p className="font-bold">{error}</p>
              </div>
            ) : (
              <div className="mt-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider">
                    <Sparkles size={16} />
                    Seller Performance Report
                  </div>

                  <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
                    Your property is ready to attract serious buyers.
                  </h1>

                  <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
                    This report analyses listing quality, buyer suitability,
                    location potential and trust signals.
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
                      <Building2 size={17} />
                      {property?.title}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
                      <MapPin size={17} />
                      {property?.city || "Location available"}
                    </span>

                    {String(property?.status).toLowerCase() === "verified" && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-emerald-950">
                        <CheckCircle2 size={17} />
                        Verified Property
                      </span>
                    )}
                  </div>
                </div>

                
              </div>
            )}
          </div>
        </section>

        {!loading && !error && report && (
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Eye}
                label="Estimated Visibility"
                value={report.visibility}
                description="Potential visibility based on listing completeness, growth potential and investment appeal."
              />

              <MetricCard
                icon={Heart}
                label="Buyer Attraction"
                value={report.buyerAttraction}
                description="How strongly the property may appeal to buyers comparing investment, lifestyle and risk."
              />

              <MetricCard
                icon={ShieldCheck}
                label="Trust Strength"
                value={report.trustStrength}
                description="Trust generated through verification, honest details, facilities and disclosure."
              />

              <MetricCard
                icon={BarChart3}
                label="Listing Completeness"
                value={report.completeness}
                description="Measures how much useful information is currently available to serious buyers."
              />
            </section>

            <section className="mt-8 grid gap-7 lg:grid-cols-[1.25fr_0.75fr]">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <TrendingUp size={24} />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-violet-600">
                      Buyer Reach Potential
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                      {report.reachLabel}
                    </h2>
                    <p className="mt-2 leading-7 text-slate-500">
                      Buyers are more likely to explore listings that combine
                      verified information, clear pricing, accurate location and
                      strong AI indicators.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {report.reasons.length > 0 ? (
                    report.reasons.map((reason) => (
                      <div
                        key={reason}
                        className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                      >
                        <CheckCircle2
                          size={20}
                          className="shrink-0 text-emerald-600"
                        />
                        <p className="text-sm font-bold text-emerald-900">
                          {reason}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Add more property details to generate buyer signals.
                    </p>
                  )}
                </div>
              </article>

              <article className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-sky-300">
                  <Users size={24} />
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-wider text-sky-300">
                  Seller Advantage
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Better information creates better buyer conversations.
                </h2>

                <p className="mt-4 leading-7 text-slate-300">
                  The homeasy highlights your property to buyers using price,
                  location, facilities, growth potential, livability and risk
                  intelligence.
                </p>

                <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-bold text-slate-300">
                    Property type
                  </p>
                  <p className="mt-1 text-xl font-black capitalize">
                    {property?.property_type || "Property"}
                  </p>

                  <p className="mt-5 text-sm font-bold text-slate-300">
                    Property area
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {property?.area_sqft
                      ? `${Number(property.area_sqft).toLocaleString(
                          "en-IN",
                        )} sq.ft`
                      : "Not specified"}
                  </p>
                </div>
              </article>
            </section>

            <section className="mt-8 grid gap-7 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#075aa8]">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#075aa8]">
                      AI Property Intelligence
                    </p>
                    <h2 className="text-2xl font-black text-slate-900">
                      What makes this property promising
                    </h2>
                  </div>
                </div>

                <p className="mt-6 leading-8 text-slate-600">
                  {intelligence?.summary ||
                    "The property report will become stronger as complete location, pricing, amenities and property information are added."}
                </p>

                {intelligence?.future_outlook && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                      Future Outlook
                    </p>
                    <p className="mt-2 leading-7 text-slate-700">
                      {intelligence.future_outlook}
                    </p>
                  </div>
                )}
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Target size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                      Improve Buyer Reach
                    </p>
                    <h2 className="text-2xl font-black text-slate-900">
                      Recommended next actions
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {report.improvements.map((item, index) => (
                    <div
                      key={item}
                      className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <p className="pt-1 text-sm font-bold leading-6 text-slate-700">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm leading-6 text-blue-900">
                <strong>Report note:</strong> Visibility and attraction scores
                are estimates calculated from property information and AI
                intelligence. They are not presented as actual page-view or
                inquiry counts.
              </p>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default SellerPropertyReport;
