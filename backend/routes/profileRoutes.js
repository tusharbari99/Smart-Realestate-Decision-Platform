const express = require("express");

const controller = require("../controllers/profileController");
const {
  verifyToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, controller.getProfile);
router.patch("/", verifyToken, controller.updateProfile);
router.patch(
  "/password",
  verifyToken,
  controller.changePassword,
);

module.exports = router;
