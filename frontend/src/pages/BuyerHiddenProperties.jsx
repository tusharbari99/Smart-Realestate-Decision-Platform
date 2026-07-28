import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  EyeOff,
  LoaderCircle,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
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

function BuyerHiddenProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadHiddenProperties() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/personalization/feedback/hidden",
      );

      setProperties(
        response.data?.properties || [],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load hidden properties.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function restoreProperty(property) {
    const id = getPropertyId(property);

    if (!id) return;

    try {
      setRestoringId(id);
      setMessage("");
      setError("");

      const response = await api.delete(
        `/personalization/feedback/${id}`,
      );

      setProperties((current) =>
        current.filter(
          (item) => getPropertyId(item) !== id,
        ),
      );

      setMessage(
        response.data?.message ||
          "Property restored to recommendations.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not restore property.",
      );
    } finally {
      setRestoringId(null);
    }
  }

  useEffect(() => {
    loadHiddenProperties();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
            <EyeOff size={18} />
            Recommendation Control
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Hidden Properties
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            These properties were marked Not Interested.
            Restore any property to show it in recommendations again.
          </p>
        </section>

        {message && (
          <p className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-700">
            {message}
          </p>
        )}

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
            <EyeOff
              size={46}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No hidden properties
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Properties marked Not Interested will appear here.
            </p>

            <Link
              to="/buyer/smart-suggestions"
              className="mt-6 inline-flex rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-bold text-white"
            >
              View Smart Suggestions
            </Link>
          </section>
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const id = getPropertyId(property);

              return (
                <article
                  key={id}
                  className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Building2 size={21} />
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

                  <p className="mt-3 font-black text-slate-900">
                    {getPrice(property)}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link
                      to={`/properties/${id}`}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-700"
                    >
                      View
                      <ArrowRight size={14} />
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        restoreProperty(property)
                      }
                      disabled={restoringId === id}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      <RotateCcw
                        size={14}
                        className={
                          restoringId === id
                            ? "animate-spin"
                            : ""
                        }
                      />

                      {restoringId === id
                        ? "Restoring"
                        : "Restore"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default BuyerHiddenProperties;
