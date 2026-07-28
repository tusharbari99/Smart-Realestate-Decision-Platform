import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import CompareBar from "../components/CompareBar";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";
import CityAutocomplete from "../components/CityAutocomplete";
import api from "../services/api";

function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    total_pages: 0,
  });

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    city: searchParams.get("city") || "",
    type: searchParams.get("type") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minArea: searchParams.get("minArea") || "",
    sort: searchParams.get("sort") || "newest",
  });

  const [page, setPage] = useState(
    Math.max(1, Number(searchParams.get("page") || 1)),
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: 9,
          sort: filters.sort,
        };

        Object.entries(filters).forEach(([key, value]) => {
          if (key !== "sort" && value !== "") {
            params[key] = value;
          }
        });

        const response = await api.get("/properties", { params });

        setProperties(response.data.properties || []);
        setPagination(
          response.data.pagination || {
            page: 1,
            total: 0,
            total_pages: 0,
          },
        );

        const urlParams = {};

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== "") {
            urlParams[key] = value;
          }
        });

        if (page > 1) {
          urlParams.page = String(page);
        }

        setSearchParams(urlParams, { replace: true });
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError.response?.data?.message ||
            "Could not load properties. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, [filters, page, setSearchParams]);

  function updateFilter(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));

    setPage(1);
  }

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setMobileFiltersOpen(false);
  }

  function clearFilters() {
    setFilters({
      q: "",
      city: "",
      type: "",
      minPrice: "",
      maxPrice: "",
      minArea: "",
      sort: "newest",
    });

    setPage(1);
  }

  const filterFields = (
    <>
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          Keyword
        </span>

        <input
          name="q"
          value={filters.q}
          onChange={updateFilter}
          placeholder="Project, locality or landmark"
          className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          City or Locality
        </span>

        <CityAutocomplete
          value={filters.city}
          onChange={(value) => {
            setFilters((current) => ({
              ...current,
              city: value,
            }));

            setPage(1);
          }}
          onSelect={(location) => {
            if (!location) return;

            setFilters((current) => ({
              ...current,

              city:
                location.name ||
                location.city ||
                location.label,
            }));

            setPage(1);
          }}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          Property Type
        </span>

        <select
          name="type"
          value={filters.type}
          onChange={updateFilter}
          className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="plot">Plot</option>
          <option value="commercial">Commercial</option>
          <option value="other">Other</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="mb-2 block text-xs font-bold text-slate-600">
            Minimum Price
          </span>

          <input
            type="number"
            min="0"
            name="minPrice"
            value={filters.minPrice}
            onChange={updateFilter}
            placeholder="₹ Min"
            className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold text-slate-600">
            Maximum Price
          </span>

          <input
            type="number"
            min="0"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={updateFilter}
            placeholder="₹ Max"
            className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          Minimum Area
        </span>

        <input
          type="number"
          min="0"
          name="minArea"
          value={filters.minArea}
          onChange={updateFilter}
          placeholder="Example: 800 sq.ft"
          className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
        />
      </label>

      <button
        type="submit"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 font-extrabold text-white"
      >
        <Search size={18} />
        Apply Filters
      </button>

      <button
        type="button"
        onClick={clearFilters}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-slate-700"
      >
        <X size={18} />
        Clear Filters
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-widest text-[#0b84e5]">
              Property Discovery
            </p>

            <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
                  Properties for sale
                </h1>

                <p className="mt-3 text-slate-500">
                  Search verified properties using location, budget, area and
                  property type.
                </p>
              </div>

              <a
  href="/buyer/recommendations"
  className="w-fit rounded-xl bg-violet-100 px-5 py-3 text-sm font-extrabold text-violet-700"
>
  Get AI Recommendations
</a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>

            <select
              name="sort"
              value={filters.sort}
              onChange={updateFilter}
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="area">Largest Area</option>
            </select>
          </div>

          <div className="mt-6 grid gap-8 lg:mt-0 lg:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block">
              <form
                onSubmit={handleSearch}
                className="sticky top-24 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <p className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <SlidersHorizontal size={20} />
                    Filters
                  </p>
                </div>

                {filterFields}
              </form>
            </aside>

            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-slate-900">
                    {pagination.total} properties found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Only verified listings are shown.
                  </p>
                </div>

                <select
                  name="sort"
                  value={filters.sort}
                  onChange={updateFilter}
                  className="hidden min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold outline-none lg:block"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="area">Largest Area</option>
                </select>
              </div>

              {loading && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="h-[480px] animate-pulse rounded-2xl bg-slate-200"
                    />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 font-bold text-red-700">
                  {error}
                </div>
              )}

              {!loading && !error && properties.length === 0 && (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center">
                  <Search size={46} className="mx-auto text-slate-300" />

                  <h2 className="mt-4 text-2xl font-black text-slate-900">
                    No matching properties found. Try changing your location, property type, or budget.
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Filters change karke dobara search karo.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-6 rounded-xl bg-[#0b84e5] px-6 py-3 font-bold text-white"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {!loading && properties.length > 0 && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.property_id}
                      property={property}
                    />
                  ))}
                </div>
              )}

              {!loading && pagination.total_pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white disabled:opacity-40"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <p className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700">
                    Page {pagination.page} of {pagination.total_pages}
                  </p>

                  <button
                    type="button"
                    disabled={page >= pagination.total_pages}
                    onClick={() => setPage((current) => current + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white disabled:opacity-40"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50 lg:hidden">
          <div className="absolute inset-y-0 right-0 w-[90%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                Property Filters
              </h2>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg bg-slate-100 p-2"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSearch} className="mt-6 space-y-5">
              {filterFields}
            </form>
          </div>
        </div>
      )}

      <Footer />
      <CompareBar />
    </div>
  );
}

export default Properties;
