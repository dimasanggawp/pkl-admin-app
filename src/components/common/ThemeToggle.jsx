import { Sun, Moon } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border
        bg-surface text-muted transition-colors duration-150
        hover:text-accent hover:border-accent
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Sun
        size={18}
        className={`absolute transition-all duration-300 ${
          isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
      />
      <Moon
        size={18}
        className={`absolute transition-all duration-300 ${
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'
        }`}
      />
    </button>
  );
}

export default ThemeToggle;
