// src/components/ProfileUpdateModal.tsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import type { Profile } from '../types'; // Assuming you have a UserProfile type

interface ProfileUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfile: Profile | null;
}

const ProfileUpdateModal: React.FC<ProfileUpdateModalProps> = ({
    isOpen,
    onClose,
    currentProfile,
}) => {
    const { fetchUserDetails } = useAuth();
    const [name, setName] = useState(currentProfile?.name || '');
    const [bio, setBio] = useState(currentProfile?.bio || '');
    const [gender, setGender] = useState(currentProfile?.gender || '');
    const [interests, setInterests] = useState<string[]>(
        currentProfile?.interests || [],
    );
    const [dateOfBirth, setDateOfBirth] = useState(
        currentProfile?.dateOfBirth
            ? new Date(currentProfile.dateOfBirth).toISOString().split('T')[0]
            : '',
    );
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewProfilePicture, setPreviewProfilePicture] = useState<
        string | null
    >(currentProfile?.profilePicture || null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentProfile) {
            setName(currentProfile.name);
            setBio(currentProfile.bio);
            setGender(currentProfile.gender);
            setInterests(currentProfile.interests);
            setDateOfBirth(
                new Date(currentProfile.dateOfBirth).toISOString().split('T')[0],
            );
            setPreviewProfilePicture(currentProfile.profilePicture);
            setProfilePicture(null); // Clear any pending file upload
        }
    }, [currentProfile]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicture(file);
            setPreviewProfilePicture(URL.createObjectURL(file));
        }
    };

    const handleInterestsChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        // Simple comma-separated string to array
        setInterests(e.target.value.split(',').map((interest) => interest.trim()));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);
        formData.append('gender', gender);
        formData.append('dateOfBirth', dateOfBirth);
        // Append interests as an array of strings
        interests.forEach((interest, index) => {
            formData.append(`interests[${index}]`, interest);
        });

        if (profilePicture) {
            formData.append('profilePicture', profilePicture);
        } else if (currentProfile?.profilePicture && !previewProfilePicture) {
            // If user explicitly removed profile picture (e.g. via an X button, not implemented here)
            // or if no new file is selected and there was a previous one, keep the existing one.
            // For now, if no new picture is uploaded, the existing one is implicitly kept by not
            // sending a new 'profilePicture' field. If `profilePictureUrl` in backend is empty string
            // due to `delete profileFields.profilePicture` logic, it'll remove it.
            // If you want to explicitly remove a profile picture, you'd need a separate mechanism.
        }

        try {
            await axiosInstance.post('/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            await fetchUserDetails(); // Refresh user details in context
            toast.success('Profile updated successfully!');
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
                <button
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
                <h2 className="mb-6 text-2xl font-bold text-blue-700">
                    Edit Your Profile
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="bio"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            rows={3}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <div>
                        <label
                            htmlFor="gender"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Gender
                        </label>
                        <select
                            id="gender"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor="interests"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Interests (comma-separated)
                        </label>
                        <input
                            type="text"
                            id="interests"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={interests.join(', ')}
                            onChange={handleInterestsChange}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="dateOfBirth"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="profilePicture"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Profile Picture
                        </label>
                        <input
                            type="file"
                            id="profilePicture"
                            accept="image/*"
                            className="mt-1 block w-full text-sm text-gray-500
                                file:mr-4 file:rounded-lg file:border-0
                                file:bg-blue-50 file:px-4 file:py-2
                                file:text-sm file:font-semibold file:text-blue-700
                                hover:file:bg-blue-100"
                            onChange={handleFileChange}
                        />
                        {previewProfilePicture && (
                            <div className="mt-2 flex items-center space-x-4">
                                <img
                                    src={previewProfilePicture}
                                    alt="Profile Preview"
                                    className="h-24 w-24 rounded-full object-cover"
                                />
                                <span className="text-gray-600">
                                    Current/New Profile Picture
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-xl bg-linear-to-r from-blue-500 to-blue-600 px-4 py-2 text-lg font-semibold text-white shadow-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileUpdateModal;