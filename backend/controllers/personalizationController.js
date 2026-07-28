const db = require("../config/db");
const nodemailer = require("nodemailer");


const {
  runEmailNotificationWorker,
} = require("../services/emailNotificationWorker");

const {
  runBehaviorMarketingWorker,
} = require("../services/behaviorMarketingWorker");



const actionScores = {
  visit: 0,
  view: 1,
  details: 2,
  search: 3,
  save: 5,
  compare: 4,
  site_visit: 10,
  price_talk: 10,
  interest: 8,
};

function getUserId(req) {
  return Number(
    req.user?.user_id ||
      req.user?.userId ||
      req.user?.id,
  );
}

function requireBuyer(req, res) {
  const buyerId = getUserId(req);
  const role = String(req.user?.role || "").toLowerCase();

  if (!buyerId) {
    res.status(401).json({
      message: "Please login to continue.",
    });
    return null;
  }

  if (role && role !== "buyer") {
    res.status(403).json({
      message: "This feature is available for buyers only.",
    });
    return null;
  }

  return buyerId;
}


async function getBuyerPersonalizationSettings(buyerId) {
  const [rows] = await db.query(
    `
      SELECT
        personalization_enabled,
        email_alerts_enabled,
        sms_alerts_enabled
      FROM buyer_preferences
      WHERE buyer_id = ?
      LIMIT 1
    `,
    [buyerId],
  );

  const saved = rows[0];

  return {
    personalizationEnabled:
      saved
        ? Boolean(saved.personalization_enabled)
        : true,

    emailAlertsEnabled:
      saved
        ? Boolean(saved.email_alerts_enabled)
        : true,

    smsAlertsEnabled:
      saved
        ? Boolean(saved.sms_alerts_enabled)
        : false,
  };
}

