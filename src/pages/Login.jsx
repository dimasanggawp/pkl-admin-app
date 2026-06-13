import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage } from '../services/toastService';

function Login() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post('/auth/login', credentials);
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      showSuccess('Login berhasil!');
      navigate('/');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h2 className="text-xl font-semibold text-center mb-6">Login Admin</h2>
        <LoginForm onSubmit={handleLogin} error={error} loading={loading} />
      </div>
    </div>
  );
}

export default Login;
