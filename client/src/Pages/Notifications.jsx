import { useEffect, useState } from 'react';
import DashboardShell from '../components/DashboardShell';

const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

const colors = {
  ink: '#111111',
  muted: '#5a5a5a',
  line: '#e7e7e7',
  paper: '#ffffff',
  teal: '#111111',
  tealSoft: '#f3f3f3',
  gold: '#666666',
  red: '#333333',
};

const styles = {
  body: { width: '100%', boxSizing: 'border-box', maxWidth: 'none', minHeight: 'calc(100vh - 156px)', margin: '0 auto', padding: 'clamp(22px, 4vw, 42px)', background: colors.paper, border: `1px solid ${colors.line}`, borderRadius: 18, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)' },
  intro: { marginBottom: 26 },
  eyebrow: { color: colors.teal, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' },
  h1: { color: colors.ink, fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(25px, 3vw, 34px)', letterSpacing: '-0.7px', margin: 0 },
  introSub: { color: colors.muted, fontSize: 13.5, margin: '7px 0 0' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 },
  card: { border: `1px solid ${colors.line}`, borderRadius: 14, background: colors.paper, padding: '18px 20px', boxShadow: '0 10px 28px rgba(20,45,50,0.05)' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 13 },
  company: { color: colors.ink, fontSize: 14, fontWeight: 700, margin: 0 },
  type: { color: colors.muted, fontSize: 11.5, margin: '4px 0 0' },
  badge: (type) => ({
    borderRadius: 20,
    padding: '5px 9px',
    background: type === 'Rejected' ? 'rgba(207,91,86,.12)' : type === 'Shortlisted' ? 'rgba(212,154,52,.16)' : colors.tealSoft,
    color: type === 'Rejected' ? colors.red : type === 'Shortlisted' ? '#9A6B12' : colors.teal,
    fontSize: 10.5,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  }),
  message: { color: colors.ink, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 14px' },
  timestamp: { color: colors.muted, fontSize: 11.5, margin: 0 },
  state: { border: `1px dashed ${colors.line}`, borderRadius: 14, background: colors.paper, padding: '44px 24px', textAlign: 'center' },
  stateTitle: { color: colors.ink, fontSize: 17, fontWeight: 700, margin: '0 0 6px' },
  stateText: { color: colors.muted, fontSize: 13, margin: 0 },
  retry: { marginTop: 16, border: 0, borderRadius: 8, padding: '9px 14px', background: colors.teal, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
  dismiss: { border: `1px solid ${colors.line}`, borderRadius: 8, padding: '7px 10px', background: colors.paper, color: colors.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissingId, setDismissingId] = useState(null);
  const studentId = (() => {
    try {
      const rawStudent = localStorage.getItem('studentUser') || localStorage.getItem('user');
      const student = rawStudent ? JSON.parse(rawStudent) : null;
      return student?.rollNumber || student?.id || '';
    } catch (parseError) {
      return '';
    }
  })();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/api/apply/notifications/${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error('Error fetching notifications:', requestError);
      setError('Unable to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function dismissNotification(notificationId) {
    try {
      setDismissingId(notificationId);
      const response = await fetch(`${API_BASE}/api/apply/notifications/${notificationId}/${studentId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to dismiss notification');
      setNotifications((current) => current.filter((notification) => notification._id !== notificationId));
    } catch (requestError) {
      console.error('Error dismissing notification:', requestError);
      setError('Unable to dismiss this notification. Please try again.');
    } finally {
      setDismissingId(null);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <DashboardShell role="student" active="notifications" user={{ name: 'Student' }}>
      <div style={styles.body}>
        <div style={styles.intro}>
          <p style={styles.eyebrow}>Communication centre</p>
          <h1 style={styles.h1}>Notifications</h1>
          <p style={styles.introSub}>Stay updated with application decisions, interviews, and placement announcements.</p>
        </div>

        {loading && <div style={styles.state}><p style={styles.stateText}>Loading notifications...</p></div>}

        {!loading && error && (
          <div style={styles.state}>
            <p style={styles.stateTitle}>Notifications are unavailable</p>
            <p style={styles.stateText}>{error}</p>
            <button type="button" onClick={fetchNotifications} style={styles.retry}>Try again</button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div style={styles.state}>
            <p style={styles.stateTitle}>No notifications yet</p>
            <p style={styles.stateText}>Updates from the placement office and companies will appear here.</p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div style={styles.cardGrid}>
            {notifications.map((notification) => (
              <article key={notification._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.company}>{notification.companyName || 'Placement Office'}</p>
                    <p style={styles.type}>{notification.type || 'Update'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={styles.badge(notification.type)}>{notification.type || 'Update'}</span>
                    <button
                      type="button"
                      style={styles.dismiss}
                      onClick={() => dismissNotification(notification._id)}
                      disabled={dismissingId === notification._id}
                      aria-label={`Dismiss notification from ${notification.companyName || 'Placement Office'}`}
                    >
                      {dismissingId === notification._id ? 'Dismissing...' : 'Dismiss'}
                    </button>
                  </div>
                </div>
                <p style={styles.message}>{notification.message}</p>
                <p style={styles.timestamp}>{formatDate(notification.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
