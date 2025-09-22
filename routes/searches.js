const express = require('express');
const { createSearch, getSearches } = require('../controllers/searches');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/searched', authMiddleware, getSearches);
router.post('/search', authMiddleware, createSearch);

module.exports = router;