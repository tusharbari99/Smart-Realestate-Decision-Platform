import api from "./api";

const validActions = new Set([
  "visit",
  "view",
  "details",
  "save",
  "compare",
  "site_visit",
  "price_talk",
  "interest",
]);

function getPropertyId(property) {
  return (
    property?.property_id ||
    property?.id ||
    null
  );
}

function getPropertyPrice(property) {
  return Number(
    property?.price ||
      property?.display_price ||
      property?.seller_price ||
      0,
  ) || null;
}

export async function trackBuyerActivity(
  actionType,
  property,
) {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null",
    );

    if (
      !user ||
      String(user.role || "").toLowerCase() !== "buyer"
    ) {
      return;
    }

    if (!validActions.has(actionType)) {
      return;
    }

    await api.post("/personalization/activity", {
      action_type: actionType,
      session_key:
        property?.session_key ||
        sessionStorage.getItem(
          "smartestate_buyer_session_key",
        ) ||
        null,
      property_id: getPropertyId(property),
      property_type:
        property?.property_type ||
        property?.type ||
        null,
      property_price: getPropertyPrice(property),
      city: property?.city || null,
      locality:
        property?.locality ||
        property?.location ||
        null,
      bedrooms:
        property?.bedrooms ||
        property?.bhk ||
        null,
    });
  } catch (error) {
    console.warn(
      "Buyer activity could not be recorded:",
      error.response?.data?.message || error.message,
    );
  }
}

export async function getBuyerPreferences() {
  const response = await api.get(
    "/personalization/preferences",
  );

  return response.data?.preferences || null;
}

export async function updateBuyerAlertSettings(
  settings,
) {
  const response = await api.patch(
    "/personalization/alert-settings",
    settings,
  );

  return response.data;
}
