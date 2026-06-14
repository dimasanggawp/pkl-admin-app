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
import useTheme from '../hooks/useTheme';

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

const CHART_FONT = { family: 'Manrope', size: 12 };

function useChartColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    if (theme === 'dark') {
      return {
        text: '#E8EAEF',
        muted: '#8E96A5',
        grid: '#292F3C',
        surface: '#151922',
        accent: '#6390FF',
        success: '#34C799',
        warning: '#FBBF24',
        danger: '#F87171',
      };
    }
    return {
      text: '#11181C',
      muted: '#6E7784',
      grid: '#E4E7EC',
      surface: '#FFFFFF',
      accent: '#2554FF',
      success: '#10A37F',
      warning: '#D97706',
      danger: '#E03C3C',
    };
  }, [theme]);
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const colors = useChartColors();

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

  const chartOptionsBase = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: CHART_FONT, color: colors.text, usePointStyle: true } },
      },
      scales: {
        x: { ticks: { font: CHART_FONT, color: colors.muted }, grid: { color: colors.grid } },
        y: { ticks: { font: CHART_FONT, color: colors.muted }, grid: { color: colors.grid } },
      },
    }),
    [colors]
  );

  const dailyTrendData = useMemo(
    () => ({
      labels: stats?.dailyTrendChart?.labels || [],
      datasets: stats?.dailyTrendChart?.datasets || [
        {
          label: 'Presensi',
          data: [],
          borderColor: colors.accent,
          backgroundColor: `${colors.accent}1F`,
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [stats, colors]
  );

  const distributionData = useMemo(
    () => ({
      labels: stats?.distributionChart?.labels || [],
      datasets: stats?.distributionChart?.datasets || [
        {
          label: 'Jumlah Siswa',
          data: [],
          backgroundColor: colors.success,
          borderRadius: 4,
        },
      ],
    }),
    [stats, colors]
  );

  const statusData = useMemo(
    () => ({
      labels: stats?.statusChart?.labels || ['Hadir', 'Izin', 'Sakit', 'Alpha'],
      datasets: stats?.statusChart?.datasets || [
        {
          data: [0, 0, 0, 0],
          backgroundColor: [colors.success, colors.accent, colors.warning, colors.danger],
          borderColor: colors.surface,
          borderWidth: 2,
        },
      ],
    }),
    [stats, colors]
  );

  if (loading) {
    return (
      <div className="p-6 sm:p-10 flex items-center gap-3 text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        Memuat dashboard...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <p className="kicker mb-2">Ringkasan · Hari Ini</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">Dashboard Admin</h1>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          Data dashboard belum tersedia: {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Siswa" value={stats?.totalSiswa || 0} icon="🎓" />
        <StatsCard label="Total Guru" value={stats?.totalGuru || 0} icon="👨‍🏫" />
        <StatsCard label="Avg Review Quality" value={`${stats?.avgReviewQuality || 0}%`} icon="⭐" />
        <StatsCard label="Active Sessions" value={stats?.activeSessions || 0} icon="🟢" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Tren Presensi Harian</h2>
          <div className="h-64">
            <Line data={dailyTrendData} options={chartOptionsBase} />
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Distribusi Siswa per Zona</h2>
          <div className="h-64">
            <Bar data={distributionData} options={chartOptionsBase} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Status Presensi</h2>
          <div className="h-64">
            <Doughnut
              data={statusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: CHART_FONT, color: colors.text, usePointStyle: true } },
                },
              }}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="panel p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink mb-5">Metrik Utama</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <MetricItem label="Journal Approval Rate" value={`${stats?.approvalRate || 0}%`} className="text-success" />
            <MetricItem label="Avg Review Time" value={`${stats?.avgReviewTime || 0}h`} className="text-accent" />
            <MetricItem label="System Uptime" value={`${stats?.systemUptime || 0}%`} className="text-warning" />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="panel p-5 sm:p-6">
        <h2 className="text-lg font-bold text-ink mb-4">Aktivitas Terbaru</h2>
        {stats?.recentActivities?.length > 0 ? (
          <div className="divide-y divide-border">
            {stats.recentActivities.map((activity, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <p className="text-ink">{activity.description}</p>
                <p className="shrink-0 font-mono text-xs text-muted">{activity.timestamp}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">Belum ada aktivitas terbaru.</p>
        )}
      </div>
    </div>
  );
}

function MetricItem({ label, value, className }) {
  return (
    <div>
      <p className="kicker !text-muted !text-[10px] mb-1.5">{label}</p>
      <p className={`font-mono text-2xl font-semibold tabular-nums ${className}`}>{value}</p>
    </div>
  );
}

export default Dashboard;
