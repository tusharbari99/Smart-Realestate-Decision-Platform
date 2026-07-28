const bcrypt = require("bcryptjs");

const db = require("../config/db");

function getUserId(req) {
  return Number(
    req.user?.user_id ||
      req.user?.userId ||
      req.user?.id,
  );
}

exports.getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    const [users] = await db.query(
      `
        SELECT
          user_id,
          name,
          email,
          phone,
          role,
          is_active,
          created_at
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    res.json({
      user: users[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load your profile.",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!userId) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        message: "Please enter a valid name.",
      });
    }

    if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) {
      return res.status(400).json({
        message: "Please enter a valid phone number.",
      });
    }

    await db.query(
      `
        UPDATE users
        SET name = ?, phone = ?
        WHERE user_id = ?
      `,
      [name, phone || null, userId],
    );

    const [users] = await db.query(
      `
        SELECT
          user_id,
          name,
          email,
          phone,
          role,
          is_active,
          created_at
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId],
    );

    res.json({
      message: "Profile updated successfully.",
      user: users[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not update your profile.",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = getUserId(req);

    const currentPassword = String(
      req.body.current_password || "",
    );

    const newPassword = String(
      req.body.new_password || "",
    );

    if (!userId) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Please enter both passwords.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must have at least 8 characters.",
      });
    }

    const [users] = await db.query(
      "SELECT password FROM users WHERE user_id = ? LIMIT 1",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      users[0].password,
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, userId],
    );

    res.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not change your password.",
    });
  }
};
