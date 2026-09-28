import { useEffect, useState } from 'react';
import './DashboardShell.css';

export default function ThemeToggle({ className = 'shell-theme-button' }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('portalTheme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('portalTheme', theme);
  }, [theme]);

  return (
    <button
      type="button"
      className={className}
      onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
