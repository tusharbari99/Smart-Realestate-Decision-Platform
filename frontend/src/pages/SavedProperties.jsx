import { useEffect, useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";

import CompareBar from "../components/CompareBar";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";
import { useFavorites } from "../context/FavoritesContext";
import api from "../services/api";

function SavedProperties() {
  const { favoriteIds, loadFavorites } = useFavorites();

  const [properties, setProperties] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSavedProperties() {
      try {
        setPageLoading(true);
        setError("");

        await loadFavorites();

        const response = await api.get("/favorites");

        const savedProperties = Array.isArray(response.data)
          ? response.data
          : response.data.favorites ||
            response.data.data ||
            [];

        setProperties(savedProperties);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Saved properties load nahi ho paayi.",
        );
      } finally {
        setPageLoading(false);
      }
    }

    fetchSavedProperties();
  }, []);

  const visibleProperties = properties.filter((property) =>
    favoriteIds.includes(
      Number(property.property_id ?? property.id),
    ),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wider text-[#0b84e5]">
            Buyer Shortlist
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
            Saved Properties
          </h1>

          <p className="mt-3 text-slate-500">
            Your saved properties will appear here.
          </p>
        </div>

        {pageLoading && (
          <div className="flex min-h-72 items-center justify-center">
            <LoaderCircle
              size={36}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        )}

        {!pageLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-semibold text-red-700">
            {error}
          </div>
        )}

        {!pageLoading &&
          !error &&
          visibleProperties.length === 0 && (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Heart size={30} />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900">
                Abhi koi saved property nahi hai
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Property card ya details page par heart click
                karke property save karo.
              </p>
            </div>
          )}

        {!pageLoading &&
          !error &&
          visibleProperties.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProperties.map((property) => (
                <PropertyCard
                  key={property.property_id ?? property.id}
                  property={property}
                />
              ))}
            </div>
          )}
      </main>

      <Footer />
      <CompareBar />
    </div>
  );
}

export default SavedProperties;
