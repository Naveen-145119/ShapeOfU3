const express = require('express');
const { body } = require('express-validator');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getCategories
} = require('../controllers/eventController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const eventValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn(['fitness', 'workshop', 'competition', 'networking', 'team-building'])
    .withMessage('Invalid category'),
  body('date')
    .isISO8601()
    .withMessage('Please enter a valid date'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please enter valid start time (HH:MM)'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please enter valid end time (HH:MM)'),
  body('duration')
    .isInt({ min: 15, max: 1440 })
    .withMessage('Duration must be between 15 and 1440 minutes'),
  body('venue.name')
    .trim()
    .notEmpty()
    .withMessage('Venue name is required'),
  body('venue.address')
    .trim()
    .notEmpty()
    .withMessage('Venue address is required'),
  body('venue.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('venue.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('venue.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  body('pricing.regular.price')
    .isFloat({ min: 0 })
    .withMessage('Regular price must be a positive number'),
  body('capacity.total')
    .isInt({ min: 1 })
    .withMessage('Total capacity must be at least 1'),
  body('registrationDeadline')
    .isISO8601()
    .withMessage('Please enter a valid registration deadline')
];

// Public routes
router.get('/categories', getCategories);
router.get('/:id', getEvent);
router.get('/', getEvents);

// Protected routes (Admin only)
router.post('/', protect, admin, eventValidation, createEvent);
router.put('/:id', protect, admin, eventValidation, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;

