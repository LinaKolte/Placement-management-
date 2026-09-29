import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from '../components/ThemeToggle';

const API_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL || window.location.origin;
const GOOGLE_INITIALIZED_KEY = '__campusBridgeGoogleClientId';

async function readJsonResponse(response) {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`The server returned an empty response (HTTP ${response.status}).`);
  }

  try {
    return JSON.parse(body);
  } catch {
    const contentType = response.headers.get('content-type') || 'unknown content type';
    throw new Error(`The server returned a non-JSON response (HTTP ${response.status}, ${contentType}).`);
  }
}





const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical',
  'Civil',
  'Electrical',
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
  const [role, setRole] = useState(() => window.location.pathname.startsWith('/admin') ? 'admin' : 'student'); // 'student' | 'admin'
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [showAdminReset, setShowAdminReset] = useState(false);
  const [adminResetRequested, setAdminResetRequested] = useState(false);
  const [adminResetForm, setAdminResetForm] = useState({ code: '', newEmail: '', newPassword: '' });
  const [adminResetBusy, setAdminResetBusy] = useState(false);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCompanies, setShowCompanies] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  let loginEmailLabel = 'College email';
  let adminResetSubmitLabel = 'Email me a reset code';
  if (role === 'admin') {
    loginEmailLabel = 'Admin email';
    if (showAdminReset) loginEmailLabel = 'Current admin email';
  }
  if (adminResetBusy) adminResetSubmitLabel = 'Please wait...';
  else if (adminResetRequested) adminResetSubmitLabel = 'Update admin credentials';

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || role !== 'student' || !window.google?.accounts?.id || window[GOOGLE_INITIALIZED_KEY] === clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const serverResponse = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential }),
          });

          const data = await readJsonResponse(serverResponse);

          if (!serverResponse.ok) {
            throw new Error(data.message || 'Google login failed.');
          }

          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin');
          localStorage.setItem('studentToken', data.token);
          localStorage.setItem('studentUser', JSON.stringify(data.student));
          localStorage.setItem('user', JSON.stringify(data.user || data.student));
          setSuccess('Signed in with Google successfully.');
          setError('');
          navigate('/student');
        } catch (err) {
          setError(err.message || 'Google login failed.');
        }
      },
    });
    window[GOOGLE_INITIALIZED_KEY] = clientId;
  }, [navigate, role]);

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
    setShowAdminReset(false);
    setAdminResetRequested(false);
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

  async function handleAdminResetSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const email = loginForm.email.trim().toLowerCase();
    if (!email) {
      setError('Enter the current admin email first.');
      return;
    }

    setAdminResetBusy(true);
    try {
      const endpoint = adminResetRequested ? 'confirm' : 'request';
      const response = await fetch(`${API_URL}/api/auth/admin/password-reset/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminResetRequested
          ? { email, ...adminResetForm }
          : { email }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.message || 'Admin account reset failed.');

      if (adminResetRequested) {
        setShowAdminReset(false);
        setAdminResetRequested(false);
        setLoginForm({ email: adminResetForm.newEmail.trim().toLowerCase(), password: '' });
        setAdminResetForm({ code: '', newEmail: '', newPassword: '' });
      } else {
        setAdminResetRequested(true);
      }
      setSuccess(data.message);
    } catch (err) {
      setError(err.message || 'Admin account reset failed.');
    } finally {
      setAdminResetBusy(false);
    }
  }

  async function handleLoginSubmit(e) {
  e.preventDefault();
  setError('');

  if (!loginForm.email || !loginForm.password) {
    setError('Enter your email and password to continue.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
        role,
      }),
    });

    const data = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Unable to sign in right now.');
    }

    if (role === 'admin') {
      localStorage.removeItem('studentToken');
      localStorage.removeItem('studentUser');
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('admin', JSON.stringify(data.user));
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentUser', JSON.stringify(data.student));
      localStorage.setItem('user', JSON.stringify(data.user || data.student));
    }

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
      const response = await fetch(`${API_URL}/api/auth/register`, {
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

      const data = await readJsonResponse(response);

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

  function handleGoogleLogin() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (role !== 'student') {
      setError('Google login is available for students only.');
      return;
    }

    if (!clientId) {
      setError('Google login is not configured yet. Add VITE_GOOGLE_CLIENT_ID to your client .env file.');
      return;
    }

    if (!window.google?.accounts?.id) {
      setError('Google login script is still loading. Please try again in a moment.');
      return;
    }

    window.google.accounts.id.prompt();
  }

  if (!isLandingPage) {
    return (
      <div
        className="register-page"
        style={{
          minHeight: '100vh',
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.68), rgba(15, 23, 42, 0.58)), url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: '#172554',
          fontFamily: 'Inter, "Segoe UI", sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1200,
            background: 'rgba(255,255,255,0.92)',
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.28)',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
            overflow: 'hidden',
          }}
        >
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 30px',
              borderBottom: '1px solid #e2e8f0',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  background: '#0f766e',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                }}
              >
                C
              </div>
              <div style={{ fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#172554' }}>
                Campus placement
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ThemeToggle className="register-theme-button" />
              <button
                type="button"
                onClick={() => navigate('/')}
              style={{
                border: '1px solid #dbe2ea',
                background: '#f8fafc',
                color: '#172554',
                borderRadius: 10,
                padding: '10px 16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              >
                Back to home
              </button>
            </div>
          </header>

          <main
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0,
            }}
          >
            <section
              style={{
                background: 'linear-gradient(135deg, #172554 0%, #0f766e 100%)',
                color: '#fff',
                padding: '56px 42px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 18 }}>
                Student success platform
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(2.4rem, 3vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.06em' }}>
                Welcome to your placement desk.
              </h1>
              <p style={{ margin: '20px 0 24px', maxWidth: 420, fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>
                Track placement drives, stay on top of application progress, and manage your next steps with clarity.
              </p>

              <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
                {[
                  'View eligible drives instantly',
                  'Track applications and interviews',
                  'Stay updated with notifications',
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.16)',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#ccfbf1',
                        fontWeight: 800,
                      }}
                    >
                      ✓
                    </div>
                    <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ padding: '44px 38px', background: '#f8fafc' }}>
              <div style={{ maxWidth: 430, margin: '0 auto' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    background: '#e2e8f0',
                    borderRadius: 12,
                    padding: 6,
                    width: '100%',
                    marginBottom: 26,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    style={{
                      flex: 1,
                      background: mode === 'login' ? '#fff' : 'transparent',
                      color: '#172554',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 16px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: mode === 'login' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                    }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    style={{
                      flex: 1,
                      background: mode === 'register' ? '#fff' : 'transparent',
                      color: '#172554',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 16px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: mode === 'register' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                    }}
                  >
                    Register
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {[
                    { key: 'student', label: 'Student' },
                    { key: 'admin', label: 'Admin' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => switchRole(item.key)}
                      style={{
                        flex: 1,
                        border: '1px solid ' + (role === item.key ? '#0f766e' : '#dbe2ea'),
                        background: role === item.key ? '#ccfbf1' : '#ffffff',
                        color: '#172554',
                        borderRadius: 10,
                        padding: '10px 12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {error && (
                  <div style={{ marginBottom: 16, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                    {error}
                  </div>
                )}
                {success && !error && (
                  <div style={{ marginBottom: 16, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px', color: '#166534', fontSize: 13, fontWeight: 600 }}>
                    {success}
                  </div>
                )}

                {mode === 'login' ? (
                  <form onSubmit={role === 'admin' && showAdminReset ? handleAdminResetSubmit : handleLoginSubmit} noValidate>
                    <div style={{ marginBottom: 16 }}>
                      <label htmlFor="login-email" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                        {loginEmailLabel}
                      </label>
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        value={loginForm.email}
                        onChange={handleLoginChange}
                        placeholder={role === 'admin' ? 'Enter admin email' : 'you@college.edu'}
                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }}
                      />
                      {role === 'admin' && showAdminReset && (
                        <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12 }}>
                          The reset code goes to the configured recovery mailbox.
                        </p>
                      )}
                    </div>

                    {!showAdminReset && <div style={{ marginBottom: 18 }}>
                      <label htmlFor="login-password" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                        Password
                      </label>
                      <input
                        id="login-password"
                        name="password"
                        type="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        placeholder="••••••••"
                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }}
                      />
                    </div>}

                    {showAdminReset ? (
                      <>
                        {adminResetRequested && (
                          <>
                            <div style={{ marginBottom: 14 }}>
                              <label htmlFor="admin-reset-code" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>Email reset code</label>
                              <input id="admin-reset-code" value={adminResetForm.code} onChange={(e) => setAdminResetForm({ ...adminResetForm, code: e.target.value })} inputMode="numeric" autoComplete="one-time-code" maxLength={6} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }} />
                            </div>
                            <div style={{ marginBottom: 14 }}>
                              <label htmlFor="admin-reset-email" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>New admin email</label>
                              <input id="admin-reset-email" type="email" value={adminResetForm.newEmail} onChange={(e) => setAdminResetForm({ ...adminResetForm, newEmail: e.target.value })} autoComplete="email" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }} />
                            </div>
                            <div style={{ marginBottom: 18 }}>
                              <label htmlFor="admin-reset-password" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>New password (8+ characters)</label>
                              <input id="admin-reset-password" type="password" value={adminResetForm.newPassword} onChange={(e) => setAdminResetForm({ ...adminResetForm, newPassword: e.target.value })} autoComplete="new-password" minLength={8} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }} />
                            </div>
                          </>
                        )}
                        <button type="submit" disabled={adminResetBusy} style={{ width: '100%', border: 'none', background: '#0f766e', color: '#fff', borderRadius: 12, padding: '14px 18px', fontSize: 15, fontWeight: 800, cursor: adminResetBusy ? 'wait' : 'pointer' }}>
                          {adminResetSubmitLabel}
                        </button>
                        <button type="button" onClick={() => { setShowAdminReset(false); setAdminResetRequested(false); setError(''); setSuccess(''); }} style={{ width: '100%', marginTop: 10, border: 'none', background: 'transparent', color: '#0f766e', padding: 10, fontWeight: 700, cursor: 'pointer' }}>
                          Back to sign in
                        </button>
                      </>
                    ) : <button
                      type="submit"
                      style={{
                        width: '100%',
                        border: 'none',
                        background: '#0f766e',
                        color: '#fff',
                        borderRadius: 12,
                        padding: '14px 18px',
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 10px 18px rgba(15, 118, 110, 0.18)',
                      }}
                    >
                      Sign in
                    </button>}

                    {role === 'admin' && !showAdminReset && (
                      <button type="button" onClick={() => { setShowAdminReset(true); setError(''); setSuccess(''); }} style={{ width: '100%', marginTop: 10, border: 'none', background: 'transparent', color: '#0f766e', padding: 10, fontWeight: 700, cursor: 'pointer' }}>
                        Reset admin email or password
                      </button>
                    )}

                    {role === 'student' && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 14px' }}>
                          <div style={{ height: 1, background: '#dbe2ea', flex: 1 }} />
                          <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>or</span>
                          <div style={{ height: 1, background: '#dbe2ea', flex: 1 }} />
                        </div>

                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          style={{
                            width: '100%',
                            border: '1px solid #dbe2ea',
                            background: '#fff',
                            color: '#172554',
                            borderRadius: 12,
                            padding: '12px 16px',
                            fontSize: 14,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                          }}
                        >
                          <span style={{ fontSize: 16 }}>G</span>
                          Continue with Google
                        </button>
                      </>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} noValidate>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label htmlFor="reg-name" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                          Full name
                        </label>
                        <input
                          id="reg-name"
                          name="name"
                          value={registerForm.name}
                          onChange={handleRegisterChange}
                          placeholder="Asha Mehta"
                          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-roll" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                          Roll number
                        </label>
                        <input
                          id="reg-roll"
                          name="rollNumber"
                          value={registerForm.rollNumber}
                          onChange={handleRegisterChange}
                          placeholder="21CS1042"
                          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label htmlFor="reg-email" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                        College email
                      </label>
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        placeholder="you@college.edu"
                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label htmlFor="reg-branch" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                        Branch
                      </label>
                      <select
                        id="reg-branch"
                        name="branch"
                        value={registerForm.branch}
                        onChange={handleRegisterChange}
                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }}
                      >
                        <option value="" disabled>Select branch</option>
                        {BRANCHES.map((branch) => (
                          <option value={branch} key={branch}>{branch}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                      <div>
                        <label htmlFor="reg-password" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                          Password
                        </label>
                        <input
                          id="reg-password"
                          name="password"
                          type="password"
                          value={registerForm.password}
                          onChange={handleRegisterChange}
                          placeholder="At least 6 chars"
                          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-confirm" style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                          Confirm
                        </label>
                        <input
                          id="reg-confirm"
                          name="confirm"
                          type="password"
                          value={registerForm.confirm}
                          onChange={handleRegisterChange}
                          placeholder="Re-enter"
                          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dbe2ea', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#172554', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        border: 'none',
                        background: '#0f766e',
                        color: '#fff',
                        borderRadius: 12,
                        padding: '14px 18px',
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 10px 18px rgba(15, 118, 110, 0.18)',
                      }}
                    >
                      Create account
                    </button>
                  </form>
                )}

                <div style={{ marginTop: 18, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                  {mode === 'login' ? (
                    <>
                      New here?{' '}
                      <button type="button" onClick={() => switchMode('register')} style={{ background: 'transparent', border: 'none', color: '#0f766e', fontWeight: 700, cursor: 'pointer' }}>
                        Create account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button type="button" onClick={() => switchMode('login')} style={{ background: 'transparent', border: 'none', color: '#0f766e', fontWeight: 700, cursor: 'pointer' }}>
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      className="register-page"
      style={{
        minHeight: '100vh',
        background: '#F4F9FB',
        color: '#0F172A',
        fontFamily: 'Inter, "Segoe UI", sans-serif',
        overflowX: 'hidden',
      }}
    >
      <header
        style={{
          width: '100%',
          background: 'rgba(244, 249, 251, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '18px 32px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#0F766E',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              C
            </div>
            <div style={{ fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F172A' }}>
              Campus placement
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <ThemeToggle className="register-theme-button" />
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0F172A',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Student sign in
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              style={{
                background: '#0F172A',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 18px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 12px 18px rgba(29, 43, 58, 0.14)',
              }}
            >
              Admin portal
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 0' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: 38,
            alignItems: 'center',
            minHeight: 720,
          }}
        >
          <div style={{ paddingLeft: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#DFFAF6',
                border: '1px solid rgba(15, 118, 110, 0.18)',
                color: '#0F766E',
                borderRadius: 999,
                padding: '9px 14px',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 28,
              }}
            >
              <span style={{ fontSize: 14 }}>✦</span>
              The placement desk, made clear
            </div>

            <h1
              style={{
                margin: 0,
                color: '#0F172A',
                fontSize: 'clamp(4.2rem, 7vw, 9.6rem)',
                lineHeight: 0.86,
                letterSpacing: '-0.08em',
                fontWeight: 800,
              }}
            >
              Good decisions
              <br />
              <span style={{ color: '#0F766E' }}>start here.</span>
            </h1>

            <p
              style={{
                marginTop: 28,
                maxWidth: 560,
                color: '#4d5866',
                fontSize: 19,
                lineHeight: 1.5,
              }}
            >
              One calm, trusted place for students to find the right opportunity — and
              for placement teams to move every application forward.
            </p>

            <div style={{ display: 'flex', gap: 16, marginTop: 34, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  border: 'none',
                  borderRadius: 14,
                  background: '#0F172A',
                  color: '#fff',
                  padding: '16px 26px',
                  fontWeight: 700,
                  fontSize: 17,
                  cursor: 'pointer',
                  boxShadow: '0 12px 18px rgba(23, 42, 58, 0.16)',
                }}
              >
                Get started
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 32, color: '#415066' }}>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                {['A', 'R', 'S', 'K'].map((label, idx) => (
                  <div
                    key={label}
                    style={{
                      width: 30,
                      height: 30,
                      marginLeft: idx === 0 ? 0 : -8,
                      borderRadius: '50%',
                      background: ['#0F766E', '#14B8A6', '#0EA5A4', '#2DD4BF'][idx % 4],
                      border: '2px solid #F4F9FB',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#fff',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div>
                <strong style={{ fontSize: 16, color: '#0F172A' }}>Built for the moment that matters</strong>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>Applications, outcomes, and everything in between.</div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 620,
              paddingRight: 8,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 24,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.34), rgba(255,255,255,0.08))',
                border: '1px solid rgba(29,42,53,0.05)',
                borderRadius: 34,
                transform: 'rotate(5deg)',
              }}
            />

            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 560,
                background: '#F4F9FB',
                borderRadius: 30,
                border: '1px solid rgba(15, 23, 42, 0.08)',
                boxShadow: '0 38px 58px rgba(15, 23, 42, 0.08)',
                padding: '20px 18px 18px',
                transform: 'rotate(3deg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#DFFAF6',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#0F766E',
                      fontWeight: 800,
                    }}
                  >
                    A
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: '#0F172A' }}>Good morning, Aanya</div>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#DFFAF6',
                    borderRadius: 999,
                    padding: '7px 11px',
                    color: '#0F766E',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F766E', display: 'inline-block' }} />
                  Profile complete
                </div>
              </div>

              <div
                style={{
                  background: '#F4F9FB',
                  borderRadius: 20,
                  border: '1px solid rgba(29,42,53,0.06)',
                  padding: '18px 18px 16px',
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a8793', marginBottom: 8 }}>
                  Your placement journey
                </div>
                <div style={{ fontSize: 27, lineHeight: 1.15, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
                  Keep moving with confidence.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
                  {[
                    ['Active drives', '12'],
                    ['Applications', '04'],
                    ['Selected', '01'],
                  ].map(([label, value], idx) => (
                    <div
                      key={label}
                      style={{
                        background: idx === 2 ? '#DFFAF6' : '#F4F9FB',
                        border: '1px solid rgba(23, 42, 58, 0.05)',
                        borderRadius: 12,
                        padding: '12px 10px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#657584', marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    ['Meridian Labs', 'Product analyst', 'Shortlisted'],
                    ['Northstar Systems', 'Software engineer', 'Applied'],
                  ].map(([company, role, status], index) => (
                    <div
                      key={company}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#edf0ee',
                        borderRadius: 12,
                        border: '1px solid rgba(29,42,53,0.04)',
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: index === 0 ? '#E2E8F0' : '#DFFAF6',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#0F172A',
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          {company[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{company}</div>
                          <div style={{ fontSize: 11, color: '#667786' }}>{role}</div>
                        </div>
                      </div>
                      <div
                        style={{
                          background: status === 'Shortlisted' ? '#DFFAF6' : '#EAF7FF',
                          color: status === 'Shortlisted' ? '#0F766E' : '#0F172A',
                          borderRadius: 999,
                          padding: '6px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '28px 0 10px', textAlign: 'center' }}>
          <div style={{ color: '#7a8793', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, marginBottom: 18 }}>
            Designed around the real work of
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4d5866', fontWeight: 700 }}>
            <span style={{ color: '#3b4d5a' }}>Career services</span>
            <span style={{ color: '#3b4d5a' }}>Student success</span>
            <span style={{ color: '#3b4d5a' }}>Recruiting teams</span>
            <span style={{ color: '#3b4d5a' }}>Graduating classes</span>
          </div>
        </section>

        <section style={{ padding: '34px 0 30px' }}>
          <div style={{ textAlign: 'center', color: '#5d6977', fontSize: 18, marginBottom: 12 }}>
            A clearer path through a busy season
          </div>
          <h2 style={{ textAlign: 'center', margin: 0, fontSize: 'clamp(2.2rem, 4vw, 4rem)', lineHeight: 1.08, letterSpacing: '-0.06em', color: '#172a3a' }}>
            Everything important,<br />
            <span style={{ color: '#0F766E' }}>in its right place.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24, marginTop: 36 }}>
            {[
              {
                num: '01',
                title: 'See what is actually right for you.',
                text: 'Eligibility is visible before you spend time applying. Compare role, package, deadline, and branch fit at a glance.',
              },
              {
                num: '02',
                title: 'Placement teams stay in rhythm.',
                text: 'From a new drive to the final shortlist, keep the full picture close without spreadsheet sprawl.',
              },
              {
                num: '03',
                title: 'Every outcome has a next step.',
                text: 'Clear statuses give students confidence and admins a reliable operating trail.',
              },
            ].map((item) => (
              <div
                key={item.num}
                style={{
                  background: '#F4F9FB',
                  border: '1px solid rgba(15,23,42,0.08)',
                  borderRadius: 22,
                  padding: '22px 20px',
                  boxShadow: '0 18px 26px rgba(29,42,53,0.04)',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', marginBottom: 10 }}>{item.num}</div>
                <h3 style={{ margin: '0 0 12px', fontSize: 24, lineHeight: 1.2, color: '#0F172A' }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#5e6977', fontSize: 16, lineHeight: 1.6 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 10,
            padding: '10px 0 32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 820,
              margin: '0 auto',
              borderRadius: 22,
              background: '#F4F9FB',
              border: '1px solid rgba(15,23,42,0.08)',
              padding: '26px 30px',
              fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
              lineHeight: 1.4,
              color: '#0F172A',
            }}
          >
            “The best placement experience feels less like chasing updates and more like knowing where you stand.”
            <div style={{ marginTop: 8, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6d7987' }}>
              — A better campus placement desk
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          borderTop: '1px solid rgba(15,23,42,0.08)',
          background: 'rgba(244, 249, 251, 0.9)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '28px 32px 36px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
            color: '#586774',
            fontSize: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1d2a35' }}>
            <span style={{ fontSize: 18 }}>Campus</span>
            <span style={{ color: '#0F766E' }}>placement</span>
          </div>
          <div>For the people making the next step happen.</div>
          <div>© 2026 Campus placement</div>
        </div>
      </footer>
    </div>
  );
}