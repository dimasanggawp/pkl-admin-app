import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Users, MapPinned } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage } from '../services/toastService';
import ThemeToggle from '../components/common/ThemeToggle';

function Login() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post('/auth/login', credentials);
      localStorage.setItem('admin_token', response.data.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.data.user));
      showSuccess('Login berhasil!');
      navigate('/');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left — branding panel */}
      <div className="relative hidden lg:flex lg:w-[44%] flex-col justify-between overflow-hidden bg-ink p-12 text-bg">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--accent)), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--success)), transparent 70%)' }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-white text-xl">
            P
          </div>
          <span className="text-xl font-bold tracking-tight">PKL Admin</span>
        </div>

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-accent mb-4">
            Sistem Manajemen PKL · 2026
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.15] mb-6 tracking-tight">
            Satu dasbor untuk mengawasi seluruh perjalanan praktik kerja siswa.
          </h1>
          <p className="text-bg/55 max-w-md leading-relaxed">
            Pantau presensi, jurnal harian, kunjungan pembimbing, dan performa guru
            dalam satu panel administrasi yang rapi dan dapat diandalkan.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4 text-sm text-bg/60">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-accent" />
            Siswa
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            Guru
          </div>
          <div className="flex items-center gap-2">
            <LayoutDashboard size={16} className="text-accent" />
            Admin
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-white text-xl">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-ink">PKL Admin</span>
          </div>

          <p className="kicker mb-2">Selamat datang kembali</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-2">Masuk ke Panel Admin</h2>
          <p className="text-muted mb-8">
            Gunakan NIY dan kata sandi yang terdaftar untuk mengakses dasbor.
          </p>

          <LoginForm onSubmit={handleLogin} error={error} loading={loading} />

          <div className="mt-8 flex items-center gap-2 text-xs text-muted">
            <MapPinned size={14} />
            <span>Geofencing aktif untuk seluruh lokasi PKL terdaftar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
