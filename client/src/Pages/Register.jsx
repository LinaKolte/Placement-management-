import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

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

const BOARD_ROWS = [
  { label: 'Companies on campus', value: '41' },
  { label: 'Students placed', value: '612' },
  { label: 'Highest package', value: '₹42.0 LPA' },
  { label: 'Average package', value: '₹8.6 LPA' },
  { label: 'Active drives this week', value: '5' },
];

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical',
  'Civil',
  'Electrical',
];

const NAV_LINKS = ['Drives', 'Companies', 'Resources', 'Contact'];

const COMPANIES = [
  {
    name: 'TCS',
    role: 'Assistant System Engineer',
    package: '₹3.6 LPA',
    minCgpa: 6.0,
    branches: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical', 'Civil', 'Electrical'],
    backlogs: 'No active backlogs',
    status: 'Open',
  },
  {
    name: 'Infosys',
    role: 'Systems Engineer',
    package: '₹4.2 LPA',
    minCgpa: 6.5,
    branches: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical', 'Civil', 'Electrical'],
    backlogs: 'No active backlogs',
    status: 'Open',
  },
  {
    name: 'Google',
    role: 'Software Engineer (Early Career)',
    package: '₹32.0 LPA',
    minCgpa: 8.5,
    branches: ['Computer Science', 'Information Technology'],
    backlogs: 'No active backlogs',
    status: 'Closing soon',
  },
  {
    name: 'Quantara Systems',
    role: 'Software Engineer (SDE-1)',
    package: '₹18.0 LPA',
    minCgpa: 7.5,
    branches: ['Computer Science', 'Information Technology'],
    backlogs: 'No active backlogs',
    status: 'Open',
  },
  {
    name: 'Northbridge Analytics',
    role: 'Data Analyst',
    package: '₹12.5 LPA',
    minCgpa: 7.0,
    branches: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
    backlogs: 'No active backlogs',
    status: 'Open',
  },
  {
    name: 'Ferrowatt Energy',
    role: 'Graduate Engineer Trainee',
    package: '₹9.2 LPA',
    minCgpa: 6.5,
    branches: ['Electrical', 'Mechanical', 'Civil'],
    backlogs: 'Max 1 standing backlog',
    status: 'Open',
  },
  {
    name: 'Veritas Cloud',
    role: 'Cloud Support Associate',
    package: '₹10.0 LPA',
    minCgpa: 6.5,
    branches: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
    backlogs: 'No active backlogs',
    status: 'Open',
  },
  {
    name: 'Harlow Structural',
    role: 'Site Engineer',
    package: '₹7.8 LPA',
    minCgpa: 6.0,
    branches: ['Civil'],
    backlogs: 'Max 2 standing backlogs',
    status: 'Closing soon',
  },
  {
    name: 'Meridian Robotics',
    role: 'Embedded Systems Engineer',
    package: '₹14.0 LPA',
    minCgpa: 7.5,
    branches: ['Electronics & Communication', 'Electrical'],
    backlogs: 'No active backlogs',
    status: 'Open',
  },
  {
    name: 'Pinegrove Consulting',
    role: 'Business Technology Analyst',
    package: '₹11.0 LPA',
    minCgpa: 7.0,
    branches: ['Computer Science', 'Information Technology', 'Mechanical', 'Electrical', 'Civil', 'Electronics & Communication'],
    backlogs: 'No active backlogs',
    status: 'Open',
  },
  {
    name: 'Castiron Motors',
    role: 'Design Engineer',
    package: '₹8.5 LPA',
    minCgpa: 6.5,
    branches: ['Mechanical'],
    backlogs: 'Max 1 standing backlog',
    status: 'Closing soon',
  },
  {
    name: 'Lumen Fintech',
    role: 'Software Engineer (Backend)',
    package: '₹20.0 LPA',
    minCgpa: 8.0,
    branches: ['Computer Science', 'Information Technology'],
    backlogs: 'No active backlogs',
    status: 'Open',
  },
  {
    name: 'Sablefield Research',
    role: 'Research Associate',
    package: '₹9.6 LPA',
    minCgpa: 7.2,
    branches: ['Electronics & Communication', 'Computer Science'],
    backlogs: 'No active backlogs',
    status: 'Open',
  },
];

const initialLogin = { email: '', password: '' };
const initialRegister = {
  name: '',
  email: '',
  rollNumber: '',
  branch: '',
  password: '',
  confirm: '',
};

