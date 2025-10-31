export type LikeStatus = 'liked' | 'disliked';

export interface User {
    _id: string;
    username: string;
    email: string;
}

export interface Profile {
    _id: string;
    user: string;
    name: string;
    bio: string;
    profilePicture: string;
    gender: string;
    interests: string[];
    dateOfBirth: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    username: string;
    email: string;
}

export interface UserInMatch {
    _id: string;
    username: string;
    email: string;
}

export interface Match {
    matchId: string;
    otherUser: {
        _id: string;
        username: string;
        email: string;
        profile: Profile;
    };
    lastMessage: Message | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    _id: string;
    sender: {
        _id: string;
        username: string;
    };
    match: string;
    content: string;
    read: boolean;
    createdAt: string;
    isOptimistic?: boolean;
    tempId?: string;
}
