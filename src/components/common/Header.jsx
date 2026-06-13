import { useAuth } from '../../hooks/useAuth';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-blue-600 text-white px-4 py-3 shadow flex items-center justify-between">
      <h1 className="text-lg font-semibold">PKL Admin</h1>
      {isAuthenticated && (
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.nisn_niy}</span>
          <button
            onClick={logout}
            className="bg-blue-700 hover:bg-blue-800 rounded px-3 py-1 transition"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
