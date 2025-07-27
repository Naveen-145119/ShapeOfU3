// test/backend/controllers/bookingController.js

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto'); // ⭐ ADD THIS IMPORT for hash generation

const initiatePayment = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.body; // Frontend will send the ID of the booking to pay for

    // 1. Fetch Booking Details from DB
    // Use .populate('user') to ensure user details are available for PayU parameters
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) {
        return next(new ErrorResponse('Booking not found', 404));
    }

    // Ensure the booking hasn't been paid for already
    if (booking.paymentStatus === 'completed') {
        return next(new ErrorResponse('This booking has already been paid.', 400));
    }

    // 2. Prepare PayU Request Parameters
    const merchantKey = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_SALT;
    const payuPaymentUrl = process.env.PAYU_PAYMENT_URL;

    // Essential parameters for PayU
    const txnid = new mongoose.Types.ObjectId().toHexString(); // Unique transaction ID for PayU
    const amount = booking.totalAmount;
    // Ensure booking.event is populated or check if it's an ObjectId
    const productinfo = `Booking for Event ID: ${booking.event ? booking.event.toString() : 'N/A'}`; 
    const firstname = booking.user ? booking.user.firstName : 'Guest';
    const email = booking.user ? booking.user.email : 'guest@example.com';
    const phone = booking.user ? booking.user.phone : '0000000000';
    const surl = `${process.env.FRONTEND_URL}/payment-status?status=success`;
    const furl = `${process.env.FRONTEND_URL}/payment-status?status=failure`;

    // Additional optional parameters (udf1 to udf10)
    // PayU requires these to be present even if empty, in the hash sequence
    const udf1 = booking._id.toString(); // Pass your booking ID as a custom field

    // 3. Generate PayU Hash (CRUCIAL)
    // The order of concatenation is extremely important.
    // Refer to PayU's official documentation for 'hash sequence'.
    // Typical sequence (verify with PayU docs!):
    // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
    const hashString = `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}||||||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // 4. Construct response for Frontend (form data for redirection)
    const payuFormData = {
        key: merchantKey,
        txnid: txnid,
        amount: amount,
        productinfo: productinfo,
        firstname: firstname,
        email: email,
        phone: phone,
        surl: surl,
        furl: furl,
        hash: hash,
        udf1: udf1, // Include udf1 in form data
        action: payuPaymentUrl // The URL to which the frontend will post the data
    };

    // Update booking with txnid and payment status to pending
    booking.paymentId = txnid; // Store PayU's transaction ID
    booking.paymentStatus = 'pending';
    await booking.save();

    res.status(200).json({
        success: true,
        message: 'Payment initiation successful',
        data: payuFormData // Send all data frontend needs to redirect to PayU
    });
});

const createBooking = asyncHandler(async (req, res, next) => {
    console.log('Backend received req.body (FULL):', JSON.stringify(req.body, null, 2));

    const {
        user, category, aadhar_number, paymentId, event,
        paymentStatus, paymentMethod,
        tshirtSize, coupon_code, referral_code,
        firstName, lastName, email, phone, gender
    } = req.body;

    let totalAmount = 1311; // Base price
    let discountAmount = 0;

    // ⭐ FIX: bookingDataToSave declared here at the beginning
    const bookingDataToSave = {
        user,
        event: event && mongoose.Types.ObjectId.isValid(event) ? event : undefined,
        ticketType: category,
        quantity: 1,
        paymentId,
        paymentStatus,
        paymentMethod,
        tshirtSize,
        aadhar_number,
        attendees: [{
            name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            gender: gender,
        }],
        status: 'confirmed',
        college_coupon: null,
        referral_coupons: [],
        discount_amount: 0,
    };

    // Coupon Logic
    if (coupon_code) {
        const coupon = await Coupon.findOne({ code: coupon_code, is_active: true });
        if (coupon) {
            discountAmount += coupon.discount;
            bookingDataToSave.college_coupon = coupon._id;
            bookingDataToSave.coupon_code = coupon.code;
        } else {
            return next(new ErrorResponse('Invalid or inactive college coupon code', 400));
        }
    }

    if (referral_code) {
        const referralCodes = referral_code.split(',').map(code => code.trim());
        if (referralCodes.length > 2) {
            return next(new ErrorResponse('You can use a maximum of 2 referral codes', 400));
        }

        let referredBookings = [];
        for (const code of referralCodes) {
            const referredBooking = await Booking.findOne({ bookingReference: code, referral_coupon_used: false });
            if (!referredBooking) {
                return next(new ErrorResponse(`Invalid or already used referral code: ${code}`, 400));
            }
            referredBookings.push(referredBooking);
        }

        if (referredBookings.length > 0) {
            discountAmount += referredBookings.length * 50;
            bookingDataToSave.referral_coupons = referredBookings.map(b => b.bookingReference);
            for (const booking of referredBookings) {
                booking.referral_coupon_used = true;
                await booking.save();
            }
        }
    }

    totalAmount -= discountAmount;
    bookingDataToSave.totalAmount = totalAmount;
    bookingDataToSave.discount_amount = discountAmount;

    const booking = await Booking.create(bookingDataToSave);

    res.status(201).json({
        success: true,
        data: booking
    });
});

const getBookings = asyncHandler(async (req, res, next) => {
    const bookings = await Booking.find().populate('user', 'firstName lastName email').populate('event', 'name date location');
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

const getBookingById = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id).populate('user', 'firstName lastName email').populate('event', 'name date location');
    if (!booking) return next(new ErrorResponse(`Booking not found with ID of ${req.params.id}`, 404));
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorized to view this booking`, 401));
    }
    res.status(200).json({ success: true, data: booking });
});