exports.trackActivity = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const settings =
      await getBuyerPersonalizationSettings(
        buyerId,
      );

    if (!settings.personalizationEnabled) {
      return res.json({
        tracked: false,
        message:
          "Personalized activity tracking is disabled.",
      });
    }

    const actionType = String(
      req.body.action_type || "",
    ).toLowerCase();

    if (!Object.hasOwn(actionScores, actionType)) {
      return res.status(400).json({
        message: "Invalid activity type.",
      });
    }

    const propertyId =
      Number(req.body.property_id) || null;

    let propertyType = String(
      req.body.property_type || "",
    ).trim() || null;

    let propertyPrice =
      Number(req.body.property_price) || null;

    let city = String(
      req.body.city || "",
    ).trim() || null;

    let locality = String(
      req.body.locality || "",
    ).trim() || null;

    let bedrooms =
      Number(req.body.bedrooms) || null;

    /*
     * When frontend sends only property_id,
     * load remaining details directly from database.
     */
    if (
      propertyId &&
      (
        !propertyType ||
        !propertyPrice ||
        !city ||
        !locality ||
        !bedrooms
      )
    ) {
      const [propertyRows] = await db.query(
        `
          SELECT *
          FROM properties
          WHERE property_id = ?
          LIMIT 1
        `,
        [propertyId],
      );

      const property = propertyRows[0];

      if (property) {
        propertyType =
          propertyType ||
          property.property_type ||
          property.type ||
          null;

        propertyPrice =
          propertyPrice ||
          Number(
            property.price ||
            property.display_price ||
            property.seller_price ||
            property.expected_price ||
            0,
          ) ||
          null;

        city =
          city ||
          property.city ||
          null;

        locality =
          locality ||
          property.locality ||
          property.location ||
          property.area_name ||
          null;

        bedrooms =
          bedrooms ||
          Number(
            property.bedrooms ||
            property.bhk ||
            property.bedroom_count ||
            0,
          ) ||
          null;
      }
    }

    const score = actionScores[actionType];

    await db.query(
      `
        INSERT INTO buyer_activity (
          buyer_id,
          session_key,
          property_id,
          action_type,
          property_type,
          property_price,
          city,
          locality,
          bedrooms,
          score
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        buyerId,
        String(req.body.session_key || "").trim() ||
          null,
        propertyId,
        actionType,
        propertyType,
        propertyPrice,
        city,
        locality,
        bedrooms,
        score,
      ],
    );

    res.status(201).json({
      message: "Buyer activity recorded.",
      score,
    });
  } catch (error) {
    console.error("Track activity error:", error);

    res.status(500).json({
      message: "Could not record buyer activity.",
    });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const [savedPreferences] = await db.query(
      `
        SELECT *
        FROM buyer_preferences
        WHERE buyer_id = ?
        LIMIT 1
      `,
      [buyerId],
    );

    const [typeRows] = await db.query(
      `
        SELECT
          property_type,
          SUM(score) AS preference_score,
          COUNT(*) AS activity_count
        FROM buyer_activity
        WHERE buyer_id = ?
          AND property_type IS NOT NULL
        GROUP BY property_type
        ORDER BY preference_score DESC, activity_count DESC
        LIMIT 3
      `,
      [buyerId],
    );

    const [locationRows] = await db.query(
      `
        SELECT
          city,
          locality,
          SUM(score) AS preference_score
        FROM buyer_activity
        WHERE buyer_id = ?
          AND (city IS NOT NULL OR locality IS NOT NULL)
        GROUP BY city, locality
        ORDER BY preference_score DESC
        LIMIT 5
      `,
      [buyerId],
    );

    const [priceRows] = await db.query(
      `
        SELECT
          MIN(property_price) AS minimum_viewed_price,
          MAX(property_price) AS maximum_viewed_price,
          AVG(property_price) AS average_viewed_price
        FROM buyer_activity
        WHERE buyer_id = ?
          AND property_price IS NOT NULL
          AND score >= 2
      `,
      [buyerId],
    );

    const [bedroomRows] = await db.query(
      `
        SELECT
          bedrooms,
          SUM(score) AS preference_score
        FROM buyer_activity
        WHERE buyer_id = ?
          AND bedrooms IS NOT NULL
        GROUP BY bedrooms
        ORDER BY preference_score DESC
        LIMIT 3
      `,
      [buyerId],
    );

    const [activityCountRows] = await db.query(
      `
        SELECT COUNT(*) AS total_activities
        FROM buyer_activity
        WHERE buyer_id = ?
      `,
      [buyerId],
    );

    res.json({
      preferences: {
        saved: savedPreferences[0] || null,
        property_types: typeRows,
        locations: locationRows,
        price_range: priceRows[0] || null,
        bedrooms: bedroomRows,
        total_activities:
          activityCountRows[0]?.total_activities || 0,
      },
    });
  } catch (error) {
    console.error("Get preferences error:", error);

    res.status(500).json({
      message: "Could not calculate buyer preferences.",
    });
  }
};

exports.updateAlertSettings = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const personalizationEnabled =
      req.body.personalization_enabled === false ? 0 : 1;

    const emailAlertsEnabled =
      req.body.email_alerts_enabled === false ? 0 : 1;

    const smsAlertsEnabled =
      req.body.sms_alerts_enabled === true ? 1 : 0;

    await db.query(
      `
        INSERT INTO buyer_preferences (
          buyer_id,
          personalization_enabled,
          email_alerts_enabled,
          sms_alerts_enabled
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          personalization_enabled = VALUES(personalization_enabled),
          email_alerts_enabled = VALUES(email_alerts_enabled),
          sms_alerts_enabled = VALUES(sms_alerts_enabled)
      `,
      [
        buyerId,
        personalizationEnabled,
        emailAlertsEnabled,
        smsAlertsEnabled,
      ],
    );

    res.json({
      message: "Alert settings updated.",
    });
  } catch (error) {
    console.error("Update alerts error:", error);

    res.status(500).json({
      message: "Could not update alert settings.",
    });
  }
};

function firstValue(object, keys, fallback = null) {
  for (const key of keys) {
    const value = object?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function propertyData(property) {
  return {
    id: Number(
      firstValue(property, [
        "property_id",
        "id",
      ], 0),
    ),

    title: firstValue(property, [
      "title",
      "property_title",
      "name",
    ], "Property"),

    type: firstValue(property, [
      "property_type",
      "type",
      "category",
    ]),

    price: Number(
      firstValue(property, [
        "display_price",
        "price",
        "seller_price",
        "expected_price",
      ], 0),
    ) || null,

    city: firstValue(property, [
      "city",
      "district",
    ]),

    locality: firstValue(property, [
      "locality",
      "location",
      "area_name",
      "address",
    ]),

    bedrooms: Number(
      firstValue(property, [
        "bedrooms",
        "bhk",
        "bedroom_count",
      ], 0),
    ) || null,

    status: firstValue(
      property,
      ["status"],
      "pending",
    ),

    createdAt: firstValue(property, [
      "created_at",
      "listed_at",
    ]),

    raw: property,
  };
}

function calculatePreferenceProfile(activities) {
  const typeScores = new Map();
  const locationScores = new Map();
  const bedroomScores = new Map();

  let weightedPriceTotal = 0;
  let priceWeightTotal = 0;

  for (const activity of activities) {
    const score = Number(activity.score || 1);

    const propertyType = normalizeText(
      activity.property_type,
    );

    const city = normalizeText(activity.city);
    const locality = normalizeText(activity.locality);

    const bedrooms = Number(activity.bedrooms || 0);
    const price = Number(activity.property_price || 0);

    if (propertyType) {
      typeScores.set(
        propertyType,
        (typeScores.get(propertyType) || 0) + score,
      );
    }

    const locationKey = locality || city;

    if (locationKey) {
      locationScores.set(
        locationKey,
        (locationScores.get(locationKey) || 0) + score,
      );
    }

    if (bedrooms > 0) {
      bedroomScores.set(
        bedrooms,
        (bedroomScores.get(bedrooms) || 0) + score,
      );
    }

    if (price > 0) {
      weightedPriceTotal += price * score;
      priceWeightTotal += score;
    }
  }

  function topMapEntry(map) {
    return [...map.entries()].sort(
      (first, second) => second[1] - first[1],
    )[0] || [null, 0];
  }

  const [preferredType, preferredTypeScore] =
    topMapEntry(typeScores);

  const [preferredLocation, preferredLocationScore] =
    topMapEntry(locationScores);

  const [preferredBedrooms, preferredBedroomScore] =
    topMapEntry(bedroomScores);

  const averagePrice =
    priceWeightTotal > 0
      ? weightedPriceTotal / priceWeightTotal
      : null;

  return {
    preferredType,
    preferredTypeScore,
    preferredLocation,
    preferredLocationScore,
    preferredBedrooms:
      preferredBedrooms || null,
    preferredBedroomScore,
    averagePrice,
    minimumPrice:
      averagePrice ? averagePrice * 0.8 : null,
    maximumPrice:
      averagePrice ? averagePrice * 1.2 : null,
    totalActivities: activities.length,
  };
}

function scoreProperty(property, profile) {
  let score = 0;
  const reasons = [];

  const type = normalizeText(property.type);
  const city = normalizeText(property.city);
  const locality = normalizeText(property.locality);
  const price = Number(property.price || 0);
  const bedrooms = Number(property.bedrooms || 0);

  if (
    profile.preferredType &&
    type === profile.preferredType
  ) {
    score += 35;
    reasons.push(
      `Matches your ${property.type} preference`,
    );
  }

  if (
    profile.preferredLocation &&
    (
      locality.includes(profile.preferredLocation) ||
      city.includes(profile.preferredLocation) ||
      profile.preferredLocation.includes(locality)
    )
  ) {
    score += 25;
    reasons.push("Matches your preferred location");
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
      reasons.push("Very close to your preferred budget");
    } else if (difference <= 0.2) {
      score += 18;
      reasons.push("Within your usual budget range");
    } else if (difference <= 0.35) {
      score += 8;
    }
  }

  if (
    profile.preferredBedrooms &&
    bedrooms === Number(profile.preferredBedrooms)
  ) {
    score += 12;
    reasons.push(
      `Matches your ${bedrooms} BHK preference`,
    );
  }

  if (
    normalizeText(property.status) === "verified"
  ) {
    score += 8;
    reasons.push("Verified property");
  }

  if (property.createdAt) {
    const createdTime =
      new Date(property.createdAt).getTime();

    const ageInDays =
      (Date.now() - createdTime) /
      (1000 * 60 * 60 * 24);

    if (
      Number.isFinite(ageInDays) &&
      ageInDays <= 14
    ) {
      score += 5;
      reasons.push("Recently added");
    }
  }

  return {
    score,
    reasons: reasons.slice(0, 3),
  };
}

exports.getRecommendations = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const settings =
      await getBuyerPersonalizationSettings(
        buyerId,
      );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 12, 1),
      30,
    );

    if (!settings.personalizationEnabled) {
      const [generalPropertyRows] = await db.query(
        `
          SELECT *
          FROM properties
          WHERE status = 'verified'
          ORDER BY created_at DESC
          LIMIT ?
        `,
        [limit],
      );

      return res.json({
        profile: {
          preferredType: null,
          preferredLocation: null,
          preferredBedrooms: null,
          averagePrice: null,
          totalActivities: 0,
          personalizationEnabled: false,
        },

        recommendations:
          generalPropertyRows.map((property) => ({
            ...property,
            recommendation_score: 0,
            recommendation_reasons: [
              "Recently verified property",
            ],
            previously_viewed: false,
          })),

        message:
          "Personalized recommendations are disabled. Showing recently verified properties.",
      });
    }

    const [activities] = await db.query(
      `
        SELECT
          property_id,
          action_type,
          property_type,
          property_price,
          city,
          locality,
          bedrooms,
          score,
          created_at
        FROM buyer_activity
        WHERE buyer_id = ?
        ORDER BY created_at DESC
        LIMIT 500
      `,
      [buyerId],
    );

    const [propertyRows] = await db.query(
      `
        SELECT *
        FROM properties
        WHERE status = 'verified'
        ORDER BY created_at DESC
        LIMIT 200
      `,
    );

    const profile =
      calculatePreferenceProfile(activities);

    const [savedPreferenceRows] = await db.query(
      `
        SELECT
          preferred_property_type,
          minimum_price,
          maximum_price,
          preferred_city,
          preferred_locality,
          preferred_bedrooms
        FROM buyer_preferences
        WHERE buyer_id = ?
        LIMIT 1
      `,
      [buyerId],
    );

    const savedPreferences =
      savedPreferenceRows[0] || {};

    if (savedPreferences.preferred_property_type) {
      profile.preferredType = normalizeText(
        savedPreferences.preferred_property_type,
      );
    }

    if (
      savedPreferences.preferred_locality ||
      savedPreferences.preferred_city
    ) {
      profile.preferredLocation = normalizeText(
        savedPreferences.preferred_locality ||
        savedPreferences.preferred_city,
      );
    }

    if (savedPreferences.preferred_bedrooms) {
      profile.preferredBedrooms = Number(
        savedPreferences.preferred_bedrooms,
      );
    }

    if (
      savedPreferences.minimum_price &&
      savedPreferences.maximum_price
    ) {
      profile.minimumPrice = Number(
        savedPreferences.minimum_price,
      );

      profile.maximumPrice = Number(
        savedPreferences.maximum_price,
      );

      profile.averagePrice =
        (
          profile.minimumPrice +
          profile.maximumPrice
        ) / 2;
    }

    const viewedPropertyIds = new Set(
      activities
        .map((activity) =>
          Number(activity.property_id),
        )
        .filter(Boolean),
    );

    const [hiddenRows] = await db.query(
      `
        SELECT property_id
        FROM buyer_property_feedback
        WHERE buyer_id = ?
          AND feedback_type = 'not_interested'
      `,
      [buyerId],
    );

    const hiddenPropertyIds = new Set(
      hiddenRows.map(
        (row) => Number(row.property_id),
      ),
    );

    let recommendations = propertyRows
      .map(propertyData)
      .filter(
        (property) =>
          property.id &&
          !hiddenPropertyIds.has(property.id),
      )
      .map((property) => {
        const result = scoreProperty(
          property,
          profile,
        );

        /*
         * Previously viewed properties can still appear,
         * but fresh options receive a small advantage.
         */
        const freshPropertyBonus =
          viewedPropertyIds.has(property.id) ? 0 : 4;

        return {
          ...property.raw,
          recommendation_score:
            result.score + freshPropertyBonus,
          recommendation_reasons:
            result.reasons,
          previously_viewed:
            viewedPropertyIds.has(property.id),
        };
      })
      .sort(
        (first, second) =>
          Number(second.recommendation_score || 0) -
          Number(first.recommendation_score || 0),
      );

    /*
     * Keep some discovery variety.
     * Mostly personalized results, with a few other options.
     */
    if (profile.preferredType) {
      const preferred = recommendations.filter(
        (property) =>
          normalizeText(
            firstValue(property, [
              "property_type",
              "type",
            ]),
          ) === profile.preferredType,
      );

      const discovery = recommendations.filter(
        (property) =>
          normalizeText(
            firstValue(property, [
              "property_type",
              "type",
            ]),
          ) !== profile.preferredType,
      );

      const preferredLimit = Math.max(
        Math.round(limit * 0.8),
        1,
      );

      recommendations = [
        ...preferred.slice(0, preferredLimit),
        ...discovery.slice(
          0,
          limit - preferredLimit,
        ),
      ];
    }

    res.json({
      profile,
      recommendations:
        recommendations.slice(0, limit),
      message:
        activities.length > 0
          ? "Recommendations based on your activity."
          : "Popular verified properties for you.",
    });
  } catch (error) {
    console.error(
      "Get recommendations error:",
      error,
    );

    res.status(500).json({
      message:
        "Could not prepare personalized recommendations.",
    });
  }
};

exports.scanNewMatches = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const settings =
      await getBuyerPersonalizationSettings(
        buyerId,
      );

    if (!settings.personalizationEnabled) {
      return res.json({
        created: 0,
        message:
          "Personalized property alerts are disabled.",
      });
    }

    const [activities] = await db.query(
      `
        SELECT
          property_id,
          property_type,
          property_price,
          city,
          locality,
          bedrooms,
          score,
          created_at
        FROM buyer_activity
        WHERE buyer_id = ?
        ORDER BY created_at DESC
        LIMIT 500
      `,
      [buyerId],
    );

    if (activities.length === 0) {
      return res.json({
        created: 0,
        message: "Browse properties to receive match alerts.",
      });
    }

    const profile =
      calculatePreferenceProfile(activities);

    const [propertyRows] = await db.query(
      `
        SELECT *
        FROM properties
        WHERE status = 'verified'
        ORDER BY created_at DESC
        LIMIT 100
      `,
    );

    let created = 0;

    for (const row of propertyRows) {
      const property = propertyData(row);

      if (!property.id) continue;

      const match = scoreProperty(
        property,
        profile,
      );

      /*
       * Only strong matches create notifications.
       */
      if (match.score < 35) continue;

      const title =
        property.title || "New Property Match";

      const location =
        [property.locality, property.city]
          .filter(Boolean)
          .join(", ") ||
        "your preferred location";

      const reason =
        match.reasons[0] ||
        "This property matches your recent activity.";

      const message =
        `${reason}. Property available in ${location}.`;

      const [result] = await db.query(
        `
          INSERT IGNORE INTO buyer_notifications (
            buyer_id,
            property_id,
            notification_type,
            title,
            message,
            recommendation_score
          )
          VALUES (?, ?, 'property_match', ?, ?, ?)
        `,
        [
          buyerId,
          property.id,
          title,
          message,
          match.score,
        ],
      );

      if (result.affectedRows > 0) {
        created += 1;
      }
    }

    res.json({
      created,
      message:
        created > 0
          ? `${created} new property match alert created.`
          : "No new matching properties found.",
    });
  } catch (error) {
    console.error("Scan new matches error:", error);

    res.status(500).json({
      message: "Could not scan new property matches.",
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const [notifications] = await db.query(
      `
        SELECT
          notification_id,
          property_id,
          notification_type,
          title,
          message,
          recommendation_score,
          is_read,
          created_at
        FROM buyer_notifications
        WHERE buyer_id = ?
        ORDER BY created_at DESC
        LIMIT 100
      `,
      [buyerId],
    );

    const [countRows] = await db.query(
      `
        SELECT COUNT(*) AS unread_count
        FROM buyer_notifications
        WHERE buyer_id = ?
          AND is_read = 0
      `,
      [buyerId],
    );

    res.json({
      notifications,
      unread_count:
        Number(countRows[0]?.unread_count || 0),
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      message: "Could not load notifications.",
    });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const notificationId =
      Number(req.params.notificationId);

    if (!notificationId) {
      return res.status(400).json({
        message: "Invalid notification.",
      });
    }

    await db.query(
      `
        UPDATE buyer_notifications
        SET is_read = 1
        WHERE notification_id = ?
          AND buyer_id = ?
      `,
      [notificationId, buyerId],
    );

    res.json({
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error,
    );

    res.status(500).json({
      message: "Could not update notification.",
    });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    await db.query(
      `
        UPDATE buyer_notifications
        SET is_read = 1
        WHERE buyer_id = ?
      `,
      [buyerId],
    );

    res.json({
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error,
    );

    res.status(500).json({
      message: "Could not update notifications.",
    });
  }
};

exports.clearBuyerActivity = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    await db.query(
      `
        DELETE FROM buyer_activity
        WHERE buyer_id = ?
      `,
      [buyerId],
    );

    await db.query(
      `
        DELETE FROM buyer_notifications
        WHERE buyer_id = ?
      `,
      [buyerId],
    );

    res.json({
      message:
        "Recommendation history and property alerts cleared.",
    });
  } catch (error) {
    console.error("Clear buyer activity error:", error);

    res.status(500).json({
      message:
        "Could not clear recommendation history.",
    });
  }
};

exports.getRecentlyViewed = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      50,
    );

    const [rows] = await db.query(
      `
        SELECT
          p.*,
          MAX(ba.created_at) AS last_viewed_at,
          COUNT(ba.activity_id) AS view_count
        FROM buyer_activity ba
        INNER JOIN properties p
          ON p.property_id = ba.property_id
        WHERE ba.buyer_id = ?
          AND ba.action_type IN ('view', 'details')
        GROUP BY p.property_id
        ORDER BY last_viewed_at DESC
        LIMIT ?
      `,
      [buyerId, limit],
    );

    res.json({
      properties: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error(
      "Get recently viewed error:",
      error,
    );

    res.status(500).json({
      message:
        "Could not load recently viewed properties.",
    });
  }
};

exports.getContinueComparing = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 4, 2),
      10,
    );

    const [rows] = await db.query(
      `
        SELECT
          p.*,
          MAX(ba.created_at) AS last_compared_at,
          COUNT(ba.activity_id) AS compare_count
        FROM buyer_activity ba
        INNER JOIN properties p
          ON p.property_id = ba.property_id
        WHERE ba.buyer_id = ?
          AND ba.action_type = 'compare'
          AND p.status = 'verified'
        GROUP BY p.property_id
        ORDER BY last_compared_at DESC
        LIMIT ?
      `,
      [buyerId, limit],
    );

    res.json({
      properties: rows,
      total: rows.length,
      can_compare: rows.length >= 2,
    });
  } catch (error) {
    console.error(
      "Continue comparing error:",
      error,
    );

    res.status(500).json({
      message:
        "Could not load compared properties.",
    });
  }
};

exports.savePropertyFeedback = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const propertyId = Number(req.params.propertyId);

    const feedbackType = String(
      req.body.feedback_type || "",
    ).trim().toLowerCase();

    if (!propertyId) {
      return res.status(400).json({
        message: "Invalid property.",
      });
    }

    const allowedFeedback = [
      "not_interested",
    ];

    if (!allowedFeedback.includes(feedbackType)) {
      return res.status(400).json({
        message: "Invalid feedback type.",
      });
    }

    const [propertyRows] = await db.query(
      `
        SELECT property_id
        FROM properties
        WHERE property_id = ?
        LIMIT 1
      `,
      [propertyId],
    );

    if (!propertyRows.length) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    await db.query(
      `
        INSERT INTO buyer_property_feedback (
          buyer_id,
          property_id,
          feedback_type
        )
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          feedback_type = VALUES(feedback_type),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        buyerId,
        propertyId,
        feedbackType,
      ],
    );

    res.json({
      message:
        "We will show fewer properties like this.",
    });
  } catch (error) {
    console.error(
      "Save property feedback error:",
      error,
    );

    res.status(500).json({
      message: "Could not save property feedback.",
    });
  }
};

