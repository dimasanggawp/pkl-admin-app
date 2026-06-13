import { Link } from 'react-router-dom';

function Unauthorized() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-2">403 - Akses Ditolak</h1>
      <p className="text-gray-500 mb-6">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      <Link to="/login" className="text-blue-600 hover:underline">
        Kembali ke halaman login
      </Link>
    </div>
  );
}

export default Unauthorized;
