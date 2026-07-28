const express = require('express');
const router = express.Router();
const controller = require('../controllers/propertyController');
const { verifyToken, isSeller, isBuyer } = require('../middleware/authMiddleware');

// Public discovery routes. Keep these above /:id so Express does not treat
// words such as "compare" as a property ID.
router.get('/', controller.getAllProperties);
router.get('/compare', verifyToken, isBuyer, controller.getComparison);

// Seller dashboard routes.
router.get('/mine', verifyToken, isSeller, controller.getMyProperties);
router.post('/', verifyToken, isSeller, controller.addProperty);
router.post('/add', verifyToken, isSeller, controller.addProperty); // backwards-compatible route
router.put(
  '/:id',
  verifyToken,
  isSeller,
  (req, res) =>
    res.status(403).json({
      message:
        'Direct editing is disabled. Submit an edit request for admin review.',
    }),
);
router.delete('/:id', verifyToken, isSeller, controller.deleteMyProperty);
router.post('/:id/images', verifyToken, isSeller, controller.addPropertyImage);
router.post('/:id/3d-request', verifyToken, isSeller, controller.request3DShoot);

// Public property intelligence report and details.
router.get('/:id', verifyToken, controller.getPropertyDetails);

module.exports = router;
