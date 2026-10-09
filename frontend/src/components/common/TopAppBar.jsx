import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, Globe, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

export const TopAppBar = ({ title, showBack = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const { lang, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-[#2E7D32] text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-green-700/50 transition-colors focus:outline-none"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
          ) : (
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
              <Trash2 className="w-5 h-5 text-green-300" />
            </div>
          )}
          <div>
            <h1 className="font-semibold text-lg leading-tight truncate max-w-[200px] sm:max-w-xs">
              {title || t('appTitle')}
            </h1>
            <p className="text-[11px] text-green-100 font-normal">
              {user ? `${t(user.role) || user.role} • ${user.fullName?.split(' ')[0]}` : t('tagline')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <select
              value={lang}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-green-800/80 text-white text-xs font-medium py-1.5 px-2.5 rounded-lg border border-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none cursor-pointer pr-6"
            >
              <option value="en" className="bg-white text-gray-800">English</option>
              <option value="te" className="bg-white text-gray-800">తెలుగు (TE)</option>
              <option value="hi" className="bg-white text-gray-800">हिन्दी (HI)</option>
            </select>
            <Globe className="w-3.5 h-3.5 text-green-200 absolute right-1.5 top-2.5 pointer-events-none" />
          </div>

          {/* Notifications Bell */}
          {isAuthenticated && (
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-full hover:bg-green-700/50 transition-colors focus:outline-none"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Avatar Link */}
          {isAuthenticated && (
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-white text-green-800 font-bold text-xs flex items-center justify-center border-2 border-green-200 hover:ring-2 hover:ring-white transition"
              title={user?.fullName}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
