import { useState, useEffect } from 'react';
import { Upload, Pencil, Trash2 } from 'lucide-react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';
import Modal from '../components/admin/Modal';

const IMPORT_MAX_SIZE = 5 * 1024 * 1024;
const IMPORT_VALID_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/siswa', {
          params: {
            search,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            page: currentPage,
            limit: 10,
          },
        });
        const payload = response.data?.data || response.data;
        setStudents(Array.isArray(payload) ? payload : []);
        setTotalPages(response.data?.totalPages || response.data?.pages || 1);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        setStudents([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [search, statusFilter, currentPage, refreshKey]);

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Hapus data siswa ini?',
      text: 'Data yang dihapus dapat dipulihkan melalui menu Trash.',
      confirmButtonText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await API.delete(`/admin/siswa/${id}`);
      showSuccess('Siswa berhasil dihapus');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingStudent?.id) {
        await API.put(`/admin/siswa/${editingStudent.id}`, formData);
        showSuccess('Data siswa berhasil diperbarui');
      } else {
        await API.post('/admin/siswa', formData);
        showSuccess('Siswa berhasil ditambahkan');
      }
      setShowForm(false);
      setEditingStudent(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'nisn', label: 'NISN' },
    { key: 'nama', label: 'Nama' },
    { key: 'kelas', label: 'Kelas' },
    { key: 'tempat_pkl', label: 'Tempat PKL', render: (row) => row.tempat_pkl || '-' },
    {
      key: 'guru_pembimbing',
      label: 'Guru Pembimbing',
      render: (row) => row.guruPembimbing?.nama || '-',
    },
    {
      key: 'tahun_ajaran',
      label: 'Tahun Pelajaran',
      render: (row) => row.tahunAjaran?.nama || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const active = row.User?.is_active ?? row.is_active ?? true;
        return (
          <span
            className={`badge ${
              active ? 'bg-success/10 text-success' : 'bg-surface-alt text-muted'
            }`}
          >
            {active ? 'active' : 'inactive'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingStudent(row);
              setShowForm(true);
            }}
            title="Edit"
            aria-label="Edit"
            className="text-accent hover:text-accent/70"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            title="Hapus"
            aria-label="Hapus"
            className="text-danger hover:text-danger/70"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Data Siswa</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={16} />
            Import Excel
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            {showForm ? 'Batal' : 'Tambah Siswa'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          Data siswa belum tersedia: {error}
        </div>
      )}

      {/* Filters */}
      <FilterPanel>
        <input
          type="text"
          placeholder="Cari nama atau NISN..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="field-input flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="field-input w-auto"
        >
          <option value="all">Semua Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterPanel>

      {/* Form */}
      {showForm && (
        <Modal
          title={editingStudent ? 'Edit Siswa' : 'Tambah Siswa'}
          onClose={() => {
            setShowForm(false);
            setEditingStudent(null);
          }}
        >
          <StudentForm
            student={editingStudent}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingStudent(null);
            }}
          />
        </Modal>
      )}

      {showImport && (
        <Modal title="Import Siswa dari Excel" onClose={() => setShowImport(false)}>
          <StudentImportModal
            onClose={() => setShowImport(false)}
            onImported={() => setRefreshKey((k) => k + 1)}
          />
        </Modal>
      )}

      {/* Student Table */}
      <div className="mt-6">
        {loading ? (
          <div className="p-6 text-center text-muted">Memuat data siswa...</div>
        ) : (
          <DataTable columns={columns} data={students} emptyMessage="Tidak ada siswa ditemukan" />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  // Build the page window: [1] [...] [cur-delta .. cur+delta] [...] [last]
  // delta=2 on md+, delta=1 on sm (controlled via two separate renders)
  function getPages(delta) {
    const pages = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  }

  const btnBase =
    'h-9 min-w-[2.25rem] px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-colors select-none';
  const btnPage = `${btnBase} bg-surface-alt text-ink hover:bg-border`;
  const btnActive = `${btnBase} bg-accent text-white pointer-events-none`;
  const btnEllipsis = `${btnBase} text-muted pointer-events-none`;
  const btnNav = `${btnBase} bg-surface border border-border text-ink hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed`;

  const renderPages = (pages) =>
    pages.map((p, i) => {
      if (p === '...') return <span key={`ellipsis-${i}`} className={btnEllipsis}>…</span>;
      return (
        <button key={p} onClick={() => onPageChange(p)} className={p === currentPage ? btnActive : btnPage}>
          {p}
        </button>
      );
    });

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      {/* Mobile: delta=1 */}
      <div className="flex items-center gap-1 sm:hidden">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={btnNav}>
          ‹ Prev
        </button>
        {renderPages(getPages(1))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={btnNav}>
          Next ›
        </button>
      </div>
      {/* Desktop: delta=2 */}
      <div className="hidden sm:flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={btnNav}>
          ‹ Prev
        </button>
        {renderPages(getPages(2))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={btnNav}>
          Next ›
        </button>
      </div>
      <p className="text-xs text-muted">
        Halaman {currentPage} dari {totalPages}
      </p>
    </div>
  );
}

function StudentForm({ student, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    student || {
      nisn: '',
      nama: '',
      kelas: '',
      tempat_pkl: '',
      guru_id: '',
      tahun_ajaran_id: '',
    }
  );
  const [guruOptions, setGuruOptions] = useState([]);
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([]);

  useEffect(() => {
    const fetchGuru = async () => {
      try {
        const response = await API.get('/admin/guru', { params: { limit: 100 } });
        const data = response.data?.data || response.data;
        setGuruOptions(Array.isArray(data) ? data : []);
      } catch {
        setGuruOptions([]);
      }
    };

    const fetchTahunAjaran = async () => {
      try {
        const response = await API.get('/admin/tahun-ajaran');
        const data = response.data?.data || response.data;
        setTahunAjaranOptions(Array.isArray(data) ? data : []);
      } catch {
        setTahunAjaranOptions([]);
      }
    };

    fetchGuru();
    fetchTahunAjaran();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">NISN</label>
          <input
            type="text"
            placeholder="Contoh: 0051234567"
            value={formData.nisn}
            onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
            className="field-input"
            required
          />
        </div>
        <div>
          <label className="field-label">Nama Lengkap</label>
          <input
            type="text"
            placeholder="Contoh: Ahmad Fauzi"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            className="field-input"
            required
          />
        </div>
        <div>
          <label className="field-label">Kelas</label>
          <input
            type="text"
            placeholder="Contoh: XII RPL 1"
            value={formData.kelas}
            onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
            className="field-input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Tempat PKL</label>
          <input
            type="text"
            placeholder="Contoh: PT Maju Bersama"
            value={formData.tempat_pkl}
            onChange={(e) => setFormData({ ...formData, tempat_pkl: e.target.value })}
            className="field-input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Guru Pembimbing</label>
          <select
            value={formData.guru_id || ''}
            onChange={(e) => setFormData({ ...formData, guru_id: e.target.value })}
            className="field-input"
          >
            <option value="">Belum ditugaskan</option>
            {guruOptions.map((guru) => (
              <option key={guru.id} value={guru.id}>
                {guru.nama} ({guru.niy})
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Tahun Pelajaran</label>
          <select
            value={formData.tahun_ajaran_id || ''}
            onChange={(e) => setFormData({ ...formData, tahun_ajaran_id: e.target.value })}
            className="field-input"
          >
            <option value="">Belum diatur</option>
            {tahunAjaranOptions.map((tahun) => (
              <option key={tahun.id} value={tahun.id}>
                {tahun.nama} {tahun.is_active ? '(aktif)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!student && (
        <p className="mt-4 text-sm text-muted">
          Password awal akun siswa akan otomatis diatur sama dengan NISN. Informasikan NISN
          sebagai username dan password awal kepada siswa agar dapat login.
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <button type="submit" className="btn-primary">
          Simpan
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
      </div>
    </form>
  );
}

function StudentImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const validateFile = (selectedFile) => {
    if (selectedFile.size > IMPORT_MAX_SIZE) {
      showError('File terlalu besar (maksimal 5MB)');
      return false;
    }

    const hasValidExtension = IMPORT_VALID_EXTENSIONS.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      showError('Format file tidak valid. Gunakan Excel (.xlsx, .xls) atau CSV');
      return false;
    }

    return true;
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!validateFile(selectedFile)) {
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setPreview(null);
    setResult(null);
  };

  const handlePreview = async () => {
    if (!file) return;

    setPreviewing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await API.post('/admin/siswa/import/preview', formData);
      setPreview(response.data?.data || response.data);
      setResult(null);
    } catch (err) {
      showError(getErrorMessage(err));
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await API.post('/admin/siswa/import', formData);
      const data = response.data?.data || response.data;
      setResult(data);
      showSuccess(`Berhasil mengimpor ${data.importedCount ?? 0} siswa`);
      setFile(null);
      setPreview(null);
      onImported();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await API.get('/admin/siswa/import/template', { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template-siswa.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="rounded-xl border border-accent/20 bg-accent-soft p-4 mb-4">
        <p className="text-sm text-ink mb-2">
          Gunakan template berikut agar format kolom sesuai (NISN, Nama, Kelas, Tempat PKL,
          Lat_PKL*, Lon_PKL*). Kolom Lat_PKL dan Lon_PKL bersifat opsional. Password awal akun
          siswa otomatis diatur sama dengan NISN.
        </p>
        <button onClick={downloadTemplate} className="text-accent hover:underline font-bold text-sm">
          Download Template
        </button>
      </div>

      <label className="field-label">Pilih File Excel</label>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="w-full mb-4 text-sm text-muted"
      />

      {file && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button onClick={handlePreview} disabled={previewing} className="btn-secondary flex-1">
            {previewing ? 'Memuat preview...' : 'Preview Data'}
          </button>
          <button onClick={handleImport} disabled={importing} className="btn-primary flex-1">
            {importing ? 'Mengimpor...' : 'Import Data'}
          </button>
        </div>
      )}

      {preview && (
        <div className="mb-4">
          <p className="text-sm text-muted mb-2">
            Total baris: {preview.totalRows} | Valid: {preview.validCount} | Error:{' '}
            {preview.errorCount}
          </p>

          {preview.valid?.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full text-sm text-left border border-border rounded-xl">
                <thead className="bg-surface-alt">
                  <tr>
                    <th className="px-3 py-2 text-ink">NISN</th>
                    <th className="px-3 py-2 text-ink">Nama</th>
                    <th className="px-3 py-2 text-ink">Kelas</th>
                    <th className="px-3 py-2 text-ink">Tempat PKL</th>
                    <th className="px-3 py-2 text-ink">Lat PKL</th>
                    <th className="px-3 py-2 text-ink">Lon PKL</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.valid.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="px-3 py-2 text-ink">{row.nisn}</td>
                      <td className="px-3 py-2 text-ink">{row.nama}</td>
                      <td className="px-3 py-2 text-ink">{row.kelas || '-'}</td>
                      <td className="px-3 py-2 text-ink">{row.tempat_pkl || '-'}</td>
                      <td className="px-3 py-2 text-ink">{row.lat_pkl ?? '-'}</td>
                      <td className="px-3 py-2 text-ink">{row.lon_pkl ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.valid.length > 5 && (
                <p className="text-xs text-muted mt-1">
                  Menampilkan 5 dari {preview.valid.length} baris valid.
                </p>
              )}
            </div>
          )}

          {preview.errors?.length > 0 && (
            <div className="rounded-xl border border-danger/25 bg-danger/10 p-3">
              <h3 className="font-bold text-danger mb-2 text-sm">
                Error pada {preview.errors.length} baris
              </h3>
              <ul className="text-sm text-danger space-y-1 list-disc list-inside">
                {preview.errors.slice(0, 10).map((err, idx) => (
                  <li key={idx}>
                    Baris {err.row} ({err.nisn || '-'}): {err.errors?.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-success/25 bg-success/10 p-3 mb-4">
          <p className="text-success font-bold text-sm mb-1">Import selesai</p>
          <p className="text-sm text-success">
            Total baris: {result.totalRows} | Berhasil diimpor: {result.importedCount} | Dilewati:{' '}
            {result.skippedCount}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="btn-secondary">
          Tutup
        </button>
      </div>
    </div>
  );
}

export default StudentManagement;
