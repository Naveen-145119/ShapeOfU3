// test/backend/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  event: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false 
  },
  ticketType: { 
    type: String,
    enum: ['General', 'PC', 'Associate'], 
    required: [true, 'Ticket type is required']
  },
  quantity: {
    type: Number,
    required: false, 
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Maximum 10 tickets per booking']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'demo_payment' , 'payu'], 
    required: function() {
      return this.paymentStatus === 'completed';
    }
  },
  paymentId: {
    type: String,
    required: function() {
      return this.paymentStatus === 'completed';
    }
  },
  bookingReference: {
    type: String,
    unique: true,
    required: false 
  },
  status: { 
    type: String,
    enum: ['confirmed', 'cancelled', 'attended', 'no-show'], 
    default: 'confirmed'
  },
  // ⭐ ADDED: T-shirt Size field
  tshirtSize: {
    type: String,
    required: false // Or true if it's always mandatory
  },
  // ⭐ ADDED: Coupon Code field
  coupon_code: {
    type: String,
    required: false // Or true if it's always mandatory
  },
  aadhar_number: { // This field is already present and correctly defined
    type: String,
    required: [true, 'Aadhar number is required']
  },
  college_coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: false,
  },
  referral_coupons: [{
    type: String,
    required: false,
  }],
  referral_coupon_used: {
    type: Boolean,
    default: false,
  },
  discount_amount: {
    type: Number,
    default: 0,
  },
  attendees: [{
    name: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: false
    },
    email: {
      type: String,
      required: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    dietaryRestrictions: String,
    emergencyContact: {
      name: String,
      phone: String
    }
  }],
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  checkInTime: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundProcessedAt: {
    type: Date,
    default: null
  },
  qrCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

bookingSchema.index({ user: 1 });
bookingSchema.index({ event: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingReference) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.bookingReference = `SOY3-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

bookingSchema.virtual('bookingAge').get(function() {
  return Date.now() - this.createdAt;
});

bookingSchema.virtual('canCancel').get(function() {
  const now = new Date();
  const eventDate = this.event ? new Date(this.event.date) : null; 
  if (!eventDate) return false;
  const hoursDiff = (eventDate - now) / (1000 * 60 * 60);
  return this.status === 'confirmed' && 
           this.paymentStatus === 'completed' && 
           hoursDiff > 24; 
});

module.exports = mongoose.model('Booking', bookingSchema);