// app/hoists/[id]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHoists } from '@/context/HoistsContext';
import { useCustomers } from '@/context/CustomersContext';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Wind, 
  Trash2,
  Search,
  Phone,
  Save,
  CheckCircle2
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
);

type UserRole = 'admin' | 'customer' | 'technician';
type FileCategory = 'Manual' | 'Picture' | 'Inspection Document' | 'Spare Parts Sheet' | 'Calculation report' | 'RAMS';

interface HoistFile {
  id: string;
  name: string;
  category: FileCategory;
  size: string;
  date: string;
  url: string;
  path: string;
}

interface AddressSuggestion {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export default function HoistProfilePage() {
  const router = useRouter();
  const params = useParams();
  const hoistId = params?.id;

  const { hoists, updateHoist } = useHoists();
  const { customers } = useCustomers();

  // Simulated current role
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');

  // Find current hoist
  const hoist = hoists?.find((h: any) => String(h.id) === String(hoistId));
  const customer = customers.find((c: any) => hoist && String(c.id) === String(hoist.customerId));
  const hoistAny = hoist as any;

  // Separate "Hoist Location" (free text) & "Hoist Address" (autocomplete for wind data)
  const [hoistLocation, setHoistLocation] = useState<string>(
    hoistAny?.hoistLocation || hoist?.currentSite || ''
  );
  const [hoistAddress, setHoistAddress] = useState<string>(
    hoistAny?.hoistAddress || customer?.address || ''
  );

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  
  // Coordinates & Pin Override State
  const [resolvedLat, setResolvedLat] = useState<number>(hoistAny?.latitude || hoistAny?.lat || 65.8258);
  const [resolvedLng, setResolvedLng] = useState<number>(hoistAny?.longitude || hoistAny?.lng || 21.6887);
  const [locationSource, setLocationSource] = useState<'address' | 'manual_pin'>(hoistAny?.locationSource || 'address');

  // Live Wind Data State
  const [liveWindSpeed, setLiveWindSpeed] = useState<number | null>(null);
  const [isFetchingWind, setIsFetchingWind] = useState<boolean>(false);

  // Save State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Leaflet Map Reference
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Documents & Media State
  const [files, setFiles] = useState<HoistFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('Manual');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch files from Supabase Storage on load
  useEffect(() => {
    fetchHoistFiles();
  }, [hoistId]);

  // Fetch live wind data whenever coordinates change
  useEffect(() => {
    fetchLiveWindSpeed(resolvedLat, resolvedLng);
  }, [resolvedLat, resolvedLng]);

