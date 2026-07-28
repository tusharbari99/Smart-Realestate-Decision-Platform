const express = require('express');
const router = express.Router();
const { getPreferences, savePreferences } = require('../controllers/preferenceController');
const { verifyToken, isBuyer } = require('../middleware/authMiddleware');

router.use(verifyToken, isBuyer);
router.get('/', getPreferences);
router.put('/', savePreferences);

module.exports = router;
