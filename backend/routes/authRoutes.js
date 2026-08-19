const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure this path points to your User model

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { loginId, password, withdrawalMobile } = req.body;

    // Guard clause: Prevent crashes if fields are undefined
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Login ID (Email or Phone) and password are required.' });
    }

    const isEmail = loginId.includes('@');
    const cleanLoginId = isEmail ? loginId.toLowerCase().trim() : loginId.trim();
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email: isEmail ? cleanLoginId : undefined,
      mobile: !isEmail ? cleanLoginId : undefined,
      password: hashedPassword,
      withdrawal_mobile: withdrawalMobile || cleanLoginId, 
    });

    await newUser.save();
    return res.status(201).json({ message: 'User created. Please log in.' });
  } catch (error) {
    console.error('Registration Error:', error);
    // Return 400 if Mongoose validation fails or duplicate key (code 11000) occurs
    return res.status(400).json({ error: 'Registration failed. User or mobile number may already exist.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;

    // Guard clause: Prevent crashes if fields are undefined
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Login ID and password are required.' });
    }

    const isEmail = loginId.includes('@');
    const cleanLoginId = isEmail ? loginId.toLowerCase().trim() : loginId.trim();
    
    // Dynamically search by email or mobile depending on what the user typed
    const user = await User.findOne(isEmail ? { email: cleanLoginId } : { mobile: cleanLoginId });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fallback secret prevents crashes if Render environment variable is missing
    const secret = process.env.JWT_SECRET || 'default_jwt_secret_key_123';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '1d' });
    
    return res.json({ 
      token, 
      user: { 
        id: user._id, 
        real_balance: user.real_balance, 
        demo_balance: user.demo_balance 
      } 
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

module.exports = router;
