// src/components/LikedMeDeck.tsx
import React, { useEffect, useState, useCallback } from 'react'; // Add useCallback
import axiosInstance from '../api/axios';
import type { Profile } from '../types';
import { FiX, FiHeart } from 'react-icons/fi';
import { useSpring, animated } from '@react-spring/web';

interface LikedMeDeckProps {
    onMatchMade: (match: any) => void;
    onProfileProcessed: (profileId: string) => void;
}

const LikedMeDeck: React.FC<LikedMeDeckProps> = ({
    onMatchMade,
    onProfileProcessed,
}) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use useCallback to memoize the fetch function
    const fetchProfilesThatLikedMe = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get('/profile/liked-me');
            setProfiles(response.data);
            setCurrentIndex(0); // Reset index when new profiles are fetched
        } catch (err) {
            console.error('Error fetching profiles that liked current user:', err);
            setError('Failed to fetch profiles. Please try again.');
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array means it's created once

    useEffect(() => {
        fetchProfilesThatLikedMe();
    }, [fetchProfilesThatLikedMe]); // Dependency on the memoized function

    // Spring animation for the current card
    const [{ x, rot, scale }, api] = useSpring(() => ({
        x: 0,
        rot: 0,
        scale: 1,
        config: { friction: 50, tension: 300 },
    }));

    // Reset card position
    const resetCard = () => {
        api.start({ x: 0, rot: 0, scale: 1, immediate: false });
    };

    // Handle card interaction (like/dislike)
    const handleInteraction = async (
        likedUserId: string,
        action: 'liked' | 'disliked',
    ) => {
        try {
            const response = await axiosInstance.post('/profile/interact', {
                likedUserId,
                action,
            });

            if (response.data.match) {
                onMatchMade(response.data.match);
            }

            // Immediately remove the processed profile from the local state
            setProfiles((prev) => {
                const updatedProfiles = prev.filter((p) => p.user !== likedUserId);
                // If there are still profiles left, move to the next one
                if (updatedProfiles.length > 0) {
                    setCurrentIndex(0); // Start from the beginning of the new list if needed, or simply let the next render handle it
                } else {
                    // If no profiles left, refetch a fresh batch
                    fetchProfilesThatLikedMe();
                }
                return updatedProfiles;
            });
            onProfileProcessed(likedUserId); // Notify parent component

            resetCard(); // Reset animation for the next potential card
        } catch (err) {
            console.error('Error interacting with profile:', err);
            // In case of an error during interaction, it's safer to re-fetch
            // to ensure the UI is consistent with the backend state.
            fetchProfilesThatLikedMe();
        }
    };

    // Function to handle button clicks for like/dislike
    const handleButtonClick = (action: 'liked' | 'disliked') => {
        if (!currentProfile) return;

        const xValue = action === 'liked' ? window.innerWidth : -window.innerWidth;
        const rotValue = action === 'liked' ? 20 : -20;

        api.start({
            x: xValue,
            rot: rotValue,
            scale: 1.1,
            immediate: false,
            onRest: () => handleInteraction(currentProfile.user, action),
        });
    };

    const currentProfile = profiles[currentIndex];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-700">Loading profiles...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-40 bg-red-100 p-4 rounded-xl">
                <p className="text-red-700 mb-2">{error}</p>
                <button
                    onClick={fetchProfilesThatLikedMe}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!currentProfile) {
        return (
            <div className="flex flex-col justify-center items-center h-40 bg-blue-50 p-4 rounded-xl">
                <p className="text-lg font-semibold text-blue-800">
                    No one has liked you yet.
                </p>
                <p className="text-sm text-blue-600">
                    Keep swiping! More profiles will appear here.
                </p>
                <button
                    onClick={fetchProfilesThatLikedMe}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Liked By You</h2>
            <div className="relative w-full max-w-xs h-80 flex justify-center items-center">
                <animated.div
                    key={currentProfile._id}
                    className={`absolute w-full max-w-xs h-full bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden transform-gpu will-change-transform`}
                    style={{ x, rotateZ: rot, scale }}
                >
                    <img
                        src={
                            currentProfile.profilePicture ||
                            'https://via.placeholder.com/200'
                        }
                        alt={`${currentProfile.name}'s profile`}
                        className="w-full h-48 object-cover object-center"
                    />
                    <div className="p-3 grow flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {currentProfile.name}
                            </h3>
                            <p className="text-gray-600 text-sm">{currentProfile.bio}</p>
                        </div>
                    </div>
                </animated.div>
            </div>

            <div className="mt-6 flex gap-6">
                <button
                    onClick={() => handleButtonClick('disliked')}
                    className="flex items-center justify-center p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-110"
                    aria-label="Dislike"
                >
                    <FiX size={24} />
                </button>
                <button
                    onClick={() => handleButtonClick('liked')}
                    className="flex items-center justify-center p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all duration-200 transform hover:scale-110"
                    aria-label="Like"
                >
                    <FiHeart size={24} />
                </button>
            </div>
        </div>
    );
};

export default LikedMeDeck;