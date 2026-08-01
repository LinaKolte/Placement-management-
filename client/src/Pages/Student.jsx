import { useState, useRef, useEffect } from 'react';

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

const STUDENT = {
  name: 'Asha Mehta',
  rollNumber: '21CS1042',
  branch: 'Computer Science',
  cgpa: 8.2,
  backlogs: 0,
};

const COMPANIES = [
  {
    id: 'tcs',
    name: 'TCS',
    role: 'Assistant System Engineer',
    package: '₹3.6 LPA',
    minCgpa: 6.0,
    branches: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical', 'Civil', 'Electrical'],
    backlogs: 'No active backlogs',
    status: 'Open',
    deadline: '12 Jul',
  },
  {
    id: 'infosys',
    name: 'Infosys',
    role: 'Systems Engineer',
    package: '₹4.2 LPA',
    minCgpa: 6.5,
    branches: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical', 'Civil', 'Electrical'],
    backlogs: 'No active backlogs',
    status: 'Open',
    deadline: '15 Jul',
  },
  {
    id: 'google',
    name: 'Google',
    role: 'Software Engineer (Early Career)',
    package: '₹32.0 LPA',
    minCgpa: 8.5,
    branches: ['Computer Science', 'Information Technology'],
    backlogs: 'No active backlogs',
    status: 'Closing soon',
    deadline: '3 Jul',
  },
  {
    id: 'quantara',
    name: 'Quantara Systems',
    role: 'Software Engineer (SDE-1)',
    package: '₹18.0 LPA',
    minCgpa: 7.5,
    branches: ['Computer Science', 'Information Technology'],
    backlogs: 'No active backlogs',
    status: 'Open',
    deadline: '20 Jul',
  },
  {
    id: 'northbridge',
    name: 'Northbridge Analytics',
    role: 'Data Analyst',
    package: '₹12.5 LPA',
    minCgpa: 7.0,
    branches: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
    backlogs: 'No active backlogs',
    status: 'Open',
    deadline: '18 Jul',
  },
  {
    id: 'veritas',
    name: 'Veritas Cloud',
    role: 'Cloud Support Associate',
    package: '₹10.0 LPA',
    minCgpa: 6.5,
    branches: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
    backlogs: 'No active backlogs',
    status: 'Open',
    deadline: '22 Jul',
  },
  {
    id: 'lumen',
    name: 'Lumen Fintech',
    role: 'Software Engineer (Backend)',
    package: '₹20.0 LPA',
    minCgpa: 8.0,
    branches: ['Computer Science', 'Information Technology'],
    backlogs: 'No active backlogs',
    status: 'Open',
    deadline: '9 Jul',
  },
  {
    id: 'sablefield',
    name: 'Sablefield Research',
    role: 'Research Associate',
    package: '₹9.6 LPA',
    minCgpa: 7.2,
    branches: ['Electronics & Communication', 'Computer Science'],
    backlogs: 'No active backlogs',
    status: 'Open',
    deadline: '25 Jul',
  },
];

const REQUIRED_DOCS = [
  { key: 'resume', label: 'Resume', hint: 'PDF, latest version' },
  { key: 'marksheet', label: 'Latest semester marksheet', hint: 'PDF or image' },
  { key: 'idProof', label: 'Government ID proof', hint: 'PDF or image' },
];

// Seed a couple of applications so the dashboard isn't empty on first load.
const initialApplications = {
  tcs: { status: 'Applied', appliedOn: '24 Jun' },
  google: { status: 'Shortlisted', appliedOn: '18 Jun' },
};

const initialDocs = {
  resume: { fileName: 'Asha_Mehta_Resume.pdf', uploadedOn: '20 Jun' },
};