const styles = {
  page: {
    minHeight: '100vh',
    width: '100vw',
    maxWidth: '100vw',
    margin: 0,
    fontFamily: fonts.body,
    color: colors.ink,
    background: colors.paper,
    overflowX: 'hidden',
  },

  /* ---- Top site header ---- */
  header: {
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(24px, 4vw, 64px)',
    height: 76,
    borderBottom: `1px solid ${colors.lineDark}`,
    background: colors.paper,
  },
  headerBrand: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: 700,
  },
  headerBrandDot: { color: colors.gold },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(20px, 2.5vw, 40px)',
  },
  navLink: (clickable) => ({
    fontSize: 14.5,
    color: colors.inkSoft,
    opacity: 0.75,
    fontWeight: 500,
    cursor: clickable ? 'pointer' : 'default',
    background: 'none',
    border: 'none',
    fontFamily: fonts.body,
    padding: 0,
    transition: 'opacity .15s ease',
  }),
  navCta: {
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 6,
    padding: '9px 18px',
    fontFamily: fonts.head,
    fontSize: 13.5,
    fontWeight: 600,
    color: colors.ink,
    background: 'transparent',
  },

  /* ---- Hero split section ---- */
  shell: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
  },
  boardPane: {
    position: 'relative',
    flex: '1 1 50%',
    background: colors.ink,
    color: colors.paper,
    padding: 'clamp(40px, 6vw, 96px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflow: 'hidden',
    minHeight: 'calc(100vh - 76px)',
    boxSizing: 'border-box',
  },
  boardGlow: {
    position: 'absolute',
    width: '46vw',
    height: '46vw',
    maxWidth: 760,
    maxHeight: 760,
    background: 'radial-gradient(circle, rgba(217,164,65,0.20) 0%, rgba(217,164,65,0) 70%)',
    top: '-14vw',
    right: '-14vw',
    pointerEvents: 'none',
  },
  eyebrow: {
    position: 'relative',
    fontFamily: fonts.head,
    fontSize: 12.5,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: colors.goldSoft,
    margin: '0 0 18px',
  },
  boardTag: {
    position: 'relative',
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 'clamp(26px, 3vw, 46px)',
    fontWeight: 500,
    lineHeight: 1.22,
    maxWidth: 600,
    margin: 0,
    opacity: 0.95,
  },
  boardCard: {
    position: 'relative',
    background: colors.inkSoft,
    border: `1px solid ${colors.line}`,
    borderRadius: 8,
    padding: 'clamp(24px, 2.2vw, 36px) clamp(22px, 2vw, 32px) clamp(20px, 2vw, 28px)',
    maxWidth: 480,
    width: '100%',
  },
  boardKicker: {
    fontFamily: fonts.head,
    fontSize: 12,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: colors.goldSoft,
    margin: '0 0 18px',
  },
  boardRow: (first) => ({
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderTop: first ? 'none' : `1px solid ${colors.line}`,
  }),
  boardLabel: { fontSize: 14.5, opacity: 0.65 },
  boardValue: {
    fontFamily: fonts.head,
    fontVariantNumeric: 'tabular-nums',
    fontSize: 20,
    fontWeight: 600,
  },
  boardNote: {
    position: 'relative',
    fontSize: 14,
    lineHeight: 1.65,
    opacity: 0.55,
    maxWidth: 480,
    margin: 0,
  },
  formPane: {
    flex: '1 1 50%',
    background: colors.paper,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(40px, 6vw, 96px) clamp(28px, 5vw, 80px)',
    minHeight: 'calc(100vh - 76px)',
    boxSizing: 'border-box',
  },
  formCard: { width: '100%', maxWidth: 520 },
  roleToggle: {
    display: 'inline-flex',
    background: '#fff',
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 30,
    padding: 5,
    marginBottom: 'clamp(28px, 3vw, 40px)',
  },
  roleTab: (active) => ({
    border: 'none',
    background: active ? colors.ink : 'transparent',
    padding: '11px 22px',
    borderRadius: 24,
    fontFamily: fonts.head,
    fontSize: 14,
    fontWeight: 600,
    color: active ? colors.paper : colors.inkSoft,
    opacity: active ? 1 : 0.6,
    cursor: 'pointer',
    transition: 'background .15s ease, opacity .15s ease, color .15s ease',
  }),
  formHead: { marginBottom: 'clamp(24px, 3vw, 34px)' },
  h1: {
    fontFamily: fonts.display,
    fontSize: 'clamp(30px, 3vw, 42px)',
    fontWeight: 600,
    margin: '0 0 10px',
    lineHeight: 1.15,
  },
  subtitle: { fontSize: 15.5, color: colors.inkSoft, opacity: 0.7, margin: 0, lineHeight: 1.55 },
  banner: (kind) => ({
    padding: '12px 16px',
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 20,
    background: kind === 'error' ? 'rgba(192,69,58,0.1)' : 'rgba(51,99,90,0.1)',
    border: `1px solid ${kind === 'error' ? 'rgba(192,69,58,0.35)' : 'rgba(51,99,90,0.35)'}`,
    color: kind === 'error' ? colors.red : colors.teal,
  }),
  field: { display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18, textAlign: 'left' },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  label: {
    fontFamily: fonts.head,
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: colors.inkSoft,
    opacity: 0.7,
  },
  input: {
    padding: '14px 16px',
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 6,
    fontSize: 16,
    background: '#fff',
    color: colors.ink,
    fontFamily: fonts.body,
    width: '100%',
    boxSizing: 'border-box',
  },
  btn: (variant) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15px 26px',
    borderRadius: 6,
    fontFamily: fonts.head,
    fontWeight: 600,
    fontSize: 15.5,
    border: '1px solid transparent',
    marginTop: 8,
    width: '100%',
    cursor: 'pointer',
    background: variant === 'gold' ? colors.gold : colors.ink,
    color: variant === 'gold' ? colors.ink : colors.paper,
  }),
  footer: { marginTop: 26, fontSize: 14.5, color: colors.inkSoft, textAlign: 'center' },
  muted: { opacity: 0.55 },
  linkBtn: {
    border: 'none',
    background: 'none',
    padding: 0,
    color: colors.teal,
    fontWeight: 600,
    fontSize: 14.5,
    borderBottom: `1px solid ${colors.teal}`,
    cursor: 'pointer',
  },

  /* ---- Bottom site footer ---- */
  siteFooter: {
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '22px clamp(24px, 4vw, 64px)',
    borderTop: `1px solid ${colors.lineDark}`,
    fontSize: 13,
    color: colors.inkSoft,
    opacity: 0.6,
  },

  /* ---- Companies modal ---- */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,22,38,0.55)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 'clamp(20px, 4vw, 56px) 16px',
    overflowY: 'auto',
    zIndex: 50,
  },
  modal: {
    background: colors.paper,
    width: '100%',
    maxWidth: 880,
    borderRadius: 10,
    boxShadow: '0 24px 64px rgba(15,22,38,0.35)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    padding: 'clamp(24px, 3vw, 36px) clamp(24px, 3vw, 36px) 20px',
    borderBottom: `1px solid ${colors.lineDark}`,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 'clamp(24px, 2.4vw, 30px)',
    fontWeight: 600,
    margin: '0 0 6px',
  },
  modalSub: { fontSize: 14.5, color: colors.inkSoft, opacity: 0.7, margin: 0 },
  closeBtn: {
    border: `1px solid ${colors.lineDark}`,
    background: '#fff',
    borderRadius: 6,
    width: 34,
    height: 34,
    flex: '0 0 auto',
    fontSize: 16,
    lineHeight: 1,
    cursor: 'pointer',
    color: colors.ink,
  },
  companyList: {
    maxHeight: '64vh',
    overflowY: 'auto',
    padding: 'clamp(20px, 3vw, 32px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  companyRow: {
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 8,
    padding: '18px 20px',
    background: '#fff',
  },
  companyTop: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  companyName: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: 600,
    margin: 0,
  },
  companyPackage: {
    fontFamily: fonts.head,
    fontSize: 14.5,
    fontWeight: 700,
    color: colors.teal,
  },
  companyRole: {
    fontSize: 14.5,
    color: colors.inkSoft,
    margin: '0 0 12px',
  },
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  pill: {
    fontSize: 12.5,
    fontFamily: fonts.head,
    padding: '5px 11px',
    borderRadius: 20,
    background: 'rgba(15,22,38,0.06)',
    color: colors.inkSoft,
  },
  statusPill: (status) => ({
    fontSize: 12.5,
    fontFamily: fonts.head,
    fontWeight: 600,
    padding: '5px 11px',
    borderRadius: 20,
    background: status === 'Open' ? 'rgba(51,99,90,0.12)' : 'rgba(192,69,58,0.12)',
    color: status === 'Open' ? colors.teal : colors.red,
  }),
  eligibilityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '6px 18px',
    fontSize: 13.5,
    color: colors.inkSoft,
  },
  eligLabel: { opacity: 0.6, marginRight: 5 },
};

