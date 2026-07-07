import { useState, useEffect, useMemo } from 'react';
import { Upload, Pencil, Trash2 } from 'lucide-react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';
import Modal from '../components/admin/Modal';

const IMPORT_MAX_SIZE = 5 * 1024 * 1024;
const IMPORT_VALID_EXTENSIONS = ['.xlsx', '.xls'];

// ── Excel Import Modal ─────────────────────────────────────────────────────────
function MappingImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!IMPORT_VALID_EXTENSIONS.includes(ext)) { setFileError('File harus berformat .xlsx atau .xls'); return; }
    if (f.size > IMPORT_MAX_SIZE) { setFileError('Ukuran file maksimal 5MB'); return; }
    setFileError('');
    setFile(f);
    setPreview(null);
    setImportResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await API.get('/admin/tempat-pkl/mapping/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-mapping-tempat-pkl.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) { showError(getErrorMessage(err)); }
  };

  const handlePreview = async () => {
    if (!file) { showError('Pilih file Excel terlebih dahulu'); return; }
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await API.post('/admin/tempat-pkl/mapping/preview', form);
      setPreview(res.data.data);
    } catch (err) { showError(getErrorMessage(err)); }
  };

  const handleImport = async () => {
    if (!file) return;
    const confirmed = await confirmAction({ title: 'Lanjutkan import mapping?', confirmButtonText: 'Import' });
    if (!confirmed) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await API.post('/admin/tempat-pkl/mapping/import', form);
      setImportResult(res.data.data);
      onImported?.();
    } catch (err) { showError(getErrorMessage(err)); } finally { setImporting(false); }
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={handleDownloadTemplate} className="btn-secondary w-full">
        Download Template Excel
      </button>
      <div>
        <label className="field-label">Upload File Excel</label>
        <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="field-input" />
        {fileError && <p className="text-xs text-danger mt-1">{fileError}</p>}
        {file && <p className="text-xs text-muted mt-1">{file.name}</p>}
      </div>
      {file && !preview && !importResult && (
        <button type="button" onClick={handlePreview} className="btn-primary w-full">Preview</button>
      )}
      {preview && (
        <div>
          <p className="text-sm text-ink font-semibold mb-2">
            Preview: {preview.valid?.length ?? 0} valid, {preview.errors?.length ?? 0} error dari {preview.totalRows ?? 0} baris
          </p>
          {preview.errors?.length > 0 && (
            <ul className="text-xs text-danger space-y-1 mb-3">
              {preview.errors.map((e, i) => <li key={i}>Baris {e.row}: {e.message}</li>)}
            </ul>
          )}
          {preview.valid?.length > 0 && (
            <button type="button" onClick={handleImport} disabled={importing} className="btn-primary w-full">
              {importing ? 'Mengimpor...' : `Import ${preview.valid.length} baris`}
            </button>
          )}
        </div>
      )}
      {importResult && (
        <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-sm text-success">
          Import selesai: {importResult.imported} berhasil
          {importResult.errors?.length > 0 && `, ${importResult.errors.length} gagal`}
        </div>
      )}
      <button type="button" onClick={onClose} className="btn-secondary w-full">Tutup</button>
    </div>
  );
}

