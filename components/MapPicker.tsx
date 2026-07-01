'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationChange: (lat: number, lng: number) => void;
}

function LocationMarker({ 
  position, 
  onLocationChange 
}: { 
  position: [number, number] | null; 
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function MapPicker({ 
  initialLocation, 
  onLocationChange 
}: MapPickerProps) {
  
  // Use initialLocation if provided, otherwise default to Helsinki
  const defaultLat = initialLocation?.lat ?? 60.1699;
  const defaultLng = initialLocation?.lng ?? 24.9384;

  const [position, setPosition] = useState<[number, number] | null>([defaultLat, defaultLng]);

  // Only set initial position once when component mounts or when initialLocation actually changes from parent
  useEffect(() => {
    if (initialLocation) {
      setPosition([initialLocation.lat, initialLocation.lng]);
    }
  }, [initialLocation?.lat, initialLocation?.lng]); // Only re-run when actual coordinates change

  const handleLocationChange = (lat: number, lng: number) => {
    const newPos: [number, number] = [lat, lng];
    setPosition(newPos);
    onLocationChange(lat, lng);
  };

  return (
    <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={[defaultLat, defaultLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationMarker 
          position={position} 
          onLocationChange={handleLocationChange} 
        />
      </MapContainer>
    </div>
  );
}