import { useState, useMemo, useEffect } from 'react';

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

// ---------------------------------------------------------------------------
// Live data source
// ---------------------------------------------------------------------------
// All companies, students, and documents used to be hardcoded mock objects
// keyed by id, and applications only stored the ids. That's gone now — the
// backend's `applications` collection is the single source of truth, and
// each application document returned by the API is expected to already
// carry the full nested `company` and `student` records (including the
// student's `documents` array) alongside its own status/appliedOn fields:
//
// {
//   _id: "a1",
//   status: "Applied" | "Shortlisted" | "Selected" | "Rejected",
//   appliedOn: "1 Jul",
//   company: {
//     id, name, role, package, minCgpa, branches: string[], noBacklogs, status, deadline
//   },
//   student: {
//     id, name, rollNumber, branch, cgpa, backlogs,
//     documents: [{ id, name, type: "Marksheet" | "Government ID", size, uploadedOn, url }]
//   }
// }
//
// Point this at whichever route on your backend serves that collection.
const API_BASE = 'http://localhost:5000';
const APPLICATIONS_ENDPOINT = `${API_BASE}/api/apply`;

function documentUrl(path) {
  if (!path) return '#';
  const normalized = path.toString().replace(/\\/g, '/');
  let url = normalized;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return encodeURI(url);
  }
  if (url.startsWith('/')) {
    return encodeURI(`${API_BASE}${url}`);
  }
  return encodeURI(`${API_BASE}/${url}`);
}

function isEligible(company, student) {
  return (
    (Array.isArray(company.branches) && company.branches.length > 0 ? company.branches.includes(student.branch) : true) &&
    (typeof company.minCgpa === 'number' ? student.cgpa >= company.minCgpa : true) &&
    (company.noBacklogs ? student.backlogs === 0 : true)
  );
}

function eligibilityReasons(company, student) {
  const reasons = [];
  if (Array.isArray(company.branches) && company.branches.length > 0 && student.branch && !company.branches.includes(student.branch)) {
    reasons.push(`Branch (${student.branch}) not eligible for this drive`);
  }
  if (typeof company.minCgpa === 'number' && typeof student.cgpa === 'number' && student.cgpa < company.minCgpa) {
    reasons.push(`CGPA ${student.cgpa.toFixed(1)} below required ${company.minCgpa.toFixed(1)}`);
  }
  if (company.noBacklogs && typeof student.backlogs === 'number' && student.backlogs > 0) {
    reasons.push(`${student.backlogs} active backlog${student.backlogs > 1 ? 's' : ''}`);
  }
  return reasons;
}

// Guards against any application record from the API that's missing the
// nested company/student data it needs — this is what previously crashed
// the dashboard downstream (e.g. "Cannot read properties of undefined
// (reading 'branch')") if bad or partial data slipped through.
function isValidApplicationRecord(a) {
  if (!a || typeof a !== 'object') return false;
  const id = a._id || a.id;
  const { company, student, status, appliedOn } = a;
  if (!id || !status || !appliedOn) return false;
  if (!company || typeof company !== 'object') return false;
  if (!company.name) return false;
  if (!student || typeof student !== 'object') return false;
  if (!student.rollNumber && !student.name) return false;
  return true;
}

