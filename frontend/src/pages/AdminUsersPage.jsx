import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Shield,
  UserCheck,
} from 'lucide-react';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

export const AdminUsersPage = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('userStaffRoster')} showBack={true} />

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Search & Filter */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchUsersPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl"
            >
              {t('search')}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {['', 'CITIZEN', 'WORKER', 'ADMIN'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  roleFilter === r
                    ? 'bg-[#2E7D32] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r ? (t(r) || r) : t('allRoles')}
              </button>
            ))}
          </div>
        </div>

        {/* User Cards List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-500">
            {t('loadingUsers')}
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-500">
            {t('noAccountsFound')}
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start justify-between space-x-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-gray-900">{u.fullName}</h4>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'WORKER'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {t(u.role) || u.role}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span>{u.email}</span>
                  </p>

                  <p className="text-xs text-gray-500 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{u.phone || t('noPhoneProvided')}</span>
                  </p>

                  <p className="text-[11px] text-gray-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{u.address ? `${u.address}, ${u.city || ''}` : u.city || 'Visakhapatnam'}</span>
                  </p>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  {u.worker && (
                    <div className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {u.worker.employeeCode}
                    </div>
                  )}
                  {u._count?.complaints !== undefined && (
                    <div className="text-[10px] text-gray-500">
                      {t('complaints')}: <strong>{u._count.complaints}</strong>
                    </div>
                  )}
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
