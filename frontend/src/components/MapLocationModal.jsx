import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Crosshair,
  LoaderCircle,
  MapPin,
  Search,
  X,
} from "lucide-react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_LOCATION = {
  latitude: 18.5204,
  longitude: 73.8567,
};

function MapLocationModal({
  open,
  onClose,
  onConfirm,
}) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [selected, setSelected] = useState(
    DEFAULT_LOCATION,
  );

  const [searchText, setSearchText] =
    useState("");

  const [suggestions, setSuggestions] =
    useState([]);

  const [searching, setSearching] =
    useState(false);

  const [loadingLocation, setLoadingLocation] =
    useState(false);

  const [error, setError] = useState("");

  function moveMarker(location, zoom = 15) {
    setSelected(location);

    markerRef.current?.setLatLng([
      location.latitude,
      location.longitude,
    ]);

    mapInstanceRef.current?.flyTo(
      [
        location.latitude,
        location.longitude,
      ],
      zoom,
      {
        duration: 0.8,
      },
    );
  }

  useEffect(() => {
    if (!open || !mapElementRef.current) {
      return;
    }

    const map = L.map(
      mapElementRef.current,
    ).setView(
      [
        selected.latitude,
        selected.longitude,
      ],
      13,
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          "&copy; OpenStreetMap contributors",
      },
    ).addTo(map);

    const marker = L.marker([
      selected.latitude,
      selected.longitude,
    ]).addTo(map);

    map.on("click", (event) => {
      const nextLocation = {
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      };

      setSelected(nextLocation);

      marker.setLatLng([
        nextLocation.latitude,
        nextLocation.longitude,
      ]);

      setError("");
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    const query = searchText.trim();

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        try {
          setSearching(true);
          setError("");

          const params =
            new URLSearchParams({
              q: query,
              limit: "6",
              lang: "en",
              lat: "18.5204",
              lon: "73.8567",
            });

          const response = await fetch(
            `https://photon.komoot.io/api/?${params}`,
            {
              signal: controller.signal,
            },
          );

          if (!response.ok) {
            throw new Error(
              "Location search failed.",
            );
          }

          const data =
            await response.json();

          const results = (
            data.features || []
          )
            .map((feature) => {
              const properties =
                feature.properties || {};

              const coordinates =
                feature.geometry
                  ?.coordinates || [];

              const label = [
                properties.name,
                properties.district,
                properties.city,
                properties.county,
                properties.state,
                properties.country,
              ]
                .filter(Boolean)
                .filter(
                  (value, index, array) =>
                    array.indexOf(value) ===
                    index,
                )
                .join(", ");

              return {
                id:
                  properties.osm_id ||
                  `${coordinates[1]}-${coordinates[0]}`,

                name:
                  properties.name ||
                  properties.city ||
                  "Location",

                label,

                latitude: Number(
                  coordinates[1],
                ),

                longitude: Number(
                  coordinates[0],
                ),
              };
            })
            .filter(
              (item) =>
                Number.isFinite(
                  item.latitude,
                ) &&
                Number.isFinite(
                  item.longitude,
                ),
            );

          setSuggestions(results);
        } catch (requestError) {
          if (
            requestError.name !==
            "AbortError"
          ) {
            setError(
              "Could not search locations. Please try again.",
            );
          }
        } finally {
          setSearching(false);
        }
      },
      450,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchText]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "Current location is not supported. Search your area manually.",
      );
      return;
    }

    setLoadingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        moveMarker(
          {
            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,
          },
          17,
        );

        setLoadingLocation(false);
      },

      (locationError) => {
        setLoadingLocation(false);

        if (
          locationError.code ===
          locationError.PERMISSION_DENIED
        ) {
          setError(
            "Location permission is blocked. Allow localhost in Safari Settings → Websites → Location.",
          );
        } else {
          setError(
            'Exact location is unavailable on this Mac. Search "Narhe, Pune" or click your location on the map.',
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-xs font-black uppercase text-blue-600">
              Location Map
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-900">
              Select a Location
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2"
            aria-label="Close map"
          >
            <X size={20} />
          </button>
        </header>

        <div className="relative">
          <div className="absolute left-4 right-4 top-4 z-[1000] sm:right-auto sm:w-[390px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value,
                  )
                }
                placeholder="Search Narhe, Pune"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm font-semibold shadow-xl outline-none"
              />

              {searching && (
                <LoaderCircle
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-600"
                />
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-xl bg-white shadow-2xl">
                {suggestions.map(
                  (location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => {
                        moveMarker(
                          location,
                          16,
                        );

                        setSearchText(
                          location.label,
                        );

                        setSuggestions([]);
                        setError("");
                      }}
                      className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-blue-50"
                    >
                      <MapPin
                        size={17}
                        className="mt-0.5 shrink-0 text-blue-600"
                      />

                      <span>
                        <span className="block text-sm font-black text-slate-800">
                          {location.name}
                        </span>

                        <span className="mt-1 block text-xs text-slate-500">
                          {location.label}
                        </span>
                      </span>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={loadingLocation}
            className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black shadow-xl disabled:opacity-60 sm:bottom-auto sm:top-4"
          >
            {loadingLocation ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Crosshair size={17} />
            )}

            {loadingLocation
              ? "Finding..."
              : "Use My Location"}
          </button>

          <div
            ref={mapElementRef}
            className="h-[55vh] min-h-[430px] w-full"
          />
        </div>

        <footer className="space-y-4 border-t border-slate-200 p-5">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <MapPin
              size={19}
              className="text-blue-600"
            />

            <p className="text-sm font-bold text-slate-700">
              {selected.latitude.toFixed(5)},{" "}
              {selected.longitude.toFixed(5)}
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                onConfirm(selected)
              }
              className="rounded-xl bg-[#0b84e5] px-6 py-3 text-sm font-black text-white"
            >
              Use This Location
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MapLocationModal;
