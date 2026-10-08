import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  Send,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import { LocationPicker } from '../components/maps/LocationPicker';
import api from '../api/client';

export const RaiseComplaintPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [zones, setZones] = useState([]);
  const [formData, setFormData] = useState({
    wasteType: 'Wet waste',
    category: 'Garbage not collected',
    description: '',
    priority: 'MEDIUM',
    address: user?.address || '',
    phone: user?.phone || '',
    serviceZoneId: '',
    latitude: 17.7215,
    longitude: 83.2985,
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successComplaint, setSuccessComplaint] = useState(null);

  useEffect(() => {
    // Fetch available service zones
    const fetchZones = async () => {
      try {
        const res = await api.get('/schedules/zones');
        setZones(res.data || []);
        if (res.data?.length > 0) {
          setFormData((prev) => ({ ...prev, serviceZoneId: res.data[0].id }));
        }
      } catch (err) {
        console.warn('Could not load service zones:', err.message);
      }
    };
    fetchZones();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image is too large (maximum 5MB allowed).');
      return;
    }

    setError('');
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.description.trim().length < 10) {
      setError('Please provide a descriptive explanation of at least 10 characters.');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please provide the street address / landmark.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('wasteType', formData.wasteType);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('priority', formData.priority);
      data.append('latitude', String(formData.latitude));
      data.append('longitude', String(formData.longitude));
      data.append('address', formData.address);
      if (formData.serviceZoneId) {
        data.append('serviceZoneId', formData.serviceZoneId);
      }
      if (selectedImage) {
        data.append('image', selectedImage);
      }

      const res = await api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessComplaint(res.data);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successComplaint) {
    return (
      <div className="min-h-screen bg-[#F5F8F5] pb-24">
        <TopAppBar title="Complaint Submitted" showBack={true} />
        <main className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 text-center shadow-md border border-green-100 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-[#2E7D32] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">Complaint Registered!</h2>
            <p className="text-xs text-gray-600">
              Your grievance has been logged in the municipal database and routed to sanitation authorities.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 my-4">
              <span className="text-[11px] text-green-700 uppercase font-semibold">
                Complaint Reference ID
              </span>
              <p className="text-xl font-extrabold text-[#2E7D32] font-mono mt-0.5">
                {successComplaint.complaintReference}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Category: {successComplaint.category} ({successComplaint.priority} Priority)
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigate(`/complaints/${successComplaint.id}`)}
                className="w-full py-3 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm rounded-xl shadow-md transition"
              >
                Track This Complaint
              </button>
              <button
                onClick={() => {
                  setSuccessComplaint(null);
                  setFormData({
                    wasteType: 'Wet waste',
                    category: 'Garbage not collected',
                    description: '',
                    priority: 'MEDIUM',
                    address: user?.address || '',
                    phone: user?.phone || '',
                    serviceZoneId: zones[0]?.id || '',
                    latitude: 17.7215,
                    longitude: 83.2985,
                  });
                  removeImage();
                }}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-xs rounded-xl transition"
              >
                File Another Complaint
              </button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('raiseComplaint')} showBack={true} />

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-100 space-y-5">
          <div className="border-b pb-3">
            <h2 className="text-lg font-bold text-gray-900">Register Waste Grievance</h2>
            <p className="text-xs text-gray-500">
              Provide exact location and description for quick dispatch of sanitation staff.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Waste Type & Category Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Waste Classification *</label>
                <select
                  value={formData.wasteType}
                  onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  <option value="Wet waste">Wet waste (Kitchen & Organic)</option>
                  <option value="Dry waste">Dry waste (Paper, Boxes, Glass)</option>
                  <option value="Plastic waste">Plastic waste (Bottles, Covers)</option>
                  <option value="E-waste">E-waste (Electronics & Cables)</option>
                  <option value="Mixed waste">Mixed unsegregated waste</option>
                  <option value="Other">Other waste material</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Issue Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  <option value="Garbage not collected">Garbage not collected</option>
                  <option value="Overflowing dustbin">Overflowing community dustbin</option>
                  <option value="Illegal dumping">Illegal dumping in public plot</option>
                  <option value="Blocked drainage">Blocked drainage / Stagnant water</option>
                  <option value="Public sanitation issue">Public sanitation issue</option>
                  <option value="Other">Other civic sanitation problem</option>
                </select>
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Urgency / Priority Level *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'LOW', label: 'Low', color: 'border-gray-300 text-gray-700 peer-checked:bg-gray-100 peer-checked:border-gray-500' },
                  { id: 'MEDIUM', label: 'Medium', color: 'border-blue-300 text-blue-700 peer-checked:bg-blue-50 peer-checked:border-blue-600' },
                  { id: 'HIGH', label: 'High', color: 'border-orange-300 text-orange-700 peer-checked:bg-orange-50 peer-checked:border-orange-600' },
                  { id: 'EMERGENCY', label: 'Emergency', color: 'border-red-300 text-red-700 peer-checked:bg-red-50 peer-checked:border-red-600' },
                ].map((item) => (
                  <label key={item.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={item.id}
                      checked={formData.priority === item.id}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="sr-only peer"
                    />
                    <div className={`py-2 text-center text-xs font-semibold rounded-xl border transition peer-checked:ring-2 peer-checked:ring-offset-1 ${item.color}`}>
                      {item.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-700">Detailed Description *</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the waste situation, street location landmarks, or specific instructions for sanitation staff..."
                required
                className="w-full mt-1 p-3 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
            </div>

            {/* Photo Upload with Live Preview */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Waste Spot Photograph
              </label>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 w-full sm:w-64 h-44 group">
                  <img
                    src={imagePreview}
                    alt="Waste preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#2E7D32] bg-gray-50 hover:bg-green-50/50 rounded-2xl p-5 cursor-pointer transition">
                  <Camera className="w-7 h-7 text-[#2E7D32] mb-1" />
                  <span className="text-xs font-medium text-gray-700">Take Photo or Upload Image</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG, WebP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Interactive Leaflet Location Picker */}
            <LocationPicker
              initialLat={formData.latitude}
              initialLng={formData.longitude}
              onLocationSelect={({ latitude, longitude }) => {
                setFormData((prev) => ({ ...prev, latitude, longitude }));
              }}
            />

            {/* Manual Street Address & Service Zone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Street Address / Landmark *</label>
                <div className="relative mt-1">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Near Community Hall, Street 3"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Municipal Service Zone</label>
                <select
                  value={formData.serviceZoneId}
                  onChange={(e) => setFormData({ ...formData, serviceZoneId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Grievance...' : 'Submit Complaint'}</span>
            </button>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
