const cron = require("node-cron");

const {
  runBehaviorMarketingWorker,
} = require("./behaviorMarketingWorker");


const {
  runEmailNotificationWorker,
} = require("./emailNotificationWorker");

let schedulerStarted = false;

function startNotificationScheduler() {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;

  /*
   * Run once shortly after server starts.
   */
  setTimeout(() => {
    Promise.all([
      runEmailNotificationWorker(),
      runBehaviorMarketingWorker(),
    ]).catch((error) => {
      console.error(
        "[Notification Scheduler] Initial run failed:",
        error.message,
      );
    });
  }, 5000);

  /*
   * Run every 5 minutes.
   */
  cron.schedule("*/5 * * * *", () => {
    Promise.all([
      runEmailNotificationWorker(),
      runBehaviorMarketingWorker(),
    ]).catch((error) => {
      console.error(
        "[Notification Scheduler] Scheduled run failed:",
        error.message,
      );
    });
  });

  console.log(
    "Notification scheduler started: every 5 minutes.",
  );
}

module.exports = {
  startNotificationScheduler,
};
