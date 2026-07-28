import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Heart,
  Home,
  LoaderCircle,
  MessageSquare,
  Scale,
  Sparkles,
} from "lucide-react";

import Navbar from "../components/Navbar";
import api from "../services/api";
import DashboardRecommendations from "../components/DashboardRecommendations";
import DashboardContinueComparing from "../components/DashboardContinueComparing";
import DashboardRecentlyViewed from "../components/DashboardRecentlyViewed";
import BuyerPreferenceSummary from "../components/BuyerPreferenceSummary";
import DashboardMatchAlerts from "../components/DashboardMatchAlerts";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function BuyerDashboard() {
  const user = getUser();

  const [savedCount, setSavedCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [favoritesResult, requestsResult] =
          await Promise.allSettled([
            api.get("/favorites"),
            api.get("/buyer/inquiries"),
          ]);

        if (favoritesResult.status === "fulfilled") {
          const data = favoritesResult.value.data;

          const favorites = Array.isArray(data)
            ? data
            : data?.favorites || data?.data || [];

          setSavedCount(favorites.length);
        }

        if (requestsResult.status === "fulfilled") {
          const inquiries =
            requestsResult.value.data?.inquiries || [];

          setRequestCount(
            Array.isArray(inquiries) ? inquiries.length : 0,
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const actions = [
    {
      title: "Browse Properties",
      text: "Find verified homes and investments.",
      icon: Home,
      link: "/properties",
      value: "Explore",
    },
    {
      title: "Saved Properties",
      text: "View your shortlisted properties.",
      icon: Heart,
      link: "/buyer/saved-properties",
      value: savedCount,
    },
    {
      title: "My Requests",
      text: "Track site visits and price requests.",
      icon: MessageSquare,
      link: "/buyer/requests",
      value: requestCount,
    },
    {
      title: "AI Recommendations",
      text: "Get properties matched to your needs.",
      icon: Sparkles,
      link: "/buyer/recommendations",
      value: "Smart Match",
    },
    {
      title: "Compare Properties",
      text: "Compare selected properties side by side.",
      icon: Scale,
      link: "/compare",
      value: "Compare",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-300">
            Buyer Dashboard
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Welcome, {user.name || "Buyer"}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            Search, save, compare, and track your property
            buying journey.
          </p>

          <Link
            to="/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-extrabold text-white"
          >
            Find a Property
            <ArrowRight size={18} />
          </Link>
        </section>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map(
              ({ title, text, icon: Icon, link, value }) => (
                <Link
                  key={title}
                  to={link}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0b84e5]">
                      <Icon size={23} />
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {value}
                    </span>
                  </div>

                  <h2 className="mt-5 text-xl font-black text-slate-900">
                    {title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {text}
                  </p>

                  <span className="mt-5 flex items-center gap-2 text-sm font-bold text-[#075aa8]">
                    Open
                    <ArrowRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              ),
            )}
          </section>
        )}
      
        <DashboardMatchAlerts />
        <BuyerPreferenceSummary />
        <DashboardRecommendations />
        <DashboardContinueComparing />
        <DashboardRecentlyViewed />

</main>
    </div>
  );
}

export default BuyerDashboard;
