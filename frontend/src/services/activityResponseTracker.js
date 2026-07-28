function getBuyerAndToken() {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null",
    );

    const token = localStorage.getItem("token");

    if (
      !user ||
      !token ||
      String(user.role || "").toLowerCase() !== "buyer"
    ) {
      return null;
    }

    return { user, token };
  } catch {
    return null;
  }
}

function parseRequestData(data) {
  if (!data) return {};

  if (typeof data === "object") {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function getUrl(config) {
  return String(config?.url || "")
    .split("?")[0]
    .replace(/\/+$/, "");
}

function getPropertyId(value) {
  return Number(
    value?.property_id ||
      value?.id ||
      0,
  ) || null;
}

function getPropertyList(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.properties)) {
    return data.properties;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.properties)) {
    return data.data.properties;
  }

  return [];
}

async function sendActivity(
  actionType,
  propertyId,
  token,
) {
  if (!propertyId) return;

  const key =
    `smartestate_${actionType}_${propertyId}`;

  /*
   * Save, compare and inquiry buttons can sometimes
   * trigger more than once during the same page session.
   */
  if (sessionStorage.getItem(key)) {
    return;
  }

  sessionStorage.setItem(
    key,
    new Date().toISOString(),
  );

  try {
    const apiBase =
      import.meta.env.VITE_API_URL ||
      "http://localhost:5001/api";

    const response = await fetch(
      `${apiBase}/personalization/activity`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action_type: actionType,
          property_id: propertyId,
        }),
      },
    );

    if (!response.ok) {
      sessionStorage.removeItem(key);
    }
  } catch {
    sessionStorage.removeItem(key);
  }
}

function detectInquiryAction(data) {
  const requestType = String(
    data.request_type ||
    data.type ||
    "",
  ).toLowerCase();

  const message = String(
    data.message || "",
  ).toLowerCase();

  const combined = `${requestType} ${message}`;

  if (
    combined.includes("site visit") ||
    combined.includes("visit")
  ) {
    return "site_visit";
  }

  if (
    combined.includes("price talk") ||
    combined.includes("price") ||
    combined.includes("negotiation")
  ) {
    return "price_talk";
  }

  return "interest";
}

export function installActivityResponseTracker(api) {
  if (api.__smartActivityTrackerInstalled) {
    return;
  }

  api.__smartActivityTrackerInstalled = true;

  api.interceptors.response.use(
    (response) => {
      const auth = getBuyerAndToken();

      if (!auth) {
        return response;
      }

      const method = String(
        response.config?.method || "get",
      ).toLowerCase();

      const url = getUrl(response.config);
      const requestData = parseRequestData(
        response.config?.data,
      );

      /*
       * Saved property tracking
       */
      if (
        method === "post" &&
        (
          url === "/favorites" ||
          url.endsWith("/favorites")
        )
      ) {
        const propertyId = getPropertyId(
          requestData,
        );

        sendActivity(
          "save",
          propertyId,
          auth.token,
        );
      }

      /*
       * Compare properties tracking
       */
      if (
        method === "get" &&
        url.includes("/properties/compare")
      ) {
        const properties = getPropertyList(
          response.data,
        );

        properties.forEach((property) => {
          sendActivity(
            "compare",
            getPropertyId(property),
            auth.token,
          );
        });
      }

      /*
       * Site Visit, Price Talk and Interest tracking
       */
      if (
        method === "post" &&
        (
          url === "/inquiries" ||
          url.endsWith("/inquiries")
        )
      ) {
        const propertyId = getPropertyId(
          requestData,
        );

        const actionType =
          detectInquiryAction(requestData);

        sendActivity(
          actionType,
          propertyId,
          auth.token,
        );
      }

      return response;
    },
    (error) => Promise.reject(error),
  );
}