exports.removePropertyFeedback = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const propertyId = Number(req.params.propertyId);

    if (!propertyId) {
      return res.status(400).json({
        message: "Invalid property.",
      });
    }

    await db.query(
      `
        DELETE FROM buyer_property_feedback
        WHERE buyer_id = ?
          AND property_id = ?
      `,
      [buyerId, propertyId],
    );

    res.json({
      message: "Property restored to recommendations.",
    });
  } catch (error) {
    console.error(
      "Remove property feedback error:",
      error,
    );

    res.status(500).json({
      message: "Could not remove property feedback.",
    });
  }
};

exports.getHiddenPropertyIds = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const [rows] = await db.query(
      `
        SELECT property_id
        FROM buyer_property_feedback
        WHERE buyer_id = ?
          AND feedback_type = 'not_interested'
      `,
      [buyerId],
    );

    res.json({
      property_ids: rows.map(
        (row) => Number(row.property_id),
      ),
    });
  } catch (error) {
    console.error(
      "Get hidden properties error:",
      error,
    );

    res.status(500).json({
      message: "Could not load hidden properties.",
    });
  }
};

exports.getHiddenProperties = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const [rows] = await db.query(
      `
        SELECT
          p.*,
          feedback.feedback_id,
          feedback.feedback_type,
          feedback.updated_at AS hidden_at
        FROM buyer_property_feedback feedback
        INNER JOIN properties p
          ON p.property_id = feedback.property_id
        WHERE feedback.buyer_id = ?
          AND feedback.feedback_type = 'not_interested'
        ORDER BY feedback.updated_at DESC
      `,
      [buyerId],
    );

    res.json({
      properties: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error(
      "Get hidden properties error:",
      error,
    );

    res.status(500).json({
      message: "Could not load hidden properties.",
    });
  }
};

