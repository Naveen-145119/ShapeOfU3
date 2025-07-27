
const asyncHandler = require('../middleware/asyncHandler');
const Booking = require('../models/Booking');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Simulate a successful payment
// @route   POST /api/v1/mock-payment/success
// @access  Public
const mockPaymentSuccess = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  booking.paymentStatus = 'completed';
  booking.paymentId = 'mock_payment_' + Date.now();
  await booking.save();

  res.status(200).json({ success: true, data: booking });
});

module.exports = {
  mockPaymentSuccess,
};
