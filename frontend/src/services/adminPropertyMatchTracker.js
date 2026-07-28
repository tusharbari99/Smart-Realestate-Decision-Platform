function getAdminAuth() {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null",
    );

    const token =
      localStorage.getItem("token");

    if (
      !user ||
      !token ||
      String(user.role || "").toLowerCase() !==
        "admin"
    ) {
      return null;
    }

    return {
      user,
      token,
    };
  } catch {
    return null;
  }
}

function cleanUrl(config) {
  return String(config?.url || "")
    .split("?")[0]
    .replace(/\/+$/, "");
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

function getVerifiedPropertyId(
  response,
) {
  const url = cleanUrl(
    response.config,
  );

  const requestData = parseRequestData(
    response.config?.data,
  );

  const responseData =
    response.data?.property ||
    response.data?.data?.property ||
    response.data?.data ||
    response.data ||
    {};

  const verifyUrlMatch = url.match(
    /\/properties\/(\d+)\/verify$/i,
  );

  if (verifyUrlMatch) {
    return Number(
      verifyUrlMatch[1],
    );
  }

  const propertyUrlMatch = url.match(
    /\/properties\/(\d+)$/i,
  );

  const status = String(
    requestData.status ||
      responseData.status ||
      "",
  ).toLowerCase();

  if (
    propertyUrlMatch &&
    status === "verified"
  ) {
    return Number(
      propertyUrlMatch[1],
    );
  }

  return Number(
    responseData.property_id ||
      responseData.id ||
      requestData.property_id ||
      0,
  ) || null;
}

async function createBuyerMatches(
  propertyId,
  token,
) {
  if (!propertyId) return;

  const key =
    `smartestate_admin_match_scan_${propertyId}`;

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
      `${apiBase}/personalization/admin/property/${propertyId}/create-matches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      sessionStorage.removeItem(key);
      return;
    }

    const result = await response.json();

    window.dispatchEvent(
      new CustomEvent(
        "smartestate-admin-match-created",
        {
          detail: result,
        },
      ),
    );
  } catch {
    sessionStorage.removeItem(key);
  }
}

export function installAdminPropertyMatchTracker(
  api,
) {
  if (
    api.__adminPropertyMatchTrackerInstalled
  ) {
    return;
  }

  api.__adminPropertyMatchTrackerInstalled =
    true;

  api.interceptors.response.use(
    (response) => {
      const admin = getAdminAuth();

      if (!admin) {
        return response;
      }

      const method = String(
        response.config?.method || "get",
      ).toLowerCase();

      const url = cleanUrl(
        response.config,
      );

      const isPropertyAdminRequest =
        url.includes("/admin") &&
        url.includes("/properties");

      const isPossibleVerification =
        method === "patch" ||
        method === "put" ||
        method === "post";

      if (
        isPropertyAdminRequest &&
        isPossibleVerification
      ) {
        const propertyId =
          getVerifiedPropertyId(response);

        if (propertyId) {
          createBuyerMatches(
            propertyId,
            admin.token,
          );
        }
      }

      return response;
    },
    (error) => Promise.reject(error),
  );
}
