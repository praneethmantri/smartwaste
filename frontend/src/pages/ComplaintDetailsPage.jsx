import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  Navigation,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Star,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import { ComplaintMap } from '../components/maps/ComplaintMap';
import api from '../api/client';

export const ComplaintDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Reopen Modal state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenNotes, setReopenNotes] = useState('');

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
    } catch (err) {
      setError(err.message || 'Could not load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const handleReopen = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post(`/complaints/${id}/reopen`, { notes: reopenNotes });
      setShowReopenModal(false);
      setReopenNotes('');
      await fetchComplaintDetails();
    } catch (err) {
      alert(`Error reopening complaint: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8F5] pb-24">
        <TopAppBar title="Complaint Details" showBack={true} />
        <div className="max-w-2xl mx-auto p-8 text-center text-xs text-gray-500">
          Loading complaint details...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-[#F5F8F5] pb-24">
        <TopAppBar title="Error" showBack={true} />
        <div className="max-w-md mx-auto p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-gray-800">{error || 'Complaint not found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#2E7D32] text-white text-xs rounded-xl shadow font-semibold"
          >
            Go Back
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Visual Stepper configuration
  const steps = [
    { key: 'SUBMITTED', label: t('SUBMITTED') },
    { key: 'ASSIGNED', label: t('ASSIGNED') },
    { key: 'IN_PROGRESS', label: t('IN_PROGRESS') },
    { key: 'COMPLETED', label: t('COMPLETED') },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === complaint.status);
  const isSpecialStatus = ['REJECTED', 'REOPENED'].includes(complaint.status);

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={`${t('complaintDetailsTitle')} - ${complaint.complaintReference}`} showBack={true} />

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Header Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-gray-500 uppercase font-semibold">{t('referenceId')}</span>
              <h2 className="text-xl font-extrabold text-[#2E7D32] font-mono">
                {complaint.complaintReference}
              </h2>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  complaint.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : complaint.status === 'IN_PROGRESS'
                    ? 'bg-amber-100 text-amber-800'
                    : complaint.status === 'ASSIGNED'
                    ? 'bg-blue-100 text-blue-800'
                    : complaint.status === 'REJECTED'
                    ? 'bg-gray-200 text-gray-800'
                    : complaint.status === 'REOPENED'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {t(complaint.status) || complaint.status.replace('_', ' ')}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Stepper Timeline */}
          {!isSpecialStatus && (
            <div className="pt-3 pb-1 border-t border-gray-100">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200 -z-0"></div>
                {steps.map((st, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div key={st.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                          isDone
                            ? 'bg-[#2E7D32] border-[#2E7D32] text-white shadow-sm'
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-1 font-semibold ${
                          isCurrent ? 'text-[#2E7D32]' : isDone ? 'text-gray-700' : 'text-gray-400'
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isSpecialStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                complaint.status === 'REJECTED'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-purple-50 text-purple-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {t('status')}: <strong>{t(complaint.status) || complaint.status}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Complaint Details Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">{t('complaintDetails')}</h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500 font-medium">{t('wasteType')}</span>
              <p className="font-semibold text-gray-800 mt-0.5">{t(complaint.wasteType) || complaint.wasteType}</p>
            </div>
            <div>
              <span className="text-gray-500 font-medium">{t('category')}</span>
              <p className="font-semibold text-gray-800 mt-0.5">{t(complaint.category) || complaint.category}</p>
            </div>
            <div>
              <span className="text-gray-500 font-medium">{t('priority')}</span>
              <p className="font-semibold text-gray-800 mt-0.5">{t(complaint.priority) || complaint.priority}</p>
            </div>
            <div>
              <span className="text-gray-500 font-medium">{t('serviceZone')}</span>
              <p className="font-semibold text-gray-800 mt-0.5">
                {complaint.serviceZone?.name || t('unassignedWorker')}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500 font-medium">{t('description')}</span>
            <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* Citizen's Uploaded Waste Photo */}
          {complaint.imageUrl && (
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-1.5">
                {t('uploadPhoto')}
              </span>
              <div className="h-48 sm:h-64 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src={complaint.imageUrl}
                  alt="Waste Spot"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Location & Map Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-[#2E7D32]" />
              <span>{t('captureLocation')}</span>
            </h3>
            <a
              href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${complaint.latitude}%2C${complaint.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-[#1976D2] font-semibold hover:underline"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{t('getDirections')}</span>
            </a>
          </div>

          <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            {complaint.address}
          </p>

          <ComplaintMap complaints={[complaint]} height="220px" zoom={15} />
        </div>

        {/* Assigned Worker Info (if assigned) */}
        {complaint.assignedWorker && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-[#2E7D32]" />
              <span>{t('assignedWorker')}</span>
            </h3>
            <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-gray-900">
                  {complaint.assignedWorker.user?.fullName}
                </h4>
                <p className="text-[11px] text-gray-600">
                  {t('employeeCode')}: {complaint.assignedWorker.employeeCode}
                </p>
                <p className="text-[11px] text-gray-600">
                  {t('phone')}: {complaint.assignedWorker.user?.phone || 'N/A'}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-200 text-green-900">
                {complaint.assignedWorker.availabilityStatus}
              </span>
            </div>
          </div>
        )}

        {/* Completion Proof Photos (if completed) */}
        {complaint.completionProofs && complaint.completionProofs.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-sm font-bold text-green-800 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>{t('clearanceProof')}</span>
            </h3>
            {complaint.completionProofs.map((proof) => (
              <div key={proof.id} className="space-y-2 border border-green-200 rounded-2xl p-3 bg-green-50/50">
                <div className="h-48 rounded-xl overflow-hidden bg-gray-100">
                  <img src={proof.imageUrl} alt="Completion Proof" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-700 italic">
                  {t('clearanceNotes')}: "{proof.notes || ''}"
                </p>
                <p className="text-[10px] text-gray-500">
                  {t('resolvedOn')}: {new Date(proof.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Status Audit Trail History */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#2E7D32]" />
            <span>{t('statusTimeline')}</span>
          </h3>

          <div className="space-y-3 pl-2 border-l-2 border-green-200 ml-2">
            {complaint.statusHistory?.map((h) => (
              <div key={h.id} className="relative pl-4 text-xs space-y-0.5">
                <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-[#2E7D32] border-2 border-white"></div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">{t(h.newStatus) || h.newStatus.replace('_', ' ')}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(h.changedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 text-[11px]">{h.notes}</p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {h.changedBy?.fullName} ({t(h.changedBy?.role) || h.changedBy?.role})
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Section (if completed) */}
        {complaint.status === 'COMPLETED' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{t('feedback')}</span>
              </h3>
            </div>

            {complaint.feedback ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-2xl text-xs space-y-1">
                <div className="flex items-center space-x-1 text-yellow-600 font-bold">
                  {[...Array(complaint.feedback.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-1 text-gray-800">({complaint.feedback.rating}/5)</span>
                </div>
                {complaint.feedback.comments && (
                  <p className="text-gray-700 italic">"{complaint.feedback.comments}"</p>
                )}
              </div>
            ) : user?.role === 'CITIZEN' ? (
              <button
                onClick={() => navigate('/feedback', { state: { complaintId: complaint.id } })}
                className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-xs rounded-xl shadow transition"
              >
                {t('giveFeedback')}
              </button>
            ) : null}
          </div>
        )}

        {/* Citizen Action: Reopen Complaint */}
        {['COMPLETED', 'REJECTED'].includes(complaint.status) && user?.role === 'CITIZEN' && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowReopenModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('reopenComplaint')}</span>
            </button>
          </div>
        )}

        {/* Reopen Modal */}
        {showReopenModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">{t('reopenModalTitle')}</h3>
              <p className="text-xs text-gray-600">
                {t('reopenExplanation')}
              </p>

              <textarea
                rows={3}
                value={reopenNotes}
                onChange={(e) => setReopenNotes(e.target.value)}
                placeholder={t('reopenPlaceholder')}
                className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={actionLoading}
                  className="flex-1 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow transition"
                >
                  {actionLoading ? t('reopeningBtn') : t('confirmReopenBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
