const db = require('../config/db');

const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'other'];

exports.getPreferences = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT budget_min, budget_max, preferred_city, preferred_type, min_area_sqft, purpose, updated_at
       FROM user_preferences WHERE user_id = ?`,
      [req.user.userId]
    );
    res.json({ preferences: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load preferences.', error: err.message });
  }
};

exports.savePreferences = async (req, res) => {
  try {
    const { budget_min, budget_max, preferred_city, preferred_type, min_area_sqft, purpose } = req.body;
    if (preferred_type && !PROPERTY_TYPES.includes(String(preferred_type).toLowerCase())) {
      return res.status(400).json({ message: 'Invalid preferred property type.' });
    }
    if (purpose && !['investment', 'end_use'].includes(purpose)) {
      return res.status(400).json({ message: 'Purpose must be investment or end_use.' });
    }
    if (budget_min && budget_max && Number(budget_min) > Number(budget_max)) {
      return res.status(400).json({ message: 'Minimum budget cannot exceed maximum budget.' });
    }

    await db.query(
      `INSERT INTO user_preferences
         (user_id, budget_min, budget_max, preferred_city, preferred_type, min_area_sqft, purpose)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         budget_min = VALUES(budget_min), budget_max = VALUES(budget_max),
         preferred_city = VALUES(preferred_city), preferred_type = VALUES(preferred_type),
         min_area_sqft = VALUES(min_area_sqft), purpose = VALUES(purpose),
         updated_at = CURRENT_TIMESTAMP`,
      [
        req.user.userId, budget_min || null, budget_max || null, preferred_city || null,
        preferred_type ? String(preferred_type).toLowerCase() : null, min_area_sqft || null,
        purpose || 'end_use',
      ]
    );
    res.json({ message: 'Preferences saved. Recommendations will refresh automatically.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save preferences.', error: err.message });
  }
};
