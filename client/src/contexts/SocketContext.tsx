import { createContext, useEffect, useContext, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

interface SocketContextType {
    socket: Socket | null;
    onlineUsers: string[];
}

export const SocketContext = createContext<SocketContextType>({
    socket: null,
    onlineUsers: [],
});

interface SocketProviderProps {
    children: ReactNode;
}

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL;

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const { user, isAuthenticated, isLoadingAuth } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    useEffect(() => {
        if (!isLoadingAuth && isAuthenticated && user && user._id) {
            const newSocket = io(SOCKET_SERVER_URL);

            newSocket.on('connect', () => {
                console.log('Connected to socket server');
                newSocket.emit('registerUser', user._id);
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from socket server');
                setOnlineUsers([]);
            });

            newSocket.on('getOnlineUsers', (users: string[]) => {
                console.log('Online users updated:', users);
                setOnlineUsers(users);
            });

            newSocket.on('newMatch', (data: { matchId: string; otherUser: { _id: string, name: string, profilePicture?: string }; message: string }) => {
                console.log("New match:", data);
                toast.success(data.message, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                })
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            }
        } else if(!isLoadingAuth && (!isAuthenticated || !user)) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [isAuthenticated, isLoadingAuth, user]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
