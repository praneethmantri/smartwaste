import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import api from '../api/client';

export const FeedbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [completedComplaints, setCompletedComplaints] = useState([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState(
    location.state?.complaintId || ''
  );
  const [rating, setRating] = useState(5);
  const [recommendation, setRecommendation] = useState(true);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEligibleComplaints = async () => {
      try {
        setLoading(true);
        const res = await api.get('/complaints?status=COMPLETED');
        const list = res.data.complaints || [];
        // Only complaints without feedback
        setCompletedComplaints(list);
        if (!selectedComplaintId && list.length > 0) {
          setSelectedComplaintId(list[0].id);
        }
      } catch (err) {
        console.error('Could not load completed complaints:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEligibleComplaints();
  }, [selectedComplaintId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaintId) {
      setError('Please select a resolved complaint to review.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/feedback', {
        complaintId: selectedComplaintId,
        rating,
        recommendation,
        comments,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('feedback')} showBack={true} />

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-100 space-y-4">
          <div className="border-b pb-3 text-center sm:text-left">
            <h2 className="text-lg font-bold text-gray-900">Sanitation Service Feedback</h2>
            <p className="text-xs text-gray-500">
              Your rating directly evaluates the cleanliness and response time of our sanitation staff.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 bg-green-100 text-[#2E7D32] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Thank You for Your Feedback!</h3>
              <p className="text-xs text-gray-600 max-w-xs mx-auto">
                Your rating has been saved and shared with the municipal sanitation department.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-6 py-2.5 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl shadow hover:bg-[#1B5E20] transition"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Citizen Details */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Citizen Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.fullName || ''}
                  className="w-full mt-1 p-2.5 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-700"
                />
              </div>

              {/* Complaint Selection */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Resolved Complaint *</label>
                {completedComplaints.length === 0 ? (
                  <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    No completed complaints available for review. Feedback can only be given once a sanitation task is completed.
                  </div>
                ) : (
                  <select
                    value={selectedComplaintId}
                    onChange={(e) => setSelectedComplaintId(e.target.value)}
                    required
                    className="w-full mt-1 p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  >
                    {completedComplaints.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.complaintReference} - {c.category} ({c.wasteType})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Star Rating Selection */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Overall Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center space-x-2 py-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          s <= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">
                    {rating === 5 ? 'Excellent 🌟' : rating >= 4 ? 'Good 👍' : rating >= 3 ? 'Average' : 'Needs Improvement'}
                  </span>
                </div>
              </div>

              {/* Recommend Recommendation Toggle */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Would you recommend our sanitation service in your locality?
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRecommendation(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                      recommendation
                        ? 'bg-green-50 border-green-500 text-green-800 ring-2 ring-green-500'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Yes, Highly Recommend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecommendation(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                      !recommendation
                        ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-500'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>No, Need Better Service</span>
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Comments or Suggestions</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share details about worker punctuality, street cleanliness, or segregation advice..."
                  className="w-full mt-1 p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || completedComplaints.length === 0}
                className="w-full py-3 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm rounded-xl shadow transition disabled:opacity-50"
              >
                {submitting ? 'Submitting Review...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