function isEligible(company, student) {
  return (
    company.branches.includes(student.branch) &&
    student.cgpa >= company.minCgpa &&
    (company.backlogs === 'No active backlogs' ? student.backlogs === 0 : true)
  );
}

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
  header: {
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(20px, 4vw, 56px)',
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
  studentChip: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: colors.ink,
    color: colors.paper,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.head,
    fontSize: 13,
    fontWeight: 700,
  },
  studentMeta: { lineHeight: 1.25 },
  studentName: { fontSize: 13.5, fontWeight: 600 },
  studentSub: { fontSize: 12, opacity: 0.55 },
  signOut: {
    border: `1px solid ${colors.lineDark}`,
    background: 'transparent',
    borderRadius: 6,
    padding: '8px 14px',
    fontFamily: fonts.head,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    color: colors.ink,
  },

  body: {
    width: '100%',
    boxSizing: 'border-box',
    maxWidth: 1440,
    margin: '0 auto',
    padding: 'clamp(24px, 3.5vw, 48px) clamp(20px, 4vw, 56px) 80px',
  },

  intro: { marginBottom: 32 },
  h1: { fontFamily: fonts.display, fontSize: 'clamp(26px, 2.6vw, 34px)', fontWeight: 600, margin: '0 0 6px' },
  introSub: { fontSize: 14.5, opacity: 0.65, margin: 0 },

  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
    marginBottom: 36,
  },
  statCard: {
    background: colors.ink,
    color: colors.paper,
    borderRadius: 8,
    padding: '20px 22px',
  },
  statValue: { fontFamily: fonts.head, fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  statLabel: { fontSize: 12.5, opacity: 0.6, marginTop: 4 },

  tabRow: {
    display: 'inline-flex',
    background: '#fff',
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 30,
    padding: 5,
    marginBottom: 26,
  },
  tab: (active) => ({
    border: 'none',
    background: active ? colors.ink : 'transparent',
    padding: '10px 20px',
    borderRadius: 24,
    fontFamily: fonts.head,
    fontSize: 13.5,
    fontWeight: 600,
    color: active ? colors.paper : colors.inkSoft,
    opacity: active ? 1 : 0.6,
    cursor: 'pointer',
  }),

  sectionHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' },
  sectionTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: 600, margin: 0 },
  sectionSub: { fontSize: 13.5, opacity: 0.55, margin: '4px 0 0' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },

  card: {
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 10,
    background: '#fff',
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  companyName: { fontFamily: fonts.display, fontSize: 18, fontWeight: 600, margin: 0 },
  companyRole: { fontSize: 13.5, opacity: 0.6, margin: '4px 0 0' },
  companyPackage: { fontFamily: fonts.head, fontWeight: 700, fontSize: 14, color: colors.teal, whiteSpace: 'nowrap' },

  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  pill: { fontSize: 11.5, fontFamily: fonts.head, padding: '5px 10px', borderRadius: 20, background: 'rgba(15,22,38,0.06)', color: colors.inkSoft },
  statusPill: (kind) => ({
    fontSize: 11.5,
    fontFamily: fonts.head,
    fontWeight: 600,
    padding: '5px 10px',
    borderRadius: 20,
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

  cardFootRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  deadline: { fontSize: 12, opacity: 0.5 },

  btnPrimary: {
    border: 'none',
    borderRadius: 6,
    padding: '10px 16px',
    fontFamily: fonts.head,
    fontWeight: 600,
    fontSize: 13.5,
    background: colors.ink,
    color: colors.paper,
    cursor: 'pointer',
  },
  btnDisabled: {
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 6,
    padding: '10px 16px',
    fontFamily: fonts.head,
    fontWeight: 600,
    fontSize: 13.5,
    background: 'transparent',
    color: colors.inkSoft,
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  btnApplied: {
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 6,
    padding: '10px 16px',
    fontFamily: fonts.head,
    fontWeight: 600,
    fontSize: 13.5,
    background: 'transparent',
    color: colors.inkSoft,
    cursor: 'default',
  },
  notEligible: { fontSize: 12, color: colors.red, opacity: 0.85 },

  emptyState: {
    border: `1px dashed ${colors.lineDark}`,
    borderRadius: 10,
    padding: '40px 24px',
    textAlign: 'center',
    color: colors.inkSoft,
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 18, margin: '0 0 6px' },
  emptySub: { fontSize: 13.5, opacity: 0.6, margin: 0 },

  // Documents
  docCard: {
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 10,
    background: '#fff',
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  docTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  docLabel: { fontFamily: fonts.head, fontSize: 15, fontWeight: 600, margin: 0 },
  docHint: { fontSize: 12.5, opacity: 0.55, margin: '4px 0 0' },
  docFileRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 13, background: 'rgba(51,99,90,0.07)', border: `1px solid rgba(51,99,90,0.2)`, borderRadius: 6, padding: '10px 12px', color: colors.teal },
  docMissing: { fontSize: 13, color: colors.inkSoft, opacity: 0.55 },
  uploadBtn: {
    border: `1px solid ${colors.lineDark}`,
    borderRadius: 6,
    padding: '10px 16px',
    fontFamily: fonts.head,
    fontWeight: 600,
    fontSize: 13.5,
    background: '#fff',
    color: colors.ink,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  removeBtn: {
    border: 'none',
    background: 'none',
    color: colors.red,
    fontFamily: fonts.head,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },

  toast: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: colors.ink,
    color: colors.paper,
    padding: '12px 20px',
    borderRadius: 8,
    fontSize: 13.5,
    fontFamily: fonts.head,
    boxShadow: '0 12px 30px rgba(15,22,38,0.3)',
    zIndex: 100,
  },

  // Apply modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,22,38,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 60,
  },
  modal: {
    background: colors.paper,
    width: '100%',
    maxWidth: 460,
    borderRadius: 10,
    boxShadow: '0 24px 64px rgba(15,22,38,0.35)',
    padding: 'clamp(24px, 3vw, 32px)',
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 22, fontWeight: 600, margin: '0 0 6px' },
  modalSub: { fontSize: 13.5, opacity: 0.6, margin: '0 0 20px', lineHeight: 1.5 },
  modalDocList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 },
  modalDocRow: (ok) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13.5,
    color: ok ? colors.teal : colors.red,
  }),
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  modalCancel: {
    border: `1px solid ${colors.lineDark}`,
    background: 'transparent',
    borderRadius: 6,
    padding: '10px 18px',
    fontFamily: fonts.head,
    fontWeight: 600,
    fontSize: 13.5,
    cursor: 'pointer',
    color: colors.ink,
  },
};

