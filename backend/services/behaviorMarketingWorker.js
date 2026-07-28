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



function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getPrice(property) {
  return Number(
    property.display_price ||
      property.price ||
      property.seller_price ||
      property.expected_price ||
      0,
  );
}

function getPropertyId(property) {
  return Number(
    property.property_id ||
      property.id ||
      0,
  );
}

function getTitle(property) {
  return (
    property.title ||
    property.property_title ||
    property.name ||
    "Matching Property"
  );
}

function getLocation(property) {
  return (
    [property.locality, property.city]
      .filter(Boolean)
      .join(", ") ||
    property.location ||
    "Location available on property page"
  );
}

function formatPrice(value) {
  const amount = Number(value || 0);

  if (!amount) return "Price on request";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure:
      String(process.env.SMTP_SECURE).toLowerCase() ===
      "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function topValue(rows, field) {
  const scores = new Map();

  for (const row of rows) {
    const value = normalize(row[field]);

    if (!value) continue;

    const score = Number(row.score || 1);

    scores.set(
      value,
      (scores.get(value) || 0) + score,
    );
  }

  return [...scores.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] || null;
}

function buildProfile(activities) {
  const preferredType = topValue(
    activities,
    "property_type",
  );

  const preferredLocality =
    topValue(activities, "locality") ||
    topValue(activities, "city");

  const bedroomScores = new Map();

  let totalPrice = 0;
  let totalPriceWeight = 0;

  for (const activity of activities) {
    const score = Number(activity.score || 1);

    const bedrooms = Number(
      activity.bedrooms || 0,
    );

    const price = Number(
      activity.property_price || 0,
    );

    if (bedrooms) {
      bedroomScores.set(
        bedrooms,
        (bedroomScores.get(bedrooms) || 0) +
          score,
      );
    }

    if (price > 0) {
      totalPrice += price * score;
      totalPriceWeight += score;
    }
  }

  const preferredBedrooms =
    [...bedroomScores.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] || null;

  const averagePrice =
    totalPriceWeight > 0
      ? totalPrice / totalPriceWeight
      : null;

  return {
    preferredType,
    preferredLocality,
    preferredBedrooms,
    averagePrice,
  };
}

function scoreProperty(property, profile) {
  let score = 0;

  const type = normalize(
    property.property_type ||
      property.type,
  );

  const city = normalize(property.city);
  const locality = normalize(
    property.locality ||
      property.location,
  );

  const bedrooms = Number(
    property.bedrooms ||
      property.bhk ||
      0,
  );

  const price = getPrice(property);

  if (
    profile.preferredType &&
    type === profile.preferredType
  ) {
    score += 35;
  }

  if (
    profile.preferredLocality &&
    (
      locality.includes(
        profile.preferredLocality,
      ) ||
      city.includes(
        profile.preferredLocality,
      )
    )
  ) {
    score += 25;
  }

  if (
    profile.preferredBedrooms &&
    bedrooms === profile.preferredBedrooms
  ) {
    score += 15;
  }

  if (
    profile.averagePrice &&
    price > 0
  ) {
    const difference =
      Math.abs(price - profile.averagePrice) /
      profile.averagePrice;

    if (difference <= 0.1) {
      score += 25;
    } else if (difference <= 0.2) {
      score += 15;
    } else if (difference <= 0.35) {
      score += 7;
    }
  }

  return score;
}

async function getEligibleBuyers() {
  const [buyers] = await db.query(
    `
      SELECT
        user.user_id,
        user.name,
        user.email,

        preference.marketing_unsubscribe_token,

        COALESCE(
          preference.marketing_emails_enabled,
          1
        ) AS marketing_emails_enabled,

        COALESCE(
          preference.marketing_email_frequency,
          'daily'
        ) AS marketing_email_frequency

      FROM users user

      LEFT JOIN buyer_preferences preference
        ON preference.buyer_id = user.user_id

      WHERE LOWER(user.role) = 'buyer'

        AND user.email IS NOT NULL
        AND user.email <> ''

        AND COALESCE(
          preference.personalization_enabled,
          1
        ) = 1

        AND COALESCE(
          preference.email_alerts_enabled,
          1
        ) = 1

        AND COALESCE(
          preference.marketing_emails_enabled,
          1
        ) = 1
    `,
  );

  return buyers;
}

