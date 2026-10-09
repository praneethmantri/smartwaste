import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  X,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

export const AdminComplaintsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Assign Worker Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (search) params.append('search', search);

      const [compRes, workRes] = await Promise.all([
        api.get(`/complaints?${params.toString()}`),
        api.get('/workers'),
      ]);

      setComplaints(compRes.data.complaints || []);
      setWorkers(workRes.data || []);
      if (workRes.data?.length > 0) {
        setSelectedWorkerId(workRes.data[0].id);
      }
    } catch (err) {
      console.error('Admin complaints fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, priorityFilter]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId) return;

    try {
      setAssignLoading(true);
      await api.patch(`/complaints/${selectedComplaint.id}/assign`, {
        workerId: selectedWorkerId,
        notes: assignNotes || 'Worker allocated by sanitation supervisor.',
      });

      setSelectedComplaint(null);
      setAssignNotes('');
      await fetchComplaints();
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('adminComplaintsTitle')} showBack={true} />

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Filter Controls */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchComplaintsAdminPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>
            <button
              onClick={fetchComplaints}
              className="px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl"
            >
              {t('filterBtn')}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="SUBMITTED">{t('SUBMITTED')}</option>
              <option value="ASSIGNED">{t('ASSIGNED')}</option>
              <option value="IN_PROGRESS">{t('IN_PROGRESS')}</option>
              <option value="COMPLETED">{t('COMPLETED')}</option>
              <option value="REJECTED">{t('REJECTED')}</option>
              <option value="REOPENED">{t('REOPENED')}</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            >
              <option value="">{t('allPriorities')}</option>
              <option value="LOW">{t('LOW')}</option>
              <option value="MEDIUM">{t('MEDIUM')}</option>
              <option value="HIGH">{t('HIGH')}</option>
              <option value="EMERGENCY">{t('EMERGENCY')}</option>
            </select>
          </div>
        </div>

        {/* Complaints Table / List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-500">
            {t('loadingGrievances')}
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-500">
            {t('noComplaintsFound')}
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-[#2E7D32]">
                      {c.complaintReference}
                    </span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-xs font-semibold text-gray-800">{t(c.category) || c.category}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : c.status === 'IN_PROGRESS'
                        ? 'bg-amber-100 text-amber-800'
                        : c.status === 'ASSIGNED'
                        ? 'bg-blue-100 text-blue-800'
                        : c.status === 'REJECTED'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {t(c.status) || c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">{t('citizen')}:</span> {c.citizen?.fullName} ({c.citizen?.phone || 'N/A'})
                  </div>
                  <div>
                    <span className="text-gray-400">{t('worker')}:</span>{' '}
                    <strong className="text-gray-800">
                      {c.assignedWorker?.user?.fullName || t('unassigned')}
                    </strong>
                  </div>
                  <div className="col-span-2 truncate">
                    <span className="text-gray-400">{t('address')}:</span> {c.address}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('viewFullDetails')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedComplaint(c);
                      setSelectedWorkerId(c.assignedWorkerId || workers[0]?.id || '');
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-semibold rounded-xl shadow transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{c.assignedWorkerId ? t('reassignWorker') : t('assignWorker')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Worker Assignment Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-bold text-gray-900">{t('assignWorkerTitle')}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-600">
                {t('complaints')}: <strong>{selectedComplaint.complaintReference}</strong>
                <br />
                {t('address')}: {selectedComplaint.address}
              </p>

              <form onSubmit={handleAssignSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">{t('selectPersonnel')}</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    required
                    className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.user?.fullName} ({w.employeeCode}) - {w.serviceZone?.name?.split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">{t('supervisorInstructions')}</label>
                  <textarea
                    rows={2}
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder={t('instructionsPlaceholder')}
                    className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={assignLoading}
                  className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
                >
                  {assignLoading ? t('dispatching') : t('assignWorkerBtn')}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
