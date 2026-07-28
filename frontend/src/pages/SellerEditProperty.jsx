import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useParams,
} from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

const initialForm = {
  title: "",
  description: "",
  price: "",
  property_type: "apartment",
  area_sqft: "",
  address: "",
  city: "",
  state: "",
  latitude: "",
  longitude: "",
  amenities: "",
  known_issues: "",
  needs_3d_shoot: false,
};

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}",
    );
  } catch {
    return {};
  }
}

function amenitiesToText(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value !== "string") {
    return "";
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.join(", ");
    }
  } catch {
    return value;
  }

  return value;
}

function SellerEditProperty() {
  const { id } = useParams();

  const [form, setForm] = useState(initialForm);
  const [latestRequest, setLatestRequest] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = getStoredUser();
  const token = localStorage.getItem("token");

  const role = String(
    user.role ||
      user.user_type ||
      user.account_type ||
      "",
  ).toLowerCase();

  useEffect(() => {
    let active = true;

    async function loadProperty() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/property-edit-requests/property/${id}`,
        );

        if (!active) return;

        const property = response.data?.property || {};

        setForm({
          title: property.title || "",
          description: property.description || "",
          price: property.price || "",
          property_type:
            property.property_type || "apartment",
          area_sqft: property.area_sqft || "",
          address: property.address || "",
          city: property.city || "",
          state: property.state || "",
          latitude: property.latitude || "",
          longitude: property.longitude || "",
          amenities: amenitiesToText(
            property.amenities,
          ),
          known_issues: property.known_issues || "",
          needs_3d_shoot: Boolean(
            property.needs_3d_shoot,
          ),
        });

        setLatestRequest(
          response.data?.latest_request || null,
        );
      } catch (requestError) {
        if (!active) return;

        setError(
          requestError.response?.data?.message ||
            "Could not load this property.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProperty();

    return () => {
      active = false;
    };
  }, [id]);

  function updateField(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox" ? checked : value,
    }));
  }

  async function submitRequest(event) {
    event.preventDefault();

    if (latestRequest?.status === "pending") {
      setError(
        "This property already has a pending edit request.",
      );
      return;
    }

    if (!form.title.trim()) {
      setError("Property title is required.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setError(
        "Enter a valid seller expected price.",
      );
      return;
    }

    if (!form.city.trim()) {
      setError("City is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        "/property-edit-requests",
        {
          property_id: Number(id),
          changes: {
            title: form.title.trim(),
            description:
              form.description.trim(),
            price: Number(form.price),
            property_type:
              form.property_type,
            area_sqft: form.area_sqft
              ? Number(form.area_sqft)
              : null,
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            latitude: form.latitude
              ? Number(form.latitude)
              : null,
            longitude: form.longitude
              ? Number(form.longitude)
              : null,
            amenities: form.amenities
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            known_issues:
              form.known_issues.trim(),
            needs_3d_shoot:
              form.needs_3d_shoot,
          },
        },
      );

      setLatestRequest(response.data?.request);

      setSuccess(
        response.data?.message ||
          "Edit request submitted for admin approval.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not submit edit request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(
          `/seller/properties/${id}/edit`,
        )}`}
        replace
      />
    );
  }

  if (role !== "seller") {
    return <Navigate to="/" replace />;
  }

  const isPending =
    latestRequest?.status === "pending";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/seller/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#075aa8]"
        >
          <ArrowLeft size={18} />
          Back to Seller Dashboard
        </Link>

        <section className="mt-6 rounded-3xl bg-gradient-to-br from-[#06345f] via-[#075aa8] to-[#1597e5] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider">
                <Sparkles size={16} />
                Property Update Request
              </div>

              <h1 className="mt-5 text-4xl font-black">
                Request changes to your listing
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-blue-100">
                Your current listing will remain unchanged until the
                admin reviews and approves this request.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck size={25} />
                <div>
                  <p className="font-black">
                    Admin Protected Updates
                  </p>
                  <p className="text-sm text-blue-100">
                    No direct public changes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-8 flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoaderCircle
                size={42}
                className="mx-auto animate-spin text-blue-600"
              />
              <p className="mt-4 font-bold text-slate-600">
                Loading property information...
              </p>
            </div>
          </div>
        ) : error && !form.title ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 font-bold text-red-700">
            {error}
          </div>
        ) : (
          <>
            {latestRequest && (
              <section
                className={`mt-8 rounded-3xl border p-6 ${
                  latestRequest.status === "pending"
                    ? "border-amber-200 bg-amber-50"
                    : latestRequest.status ===
                        "approved"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  {latestRequest.status === "pending" ? (
                    <Clock3
                      className="shrink-0 text-amber-600"
                      size={25}
                    />
                  ) : latestRequest.status ===
                    "approved" ? (
                    <CheckCircle2
                      className="shrink-0 text-emerald-600"
                      size={25}
                    />
                  ) : (
                    <AlertCircle
                      className="shrink-0 text-red-600"
                      size={25}
                    />
                  )}

                  <div>
                    <h2 className="text-lg font-black capitalize text-slate-900">
                      Edit request {latestRequest.status}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {latestRequest.status === "pending"
                        ? "The admin is reviewing your requested changes. The form is temporarily locked."
                        : latestRequest.status ===
                            "approved"
                          ? "Your previous changes were approved and applied to the listing."
                          : "Your previous request was not approved. You can correct the details and submit another request."}
                    </p>

                    {latestRequest.admin_note && (
                      <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm font-bold text-slate-700">
                        Admin note:{" "}
                        {latestRequest.admin_note}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            <form
              onSubmit={submitRequest}
              className="mt-8 space-y-7"
            >
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#075aa8]">
                    <Building2 size={24} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Property Information
                    </h2>
                    <p className="text-sm text-slate-500">
                      Enter the corrected property details.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Property Title *
                    </span>

                    <input
                      required
                      disabled={isPending}
                      name="title"
                      value={form.title}
                      onChange={updateField}
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Property Type *
                    </span>

                    <select
                      disabled={isPending}
                      name="property_type"
                      value={form.property_type}
                      onChange={updateField}
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="apartment">
                        Apartment
                      </option>
                      <option value="villa">
                        Villa
                      </option>
                      <option value="plot">
                        Plot
                      </option>
                      <option value="commercial">
                        Commercial
                      </option>
                      <option value="other">
                        Other
                      </option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Area in sq.ft
                    </span>

                    <input
                      disabled={isPending}
                      type="number"
                      min="1"
                      name="area_sqft"
                      value={form.area_sqft}
                      onChange={updateField}
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Seller Expected Price *
                    </span>

                    <input
                      required
                      disabled={isPending}
                      type="number"
                      min="1"
                      name="price"
                      value={form.price}
                      onChange={updateField}
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Property Description
                    </span>

                    <textarea
                      disabled={isPending}
                      rows={5}
                      name="description"
                      value={form.description}
                      onChange={updateField}
                      className="w-full resize-none rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Facilities and Amenities
                    </span>

                    <input
                      disabled={isPending}
                      name="amenities"
                      value={form.amenities}
                      onChange={updateField}
                      placeholder="Example: Lift, Parking, CCTV, Water Supply"
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />

                    <span className="mt-2 block text-xs text-slate-400">
                      Separate facilities using commas.
                    </span>
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <MapPin size={24} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Property Location
                    </h2>
                    <p className="text-sm text-slate-500">
                      Confirm the address and map coordinates.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Address
                    </span>

                    <input
                      disabled={isPending}
                      name="address"
                      value={form.address}
                      onChange={updateField}
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      City *
                    </span>

                    <input
                      required
                      disabled={isPending}
                      name="city"
                      value={form.city}
                      onChange={updateField}
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      State
                    </span>

                    <input
                      disabled={isPending}
                      name="state"
                      value={form.state}
                      onChange={updateField}
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Latitude
                    </span>

                    <input
                      disabled={isPending}
                      type="number"
                      step="any"
                      name="latitude"
                      value={form.latitude}
                      onChange={updateField}
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Longitude
                    </span>

                    <input
                      disabled={isPending}
                      type="number"
                      step="any"
                      name="longitude"
                      value={form.longitude}
                      onChange={updateField}
                      className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Known Problems or Limitations
                  </span>

                  <textarea
                    disabled={isPending}
                    rows={4}
                    name="known_issues"
                    value={form.known_issues}
                    onChange={updateField}
                    className="w-full resize-none rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                </label>

                <label className="mt-6 flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <input
                    disabled={isPending}
                    type="checkbox"
                    name="needs_3d_shoot"
                    checked={form.needs_3d_shoot}
                    onChange={updateField}
                    className="h-5 w-5"
                  />

                  <span>
                    <strong className="block text-slate-900">
                      Request Company 3D / 360° Shoot
                    </strong>

                    <span className="text-sm text-slate-500">
                      Our team will contact you about the property shoot.
                    </span>
                  </span>
                </label>
              </section>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">
                  <CheckCircle2 size={20} />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#075aa8] px-6 py-4 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />
                ) : isPending ? (
                  <Clock3 size={20} />
                ) : (
                  <Save size={20} />
                )}

                {submitting
                  ? "Submitting Request..."
                  : isPending
                    ? "Waiting for Admin Approval"
                    : "Submit Edit Request"}
              </button>
            </form>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default SellerEditProperty;
