import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckSquare,
  Users,
  Clock,
  AlertCircle,
  Truck,
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import api from '../api/client';

const STATUS_COLORS = {
  SUBMITTED: '#EF4444',
  ASSIGNED: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  COMPLETED: '#10B981',
  REJECTED: '#6B7280',
  REOPENED: '#8B5CF6',
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    newComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    completedComplaints: 0,
    rejectedComplaints: 0,
    reopenedComplaints: 0,
    registeredCitizens: 0,
    activeWorkers: 0,
    averageResolutionHours: 0,
  });

  const [analytics, setAnalytics] = useState({
    byCategory: [],
    byStatus: [],
    byZone: [],
    workerPerformance: [],
    monthlyTrends: [],
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/admin/statistics'),
          api.get('/admin/analytics'),
        ]);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load admin metrics:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('adminDashboard')} />

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        {/* Header Admin Banner */}
        <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1976D2] rounded-3xl p-5 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-green-300" />
              <span>{t('municipalCommandPortal')}</span>
            </span>
            <h2 className="text-xl font-bold">{t('executiveOverview')}</h2>
            <p className="text-xs text-green-100">
              {t('realTimeTelemetry')}
            </p>
          </div>
          <Link
            to="/admin/reports"
            className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 bg-white text-green-900 text-xs font-bold rounded-xl shadow hover:bg-green-50 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('generateReports')}</span>
          </Link>
        </div>

        {/* Real Database KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <span className="text-[11px] font-medium text-gray-500">{t('totalGrievances')}</span>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {loading ? '...' : stats.totalComplaints}
            </h3>
            <span className="text-[10px] text-green-700 font-semibold">{t('inDatabase')}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <span className="text-[11px] font-medium text-gray-500">{t('pendingAndActive')}</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">
              {loading ? '...' : stats.newComplaints + stats.pendingComplaints + stats.inProgressComplaints}
            </h3>
            <span className="text-[10px] text-amber-700 font-semibold">
              {stats.newComplaints} {t('newGrievances')} • {stats.inProgressComplaints} {t('onSite')}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <span className="text-[11px] font-medium text-gray-500">{t('resolvedCleaned')}</span>
            <h3 className="text-2xl font-black text-[#2E7D32] mt-1">
              {loading ? '...' : stats.completedComplaints}
            </h3>
            <span className="text-[10px] text-green-700 font-semibold">{t('verifiedProofs')}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <span className="text-[11px] font-medium text-gray-500">{t('avgResolutionTime')}</span>
            <h3 className="text-2xl font-black text-[#1976D2] mt-1">
              {loading ? '...' : `${stats.averageResolutionHours}h`}
            </h3>
            <span className="text-[10px] text-blue-700 font-semibold">{t('fromSubmissionToClean')}</span>
          </div>
        </div>

        {/* Second Row KPIs: Citizens & Staff */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium">{t('registeredCitizens')}</span>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.registeredCitizens}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium">{t('activeSanitationWorkers')}</span>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.activeWorkers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            to="/admin/complaints"
            className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow hover:border-green-300 transition flex items-center space-x-2"
          >
            <CheckSquare className="w-4 h-4 text-[#2E7D32]" />
            <span className="text-xs font-bold text-gray-800">{t('manageTasks')}</span>
          </Link>
          <Link
            to="/admin/schedules"
            className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow hover:border-green-300 transition flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-gray-800">{t('schedules')}</span>
          </Link>
          <Link
            to="/admin/users"
            className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow hover:border-green-300 transition flex items-center space-x-2"
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-gray-800">{t('userRoster')}</span>
          </Link>
          <Link
            to="/admin/reports"
            className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow hover:border-green-300 transition flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-gray-800">{t('csvPdfAudit')}</span>
          </Link>
        </div>

        {/* Recharts Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Complaints by Category Chart */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              {t('complaintsByCategory')}
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byCategory.map(c => ({ ...c, displayName: t(c.name) || c.name }))} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="displayName" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="count" fill="#2E7D32" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Complaints by Status Pie */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              {t('statusBreakdown')}
            </h3>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byStatus}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {analytics.byStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#10B981'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid #E5E7EB' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-[10px]">
              {analytics.byStatus.map((s) => (
                <div key={s.name} className="flex items-center space-x-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[s.name] || '#10B981' }}
                  ></span>
                  <span className="text-gray-600 font-medium">
                    {t(s.name) || s.name}: {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone-wise Distribution */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              {t('municipalZoneDistribution')}
            </h3>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byZone} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="count" fill="#1976D2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Worker Task Completion Bar */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              {t('workerPerformanceResolved')}
            </h3>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.workerPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="completed" fill="#43A047" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
