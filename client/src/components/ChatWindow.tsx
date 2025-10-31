import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Match as IMatch, Message } from '../types';
import { FiArrowLeft, FiSend } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { format } from 'date-fns';
import axiosInstance from '../api/axios';

interface ChatWindowProps {
    match: IMatch | null;
    onBack: () => void;
}

// Extend Message interface if it's not already, to include isOptimistic
// This should be done in your `types/index.ts` file ideally.
interface ChatMessage extends Message {
    isOptimistic?: boolean;
    tempId?: string; // Add tempId to track optimistic messages
}


const ChatWindow: React.FC<ChatWindowProps> = ({ match, onBack }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    // Use ChatMessage type for messages state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessageContent, setNewMessageContent] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [errorMessages, setErrorMessages] = useState<string | null>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);

    // No need for a separate `optimisticMessages` map state.
    // We'll manage optimistic status directly within the `messages` array.

    const fetchMessages = async (matchId: string) => {
        setLoadingMessages(true);
        setErrorMessages(null);
        try {
            const response = await axiosInstance.get(`/messages/${matchId}`);
            setMessages(response.data);
            // After fetching real messages, ensure no old optimistic messages are lingering
            // This is especially important on re-mount or match change
            // (though `match` dependency should re-fetch and clear).
        } catch (error) {
            console.error('Error fetching messages:', error);
            setErrorMessages('Failed to fetch messages. Please try again.');
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (match) {
            fetchMessages(match.matchId);
        } else {
            setMessages([]);
        }
    }, [match]);

    useEffect(() => {
        // Scroll to bottom only if the new message is from the current user, or if we are already near bottom
        // To avoid forced scroll when other user sends a message and current user is reading older messages.
        const shouldScroll = messageEndRef.current && 
                             (messageEndRef.current.scrollTop + messageEndRef.current.clientHeight >= messageEndRef.current.scrollHeight - 50); // within 50px of bottom

        // Simple scroll to bottom
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    useEffect(() => {
        if (socket && match) {
            console.log('Client: Attaching newMessage listener for match:', match.matchId);
            const handleNewMessage = (message: ChatMessage) => {
                console.log('Client: Socket received new message event.', {
                    incomingMessage: message,
                    currentMatchId: match.matchId,
                    currentUser: user?._id,
                    isIncomingMessageForThisMatch: message.match === match.matchId
                });

                if (message.match !== match.matchId) {
                    console.warn('Client: Incoming message is for a different match, ignoring.', {
                        incomingMatch: message.match,
                        selectedMatch: match.matchId
                    });
                    return; // Exit early if the message is not for the current match
                }

                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    let optimisticIndex = -1;

                    // --- Try to find and replace our own optimistic message ---
                    // This block is ONLY for messages sent by the current user.
                    if (message.sender._id === user?._id) {
                        if (message.tempId) {
                            optimisticIndex = updatedMessages.findIndex(
                                (msg) => msg.isOptimistic && msg.tempId === message.tempId,
                            );
                            console.log('Client: Attempting to find optimistic message with tempId:', message.tempId, 'Optimistic index:', optimisticIndex);
                        } else {
                            // Fallback if tempId is missing (should not happen if backend is correct)
                            // This fallback is less reliable but might catch it if tempId is truly dropped.
                            optimisticIndex = updatedMessages.findIndex(
                                (msg) =>
                                    msg.isOptimistic &&
                                    msg.sender._id === message.sender._id &&
                                    msg.content === message.content &&
                                    Date.now() - new Date(msg.createdAt).getTime() < 5000 // Within 5 seconds
                            );
                            if (optimisticIndex === -1) {
                            console.warn('Client: No tempId on incoming message for own message and fallback failed. Will append as new.');
                            } else {
                            console.warn('Client: No tempId on incoming message for own message. Falling back to content/sender match. Optimistic index:', optimisticIndex);
                            }
                        }
                    }

                    if (optimisticIndex !== -1) {
                        // Found and replaced an optimistic message
                        console.log('Client: Replacing optimistic message.', {
                            optimisticMessage: updatedMessages[optimisticIndex],
                            realMessage: message
                        });
                        updatedMessages[optimisticIndex] = {
                            ...message,
                            isOptimistic: false,
                            tempId: undefined, // Clear tempId after successful replacement
                        };
                        return updatedMessages;
                    } else {
                        // Message from another user, OR our own message that couldn't be matched optimistically (e.g., refresh, lost tempId)
                        console.log('Client: Appending new message (not replacing optimistic).', message);
                        return [...updatedMessages, { ...message, isOptimistic: false, tempId: undefined }]; // Ensure it's not optimistic and clear tempId
                    }
                });
            };

            socket.on('newMessage', handleNewMessage);

            return () => {
                console.log('Client: Cleaning up newMessage listener for match:', match.matchId);
                socket.off('newMessage', handleNewMessage);
            };
        } else {
            console.log('Client: Socket or match not ready, not attaching newMessage listener.');
        }
    }, [socket, match, user]);


    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedContent = newMessageContent.trim();
        if (!match || !trimmedContent || !user?._id) return;

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const optimisticMessage: ChatMessage = {
            _id: tempId,
            sender: { _id: user._id, username: user.username || 'You' },
            match: match.matchId,
            content: trimmedContent,
            createdAt: new Date().toISOString(),
            read: false,
            isOptimistic: true,
            tempId: tempId,
        };

        setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
        setNewMessageContent('');
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        console.log('Client: Optimistic message added:', optimisticMessage);

        try {
            console.log('Client: Sending message to API with tempId:', tempId);
            await axiosInstance.post(`/messages/${match.matchId}`, {
                content: trimmedContent,
                tempId: tempId,
            });
            console.log('Client: API call for sending message successful.');
            // No need to setMessages here; socket will handle replacement.
        } catch (error) {
            console.error('Client: Error sending message via API:', error);
            setErrorMessages('Failed to send message. Please try again.');

            setMessages((prevMessages) => {
                const filtered = prevMessages.filter((msg) => msg._id !== tempId);
                console.log('Client: Reverting optimistic message due to API error:', tempId);
                return filtered;
            });
            setNewMessageContent(trimmedContent);
            messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!match) {
        return (
            <div className="flex justify-center items-center h-full bg-white rounded-lg shadow-md p-4">
                <p className="text-lg text-gray-600">Select a match to start chatting!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
            <div className="flex items-center border-b p-4">
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

            <div ref={messageEndRef} className="grow overflow-y-auto p-4 space-y-4"> {/* Added ref here */}
                {loadingMessages && (
                    <div className="text-center text-gray-500">Loading messages...</div>
                )}
                {errorMessages && (
                    <div className="text-center text-red-500">{errorMessages}</div>
                )}
                {!loadingMessages && messages.length === 0 && (
                    <p className="text-gray-500 text-center py-10">
                        Start your conversation! Say hello.
                    </p>
                )}

                {messages.map((message) => (
                    <div
                        key={message._id} // Use the actual or temporary _id as key
                        className={`flex ${
                            message.sender._id === user?._id ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                                message.sender._id === user?._id
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                            } ${
                                message.isOptimistic // Use the actual property directly
                                    ? 'opacity-60 grayscale'
                                    : ''
                            }`}
                        >
                            <p className="font-semibold text-sm">
                                {message.sender._id === user?._id ? 'You' : message.sender.username}
                            </p>
                            <p className="text-base">{message.content}</p>
                            <p className="text-xs mt-1 opacity-75">
                                {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                            </p>
                            {message.isOptimistic && (
                                <span className="text-xs italic">Sending...</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex p-4 border-t">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="grow p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    disabled={!user || !match} // Disable if no user or no match selected
                />
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-r-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                    aria-label="Send message"
                    disabled={!user || !match || !newMessageContent.trim()} // Disable if input is empty
                >
                    <FiSend size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;