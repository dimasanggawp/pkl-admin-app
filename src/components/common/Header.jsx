import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

function Header({ onMenuClick }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Buka menu"
          className="rounded-xl p-2 text-muted hover:bg-surface-alt hover:text-ink lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-bold text-white text-lg">
            P
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold tracking-tight text-ink sm:text-lg">PKL Admin</h1>
            <p className="hidden text-[11px] uppercase tracking-[0.18em] text-muted sm:block">
              Panel Administrasi
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        {isAuthenticated && (
          <>
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm font-semibold text-ink">{user?.nisn_niy}</span>
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Admin</span>
            </div>
            <button
              onClick={logout}
              aria-label="Keluar"
              className="btn-ghost"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
