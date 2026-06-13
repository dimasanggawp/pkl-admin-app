import { useState, useEffect, useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';
import StatsCard from '../components/admin/StatsCard';
import DataTable from '../components/admin/DataTable';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function TeacherPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/teachers/performance');
        setData(response.data?.data || response.data);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  const handleExport = async () => {
    try {
      const response = await API.get('/admin/teachers/performance/export', { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `teacher-performance_${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const reviewChartData = useMemo(
    () => ({
      labels: data?.reviewChart?.labels || [],
      datasets: data?.reviewChart?.datasets || [
        { label: 'Jumlah Review', data: [], backgroundColor: 'rgba(59, 130, 246, 0.6)' },
      ],
    }),
    [data]
  );

  const loginChartData = useMemo(
    () => ({
      labels: data?.loginChart?.labels || [],
      datasets: data?.loginChart?.datasets || [
        {
          label: 'Jumlah Login',
          data: [],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
        },
      ],
    }),
    [data]
  );

  const teachers = data?.teachers || [];

  const columns = [
    { key: 'name', label: 'Nama Guru', render: (row) => row.name || row.nama || '-' },
    { key: 'review_count', label: 'Jumlah Review', render: (row) => row.review_count ?? 0 },
    { key: 'login_count', label: 'Jumlah Login', render: (row) => row.login_count ?? 0 },
    {
      key: 'avg_rating',
      label: 'Rata-rata Rating',
      render: (row) => (typeof row.avg_rating === 'number' ? row.avg_rating.toFixed(2) : 'N/A'),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Performa Guru</h1>
        <button onClick={handleExport} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
          Export Reports
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Data performa guru belum tersedia: {error}
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-gray-500">Memuat data performa guru...</div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatsCard label="Avg Review/Hari" value={data?.avgReviewsPerDay ?? 0} icon="📝" />
            <StatsCard label="Avg Login/Minggu" value={data?.avgLoginsPerWeek ?? 0} icon="🔑" />
            <StatsCard label="Avg Response Time" value={`${data?.avgResponseTime ?? 0}h`} icon="⏱️" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-bold mb-4">Jumlah Review</h2>
              <div className="h-64">
                <Bar
                  data={reviewChartData}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-bold mb-4">Frekuensi Login</h2>
              <div className="h-64">
                <Line
                  data={loginChartData}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                />
              </div>
            </div>
          </div>

          {/* Teacher Rankings */}
          <div>
            <h2 className="text-lg font-bold mb-4">Peringkat Guru</h2>
            <DataTable columns={columns} data={teachers} emptyMessage="Belum ada data performa guru" />
          </div>
        </>
      )}
    </div>
  );
}

export default TeacherPerformance;
