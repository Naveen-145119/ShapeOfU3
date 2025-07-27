const Coupon = require('../models/Coupon');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create a coupon
// @route   POST /api/v1/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, data: coupon });
});

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Private/Admin
const getCoupons = asyncHandler(async (req, res, next) => {
  const coupons = await Coupon.find({});
  res.status(200).json({ success: true, count: coupons.length, data: coupons });
});

// @desc    Update a coupon
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res, next) => {
  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorResponse(`Coupon not found with id of ${req.params.id}`, 404));
  }

  coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: coupon });
});

// @desc    Delete a coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorResponse(`Coupon not found with id of ${req.params.id}`, 404));
  }

  await coupon.remove();

  res.status(200).json({ success: true, data: {} });
});

const validateCoupon = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({ code, is_active: true });

  if (!coupon) {
    return next(new ErrorResponse('Invalid or inactive coupon code', 400));
  }

  res.status(200).json({ success: true, data: coupon });
});

module.exports = {
    createCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon,
    validateCoupon
}