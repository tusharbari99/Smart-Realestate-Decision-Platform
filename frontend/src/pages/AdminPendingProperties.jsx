import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Ruler,
  User,
  XCircle,
} from "lucide-react";

import api from "../services/api";

function formatPrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "Not available";
  }

  return `₹${price.toLocaleString("en-IN")}`;
}

function AdminPendingProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/properties/pending");

      setProperties(
        Array.isArray(response.data?.properties)
          ? response.data.properties
          : [],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load pending properties.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  async function updateStatus(propertyId, status) {
    try {
      setUpdatingId(propertyId);
      setError("");

      await api.patch(
        `/admin/properties/${propertyId}/status`,
        { status }
      );

      setProperties((current) =>
        current.filter(
          (property) => property.property_id !== propertyId
        )
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Property status update failed."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b84e5] text-white">
              <Building2 size={23} />
            </div>

            <div>
              <p className="text-lg font-black text-slate-900">
                Property Review
              </p>

              <p className="text-xs font-semibold text-slate-500">
                Company Dashboard
              </p>
            </div>
          </Link>

          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#0b84e5]">
              Listing Verification
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Pending Properties
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Check property and seller details before publishing.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProperties}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <Clock3 size={40} className="text-slate-400" />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No pending properties
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              New seller listings will appear here.
            </p>
          </div>
        )}

        {!loading && properties.length > 0 && (
          <div className="mt-8 space-y-6">
            {properties.map((property) => (
              <article
                key={property.property_id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        Pending Review
                      </span>

                      <h2 className="mt-3 text-2xl font-black text-slate-900">
                        {property.title || "Property Listing"}
                      </h2>

                      <p className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0"
                        />

                        {[property.address, property.city, property.state]
                          .filter(Boolean)
                          .join(", ") || "Location not available"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 px-5 py-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                        Seller Price
                      </p>

                      <p className="mt-1 text-xl font-black text-[#075aa8]">
                        {formatPrice(property.price)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
                  <section className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="font-black text-slate-900">
                      Property Details
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">
                          Property Type
                        </p>

                        <p className="mt-1 text-sm font-bold capitalize text-slate-700">
                          {property.property_type || "Not available"}
                        </p>
                      </div>

                      <div>
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <Ruler size={14} />
                          Area
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {property.area_sqft
                            ? `${Number(
                                property.area_sqft,
                              ).toLocaleString("en-IN")} sq.ft`
                            : "Not available"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-600">
                      {property.description ||
                        "No property description provided."}
                    </p>

                    {property.known_issues && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                          Known Issues
                        </p>

                        <p className="mt-1 text-sm text-amber-800">
                          {property.known_issues}
                        </p>
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="font-black text-slate-900">
                      Seller Details
                    </h3>

                    <div className="mt-4 space-y-4">
                      <p className="flex items-center gap-3 text-sm text-slate-700">
                        <User size={17} className="text-slate-400" />
                        {property.seller_name || "Name not available"}
                      </p>

                      <p className="flex items-center gap-3 text-sm text-slate-700">
                        <Phone size={17} className="text-slate-400" />
                        {property.seller_phone || "Phone not available"}
                      </p>

                      <p className="flex items-center gap-3 break-all text-sm text-slate-700">
                        <Mail
                          size={17}
                          className="shrink-0 text-slate-400"
                        />
                        {property.seller_email || "Email not available"}
                      </p>
                    </div>
                  </section>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={updatingId === property.property_id}
                    onClick={() =>
                      updateStatus(property.property_id, "rejected")
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-60"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={updatingId === property.property_id}
                    onClick={() =>
                      updateStatus(property.property_id, "verified")
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    <CheckCircle2 size={18} />
                    Verify Property
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPendingProperties;
