const express = require('express');
const router = express.Router();
const { handlePayuCallback } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/initiate-payment', protect, initiatePayment);
router.post('/callback', handlePayuCallback);

module.exports = router;
