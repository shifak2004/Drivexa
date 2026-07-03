const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  riderSignup,
  riderLogin,
  driverSignup,
  driverLogin,
  getProfile,
} = require('../controllers/authController');

// Rider routes
router.post('/rider/signup', riderSignup);
router.post('/rider/login', riderLogin);

// Driver routes
router.post('/driver/signup', driverSignup);
router.post('/driver/login', driverLogin);

// Profile (protected)
router.get('/profile', auth, getProfile);

module.exports = router;
