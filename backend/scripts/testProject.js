const http = require("http");

const tests = [
  {
    name: "Backend health",
    url: "http://localhost:5001/api/health",
    expectedStatus: 200,
  },
  {
    name: "Public properties API",
    url: "http://localhost:5001/api/properties",
    expectedStatus: 200,
  },
  {
    name: "Admin route security",
    url: "http://localhost:5001/api/admin/dashboard",
    expectedStatus: 401,
  },
  {
    name: "Frontend website",
    url: "http://localhost:5173",
    expectedStatus: 200,
  },
];

function runRequest(test) {
  return new Promise((resolve) => {
    const request = http.get(test.url, (response) => {
      let body = "";

      response.on("data", (chunk) => {
        body += chunk;
      });

      response.on("end", () => {
        const passed =
          response.statusCode === test.expectedStatus;

        resolve({
          ...test,
          passed,
          actualStatus: response.statusCode,
          body: body.slice(0, 150),
        });
      });
    });

    request.setTimeout(5000, () => {
      request.destroy(
        new Error("Request timeout"),
      );
    });

    request.on("error", (error) => {
      resolve({
        ...test,
        passed: false,
        actualStatus: null,
        error: error.message,
      });
    });
  });
}

async function main() {
  console.log("\nSmartEstate Project Test");
  console.log("------------------------");

  const results = [];

  for (const test of tests) {
    const result = await runRequest(test);
    results.push(result);

    if (result.passed) {
      console.log(
        `✓ ${result.name} (${result.actualStatus})`,
      );
    } else {
      console.log(
        `✗ ${result.name} (expected ${result.expectedStatus}, received ${
          result.actualStatus || result.error
        })`,
      );
    }
  }

  const passedCount = results.filter(
    (result) => result.passed,
  ).length;

  console.log(
    `\nResult: ${passedCount}/${results.length} tests passed.`,
  );

  if (passedCount !== results.length) {
    console.log(
      "\nRun this command to check server logs:",
    );
    console.log("npm run project:logs");
    process.exit(1);
  }

  console.log(
    "\nSmartEstate frontend, backend, APIs, and security are working.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
