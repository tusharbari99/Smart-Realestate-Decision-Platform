const db = require('../config/db');
const { buildAndSaveReport } = require('../utils/intelligence');

exports.getDashboard = async (req, res) => {
  try {
    const [[userCount]] = await db.query('SELECT COUNT(*) AS total_users FROM users');
    const [[propertyCounts]] = await db.query(
      `SELECT COUNT(*) AS total_listings,
              SUM(status = 'pending') AS pending_listings,
              SUM(status = 'verified') AS verified_listings,
              SUM(status = 'rejected') AS rejected_listings
       FROM properties`
    );
    const [[inquiryCount]] = await db.query('SELECT COUNT(*) AS total_inquiries FROM inquiries');
    const [[threeDCount]] = await db.query(
      "SELECT COUNT(*) AS open_3d_requests FROM three_d_requests WHERE status IN ('requested', 'scheduled', 'captured')"
    );
    res.json({
      statistics: { ...userCount, ...propertyCounts, ...inquiryCount, ...threeDCount },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load admin dashboard.', error: err.message });
  }
};

exports.getPendingProperties = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name AS seller_name, u.phone AS seller_phone, u.email AS seller_email
       FROM properties p JOIN users u ON u.user_id = p.seller_id
       WHERE p.status = 'pending' ORDER BY p.updated_at ASC`
    );
    res.json({ properties: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load pending properties.', error: err.message });
  }
};

exports.updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified or rejected.' });
    }
    const [result] = await db.query(
      'UPDATE properties SET status = ? WHERE property_id = ?',
      [status, Number(req.params.id)]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Property not found.' });
    res.json({ message: `Property ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update property status.', error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, name, email, phone, role, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load users.', error: err.message });
  }
};

exports.setUserActiveStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (![true, false, 0, 1, '0', '1'].includes(is_active)) {
      return res.status(400).json({ message: 'is_active must be true or false.' });
    }
    const userId = Number(req.params.id);
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'You cannot deactivate your own admin account.' });
    }
    const [result] = await db.query(
      'UPDATE users SET is_active = ? WHERE user_id = ?',
      [is_active === true || is_active === 1 || is_active === '1' ? 1 : 0, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update user status.', error: err.message });
  }
};

exports.addFacility = async (req, res) => {
  try {
    const { facility_type, facility_name, distance_km } = req.body;
    const validTypes = ['school', 'hospital', 'transport', 'market', 'park', 'other'];
    if (!validTypes.includes(facility_type) || !facility_name) {
      return res.status(400).json({ message: 'Valid facility_type and facility_name are required.' });
    }
    const propertyId = Number(req.params.id);
    const [result] = await db.query(
      `INSERT INTO nearby_facilities (property_id, facility_type, facility_name, distance_km)
       VALUES (?, ?, ?, ?)`,
      [propertyId, facility_type, facility_name, distance_km || null]
    );
    const [properties] = await db.query('SELECT * FROM properties WHERE property_id = ?', [propertyId]);
    if (properties.length > 0) await buildAndSaveReport(properties[0]);
    res.status(201).json({ message: 'Nearby facility added and intelligence refreshed.', facility_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add facility.', error: err.message });
  }
};

exports.update3DRequest = async (req, res) => {
  try {
    const { status, scheduled_at, admin_notes, content_type, content_url, room_label } = req.body;
    const validStatuses = ['requested', 'scheduled', 'captured', 'published', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid 3D request status.' });
    }
    const requestId = Number(req.params.id);
    const [requests] = await db.query('SELECT * FROM three_d_requests WHERE request_id = ?', [requestId]);
    if (requests.length === 0) return res.status(404).json({ message: '3D request not found.' });
    const request = requests[0];
    await db.query(
      `UPDATE three_d_requests
       SET status = ?, scheduled_at = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE request_id = ?`,
      [status, scheduled_at || null, admin_notes || null, requestId]
    );
    if (status === 'published' && content_url) {
      await db.query(
        `INSERT INTO property_3d_content (property_id, content_type, content_url, room_label)
         VALUES (?, ?, ?, ?)`,
        [request.property_id, content_type === '3d_model' ? '3d_model' : '360_tour', content_url, room_label || null]
      );
    }
    res.json({ message: '3D request updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update 3D request.', error: err.message });
  }
};

exports.getInquiries = async (req, res) => {
  try {
    const requestedStatus = String(req.query.status || "").toLowerCase();
    const validStatuses = ["new", "seen", "replied"];

    let query = `
      SELECT
        i.inquiry_id,
        i.message,
        i.status,
        i.created_at,

        p.property_id,
        p.title,
        p.city,
        p.address,
        p.property_type,

        buyer.user_id AS buyer_id,
        buyer.name AS buyer_name,
        buyer.email AS buyer_email,
        buyer.phone AS buyer_phone,

        seller.user_id AS seller_id,
        seller.name AS seller_name,
        seller.email AS seller_email,
        seller.phone AS seller_phone

      FROM inquiries i
      JOIN properties p
        ON p.property_id = i.property_id
      JOIN users buyer
        ON buyer.user_id = i.buyer_id
      JOIN users seller
        ON seller.user_id = p.seller_id
    `;

    const values = [];

    if (requestedStatus) {
      if (!validStatuses.includes(requestedStatus)) {
        return res.status(400).json({
          message: "Status must be new, seen, or replied.",
        });
      }

      query += " WHERE i.status = ? ";
      values.push(requestedStatus);
    }

    query += `
      ORDER BY
        FIELD(i.status, 'new', 'seen', 'replied'),
        i.created_at DESC
    `;

    const [rows] = await db.query(query, values);

    res.json({
      inquiries: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load company inquiries.",
      error: error.message,
    });
  }
};

exports.updateInquiryStatus = async (req, res) => {
  try {
    const inquiryId = Number(req.params.id);
    const status = String(req.body.status || "").toLowerCase();

    const validStatuses = ["new", "seen", "replied"];

    if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
      return res.status(400).json({
        message: "Invalid inquiry ID.",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be new, seen, or replied.",
      });
    }

    const [result] = await db.query(
      "UPDATE inquiries SET status = ? WHERE inquiry_id = ?",
      [status, inquiryId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Inquiry not found.",
      });
    }

    res.json({
      message: "Inquiry status updated.",
      inquiry_id: inquiryId,
      status,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not update inquiry status.",
      error: error.message,
    });
  }
};

