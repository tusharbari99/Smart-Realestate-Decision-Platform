import {
  useEffect,
  useMemo,
  useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Box,
  Bus,
  CircleAlert,
  GraduationCap,
  Heart,
  Hospital,
  MapPin,
  Ruler,
  ShieldAlert,
  Sparkles,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";

import Footer from "../components/Footer";
import PropertyVideoGallery from "../components/PropertyVideoGallery";

import InterestForm from "../components/InterestForm";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useFavorites } from "../context/FavoritesContext";

const fallbackImages = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=85",
];

function assetUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `http://localhost:5001${url}`;
}

function formatType(type) {
  if (!type) return "Property";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function ScoreCard({ title, value, icon: Icon, description }) {
  const score = Number(value || 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#075aa8]">
          <Icon size={22} />
        </div>

        <span className="text-2xl font-black text-[#075aa8]">
          {score}/100
        </span>
      </div>

      <h3 className="mt-4 font-extrabold text-slate-900">{title}</h3>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#075aa8] to-[#45b7ff]"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function facilityIcon(type) {
  const value = String(type || "").toLowerCase();

  if (value.includes("school") || value.includes("college")) {
    return GraduationCap;
  }

  if (value.includes("hospital") || value.includes("medical")) {
    return Hospital;
  }

  if (
    value.includes("transport") ||
    value.includes("bus") ||
    value.includes("metro")
  ) {
    return Bus;
  }

  return MapPin;
}

const amenityIcons = {
  "Car Parking": "🚗",
  "Bike Parking": "🏍️",
  Lift: "🛗",
  "24/7 Security": "🛡️",
  "CCTV Surveillance": "📹",
  "Power Backup": "⚡",
  "24/7 Water Supply": "💧",
  Balcony: "🌤️",
  Garden: "🌿",
  Gym: "🏋️",
  "Swimming Pool": "🏊",
  Clubhouse: "🏢",
  "Children's Play Area": "🛝",
  "Gated Society": "🚧",
  "Gas Pipeline": "🔥",
  "Internet / Wi-Fi": "📶",
  "Pet Friendly": "🐾",
  "Fully Furnished": "🛋️",
  "Semi Furnished": "🪑",
  Unfurnished: "🏠",
};

function parseAmenities(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value || typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter(Boolean)
      : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const storedUser = (() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  })();

  const currentRole = String(
    storedUser?.role ||
      storedUser?.user_type ||
      storedUser?.account_type ||
      ""
  ).toLowerCase();

  useEffect(() => {
    if (currentRole === "seller") {
      navigate("/seller/dashboard", {
        replace: true,
      });
    }
  }, [currentRole, navigate]);

  const { isFavorite, toggleFavorite } = useFavorites();
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const saved = isFavorite(id);

  async function handleFavorite() {
    try {
      setFavoriteSaving(true);
      await toggleFavorite(id);
    } catch (error) {
      window.alert(
        error.response?.data?.message ||
          "Property save nahi ho paayi.",
      );
    } finally {
      setFavoriteSaving(false);
    }
  }


  const [details, setDetails] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isGalleryFullscreen, setIsGalleryFullscreen] = useState(false);
  const [showInterestForm, setShowInterestForm] = useState(false);

  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySending, setInquirySending] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  async function handleInquirySubmit(event) {
    event.preventDefault();

    const message = inquiryMessage.trim();

    if (!message) {
      setInquiryStatus({
        type: "error",
        text: "Seller ke liye message likho.",
      });
      return;
    }

    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;

      const role = String(
        user?.role || user?.user_type || user?.account_type || "",
      ).toLowerCase();

      if (role !== "buyer") {
        setInquiryStatus({
          type: "error",
          text: "Inquiry send karne ke liye Buyer account required hai.",
        });
        return;
      }

      setInquirySending(true);
      setInquiryStatus(null);

      const response = await api.post("/inquiries", {
        property_id: Number(id),
        message,
      });

      setInquiryMessage("");
      setInquiryStatus({
        type: "success",
        text:
          response.data?.message ||
          "Inquiry seller ko send ho gayi.",
      });
    } catch (error) {
      setInquiryStatus({
        type: "error",
        text:
          error.response?.data?.message ||
          "Inquiry send nahi ho paayi.",
      });
    } finally {
      setInquirySending(false);
    }
  }

  useEffect(() => {
    async function loadProperty() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/properties/${id}`);
        setDetails(response.data);
      } catch (requestError) {
        console.error("Property detail error:", requestError);

        setError(
          requestError.response?.data?.message ||
            "Property details load nahi ho paayi.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [id]);

  const gallery = useMemo(() => {
    if (!details) return fallbackImages;

    const imageList = (details.images || [])
      .map((image) => assetUrl(image.image_url))
      .filter(Boolean);

    const primaryImage = assetUrl(details.property?.primary_image);

    if (primaryImage && !imageList.includes(primaryImage)) {
      imageList.unshift(primaryImage);
    }

    return imageList.length > 0 ? imageList : fallbackImages;
  }, [details]);

  function showPreviousGalleryImage() {
    setActiveImage((current) =>
      current <= 0
        ? gallery.length - 1
        : current - 1
    );
  }

  function showNextGalleryImage() {
    setActiveImage((current) =>
      current >= gallery.length - 1
        ? 0
        : current + 1
    );
  }

  async function openGalleryFullscreen() {
    const galleryElement = document.getElementById(
      "property-main-gallery"
    );

    if (!galleryElement) return;

    const fullscreenElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement;

    try {
      if (fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }

        setIsGalleryFullscreen(false);
        return;
      }

      if (galleryElement.requestFullscreen) {
        await galleryElement.requestFullscreen();
      } else if (galleryElement.webkitRequestFullscreen) {
        galleryElement.webkitRequestFullscreen();
      }

      setIsGalleryFullscreen(true);
    } catch (fullscreenError) {
      console.error("Fullscreen error:", fullscreenError);
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreenElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement;

      setIsGalleryFullscreen(Boolean(fullscreenElement));
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    document.addEventListener(
      "webkitfullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-8 h-[420px] animate-pulse rounded-3xl bg-slate-200" />

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !details?.property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <CircleAlert size={58} className="mx-auto text-red-500" />

          <h1 className="mt-5 text-3xl font-black text-slate-900">
            Property nahi mili
          </h1>

          <p className="mt-3 text-slate-500">{error}</p>

          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#075aa8] px-6 py-3 font-bold text-white"
          >
            <ArrowLeft size={19} />
            Home par wapas jao
          </Link>
        </main>
      </div>
    );
  }

  const {
    property,
    intelligence,
    nearby_facilities: nearbyFacilities = [],
    three_d_content: threeDContent = [],
    reviews = [],
  } = details;

  const propertyAmenities = parseAmenities(
    property.amenities
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#075aa8]"
            >
              <ArrowLeft size={18} />
              Back to properties
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
            <div
              id="property-main-gallery"
              className="group relative h-[300px] overflow-hidden rounded-3xl bg-slate-200 sm:h-[450px]"
            >
              <img
                src={gallery[activeImage]}
                alt={property.title}
                className="h-full w-full object-cover"
              />

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousGalleryImage}
                  className="absolute left-4 top-1/2 z-50 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100/25 bg-blue-400/5 text-white shadow-[0_8px_24px_rgba(30,100,180,0.14)] backdrop-blur-xl transition duration-200 hover:scale-110 hover:bg-blue-300/12 active:scale-95"
                  aria-label="Previous property image"
                >
                  <ChevronLeft size={34} />
                </button>

                <button
                  type="button"
                  onClick={showNextGalleryImage}
                  className="absolute right-4 top-1/2 z-50 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100/25 bg-blue-400/5 text-white shadow-[0_8px_24px_rgba(30,100,180,0.14)] backdrop-blur-xl transition duration-200 hover:scale-110 hover:bg-blue-300/12 active:scale-95"
                  aria-label="Next property image"
                >
                  <ChevronRight size={34} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={openGalleryFullscreen}
              className="absolute bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl border border-blue-100/25 bg-blue-400/5 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(30,100,180,0.14)] backdrop-blur-xl transition duration-200 hover:scale-[1.03] hover:bg-blue-300/12 active:scale-95"
              aria-label="Open gallery full screen"
            >
              <Maximize2 size={18} />
              {isGalleryFullscreen
                ? "Minimize Screen"
                : "View Full Screen"}
            </button>

              <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow">
                <BadgeCheck size={17} />
                Verified Property
              </span>

              <button
            type="button"
            onClick={handleFavorite}
            disabled={favoriteSaving}
            aria-label={
              saved ? "Remove saved property" : "Save property"
            }
            className={`absolute right-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-blue-100/25 bg-blue-400/5 text-white shadow-[0_8px_24px_rgba(30,100,180,0.14)] backdrop-blur-xl transition duration-200 hover:scale-110 hover:bg-blue-300/12 active:scale-95 ${
              saved
                ? "text-red-500"
                : "text-white hover:text-red-400"
            } disabled:opacity-60`}
          >
            <Heart
              size={21}
              fill={saved ? "currentColor" : "none"}
            />
          </button>

              <div className="absolute bottom-4 right-4 rounded-full bg-black/65 px-4 py-2 text-xs font-bold text-white">
                {activeImage + 1} / {gallery.length}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:h-[450px] lg:grid-cols-1 lg:grid-rows-3">
              {gallery.slice(0, 3).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`min-h-0 overflow-hidden rounded-2xl border-2 bg-slate-100 ${
                    activeImage === index
                      ? "border-[#0b84e5]"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`Property view ${index + 1}`}
                    className="h-24 w-full object-contain sm:h-32 lg:h-full"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#075aa8]">
                        {formatType(property.property_type)}
                      </span>

                      {property.growth_tag && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          {property.growth_tag}
                        </span>
                      )}
                    </div>

                    <h1 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
                      {property.title}
                    </h1>

                    <p className="mt-3 flex items-start gap-2 text-slate-500">
                      <MapPin size={19} className="mt-0.5 shrink-0" />
                      {property.address
                        ? `${property.address}, ${property.city}, ${property.state}`
                        : `${property.city}, ${property.state}`}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm font-semibold text-slate-400">
                      Platform Price
                    </p>

                    <p className="mt-1 text-2xl font-black text-[#075aa8]">
                      {property.price_range}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-4 border-y border-slate-100 py-6 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-400">Property Type</p>
                    <p className="mt-1 font-extrabold text-slate-800">
                      {formatType(property.property_type)}
                    </p>
                  </div>

                  <div>
                    <p className="flex items-center gap-1 text-sm text-slate-400">
                      <Ruler size={16} />
                      Property Area
                    </p>

                    <p className="mt-1 font-extrabold text-slate-800">
                      {property.area_sqft
                        ? `${Number(property.area_sqft).toLocaleString(
                            "en-IN",
                          )} sq.ft`
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">City</p>
                    <p className="mt-1 font-extrabold text-slate-800">
                      {property.city}
                    </p>
                  </div>
                </div>

                <div className="mt-7">
                  <h2 className="text-xl font-black text-slate-900">
                    Property Description
                  </h2>

                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-600">
                    {property.description || "Description available nahi hai."}
                  </p>
                </div>

                {propertyAmenities.length > 0 && (
              <section className="mt-7 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-white p-6 shadow-[0_14px_38px_rgba(30,100,170,0.10)] sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                      Property Highlights
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                      Facilities & Features
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Facilities provided with this property listing.
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                    {propertyAmenities.length} available
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {propertyAmenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="group flex min-h-17 items-center gap-3 rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_10px_26px_rgba(30,100,170,0.12)]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 text-xl">
                        {amenityIcons[amenity] || "✓"}
                      </span>

                      <div>
                        <p className="text-sm font-black text-slate-800">
                          {amenity}
                        </p>

                        <p className="mt-0.5 text-xs text-emerald-600">
                          Available
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {property.known_issues && (
                  <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-center gap-2 font-extrabold text-amber-800">
                      <ShieldAlert size={20} />
                      Known Issues
                    </div>

                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      {property.known_issues}
                    </p>
                  </div>
                )}
              </div>

              <section className="mt-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Sparkles size={24} />
                  </div>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
                      AI Property Intelligence
                    </p>

                    <h2 className="text-2xl font-black text-slate-900">
                      Smart decision report
                    </h2>
                  </div>
                </div>

                {intelligence ? (
                  <>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <ScoreCard
                        title="Growth Score"
                        value={intelligence.growth_score}
                        icon={TrendingUp}
                        description="Future location and development potential."
                      />

                      <ScoreCard
                        title="Investment Score"
                        value={intelligence.investment_score}
                        icon={Sparkles}
                        description="Overall investment attractiveness."
                      />

                      <ScoreCard
                        title="Livability Score"
                        value={intelligence.livability_score}
                        icon={Star}
                        description="Suitability for comfortable daily living."
                      />

                      <ScoreCard
                        title="Risk Score"
                        value={intelligence.risk_score}
                        icon={ShieldAlert}
                        description="Lower score generally indicates lower risk."
                      />
                    </div>

                    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                      <h3 className="text-xl font-black text-slate-900">
                        AI Summary
                      </h3>

                      <p className="mt-3 leading-8 text-slate-600">
                        {intelligence.summary}
                      </p>

                      {intelligence.future_outlook && (
                        <div className="mt-5 rounded-2xl bg-blue-50 p-5">
                          <p className="text-sm font-extrabold text-[#075aa8]">
                            Future Outlook
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {intelligence.future_outlook}
                          </p>
                        </div>
                      )}

                      <p className="mt-5 text-xs leading-5 text-slate-400">
                        {intelligence.data_note}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="mt-5 rounded-2xl bg-white p-6 text-slate-500">
                    AI report available nahi hai.
                  </p>
                )}
              </section>

              <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-2xl font-black text-slate-900">
                  Nearby Facilities
                </h2>

                <p className="mt-2 text-slate-500">
                  Schools, hospitals aur transport facilities.
                </p>

                {nearbyFacilities.length > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {nearbyFacilities.map((facility) => {
                      const FacilityIcon = facilityIcon(
                        facility.facility_type,
                      );

                      return (
                        <div
                          key={facility.facility_id}
                          className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#075aa8]">
                            <FacilityIcon size={22} />
                          </div>

                          <div>
                            <p className="font-extrabold text-slate-800">
                              {facility.facility_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {facility.facility_type} •{" "}
                              {facility.distance_km} km away
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                    Nearby facilities abhi database mein add nahi hain.
                  </div>
                )}
              </section>

              <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <Box size={25} className="text-[#075aa8]" />

                  <h2 className="text-2xl font-black text-slate-900">
                    3D / 360° Virtual Tour
                  </h2>
                </div>

                {threeDContent.length > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {threeDContent.map((content) => (
                      <a
                        key={content.content_id}
                        href={content.content_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-blue-200 bg-blue-50 p-5"
                      >
                        <p className="font-extrabold text-[#075aa8]">
                          {content.room_label || "Virtual Property View"}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          {content.content_type}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                    Is property ke liye virtual tour abhi available nahi hai.
                  </div>
                )}
              </section>

              <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-2xl font-black text-slate-900">
                  Buyer Reviews
                </h2>

                {reviews.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {reviews.map((review) => (
                      <article
                        key={review.review_id}
                        className="rounded-2xl border border-slate-200 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-extrabold text-slate-800">
                            {review.buyer_name}
                          </p>

                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                            <Star size={15} fill="currentColor" />
                            {review.rating}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {review.comment}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                    Is property par abhi koi review nahi hai.
                  </div>
                )}
              </section>
            </div>

            <aside>
              <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                <p className="text-sm font-semibold text-slate-400">
                  Like this property?
                </p>

                <h2 className="mt-2 text-xl font-black text-slate-900">
                  We Handle the Deal
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Our team helps with visits, price talks, and paperwork.
                </p>

                <button
                type="button"
                onClick={() =>
                  setShowInterestForm((current) => !current)
                }
                className="mt-6 w-full rounded-xl bg-[#0b84e5] px-5 py-4 font-extrabold text-white transition hover:bg-[#0675cc]"
              >
                {showInterestForm
                  ? "Hide Form"
                  : "I'm Interested"}
              </button>

              {showInterestForm && (
                <InterestForm
                  propertyId={id}
                  onClose={() => setShowInterestForm(false)}
                />
              )}

              {showInquiry && (
                <form
                  onSubmit={handleInquirySubmit}
                  className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <label
                    htmlFor="inquiry-message"
                    className="text-sm font-bold text-slate-700"
                  >
                    Message for seller
                  </label>

                  <textarea
                    id="inquiry-message"
                    rows={4}
                    value={inquiryMessage}
                    onChange={(event) =>
                      setInquiryMessage(event.target.value)
                    }
                    placeholder="Example: Mujhe is property ki site visit aur complete price details chahiye."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {inquiryStatus && (
                    <p
                      className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                        inquiryStatus.type === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {inquiryStatus.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={inquirySending}
                    className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {inquirySending
                      ? "Sending Inquiry..."
                      : "Confirm & Send"}
                  </button>
                </form>
              )}

                <button className="mt-3 w-full rounded-xl border border-slate-300 px-5 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-600">
                  Add to Compare
                </button>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Public Price Policy
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Buyers can see the platform-calculated price range.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

            <PropertyVideoGallery
        propertyId={details?.property?.property_id || id}
      />

<Footer />
    </div>
  );
}

export default PropertyDetails;
