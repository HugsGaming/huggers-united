import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AuthProvider } from '../contexts/AuthContext';
import axiosInstance from '../api/axios';
import { SocketProvider } from '../contexts/SocketContext';
import { ToastContainer } from 'react-toastify';

const RootLayout = () => (
  <AuthProvider>
    <SocketProvider>
      <ToastContainer />
      <Outlet />
    </SocketProvider>
  </AuthProvider>
)

export const Route = createRootRoute({ 
  component: RootLayout,
  beforeLoad: () => {
    const token = localStorage.getItem('userToken');
    const isAuthenticated = !!token;
    return {
      isAuthenticated,
      axios: axiosInstance
    }
  }
})