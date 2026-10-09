import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import api from '../api/client';

export const ComplaintTrackingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/complaints?${params.toString()}`);
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error('Fetch complaints error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{t('SUBMITTED')}</span>;
      case 'ASSIGNED':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{t('ASSIGNED')}</span>;
      case 'IN_PROGRESS':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{t('IN_PROGRESS')}</span>;
      case 'COMPLETED':
        return <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{t('COMPLETED')}</span>;
      case 'REJECTED':
        return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{t('REJECTED')}</span>;
      case 'REOPENED':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{t('REOPENED')}</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{t(status) || status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('trackComplaints')} showBack={true} />

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-2">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchComplaintsPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl hover:bg-[#1B5E20] transition"
            >
              {t('search')}
            </button>
          </form>

          {/* Quick Status Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: '', label: t('all') },
              { id: 'SUBMITTED', label: t('SUBMITTED') },
              { id: 'ASSIGNED', label: t('ASSIGNED') },
              { id: 'IN_PROGRESS', label: t('IN_PROGRESS') },
              { id: 'COMPLETED', label: t('COMPLETED') },
              { id: 'REOPENED', label: t('REOPENED') },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  statusFilter === pill.id
                    ? 'bg-[#2E7D32] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Listing */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-500 shadow-sm">
            {t('loading')}
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 space-y-3">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-800">{t('noComplaintsFound')}</p>
            {user?.role === 'CITIZEN' && (
              <button
                onClick={() => navigate('/raise-complaint')}
                className="inline-flex items-center space-x-1 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl shadow hover:bg-[#1B5E20] transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t('raiseComplaint')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/complaints/${c.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-[#2E7D32]">
                      {c.complaintReference}
                    </span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-xs font-semibold text-gray-800">{t(c.wasteType) || c.wasteType}</span>
                  </div>
                  {getStatusBadge(c.status)}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-900">{t(c.category) || c.category}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{c.description}</p>
                </div>

                {/* Status Stepper Progression preview */}
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
                  <div className="flex items-center space-x-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{c.address}</span>
                  </div>

                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
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
