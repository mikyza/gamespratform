const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, sparse: true, unique: true },
  mobile: { type: String, sparse: true, unique: true },
  password: { type: String, required: true },
  withdrawal_mobile: { type: String, required: true }, // Only this number can withdraw
  real_balance: { type: Number, default: 0.00, min: 0 },
  real_escrow: { type: Number, default: 0.00, min: 0 },
  demo_balance: { type: Number, default: 10000.00, min: 0 },
  demo_escrow: { type: Number, default: 0.00, min: 0 },
  is_banned: { type: Boolean, default: false },
  // Meaningful data for analytics/profile
  games_played: { type: Number, default: 0 },
  total_winnings: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);