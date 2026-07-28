import { useState } from "react";
import { useNavigate } from "react-router";
import {
  IndianRupee,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import MapLocationModal from "./MapLocationModal";

const tabs = ["Buy", "Commercial", "Plots"];

const budgetOptions = {
  under30: {
    minPrice: "",
    maxPrice: "3000000",
  },
  "30to60": {
    minPrice: "3000000",
    maxPrice: "6000000",
  },
  "60to100": {
    minPrice: "6000000",
    maxPrice: "10000000",
  },
  above100: {
    minPrice: "10000000",
    maxPrice: "",
  },
};

function SearchBox() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Buy");
  const [propertyType, setPropertyType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] =
    useState(null);
  const [budget, setBudget] = useState("");

  function handleTabChange(tab) {
    setActiveTab(tab);

    if (tab === "Commercial") {
      setPropertyType("commercial");
    } else if (tab === "Plots") {
      setPropertyType("plot");
    } else if (
      propertyType === "commercial" ||
      propertyType === "plot"
    ) {
      setPropertyType("");
    }
  }

  function handleSearch(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.set("q", keyword.trim());
    }

    if (propertyType) {
      params.set("type", propertyType);
    }

    if (budget && budgetOptions[budget]) {
      const selectedBudget = budgetOptions[budget];

      if (selectedBudget.minPrice) {
        params.set("minPrice", selectedBudget.minPrice);
      }

      if (selectedBudget.maxPrice) {
        params.set("maxPrice", selectedBudget.maxPrice);
      }
    }

    navigate(`/properties?${params.toString()}`);
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20">
      <div className="flex overflow-x-auto border-b border-slate-200 px-3 sm:px-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`relative min-w-max px-4 py-4 text-sm font-bold transition sm:px-6 ${
              activeTab === tab
                ? "text-[#075aa8]"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab}

            {activeTab === tab && (
              <span className="absolute inset-x-3 bottom-0 h-1 rounded-full bg-[#0b84e5]" />
            )}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSearch}
        className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[1.1fr_2fr_1fr_auto]"
      >
        <label className="flex min-h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
          <SlidersHorizontal size={19} className="text-[#075aa8]" />

          <select
            value={propertyType}
            onChange={(event) => setPropertyType(event.target.value)}
            aria-label="Property type"
            className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">All Property Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="flex min-h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
          <button
          type="button"
          onClick={() => setMapOpen(true)}
          className="shrink-0 text-[#075aa8] transition hover:scale-110 hover:text-blue-700"
          aria-label="Select location on map"
        >
          <MapPin size={20} />
        </button>

          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search locality, project or landmark"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>

        <label className="flex min-h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
          <IndianRupee size={19} className="text-[#075aa8]" />

          <select
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            aria-label="Budget"
            className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">Any Budget</option>
            <option value="under30">Under ₹30 Lakh</option>
            <option value="30to60">₹30–₹60 Lakh</option>
            <option value="60to100">₹60 Lakh–₹1 Crore</option>
            <option value="above100">Above ₹1 Crore</option>
          </select>
        </label>

        <button
          type="submit"
          className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-7 font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#0675cc]"
        >
          <Search size={20} />
          Search
        </button>
      </form>
      <MapLocationModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={(location) => {
          setSelectedCoordinates(location);

          setKeyword(
            `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`,
          );

          setMapOpen(false);
        }}
      />
    </div>
  );
}

export default SearchBox;
