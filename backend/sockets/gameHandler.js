// sockets/gameHandler.js
const onlineUsers = new Map(); // Tracks all connected devices/accounts globally
const waitingPlayers = new Map(); // Tracks players in the matchmaking queue
const activeMatches = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    // 1. User registers presence upon login/connection
    socket.on('register_presence', (userData) => {
      onlineUsers.set(socket.id, {
        socketId: socket.id,
        userId: userData.userId,
        username: userData.username || 'Player',
        country: userData.country || 'Kenya',
        badge: userData.badge || '🔥 Veteran',
        status: 'Lobby',
        gameType: null,
        entryFee: null
      });

      // Broadcast updated online users list to everyone globally
      io.emit('online_users_update', Array.from(onlineUsers.values()));
    });

    // 2. Join Matchmaking / Waiting Room
    socket.on('join_match', (data) => {
      const { gameType, entryFee } = data;
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      user.status = 'Waiting';
      user.gameType = gameType;
      user.entryFee = entryFee;
      onlineUsers.set(socket.id, socket.id);

      // Check for automatic matchmaking with same game & fee
      const opponentId = [...waitingPlayers.keys()].find((id) => {
        const p = waitingPlayers.get(id);
        return p.gameType === gameType && p.entryFee === entryFee && id !== socket.id;
      });

      if (opponentId) {
        const opponent = waitingPlayers.get(opponentId);
        const matchId = `match_${Date.now()}`;
        waitingPlayers.delete(opponentId);

        user.status = 'Playing';
        onlineUsers.get(opponentId).status = 'Playing';

        socket.join(matchId);
        io.sockets.sockets.get(opponentId)?.join(matchId);

        io.to(matchId).emit('game_start', { matchId, pool: entryFee * 2 });
      } else {
        waitingPlayers.set(socket.id, { socketId: socket.id, gameType, entryFee });
        socket.emit('waiting_for_opponent');
      }

      io.emit('online_users_update', Array.from(onlineUsers.values()));
    });

    // 3. Remote Direct Challenge System
    socket.on('send_challenge', ({ targetSocketId, gameType, entryFee }) => {
      const challenger = onlineUsers.get(socket.id);
      if (!challenger) return;

      // Send challenge notification directly to the target device/user
      io.to(targetSocketId).emit('receive_challenge', {
        challengerSocketId: socket.id,
        challengerName: challenger.username,
        country: challenger.country,
        badge: challenger.badge,
        gameType,
        entryFee
      });
    });

    socket.on('accept_challenge', ({ challengerSocketId, gameType, entryFee }) => {
      const matchId = `challenge_${Date.now()}`;
      const user = onlineUsers.get(socket.id);
      const challenger = onlineUsers.get(challengerSocketId);

      if (!user || !challenger) return;

      user.status = 'Playing';
      challenger.status = 'Playing';

      socket.join(matchId);
      io.sockets.sockets.get(challengerSocketId)?.join(matchId);

      io.to(matchId).emit('game_start', { matchId, pool: entryFee * 2 });
      io.emit('online_users_update', Array.from(onlineUsers.values()));
    });

    // 4. Handle Disconnections
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      waitingPlayers.delete(socket.id);
      io.emit('online_users_update', Array.from(onlineUsers.values()));
    });
  });
};
