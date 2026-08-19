// sockets/gameHandler.js
const onlineUsers = new Map();
const activeRooms = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {

    socket.on('register_presence', (userData) => {
      onlineUsers.set(socket.id, {
        socketId: socket.id,
        userId: userData.userId,
        username: userData.username || 'Player_' + Math.floor(Math.random() * 900 + 100),
        country: userData.country || 'Kenya',
        badge: '💎 Elite Grandmaster',
        status: 'Lobby'
      });
      io.emit('online_users_update', Array.from(onlineUsers.values()));
    });

    // Create Chess Room
    socket.on('create_room', ({ entryFee }) => {
      const host = onlineUsers.get(socket.id);
      if (!host) return;

      const roomId = `room_${Date.now()}`;
      const room = {
        roomId,
        gameType: 'chess',
        entryFee,
        maxPlayers: 2,
        hostSocketId: socket.id,
        players: [host],
        gameState: { turn: socket.id }
      };

      activeRooms.set(roomId, room);
      socket.join(roomId);

      host.status = 'Waiting in Chess Room';
      io.emit('online_users_update', Array.from(onlineUsers.values()));
      io.emit('rooms_list_update', Array.from(activeRooms.values()));
      socket.emit('room_joined', room);
    });

    // Join Chess Room Slot
    socket.on('join_room', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      const player = onlineUsers.get(socket.id);
      if (!room || !player) return;

      if (room.players.length < 2) {
        room.players.push(player);
        socket.join(roomId);
        player.status = 'Waiting in Chess Room';

        io.to(roomId).emit('room_update', room);
        io.emit('online_users_update', Array.from(onlineUsers.values()));
        io.emit('rooms_list_update', Array.from(activeRooms.values()));
        socket.emit('room_joined', room);
      } else {
        socket.emit('error', 'Chess room is full!');
      }
    });

    // Start Chess Match (Host Only)
    socket.on('start_match', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.hostSocketId !== socket.id) return;

      room.players.forEach(p => {
        const client = onlineUsers.get(p.socketId);
        if (client) client.status = 'Playing Chess';
      });

      io.to(roomId).emit('game_started', { 
        roomId, 
        gameType: 'chess', 
        players: room.players,
        pool: room.entryFee * room.players.length 
      });

      io.emit('online_users_update', Array.from(onlineUsers.values()));
      io.emit('rooms_list_update', Array.from(activeRooms.values()));
    });

    // Real-Time Chess Move and Turn Validation
    socket.on('make_move', ({ roomId, moveData }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      if (room.gameState.turn !== socket.id) {
        socket.emit('error', '⚠️ Rule Violation: It is not your turn to move!');
        return;
      }

      const nextPlayer = room.players.find(p => p.socketId !== socket.id);
      if (nextPlayer) {
        room.gameState.turn = nextPlayer.socketId;
      }

      socket.to(roomId).emit('opponent_moved', {
        ...moveData,
        nextTurnSocket: room.gameState.turn
      });
    });

    // Real-Time Chat Message Handler
    socket.on('send_chat_message', ({ roomId, message, sender }) => {
      io.to(roomId).emit('receive_chat_message', { message, sender, timestamp: new Date().toLocaleTimeString() });
    });

    // Conclude Match
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
