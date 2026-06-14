import { useState } from 'react';
import API from '../services/api';
import { showError, showSuccess, getErrorMessage } from '../services/toastService';

const REPORT_TYPES = [
  { value: 'student', label: 'Laporan Siswa' },
  { value: 'guru', label: 'Laporan Guru' },
  { value: 'journal', label: 'Laporan Jurnal' },
  { value: 'presensi', label: 'Laporan Presensi' },
];

const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
];

function Reports() {
  const [reportType, setReportType] = useState('student');
  const [format, setFormat] = useState('pdf');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await API.get('/admin/reports/generate', {
        params: { type: reportType, format, dateFrom, dateTo },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportType}_${new Date().toISOString()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Laporan berhasil di-generate');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mb-6">Generate Laporan</h1>

      <div className="panel p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-ink font-bold mb-2">Jenis Laporan</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="field-input"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-ink font-bold mb-2">Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="field-input">
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-ink font-bold mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="block text-ink font-bold mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="field-input"
            />
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary w-full"
        >
          {exporting ? 'Generating...' : 'Generate Laporan'}
        </button>
      </div>
    </div>
  );
}

export default Reports;
