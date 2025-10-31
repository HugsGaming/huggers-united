import express from 'express';
import connectDB from './config/db';
import { config } from './config/env';
import { logger } from './config/logger'
import authRoutes from './routes/auth.routes'
import profileRoutes from './routes/profile.routes'
import messageRoutes from './routes/message.routes'
import { errorHandler } from './middleware/errorHandler';
import cors from 'cors'

import http from 'http';
import { Server } from 'socket.io';

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            config.client_url || 'http://localhost:5173',
            'http://localhost:5173/'
        ],
        methods: ['GET', 'POST']
    }
})

app.use(express.json());

app.use(cors());

app.use((req, res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    next();
})

app.use((req, res, next) => {
    logger.info(`Request: ${req.method} ${req.url}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/messages', messageRoutes);

app.use(errorHandler);

const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {
    logger.info(`New Client Connected: ${socket.id}`);

    socket.on('registerUser', (userId: string) => {
        logger.info(`User Registered: ${userId} with Socket ID: ${socket.id}`);
        onlineUsers.set(userId, socket.id);
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    });

    socket.on('disconnect', () => {
        logger.info(`Client Disconnected: ${socket.id}`);
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    })
})



server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
});
