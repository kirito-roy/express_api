const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const admincontroller = require('../controllers/admincontroller');


router.post('/dataentry', auth, admincontroller.dataentry);
router.get('/getProducts', auth, admincontroller.getproducts);

module.exports = router;