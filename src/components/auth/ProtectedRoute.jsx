import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('admin_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const user = JSON.parse(localStorage.getItem('admin_user') || 'null');

    if (user?.role !== role) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
