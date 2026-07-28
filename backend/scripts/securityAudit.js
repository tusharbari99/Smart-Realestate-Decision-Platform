const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function result(passed, message) {
  console.log(
    `${passed ? "✅" : "❌"} ${message}`,
  );

  return passed;
}

let passed = true;

console.log(
  "\nSMART ESTATE SECURITY AUDIT\n",
);

const root = path.resolve(__dirname, "..");

const gitignorePath =
  path.join(root, ".gitignore");

const gitignore = fs.existsSync(
  gitignorePath,
)
  ? fs.readFileSync(
      gitignorePath,
      "utf8",
    )
  : "";

passed =
  result(
    gitignore
      .split(/\r?\n/)
      .includes(".env"),

    ".env is ignored by Git",
  ) && passed;

const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  const permissions =
    fs.statSync(envPath).mode & 0o777;

  passed =
    result(
      permissions === 0o600,

      permissions === 0o600
        ? ".env permissions are private"
        : `.env permissions are ${permissions.toString(
            8,
          )}; expected 600`,
    ) && passed;
}

const securityMiddlewarePath =
  path.join(
    root,
    "middleware",
    "securityMiddleware.js",
  );

passed =
  result(
    fs.existsSync(securityMiddlewarePath),
    "Security middleware exists",
  ) && passed;

const serverText = fs.readFileSync(
  path.join(root, "server.js"),
  "utf8",
);

passed =
  result(
    serverText.includes(
      'app.disable("x-powered-by")',
    ),
    "Express technology header is disabled",
  ) && passed;

passed =
  result(
    serverText.includes(
      "helmetMiddleware",
    ),
    "Helmet middleware is connected",
  ) && passed;

passed =
  result(
    serverText.includes(
      "authLimiter",
    ),
    "Authentication rate limiter is connected",
  ) && passed;

try {
  const trackedEnv = execSync(
    "git ls-files .env",
    {
      cwd: root,
      encoding: "utf8",
      stdio: [
        "ignore",
        "pipe",
        "ignore",
      ],
    },
  ).trim();

  passed =
    result(
      !trackedEnv,
      trackedEnv
        ? ".env is still tracked by Git"
        : ".env is not tracked by Git",
    ) && passed;
} catch {
  console.log(
    "ℹ️ Git tracking check was skipped.",
  );
}

console.log("\n--- FINAL RESULT ---");

if (passed) {
  console.log(
    "✅ Basic backend security audit passed.",
  );
} else {
  console.log(
    "❌ Security audit found problems.",
  );

  process.exitCode = 1;
}
