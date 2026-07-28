import { useEffect } from "react";
import { useLocation } from "react-router";

import api from "../services/api";
import {
  trackBuyerActivity,
} from "../services/personalization";

function getLoggedInBuyer() {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null",
    );

    if (
      !user ||
      String(user.role || "").toLowerCase() !== "buyer"
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

function getPropertyFromResponse(data) {
  return (
    data?.property ||
    data?.data?.property ||
    data?.data ||
    data ||
    null
  );
}

function PersonalizationTracker() {
  const location = useLocation();

  useEffect(() => {
    async function trackPropertyDetails() {
      const buyer = getLoggedInBuyer();

      if (!buyer) return;

      const match = location.pathname.match(
        /^\/properties\/(\d+)$/,
      );

      if (!match) return;

      const propertyId = Number(match[1]);

      if (!propertyId) return;

      const sessionKey =
        `smartestate_tracked_property_${propertyId}`;

      if (sessionStorage.getItem(sessionKey)) {
        return;
      }

      try {
        const response = await api.get(
          `/properties/${propertyId}`,
        );

        const property = getPropertyFromResponse(
          response.data,
        );

        if (!property) return;

        await trackBuyerActivity(
          "details",
          property,
        );

        sessionStorage.setItem(
          sessionKey,
          new Date().toISOString(),
        );
      } catch (error) {
        console.warn(
          "Property activity tracking skipped:",
          error.response?.data?.message ||
            error.message,
        );
      }
    }

    trackPropertyDetails();
  }, [location.pathname]);

  return null;
}

export default PersonalizationTracker;