export default function App() {
  useEffect(() => {
    // Defensive reset: clear any width/centering rules a host project's
    // global CSS (e.g. Create React App's default App.css) might apply
    // to html/body/#root, so this page always renders edge-to-edge.
    const targets = [document.documentElement, document.body, document.getElementById('root')].filter(Boolean);
    const previous = targets.map((el) => el.getAttribute('style'));
    targets.forEach((el) => {
      el.style.margin = '0';
      el.style.padding = '0';
      el.style.width = '100%';
      el.style.maxWidth = 'none';
      el.style.textAlign = 'initial';
      el.style.display = 'block';
    });
    return () => {
      targets.forEach((el, i) => {
        if (previous[i] === null) el.removeAttribute('style');
        else el.setAttribute('style', previous[i]);
      });
    };
  }, []);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('student'); // 'student' | 'admin'
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCompanies, setShowCompanies] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showCompanies) return;
    function onKey(e) {
      if (e.key === 'Escape') setShowCompanies(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCompanies]);

  function switchMode(next) {
    setMode(next);
    setError('');
    setSuccess('');
  }

  function switchRole(next) {
    setRole(next);
    if (next === 'admin' && mode === 'register') setMode('login');
    setError('');
    setSuccess('');
  }

  function handleLoginChange(e) {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  }

  function handleRegisterChange(e) {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  }

  async function handleLoginSubmit(e) {
  e.preventDefault();
  setError('');

  if (!loginForm.email || !loginForm.password) {
    setError('Enter your email and password to continue.');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
        role,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to sign in right now.');
    }

    localStorage.setItem('studentToken', data.token);
    localStorage.setItem('studentUser', JSON.stringify(data.student));

    setSuccess(
      `Welcome back — signed in as ${
        role === 'admin' ? 'placement office' : 'student'
      }.`
    );

    setLoginForm(initialLogin);

    // 🔥 ADD THIS (THIS IS THE FIX)
    if (role === "student") {
      navigate("/student");
    } else if (role === "admin") {
      navigate("/admin"); // if you have admin page
    }

  } catch (err) {
    setError(err.message || 'Unable to sign in right now.');
  }
}

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setError('');
    if (registerForm.password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (registerForm.password !== registerForm.confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: registerForm.name.trim(),
          email: registerForm.email.trim().toLowerCase(),
          password: registerForm.password,
          phone: '',
          rollNumber: registerForm.rollNumber.trim(),
          branch: registerForm.branch,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create account right now.');
      }

      setSuccess(data.message || 'Account created. You can now sign in.');
      setMode('login');
      setLoginForm({ email: registerForm.email, password: '' });
      setRegisterForm(initialRegister);
    } catch (err) {
      setError(err.message || 'Unable to create account right now.');
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.headerBrand}>
          CampusBridge<span style={styles.headerBrandDot}>.</span>
        </span>
        <nav style={styles.nav}>
          {NAV_LINKS.map((link) =>
            link === 'Companies' ? (
              <button
                type="button"
                style={styles.navLink(true)}
                key={link}
                onClick={() => setShowCompanies(true)}
              >
                {link}
              </button>
            ) : (
              <span style={styles.navLink(false)} key={link}>
                {link}
              </span>
            )
          )}
          <button type="button" style={styles.navCta}>
            Need help?
          </button>
        </nav>
      </header>

      <div style={styles.shell}>
        <aside style={styles.boardPane}>
          <div style={styles.boardGlow} />
          <div>
            <p style={styles.eyebrow}>Class of 2026 · Placement season is open</p>
            <p style={styles.boardTag}>One board for every drive, every offer, every student.</p>
          </div>

          <div style={styles.boardCard}>
            <p style={styles.boardKicker}>Placement drive board — live</p>
            <div>
              {BOARD_ROWS.map((row, i) => (
                <div style={styles.boardRow(i === 0)} key={row.label}>
                  <span style={styles.boardLabel}>{row.label}</span>
                  <span style={styles.boardValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={styles.boardNote}>
            Register once as a student to apply to every company that visits this season, or
            sign in as the placement office to manage drives. Tap{' '}
            <span
              style={{ textDecoration: 'underline', cursor: 'pointer', color: colors.goldSoft }}
              onClick={() => setShowCompanies(true)}
            >
              Companies
            </span>{' '}
            above to see who's hiring and the eligibility criteria.
          </p>
        </aside>

        <main style={styles.formPane}>
          <div style={styles.formCard}>
            <div style={styles.roleToggle}>
              <button type="button" style={styles.roleTab(role === 'student')} onClick={() => switchRole('student')}>
                Student
              </button>
              <button type="button" style={styles.roleTab(role === 'admin')} onClick={() => switchRole('admin')}>
                Placement office
              </button>
            </div>

            <div style={styles.formHead}>
              <h1 style={styles.h1}>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
              <p style={styles.subtitle}>
                {mode === 'login'
                  ? role === 'admin'
                    ? 'Sign in to manage drives and review registrations.'
                    : 'Sign in to track applications and upcoming drives.'
                  : 'Register once to apply to every drive this season.'}
              </p>
            </div>

            {error && <div style={styles.banner('error')}>{error}</div>}
            {success && !error && <div style={styles.banner('success')}>{success}</div>}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} noValidate>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="login-email">
                    {role === 'admin' ? 'Admin email' : 'College email'}
                  </label>
                  <input
                    style={styles.input}
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder={role === 'admin' ? 'admin@campus.edu' : 'you@college.edu'}
                    value={loginForm.email}
                    onChange={handleLoginChange}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="login-password">
                    Password
                  </label>
                  <input
                    style={styles.input}
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                  />
                </div>
                <button type="submit" style={styles.btn(role === 'admin' ? 'gold' : 'primary')}>
                  Sign in
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} noValidate>
                <div style={styles.fieldRow}>
                  <div style={styles.field}>
                    <label style={styles.label} htmlFor="reg-name">
                      Full name
                    </label>
                    <input
                      style={styles.input}
                      id="reg-name"
                      name="name"
                      placeholder="Asha Mehta"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label} htmlFor="reg-roll">
                      Roll number
                    </label>
                    <input
                      style={styles.input}
                      id="reg-roll"
                      name="rollNumber"
                      placeholder="21CS1042"
                      value={registerForm.rollNumber}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label} htmlFor="reg-email">
                    College email
                  </label>
                  <input
                    style={styles.input}
                    id="reg-email"
                    name="email"
                    type="email"
                    placeholder="you@college.edu"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label} htmlFor="reg-branch">
                    Branch
                  </label>
                  <select
                    style={styles.input}
                    id="reg-branch"
                    name="branch"
                    value={registerForm.branch}
                    onChange={handleRegisterChange}
                  >
                    <option value="" disabled>
                      Select branch
                    </option>
                    {BRANCHES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.fieldRow}>
                  <div style={styles.field}>
                    <label style={styles.label} htmlFor="reg-password">
                      Password
                    </label>
                    <input
                      style={styles.input}
                      id="reg-password"
                      name="password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label} htmlFor="reg-confirm">
                      Confirm
                    </label>
                    <input
                      style={styles.input}
                      id="reg-confirm"
                      name="confirm"
                      type="password"
                      placeholder="Re-enter password"
                      value={registerForm.confirm}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <button type="submit" style={styles.btn('primary')}>
                  Create account
                </button>
              </form>
            )}

            <div style={styles.footer}>
              {role === 'student' ? (
                mode === 'login' ? (
                  <p>
                    New here?{' '}
                    <button type="button" style={styles.linkBtn} onClick={() => switchMode('register')}>
                      Create a student account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already registered?{' '}
                    <button type="button" style={styles.linkBtn} onClick={() => switchMode('login')}>
                      Sign in instead
                    </button>
                  </p>
                )
              ) : (
                <p style={styles.muted}>Demo credentials: admin@campus.edu / admin123</p>
              )}
            </div>
          </div>
        </main>
      </div>

      <footer style={styles.siteFooter}>
        <span>© 2026 CampusBridge — Placement cell portal</span>
        <span>Trouble signing in? Reach the placement office at placements@campus.edu</span>
      </footer>

      {showCompanies && (
        <div style={styles.overlay} onClick={() => setShowCompanies(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Companies on campus</h2>
                <p style={styles.modalSub}>
                  {COMPANIES.length} companies currently recruiting — roles, packages, and eligibility criteria.
                </p>
              </div>
              <button
                type="button"
                style={styles.closeBtn}
                onClick={() => setShowCompanies(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div style={styles.companyList}>
              {COMPANIES.map((c) => (
                <div style={styles.companyRow} key={c.name}>
                  <div style={styles.companyTop}>
                    <h3 style={styles.companyName}>{c.name}</h3>
                    <span style={styles.companyPackage}>{c.package}</span>
                  </div>
                  <p style={styles.companyRole}>{c.role}</p>
                  <div style={styles.pillRow}>
                    <span style={styles.statusPill(c.status)}>{c.status}</span>
                    <span style={styles.pill}>Min CGPA {c.minCgpa.toFixed(1)}</span>
                    <span style={styles.pill}>{c.backlogs}</span>
                  </div>
                  <div style={styles.eligibilityGrid}>
                    <div>
                      <span style={styles.eligLabel}>Eligible branches:</span>
                      {c.branches.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}