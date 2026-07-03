const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

// @desc    Get all available drivers (online and available)
// @route   GET /api/drivers/available
const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ isOnline: true, isAvailable: true }).select(
      '-password'
    );

    res.json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    console.error('Get available drivers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle driver online/offline status
// @route   PATCH /api/drivers/toggle-availability
const toggleAvailability = async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can toggle availability' });
    }

    const driver = await Driver.findById(req.user._id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.isOnline = !driver.isOnline;
    await driver.save();

    res.json({
      success: true,
      driver: {
        _id: driver._id,
        id: driver._id,
        name: driver.name,
        email: driver.email,
        username: driver.username,
        phone: driver.phone,
        role: driver.role,
        vehicleDetails: driver.vehicleDetails,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        rating: driver.rating,
        totalRides: driver.totalRides,
      },
      isOnline: driver.isOnline,
      message: driver.isOnline ? 'You are now online' : 'You are now offline',
    });
  } catch (error) {
    console.error('Toggle availability error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update driver's location
// @route   PATCH /api/drivers/update-location
const updateLocation = async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can update location' });
    }

    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Valid coordinates [longitude, latitude] are required' });
    }

    const driver = await Driver.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates,
        },
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      location: driver.location,
    });
  } catch (error) {
    console.error('Update location error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get incoming pending rides for drivers
// @route   GET /api/drivers/incoming-rides
const getIncomingRides = async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can view incoming rides' });
    }

    const rides = await Ride.find({ status: 'pending' })
      .populate('rider', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error('Get incoming rides error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAvailableDrivers,
  toggleAvailability,
  updateLocation,
  getIncomingRides,
};
