import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Power, PowerOff, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';
import Modal from '../components/admin/Modal';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const DEFAULT_CENTER = [-7.90843451513118, 112.11673878292038];

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 15));
  }, [map, position]);
  return null;
}

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
      if (!query.trim()) { setResults([]); return; }
      try {
        setSearching(true);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch { setResults([]); } finally { setSearching(false); }
    }, 500);
    return () => clearTimeout(handle);
  }, [query]);

  const handleSelect = (r) => {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    map.flyTo([lat, lon], 17);
    setQuery(r.display_name);
    setResults([]);
    setOpen(false);
    onSelect?.(lat, lon);
  };

  return (
    <div ref={containerRef} className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control m-2 w-72 max-w-[calc(100vw-5rem)]">
        <div className="relative">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Cari lokasi..." className="field-input w-full shadow-md" />
          {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">Mencari...</span>}
        </div>
        {open && results.length > 0 && (
          <ul className="mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {results.map((r) => (
              <li key={r.place_id}>
                <button type="button" onClick={() => handleSelect(r)}
                  className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-alt transition-colors">
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

function TempatPklForm({ tempatPkl, onSave, onCancel }) {
  const [nama, setNama] = useState(tempatPkl?.nama || '');
  const [alamat, setAlamat] = useState(tempatPkl?.alamat || '');
  const [lat, setLat] = useState(tempatPkl?.lat != null ? String(tempatPkl.lat) : '');
  const [lon, setLon] = useState(tempatPkl?.lon != null ? String(tempatPkl.lon) : '');
  const [radius, setRadius] = useState(tempatPkl?.radius != null ? String(tempatPkl.radius) : '100');
  const [focusPosition, setFocusPosition] = useState(
    tempatPkl?.lat != null ? [Number(tempatPkl.lat), Number(tempatPkl.lon)] : null
  );

  const mapCenter = focusPosition || DEFAULT_CENTER;
  const markerPos = lat && lon && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))
    ? [Number(lat), Number(lon)] : null;

  const handleMapClick = (newLat, newLon) => {
    setLat(newLat.toFixed(6));
    setLon(newLon.toFixed(6));
    setFocusPosition([newLat, newLon]);
  };

  const handleSearchSelect = (newLat, newLon) => {
    setLat(newLat.toFixed(6));
    setLon(newLon.toFixed(6));
    setFocusPosition([newLat, newLon]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ nama, alamat, lat: Number(lat), lon: Number(lon), radius: Number(radius) || 100 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="field-label">Nama Tempat PKL *</label>
        <input type="text" value={nama} onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: PT Maju Bersama" className="field-input" required />
      </div>
      <div>
        <label className="field-label">Alamat</label>
        <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)}
          placeholder="Alamat lengkap tempat PKL" className="field-input" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Latitude *</label>
          <input type="number" value={lat} onChange={(e) => { setLat(e.target.value); if (e.target.value && lon) setFocusPosition([Number(e.target.value), Number(lon)]); }}
            placeholder="-7.9084" className="field-input" step="0.000001" required />
        </div>
        <div>
          <label className="field-label">Longitude *</label>
          <input type="number" value={lon} onChange={(e) => { setLon(e.target.value); if (lat && e.target.value) setFocusPosition([Number(lat), Number(e.target.value)]); }}
            placeholder="112.1167" className="field-input" step="0.000001" required />
        </div>
      </div>
      <div>
        <label className="field-label">Radius Geofence (meter)</label>
        <input type="number" value={radius} onChange={(e) => setRadius(e.target.value)}
          placeholder="100" className="field-input" min="10" max="5000" />
      </div>
      <div>
        <p className="field-label mb-1">Klik peta untuk set koordinat</p>
        <div className="h-56 rounded-xl overflow-hidden border border-border">
          <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapSearchControl onSelect={handleSearchSelect} />
            <RecenterMap position={focusPosition} />
            <MapClickHandler onMapClick={handleMapClick} />
            {markerPos && (
              <>
                <Marker position={markerPos} />
                <Circle center={markerPos} radius={Number(radius) || 100} color="#3B82F6" fillOpacity={0.15} />
              </>
            )}
          </MapContainer>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Simpan</button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Batal</button>
      </div>
    </form>
  );
}

function TempatPklManagement() {
  const [tempatList, setTempatList] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await API.get('/admin/tempat-pkl', { params: { search } });
        const data = res.data?.data || res.data;
        setTempatList(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setTempatList([]);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [search, refreshKey]);

  const handleSave = async (formData) => {
    try {
      if (editing?.id) {
        await API.put(`/admin/tempat-pkl/${editing.id}`, formData);
        showSuccess('Tempat PKL berhasil diperbarui');
      } else {
        await API.post('/admin/tempat-pkl', formData);
        showSuccess('Tempat PKL berhasil ditambahkan');
      }
      setShowForm(false);
      setEditing(null);
      setRefreshKey((k) => k + 1);
    } catch (err) { showError(getErrorMessage(err)); }
  };

  const handleToggleActive = async (item) => {
    try {
      await API.put(`/admin/tempat-pkl/${item.id}`, { is_active: !item.is_active });
      showSuccess(`Tempat PKL berhasil ${item.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
      setRefreshKey((k) => k + 1);
    } catch (err) { showError(getErrorMessage(err)); }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmAction({
      title: 'Hapus tempat PKL ini?',
      text: 'Hanya bisa dihapus jika tidak ada siswa yang ter-assign.',
      confirmButtonText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await API.delete(`/admin/tempat-pkl/${item.id}`);
      showSuccess('Tempat PKL berhasil dihapus');
      setRefreshKey((k) => k + 1);
    } catch (err) { showError(getErrorMessage(err)); }
  };

  const columns = [
    { key: 'nama', label: 'Nama' },
    { key: 'alamat', label: 'Alamat', render: (row) => row.alamat || '-' },
    {
      key: 'koordinat', label: 'Koordinat',
      render: (row) => `${Number(row.lat).toFixed(4)}, ${Number(row.lon).toFixed(4)}`,
    },
    { key: 'radius', label: 'Radius (m)', render: (row) => `${row.radius}m` },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <span className={`badge ${row.is_active ? 'bg-success/10 text-success' : 'bg-surface-alt text-muted'}`}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    { key: 'student_count', label: 'Siswa', render: (row) => row.student_count ?? 0 },
    {
      key: 'actions', label: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditing(row); setShowForm(true); }} title="Edit" aria-label="Edit" className="text-accent hover:text-accent/70">
            <Pencil size={18} />
          </button>
          <button onClick={() => handleToggleActive(row)} title={row.is_active ? 'Nonaktifkan' : 'Aktifkan'} aria-label={row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            className={row.is_active ? 'text-warning hover:text-warning/70' : 'text-success hover:text-success/70'}>
            {row.is_active ? <PowerOff size={18} /> : <Power size={18} />}
          </button>
          <button onClick={() => handleDelete(row)} title="Hapus" aria-label="Hapus" className="text-danger hover:text-danger/70">
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2">
          <MapPin size={28} className="text-accent" /> Tempat PKL
        </h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          Tambah Tempat PKL
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          {error}
        </div>
      )}

      <FilterPanel>
        <input type="text" placeholder="Cari nama atau alamat..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="field-input flex-1 min-w-[200px]" />
      </FilterPanel>

      {showForm && (
        <Modal title={editing ? 'Edit Tempat PKL' : 'Tambah Tempat PKL'} onClose={() => { setShowForm(false); setEditing(null); }}>
          <TempatPklForm tempatPkl={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </Modal>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="p-6 text-center text-muted">Memuat data...</div>
        ) : (
          <DataTable columns={columns} data={tempatList} emptyMessage="Belum ada tempat PKL terdaftar" />
        )}
      </div>
    </div>
  );
}

export default TempatPklManagement;
