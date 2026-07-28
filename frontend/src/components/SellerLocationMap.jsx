import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_LOCATION = {
  latitude: 18.5204,
  longitude: 73.8567,
  address: "Pune, Maharashtra",
  city: "Pune",
  state: "Maharashtra",
};

const markerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:38px;
      height:38px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:#1687e8;
      border:4px solid white;
      box-shadow:0 5px 18px rgba(15,23,42,.35);
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        width:10px;
        height:10px;
        border-radius:50%;
        background:white;
      "></div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

function validNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return Number.NaN;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

function getLocationText(properties = {}) {
  const parts = [
    properties.name,
    properties.street,
    properties.locality,
    properties.district,
    properties.city,
    properties.county,
    properties.state,
  ].filter(Boolean);

  return [...new Set(parts)].join(", ");
}

function getCity(properties = {}) {
  return (
    properties.city ||
    properties.town ||
    properties.village ||
    properties.locality ||
    properties.district ||
    ""
  );
}

async function searchLocations(query, signal) {
  const response = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(
      query
    )}&limit=6&lang=en`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("Location search failed.");
  }

  const data = await response.json();
  return Array.isArray(data.features) ? data.features : [];
}

async function reverseLocation(latitude, longitude) {
  const response = await fetch(
    `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&lang=en`
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.features?.[0] || null;
}

function RecenterMap({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], 16, {
      duration: 0.8,
    });
  }, [map, latitude, longitude]);

  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function SellerLocationMap(props) {
  const initialLocation = props.initialLocation || props.location || {};

  const isOpen =
    props.isOpen ?? props.open ?? props.visible ?? props.show ?? true;

  const initialLatitude =
    props.initialLat ??
    props.initialLatitude ??
    props.latitude ??
    initialLocation.latitude ??
    initialLocation.lat;

  const initialLongitude =
    props.initialLng ??
    props.initialLongitude ??
    props.longitude ??
    initialLocation.longitude ??
    initialLocation.lng;

  const initialAddress =
    props.initialAddress ??
    props.address ??
    initialLocation.address ??
    "";

  const initialCity =
    props.initialCity ?? props.city ?? initialLocation.city ?? "Pune";

  const initialState =
    props.initialState ??
    props.state ??
    initialLocation.state ??
    "Maharashtra";

  const parsedLatitude = validNumber(initialLatitude);
  const parsedLongitude = validNumber(initialLongitude);

  const hasInitialCoordinates =
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude) &&
    Math.abs(parsedLatitude) <= 90 &&
    Math.abs(parsedLongitude) <= 180 &&
    !(parsedLatitude === 0 && parsedLongitude === 0);

  const [latitude, setLatitude] = useState(
    hasInitialCoordinates
      ? parsedLatitude
      : DEFAULT_LOCATION.latitude
  );

  const [longitude, setLongitude] = useState(
    hasInitialCoordinates
      ? parsedLongitude
      : DEFAULT_LOCATION.longitude
  );

  const [query, setQuery] = useState(initialAddress);
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);

  const [hasSelection, setHasSelection] = useState(
    hasInitialCoordinates
  );

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const nextLatitude = validNumber(initialLatitude);
    const nextLongitude = validNumber(initialLongitude);

    const validCoordinates =
      Number.isFinite(nextLatitude) &&
      Number.isFinite(nextLongitude) &&
      !(nextLatitude === 0 && nextLongitude === 0);

    setLatitude(
      validCoordinates
        ? nextLatitude
        : DEFAULT_LOCATION.latitude
    );

    setLongitude(
      validCoordinates
        ? nextLongitude
        : DEFAULT_LOCATION.longitude
    );

    setHasSelection(validCoordinates);
    setQuery(initialAddress || "");
    setAddress(initialAddress || "");
    setCity(initialCity || "Pune");
    setState(initialState || "Maharashtra");
    setSuggestions([]);
    setError("");
  }, [isOpen]);

  useEffect(() => {
    const searchText = query.trim();

    if (!isOpen || searchText.length < 3) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setSuggestionsLoading(true);

        const results = await searchLocations(
          `${searchText}, India`,
          controller.signal
        );

        setSuggestions(results);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen]);

  const selectedPosition = useMemo(
    () => [latitude, longitude],
    [latitude, longitude]
  );

  async function selectCoordinates(
    nextLatitude,
    nextLongitude,
    feature = null
  ) {
    setLatitude(Number(nextLatitude));
    setLongitude(Number(nextLongitude));
    setHasSelection(true);
    setError("");
    setSuggestions([]);

    let selectedFeature = feature;

    if (!selectedFeature) {
      try {
        selectedFeature = await reverseLocation(
          nextLatitude,
          nextLongitude
        );
      } catch {
        selectedFeature = null;
      }
    }

    const properties = selectedFeature?.properties || {};
    const locationText = getLocationText(properties);

    const nextAddress =
      locationText ||
      `${Number(nextLatitude).toFixed(6)}, ${Number(
        nextLongitude
      ).toFixed(6)}`;

    setAddress(nextAddress);
    setQuery(nextAddress);
    setCity(getCity(properties) || city || "Pune");
    setState(properties.state || state || "Maharashtra");
  }

  function selectSuggestion(feature) {
    const coordinates = feature?.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return;
    }

    const [nextLongitude, nextLatitude] = coordinates;

    selectCoordinates(
      Number(nextLatitude),
      Number(nextLongitude),
      feature
    );
  }

  async function handleSearch(event) {
    event?.preventDefault();
    event?.stopPropagation();

    const searchText = query.trim();

    if (searchText.length < 3) {
      setError("Enter at least 3 characters to search.");
      return;
    }

    try {
      setLocationLoading(true);
      setError("");

      const results = await searchLocations(
        `${searchText}, India`
      );

      if (!results.length) {
        setError(
          "Location not found. Try adding the city or area name."
        );
        return;
      }

      selectSuggestion(results[0]);
    } catch {
      setError(
        "Could not search this location. Please try again."
      );
    } finally {
      setLocationLoading(false);
    }
  }

  function handleCurrentLocation(event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!navigator.geolocation) {
      setError(
        "Current location is not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await selectCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (locationError) => {
        setLocationLoading(false);

        if (locationError.code === 1) {
          setError(
            "Location permission is blocked. Allow location access for localhost in Safari."
          );
          return;
        }

        if (locationError.code === 2) {
          setError(
            "Your current location could not be detected."
          );
          return;
        }

        setError(
          "Location request timed out. Try again or use map search."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function handleConfirm(event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!hasSelection) {
      setError(
        "Search or click on the map to select a location."
      );
      return;
    }

    const selectedLocation = {
      address,
      city,
      state,
      latitude: Number(latitude.toFixed(8)),
      longitude: Number(longitude.toFixed(8)),
      lat: Number(latitude.toFixed(8)),
      lng: Number(longitude.toFixed(8)),
    };

    const callbacks = [
      props.onConfirm,
      props.onSelect,
      props.onLocationSelect,
      props.onLocationSelected,
      props.onSelectLocation,
      props.onLocationChange,
      props.onSave,
    ].filter((callback) => typeof callback === "function");

    [...new Set(callbacks)].forEach((callback) => {
      if (callback.length >= 2) {
        callback(
          selectedLocation.latitude,
          selectedLocation.longitude,
          selectedLocation
        );
      } else {
        callback(selectedLocation);
      }
    });

    if (typeof props.onClose === "function") {
      props.onClose();
    }
  }

  function handleClose(event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (typeof props.onClose === "function") {
      props.onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
      <div className="max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Exact Property Location
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Select location on the map
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    handleSearch(event);
                  }
                }}
                placeholder="Search project, locality, road or landmark"
                autoComplete="off"
                className="h-14 w-full rounded-2xl border border-slate-300 px-5 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              {(suggestionsLoading ||
                suggestions.length > 0) && (
                <div className="absolute left-0 right-0 top-[62px] z-[2000] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  {suggestionsLoading ? (
                    <p className="px-5 py-4 text-sm font-semibold text-slate-500">
                      Searching locations...
                    </p>
                  ) : (
                    suggestions.map((feature, index) => {
                      const properties =
                        feature.properties || {};

                      const label =
                        getLocationText(properties) ||
                        "Selected location";

                      return (
                        <button
                          key={`${label}-${index}`}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            selectSuggestion(feature);
                          }}
                          className="block w-full border-b border-slate-100 px-5 py-4 text-left last:border-b-0 hover:bg-blue-50"
                        >
                          <p className="font-bold text-slate-900">
                            {properties.name ||
                              properties.city ||
                              properties.locality ||
                              "Location"}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {label}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={locationLoading}
              className="h-14 rounded-2xl bg-blue-600 px-7 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {locationLoading
                ? "Searching..."
                : "Search Location"}
            </button>

            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={locationLoading}
              className="h-14 rounded-2xl border border-blue-200 bg-blue-50 px-7 font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
            >
              Use Current Location
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-2xl bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="relative z-0 mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <MapContainer
              center={selectedPosition}
              zoom={hasSelection ? 16 : 12}
              scrollWheelZoom
              style={{
                height: "440px",
                width: "100%",
              }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <RecenterMap
                latitude={latitude}
                longitude={longitude}
              />

              <MapClickHandler
                onSelect={selectCoordinates}
              />

              <Marker
                position={selectedPosition}
                icon={markerIcon}
              />
            </MapContainer>
          </div>

          <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                Selected Location
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {hasSelection
                  ? address ||
                    `${latitude.toFixed(
                      6
                    )}, ${longitude.toFixed(6)}`
                  : "Search a location or click anywhere on the map."}
              </p>

              {hasSelection && (
                <p className="mt-1 text-sm text-slate-500">
                  Latitude: {latitude.toFixed(8)} · Longitude:{" "}
                  {longitude.toFixed(8)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasSelection}
              className="rounded-2xl bg-emerald-600 px-7 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm This Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
