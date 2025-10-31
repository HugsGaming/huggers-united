// src/components/ChatWindow.tsx
import React from 'react';
import type { Match as IMatch } from '../types';
import { FiArrowLeft } from 'react-icons/fi';

interface ChatWindowProps {
    match: IMatch | null;
    onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ match, onBack }) => {
    if (!match) {
        return (
            <div className="flex justify-center items-center h-full bg-white rounded-lg shadow-md p-4">
                <p className="text-lg text-gray-600">Select a match to start chatting!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center border-b pb-4 mb-4">
                <button onClick={onBack} className="mr-3 p-2 rounded-full hover:bg-gray-100">
                    <FiArrowLeft size={24} />
                </button>
                <img
                    src={match.otherUser.profile?.profilePicture || 'https://via.placeholder.com/50'}
                    alt={match.otherUser.username}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <h2 className="text-xl font-bold text-gray-900">{match.otherUser.username}</h2>
            </div>

            <div className="grow overflow-y-auto p-2 border rounded-lg bg-gray-50 mb-4">
                {/* Chat messages will go here */}
                <p className="text-gray-500 text-center py-10">
                    Start your conversation! (Chat functionality coming soon...)
                </p>
                {match.lastMessage && (
                    <div className="text-sm text-gray-700 p-2 bg-indigo-100 rounded">
                        <p className="font-semibold">Last message:</p>
                        <p>{match.lastMessage.content}</p>
                    </div>
                )}
            </div>

            <div className="flex">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="grow p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-r-lg hover:bg-indigo-700 transition-colors">
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;