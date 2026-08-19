// sockets/gameHandler.js
const waitingPlayers = new Map(); // Tracks players in the waiting room
const activeMatches = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    // 1. Join Match / Waiting Room Logic
    socket.on('join_match', (data) => {
      const { userId, gameType, mode, entryFee, country = "Kenya", badge = "Novice", username } = data;
      
      // Look for an opponent with the exact same entry fee and game type
      const potentialOpponentId = [...waitingPlayers.keys()].find((id) => {
        const player = waitingPlayers.get(id);
        return player.gameType === gameType && player.entryFee === entryFee && id !== socket.id;
      });

      if (potentialOpponentId) {
        // Match found - Pair them up
        const opponent = waitingPlayers.get(potentialOpponentId);
        const matchId = `match_${Date.now()}`;
        
        waitingPlayers.delete(potentialOpponentId);
        
        activeMatches.set(matchId, {
          player1: { socketId: socket.id, ...data },
          player2: { socketId: potentialOpponentId, ...opponent },
          entryFee,
          pool: entryFee * 2
        });

        socket.join(matchId);
        io.sockets.sockets.get(potentialOpponentId).join(matchId);

        io.to(matchId).emit('game_start', { matchId, pool: entryFee * 2 });
      } else {
        // No match found - Add to waiting room
        waitingPlayers.set(socket.id, { socketId: socket.id, userId, gameType, entryFee, country, badge, username });
        socket.emit('waiting_for_opponent');
        
        // Broadcast the updated waiting room to everyone so users can see who is online
        io.emit('waiting_room_update', Array.from(waitingPlayers.values()));
      }
    });

    // 2. End Match & Allocate Funds
    socket.on('match_end', async ({ matchId, winnerId, isDraw }) => {
      const match = activeMatches.get(matchId);
      if (!match) return;

      if (isDraw) {
        // Refund logic
        io.to(matchId).emit('match_settled', { payout: match.entryFee, isDraw: true });
      } else {
        // Winner takes the pool (minus platform fee if you have one)
        const payout = match.pool;
        
        // TODO: Database logic here to actually update user balances
        // Example: await User.findByIdAndUpdate(winnerId, { $inc: { balance: payout } });
        
        io.to(matchId).emit('match_settled', { payout, isDraw: false, winnerId });
      }
      activeMatches.delete(matchId);
    });

    socket.on('disconnect', () => {
      waitingPlayers.delete(socket.id);
      io.emit('waiting_room_update', Array.from(waitingPlayers.values()));
    });
  });
};
