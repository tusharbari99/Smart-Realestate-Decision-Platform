require("dotenv").config();

const db = require("../config/db");

const {
  runEmailNotificationWorker,
} = require(
  "../services/emailNotificationWorker"
);

async function run() {
  try {
    const result =
      await runEmailNotificationWorker();

    console.log(
      `Email alerts sent: ${result.sent}`,
    );

    console.log(
      `Email alerts failed: ${result.failed}`,
    );
  } catch (error) {
    console.error(
      "Notification worker failed:",
      error,
    );

    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

run();
