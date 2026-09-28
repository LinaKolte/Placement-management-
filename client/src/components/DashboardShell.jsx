import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import './DashboardShell.css';
import ThemeToggle from './ThemeToggle';

const studentNav = [
  { id: 'profile', label: 'My Profile', icon: '○' },
  { id: 'drives', label: 'Placement Drives', icon: '▣' },
  { id: 'history', label: 'Drive History', icon: '◷' },
  { id: 'applications', label: 'My Applications', icon: '↗' },
  { id: 'notifications', label: 'Notifications', icon: '◌' },
];

const adminNav = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'companies', label: 'Companies & Drives', icon: '▣' },
  { id: 'applications', label: 'Applications', icon: '↗' },
  { id: 'interview-shortlist', label: 'Interview Shortlist', icon: '☆' },
  { id: 'placement-records', label: 'Placements & Analytics', icon: '✓' },
  { id: 'profile-verification', label: 'Profile Verification', icon: '◌' },
];

export default function DashboardShell({ role, active, onNavigate, user, onProfile, onSendNotification, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerNavigate = useNavigate();
  const navItems = role === 'admin' ? adminNav : studentNav;
  const initials = (user?.name || role || 'U')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function navigate(item) {
    if (item.id === 'profile' && onProfile) {
      onProfile();
      setMobileOpen(false);
      return;
    }

    if (item.id === 'notifications' && onNavigate) {
      onNavigate('notifications');
      setMobileOpen(false);
      return;
    }

    if (onNavigate) {
      onNavigate(item.id);
    }
    setMobileOpen(false);
  }

  function signOut() {
    ['studentToken', 'studentUser', 'adminToken', 'admin', 'user'].forEach((key) => localStorage.removeItem(key));
    routerNavigate(role === 'admin' ? '/admin/login' : '/login', { replace: true });
  }

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="shell-brand">
          <span className="shell-brand-mark">S</span>
          <span>Campus<span>Bridge</span></span>
        </div>
        <div className="shell-workspace">{role === 'admin' ? 'Placement office' : 'Student portal'}</div>
        <nav className="shell-nav" aria-label="Primary navigation">
          {navItems.map((item, index) => {
            const isActive = item.id === active && navItems.findIndex((candidate) => candidate.id === active) === index;
            return (
              <button
                key={`${item.label}-${index}`}
                type="button"
                className={`shell-nav-item shell-nav-item--${item.id} ${isActive ? 'is-active' : ''}`}
                onClick={() => navigate(item)}
              >
                <span className="shell-nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {role === 'admin' && onSendNotification && (
          <button type="button" className="shell-notification-button" onClick={onSendNotification}>
            <span className="shell-nav-icon" aria-hidden="true">✉</span>
            <span>Send notification</span>
          </button>
        )}

        <div className="shell-sidebar-footer">
          <div className="shell-help-dot">?</div>
          <div><strong>Need help?</strong><span>Contact placement office</span></div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button type="button" className="shell-menu-button" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">☰</button>
          <div className="shell-breadcrumb"><span>Workspace</span><b>/</b><strong>{role === 'admin' ? 'Admin console' : 'Student portal'}</strong></div>
          <div className="shell-topbar-actions">
            <ThemeToggle />
            <button type="button" className="shell-icon-button" onClick={() => window.location.href = '/notifications'} aria-label="Notifications">◌</button>
            <button type="button" className="shell-user-button" onClick={onProfile}>
              <span className="shell-avatar">{initials}</span>
              <span className="shell-user-copy"><strong>{user?.name || (role === 'admin' ? 'Placement admin' : 'Student')}</strong><small>{role === 'admin' ? 'Administrator' : user?.branch || 'Candidate'}</small></span>
              <span className="shell-chevron">⌄</span>
            </button>
            <button type="button" className="shell-icon-button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
