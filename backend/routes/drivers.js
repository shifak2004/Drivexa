const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAvailableDrivers,
  toggleAvailability,
  updateLocation,
  getIncomingRides,
} = require('../controllers/driverController');

router.get('/available', getAvailableDrivers);
router.patch('/toggle-availability', auth, toggleAvailability);
router.patch('/update-location', auth, updateLocation);
router.get('/incoming-rides', auth, getIncomingRides);

module.exports = router;