// ── Edit Mapping Modal ───────────────────────────────────────────────────────
function EditMappingModal({ siswa, tempatList, onClose, onSaved }) {
  const [tempatId, setTempatId] = useState(siswa.tempatPkl?.id ? String(siswa.tempatPkl.id) : '');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const activeTempat = useMemo(() => tempatList.filter((t) => t.is_active), [tempatList]);

  const filteredTempat = useMemo(() => {
    if (!query.trim()) return activeTempat;
    const q = query.toLowerCase();
    return activeTempat.filter(
      (t) => t.nama?.toLowerCase().includes(q) || t.alamat?.toLowerCase().includes(q)
    );
  }, [activeTempat, query]);

  const selected = activeTempat.find((t) => String(t.id) === tempatId);

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.post('/admin/tempat-pkl/assign', {
        siswa_id: siswa.id,
        tempat_pkl_id: tempatId ? Number(tempatId) : null,
      });
      showSuccess('Assignment berhasil diperbarui');
      onSaved();
      onClose();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {siswa.nama} <span className="text-xs">({siswa.nisn})</span>
      </p>

      <div>
        <label className="field-label">Cari Tempat PKL</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau alamat tempat PKL..."
          className="field-input"
        />
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setTempatId('')}
          className={`w-full text-left px-3 py-2.5 text-sm border-b border-border transition-colors ${
            tempatId === '' ? 'bg-accent-soft text-accent font-semibold' : 'text-muted hover:bg-surface-alt'
          }`}
        >
          — Tidak ada (hapus assignment) —
        </button>

        <div className="max-h-56 overflow-y-auto">
          {filteredTempat.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted text-center">Tidak ada tempat PKL ditemukan</p>
          ) : (
            <table className="min-w-full text-sm text-left">
              <tbody>
                {filteredTempat.map((t) => {
                  const isSelected = String(t.id) === tempatId;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setTempatId(String(t.id))}
                      className={`cursor-pointer border-b border-border last:border-b-0 transition-colors ${
                        isSelected ? 'bg-accent-soft' : 'hover:bg-surface-alt'
                      }`}
                    >
                      <td className="px-3 py-2">
                        <p className={`font-medium ${isSelected ? 'text-accent' : 'text-ink'}`}>{t.nama}</p>
                        {t.alamat && <p className="text-xs text-muted truncate max-w-xs">{t.alamat}</p>}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted whitespace-nowrap text-right">
                        {t.radius}m
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="text-xs text-muted">
        Terpilih: <span className="text-ink font-medium">{selected?.nama || 'Tidak ada'}</span>
      </p>

      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
function MappingSiswa() {
  const [students, setStudents] = useState([]);
  const [tempatList, setTempatList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [search, setSearch] = useState('');
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState('all');
  const [showImport, setShowImport] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [siswaRes, tempatRes, tahunRes] = await Promise.all([
          API.get('/admin/siswa', { params: { limit: 1000 } }),
          API.get('/tempat-pkl'),
          API.get('/admin/tahun-ajaran'),
        ]);
        const siswaData = siswaRes.data?.data || siswaRes.data;
        setStudents(Array.isArray(siswaData) ? siswaData : []);
        const tempatData = tempatRes.data?.data || tempatRes.data;
        setTempatList(Array.isArray(tempatData) ? tempatData : []);
        const tahunData = tahunRes.data?.data || tahunRes.data;
        setTahunAjaranList(Array.isArray(tahunData) ? tahunData : []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (tahunAjaranFilter !== 'all') {
      result = result.filter((s) => String(s.tahunAjaran?.id ?? '') === tahunAjaranFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.nama?.toLowerCase().includes(q) || s.nisn?.includes(q));
    }
    return result;
  }, [students, search, tahunAjaranFilter]);

  // Sort: unassigned first
  const sortedStudents = useMemo(() => [
    ...filteredStudents.filter((s) => !s.tempatPkl),
    ...filteredStudents.filter((s) => s.tempatPkl),
  ], [filteredStudents]);

  // Breakdown of mapped/unmapped students per tahun pelajaran
  const mappingStatsByTahun = useMemo(() => {
    const groups = new Map();
    for (const s of students) {
      const key = s.tahunAjaran?.id ?? 'tanpa-tahun';
      const label = s.tahunAjaran?.nama || 'Tanpa Tahun Pelajaran';
      if (!groups.has(key)) {
        groups.set(key, { label, total: 0, mapped: 0, unmapped: 0 });
      }
      const g = groups.get(key);
      g.total += 1;
      if (s.tempatPkl) g.mapped += 1;
      else g.unmapped += 1;
    }
    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [students]);

  const handleUnassign = async (siswa) => {
    const confirmed = await confirmAction({
      title: `Hapus assignment ${siswa.nama}?`,
      text: 'Siswa tidak akan ter-assign ke tempat PKL manapun.',
      confirmButtonText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await API.post('/admin/tempat-pkl/assign', { siswa_id: siswa.id, tempat_pkl_id: null });
      showSuccess('Assignment berhasil dihapus');
      setRefreshKey((k) => k + 1);
    } catch (err) { showError(getErrorMessage(err)); }
  };

  const columns = [
    { key: 'nisn', label: 'NISN' },
    { key: 'nama', label: 'Nama' },
    { key: 'kelas', label: 'Kelas', render: (row) => row.kelas || '-' },
    {
      key: 'tempat_pkl', label: 'Tempat PKL',
      render: (row) => {
        if (!row.tempatPkl) return <span className="text-muted italic">Belum di-assign</span>;
        const { nama, lat, lon } = row.tempatPkl;
        if (lat == null || lon == null) {
          return <span className="text-success font-medium">{nama}</span>;
        }
        return (
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-success font-medium underline hover:text-success/70"
          >
            {nama}
          </a>
        );
      },
    },
    {
      key: 'actions', label: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => setEditingSiswa(row)} title="Edit Mapping" aria-label="Edit Mapping"
            className="text-accent hover:text-accent/70">
            <Pencil size={18} />
          </button>
          {row.tempatPkl && (
            <button onClick={() => handleUnassign(row)} title="Hapus Assignment" aria-label="Hapus Assignment"
              className="text-danger hover:text-danger/70">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Mapping Siswa → Tempat PKL</h1>
        <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
          <Upload size={16} /> Import Excel
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">{error}</div>
      )}

      {/* Mapping status breakdown per tahun pelajaran */}
      {!loading && mappingStatsByTahun.length > 0 && (
        <div className="panel p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-bold text-ink mb-4">Status Mapping per Tahun Pelajaran</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border border-border rounded-xl">
              <thead className="bg-surface-alt">
                <tr>
                  <th className="px-3 py-2 text-ink">Tahun Pelajaran</th>
                  <th className="px-3 py-2 text-ink">Total Siswa</th>
                  <th className="px-3 py-2 text-ink">Sudah Termapping</th>
                  <th className="px-3 py-2 text-ink">Belum Termapping</th>
                </tr>
              </thead>
              <tbody>
                {mappingStatsByTahun.map((g) => (
                  <tr key={g.label} className="border-t border-border">
                    <td className="px-3 py-2 text-ink font-medium">{g.label}</td>
                    <td className="px-3 py-2 text-ink">{g.total}</td>
                    <td className="px-3 py-2 text-success font-semibold">{g.mapped}</td>
                    <td className="px-3 py-2 text-danger font-semibold">{g.unmapped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showImport && (
        <Modal title="Import Mapping dari Excel" onClose={() => setShowImport(false)}>
          <MappingImportModal onClose={() => setShowImport(false)} onImported={() => setRefreshKey((k) => k + 1)} />
        </Modal>
      )}

      {editingSiswa && (
        <Modal title="Edit Mapping Tempat PKL" onClose={() => setEditingSiswa(null)}>
          <EditMappingModal
            siswa={editingSiswa}
            tempatList={tempatList}
            onClose={() => setEditingSiswa(null)}
            onSaved={() => setRefreshKey((k) => k + 1)}
          />
        </Modal>
      )}

      {/* Table */}
      <FilterPanel>
        <div>
          <label className="field-label">Tahun Pelajaran</label>
          <select value={tahunAjaranFilter} onChange={(e) => setTahunAjaranFilter(e.target.value)}
            className="field-input min-w-[200px]">
            <option value="all">Semua Tahun Pelajaran</option>
            {tahunAjaranList.map((t) => (
              <option key={t.id} value={String(t.id)}>{t.nama}{t.is_active ? ' (aktif)' : ''}</option>
            ))}
          </select>
        </div>
        <input type="text" placeholder="Cari nama atau NISN..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="field-input flex-1 min-w-[200px]" />
      </FilterPanel>

      <div className="mt-4">
        {loading ? (
          <div className="p-6 text-center text-muted">Memuat data...</div>
        ) : (
          <DataTable columns={columns} data={sortedStudents} emptyMessage="Tidak ada siswa ditemukan" />
        )}
      </div>
    </div>
  );
}

export default MappingSiswa;
