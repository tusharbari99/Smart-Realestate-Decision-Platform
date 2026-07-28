const express = require('express');
const router = express.Router();
const controller = require('../controllers/interactionController');
const { verifyToken, isBuyer, isSeller } = require('../middleware/authMiddleware');

router.get('/favorites', verifyToken, isBuyer, controller.getFavorites);
router.post('/favorites/:propertyId', verifyToken, isBuyer, controller.addFavorite);
router.delete('/favorites/:propertyId', verifyToken, isBuyer, controller.removeFavorite);

router.post('/inquiries', verifyToken, isBuyer, controller.createInquiry);
router.get('/inquiries/mine', verifyToken, isBuyer, controller.getBuyerInquiries);
router.get('/seller/inquiries', verifyToken, isSeller, controller.getSellerInquiries);
router.patch('/seller/inquiries/:id', verifyToken, isSeller, controller.updateSellerInquiry);

router.post('/reviews', verifyToken, isBuyer, controller.createReview);

router.get('/buyer/inquiries', verifyToken, isBuyer, controller.getBuyerInquiries);

module.exports = router;
