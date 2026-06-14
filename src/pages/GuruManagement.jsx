import { useState, useEffect } from 'react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';

function GuruManagement() {
  const [gurus, setGurus] = useState([]);
  const [search, setSearch] = useState('');
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

  const columns = [
    { key: 'nama', label: 'Nama' },
    { key: 'niy', label: 'NIY' },
    { key: 'email', label: 'Email', render: (row) => row.email || row.User?.email || '-' },
    { key: 'sekolah', label: 'Sekolah', render: (row) => row.sekolah || '-' },
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
        <button onClick={() => handleToggleStatus(row)} className="text-accent hover:underline">
          Toggle Status
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mb-6">Data Guru</h1>

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

export default GuruManagement;