exports.updatePropertyPreferences = async (req, res) => {
  try {
    const buyerId = requireBuyer(req, res);

    if (!buyerId) return;

    const preferredPropertyType = String(
      req.body.preferred_property_type || "",
    ).trim() || null;

    const preferredCity = String(
      req.body.preferred_city || "",
    ).trim() || null;

    const preferredLocality = String(
      req.body.preferred_locality || "",
    ).trim() || null;

    const minimumPrice =
      Number(req.body.minimum_price) || null;

    const maximumPrice =
      Number(req.body.maximum_price) || null;

    const preferredBedrooms =
      Number(req.body.preferred_bedrooms) || null;

    if (
      minimumPrice &&
      maximumPrice &&
      minimumPrice > maximumPrice
    ) {
      return res.status(400).json({
        message:
          "Minimum budget cannot be greater than maximum budget.",
      });
    }

    if (
      minimumPrice &&
      minimumPrice < 0
    ) {
      return res.status(400).json({
        message: "Minimum budget is invalid.",
      });
    }

    if (
      maximumPrice &&
      maximumPrice < 0
    ) {
      return res.status(400).json({
        message: "Maximum budget is invalid.",
      });
    }

    if (
      preferredBedrooms &&
      (
        preferredBedrooms < 1 ||
        preferredBedrooms > 20
      )
    ) {
      return res.status(400).json({
        message: "Preferred BHK is invalid.",
      });
    }

    await db.query(
      `
        INSERT INTO buyer_preferences (
          buyer_id,
          preferred_property_type,
          minimum_price,
          maximum_price,
          preferred_city,
          preferred_locality,
          preferred_bedrooms
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          preferred_property_type =
            VALUES(preferred_property_type),
          minimum_price =
            VALUES(minimum_price),
          maximum_price =
            VALUES(maximum_price),
          preferred_city =
            VALUES(preferred_city),
          preferred_locality =
            VALUES(preferred_locality),
          preferred_bedrooms =
            VALUES(preferred_bedrooms),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        buyerId,
        preferredPropertyType,
        minimumPrice,
        maximumPrice,
        preferredCity,
        preferredLocality,
        preferredBedrooms,
      ],
    );

    const [rows] = await db.query(
      `
        SELECT *
        FROM buyer_preferences
        WHERE buyer_id = ?
        LIMIT 1
      `,
      [buyerId],
    );

    res.json({
      message: "Property preferences updated.",
      preferences: rows[0] || null,
    });
  } catch (error) {
    console.error(
      "Update property preferences error:",
      error,
    );

    res.status(500).json({
      message: "Could not update property preferences.",
    });
  }
};

function requireAdmin(req, res) {
  const userId = getUserId(req);
  const role = String(
    req.user?.role || "",
  ).trim().toLowerCase();

  if (!userId) {
    res.status(401).json({
      message: "Please login to continue.",
    });

    return null;
  }

  if (role !== "admin") {
    res.status(403).json({
      message: "Admin access required.",
    });

    return null;
  }

  return userId;
}

async function buildBuyerRecommendationProfile(
  buyerId,
) {
  const [activities] = await db.query(
    `
      SELECT
        property_id,
        property_type,
        property_price,
        city,
        locality,
        bedrooms,
        score,
        created_at
      FROM buyer_activity
      WHERE buyer_id = ?
      ORDER BY created_at DESC
      LIMIT 500
    `,
    [buyerId],
  );

  const profile =
    calculatePreferenceProfile(activities);

  const [preferenceRows] = await db.query(
    `
      SELECT
        preferred_property_type,
        minimum_price,
        maximum_price,
        preferred_city,
        preferred_locality,
        preferred_bedrooms,
        personalization_enabled
      FROM buyer_preferences
      WHERE buyer_id = ?
      LIMIT 1
    `,
    [buyerId],
  );

  const saved = preferenceRows[0] || {};

  if (
    saved.personalization_enabled !== undefined &&
    !Boolean(saved.personalization_enabled)
  ) {
    return null;
  }

  if (saved.preferred_property_type) {
    profile.preferredType = normalizeText(
      saved.preferred_property_type,
    );
  }

  if (
    saved.preferred_locality ||
    saved.preferred_city
  ) {
    profile.preferredLocation = normalizeText(
      saved.preferred_locality ||
        saved.preferred_city,
    );
  }

  if (saved.preferred_bedrooms) {
    profile.preferredBedrooms = Number(
      saved.preferred_bedrooms,
    );
  }

  if (
    saved.minimum_price &&
    saved.maximum_price
  ) {
    profile.minimumPrice = Number(
      saved.minimum_price,
    );

    profile.maximumPrice = Number(
      saved.maximum_price,
    );

    profile.averagePrice =
      (
        profile.minimumPrice +
        profile.maximumPrice
      ) / 2;
  }

  return profile;
}

exports.createMatchesForVerifiedProperty =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const propertyId = Number(
        req.params.propertyId,
      );

      if (!propertyId) {
        return res.status(400).json({
          message: "Invalid property.",
        });
      }

      const [propertyRows] = await db.query(
        `
          SELECT *
          FROM properties
          WHERE property_id = ?
            AND status = 'verified'
          LIMIT 1
        `,
        [propertyId],
      );

      if (!propertyRows.length) {
        return res.status(404).json({
          message:
            "Verified property not found.",
        });
      }

      const property = propertyData(
        propertyRows[0],
      );

      const [buyers] = await db.query(
        `
          SELECT
            user_id,
            name,
            email,
            phone
          FROM users
          WHERE LOWER(role) = 'buyer'
        `,
      );

      let checkedBuyers = 0;
      let createdAlerts = 0;
      let skippedBuyers = 0;

      for (const buyer of buyers) {
        const buyerId = Number(
          buyer.user_id,
        );

        if (!buyerId) continue;

        const [hiddenRows] = await db.query(
          `
            SELECT feedback_id
            FROM buyer_property_feedback
            WHERE buyer_id = ?
              AND property_id = ?
              AND feedback_type =
                'not_interested'
            LIMIT 1
          `,
          [buyerId, propertyId],
        );

        if (hiddenRows.length) {
          skippedBuyers += 1;
          continue;
        }

        const profile =
          await buildBuyerRecommendationProfile(
            buyerId,
          );

        if (!profile) {
          skippedBuyers += 1;
          continue;
        }

        checkedBuyers += 1;

        const match = scoreProperty(
          property,
          profile,
        );

        /*
         * Alert only buyers with a useful match.
         */
        if (match.score < 35) {
          continue;
        }

        const propertyTitle =
          property.title ||
          "New Matching Property";

        const location =
          [
            property.locality,
            property.city,
          ]
            .filter(Boolean)
            .join(", ") ||
          "your preferred area";

        const firstReason =
          match.reasons[0] ||
          "This property matches your preferences";

        const message =
          `${firstReason}. New verified property available in ${location}.`;

        const [insertResult] =
          await db.query(
            `
              INSERT IGNORE INTO buyer_notifications (
                buyer_id,
                property_id,
                notification_type,
                title,
                message,
                recommendation_score
              )
              VALUES (
                ?,
                ?,
                'property_match',
                ?,
                ?,
                ?
              )
            `,
            [
              buyerId,
              propertyId,
              propertyTitle,
              message,
              match.score,
            ],
          );

        if (insertResult.affectedRows > 0) {
          createdAlerts += 1;
        }
      }

      let emailResult = {
        sent: 0,
        failed: 0,
      };

      /*
       * Property match notifications are created first.
       * When at least one new alert is created, immediately
       * prepare and send pending property-alert emails.
       *
       * The 5-minute scheduler remains active as a backup.
       */
      if (createdAlerts > 0) {
        try {
          emailResult =
            await runEmailNotificationWorker();
        } catch (emailError) {
          console.error(
            "Immediate property email error:",
            emailError,
          );
        }
      }

      res.json({
        message:
          createdAlerts > 0
            ? `${createdAlerts} buyer match alerts created.`
            : "No new buyer match alerts were required.",

        property_id: propertyId,
        checked_buyers: checkedBuyers,
        created_alerts: createdAlerts,
        skipped_buyers: skippedBuyers,

        email_delivery: {
          sent: Number(emailResult?.sent || 0),
          failed: Number(emailResult?.failed || 0),
        },
      });
    } catch (error) {
      console.error(
        "Verified property match error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not create buyer property matches.",
      });
    }
  };


exports.getNotificationControlOverview =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const [notificationCounts] = await db.query(
        `
          SELECT
            COUNT(*) AS total,
            SUM(is_read = 0) AS unread,
            SUM(is_read = 1) AS read_count
          FROM buyer_notifications
        `,
      );

      const [deliveryCounts] = await db.query(
        `
          SELECT
            SUM(delivery_status = 'pending') AS pending,
            SUM(delivery_status = 'sent') AS sent,
            SUM(delivery_status = 'failed') AS failed
          FROM notification_deliveries
          WHERE channel = 'email'
        `,
      );

      const [marketingCounts] = await db.query(
        `
          SELECT
            SUM(delivery_status = 'pending') AS pending,
            SUM(delivery_status = 'sent') AS sent,
            SUM(delivery_status = 'failed') AS failed
          FROM marketing_email_campaigns
        `,
      );

      const [recentDeliveries] = await db.query(
        `
          SELECT
            delivery.delivery_id,
            delivery.recipient,
            delivery.delivery_status,
            delivery.error_message,
            delivery.sent_at,
            delivery.created_at,
            notification.title
          FROM notification_deliveries delivery
          INNER JOIN buyer_notifications notification
            ON notification.notification_id =
              delivery.notification_id
          WHERE delivery.channel = 'email'
          ORDER BY delivery.delivery_id DESC
          LIMIT 20
        `,
      );

      const [recentCampaigns] = await db.query(
        `
          SELECT
            campaign.campaign_id,
            campaign.recipient,
            campaign.subject,
            campaign.activity_score,
            campaign.delivery_status,
            campaign.error_message,
            campaign.sent_at,
            campaign.created_at,
            user.name AS buyer_name
          FROM marketing_email_campaigns campaign
          LEFT JOIN users user
            ON user.user_id = campaign.buyer_id
          ORDER BY campaign.campaign_id DESC
          LIMIT 20
        `,
      );

      res.json({
        website_notifications: {
          total: Number(
            notificationCounts[0]?.total || 0,
          ),
          unread: Number(
            notificationCounts[0]?.unread || 0,
          ),
          read: Number(
            notificationCounts[0]?.read_count || 0,
          ),
        },

        property_alert_emails: {
          pending: Number(
            deliveryCounts[0]?.pending || 0,
          ),
          sent: Number(
            deliveryCounts[0]?.sent || 0,
          ),
          failed: Number(
            deliveryCounts[0]?.failed || 0,
          ),
        },

        marketing_emails: {
          pending: Number(
            marketingCounts[0]?.pending || 0,
          ),
          sent: Number(
            marketingCounts[0]?.sent || 0,
          ),
          failed: Number(
            marketingCounts[0]?.failed || 0,
          ),
        },

        recent_deliveries: recentDeliveries,
        recent_campaigns: recentCampaigns,
      });
    } catch (error) {
      console.error(
        "Notification overview error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not load notification overview.",
      });
    }
  };

exports.runNotificationWorkersNow =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const [
        propertyAlertResult,
        marketingResult,
      ] = await Promise.all([
        runEmailNotificationWorker(),
        runBehaviorMarketingWorker(),
      ]);

      res.json({
        message:
          "Notification workers completed.",

        property_alerts: {
          sent: Number(
            propertyAlertResult?.sent || 0,
          ),
          failed: Number(
            propertyAlertResult?.failed || 0,
          ),
        },

        marketing: {
          created: Number(
            marketingResult?.created || 0,
          ),
          sent: Number(
            marketingResult?.sent || 0,
          ),
          failed: Number(
            marketingResult?.failed || 0,
          ),
        },
      });
    } catch (error) {
      console.error(
        "Manual notification worker error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not run notification workers.",
      });
    }
  };

exports.updateMarketingEmailSettings =
  async (req, res) => {
    try {
      const buyerId = requireBuyer(req, res);

      if (!buyerId) return;

      const enabled =
        req.body.marketing_emails_enabled === false
          ? 0
          : 1;

      const frequency = String(
        req.body.marketing_email_frequency ||
          "daily",
      )
        .trim()
        .toLowerCase();

      const allowedFrequencies = [
        "daily",
        "three_days",
        "weekly",
      ];

      if (
        !allowedFrequencies.includes(frequency)
      ) {
        return res.status(400).json({
          message:
            "Invalid marketing email frequency.",
        });
      }

      await db.query(
        `
          INSERT INTO buyer_preferences (
            buyer_id,
            marketing_emails_enabled,
            marketing_email_frequency
          )
          VALUES (?, ?, ?)

          ON DUPLICATE KEY UPDATE
            marketing_emails_enabled =
              VALUES(marketing_emails_enabled),

            marketing_email_frequency =
              VALUES(marketing_email_frequency),

            updated_at = CURRENT_TIMESTAMP
        `,
        [
          buyerId,
          enabled,
          frequency,
        ],
      );

      res.json({
        message:
          "Marketing email settings updated.",

        settings: {
          marketing_emails_enabled:
            Boolean(enabled),

          marketing_email_frequency:
            frequency,
        },
      });
    } catch (error) {
      console.error(
        "Marketing email settings error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not update marketing email settings.",
      });
    }
  };

exports.unsubscribeMarketingEmails =
  async (req, res) => {
    try {
      const token = String(
        req.params.token || "",
      ).trim();

      if (!token || token.length < 20) {
        return res.status(400).json({
          message: "Invalid unsubscribe link.",
        });
      }

      const [result] = await db.query(
        `
          UPDATE buyer_preferences
          SET
            marketing_emails_enabled = 0,
            updated_at = CURRENT_TIMESTAMP
          WHERE marketing_unsubscribe_token = ?
        `,
        [token],
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          message:
            "This unsubscribe link is invalid or expired.",
        });
      }

      res.json({
        message:
          "Personalized marketing emails have been turned off.",
      });
    } catch (error) {
      console.error(
        "Marketing unsubscribe error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not update your email preference.",
      });
    }
  };


exports.sendAdminTestEmail = async (req, res) => {
  try {
    const adminId = requireAdmin(req, res);

    if (!adminId) return;

    const recipient = String(
      req.body.recipient || "",
    )
      .trim()
      .toLowerCase();

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(recipient)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      return res.status(500).json({
        message: "SMTP email settings are not configured.",
      });
    }

    const transporter =
      nodemailer.createTransport({
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

    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER,

      to: recipient,

      subject:
        "SmartEstate Notification System Test",

      text: [
        "SmartEstate email system is working.",
        "",
        "This test email was sent from the Admin Notification Control Center.",
        "",
        `Sent at: ${new Date().toISOString()}`,
      ].join("\n"),

      html: `
        <div style="
          max-width:600px;
          margin:auto;
          padding:24px;
          font-family:Arial,sans-serif;
          color:#0f172a;
        ">
          <div style="
            padding:26px;
            border-radius:20px;
            background:#020617;
            color:white;
          ">
            <div style="
              color:#93c5fd;
              font-size:12px;
              font-weight:700;
            ">
              SMART ESTATE
            </div>

            <h1 style="margin:10px 0 0">
              Email System Test
            </h1>
          </div>

          <div style="padding:24px 4px">
            <p style="line-height:1.7">
              Your SmartEstate notification email
              system is connected and working.
            </p>

            <div style="
              margin-top:20px;
              padding:18px;
              border-radius:14px;
              background:#ecfdf5;
              color:#047857;
              font-weight:700;
            ">
              Email delivery test successful.
            </div>

            <p style="
              margin-top:24px;
              font-size:12px;
              color:#64748b;
            ">
              This email was sent from the Admin
              Notification Control Center.
            </p>
          </div>
        </div>
      `,
    });

    res.json({
      message:
        `Test email successfully sent to ${recipient}.`,
    });
  } catch (error) {
    console.error(
      "Admin test email error:",
      error,
    );

    res.status(500).json({
      message:
        error.message ||
        "Could not send test email.",
    });
  }
};

exports.retryFailedNotificationEmails =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const [propertyReset] = await db.query(
        `
          UPDATE notification_deliveries
          SET
            delivery_status = 'pending',
            error_message = NULL
          WHERE channel = 'email'
            AND delivery_status = 'failed'
        `,
      );

      const [marketingReset] = await db.query(
        `
          UPDATE marketing_email_campaigns
          SET
            delivery_status = 'pending',
            error_message = NULL
          WHERE delivery_status = 'failed'
        `,
      );

      const [
        propertyResult,
        marketingResult,
      ] = await Promise.all([
        runEmailNotificationWorker(),
        runBehaviorMarketingWorker(),
      ]);

      res.json({
        message:
          "Failed emails were processed again.",

        reset: {
          property_alerts:
            Number(propertyReset.affectedRows || 0),

          marketing:
            Number(marketingReset.affectedRows || 0),
        },

        result: {
          property_sent:
            Number(propertyResult?.sent || 0),

          property_failed:
            Number(propertyResult?.failed || 0),

          marketing_sent:
            Number(marketingResult?.sent || 0),

          marketing_failed:
            Number(marketingResult?.failed || 0),
        },
      });
    } catch (error) {
      console.error(
        "Retry failed emails error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not retry failed emails.",
      });
    }
  };

exports.getEmailAutomationStatus =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const [rows] = await db.query(
        `
          SELECT
            setting_value,
            updated_at
          FROM system_settings
          WHERE setting_key =
            'email_automation_enabled'
          LIMIT 1
        `,
      );

      const enabled =
        String(
          rows[0]?.setting_value ?? "1",
        ) === "1";

      res.json({
        email_automation_enabled: enabled,
        updated_at:
          rows[0]?.updated_at || null,
      });
    } catch (error) {
      console.error(
        "Email automation status error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not load email automation status.",
      });
    }
  };

exports.updateEmailAutomationStatus =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const enabled =
        req.body.email_automation_enabled ===
        true;

      await db.query(
        `
          INSERT INTO system_settings (
            setting_key,
            setting_value,
            updated_by
          )
          VALUES (
            'email_automation_enabled',
            ?,
            ?
          )

          ON DUPLICATE KEY UPDATE
            setting_value =
              VALUES(setting_value),

            updated_by =
              VALUES(updated_by),

            updated_at =
              CURRENT_TIMESTAMP
        `,
        [
          enabled ? "1" : "0",
          adminId,
        ],
      );

      res.json({
        message: enabled
          ? "Automatic email delivery resumed."
          : "Automatic email delivery paused.",

        email_automation_enabled:
          enabled,
      });
    } catch (error) {
      console.error(
        "Email automation update error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not update email automation.",
      });
    }
  };

function escapeCsvValue(value) {
  const safeValue = String(
    value === null || value === undefined
      ? ""
      : value,
  );

  return `"${safeValue.replace(/"/g, '""')}"`;
}

