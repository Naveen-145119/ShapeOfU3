const express = require('express');
const { getStats, getRevenueAnalytics, getCouponAnalytics, getAllBookings } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, admin, getStats);
router.get('/analytics/revenue', protect, admin, getRevenueAnalytics);
router.get('/analytics/coupons', protect, admin, getCouponAnalytics);
router.get('/bookings', protect, admin, getAllBookings);

module.exports = router;
