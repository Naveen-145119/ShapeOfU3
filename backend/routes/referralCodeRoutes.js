// backend/routes/referralCodeRoutes.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Validate referral codes endpoint
router.post('/validate-referral-codes', async (req, res) => {
  try {
    const { codes, userId } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ success: false, message: 'No referral codes provided' });
    }
    if (codes.length > 2) {
      return res.status(400).json({ success: false, message: 'Maximum 2 referral codes allowed' });
    }

    const validCodes = [];
    for (const code of codes) {
      const booking = await Booking.findOne({
        referral_code: code,
        referral_code_used: false,
        user: { $ne: userId }
      });

      if (booking) validCodes.push(code);
    }

    if (validCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid referral codes found' });
    }

    const discountPerCode = 50;
    return res.json({
      success: true,
      validCodes,
      totalDiscount: validCodes.length * discountPerCode,
    });

  } catch (error) {
    console.error('Referral code validation error:', error);
    return res.status(500).json({ success: false, message: 'Server error during referral code validation' });
  }
});

module.exports = router;
