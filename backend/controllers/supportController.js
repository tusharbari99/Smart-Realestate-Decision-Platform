const db = require("../config/db");

exports.createMessage = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();
    const email = String(req.body.email || "").trim();
    const message = String(req.body.message || "").trim();

    if (!name || !phone || !message) {
      return res.status(400).json({
        message: "Name, phone, and message are required.",
      });
    }

    if (!/^[0-9+\-\s]{7,15}$/.test(phone)) {
      return res.status(400).json({
        message: "Please enter a valid phone number.",
      });
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO support_messages
          (name, phone, email, message)
        VALUES (?, ?, ?, ?)
      `,
      [name, phone, email || null, message],
    );

    res.status(201).json({
      message: "Message received. Our team will contact you soon.",
      message_id: result.insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not send your message.",
    });
  }
};
