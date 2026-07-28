const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin);
router.get('/dashboard', controller.getDashboard);
router.get('/users', controller.getUsers);
router.get('/inquiries', controller.getInquiries);
router.patch('/inquiries/:id', controller.updateInquiryStatus);
router.patch('/users/:id/active', controller.setUserActiveStatus);
router.get('/properties', controller.getAllProperties);
router.get('/properties/pending', controller.getPendingProperties);
router.patch('/properties/:id/status', controller.updatePropertyStatus);
router.post('/properties/:id/facilities', controller.addFacility);
router.get('/3d-requests', controller.get3DRequests);
router.patch('/3d-requests/:id', controller.update3DRequest);

router.get('/support-messages', controller.getSupportMessages);
router.patch('/support-messages/:id', controller.updateSupportMessage);

module.exports = router;
