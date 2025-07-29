// test/backend/controllers/bookingController.js

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto'); // Ensure crypto is imported

const initiatePayment = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) {
        return next(new ErrorResponse('Booking not found', 404));
    }
    if (booking.paymentStatus === 'completed') {
        return next(new Error(new ErrorResponse('This booking has already been paid.', 400))); // Ensure ErrorResponse is correctly handled by asyncHandler
    }

    const merchantKey = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_SALT;
    const payuPaymentUrl = process.env.PAYU_PAYMENT_URL;

    const txnid = new mongoose.Types.ObjectId().toHexString();
    const amount = booking.totalAmount;
    const productinfo = `Booking for Event ID: ${booking.event ? booking.event.toString() : 'N/A'}`;
    const firstname = booking.user ? booking.user.firstName : 'Guest';
    const email = booking.user ? booking.user.email : 'guest@example.com';
    const phone = booking.user ? booking.user.phone : '0000000000';

    // ⭐ CRITICAL FIX: Send NGROK_PUBLIC_URL to PayU for surl/furl
    // PayU will redirect user's browser to these URLs.
    // IMPORTANT: These should point to your backend's handlePayuCallback endpoint,
    // where your server will process the response and then redirect the user
    // to your frontend's success/failure page with proper query parameters.
    const surlForPayU = `${process.env.NGROK_PUBLIC_URL}/payment-success`; 
    const furlForPayU = `${process.env.NGROK_PUBLIC_URL}/payment-failure`; 
    
    const udf1 = booking._id.toString();

    // Hash string for Payment INITIATION (Frontend to PayU)
    // Sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
    const hashString = `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}||||||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const payuFormData = {
        key: merchantKey,
        txnid: txnid,
        amount: amount,
        productinfo: productinfo,
        firstname: firstname,
        email: email,
        phone: phone,
        surl: surlForPayU, // ⭐ Now points to backend callback
        furl: furlForPayU, // ⭐ Now points to backend callback
        hash: hash,
        udf1: udf1,
        action: payuPaymentUrl
    };

    booking.paymentId = txnid;
    booking.paymentStatus = 'pending';
    await booking.save();

    res.status(200).json({
        success: true,
        message: 'Payment initiation successful',
        data: payuFormData
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

    let totalAmount = 1311;
    let discountAmount = 0;

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
    if (updateFields.paymentMethod && !['card', 'upi', 'netbanking', 'wallet', 'demo_payment', 'payu'].includes(updateFields.paymentMethod)) delete updateFields.paymentMethod;
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

const handlePayuCallback = asyncHandler(async (req, res, next) => {
    console.log('--- Inside handlePayuCallback ---');
    const payuResponse = req.body;
    console.log('PayU Callback Received (FULL):', JSON.stringify(payuResponse, null, 2));

    const merchantKey = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_SALT;

    // Validate essential fields before proceeding
    if (!payuResponse.txnid || !payuResponse.status || !payuResponse.hash) {
        console.error('PayU Callback: Missing essential parameters.');
        return res.status(400).send('Missing Parameters');
    }

    const {
        mihpayid,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        status,
        hash,
        udf1,
        udf2, udf3, udf4, udf5, // Destructure all UDFs
        udf6, udf7, udf8, udf9, udf10,
    } = payuResponse;

    // Ensure amount is formatted as a string with two decimal places if that's what PayU expects
    const formattedAmount = parseFloat(amount).toFixed(2);

    console.log(`PayU Callback: Processing txnid: ${txnid}, status: ${status}, amount: ${formattedAmount}`);

    // PayU's verification hash sequence:
    // salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const hashString = `${salt}|${status}|${udf10 || ''}|${udf9 || ''}|${udf8 || ''}|${udf7 || ''}|${udf6 || ''}|${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email}|${firstname}|${productinfo}|${formattedAmount}|${txnid}|${merchantKey}`;

    console.log('PayU Callback: Hash String for Verification:', hashString);
    const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    console.log(`PayU Callback: Calculated Hash: ${calculatedHash}, Received Hash: ${hash}`);

    const frontendSuccessUrl = process.env.FRONTEND_PAYMENT_SUCCESS_URL;
    const frontendFailureUrl = process.env.FRONTEND_PAYMENT_FAILURE_URL;

    if (calculatedHash === hash) {
        console.log('PayU Hash Verified: Match!');

        const booking = await Booking.findOne({ paymentId: txnid });
        if (!booking) {
            console.error('PayU Callback: Booking not found for txnid:', txnid);
            return res.redirect(`${frontendFailureUrl}?status=booking_not_found&txnid=${txnid}`);
        }

        if (status === 'success') {
            booking.paymentStatus = 'completed';
            booking.paymentMethod = 'payu';
            booking.payuResponse = payuResponse;
            booking.paymentId = mihpayid;
            await booking.save();
            console.log('Booking updated to completed:', booking._id);
            // ⭐ NEW LOG: Confirming redirect is about to happen
            console.log(`PayU Callback: Redirecting to success: ${frontendSuccessUrl}?bookingId=${booking._id}&txnid=${txnid}&status=success`); 
            return res.redirect(`${frontendSuccessUrl}?bookingId=${booking._id}&txnid=${txnid}&status=success`);
        } else {
            booking.paymentStatus = 'failed';
            booking.payuResponse = payuResponse;
            await booking.save();
            console.log('Booking updated to failed:', booking._id);
            // ⭐ NEW LOG: Confirming redirect is about to happen
            console.log(`PayU Callback: Redirecting to failure: ${frontendFailureUrl}?bookingId=${booking._id}&txnid=${txnid}&status=${status}&message=${encodeURIComponent(payuResponse.error_Message || 'Payment failed.')}`); 
            return res.redirect(`${frontendFailureUrl}?bookingId=${booking._id}&txnid=${txnid}&status=${status}&message=${encodeURIComponent(payuResponse.error_Message || 'Payment failed.')}`);
        }
    } else {
        console.error('PayU Hash Verification Failed: Mismatch!');
        return res.redirect(`${frontendFailureUrl}?status=hash_mismatch&message=${encodeURIComponent('Payment verification failed due to hash mismatch.')}`);
    }
});

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    getMyBookings,
    initiatePayment,
    handlePayuCallback,
};
