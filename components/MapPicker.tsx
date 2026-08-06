// components/MapPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const map = useMap();

  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [position, map]);

  return position === null ? null : <Marker position={position} />;
}

export default function MapPicker({ 
  initialLocation, 
  onLocationChange 
}: MapPickerProps) {
  const defaultLat = initialLocation?.lat ?? 60.1699;
  const defaultLng = initialLocation?.lng ?? 24.9384;

  const [position, setPosition] = useState<[number, number] | null>([defaultLat, defaultLng]);

  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setPosition([initialLocation.lat, initialLocation.lng]);
    }
  }, [initialLocation?.lat, initialLocation?.lng]);

  const handleLocationChange = (lat: number, lng: number) => {
    const newPos: [number, number] = [lat, lng];
    setPosition(newPos);
    onLocationChange(lat, lng);
  };

  return (
    <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={position || [defaultLat, defaultLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Satellite Imagery Tile Layer (Esri World Imagery) */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        <LocationMarker 
          position={position} 
          onLocationChange={handleLocationChange} 
        />
      </MapContainer>
    </div>
  );
}
