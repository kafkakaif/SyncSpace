import express from 'express';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  findUserById,
  createUser,
} from '../models/userStore.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'syncspace_jwt_dev_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long.',
      });
    }

    if (name.trim().length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot exceed 60 characters.',
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please sign in.',
      });
    }

    // Default avatar based on initials
    const initials = name
      .trim()
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const user = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      password,
      avatar: initials,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during account creation. Please try again.',
    });
  }
});

// Common handler for login & signin
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during sign in. Please try again.',
    });
  }
};

// POST /api/auth/login and /api/auth/signin
router.post('/login', handleLogin);
router.post('/signin', handleLogin);

// GET /api/auth/me (Protected)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve user profile.',
    });
  }
});

// POST /api/auth/demo
router.post('/demo', async (req, res) => {
  try {
    const demoEmail = 'demo@syncspace.dev';
    let demoUser = await findUserByEmail(demoEmail);

    if (!demoUser) {
      demoUser = await createUser({
        name: 'Demo Engineer',
        email: demoEmail,
        password: 'SyncSpaceDemo2026!',
        avatar: 'DE',
      });
    }

    const token = generateToken(demoUser);

    return res.json({
      success: true,
      message: 'Signed in as Demo Engineer!',
      token,
      user: {
        id: demoUser.id || demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        avatar: demoUser.avatar,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to start demo session.',
    });
  }
});

export default router;