exports.downloadEmailDeliveryReport =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const reportType = String(
        req.query.type || "all",
      )
        .trim()
        .toLowerCase();

      const allowedTypes = [
        "all",
        "property",
        "marketing",
      ];

      if (!allowedTypes.includes(reportType)) {
        return res.status(400).json({
          message: "Invalid report type.",
        });
      }

      const rows = [];

      if (
        reportType === "all" ||
        reportType === "property"
      ) {
        const [propertyEmails] = await db.query(
          `
            SELECT
              'Property Alert' AS email_type,
              user.name AS buyer_name,
              delivery.recipient,
              notification.title AS subject,
              delivery.delivery_status,
              NULL AS activity_score,
              delivery.created_at,
              delivery.sent_at,
              delivery.error_message
            FROM notification_deliveries delivery

            INNER JOIN buyer_notifications notification
              ON notification.notification_id =
                delivery.notification_id

            LEFT JOIN users user
              ON user.user_id =
                notification.buyer_id

            WHERE delivery.channel = 'email'

            ORDER BY delivery.created_at DESC
          `,
        );

        rows.push(...propertyEmails);
      }

      if (
        reportType === "all" ||
        reportType === "marketing"
      ) {
        const [marketingEmails] = await db.query(
          `
            SELECT
              'Personalized Marketing' AS email_type,
              user.name AS buyer_name,
              campaign.recipient,
              campaign.subject,
              campaign.delivery_status,
              campaign.activity_score,
              campaign.created_at,
              campaign.sent_at,
              campaign.error_message
            FROM marketing_email_campaigns campaign

            LEFT JOIN users user
              ON user.user_id =
                campaign.buyer_id

            ORDER BY campaign.created_at DESC
          `,
        );

        rows.push(...marketingEmails);
      }

      rows.sort((first, second) => {
        return (
          new Date(second.created_at || 0) -
          new Date(first.created_at || 0)
        );
      });

      const header = [
        "Email Type",
        "Buyer Name",
        "Recipient",
        "Subject",
        "Status",
        "Activity Score",
        "Created At",
        "Sent At",
        "Error Message",
      ];

      const csvLines = [
        header.map(escapeCsvValue).join(","),
      ];

      for (const row of rows) {
        csvLines.push(
          [
            row.email_type,
            row.buyer_name,
            row.recipient,
            row.subject,
            row.delivery_status,
            row.activity_score,
            row.created_at,
            row.sent_at,
            row.error_message,
          ]
            .map(escapeCsvValue)
            .join(","),
        );
      }

      const datePart = new Date()
        .toISOString()
        .slice(0, 10);

      const fileName =
        `smartestate-email-report-${reportType}-${datePart}.csv`;

      res.setHeader(
        "Content-Type",
        "text/csv; charset=utf-8",
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );

      /*
       * UTF-8 BOM helps Microsoft Excel
       * display names and special characters correctly.
       */
      res.send(
        "\uFEFF" + csvLines.join("\n"),
      );
    } catch (error) {
      console.error(
        "Email delivery report error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not create email delivery report.",
      });
    }
  };

