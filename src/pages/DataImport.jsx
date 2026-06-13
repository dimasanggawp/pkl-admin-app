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
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Import Data Siswa</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-700 mb-2">
          Gunakan template Excel berikut agar format kolom sesuai dengan yang diharapkan sistem
          (NISN, Nama, Email, Kelas, Sekolah, Tempat PKL, dll).
        </p>
        <button onClick={downloadTemplate} className="text-blue-600 hover:underline font-bold">
          Download Template
        </button>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <label className="block text-gray-700 font-bold mb-4">Pilih File Excel</label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="w-full mb-4"
        />

        {file && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handlePreview}
              disabled={previewing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg transition"
            >
              {previewing ? 'Memuat preview...' : 'Preview Data'}
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg transition"
            >
              {importing ? 'Mengimpor...' : 'Import Data'}
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-bold mb-2">Preview</h2>
          <p className="text-sm text-gray-600 mb-4">
            Total baris: {preview.totalRows} | Valid: {preview.validCount} | Error:{' '}
            {preview.errorCount}
          </p>

          {preview.valid?.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-sm text-left border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2">NISN</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Kelas</th>
                    <th className="px-3 py-2">Sekolah</th>
                    <th className="px-3 py-2">Tempat PKL</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.valid.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{row.nisn}</td>
                      <td className="px-3 py-2">{row.nama}</td>
                      <td className="px-3 py-2">{row.kelas || '-'}</td>
                      <td className="px-3 py-2">{row.sekolah || '-'}</td>
                      <td className="px-3 py-2">{row.tempat_pkl || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.valid.length > 5 && (
                <p className="text-xs text-gray-400 mt-1">
                  Menampilkan 5 dari {preview.valid.length} baris valid.
                </p>
              )}
            </div>
          )}

          {preview.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="font-bold text-red-700 mb-2">Error pada {preview.errors.length} baris</h3>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700 font-bold mb-1">Import selesai</p>
          <p className="text-sm text-green-700">
            Total baris: {result.totalRows} | Berhasil diimpor: {result.importedCount} | Dilewati:{' '}
            {result.skippedCount}
          </p>
        </div>
      )}
    </div>
  );
}

export default DataImport;
