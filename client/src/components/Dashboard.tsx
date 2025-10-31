// src/pages/Dashboard.tsx
import React, { useState, useEffect, useContext } from 'react';
import SwipeDeck from '../components/SwipeDeck';
import LikedMeDeck from '../components/LikedMeDeck';
import MatchesList from '../components/MatchesList';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../contexts/AuthContext'; // Use useAuth hook
import type { Match as IMatch } from '../types';
import { SocketContext } from '../contexts/SocketContext'; // Correct path to contexts
import { toast } from 'react-toastify'; // For direct toast notifications on dashboard

const Dashboard: React.FC = () => {
    const { socket } = useContext(SocketContext);

    const [activeTab, setActiveTab] = useState<'swipe' | 'liked-me' | 'matches'>('swipe');
    const [selectedMatch, setSelectedMatch] = useState<IMatch | null>(null);

    // State to trigger re-fetching of matches when a new match occurs
    const [newMatchTrigger, setNewMatchTrigger] = useState(0);

    // State to manage profiles that have been processed (liked/disliked)
    // This helps in keeping the LikedMeDeck and SwipeDeck coherent
    const [_, setProcessedProfileIds] = useState<Set<string>>(new Set());

    // Listen for new match events from the server when socket is available
    useEffect(() => {
        if (socket) {
            const handleNewMatchSocketEvent = (data: { matchId: string; otherUser: any; message: string }) => {
                console.log('Dashboard received newMatch event via socket:', data);
                setNewMatchTrigger((prev) => prev + 1); // Trigger matches list re-fetch
                // The toast notification is already handled in SocketContext,
                // but you might want to add other local UI updates here.
                toast.info(`🎉 New Match! ${data.otherUser.name}`, { // Or use toast.success if you prefer
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            };

            socket.on('newMatch', handleNewMatchSocketEvent);

            return () => {
                socket.off('newMatch', handleNewMatchSocketEvent);
            };
        }
    }, [socket]); // Re-run effect if socket instance changes

    const handleNewMatch = (match: any) => {
        setNewMatchTrigger((prev) => prev + 1); // Increment to trigger re-fetch in MatchesList
        console.log('A new match was made!', match);
        // You could also auto-select the match or show a specific modal here
    };

    const handleProfileProcessed = (profileId: string) => {
        setProcessedProfileIds((prev) => new Set(prev).add(profileId));
    };

    // Note: The loading and isAuthenticated checks are handled by the route's beforeLoad now.
    // The component itself can assume the user is authenticated and has a profile.

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <header className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-indigo-700">Dating App</h1>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <button
                                onClick={() => { setActiveTab('swipe'); setSelectedMatch(null); }}
                                className={`px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                                    activeTab === 'swipe'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Swipe
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { setActiveTab('liked-me'); setSelectedMatch(null); }}
                                className={`px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                                    activeTab === 'liked-me'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Liked You
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('matches')}
                                className={`px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                                    activeTab === 'matches'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Matches
                            </button>
                        </li>
                    </ul>
                </nav>
                {/* Add Logout button or User Profile link here */}
                {/* For example, a simple logout button */}
                <LogoutButton />
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
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
                            onBack={() => setSelectedMatch(null)}
                        />
                    )}
                </div>

                <aside className="col-span-1">
                    {/* Always show matches list on the side, except when ChatWindow is explicitly shown for a match */}
                    {activeTab !== 'matches' || (activeTab === 'matches' && !selectedMatch) ? (
                        <MatchesList
                            onMatchClick={(match) => {
                                setSelectedMatch(match);
                                setActiveTab('matches'); // Automatically switch to matches tab if not already
                            }}
                            newMatchTrigger={newMatchTrigger}
                        />
                    ) : null}

                     {/* This scenario is covered by the above: if activeTab is 'matches' and selectedMatch is null, show list.
                         If activeTab is 'matches' and selectedMatch is NOT null, ChatWindow is in main, and no list here.
                     */}
                </aside>
            </main>
        </div>
    );
};

// Simple Logout Button component
const LogoutButton: React.FC = () => {
    const { logout } = useAuth();
    return (
        <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-md shadow-lg hover:bg-red-600 transition duration-300"
        >
            Logout
        </button>
    );
};

export default Dashboard;