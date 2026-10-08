import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  AlertCircle,
  Truck,
  Sparkles,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.complaintId) {
      navigate(`/complaints/${notif.complaintId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('notifications')} showBack={true} />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Notification Toolbar */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'ALL'
                  ? 'bg-[#2E7D32] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'UNREAD'
                  ? 'bg-[#2E7D32] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center space-x-1 text-xs text-[#2E7D32] hover:underline font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100 space-y-2">
            <Bell className="w-8 h-8 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">No Notifications</h4>
            <p className="text-xs text-gray-400">
              {filter === 'UNREAD' ? 'You have read all your alerts!' : 'No messages in your activity stream yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-2xl border transition cursor-pointer shadow-sm flex items-start justify-between space-x-3 ${
                  n.isRead
                    ? 'bg-white border-gray-100 opacity-90'
                    : 'bg-emerald-50/70 border-emerald-200 ring-1 ring-emerald-200'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-gray-900">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-400 flex items-center space-x-1 pt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-2 shrink-0">
                  {n.complaintId && <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
