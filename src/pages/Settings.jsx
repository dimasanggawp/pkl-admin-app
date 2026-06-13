import { useState, useEffect } from 'react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage } from '../services/toastService';

const DEFAULT_SETTINGS = {
  systemName: 'PKL System',
  geofenceRadius: 100,
  emailNotifications: true,
  smtpHost: '',
  smtpPort: 587,
  smtpFrom: '',
  reviewReminderDays: 3,
  maintenanceMode: false,
};

function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/settings');
        const data = response.data?.data || response.data;
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put('/admin/settings', settings);
      showSuccess('Pengaturan berhasil disimpan');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Memuat pengaturan...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Pengaturan Sistem</h1>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Pengaturan belum tersedia, menampilkan nilai default: {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-6">
        <div>
          <h2 className="font-bold text-lg mb-3">Sistem</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Nama Sistem</label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => handleChange('systemName', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="flex items-center">
              <input
                id="maintenanceMode"
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="maintenanceMode" className="ml-3 text-gray-700">
                Mode Maintenance
              </label>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-3">Geofence Default</h2>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Radius Geofence Default (meter)</label>
            <input
              type="number"
              min="10"
              max="5000"
              value={settings.geofenceRadius}
              onChange={(e) => handleChange('geofenceRadius', parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-3">Email</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="emailNotifications"
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-3 text-gray-700">
                Aktifkan Notifikasi Email
              </label>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">SMTP Host</label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => handleChange('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">SMTP Port</label>
              <input
                type="number"
                value={settings.smtpPort}
                onChange={(e) => handleChange('smtpPort', parseInt(e.target.value, 10) || 0)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Email Pengirim</label>
              <input
                type="text"
                value={settings.smtpFrom}
                onChange={(e) => handleChange('smtpFrom', e.target.value)}
                placeholder="PKL System <noreply@pklsystem.com>"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-3">Preferensi</h2>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Pengingat Review Jurnal Tertunda (hari)
            </label>
            <input
              type="number"
              min="1"
              value={settings.reviewReminderDays}
              onChange={(e) => handleChange('reviewReminderDays', parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}

export default Settings;
