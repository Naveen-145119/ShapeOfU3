
const express = require('express');
const router = express.Router();
const { createCoupon, getCoupons, updateCoupon, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const { protect, admin } = require('../middleware/auth');

router.route('/').post(protect, admin, createCoupon).get(protect, admin, getCoupons);
router.route('/:id').put(protect, admin, updateCoupon).delete(protect, admin, deleteCoupon);
router.post('/validate',protect, validateCoupon);

module.exports = router;
