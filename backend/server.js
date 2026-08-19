import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Message, User } from '../shared/types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket: Socket) => {
  const userId = socket.handshake.auth.userId;
  onlineUsers.set(userId, socket.id);
  
  // Broadcast presence
  socket.broadcast.emit('user_status', { userId, isOnline: true });

  // 1. Messaging & Groups
  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
  });

  socket.on('send_message', (msg: Message) => {
    // Acknowledge sent status to sender
    socket.emit('message_status', { msgId: msg.id, status: 'sent' });
    // Broadcast to room
    socket.to(msg.roomId).emit('receive_message', msg);
  });

  socket.on('message_read', ({ msgId, roomId, readerId }) => {
    socket.to(roomId).emit('message_status_update', { msgId, status: 'read', readerId });
  });

  // 2. WebRTC Signaling
  socket.on('initiate_call', ({ targetId, type, offer }) => {
    const targetSocket = onlineUsers.get(targetId);
    if (targetSocket) {
      io.to(targetSocket).emit('incoming_call', { callerId: userId, type, offer });
    }
  });

  socket.on('answer_call', ({ targetId, answer }) => {
    const targetSocket = onlineUsers.get(targetId);
    if (targetSocket) {
      io.to(targetSocket).emit('call_answered', { answer });
    }
  });

  socket.on('ice_candidate', ({ targetId, candidate }) => {
    const targetSocket = onlineUsers.get(targetId);
    if (targetSocket) {
      io.to(targetSocket).emit('ice_candidate', { candidate });
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    socket.broadcast.emit('user_status', { userId, isOnline: false, lastSeen: new Date() });
  });
});

httpServer.listen(4000, () => console.log('Signaling server running on port 4000'));