export default function StudentDashboard() {
  useEffect(() => {
    // Defensive reset: clear any width/centering rules a host project's
    // global CSS might apply to html/body/#root, so this page always
    // renders edge-to-edge, matching the login page's behavior.
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

  const [tab, setTab] = useState('opportunities'); // opportunities | applications | documents
  const [applications, setApplications] = useState(initialApplications);
  const [docs, setDocs] = useState(initialDocs);
  const [applyTarget, setApplyTarget] = useState(null); // company object
  const [toast, setToast] = useState('');
  const fileInputs = useRef({});

  // Fetch student's applications from backend
  useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await fetch('http://localhost:5000/api/apply');
        if (!response.ok) throw new Error('Failed to fetch applications');
        const allApplications = await response.json();
        
        // Get student ID from localStorage
        const studentData = JSON.parse(localStorage.getItem('studentUser') || '{}');
        const studentId = studentData.rollNumber || 'unknown';
        
        // Filter applications for this student and convert to our format
        const studentApps = {};
        allApplications.forEach((app) => {
          if (app.student && app.student.rollNumber === studentId) {
            // Find the company in COMPANIES array to get the company ID
            const companyId = COMPANIES.find(c => c.name === app.company.name)?.id;
            if (companyId) {
              studentApps[companyId] = {
                status: app.status || 'Applied',
                appliedOn: app.appliedOn || new Date(app.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
              };
            }
          }
        });
        
        // Only update if we have applications, otherwise keep initial state
        if (Object.keys(studentApps).length > 0) {
          setApplications(studentApps);
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        // Keep using initialApplications on error
      }
    }
    
    fetchApplications();
    // Refresh every 5 seconds to show real-time updates
    const interval = setInterval(fetchApplications, 5000);
    return () => clearInterval(interval);
  }, []);

  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(''), 2600);
  }

  function openApply(company) {
  setApplyTarget(company);
}
async function confirmApply() {
  if (!applyTarget) return;

  try {
    const student = JSON.parse(
      localStorage.getItem("studentUser")
    );

    const response = await fetch(
      "http://localhost:5000/api/apply",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student.rollNumber,
          companyId: applyTarget._id || applyTarget.id,
          companyName: applyTarget.name,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      setApplications((prev) => ({
        ...prev,
        [applyTarget.id]: {
          status: "Applied",
          appliedOn: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
        },
      }));

      showToast("Applied successfully");
      setApplyTarget(null);
    } else {
      showToast(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast("Failed to apply");
  }
}
  function handleFilePick(docKey) {
    fileInputs.current[docKey]?.click();
  }

 async function handleFileChange(docKey, e) {
  const file = e.target.files[0];

  if (!file) return;

  const student = JSON.parse(localStorage.getItem("studentUser"));

  if (!student) {
    showToast("Please login again.");
    return;
  }

  console.log("Logged Student:", student);

  const formData = new FormData();
  formData.append("document", file);
  formData.append("documentType", docKey);
  formData.append("rollNumber", student.rollNumber);

  try {
    const response = await fetch(
      "http://localhost:5000/api/student/upload-document",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (response.ok) {
      setDocs((prev) => ({
        ...prev,
        [docKey]: {
          fileName: data.fileName,
          uploadedOn: new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
        },
      }));

      showToast("Document uploaded successfully.");
    } else {
      showToast(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast("Server Error");
  }

  e.target.value = "";
}
  const appliedCount = Object.keys(applications).length;
  const shortlistedCount = Object.values(applications).filter((a) => a.status === 'Shortlisted').length;
  const docsComplete = REQUIRED_DOCS.filter((d) => docs[d.key]).length;

  const appliedCompanies = COMPANIES.filter((c) => applications[c.id]);
  const initials = STUDENT.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.brand}>
          CampusBridge<span style={styles.brandDot}>.</span>
        </span>
        <div style={styles.headerRight}>
          <div style={styles.studentChip}>
            <div style={styles.avatar}>{initials}</div>
            <div style={styles.studentMeta}>
              <div style={styles.studentName}>{STUDENT.name}</div>
              <div style={styles.studentSub}>{STUDENT.rollNumber} · {STUDENT.branch}</div>
            </div>
          </div>
          <button type="button" style={styles.signOut}>Sign out</button>
        </div>
      </header>

      <div style={styles.body}>
        <div style={styles.intro}>
          <h1 style={styles.h1}>Hi {STUDENT.name.split(' ')[0]}, here's where things stand.</h1>
          <p style={styles.introSub}>Track open drives, your applications, and the documents recruiters need from you.</p>
        </div>

        <div style={styles.statRow}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{appliedCount}</div>
            <div style={styles.statLabel}>Applications sent</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{shortlistedCount}</div>
            <div style={styles.statLabel}>Shortlisted</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{docsComplete}/{REQUIRED_DOCS.length}</div>
            <div style={styles.statLabel}>Documents ready</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{STUDENT.cgpa.toFixed(1)}</div>
            <div style={styles.statLabel}>Your CGPA on file</div>
          </div>
        </div>

        <div style={styles.tabRow}>
          <button type="button" style={styles.tab(tab === 'opportunities')} onClick={() => setTab('opportunities')}>
            Open drives
          </button>
          <button type="button" style={styles.tab(tab === 'applications')} onClick={() => setTab('applications')}>
            My applications
          </button>
          <button type="button" style={styles.tab(tab === 'documents')} onClick={() => setTab('documents')}>
            Documents
          </button>
        </div>

        {tab === 'opportunities' && (
          <section>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>Companies recruiting now</h2>
                <p style={styles.sectionSub}>Eligibility is checked against your branch, CGPA, and backlog record automatically.</p>
              </div>
            </div>
            <div style={styles.grid}>
              {COMPANIES.map((c) => {
                const eligible = isEligible(c, STUDENT);
                const applied = applications[c.id];
                return (
                  <div style={styles.card} key={c.id}>
                    <div style={styles.cardTop}>
                      <div>
                        <h3 style={styles.companyName}>{c.name}</h3>
                        <p style={styles.companyRole}>{c.role}</p>
                      </div>
                      <span style={styles.companyPackage}>{c.package}</span>
                    </div>
                    <div style={styles.pillRow}>
                      <span style={styles.statusPill(c.status)}>{c.status}</span>
                      <span style={styles.pill}>Min CGPA {c.minCgpa.toFixed(1)}</span>
                      <span style={styles.pill}>{c.backlogs}</span>
                    </div>
                    {!eligible && (
                      <span style={styles.notEligible}>You don't meet the eligibility criteria for this drive.</span>
                    )}
                    <div style={styles.cardFootRow}>
                      <span style={styles.deadline}>Apply by {c.deadline}</span>
                      {applied ? (
                        <button type="button" style={styles.btnApplied} disabled>
                          {applied.status === 'Applied' ? 'Applied' : applied.status}
                        </button>
                      ) : eligible ? (
                        <button type="button" style={styles.btnPrimary} onClick={() => openApply(c)}>
                          Apply now
                        </button>
                      ) : (
                        <button type="button" style={styles.btnDisabled} disabled>
                          Not eligible
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === 'applications' && (
          <section>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>My applications</h2>
                <p style={styles.sectionSub}>Status updates as the placement office reviews each drive.</p>
              </div>
            </div>
            {appliedCompanies.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>No applications yet</p>
                <p style={styles.emptySub}>Head to Open drives and apply to a company you're eligible for.</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {appliedCompanies.map((c) => {
                  const app = applications[c.id];
                  return (
                    <div style={styles.card} key={c.id}>
                      <div style={styles.cardTop}>
                        <div>
                          <h3 style={styles.companyName}>{c.name}</h3>
                          <p style={styles.companyRole}>{c.role}</p>
                        </div>
                        <span style={styles.companyPackage}>{c.package}</span>
                      </div>
                      <div style={styles.pillRow}>
                        <span style={styles.statusPill(app.status)}>{app.status}</span>
                      </div>
                      <div style={styles.cardFootRow}>
                        <span style={styles.deadline}>Applied on {app.appliedOn}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'documents' && (
          <section>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>My documents</h2>
                <p style={styles.sectionSub}>Keep these up to date — they're shared automatically with every company you apply to.</p>
              </div>
            </div>
            <div style={styles.grid}>
              {REQUIRED_DOCS.map((d) => {
                const uploaded = docs[d.key];
                return (
                  <div style={styles.docCard} key={d.key}>
                    <div style={styles.docTop}>
                      <div>
                        <h3 style={styles.docLabel}>{d.label}</h3>
                        <p style={styles.docHint}>{d.hint}</p>
                      </div>
                    </div>
                    {uploaded ? (
                      <div style={styles.docFileRow}>
                        <span>{uploaded.fileName} · uploaded {uploaded.uploadedOn}</span>
                        <button type="button" style={styles.removeBtn} onClick={() => removeDoc(d.key)}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span style={styles.docMissing}>Not uploaded yet</span>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      ref={(el) => (fileInputs.current[d.key] = el)}
                      onChange={(e) => handleFileChange(d.key, e)}
                    />
                    <button type="button" style={styles.uploadBtn} onClick={() => handleFilePick(d.key)}>
                      {uploaded ? 'Replace file' : 'Upload file'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {applyTarget && (
        <div style={styles.overlay} onClick={() => setApplyTarget(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Apply to {applyTarget.name}</h2>
            <p style={styles.modalSub}>
              {applyTarget.role} · {applyTarget.package}. Your documents on file will be shared with the recruiter.
            </p>
            <div style={styles.modalDocList}>
              {REQUIRED_DOCS.map((d) => {
                const ok = !!docs[d.key];
                return (
                  <div style={styles.modalDocRow(ok)} key={d.key}>
                    <span>{ok ? '✓' : '✕'}</span>
                    <span>{d.label}{ok ? '' : ' — missing, upload it in Documents first'}</span>
                  </div>
                );
              })}
            </div>
            <div style={styles.modalActions}>
              <button type="button" style={styles.modalCancel} onClick={() => setApplyTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={REQUIRED_DOCS.every((d) => docs[d.key]) ? styles.btnPrimary : styles.btnDisabled}
                disabled={!REQUIRED_DOCS.every((d) => docs[d.key])}
                onClick={confirmApply}
              >
                Submit application
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}