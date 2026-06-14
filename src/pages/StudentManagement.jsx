import { useState, useEffect } from 'react';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage, confirmAction } from '../services/toastService';
import DataTable from '../components/admin/DataTable';
import FilterPanel from '../components/admin/FilterPanel';

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/siswa', {
          params: {
            search,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            page: currentPage,
            limit: 10,
          },
        });
        const payload = response.data?.data || response.data;
        setStudents(Array.isArray(payload) ? payload : []);
        setTotalPages(response.data?.totalPages || response.data?.pages || 1);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        setStudents([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [search, statusFilter, currentPage, refreshKey]);

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Hapus data siswa ini?',
      text: 'Data yang dihapus dapat dipulihkan melalui menu Trash.',
      confirmButtonText: 'Hapus',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await API.delete(`/admin/siswa/${id}`);
      showSuccess('Siswa berhasil dihapus');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingStudent?.id) {
        await API.put(`/admin/siswa/${editingStudent.id}`, formData);
        showSuccess('Data siswa berhasil diperbarui');
      } else {
        await API.post('/admin/siswa', formData);
        showSuccess('Siswa berhasil ditambahkan');
      }
      setShowForm(false);
      setEditingStudent(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'nisn', label: 'NISN' },
    { key: 'nama', label: 'Nama' },
    { key: 'kelas', label: 'Kelas' },
    { key: 'tempat_pkl', label: 'Tempat PKL', render: (row) => row.tempat_pkl || '-' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const active = row.User?.is_active ?? row.is_active ?? true;
        return (
          <span
            className={`badge ${
              active ? 'bg-success/10 text-success' : 'bg-surface-alt text-muted'
            }`}
          >
            {active ? 'active' : 'inactive'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="space-x-2">
          <button
            onClick={() => {
              setEditingStudent(row);
              setShowForm(true);
            }}
            className="text-accent hover:underline"
          >
            Edit
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-danger hover:underline">
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Data Siswa</h1>
        <button
          onClick={() => {
            setEditingStudent(null);
            setShowForm(!showForm);
          }}
          className="btn-primary"
        >
          {showForm ? 'Batal' : 'Tambah Siswa'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
          Data siswa belum tersedia: {error}
        </div>
      )}

      {/* Filters */}
      <FilterPanel>
        <input
          type="text"
          placeholder="Cari nama atau NISN..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="field-input flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="field-input w-auto"
        >
          <option value="all">Semua Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterPanel>

      {/* Form */}
      {showForm && (
        <div className="mt-6">
          <StudentForm student={editingStudent} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Student Table */}
      <div className="mt-6">
        {loading ? (
          <div className="p-6 text-center text-muted">Memuat data siswa...</div>
        ) : (
          <DataTable columns={columns} data={students} emptyMessage="Tidak ada siswa ditemukan" />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page ? 'bg-accent text-white' : 'bg-surface-alt text-ink hover:bg-border'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentForm({ student, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    student || {
      nisn: '',
      nama: '',
      kelas: '',
      tempat_pkl: '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="panel p-4 sm:p-6">
      <h3 className="text-xl font-bold text-ink mb-4">{student ? 'Edit' : 'Tambah'} Siswa</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="NISN"
          value={formData.nisn}
          onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
          className="field-input"
          required
        />
        <input
          type="text"
          placeholder="Nama Lengkap"
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          className="field-input"
          required
        />
        <input
          type="text"
          placeholder="Kelas"
          value={formData.kelas}
          onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
          className="field-input"
        />
        <input
          type="text"
          placeholder="Tempat PKL"
          value={formData.tempat_pkl}
          onChange={(e) => setFormData({ ...formData, tempat_pkl: e.target.value })}
          className="field-input md:col-span-2"
        />
      </div>

      {!student && (
        <p className="mt-4 text-sm text-muted">
          Password awal akun siswa akan otomatis diatur sama dengan NISN. Informasikan NISN
          sebagai username dan password awal kepada siswa agar dapat login.
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <button type="submit" className="btn-primary">
          Simpan
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
      </div>
    </form>
  );
}

export default StudentManagement;
