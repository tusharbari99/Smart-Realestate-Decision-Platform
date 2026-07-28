import {
  LoaderCircle,
  MapPin,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

function CityAutocomplete({
  value,
  onChange,
  onSelect,
}) {
  const wrapperRef = useRef(null);

  const [suggestions, setSuggestions] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    function closeDropdown(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      closeDropdown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeDropdown,
      );
    };
  }, []);

  useEffect(() => {
    const query = String(value || "").trim();

    if (query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        try {
          setLoading(true);
          setError("");

          const parameters =
            new URLSearchParams({
              q: query,
              limit: "7",
              lang: "en",
              lat: "18.5204",
              lon: "73.8567",
            });

          const response = await fetch(
            `https://photon.komoot.io/api/?${parameters}`,
            {
              signal: controller.signal,

              headers: {
                Accept: "application/json",
              },
            },
          );

          if (!response.ok) {
            throw new Error(
              "Location search failed.",
            );
          }

          const data =
            await response.json();

          const normalized = (
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
                properties.street,
                properties.district,
                properties.city,
                properties.county,
                properties.state,
                properties.country,
              ]
                .filter(Boolean)
                .map((item) =>
                  String(item).trim(),
                )
                .filter(
                  (item, index, items) =>
                    items.indexOf(item) ===
                    index,
                )
                .join(", ");

              return {
                id:
                  properties.osm_id ||
                  `${coordinates[1]}-${coordinates[0]}`,

                name:
                  properties.name ||
                  properties.district ||
                  properties.city ||
                  "Location",

                city:
                  properties.city ||
                  properties.district ||
                  properties.county ||
                  properties.name ||
                  "",

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
              (location) =>
                location.label &&
                Number.isFinite(
                  location.latitude,
                ) &&
                Number.isFinite(
                  location.longitude,
                ),
            );

          const unique = [];

          for (const item of normalized) {
            const alreadyExists =
              unique.some(
                (existing) =>
                  existing.label.toLowerCase() ===
                  item.label.toLowerCase(),
              );

            if (!alreadyExists) {
              unique.push(item);
            }
          }

          setSuggestions(unique);
          setOpen(true);
        } catch (requestError) {
          if (
            requestError.name !==
            "AbortError"
          ) {
            console.error(
              "City suggestions error:",
              requestError,
            );

            setSuggestions([]);

            setError(
              "Could not load location suggestions.",
            );

            setOpen(true);
          }
        } finally {
          setLoading(false);
        }
      },
      450,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  function chooseLocation(location) {
    const selectedValue =
      location.name ||
      location.city ||
      location.label;

    onChange(selectedValue);
    onSelect?.(location);

    setSuggestions([]);
    setOpen(false);
    setError("");
  }

  return (
    <div
      ref={wrapperRef}
      className="relative z-[1300]"
    >
      <div className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
        <MapPin
          size={18}
          className="shrink-0 text-blue-600"
        />

        <input
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (
              suggestions.length ||
              error
            ) {
              setOpen(true);
            }
          }}
          placeholder="Search city or locality"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />

        {loading && (
          <LoaderCircle
            size={17}
            className="animate-spin text-blue-600"
          />
        )}

        {!loading && value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onSelect?.(null);
              setSuggestions([]);
              setOpen(false);
              setError("");
            }}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Clear location"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open &&
        (suggestions.length > 0 ||
          error) && (
          <div className="absolute left-0 right-0 top-[calc(100%+7px)] z-[3000] max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
            {error && (
              <p className="p-4 text-sm font-bold text-red-600">
                {error}
              </p>
            )}

            {suggestions.map(
              (location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() =>
                    chooseLocation(location)
                  }
                  className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-blue-50"
                >
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <span>
                    <span className="block text-sm font-black text-slate-800">
                      {location.name}
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {location.label}
                    </span>
                  </span>
                </button>
              ),
            )}
          </div>
        )}
    </div>
  );
}

export default CityAutocomplete;