exports.getAdminHotBuyerLeads =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const requestedDays = Number(
        req.query.days || 30,
      );

      const days = [7, 30, 90].includes(
        requestedDays,
      )
        ? requestedDays
        : 30;

      const limit = Math.min(
        Math.max(
          Number(req.query.limit || 50),
          1,
        ),
        100,
      );

      const [buyers] = await db.query(
        `
          SELECT
            user.user_id AS buyer_id,
            user.name AS buyer_name,
            user.email,

            MAX(activity.created_at)
              AS last_active_at,

            COUNT(activity.activity_id)
              AS total_actions,

            COUNT(
              DISTINCT activity.property_id
            ) AS explored_properties,

            SUM(
              activity.action_type = 'view'
            ) AS views,

            SUM(
              activity.action_type = 'details'
            ) AS details_opened,

            SUM(
              activity.action_type = 'search'
            ) AS searches,

            SUM(
              activity.action_type = 'save'
            ) AS saved_properties,

            SUM(
              activity.action_type = 'compare'
            ) AS comparisons,

            SUM(
              activity.action_type = 'site_visit'
            ) AS site_visits,

            SUM(
              activity.action_type = 'price_talk'
            ) AS price_talks,

            SUM(
              activity.action_type = 'interest'
            ) AS interests,

            SUM(
              CASE
                WHEN activity.action_type = 'view'
                  THEN 1

                WHEN activity.action_type = 'details'
                  THEN 2

                WHEN activity.action_type = 'search'
                  THEN 2

                WHEN activity.action_type = 'save'
                  THEN 5

                WHEN activity.action_type = 'compare'
                  THEN 6

                WHEN activity.action_type = 'site_visit'
                  THEN 14

                WHEN activity.action_type = 'price_talk'
                  THEN 16

                WHEN activity.action_type = 'interest'
                  THEN 18

                ELSE 0
              END
            ) AS intent_score

          FROM users user

          INNER JOIN buyer_activity activity
            ON activity.buyer_id = user.user_id

          WHERE LOWER(user.role) = 'buyer'

            AND activity.action_type <> 'visit'

            AND activity.created_at >=
              DATE_SUB(
                NOW(),
                INTERVAL ${days} DAY
              )

          GROUP BY
            user.user_id,
            user.name,
            user.email

          HAVING intent_score > 0

          ORDER BY
            intent_score DESC,
            last_active_at DESC

          LIMIT ${limit}
        `,
      );

      const normalizedBuyers = buyers.map(
        (buyer) => {
          const score = Number(
            buyer.intent_score || 0,
          );

          let leadLevel = "Warm";

          if (score >= 60) {
            leadLevel = "Hot";
          } else if (score < 25) {
            leadLevel = "New";
          }

          return {
            ...buyer,

            buyer_id: Number(
              buyer.buyer_id,
            ),

            total_actions: Number(
              buyer.total_actions || 0,
            ),

            explored_properties: Number(
              buyer.explored_properties || 0,
            ),

            views: Number(
              buyer.views || 0,
            ),

            details_opened: Number(
              buyer.details_opened || 0,
            ),

            searches: Number(
              buyer.searches || 0,
            ),

            saved_properties: Number(
              buyer.saved_properties || 0,
            ),

            comparisons: Number(
              buyer.comparisons || 0,
            ),

            site_visits: Number(
              buyer.site_visits || 0,
            ),

            price_talks: Number(
              buyer.price_talks || 0,
            ),

            interests: Number(
              buyer.interests || 0,
            ),

            intent_score: score,
            lead_level: leadLevel,
          };
        },
      );

      const summary = {
        total: normalizedBuyers.length,

        hot: normalizedBuyers.filter(
          (buyer) =>
            buyer.lead_level === "Hot",
        ).length,

        warm: normalizedBuyers.filter(
          (buyer) =>
            buyer.lead_level === "Warm",
        ).length,

        new: normalizedBuyers.filter(
          (buyer) =>
            buyer.lead_level === "New",
        ).length,
      };

      res.json({
        period_days: days,
        summary,
        buyers: normalizedBuyers,
      });
    } catch (error) {
      console.error(
        "Admin hot buyer leads error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not load buyer leads.",
      });
    }
  };

const allowedBuyerLeadStatuses = [
  "new",
  "contacted",
  "site_visit_planned",
  "negotiating",
  "converted",
  "not_interested",
];

exports.getBuyerLeadFollowup =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const buyerId = Number(
        req.params.buyerId,
      );

      if (!buyerId) {
        return res.status(400).json({
          message: "Invalid buyer.",
        });
      }

      const [rows] = await db.query(
        `
          SELECT
            followup_id,
            buyer_id,
            lead_status,
            admin_note,
            followup_date,
            assigned_admin_id,
            last_contacted_at,
            created_at,
            updated_at
          FROM buyer_lead_followups
          WHERE buyer_id = ?
          LIMIT 1
        `,
        [buyerId],
      );

      res.json({
        followup:
          rows[0] || {
            buyer_id: buyerId,
            lead_status: "new",
            admin_note: "",
            followup_date: null,
            assigned_admin_id: null,
            last_contacted_at: null,
          },
      });
    } catch (error) {
      console.error(
        "Buyer lead follow-up load error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not load lead follow-up.",
      });
    }
  };

exports.updateBuyerLeadFollowup =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const buyerId = Number(
        req.params.buyerId,
      );

      if (!buyerId) {
        return res.status(400).json({
          message: "Invalid buyer.",
        });
      }

      const status = String(
        req.body.lead_status || "new",
      )
        .trim()
        .toLowerCase();

      if (
        !allowedBuyerLeadStatuses.includes(
          status,
        )
      ) {
        return res.status(400).json({
          message: "Invalid lead status.",
        });
      }

      const adminNote = String(
        req.body.admin_note || "",
      )
        .trim()
        .slice(0, 5000);

      const rawFollowupDate =
        req.body.followup_date;

      let followupDate = null;

      if (rawFollowupDate) {
        const parsedDate = new Date(
          rawFollowupDate,
        );

        if (
          Number.isNaN(parsedDate.getTime())
        ) {
          return res.status(400).json({
            message:
              "Invalid follow-up date.",
          });
        }

        followupDate = parsedDate;
      }

      const contactedStatuses = [
        "contacted",
        "site_visit_planned",
        "negotiating",
        "converted",
      ];

      await db.query(
        `
          INSERT INTO buyer_lead_followups (
            buyer_id,
            lead_status,
            admin_note,
            followup_date,
            assigned_admin_id,
            last_contacted_at
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            CASE
              WHEN ? = 1 THEN NOW()
              ELSE NULL
            END
          )

          ON DUPLICATE KEY UPDATE
            lead_status =
              VALUES(lead_status),

            admin_note =
              VALUES(admin_note),

            followup_date =
              VALUES(followup_date),

            assigned_admin_id =
              VALUES(assigned_admin_id),

            last_contacted_at =
              CASE
                WHEN ? = 1
                  THEN NOW()
                ELSE last_contacted_at
              END,

            updated_at =
              CURRENT_TIMESTAMP
        `,
        [
          buyerId,
          status,
          adminNote || null,
          followupDate,
          adminId,
          contactedStatuses.includes(status)
            ? 1
            : 0,
          contactedStatuses.includes(status)
            ? 1
            : 0,
        ],
      );

      const [rows] = await db.query(
        `
          SELECT
            followup_id,
            buyer_id,
            lead_status,
            admin_note,
            followup_date,
            assigned_admin_id,
            last_contacted_at,
            created_at,
            updated_at
          FROM buyer_lead_followups
          WHERE buyer_id = ?
          LIMIT 1
        `,
        [buyerId],
      );

      res.json({
        message:
          "Buyer lead follow-up saved.",

        followup: rows[0],
      });
    } catch (error) {
      console.error(
        "Buyer lead follow-up update error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not save lead follow-up.",
      });
    }
  };

exports.getAdminDueLeadFollowups =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const [rows] = await db.query(
        `
          SELECT
            followup.followup_id,
            followup.buyer_id,
            followup.lead_status,
            followup.admin_note,
            followup.followup_date,
            followup.last_contacted_at,
            followup.updated_at,
            user.name AS buyer_name,
            user.email AS buyer_email,

            CASE
              WHEN followup.followup_date < NOW()
                THEN 'overdue'

              WHEN DATE(followup.followup_date) =
                CURDATE()
                THEN 'today'

              ELSE 'upcoming'
            END AS due_status

          FROM buyer_lead_followups followup

          INNER JOIN users user
            ON user.user_id =
              followup.buyer_id

          WHERE followup.followup_date
            IS NOT NULL

            AND followup.lead_status
              NOT IN (
                'converted',
                'not_interested'
              )

            AND followup.followup_date <=
              DATE_ADD(
                NOW(),
                INTERVAL 3 DAY
              )

          ORDER BY
            followup.followup_date ASC

          LIMIT 100
        `,
      );

      const reminders = rows.map(
        (row) => ({
          ...row,

          followup_id: Number(
            row.followup_id,
          ),

          buyer_id: Number(
            row.buyer_id,
          ),
        }),
      );

      res.json({
        summary: {
          total: reminders.length,

          overdue: reminders.filter(
            (item) =>
              item.due_status === "overdue",
          ).length,

          today: reminders.filter(
            (item) =>
              item.due_status === "today",
          ).length,

          upcoming: reminders.filter(
            (item) =>
              item.due_status === "upcoming",
          ).length,
        },

        reminders,
      });
    } catch (error) {
      console.error(
        "Due follow-up reminders error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not load follow-up reminders.",
      });
    }
  };

