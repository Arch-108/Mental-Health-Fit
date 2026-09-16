import { useEffect, useRef, useState } from 'react';
import AppShell from '../components/AppShell';
import { searchFacilities } from '../services/api';
import { IconMapPin } from '../components/Icons';

const TYPE_OPTIONS = [
  { id: '', label: 'All types' },
  { id: 'clinic', label: 'Clinics' },
  { id: 'hospital', label: 'Hospitals' },
  { id: 'pharmacy', label: 'Pharmacies' },
  { id: 'specialist', label: 'Specialists' },
  { id: 'emergency', label: 'Emergency' },
];

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export default function ResourceMap() {
  const [facilities, setFacilities] = useState([]);
  const [type, setType] = useState('');
  const [telehealthOnly, setTelehealthOnly] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    searchFacilities({ type: type || undefined, telehealthOnly }).then(setFacilities).catch(() => setFacilities([]));
  }, [type, telehealthOnly]);

  // Only attempts to load Google Maps if a key is configured — the map
  // still fully functions as a browsable list otherwise, so the feature
  // never breaks the page just because Maps isn't set up yet.
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || facilities.length === 0) return;

    function renderMap() {
      if (!mapRef.current || !window.google) return;
      if (!mapInstance.current) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          zoom: 6,
          center: { lat: Number(facilities[0].latitude), lng: Number(facilities[0].longitude) },
        });
      }
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = facilities.map((f) => {
        const marker = new window.google.maps.Marker({
          position: { lat: Number(f.latitude), lng: Number(f.longitude) },
          map: mapInstance.current,
          title: f.name,
        });
        const info = new window.google.maps.InfoWindow({
          content: `<strong>${f.name}</strong><br/>${f.address || ''}<br/>${f.telehealth_available ? 'Telehealth available' : ''}`,
        });
        marker.addListener('click', () => info.open(mapInstance.current, marker));
        return marker;
      });
    }

    if (window.google) {
      renderMap();
    } else if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`;
      script.async = true;
      script.onload = renderMap;
      document.head.appendChild(script);
    } else {
      document.getElementById('google-maps-script').addEventListener('load', renderMap);
    }
  }, [facilities]);

  return (
    <AppShell>
      <h1>Healthcare Resource Map</h1>
      <p>Clinics, hospitals, pharmacies, and specialists — filtered by what's actually useful to you.</p>

      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ maxWidth: 220 }}>
          {TYPE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 400 }}>
          <input type="checkbox" checked={telehealthOnly} onChange={(e) => setTelehealthOnly(e.target.checked)} style={{ width: 'auto' }} />
          Telehealth available only
        </label>
      </div>

      {GOOGLE_MAPS_KEY ? (
        <div ref={mapRef} style={{ width: '100%', height: 420, borderRadius: 16, marginBottom: '1.2rem', background: '#FBEFD7' }} />
      ) : (
        <div className="card" style={{ marginBottom: '1.2rem', background: '#FFF9EE', borderColor: '#F0DBA6' }}>
          <p style={{ margin: 0 }}>
            Showing results as a list — add a Google Maps API key (VITE_GOOGLE_MAPS_KEY) to enable the interactive
            map view. The feature works fully either way.
          </p>
        </div>
      )}

      <div className="list-section">
        {facilities.length === 0 && <p className="list-empty">No facilities match these filters yet.</p>}
        {facilities.map((f) => (
          <div key={f.id} className="list-row" style={{ alignItems: 'flex-start' }}>
            <span className="list-row-icon"><IconMapPin size={18} /></span>
            <span className="list-row-body">
              <span className="list-row-title">{f.name}</span>
              <span className="list-row-meta">{f.address}</span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {f.telehealth_available ? <Badge>Telehealth</Badge> : null}
                {f.open_24_7 ? <Badge>Open 24/7</Badge> : null}
                {f.phone ? <Badge>{f.phone}</Badge> : null}
              </div>
            </span>
            <span className="list-row-trail" style={{ textTransform: 'capitalize' }}>{f.type}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Badge({ children }) {
  return (
    <span style={{ fontSize: '0.75rem', background: '#FBEFD7', color: '#1B3A63', padding: '0.2rem 0.6rem', borderRadius: 999 }}>
      {children}
    </span>
  );
}
