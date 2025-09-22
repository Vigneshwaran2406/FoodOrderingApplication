import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Lock } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminProfilePage: React.FC = () => {
  const { user, logout, setUser } = useAuth(); // ✅ include setUser
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    profileImage: ''
  });
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  // 🔑 Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 📸 Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // 📥 Fetch profile from backend
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/profile`, {
        withCredentials: true
      });
      const userData = response.data;
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        profileImage: userData.profileImage || ''
      });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      toast.error('Failed to fetch profile data');
    }
  };

  // 📤 Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [addressField]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // 💾 Save profile
  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${API_URL}/users/profile`,
        {
          name: formData.name,
          phone: formData.phone,
          address: formData.address
        },
        { withCredentials: true }
      );

      setUser(response.data); // ✅ update context
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating admin profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // ❌ Cancel edit
  const handleCancel = () => {
    fetchUserProfile();
    setIsEditing(false);
  };

  // 📸 Handle image file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

// 📸 Upload profile image
const handleUploadImage = async () => {
  if (!selectedFile) {
    toast.error('Please select an image first');
    return;
  }

  const formDataImg = new FormData();
  formDataImg.append('profileImage', selectedFile);

  try {
    const response = await axios.put(
      `${API_URL}/users/profile/upload`,
      formDataImg,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    // ✅ Update profile image in form + global context
    setFormData((prev) => ({
      ...prev,
      profileImage: response.data.profileImage,
    }));

    setUser(response.data.user); // update AuthContext with fresh user object

    toast.success(response.data.message || 'Profile image updated successfully!');
    setSelectedFile(null);
  } catch (error: any) {
    console.error('Error uploading image:', error);
    toast.error(error.response?.data?.message || 'Failed to upload image');
  }
};


  // 🔑 Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      const response = await axios.put(
        `${API_URL}/users/profile/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { withCredentials: true }
      );

      toast.success(response.data.message || 'Password changed successfully. Please log in again.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);

      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border">
                  {formData.profileImage ? (
                   <img
  src={
    formData.profileImage?.startsWith("http")
      ? formData.profileImage
      : `${API_URL.replace("/api", "")}/${formData.profileImage.replace(/^\/?/, "")}`
  }
  alt="Profile"
  className="w-full h-full object-cover"
/>

                  ) : (
                    <User className="w-full h-full text-gray-400" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">Admin</p>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Save size={16} />
                  <span>{loading ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          {/* Upload Image Section */}
          {isEditing && (
            <div className="mb-6">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <button
                onClick={handleUploadImage}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
              >
                Upload Image
              </button>
            </div>
          )}

          {/* Profile Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-900">
                    <User size={16} className="text-gray-400" />
                    <span>{formData.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="flex items-center space-x-2 text-gray-900">
                  <Mail size={16} className="text-gray-400" />
                  <span>{formData.email}</span>
                  <span className="text-xs text-gray-500">(Cannot be changed)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Phone size={16} className="text-gray-400" />
                    <span>{formData.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      placeholder="Enter street address"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-900">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{formData.address.street || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  ) : (
                    <span className="text-gray-900">{formData.address.city || 'Not provided'}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  ) : (
                    <span className="text-gray-900">{formData.address.state || 'Not provided'}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    placeholder="ZIP Code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                ) : (
                  <span className="text-gray-900">{formData.address.zipCode || 'Not provided'}</span>
                )}
              </div>
            </div>
          </div>

          {/* 🔑 Change Password Section */}
          <div className="mt-10 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Lock size={18} />
              <span>Change Password</span>
            </h3>

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Change Password
              </button>
            ) : (
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />

                <div className="flex space-x-2">
                  <button
                    onClick={handlePasswordChange}
                    disabled={passwordLoading}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
