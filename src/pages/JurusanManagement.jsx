import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';
import Modal from '../components/admin/Modal';

function JurusanManagement() {
  const [jurusanList, setJurusanList] = useState([]);
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([]);
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchTahunAjaran = async () => {
      try {
        const response = await API.get('/admin/tahun-ajaran');
        const data = response.data?.data || response.data;
        const list = Array.isArray(data) ? data : [];
        setTahunAjaranOptions(list);
        const active = list.find((t) => t.is_active);
        if (active) setTahunAjaranFilter(String(active.id));
      } catch {
        setTahunAjaranOptions([]);
      }
    };
    fetchTahunAjaran();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/jurusan', {
          params: tahunAjaranFilter ? { tahun_ajaran_id: tahunAjaranFilter } : undefined,
        });
        const data = response.data?.data || response.data;
        setJurusanList(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setJurusanList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey, tahunAjaranFilter]);

  const handleDelete = async (item) => {
    const confirmed = await confirmAction({
      title: `Hapus jurusan ${item.nama}?`,
      text: 'Hanya bisa dihapus jika tidak ada siswa yang ter-assign.',
      confirmButtonText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await API.delete(`/admin/jurusan/${item.id}`);
      showSuccess('Jurusan berhasil dihapus');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingItem?.id) {
        await API.put(`/admin/jurusan/${editingItem.id}`, formData);
        showSuccess('Jurusan berhasil diperbarui');
      } else {
        await API.post('/admin/jurusan', formData);
        showSuccess('Jurusan berhasil ditambahkan');
      }
      setShowForm(false);
      setEditingItem(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Nama Jurusan' },
    { key: 'student_count', label: 'Jumlah Siswa', render: (row) => row.student_count ?? 0 },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-3">
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Jurusan</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="btn-primary"
        >
          {showForm ? 'Batal' : 'Tambah Jurusan'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          Data jurusan belum tersedia: {error}
        </div>
      )}

      <FilterPanel>
        <div>
          <label className="field-label" htmlFor="tahunAjaranFilter">
            Tahun Pelajaran
          </label>
          <select
            id="tahunAjaranFilter"
            value={tahunAjaranFilter}
            onChange={(e) => setTahunAjaranFilter(e.target.value)}
            className="field-input"
          >
            <option value="">Semua Tahun Pelajaran</option>
            {tahunAjaranOptions.map((tahun) => (
              <option key={tahun.id} value={tahun.id}>
                {tahun.nama} {tahun.is_active ? '(aktif)' : ''}
              </option>
            ))}
          </select>
        </div>
      </FilterPanel>

      {showForm && (
        <Modal
          title={editingItem ? 'Edit Jurusan' : 'Tambah Jurusan'}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        >
          <JurusanForm
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
          <div className="p-6 text-center text-muted">Memuat data jurusan...</div>
        ) : (
          <DataTable columns={columns} data={jurusanList} emptyMessage="Belum ada jurusan ditambahkan" />
        )}
      </div>
    </div>
  );
}

function JurusanForm({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    item ? { nama: item.nama, kode: item.kode } : { nama: '', kode: '' }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="field-label">Kode Jurusan</label>
          <input
            type="text"
            placeholder="Contoh: TKJ"
            value={formData.kode}
            onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
            className="field-input"
            required
          />
        </div>
        <div>
          <label className="field-label">Nama Jurusan</label>
          <input
            type="text"
            placeholder="Contoh: Teknik Komputer dan Jaringan"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
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

export default JurusanManagement;
