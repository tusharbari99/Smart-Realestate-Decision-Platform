import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Box,
  Building2,
  Camera,
  CheckCircle2,
  IndianRupee,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import Navbar from "../components/Navbar";
import SellerLocationMap from "../components/SellerLocationMap";
import api from "../services/api";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

const facilityOptions = [
  { label: "Car Parking", icon: "🚗" },
  { label: "Bike Parking", icon: "🏍️" },
  { label: "Lift", icon: "🛗" },
  { label: "24/7 Security", icon: "🛡️" },
  { label: "CCTV Surveillance", icon: "📹" },
  { label: "Power Backup", icon: "⚡" },
  { label: "24/7 Water Supply", icon: "💧" },
  { label: "Balcony", icon: "🌤️" },
  { label: "Garden", icon: "🌿" },
  { label: "Gym", icon: "🏋️" },
  { label: "Swimming Pool", icon: "🏊" },
  { label: "Clubhouse", icon: "🏢" },
  { label: "Children's Play Area", icon: "🛝" },
  { label: "Gated Society", icon: "🚧" },
  { label: "Gas Pipeline", icon: "🔥" },
  { label: "Internet / Wi-Fi", icon: "📶" },
  { label: "Pet Friendly", icon: "🐾" },
];

const furnishingOptions = [
  { label: "Fully Furnished", icon: "🛋️" },
  { label: "Semi Furnished", icon: "🪑" },
  { label: "Unfurnished", icon: "🏠" },
];

