import { useState, useEffect } from 'react';

const colors = {
  ink: '#0F1626',
  inkSoft: '#1B2438',
  paper: '#F5F2EA',
  gold: '#D9A441',
  goldSoft: '#F0CD8C',
  teal: '#33635A',
  red: '#C0453A',
  line: 'rgba(245,242,234,0.14)',
  lineDark: 'rgba(15,22,38,0.12)',
};

const fonts = {
  display: "'Georgia', serif",
  head: "'Helvetica Neue', Arial, sans-serif",
  body: "'Helvetica Neue', Arial, sans-serif",
};

const API_BASE = 'http://localhost:5000';

const styles = {
  page: {
    minHeight: '100vh',
    width: '100vw',
    maxWidth: '100vw',
    marginLeft: 'calc(50% - 50vw)',
    marginRight: 'calc(50% - 50vw)',
    fontFamily: fonts.body,
    color: colors.ink,
    background: colors.paper,
    boxSizing: 'border-box',
  },
  header: {
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(28px, 5vw, 80px)',
    height: 72,
    borderBottom: `1px solid ${colors.lineDark}`,
    background: colors.paper,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  brand: { fontFamily: fonts.display, fontSize: 21, fontWeight: 700 },
  brandDot: { color: colors.gold },
  body: { width: '100%', boxSizing: 'border-box', maxWidth: 1920, margin: '0 auto', padding: 'clamp(24px, 3vw, 48px) clamp(28px, 5vw, 80px) 80px' },
  intro: { marginBottom: 32 },
  h1: { fontFamily: fonts.display, fontSize: 'clamp(26px, 2.6vw, 34px)', fontWeight: 600, margin: '0 0 6px' },
  introSub: { fontSize: 14.5, opacity: 0.65, margin: 0 },
  container: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 },
  card: { border: `1px solid ${colors.lineDark}`, borderRadius: 10, background: '#fff', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10 },
  notificationTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: 600, margin: 0 },
  company: { fontSize: 13, opacity: 0.6, margin: '4px 0 0' },
  badge: (type) => ({
    fontSize: 11.5, fontFamily: fonts.head, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
    background:
      type === 'Shortlisted' ? 'rgba(217,164,65,0.18)' :
      type === 'Selected' ? 'rgba(51,99,90,0.14)' :
      type === 'Rejected' ? 'rgba(192,69,58,0.12)' :
      'rgba(15,22,38,0.07)',
    color:
      type === 'Shortlisted' ? '#9A6B12' :
      type === 'Selected' ? colors.teal :
      type === 'Rejected' ? colors.red :
      colors.inkSoft,
  }),
  message: { fontSize: 14, lineHeight: 1.6, color: colors.ink, margin: '8px 0' },
  timestamp: { fontSize: 12, opacity: 0.5, marginTop: 8 },
  emptyState: { border: `1px dashed ${colors.lineDark}`, borderRadius: 10, padding: '40px 24px', textAlign: 'center', color: colors.inkSoft },
  emptyTitle: { fontFamily: fonts.display, fontSize: 18, margin: '0 0 6px' },
  emptySub: { fontSize: 13.5, opacity: 0.6, margin: 0 },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get student ID from localStorage or session
  const studentId = localStorage.getItem('studentId') || 'student123';

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/api/apply/notifications/${studentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Unable to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          placement<span style={styles.brandDot}>.</span>
        </div>
      </header>

      <div style={styles.body}>
        <div style={styles.intro}>
          <h1 style={styles.h1}>Notifications</h1>
          <p style={styles.introSub}>Stay updated with your application status</p>
        </div>

        {error && (
          <div style={{ ...styles.emptyState, marginBottom: 24 }}>
            <p style={styles.emptySub}>{error}</p>
            <button
              onClick={fetchNotifications}
              style={{
                marginTop: 12,
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                background: colors.ink,
                color: colors.paper,
                cursor: 'pointer',
                fontFamily: fonts.head,
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {loading && (
          <div style={styles.emptyState}>
            <p style={styles.emptySub}>Loading notifications...</p>
          </div>
        )}

        {!loading && notifications.length === 0 && !error && (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No notifications yet</h3>
            <p style={styles.emptySub}>When companies shortlist or select you, you'll see notifications here.</p>
          </div>
        )}

        {notifications.length > 0 && (
          <div style={styles.container}>
            {notifications.map((notification) => (
              <div key={notification._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.notificationTitle}>{notification.companyName}</p>
                    <p style={styles.company}>{notification.type}</p>
                  </div>
                  <span style={styles.badge(notification.type)}>
                    {notification.type}
                  </span>
                </div>
                <p style={styles.message}>{notification.message}</p>
                <p style={styles.timestamp}>{formatDate(notification.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
