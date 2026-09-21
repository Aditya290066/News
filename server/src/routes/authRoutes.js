/**
 * Authentication Routes
 * 
 * Handles user registration, login, and session validation.
 * Utilizes bcryptjs for salted hashing and jsonwebtoken for stateless auth.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Generate signed JWT token
 * @param {Object} user
 * @returns {string}
 */
function createToken(user) {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me';
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/register
 * Registers a new user account
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required.'
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters in length.'
      });
    }

    // Check for existing account
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [trimmedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const [insertResult] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [trimmedName, trimmedEmail, passwordHash]
    );

    const newUser = {
      id: insertResult.insertId,
      name: trimmedName,
      email: trimmedEmail
    };

    const token = createToken(newUser);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns JWT
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Both email and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Query user by email
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
      [trimmedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    const user = rows[0];

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    const token = createToken(userData);

    res.json({
      status: 'success',
      message: 'Login successful.',
      token,
      user: userData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.'
      });
    }

    res.json({
      status: 'success',
      user: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
