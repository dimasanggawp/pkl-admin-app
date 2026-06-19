import { useState, useEffect } from 'react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';

function GuruManagement() {
  const [gurus, setGurus] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
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
      render: (row) => (
        <div className="space-x-2">
          <button
            onClick={() => {
              setEditingGuru(row);
              setShowForm(true);
            }}
            className="text-accent hover:underline"
          >
            Edit
          </button>
          <button onClick={() => handleToggleStatus(row)} className="text-accent hover:underline">
            Toggle Status
          </button>
          <button onClick={() => handleDelete(row)} className="text-danger hover:underline">
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Data Guru</h1>
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
        <div className="mt-6">
          <GuruForm guru={editingGuru} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
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
    <form onSubmit={handleSubmit} className="panel p-4 sm:p-6">
      <h3 className="text-xl font-bold text-ink mb-4">{guru ? 'Edit' : 'Tambah'} Guru</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="NIY"
          value={formData.niy}
          onChange={(e) => setFormData({ ...formData, niy: e.target.value })}
          className="field-input"
          required
        />
        <input
          type="text"
          placeholder="Nama Lengkap"
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          className="field-input"
          required
        />
        <input
          type="text"
          placeholder="No. Telepon"
          value={formData.no_telpon || ''}
          onChange={(e) => setFormData({ ...formData, no_telpon: e.target.value })}
          className="field-input md:col-span-2"
        />
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
