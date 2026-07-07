import { useState, useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import API from '../services/api';
import { getErrorMessage } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';
import StatsCard from '../components/admin/StatsCard';
import Modal from '../components/admin/Modal';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5.5" fill="#fff"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

const TEMPAT_PKL_ICON = pinIcon('#2563EB');
const PRESENSI_ICON = pinIcon('#DC2626');

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 2) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

function JarakMapModal({ row, onClose }) {
  const presensiPoint = [Number(row.lat_masuk), Number(row.lon_masuk)];
  const tempatPoint = [Number(row.tempat_pkl.lat), Number(row.tempat_pkl.lon)];
  const points = [presensiPoint, tempatPoint];
  const jarakLabel = row.jarak_meter >= 1000
    ? `${(row.jarak_meter / 1000).toFixed(2)} km`
    : `${row.jarak_meter} m`;

  return (
    <Modal title={`Jarak Presensi - ${row.nama}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Jarak garis lurus (Haversine) antara lokasi check-in dan{' '}
          <span className="font-medium text-ink">{row.tempat_pkl.nama}</span>:{' '}
          <span className={row.jarak_meter > 100 ? 'text-danger font-semibold' : 'text-success font-semibold'}>
            {jarakLabel}
          </span>
        </p>
        <div className="h-80 w-full overflow-hidden rounded border border-border">
          <MapContainer center={presensiPoint} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={presensiPoint} icon={PRESENSI_ICON}>
              <Popup>Lokasi presensi {row.nama}</Popup>
            </Marker>
            <Marker position={tempatPoint} icon={TEMPAT_PKL_ICON}>
              <Popup>Tempat PKL: {row.tempat_pkl.nama}</Popup>
            </Marker>
            <Polyline positions={points} pathOptions={{ color: '#EF4444', dashArray: '6 6', weight: 3 }} />
            <FitBounds points={points} />
          </MapContainer>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border border-white" style={{ backgroundColor: '#DC2626' }} />
            Lokasi presensi siswa
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border border-white" style={{ backgroundColor: '#2563EB' }} />
            Tempat PKL
          </span>
        </div>
        <p className="text-xs text-muted">
          Garis putus-putus merah menunjukkan jarak lurus, bukan rute jalan sebenarnya.
        </p>
      </div>
    </Modal>
  );
}

function todayISODate() {
  return new Date().toISOString().split('T')[0];
}

const STATUS_BADGE = {
  hadir: 'bg-success/10 text-success',
  sakit: 'bg-warning/10 text-warning',
  izin: 'bg-accent/10 text-accent',
  alpha: 'bg-danger/10 text-danger',
};

function PresensiHarian() {
  const [tanggal, setTanggal] = useState(todayISODate());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kelasFilter, setKelasFilter] = useState('all');
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapRow, setMapRow] = useState(null);

  useEffect(() => {
    const fetchPresensi = async () => {
      setLoading(true);
      try {
        const response = await API.get('/guru/presensi', { params: { tanggal } });
        setSiswa(response.data?.data?.siswa || []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setSiswa([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPresensi();
  }, [tanggal]);

  const kelasOptions = useMemo(
    () => Array.from(new Set(siswa.map((s) => s.kelas).filter(Boolean))).sort(),
    [siswa]
  );

  const filteredSiswa = useMemo(
    () =>
      siswa.filter((s) => {
        const matchSearch =
          (s.nama || '').toLowerCase().includes(search.toLowerCase()) ||
          (s.nisn || '').includes(search);
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'sudah' && !!s.status) ||
          (statusFilter === 'belum' && !s.status);
        const matchKelas = kelasFilter === 'all' || s.kelas === kelasFilter;
        return matchSearch && matchStatus && matchKelas;
      }),
    [siswa, search, statusFilter, kelasFilter]
  );

  const hadirCount = siswa.filter((s) => s.status === 'hadir').length;
  const belumCount = siswa.filter((s) => !s.status).length;
  const izinSakitCount = siswa.filter((s) => s.status === 'izin' || s.status === 'sakit').length;
  const alphaCount = siswa.filter((s) => s.status === 'alpha').length;

  const columns = [
    { key: 'nisn', label: 'NISN' },
    { key: 'nama', label: 'Nama' },
    { key: 'kelas', label: 'Kelas' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`badge ${STATUS_BADGE[row.status] || 'bg-surface-alt text-muted'}`}>
          {row.status || 'belum presensi'}
        </span>
      ),
    },
    { key: 'jam_masuk', label: 'Jam Masuk', render: (row) => row.jam_masuk || '-' },
    { key: 'jam_keluar', label: 'Jam Keluar', render: (row) => row.jam_keluar || '-' },
    {
      key: 'lokasi',
      label: 'Lokasi Presensi',
      render: (row) =>
        row.lat_masuk != null && row.lon_masuk != null ? (
          <a
            href={`https://www.openstreetmap.org/?mlat=${row.lat_masuk}&mlon=${row.lon_masuk}#map=17/${row.lat_masuk}/${row.lon_masuk}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline"
            title="Lihat di peta"
          >
            <MapPin size={14} />
            <span>
              {Number(row.lat_masuk).toFixed(6)}, {Number(row.lon_masuk).toFixed(6)}
            </span>
          </a>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      key: 'jarak',
      label: 'Jarak ke Tempat PKL',
      render: (row) => {
        if (row.jarak_meter == null) {
          return <span className="text-muted">-</span>;
        }
        const jarak = row.jarak_meter;
        const label = jarak >= 1000 ? `${(jarak / 1000).toFixed(2)} km` : `${jarak} m`;
        const isFar = jarak > 100;
        const canShowMap =
          row.lat_masuk != null && row.lon_masuk != null && row.tempat_pkl?.lat != null && row.tempat_pkl?.lon != null;
        if (!canShowMap) {
          return (
            <span className={isFar ? 'text-danger font-medium' : 'text-success font-medium'}>{label}</span>
          );
        }
        return (
          <button
            type="button"
            onClick={() => setMapRow(row)}
            className={`font-medium underline decoration-dotted hover:opacity-80 ${isFar ? 'text-danger' : 'text-success'}`}
            title={`Lihat jarak lurus ke ${row.tempat_pkl.nama}`}
          >
            {label}
          </button>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <p className="kicker mb-1">Pengawasan</p>
        <h1 className="text-2xl font-bold text-ink">Presensi Harian</h1>
      </div>

      {error && (
        <div className="panel p-4 text-sm text-danger">Data presensi belum tersedia: {error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Hadir" value={hadirCount} />
        <StatsCard label="Izin/Sakit" value={izinSakitCount} />
        <StatsCard label="Alpha" value={alphaCount} />
        <StatsCard label="Belum Presensi" value={belumCount} />
      </div>

      <FilterPanel>
        <div>
          <label className="field-label" htmlFor="tanggal">
            Tanggal
          </label>
          <input
            id="tanggal"
            type="date"
            value={tanggal}
            max={todayISODate()}
            onChange={(e) => setTanggal(e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="statusFilter">
            Status Presensi
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field-input"
          >
            <option value="all">Semua</option>
            <option value="sudah">Sudah Presensi</option>
            <option value="belum">Belum Presensi</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="kelasFilter">
            Kelas
          </label>
          <select
            id="kelasFilter"
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="field-input"
          >
            <option value="all">Semua Kelas</option>
            {kelasOptions.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="field-label" htmlFor="search">
            Cari
          </label>
          <input
            id="search"
            type="text"
            placeholder="Cari nama atau NISN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input w-full"
          />
        </div>
      </FilterPanel>

      {loading ? (
        <p className="text-muted">Memuat data presensi...</p>
      ) : (
        <DataTable columns={columns} data={filteredSiswa} emptyMessage="Tidak ada data siswa." />
      )}

      {mapRow && <JarakMapModal row={mapRow} onClose={() => setMapRow(null)} />}
    </div>
  );
}

export default PresensiHarian;
