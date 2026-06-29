import { useState, useEffect } from 'react';
import { Pencil, Power, PowerOff, Trash2, Upload } from 'lucide-react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';
import Modal from '../components/admin/Modal';

const IMPORT_MAX_SIZE = 5 * 1024 * 1024;
const IMPORT_VALID_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function GuruManagement() {
  const [gurus, setGurus] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingGuru, setEditingGuru] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchGurus = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/guru', { params: { search } });
        const data = response.data?.data || response.data;
        setGurus(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setGurus([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGurus();
  }, [search, refreshKey]);

  const handleToggleStatus = async (guru) => {
    const active = guru.User?.is_active ?? guru.is_active ?? true;

    try {
      await API.patch(`/admin/guru/${guru.id}/status`, { is_active: !active });
      showSuccess(`Akun guru berhasil ${active ? 'dinonaktifkan' : 'diaktifkan'}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingGuru?.id) {
        await API.put(`/admin/guru/${editingGuru.id}`, formData);
        showSuccess('Data guru berhasil diperbarui');
      } else {
        await API.post('/admin/guru', formData);
        showSuccess('Guru berhasil ditambahkan');
      }
      setShowForm(false);
      setEditingGuru(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handleDelete = async (guru) => {
    const confirmed = await confirmAction({
      title: 'Hapus data guru ini?',
      text: 'Data yang dihapus dapat dipulihkan melalui menu Trash.',
      confirmButtonText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await API.delete(`/admin/guru/${guru.id}`);
      showSuccess('Guru berhasil dihapus');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'nama', label: 'Nama' },
    { key: 'niy', label: 'NIY' },
    { key: 'no_telpon', label: 'No. Telepon', render: (row) => row.no_telpon || '-' },
    {
      key: 'student_count',
      label: 'Siswa Binaan',
      render: (row) => row.student_count ?? row.studentCount ?? 0,
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
      render: (row) => {
        const active = row.User?.is_active ?? row.is_active ?? true;
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingGuru(row);
                setShowForm(true);
              }}
              title="Edit"
              aria-label="Edit"
              className="text-accent hover:text-accent/70"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleToggleStatus(row)}
              title={active ? 'Nonaktifkan' : 'Aktifkan'}
              aria-label={active ? 'Nonaktifkan' : 'Aktifkan'}
              className="text-accent hover:text-accent/70"
            >
              {active ? <PowerOff size={18} /> : <Power size={18} />}
            </button>
            <button
              onClick={() => handleDelete(row)}
              title="Hapus"
              aria-label="Hapus"
              className="text-danger hover:text-danger/70"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Data Guru</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={16} />
            Import Excel
          </button>
          <button
            onClick={() => {
              setEditingGuru(null);
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            {showForm ? 'Batal' : 'Tambah Guru'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          Data guru belum tersedia: {error}
        </div>
      )}

      <FilterPanel>
        <input
          type="text"
          placeholder="Cari nama atau NIY..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input flex-1 min-w-[200px]"
        />
      </FilterPanel>

      {showForm && (
        <Modal
          title={editingGuru ? 'Edit Guru' : 'Tambah Guru'}
          onClose={() => {
            setShowForm(false);
            setEditingGuru(null);
          }}
        >
          <GuruForm
            guru={editingGuru}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingGuru(null);
            }}
          />
        </Modal>
      )}

      {showImport && (
        <Modal title="Import Guru dari Excel" onClose={() => setShowImport(false)}>
          <GuruImportModal
            onClose={() => setShowImport(false)}
            onImported={() => setRefreshKey((k) => k + 1)}
          />
        </Modal>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="p-6 text-center text-muted">Memuat data guru...</div>
        ) : (
          <DataTable columns={columns} data={gurus} emptyMessage="Tidak ada guru ditemukan" />
        )}
      </div>
    </div>
  );
}

function GuruImportModal({ onClose, onImported }) {
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

      const response = await API.post('/admin/guru/import/preview', formData);
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

      const response = await API.post('/admin/guru/import', formData);
      const data = response.data?.data || response.data;
      setResult(data);
      showSuccess(`Berhasil mengimpor ${data.importedCount ?? 0} guru`);
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
      const response = await API.get('/admin/guru/import/template', { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template-guru.xlsx';
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
          Gunakan template berikut agar format kolom sesuai (NIY, Nama, No_Telpon*). Kolom
          No_Telpon bersifat opsional. Password awal akun guru otomatis diatur sama dengan NIY.
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
                    <th className="px-3 py-2 text-ink">NIY</th>
                    <th className="px-3 py-2 text-ink">Nama</th>
                    <th className="px-3 py-2 text-ink">No. Telepon</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.valid.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="px-3 py-2 text-ink">{row.niy}</td>
                      <td className="px-3 py-2 text-ink">{row.nama}</td>
                      <td className="px-3 py-2 text-ink">{row.no_telpon || '-'}</td>
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
                    Baris {err.row} ({err.niy || '-'}): {err.errors?.join(', ')}
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

function GuruForm({ guru, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    guru || {
      niy: '',
      nama: '',
      no_telpon: '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">NIY</label>
          <input
            type="text"
            placeholder="Contoh: 198501012010011001"
            value={formData.niy}
            onChange={(e) => setFormData({ ...formData, niy: e.target.value })}
            className="field-input"
            required
          />
        </div>
        <div>
          <label className="field-label">Nama Lengkap</label>
          <input
            type="text"
            placeholder="Contoh: Siti Aminah, S.Pd."
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            className="field-input"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">No. Telepon</label>
          <input
            type="text"
            placeholder="Contoh: 081234567890"
            value={formData.no_telpon || ''}
            onChange={(e) => setFormData({ ...formData, no_telpon: e.target.value })}
            className="field-input"
          />
        </div>
      </div>

      {!guru && (
        <p className="mt-4 text-sm text-muted">
          Password awal akun guru akan otomatis diatur sama dengan NIY. Informasikan NIY sebagai
          username dan password awal kepada guru agar dapat login.
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

export default GuruManagement;
