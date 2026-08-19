// sockets/gameHandler.js
const onlineUsers = new Map(); 
const gameRooms = new Map(); // Custom rooms requiring 3+ players selection

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    socket.on('register_presence', (userData) => {
      onlineUsers.set(socket.id, {
        socketId: socket.id,
        userId: userData.userId,
        username: userData.username || 'MobilePlayer',
        country: userData.country || 'Kenya',
        badge: userData.badge || '⭐ Pro Specialist',
        status: 'Lobby'
      });
      io.emit('online_users_update', Array.from(onlineUsers.values()));
    });

    // Handle Custom Room Creation for 3+ or 2-player games requiring manual selection
    socket.on('create_custom_room', ({ gameType, entryFee, maxPlayers }) => {
      const host = onlineUsers.get(socket.id);
      if (!host) return;

      const roomId = `room_${Date.now()}`;
      const roomData = {
        roomId,
        gameType,
        entryFee,
        maxPlayers,
        hostSocketId: socket.id,
        players: [host]
      };

      gameRooms.set(roomId, roomData);
      socket.join(roomId);
      
      host.status = 'Waiting in Room';
      io.emit('online_users_update', Array.from(onlineUsers.values()));
      io.emit('rooms_list_update', Array.from(gameRooms.values()));
      socket.emit('room_created', roomData);
    });

    // Invited player or peer joins selected room
    socket.on('join_custom_room', ({ roomId }) => {
      const room = gameRooms.get(roomId);
      const player = onlineUsers.get(socket.id);
      if (!room || !player) return;

      if (room.players.length < room.maxPlayers) {
        room.players.push(player);
        socket.join(roomId);
        player.status = 'Waiting in Room';

        io.to(roomId).emit('room_update', room);
        io.emit('online_users_update', Array.from(onlineUsers.values()));
        io.emit('rooms_list_update', Array.from(gameRooms.values()));
      } else {
        socket.emit('error', 'Room is already full!');
      }
    });

    // Host triggers match start once selected slots are filled
    socket.on('start_custom_match', ({ roomId }) => {
      const room = gameRooms.get(roomId);
      if (!room || room.hostSocketId !== socket.id) return;

      room.players.forEach(p => {
        const client = onlineUsers.get(p.socketId);
        if (client) client.status = 'Playing';
      });

      io.to(roomId).emit('game_start', { 
        gameType: room.gameType, 
        pool: room.entryFee * room.players.length 
      });
      
      gameRooms.delete(roomId);
      io.emit('online_users_update', Array.from(onlineUsers.values()));
      io.emit('rooms_list_update', Array.from(gameRooms.values()));
    });

    socket.on('match_end', ({ matchId, winnerId, isDraw, payout }) => {
      if (isDraw) {
        io.emit('match_settled', { payout, isDraw: true });
      } else {
        io.emit('match_settled', { payout, isDraw: false, winnerId });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      // Clean up rooms hosted by disconnected user
      for (let [roomId, room] of gameRooms.entries()) {
        if (room.hostSocketId === socket.id) {
          gameRooms.delete(roomId);
        }
      }
      io.emit('online_users_update', Array.from(onlineUsers.values()));
      io.emit('rooms_list_update', Array.from(gameRooms.values()));
    });
  });
};
