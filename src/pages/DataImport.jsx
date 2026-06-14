import { useState } from 'react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage } from '../services/toastService';

const MAX_SIZE = 5 * 1024 * 1024;
const VALID_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function DataImport() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const validateFile = (selectedFile) => {
    if (selectedFile.size > MAX_SIZE) {
      showError('File terlalu besar (maksimal 5MB)');
      return false;
    }

    const hasValidExtension = VALID_EXTENSIONS.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      showError('Format file tidak valid. Gunakan Excel (.xlsx, .xls) atau CSV');
      return false;
    }

    return true;
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!validateFile(selectedFile)) {
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setPreview(null);
    setResult(null);
  };

  const handlePreview = async () => {
    if (!file) return;

    setPreviewing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await API.post('/admin/siswa/import/preview', formData);
      setPreview(response.data?.data || response.data);
      setResult(null);
    } catch (err) {
      showError(getErrorMessage(err));
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await API.post('/admin/siswa/import', formData);
      const data = response.data?.data || response.data;
      setResult(data);
      showSuccess(`Berhasil mengimpor ${data.importedCount ?? 0} siswa`);
      setFile(null);
      setPreview(null);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await API.get('/admin/siswa/import/template', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template-siswa.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mb-6">Import Data Siswa</h1>

      <div className="rounded-2xl border border-accent/20 bg-accent-soft p-4 mb-6">
        <p className="text-ink mb-2">
          Gunakan template Excel berikut agar format kolom sesuai dengan yang diharapkan sistem
          (NISN, Nama, Email, Kelas, Sekolah, Tempat PKL, dll).
        </p>
        <button onClick={downloadTemplate} className="text-accent hover:underline font-bold">
          Download Template
        </button>
      </div>

      {/* File Upload */}
      <div className="panel p-4 sm:p-6 mb-6">
        <label className="block text-ink font-bold mb-4">Pilih File Excel</label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="w-full mb-4 text-sm text-muted"
        />

        {file && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handlePreview}
              disabled={previewing}
              className="btn-secondary flex-1"
            >
              {previewing ? 'Memuat preview...' : 'Preview Data'}
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary flex-1"
            >
              {importing ? 'Mengimpor...' : 'Import Data'}
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="panel p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-bold text-ink mb-2">Preview</h2>
          <p className="text-sm text-muted mb-4">
            Total baris: {preview.totalRows} | Valid: {preview.validCount} | Error:{' '}
            {preview.errorCount}
          </p>

          {preview.valid?.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-sm text-left border border-border rounded-xl">
                <thead className="bg-surface-alt">
                  <tr>
                    <th className="px-3 py-2 text-ink">NISN</th>
                    <th className="px-3 py-2 text-ink">Nama</th>
                    <th className="px-3 py-2 text-ink">Kelas</th>
                    <th className="px-3 py-2 text-ink">Sekolah</th>
                    <th className="px-3 py-2 text-ink">Tempat PKL</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.valid.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="px-3 py-2 text-ink">{row.nisn}</td>
                      <td className="px-3 py-2 text-ink">{row.nama}</td>
                      <td className="px-3 py-2 text-ink">{row.kelas || '-'}</td>
                      <td className="px-3 py-2 text-ink">{row.sekolah || '-'}</td>
                      <td className="px-3 py-2 text-ink">{row.tempat_pkl || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.valid.length > 5 && (
                <p className="text-xs text-muted mt-1">
                  Menampilkan 5 dari {preview.valid.length} baris valid.
                </p>
              )}
            </div>
          )}

          {preview.errors?.length > 0 && (
            <div className="rounded-xl border border-danger/25 bg-danger/10 p-3">
              <h3 className="font-bold text-danger mb-2">Error pada {preview.errors.length} baris</h3>
              <ul className="text-sm text-danger space-y-1 list-disc list-inside">
                {preview.errors.slice(0, 10).map((err, idx) => (
                  <li key={idx}>
                    Baris {err.row} ({err.nisn || '-'}): {err.errors?.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Import Result */}
      {result && (
        <div className="rounded-2xl border border-success/25 bg-success/10 p-4 mb-6">
          <p className="text-success font-bold mb-1">Import selesai</p>
          <p className="text-sm text-success">
            Total baris: {result.totalRows} | Berhasil diimpor: {result.importedCount} | Dilewati:{' '}
            {result.skippedCount}
          </p>
        </div>
      )}
    </div>
  );
}

export default DataImport;
