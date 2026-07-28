const db = require('../config/db');
const { buildAndSaveReport } = require('../utils/intelligence');

const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'other'];

const parseBoolean = (value) => value === true || value === 1 || value === '1' || value === 'true';

function publicPrice(price) {
  const sellerPrice = Number(price);
  const min = Math.round(sellerPrice * 1.05);
  const max = Math.round(sellerPrice * 1.10);
  const format = (amount) => `₹${amount.toLocaleString('en-IN')}`;
  return {
    platform_price_min: min,
    platform_price_max: max,
    price_range: `${format(min)} - ${format(max)}`,
  };
}

function parseReport(row) {
  if (!row) return null;
  return {
    growth_score: row.growth_score,
    investment_score: row.investment_score,
    livability_score: row.livability_score,
    risk_score: row.risk_score,
    future_outlook: row.future_outlook,
    summary: row.summary,
    highlights: row.highlights_json ? JSON.parse(row.highlights_json) : [],
    cautions: row.cautions_json ? JSON.parse(row.cautions_json) : [],
    generated_at: row.generated_at,
    data_note: 'This is a rule-based decision-support report. It is not a financial, legal, or safety guarantee.',
  };
}

function toPublicProperty(property) {
  return {
    amenities: (() => {
      if (Array.isArray(property.amenities)) {
        return property.amenities;
      }

      if (!property.amenities) {
        return [];
      }

      try {
        const parsedAmenities = JSON.parse(property.amenities);
        return Array.isArray(parsedAmenities) ? parsedAmenities : [];
      } catch {
        return [];
      }
    })(),

    property_id: property.property_id,
    title: property.title,
    description: property.description,
    known_issues: property.known_issues,
    property_type: property.property_type,
    area_sqft: property.area_sqft,
    address: property.address,
    city: property.city,
    state: property.state,
    latitude: property.latitude,
    longitude: property.longitude,
    growth_tag: property.growth_tag,
    needs_3d_shoot: Boolean(property.needs_3d_shoot),
    primary_image: property.primary_image || null,
    created_at: property.created_at,
    ...publicPrice(property.price),
  };
}

async function getPropertyForReport(propertyId) {
  const [rows] = await db.query('SELECT * FROM properties WHERE property_id = ?', [propertyId]);
  return rows[0] || null;
}

async function readOrCreateReport(property) {
  const [reports] = await db.query(
    'SELECT * FROM property_intelligence WHERE property_id = ?',
    [property.property_id]
  );
  if (reports.length > 0) return parseReport(reports[0]);
  return buildAndSaveReport(property);
}

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(24, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  return { page, limit, offset: (page - 1) * limit };
}

function buildPropertyFilters(query) {
  const conditions = ["p.status = 'verified'"];
  const params = [];

  if (query.q) {
    const keyword =
      `%${String(query.q).trim().toLowerCase()}%`;

    conditions.push(
      `(
        LOWER(COALESCE(p.title, '')) LIKE ?
        OR LOWER(COALESCE(p.description, '')) LIKE ?
        OR LOWER(COALESCE(p.address, '')) LIKE ?
        OR LOWER(COALESCE(p.city, '')) LIKE ?
        OR LOWER(COALESCE(p.state, '')) LIKE ?
      )`
    );

    params.push(
      keyword,
      keyword,
      keyword,
      keyword,
      keyword
    );
  }
  if (query.city) {
    const locationKeyword =
      `%${String(query.city)
        .trim()
        .toLowerCase()}%`;

    conditions.push(
      `(
        LOWER(COALESCE(p.city, '')) LIKE ?
        OR LOWER(COALESCE(p.address, '')) LIKE ?
        OR LOWER(COALESCE(p.title, '')) LIKE ?
      )`
    );

    params.push(
      locationKeyword,
      locationKeyword,
      locationKeyword
    );
  }
  if (
    query.type &&
    PROPERTY_TYPES.includes(
      String(query.type).trim().toLowerCase()
    )
  ) {
    conditions.push(
      'LOWER(p.property_type) = ?'
    );

    params.push(
      String(query.type).trim().toLowerCase()
    );
  }
  if (query.minPrice && Number(query.minPrice) >= 0) {
    conditions.push('(p.price * 1.10) >= ?');
    params.push(Number(query.minPrice));
  }
  if (query.maxPrice && Number(query.maxPrice) >= 0) {
    conditions.push('(p.price * 1.05) <= ?');
    params.push(Number(query.maxPrice));
  }
  if (query.minArea && Number(query.minArea) >= 0) {
    conditions.push('p.area_sqft >= ?');
    params.push(Number(query.minArea));
  }
  return { where: conditions.join(' AND '), params };
}

