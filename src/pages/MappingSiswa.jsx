import { useState, useEffect, useMemo } from 'react';
import { Upload } from 'lucide-react';
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

// ── Main Page ──────────────────────────────────────────────────────────────────
function MappingSiswa() {
  const [students, setStudents] = useState([]);
  const [tempatList, setTempatList] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [selectedTempatId, setSelectedTempatId] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [siswaRes, tempatRes] = await Promise.all([
          API.get('/admin/siswa', { params: { limit: 200 } }),
          API.get('/tempat-pkl'),
        ]);
        const siswaData = siswaRes.data?.data || siswaRes.data;
        setStudents(Array.isArray(siswaData) ? siswaData : []);
        const tempatData = tempatRes.data?.data || tempatRes.data;
        setTempatList(Array.isArray(tempatData) ? tempatData : []);
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
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter((s) => s.nama?.toLowerCase().includes(q) || s.nisn?.includes(q));
  }, [students, search]);

  // Sort: unassigned first
  const sortedStudents = useMemo(() => [
    ...filteredStudents.filter((s) => !s.tempatPkl),
    ...filteredStudents.filter((s) => s.tempatPkl),
  ], [filteredStudents]);

  const handleAssign = async () => {
    if (!selectedSiswaId) { showError('Pilih siswa terlebih dahulu'); return; }
    try {
      await API.post('/admin/tempat-pkl/assign', {
        siswa_id: Number(selectedSiswaId),
        tempat_pkl_id: selectedTempatId ? Number(selectedTempatId) : null,
      });
      showSuccess('Assignment berhasil diperbarui');
      setSelectedSiswaId('');
      setSelectedTempatId('');
      setRefreshKey((k) => k + 1);
    } catch (err) { showError(getErrorMessage(err)); }
  };

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
      render: (row) => row.tempatPkl
        ? <span className="text-success font-medium">{row.tempatPkl.nama}</span>
        : <span className="text-muted italic">Belum di-assign</span>,
    },
    {
      key: 'actions', label: 'Aksi',
      render: (row) => row.tempatPkl ? (
        <button onClick={() => handleUnassign(row)} className="text-xs text-danger hover:underline">
          Hapus Assignment
        </button>
      ) : null,
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

      {/* Manual assign panel */}
      <div className="panel p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-bold text-ink mb-4">Assign Manual</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="field-label">Pilih Siswa</label>
            <select value={selectedSiswaId} onChange={(e) => setSelectedSiswaId(e.target.value)} className="field-input">
              <option value="">-- Pilih Siswa --</option>
              {students.filter((s) => !s.tempatPkl).map((s) => (
                <option key={s.id} value={s.id}>{s.nama} ({s.nisn})</option>
              ))}
              {students.filter((s) => s.tempatPkl).length > 0 && (
                <optgroup label="Sudah ter-assign">
                  {students.filter((s) => s.tempatPkl).map((s) => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.nisn}) — {s.tempatPkl.nama}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="field-label">Pilih Tempat PKL</label>
            <select value={selectedTempatId} onChange={(e) => setSelectedTempatId(e.target.value)} className="field-input">
              <option value="">-- Hapus Assignment --</option>
              {tempatList.filter((t) => t.is_active).map((t) => (
                <option key={t.id} value={t.id}>{t.nama}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAssign} className="btn-primary h-10">Assign</button>
        </div>
      </div>

      {showImport && (
        <Modal title="Import Mapping dari Excel" onClose={() => setShowImport(false)}>
          <MappingImportModal onClose={() => setShowImport(false)} onImported={() => setRefreshKey((k) => k + 1)} />
        </Modal>
      )}

      {/* Table */}
      <FilterPanel>
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
