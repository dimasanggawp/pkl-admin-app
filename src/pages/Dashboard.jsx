import { useState, useEffect, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import API from '../services/api';
import { showError, getErrorMessage } from '../services/toastService';
import StatsCard from '../components/admin/StatsCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/dashboard');
        setStats(response.data?.data || response.data);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        showError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const dailyTrendData = useMemo(
    () => ({
      labels: stats?.dailyTrendChart?.labels || [],
      datasets: stats?.dailyTrendChart?.datasets || [
        {
          label: 'Presensi',
          data: [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        },
      ],
    }),
    [stats]
  );

  const distributionData = useMemo(
    () => ({
      labels: stats?.distributionChart?.labels || [],
      datasets: stats?.distributionChart?.datasets || [
        {
          label: 'Jumlah Siswa',
          data: [],
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
        },
      ],
    }),
    [stats]
  );

  const statusData = useMemo(
    () => ({
      labels: stats?.statusChart?.labels || ['Hadir', 'Izin', 'Sakit', 'Alpha'],
      datasets: stats?.statusChart?.datasets || [
        {
          data: [0, 0, 0, 0],
          backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
        },
      ],
    }),
    [stats]
  );

  if (loading) {
    return <div className="p-6">Memuat dashboard...</div>;
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Data dashboard belum tersedia: {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Siswa" value={stats?.totalSiswa || 0} icon="🎓" />
        <StatsCard label="Total Guru" value={stats?.totalGuru || 0} icon="👨‍🏫" />
        <StatsCard label="Avg Review Quality" value={`${stats?.avgReviewQuality || 0}%`} icon="⭐" />
        <StatsCard label="Active Sessions" value={stats?.activeSessions || 0} icon="🟢" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4">Daily Presensi Trend</h2>
          <div className="h-64">
            <Line
              data={dailyTrendData}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4">Student Distribution by Zone</h2>
          <div className="h-64">
            <Bar
              data={distributionData}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4">Status Presensi</h2>
          <div className="h-64">
            <Doughnut
              data={statusData}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <MetricItem label="Journal Approval Rate" value={`${stats?.approvalRate || 0}%`} color="text-green-600" />
            <MetricItem label="Avg Review Time" value={`${stats?.avgReviewTime || 0}h`} color="text-blue-600" />
            <MetricItem label="System Uptime" value={`${stats?.systemUptime || 0}%`} color="text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg font-bold mb-4">Recent Activities</h2>
        {stats?.recentActivities?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivities.map((activity, idx) => (
              <div key={idx} className="border-b pb-3 last:border-b-0">
                <p className="text-gray-600">{activity.description}</p>
                <p className="text-sm text-gray-400">{activity.timestamp}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Belum ada aktivitas terbaru.</p>
        )}
      </div>
    </div>
  );
}

function MetricItem({ label, value, color }) {
  return (
    <div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default Dashboard;
