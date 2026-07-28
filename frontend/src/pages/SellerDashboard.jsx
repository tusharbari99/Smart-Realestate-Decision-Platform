import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  BadgeCheck,
  Box,
  Building2,
  Clock3,
  IndianRupee,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import api from "../services/api";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClasses(status) {
  const styles = {
    verified: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
  };

  return styles[status] || "bg-slate-100 text-slate-700";
}

function SellerDashboard() {
  const [searchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/properties/mine");
      setProperties(response.data.properties || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load your properties.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  const stats = useMemo(() => {
    return {
      total: properties.length,
      pending: properties.filter((item) => item.status === "pending").length,
      verified: properties.filter((item) => item.status === "verified").length,
      rejected: properties.filter((item) => item.status === "rejected").length,
    };
  }, [properties]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {searchParams.get("submitted") === "1" && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-700">
            Property successfully submit ho gayi. AI report generate hua hai
            aur listing admin verification ke liye pending hai.
          </div>
        )}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#0b84e5]">
              Seller Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              Manage your properties
            </h1>

            <p className="mt-3 text-slate-500">Review, update and track all your property listings.</p>
          </div>

          <Link
            to="/seller/add-property"
            className="flex w-fit items-center gap-2 rounded-xl bg-[#0b84e5] px-6 py-4 font-extrabold text-white shadow-lg shadow-blue-500/20"
          >
            <Plus size={21} />
            Add Property
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Listings",
              value: stats.total,
              icon: Building2,
              className: "bg-blue-100 text-blue-700",
            },
            {
              label: "Pending Review",
              value: stats.pending,
              icon: Clock3,
              className: "bg-amber-100 text-amber-700",
            },
            {
              label: "Verified",
              value: stats.verified,
              icon: BadgeCheck,
              className: "bg-emerald-100 text-emerald-700",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              icon: XCircle,
              className: "bg-red-100 text-red-700",
            },
          ].map(({ label, value, icon: Icon, className }) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${className}`}
                >
                  <Icon size={24} />
                </div>

                <p className="text-3xl font-black text-slate-900">{value}</p>
              </div>

              <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Your Listings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Only you and the admin can view the seller-entered price.
              </p>
            </div>

            <button
              type="button"
              onClick={loadProperties}
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          {loading && (
            <div className="mt-6 space-y-4">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && properties.length === 0 && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center">
              <Building2 size={45} className="mx-auto text-slate-300" />

              <h3 className="mt-4 text-xl font-black text-slate-800">
                Abhi koi property add nahi hai
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Apni first property add karke AI analysis generate karo.
              </p>

              <Link
                to="/seller/add-property"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3 font-bold text-white"
              >
                <Plus size={19} />
                Add First Property
              </Link>
            </div>
          )}

          {!loading && properties.length > 0 && (
            <div className="mt-6 space-y-4">
              {properties.map((property) => (
                <article
                  key={property.property_id}
                  className="grid gap-5 rounded-2xl border border-slate-200 p-5 md:grid-cols-[100px_1fr_auto] md:items-center"
                >
                  <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-[#075aa8] md:w-24">
                    {property.primary_image ? (
                      <img
                        src={
                          property.primary_image.startsWith("http")
                            ? property.primary_image
                            : `http://localhost:5001${property.primary_image}`
                        }
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 size={34} />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        {property.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClasses(
                          property.status,
                        )}`}
                      >
                        {property.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {property.address
                        ? `${property.address}, ${property.city}`
                        : property.city}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-slate-600">
                      <span className="flex items-center gap-1">
                        <IndianRupee size={14} />
                        Seller Price: {formatCurrency(property.price)}
                      </span>

                      <span className="flex items-center gap-1 capitalize">
                        <Box size={14} />
                        {property.property_type}
                      </span>

                      {property.needs_3d_shoot ? (
                        <span className="text-violet-700">
                          3D Shoot Requested
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2 md:flex-col">
                    <Link to={`/seller/properties/${property.property_id || property.id}/edit`} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700">
  Edit
</Link>

                    <Link to={`/seller/properties/${property.property_id}/report`} className="flex-1 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-[#075aa8]">
  AI Report
</Link>
              <a
                href={`/seller/properties/${property.property_id || property.id}/media`}
                className="flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 font-bold text-violet-700 transition hover:bg-violet-100"
              >
                Photos & Videos
              </a>

                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default SellerDashboard;
