import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Search, Bell, User, CheckSquare, Calendar, ShieldCheck, FileText, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const BottomNav = () => {
  const { user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  if (!isAuthenticated) return null;

  // Citizen Navigation items
  const citizenItems = [
    { label: 'Home', to: '/dashboard', icon: Home },
    { label: 'Raise', to: '/raise-complaint', icon: PlusCircle, highlight: true },
    { label: 'Track', to: '/track', icon: Search },
    { label: 'Alerts', to: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  // Worker Navigation items
  const workerItems = [
    { label: 'Tasks', to: '/worker', icon: CheckSquare },
    { label: 'Schedule', to: '/schedules', icon: Calendar },
    { label: 'Alerts', to: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  // Admin Navigation items
  const adminItems = [
    { label: 'Control', to: '/admin', icon: ShieldCheck },
    { label: 'Complaints', to: '/admin/complaints', icon: CheckSquare },
    { label: 'Schedules', to: '/admin/schedules', icon: Calendar },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Reports', to: '/admin/reports', icon: FileText },
  ];

  let items = citizenItems;
  if (user?.role === 'WORKER') items = workerItems;
  if (user?.role === 'ADMIN') items = adminItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg pb-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-around h-16 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'text-[#2E7D32] font-semibold'
                    : 'text-gray-500 hover:text-green-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {item.highlight ? (
                      <div className="bg-[#2E7D32] text-white p-2 rounded-full -mt-5 shadow-md border-4 border-[#F5F8F5] transition-transform active:scale-95">
                        <Icon className="w-5 h-5" />
                      </div>
                    ) : (
                      <div
                        className={`p-1 rounded-xl transition-colors ${
                          isActive ? 'bg-green-100/80 text-[#2E7D32]' : ''
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    )}

                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-0.5 ${item.highlight ? 'mt-1 font-semibold text-[#2E7D32]' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
