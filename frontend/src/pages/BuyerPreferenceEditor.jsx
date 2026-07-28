import { useEffect, useState } from "react";
import {
  Building2,
  IndianRupee,
  LoaderCircle,
  MapPin,
  Save,
  SlidersHorizontal,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

const propertyTypes = [
  "",
  "Apartment",
  "Villa",
  "Independent House",
  "Plot",
  "Commercial",
  "Office",
  "Shop",
];

const bhkOptions = [
  "",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
];

function BuyerPreferenceEditor() {
  const [form, setForm] = useState({
    preferred_property_type: "",
    minimum_price: "",
    maximum_price: "",
    preferred_city: "",
    preferred_locality: "",
    preferred_bedrooms: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await api.get(
          "/personalization/preferences",
        );

        const saved =
          response.data?.preferences?.saved || {};

        setForm({
          preferred_property_type:
            saved.preferred_property_type || "",
          minimum_price:
            saved.minimum_price || "",
          maximum_price:
            saved.maximum_price || "",
          preferred_city:
            saved.preferred_city || "",
          preferred_locality:
            saved.preferred_locality || "",
          preferred_bedrooms:
            saved.preferred_bedrooms || "",
        });
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Could not load property preferences.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  async function savePreferences(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await api.patch(
        "/personalization/property-preferences",
        {
          ...form,
          minimum_price:
            form.minimum_price
              ? Number(form.minimum_price)
              : null,
          maximum_price:
            form.maximum_price
              ? Number(form.maximum_price)
              : null,
          preferred_bedrooms:
            form.preferred_bedrooms
              ? Number(form.preferred_bedrooms)
              : null,
        },
      );

      setMessage(
        response.data?.message ||
          "Property preferences updated.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not save property preferences.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
            <SlidersHorizontal size={18} />
            Property Preferences
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Tell Us What You Need
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Set your preferred property type, budget,
            location and BHK to improve recommendations.
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
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle
              size={40}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : (
          <form
            onSubmit={savePreferences}
            className="mt-7 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <Building2 size={17} />
                  Property Type
                </span>

                <select
                  name="preferred_property_type"
                  value={form.preferred_property_type}
                  onChange={updateField}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#0b84e5]"
                >
                  {propertyTypes.map((type) => (
                    <option
                      key={type || "any"}
                      value={type}
                    >
                      {type || "Any property type"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <Building2 size={17} />
                  Preferred BHK
                </span>

                <select
                  name="preferred_bedrooms"
                  value={form.preferred_bedrooms}
                  onChange={updateField}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#0b84e5]"
                >
                  {bhkOptions.map((bhk) => (
                    <option
                      key={bhk || "any"}
                      value={bhk}
                    >
                      {bhk
                        ? `${bhk} BHK`
                        : "Any BHK"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <IndianRupee size={17} />
                  Minimum Budget
                </span>

                <input
                  type="number"
                  min="0"
                  step="100000"
                  name="minimum_price"
                  value={form.minimum_price}
                  onChange={updateField}
                  placeholder="Example: 5000000"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0b84e5]"
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <IndianRupee size={17} />
                  Maximum Budget
                </span>

                <input
                  type="number"
                  min="0"
                  step="100000"
                  name="maximum_price"
                  value={form.maximum_price}
                  onChange={updateField}
                  placeholder="Example: 6000000"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0b84e5]"
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <MapPin size={17} />
                  Preferred City
                </span>

                <input
                  type="text"
                  name="preferred_city"
                  value={form.preferred_city}
                  onChange={updateField}
                  placeholder="Example: Pune"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0b84e5]"
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <MapPin size={17} />
                  Preferred Locality
                </span>

                <input
                  type="text"
                  name="preferred_locality"
                  value={form.preferred_locality}
                  onChange={updateField}
                  placeholder="Example: Wakad"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0b84e5]"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              Manual preferences receive priority, while your
              browsing activity continues improving results.
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3.5 text-sm font-black text-white disabled:opacity-60 sm:w-auto"
            >
              {saving ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              {saving
                ? "Saving Preferences"
                : "Save Preferences"}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default BuyerPreferenceEditor;
