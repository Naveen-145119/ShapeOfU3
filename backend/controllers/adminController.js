const User = require('../models/User');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalBookings = await Booking.countDocuments();

  const totalRevenueResult = await Booking.aggregate([
    {
      $match: { paymentStatus: 'completed' } // Only count completed payments for revenue
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }, // Use totalAmount from Booking model
      },
    },
  ]);
  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

  const ticketsSoldToday = await Booking.countDocuments({
    paymentStatus: 'completed',
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999)),
    },
  });

  // Registration Trend (last 6 months)
  const registrationTrend = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
      }
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Category Distribution (based on booking ticket types)
  const categoryDistribution = await Booking.aggregate([
    {
      $match: { paymentStatus: 'completed' } // Only count completed payments
    },
    {
      $group: {
        _id: '$ticketType',
        count: { $sum: '$quantity' }
      }
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        value: '$count'
      }
    }
  ]);

  // Placeholder for Mobile Bookings (assuming no direct field, could be derived from user agent in a real app)
  const mobileBookingsPercentage = '68%'; // Hardcoded for now

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalBookings,
      totalRevenue,
      ticketsSoldToday,
      registrationTrend,
      categoryDistribution,
      mobileBookingsPercentage,
    },
  });
});

// @desc    Get revenue analytics
// @route   GET /api/admin/analytics/revenue
// @access  Private/Admin
exports.getRevenueAnalytics = asyncHandler(async (req, res, next) => {
  const { timeRange } = req.query;
  let startDate;

  switch (timeRange) {
    case 'last-7-days':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last-30-days':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'all-time':
    default:
      startDate = new Date(0); // Epoch time
      break;
  }

  const revenueData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: 'completed',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalRevenue: { $sum: '$totalAmount' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
    },
    {
      $project: {
        _id: 0,
        name: {
          $dateToString: { format: '%Y-%m-%d', date: { $toDate: { $concat: [ { $toString: '$_id.year' }, '-', { $toString: '$_id.month' }, '-', { $toString: '$_id.day' } ] } } },
        },
        revenue: '$totalRevenue',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: revenueData,
  });
});

// @desc    Get coupon usage analytics
// @route   GET /api/admin/analytics/coupons
// @access  Private/Admin
exports.getCouponAnalytics = asyncHandler(async (req, res, next) => {
  const { timeRange } = req.query;
  let startDate;

  switch (timeRange) {
    case 'last-7-days':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last-30-days':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'all-time':
    default:
      startDate = new Date(0); // Epoch time
      break;
  }

  const couponData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: 'completed',
        createdAt: { $gte: startDate },
        // Assuming coupon information is stored in the booking or related event
        // For now, we'll use a placeholder or derive from existing data if possible.
        // If coupons are not directly in Booking, this aggregation needs adjustment.
      },
    },
    {
      $group: {
        _id: '$couponCode', // Assuming a couponCode field in Booking
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        name: {
          $cond: { if: { $eq: ['$_id', null] }, then: 'No Coupon', else: '$_id' }
        },
        value: '$count',
      },
    },
    {
      $sort: { value: -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: couponData,
  });
});


// ⭐ ADDED: Controller to get all bookings for admin dashboard
// @desc    Get all bookings for admin dashboard
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAllBookings = asyncHandler(async (req, res, next) => {
  // Fetch all bookings and populate user and event details for display in the dashboard
  const bookings = await Booking.find()
    .populate('user', 'firstName lastName email phone') // ⭐ ADDED 'phone' to populated user fields
    .populate('event'); // Populate event details (if event field is populated)
  res.status(200).json({
    success: true,
    data: bookings,
  });
});
