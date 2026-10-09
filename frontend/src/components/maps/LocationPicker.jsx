import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// Fix Leaflet's default marker icons in Vite/Webpack bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom click & drag handler component inside MapContainer
const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        },
      }}
    />
  );
};

export const LocationPicker = ({ initialLat, initialLng, onLocationSelect }) => {
  const { t } = useLanguage();
  // Default coordinates (e.g. Visakhapatnam central coordinates)
  const [position, setPosition] = useState([
    initialLat || 17.7215,
    initialLng || 83.2985,
  ]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null); // 'success' | 'denied' | 'error'
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (position) {
      onLocationSelect({
        latitude: Number(position[0].toFixed(6)),
        longitude: Number(position[1].toFixed(6)),
      });
    }
  }, [position]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setStatusMessage('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        setGpsLoading(false);
        setGpsStatus('success');
        setStatusMessage(t('gpsCapturedNotice'));
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus('denied');
        setStatusMessage(t('dragPinNotice'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 flex items-center space-x-1.5">
          <MapPin className="w-4 h-4 text-[#2E7D32]" />
          <span>{t('captureLocation')} *</span>
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={gpsLoading}
          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-green-50 text-[#2E7D32] border border-green-300 rounded-lg hover:bg-green-100 transition active:scale-95 disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
          <span>{gpsLoading ? t('loading') : t('captureLocation')}</span>
        </button>
      </div>

      {/* GPS Status Notice */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-lg text-xs flex items-start space-x-2 ${
            gpsStatus === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {gpsStatus === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Map View */}
      <div className="h-48 sm:h-56 w-full rounded-xl overflow-hidden border border-gray-300 shadow-sm relative">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-gray-700 border border-gray-200 shadow">
          Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}
        </div>
      </div>
      <p className="text-[11px] text-gray-500">
        {t('dragPinNotice')}
      </p>
    </div>
  );
};
