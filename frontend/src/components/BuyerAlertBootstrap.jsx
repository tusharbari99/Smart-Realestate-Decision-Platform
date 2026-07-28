import { useEffect } from "react";
import { useLocation } from "react-router";

import api from "../services/api";

function getBuyer() {
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

function BuyerAlertBootstrap() {
  const location = useLocation();

  useEffect(() => {
    const buyer = getBuyer();

    if (!buyer) return;

    const userId =
      buyer.user_id ||
      buyer.userId ||
      buyer.id ||
      "buyer";

    const scanKey =
      `smartestate_match_scan_${userId}`;

    /*
     * Scan only once during the current browser session.
     */
    if (sessionStorage.getItem(scanKey)) {
      return;
    }

    let cancelled = false;

    async function scanAndRefreshAlerts() {
      try {
        await api.post(
          "/personalization/notifications/scan",
        );

        const response = await api.get(
          "/personalization/notifications",
        );

        if (cancelled) return;

        const unreadCount = Number(
          response.data?.unread_count || 0,
        );

        sessionStorage.setItem(scanKey, "true");

        window.dispatchEvent(
          new CustomEvent(
            "smartestate-alert-count-updated",
            {
              detail: {
                unreadCount,
              },
            },
          ),
        );
      } catch (error) {
        console.warn(
          "Automatic property alert scan skipped:",
          error.response?.data?.message ||
            error.message,
        );
      }
    }

    const timer = window.setTimeout(
      scanAndRefreshAlerts,
      1200,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  return null;
}

export default BuyerAlertBootstrap;
