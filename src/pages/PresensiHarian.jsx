import { useState, useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import API from '../services/api';
import { getErrorMessage } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';
import StatsCard from '../components/admin/StatsCard';

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
    </div>
  );
}

export default PresensiHarian;
