import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import {
  BadgeCheck,
  Check,
  Heart,
  MapPin,
  Ruler,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { useCompare } from "../context/CompareContext";
import { useFavorites } from "../context/FavoritesContext";

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

  const index =
    (Number(property.property_id || 1) - 1) %
    fallbackImages.length;

  return fallbackImages[index < 0 ? 0 : index];
}

function formatType(type) {
  if (!type) return "Property";

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function PropertyCard({ property }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { toggleCompare, isCompared } = useCompare();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [favoriteSaving, setFavoriteSaving] = useState(false);

  const selected = isCompared(property.property_id);
  const saved = isFavorite(property.property_id);

  function handleCompare() {
    const result = toggleCompare(property.property_id);

    if (!result.ok) {
      window.alert(result.message);
    }
  }

  async function handleFavorite() {
    const token = localStorage.getItem("token");
    const user = getSavedUser();

    const currentPath =
      `${location.pathname}${location.search}`;

    if (!token) {
      navigate(
        `/auth?redirect=${encodeURIComponent(currentPath)}`,
      );

      return;
    }

    const role = String(
      user?.role || user?.user_type || user?.account_type || "",
    ).toLowerCase();

    if (role !== "buyer") {
      const proceed = window.confirm(
        "Favourite feature ke liye buyer account required hai. Buyer account se login karna hai?",
      );

      if (proceed) {
        navigate(
          `/auth?redirect=${encodeURIComponent(currentPath)}`,
        );
      }

      return;
    }

    try {
      setFavoriteSaving(true);
      await toggleFavorite(property.property_id);
    } catch (error) {
      window.alert(
        error.response?.data?.message ||
          "Property save nahi ho paayi.",
      );
    } finally {
      setFavoriteSaving(false);
    }
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden">
        <img
          src={getImage(property)}
          alt={property.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow">
          <BadgeCheck size={15} />
          Verified
        </span>

        <button
          type="button"
          disabled={favoriteSaving}
          aria-label={
            saved ? "Remove saved property" : "Save property"
          }
          onClick={handleFavorite}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow transition ${
            saved
              ? "text-red-500"
              : "text-slate-600 hover:text-red-500"
          } disabled:opacity-60`}
        >
          <Heart
            size={20}
            fill={saved ? "currentColor" : "none"}
          />
        </button>

        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-bold text-white">
          <Sparkles size={14} />
          AI Report Available
        </span>
      </div>

      <div className="p-5">
        <h3 className="line-clamp-1 text-lg font-extrabold text-slate-900">
          {property.title}
        </h3>

        <p className="mt-2 flex items-start gap-1 text-sm text-slate-500">
          <MapPin size={15} className="mt-0.5 shrink-0" />

          {property.address
            ? `${property.address}, ${property.city}`
            : `${property.city}, ${property.state || ""}`}
        </p>

        <p className="mt-4 text-xl font-black text-[#075aa8]">
          {property.price_range}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
          <div>
            <p className="text-xs text-slate-400">
              Property Type
            </p>

            <p className="mt-1 text-sm font-bold text-slate-700">
              {formatType(property.property_type)}
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
                : "Not specified"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <TrendingUp
            size={17}
            className="mt-0.5 shrink-0"
          />

          <p className="text-xs font-bold leading-5">
            {property.growth_tag ||
              "Location intelligence available"}
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleCompare}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${
              selected
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {selected ? (
              <Check size={17} />
            ) : (
              <Scale size={17} />
            )}

            {selected ? "Selected" : "Compare"}
          </button>

          <Link
            to={`/properties/${property.property_id}`}
            className="flex flex-1 items-center justify-center rounded-xl bg-[#0b84e5] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#0675cc]"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
