require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const socketHandler = require('./sockets/gameHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Sockets
socketHandler(io);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
    server.listen(process.env.PORT || 5000, () => console.log('Server running on port 5000'));
  })
  .catch(err => console.error(err));