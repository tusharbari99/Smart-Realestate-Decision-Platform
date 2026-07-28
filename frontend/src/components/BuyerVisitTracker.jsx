import { useEffect } from "react";

import {
  trackBuyerActivity,
} from "../services/personalization";

function getBuyer() {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null",
    );

    if (
      !user ||
      String(user.role || "").toLowerCase() !==
        "buyer"
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

function createSessionKey() {
  return [
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

function BuyerVisitTracker() {
  useEffect(() => {
    const buyer = getBuyer();

    if (!buyer) return;

    let sessionKey = sessionStorage.getItem(
      "smartestate_buyer_session_key",
    );

    if (!sessionKey) {
      sessionKey = createSessionKey();

      sessionStorage.setItem(
        "smartestate_buyer_session_key",
        sessionKey,
      );
    }

    const trackedKey =
      `smartestate_visit_tracked_${sessionKey}`;

    if (sessionStorage.getItem(trackedKey)) {
      return;
    }

    sessionStorage.setItem(
      trackedKey,
      "true",
    );

    trackBuyerActivity("visit", {
      property_id: null,
      session_key: sessionKey,
    });
  }, []);

  return null;
}

export default BuyerVisitTracker;
