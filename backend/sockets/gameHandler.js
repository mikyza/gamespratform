const User = require('../models/User');
const Match = require('../models/Match');

module.exports = function(io) {
  const activeRooms = {}; // Stores game state and disconnect timers

  io.on('connection', (socket) => {
    socket.on('join_match', async ({ userId, gameType, mode, entryFee }) => {
      // 1. Escrow Lock / Balance Check
      const user = await User.findById(userId);
      const balanceField = mode === 'MONEY' ? 'real_balance' : 'demo_balance';
      const escrowField = mode === 'MONEY' ? 'real_escrow' : 'demo_escrow';

      if (user[balanceField] < entryFee) {
        return socket.emit('error', 'Insufficient balance');
      }

      // Deduct balance, add to escrow
      user[balanceField] -= entryFee;
      user[escrowField] += entryFee;
      await user.save();

      // 2. Matchmaking
      let match = await Match.findOne({ game_type: gameType, mode, entry_fee: entryFee, status: 'WAITING' });
      
      if (!match) {
        match = new Match({ game_type: gameType, mode, entry_fee: entryFee, players: [userId] });
        await match.save();
        socket.join(match._id.toString());
        socket.emit('waiting_for_opponent', match._id);
      } else {
        match.players.push(userId);
        match.status = 'IN_PROGRESS';
        await match.save();
        
        socket.join(match._id.toString());
        io.to(match._id.toString()).emit('game_start', match);
        activeRooms[match._id.toString()] = { match, players: match.players, state: {} };
      }
    });

    // 3. Server-side Anti-Cheat / Move Validation
    socket.on('player_move', ({ matchId, userId, moveData }) => {
      // Here you validate the move against the engine (e.g., Chess.js)
      // If illegal move -> ignore. If legal -> broadcast state
      io.to(matchId).emit('update_state', { moveData, userId });
    });

    // 4. Match Resolution & Money Distribution
    socket.on('match_end', async ({ matchId, winnerId, isDraw }) => {
      const room = activeRooms[matchId];
      if (!room) return;

      const match = await Match.findById(matchId);
      const pool = match.entry_fee * 2;
      const houseTake = pool * (match.house_edge_percent / 100);
      const winnerPayout = pool - houseTake;

      const balanceField = match.mode === 'MONEY' ? 'real_balance' : 'demo_balance';
      const escrowField = match.mode === 'MONEY' ? 'real_escrow' : 'demo_escrow';

      if (isDraw) {
        // Refund both players
        await User.updateMany({ _id: { $in: match.players } }, {
          $inc: { [balanceField]: match.entry_fee, [escrowField]: -match.entry_fee }
        });
        match.status = 'DRAWN';
      } else {
        // Clear loser's escrow, give winner payout
        const loserId = match.players.find(id => id.toString() !== winnerId.toString());
        await User.findByIdAndUpdate(loserId, { $inc: { [escrowField]: -match.entry_fee } });
        await User.findByIdAndUpdate(winnerId, { 
          $inc: { [escrowField]: -match.entry_fee, [balanceField]: winnerPayout, total_winnings: winnerPayout } 
        });
        match.status = 'COMPLETED';
        match.winner_id = winnerId;
      }

      await match.save();
      io.to(matchId).emit('match_settled', { winnerId, isDraw, payout: winnerPayout });
      delete activeRooms[matchId];
    });

    // 5. Disconnect Handling (Auto-forfeit)
    socket.on('disconnect', () => {
      // Implement a 30s timeout here. If player doesn't reconnect, auto-call match_end with opponent as winner
    });
  });
};