const docTypeColor = (type) => {
  switch (type) {
    case 'Marksheet': return colors.teal;
    case 'Government ID': return colors.red;
    default: return colors.inkSoft;
  }
};

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

  // ---------------- Login ----------------
  loginWrap: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.ink,
    padding: 16,
  },
  loginCard: {
    width: '100%',
    maxWidth: 380,
    background: colors.paper,
    borderRadius: 10,
    padding: 'clamp(28px, 4vw, 40px)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
  },
  loginBrand: { fontFamily: fonts.display, fontSize: 22, fontWeight: 700, marginBottom: 4 },
  loginEyebrow: { fontFamily: fonts.head, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.gold, fontWeight: 700, marginBottom: 18 },
  loginSub: { fontSize: 13.5, opacity: 0.6, margin: '0 0 26px', lineHeight: 1.5 },
  field: { marginBottom: 16 },
  fieldLabel: { display: 'block', fontFamily: fonts.head, fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: colors.inkSoft },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 6,
    padding: '11px 13px',
    fontSize: 14,
    fontFamily: fonts.body,
    background: '#fff',
    color: colors.ink,
  },
  loginBtn: {
    width: '100%',
    border: 'none',
    borderRadius: 6,
    padding: '12px 16px',
    fontFamily: fonts.head,
    fontWeight: 700,
    fontSize: 14,
    background: colors.ink,
    color: colors.paper,
    cursor: 'pointer',
    marginTop: 6,
  },
  loginError: { fontSize: 12.5, color: colors.red, margin: '0 0 14px' },
  loginHint: { fontSize: 11.5, opacity: 0.4, marginTop: 18, lineHeight: 1.5 },

  // ---------------- Shell ----------------
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
  headerRight: { display: 'flex', alignItems: 'center', gap: 18 },
  adminChip: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: colors.ink, color: colors.paper,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.head, fontSize: 13, fontWeight: 700,
  },
  adminMeta: { lineHeight: 1.25 },
  adminName: { fontSize: 13.5, fontWeight: 600 },
  adminSub: { fontSize: 12, opacity: 0.55 },
  signOut: {
    border: `1px solid ${colors.lineDark}`, background: 'transparent', borderRadius: 6, padding: '8px 14px',
    fontFamily: fonts.head, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: colors.ink,
  },

  body: { width: '100%', boxSizing: 'border-box', maxWidth: 1920, margin: '0 auto', padding: 'clamp(24px, 3vw, 48px) clamp(28px, 5vw, 80px) 80px' },

  intro: { marginBottom: 32 },
  h1: { fontFamily: fonts.display, fontSize: 'clamp(26px, 2.6vw, 34px)', fontWeight: 600, margin: '0 0 6px' },
  introSub: { fontSize: 14.5, opacity: 0.65, margin: 0 },

  statRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 36 },
  statCard: { background: colors.ink, color: colors.paper, borderRadius: 8, padding: '20px 22px' },
  statValue: { fontFamily: fonts.head, fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  statLabel: { fontSize: 12.5, opacity: 0.6, marginTop: 4 },

  tabRow: { display: 'inline-flex', background: '#fff', border: `1px solid ${colors.lineDark}`, borderRadius: 30, padding: 5, marginBottom: 22, flexWrap: 'wrap' },
  tab: (active) => ({
    border: 'none', background: active ? colors.ink : 'transparent', padding: '10px 20px', borderRadius: 24,
    fontFamily: fonts.head, fontSize: 13.5, fontWeight: 600, color: active ? colors.paper : colors.inkSoft, opacity: active ? 1 : 0.6, cursor: 'pointer',
  }),

  sectionHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' },
  sectionTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: 600, margin: 0 },
  sectionSub: { fontSize: 13.5, opacity: 0.55, margin: '4px 0 0' },

  filterRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 },
  filterBtn: (active) => ({
    border: `1px solid ${colors.lineDark}`, background: active ? colors.ink : '#fff', color: active ? colors.paper : colors.inkSoft,
    borderRadius: 20, padding: '7px 14px', fontFamily: fonts.head, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  }),
  searchInput: {
    border: `1px solid ${colors.lineDark}`, borderRadius: 20, padding: '8px 14px', fontFamily: fonts.body, fontSize: 13,
    background: '#fff', color: colors.ink, minWidth: 220,
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 },

  card: { border: `1px solid ${colors.lineDark}`, borderRadius: 10, background: '#fff', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  appName: { fontFamily: fonts.display, fontSize: 17, fontWeight: 600, margin: 0 },
  appSub: { fontSize: 13, opacity: 0.6, margin: '4px 0 0' },
  companyPackage: { fontFamily: fonts.head, fontWeight: 700, fontSize: 13.5, color: colors.teal, whiteSpace: 'nowrap' },

  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  pill: { fontSize: 11.5, fontFamily: fonts.head, padding: '5px 10px', borderRadius: 20, background: 'rgba(15,22,38,0.06)', color: colors.inkSoft },
  statusPill: (kind) => ({
    fontSize: 11.5, fontFamily: fonts.head, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
    background:
      kind === 'Shortlisted' ? 'rgba(217,164,65,0.18)' :
      kind === 'Selected' ? 'rgba(51,99,90,0.14)' :
      kind === 'Rejected' ? 'rgba(192,69,58,0.12)' :
      kind === 'Open' ? 'rgba(51,99,90,0.12)' :
      kind === 'Closing soon' ? 'rgba(192,69,58,0.12)' :
      'rgba(15,22,38,0.07)',
    color:
      kind === 'Shortlisted' ? '#9A6B12' :
      kind === 'Selected' ? colors.teal :
      kind === 'Rejected' ? colors.red :
      kind === 'Open' ? colors.teal :
      kind === 'Closing soon' ? colors.red :
      colors.inkSoft,
  }),
  eligPill: (ok) => ({
    fontSize: 11.5, fontFamily: fonts.head, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
    background: ok ? 'rgba(51,99,90,0.12)' : 'rgba(192,69,58,0.12)',
    color: ok ? colors.teal : colors.red,
  }),

  reasonList: { margin: '2px 0 0', paddingLeft: 16, fontSize: 12, color: colors.red, opacity: 0.85, lineHeight: 1.6 },

  cardFootRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  deadline: { fontSize: 12, opacity: 0.5 },
  actionRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },

  btnAccept: {
    border: 'none', borderRadius: 6, padding: '9px 15px', fontFamily: fonts.head, fontWeight: 600, fontSize: 13,
    background: colors.teal, color: colors.paper, cursor: 'pointer',
  },
  btnReject: {
    border: `1px solid ${colors.red}`, borderRadius: 6, padding: '9px 15px', fontFamily: fonts.head, fontWeight: 600, fontSize: 13,
    background: 'transparent', color: colors.red, cursor: 'pointer',
  },
  btnSelect: {
    border: 'none', borderRadius: 6, padding: '9px 15px', fontFamily: fonts.head, fontWeight: 600, fontSize: 13,
    background: colors.ink, color: colors.paper, cursor: 'pointer',
  },
  btnGhost: {
    border: `1px solid ${colors.lineDark}`, borderRadius: 6, padding: '9px 15px', fontFamily: fonts.head, fontWeight: 600, fontSize: 13,
    background: 'transparent', color: colors.inkSoft, cursor: 'pointer',
  },
  btnDocs: {
    border: `1px solid ${colors.gold}`, borderRadius: 6, padding: '9px 15px', fontFamily: fonts.head, fontWeight: 600, fontSize: 13,
    background: 'rgba(217,164,65,0.1)', color: '#9A6B12', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  btnDocsSmall: {
    border: `1px solid ${colors.gold}`, borderRadius: 6, padding: '6px 11px', fontFamily: fonts.head, fontWeight: 600, fontSize: 12,
    background: 'rgba(217,164,65,0.1)', color: '#9A6B12', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
  },

  emptyState: { border: `1px dashed ${colors.lineDark}`, borderRadius: 10, padding: '40px 24px', textAlign: 'center', color: colors.inkSoft },
  emptyTitle: { fontFamily: fonts.display, fontSize: 18, margin: '0 0 6px' },
  emptySub: { fontSize: 13.5, opacity: 0.6, margin: 0 },

  // Loading / error banners for the live fetch
  statusBanner: { border: `1px solid ${colors.lineDark}`, borderRadius: 10, padding: '18px 22px', marginBottom: 24, background: '#fff', display: 'flex', alignItems: 'center', gap: 12 },
  statusBannerError: { border: `1px solid ${colors.red}`, background: 'rgba(192,69,58,0.06)' },
  statusDot: { width: 8, height: 8, borderRadius: '50%', background: colors.gold, flexShrink: 0 },
  statusDotError: { background: colors.red },
  statusText: { fontSize: 13.5, color: colors.inkSoft, margin: 0 },

  // Company-centric view
  companyHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', border: `1px solid ${colors.lineDark}`, borderRadius: 10, overflow: 'hidden' },
  th: { textAlign: 'left', fontFamily: fonts.head, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkSoft, opacity: 0.6, padding: '12px 16px', borderBottom: `1px solid ${colors.lineDark}` },
  td: { padding: '13px 16px', fontSize: 13.5, borderBottom: `1px solid ${colors.lineDark}`, verticalAlign: 'middle' },

  toast: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: colors.ink, color: colors.paper,
    padding: '12px 20px', borderRadius: 8, fontSize: 13.5, fontFamily: fonts.head, boxShadow: '0 12px 30px rgba(15,22,38,0.3)', zIndex: 100,
  },

  // ---------------- Documents modal ----------------
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,22,38,0.55)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20,
  },
  modalCard: {
    width: '100%', maxWidth: 520, maxHeight: '82vh', overflowY: 'auto', background: colors.paper,
    borderRadius: 12, boxShadow: '0 30px 80px rgba(0,0,0,0.4)', padding: 'clamp(22px, 3vw, 30px)',
  },
  modalHeadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: 600, margin: 0 },
  modalSub: { fontSize: 13, opacity: 0.6, margin: '4px 0 20px' },
  modalClose: {
    border: 'none', background: 'transparent', fontSize: 20, lineHeight: 1, cursor: 'pointer', color: colors.inkSoft,
    padding: 4, opacity: 0.6,
  },
  docList: { display: 'flex', flexDirection: 'column', gap: 10 },
  docRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    border: `1px solid ${colors.lineDark}`, borderRadius: 8, padding: '12px 14px', background: '#fff',
  },
  docLeft: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  docIcon: (type) => ({
    width: 34, height: 34, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: `${docTypeColor(type)}22`, color: docTypeColor(type), fontFamily: fonts.head, fontSize: 11, fontWeight: 700,
  }),
  docName: { fontSize: 13.5, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  docMeta: { fontSize: 11.5, opacity: 0.55, margin: '2px 0 0' },
  docActions: { display: 'flex', gap: 6, flexShrink: 0 },
  docViewBtn: {
    border: `1px solid ${colors.lineDark}`, background: 'transparent', borderRadius: 6, padding: '6px 12px',
    fontFamily: fonts.head, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: colors.ink,
  },
  docEmptyState: { textAlign: 'center', padding: '30px 10px', opacity: 0.55, fontSize: 13.5 },
};

