const asyncHandler = require('../middleware/asyncHandler');
const Booking = require('../models/Booking');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto');

// PayU Test Credentials (replace with your actual test credentials)
const PAYU_KEY = process.env.PAYU_KEY || 'gtKFFx';
const PAYU_SALT = process.env.PAYU_SALT || 'eCwWELxi';
const PAYU_BASE_URL = 'https://test.payu.in/_payment'; // Test URL

// @desc    Initiate PayU payment
// @route   POST /api/v1/payu/initiate-payment
// @access  Private
const initiatePayment = asyncHandler(async (req, res, next) => {
  const { bookingId, amount, productInfo, firstName, email, phone } = req.body;

  // Validate input
  if (!bookingId || !amount || !productInfo || !firstName || !email || !phone) {
    return next(new ErrorResponse('Missing required payment details', 400));
  }

  const txnid = 'TXN' + Date.now() + Math.floor(Math.random() * 1000); // Unique transaction ID

  const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productInfo}|${firstName}|${email}||||||||||${PAYU_SALT}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  const paymentData = {
    key: PAYU_KEY,
    txnid,
    amount,
    productinfo,
    firstname: firstName,
    email,
    phone,
    surl: `${process.env.FRONTEND_URL}/payment-status?status=success`, // Success URL
    furl: `${process.env.FRONTEND_URL}/payment-status?status=failure`, // Failure URL
    hash,
    // Optional: Add other parameters as needed by PayU
    // service_provider: 'payu_paisa',
  };

  res.status(200).json({
    success: true,
    message: 'Payment initiated',
    paymentData,
    payuUrl: PAYU_BASE_URL,
  });
});

// @desc    Handle PayU payment callback (success/failure)
// @route   POST /api/v1/payu/callback
// @access  Public
const paymentCallback = asyncHandler(async (req, res, next) => {
  const {
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    status,
    hash,
    mihpayid, // PayU Payment ID
    mode, // Payment mode (e.g., CC, DC, NB)
    unmappedstatus, // Unmapped status
    // Add other parameters received from PayU callback
  } = req.body;

  // Verify the hash to ensure data integrity
  const hashString = `${PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY}`;
  const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

  if (hash !== expectedHash) {
    console.error('PayU Callback: Hash mismatch');
    return next(new ErrorResponse('Payment verification failed: Hash mismatch', 400));
  }

  const booking = await Booking.findOne({ 'paymentId': txnid }); // Assuming txnid is stored as paymentId

  if (!booking) {
    console.error(`PayU Callback: Booking not found for txnid: ${txnid}`);
    return next(new ErrorResponse('Booking not found for this transaction', 404));
  }

  if (status === 'success') {
    booking.paymentStatus = 'completed';
    booking.paymentId = mihpayid; // Store PayU's payment ID
    booking.paymentMethod = mode; // Store payment mode
    booking.status = 'confirmed'; // Confirm booking on successful payment
    await booking.save();
    res.redirect(`${process.env.FRONTEND_URL}/payment-status?status=success&txnid=${txnid}&bookingId=${booking._id}`);
  } else {
    booking.paymentStatus = 'failed';
    booking.status = 'cancelled'; // Or keep as pending, depending on business logic
    await booking.save();
    res.redirect(`${process.env.FRONTEND_URL}/payment-status?status=failure&txnid=${txnid}&bookingId=${booking._id}`);
  }
});

module.exports = {
  initiatePayment,
  paymentCallback,
};
