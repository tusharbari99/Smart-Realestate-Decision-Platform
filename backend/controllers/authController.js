const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  let connection;

  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '').trim();
    const role = String(req.body.role || 'buyer').trim().toLowerCase();

    const agencyName = String(req.body.agencyName || '').trim();
    const serviceCity = String(req.body.serviceCity || '').trim();
    const registrationId =
      String(req.body.registrationId || '').trim() || null;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required.',
      });
    }

    if (!['buyer', 'seller', 'broker'].includes(role)) {
      return res.status(400).json({
        message: 'Choose a Buyer, Seller or Broker Partner account.',
      });
    }

    if (role === 'broker' && (!agencyName || !serviceCity)) {
      return res.status(400).json({
        message: 'Agency name and service city are required.',
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        message: 'Email already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `INSERT INTO users
       (name, email, password, phone, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashedPassword,
        phone || null,
        role,
      ]
    );

    if (role === 'broker') {
      await connection.query(
        `INSERT INTO broker_profiles
        (
          user_id,
          agency_name,
          service_city,
          registration_id,
          verification_status,
          partner_tier,
          discount_percent
        )
        VALUES (?, ?, ?, ?, 'pending', 'starter', 0.00)`,
        [
          userResult.insertId,
          agencyName,
          serviceCity,
          registrationId,
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message:
        role === 'broker'
          ? 'Broker Partner account created. Verification is pending.'
          : 'Account created successfully.',
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }

    console.error(error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Email or Broker Registration ID already exists.',
      });
    }

    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id AS id, name, email, phone, role, is_active, created_at
       FROM users WHERE user_id = ?`,
      [req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
