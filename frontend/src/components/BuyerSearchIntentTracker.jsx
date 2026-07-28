import { useEffect } from "react";
import { useLocation } from "react-router";

import {
  trackBuyerActivity,
} from "../services/personalization";

function getValue(params, names) {
  for (const name of names) {
    const value = params.get(name);

    if (value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function BuyerSearchIntentTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/properties") {
      return;
    }

    const params = new URLSearchParams(
      location.search,
    );

    if ([...params.keys()].length === 0) {
      return;
    }

    const propertyType = getValue(params, [
      "property_type",
      "propertyType",
      "type",
      "category",
    ]);

    const city = getValue(params, [
      "city",
      "district",
    ]);

    const locality = getValue(params, [
      "locality",
      "location",
      "area",
    ]);

    const bedrooms = getValue(params, [
      "bedrooms",
      "bhk",
    ]);

    const minimumPrice = Number(
      getValue(params, [
        "minimum_price",
        "minimumPrice",
        "min_price",
        "minPrice",
      ]) || 0,
    );

    const maximumPrice = Number(
      getValue(params, [
        "maximum_price",
        "maximumPrice",
        "max_price",
        "maxPrice",
      ]) || 0,
    );

    let preferredPrice = null;

    if (minimumPrice && maximumPrice) {
      preferredPrice =
        (minimumPrice + maximumPrice) / 2;
    } else {
      preferredPrice =
        minimumPrice || maximumPrice || null;
    }

    const hasUsefulPreference =
      propertyType ||
      city ||
      locality ||
      bedrooms ||
      preferredPrice;

    if (!hasUsefulPreference) {
      return;
    }

    const normalizedSearch = [
      propertyType,
      city,
      locality,
      bedrooms,
      minimumPrice,
      maximumPrice,
    ].join("|");

    const sessionKey =
      `smartestate_search_intent_${normalizedSearch}`;

    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    sessionStorage.setItem(
      sessionKey,
      new Date().toISOString(),
    );

    trackBuyerActivity("search", {
      property_id: null,
      property_type: propertyType,
      price: preferredPrice,
      city,
      locality,
      bedrooms,
    });
  }, [location.pathname, location.search]);

  return null;
}

export default BuyerSearchIntentTracker;
