// src/components/SwipeDeck.tsx
import React, { useEffect } from 'react';
import type { Profile } from '../types';
import axiosInstance from '../api/axios';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { FiX, FiHeart } from 'react-icons/fi'; // Icons for dislike and like

interface SwipeDeckProps {
    onMatchMade: (match: any) => void; // Callback for when a match is made
    onProfileProcessed: (profileId: string) => void; // Notify parent of processed profile
}

const SwipeDeck: React.FC<SwipeDeckProps> = ({ onMatchMade, onProfileProcessed }) => {
    const [profiles, setProfiles] = React.useState<Profile[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/profile/random');
            const data = response.data; // This will now be an array
            setProfiles(data);
            setCurrentIndex(0); // Reset index when new profiles are fetched
        } catch (error) {
            console.error('Error fetching profiles:', error);
            setProfiles([]); // Clear profiles on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

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
                onMatchMade(response.data.match); // Notify parent of a new match
            }

            onProfileProcessed(likedUserId); // Notify parent that this profile was processed

            // After interaction, move to the next profile
            if (currentIndex < profiles.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                resetCard(); // Reset animation for the next card
            } else {
                // If no more cards, fetch new ones
                await fetchProfiles();
            }
        } catch (error) {
            console.error('Error interacting with profile:', error);
            // Optionally, show an error message to the user
            // In case of error, you might want to re-show the current card or try to refetch
            resetCard(); // Reset card position if interaction failed
        }
    };

    // `useDrag` for swiping gestures
    const bind = useDrag(
        ({
            down,
            movement: [mx],
            direction: [xDir],
            cancel,
            distance,
        }) => {
            const isSwiped = distance[0] > 150; // Distance to consider a swipe (only for X axis for simplicity)

            // If the user lifts the finger and it's a swipe, cancel and trigger interaction
            if (!down && isSwiped) {
                cancel();
                const currentProfile = profiles[currentIndex];
                if (currentProfile) {
                    const action = mx > 0 ? 'liked' : 'disliked'; // Right swipe = like, Left swipe = dislike
                    api.start({
                        x: xDir * window.innerWidth, // Fly off screen
                        rot: xDir * 20, // Rotate as it flies
                        scale: 1.1,
                        immediate: false,
                        onRest: () =>
                            handleInteraction(currentProfile.user, action),
                    });
                }
                return;
            }

            // Animate card during drag
            api.start({
                x: down ? mx : 0, // Follow finger if dragging, otherwise return to center
                rot: down ? mx / 100 : 0, // Rotate slightly with drag
                scale: down ? 1.1 : 1, // Slightly enlarge when dragging
                immediate: down, // Immediately update when dragging
            });
        },
    );

    const currentProfile = profiles[currentIndex];

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-xl text-gray-700">Loading profiles...</p>
            </div>
        );
    }

    if (!currentProfile) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100 p-4">
                <p className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                    No more profiles to show!
                </p>
                <p className="text-lg text-gray-600 text-center">
                    Please check back later or refresh to see if new profiles are
                    available.
                </p>
                <button
                    onClick={fetchProfiles}
                    className="mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors duration-200"
                >
                    Fetch New Profiles
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-full bg-linear-to-br from-blue-50 to-indigo-100 p-4 rounded-2xl shadow-xl">
            <h1 className="text-4xl font-extrabold text-blue-700 mb-8">
                Find Your Match!
            </h1>

            <div className="relative w-full max-w-sm h-96 flex justify-center items-center">
                {profiles.map((profile, idx) => {
                    if (idx !== currentIndex) return null;

                    const isCurrent = idx === currentIndex;
                    const cardProps = isCurrent
                        ? { style: { x, rotateZ: rot, scale } }
                        : {};

                    return (
                        <animated.div
                            // @ts-ignore
                            {...(isCurrent ? bind() : {})} // Only bind drag gestures to the current card
                            key={profile._id}
                            className={`absolute w-full max-w-sm h-full bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden transform-gpu will-change-transform ${
                                !isCurrent ? 'hidden' : ''
                            }`}
                            {...cardProps}
                        >
                            <img
                                src={
                                    profile.profilePicture ||
                                    'https://via.placeholder.com/200'
                                }
                                alt={`${profile.name}'s profile`}
                                className="w-full h-64 object-cover object-center"
                            />
                            <div className="p-4 grow flex flex-col justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {profile.name} ({profile.username})
                                    </h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {profile.gender}
                                    </p>
                                    <p className="text-gray-700 mt-2">{profile.bio}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {profile.interests.map((interest) => (
                                            <span
                                                key={interest}
                                                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </animated.div>
                    );
                })}
            </div>

            <div className="mt-8 flex gap-8">
                <button
                    onClick={() => handleButtonClick('disliked')}
                    className="flex items-center justify-center p-4 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-110"
                    aria-label="Dislike"
                >
                    <FiX size={32} />
                </button>
                <button
                    onClick={() => handleButtonClick('liked')}
                    className="flex items-center justify-center p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all duration-200 transform hover:scale-110"
                    aria-label="Like"
                >
                    <FiHeart size={32} />
                </button>
            </div>
        </div>
    );
};

export default SwipeDeck;