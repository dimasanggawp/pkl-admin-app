import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    logout,
  };
}