const ADMIN = { name: 'Placement Office', role: 'Administrator' };

function DocumentsModal({ student, documents, onClose, onView }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeadRow}>
          <div>
            <h3 style={styles.modalTitle}>{student.name}'s documents</h3>
            <p style={styles.modalSub}>{student.rollNumber} · {student.branch}</p>
          </div>
          <button type="button" style={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {documents.length === 0 ? (
          <div style={styles.docEmptyState}>No documents uploaded by this student yet.</div>
        ) : (
          <div style={styles.docList}>
            {documents.map((d) => {
              const url = documentUrl(d.url || d.filePath || d.filepath);
              return (
                <div style={styles.docRow} key={d.id}>
                  <div style={styles.docLeft}>
                    <div style={styles.docIcon(d.type)}>
                      {d.type === 'Government ID' ? 'ID' : 'MS'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={styles.docName}>{d.name}</p>
                      <p style={styles.docMeta}>{d.type} · {d.size} · Uploaded {d.uploadedOn}</p>
                      <p style={{ fontSize: 11, opacity: 0.55, margin: '4px 0 0', wordBreak: 'break-all' }}>{url}</p>
                    </div>
                  </div>
                  <div style={styles.docActions}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.docViewBtn}
                      onClick={() => onView(d)}
                    >
                      View
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  useEffect(() => {
    // Defensive reset: clear any width/centering rules a host project's
    // global CSS might apply (Vite/CRA defaults often put max-width + auto
    // margins on #root, .App, or body with !important). Use setProperty
    // with 'important' priority so this reliably wins, and restore on unmount.
    const selectors = ['html', 'body', '#root', '#app', '.App'];
    const els = selectors.map((sel) => document.querySelector(sel)).filter(Boolean);
    const previous = els.map((el) => el.getAttribute('style'));
    const props = {
      margin: '0',
      padding: '0',
      width: '100%',
      maxWidth: 'none',
      minWidth: '0',
      textAlign: 'initial',
      display: 'block',
      boxSizing: 'border-box',
    };
    els.forEach((el) => {
      Object.entries(props).forEach(([prop, val]) => {
        const cssProp = prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        el.style.setProperty(cssProp, val, 'important');
      });
    });
    return () => {
      els.forEach((el, i) => {
        if (previous[i] === null) el.removeAttribute('style');
        else el.setAttribute('style', previous[i]);
      });
    };
  }, []);

  const [tab, setTab] = useState('applications'); // applications | companies
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState('');
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [docsFor, setDocsFor] = useState(null); // { student, documents } for the open modal, or null

  // Pull every application straight from the backend's `applications`
  // collection. Each record already carries its own company/student data,
  // so there's no local id-lookup table to keep in sync anymore — this
  // fetch is the single source of truth for the whole dashboard.
  useEffect(() => {
    let cancelled = false;

    async function fetchApplications() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(APPLICATIONS_ENDPOINT);
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        if (!Array.isArray(data)) throw new Error('Expected an array of applications from the API');

        const validApps = data.filter(isValidApplicationRecord);
        if (validApps.length < data.length) {
          console.warn(
            `${data.length - validApps.length} of ${data.length} records from the applications collection ` +
              'were missing required company/student fields and were dropped.'
          );
        }
        setApplications(validApps);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setLoadError('Could not load applications from the server. Confirm the backend is running and reachable.');
          setApplications([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchApplications();
    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(''), 2600);
  }

  function updateStatus(appId, status) {
    // Update local state immediately for UI feedback
    setApplications((prev) => prev.map((a) => ((a._id || a.id) === appId ? { ...a, status } : a)));
    const app = applications.find((a) => (a._id || a.id) === appId);
    if (app) {
      showToast(`${app.student.name}'s application to ${app.company.name} marked as ${status}.`);
    }

    // Make API call to backend to persist the change
    fetch(`${APPLICATIONS_ENDPOINT}/${appId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      return res.json();
    })
    .then((data) => {
      // Refresh applications list to ensure consistency
      fetch(APPLICATIONS_ENDPOINT)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setApplications(data);
          }
        })
        .catch((err) => console.error('Error refreshing applications:', err));
    })
    .catch((err) => {
      console.error('Error updating status:', err);
      showToast(`Failed to update status: ${err.message}`);
      // Revert the local state on error
      fetch(APPLICATIONS_ENDPOINT)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setApplications(data);
          }
        })
        .catch((err) => console.error('Error refreshing applications:', err));
    });
  }

  function handleViewDocument(doc) {
    // Build a valid URL for documents stored on the backend.
    const url = documentUrl(doc.url || doc.filePath || doc.filepath);
    showToast(`Opening ${doc.name || 'document'}…`);
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  // Guards, again, against any application whose nested company/student
  // shape is malformed — keeps a single bad record from crashing the page.
  const enrichedApplications = useMemo(() => {
    return applications
      .map((a) => {
        const rawCompany = a.company || {};
        const rawStudent = a.student || {};
        const company = {
          id: rawCompany.id || rawCompany.companyId || rawCompany.companyName || '',
          name: rawCompany.name || rawCompany.companyName || 'Unknown company',
          role: rawCompany.role || '',
          package: rawCompany.package || '',
          minCgpa: typeof rawCompany.minCgpa === 'number' ? rawCompany.minCgpa : null,
          branches: Array.isArray(rawCompany.branches) ? rawCompany.branches : [],
          noBacklogs: !!rawCompany.noBacklogs,
          status: rawCompany.status || '',
          deadline: rawCompany.deadline || '',
        };
        const student = {
          id: rawStudent.id || rawStudent._id || rawStudent.rollNumber || '',
          name: rawStudent.name || rawStudent.fullName || 'Unknown student',
          rollNumber: rawStudent.rollNumber || '',
          branch: rawStudent.branch || '',
          cgpa: typeof rawStudent.cgpa === 'number' ? rawStudent.cgpa : null,
          backlogs: typeof rawStudent.backlogs === 'number' ? rawStudent.backlogs : null,
          documents: Array.isArray(rawStudent.documents) ? rawStudent.documents : [],
        };
        const documents = Array.isArray(student.documents)
          ? student.documents
          : Array.isArray(a.documents)
          ? a.documents
          : [];
        const eligible = isEligible(company, student);
        const reasons = eligibilityReasons(company, student);
        return { ...a, id: a._id || a.id, company, student, eligible, reasons, documents };
      })
      .filter(Boolean);
  }, [applications]);

  const totalApplications = enrichedApplications.length;
  const pendingCount = enrichedApplications.filter((a) => a.status === 'Applied').length;
  const shortlistedCount = enrichedApplications.filter((a) => a.status === 'Shortlisted').length;
  const selectedCount = enrichedApplications.filter((a) => a.status === 'Selected').length;

  const filteredApplications = enrichedApplications.filter((a) => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${a.student.name} ${a.student.rollNumber} ${a.company.name}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // The "companies" view is derived entirely from whichever companies show
  // up in the fetched applications — there's no separate master list, so a
  // company with zero applications simply won't appear here.
  const companyStats = useMemo(() => {
    const byId = new Map();
    for (const a of enrichedApplications) {
      const key = a.company.id;
      if (!byId.has(key)) {
        byId.set(key, { ...a.company, applicantCount: 0, pendingCount: 0, apps: [] });
      }
      const entry = byId.get(key);
      entry.applicantCount += 1;
      if (a.status === 'Applied') entry.pendingCount += 1;
      entry.apps.push(a);
    }
    return Array.from(byId.values());
  }, [enrichedApplications]);

  const totalCompanies = companyStats.length;

  const initials = ADMIN.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  // ---------------- Dashboard ----------------
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.brand}>
          CampusBridge<span style={styles.brandDot}>.</span>
        </span>
        <div style={styles.headerRight}>
          <div style={styles.adminChip}>
            <div style={styles.avatar}>{initials}</div>
            <div style={styles.adminMeta}>
              <div style={styles.adminName}>{ADMIN.name}</div>
              <div style={styles.adminSub}>{ADMIN.role}</div>
            </div>
          </div>
          <button type="button" style={styles.signOut}>Sign out</button>
        </div>
      </header>

      <div style={styles.body}>
        <div style={styles.intro}>
          <h1 style={styles.h1}>Placement drive overview</h1>
          <p style={styles.introSub}>Review who applied where, check eligibility, view submitted documents, and accept or reject applications.</p>
        </div>

        {loading && (
          <div style={styles.statusBanner}>
            <span style={styles.statusDot} />
            <p style={styles.statusText}>Loading applications…</p>
          </div>
        )}

        {!loading && loadError && (
          <div style={{ ...styles.statusBanner, ...styles.statusBannerError }}>
            <span style={{ ...styles.statusDot, ...styles.statusDotError }} />
            <p style={styles.statusText}>{loadError}</p>
          </div>
        )}

        <div style={styles.statRow}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{totalCompanies}</div>
            <div style={styles.statLabel}>Companies with applicants</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{totalApplications}</div>
            <div style={styles.statLabel}>Applications received</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{pendingCount}</div>
            <div style={styles.statLabel}>Awaiting review</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{shortlistedCount}</div>
            <div style={styles.statLabel}>Shortlisted</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{selectedCount}</div>
            <div style={styles.statLabel}>Selected</div>
          </div>
        </div>

        <div style={styles.tabRow}>
          <button type="button" style={styles.tab(tab === 'applications')} onClick={() => setTab('applications')}>
            Applications
          </button>
          <button type="button" style={styles.tab(tab === 'companies')} onClick={() => setTab('companies')}>
            Companies
          </button>
        </div>

        {tab === 'applications' && (
          <section>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>Student applications</h2>
                <p style={styles.sectionSub}>Eligibility is recalculated live from each student's branch, CGPA, and backlog record.</p>
              </div>
              <input
                style={styles.searchInput}
                placeholder="Search student or company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={styles.filterRow}>
              {['All', 'Applied', 'Shortlisted', 'Selected', 'Rejected'].map((s) => (
                <button key={s} type="button" style={styles.filterBtn(statusFilter === s)} onClick={() => setStatusFilter(s)}>
                  {s}
                </button>
              ))}
            </div>

            {!loading && filteredApplications.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>
                  {enrichedApplications.length === 0 ? 'No applications yet' : 'No applications match this filter'}
                </p>
                <p style={styles.emptySub}>
                  {enrichedApplications.length === 0
                    ? 'Once students apply, their applications will show up here.'
                    : 'Try a different status or clear your search.'}
                </p>
              </div>
            ) : (
              <div style={styles.grid}>
                {filteredApplications.map((a) => (
                  <div style={styles.card} key={a.id}>
                    <div style={styles.cardTop}>
                      <div>
                        <h3 style={styles.appName}>{a.student.name}</h3>
                        <p style={styles.appSub}>
                          {a.student.rollNumber || 'Unknown roll'}
                          {a.student.branch ? ` · ${a.student.branch}` : ''}
                          {typeof a.student.cgpa === 'number' ? ` · CGPA ${a.student.cgpa.toFixed(1)}` : ''}
                        </p>
                      </div>
                      <span style={styles.companyPackage}>{a.company.package || '-'}</span>
                    </div>

                    <div style={styles.pillRow}>
                      <span style={styles.pill}>{a.company.name} · {a.company.role}</span>
                      <span style={styles.statusPill(a.status)}>{a.status}</span>
                      <span style={styles.eligPill(a.eligible)}>{a.eligible ? 'Eligible' : 'Not eligible'}</span>
                    </div>

                    {!a.eligible && (
                      <ul style={styles.reasonList}>
                        {a.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    )}

                    <div style={styles.cardFootRow}>
                      <span style={styles.deadline}>Applied on {a.appliedOn}</span>
                      <div style={styles.actionRow}>
                        <button
                          type="button"
                          style={styles.btnDocsSmall}
                          onClick={() => setDocsFor({ student: a.student, documents: a.documents })}
                        >
                          Documents ({a.documents.length})
                        </button>
                        {a.status === 'Applied' && (
                          <>
                            <button type="button" style={styles.btnReject} onClick={() => updateStatus(a.id, 'Rejected')}>Reject</button>
                            <button type="button" style={styles.btnAccept} onClick={() => updateStatus(a.id, 'Shortlisted')}>Shortlist</button>
                          </>
                        )}
                        {a.status === 'Shortlisted' && (
                          <>
                            <button type="button" style={styles.btnReject} onClick={() => updateStatus(a.id, 'Rejected')}>Reject</button>
                            <button type="button" style={styles.btnSelect} onClick={() => updateStatus(a.id, 'Selected')}>Mark selected</button>
                          </>
                        )}
                        {(a.status === 'Selected' || a.status === 'Rejected') && (
                          <button type="button" style={styles.btnGhost} onClick={() => updateStatus(a.id, 'Applied')}>Reopen</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'companies' && (
          <section>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>Companies that arrived</h2>
                <p style={styles.sectionSub}>{totalCompanies} companies have received applications so far. Click a row to see applicants.</p>
              </div>
            </div>

            {!loading && companyStats.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>No companies yet</p>
                <p style={styles.emptySub}>Companies will appear here once students start applying.</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Company</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Package</th>
                    <th style={styles.th}>Min CGPA</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Applicants</th>
                    <th style={styles.th}>Pending review</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {companyStats.map((c) => (
                    <>
                      <tr key={c.id}>
                        <td style={{ ...styles.td, fontWeight: 600, fontFamily: fonts.display }}>{c.name}</td>
                        <td style={styles.td}>{c.role}</td>
                        <td style={{ ...styles.td, color: colors.teal, fontWeight: 600 }}>{c.package}</td>
                        <td style={styles.td}>{c.minCgpa.toFixed(1)}</td>
                        <td style={styles.td}><span style={styles.statusPill(c.status)}>{c.status}</span></td>
                        <td style={styles.td}>{c.applicantCount}</td>
                        <td style={styles.td}>{c.pendingCount}</td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            style={styles.btnGhost}
                            onClick={() => setExpandedCompany(expandedCompany === c.id ? null : c.id)}
                          >
                            {expandedCompany === c.id ? 'Hide' : 'View applicants'}
                          </button>
                        </td>
                      </tr>
                      {expandedCompany === c.id && (
                        <tr key={`${c.id}-detail`}>
                          <td style={{ ...styles.td, background: 'rgba(15,22,38,0.02)' }} colSpan={8}>
                            {c.apps.length === 0 ? (
                              <span style={{ fontSize: 13, opacity: 0.55 }}>No applicants yet for this drive.</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {c.apps.map((a) => (
                                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
                                    <span>
                                      <strong>{a.student.name}</strong> · {a.student.rollNumber} · CGPA {a.student.cgpa.toFixed(1)}
                                    </span>
                                    <span style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                                      <span style={styles.eligPill(a.eligible)}>{a.eligible ? 'Eligible' : 'Not eligible'}</span>
                                      <span style={styles.statusPill(a.status)}>{a.status}</span>
                                      <button
                                        type="button"
                                        style={styles.btnDocsSmall}
                                        onClick={() => setDocsFor({ student: a.student, documents: a.documents })}
                                      >
                                        Documents ({a.documents.length})
                                      </button>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>

      {docsFor && (
        <DocumentsModal
          student={docsFor.student}
          documents={docsFor.documents}
          onClose={() => setDocsFor(null)}
          onView={handleViewDocument}
        />
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}