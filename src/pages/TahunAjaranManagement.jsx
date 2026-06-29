import { useState, useEffect } from 'react';
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import Modal from '../components/admin/Modal';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function TahunAjaranManagement() {
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/tahun-ajaran');
        const data = response.data?.data || response.data;
        setTahunAjaranList(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setTahunAjaranList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  const handleActivate = async (item) => {
    const confirmed = await confirmAction({
      title: `Aktifkan tahun ajaran ${item.nama}?`,
      text: 'Tahun ajaran lain yang sedang aktif akan otomatis dinonaktifkan.',
      confirmButtonText: 'Aktifkan',
    });
    if (!confirmed) return;

    try {
      await API.patch(`/admin/tahun-ajaran/${item.id}/activate`);
      showSuccess(`Tahun ajaran ${item.nama} berhasil diaktifkan`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmAction({
      title: `Hapus tahun ajaran ${item.nama}?`,
      text: 'Tindakan ini tidak dapat dibatalkan jika tidak ada siswa yang ter-assign.',
      confirmButtonText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await API.delete(`/admin/tahun-ajaran/${item.id}`);
      showSuccess('Tahun ajaran berhasil dihapus');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingItem?.id) {
        await API.put(`/admin/tahun-ajaran/${editingItem.id}`, formData);
        showSuccess('Tahun ajaran berhasil diperbarui');
      } else {
        await API.post('/admin/tahun-ajaran', formData);
        showSuccess('Tahun ajaran berhasil ditambahkan');
      }
      setShowForm(false);
      setEditingItem(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'nama', label: 'Tahun Pelajaran' },
    { key: 'tanggal_mulai_pkl', label: 'Mulai PKL', render: (row) => formatDate(row.tanggal_mulai_pkl) },
    { key: 'tanggal_selesai_pkl', label: 'Selesai PKL', render: (row) => formatDate(row.tanggal_selesai_pkl) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`badge ${row.is_active ? 'bg-success/10 text-success' : 'bg-surface-alt text-muted'}`}
        >
          {row.is_active ? 'aktif' : 'nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-3">
          {!row.is_active && (
            <button
              onClick={() => handleActivate(row)}
              title="Aktifkan"
              aria-label="Aktifkan"
              className="text-success hover:text-success/70"
            >
              <CheckCircle2 size={18} />
            </button>
          )}
          <button
            onClick={() => {
              setEditingItem(row);
              setShowForm(true);
            }}
            title="Edit"
            aria-label="Edit"
            className="text-accent hover:text-accent/70"
          >
            <Pencil size={18} />
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
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
          Tahun Pelajaran & Periode PKL
        </h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="btn-primary"
        >
          {showForm ? 'Batal' : 'Tambah Tahun Pelajaran'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          Data tahun pelajaran belum tersedia: {error}
        </div>
      )}

      {showForm && (
        <Modal
          title={editingItem ? 'Edit Tahun Pelajaran' : 'Tambah Tahun Pelajaran'}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        >
          <TahunAjaranForm
            item={editingItem}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </Modal>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="p-6 text-center text-muted">Memuat data tahun pelajaran...</div>
        ) : (
          <DataTable
            columns={columns}
            data={tahunAjaranList}
            emptyMessage="Belum ada tahun pelajaran ditambahkan"
          />
        )}
      </div>
    </div>
  );
}

function TahunAjaranForm({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    item
      ? {
          nama: item.nama,
          tanggal_mulai_pkl: item.tanggal_mulai_pkl,
          tanggal_selesai_pkl: item.tanggal_selesai_pkl,
        }
      : { nama: '', tanggal_mulai_pkl: '', tanggal_selesai_pkl: '' }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="field-label">Tahun Pelajaran</label>
          <input
            type="text"
            placeholder="Contoh: 2025/2026"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            className="field-input"
            required
          />
        </div>
        <div>
          <label className="field-label">Tanggal Mulai PKL</label>
          <input
            type="date"
            value={formData.tanggal_mulai_pkl}
            onChange={(e) => setFormData({ ...formData, tanggal_mulai_pkl: e.target.value })}
            className="field-input"
            required
          />
        </div>
        <div>
          <label className="field-label">Tanggal Selesai PKL</label>
          <input
            type="date"
            value={formData.tanggal_selesai_pkl}
            onChange={(e) => setFormData({ ...formData, tanggal_selesai_pkl: e.target.value })}
            className="field-input"
            required
          />
        </div>
      </div>

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

export default TahunAjaranManagement;