const updateBooking = asyncHandler(async (req, res, next) => {
    let booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Booking not found with ID of ${req.params.id}`, 404));

    const updateFields = { ...req.body };
    if (updateFields.ticketType && !['General', 'PC', 'Associate'].includes(updateFields.ticketType)) delete updateFields.ticketType;
    if (updateFields.paymentStatus && !['pending', 'completed', 'failed', 'refunded'].includes(updateFields.paymentStatus)) delete updateFields.paymentStatus;
    if (updateFields.paymentMethod && !['card', 'upi', 'netbanking', 'wallet', 'demo_payment'].includes(updateFields.paymentMethod)) delete updateFields.paymentMethod;
    if (updateFields.status && !['confirmed', 'cancelled', 'attended', 'no-show'].includes(updateFields.status)) delete updateFields.status;

    booking = await Booking.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: booking });
});

const deleteBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Booking not found with ID of ${req.params.id}`, 404));
    await booking.deleteOne();
    res.status(200).json({ success: true, data: {} });
});

const getMyBookings = asyncHandler(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('event', 'name date location');
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

const mockPaymentSuccess = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
        return next(new ErrorResponse('Invalid booking ID provided', 400));
    }

    let booking = await Booking.findById(bookingId);

    if (!booking) {
        return next(new ErrorResponse(`Booking not found with ID ${bookingId}`, 404));
    }

    booking.paymentStatus = 'completed';
    //booking.paymentMethod = 'demo_payment'; // Set if not already done by initial booking create
    await booking.save();

    res.status(200).json({
        success: true,
        message: 'Mock payment success recorded',
        data: booking
    });
});

const handlePayuCallback = asyncHandler(async (req, res, next) => {
  // PayU sends data as form-urlencoded POST request, so it will be in req.body
  const payuResponse = req.body;
  console.log('PayU Callback Received (FULL):', JSON.stringify(payuResponse, null, 2));

  const merchantKey = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_SALT;

  // 1. Extract relevant data from PayU response
  const {
      mihpayid, // PayU's transaction ID for successful transactions
      txnid,    // Your transaction ID (what you sent to PayU: booking.paymentId)
      amount,
      productinfo,
      firstname,
      email,
      status,   // Payment status: "success", "failure", "pending"
      hash,     // Hash sent by PayU for verification
      udf1,     // Your booking ID (if you sent it as udf1)
      // ... other parameters like mode, bank_ref_num, etc.
  } = payuResponse;

  // 2. Re-generate hash on your side for verification (CRITICAL SECURITY STEP)
  // The hash sequence for verification is different from payment initiation.
  // It's typically: "salt|status||||||udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key"
  // CHECK PAYU'S OFFICIAL DOCUMENTATION FOR THE EXACT HASH VERIFICATION SEQUENCE!

  // Example (PLACEHOLDER - REPLACE WITH ACTUAL HASH VERIFICATION LOGIC FROM PAYU DOCS)
  const hashString = `${salt}|${status}|||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${merchantKey}`;
  const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

  // 3. Verify the hash and process payment status
  if (calculatedHash === hash) {
      // Hash matches, so the data is authentic and not tampered with
      console.log('PayU Hash Verified: Match!');

      // Retrieve the booking using your txnid or udf1 (booking ID)
      const booking = await Booking.findOne({ paymentId: txnid }); // Find by the txnid you sent to PayU
      if (!booking) {
          console.error('PayU Callback: Booking not found for txnid:', txnid);
          return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      if (status === 'success') {
          booking.paymentStatus = 'completed';
          booking.status = 'confirmed';
          booking.paymentMethod = 'payu'; // Confirm actual payment method
          booking.payuResponse = payuResponse; // Store full PayU response for auditing
          // You might also want to store mihpayid if your schema supports it
          await booking.save();
          console.log('Booking updated to completed:', booking._id);
          // After successful update, redirect user to the success page
          return res.redirect(`${process.env.FRONTEND_URL}/payment-status?status=success&bookingId=${booking._id}&txnid=${txnid}`);
      } else if (status === 'failure' || status === 'cancelled') {
          booking.paymentStatus = 'failed';
          booking.payuResponse = payuResponse;
          await booking.save();
          console.log('Booking updated to failed:', booking._id);
          return res.redirect(`${process.env.FRONTEND_URL}/payment-status?status=failure&bookingId=${booking._id}&txnid=${txnid}`);
      } else {
          // Handle pending or other statuses if needed
          console.log('PayU Callback: Unknown status or pending:', status);
          return res.status(200).send('Status Unknown/Pending');
      }
  } else {
      // Hash mismatch, potential tampering!
      console.error('PayU Hash Verification Failed: Mismatch!');
      // Log this incident, do NOT update payment status based on this callback
      return res.status(400).send('Hash Mismatch');
  }
});

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    getMyBookings,
    initiatePayment, // ⭐ EXPORT THE NEW FUNCTION
    handlePayuCallback,
    mockPaymentSuccess
};