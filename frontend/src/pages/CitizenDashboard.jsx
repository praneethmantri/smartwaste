import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Calendar,
  BookOpen,
  MessageSquare,
  User,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import { OfflineBanner } from '../components/common/OfflineBanner';
import api from '../api/client';

export const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch Citizen's complaints
        const complaintRes = await api.get('/complaints?limit=5');
        const userComplaints = complaintRes.data.complaints || [];
        setComplaints(userComplaints);

        // Compute counts from database response
        const total = complaintRes.data.total || userComplaints.length;
        const pending = userComplaints.filter((c) => ['SUBMITTED', 'ASSIGNED'].includes(c.status)).length;
        const inProgress = userComplaints.filter((c) => c.status === 'IN_PROGRESS').length;
        const completed = userComplaints.filter((c) => c.status === 'COMPLETED').length;

        setStats({
          total,
          pending,
          inProgress,
          completed,
        });

        // Fetch upcoming schedules
        const scheduleRes = await api.get('/schedules');
        setSchedules(scheduleRes.data || []);
      } catch (err) {
        console.error('Citizen dashboard data fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const nextSchedule = schedules.length > 0 ? schedules[0] : null;

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('appTitle')} />
      <OfflineBanner />

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        {/* Welcome Greeting Banner */}
        <div className="bg-gradient-to-r from-[#2E7D32] to-[#43A047] rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-medium backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span>Smart Waste Citizen Network</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">
              {t('welcome')}, {user?.fullName || 'Citizen'}!
            </h2>
            <p className="text-xs text-green-100 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-green-200" />
              <span>{user?.city || 'Visakhapatnam'} • {user?.address || 'Community Ward'}</span>
            </p>
          </div>
          <div className="absolute -right-6 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Database Metric Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <span className="text-[11px] font-medium text-gray-500">{t('totalComplaints')}</span>
            <span className="text-2xl font-extrabold text-[#2E7D32] mt-0.5">
              {loading ? '...' : stats.total}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">Registered</span>
          </div>

          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <span className="text-[11px] font-medium text-gray-500">{t('pendingComplaints')}</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-0.5">
              {loading ? '...' : stats.pending}
            </span>
            <span className="text-[10px] text-amber-500 mt-0.5">In Queue</span>
          </div>

          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <span className="text-[11px] font-medium text-gray-500">{t('completedComplaints')}</span>
            <span className="text-2xl font-extrabold text-green-600 mt-0.5">
              {loading ? '...' : stats.completed}
            </span>
            <span className="text-[10px] text-green-600 mt-0.5">Cleaned</span>
          </div>
        </div>

        {/* Upcoming Waste Collection Banner */}
        {nextSchedule && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#2E7D32] uppercase tracking-wide">
                  Next Scheduled Pickup
                </span>
                <h4 className="text-sm font-bold text-gray-800">
                  {nextSchedule.wasteType}
                </h4>
                <p className="text-[11px] text-gray-600">
                  {new Date(nextSchedule.collectionDate).toLocaleDateString()} • {nextSchedule.collectionTime}
                </p>
              </div>
            </div>
            <Link
              to="/schedules"
              className="p-2 text-[#2E7D32] hover:bg-emerald-100 rounded-xl transition"
              aria-label="View collection schedule"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Quick Action Grid */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between">
            <span>{t('quickActions')}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Raise Complaint Card */}
            <Link
              to="/raise-complaint"
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#2E7D32] transition">
                  {t('raiseComplaint')}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Report overflowing bin or missed pickup
                </p>
              </div>
            </Link>

            {/* Track Complaint Card */}
            <Link
              to="/track"
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#2E7D32] transition">
                  {t('trackComplaints')}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Follow complaint progress and photos
                </p>
              </div>
            </Link>

            {/* Collection Schedule Card */}
            <Link
              to="/schedules"
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#2E7D32] transition">
                  {t('collectionSchedule')}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Timetable by municipal zone
                </p>
              </div>
            </Link>

            {/* Waste Segregation Guide */}
            <Link
              to="/waste-guide"
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#2E7D32] transition">
                  {t('wasteGuide')}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Wet, Dry, Plastic, E-waste rules
                </p>
              </div>
            </Link>

            {/* Feedback & Ratings */}
            <Link
              to="/feedback"
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#2E7D32] transition">
                  {t('feedback')}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Rate sanitation team work
                </p>
              </div>
            </Link>

            {/* My Profile */}
            <Link
              to="/profile"
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#2E7D32] transition">
                  {t('myProfile')}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Address, password & settings
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Complaints Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">{t('recentActivity')}</h3>
            <Link
              to="/track"
              className="text-xs font-semibold text-[#2E7D32] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-500">
              Loading recent complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-2">You haven't submitted any complaints yet.</p>
              <Link
                to="/raise-complaint"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#2E7D32] hover:underline"
              >
                <span>Report an issue in your street</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/complaints/${c.id}`)}
                  className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#2E7D32]">{c.complaintReference}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-orange-100 text-orange-800'
                            : c.status === 'REJECTED'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900">{c.category}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-1">{c.address}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
