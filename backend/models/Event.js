const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: ['fitness', 'workshop', 'competition', 'networking', 'team-building'],
    default: 'fitness'
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Event duration is required']
  },
  venue: {
    name: {
      type: String,
      required: [true, 'Venue name is required']
    },
    address: {
      type: String,
      required: [true, 'Venue address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  pricing: {
    free: {
      type: Boolean,
      default: false
    },
    earlyBird: {
      price: {
        type: Number,
        min: 0
      },
      deadline: Date
    },
    regular: {
      price: {
        type: Number,
        required: [true, 'Regular price is required'],
        min: 0
      }
    },
    premium: {
      price: Number,
      features: [String]
    }
  },
  capacity: {
    total: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: 1
    },
    available: {
      type: Number,
      required: true
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  features: [String],
  requirements: [String],
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  speakers: [{
    name: String,
    bio: String,
    image: String,
    social: {
      linkedin: String,
      twitter: String,
      instagram: String
    }
  }],
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required']
  },
  cancellationPolicy: {
    type: String,
    maxlength: [500, 'Cancellation policy cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'venue.city': 1 });
eventSchema.index({ tags: 1 });

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  return this.capacity.available;
});

// Virtual for sold out status
eventSchema.virtual('isSoldOut').get(function() {
  return this.capacity.available <= 0;
});

// Pre-save middleware to set available capacity
eventSchema.pre('save', function(next) {
  if (this.isNew) {
    this.capacity.available = this.capacity.total;
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);

