import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Truck,
  MapPin,
  Filter,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import api from '../api/client';

export const CollectionSchedulePage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin New Schedule Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    serviceZoneId: '',
    collectionDate: new Date().toISOString().split('T')[0],
    collectionTime: '07:00 AM - 09:00 AM',
    wasteType: 'Wet waste & Organic',
    vehicleNumber: 'AP-31-TC-4011',
  });
  const [addLoading, setAddLoading] = useState(false);

  const fetchZonesAndSchedules = async () => {
    try {
      setLoading(true);
      const zonesRes = await api.get('/schedules/zones');
      setZones(zonesRes.data || []);

      const url = selectedZone
        ? `/schedules?serviceZoneId=${selectedZone}`
        : '/schedules';
      const schedRes = await api.get(url);
      setSchedules(schedRes.data || []);
    } catch (err) {
      console.error('Fetch schedule error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZonesAndSchedules();
  }, [selectedZone]);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      await api.post('/schedules', newSchedule);
      setShowAddModal(false);
      await fetchZonesAndSchedules();
    } catch (err) {
      alert(`Failed to add schedule: ${err.message}`);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this collection schedule?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(`Error deleting schedule: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('collectionSchedule')} showBack={true} />

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Banner with Zone Filter */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Municipal Waste Collection Calendar
              </h2>
              <p className="text-xs text-gray-500">
                Scheduled door-to-door sanitation rounds by ward
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setNewSchedule((prev) => ({
                    ...prev,
                    serviceZoneId: zones[0]?.id || '',
                  }));
                  setShowAddModal(true);
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl shadow hover:bg-[#1B5E20] transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Schedule</span>
              </button>
            )}
          </div>

          {/* Zone Selector */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Filter by Service Ward / Zone:
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            >
              <option value="">All Municipal Wards & Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Demo Data Disclaimer */}
        <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2 text-[11px] text-green-800">
          <Sparkles className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <span>Demo timetable schedules loaded from database. Synchronized with live municipal vehicle routes.</span>
        </div>

        {/* Schedule List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-500 shadow-sm">
            Loading collection schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              No collection rounds scheduled for this selected zone today.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#2E7D32]">
                      {s.wasteType}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : s.status === 'IN_PROGRESS'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>{new Date(s.collectionDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>{s.collectionTime}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-gray-600 col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>{s.serviceZone?.name}</span>
                  </div>

                  {s.vehicleNumber && (
                    <div className="flex items-center space-x-1.5 text-gray-600">
                      <Truck className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                      <span>Vehicle: {s.vehicleNumber}</span>
                    </div>
                  )}

                  {s.worker?.user?.fullName && (
                    <div className="text-gray-600 text-right">
                      Driver: <strong className="text-gray-800">{s.worker.user.fullName}</strong>
                    </div>
                  )}
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleDeleteSchedule(s.id)}
                      className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel Schedule</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Admin Create Schedule Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">Add Collection Schedule</h3>

              <form onSubmit={handleCreateSchedule} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Ward Zone *</label>
                  <select
                    value={newSchedule.serviceZoneId}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, serviceZoneId: e.target.value })
                    }
                    required
                    className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Date *</label>
                  <input
                    type="date"
                    value={newSchedule.collectionDate}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, collectionDate: e.target.value })
                    }
                    required
                    className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Time Window *</label>
                  <input
                    type="text"
                    value={newSchedule.collectionTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, collectionTime: e.target.value })
                    }
                    placeholder="06:30 AM - 08:30 AM"
                    required
                    className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Waste Type *</label>
                  <input
                    type="text"
                    value={newSchedule.wasteType}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, wasteType: e.target.value })
                    }
                    placeholder="Wet waste, Plastic, E-waste"
                    required
                    className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Vehicle Number</label>
                  <input
                    type="text"
                    value={newSchedule.vehicleNumber}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, vehicleNumber: e.target.value })
                    }
                    placeholder="AP-31-TC-4011"
                    className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 py-2 text-xs font-semibold bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl shadow"
                  >
                    {addLoading ? 'Saving...' : 'Add Schedule'}
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
