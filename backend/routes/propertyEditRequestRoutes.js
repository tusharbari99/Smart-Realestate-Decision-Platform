const express = require("express");

const controller = require(
  "../controllers/propertyEditRequestController",
);

const {
  verifyToken,
  isSeller,
  isAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/admin/pending",
  verifyToken,
  isAdmin,
  controller.getAdminPendingRequests,
);

router.patch(
  "/admin/:id/status",
  verifyToken,
  isAdmin,
  controller.reviewEditRequest,
);

router.get(
  "/property/:id",
  verifyToken,
  isSeller,
  controller.getSellerPropertyForEdit,
);

router.get(
  "/mine",
  verifyToken,
  isSeller,
  controller.getSellerRequests,
);

router.post(
  "/",
  verifyToken,
  isSeller,
  controller.submitEditRequest,
);

module.exports = router;
