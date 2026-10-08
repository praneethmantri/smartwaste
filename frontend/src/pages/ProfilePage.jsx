import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Camera,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import api from '../api/client';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUserData } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  const [avatarPreview, setAvatarPreview] = useState(user?.profileImage || null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
      });
      setAvatarPreview(user.profileImage || null);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    try {
      setSavingProfile(true);
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('phone', formData.phone);
      data.append('address', formData.address);
      data.append('city', formData.city);
      data.append('state', formData.state);
      data.append('pincode', formData.pincode);
      if (selectedAvatarFile) {
        data.append('profileImage', selectedAvatarFile);
      }

      const res = await api.patch('/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUserData(res.data);
      setProfileSuccess('Profile saved successfully in database.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      setChangingPass(true);
      await api.patch('/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPassSuccess('Password changed successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPassError(err.message || 'Failed to update password.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you wish to log out?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('myProfile')} showBack={true} />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {/* User Card Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-[#2E7D32] flex items-center justify-center overflow-hidden shadow">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-[#2E7D32]">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-1.5 bg-[#2E7D32] text-white rounded-full shadow hover:bg-[#1B5E20] cursor-pointer transition">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <h2 className="text-lg font-bold text-gray-900">{user?.fullName}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-gray-500">{user?.email}</p>
            {user?.role === 'WORKER' && user.worker && (
              <p className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block">
                Employee: {user.worker.employeeCode}
              </p>
            )}
          </div>
        </div>

        {/* Profile Details Edit Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5 border-b pb-2">
            <User className="w-4 h-4 text-[#2E7D32]" />
            <span>Personal Information</span>
          </h3>

          {profileSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-gray-700">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full mt-1 p-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full mt-1 p-2 text-xs sm:text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98480..."
                  className="w-full mt-1 p-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Residential Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House, Street, Area"
                className="w-full mt-1 p-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-gray-700">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full mt-1 p-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-700">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full mt-1 p-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-700">PIN Code</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full mt-1 p-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="py-2.5 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5 border-b pb-2">
            <Lock className="w-4 h-4 text-[#2E7D32]" />
            <span>Update Password</span>
          </h3>

          {passSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
                className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                  placeholder="Min 6 characters"
                  className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })
                  }
                  required
                  className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="py-2.5 px-4 bg-gray-800 hover:bg-black text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{changingPass ? 'Updating...' : 'Change Password'}</span>
            </button>
          </form>
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-2xl border border-red-200 flex items-center justify-center space-x-2 transition"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
