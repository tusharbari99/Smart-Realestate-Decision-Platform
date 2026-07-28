const express = require("express");
const controller = require("../controllers/propertyMediaController");

const {
  verifyToken,
  isSeller,
  isAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/admin/requests",
  verifyToken,
  isAdmin,
  controller.getAdminRequests,
);

router.patch(
  "/admin/requests/:requestId",
  verifyToken,
  isAdmin,
  controller.reviewMediaRequest,
);

router.get(
  "/seller/:id",
  verifyToken,
  isSeller,
  controller.getSellerMedia,
);

router.post(
  "/seller/:id",
  verifyToken,
  isSeller,
  (req, res, next) => {
    controller.uploadFields(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message:
            error.message ||
            "Could not process selected media.",
        });
      }

      next();
    });
  },
  controller.uploadMedia,
);

router.patch(
  "/seller/:id/images/:imageId/primary",
  verifyToken,
  isSeller,
  controller.setPrimaryImage,
);

router.delete(
  "/seller/:id/:type/:mediaId",
  verifyToken,
  isSeller,
  controller.deleteMedia,
);

router.get("/:id", controller.getPublicMedia);

module.exports = router;
