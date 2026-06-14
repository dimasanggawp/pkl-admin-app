import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage } from '../services/toastService';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// SMK Kartanegara Wates
const DEFAULT_CENTER = [-7.90843451513118, 112.11673878292038];
const MIN_RADIUS_M = 10;
const MAX_RADIUS_M = 5000;

// Search box overlay - geocodes via Nominatim (OpenStreetMap) and flies the
// map to the selected result, also reporting the picked coordinates to the
// parent so they can be copied into the lat/lon form fields.
function MapSearchControl({ onSelect }) {
  const map = useMap();
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, []);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [query]);

  const handleSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    map.flyTo([lat, lon], 17);
    setQuery(result.display_name);
    setResults([]);
    setOpen(false);
    onSelect?.(lat, lon, result.display_name);
  };

  return (
    <div ref={containerRef} className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control m-2 w-72 max-w-[calc(100vw-5rem)]">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Cari lokasi di peta..."
            className="field-input w-full shadow-md"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              Mencari...
            </span>
          )}
        </div>
        {open && results.length > 0 && (
          <ul className="mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-alt transition-colors"
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Keeps the map centered on the currently edited location whenever the
// lat/lon form fields change (e.g. after selecting a siswa or a search result).
function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 15));
    }
  }, [map, position]);

  return null;
}

function LocationManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [tempatPkl, setTempatPkl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  const [focusPosition, setFocusPosition] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/siswa');
        const data = response.data?.data || response.data;
        setStudents(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [refreshKey]);

  const locations = useMemo(
    () => students.filter((s) => s.lat_pkl != null && s.lon_pkl != null),
    [students]
  );

  const resetForm = () => {
    setEditingId(null);
    setTempatPkl('');
    setLatitude('');
    setLongitude('');
    setRadius('100');
    setFocusPosition(null);
  };

  const handleEdit = (siswa) => {
    setEditingId(siswa.id);
    setTempatPkl(siswa.tempat_pkl || '');
    setLatitude(siswa.lat_pkl != null ? String(siswa.lat_pkl) : '');
    setLongitude(siswa.lon_pkl != null ? String(siswa.lon_pkl) : '');
    setRadius(siswa.radius_km != null ? String(Math.round(siswa.radius_km * 1000)) : '100');
    if (siswa.lat_pkl != null && siswa.lon_pkl != null) {
      setFocusPosition([Number(siswa.lat_pkl), Number(siswa.lon_pkl)]);
    }
  };

  const handleSave = async () => {
    if (!editingId) {
      showError('Pilih siswa yang akan diatur lokasi PKL-nya');
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusM = parseInt(radius, 10);

    if (!tempatPkl.trim()) {
      showError('Nama tempat PKL wajib diisi');
      return;
    }
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      showError('Latitude harus berada di antara -90 dan 90');
      return;
    }
    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      showError('Longitude harus berada di antara -180 dan 180');
      return;
    }
    if (Number.isNaN(radiusM) || radiusM < MIN_RADIUS_M || radiusM > MAX_RADIUS_M) {
      showError(`Radius harus berada di antara ${MIN_RADIUS_M} dan ${MAX_RADIUS_M} meter`);
      return;
    }

    try {
      await API.put(`/siswa/${editingId}`, {
        tempat_pkl: tempatPkl.trim(),
        lat_pkl: lat,
        lon_pkl: lon,
        radius_km: radiusM / 1000,
      });
      showSuccess('Lokasi PKL berhasil disimpan');
      resetForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const mapCenter =
    locations.length > 0 ? [locations[0].lat_pkl, locations[0].lon_pkl] : DEFAULT_CENTER;

  const handleSearchSelect = (lat, lon) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lon.toFixed(6));
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mb-6">Lokasi PKL</h1>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          Data siswa belum tersedia: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Form */}
        <div className="panel p-4 sm:p-6 lg:col-span-1">
          <h2 className="text-xl font-bold text-ink mb-4">
            {editingId ? 'Edit Lokasi PKL' : 'Atur Lokasi PKL'}
          </h2>

          <label className="field-label">Siswa</label>
          <select
            value={editingId || ''}
            onChange={(e) => {
              const siswa = students.find((s) => s.id === Number(e.target.value));
              if (siswa) handleEdit(siswa);
              else resetForm();
            }}
            className="field-input mb-3"
          >
            <option value="">-- Pilih Siswa --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.nisn})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nama Tempat PKL"
            value={tempatPkl}
            onChange={(e) => setTempatPkl(e.target.value)}
            className="field-input mb-3"
          />
          <input
            type="number"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="field-input mb-3"
            step="0.0001"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="field-input mb-3"
            step="0.0001"
          />
          <input
            type="number"
            placeholder="Radius (meter)"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="field-input mb-4"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!editingId}
              className="btn-primary flex-1"
            >
              Simpan
            </button>
            <button onClick={resetForm} className="btn-secondary flex-1">
              Batal
            </button>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 panel p-4 sm:p-6">
          <h2 className="text-xl font-bold text-ink mb-4">Daftar Lokasi PKL</h2>
          {loading ? (
            <div className="p-4 text-center text-muted">Memuat data siswa...</div>
          ) : locations.length > 0 ? (
            <div className="space-y-3">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-4 border border-border rounded-xl hover:bg-surface-alt flex justify-between items-start gap-2"
                >
                  <div>
                    <p className="font-bold text-ink">{loc.tempat_pkl}</p>
                    <p className="text-sm text-muted">
                      {loc.nama} ({loc.nisn})
                    </p>
                    <p className="text-sm text-muted">
                      Lat: {Number(loc.lat_pkl).toFixed(4)}, Lon: {Number(loc.lon_pkl).toFixed(4)}, Radius:{' '}
                      {Math.round((loc.radius_km || 0) * 1000)}m
                    </p>
                  </div>
                  <button onClick={() => handleEdit(loc)} className="text-accent hover:underline">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted text-center p-4">Belum ada lokasi PKL terdaftar</div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="panel p-4 sm:p-6">
        <h2 className="text-xl font-bold text-ink mb-4">Peta Lokasi PKL</h2>
        <div className="h-96">
          <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapSearchControl onSelect={handleSearchSelect} />
            <RecenterMap position={focusPosition} />
            {locations.map((loc) => (
              <Circle
                key={loc.id}
                center={[loc.lat_pkl, loc.lon_pkl]}
                radius={(loc.radius_km || 0) * 1000}
                color="green"
                fillColor="lightgreen"
                fillOpacity={0.2}
              >
                <Popup>
                  <strong>{loc.tempat_pkl}</strong>
                  <br />
                  {loc.nama} ({loc.nisn})
                  <br />
                  Radius: {Math.round((loc.radius_km || 0) * 1000)}m
                </Popup>
              </Circle>
            ))}
            {locations.map((loc) => (
              <Marker key={loc.id} position={[loc.lat_pkl, loc.lon_pkl]}>
                <Popup>
                  <strong>{loc.tempat_pkl}</strong>
                  <br />
                  {loc.nama} ({loc.nisn})
                  <br />
                  Radius: {Math.round((loc.radius_km || 0) * 1000)}m
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default LocationManagement;
