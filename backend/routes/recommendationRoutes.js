const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');
const { verifyToken, isBuyer } = require('../middleware/authMiddleware');

router.get('/', verifyToken, isBuyer, getRecommendations);

module.exports = router;
