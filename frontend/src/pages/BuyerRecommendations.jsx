import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  House,
  IndianRupee,
  MapPin,
  RefreshCw,
  Ruler,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

const fallbackImages = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
];

function getImage(property) {
  if (property.primary_image) {
    if (property.primary_image.startsWith("http")) {
      return property.primary_image;
    }

    return `http://localhost:5001${property.primary_image}`;
  }

  const index = (Number(property.property_id) - 1) % fallbackImages.length;
  return fallbackImages[index < 0 ? 0 : index];
}

function formatNumber(value) {
  if (!value) return "";

  return Number(value).toLocaleString("en-IN");
}

function RecommendationCard({ property, purpose }) {
  const intelligence = property.intelligence || {};

  const mainScore =
    purpose === "investment"
      ? intelligence.investment_score
      : intelligence.livability_score;

  const mainScoreLabel =
    purpose === "investment" ? "Investment Score" : "Livability Score";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-60 overflow-hidden">
        <img
          src={getImage(property)}
          alt={property.title}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

        <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow">
          <BadgeCheck size={15} />
          Verified
        </span>

        <span className="absolute right-4 top-4 rounded-full bg-violet-600 px-4 py-2 text-sm font-black text-white shadow">
          {property.suitability_score}% Match
        </span>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-xl font-black">{property.title}</h3>

          <p className="mt-1 flex items-center gap-1 text-sm text-slate-200">
            <MapPin size={15} />
            {property.city}, {property.state}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Platform Price Range
        </p>

        <p className="mt-1 text-xl font-black text-[#075aa8]">
          {property.price_range}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <p className="text-xs text-slate-500">{mainScoreLabel}</p>

            <p className="mt-1 text-lg font-black text-[#075aa8]">
              {mainScore || 0}/100
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-xs text-slate-500">Growth Score</p>

            <p className="mt-1 text-lg font-black text-emerald-700">
              {intelligence.growth_score || 0}/100
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-3">
            <p className="text-xs text-slate-500">Risk Score</p>

            <p className="mt-1 text-lg font-black text-amber-700">
              {intelligence.risk_score || 0}/100
            </p>
          </div>

          <div className="rounded-xl bg-violet-50 p-3">
            <p className="text-xs text-slate-500">Area</p>

            <p className="mt-1 text-sm font-black text-violet-700">
              {property.area_sqft
                ? `${Number(property.area_sqft).toLocaleString(
                    "en-IN",
                  )} sq.ft`
                : "Not specified"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <p className="flex items-center gap-2 font-black text-violet-800">
            <Sparkles size={18} />
            Why recommended?
          </p>

          <div className="mt-3 space-y-2">
            {(property.reasons || []).slice(0, 4).map((reason) => (
              <p
                key={reason}
                className="flex items-start gap-2 text-xs leading-5 text-slate-600"
              >
                <CheckCircle2
                  size={15}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
                {reason}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-slate-100 px-3 py-2 capitalize text-slate-600">
            {property.property_type}
          </span>

          {property.growth_tag && (
            <span className="rounded-full bg-emerald-100 px-3 py-2 text-emerald-700">
              {property.growth_tag}
            </span>
          )}

          {intelligence.future_outlook && (
            <span className="rounded-full bg-blue-100 px-3 py-2 capitalize text-blue-700">
              {intelligence.future_outlook} outlook
            </span>
          )}
        </div>

        <Link
          to={`/properties/${property.property_id}`}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-4 font-extrabold text-white"
        >
          View Complete AI Report
          <ArrowRight size={19} />
        </Link>
      </div>
    </article>
  );
}

function BuyerRecommendations() {
  const [form, setForm] = useState({
    purpose: "end_use",
    budget_min: "",
    budget_max: "",
    preferred_city: "Pune",
    preferred_type: "apartment",
    min_area_sqft: "",
  });

  const [recommendations, setRecommendations] = useState([]);
  const [dataNote, setDataNote] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasPreferences, setHasPreferences] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function loadRecommendations() {
    try {
      setRecommendationsLoading(true);
      setError("");

      const response = await api.get("/recommendations");

      setRecommendations(response.data.recommendations || []);
      setDataNote(response.data.data_note || "");
    } catch (requestError) {
      if (requestError.response?.status !== 400) {
        setError(
          requestError.response?.data?.message ||
            "Recommendations load nahi ho paayi.",
        );
      }
    } finally {
      setRecommendationsLoading(false);
    }
  }

  async function loadPage() {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/preferences");
      const preferences = response.data.preferences;

      if (preferences) {
        setHasPreferences(true);

        setForm({
          purpose: preferences.purpose || "end_use",
          budget_min: preferences.budget_min || "",
          budget_max: preferences.budget_max || "",
          preferred_city: preferences.preferred_city || "Pune",
          preferred_type: preferences.preferred_type || "apartment",
          min_area_sqft: preferences.min_area_sqft || "",
        });

        await loadRecommendations();
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Buyer preferences load nahi ho paayi.",
      );
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.put("/preferences", {
        purpose: form.purpose,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        preferred_city: form.preferred_city.trim() || null,
        preferred_type: form.preferred_type || null,
        min_area_sqft: form.min_area_sqft
          ? Number(form.min_area_sqft)
          : null,
      });

      setHasPreferences(true);
      setSuccess("Preferences save ho gayi. AI ranking refresh ho gayi hai.");

      await loadRecommendations();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Preferences save nahi ho paayi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="bg-gradient-to-br from-[#032d57] via-[#075aa8] to-[#0b84e5] text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                <Sparkles size={17} />
                Personalized AI Property Search
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                Tell us what you need.
                <span className="block text-[#76d0ff]">
                  AI will rank the right properties.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl leading-7 text-blue-100">
                Investment aur self-use buyers ke liye alag scoring, highlights
                aur property benefits generate honge.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[380px_1fr] lg:px-8">
          <aside>
            <form
              onSubmit={handleSubmit}
              className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#0b84e5]">
                    Your Requirements
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    Buyer Preferences
                  </h2>
                </div>

                <Sparkles size={27} className="text-violet-600" />
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-bold text-slate-700">
                  Property kis purpose ke liye?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`cursor-pointer rounded-2xl border p-4 ${
                      form.purpose === "end_use"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="purpose"
                      value="end_use"
                      checked={form.purpose === "end_use"}
                      onChange={updateField}
                      className="sr-only"
                    />

                    <House
                      size={23}
                      className={
                        form.purpose === "end_use"
                          ? "text-blue-600"
                          : "text-slate-400"
                      }
                    />

                    <p className="mt-3 font-black text-slate-800">
                      Self Use
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Living, family aur daily convenience.
                    </p>
                  </label>

                  <label
                    className={`cursor-pointer rounded-2xl border p-4 ${
                      form.purpose === "investment"
                        ? "border-violet-500 bg-violet-50"
                        : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="purpose"
                      value="investment"
                      checked={form.purpose === "investment"}
                      onChange={updateField}
                      className="sr-only"
                    />

                    <BriefcaseBusiness
                      size={23}
                      className={
                        form.purpose === "investment"
                          ? "text-violet-600"
                          : "text-slate-400"
                      }
                    />

                    <p className="mt-3 font-black text-slate-800">
                      Investment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Growth, rental aur resale potential.
                    </p>
                  </label>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-600">
                    Minimum Budget
                  </span>

                  <div className="flex items-center rounded-xl border border-slate-200 px-3">
                    <IndianRupee size={16} className="text-slate-400" />

                    <input
                      type="number"
                      min="0"
                      name="budget_min"
                      value={form.budget_min}
                      onChange={updateField}
                      placeholder="30,00,000"
                      className="min-h-12 w-full bg-transparent px-2 text-sm outline-none"
                    />
                  </div>
                </label>

                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-600">
                    Maximum Budget
                  </span>

                  <div className="flex items-center rounded-xl border border-slate-200 px-3">
                    <IndianRupee size={16} className="text-slate-400" />

                    <input
                      type="number"
                      min="0"
                      name="budget_max"
                      value={form.budget_max}
                      onChange={updateField}
                      placeholder="80,00,000"
                      className="min-h-12 w-full bg-transparent px-2 text-sm outline-none"
                    />
                  </div>
                </label>
              </div>

              {(form.budget_min || form.budget_max) && (
                <p className="mt-2 text-xs text-slate-400">
                  Budget: ₹{formatNumber(form.budget_min) || "0"} – ₹
                  {formatNumber(form.budget_max) || "No limit"}
                </p>
              )}

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Preferred City
                </span>

                <div className="flex items-center rounded-xl border border-slate-200 px-4">
                  <MapPin size={18} className="text-slate-400" />

                  <input
                    name="preferred_city"
                    value={form.preferred_city}
                    onChange={updateField}
                    placeholder="Example: Pune"
                    className="min-h-13 w-full bg-transparent px-3 text-sm outline-none"
                  />
                </div>
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Property Type
                </span>

                <div className="flex items-center rounded-xl border border-slate-200 px-4">
                  <Building2 size={18} className="text-slate-400" />

                  <select
                    name="preferred_type"
                    value={form.preferred_type}
                    onChange={updateField}
                    className="min-h-13 w-full bg-transparent px-3 text-sm outline-none"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="plot">Plot</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Minimum Area
                </span>

                <div className="flex items-center rounded-xl border border-slate-200 px-4">
                  <Ruler size={18} className="text-slate-400" />

                  <input
                    type="number"
                    min="0"
                    name="min_area_sqft"
                    value={form.min_area_sqft}
                    onChange={updateField}
                    placeholder="Example: 900 sq.ft"
                    className="min-h-13 w-full bg-transparent px-3 text-sm outline-none"
                  />
                </div>
              </label>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  {success}
                </div>
              )}

              <button
                disabled={saving || pageLoading}
                className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 font-extrabold text-white disabled:opacity-60"
              >
                <Sparkles size={19} />

                {saving
                  ? "Generating Recommendations..."
                  : hasPreferences
                    ? "Refresh AI Recommendations"
                    : "Get AI Recommendations"}
              </button>
            </form>
          </aside>

          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
                  AI Ranked Results
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  Properties selected for you
                </h2>

                <p className="mt-3 text-slate-500">
                  Purpose, budget, location, area aur intelligence scores ke
                  basis par ranking.
                </p>
              </div>

              {hasPreferences && (
                <button
                  type="button"
                  onClick={loadRecommendations}
                  disabled={recommendationsLoading}
                  className="flex w-fit items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700"
                >
                  <RefreshCw size={17} />
                  Refresh Results
                </button>
              )}
            </div>

            {(pageLoading || recommendationsLoading) && (
              <div className="mt-8 grid gap-6 xl:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-[610px] animate-pulse rounded-3xl bg-slate-200"
                  />
                ))}
              </div>
            )}

            {!pageLoading &&
              !recommendationsLoading &&
              !hasPreferences && (
                <div className="mt-8 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-8 text-center sm:p-12">
                  <Sparkles
                    size={52}
                    className="mx-auto text-violet-600"
                  />

                  <h3 className="mt-5 text-2xl font-black text-slate-900">
                    Apni requirements enter karo
                  </h3>

                  <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
                    AI verified properties ko analyze karke suitability score,
                    benefits aur recommendation reasons generate karega.
                  </p>
                </div>
              )}

            {!pageLoading &&
              !recommendationsLoading &&
              hasPreferences &&
              recommendations.length === 0 && (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center">
                  <ShieldAlert
                    size={48}
                    className="mx-auto text-slate-300"
                  />

                  <h3 className="mt-4 text-xl font-black text-slate-800">
                    Matching properties nahi mili
                  </h3>

                  <p className="mt-2 text-slate-500">
                    Budget, property type ya minimum area change karke dobara
                    try karo.
                  </p>
                </div>
              )}

            {!pageLoading &&
              !recommendationsLoading &&
              recommendations.length > 0 && (
                <>
                  <div className="mt-8 grid gap-6 xl:grid-cols-2">
                    {recommendations.map((property) => (
                      <RecommendationCard
                        key={property.property_id}
                        property={property}
                        purpose={form.purpose}
                      />
                    ))}
                  </div>

                  {dataNote && (
                    <p className="mt-8 rounded-2xl bg-slate-100 p-5 text-xs leading-6 text-slate-500">
                      {dataNote}
                    </p>
                  )}
                </>
              )}
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default BuyerRecommendations;
