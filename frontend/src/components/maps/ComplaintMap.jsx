import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ExternalLink, Navigation } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const createColoredIcon = (color) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

const statusColors = {
  SUBMITTED: '#E53935', // Red
  ASSIGNED: '#1E88E5', // Blue
  IN_PROGRESS: '#FB8C00', // Orange
  COMPLETED: '#43A047', // Green
  REJECTED: '#757575', // Gray
  REOPENED: '#8E24AA', // Purple
};

export const ComplaintMap = ({ complaints = [], center, zoom = 13, height = '360px' }) => {
  const { t } = useLanguage();
  const defaultCenter = center || (complaints.length > 0 && complaints[0].latitude
    ? [complaints[0].latitude, complaints[0].longitude]
    : [17.7215, 83.2985]);

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {complaints.map((c) => {
          if (!c.latitude || !c.longitude) return null;
          const color = statusColors[c.status] || '#1E88E5';
          const icon = createColoredIcon(color);
          const osmDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${c.latitude}%2C${c.longitude}`;
          const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`;

          return (
            <Marker key={c.id} position={[c.latitude, c.longitude]} icon={icon}>
              <Popup>
                <div className="p-1 max-w-[220px]">
                  <div className="flex items-center justify-between border-b pb-1 mb-1">
                    <span className="font-bold text-xs text-[#2E7D32]">{c.complaintReference}</span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: color }}
                    >
                      {t(c.status) || c.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{t(c.category) || c.category}</p>
                  <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">{c.description}</p>
                  <p className="text-[10px] text-gray-500 mt-1 italic">{c.address}</p>

                  <div className="mt-2.5 pt-2 border-t flex items-center justify-between gap-2">
                    <a
                      href={osmDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] text-[#1976D2] hover:underline font-medium"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{t('osmNavigate')}</span>
                    </a>
                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-0.5 text-[10px] text-gray-600 hover:text-black font-medium"
                    >
                      <span>{t('maps')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