async function createCampaigns() {
  const buyers = await getEligibleBuyers();

  const [propertyRows] = await db.query(
    `
      SELECT *
      FROM properties
      WHERE status = 'verified'
      ORDER BY created_at DESC
      LIMIT 200
    `,
  );

  let created = 0;

  for (const buyer of buyers) {
    const buyerId = Number(buyer.user_id);

    if (!buyer.marketing_unsubscribe_token) {
      await db.query(
        `
          INSERT INTO buyer_preferences (
            buyer_id,
            marketing_unsubscribe_token
          )
          VALUES (
            ?,
            REPLACE(UUID(), '-', '')
          )
          ON DUPLICATE KEY UPDATE
            marketing_unsubscribe_token =
              COALESCE(
                marketing_unsubscribe_token,
                REPLACE(UUID(), '-', '')
              )
        `,
        [buyerId],
      );
    }

    const [visitRows] = await db.query(
      `
        SELECT COUNT(
          DISTINCT COALESCE(
            session_key,
            DATE_FORMAT(
              created_at,
              '%Y-%m-%d-%H'
            )
          )
        ) AS visit_count
        FROM buyer_activity
        WHERE buyer_id = ?
          AND action_type = 'visit'
      `,
      [buyerId],
    );

    const visitCount = Number(
      visitRows[0]?.visit_count || 0,
    );

    if (visitCount < 2) continue;

    const [activities] = await db.query(
      `
        SELECT
          property_type,
          property_price,
          city,
          locality,
          bedrooms,
          score
        FROM buyer_activity
        WHERE buyer_id = ?
          AND action_type <> 'visit'
          AND created_at >=
            DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY created_at DESC
        LIMIT 300
      `,
      [buyerId],
    );

    const engagementScore =
      activities.reduce(
        (total, activity) =>
          total + Number(activity.score || 0),
        0,
      );

    if (engagementScore < 5) continue;

    const frequency =
      String(
        buyer.marketing_email_frequency ||
          "daily",
      ).toLowerCase();

    const cooldownHoursByFrequency = {
      daily: 24,
      three_days: 72,
      weekly: 168,
    };

    const cooldownHours =
      cooldownHoursByFrequency[frequency] || 24;

    const [recentCampaignRows] =
      await db.query(
        `
          SELECT campaign_id
          FROM marketing_email_campaigns
          WHERE buyer_id = ?
            AND campaign_type =
              'personalized_followup'
            AND created_at >=
              DATE_SUB(
                NOW(),
                INTERVAL ${cooldownHours} HOUR
              )
          LIMIT 1
        `,
        [buyerId],
      );

    if (recentCampaignRows.length) continue;

    const profile = buildProfile(activities);

    const rankedProperties = propertyRows
      .map((property) => ({
        property,
        score: scoreProperty(
          property,
          profile,
        ),
      }))
      .filter(
        (item) =>
          getPropertyId(item.property) &&
          item.score >= 20,
      )
      .sort(
        (a, b) => b.score - a.score,
      )
      .slice(0, 3);

    if (!rankedProperties.length) continue;

    const propertyIds = rankedProperties
      .map((item) =>
        getPropertyId(item.property),
      )
      .join(",");

    await db.query(
      `
        INSERT INTO marketing_email_campaigns (
          buyer_id,
          campaign_type,
          subject,
          property_ids,
          activity_score,
          delivery_status,
          recipient
        )
        VALUES (
          ?,
          'personalized_followup',
          ?,
          ?,
          ?,
          'pending',
          ?
        )
      `,
      [
        buyerId,
        "Properties Selected For You",
        propertyIds,
        engagementScore,
        buyer.email,
      ],
    );

    created += 1;
  }

  return created;
}

