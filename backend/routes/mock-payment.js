
const express = require('express');
const router = express.Router();
const { mockPaymentSuccess } = require('../controllers/mockPaymentController');

router.post('/success', mockPaymentSuccess);

module.exports = router;
