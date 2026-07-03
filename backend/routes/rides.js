const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createRide,
  getRideHistory,
  getRideById,
  acceptRide,
  rejectRide,
  updateRideStatus,
  cancelRide,
} = require('../controllers/rideController');

router.post('/create', auth, createRide);
router.get('/history', auth, getRideHistory);
router.get('/:id', auth, getRideById);
router.patch('/:id/accept', auth, acceptRide);
router.patch('/:id/reject', auth, rejectRide);
router.patch('/:id/status', auth, updateRideStatus);
router.patch('/:id/cancel', auth, cancelRide);

module.exports = router;