exports.get3DRequests = async (req, res) => {
  try {
    const requestedStatus = String(
      req.query.status || "",
    ).toLowerCase();

    const validStatuses = [
      "requested",
      "scheduled",
      "captured",
      "published",
      "cancelled",
    ];

    if (
      requestedStatus &&
      !validStatuses.includes(requestedStatus)
    ) {
      return res.status(400).json({
        message: "Invalid 3D request status.",
      });
    }

    let query = `
      SELECT
        r.request_id,
        r.property_id,
        r.status,
        r.scheduled_at,
        r.seller_notes,
        r.admin_notes,
        r.created_at,
        r.updated_at,

        p.title,
        p.address,
        p.city,
        p.state,
        p.property_type,

        u.user_id AS seller_id,
        u.name AS seller_name,
        u.email AS seller_email,
        u.phone AS seller_phone

      FROM three_d_requests r

      JOIN properties p
        ON p.property_id = r.property_id

      JOIN users u
        ON u.user_id = r.requested_by
    `;

    const values = [];

    if (requestedStatus) {
      query += " WHERE r.status = ? ";
      values.push(requestedStatus);
    }

    query += `
      ORDER BY
        FIELD(
          r.status,
          'requested',
          'scheduled',
          'captured',
          'published',
          'cancelled'
        ),
        r.created_at DESC
    `;

    const [rows] = await db.query(query, values);

    res.json({
      requests: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load 3D requests.",
      error: error.message,
    });
  }
};

exports.getAllProperties = async (req, res) => {
  try {
    const status = String(req.query.status || "").toLowerCase();
    const validStatuses = ["pending", "verified", "rejected"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid property status.",
      });
    }

    let query = `
      SELECT
        p.*,
        u.name AS seller_name,
        u.email AS seller_email,
        u.phone AS seller_phone
      FROM properties p
      JOIN users u
        ON u.user_id = p.seller_id
    `;

    const values = [];

    if (status) {
      query += " WHERE p.verification_status = ? ";
      values.push(status);
    }

    query += " ORDER BY p.created_at DESC ";

    const [rows] = await db.query(query, values);

    res.json({
      properties: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load properties.",
      error: error.message,
    });
  }
};

exports.getSupportMessages = async (req, res) => {
  try {
    const status = String(req.query.status || "").toLowerCase();
    const validStatuses = ["new", "seen", "closed"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid support message status.",
      });
    }

    let query = `
      SELECT
        message_id,
        name,
        phone,
        email,
        message,
        status,
        created_at,
        updated_at
      FROM support_messages
    `;

    const values = [];

    if (status) {
      query += " WHERE status = ? ";
      values.push(status);
    }

    query += `
      ORDER BY
        FIELD(status, 'new', 'seen', 'closed'),
        created_at DESC
    `;

    const [rows] = await db.query(query, values);

    res.json({
      messages: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load support messages.",
    });
  }
};

exports.updateSupportMessage = async (req, res) => {
  try {
    const messageId = Number(req.params.id);
    const status = String(req.body.status || "").toLowerCase();
    const validStatuses = ["new", "seen", "closed"];

    if (!Number.isInteger(messageId) || messageId <= 0) {
      return res.status(400).json({
        message: "Invalid message ID.",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be new, seen, or closed.",
      });
    }

    const [result] = await db.query(
      `
        UPDATE support_messages
        SET status = ?
        WHERE message_id = ?
      `,
      [status, messageId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Support message not found.",
      });
    }

    res.json({
      message: "Support message updated.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not update support message.",
    });
  }
};
