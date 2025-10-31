import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React, { useState } from 'react'
import huggersUnitedLogo from '../assets/huggers-united-logo.png';
import axiosInstance from '../api/axios'
import { useAuth } from '../contexts/AuthContext';

export const Route = createFileRoute('/auth')({
  component: Auth,
})

function Auth() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const onHandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('submit')
        setError(null);
        setLoading(true);

        try {
            // Login Logic
            if (isLogin) {
                const response = await axiosInstance.post('/auth/login', {
                    email,
                    password
                });
                const { token, _id, username: loggedInUsername } = response.data;
                console.log('Login successful!');
                console.log('User ID:', _id);
                console.log('Username:', loggedInUsername);
                console.log('Token:', token);

                login(token);

                alert('Login successful!');
                navigate({ to: '/' });
            } else {
                // Register Logic
                const response = await axiosInstance.post('/auth/register', {
                    username,
                    email,
                    password
                });
                const { token, _id, username: registeredUsername } = response.data;
                console.log('Registration successful!');
                console.log('User ID:', _id);
                console.log('Username:', registeredUsername);
                console.log('Token:', token);

                login(token);
                alert('Registration successful!');
                navigate({ to: '/create-profile' });
            }
        } catch(err: any) {
            console.error(isLogin ? 'Login failed' : 'Registration failed', err);
            if (err.response) {
                setError(err.response.data.message || (isLogin ? 'Login failed. Please try again' : 'Registration failed. Please try again'));
                alert(`${isLogin ? 'Login' : 'Registration'} failed: ${err.response.data.message}. Please try again` || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    }
    return (
    <div className='flex min-h-screen items-center justify-center bg-blue-50'>
        <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg'>
            <div className='mb-8 flex flex-col items-center'>
                <img
                src={huggersUnitedLogo}
                alt="Huggers United Logo"
                className="mb-4 h-24 w-24 object-contain"
                />
                <h1 className="text-center text-4xl font-extrabold text-blue-700">
                    Huggers United
                </h1>
                <p className="mt-2 text-center text-lg text-gray-600">
                    Find someone to hug with
                </p>
            </div>
            <form onSubmit={onHandleSubmit} className='space-y-6'>
                <h2 className="text-center text-3xl font-bold text-gray-800">
                    {isLogin ? 'Login' : 'Register'}
                </h2>
                {error && <p className="text-red-500 text-center">{error}</p>}
                {!isLogin && ( // Only show username for registration
                    <div>
                    <label
                        htmlFor="register-username"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Username
                    </label>
                    <input
                        type="text"
                        id="register-username"
                        className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Choose a username"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        required={!isLogin} // Required only for registration
                    />
                    </div>
                )}
                <div>
                    <label
                    htmlFor="login-email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                    >
                    Email
                    </label>
                    <input
                    type="email"
                    id="login-email"
                    className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="you@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    required
                    />
                </div>
                <div>
                    <label
                    htmlFor="login-password"
                    className="mb-2 block text-sm font-medium text-gray-700"
                    >
                    Password
                    </label>
                    <input
                    type="password"
                    id="login-password"
                    className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full rounded-md bg-blue-600 p-3 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                >
                    {loading ? (isLogin ? 'Logging in...' : 'Registering...') : isLogin ? 'Login' : 'Register'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-medium text-blue-600 hover:text-blue-500"
                    type="button" // Important for buttons inside forms not to submit
                >
                    {isLogin ? 'Register' : 'Login'}
                </button>
            </p>
        </div>
    </div>
    )
}
