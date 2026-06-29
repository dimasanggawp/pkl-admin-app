import { useState, useEffect } from 'react';
import { Power, PowerOff, KeyRound, Trash2 } from 'lucide-react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import { useAuth } from '../hooks/useAuth';
import DataTable from '../components/admin/DataTable';
import Modal from '../components/admin/Modal';

function AdminManagement() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const [nisnNiy, setNisnNiy] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/admins');
        const data = response.data?.data || response.data;
        setAdmins(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, [refreshKey]);

  const resetForm = () => {
    setNisnNiy('');
    setEmail('');
    setPassword('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!nisnNiy.trim() || !email.trim() || !password) {
      showError('NISN/NIY, email, dan password wajib diisi');
      return;
    }

    try {
      setSaving(true);
      await API.post('/admin/admins', { nisn_niy: nisnNiy.trim(), email: email.trim(), password });
      showSuccess('Admin baru berhasil ditambahkan');
      resetForm();
      setShowForm(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    try {
      await API.patch(`/admin/admins/${admin.id}/status`, { is_active: !admin.is_active });
      showSuccess(`Admin berhasil ${admin.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      showError('Password minimal 6 karakter');
      return;
    }

    try {
      setResetting(true);
      await API.patch(`/admin/admins/${resetTarget.id}/reset-password`, { password: newPassword });
      showSuccess(`Password admin ${resetTarget.email} berhasil direset`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async (admin) => {
    const confirmed = await confirmAction({
      title: `Hapus admin ${admin.email}?`,
      text: 'Aksi ini akan menghapus akun admin secara permanen.',
      confirmButtonText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await API.delete(`/admin/admins/${admin.id}`);
      showSuccess('Admin berhasil dihapus');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'nisn_niy', label: 'NIY' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`badge ${row.is_active ? 'bg-success/10 text-success' : 'bg-surface-alt text-muted'}`}
        >
          {row.is_active ? 'active' : 'inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => {
        const isSelf = row.id === user?.id;
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleToggleStatus(row)}
              disabled={isSelf}
              title={row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              aria-label={row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              className="text-accent hover:text-accent/70 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {row.is_active ? <PowerOff size={18} /> : <Power size={18} />}
            </button>
            <button
              onClick={() => {
                setResetTarget(row);
                setNewPassword('');
              }}
              disabled={isSelf}
              title="Reset Password"
              aria-label="Reset Password"
              className="text-accent hover:text-accent/70 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <KeyRound size={18} />
            </button>
            <button
              onClick={() => handleDelete(row)}
              disabled={isSelf}
              title="Hapus"
              aria-label="Hapus"
              className="text-danger hover:text-danger/70 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Manajemen Admin</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          Tambah Admin
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          Data admin belum tersedia: {error}
        </div>
      )}

      {showForm && (
        <Modal title="Tambah Admin Baru" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="field-label">NISN/NIY</label>
              <input
                type="text"
                value={nisnNiy}
                onChange={(e) => setNisnNiy(e.target.value)}
                className="field-input"
                placeholder="admin002"
              />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                placeholder="admin2@sekolah.sch.id"
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Menyimpan...' : 'Tambah Admin'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Batal
              </button>
            </div>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal title={`Reset Password: ${resetTarget.email}`} onClose={() => setResetTarget(null)}>
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className="field-label">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="field-input"
                placeholder="Minimal 6 karakter"
                autoFocus
              />
            </div>
            <p className="text-sm text-muted">
              Informasikan password baru ini kepada admin {resetTarget.email} secara langsung.
            </p>
            <div className="flex gap-2">
              <button type="submit" disabled={resetting} className="btn-primary">
                {resetting ? 'Menyimpan...' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setResetTarget(null)} className="btn-secondary">
                Batal
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div>
        <h2 className="text-lg font-bold text-ink mb-4">Daftar Admin</h2>
        {loading ? (
          <div className="p-6 text-center text-muted">Memuat data admin...</div>
        ) : (
          <DataTable columns={columns} data={admins} emptyMessage="Tidak ada admin ditemukan" />
        )}
      </div>
    </div>
  );
}

export default AdminManagement;
