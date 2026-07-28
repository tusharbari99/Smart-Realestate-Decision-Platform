const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");

const folders = [
  "controllers",
  "routes",
  "middleware",
  "config",
  "utils",
];

const files = [
  path.join(projectRoot, "server.js"),
];

function collectJavaScriptFiles(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return [];
  }

  return fs.readdirSync(folderPath, {
    withFileTypes: true,
  }).flatMap((entry) => {
    const fullPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      return collectJavaScriptFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".js")
      ? [fullPath]
      : [];
  });
}

for (const folder of folders) {
  files.push(
    ...collectJavaScriptFiles(
      path.join(projectRoot, folder),
    ),
  );
}

let failed = false;

for (const file of files) {
  const result = spawnSync(
    process.execPath,
    ["--check", file],
    {
      encoding: "utf8",
    },
  );

  const relativePath = path.relative(projectRoot, file);

  if (result.status === 0) {
    console.log(`✓ ${relativePath}`);
  } else {
    failed = true;
    console.error(`✗ ${relativePath}`);
    console.error(result.stderr || result.stdout);
  }
}

if (failed) {
  console.error("\nBackend check failed.");
  process.exit(1);
}

console.log(
  `\nBackend check successful. ${files.length} files checked.`,
);
