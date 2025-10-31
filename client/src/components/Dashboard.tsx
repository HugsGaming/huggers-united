// src/pages/Dashboard.tsx
import React, { useState, useEffect, useContext } from 'react';
import SwipeDeck from '../components/SwipeDeck';
import LikedMeDeck from '../components/LikedMeDeck';
import MatchesList from '../components/MatchesList';
import ChatWindow from '../components/ChatWindow';
import ProfileUpdateModal from '../components/ProfileUpdateModal'; // Import the new modal
import { useAuth } from '../contexts/AuthContext';
import type { Match as IMatch, Profile } from '../types'; // Import UserProfile
import { SocketContext } from '../contexts/SocketContext';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axios';

import HuggersUnitedLogo from '../assets/huggers-united-logo.png';

const Dashboard: React.FC = () => {
    const { socket } = useContext(SocketContext);
    const { logout, user, fetchUserDetails } = useAuth(); // Destructure logout and user
    // New state for profile and modal
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] =
        useState<Profile | null>(null);

    // Changed activeTab to include 'profile'
    const [activeTab, setActiveTab] = useState<
        'swipe' | 'profile' | 'matches' | 'liked-me'
    >('swipe'); // Added 'profile'

    const [selectedMatch, setSelectedMatch] = useState<IMatch | null>(null);

    const [newMatchTrigger, setNewMatchTrigger] = useState(0);
    const [_, setProcessedProfileIds] = useState<Set<string>>(new Set());

    // Fetch current user's profile when the Dashboard loads or user changes
    useEffect(() => {
        const getProfile = async () => {
            if (user?._id) {
                try {
                    // This route '/profile/me' is defined in your profileRouter
                    const response = await axiosInstance.get('/profile/me');
                    setCurrentUserProfile(response.data);
                } catch (error) {
                    console.error('Error fetching current user profile:', error);
                    toast.error('Failed to load your profile details.');
                }
            }
        };
        getProfile();
    }, [user, fetchUserDetails]); // Re-fetch if `user` changes or `fetchUserDetails` is called

    useEffect(() => {
        if (socket) {
            const handleNewMatchSocketEvent = (message: {
                matchId: string;
                otherUser: any;
                message: string;
            }) => {
                console.log('Dashboard: Received newMessage socket event.', message);
                setNewMatchTrigger((prev) => prev + 1);
                toast.info(`🎉 New Match! ${message.otherUser.username}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            };

            const handleNewMessageSocketEvent = (message: {
                match: string;
                sender: { _id: string; username: string };
                content: string;
            }) => {
                if (selectedMatch?.matchId !== message.match) {
                    setNewMatchTrigger((prev) => prev + 1);
                }
            };

            socket.on('newMatch', handleNewMatchSocketEvent);
            socket.on('newMessage', handleNewMessageSocketEvent);

            return () => {
                socket.off('newMatch', handleNewMatchSocketEvent);
                socket.off('newMessage', handleNewMessageSocketEvent);
            };
        }
    }, [socket, selectedMatch]);

    const handleNewMatch = (match: any) => {
        setNewMatchTrigger((prev) => prev + 1);
        console.log('A new match was made!', match);
    };

    const handleProfileProcessed = (profileId: string) => {
        setProcessedProfileIds((prev) => new Set(prev).add(profileId));
    };

    const handleMatchClick = (match: IMatch) => {
        setSelectedMatch(match);
        setActiveTab('matches');
    };

    const handleBackToMatchesList = () => {
        setSelectedMatch(null);
    };

    // Open/Close profile modal handlers
    const openProfileModal = () => {
        setIsProfileModalOpen(true);
    };

    const closeProfileModal = async () => {
        setIsProfileModalOpen(false);
        await fetchUserDetails(); // Re-fetch global user details
        const response = await axiosInstance.get('/profile/me'); // Re-fetch specific profile details
        setCurrentUserProfile(response.data);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
            <header className="mb-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-xl">
                {/* Logo integration */}
                <div className="flex items-center">
                    <img
                        src={HuggersUnitedLogo}
                        alt="Huggers United Logo"
                        className="h-12 w-auto" // Adjust size as needed
                    />
                </div>

                {/* Navigation Buttons */}
                <nav className="grow">
                    <ul className="flex justify-center space-x-2 sm:space-x-4">
                        <li>
                            <button
                                onClick={() => {
                                    setActiveTab('swipe');
                                    setSelectedMatch(null);
                                }}
                                className={`rounded-xl px-3 py-2 text-lg font-medium transition-colors sm:px-4 ${
                                    activeTab === 'swipe'
                                        ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                                Swipe
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    setActiveTab('liked-me');
                                    setSelectedMatch(null);
                                }}
                                className={`rounded-xl px-3 py-2 text-lg font-medium transition-colors sm:px-4 ${
                                    activeTab === 'liked-me'
                                        ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                                Liked You
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    setActiveTab('matches');
                                }}
                                className={`rounded-xl px-3 py-2 text-lg font-medium transition-colors sm:px-4 ${
                                    activeTab === 'matches'
                                        ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                                Matches
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    setActiveTab('profile');
                                    setSelectedMatch(null);
                                    openProfileModal();
                                }}
                                className={`rounded-xl px-3 py-2 text-lg font-medium transition-colors sm:px-4 ${
                                    activeTab === 'profile'
                                        ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                                Profile
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="rounded-xl bg-red-500 px-4 py-2 text-white shadow-lg transition duration-300 hover:bg-red-600"
                >
                    Logout
                </button>
            </header>

            <main className="grid h-[calc(100vh-160px)] grid-cols-1 gap-6 md:grid-cols-3">
                <div className="h-full md:col-span-2">
                    {activeTab === 'swipe' && (
                        <SwipeDeck
                            onMatchMade={handleNewMatch}
                            onProfileProcessed={handleProfileProcessed}
                        />
                    )}
                    {activeTab === 'liked-me' && (
                        <LikedMeDeck
                            onMatchMade={handleNewMatch}
                            onProfileProcessed={handleProfileProcessed}
                        />
                    )}
                    {activeTab === 'matches' && (
                        <ChatWindow
                            match={selectedMatch}
                            onBack={handleBackToMatchesList}
                        />
                    )}
                    {activeTab === 'profile' && (
                        <div className="flex h-full items-center justify-center rounded-2xl bg-white p-6 shadow-xl">
                            <p className="text-xl text-gray-600">
                                Your profile is being edited in the modal.
                            </p>
                        </div>
                    )}
                </div>

                <aside className="col-span-1 h-full">
                    {activeTab !== 'matches' ||
                    (activeTab === 'matches' && !selectedMatch) ? (
                        <MatchesList
                            onMatchClick={handleMatchClick}
                            newMatchTrigger={newMatchTrigger}
                        />
                    ) : null}
                </aside>
            </main>

            <ProfileUpdateModal
                isOpen={isProfileModalOpen}
                onClose={closeProfileModal}
                currentProfile={currentUserProfile}
            />
        </div>
    );
};

export default Dashboard;