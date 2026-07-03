const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rider is required'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    pickup: {
      address: {
        type: String,
        required: [true, 'Pickup address is required'],
      },
      coordinates: {
        type: [Number],
        required: [true, 'Pickup coordinates are required'],
      },
    },
    destination: {
      address: {
        type: String,
        required: [true, 'Destination address is required'],
      },
      coordinates: {
        type: [Number],
        required: [true, 'Destination coordinates are required'],
      },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
      default: 'pending',
    },
    fare: {
      type: Number,
    },
    distance: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    rating: {
      type: Number,
      default: null,
    },
    review: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Ride', rideSchema);
