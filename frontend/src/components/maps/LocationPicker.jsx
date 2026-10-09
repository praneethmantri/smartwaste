import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Crosshair,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// Fix Leaflet's default marker icons in Vite/Webpack bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to smoothly pan and zoom the Leaflet map when coordinates change
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.0,
        easeLinearity: 0.25,
      });
    }
  }, [center, zoom, map]);
  return null;
};

// Custom click & drag handler component inside MapContainer
const LocationMarker = ({ position, setPosition, onManualPick }) => {
  const map = useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      if (onManualPick) onManualPick(newPos);
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
          const newPos = [pos.lat, pos.lng];
          setPosition(newPos);
          if (onManualPick) onManualPick(newPos);
        },
      }}
    />
  );
};

export const LocationPicker = ({ initialLat, initialLng, onLocationSelect }) => {
  const { t } = useLanguage();
  // Default coordinates (Visakhapatnam central municipal coordinates)
  const defaultCoords = [initialLat || 17.7215, initialLng || 83.2985];
  const [position, setPosition] = useState(defaultCoords);
  const [accuracy, setAccuracy] = useState(null); // in meters
  const [locationSource, setLocationSource] = useState('default'); // 'default' | 'gps' | 'refined' | 'manual'
  const [targetZoom, setTargetZoom] = useState(14);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [readingsCount, setReadingsCount] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'success' | 'warning' | 'error' | 'denied' | 'timeout' | 'manual'
  const [statusMessage, setStatusMessage] = useState(
    'Default municipal area shown. Click "Use My GPS" or tap the map to pinpoint waste location.'
  );

  const watchIdRef = useRef(null);
  const bestAccuracyRef = useRef(Infinity);

  // Notify parent component whenever coordinates, accuracy, or source updates
  useEffect(() => {
    if (position && position[0] && position[1]) {
      onLocationSelect({
        latitude: Number(position[0].toFixed(6)),
        longitude: Number(position[1].toFixed(6)),
        accuracy: accuracy ? Math.round(accuracy) : null,
        source: locationSource,
      });
    }
  }, [position, accuracy, locationSource]);

  // Clean up any active watchPosition listener when component unmounts
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, []);

  const stopWatching = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  };

  // Helper to determine reasonable zoom level based on reported accuracy
  const getZoomForAccuracy = (acc) => {
    if (acc <= 30) return 18;      // Street / building precision
    if (acc <= 100) return 17;     // Block precision
    if (acc <= 500) return 16;     // Neighborhood precision
    if (acc <= 2000) return 14;    // District / suburb precision
    return 12;                     // City / regional precision
  };

  // 1. One-shot GPS acquisition with high accuracy
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setStatusMessage('Unable to determine location: Geolocation is not supported by your browser.');
      return;
    }

    stopWatching();
    setGpsLoading(true);
    setGpsStatus('idle');
    setStatusMessage('Acquiring high-accuracy GPS fix from device sensors...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: reportedAccuracy } = pos.coords;

        console.log('GPS Result:', {
          latitude,
          longitude,
          accuracy: reportedAccuracy,
        });

        const coords = [latitude, longitude];
        bestAccuracyRef.current = reportedAccuracy;
        setPosition(coords);
        setAccuracy(reportedAccuracy);
        setLocationSource('gps');
        setGpsLoading(false);
        setGpsStatus('success');

        const zoom = getZoomForAccuracy(reportedAccuracy);
        setTargetZoom(zoom);

        if (reportedAccuracy <= 100) {
          setGpsStatus('success');
          setStatusMessage(t('gpsCapturedNotice') || `Accurate to approximately ${Math.round(reportedAccuracy)} meters.`);
        } else {
          setGpsStatus('warning');
          setStatusMessage(
            `Approximate location, accuracy ${Math.round(
              reportedAccuracy
            )} meters. Large radius detected (typical of ISP/Wi-Fi positioning). Please refine or drag the pin to pinpoint the exact waste spot.`
          );
        }
      },
      (error) => {
        console.error('GPS error:', error);
        setGpsLoading(false);
        setAccuracy(null);

        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setStatusMessage(
            t('dragPinNotice') ||
              'Location permission denied. Please allow location access in your browser settings, or tap/drag the map pin to manually place the waste spot.'
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsStatus('error');
          setStatusMessage(
            'Unable to determine location: Device position unavailable. Please tap or drag the pin on the map.'
          );
        } else if (error.code === error.TIMEOUT) {
          setGpsStatus('timeout');
          setStatusMessage(
            'Unable to determine location: GPS request timed out after 30 seconds. Please try again or position the pin manually.'
          );
        } else {
          setGpsStatus('error');
          setStatusMessage(
            `Unable to determine location: ${error.message || 'Unknown GPS error'}. Please use the map directly.`
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  };

  // 2. Refine location via watchPosition to progressively capture higher precision
  const handleStartRefineLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setStatusMessage('Unable to determine location: Geolocation is not supported by your browser.');
      return;
    }

    stopWatching();
    setIsWatching(true);
    setReadingsCount(0);
    setStatusMessage('Actively listening for refined GPS readings (watchPosition)...');

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: reportedAccuracy } = pos.coords;

        console.log('GPS Watch Result:', {
          latitude,
          longitude,
          accuracy: reportedAccuracy,
        });

        setReadingsCount((prev) => prev + 1);

        // Prefer more accurate readings
        if (reportedAccuracy < bestAccuracyRef.current || bestAccuracyRef.current === Infinity) {
          bestAccuracyRef.current = reportedAccuracy;
          const coords = [latitude, longitude];
          setPosition(coords);
          setAccuracy(reportedAccuracy);
          setLocationSource('refined');

          const zoom = getZoomForAccuracy(reportedAccuracy);
          setTargetZoom(zoom);

          if (reportedAccuracy <= 100) {
            setGpsStatus('success');
            setStatusMessage(
              `Refined location! Accurate to approximately ${Math.round(reportedAccuracy)} meters.`
            );
          } else {
            setGpsStatus('warning');
            setStatusMessage(
              `Refining... Best accuracy so far: ${Math.round(
                reportedAccuracy
              )} meters. Still >100m; tap/drag map pin for exact bin spot.`
            );
          }
        }
      },
      (err) => {
        console.error('GPS Watch error:', err);
        stopWatching();
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setStatusMessage('Location permission denied during refinement.');
        } else {
          setGpsStatus('error');
          setStatusMessage(
            `Unable to refine location: ${err.message || 'Position unavailable'}.`
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );

    watchIdRef.current = id;
  };

  const handleStopRefining = () => {
    stopWatching();
    if (accuracy !== null) {
      setStatusMessage(
        `Location locked at ${Math.round(accuracy)}m accuracy. You can now tap/drag to adjust or submit.`
      );
    } else {
      setStatusMessage('Refinement stopped.');
    }
  };

  // 3. User manually clicks or drags pin on the map
  const handleManualPick = (newCoords) => {
    stopWatching();
    setPosition(newCoords);
    setLocationSource('manual');
    setAccuracy(null);
    setGpsStatus('manual');
    setStatusMessage(
      `Manually pinned on map (Lat: ${newCoords[0].toFixed(5)}, Lng: ${newCoords[1].toFixed(5)}).`
    );
  };

  return (
    <div className="space-y-2.5">
      {/* Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-gray-700 flex items-center space-x-1.5">
          <MapPin className="w-4 h-4 text-[#2E7D32]" />
          <span>{t('captureLocation')} *</span>
          {accuracy !== null && locationSource !== 'manual' && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                accuracy <= 100
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              ±{Math.round(accuracy)}m
            </span>
          )}
        </label>

        <div className="flex items-center space-x-2">
          {/* Use My GPS Button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={gpsLoading}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-[#2E7D32] border border-green-300 rounded-lg hover:bg-green-100 transition active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? t('loading') : t('captureLocation')}</span>
          </button>

          {/* Refine Location / Watch Position Button */}
          {!isWatching ? (
            <button
              type="button"
              onClick={handleStartRefineLocation}
              disabled={gpsLoading}
              title="Continuous GPS watching to get better precision"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-600" />
              <span>Refine Location</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopRefining}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium bg-emerald-600 text-white border border-emerald-700 rounded-lg hover:bg-emerald-700 transition active:scale-95 shadow-sm animate-pulse"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lock Spot ({readingsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* GPS Status Notice Banners */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-start space-x-2 border transition ${
            gpsStatus === 'success'
              ? 'bg-green-50 text-green-900 border-green-200'
              : gpsStatus === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-sm'
              : gpsStatus === 'manual'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : gpsStatus === 'denied' || gpsStatus === 'error' || gpsStatus === 'timeout'
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}
        >
          {gpsStatus === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          ) : gpsStatus === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : gpsStatus === 'manual' ? (
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          ) : gpsStatus === 'denied' || gpsStatus === 'error' || gpsStatus === 'timeout' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <Navigation className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 space-y-0.5">
            <p className="font-semibold">
              {gpsStatus === 'success' && 'High-Accuracy GPS Fix'}
              {gpsStatus === 'warning' && 'Approximate Location Detected'}
              {gpsStatus === 'manual' && 'Manual Location Selected'}
              {gpsStatus === 'denied' && 'Location Permission Denied'}
              {gpsStatus === 'timeout' && 'Location Request Timed Out'}
              {gpsStatus === 'error' && 'Location Unavailable'}
              {gpsStatus === 'idle' && 'Municipal Map Center'}
            </p>
            <p className="text-[11px] leading-relaxed">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* Map View */}
      <div className="h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-gray-300 shadow-sm relative">
        <MapContainer
          center={position}
          zoom={targetZoom}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Map Updater to sync center and zoom */}
          <MapUpdater center={position} zoom={targetZoom} />

          {/* Visual Accuracy Radius Circle */}
          {accuracy !== null && locationSource !== 'manual' && (
            <Circle
              center={position}
              radius={accuracy}
              pathOptions={{
                color: accuracy <= 100 ? '#2E7D32' : '#F57C00',
                fillColor: accuracy <= 100 ? '#4CAF50' : '#FF9800',
                fillOpacity: 0.15,
                weight: 1.5,
              }}
            />
          )}

          {/* Draggable Marker */}
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onManualPick={handleManualPick}
          />
        </MapContainer>

        {/* Live Coordinate & Accuracy Pill Overlay */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-gray-800 border border-gray-200 shadow flex items-center space-x-2">
          <span>Lat: {position[0].toFixed(5)}</span>
          <span className="text-gray-300">|</span>
          <span>Lng: {position[1].toFixed(5)}</span>
          {accuracy !== null && locationSource !== 'manual' ? (
            <>
              <span className="text-gray-300">|</span>
              <span className={accuracy <= 100 ? 'text-[#2E7D32] font-semibold' : 'text-amber-700 font-semibold'}>
                ±{Math.round(accuracy)}m
              </span>
            </>
          ) : locationSource === 'manual' ? (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-blue-700 font-semibold">Manual Pin</span>
            </>
          ) : null}
        </div>
      </div>

      <p className="text-[11px] text-gray-500">
        💡 {t('dragPinNotice')}
      </p>
    </div>
  );
};
