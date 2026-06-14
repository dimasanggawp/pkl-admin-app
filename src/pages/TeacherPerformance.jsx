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
import useTheme from '../hooks/useTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function useChartColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    if (theme === 'dark') {
      return { text: '#E8EAEF', muted: '#8E96A5', grid: '#292F3C', accent: '#6390FF', success: '#34C799' };
    }
    return { text: '#11181C', muted: '#6E7784', grid: '#E4E7EC', accent: '#2554FF', success: '#10A37F' };
  }, [theme]);
}

function TeacherPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const colors = useChartColors();

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
        { label: 'Jumlah Review', data: [], backgroundColor: `${colors.accent}99`, borderRadius: 4 },
      ],
    }),
    [data, colors]
  );

  const loginChartData = useMemo(
    () => ({
      labels: data?.loginChart?.labels || [],
      datasets: data?.loginChart?.datasets || [
        {
          label: 'Jumlah Login',
          data: [],
          borderColor: colors.success,
          backgroundColor: `${colors.success}33`,
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [data, colors]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: colors.text, font: { family: 'Manrope' } } },
      },
      scales: {
        x: { ticks: { color: colors.muted, font: { family: 'Manrope' } }, grid: { color: colors.grid } },
        y: { ticks: { color: colors.muted, font: { family: 'Manrope' } }, grid: { color: colors.grid } },
      },
    }),
    [colors]
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Performa Guru</h1>
        <button onClick={handleExport} className="btn-secondary">
          Export Reports
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          Data performa guru belum tersedia: {error}
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-muted">Memuat data performa guru...</div>
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
            <div className="panel p-4 sm:p-6">
              <h2 className="text-lg font-bold text-ink mb-4">Jumlah Review</h2>
              <div className="h-64">
                <Bar data={reviewChartData} options={chartOptions} />
              </div>
            </div>

            <div className="panel p-4 sm:p-6">
              <h2 className="text-lg font-bold text-ink mb-4">Frekuensi Login</h2>
              <div className="h-64">
                <Line data={loginChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Teacher Rankings */}
          <div>
            <h2 className="text-lg font-bold text-ink mb-4">Peringkat Guru</h2>
            <DataTable columns={columns} data={teachers} emptyMessage="Belum ada data performa guru" />
          </div>
        </>
      )}
    </div>
  );
}

export default TeacherPerformance;
