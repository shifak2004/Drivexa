const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

const sameId = (left, right) => {
  if (!left || !right) return false;
  return left.toString() === right.toString();
};

const canViewRide = (ride, req) => {
  if (req.userRole === 'rider') return sameId(ride.rider?._id || ride.rider, req.user._id);
  if (req.userRole === 'driver') return sameId(ride.driver?._id || ride.driver, req.user._id);
  return false;
};

// Haversine formula to calculate distance between two coordinates (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate fare: ₹10/km + ₹50 base fare
const calculateFare = (distance) => {
  const baseFare = 50;
  const perKmRate = 10;
  return Math.round(baseFare + perKmRate * distance);
};

// @desc    Create a new ride
// @route   POST /api/rides/create
const createRide = async (req, res) => {
  try {
    if (req.userRole !== 'rider') {
      return res.status(403).json({ message: 'Only riders can create rides' });
    }

    const { pickup, destination, driverId } = req.body;

    if (!pickup || !pickup.address || !pickup.coordinates || pickup.coordinates.length !== 2) {
      return res.status(400).json({ message: 'Valid pickup address and coordinates are required' });
    }

    if (!destination || !destination.address || !destination.coordinates || destination.coordinates.length !== 2) {
      return res.status(400).json({ message: 'Valid destination address and coordinates are required' });
    }

    let selectedDriver = null;
    if (driverId) {
      selectedDriver = await Driver.findOne({
        _id: driverId,
        isOnline: true,
        isAvailable: true,
      });

      if (!selectedDriver) {
        return res.status(400).json({ message: 'Selected driver is no longer available' });
      }
    }

    // Calculate distance using Haversine formula. Stored coordinates are [longitude, latitude].
    const distance = calculateDistance(
      pickup.coordinates[1],
      pickup.coordinates[0],
      destination.coordinates[1],
      destination.coordinates[0]
    );

    // Calculate fare
    const fare = calculateFare(distance);

    // Estimate duration (assuming average speed of 30 km/h in city)
    const duration = Math.round((distance / 30) * 60); // in minutes

    const ride = await Ride.create({
      rider: req.user._id,
      pickup,
      destination,
      driver: selectedDriver?._id || null,
      distance: Math.round(distance * 100) / 100,
      fare,
      duration,
      status: selectedDriver ? 'accepted' : 'pending',
    });

    if (selectedDriver) {
      await Driver.findByIdAndUpdate(selectedDriver._id, { isAvailable: false });
    }

    const populatedRide = await Ride.findById(ride._id)
      .populate('rider', 'name email phone')
      .populate('driver', 'name email phone vehicleDetails rating location');

    res.status(201).json({
      success: true,
      ride: populatedRide,
    });
  } catch (error) {
    console.error('Create ride error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get ride history for current user
// @route   GET /api/rides/history
const getRideHistory = async (req, res) => {
  try {
    let query;

    if (req.userRole === 'rider') {
      query = { rider: req.user._id };
    } else if (req.userRole === 'driver') {
      query = { driver: req.user._id };
    }

    const rides = await Ride.find(query)
      .populate('rider', 'name email phone')
      .populate('driver', 'name email phone vehicleDetails rating')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error('Get ride history error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single ride by ID
// @route   GET /api/rides/:id
const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('rider', 'name email phone')
      .populate('driver', 'name email phone vehicleDetails rating location');

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (!canViewRide(ride, req)) {
      return res.status(403).json({ message: 'You are not allowed to access this ride' });
    }

    res.json({
      success: true,
      ride,
    });
  } catch (error) {
    console.error('Get ride by ID error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Driver accepts a ride
// @route   PATCH /api/rides/:id/accept
const acceptRide = async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can accept rides' });
    }

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Ride is no longer pending' });
    }

    ride.driver = req.user._id;
    ride.status = 'accepted';
    await ride.save();

    // Set driver as unavailable
    await Driver.findByIdAndUpdate(req.user._id, { isAvailable: false });

    const populatedRide = await Ride.findById(ride._id)
      .populate('rider', 'name email phone')
      .populate('driver', 'name email phone vehicleDetails rating');

    res.json({
      success: true,
      ride: populatedRide,
    });
  } catch (error) {
    console.error('Accept ride error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Driver rejects a ride (no-op, ride stays pending)
// @route   PATCH /api/rides/:id/reject
const rejectRide = async (req, res) => {
  try {
    if (req.userRole !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can reject rides' });
    }

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // No-op — ride stays pending for other drivers
    res.json({
      success: true,
      message: 'Ride rejected, it remains available for other drivers',
      ride,
    });
  } catch (error) {
    console.error('Reject ride error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update ride status
// @route   PATCH /api/rides/:id/status
const updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (req.userRole !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can update ride status' });
    }

    if (!sameId(ride.driver, req.user._id)) {
      return res.status(403).json({ message: 'You can only update your assigned ride' });
    }

    // Validate status transitions
    const validTransitions = {
      accepted: ['ongoing'],
      ongoing: ['completed'],
    };

    if (!validTransitions[ride.status] || !validTransitions[ride.status].includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from '${ride.status}' to '${status}'`,
      });
    }

    ride.status = status;
    await ride.save();

    // When ride is completed, update driver availability and ride count
    if (status === 'completed') {
      await Driver.findByIdAndUpdate(ride.driver, {
        isAvailable: true,
        $inc: { totalRides: 1 },
      });
    }

    const populatedRide = await Ride.findById(ride._id)
      .populate('rider', 'name email phone')
      .populate('driver', 'name email phone vehicleDetails rating');

    res.json({
      success: true,
      ride: populatedRide,
    });
  } catch (error) {
    console.error('Update ride status error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel a ride
// @route   PATCH /api/rides/:id/cancel
const cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const isRiderOwner = req.userRole === 'rider' && sameId(ride.rider, req.user._id);
    const isAssignedDriver = req.userRole === 'driver' && sameId(ride.driver, req.user._id);

    if (!isRiderOwner && !isAssignedDriver) {
      return res.status(403).json({ message: 'You can only cancel your own ride' });
    }

    if (!['pending', 'accepted'].includes(ride.status)) {
      return res.status(400).json({
        message: 'Can only cancel rides that are pending or accepted',
      });
    }

    // If ride was accepted, set driver back to available
    if (ride.status === 'accepted' && ride.driver) {
      await Driver.findByIdAndUpdate(ride.driver, { isAvailable: true });
    }

    ride.status = 'cancelled';
    await ride.save();

    res.json({
      success: true,
      message: 'Ride cancelled successfully',
      ride,
    });
  } catch (error) {
    console.error('Cancel ride error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createRide,
  getRideHistory,
  getRideById,
  acceptRide,
  rejectRide,
  updateRideStatus,
  cancelRide,
};
