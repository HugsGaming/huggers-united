import { useNavigate, redirect, createFileRoute } from '@tanstack/react-router'
import axiosInstance from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export const Route = createFileRoute('/create-profile')({
  beforeLoad: async ({ context}) => {
    if(!context.isAuthenticated) {
      throw redirect({
        to: '/auth'
      });
    }

    try {
      const response = await axiosInstance.get('/profile/me');
      console.log('Profile:', response.data);
      redirect({
        to: '/'
      });
    } catch(error: any) {
      if(error.response.status === 404) {
        return { hasProfile: false };
      }

      console.error('Error getting profile:', error);
      return { hasProfile: false };
      
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInterestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInterests(value.split(',').map(interest => interest.trim()));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isAuthenticated) {
      navigate({ to: '/auth' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('gender', gender);
      formData.append('interests', interests.join(',')); // Send as comma-separated string
      formData.append('dateOfBirth', dateOfBirth);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const response = await axiosInstance.post('/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Profile created/updated successfully!', response.data);
      alert('Profile created successfully!');
      navigate({ to: '/' }); // Redirect to home after successful profile creation
    } catch (err: any) {
      console.error('Profile creation/update failed', err);
      if (err.response) {
        setError(err.response.data.message || 'Failed to create profile. Please try again.');
        alert(`Profile creation failed: ${err.response.data.message}`);
      } else {
        setError('An unexpected error occurred. Please try again.');
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-blue-50'>
      <div className='w-full max-w-lg rounded-lg bg-white p-8 shadow-lg'>
        <h1 className="mb-6 text-center text-4xl font-extrabold text-blue-700">
          Create Your Profile
        </h1>
        <p className="mb-8 text-center text-lg text-gray-600">
          Tell us about yourself to get started!
        </p>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {error && <p className="text-red-500 text-center">{error}</p>}

          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="bio" className="mb-2 block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Tell us a little about yourself..."
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="gender" className="mb-2 block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              id="gender"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="interests" className="mb-2 block text-sm font-medium text-gray-700">
              Interests (comma-separated)
            </label>
            <input
              type="text"
              id="interests"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Reading, Hiking, Gaming"
              value={interests.join(', ')}
              onChange={handleInterestsChange}
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="mb-2 block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="profilePicture" className="mb-2 block text-sm font-medium text-gray-700">
              Profile Picture
            </label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
              onChange={handleFileChange}
              // For creation, you might want this to be required, or have a default if not provided
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 p-3 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Saving Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
