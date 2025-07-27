const express = require('express');
const router = express.Router(); 
const { 
  createBooking, 
  getMyBookings, 
  mockPaymentSuccess, 
  initiatePayment, // ⭐ Import initiatePayment
  handlePayuCallback // ⭐ Import handlePayuCallback
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');


const bookingValidation = [
  
  body('user').not().isEmpty(),
  body('category').not().isEmpty(),
  body('aadhar_number').not().isEmpty(),
];

// Public route for PayU callback (does NOT need 'protect' middleware)
router.post('/payu-callback', handlePayuCallback); // ⭐ New route for PayU's response

// Protected routes for your application
router.post('/initiate-payment', protect, initiatePayment); // ⭐ New route to initiate payment
router.post('/', protect, bookingValidation, createBooking);
router.get('/my-bookings', protect, getMyBookings); 
router.post('/mock-payment/success', protect, mockPaymentSuccess); // Your mock payment route (keep for now if still using)


module.exports = router;