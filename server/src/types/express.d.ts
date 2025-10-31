import { Server } from 'socket.io';

declare global {
    namespace Express {
        interface Request {
            io?: SocketIOServer;
            onlineUsers?: Map<string, string>;
        }
    }
}