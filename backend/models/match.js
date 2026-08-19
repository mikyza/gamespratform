const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  game_type: { type: String, required: true }, // e.g., 'chess', 'trivia'
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mode: { type: String, enum: ['DEMO', 'MONEY'], default: 'DEMO' },
  entry_fee: { type: Number, required: true, min: 0 },
  house_edge_percent: { type: Number, default: 10 }, // 10% rake
  winner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'DRAWN', 'DISPUTED'], default: 'WAITING' },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);