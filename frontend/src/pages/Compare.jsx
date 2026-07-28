import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Ruler,
  Scale,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useCompare } from "../context/CompareContext";
import api from "../services/api";

const fallbackImages = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
];

function getImage(property, index) {
  if (property.primary_image) {
    if (property.primary_image.startsWith("http")) {
      return property.primary_image;
    }

    return `http://localhost:5001${property.primary_image}`;
  }

  return fallbackImages[index % fallbackImages.length];
}

function getScore(property, field) {
  const value = property.intelligence?.[field] ?? property[field];

  return value === null || value === undefined ? "N/A" : `${value}/100`;
}

function Compare() {
  const { compareIds, removeCompare, clearCompare } = useCompare();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(compareIds.length >= 2);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadComparison() {
      if (compareIds.length < 2) {
        setProperties([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get("/properties/compare", {
          params: {
            ids: compareIds.join(","),
          },
        });

        const result = Array.isArray(response.data)
          ? response.data
          : response.data.properties || [];

        setProperties(result);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Properties compare nahi ho paayi.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadComparison();
  }, [compareIds]);

  const comparisonRows = [
    {
      label: "Platform Price",
      value: (property) => property.price_range || "Not available",
    },
    {
      label: "Property Type",
      value: (property) => property.property_type || "Not specified",
    },
    {
      label: "Area",
      value: (property) =>
        property.area_sqft
          ? `${Number(property.area_sqft).toLocaleString("en-IN")} sq.ft`
          : "Not specified",
    },
    {
      label: "Location",
      value: (property) =>
        [property.address, property.city, property.state]
          .filter(Boolean)
          .join(", "),
    },
    {
      label: "Growth Score",
      value: (property) => getScore(property, "growth_score"),
    },
    {
      label: "Investment Score",
      value: (property) => getScore(property, "investment_score"),
    },
    {
      label: "Livability Score",
      value: (property) => getScore(property, "livability_score"),
    },
    {
      label: "Risk Score",
      value: (property) => getScore(property, "risk_score"),
    },
    {
      label: "Future Outlook",
      value: (property) =>
        property.intelligence?.future_outlook ||
        property.future_outlook ||
        "Not available",
    },
    {
      label: "Known Issues",
      value: (property) =>
        property.known_issues || "No seller-disclosed issue",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="bg-gradient-to-r from-[#032d57] to-[#0b84e5] text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-100"
            >
              <ArrowLeft size={18} />
              Back to Properties
            </Link>

            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-200">
                  <Scale size={18} />
                  AI Property Comparison
                </p>

                <h1 className="mt-3 text-4xl font-black">
                  Compare before you decide
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-blue-100">
                  Compare price, area, location, investment potential, livability and risks side by side.
                </p>
              </div>

              {compareIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearCompare}
                  className="flex w-fit items-center gap-2 rounded-xl border border-white/30 px-5 py-3 font-bold"
                >
                  <Trash2 size={18} />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {compareIds.length < 2 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Scale size={52} className="mx-auto text-slate-300" />

              <h2 className="mt-5 text-2xl font-black text-slate-900">
                Select at least 2 properties
              </h2>

              <p className="mt-3 text-slate-500">
                Select 2 or 3 properties using the Compare button on the properties page.
              </p>

              <Link
                to="/"
                className="mt-6 inline-flex rounded-xl bg-[#0b84e5] px-6 py-3 font-bold text-white"
              >
                Explore Properties
              </Link>
            </div>
          )}

          {loading && (
            <div className="h-[550px] animate-pulse rounded-3xl bg-slate-200" />
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
              <ShieldAlert size={45} className="mx-auto" />
              <p className="mt-4 font-bold">{error}</p>
            </div>
          )}

          {!loading &&
            !error &&
            compareIds.length >= 2 &&
            properties.length >= 2 && (
              <>
                <div className="grid gap-5 md:hidden">
                  {properties.map((property, index) => (
                    <article
                      key={property.property_id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >
                      <img
                        src={getImage(property, index)}
                        alt={property.title}
                        className="h-52 w-full object-cover"
                      />

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-black text-slate-900">
                              {property.title}
                            </h2>

                            <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                              <MapPin size={15} />
                              {property.city}, {property.state}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeCompare(property.property_id)
                            }
                            className="rounded-lg bg-red-50 p-2 text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="mt-5 space-y-3">
                          {comparisonRows.map((row) => (
                            <div
                              key={row.label}
                              className="flex items-start justify-between gap-5 border-b border-slate-100 pb-3"
                            >
                              <p className="text-sm font-bold text-slate-500">
                                {row.label}
                              </p>

                              <p className="max-w-[55%] text-right text-sm font-bold capitalize text-slate-800">
                                {row.value(property)}
                              </p>
                            </div>
                          ))}
                        </div>

                        <Link
                          to={`/properties/${property.property_id}`}
                          className="mt-5 flex items-center justify-center rounded-xl bg-[#0b84e5] px-5 py-3 font-bold text-white"
                        >
                          View Full AI Report
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
                  <table className="w-full min-w-[850px] border-collapse">
                    <thead>
                      <tr>
                        <th className="w-48 border-b border-r border-slate-200 bg-slate-50 p-5 text-left">
                          Comparison
                        </th>

                        {properties.map((property, index) => (
                          <th
                            key={property.property_id}
                            className="min-w-64 border-b border-slate-200 p-5 text-left align-top"
                          >
                            <img
                              src={getImage(property, index)}
                              alt={property.title}
                              className="h-40 w-full rounded-2xl object-cover"
                            />

                            <div className="mt-4 flex items-start justify-between gap-3">
                              <div>
                                <h2 className="text-lg font-black text-slate-900">
                                  {property.title}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                  {property.city}, {property.state}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeCompare(property.property_id)
                                }
                                className="rounded-lg bg-red-50 p-2 text-red-600"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {comparisonRows.map((row, index) => (
                        <tr key={row.label}>
                          <th
                            className={`border-r border-t border-slate-200 p-5 text-left text-sm font-black text-slate-700 ${
                              index % 2 === 0
                                ? "bg-slate-50"
                                : "bg-white"
                            }`}
                          >
                            {row.label}
                          </th>

                          {properties.map((property) => (
                            <td
                              key={`${row.label}-${property.property_id}`}
                              className={`border-t border-slate-100 p-5 text-sm font-semibold capitalize leading-6 text-slate-600 ${
                                index % 2 === 0
                                  ? "bg-slate-50/50"
                                  : "bg-white"
                              }`}
                            >
                              {row.value(property)}
                            </td>
                          ))}
                        </tr>
                      ))}

                      <tr>
                        <th className="border-r border-t border-slate-200 bg-slate-50 p-5" />

                        {properties.map((property) => (
                          <td
                            key={property.property_id}
                            className="border-t border-slate-200 p-5"
                          >
                            <Link
                              to={`/properties/${property.property_id}`}
                              className="flex items-center justify-center rounded-xl bg-[#0b84e5] px-5 py-3 font-bold text-white"
                            >
                              Full AI Report
                            </Link>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-sm leading-6 text-violet-800">
                  <Sparkles size={20} className="mt-0.5 shrink-0" />
                  AI scores decision-support ke liye hain. Legal documents,
                  property condition aur location risks independently verify
                  karna bhi zaroori hai.
                </div>
              </>
            )}

          {!loading &&
            !error &&
            compareIds.length >= 2 &&
            properties.length < 2 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <Building2 size={48} className="mx-auto text-slate-300" />

                <p className="mt-4 font-bold text-slate-700">
                  Selected properties load nahi ho paayi.
                </p>
              </div>
            )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Compare;
