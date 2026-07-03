const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { submitRating, getDriverRatings } = require('../controllers/ratingController');

router.post('/:rideId', auth, submitRating);
router.get('/driver/:driverId', getDriverRatings);

module.exports = router;
