require("dotenv").config();

const db = require("../config/db");

const requiredTables = [
  "users",
  "properties",
  "buyer_activity",
  "buyer_preferences",
  "buyer_notifications",
  "notification_deliveries",
  "marketing_email_campaigns",
  "buyer_lead_followups",
  "system_settings",
];

const requiredColumns = {
  buyer_activity: [
    "buyer_id",
    "property_id",
    "action_type",
    "score",
    "session_key",
    "created_at",
  ],

  buyer_preferences: [
    "buyer_id",
    "personalization_enabled",
    "email_alerts_enabled",
    "marketing_emails_enabled",
    "marketing_email_frequency",
    "marketing_unsubscribe_token",
  ],

  buyer_lead_followups: [
    "buyer_id",
    "lead_status",
    "admin_note",
    "followup_date",
  ],

  marketing_email_campaigns: [
    "buyer_id",
    "recipient",
    "delivery_status",
    "activity_score",
  ],
};

function resultLine(success, message) {
  const symbol = success ? "✅" : "❌";

  console.log(`${symbol} ${message}`);
}

async function checkTables() {
  console.log("\n--- DATABASE TABLES ---");

  const [rows] = await db.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `,
  );

  const tables = new Set(
    rows.map((row) => row.table_name || row.TABLE_NAME),
  );

  let passed = true;

  for (const table of requiredTables) {
    const exists = tables.has(table);

    resultLine(
      exists,
      exists
        ? `${table} exists`
        : `${table} is missing`,
    );

    if (!exists) passed = false;
  }

  return passed;
}

async function checkColumns() {
  console.log("\n--- DATABASE COLUMNS ---");

  let passed = true;

  for (const [
    table,
    columns,
  ] of Object.entries(requiredColumns)) {
    const [rows] = await db.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ?
      `,
      [table],
    );

    const existingColumns = new Set(
      rows.map((row) => row.column_name || row.COLUMN_NAME),
    );

    for (const column of columns) {
      const exists =
        existingColumns.has(column);

      resultLine(
        exists,
        exists
          ? `${table}.${column} exists`
          : `${table}.${column} is missing`,
      );

      if (!exists) passed = false;
    }
  }

  return passed;
}

async function checkDataHealth() {
  console.log("\n--- DATA HEALTH ---");

  const checks = [
    {
      name: "Buyer activities",
      sql: `
        SELECT COUNT(*) AS total
        FROM buyer_activity
      `,
    },
    {
      name: "Buyer notifications",
      sql: `
        SELECT COUNT(*) AS total
        FROM buyer_notifications
      `,
    },
    {
      name: "Email deliveries",
      sql: `
        SELECT COUNT(*) AS total
        FROM notification_deliveries
      `,
    },
    {
      name: "Marketing campaigns",
      sql: `
        SELECT COUNT(*) AS total
        FROM marketing_email_campaigns
      `,
    },
    {
      name: "Lead follow-ups",
      sql: `
        SELECT COUNT(*) AS total
        FROM buyer_lead_followups
      `,
    },
  ];

  for (const check of checks) {
    const [rows] = await db.query(check.sql);

    console.log(
      `ℹ️ ${check.name}: ${
        Number(rows[0]?.total || 0)
      }`,
    );
  }

  const [invalidStatuses] = await db.query(
    `
      SELECT
        lead_status,
        COUNT(*) AS total
      FROM buyer_lead_followups
      WHERE lead_status NOT IN (
        'new',
        'contacted',
        'site_visit_planned',
        'negotiating',
        'converted',
        'not_interested'
      )
      GROUP BY lead_status
    `,
  );

  resultLine(
    invalidStatuses.length === 0,
    invalidStatuses.length === 0
      ? "All lead statuses are valid"
      : "Invalid lead statuses found",
  );

  const [duplicateFollowups] = await db.query(
    `
      SELECT
        buyer_id,
        COUNT(*) AS total
      FROM buyer_lead_followups
      GROUP BY buyer_id
      HAVING COUNT(*) > 1
    `,
  );

  resultLine(
    duplicateFollowups.length === 0,
    duplicateFollowups.length === 0
      ? "No duplicate buyer follow-ups"
      : "Duplicate buyer follow-ups found",
  );

  const [emailStatusRows] = await db.query(
    `
      SELECT
        delivery_status,
        COUNT(*) AS total
      FROM notification_deliveries
      GROUP BY delivery_status
    `,
  );

  console.log("\nProperty email status:");

  for (const row of emailStatusRows) {
    console.log(
      `  ${row.delivery_status}: ${row.total}`,
    );
  }

  const [marketingStatusRows] =
    await db.query(
      `
        SELECT
          delivery_status,
          COUNT(*) AS total
        FROM marketing_email_campaigns
        GROUP BY delivery_status
      `,
    );

  console.log("\nMarketing email status:");

  for (const row of marketingStatusRows) {
    console.log(
      `  ${row.delivery_status}: ${row.total}`,
    );
  }

  return (
    invalidStatuses.length === 0 &&
    duplicateFollowups.length === 0
  );
}

async function runAudit() {
  console.log(
    "\nSMART ESTATE FULL SYSTEM AUDIT",
  );

  console.log(
    "Database:",
    process.env.DB_NAME ||
      "Current configured database",
  );

  try {
    const tablesPassed =
      await checkTables();

    const columnsPassed =
      await checkColumns();

    const dataPassed =
      await checkDataHealth();

    console.log("\n--- FINAL RESULT ---");

    if (
      tablesPassed &&
      columnsPassed &&
      dataPassed
    ) {
      console.log(
        "✅ Backend database audit passed.",
      );

      process.exitCode = 0;
    } else {
      console.log(
        "❌ Audit found missing or invalid items.",
      );

      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      "\n❌ Audit failed:",
      error.message,
    );

    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

runAudit();
