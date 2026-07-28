const PHONE_KEYS = new Set([
  "phone",
  "mobile",
  "phonenumber",
  "mobilenumber",
  "contactnumber",
  "contactno",
  "contactphone",
  "buyerphone",
  "sellerphone",
]);

function normalizedKey(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function validatePhoneValues(value, path = "request") {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const error = validatePhoneValues(value[index], `${path}[${index}]`);

      if (error) return error;
    }

    return null;
  }

  for (const [key, currentValue] of Object.entries(value)) {
    const currentPath = `${path}.${key}`;
    const keyName = normalizedKey(key);

    if (PHONE_KEYS.has(keyName)) {
      if (
        currentValue === null ||
        currentValue === undefined ||
        currentValue === ""
      ) {
        continue;
      }

      const phone = String(currentValue).trim();

      if (!/^\d{10}$/.test(phone)) {
        return {
          field: key,
          path: currentPath,
          message: "Mobile number must contain exactly 10 digits.",
        };
      }

      value[key] = phone;
      continue;
    }

    if (currentValue && typeof currentValue === "object") {
      const error = validatePhoneValues(currentValue, currentPath);

      if (error) return error;
    }
  }

  return null;
}

function phoneValidationMiddleware(req, res, next) {
  const bodyError = validatePhoneValues(req.body, "body");

  if (bodyError) {
    return res.status(400).json({
      message: bodyError.message,
      field: bodyError.field,
    });
  }

  next();
}

module.exports = phoneValidationMiddleware;
