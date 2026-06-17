import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js'; // Crucial: Changed require() to import and added .js extension

const router = express.Router();

// ---------------- Email/Password Registration ----------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------------- Email/Password Login ----------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Create JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------------- Google OAuth ----------------
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://localhost:5173/login',
  }),
  (req, res) => {
    try {
      const user = req.user; // Fetched/created in googleAuth.js

      // Generate JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      // Redirect with token to frontend
      res.redirect(`http://localhost:5173/dashboard?token=${token}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect('http://localhost:5173/login');
    }
  }
);

// ---------------- Get Current User (via JWT) ----------------
router.get('/user', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // NOTE: User model must be correctly imported and exported from its file
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('Error in /user route:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ---------------- Logout ----------------
router.get('/logout', (req, res) => {
  // In a JWT setup, client handles 'logout' by deleting the token.
  // We send a 200 OK.
  res.json({ message: 'Logged out' });
});

export default router;
