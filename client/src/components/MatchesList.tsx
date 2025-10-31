// src/components/MatchesList.tsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import type { Match as IMatch, Message } from '../types'; // Import Message interface
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext'; // To show online status

interface MatchesListProps {
    onMatchClick: (match: IMatch) => void; // Callback to view a specific chat
    newMatchTrigger: number; // A state variable from parent to trigger re-fetch on new match
}

const MatchesList: React.FC<MatchesListProps> = ({ onMatchClick, newMatchTrigger }) => {
    const { user } = useAuth();
    const { onlineUsers } = useSocket(); // Get online users from socket context
    const [matches, setMatches] = useState<IMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMatches = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get('profile/matches');
            console.log('Matches:', response.data);
            setMatches(response.data);
        } catch (err) {
            console.error('Error fetching matches:', err);
            setError('Failed to fetch matches. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, [user, newMatchTrigger]); // Refetch when user changes or newMatchTrigger changes

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-gray-700">Loading matches...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-40 bg-red-100 p-4 rounded-lg">
                <p className="text-red-700 mb-2">{error}</p>
                <button
                    onClick={fetchMatches}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="text-center p-4 text-gray-600 bg-gray-50 rounded-lg">
                <p className="font-semibold mb-2">You don't have any matches yet.</p>
                <p className="text-sm">Start swiping to find new connections!</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md p-4 h-full overflow-y-auto"> {/* Added h-full and overflow */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Matches</h2>
            <ul className="space-y-4">
                {matches.map((match) => {
                    const isOnline = onlineUsers.includes(match.otherUser._id);
                    return (
                        <li
                            key={match.matchId}
                            className="flex items-center p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => onMatchClick(match)}
                        >
                            <div className="relative">
                                <img
                                    src={
                                        match.otherUser.profile?.profilePicture ||
                                        'https://via.placeholder.com/50'
                                    }
                                    alt={match.otherUser.username}
                                    className="w-12 h-12 rounded-full object-cover mr-4"
                                />
                                {isOnline && (
                                    <span className="absolute bottom-0 right-3 block w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></span>
                                )}
                            </div>
                            <div className="grow">
                                <p className="font-semibold text-lg text-gray-900">
                                    {match.otherUser.username}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {match.lastMessage?.content
                                        ? `Last message: ${match.lastMessage.content}`
                                        : 'Say hello!'}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default MatchesList;