import { createFileRoute, redirect } from '@tanstack/react-router';
import axiosInstance from '../api/axios';
import Dashboard from '../components/Dashboard';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({
        to: '/auth',
      });
    }

    try {
      await axiosInstance.get('/profile/me');
      return {}
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // Profile not found, redirect to create profile
        console.log('Authenticated but no profile found, redirecting to /create-profile');
        throw redirect({
          to: '/create-profile',
        });
      }
      // For any other error (e.g., server error, token invalid handled by interceptor),
      // let the error propagate or redirect to auth if the interceptor hasn't already.
      console.error('Error checking profile for home route:', error);
      // If token is invalid and interceptor hasn't acted yet, might still redirect to auth
      // or show a generic error. For now, we'll let the interceptor handle 401.
      throw redirect({
        to: '/auth', // Fallback to auth if something unexpected happens with profile check
      });
    }
  },
  component: Dashboard,
})