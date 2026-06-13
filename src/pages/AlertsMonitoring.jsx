import { useState, useEffect } from 'react';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import StatsCard from '../components/admin/StatsCard';
import FilterPanel from '../components/admin/FilterPanel';

const STATUS_FILTERS = ['all', 'unread', 'read', 'acted'];

function AlertsMonitoring() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/alerts', {
          params: { status: filter !== 'all' ? filter : undefined, page, limit: 20 },
        });
        const data = response.data?.data || response.data;
        setAlerts(Array.isArray(data?.alerts) ? data.alerts : Array.isArray(data) ? data : []);
        setStats(data?.stats || null);
        setTotalPages(data?.pages || data?.totalPages || 1);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        setAlerts([]);
        setStats(null);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [filter, page]);

  const handleExport = async () => {
    try {
      const response = await API.get('/admin/alerts/export', {
        params: { status: filter !== 'all' ? filter : undefined },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `alerts_${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'siswa', label: 'Siswa', render: (row) => row.Siswa?.nama || row.siswa_name || `#${row.siswa_id}` },
    { key: 'tanggal', label: 'Tanggal', render: (row) => row.tanggal || '-' },
    { key: 'jam_alert', label: 'Jam', render: (row) => row.jam_alert || '-' },
    {
      key: 'jarak',
      label: 'Jarak dari Zona (km)',
      render: (row) => (row.jarak_dari_zona_km != null ? row.jarak_dari_zona_km : '-'),
    },
    {
      key: 'status_alert',
      label: 'Status',
      render: (row) => {
        const colors = {
          unread: 'bg-red-100 text-red-700',
          read: 'bg-yellow-100 text-yellow-700',
          acted: 'bg-green-100 text-green-700',
        };
        return (
          <span className={`px-3 py-1 rounded text-sm ${colors[row.status_alert] || 'bg-gray-100 text-gray-700'}`}>
            {row.status_alert || '-'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Alert Monitoring</h1>
        <button
          onClick={handleExport}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          Export Alerts
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Data alert belum tersedia: {error}
        </div>
      )}

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Alerts" value={stats?.total || alerts.length || 0} icon="🔔" />
        <StatsCard label="Unread" value={stats?.unread || 0} icon="🔴" />
        <StatsCard label="Read" value={stats?.read || 0} icon="🟡" />
        <StatsCard label="Acted" value={stats?.acted || 0} icon="🟢" />
      </div>

      {/* Filters */}
      <FilterPanel>
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded ${
              filter === status ? 'bg-blue-600 text-white' : 'bg-white border'
            }`}
          >
            {status}
          </button>
        ))}
      </FilterPanel>

      {/* Alerts Table */}
      <div className="mt-6">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Memuat data alert...</div>
        ) : (
          <DataTable columns={columns} data={alerts} emptyMessage="Tidak ada alert ditemukan" />
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

export default AlertsMonitoring;
