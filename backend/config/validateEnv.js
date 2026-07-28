const requiredVariables = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "JWT_SECRET",
  "FRONTEND_URL",
];

function validateEnvironment() {
  const missing = requiredVariables.filter(
    (key) =>
      !String(process.env[key] || "").trim(),
  );

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ", ",
      )}`,
    );
  }

  if (
    String(process.env.JWT_SECRET).length < 32
  ) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters.",
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    String(process.env.FRONTEND_URL).includes(
      "localhost",
    )
  ) {
    throw new Error(
      "FRONTEND_URL cannot use localhost in production.",
    );
  }
}

module.exports = {
  validateEnvironment,
};