function AddProperty() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    property_type: "apartment",
    area_sqft: "",
    address: "",
    city: "Pune",
    state: "Maharashtra",
    latitude: "",
    longitude: "",
    known_issues: "",
    needs_3d_shoot: false,
    commission_terms_accepted: false,
    amenities: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationMapOpen, setLocationMapOpen] = useState(false);

  const platformPrice = useMemo(() => {
    const sellerPrice = Number(form.price || 0);

    return {
      minimum: Math.round(sellerPrice * 1.05),
      maximum: Math.round(sellerPrice * 1.1),
    };
  }, [form.price]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toggleAmenity(label, group = "facility") {
    setForm((current) => {
      let nextAmenities = [...current.amenities];

      if (group === "furnishing") {
        const furnishingLabels = furnishingOptions.map(
          (item) => item.label
        );

        nextAmenities = nextAmenities.filter(
          (item) => !furnishingLabels.includes(item)
        );

        if (!current.amenities.includes(label)) {
          nextAmenities.push(label);
        }
      } else if (nextAmenities.includes(label)) {
        nextAmenities = nextAmenities.filter(
          (item) => item !== label
        );
      } else {
        nextAmenities.push(label);
      }

      return {
        ...current,
        amenities: nextAmenities,
      };
    });
  }

  function handleMapLocationSelect(location) {
    setForm((current) => ({
      ...current,
      address: location.address || current.address,
      city: location.city || current.city,
      state: location.state || current.state,
      latitude: String(location.latitude ?? ""),
      longitude: String(location.longitude ?? ""),
    }));

    setLocationMapOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await api.post("/properties", {
        ...form,
        price: Number(form.price),
        area_sqft: form.area_sqft ? Number(form.area_sqft) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      });

      navigate("/seller/dashboard?submitted=1", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not submit the property.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/seller/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#075aa8]"
        >
          <ArrowLeft size={18} />
          Seller Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-widest text-[#0b84e5]">
            New Property
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
            Add basic property details
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-slate-500">
            Enter accurate and honest property details. Our AI will generate location insights, growth potential, risk analysis, future outlook and buyer benefits.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-7 lg:grid-cols-[1fr_330px]"
        >
        <SellerLocationMap
          open={locationMapOpen}
          initialLat={form.latitude}
          initialLng={form.longitude}
          onClose={() => setLocationMapOpen(false)}
          onSelect={handleMapLocationSelect}
        />

          <div className="space-y-7">
            <section className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-white p-6 shadow-[0_18px_50px_rgba(30,100,170,0.13)] sm:p-8">
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Building2 size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Basic Information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Main property information
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Property Title *
                  </span>

                  <input
                    required
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    placeholder="Example: Spacious 2BHK near Hinjewadi"
                    className="min-h-13 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Property Type *
                  </span>

                  <select
                    required
                    name="property_type"
                    value={form.property_type}
                    onChange={updateField}
                    className="min-h-13 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="plot">Plot</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Area in sq.ft
                  </span>

                  <input
                    type="number"
                    min="1"
                    name="area_sqft"
                    value={form.area_sqft}
                    onChange={updateField}
                    placeholder="Example: 950"
                    className="min-h-13 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Property Description
                  </span>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    rows="5"
                    placeholder="Describe the rooms, amenities, condition and key strengths of the property honestly."
                    className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-blue-500"
                  />
                </label>
              </div>
            
          <div className="relative mt-8 border-t border-blue-100 pt-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Property Highlights
                </p>

                <h3 className="mt-1 text-xl font-black text-slate-900">
                  Facilities & Features
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Select all facilities available at this property.
                </p>
              </div>

              <div className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                {form.amenities.length} selected
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
              <p className="text-sm font-black text-slate-800">
                Furnishing Status
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {furnishingOptions.map((option) => {
                  const selected = form.amenities.includes(
                    option.label
                  );

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        toggleAmenity(
                          option.label,
                          "furnishing"
                        )
                      }
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-500 bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-[0_10px_26px_rgba(59,130,246,0.25)]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <span className="text-xl">
                        {option.icon}
                      </span>

                      <span className="flex-1 text-sm font-black">
                        {option.label}
                      </span>

                      {selected && (
                        <CheckCircle2 size={18} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {facilityOptions.map((option) => {
                const selected = form.amenities.includes(
                  option.label
                );

                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() =>
                      toggleAmenity(option.label)
                    }
                    className={`flex min-h-16 items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-500 bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-[0_10px_26px_rgba(59,130,246,0.23)]"
                        : "border-slate-200 bg-white/80 text-slate-700 backdrop-blur-lg hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                        selected
                          ? "bg-white/20"
                          : "bg-blue-50"
                      }`}
                    >
                      {option.icon}
                    </span>

                    <span className="flex-1 text-sm font-black">
                      {option.label}
                    </span>

                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-white/60 bg-white/20"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {selected && (
                        <CheckCircle2 size={15} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Buyers will see the selected facilities after the
              property listing is reviewed.
            </p>
          </div>
</section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <MapPin size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Location
                  </h2>

                  <p className="text-sm text-slate-500">
                    Add an accurate location for reliable AI analysis
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-slate-900">
                    Pin the exact property location
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Search the area or select the property directly on the map.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setLocationMapOpen(true)}
                  className="min-h-12 rounded-xl bg-blue-600 px-5 font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                >
                  Open Map & Set Exact Location
                </button>
              </div>

              {form.latitude && form.longitude && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-extrabold text-emerald-800">
                    Exact location selected
                  </p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Latitude: {form.latitude} · Longitude: {form.longitude}
                  </p>
                </div>
              )}
            </div>

            <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Address
                  </span>

                  <input
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    placeholder="Locality, project, road or landmark"
                    className="min-h-13 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    City *
                  </span>

                  <input
                    required
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    className="min-h-13 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    State
                  </span>

                  <input
                    name="state"
                    value={form.state}
                    onChange={updateField}
                    className="min-h-13 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Latitude
                  </span>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={form.latitude}
                    onChange={updateField}
                    placeholder="Example: 18.5912"
                    className="min-h-13 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Longitude
                  </span>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={form.longitude}
                    onChange={updateField}
                    placeholder="Example: 73.7389"
                    className="min-h-13 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <ShieldAlert size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Honest Disclosures
                  </h2>

                  <p className="text-sm text-slate-500">
                    Disclose known issues to build buyer trust
                  </p>
                </div>
              </div>

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Known Problems or Limitations
                </span>

                <textarea
                  name="known_issues"
                  value={form.known_issues}
                  onChange={updateField}
                  rows="4"
                  placeholder="Example: Evening parking limited, traffic noise, waterlogging risk, narrow road..."
                  className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-blue-500"
                />
              </label>

              <label className="mt-5 flex cursor-pointer items-start gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                <input
                  type="checkbox"
                  name="needs_3d_shoot"
                  checked={form.needs_3d_shoot}
                  onChange={updateField}
                  className="mt-1 h-5 w-5"
                />

                <div>
                  <p className="flex items-center gap-2 font-black text-violet-800">
                    <Camera size={20} />
                    Request Company 3D / 360° Shoot
                  </p>

                  <p className="mt-2 text-sm leading-6 text-violet-700">
                    Our team will visit the property and capture a professional 3D/360° virtual walkthrough.
                  </p>
                </div>
              </label>
            </section>
          </div>

          <aside className="space-y-5">
            <div className="sticky top-24 space-y-5">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                <p className="flex items-center gap-2 font-black text-slate-900">
                  <IndianRupee size={21} className="text-[#075aa8]" />
                  Seller Expected Price
                </p>

                <input
                  required
                  type="number"
                  min="1"
                  name="price"
                  value={form.price}
                  onChange={updateField}
                  placeholder="Enter amount in ₹"
                  className="mt-4 min-h-13 w-full rounded-xl border border-slate-200 px-4 text-lg font-bold outline-none focus:border-blue-500"
                />

                <div className="mt-5 rounded-2xl bg-blue-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#075aa8]">
                    Buyer-facing Platform Range
                  </p>

                  <p className="mt-3 text-xl font-black text-slate-900">
                    {formatCurrency(platformPrice.minimum)}
                    <span className="mx-2 text-slate-400">–</span>
                    {formatCurrency(platformPrice.maximum)}
                  </p>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Buyers will see only the disclosed platform price range, not your entered price.
                  </p>
                </div>
              </section>

              <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-6">
                <p className="flex items-center gap-2 font-black text-violet-800">
                  <Sparkles size={21} />
                  After Submission
                </p>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {[
                    "AI intelligence report will be generated",
                    "Future outlook and growth score will be generated",
                    "Risks and known issues will be highlighted",
                    "The admin will verify the property",
                    "You can review the AI-generated highlights",
                  ].map((item) => (
                    <p key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        size={17}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />
                      {item}
                    </p>
                  ))}
                </div>
              </section>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-5 text-slate-600">
                <input
                  required
                  type="checkbox"
                  name="commission_terms_accepted"
                  checked={form.commission_terms_accepted}
                  onChange={updateField}
                  className="mt-1"
                />

                <span>
                  I accept that the buyer-facing platform price range will be
                  approximately 5%–10% above my entered expected price. The
                  exact policy and service terms have been disclosed to me.
                </span>
              </label>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-xl bg-[#0b84e5] px-6 py-4 font-extrabold text-white shadow-lg shadow-blue-500/20 disabled:opacity-60"
              >
                {loading
                  ? "Generating AI Report..."
                  : "Submit Property for AI Analysis"}
              </button>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}

export default AddProperty;
