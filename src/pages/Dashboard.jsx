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

function formatActivityTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Chart-only palette: light steps reuse the app's badge colors (already
// validated), dark steps are separately tuned (not the badge tokens) so every
// slot lands in the OKLCH L 0.48-0.67 band needed for a dark chart surface -
// validated via dataviz skill's validate_palette.js (categorical, 4 slots,
// worst adjacent CVD ΔE > 20 in both modes).
function useChartColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    if (theme === 'dark') {
      return {
        text: '#E8EAEF',
        muted: '#8E96A5',
        grid: '#242938',
        surface: '#151922',
        accent: '#6390FF',
        success: '#17916A',
        info: '#7160D9',
        warning: '#B87D1B',
        danger: '#DD5250',
      };
    }
    return {
      text: '#11181C',
      muted: '#6E7784',
      grid: '#E4E7EC',
      surface: '#FFFFFF',
      accent: '#2554FF',
      success: '#10A37F',
      info: '#6D5DD3',
      warning: '#D97706',
      danger: '#E03C3C',
    };
  }, [theme]);
}

function makeVerticalGradient(ctx, chartArea, colorTop, colorBottom) {
  if (!chartArea) return colorTop;
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, colorTop);
  gradient.addColorStop(1, colorBottom);
  return gradient;
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
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { font: CHART_FONT, color: colors.text, usePointStyle: true, boxHeight: 8 } },
        tooltip: {
          backgroundColor: colors.surface,
          titleColor: colors.text,
          bodyColor: colors.muted,
          borderColor: colors.grid,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: CHART_FONT,
          bodyFont: CHART_FONT,
          boxPadding: 4,
        },
      },
      scales: {
        x: { ticks: { font: CHART_FONT, color: colors.muted }, grid: { display: false }, border: { color: colors.grid } },
        y: {
          beginAtZero: true,
          ticks: { font: CHART_FONT, color: colors.muted, precision: 0 },
          grid: { color: colors.grid },
          border: { display: false },
        },
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
          backgroundColor: (context) => {
            const { chart } = context;
            return makeVerticalGradient(chart.ctx, chart.chartArea, `${colors.accent}3D`, `${colors.accent}00`);
          },
          pointBackgroundColor: colors.accent,
          pointBorderColor: colors.surface,
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
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
          backgroundColor: (context) => {
            const { chart } = context;
            return makeVerticalGradient(chart.ctx, chart.chartArea, colors.accent, `${colors.accent}A8`);
          },
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 40,
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
          backgroundColor: [colors.success, colors.info, colors.warning, colors.danger],
          borderColor: colors.surface,
          borderWidth: 3,
          hoverOffset: 6,
          spacing: 2,
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
                cutout: '68%',
                plugins: {
                  legend: { position: 'bottom', labels: { font: CHART_FONT, color: colors.text, usePointStyle: true, boxHeight: 8 } },
                  tooltip: {
                    backgroundColor: colors.surface,
                    titleColor: colors.text,
                    bodyColor: colors.muted,
                    borderColor: colors.grid,
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: CHART_FONT,
                    bodyFont: CHART_FONT,
                    boxPadding: 4,
                  },
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
                <p className="shrink-0 font-mono text-xs text-muted">
                  {formatActivityTimestamp(activity.timestamp)}
                </p>
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