exports.getAdminLeadPipeline =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const [rows] = await db.query(
        `
          SELECT
            user.user_id AS buyer_id,
            user.name AS buyer_name,
            user.email,

            COALESCE(
              followup.lead_status,
              'new'
            ) AS lead_status,

            followup.admin_note,
            followup.followup_date,
            followup.last_contacted_at,
            followup.updated_at,

            MAX(activity.created_at)
              AS last_active_at,

            COUNT(activity.activity_id)
              AS total_actions,

            COUNT(
              DISTINCT activity.property_id
            ) AS explored_properties,

            SUM(
              CASE
                WHEN activity.action_type = 'view'
                  THEN 1
                WHEN activity.action_type = 'details'
                  THEN 2
                WHEN activity.action_type = 'search'
                  THEN 2
                WHEN activity.action_type = 'save'
                  THEN 5
                WHEN activity.action_type = 'compare'
                  THEN 6
                WHEN activity.action_type = 'site_visit'
                  THEN 14
                WHEN activity.action_type = 'price_talk'
                  THEN 16
                WHEN activity.action_type = 'interest'
                  THEN 18
                ELSE 0
              END
            ) AS intent_score

          FROM users user

          INNER JOIN buyer_activity activity
            ON activity.buyer_id = user.user_id

          LEFT JOIN buyer_lead_followups followup
            ON followup.buyer_id = user.user_id

          WHERE LOWER(user.role) = 'buyer'

            AND activity.action_type <> 'visit'

            AND activity.created_at >=
              DATE_SUB(
                NOW(),
                INTERVAL 90 DAY
              )

          GROUP BY
            user.user_id,
            user.name,
            user.email,
            followup.lead_status,
            followup.admin_note,
            followup.followup_date,
            followup.last_contacted_at,
            followup.updated_at

          HAVING intent_score > 0

          ORDER BY
            intent_score DESC,
            last_active_at DESC
        `,
      );

      const allowedStatuses = [
        "new",
        "contacted",
        "site_visit_planned",
        "negotiating",
        "converted",
        "not_interested",
      ];

      const pipeline = {};

      for (const status of allowedStatuses) {
        pipeline[status] = [];
      }

      for (const row of rows) {
        const status =
          allowedStatuses.includes(
            row.lead_status,
          )
            ? row.lead_status
            : "new";

        pipeline[status].push({
          buyer_id: Number(row.buyer_id),
          buyer_name:
            row.buyer_name || "Buyer",
          email: row.email,
          lead_status: status,
          admin_note:
            row.admin_note || "",
          followup_date:
            row.followup_date || null,
          last_contacted_at:
            row.last_contacted_at || null,
          last_active_at:
            row.last_active_at || null,
          total_actions: Number(
            row.total_actions || 0,
          ),
          explored_properties: Number(
            row.explored_properties || 0,
          ),
          intent_score: Number(
            row.intent_score || 0,
          ),
        });
      }

      res.json({
        summary: {
          total: rows.length,
          new: pipeline.new.length,
          contacted:
            pipeline.contacted.length,
          site_visit_planned:
            pipeline.site_visit_planned.length,
          negotiating:
            pipeline.negotiating.length,
          converted:
            pipeline.converted.length,
          not_interested:
            pipeline.not_interested.length,
        },

        pipeline,
      });
    } catch (error) {
      console.error(
        "Lead pipeline error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not load lead pipeline.",
      });
    }
  };

exports.getAdminPropertyBuyerInterest =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const requestedDays = Number(
        req.query.days || 30,
      );

      const days = [7, 30, 90].includes(
        requestedDays,
      )
        ? requestedDays
        : 30;

      const [activityRows] = await db.query(
        `
          SELECT
            activity.property_id,
            activity.buyer_id,
            user.name AS buyer_name,
            user.email,

            MAX(activity.created_at)
              AS last_active_at,

            SUM(
              activity.action_type = 'view'
            ) AS views,

            SUM(
              activity.action_type = 'details'
            ) AS details_opened,

            SUM(
              activity.action_type = 'save'
            ) AS saves,

            SUM(
              activity.action_type = 'compare'
            ) AS comparisons,

            SUM(
              activity.action_type = 'site_visit'
            ) AS site_visits,

            SUM(
              activity.action_type = 'price_talk'
            ) AS price_talks,

            SUM(
              activity.action_type = 'interest'
            ) AS interests,

            SUM(
              CASE
                WHEN activity.action_type = 'view'
                  THEN 1
                WHEN activity.action_type = 'details'
                  THEN 2
                WHEN activity.action_type = 'save'
                  THEN 5
                WHEN activity.action_type = 'compare'
                  THEN 6
                WHEN activity.action_type = 'site_visit'
                  THEN 14
                WHEN activity.action_type = 'price_talk'
                  THEN 16
                WHEN activity.action_type = 'interest'
                  THEN 18
                ELSE 0
              END
            ) AS intent_score

          FROM buyer_activity activity

          INNER JOIN users user
            ON user.user_id =
              activity.buyer_id

          WHERE activity.property_id
            IS NOT NULL

            AND activity.action_type
              NOT IN ('visit', 'search')

            AND activity.created_at >=
              DATE_SUB(
                NOW(),
                INTERVAL ${days} DAY
              )

          GROUP BY
            activity.property_id,
            activity.buyer_id,
            user.name,
            user.email

          HAVING intent_score > 0

          ORDER BY
            activity.property_id,
            intent_score DESC
        `,
      );

      const propertyIds = [
        ...new Set(
          activityRows
            .map((row) =>
              Number(row.property_id),
            )
            .filter(Boolean),
        ),
      ];

      if (!propertyIds.length) {
        return res.json({
          period_days: days,

          summary: {
            properties: 0,
            interested_buyers: 0,
            site_visits: 0,
            strong_actions: 0,
          },

          properties: [],
        });
      }

      const placeholders =
        propertyIds.map(() => "?").join(",");

      const [propertyRows] = await db.query(
        `
          SELECT *
          FROM properties
          WHERE property_id IN (
            ${placeholders}
          )
        `,
        propertyIds,
      );

      const propertyMap = new Map(
        propertyRows.map((property) => [
          Number(property.property_id),
          property,
        ]),
      );

      const grouped = new Map();

      for (const row of activityRows) {
        const propertyId = Number(
          row.property_id,
        );

        if (!grouped.has(propertyId)) {
          grouped.set(propertyId, []);
        }

        const score = Number(
          row.intent_score || 0,
        );

        let interestLevel = "New";

        if (score >= 40) {
          interestLevel = "Hot";
        } else if (score >= 15) {
          interestLevel = "Warm";
        }

        grouped.get(propertyId).push({
          buyer_id: Number(row.buyer_id),

          buyer_name:
            row.buyer_name || "Buyer",

          email: row.email,

          last_active_at:
            row.last_active_at,

          views: Number(row.views || 0),

          details_opened: Number(
            row.details_opened || 0,
          ),

          saves: Number(row.saves || 0),

          comparisons: Number(
            row.comparisons || 0,
          ),

          site_visits: Number(
            row.site_visits || 0,
          ),

          price_talks: Number(
            row.price_talks || 0,
          ),

          interests: Number(
            row.interests || 0,
          ),

          intent_score: score,
          interest_level: interestLevel,
        });
      }

      const properties = [];

      for (const [
        propertyId,
        buyers,
      ] of grouped.entries()) {
        const property =
          propertyMap.get(propertyId) || {};

        const totals = buyers.reduce(
          (result, buyer) => ({
            views:
              result.views + buyer.views,

            saves:
              result.saves + buyer.saves,

            comparisons:
              result.comparisons +
              buyer.comparisons,

            site_visits:
              result.site_visits +
              buyer.site_visits,

            price_talks:
              result.price_talks +
              buyer.price_talks,

            interests:
              result.interests +
              buyer.interests,
          }),
          {
            views: 0,
            saves: 0,
            comparisons: 0,
            site_visits: 0,
            price_talks: 0,
            interests: 0,
          },
        );

        properties.push({
          property_id: propertyId,

          title:
            property.title ||
            property.property_title ||
            property.name ||
            `Property #${propertyId}`,

          city:
            property.city || "",

          locality:
            property.locality ||
            property.location ||
            "",

          status:
            property.status || "",

          price: Number(
            property.display_price ||
              property.price ||
              property.seller_price ||
              property.expected_price ||
              0,
          ),

          interested_buyers: buyers.length,

          hot_buyers: buyers.filter(
            (buyer) =>
              buyer.interest_level === "Hot",
          ).length,

          ...totals,

          strong_actions:
            totals.site_visits +
            totals.price_talks +
            totals.interests,

          buyers,
        });
      }

      properties.sort((first, second) => {
        const firstScore =
          first.hot_buyers * 50 +
          first.strong_actions * 20 +
          first.saves * 5 +
          first.views;

        const secondScore =
          second.hot_buyers * 50 +
          second.strong_actions * 20 +
          second.saves * 5 +
          second.views;

        return secondScore - firstScore;
      });

      res.json({
        period_days: days,

        summary: {
          properties: properties.length,

          interested_buyers: properties.reduce(
            (total, property) =>
              total +
              property.interested_buyers,
            0,
          ),

          site_visits: properties.reduce(
            (total, property) =>
              total + property.site_visits,
            0,
          ),

          strong_actions: properties.reduce(
            (total, property) =>
              total +
              property.strong_actions,
            0,
          ),
        },

        properties,
      });
    } catch (error) {
      console.error(
        "Property buyer interest error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not load property buyer interest.",
      });
    }
  };

