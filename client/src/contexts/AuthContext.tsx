import { createContext, useContext, useEffect, useState, type ReactNode} from "react";
import { useNavigate } from '@tanstack/react-router';
import type { User } from "../types";
import axiosInstance from "../api/axios";

interface AuthContextType {
    isAuthenticated: boolean;
    userToken: string | null;
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isLoadingAuth: boolean;
    fetchUserDetails: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children } : { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const navigate = useNavigate();

    const fetchUserDetails = async () => {
        if(!userToken) {
            setUser(null);
            return;
        }
        try {
            const response = await axiosInstance.get('/profile/me');

            const profileData = response.data;
            if (profileData && profileData.user && profileData.username) {
                setUser({
                    _id: profileData.user,
                    username: profileData.username,
                    email: profileData.email
                });
            } else {
                console.warn("Profile data for user details not as expected.", profileData);
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            logout();
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (token) {
            setIsAuthenticated(true);
            setUserToken(token);
            fetchUserDetails();
        }
        setIsLoadingAuth(false);
    }, []);

    useEffect(() => {
        if (userToken && isAuthenticated) {
            fetchUserDetails();
        } else if (!userToken) {
            setUser(null);
        }
    }, [userToken, isAuthenticated]);

    const login = (token: string) => {
        localStorage.setItem('userToken', token);
        setIsAuthenticated(true);
        setUserToken(token);
    };

    const logout = () => {
        localStorage.removeItem('userToken');
        setIsAuthenticated(false);
        setUserToken(null);
        setUser(null);
        navigate({ to: '/auth' });
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, userToken, user, login, logout, isLoadingAuth, fetchUserDetails }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a AuthProvider');
    }
    return context;
}
