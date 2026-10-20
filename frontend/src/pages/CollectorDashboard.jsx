import React, { useState, useEffect } from 'react';
import {
  Landmark,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  FileCheck,
  MapPin,
  Camera,
  AlertOctagon,
  Building2,
  Shield,
  Send,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import { ComplaintEscalationTimeline } from '../components/common/ComplaintEscalationTimeline';
import { formatLocalizedDate, calculateCountdown } from '../utils/formatters';
import { resolveImageUrl } from '../utils/image';
import api from '../api/client';

export const CollectorDashboard = () => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [levelFilter, setLevelFilter] = useState('3'); // Default to Level 3 critical
  const [searchQuery, setSearchQuery] = useState('');

  // Summary counts
  const [summary, setSummary] = useState({
    totalEscalated: 0,
    level2Active: 0,
    level3Critical: 0,
  });

  // Directives Modal
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [modalType, setModalType] = useState(null); // 'directive' | 'resolve' | 'reassign'
  const [directiveText, setDirectiveText] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCollectorData = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (levelFilter) params.level = levelFilter;
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
      setError(err.message || 'Failed to load collectorate grievances.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCollectorData();
  }, [levelFilter]);

  const handleManualCheck = async () => {
    try {
      setRefreshing(true);
      await api.post('/escalation/check', {});
      await fetchCollectorData();
    } catch (err) {
      alert(`SLA check failed: ${err.message}`);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCollectorData();
  };

  const openDirectiveModal = (complaint) => {
    setActiveComplaint(complaint);
    setModalType('directive');
    setDirectiveText(complaint.collectorInstructions || '');
    setSelectedWorkerId(complaint.assignedWorkerId || '');
  };

  const openResolveModal = (complaint) => {
    setActiveComplaint(complaint);
    setModalType('resolve');
    setResolveNotes('');
  };

  const openReassignModal = (complaint) => {
    setActiveComplaint(complaint);
    setModalType('reassign');
    setSelectedWorkerId(complaint.assignedWorkerId || '');
    setResolveNotes('');
  };

  const closeModal = () => {
    setActiveComplaint(null);
    setModalType(null);
    setDirectiveText('');
    setResolveNotes('');
  };

  const handleDirectiveSubmit = async (e) => {
    e.preventDefault();
    if (!activeComplaint || !directiveText) return;

    try {
      setSubmitting(true);
      await api.patch(`/escalation/complaints/${activeComplaint.id}/instructions`, {
        instructions: directiveText,
        assignedWorkerId: selectedWorkerId || undefined,
        priority: 'EMERGENCY',
        notes: 'Administrative directive issued by District Collector Office.',
      });

      closeModal();
      await fetchCollectorData();
    } catch (err) {
      alert(`Failed to record directive: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;

    try {
      setSubmitting(true);
      await api.patch(`/escalation/complaints/${activeComplaint.id}/resolve`, {
        notes: resolveNotes || 'Verified resolved under District Collectorate oversight.',
      });

      closeModal();
      await fetchCollectorData();
    } catch (err) {
      alert(`Failed to resolve complaint: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!activeComplaint || !selectedWorkerId) return;

    try {
      setSubmitting(true);
      await api.patch(`/escalation/complaints/${activeComplaint.id}/reassign`, {
        workerId: selectedWorkerId,
        notes: resolveNotes || 'Responsibility reassigned by District Collectorate.',
      });

      closeModal();
      await fetchCollectorData();
    } catch (err) {
      alert(`Reassignment failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('collectorDashboard')} />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Prominent Simulated Workflow Disclaimer Banner */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-4 sm:p-5 flex items-start space-x-3 text-blue-900 shadow-sm">
          <Landmark className="w-6 h-6 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-800">
              {t('simulatedWorkflowDisclaimer')}
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              {t('simulatedBanner')}
            </p>
          </div>
        </div>

        {/* Collectorate Command Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs text-indigo-200 border border-white/20">
                <Landmark className="w-3.5 h-3.5" />
                <span>Level 3 Apex Grievance Redressal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {t('collectorPortal.header')}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl">
                {t('collectorPortal.sub')}
              </p>
            </div>

            <button
              onClick={handleManualCheck}
              disabled={refreshing}
              className="inline-flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow transition active:scale-95 disabled:opacity-50 self-start md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Verify & Refresh Grievance SLAs</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-red-200 shadow-sm flex items-center justify-between bg-red-50/20">
            <div className="space-y-1">
              <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Level 3 Critical</span>
              <p className="text-3xl font-extrabold text-red-700">{summary.level3Critical}</p>
            </div>
            <div className="p-3 bg-red-600 text-white rounded-xl shadow-sm animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">Level 2 Pending</span>
              <p className="text-3xl font-extrabold text-amber-800">{summary.level2Active}</p>
            </div>
            <div className="p-3 bg-amber-500 text-white rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 font-medium">Total Escalated</span>
              <p className="text-3xl font-extrabold text-gray-900">{summary.totalEscalated}</p>
            </div>
            <div className="p-3 bg-gray-100 text-gray-700 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search & Level Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => setLevelFilter('3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                levelFilter === '3'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Critical Level 3 Only
            </button>
            <button
              onClick={() => setLevelFilter('2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                levelFilter === '2'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Level 2 Monitoring
            </button>
            <button
              onClick={() => setLevelFilter('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                levelFilter === ''
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Grievances
            </button>
          </div>
        </div>

        {/* Grievances List */}
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
            <p className="text-[11px] text-gray-400">No Level 3 critical grievances currently requiring District Collectorate directives.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {complaints.map((c) => {
              const countdown = calculateCountdown(c.resolutionDeadline, ['COMPLETED', 'RESOLVED'].includes(c.status), lang);

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-3xl p-5 shadow-sm border transition space-y-4 ${
                    c.escalationLevel === 3
                      ? 'border-red-300 ring-1 ring-red-100'
                      : 'border-gray-100'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {c.complaintReference}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.escalationLevel === 3
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {c.escalationLevel === 3 ? 'LEVEL 3 CRITICAL' : `LEVEL ${c.escalationLevel}`}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        {c.priority}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border ${countdown.badgeClass}`}>
                        {countdown.text}
                      </span>
                    </div>
                  </div>

                  {/* Grievance Narrative & Photo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <h4 className="text-sm font-bold text-gray-900">
                        {c.category} • <span className="text-gray-500 font-normal">{c.wasteType}</span>
                      </h4>
                      <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                        {c.description}
                      </p>

                      <div className="flex items-start space-x-2 text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                        <span>{c.address}</span>
                      </div>

                      <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        <span>Citizen: <strong>{c.citizen?.fullName}</strong> ({c.citizen?.phone || 'No phone'})</span>
                        <span>Logged: {formatLocalizedDate(c.createdAt, lang)}</span>
                        <span>Worker: <strong>{c.assignedWorker?.user?.fullName || 'Unassigned'}</strong></span>
                      </div>
                    </div>

                    {/* Site Photo */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-gray-500 font-medium block">Citizen Photograph</span>
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
                          <span>No photograph</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Directives Section (if issued) */}
                  {c.collectorInstructions && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1">
                      <div className="flex items-center space-x-2 text-xs font-bold text-red-900">
                        <Landmark className="w-4 h-4 text-red-700" />
                        <span>Recorded Collectorate Directives</span>
                      </div>
                      <p className="text-xs text-red-800 bg-white/80 p-2.5 rounded-xl border border-red-100 italic">
                        "{c.collectorInstructions}"
                      </p>
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-gray-500">
                      Status: <span className="font-bold text-gray-800">{c.status}</span>
                    </div>

                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      <button
                        onClick={() => openDirectiveModal(c)}
                        className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
                      >
                        <Landmark className="w-3.5 h-3.5" />
                        <span>{t('collectorPortal.issueDirective')}</span>
                      </button>

                      <button
                        onClick={() => openReassignModal(c)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 transition"
                      >
                        {t('collectorPortal.reassignResponsibility')}
                      </button>

                      <button
                        onClick={() => openResolveModal(c)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        {t('escalation.resolveDirectly')}
                      </button>
                    </div>
                  </div>

                  {/* Visual Escalation Stepper & Timeline */}
                  <ComplaintEscalationTimeline complaint={c} />
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Directives */}
        {activeComplaint && modalType === 'directive' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2 text-indigo-900">
                  <Landmark className="w-5 h-5 text-indigo-700" />
                  <h3 className="text-base font-bold">
                    {t('collectorPortal.issueDirective')}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-gray-500">
                  {activeComplaint.complaintReference}
                </span>
              </div>

              <form onSubmit={handleDirectiveSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    Administrative Directive Instructions *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={t('collectorPortal.instructionsPlaceholder')}
                    value={directiveText}
                    onChange={(e) => setDirectiveText(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    Designated Sanitation Personnel (Optional)
                  </label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Keep current personnel</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.user?.fullName} ({w.employeeCode}) • {w.serviceZone?.name || 'General Zone'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow disabled:opacity-50"
                  >
                    {submitting ? t('common.loading') : 'Issue & Notify Stakeholders'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Resolve */}
        {activeComplaint && modalType === 'resolve' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">
                  Sign Off & Resolve Grievance
                </h3>
                <span className="text-xs font-mono font-bold text-gray-500">
                  {activeComplaint.complaintReference}
                </span>
              </div>

              <form onSubmit={handleResolveSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    Collectorate Verification & Resolution Notes *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter resolution notes confirming civic site clearance..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow disabled:opacity-50"
                  >
                    {submitting ? t('common.loading') : 'Confirm Resolution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reassign */}
        {activeComplaint && modalType === 'reassign' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">
                  Reassign Administrative Responsibility
                </h3>
                <span className="text-xs font-mono font-bold text-gray-500">
                  {activeComplaint.complaintReference}
                </span>
              </div>

              <form onSubmit={handleReassignSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    Select Sanitation Worker / Officer *
                  </label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Select a worker...</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.user?.fullName} ({w.employeeCode}) • {w.serviceZone?.name || 'General Zone'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    Collectorate Reassignment Order Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter instructions for newly assigned staff..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow disabled:opacity-50"
                  >
                    {submitting ? t('common.loading') : 'Reassign Responsibility'}
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
