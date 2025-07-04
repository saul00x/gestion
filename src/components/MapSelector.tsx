import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapSelectorProps {
  initialPosition?: { lat: number; lng: number };
  onPositionChange: (lat: number, lng: number) => void;
}

function LocationMarker({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export const MapSelector: React.FC<MapSelectorProps> = ({ 
  initialPosition = { lat: 33.5731, lng: -7.5898 }, // Casablanca par défaut
  onPositionChange 
}) => {
  const [mapPosition, setMapPosition] = useState<[number, number]>([
    initialPosition.lat, 
    initialPosition.lng
  ]);

  useEffect(() => {
    if (initialPosition.lat !== 0 && initialPosition.lng !== 0) {
      setMapPosition([initialPosition.lat, initialPosition.lng]);
    }
  }, [initialPosition]);

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={mapPosition}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onPositionChange={onPositionChange} />
        {initialPosition.lat !== 0 && initialPosition.lng !== 0 && (
          <Marker position={mapPosition} />
        )}
      </MapContainer>
    </div>
  );
};