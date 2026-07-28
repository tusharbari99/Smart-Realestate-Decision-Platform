const db = require('../config/db');

const publicPrice = (price) => {
  const min = Math.round(Number(price) * 1.05);
  const max = Math.round(Number(price) * 1.10);
  return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
};

async function verifiedPropertyExists(propertyId) {
  const [rows] = await db.query(
    "SELECT property_id FROM properties WHERE property_id = ? AND status = 'verified'",
    [propertyId]
  );
  return rows.length > 0;
}

exports.addFavorite = async (req, res) => {
  try {
    const propertyId = Number(req.params.propertyId);
    if (!await verifiedPropertyExists(propertyId)) {
      return res.status(404).json({ message: 'Verified property not found.' });
    }
    await db.query(
      'INSERT IGNORE INTO favorites (buyer_id, property_id) VALUES (?, ?)',
      [req.user.userId, propertyId]
    );
    res.status(201).json({ message: 'Property saved to favourites.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save favourite.', error: err.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM favorites WHERE buyer_id = ? AND property_id = ?',
      [req.user.userId, Number(req.params.propertyId)]
    );
    res.json({ message: 'Property removed from favourites.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not remove favourite.', error: err.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.property_id, p.title, p.price, p.property_type, p.area_sqft, p.city, p.state,
              image.image_url AS primary_image, f.saved_at
       FROM favorites f
       JOIN properties p ON p.property_id = f.property_id
       LEFT JOIN property_images image ON image.property_id = p.property_id AND image.is_primary = 1
       WHERE f.buyer_id = ? AND p.status = 'verified'
       ORDER BY f.saved_at DESC`,
      [req.user.userId]
    );
    res.json({
      favorites: rows.map((row) => ({ ...row, price_range: publicPrice(row.price), price: undefined })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load favourites.', error: err.message });
  }
};

exports.createInquiry = async (req, res) => {
  try {
    const { property_id, message } = req.body;
    if (!property_id || !message || !String(message).trim()) {
      return res.status(400).json({ message: 'property_id and message are required.' });
    }
    if (!await verifiedPropertyExists(Number(property_id))) {
      return res.status(404).json({ message: 'Verified property not found.' });
    }
    const [result] = await db.query(
      'INSERT INTO inquiries (property_id, buyer_id, message) VALUES (?, ?, ?)',
      [Number(property_id), req.user.userId, String(message).trim()]
    );
    res.status(201).json({ message: 'Inquiry sent to the seller.', inquiry_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not send inquiry.', error: err.message });
  }
};

exports.getBuyerInquiries = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.inquiry_id, i.message, i.status, i.created_at, p.property_id, p.title
       FROM inquiries i JOIN properties p ON p.property_id = i.property_id
       WHERE i.buyer_id = ? ORDER BY i.created_at DESC`,
      [req.user.userId]
    );
    res.json({ inquiries: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load inquiries.', error: err.message });
  }
};

exports.getSellerInquiries = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.inquiry_id, i.message, i.status, i.created_at, p.property_id, p.title,
              u.name AS buyer_name
       FROM inquiries i
       JOIN properties p ON p.property_id = i.property_id
       JOIN users u ON u.user_id = i.buyer_id
       WHERE p.seller_id = ? ORDER BY i.created_at DESC`,
      [req.user.userId]
    );
    res.json({ inquiries: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load seller inquiries.', error: err.message });
  }
};

exports.updateSellerInquiry = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'seen', 'replied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid inquiry status.' });
    }
    const [result] = await db.query(
      `UPDATE inquiries i JOIN properties p ON p.property_id = i.property_id
       SET i.status = ? WHERE i.inquiry_id = ? AND p.seller_id = ?`,
      [status, Number(req.params.id), req.user.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Inquiry not found.' });
    res.json({ message: 'Inquiry updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update inquiry.', error: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { property_id, rating, comment } = req.body;
    if (!property_id || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'property_id and a rating from 1 to 5 are required.' });
    }
    if (!await verifiedPropertyExists(Number(property_id))) {
      return res.status(404).json({ message: 'Verified property not found.' });
    }
    const [result] = await db.query(
      'INSERT INTO reviews (property_id, buyer_id, rating, comment) VALUES (?, ?, ?, ?)',
      [Number(property_id), req.user.userId, Number(rating), comment || null]
    );
    res.status(201).json({ message: 'Review added.', review_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add review.', error: err.message });
  }
};
