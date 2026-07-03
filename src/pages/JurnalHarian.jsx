import { useState, useEffect, useMemo } from 'react';
import { FileText, ImageOff, X, User2, MapPin, HardDrive } from 'lucide-react';
import API from '../services/api';
import { getErrorMessage } from '../services/toastService';
import StatsCard from '../components/admin/StatsCard';

const FILE_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(
  /\/api\/?$/,
  ''
);

function resolvePhoto(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${FILE_BASE_URL}${path}`;
}

function todayISODate() {
  return new Date().toISOString().split('T')[0];
}

function formatFileSize(bytes) {
  if (bytes == null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

const STATUS_META = {
  pending: { label: 'Menunggu Review', className: 'bg-warning/10 text-warning' },
  approved: { label: 'Disetujui', className: 'bg-success/10 text-success' },
  rejected: { label: 'Ditolak', className: 'bg-danger/10 text-danger' },
  under_revision: { label: 'Revisi', className: 'bg-accent/10 text-accent' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || '-', className: 'bg-surface-alt text-muted' };
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

function JurnalHarian() {
  const [tanggal, setTanggal] = useState(todayISODate());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kelasFilter, setKelasFilter] = useState('all');
  const [jurusanFilter, setJurusanFilter] = useState('all');
  const [allDates, setAllDates] = useState(false);
  const [jurnals, setJurnals] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0, approved: 0, rejected: 0, under_revision: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [jurusanOptions, setJurusanOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [siswaRes, jurusanRes] = await Promise.all([
          API.get('/admin/siswa', { params: { limit: 1000 } }),
          API.get('/jurusan'),
        ]);
        const siswaList = siswaRes.data?.data || [];
        const uniqueKelas = Array.from(
          new Set(siswaList.map((s) => s.kelas).filter(Boolean))
        ).sort();
        setKelasOptions(uniqueKelas);
        const jurusanList = jurusanRes.data?.data || jurusanRes.data || [];
        setJurusanOptions(Array.isArray(jurusanList) ? jurusanList : []);
      } catch {
        setKelasOptions([]);
        setJurusanOptions([]);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchJurnal = async () => {
      setLoading(true);
      try {
        const response = await API.get('/admin/jurnal', {
          params: {
            tanggal: allDates ? undefined : tanggal,
            search: search || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            kelas: kelasFilter === 'all' ? undefined : kelasFilter,
            jurusan_id: jurusanFilter === 'all' ? undefined : jurusanFilter,
            limit: 100,
          },
        });
        setJurnals(response.data?.data || []);
        setTotal(response.data?.total || 0);
        setStatusCounts(
          response.data?.statusCounts || { pending: 0, approved: 0, rejected: 0, under_revision: 0 }
        );
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setJurnals([]);
        setTotal(0);
        setStatusCounts({ pending: 0, approved: 0, rejected: 0, under_revision: 0 });
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchJurnal, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [tanggal, search, statusFilter, kelasFilter, jurusanFilter, allDates]);

  const stats = useMemo(
    () => ({
      total,
      pending: statusCounts.pending,
      approved: statusCounts.approved,
      rejected: statusCounts.rejected + statusCounts.under_revision,
    }),
    [total, statusCounts]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <p className="kicker mb-1">Pengawasan</p>
        <h1 className="text-2xl font-bold text-ink">Jurnal Harian Siswa</h1>
        <p className="text-sm text-muted mt-1">
          Lihat jurnal yang diunggah siswa berdasarkan tanggal.
        </p>
      </div>

      {error && (
        <div className="panel p-4 text-sm text-danger">Data jurnal belum tersedia: {error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Total Jurnal" value={stats.total} />
        <StatsCard label="Menunggu Review" value={stats.pending} />
        <StatsCard label="Disetujui" value={stats.approved} />
        <StatsCard label="Ditolak/Revisi" value={stats.rejected} />
      </div>

      <div className="panel p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              disabled={allDates}
              className="field-input w-full disabled:opacity-50"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="statusFilter">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="field-input w-full"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Review</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="under_revision">Revisi</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="kelasFilter">
              Kelas
            </label>
            <select
              id="kelasFilter"
              value={kelasFilter}
              onChange={(e) => {
                const value = e.target.value;
                setKelasFilter(value);
                if (value !== 'all') setAllDates(true);
              }}
              className="field-input w-full"
            >
              <option value="all">Semua Kelas</option>
              {kelasOptions.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="jurusanFilter">
              Jurusan
            </label>
            <select
              id="jurusanFilter"
              value={jurusanFilter}
              onChange={(e) => {
                const value = e.target.value;
                setJurusanFilter(value);
                if (value !== 'all') setAllDates(true);
              }}
              className="field-input w-full"
            >
              <option value="all">Semua Jurusan</option>
              {jurusanOptions.map((jurusan) => (
                <option key={jurusan.id} value={jurusan.id}>
                  {jurusan.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="field-label" htmlFor="search">
              Cari Siswa
            </label>
            <input
              id="search"
              type="text"
              placeholder="Cari nama atau NISN..."
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                if (value.trim()) setAllDates(true);
              }}
              className="field-input w-full"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-t border-border pt-3">
          <label className="flex items-center gap-2 text-sm text-muted shrink-0">
            <input
              type="checkbox"
              checked={allDates}
              onChange={(e) => setAllDates(e.target.checked)}
            />
            Tampilkan semua tanggal
          </label>
          {(search.trim() || kelasFilter !== 'all' || jurusanFilter !== 'all') && (
            <p className="text-xs text-muted">
              Filter pencarian/kelas/jurusan berlaku di semua tanggal. Nonaktifkan opsi di
              samping untuk membatasi hasil ke tanggal tertentu.
            </p>
          )}
        </div>
      </div>

      {!loading && jurnals.length > 0 && total > jurnals.length && (
        <p className="text-xs text-muted">
          Menampilkan {jurnals.length} dari {total} jurnal yang cocok dengan filter ini.
          Persempit tanggal atau filter lain untuk melihat sisanya.
        </p>
      )}

      {loading ? (
        <p className="text-muted">Memuat data jurnal...</p>
      ) : jurnals.length === 0 ? (
        <div className="panel p-10 flex flex-col items-center justify-center gap-2 text-center">
          <FileText size={32} className="text-muted" />
          <p className="text-ink font-medium">Tidak ada jurnal pada tanggal ini</p>
          <p className="text-sm text-muted">Coba pilih tanggal atau filter lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jurnals.map((jurnal) => {
            const photo = resolvePhoto(jurnal.foto_path);
            const fotoSize = formatFileSize(jurnal.foto_size_bytes);
            return (
              <button
                key={jurnal.id}
                onClick={() => setSelected(jurnal)}
                className="panel text-left p-0 overflow-hidden flex flex-col hover:border-accent transition-colors duration-150"
              >
                <div className="relative aspect-video bg-surface-alt flex items-center justify-center overflow-hidden">
                  {photo ? (
                    <img src={photo} alt="Foto jurnal" className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff size={28} className="text-muted" />
                  )}
                  {fotoSize && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      <HardDrive size={11} />
                      {fotoSize}
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink truncate">
                      <User2 size={14} className="text-muted shrink-0" />
                      {jurnal.Siswa?.nama || '-'}
                    </span>
                    <StatusBadge status={jurnal.status} />
                  </div>
                  <p className="text-xs text-muted">
                    {jurnal.Siswa?.nisn} &bull; {jurnal.Siswa?.kelas || '-'}
                    {jurnal.Siswa?.jurusan?.nama ? ` • ${jurnal.Siswa.jurusan.nama}` : ''}
                  </p>
                  {jurnal.Siswa?.tempatPkl?.nama && (
                    <p className="flex items-center gap-1 text-xs text-muted truncate">
                      <MapPin size={12} className="shrink-0" />
                      {jurnal.Siswa.tempatPkl.nama}
                    </p>
                  )}
                  <p className="text-sm text-muted line-clamp-2">{jurnal.deskripsi}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelected(null)}
        >
          <div
            className="panel w-full max-w-lg max-h-[90vh] overflow-y-auto p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-ink">Detail Jurnal</h3>
              <button
                onClick={() => setSelected(null)}
                title="Tutup"
                aria-label="Tutup"
                className="text-muted hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative bg-surface-alt flex items-center justify-center max-h-80 overflow-hidden">
              {resolvePhoto(selected.foto_path) ? (
                <img
                  src={resolvePhoto(selected.foto_path)}
                  alt="Foto jurnal"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="p-12 text-muted flex flex-col items-center gap-2">
                  <ImageOff size={28} />
                  <span className="text-sm">Tidak ada foto</span>
                </div>
              )}
              {formatFileSize(selected.foto_size_bytes) && (
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">
                  <HardDrive size={12} />
                  {formatFileSize(selected.foto_size_bytes)}
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{selected.Siswa?.nama || '-'}</p>
                  <p className="text-xs text-muted">
                    {selected.Siswa?.nisn} &bull; {selected.Siswa?.kelas || '-'}
                    {selected.Siswa?.jurusan?.nama ? ` • ${selected.Siswa.jurusan.nama}` : ''}
                    {selected.Siswa?.guruPembimbing?.nama
                      ? ` • Pembimbing: ${selected.Siswa.guruPembimbing.nama}`
                      : ''}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <p className="text-sm text-muted">{formatDate(selected.tanggal)}</p>

              {selected.Siswa?.tempatPkl?.nama && (
                <div>
                  <p className="field-label mb-1">Tempat PKL</p>
                  <p className="flex items-start gap-1.5 text-sm text-ink">
                    <MapPin size={14} className="text-muted shrink-0 mt-0.5" />
                    <span>
                      {selected.Siswa.tempatPkl.nama}
                      {selected.Siswa.tempatPkl.alamat ? ` — ${selected.Siswa.tempatPkl.alamat}` : ''}
                    </span>
                  </p>
                </div>
              )}

              <div>
                <p className="field-label mb-1">Deskripsi Kegiatan</p>
                <p className="text-sm text-ink whitespace-pre-wrap">{selected.deskripsi}</p>
              </div>

              {selected.guru_feedback && (
                <div>
                  <p className="field-label mb-1">Catatan Guru</p>
                  <p className="text-sm text-ink whitespace-pre-wrap">{selected.guru_feedback}</p>
                </div>
              )}

              {selected.rejection_reason && (
                <div>
                  <p className="field-label mb-1">Alasan Ditolak</p>
                  <p className="text-sm text-danger whitespace-pre-wrap">
                    {selected.rejection_reason}
                  </p>
                </div>
              )}

              {selected.reviewer?.nama && (
                <p className="text-xs text-muted">Direview oleh: {selected.reviewer.nama}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JurnalHarian;
