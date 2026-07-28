const fs = require("fs");
const { spawnSync } = require("child_process");

const requiredFiles = [
  "src/main.jsx",
  "src/App.jsx",
  "src/services/api.js",
  "src/components/Navbar.jsx",
  "src/components/Footer.jsx",
  "index.html",
];

let missingFiles = false;

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file}`);
  } else {
    missingFiles = true;
    console.error(`✗ Missing: ${file}`);
  }
}

if (missingFiles) {
  console.error("\nRequired frontend files are missing.");
  process.exit(1);
}

console.log("\nRunning production build...\n");

const build = spawnSync(
  "npm",
  ["run", "build"],
  {
    stdio: "inherit",
    shell: true,
  },
);

if (build.status !== 0) {
  console.error("\nFrontend check failed.");
  process.exit(build.status || 1);
}

console.log("\nFrontend check successful.");