// Public: verified listings only. Seller price never leaves this response.
exports.getAllProperties = async (req, res) => {
  try {
    const { where, params } = buildPropertyFilters(req.query);
    const { page, limit, offset } = pagination(req.query);
    const sortColumns = {
      newest: 'p.created_at DESC',
      price_low: 'p.price ASC',
      price_high: 'p.price DESC',
      area: 'p.area_sqft DESC',
    };
    const sort = sortColumns[req.query.sort] || sortColumns.newest;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM properties p WHERE ${where}`,
      params
    );
    const [rows] = await db.query(
      `SELECT p.*, image.image_url AS primary_image
       FROM properties p
       LEFT JOIN property_images image
         ON image.property_id = p.property_id AND image.is_primary = 1
       WHERE ${where}
       ORDER BY ${sort}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const total = countRows[0].total;
    res.json({
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
      properties: rows.map(toPublicProperty),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load properties.', error: err.message });
  }
};

exports.getPropertyDetails = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT p.*, image.image_url AS primary_image
       FROM properties p
       LEFT JOIN property_images image
         ON image.property_id = p.property_id AND image.is_primary = 1
       WHERE p.property_id = ? AND p.status = 'verified'`,
      [propertyId]
    );
    const property = rows[0];
    if (!property) return res.status(404).json({ message: 'Verified property not found.' });

    const [images] = await db.query(
      'SELECT image_id, image_url, is_primary FROM property_images WHERE property_id = ? ORDER BY is_primary DESC, uploaded_at DESC',
      [propertyId]
    );
    const [facilities] = await db.query(
      'SELECT facility_id, facility_type, facility_name, distance_km FROM nearby_facilities WHERE property_id = ? ORDER BY distance_km ASC',
      [propertyId]
    );
    const [threeDContent] = await db.query(
      `SELECT content_id, content_type, content_url, room_label
       FROM property_3d_content WHERE property_id = ? ORDER BY created_at DESC`,
      [propertyId]
    );
    const [reviews] = await db.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at, u.name AS buyer_name
       FROM reviews r JOIN users u ON u.user_id = r.buyer_id
       WHERE r.property_id = ? ORDER BY r.created_at DESC`,
      [propertyId]
    );
    const intelligence = await readOrCreateReport(property);

    res.json({
      property: toPublicProperty(property),
      intelligence,
      images,
      nearby_facilities: facilities,
      three_d_content: threeDContent,
      reviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load property details.', error: err.message });
  }
};

exports.getComparison = async (req, res) => {
  try {
    const ids = [...new Set(String(req.query.ids || '').split(',').map(Number).filter(Number.isInteger))];
    if (ids.length < 2 || ids.length > 3) {
      return res.status(400).json({ message: 'Provide 2 or 3 comma-separated property IDs.' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT p.*, image.image_url AS primary_image
       FROM properties p
       LEFT JOIN property_images image ON image.property_id = p.property_id AND image.is_primary = 1
       WHERE p.status = 'verified' AND p.property_id IN (${placeholders})`,
      ids
    );

    const properties = await Promise.all(rows.map(async (property) => ({
      ...toPublicProperty(property),
      intelligence: await readOrCreateReport(property),
    })));
    res.json({ properties });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not compare properties.', error: err.message });
  }
};

// Seller: add a listing after explicitly accepting the display-price terms.
exports.addProperty = async (req, res) => {
  try {
    const {
      title, description, price, property_type, area_sqft,
      amenities, address, city, state,
      latitude, longitude, known_issues, needs_3d_shoot, commission_terms_accepted,
    } = req.body;

    if (!title || !price || !property_type || !city || !parseBoolean(commission_terms_accepted)) {
      return res.status(400).json({
        message: 'Title, price, type, city, and acceptance of the platform price-range terms are required.',
      });
    }
    if (!PROPERTY_TYPES.includes(String(property_type).toLowerCase())) {
      return res.status(400).json({ message: 'Invalid property type.' });
    }

    const sellerId = req.user.userId;

    const normalizedAmenities = Array.isArray(amenities)
      ? [...new Set(
          amenities
            .map((item) => String(item).trim())
            .filter(Boolean)
        )].slice(0, 40)
      : [];

    const normalizedCity = String(city).trim();
    const growthTag = normalizedCity.toLowerCase() === 'pune'
      ? 'High Growth Area (IT Hub Proximity)'
      : 'Location Intelligence Pending';
    const [result] = await db.query(
      `INSERT INTO properties
       (seller_id, title, description, price, property_type, area_sqft, amenities, address, city, state,
        latitude, longitude, known_issues, growth_tag, needs_3d_shoot, commission_terms_accepted, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending')`,
      [
        sellerId, title.trim(), description || null, Number(price), String(property_type).toLowerCase(),
        area_sqft || null,
        JSON.stringify(normalizedAmenities), address || null, normalizedCity, state || null, latitude || null,
        longitude || null, known_issues || null, growthTag, parseBoolean(needs_3d_shoot) ? 1 : 0,
      ]
    );

    const property = await getPropertyForReport(result.insertId);
    await buildAndSaveReport(property);
    if (parseBoolean(needs_3d_shoot)) {
      await db.query(
        `INSERT INTO three_d_requests (property_id, requested_by, status)
         VALUES (?, ?, 'requested')`,
        [result.insertId, sellerId]
      );
    }

    res.status(201).json({
      message: 'Property submitted for admin verification.',
      property_id: result.insertId,
      price_policy: 'Public buyers will see the platform price range, not the seller-entered price.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add property.', error: err.message });
  }
};

exports.getMyProperties = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, image.image_url AS primary_image
       FROM properties p
       LEFT JOIN property_images image ON image.property_id = p.property_id AND image.is_primary = 1
       WHERE p.seller_id = ? ORDER BY p.updated_at DESC`,
      [req.user.userId]
    );
    res.json({ properties: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load seller properties.', error: err.message });
  }
};

exports.updateMyProperty = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const allowed = [
      'title', 'description', 'price', 'property_type', 'area_sqft', 'address', 'city', 'state',
      'latitude', 'longitude', 'known_issues', 'needs_3d_shoot',
    ];
    const changes = allowed.filter((field) => Object.hasOwn(req.body, field));
    if (changes.length === 0) return res.status(400).json({ message: 'No editable fields supplied.' });
    if (req.body.property_type && !PROPERTY_TYPES.includes(String(req.body.property_type).toLowerCase())) {
      return res.status(400).json({ message: 'Invalid property type.' });
    }

    const [ownership] = await db.query(
      'SELECT * FROM properties WHERE property_id = ? AND seller_id = ?',
      [propertyId, req.user.userId]
    );
    if (ownership.length === 0) return res.status(404).json({ message: 'Your property was not found.' });

    const assignments = changes.map((field) => `${field} = ?`).join(', ');
    const values = changes.map((field) => {
      if (field === 'property_type') return String(req.body[field]).toLowerCase();
      if (field === 'needs_3d_shoot') return parseBoolean(req.body[field]) ? 1 : 0;
      return req.body[field];
    });
    await db.query(`UPDATE properties SET ${assignments}, status = 'pending' WHERE property_id = ?`, [...values, propertyId]);
    const property = await getPropertyForReport(propertyId);
    await buildAndSaveReport(property);
    res.json({ message: 'Property updated and sent for verification again.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update property.', error: err.message });
  }
};

exports.deleteMyProperty = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM properties WHERE property_id = ? AND seller_id = ?',
      [Number(req.params.id), req.user.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Your property was not found.' });
    res.json({ message: 'Property deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete property.', error: err.message });
  }
};

exports.addPropertyImage = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const { image_url, is_primary } = req.body;
    if (!image_url) return res.status(400).json({ message: 'image_url is required.' });
    const [ownership] = await db.query(
      'SELECT property_id FROM properties WHERE property_id = ? AND seller_id = ?',
      [propertyId, req.user.userId]
    );
    if (ownership.length === 0) return res.status(404).json({ message: 'Your property was not found.' });
    if (parseBoolean(is_primary)) {
      await db.query('UPDATE property_images SET is_primary = 0 WHERE property_id = ?', [propertyId]);
    }
    const [result] = await db.query(
      'INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, ?)',
      [propertyId, image_url, parseBoolean(is_primary) ? 1 : 0]
    );
    res.status(201).json({ message: 'Image added.', image_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add image.', error: err.message });
  }
};

exports.request3DShoot = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const [ownership] = await db.query(
      'SELECT property_id FROM properties WHERE property_id = ? AND seller_id = ?',
      [propertyId, req.user.userId]
    );
    if (ownership.length === 0) return res.status(404).json({ message: 'Your property was not found.' });
    await db.query('UPDATE properties SET needs_3d_shoot = 1 WHERE property_id = ?', [propertyId]);
    await db.query(
      `INSERT INTO three_d_requests (property_id, requested_by, status, seller_notes)
       VALUES (?, ?, 'requested', ?)
       ON DUPLICATE KEY UPDATE status = 'requested', seller_notes = VALUES(seller_notes), updated_at = CURRENT_TIMESTAMP`,
      [propertyId, req.user.userId, req.body.seller_notes || null]
    );
    res.status(201).json({ message: '3D shoot request created. Our team can schedule the visit next.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not request a 3D shoot.', error: err.message });
  }
};
