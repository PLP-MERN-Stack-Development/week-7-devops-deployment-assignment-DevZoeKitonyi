const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { validate, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
router.use(authLimiter);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'mern-app',
      audience: 'mern-app-users'
    }
  );
};

// Register
router.post('/register', validate(schemas.register), async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      logger.warn(`Registration attempt with existing credentials`, {
        requestId: req.id,
        email: email.toLowerCase(),
        username,
        ip: req.ip
      });
      
      return res.status(409).json({ 
        success: false,
        message: 'User with this email or username already exists',
        requestId: req.id
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    // Generate JWT
    const token = generateToken(user._id);

    logger.info(`User registered successfully`, {
      requestId: req.id,
      userId: user._id,
      username,
      email: email.toLowerCase(),
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      requestId: req.id
    });
  } catch (error) {
    logger.error('Registration error:', {
      requestId: req.id,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    next(error);
  }
});

// Login
router.post('/login', validate(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      logger.warn(`Login attempt with non-existent email`, {
        requestId: req.id,
        email: email.toLowerCase(),
        ip: req.ip
      });
      
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        requestId: req.id
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login attempt with incorrect password`, {
        requestId: req.id,
        userId: user._id,
        email: email.toLowerCase(),
        ip: req.ip
      });
      
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        requestId: req.id
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = generateToken(user._id);

    logger.info(`User logged in successfully`, {
      requestId: req.id,
      userId: user._id,
      email: email.toLowerCase(),
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      requestId: req.id
    });
  } catch (error) {
    logger.error('Login error:', {
      requestId: req.id,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        requestId: req.id
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        requestId: req.id
      });
    }

    // Generate new token
    const newToken = generateToken(user._id);

    logger.info(`Token refreshed successfully`, {
      requestId: req.id,
      userId: user._id,
      ip: req.ip
    });

    res.json({
      success: true,
      token: newToken,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Token refresh error:', {
      requestId: req.id,
      error: error.message,
      ip: req.ip
    });
    next(error);
  }
});

// Logout (optional - for token blacklisting in future)
router.post('/logout', (req, res) => {
  logger.info(`User logged out`, {
    requestId: req.id,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
    requestId: req.id
  });
});

module.exports = router;