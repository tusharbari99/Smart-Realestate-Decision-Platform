const db = require("../config/db");

const EDITABLE_FIELDS = [
  "title",
  "description",
  "price",
  "property_type",
  "area_sqft",
  "address",
  "city",
  "state",
  "latitude",
  "longitude",
  "known_issues",
  "amenities",
  "needs_3d_shoot",
];

function getUserId(req) {
  const possibleIds = [
    req.user?.user_id,
    req.user?.userId,
    req.user?.id,
    req.user?.sub,
    req.userId,
    req.user_id,
    req.auth?.user_id,
    req.auth?.userId,
    req.auth?.id,
  ];

  for (const value of possibleIds) {
    const numericId = Number(value);

    if (Number.isInteger(numericId) && numericId > 0) {
      return numericId;
    }
  }

  return 0;
}

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function ensureEditRequestTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS property_edit_requests (
      request_id INT NOT NULL AUTO_INCREMENT,
      property_id INT NOT NULL,
      seller_id INT NOT NULL,
      proposed_changes LONGTEXT NOT NULL,
      status ENUM('pending', 'approved', 'rejected')
        NOT NULL DEFAULT 'pending',
      admin_note TEXT NULL,
      reviewed_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL DEFAULT NULL,
      PRIMARY KEY (request_id),
      INDEX idx_edit_property (property_id),
      INDEX idx_edit_seller (seller_id),
      INDEX idx_edit_status (status)
    )
  `);
}

function normaliseChanges(body = {}) {
  const changes = {};

  for (const field of EDITABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      continue;
    }

    let value = body[field];

    if (
      ["price", "area_sqft", "latitude", "longitude"].includes(field)
    ) {
      if (value === "" || value === null || value === undefined) {
        value = null;
      } else {
        value = Number(value);

        if (!Number.isFinite(value)) {
          const error = new Error(`Invalid value for ${field}.`);
          error.statusCode = 400;
          throw error;
        }
      }
    }

    if (field === "price" && (!value || value <= 0)) {
      const error = new Error(
        "Enter a valid seller expected price.",
      );
      error.statusCode = 400;
      throw error;
    }

    if (field === "needs_3d_shoot") {
      value =
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true";
    }

    if (field === "amenities") {
      if (Array.isArray(value)) {
        value = JSON.stringify(
          value
            .map((item) => String(item).trim())
            .filter(Boolean),
        );
      } else if (typeof value === "string") {
        const items = value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        value = JSON.stringify(items);
      } else {
        value = JSON.stringify([]);
      }
    }

    if (typeof value === "string" && field !== "amenities") {
      value = value.trim();
      value = value || null;
    }

    changes[field] = value;
  }

  for (const requiredField of [
    "title",
    "property_type",
    "city",
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(changes, requiredField) &&
      !changes[requiredField]
    ) {
      const error = new Error(
        `${requiredField.replaceAll("_", " ")} is required.`,
      );
      error.statusCode = 400;
      throw error;
    }
  }

  return changes;
}

exports.getSellerPropertyForEdit = async (req, res) => {
  try {
    await ensureEditRequestTable();

    const sellerId = getUserId(req);
    const propertyId = Number(req.params?.id || 0);

    if (!propertyId) {
      return res.status(400).json({
        message: "Property ID is missing. Open the edit page again from Seller Dashboard.",
      });
    }

    if (!sellerId) {
      return res.status(401).json({
        message: "Seller login could not be verified. Please log in again.",
      });
    }

    const [propertyRows] = await db.query(
      `
        SELECT *
        FROM properties
        WHERE property_id = ?
          AND seller_id = ?
        LIMIT 1
      `,
      [propertyId, sellerId],
    );

    if (!propertyRows.length) {
      return res.status(404).json({
        message: "Property not found in your listings.",
      });
    }

    const [requestRows] = await db.query(
      `
        SELECT
          request_id,
          status,
          proposed_changes,
          admin_note,
          created_at,
          reviewed_at
        FROM property_edit_requests
        WHERE property_id = ?
          AND seller_id = ?
        ORDER BY request_id DESC
        LIMIT 1
      `,
      [propertyId, sellerId],
    );

    const latestRequest = requestRows[0]
      ? {
          ...requestRows[0],
          proposed_changes: parseJson(
            requestRows[0].proposed_changes,
            {},
          ),
        }
      : null;

    return res.json({
      property: propertyRows[0],
      latest_request: latestRequest,
    });
  } catch (error) {
    console.error("Get edit property error:", error);

    return res.status(500).json({
      message: "Could not load property details.",
      error: error.message,
    });
  }
};

exports.submitEditRequest = async (req, res) => {
  try {
    await ensureEditRequestTable();

    const sellerId = getUserId(req);
    const propertyId = Number(req.body.property_id);

    if (!sellerId || !propertyId) {
      return res.status(400).json({
        message: "Property ID is required.",
      });
    }

    const [propertyRows] = await db.query(
      `
        SELECT property_id
        FROM properties
        WHERE property_id = ?
          AND seller_id = ?
        LIMIT 1
      `,
      [propertyId, sellerId],
    );

    if (!propertyRows.length) {
      return res.status(404).json({
        message: "Property not found in your listings.",
      });
    }

    const changes = normaliseChanges(
      req.body.changes || {},
    );

    if (!Object.keys(changes).length) {
      return res.status(400).json({
        message: "Enter at least one property change.",
      });
    }

    const [pendingRows] = await db.query(
      `
        SELECT request_id
        FROM property_edit_requests
        WHERE property_id = ?
          AND seller_id = ?
          AND status = 'pending'
        LIMIT 1
      `,
      [propertyId, sellerId],
    );

    let requestId;

    if (pendingRows.length) {
      requestId = pendingRows[0].request_id;

      await db.query(
        `
          UPDATE property_edit_requests
          SET
            proposed_changes = ?,
            admin_note = NULL,
            created_at = CURRENT_TIMESTAMP
          WHERE request_id = ?
        `,
        [JSON.stringify(changes), requestId],
      );
    } else {
      const [result] = await db.query(
        `
          INSERT INTO property_edit_requests (
            property_id,
            seller_id,
            proposed_changes,
            status
          )
          VALUES (?, ?, ?, 'pending')
        `,
        [
          propertyId,
          sellerId,
          JSON.stringify(changes),
        ],
      );

      requestId = result.insertId;
    }

    return res.status(201).json({
      message:
        "Edit request submitted. The changes will appear after admin approval.",
      request: {
        request_id: requestId,
        property_id: propertyId,
        status: "pending",
        proposed_changes: changes,
      },
    });
  } catch (error) {
    console.error("Submit edit request error:", error);

    return res
      .status(error.statusCode || 500)
      .json({
        message:
          error.statusCode === 400
            ? error.message
            : "Could not submit edit request.",
        error: error.message,
      });
  }
};

exports.getSellerRequests = async (req, res) => {
  try {
    await ensureEditRequestTable();

    const sellerId = getUserId(req);

    const [rows] = await db.query(
      `
        SELECT
          r.request_id,
          r.property_id,
          r.status,
          r.proposed_changes,
          r.admin_note,
          r.created_at,
          r.reviewed_at,
          p.title AS property_title
        FROM property_edit_requests r
        INNER JOIN properties p
          ON p.property_id = r.property_id
        WHERE r.seller_id = ?
        ORDER BY r.request_id DESC
      `,
      [sellerId],
    );

    return res.json({
      requests: rows.map((row) => ({
        ...row,
        proposed_changes: parseJson(
          row.proposed_changes,
          {},
        ),
      })),
    });
  } catch (error) {
    console.error("Seller edit requests error:", error);

    return res.status(500).json({
      message: "Could not load edit requests.",
    });
  }
};

exports.getAdminPendingRequests = async (req, res) => {
  try {
    await ensureEditRequestTable();

    const [rows] = await db.query(`
      SELECT
        r.request_id,
        r.property_id,
        r.seller_id,
        r.status,
        r.proposed_changes,
        r.admin_note,
        r.created_at,

        p.title AS current_title,
        p.description AS current_description,
        p.price AS current_price,
        p.property_type AS current_property_type,
        p.area_sqft AS current_area_sqft,
        p.address AS current_address,
        p.city AS current_city,
        p.state AS current_state,
        p.latitude AS current_latitude,
        p.longitude AS current_longitude,
        p.known_issues AS current_known_issues,
        p.amenities AS current_amenities,
        p.needs_3d_shoot AS current_needs_3d_shoot,

        u.name AS seller_name,
        u.email AS seller_email,
        u.phone AS seller_phone

      FROM property_edit_requests r
      INNER JOIN properties p
        ON p.property_id = r.property_id
      INNER JOIN users u
        ON u.user_id = r.seller_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
    `);

    return res.json({
      requests: rows.map((row) => ({
        ...row,
        proposed_changes: parseJson(
          row.proposed_changes,
          {},
        ),
      })),
    });
  } catch (error) {
    console.error("Admin edit requests error:", error);

    return res.status(500).json({
      message: "Could not load property edit requests.",
    });
  }
};

exports.reviewEditRequest = async (req, res) => {
  try {
    await ensureEditRequestTable();

    const requestId = Number(req.params.id);
    const reviewerId = getUserId(req);
    const status = String(req.body.status || "")
      .trim()
      .toLowerCase();
    const adminNote = String(
      req.body.admin_note || "",
    ).trim();

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message:
          "Status must be approved or rejected.",
      });
    }

    const [requestRows] = await db.query(
      `
        SELECT *
        FROM property_edit_requests
        WHERE request_id = ?
        LIMIT 1
      `,
      [requestId],
    );

    if (!requestRows.length) {
      return res.status(404).json({
        message: "Edit request not found.",
      });
    }

    const request = requestRows[0];

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "This edit request is already reviewed.",
      });
    }

    if (status === "approved") {
      const changes = parseJson(
        request.proposed_changes,
        {},
      );

      const approvedFields = Object.keys(changes).filter(
        (field) => EDITABLE_FIELDS.includes(field),
      );

      if (!approvedFields.length) {
        return res.status(400).json({
          message: "No valid property changes found.",
        });
      }

      const assignments = approvedFields
        .map((field) => `${field} = ?`)
        .join(", ");

      const values = approvedFields.map(
        (field) => changes[field],
      );

      values.push(request.property_id);

      await db.query(
        `
          UPDATE properties
          SET ${assignments}
          WHERE property_id = ?
        `,
        values,
      );
    }

    await db.query(
      `
        UPDATE property_edit_requests
        SET
          status = ?,
          admin_note = ?,
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP
        WHERE request_id = ?
      `,
      [
        status,
        adminNote || null,
        reviewerId || null,
        requestId,
      ],
    );

    return res.json({
      message:
        status === "approved"
          ? "Edit request approved and property updated."
          : "Edit request rejected.",
      status,
    });
  } catch (error) {
    console.error("Review edit request error:", error);

    return res.status(500).json({
      message: "Could not review edit request.",
      error: error.message,
    });
  }
};
