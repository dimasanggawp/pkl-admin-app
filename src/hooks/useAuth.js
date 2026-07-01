import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('admin_user') || 'null');
  const token = localStorage.getItem('admin_token');

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    logout,
  };
}
