import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Navigation,
  ExternalLink,
  Camera,
  Play,
  Upload,
  X,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import { ComplaintMap } from '../components/maps/ComplaintMap';
import api from '../api/client';

export const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    worker: null,
    counts: { assigned: 0, inProgress: 0, completed: 0 },
    tasks: [],
    todaySchedules: [],
  });

  const [statusTab, setStatusTab] = useState('ASSIGNED'); // 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
  const [actionLoading, setActionLoading] = useState(false);

  // Complete Task Modal state
  const [selectedTaskForProof, setSelectedTaskForProof] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [proofNotes, setProofNotes] = useState('');
  const [proofError, setProofError] = useState('');

  const fetchWorkerDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workers/tasks');
      setData(res.data);
    } catch (err) {
      console.error('Fetch worker tasks error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerDashboard();
  }, []);

  const handleStartWork = async (taskId) => {
    try {
      setActionLoading(true);
      await api.patch(`/workers/tasks/${taskId}/status`, {
        status: 'IN_PROGRESS',
        notes: 'Sanitation worker dispatched and arrived at location.',
      });
      await fetchWorkerDashboard();
    } catch (err) {
      alert(`Error updating task status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProofImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
      setProofError('');
    }
  };

  const handleSubmitCompletionProof = async (e) => {
    e.preventDefault();
    if (!proofImage) {
      setProofError('A verification photo proof of the cleaned area is required.');
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('image', proofImage);
      formData.append('notes', proofNotes);

      await api.post(`/workers/tasks/${selectedTaskForProof.id}/completion-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSelectedTaskForProof(null);
      setProofImage(null);
      if (proofPreview) URL.revokeObjectURL(proofPreview);
      setProofPreview(null);
      setProofNotes('');
      await fetchWorkerDashboard();
    } catch (err) {
      setProofError(err.message || 'Failed to upload completion proof.');
    } finally {
      setActionLoading(false);
    }
  };

  const currentTasks = data.tasks.filter((t) => {
    if (statusTab === 'ASSIGNED') return t.status === 'ASSIGNED' || t.status === 'SUBMITTED';
    if (statusTab === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'REOPENED';
    return t.status === 'COMPLETED';
  });

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('workerDashboard')} />

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Worker Profile Badge Card */}
        <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] rounded-3xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/20">
                {data.worker?.employeeCode || 'SW-WORKER'}
              </span>
              <h2 className="text-xl font-bold">{user?.fullName}</h2>
              <p className="text-xs text-green-100 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-green-200" />
                <span>{t('serviceZone')}: {data.worker?.serviceZone?.name || t('unassignedWorker')}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-green-900/60 border border-green-500/40">
                {t('status')}: {data.worker?.availabilityStatus || 'ON_DUTY'}
              </span>
            </div>
          </div>
        </div>

        {/* Task Metric Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div
            onClick={() => setStatusTab('ASSIGNED')}
            className={`p-3.5 rounded-2xl cursor-pointer text-center transition border ${
              statusTab === 'ASSIGNED'
                ? 'bg-blue-50 border-blue-400 shadow-sm'
                : 'bg-white border-gray-100'
            }`}
          >
            <span className="text-[11px] font-medium text-gray-500">{t('assignedTasks')}</span>
            <p className="text-2xl font-extrabold text-blue-700 mt-0.5">
              {data.counts.assigned}
            </p>
            <span className="text-[10px] text-blue-600">{t('pendingComplaints')}</span>
          </div>

          <div
            onClick={() => setStatusTab('IN_PROGRESS')}
            className={`p-3.5 rounded-2xl cursor-pointer text-center transition border ${
              statusTab === 'IN_PROGRESS'
                ? 'bg-amber-50 border-amber-400 shadow-sm'
                : 'bg-white border-gray-100'
            }`}
          >
            <span className="text-[11px] font-medium text-gray-500">{t('inProgressTasks')}</span>
            <p className="text-2xl font-extrabold text-amber-700 mt-0.5">
              {data.counts.inProgress}
            </p>
            <span className="text-[10px] text-amber-600">{t('IN_PROGRESS')}</span>
          </div>

          <div
            onClick={() => setStatusTab('COMPLETED')}
            className={`p-3.5 rounded-2xl cursor-pointer text-center transition border ${
              statusTab === 'COMPLETED'
                ? 'bg-green-50 border-green-400 shadow-sm'
                : 'bg-white border-gray-100'
            }`}
          >
            <span className="text-[11px] font-medium text-gray-500">{t('completedTasks')}</span>
            <p className="text-2xl font-extrabold text-green-700 mt-0.5">
              {data.counts.completed}
            </p>
            <span className="text-[10px] text-green-600">{t('COMPLETED')}</span>
          </div>
        </div>

        {/* Today's Schedule Overview */}
        {data.todaySchedules?.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-[#2E7D32]" />
              <span>{t('todayRoute')}</span>
            </h3>
            {data.todaySchedules.map((sc) => (
              <div key={sc.id} className="p-2.5 bg-gray-50 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-800">{t(sc.wasteType) || sc.wasteType}</span>
                  <p className="text-[11px] text-gray-500">{sc.collectionTime} • {sc.serviceZone?.name}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {sc.vehicleNumber || 'AP-31-TC'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Assigned Complaint Locations Map */}
        {data.tasks.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-[#2E7D32]" />
                <span>{t('captureLocation')}</span>
              </h3>
              <span className="text-[11px] text-gray-500">{data.tasks.length} {t('complaints')}</span>
            </div>
            <ComplaintMap complaints={data.tasks} height="220px" zoom={13} />
          </div>
        )}

        {/* Task Cards List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              {t(statusTab === 'ASSIGNED' ? 'assignedTasks' : statusTab === 'IN_PROGRESS' ? 'inProgressTasks' : 'completedTasks')} ({currentTasks.length})
            </h3>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-500">
              {t('loading')}
            </div>
          ) : currentTasks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 space-y-2">
              <CheckSquare className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">{t('noTasksInTab')}</p>
            </div>
          ) : (
            currentTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3.5 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-[#2E7D32]">
                      {task.complaintReference}
                    </span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-xs font-semibold text-gray-800">{t(task.wasteType) || task.wasteType}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.priority === 'EMERGENCY'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {t(task.priority) || task.priority}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-900">{t(task.category) || task.category}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                </div>

                {/* Citizen Photo Preview if uploaded */}
                {task.imageUrl && (
                  <div className="h-36 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={task.imageUrl} alt="Citizen report" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Address & Navigation Buttons */}
                <div className="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-gray-700 truncate max-w-[190px] sm:max-w-xs">
                    <MapPin className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span className="truncate">{task.address}</span>
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${task.latitude}%2C${task.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-[#1976D2] font-semibold hover:underline shrink-0"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{t('getDirections')}</span>
                  </a>
                </div>

                {/* Action Controls */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/complaints/${task.id}`)}
                    className="text-xs text-gray-600 hover:text-black font-semibold"
                  >
                    {t('viewDetails')}
                  </button>

                  <div className="flex gap-2">
                    {task.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStartWork(task.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#1976D2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow transition active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{actionLoading ? t('startingTask') : t('startTask')}</span>
                      </button>
                    )}

                    {['IN_PROGRESS', 'REOPENED'].includes(task.status) && (
                      <button
                        onClick={() => {
                          setSelectedTaskForProof(task);
                          setProofError('');
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-semibold rounded-xl shadow transition active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t('completeTask')}</span>
                      </button>
                    )}

                    {task.status === 'COMPLETED' && (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('COMPLETED')}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Completion Proof Upload Modal */}
        {selectedTaskForProof && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-bold text-gray-900">{t('uploadProofTitle')}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedTaskForProof(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-600">
                {t('referenceId')}: <strong>{selectedTaskForProof.complaintReference}</strong> ({t(selectedTaskForProof.category) || selectedTaskForProof.category})
              </p>

              {proofError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {proofError}
                </div>
              )}

              <form onSubmit={handleSubmitCompletionProof} className="space-y-3.5">
                {/* Photo Upload with Preview */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    {t('clearanceProof')} *
                  </label>
                  {proofPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 h-40">
                      <img src={proofPreview} alt="Proof preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setProofImage(null);
                          setProofPreview(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-green-600 bg-gray-50 rounded-2xl p-4 cursor-pointer transition">
                      <Camera className="w-6 h-6 text-[#2E7D32] mb-1" />
                      <span className="text-xs font-medium text-gray-700">{t('clickToUploadPhoto')}</span>
                      <span className="text-[10px] text-gray-400">JPEG, PNG</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Worker notes */}
                <div>
                  <label className="text-xs font-semibold text-gray-700">{t('clearanceNotes')}</label>
                  <textarea
                    rows={2}
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    placeholder={t('proofNotesPlaceholder')}
                    className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
                >
                  {actionLoading ? t('submittingProofBtn') : t('submitProofBtn')}
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
