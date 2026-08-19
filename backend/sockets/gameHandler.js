// sockets/gameHandler.js
const onlineUsers = new Map();
const activeRooms = new Map(); // Tracks live game sessions and moves

module.exports = (io) => {
  io.on('connection', (socket) => {

    socket.on('register_presence', (userData) => {
      onlineUsers.set(socket.id, {
        socketId: socket.id,
        userId: userData.userId,
        username: userData.username || 'Player_' + Math.floor(Math.random() * 900 + 100),
        country: userData.country || 'Kenya',
        badge: '💎 Elite Expert',
        status: 'Lobby'
      });
      io.emit('online_users_update', Array.from(onlineUsers.values()));
    });

    // Create match room requiring player selection
    socket.on('create_room', ({ gameType, entryFee, maxPlayers }) => {
      const host = onlineUsers.get(socket.id);
      if (!host) return;

      const roomId = `room_${Date.now()}`;
      const room = {
        roomId,
        gameType,
        entryFee,
        maxPlayers,
        hostSocketId: socket.id,
        players: [host],
        gameState: { turn: socket.id, board: null }
      };

      activeRooms.set(roomId, room);
      socket.join(roomId);

      host.status = 'Waiting in Room';
      io.emit('online_users_update', Array.from(onlineUsers.values()));
      io.emit('rooms_list_update', Array.from(activeRooms.values()));
      socket.emit('room_joined', room);
    });

    // Join room slot
    socket.on('join_room', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      const player = onlineUsers.get(socket.id);
      if (!room || !player) return;

      if (room.players.length < room.maxPlayers) {
        room.players.push(player);
        socket.join(roomId);
        player.status = 'Waiting in Room';

        io.to(roomId).emit('room_update', room);
        io.emit('online_users_update', Array.from(onlineUsers.values()));
        io.emit('rooms_list_update', Array.from(activeRooms.values()));
        socket.emit('room_joined', room);
      } else {
        socket.emit('error', 'Room is completely full!');
      }
    });

    // Host triggers match start
    socket.on('start_match', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.hostSocketId !== socket.id) return;

      room.players.forEach(p => {
        const client = onlineUsers.get(p.socketId);
        if (client) client.status = 'Playing';
      });

      io.to(roomId).emit('game_started', { 
        roomId, 
        gameType: room.gameType, 
        players: room.players,
        pool: room.entryFee * room.players.length 
      });

      io.emit('online_users_update', Array.from(onlineUsers.values()));
      io.emit('rooms_list_update', Array.from(activeRooms.values()));
    });

    // Real-Time Click / Move Sync with Rule Validation
    socket.on('make_move', ({ roomId, moveData }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      // Rule Validation: Enforce alternating turns for Chess, Checkers, and Tic-Tac-Toe
      if (room.gameState.turn && room.gameState.turn !== socket.id) {
        socket.emit('error', '⚠️ Rule Violation: It is not your turn to play!');
        return;
      }

      // Determine the next player's turn pointer
      const nextPlayer = room.players.find(p => p.socketId !== socket.id);
      if (nextPlayer) {
        room.gameState.turn = nextPlayer.socketId;
      }

      // Broadcast player click/move action and updated turn state to the other opponent(s) in the room
      socket.to(roomId).emit('opponent_moved', {
        ...moveData,
        nextTurnSocket: room.gameState.turn
      });
    });

    // Settle Match & Allocate Funds
    socket.on('conclude_match', ({ roomId, winnerId, isDraw, payout }) => {
      io.to(roomId).emit('match_ended', { winnerId, isDraw, payout });
      activeRooms.delete(roomId);
      io.emit('rooms_list_update', Array.from(activeRooms.values()));
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      for (let [roomId, room] of activeRooms.entries()) {
        if (room.hostSocketId === socket.id) {
          activeRooms.delete(roomId);
        }
      }
      io.emit('online_users_update', Array.from(onlineUsers.values()));
      io.emit('rooms_list_update', Array.from(activeRooms.values()));
    });
  });
};
