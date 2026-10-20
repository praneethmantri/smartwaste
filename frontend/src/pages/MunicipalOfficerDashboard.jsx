import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Flag,
  ArrowUpRight,
  MapPin,
  Camera,
  MessageSquare,
  AlertOctagon,
  Building2,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import { ComplaintEscalationTimeline } from '../components/common/ComplaintEscalationTimeline';
import { formatLocalizedDate, calculateCountdown } from '../utils/formatters';
import { resolveImageUrl } from '../utils/image';
import api from '../api/client';

export const MunicipalOfficerDashboard = () => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [levelFilter, setLevelFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Summary counts
  const [summary, setSummary] = useState({
    totalEscalated: 0,
    level2Active: 0,
    level3Critical: 0,
  });

  // Action modals
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [actionType, setActionType] = useState(null); // 'reassign' | 'prioritize' | 'resolve'
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('HIGH');
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (levelFilter) params.level = levelFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (searchQuery) params.search = searchQuery;

      const [complaintsRes, workersRes] = await Promise.all([
        api.get('/escalation/complaints', { params }),
        api.get('/workers'),
      ]);

      setComplaints(complaintsRes.data || []);
      if (complaintsRes.summary) {
        setSummary(complaintsRes.summary);
      }
      setWorkers(workersRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load escalated complaints.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [levelFilter, priorityFilter]);

  const handleManualCheck = async () => {
    try {
      setRefreshing(true);
      await api.post('/escalation/check', {});
      await fetchDashboardData();
    } catch (err) {
      alert(`SLA check trigger failed: ${err.message}`);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const openActionModal = (complaint, type) => {
    setActiveComplaint(complaint);
    setActionType(type);
    setActionNotes('');
    setSelectedWorkerId(complaint.assignedWorkerId || '');
    setSelectedPriority(complaint.priority || 'HIGH');
  };

  const closeActionModal = () => {
    setActiveComplaint(null);
    setActionType(null);
    setActionNotes('');
  };

  const submitAction = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;

    try {
      setSubmittingAction(true);
      if (actionType === 'reassign') {
        if (!selectedWorkerId) {
          alert('Please select a sanitation worker.');
          return;
        }
        await api.patch(`/escalation/complaints/${activeComplaint.id}/reassign`, {
          workerId: selectedWorkerId,
          notes: actionNotes,
        });
      } else if (actionType === 'prioritize') {
        await api.patch(`/escalation/complaints/${activeComplaint.id}/prioritize`, {
          priority: selectedPriority,
          notes: actionNotes,
        });
      } else if (actionType === 'resolve') {
        await api.patch(`/escalation/complaints/${activeComplaint.id}/resolve`, {
          notes: actionNotes || 'Verified resolved by Higher Municipal Authority.',
        });
      }

      closeActionModal();
      await fetchDashboardData();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('officerDashboard')} />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Officer Header Card */}
        <div className="bg-gradient-to-r from-green-800 to-emerald-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs text-green-200 border border-white/20">
                <Shield className="w-3.5 h-3.5" />
                <span>Level 2 Authority Command Center</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {t('officerPortal.header')}
              </h2>
              <p className="text-xs sm:text-sm text-green-100/90 max-w-xl">
                {t('officerPortal.sub')}
              </p>
            </div>

            <button
              onClick={handleManualCheck}
              disabled={refreshing}
              className="inline-flex items-center space-x-2 bg-white text-green-900 px-4 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-green-50 transition active:scale-95 disabled:opacity-50 self-start md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Trigger SLA Escalation Check</span>
            </button>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 font-medium">Total Escalated</span>
              <p className="text-2xl font-bold text-gray-900">{summary.totalEscalated}</p>
            </div>
            <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-amber-700 font-medium">Level 2 Active</span>
              <p className="text-2xl font-bold text-amber-800">{summary.level2Active}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-red-600 font-medium">Level 3 Critical</span>
              <p className="text-2xl font-bold text-red-700">{summary.level3Critical}</p>
            </div>
            <div className="p-3 bg-red-100 text-red-700 rounded-xl border border-red-200">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            />
          </form>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            >
              <option value="">{t('officerPortal.filterAll')}</option>
              <option value="2">{t('officerPortal.filterL2')}</option>
              <option value="3">{t('officerPortal.filterL3')}</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            >
              <option value="">All Priorities</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Complaints Listing */}
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 bg-white rounded-3xl border border-gray-100">
            {t('common.loading')}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-600 bg-red-50 rounded-2xl border border-red-200">
            {error}
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500 bg-white rounded-3xl border border-gray-100 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-semibold text-gray-800">{t('common.noRecords')}</p>
            <p className="text-[11px] text-gray-400">All escalated municipal grievances are currently resolved or within SLA.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => {
              const countdown = calculateCountdown(c.resolutionDeadline, ['COMPLETED', 'RESOLVED'].includes(c.status), lang);

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition"
                >
                  {/* Top Bar of Complaint Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {c.complaintReference}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.escalationLevel === 3
                            ? 'bg-red-600 text-white'
                            : c.escalationLevel === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        Level {c.escalationLevel}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.priority === 'EMERGENCY'
                            ? 'bg-red-100 text-red-800'
                            : c.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border ${countdown.badgeClass}`}>
                        {countdown.text}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Left: Info */}
                    <div className="md:col-span-2 space-y-2">
                      <h4 className="text-sm font-bold text-gray-900">
                        {c.category} • <span className="text-gray-500 font-normal">{c.wasteType}</span>
                      </h4>
                      <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        {c.description}
                      </p>

                      <div className="flex items-start space-x-2 text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-[#2E7D32] mt-0.5 shrink-0" />
                        <span>{c.address}</span>
                      </div>

                      <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        <span>Citizen: <strong>{c.citizen?.fullName}</strong> ({c.citizen?.phone || 'No phone'})</span>
                        <span>Logged: {formatLocalizedDate(c.createdAt, lang)}</span>
                        <span>
                          Worker: <strong>{c.assignedWorker?.user?.fullName || 'Not Assigned'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right: Waste Photograph */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-gray-500 font-medium block">Site Photograph</span>
                      {c.imageUrl ? (
                        <div className="h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                          <img
                            src={resolveImageUrl(c.imageUrl)}
                            alt="Waste Spot"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-32 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-xs">
                          <Camera className="w-6 h-6 mb-1" />
                          <span>No photo attached</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline & Actions */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-gray-500">
                      Current Status: <span className="font-semibold text-gray-800">{c.status}</span>
                    </div>

                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      <button
                        onClick={() => openActionModal(c, 'reassign')}
                        className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 transition"
                      >
                        {t('escalation.reassignWorker')}
                      </button>

                      <button
                        onClick={() => openActionModal(c, 'prioritize')}
                        className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 transition"
                      >
                        {t('escalation.setPriority')}
                      </button>

                      <button
                        onClick={() => openActionModal(c, 'resolve')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm transition"
                      >
                        {t('escalation.resolveDirectly')}
                      </button>
                    </div>
                  </div>

                  {/* Mini Escalation Timeline */}
                  <ComplaintEscalationTimeline complaint={c} />
                </div>
              );
            })}
          </div>
        )}

        {/* Action Modal */}
        {activeComplaint && actionType && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">
                  {actionType === 'reassign' && t('escalation.reassignWorker')}
                  {actionType === 'prioritize' && t('escalation.setPriority')}
                  {actionType === 'resolve' && t('escalation.resolveDirectly')}
                </h3>
                <span className="text-xs font-mono font-bold text-gray-500">
                  {activeComplaint.complaintReference}
                </span>
              </div>

              <form onSubmit={submitAction} className="space-y-4">
                {actionType === 'reassign' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">
                      {t('officerPortal.selectWorker')}
                    </label>
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2E7D32]"
                    >
                      <option value="">Select a worker...</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.user?.fullName} ({w.employeeCode}) • {w.serviceZone?.name || 'General Zone'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {actionType === 'prioritize' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">
                      {t('priority')}
                    </label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2E7D32]"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {actionType === 'resolve' ? t('officerPortal.resolutionNotes') : 'Officer Action Notes'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter official action notes for the audit trail..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    required={actionType === 'resolve'}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-green-800 rounded-xl shadow disabled:opacity-50"
                  >
                    {submittingAction ? t('common.loading') : t('common.confirm')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
