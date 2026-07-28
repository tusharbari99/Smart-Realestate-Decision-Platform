import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import SmartSuggestionPopup from "./SmartSuggestionPopup";
import BuyerAiMenu from "./BuyerAiMenu";

const previewDetails = {
  "My Dashboard": {
    title: "Buyer Dashboard",
    description:
      "View saved properties, recommendations, comparisons, and requests.",
  },

  "AI Recommendations": {
    title: "AI Recommendations",
    description:
      "Discover properties matched to your needs and investment goals.",
  },

  Compare: {
    title: "Compare Properties",
    description:
      "Compare selected properties, prices, features, and AI insights.",
  },

  Saved: {
    title: "Saved Properties",
    description:
      "View all properties saved to your personal shortlist.",
  },

  "My Requests": {
    title: "My Property Requests",
    description:
      "Track site visits, property details, and price discussion requests.",
  },

  Buy: {
    title: "Browse Properties",
    description:
      "Explore verified properties available on The homeasy.",
  },

  "How It Works": {
    title: "How The homeasy Works",
    description:
      "Understand property verification, visits, and deal support.",
  },

  "Seller Dashboard": {
    title: "Seller Dashboard",
    description:
      "Manage listings, AI reports, verification, and 3D requests.",
  },

  "Company Dashboard": {
    title: "Company Dashboard",
    description:
      "Manage users, properties, buyer requests, and support operations.",
  },
};

function NavPreviewLink({
  item,
  active,
}) {

  const itemLabel = String(
    item?.label || item?.name || ""
  ).trim();

  const itemPath = String(
    item?.href || item?.to || item?.path || ""
  ).trim();

  if (
    itemLabel === "For You" ||
    itemLabel === "Alerts" ||
    itemLabel === "Property Alerts" ||
    itemPath === "/buyer/smart-suggestions" ||
    itemPath === "/buyer/notifications"
  ) {
    return null;
  }

  if (
    itemLabel === "AI Recommendations" ||
    itemPath === "/buyer/recommendations"
  ) {
    return <BuyerAiMenu />;
  }


  const preview = previewDetails[item.label] || {
    title: item.label,
    description:
      "Open this section to view more information and available actions.",
  };

  return (
    <div className="group relative">
      <Link
        to={item.href}
        className={`block rounded-xl px-4 py-2.5 text-sm font-bold backdrop-blur-sm transition-all duration-200 ${
          active
            ? "bg-white/20 text-white shadow-sm"
            : "bg-white/[0.03] text-blue-50 hover:bg-white/10 hover:text-white"
        }`}
      >
        {item.label}
      </Link>

      <SmartSuggestionPopup
        enabled={item.label === "Buy"}
      />

      {item.label !== "Buy" && (
      <div
        className="pointer-events-none invisible absolute left-1/2 top-full z-[120] mt-3 w-72 -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/95 p-4 text-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                Page Preview
              </p>

              <h3 className="mt-2 text-base font-black text-slate-900">
                {preview.title}
              </h3>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ArrowUpRight size={18} />
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {preview.description}
          </p>

          <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
            Click to open this page
          </div>
        </div>

        <div className="absolute -top-1.5 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-white/40 bg-white/95" />
      </div>
      )}
    </div>
  );
}

export default NavPreviewLink;