  const fetchLiveWindSpeed = async (lat: number, lng: number) => {
    setIsFetchingWind(true);
    try {
      // Safely fetch 10-meter WIND GUSTS without caching
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_gusts_10m&wind_speed_unit=ms`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (data && data.current && typeof data.current.wind_gusts_10m === 'number') {
        setLiveWindSpeed(data.current.wind_gusts_10m);
      } else {
        setLiveWindSpeed(0); 
      }
    } catch (err) {
      console.error('Failed to fetch live wind gusts:', err);
      setLiveWindSpeed(0);
    } finally {
      setIsFetchingWind(false);
    }
  };

  const fetchHoistFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('hoist-documents')
        .list(`hoist-${hoistId}/`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (error) {
        console.error('Error fetching files from Supabase:', error.message);
        return;
      }

      if (data) {
        const formattedFiles: HoistFile[] = data.map((item) => {
          const filePath = `hoist-${hoistId}/${item.name}`;
          const { data: publicUrlData } = supabase.storage
            .from('hoist-documents')
            .getPublicUrl(filePath);

          let cat: FileCategory = 'Manual';
          if (item.name.includes('Picture') || item.name.endsWith('.jpg') || item.name.endsWith('.png')) cat = 'Picture';
          else if (item.name.includes('Inspection')) cat = 'Inspection Document';
          else if (item.name.includes('Spare')) cat = 'Spare Parts Sheet';
          else if (item.name.includes('Calculation')) cat = 'Calculation report';
          else if (item.name.includes('RAMS')) cat = 'RAMS';

          return {
            id: item.id || item.name,
            name: item.name.includes('_') ? item.name.split('_').slice(2).join('_') || item.name : item.name,
            category: cat,
            size: item.metadata?.size ? `${(item.metadata.size / (1024 * 1024)).toFixed(1)} MB` : '2.1 MB',
            date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            url: publicUrlData.publicUrl,
            path: filePath
          };
        });
        setFiles(formattedFiles);
      }
    } catch (err) {
      console.error('Failed to load hoist documents:', err);
    }
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView([resolvedLat, resolvedLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([resolvedLat, resolvedLng], { draggable: currentUserRole !== 'customer' }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          setResolvedLat(pos.lat);
          setResolvedLng(pos.lng);
          setLocationSource('manual_pin');
        });

        map.on('click', (e: any) => {
          if (currentUserRole === 'customer') return;
          const { lat, lng } = e.latlng;
          setResolvedLat(lat);
          setResolvedLng(lng);
          marker.setLatLng([lat, lng]);
          setLocationSource('manual_pin');
        });

        mapInstanceRef.current = map;
      } else {
        const map = mapInstanceRef.current;
        map.setView([resolvedLat, resolvedLng], map.getZoom());
        if (markerRef.current) {
          markerRef.current.setLatLng([resolvedLat, resolvedLng]);
        }
      }
    }
  }, [resolvedLat, resolvedLng, currentUserRole]);

  // Live Address Autocomplete suggestions while typing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (hoistAddress.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setIsSearchingAddress(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(hoistAddress)}&count=5`);
        const data = await res.json();
        if (data && data.results) {
          setSuggestions(data.results);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Autocomplete error:', err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [hoistAddress]);

  const handleSelectSuggestion = (item: AddressSuggestion) => {
    const formatted = `${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country || ''}`;
    setHoistAddress(formatted);
    setResolvedLat(item.latitude);
    setResolvedLng(item.longitude);
    setLocationSource('address');
    setSuggestions([]);
  };

  // Save Handler
  const handleSaveProfile = () => {
    if (!hoist) return; 

    setIsSaving(true);
    try {
      if (updateHoist) {
        updateHoist(hoist.id, {
          ...hoist,
          hoistLocation,
          hoistAddress,
          currentSite: hoistLocation || hoistAddress,
          latitude: resolvedLat,
          longitude: resolvedLng,
          locationSource
        } as any);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save hoist profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload document to Supabase Storage
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingFile) return;

    setIsUploading(true);
    try {
      const fileName = `${selectedCategory}_${Date.now()}_${uploadingFile.name.replace(/\s+/g, '_')}`;
      const filePath = `hoist-${hoistId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hoist-documents')
        .upload(filePath, uploadingFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        alert(`Upload failed: ${uploadError.message}. Make sure the 'hoist-documents' bucket exists in Supabase.`);
        setIsUploading(false);
        return;
      }

      await fetchHoistFiles();
      setUploadingFile(null);
      alert('File successfully uploaded to Supabase storage!');
    } catch (err) {
      console.error('Upload exception:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file from Supabase Storage
  const handleDeleteFile = async (filePath: string) => {
    if (!confirm('Are you sure you want to delete this file from Supabase?')) return;

    try {
      const { error } = await supabase.storage
        .from('hoist-documents')
        .remove([filePath]);

      if (error) {
        alert(`Delete failed: ${error.message}`);
        return;
      }

      setFiles(files.filter(f => f.path !== filePath));
    } catch (err) {
      console.error('Delete exception:', err);
    }
  };

  if (!hoist) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Hoist Profile Not Found</h2>
        <p className="text-sm text-gray-500">The requested elevator could not be located in the registry.</p>
        <button
          onClick={() => router.push('/hoists')}
          className="px-4 py-2 bg-[#FE5000] text-white rounded-xl text-sm font-medium"
        >
          Back to Hoist Registry
        </button>
      </div>
    );
  }

  const windLimit = hoist.windSpeedLimit ?? 15;
  const isWindExceeded = liveWindSpeed !== null && liveWindSpeed > windLimit;
  const customerPhone = (customer as any)?.phone || (customer as any)?.contactPhone || '+46 920 123 456';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header, Navigation & Save Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/hoists')}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{hoist.model} <span className="text-xs font-mono font-normal text-gray-500">({hoist.serialNumber})</span></h1>
            <p className="text-xs text-gray-500">Customer: {customer?.name || 'Unassigned'} • Location: {hoistLocation || hoist.currentSite || 'Not Set'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Simulator */}
          <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase px-2">Role:</span>
            {(['admin', 'customer', 'technician'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setCurrentUserRole(role)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  currentUserRole === role 
                    ? 'bg-[#FE5000] text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Save Profile Button */}
          {currentUserRole !== 'customer' && (
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#FE5000] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Hoist Profile'}
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hoist profile, location name, address, and map coordinates successfully saved!
        </div>
      )}

      {/* Core Details, Customer & Live Wind Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status & Live Wind Gusts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status & Wind Radar</p>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              isWindExceeded ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isWindExceeded ? 'Wind Limit Exceeded!' : 'Wind Safe'}
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{hoist.status}</p>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
              <Wind className={`w-5 h-5 ${isWindExceeded ? 'text-red-500' : 'text-[#FE5000]'}`} />
              <div>
                <p className="text-xs font-bold text-gray-800">
                  Live Gusts: {isFetchingWind ? 'Fetching...' : liveWindSpeed !== null ? `${liveWindSpeed.toFixed(1)} m/s` : 'Unknown'}
                </p>
                <p className="text-[10px] text-gray-500">Operational Limit: {windLimit} m/s</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Customer & Phone Number */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Customer & Contact</p>
          <div>
            <p className="text-lg font-bold text-gray-900">{customer?.name || 'None Assigned'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{customer?.address || 'No address specified'}</p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
              <Phone className="w-4 h-4 text-[#FE5000]" />
              <span>{customerPhone}</span>
            </div>
            <a
              href={`tel:${customerPhone.replace(/\s+/g, '')}`}
              className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-[#FE5000] rounded-lg text-xs font-bold transition-colors"
            >
              Call Contact
            </a>
          </div>
        </div>

        {/* Separate Hoist Location & Hoist Address Fields + Map */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 relative">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Site Location & Wind Address</p>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              locationSource === 'manual_pin' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {locationSource === 'manual_pin' ? 'Pin Overridden' : 'Address Linked'}
            </span>
          </div>

          {/* Field 1: Hoist Location (Free input for custom site name or unnamed locations) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700">Hoist Location (Custom Site Name / Area)</label>
            <input
              type="text"
              value={hoistLocation}
              onChange={(e) => setHoistLocation(e.target.value)}
              placeholder="e.g. Turbine 4 / North Yard Area"
              disabled={currentUserRole === 'customer'}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#FE5000]"
            />
          </div>

          {/* Field 2: Hoist Address (Autocomplete for wind data coordinates) */}
          <div className="space-y-1 relative">
            <label className="text-[11px] font-bold text-gray-700">Hoist Address (Autocomplete for Wind Data)</label>
            <div className="relative">
              <input
                type="text"
                value={hoistAddress}
                onChange={(e) => {
                  setHoistAddress(e.target.value);
                  setLocationSource('address');
                }}
                placeholder="Start typing address..."
                disabled={currentUserRole === 'customer'}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#FE5000]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-gray-100">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-orange-50 hover:text-[#FE5000] transition-colors"
                  >
                    <span className="font-bold">{s.name}</span>
                    <span className="text-gray-400 text-[10px] ml-1">
                      {s.admin1 ? `${s.admin1}, ` : ''}{s.country}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Leaflet Map Widget */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
              <span>Lat: {resolvedLat.toFixed(4)}, Lng: {resolvedLng.toFixed(4)}</span>
              <span className="text-[10px] text-gray-400">Click map / drag pin</span>
            </div>
            <div 
              ref={mapRef} 
              className="w-full h-36 rounded-xl border border-gray-200 z-10 overflow-hidden shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Documents, Manuals & Media Hub */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Documents, Manuals & Media</h2>
            <p className="text-xs text-gray-500">Access and manage calculation reports, RAMS, technical sheets, inspection reports, manuals, and site pictures.</p>
          </div>
          <span className="px-3 py-1 bg-orange-50 text-[#FE5000] text-xs font-bold rounded-xl">
            {files.length} Files Available
          </span>
        </div>

        {/* Upload Box (Visible for Admins & Technicians, hidden for Customers) */}
        {currentUserRole !== 'customer' && (
          <form onSubmit={handleFileUpload} className="p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Upload New Hoist Document or Picture to Supabase</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input 
                type="file" 
                onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
                className="text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#FE5000] hover:file:bg-orange-100 cursor-pointer col-span-2"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as FileCategory)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:border-[#FE5000]"
              >
                <option value="Manual">Manual</option>
                <option value="Picture">Picture</option>
                <option value="Inspection Document">Inspection Document</option>
                <option value="Spare Parts Sheet">Spare Parts Sheet</option>
                <option value="Calculation report">Calculation report</option>
                <option value="RAMS">RAMS</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={!uploadingFile || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-[#FE5000] hover:bg-orange-600 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" /> {isUploading ? 'Uploading to Supabase...' : 'Upload File to Supabase'}
            </button>
          </form>
        )}

        {/* File List Grid */}
        {files.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No documents or media uploaded yet.</p>
            <p className="text-xs text-gray-400">Upload calculation reports, RAMS, manuals, inspection sheets, or pictures above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => {
              const isPicture = file.category === 'Picture';
              return (
                <div key={file.path || file.id} className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-3 rounded-xl shrink-0 ${
                      isPicture ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-[#FE5000]'
                    }`}>
                      {isPicture ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 bg-gray-200/70 text-gray-700 text-[10px] font-bold rounded">
                          {file.category}
                        </span>
                        <span className="text-xs text-gray-400">{file.size} • {file.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors shadow-sm"
                      title="Download / View"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    {currentUserRole !== 'customer' && (
                      <button
                        onClick={() => handleDeleteFile(file.path)}
                        className="p-2 bg-white hover:bg-red-50 text-red-500 rounded-xl border border-gray-200 transition-colors shadow-sm"
                        title="Delete File from Supabase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}