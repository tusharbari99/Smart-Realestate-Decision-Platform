import { Navigate } from "react-router";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  House,
  Map,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import CompareBar from "../components/CompareBar";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";
import SearchBox from "../components/SearchBox";
import api from "../services/api";

const categories = [
  {
    title: "Apartments",
    description: "Modern homes in prime locations",
    icon: Building2,
    type: "apartment",
    accent: "blue",
  },
  {
    title: "Villas",
    description: "Spacious and premium living",
    icon: House,
    type: "villa",
    accent: "violet",
  },
  {
    title: "Plots & Land",
    description: "Build your dream property",
    icon: Map,
    type: "plot",
    accent: "emerald",
  },
  {
    title: "Commercial",
    description: "Offices, shops and investments",
    icon: BriefcaseBusiness,
    type: "commercial",
    accent: "amber",
  },
];

function BuyerHome() {
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        setPropertiesLoading(true);
        setPropertiesError("");

        const response = await api.get("/properties", {
          params: {
            limit: 4,
            sort: "newest",
          },
        });

        setProperties(response.data.properties || []);
      } catch (error) {
        console.error("Property loading error:", error);
        setPropertiesError(
          "Could not load properties. Please try again.",
        );
      } finally {
        setPropertiesLoading(false);
      }
    }

    loadProperties();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section
          className="relative flex min-h-[570px] items-center bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(2,31,61,0.92), rgba(4,74,133,0.70), rgba(2,31,61,0.40)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85')",
          }}
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                <Sparkles size={17} className="text-yellow-300" />
                AI-powered property decision platform
              </div>

              <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                Find a property that is
                <span className="block text-[#65c6ff]">
                  actually right for you.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
                Discover verified properties, compare investment potential
                and receive intelligent recommendations based on your budget,
                location and requirements.
              </p>
            </div>

            <div className="mt-9 max-w-6xl">
              <SearchBox />
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <ShieldCheck size={25} />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  Verified Properties
                </p>
                <p className="text-sm text-slate-500">
                  Reviewed before publishing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <Sparkles size={25} />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  AI Recommendations
                </p>
                <p className="text-sm text-slate-500">
                  Personalized suitability scores
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <TrendingUp size={25} />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  Investment Insights
                </p>
                <p className="text-sm text-slate-500">
                  Growth and risk analysis
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[#0b84e5]">
            Property Categories
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-900">
            Explore properties your way
          </h2>

          <p className="mt-3 max-w-2xl text-slate-500">
            Choose the property type you are interested in and start exploring
            verified listings.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(
              ({
                title,
                description,
                icon: CategoryIcon,
                type,
                accent,
              }) => {
                const accentStyles = {
                  blue: {
                    icon:
                      "bg-blue-100 text-blue-700 group-hover:bg-blue-600",
                    glow:
                      "group-hover:shadow-blue-500/20",
                    line:
                      "from-blue-500 to-cyan-400",
                  },

                  violet: {
                    icon:
                      "bg-violet-100 text-violet-700 group-hover:bg-violet-600",
                    glow:
                      "group-hover:shadow-violet-500/20",
                    line:
                      "from-violet-500 to-fuchsia-400",
                  },

                  emerald: {
                    icon:
                      "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600",
                    glow:
                      "group-hover:shadow-emerald-500/20",
                    line:
                      "from-emerald-500 to-teal-400",
                  },

                  amber: {
                    icon:
                      "bg-amber-100 text-amber-700 group-hover:bg-amber-500",
                    glow:
                      "group-hover:shadow-amber-500/20",
                    line:
                      "from-amber-500 to-orange-400",
                  },
                };

                const style =
                  accentStyles[accent] ||
                  accentStyles.blue;

                return (
                  <Link
                    key={title}
                    to={`/properties?type=${type}`}
                    aria-label={`Explore ${title}`}
                    className={`group relative isolate overflow-hidden rounded-3xl border border-white/70 bg-white/65 p-6 text-left shadow-lg shadow-slate-900/5 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-white hover:shadow-2xl ${style.glow}`}
                  >
                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/70 blur-2xl transition duration-500 group-hover:scale-150" />

                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.line}`}
                    />

                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:text-white ${style.icon}`}
                    >
                      <CategoryIcon size={26} />
                    </div>

                    <h3 className="relative mt-5 text-lg font-extrabold text-slate-900">
                      {title}
                    </h3>

                    <p className="relative mt-2 min-h-12 text-sm leading-6 text-slate-500">
                      {description}
                    </p>

                    <div className="relative mt-5 flex items-center gap-2 text-sm font-extrabold text-[#0b84e5]">
                      <span>Explore properties</span>

                      <span className="transition-transform duration-300 group-hover:translate-x-2">
                        →
                      </span>
                    </div>

                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 via-transparent to-blue-50/40 opacity-0 transition duration-300 group-hover:opacity-100" />
                  </Link>
                );
              },
            )}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
                  Live Database Listings
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  Verified properties
                </h2>

                <p className="mt-3 max-w-2xl text-slate-500">
                  These verified properties are loaded directly from the The homeasy database.
                </p>
              </div>

              <Link
              to="/properties"
              className="w-fit rounded-xl border border-blue-200 px-5 py-3 text-sm font-bold text-[#075aa8] transition hover:bg-blue-50"
            >
              View All Properties
            </Link>
            </div>

            {propertiesLoading && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-[480px] animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            )}

            {!propertiesLoading && propertiesError && (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
                {propertiesError}
              </div>
            )}

            {!propertiesLoading &&
              !propertiesError &&
              properties.length === 0 && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                  Abhi koi verified property available nahi hai.
                </div>
              )}

            {!propertiesLoading && properties.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.property_id}
                    property={property}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#053e75] to-[#0b84e5] px-6 py-10 text-white shadow-xl sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14">
            <div className="max-w-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles size={27} />
              </div>

              <h2 className="mt-5 text-3xl font-black">
                Let AI find your ideal property
              </h2>

              <p className="mt-3 leading-7 text-blue-100">
                Enter your budget, preferred area and requirements. Our system
                will rank properties and provide suitability, growth and risk
                scores.
              </p>
            </div>

            <a
  href="/buyer/recommendations"
  className="mt-7 rounded-xl bg-white px-7 py-4 font-extrabold text-[#075aa8] shadow-lg transition hover:bg-blue-50 lg:mt-0"
>
  Get AI Recommendations
</a>
          </div>
        </section>
      </main>

      <Footer />
      <CompareBar />
    </div>
  );
}

function Home() {
  let currentUser = null;

  try {
    const savedUser = localStorage.getItem("user");
    currentUser = savedUser
      ? JSON.parse(savedUser)
      : null;
  } catch {
    currentUser = null;
  }

  const currentRole = String(
    currentUser?.role ||
      currentUser?.user_type ||
      currentUser?.account_type ||
      "guest"
  ).toLowerCase();

  if (currentRole === "seller") {
    return (
      <Navigate
        to="/seller/dashboard"
        replace
      />
    );
  }

  return <BuyerHome />;
}

export default Home;
