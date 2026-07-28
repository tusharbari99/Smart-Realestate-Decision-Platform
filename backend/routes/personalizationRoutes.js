const express = require("express");

const controller = require(
  "../controllers/personalizationController",
);

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/activity",
  verifyToken,
  controller.trackActivity,
);

router.get(
  "/preferences",
  verifyToken,
  controller.getPreferences,
);

router.patch(
  "/alert-settings",
  verifyToken,
  controller.updateAlertSettings,
);


router.get(
  "/recommendations",
  verifyToken,
  controller.getRecommendations,
);


router.post(
  "/notifications/scan",
  verifyToken,
  controller.scanNewMatches,
);

router.get(
  "/notifications",
  verifyToken,
  controller.getNotifications,
);

router.patch(
  "/notifications/read-all",
  verifyToken,
  controller.markAllNotificationsRead,
);

router.patch(
  "/notifications/:notificationId/read",
  verifyToken,
  controller.markNotificationRead,
);


router.delete(
  "/activity",
  verifyToken,
  controller.clearBuyerActivity,
);


router.get(
  "/recently-viewed",
  verifyToken,
  controller.getRecentlyViewed,
);


router.get(
  "/continue-comparing",
  verifyToken,
  controller.getContinueComparing,
);


router.get(
  "/feedback/hidden-properties",
  verifyToken,
  controller.getHiddenPropertyIds,
);

router.put(
  "/feedback/:propertyId",
  verifyToken,
  controller.savePropertyFeedback,
);

router.delete(
  "/feedback/:propertyId",
  verifyToken,
  controller.removePropertyFeedback,
);


router.get(
  "/feedback/hidden",
  verifyToken,
  controller.getHiddenProperties,
);


router.patch(
  "/property-preferences",
  verifyToken,
  controller.updatePropertyPreferences,
);


router.post(
  "/admin/property/:propertyId/create-matches",
  verifyToken,
  controller.createMatchesForVerifiedProperty,
);


router.get(
  "/admin/notification-control",
  verifyToken,
  controller.getNotificationControlOverview,
);

router.post(
  "/admin/notification-control/run",
  verifyToken,
  controller.runNotificationWorkersNow,
);


router.patch(
  "/marketing-email-settings",
  verifyToken,
  controller.updateMarketingEmailSettings,
);


router.post(
  "/marketing/unsubscribe/:token",
  controller.unsubscribeMarketingEmails,
);


router.post(
  "/admin/notification-control/test-email",
  verifyToken,
  controller.sendAdminTestEmail,
);


router.post(
  "/admin/notification-control/retry-failed",
  verifyToken,
  controller.retryFailedNotificationEmails,
);


router.get(
  "/admin/notification-control/automation-status",
  verifyToken,
  controller.getEmailAutomationStatus,
);

router.patch(
  "/admin/notification-control/automation-status",
  verifyToken,
  controller.updateEmailAutomationStatus,
);


router.get(
  "/admin/notification-control/report",
  verifyToken,
  controller.downloadEmailDeliveryReport,
);


router.get(
  "/admin/hot-buyer-leads",
  verifyToken,
  controller.getAdminHotBuyerLeads,
);


router.get(
  "/admin/hot-buyer-leads/:buyerId/followup",
  verifyToken,
  controller.getBuyerLeadFollowup,
);

router.patch(
  "/admin/hot-buyer-leads/:buyerId/followup",
  verifyToken,
  controller.updateBuyerLeadFollowup,
);


router.get(
  "/admin/hot-buyer-leads/followups/due",
  verifyToken,
  controller.getAdminDueLeadFollowups,
);


router.get(
  "/admin/lead-pipeline",
  verifyToken,
  controller.getAdminLeadPipeline,
);


router.get(
  "/admin/property-buyer-interest",
  verifyToken,
  controller.getAdminPropertyBuyerInterest,
);


router.get(
  "/admin/analytics",
  verifyToken,
  controller.getAdminAnalyticsDashboard,
);

module.exports = router;