async function sendCampaigns() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return {
      sent: 0,
      failed: 0,
    };
  }

  const transporter = createTransporter();

  const [campaigns] = await db.query(
    `
      SELECT
        campaign.campaign_id,
        campaign.buyer_id,
        campaign.subject,
        campaign.property_ids,
        campaign.recipient,
        user.name,
        preference.marketing_unsubscribe_token
      FROM marketing_email_campaigns campaign

      INNER JOIN users user
        ON user.user_id = campaign.buyer_id

      LEFT JOIN buyer_preferences preference
        ON preference.buyer_id =
          campaign.buyer_id

      WHERE campaign.delivery_status IN (
        'pending',
        'failed'
      )

      ORDER BY campaign.created_at ASC
      LIMIT 30
    `,
  );

  let sent = 0;
  let failed = 0;

  for (const campaign of campaigns) {
    try {
      const ids = String(
        campaign.property_ids || "",
      )
        .split(",")
        .map(Number)
        .filter(Boolean);

      if (!ids.length) continue;

      const placeholders =
        ids.map(() => "?").join(",");

      const [properties] = await db.query(
        `
          SELECT *
          FROM properties
          WHERE property_id IN (
            ${placeholders}
          )
        `,
        ids,
      );

      const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";

      const unsubscribeUrl =
        campaign.marketing_unsubscribe_token
          ? `${frontendUrl}/email-preferences/unsubscribe?token=${campaign.marketing_unsubscribe_token}`
          : `${frontendUrl}/buyer/recommendation-settings`;

      const propertyCards = properties
        .map((property) => {
          const id = getPropertyId(property);

          return `
            <div style="
              border:1px solid #e2e8f0;
              border-radius:14px;
              padding:16px;
              margin-top:12px;
              background:#f8fafc;
            ">
              <h3 style="margin:0 0 8px">
                ${getTitle(property)}
              </h3>

              <p style="
                margin:4px 0;
                color:#475569;
              ">
                ${getLocation(property)}
              </p>

              <p style="
                margin:8px 0;
                font-weight:700;
              ">
                ${formatPrice(
                  getPrice(property),
                )}
              </p>

              <a
                href="${frontendUrl}/properties/${id}"
                style="
                  color:#0b84e5;
                  font-weight:700;
                  text-decoration:none;
                "
              >
                View Property →
              </a>
            </div>
          `;
        })
        .join("");

      await transporter.sendMail({
        from:
          process.env.EMAIL_FROM ||
          process.env.SMTP_USER,

        to: campaign.recipient,

        subject: campaign.subject,

        html: `
          <div style="
            max-width:620px;
            margin:auto;
            padding:24px;
            font-family:Arial,sans-serif;
            color:#0f172a;
          ">
            <div style="
              background:#020617;
              color:white;
              padding:24px;
              border-radius:20px;
            ">
              <div style="
                color:#93c5fd;
                font-size:12px;
                font-weight:700;
              ">
                PERSONALISED FOR YOU
              </div>

              <h1 style="margin:10px 0 0">
                Properties Selected For You
              </h1>
            </div>

            <p style="
              margin-top:24px;
              line-height:1.6;
            ">
              Hi ${campaign.name || "Buyer"},
            </p>

            <p style="line-height:1.6">
              Based on the properties you recently
              viewed, searched, saved or compared,
              we selected these verified options.
            </p>

            ${propertyCards}

            <p style="
              margin-top:24px;
              font-size:12px;
              color:#64748b;
              line-height:1.6;
            ">
              You receive this email because property
              email alerts are enabled in your
              SmartEstate recommendation settings.
            </p>

            <div style="margin-top:14px">
              <a
                href="${frontendUrl}/buyer/recommendation-settings"
                style="
                  font-size:12px;
                  color:#64748b;
                "
              >
                Manage email preferences
              </a>

              <span style="
                margin:0 8px;
                color:#cbd5e1;
              ">
                •
              </span>

              <a
                href="${unsubscribeUrl}"
                style="
                  font-size:12px;
                  color:#64748b;
                "
              >
                Stop marketing emails
              </a>
            </div>
          </div>
        `,
      });

      await db.query(
        `
          UPDATE marketing_email_campaigns
          SET
            delivery_status = 'sent',
            error_message = NULL,
            sent_at = NOW()
          WHERE campaign_id = ?
        `,
        [campaign.campaign_id],
      );

      sent += 1;
    } catch (error) {
      await db.query(
        `
          UPDATE marketing_email_campaigns
          SET
            delivery_status = 'failed',
            error_message = ?
          WHERE campaign_id = ?
        `,
        [
          String(
            error.message || error,
          ).slice(0, 500),
          campaign.campaign_id,
        ],
      );

      failed += 1;
    }
  }

  return {
    sent,
    failed,
  };
}

async function runBehaviorMarketingWorker() {

  const automationEnabled =
    await isEmailAutomationEnabled();

  if (!automationEnabled) {
    console.log(
      "[Marketing Worker] Automatic delivery is paused.",
    );

    return {
      created: 0,
      sent: 0,
      failed: 0,
      paused: true,
    };
  }


  const created = await createCampaigns();
  const result = await sendCampaigns();

  console.log(
    `[Marketing Worker] Created: ${created}, Sent: ${result.sent}, Failed: ${result.failed}`,
  );

  return {
    created,
    ...result,
  };
}

module.exports = {
  runBehaviorMarketingWorker,
};
