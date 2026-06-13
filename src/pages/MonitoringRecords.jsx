import { useState, useEffect } from 'react';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import StatsCard from '../components/admin/StatsCard';
import FilterPanel from '../components/admin/FilterPanel';

function MonitoringRecords() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/monitoring-records', {
          params: { filter: filter || undefined, page, limit: 20 },
        });
        const data = response.data?.data || response.data;
        setRecords(Array.isArray(data?.records) ? data.records : Array.isArray(data) ? data : []);
        setStats(data?.stats || null);
        setTotalPages(data?.pages || data?.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setRecords([]);
        setStats(null);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [filter, page]);

  const handleExport = async () => {
    try {
      const response = await API.get('/admin/monitoring-records/export', {
        params: { filter: filter || undefined },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `monitoring-records_${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'guru_name', label: 'Guru', render: (row) => row.guru_name || row.Guru?.nama || '-' },
    { key: 'student_name', label: 'Siswa', render: (row) => row.student_name || row.Siswa?.nama || '-' },
    {
      key: 'visit_date',
      label: 'Tanggal',
      render: (row) => (row.visit_date ? new Date(row.visit_date).toLocaleDateString('id-ID') : '-'),
    },
    {
      key: 'notes',
      label: 'Catatan',
      render: (row) => (
        <span title={row.notes} className="line-clamp-2 block max-w-xs">
          {row.notes || '-'}
        </span>
      ),
    },
    { key: 'photo_count', label: 'Foto', render: (row) => row.photo_count ?? 0 },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Monitoring Records</h1>
        <button onClick={handleExport} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
          Export Records
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Data monitoring belum tersedia: {error}
        </div>
      )}

      {/* Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Kunjungan" value={stats?.totalVisits ?? records.length ?? 0} icon="📋" />
        <StatsCard label="Total Foto" value={stats?.totalPhotos ?? 0} icon="📷" />
        <StatsCard label="Guru Terlibat" value={stats?.totalGuru ?? 0} icon="👨‍🏫" />
        <StatsCard label="Siswa Dipantau" value={stats?.totalSiswa ?? 0} icon="🎓" />
      </div>

      {/* Filter */}
      <FilterPanel>
        <input
          type="text"
          placeholder="Filter berdasarkan guru atau siswa..."
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
        />
      </FilterPanel>

      {/* Table */}
      <div className="mt-6">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Memuat data monitoring...</div>
        ) : (
          <DataTable columns={columns} data={records} emptyMessage="Tidak ada catatan monitoring ditemukan" />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-2 rounded ${page === p ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MonitoringRecords;
