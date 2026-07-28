const nodemailer = require("nodemailer");
const db = require("../config/db");

async function isEmailAutomationEnabled() {
  try {
    const [rows] = await db.query(
      `
        SELECT setting_value
        FROM system_settings
        WHERE setting_key =
          'email_automation_enabled'
        LIMIT 1
      `,
    );

    return (
      String(
        rows[0]?.setting_value ?? "1",
      ) === "1"
    );
  } catch (error) {
    console.error(
      "[Email Automation] Status check failed:",
      error.message,
    );

    return true;
  }
}



function smtpIsConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function getPropertyUrl(propertyId) {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

  return `${frontendUrl}/properties/${propertyId}`;
}

async function prepareEmailDeliveries() {
  const [notifications] = await db.query(
    `
      SELECT
        notification.notification_id,
        notification.buyer_id,
        user.email
      FROM buyer_notifications notification

      INNER JOIN users user
        ON user.user_id = notification.buyer_id

      LEFT JOIN buyer_preferences preference
        ON preference.buyer_id =
          notification.buyer_id

      WHERE notification.notification_type =
          'property_match'

        AND notification.is_read = 0

        AND user.email IS NOT NULL
        AND user.email <> ''

        AND COALESCE(
          preference.email_alerts_enabled,
          1
        ) = 1
    `,
  );

  for (const notification of notifications) {
    await db.query(
      `
        INSERT IGNORE INTO notification_deliveries (
          notification_id,
          buyer_id,
          channel,
          recipient,
          delivery_status
        )
        VALUES (?, ?, 'email', ?, 'pending')
      `,
      [
        notification.notification_id,
        notification.buyer_id,
        notification.email,
      ],
    );
  }
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,

    port: Number(
      process.env.SMTP_PORT || 465,
    ),

    secure:
      String(
        process.env.SMTP_SECURE,
      ).toLowerCase() === "true",

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPendingEmails() {
  if (!smtpIsConfigured()) {
    console.log(
      "[Email Worker] SMTP is not configured.",
    );

    return {
      sent: 0,
      failed: 0,
      skipped: true,
    };
  }

  const transporter = createTransporter();

  const [deliveries] = await db.query(
    `
      SELECT
        delivery.delivery_id,
        delivery.notification_id,
        delivery.recipient,

        notification.property_id,
        notification.title,
        notification.message,
        notification.recommendation_score,

        user.name

      FROM notification_deliveries delivery

      INNER JOIN buyer_notifications notification
        ON notification.notification_id =
          delivery.notification_id

      INNER JOIN users user
        ON user.user_id = delivery.buyer_id

      WHERE delivery.channel = 'email'
        AND delivery.delivery_status IN (
          'pending',
          'failed'
        )

      ORDER BY delivery.created_at ASC
      LIMIT 50
    `,
  );

  let sent = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    try {
      const score = Number(
        delivery.recommendation_score || 0,
      );

      const propertyUrl = getPropertyUrl(
        delivery.property_id,
      );

      await transporter.sendMail({
        from:
          process.env.EMAIL_FROM ||
          process.env.SMTP_USER,

        to: delivery.recipient,

        subject:
          `New Property Match: ${delivery.title}`,

        text: [
          `Hi ${delivery.name || "Buyer"},`,
          "",
          "We found a verified property matching your preferences.",
          "",
          delivery.title,
          `${score}% match`,
          delivery.message,
          "",
          `View property: ${propertyUrl}`,
          "",
          "SmartEstate",
        ].join("\n"),

        html: `
          <div style="
            max-width:620px;
            margin:auto;
            padding:24px;
            font-family:Arial,sans-serif;
            color:#0f172a;
          ">
            <div style="
              padding:24px;
              border-radius:20px;
              background:#020617;
              color:#ffffff;
            ">
              <div style="
                color:#93c5fd;
                font-size:12px;
                font-weight:700;
              ">
                SMART PROPERTY ALERT
              </div>

              <h1 style="margin:10px 0 0">
                New Match For You
              </h1>
            </div>

            <div style="padding:24px 4px">
              <p>
                Hi ${delivery.name || "Buyer"},
              </p>

              <p>
                We found a verified property matching
                your preferences.
              </p>

              <div style="
                margin:20px 0;
                padding:20px;
                border:1px solid #e2e8f0;
                border-radius:16px;
                background:#f8fafc;
              ">
                <div style="
                  color:#7c3aed;
                  font-size:13px;
                  font-weight:700;
                ">
                  ${score}% MATCH
                </div>

                <h2>
                  ${delivery.title}
                </h2>

                <p style="
                  color:#475569;
                  line-height:1.6;
                ">
                  ${delivery.message}
                </p>
              </div>

              <a
                href="${propertyUrl}"
                style="
                  display:inline-block;
                  padding:13px 20px;
                  border-radius:12px;
                  background:#0b84e5;
                  color:#ffffff;
                  font-weight:700;
                  text-decoration:none;
                "
              >
                View Property
              </a>
            </div>
          </div>
        `,
      });

      await db.query(
        `
          UPDATE notification_deliveries
          SET
            delivery_status = 'sent',
            error_message = NULL,
            sent_at = NOW()
          WHERE delivery_id = ?
        `,
        [delivery.delivery_id],
      );

      sent += 1;
    } catch (error) {
      await db.query(
        `
          UPDATE notification_deliveries
          SET
            delivery_status = 'failed',
            error_message = ?
          WHERE delivery_id = ?
        `,
        [
          String(
            error.message || error,
          ).slice(0, 500),

          delivery.delivery_id,
        ],
      );

      failed += 1;

      console.error(
        `[Email Worker] Delivery ${delivery.delivery_id} failed:`,
        error.message,
      );
    }
  }

  return {
    sent,
    failed,
    skipped: false,
  };
}

async function runEmailNotificationWorker() {

  const automationEnabled =
    await isEmailAutomationEnabled();

  if (!automationEnabled) {
    console.log(
      "[Email Worker] Automatic delivery is paused.",
    );

    return {
      sent: 0,
      failed: 0,
      paused: true,
    };
  }


  if (
    global.smartEstateEmailWorkerRunning
  ) {
    console.log(
      "[Email Worker] Previous run is still active.",
    );

    return {
      sent: 0,
      failed: 0,
      skipped: true,
    };
  }

  global.smartEstateEmailWorkerRunning = true;

  try {
    await prepareEmailDeliveries();

    const result =
      await sendPendingEmails();

    console.log(
      `[Email Worker] Sent: ${result.sent}, Failed: ${result.failed}`,
    );

    return result;
  } finally {
    global.smartEstateEmailWorkerRunning = false;
  }
}

module.exports = {
  runEmailNotificationWorker,
};
