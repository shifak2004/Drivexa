const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

// @desc    Submit rating and review for a completed ride
// @route   POST /api/ratings/:rideId
const submitRating = async (req, res) => {
  try {
    if (req.userRole !== 'rider') {
      return res.status(403).json({ message: 'Only riders can submit ratings' });
    }

    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const ride = await Ride.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.rider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only rate your own rides' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed rides' });
    }

    if (ride.rating !== null) {
      return res.status(400).json({ message: 'This ride has already been rated' });
    }

    // Update ride with rating and review
    ride.rating = rating;
    ride.review = review || null;
    await ride.save();

    // Update driver's rating
    const driver = await Driver.findById(ride.driver);
    if (driver) {
      driver.totalRatingSum += rating;
      const ratingCount = Math.max(driver.totalRides, 1);
      driver.rating = Math.round((driver.totalRatingSum / ratingCount) * 10) / 10;
      await driver.save();
    }

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      ride,
    });
  } catch (error) {
    console.error('Submit rating error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all rated rides for a driver
// @route   GET /api/ratings/driver/:driverId
const getDriverRatings = async (req, res) => {
  try {
    const rides = await Ride.find({
      driver: req.params.driverId,
      rating: { $ne: null },
    })
      .populate('rider', 'name email')
      .select('rating review createdAt rider pickup destination')
      .sort({ createdAt: -1 });

    // Get driver info
    const driver = await Driver.findById(req.params.driverId).select(
      'name rating totalRides totalRatingSum'
    );

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({
      success: true,
      driver: {
        name: driver.name,
        rating: driver.rating,
        totalRides: driver.totalRides,
      },
      count: rides.length,
      ratings: rides,
    });
  } catch (error) {
    console.error('Get driver ratings error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitRating,
  getDriverRatings,
};
