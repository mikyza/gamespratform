const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { loginId, password, withdrawalMobile } = req.body;
    const isEmail = loginId.includes('@');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email: isEmail ? loginId : undefined,
      mobile: !isEmail ? loginId : undefined,
      password: hashedPassword,
      withdrawal_mobile: withdrawalMobile || loginId, // Set designated withdrawal number
    });

    await newUser.save();
    res.status(201).json({ message: 'User created. Please log in.' });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed. User may exist.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    const isEmail = loginId.includes('@');
    
    const user = await User.findOne(isEmail ? { email: loginId } : { mobile: loginId });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, real_balance: user.real_balance, demo_balance: user.demo_balance } });
  } catch (error) {
    res.status(500).json({ error: 'Login error' });
  }
});

module.exports = router;