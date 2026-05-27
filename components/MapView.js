'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

function createIcon(label, color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="11" fill="white"/>
        <text x="16" y="21" text-anchor="middle" font-family="Arial" font-size="${String(label).length > 1 ? 11 : 13}" font-weight="bold" fill="${color}">${label}</text>
      </svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 11);
    } else {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

function FlyToActive({ active }) {
  const map = useMap();
  useEffect(() => {
    if (active) map.flyTo([active.lat, active.lng], 12, { duration: 0.8 });
  }, [active, map]);
  return null;
}

export default function MapView({ items, activeId, onMarkerClick }) {
  const markerRefs = useRef({});

  useEffect(() => {
    if (activeId && markerRefs.current[activeId]) {
      markerRefs.current[activeId].openPopup();
    }
  }, [activeId]);

  const validItems = items.filter((i) => i.lat && i.lng);
  const activeItem = validItems.find((i) => i.id === activeId);

  return (
    <MapContainer center={[-25.0, 134.0]} zoom={4} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={validItems} />
      <FlyToActive active={activeItem} />
      {validItems.map((item) => {
        const color = item.markerType === 'hub' ? '#2563eb' : '#6b9c1f';
        // Use item.label if provided, otherwise use index number
        const label = item.label || '';
        return (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={createIcon(label, color)}
            ref={(ref) => { if (ref) markerRefs.current[item.id] = ref; }}
            eventHandlers={{ click: () => onMarkerClick(item.id) }}
          >
            <Popup>
              <div className="popup-title">{item.label ? `${item.label}. ` : ''}{item.popupTitle}</div>
              {item.popupCompany && <div className="popup-row">{item.popupCompany}</div>}
              {item.popupAddress && <div className="popup-row">{item.popupAddress}</div>}
              {item.popupPhone && <div className="popup-row">{item.popupPhone}</div>}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
