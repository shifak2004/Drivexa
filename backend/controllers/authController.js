const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');
const User = require('../models/User');
const Driver = require('../models/Driver');

const cleanText = (value) => (typeof value === 'string' ? value.trim() : value);
const cleanEmail = (value) => cleanText(value)?.toLowerCase();

const getSignupErrorMessage = (error) => {
  if (error.name === 'ValidationError') {
    const firstError = Object.values(error.errors)[0];
    return firstError?.message || 'Please check the signup details';
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
    if (field === 'email') return 'Email already registered';
    if (field === 'username') return 'Username already taken';
    return 'Account already exists';
  }

  return null;
};

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new rider
// @route   POST /api/auth/rider/signup
const riderSignup = async (req, res) => {
  try {
    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const username = cleanText(req.body.username);
    const password = req.body.password;
    const phone = cleanText(req.body.phone);

    // Validation
    if (!name || !email || !username || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken',
      });
    }

    // Create user
    const user = await User.create({ name, email, username, password, phone });

    const token = generateToken(user._id, 'rider');

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Rider signup error:', error.message);
    const message = getSignupErrorMessage(error);
    res.status(message ? 400 : 500).json({ message: message || 'Server error' });
  }
};

// @desc    Login rider
// @route   POST /api/auth/rider/login
const riderLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, 'rider');

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Rider login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register a new driver
// @route   POST /api/auth/driver/signup
const driverSignup = async (req, res) => {
  try {
    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const username = cleanText(req.body.username);
    const password = req.body.password;
    const phone = cleanText(req.body.phone);
    const vehicleDetails = {
      make: cleanText(req.body.vehicleDetails?.make),
      model: cleanText(req.body.vehicleDetails?.model),
      color: cleanText(req.body.vehicleDetails?.color),
      plateNumber: cleanText(req.body.vehicleDetails?.plateNumber),
    };

    // Validation
    if (!name || !email || !username || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!vehicleDetails || !vehicleDetails.make || !vehicleDetails.model || !vehicleDetails.color || !vehicleDetails.plateNumber) {
      return res.status(400).json({ message: 'Complete vehicle details are required (make, model, color, plateNumber)' });
    }

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ $or: [{ email }, { username }] });
    if (existingDriver) {
      return res.status(400).json({
        message: existingDriver.email === email
          ? 'Email already registered'
          : 'Username already taken',
      });
    }

    // Create driver
    const driver = await Driver.create({
      name,
      email,
      username,
      password,
      phone,
      vehicleDetails,
    });

    const token = generateToken(driver._id, 'driver');

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: driver._id,
        id: driver._id,
        name: driver.name,
        email: driver.email,
        username: driver.username,
        phone: driver.phone,
        role: driver.role,
        vehicleDetails: driver.vehicleDetails,
      },
    });
  } catch (error) {
    console.error('Driver signup error:', error.message);
    const message = getSignupErrorMessage(error);
    res.status(message ? 400 : 500).json({ message: message || 'Server error' });
  }
};

// @desc    Login driver
// @route   POST /api/auth/driver/login
const driverLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await driver.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(driver._id, 'driver');

    res.json({
      success: true,
      token,
      user: {
        _id: driver._id,
        id: driver._id,
        name: driver.name,
        email: driver.email,
        username: driver.username,
        phone: driver.phone,
        role: driver.role,
        vehicleDetails: driver.vehicleDetails,
        isOnline: driver.isOnline,
        rating: driver.rating,
      },
    });
  } catch (error) {
    console.error('Driver login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  riderSignup,
  riderLogin,
  driverSignup,
  driverLogin,
  getProfile,
};
