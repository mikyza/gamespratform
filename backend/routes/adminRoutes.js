const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path to match your user schema
const adminAuth = require('../middleware/adminAuth');

// Apply admin protection to all routes in this file
router.use(adminAuth);

/**
 * @route   GET /api/admin/users
 * @desc    Fetch list of all registered users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user registry.', details: err.message });
  }
});

/**
 * @route   PUT /api/admin/users/:id/balance
 * @desc    Manually override user balance (Deposits / Deductions)
 */
router.put('/users/:id/balance', async (req, res) => {
  try {
    const { balance } = req.body;
    if (typeof balance !== 'number' || balance < 0) {
      return res.status(400).json({ error: 'Invalid balance payload provided.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { real_balance: balance } },
      { new: true, select: '-password' }
    );

    if (!user) return res.status(404).json({ error: 'User target not found.' });

    res.status(200).json({ success: true, message: 'Balance adjusted successfully.', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user balance.', details: err.message });
  }
});

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Ban, unban, or suspend account access
 */
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'active' | 'banned' | 'suspended'
    if (!['active', 'banned', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status type.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, select: '-password' }
    );

    if (!user) return res.status(404).json({ error: 'User target not found.' });

    res.status(200).json({ success: true, message: `Account status updated to ${status}.`, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute status update.', details: err.message });
  }
});

/**
 * @route   GET /api/admin/finances
 * @desc    Aggregated platform statistics and ledger balances
 */
router.get('/finances', async (req, res) => {
  try {
    const totalStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalFloat: { $sum: '$real_balance' },
          totalUsers: { $sum: 1 },
        },
      },
    ]);

    const result = totalStats[0] || { totalFloat: 0, totalUsers: 0 };

    res.status(200).json({
      success: true,
      analytics: {
        totalSystemFloat: result.totalFloat,
        totalUsers: result.totalUsers,
        estimatedPlatformCut: Math.round(result.totalFloat * 0.1), // Example 10% rake
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute financial metrics.', details: err.message });
  }
});

module.exports = router;
