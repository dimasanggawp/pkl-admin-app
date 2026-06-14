import { useState, useEffect } from 'react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';

const TYPES = ['all', 'siswa', 'guru', 'jurnal', 'presensi'];

function Trash() {
  const [items, setItems] = useState([]);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchTrash = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/trash', {
          params: { type: type === 'all' ? undefined : type, search: search || undefined },
        });
        const data = response.data?.data || response.data;
        setItems(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrash();
  }, [type, search, refreshKey]);

  const handleRestore = async (item) => {
    try {
      await API.post(`/admin/trash/${item.id}/restore`, { type: item.type });
      showSuccess('Item berhasil direstore');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handlePermanentDelete = async (item) => {
    const confirmed = await confirmAction({
      title: 'Hapus permanen?',
      text: 'Aksi ini tidak dapat dibatalkan!',
      confirmButtonText: 'Hapus Permanen',
      icon: 'error',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await API.delete(`/admin/trash/${item.id}`, { params: { type: item.type } });
      showSuccess('Item berhasil dihapus permanen');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'name', label: 'Item', render: (row) => row.name || row.nama || `#${row.id}` },
    { key: 'type', label: 'Tipe', render: (row) => row.type || '-' },
    {
      key: 'deletedAt',
      label: 'Dihapus Pada',
      render: (row) =>
        row.deletedAt || row.deleted_at
          ? new Date(row.deletedAt || row.deleted_at).toLocaleString('id-ID')
          : '-',
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="space-x-2">
          <button onClick={() => handleRestore(row)} className="text-success hover:underline">
            Restore
          </button>
          <button onClick={() => handlePermanentDelete(row)} className="text-danger hover:underline">
            Hapus Permanen
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mb-6">Trash</h1>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          Data trash belum tersedia: {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 rounded-xl capitalize text-sm font-medium transition-colors ${
              type === t ? 'bg-accent text-white' : 'bg-surface border border-border text-ink hover:bg-surface-alt'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <FilterPanel>
        <input
          type="text"
          placeholder="Cari item yang dihapus..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input flex-1 min-w-[200px]"
        />
      </FilterPanel>

      <div className="mt-6">
        {loading ? (
          <div className="p-6 text-center text-muted">Memuat data trash...</div>
        ) : (
          <DataTable columns={columns} data={items} emptyMessage="Trash kosong" />
        )}
      </div>
    </div>
  );
}

export default Trash;