exports.getAdminAnalyticsDashboard =
  async (req, res) => {
    try {
      const adminId = requireAdmin(req, res);

      if (!adminId) return;

      const requestedDays = Number(
        req.query.days || 30,
      );

      const days = [7, 30, 90].includes(
        requestedDays,
      )
        ? requestedDays
        : 30;

      const [activitySummaryRows] =
        await db.query(
          `
            SELECT
              COUNT(*) AS total_actions,

              COUNT(
                DISTINCT buyer_id
              ) AS active_buyers,

              COUNT(
                DISTINCT property_id
              ) AS active_properties,

              SUM(
                action_type = 'view'
              ) AS views,

              SUM(
                action_type = 'details'
              ) AS details_opened,

              SUM(
                action_type = 'search'
              ) AS searches,

              SUM(
                action_type = 'save'
              ) AS saves,

              SUM(
                action_type = 'compare'
              ) AS comparisons,

              SUM(
                action_type = 'site_visit'
              ) AS site_visits,

              SUM(
                action_type = 'price_talk'
              ) AS price_talks,

              SUM(
                action_type = 'interest'
              ) AS interests

            FROM buyer_activity

            WHERE created_at >=
              DATE_SUB(
                NOW(),
                INTERVAL ${days} DAY
              )

              AND action_type <> 'visit'
          `,
        );

      const activitySummary =
        activitySummaryRows[0] || {};

      const [dailyRows] = await db.query(
        `
          SELECT
            DATE(created_at) AS activity_date,

            COUNT(*) AS total_actions,

            COUNT(
              DISTINCT buyer_id
            ) AS active_buyers,

            SUM(
              action_type = 'view'
            ) AS views,

            SUM(
              action_type IN (
                'save',
                'compare',
                'site_visit',
                'price_talk',
                'interest'
              )
            ) AS strong_actions

          FROM buyer_activity

          WHERE created_at >=
            DATE_SUB(
              NOW(),
              INTERVAL ${days} DAY
            )

            AND action_type <> 'visit'

          GROUP BY DATE(created_at)

          ORDER BY activity_date ASC
        `,
      );

      const [actionRows] = await db.query(
        `
          SELECT
            action_type,
            COUNT(*) AS total

          FROM buyer_activity

          WHERE created_at >=
            DATE_SUB(
              NOW(),
              INTERVAL ${days} DAY
            )

            AND action_type <> 'visit'

          GROUP BY action_type

          ORDER BY total DESC
        `,
      );

      const [locationRows] = await db.query(
        `
          SELECT
            COALESCE(
              NULLIF(TRIM(locality), ''),
              NULLIF(TRIM(city), ''),
              'Unknown Location'
            ) AS location_name,

            COUNT(*) AS total_actions,

            COUNT(
              DISTINCT buyer_id
            ) AS interested_buyers,

            COUNT(
              DISTINCT property_id
            ) AS properties

          FROM buyer_activity

          WHERE created_at >=
            DATE_SUB(
              NOW(),
              INTERVAL ${days} DAY
            )

            AND action_type <> 'visit'

            AND (
              locality IS NOT NULL
              OR city IS NOT NULL
            )

          GROUP BY location_name

          ORDER BY total_actions DESC

          LIMIT 8
        `,
      );

      const [propertyActivityRows] =
        await db.query(
          `
            SELECT
              activity.property_id,

              COUNT(*) AS total_actions,

              COUNT(
                DISTINCT activity.buyer_id
              ) AS interested_buyers,

              SUM(
                activity.action_type = 'view'
              ) AS views,

              SUM(
                activity.action_type = 'save'
              ) AS saves,

              SUM(
                activity.action_type = 'compare'
              ) AS comparisons,

              SUM(
                activity.action_type = 'site_visit'
              ) AS site_visits,

              SUM(
                activity.action_type = 'price_talk'
              ) AS price_talks,

              SUM(
                activity.action_type = 'interest'
              ) AS interests

            FROM buyer_activity activity

            WHERE activity.created_at >=
              DATE_SUB(
                NOW(),
                INTERVAL ${days} DAY
              )

              AND activity.property_id
                IS NOT NULL

              AND activity.action_type
                NOT IN ('visit', 'search')

            GROUP BY activity.property_id

            ORDER BY
              (
                SUM(
                  activity.action_type = 'view'
                )
                +
                SUM(
                  activity.action_type = 'save'
                ) * 5
                +
                SUM(
                  activity.action_type = 'compare'
                ) * 6
                +
                SUM(
                  activity.action_type = 'site_visit'
                ) * 14
                +
                SUM(
                  activity.action_type = 'price_talk'
                ) * 16
                +
                SUM(
                  activity.action_type = 'interest'
                ) * 18
              ) DESC

            LIMIT 10
          `,
        );

      const propertyIds =
        propertyActivityRows
          .map((row) =>
            Number(row.property_id),
          )
          .filter(Boolean);

      let propertyMap = new Map();

      if (propertyIds.length) {
        const placeholders =
          propertyIds
            .map(() => "?")
            .join(",");

        const [propertyRows] =
          await db.query(
            `
              SELECT *
              FROM properties
              WHERE property_id IN (
                ${placeholders}
              )
            `,
            propertyIds,
          );

        propertyMap = new Map(
          propertyRows.map((property) => [
            Number(property.property_id),
            property,
          ]),
        );
      }

      const popularProperties =
        propertyActivityRows.map((row) => {
          const propertyId = Number(
            row.property_id,
          );

          const property =
            propertyMap.get(propertyId) || {};

          return {
            property_id: propertyId,

            title:
              property.title ||
              property.property_title ||
              property.name ||
              `Property #${propertyId}`,

            city:
              property.city || "",

            locality:
              property.locality ||
              property.location ||
              "",

            price: Number(
              property.display_price ||
                property.price ||
                property.seller_price ||
                property.expected_price ||
                0,
            ),

            status:
              property.status || "",

            total_actions: Number(
              row.total_actions || 0,
            ),

            interested_buyers: Number(
              row.interested_buyers || 0,
            ),

            views: Number(
              row.views || 0,
            ),

            saves: Number(
              row.saves || 0,
            ),

            comparisons: Number(
              row.comparisons || 0,
            ),

            site_visits: Number(
              row.site_visits || 0,
            ),

            price_talks: Number(
              row.price_talks || 0,
            ),

            interests: Number(
              row.interests || 0,
            ),
          };
        });

      const [leadRows] = await db.query(
        `
          SELECT
            lead_status,
            COUNT(*) AS total

          FROM buyer_lead_followups

          GROUP BY lead_status
        `,
      );

      const leadPipeline = {
        new: 0,
        contacted: 0,
        site_visit_planned: 0,
        negotiating: 0,
        converted: 0,
        not_interested: 0,
      };

      for (const row of leadRows) {
        if (
          Object.prototype.hasOwnProperty.call(
            leadPipeline,
            row.lead_status,
          )
        ) {
          leadPipeline[row.lead_status] =
            Number(row.total || 0);
        }
      }

      const totalManagedLeads =
        Object.values(leadPipeline).reduce(
          (total, value) =>
            total + Number(value || 0),
          0,
        );

      const conversionRate =
        totalManagedLeads > 0
          ? Number(
              (
                (
                  leadPipeline.converted /
                  totalManagedLeads
                ) * 100
              ).toFixed(1),
            )
          : 0;

      const strongActions =
        Number(
          activitySummary.saves || 0,
        ) +
        Number(
          activitySummary.comparisons || 0,
        ) +
        Number(
          activitySummary.site_visits || 0,
        ) +
        Number(
          activitySummary.price_talks || 0,
        ) +
        Number(
          activitySummary.interests || 0,
        );

      res.json({
        period_days: days,

        summary: {
          total_actions: Number(
            activitySummary.total_actions || 0,
          ),

          active_buyers: Number(
            activitySummary.active_buyers || 0,
          ),

          active_properties: Number(
            activitySummary.active_properties ||
              0,
          ),

          views: Number(
            activitySummary.views || 0,
          ),

          site_visits: Number(
            activitySummary.site_visits || 0,
          ),

          strong_actions: strongActions,

          converted_leads:
            leadPipeline.converted,

          conversion_rate:
            conversionRate,
        },

        daily_activity: dailyRows.map(
          (row) => ({
            activity_date:
              row.activity_date,

            total_actions: Number(
              row.total_actions || 0,
            ),

            active_buyers: Number(
              row.active_buyers || 0,
            ),

            views: Number(
              row.views || 0,
            ),

            strong_actions: Number(
              row.strong_actions || 0,
            ),
          }),
        ),

        action_breakdown: actionRows.map(
          (row) => ({
            action_type:
              row.action_type,

            total: Number(
              row.total || 0,
            ),
          }),
        ),

        popular_locations:
          locationRows.map((row) => ({
            location_name:
              row.location_name,

            total_actions: Number(
              row.total_actions || 0,
            ),

            interested_buyers: Number(
              row.interested_buyers || 0,
            ),

            properties: Number(
              row.properties || 0,
            ),
          })),

        popular_properties:
          popularProperties,

        lead_pipeline: leadPipeline,

        total_managed_leads:
          totalManagedLeads,
      });
    } catch (error) {
      console.error(
        "Admin analytics dashboard error:",
        error,
      );

      res.status(500).json({
        message:
          "Could not load admin analytics.",
      });
    }
  };
