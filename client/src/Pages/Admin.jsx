import { Fragment, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import AdminOverview from '../components/AdminOverview';
import AdminCompaniesDrives from '../components/AdminCompaniesDrives';
import './Admin.css';

const colors = {
  ink: '#0f172a',
  inkSoft: '#475569',
  paper: '#f4fbfb',
  paperStrong: '#ffffff',
  gold: '#d9a640',
  goldSoft: '#f8f1df',
  teal: '#0f766e',
  tealSoft: '#dffaf6',
  red: '#c74d5f',
  redSoft: '#ffe8ec',
  line: 'rgba(15, 118, 110, 0.12)',
  lineDark: 'rgba(15, 118, 110, 0.18)',
  shadow: 'rgba(15, 118, 110, 0.08)',
};

const fonts = {
  display: "'Iowan Old Style', 'Palatino Linotype', Georgia, 'Times New Roman', serif",
  head: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif",
  body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif",
};

function displayCompanyName(name) {
  const value = String(name || 'Company').trim();
  const knownNames = { tcs: 'TCS', infosys: 'Infosys', accenture: 'Accenture', google: 'Google' };
  return knownNames[value.toLowerCase()] || value;
}

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
//     id, name, rollNumber, branch, cgpa, backlogs, twelfthPercentage,
//     documents: [{ id, name, type: "Marksheet" | "Government ID", size, uploadedOn, url }]
//   }
// }
//
// Point this at whichever route on your backend serves that collection.
const API_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL || window.location.origin;
const APPLICATIONS_ENDPOINT = `${API_URL}/api/apply`;

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

const BRANCH_NAMES = {
  CSE: 'Computer Science',
  IT: 'Information Technology',
  ECE: 'Electronics & Communication',
  ME: 'Mechanical',
  MECH: 'Mechanical',
  CE: 'Civil',
  EE: 'Electrical',
  EEE: 'Electrical',
};

function normalizeBranch(branch) {
  if (!branch) return '';
  return BRANCH_NAMES[String(branch).trim().toUpperCase()] || String(branch).trim();
}

function displayBranch(branch) {
  const value = String(branch || '').trim();
  return value.toLowerCase() === 'cse' ? 'CSE' : value;
}

function documentUrl(path) {
  if (!path) return '#';
  const normalized = path.toString().trim().replace(/\\/g, '/');
  if (!normalized) return '#';
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return encodeURI(normalized);
  }

  const uploadsIndex = normalized.toLowerCase().lastIndexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return encodeURI(`${API_URL}${normalized.slice(uploadsIndex)}`);
  }

  const relativePath = normalized.replace(/^\/+/, '');
  if (!relativePath.toLowerCase().startsWith('uploads/')) {
    return encodeURI(`${API_URL}/api/student/document/${encodeURIComponent(relativePath)}`);
  }
  return encodeURI(`${API_URL}/${relativePath}`);
}

function normalizeVerificationDocuments(documents) {
  if (!documents) return [];

  const docMap = {
    resume: 'Resume',
    marksheet: 'Marksheet',
    idProof: 'Government ID',
    profilePhoto: 'Profile photo',
  };

  if (Array.isArray(documents)) {
    return documents.map((d, index) => ({
      id: d._id || d.id || `${d.name || 'doc'}-${index}`,
      url: d.url || d.filePath || d.filepath || d.path || '#',
      filePath: d.filePath || d.filepath || d.path || d.url || '#',
      name: d.name || d.fileName || `Document ${index + 1}`,
      type: d.type || 'Document',
      size: d.size || 'Uploaded file',
      uploadedOn: d.uploadedOn || d.uploadedAt || 'Recently',
    }));
  }

  return Object.entries(documents)
    .filter(([, value]) => value)
    .map(([key, value], index) => {
      const docValue = typeof value === 'string'
        ? { url: value, fileName: value.split('/').pop() || `${docMap[key] || 'Document'} ${index + 1}` }
        : value;

      const docUrl = docValue.url || docValue.filePath || docValue.filepath || docValue.path || '#';
      return {
        id: docValue._id || docValue.id || `${key}-${index}`,
        url: docUrl,
        filePath: docUrl,
        name: docValue.fileName || docValue.name || `${docMap[key] || 'Document'} ${index + 1}`,
        type: docMap[key] || docValue.type || 'Document',
        size: docValue.size || 'Uploaded file',
        uploadedOn: docValue.uploadedOn || docValue.uploadedAt || 'Recently',
      };
    });
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

// Same idea as isEligible/eligibilityReasons, but driven by whatever criteria
// the admin has configured in the notify modal (which starts out prefilled
// from the company's own requirements but can be loosened/tightened).
function matchesNotifyCriteria(student, criteria) {
  if (criteria.branches.length > 0 && !criteria.branches.some((branch) => normalizeBranch(branch) === normalizeBranch(student.branch))) return false;
  if (criteria.minCgpa !== '' && Number.isFinite(Number(criteria.minCgpa))) {
    if (typeof student.cgpa !== 'number' || student.cgpa < Number(criteria.minCgpa)) return false;
  }
  if (criteria.minTwelfth !== '' && Number.isFinite(Number(criteria.minTwelfth))) {
    if (typeof student.twelfthPercentage !== 'number' || student.twelfthPercentage < Number(criteria.minTwelfth)) return false;
  }
  if (criteria.noBacklogs) {
    if (typeof student.backlogs !== 'number' || student.backlogs > 0) return false;
  }
  return true;
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
    width: '100%',
    maxWidth: '100%',
    marginLeft: 0,
    marginRight: 0,
    fontFamily: fonts.body,
    color: colors.ink,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #f4fbfb 0%, #edf6f7 100%)',
  },

  // ---------------- Login ----------------
  loginWrap: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #0f766e 100%)',
    padding: 16,
  },
  loginCard: {
    width: '100%',
    maxWidth: 380,
    background: colors.paper,
    borderRadius: 10,
    padding: 'clamp(28px, 4vw, 40px)',
    boxShadow: '0 24px 60px rgba(20,45,50,0.22)',
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
    borderRadius: 8,
    padding: '12px 16px',
    fontFamily: fonts.head,
    fontWeight: 700,
    fontSize: 14,
    background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
    color: colors.paper,
    cursor: 'pointer',
    marginTop: 6,
    boxShadow: '0 14px 22px rgba(11,94,215,0.2)',
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
    padding: '0 clamp(20px, 4vw, 64px)',
    height: 72,
    borderBottom: `1px solid ${colors.lineDark}`,
    background: 'rgba(255,255,255,0.84)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 8px 24px rgba(20,45,50,0.04)',
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
  workspace: { display: 'flex', alignItems: 'stretch', width: '100%', maxWidth: 'none', margin: '0', flex: 1, minHeight: 0, minWidth: 0 },
  sidebar: { width: 320, flex: '0 0 320px', boxSizing: 'border-box', padding: '28px 22px', borderRight: '1px solid rgba(255,255,255,0.08)', background: '#102536', color: '#E7F0F5' },
  sidebarBrand: { padding: '0 12px 20px', fontFamily: fonts.head, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#E7F0F5', opacity: 0.9 },
  sidebarSection: { padding: '14px 12px 7px', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#AFC4D2', opacity: 0.8 },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: 3 },
  sidebarButton: (active) => ({ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid transparent', borderRadius: 10, padding: '10px 12px', background: active ? '#1D526B' : 'transparent', color: active ? '#ffffff' : '#C8D9E3', fontFamily: fonts.head, fontSize: 13, fontWeight: active ? 700 : 600, textAlign: 'left', cursor: 'pointer', boxShadow: active ? '0 10px 22px rgba(0,0,0,0.2)' : 'none' }),
  sidebarCount: (active) => ({ fontSize: 11, opacity: active ? 0.8 : 0.5, fontVariantNumeric: 'tabular-nums' }),
  signOut: {
    border: `1px solid ${colors.lineDark}`, background: 'transparent', borderRadius: 6, padding: '8px 14px',
    fontFamily: fonts.head, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: colors.ink,
  },

  body: { width: '100%', minWidth: 0, boxSizing: 'border-box', maxWidth: 'none', flex: 1, minHeight: 0, height: '100%', margin: 0, padding: '38px clamp(22px, 3vw, 52px) 80px', overflowY: 'auto', overflowX: 'hidden' },

  intro: { marginBottom: 22, padding: 0, border: 0, borderRadius: 0, background: 'transparent', boxShadow: 'none' },
  h1: { fontFamily: fonts.display, fontSize: 'clamp(26px, 2.6vw, 34px)', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' },
  introSub: { fontSize: 14.5, opacity: 0.65, margin: 0 },

  statRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 30 },
  statCard: { minHeight: 128, background: colors.paperStrong, color: colors.ink, border: `1px solid ${colors.lineDark}`, borderRadius: 18, padding: '18px 18px', boxShadow: '0 16px 28px rgba(15, 118, 110, 0.05)', position: 'relative', overflow: 'hidden' },
  dashboardKpiHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dashboardKpiIcon: { width: 27, height: 27, display: 'grid', placeItems: 'center', borderRadius: 8, background: colors.tealSoft, color: colors.teal, fontSize: 13, fontWeight: 800 },
  statValue: { fontFamily: fonts.head, fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  statLabel: { fontSize: 12.5, opacity: 0.72, marginTop: 6 },
  placementDashboard: { display: 'flex', flexDirection: 'column', gap: 18 },
  placementKpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 },
  placementKpi: { padding: '13px 15px', borderRadius: 10, background: '#fff', border: `1px solid ${colors.line}`, boxShadow: '0 5px 14px rgba(15,23,42,0.035)' },
  placementKpiLabel: { fontSize: 11, color: colors.inkSoft, opacity: 0.58, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 },
  placementKpiValue: { marginTop: 5, fontFamily: fonts.head, fontSize: 19, fontWeight: 800, color: colors.ink },
  placementAnalytics: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18 },
  placementPanel: { background: '#fff', border: `1px solid ${colors.lineDark}`, borderRadius: 12, padding: '18px 20px', boxShadow: '0 7px 18px rgba(15,23,42,0.035)' },
  placementPanelTitle: { margin: 0, fontFamily: fonts.head, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.inkSoft },
  placementDonut: { width: 156, height: 156, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '20px auto 15px' },
  placementDonutInner: { width: 104, height: 104, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1.1 },
  placementLegend: { display: 'flex', justifyContent: 'center', gap: 18, fontSize: 11.5, color: colors.inkSoft },
  placementLegendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  placementLegendDot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color }),
  placementPackageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 10, marginTop: 15 },
  placementPackage: { background: colors.paper, borderRadius: 9, padding: '12px 10px', textAlign: 'center' },
  placementPackageLabel: { fontSize: 10.5, opacity: 0.58, fontWeight: 700 },
  placementPackageValue: { fontFamily: fonts.head, fontSize: 15, fontWeight: 800, marginTop: 4, color: colors.teal },
  placementTableWrap: { overflowX: 'auto', border: `1px solid ${colors.lineDark}`, borderRadius: 12, background: '#fff' },
  placementTable: { width: '100%', minWidth: 620, borderCollapse: 'collapse' },
  placementTh: { textAlign: 'left', padding: '11px 14px', background: colors.ink, color: colors.paper, fontFamily: fonts.head, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  placementTd: { padding: '12px 14px', borderBottom: `1px solid ${colors.line}`, fontSize: 13, color: colors.inkSoft },
  placementStudent: { fontFamily: fonts.head, fontWeight: 700, color: colors.ink },
  dashboardActionRow: { display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' },
  dashboardWidget: { border: `1px solid ${colors.lineDark}`, borderRadius: 18, background: '#fff', padding: '20px 22px', boxShadow: '0 14px 32px rgba(15, 118, 110, 0.05)' },
  dashboardWidgetTitle: { margin: 0, color: colors.ink, fontFamily: fonts.head, fontSize: 14, fontWeight: 800 },
  dashboardWidgetSub: { margin: '4px 0 16px', color: colors.inkSoft, opacity: .62, fontSize: 12 },
  dashboardKpiMeta: { marginTop: 7, color: colors.teal, fontSize: 10.5, fontWeight: 700 },
  dashboardTwoColumn: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(260px, .65fr)', gap: 16, marginBottom: 16 },
  funnelList: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 },
  funnelStage: { minWidth: 0, padding: '13px 12px', borderRadius: 10, background: colors.paper, border: `1px solid ${colors.lineDark}` },
  funnelStageLabel: { color: colors.muted, fontSize: 11, fontWeight: 700 },
  funnelStageValue: { color: colors.ink, fontSize: 21, fontWeight: 800, marginTop: 5 },
  funnelConversion: { color: colors.teal, fontSize: 10.5, fontWeight: 700, marginTop: 5 },
  attentionList: { display: 'grid', gap: 10, margin: 0, padding: 0, listStyle: 'none' },
  attentionItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${colors.line}`, fontSize: 12.5 },
  attentionIcon: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }),
  interviewList: { display: 'grid', gap: 2 },
  interviewRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 10, alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${colors.line}`, fontSize: 12 },
  activityList: { display: 'grid', gap: 10, margin: 0, padding: 0, listStyle: 'none' },
  activityItem: { display: 'flex', gap: 10, alignItems: 'flex-start', color: colors.inkSoft, fontSize: 12.5, lineHeight: 1.45 },
  activityDot: { width: 7, height: 7, marginTop: 5, flexShrink: 0, borderRadius: '50%', background: colors.teal },
  quickAccessGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 9 },
  quickAccessItem: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, padding: '13px 14px', border: `1px solid ${colors.lineDark}`, borderRadius: 10, background: colors.paper, color: colors.ink, cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s ease, transform .15s ease' },

  tabRow: { display: 'flex', width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.86)', border: `1px solid ${colors.lineDark}`, borderRadius: 12, padding: 4, marginBottom: 22, flexWrap: 'wrap', boxShadow: '0 6px 16px rgba(20, 45, 50, 0.035)' },
  tab: (active) => ({
    flex: '1 1 150px', border: 'none', background: active ? 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)' : 'transparent', padding: '10px 14px', borderRadius: 8,
    fontFamily: fonts.head, fontSize: 13, fontWeight: 700, color: active ? colors.paper : colors.inkSoft, opacity: active ? 1 : 0.7, cursor: 'pointer', boxShadow: active ? '0 10px 18px rgba(11,94,215,0.18)' : 'none',
  }),

  sectionHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' },
  sectionTitle: { fontFamily: fonts.display, fontSize: 24, fontWeight: 600, margin: 0, color: colors.ink },
  sectionSub: { fontSize: 15.5, opacity: 0.7, margin: '4px 0 0', color: colors.inkSoft },

  filterRow: { display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center', padding: '10px 12px', border: `1px solid ${colors.line}`, borderRadius: 10, background: 'rgba(255,255,255,0.62)', marginBottom: 10 },
  filterGroupLabel: { fontFamily: fonts.head, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkSoft, opacity: 0.5, alignSelf: 'center', marginRight: 2 },
  filterBtn: (active) => ({
    border: `1px solid ${colors.lineDark}`, background: active ? colors.ink : '#fff', color: active ? colors.paper : colors.inkSoft,
    borderRadius: 20, padding: '7px 14px', fontFamily: fonts.head, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  }),
  searchInput: {
    border: `1px solid ${colors.lineDark}`, borderRadius: 20, padding: '9px 14px', fontFamily: fonts.body, fontSize: 13,
    background: '#fff', color: colors.ink, minWidth: 220, boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.02)',
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },

  card: { border: `1px solid ${colors.lineDark}`, borderRadius: 14, background: colors.paperStrong, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 10px 24px rgba(20, 45, 50, 0.05)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  appName: { fontFamily: fonts.display, fontSize: 17, fontWeight: 600, margin: 0 },
  appSub: { fontSize: 13, opacity: 0.6, margin: '4px 0 0' },
  companyPackage: { fontFamily: fonts.head, fontWeight: 700, fontSize: 13.5, color: colors.teal, whiteSpace: 'nowrap' },

  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  pill: { fontSize: 11.5, fontFamily: fonts.head, padding: '5px 10px', borderRadius: 20, background: 'rgba(15,22,38,0.06)', color: colors.inkSoft },
  statusPill: (kind) => ({
    fontSize: 13, fontFamily: fonts.head, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
    background:
      kind === 'Shortlisted' ? 'rgba(217,164,65,0.18)' :
      kind === 'Selected' ? 'rgba(51,99,90,0.14)' :
      kind === 'Placed' ? 'rgba(15,118,110,0.18)' :
      kind === 'Rejected' ? 'rgba(192,69,58,0.12)' :
      kind === 'Open' ? 'rgba(51,99,90,0.12)' :
      kind === 'Closing soon' ? 'rgba(192,69,58,0.12)' :
      'rgba(15,22,38,0.07)',
    color:
      kind === 'Shortlisted' ? '#9A6B12' :
      kind === 'Selected' ? colors.teal :
      kind === 'Placed' ? colors.teal :
      kind === 'Rejected' ? colors.red :
      kind === 'Open' ? colors.teal :
      kind === 'Closing soon' ? colors.red :
      colors.inkSoft,
  }),
  eligPill: (ok) => ({
    fontSize: 13, fontFamily: fonts.head, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
    background: ok ? 'rgba(51,99,90,0.12)' : 'rgba(192,69,58,0.12)',
    color: ok ? colors.teal : colors.red,
  }),

  reasonList: { margin: '2px 0 0', paddingLeft: 16, fontSize: 12, color: colors.red, opacity: 0.85, lineHeight: 1.6 },

  cardFootRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  deadline: { fontSize: 12, opacity: 0.5 },
  actionRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },

  btnAccept: {
    border: 'none', borderRadius: 8, padding: '9px 14px', fontFamily: fonts.head, fontWeight: 600, fontSize: 14,
    background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)', color: colors.paper, cursor: 'pointer', boxShadow: '0 12px 18px rgba(15,118,110,0.18)',
  },
  btnReject: {
    border: `1px solid ${colors.red}`, borderRadius: 8, padding: '9px 14px', fontFamily: fonts.head, fontWeight: 600, fontSize: 13,
    background: 'transparent', color: colors.red, cursor: 'pointer',
  },
  btnSelect: {
    border: 'none', borderRadius: 8, padding: '9px 14px', fontFamily: fonts.head, fontWeight: 600, fontSize: 13,
    background: 'linear-gradient(135deg, #0f172a 0%, #0f766e 100%)', color: colors.paper, cursor: 'pointer',
  },
  btnGhost: {
    border: `1px solid ${colors.lineDark}`, borderRadius: 8, padding: '9px 14px', fontFamily: fonts.head, fontWeight: 600, fontSize: 13,
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
  btnNotify: {
    border: 'none', borderRadius: 6, padding: '6px 12px', fontFamily: fonts.head, fontWeight: 600, fontSize: 12,
    background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)', color: colors.paper, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
  },
  btnNotifyDisabled: {
    opacity: 0.55, cursor: 'default',
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
  th: { textAlign: 'left', fontFamily: fonts.head, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkSoft, opacity: 0.6, padding: '12px 16px', borderBottom: `1px solid ${colors.lineDark}` },
  td: { padding: '13px 16px', fontSize: 15, borderBottom: `1px solid ${colors.lineDark}`, verticalAlign: 'middle' },

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

  // ---------------- Notify eligible students modal ----------------
  notifyModalCard: {
    width: '100%', maxWidth: 620, maxHeight: '88vh', overflowY: 'auto', background: colors.paper,
    borderRadius: 12, boxShadow: '0 30px 80px rgba(0,0,0,0.4)', padding: 'clamp(22px, 3vw, 30px)',
  },
  criteriaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 6 },
  criteriaField: { display: 'flex', flexDirection: 'column', gap: 6 },
  criteriaLabel: { fontFamily: fonts.head, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkSoft, opacity: 0.6 },
  checkboxChipRow: { display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 4 },
  checkboxChip: (active) => ({
    border: `1px solid ${colors.lineDark}`, background: active ? colors.ink : '#fff', color: active ? colors.paper : colors.inkSoft,
    borderRadius: 18, padding: '6px 12px', fontFamily: fonts.head, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  }),
  toggleRow: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: fonts.head, fontSize: 12.5, fontWeight: 600, color: colors.inkSoft, cursor: 'pointer', userSelect: 'none' },
  divider: { height: 1, background: colors.lineDark, margin: '18px 0' },
  matchSummaryRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
  matchCount: { fontFamily: fonts.head, fontSize: 13.5, fontWeight: 700, color: colors.teal },
  matchListWrap: { border: `1px solid ${colors.lineDark}`, borderRadius: 8, background: '#fff', maxHeight: 190, overflowY: 'auto' },
  matchRow: { display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 12px', borderBottom: `1px solid ${colors.lineDark}`, fontSize: 12.5 },
  matchRowName: { fontWeight: 600 },
  matchRowMeta: { opacity: 0.55, whiteSpace: 'nowrap' },
  textarea: {
    width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.lineDark}`, borderRadius: 8, padding: '11px 13px',
    fontSize: 13.5, fontFamily: fonts.body, background: '#fff', color: colors.ink, resize: 'vertical', minHeight: 90,
  },
  modalFooterRow: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  inlineNotifyBox: { border: `1px solid rgba(11,94,215,0.22)`, borderRadius: 14, background: 'linear-gradient(135deg, rgba(11,94,215,0.06), #fff 58%)', padding: '18px 20px', marginBottom: 22, boxShadow: '0 8px 22px rgba(11,94,215,0.05)' },
  inlineNotifyHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 13, flexWrap: 'wrap' },
  inlineNotifyTitle: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  inlineNotifyIcon: { width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 9, background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)', color: '#fff', fontSize: 15, fontWeight: 700, flexShrink: 0 },
  inlineNotifyHint: { margin: '3px 0 0', color: colors.inkSoft, opacity: 0.56, fontSize: 12 },
  inlineNotifyCount: { borderRadius: 20, padding: '6px 10px', background: 'rgba(15,118,110,0.1)', color: colors.teal, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' },
  inlineNotifyActions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10, flexWrap: 'wrap' },
  inlineNotifyShortcut: { color: colors.inkSoft, opacity: 0.48, fontSize: 11.5 },
};

const DEFAULT_ADMIN = { name: 'Placement Office', role: 'Administrator' };

const placementChartPalette = ['#0f766e', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#9333ea', '#db2777', '#65a30d', '#2563eb'];

function PlacementPieChart({ parts, total, size = 220 }) {
  const center = size / 2;
  const radius = size / 2 - 10;
  const point = (degrees) => {
    const radians = degrees * Math.PI / 180;
    return [center + radius * Math.cos(radians), center + radius * Math.sin(radians)];
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Branch-wise student distribution">
      {parts.map((part, index) => {
        const fraction = part.value / total;
        const precedingValue = parts.slice(0, index).reduce((sum, item) => sum + item.value, 0);
        const start = -90 + (precedingValue / total) * 360;
        const end = start + fraction * 360;
        const [startX, startY] = point(start);
        const [endX, endY] = point(end);
        const largeArc = fraction > 0.5 ? 1 : 0;
        const path = fraction >= 0.999
          ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} Z`
          : `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
        const labelAngle = (start + end) / 2 * Math.PI / 180;
        const labelRadius = radius * 0.62;
        const percentage = Math.round(fraction * 100);
        return (
          <g key={part.label}>
            <path d={path} fill={part.color} stroke="#ffffff" strokeWidth="2" />
            {percentage >= 5 && (
              <text x={center + labelRadius * Math.cos(labelAngle)} y={center + labelRadius * Math.sin(labelAngle)} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="11" fontWeight="700">
                {percentage}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Branches that should always appear as filter options, regardless of
// whether any student in the current data belongs to them yet. Any other
// branch name found in the fetched applications is merged in alongside these.
const BASE_BRANCH_OPTIONS = ['Computer Science', 'EXTC', 'IT', 'Mechanical'];

function defaultNotifyMessage(company) {
  return `We're excited to let you know that ${company.name} is recruiting for the role of ${company.role || 'an open position'}${company.package ? ` (package: ${company.package})` : ''}. Based on your profile, you meet the eligibility criteria for this drive. Please check the placement portal for the application deadline and next steps.`;
}

function defaultNotifySubject(company) {
  return `${company.name} is hiring${company.role ? ` — ${company.role}` : ''}`;
}

function DocumentsModal({ student, documents, onClose }) {
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
                      <p style={{ fontSize: 13, opacity: 0.65, margin: '5px 0 0', wordBreak: 'break-all' }}>{url}</p>
                    </div>
                  </div>
                  <div style={styles.docActions}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.docViewBtn}
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

// Opens when the admin clicks "Notify eligible students" on a company row.
// Criteria starts prefilled from the company's own requirements (min CGPA,
// branches, no-backlogs) but the admin can loosen or tighten it — the
// matched-student list below updates live against the full student roster
// (fetched fresh here, independent of whatever filters are active on the
// Students tab) so the admin always sees exactly who is about to be emailed
// before anything is sent.
function NotifyEligibleStudentsModal({ company, branchOptions, sending, onClose, onSend }) {
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [minCgpa, setMinCgpa] = useState(typeof company.minCgpa === 'number' ? String(company.minCgpa) : '');
  const [minTwelfth, setMinTwelfth] = useState(typeof company.twelfthPercentage === 'number' ? String(company.twelfthPercentage) : '');
  const [branches, setBranches] = useState(Array.isArray(company.branches) ? company.branches : []);
  const [noBacklogs, setNoBacklogs] = useState(!!company.noBacklogs);
  const [subject, setSubject] = useState(defaultNotifySubject(company));
  const [message, setMessage] = useState(defaultNotifyMessage(company));

  useEffect(() => {
    let cancelled = false;
    async function fetchAllStudents() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/student/profiles`);
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        if (!Array.isArray(data)) throw new Error('Expected an array of student profiles from the API');
        setAllStudents(data);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError('Could not load the student roster to check eligibility against.');
          setAllStudents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAllStudents();
    return () => { cancelled = true; };
  }, []);

  function toggleBranch(b) {
    setBranches((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  const criteria = { minCgpa, minTwelfth, branches, noBacklogs };

  const matchedStudents = useMemo(
    () => allStudents.filter((s) => matchesNotifyCriteria(s, criteria)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allStudents, minCgpa, minTwelfth, branches, noBacklogs]
  );

  const canSend = !loading && !sending && matchedStudents.length > 0 && subject.trim().length > 0 && message.trim().length > 0;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.notifyModalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeadRow}>
          <div>
            <h3 style={styles.modalTitle}>Notify students — {company.name}</h3>
            <p style={styles.modalSub}>{company.role}{company.package ? ` · ${company.package}` : ''}</p>
          </div>
          <button type="button" style={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={styles.criteriaGrid}>
          <div style={styles.criteriaField}>
            <span style={styles.criteriaLabel}>Min CGPA</span>
            <input
              style={styles.input}
              type="number"
              min="0"
              max="10"
              step="0.1"
              placeholder="No minimum"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
            />
          </div>
          <div style={styles.criteriaField}>
            <span style={styles.criteriaLabel}>Min 12th %</span>
            <input
              style={styles.input}
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="No minimum"
              value={minTwelfth}
              onChange={(e) => setMinTwelfth(e.target.value)}
            />
          </div>
          <div style={styles.criteriaField}>
            <span style={styles.criteriaLabel}>Backlogs</span>
            <label style={styles.toggleRow}>
              <input type="checkbox" checked={noBacklogs} onChange={(e) => setNoBacklogs(e.target.checked)} />
              Require zero backlogs
            </label>
          </div>
        </div>

        <div style={styles.criteriaField}>
          <span style={styles.criteriaLabel}>Branches {branches.length === 0 ? '(any branch)' : ''}</span>
          <div style={styles.checkboxChipRow}>
            {branchOptions.map((b) => (
              <button key={b} type="button" style={styles.checkboxChip(branches.includes(b))} onClick={() => toggleBranch(b)}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.matchSummaryRow}>
          <span style={styles.matchCount}>
            {loading ? 'Checking roster…' : `${matchedStudents.length} student${matchedStudents.length === 1 ? '' : 's'} match this criteria`}
          </span>
        </div>

        {error && <p style={{ fontSize: 12.5, color: colors.red, margin: '0 0 10px' }}>{error}</p>}

        {!loading && !error && (
          <div style={styles.matchListWrap}>
            {matchedStudents.length === 0 ? (
              <div style={styles.docEmptyState}>No students currently match this criteria.</div>
            ) : (
              matchedStudents.map((s) => (
                <div style={styles.matchRow} key={s.rollNumber || s._id}>
                  <span style={styles.matchRowName}>{s.name || 'Unknown'}</span>
                  <span style={styles.matchRowMeta}>
                    {s.rollNumber || '—'} · {s.branch || '—'}
                    {typeof s.cgpa === 'number' ? ` · CGPA ${s.cgpa.toFixed(1)}` : ''}
                    {` · ${s.email || 'No email address'}`}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ ...styles.criteriaField, marginTop: 18 }}>
          <span style={styles.criteriaLabel}>Subject</span>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. Acme Corp is hiring — SDE Intern"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div style={{ ...styles.criteriaField, marginTop: 14 }}>
          <span style={styles.criteriaLabel}>Email body</span>
          <textarea style={styles.textarea} value={message} onChange={(e) => setMessage(e.target.value)} rows={6} />
        </div>

        <div style={styles.modalFooterRow}>
          <button type="button" style={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button
            type="button"
            style={{ ...styles.btnAccept, ...(canSend ? {} : { opacity: 0.5, cursor: 'default' }) }}
            disabled={!canSend}
            onClick={() => onSend(matchedStudents, subject.trim(), message.trim())}
          >
            {sending ? 'Sending…' : `Send to ${matchedStudents.length} student${matchedStudents.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewShortlistView({ records, loading, error, onSchedule, onRecordRound }) {
  const groupedRecords = records.reduce((groups, record) => {
    const companyName = record.companyName || 'Unknown company';
    if (!groups[companyName]) groups[companyName] = [];
    groups[companyName].push(record);
    return groups;
  }, {});

  if (loading) {
    return <div style={styles.statusBanner}><span style={styles.statusDot} /><p style={styles.statusText}>Loading interview shortlist…</p></div>;
  }
  if (error) {
    return <div style={{ ...styles.statusBanner, ...styles.statusBannerError }}><span style={{ ...styles.statusDot, ...styles.statusDotError }} /><p style={styles.statusText}>{error}</p></div>;
  }
  if (!records.length) {
    return <div style={styles.emptyState}><p style={styles.emptyTitle}>No students shortlisted yet</p><p style={styles.emptySub}>Students will appear here after their application is moved to Shortlisted.</p></div>;
  }

  return <div style={{ display: 'grid', gap: 18 }}>
    {Object.entries(groupedRecords).map(([companyName, companyRecords]) => (
      <section key={companyName} style={{ ...styles.dashboardWidget, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.lineDark}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div><h2 style={{ ...styles.dashboardWidgetTitle, margin: 0 }}>{displayCompanyName(companyName)}</h2><p style={{ ...styles.dashboardWidgetSub, margin: '4px 0 0' }}>Interview shortlist</p></div>
          <span style={{ ...styles.inlineNotifyCount }}>{companyRecords.length} student{companyRecords.length === 1 ? '' : 's'}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Student</th><th style={styles.th}>Roll number</th><th style={styles.th}>Branch</th><th style={styles.th}>Status</th><th style={styles.th}>Interview</th><th style={styles.th}>Action</th></tr></thead>
            <tbody>{companyRecords.map((record) => {
              const student = record.student || {};
              const schedule = record.interviewSchedule || {};
              const interview = schedule.date ? `${schedule.date}${schedule.time ? ` · ${schedule.time}` : ''}` : 'Not scheduled';
              return <tr key={record._id || record.applicationId}>
                <td style={styles.td}><strong>{student.name || `Student ${record.studentId}`}</strong>{student.email && <div style={{ fontSize: 12, color: colors.inkSoft }}>{student.email}</div>}</td>
                <td style={styles.td}>{record.studentId}</td>
                <td style={styles.td}>{student.branch || '—'}</td>
                <td style={styles.td}><span style={styles.statusPill(record.status)}>{record.status}</span></td>
                <td style={styles.td}>{interview}{schedule.location && <div style={{ fontSize: 12, color: colors.inkSoft }}>{schedule.location}</div>}</td>
                <td style={styles.td}>
                  <div style={styles.actionRow}>
                    <button type="button" style={styles.btnSelect} onClick={() => onSchedule(record)}>{record.status === 'Interview Scheduled' ? 'Reschedule interview' : 'Schedule interview'}</button>
                    {record.status === 'Interview Scheduled' && (
                      <button type="button" style={styles.btnAccept} onClick={() => onRecordRound(record)}>Record round result</button>
                    )}
                  </div>
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </section>
    ))}
  </div>;
}

export default function Admin() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const readStoredUser = (key) => {
      try {
        return JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        return null;
      }
    };
    const user = readStoredUser('admin') || readStoredUser('user');
    if (!token || user?.role !== 'admin') navigate('/admin/login');
  }, [navigate]);

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
      height: '100%',
      maxWidth: 'none',
      minWidth: '0',
      textAlign: 'initial',
      display: 'block',
      boxSizing: 'border-box',
      overflow: 'hidden',
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

  const [tab, setTab] = useState('dashboard'); // dashboard | applications | companies | interview-shortlist | placement-records | profile-verification
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState([]); // empty = all branches
  const [applicationCompanyFilter, setApplicationCompanyFilter] = useState('All');
  const [applicationBranchFilter, setApplicationBranchFilter] = useState('All');
  const [applicationPage, setApplicationPage] = useState(1);
  const [applicationPageSize, setApplicationPageSize] = useState(25);
  const [placementBranchFilter, setPlacementBranchFilter] = useState('All');
  const [placementStatusFilter, setPlacementStatusFilter] = useState('All');
  const [placementSearch, setPlacementSearch] = useState('');
  const [placementAddOpen, setPlacementAddOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [cgpaFilter, setCgpaFilter] = useState('');
  const [twelfthFilter, setTwelfthFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranchFilter, setStudentBranchFilter] = useState('');
  const [studentCgpaFilter, setStudentCgpaFilter] = useState('');
  const [notifyingStudents, setNotifyingStudents] = useState(false);
  const [studentTwelfthFilter, setStudentTwelfthFilter] = useState('');
  const [studentRefreshKey, setStudentRefreshKey] = useState(0);
  const [applications, setApplications] = useState([]);
  const [interviewShortlist, setInterviewShortlist] = useState([]);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [shortlistError, setShortlistError] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile Verification states
  const [profileVerifications, setProfileVerifications] = useState([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSearch, setVerificationSearch] = useState('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('All');
  const [verificationBranchFilter, setVerificationBranchFilter] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyModalData, setVerifyModalData] = useState(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [verificationNotice, setVerificationNotice] = useState(null);

  const studentBranchOptions = useMemo(() => {
    const set = new Set(BASE_BRANCH_OPTIONS);
    students.forEach((student) => {
      if (student.branch) set.add(student.branch);
    });
    return Array.from(set).sort();
  }, [students]);  const [studentLoading, setStudentLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [studentLoadError, setStudentLoadError] = useState(null);
  const [toast, setToast] = useState('');
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [sendingEmailsFor, setSendingEmailsFor] = useState(null);
  const [docsFor, setDocsFor] = useState(null); // { student, documents } for the open modal, or null
  const [notifyModalFor, setNotifyModalFor] = useState(null); // company object for the open notify modal, or null
  const [visibleNotifyMessage, setVisibleNotifyMessage] = useState('Please check the placement portal for important updates from the placement office.');
  const [analytics, setAnalytics] = useState({ total: 0, placed: 0, selected: 0, shortlisted: 0, rejected: 0, placedPercentage: 0 });
  const [managedCompanies, setManagedCompanies] = useState([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [companySaving, setCompanySaving] = useState(false);
  const [adminEntryOpen, setAdminEntryOpen] = useState(false);
  const [adminEntrySaving, setAdminEntrySaving] = useState(false);
  const [adminEntry, setAdminEntry] = useState({
    studentName: '', rollNumber: '', email: '', branch: '', companyName: '', package: '', status: 'Selected',
  });
  const [interviewModal, setInterviewModal] = useState(null); // { appId, studentName, companyName }
  const [interviewDraft, setInterviewDraft] = useState({
    date: '', time: '', round: 'Round 1', location: '', panel: '', notes: '',
  });
  const [roundModal, setRoundModal] = useState(null); // { appId, studentName, companyName }
  const [roundDraft, setRoundDraft] = useState({
    roundName: 'Aptitude', date: '', time: '', location: '', score: '', feedback: '', status: 'Qualified',
  });
  const [companyDraft, setCompanyDraft] = useState({
    name: '', role: '', package: '', minCgpa: '', minTenthPercentage: '',
    minTwelfthPercentage: '', maxBacklogs: '', branches: '', noBacklogs: true, status: 'Open', applicationStart: '', deadline: '',
  });

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch(`${APPLICATIONS_ENDPOINT}/analytics`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        });
        if (response.ok) setAnalytics(await response.json());
      } catch (error) {
        console.error('Error loading placement analytics:', error);
      }
    }
    fetchAnalytics();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchManagedCompanies() {
      setCompanyLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/companies?includeClosed=true`);
        if (!response.ok) throw new Error('Could not load placement drives');
        const data = await response.json();
        if (!cancelled) setManagedCompanies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading company drives:', error);
        if (!cancelled) showToast(error.message);
      } finally {
        if (!cancelled) setCompanyLoading(false);
      }
    }

    fetchManagedCompanies();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  function startCompanyCreate() {
    setEditingCompanyId(null);
    setCompanyDraft({ name: '', role: '', package: '', minCgpa: '', minTenthPercentage: '', minTwelfthPercentage: '', maxBacklogs: '', branches: '', noBacklogs: true, status: 'Open', applicationStart: '', deadline: '' });
    setCompanyFormOpen(true);
  }

  function startCompanyEdit(company) {
    setEditingCompanyId(company._id);
    setCompanyDraft({
      name: company.name || '', role: company.role || '', package: company.package || '',
      minCgpa: company.minCgpa ?? '', minTenthPercentage: company.minTenthPercentage ?? '',
      minTwelfthPercentage: company.minTwelfthPercentage ?? '', maxBacklogs: company.maxBacklogs ?? '', branches: (company.branches || []).join(', '),
      noBacklogs: !!company.noBacklogs, status: company.status || 'Open',
      applicationStart: toDateTimeLocal(company.applicationStart),
      deadline: toDateTimeLocal(company.deadline),
    });
    setCompanyFormOpen(true);
  }

  async function saveCompany() {
    if (!companyDraft.name.trim() || !companyDraft.role.trim()) {
      showToast('Company name and role are required.');
      return;
    }
    const payload = {
      ...companyDraft,
      minCgpa: companyDraft.minCgpa === '' ? null : Number(companyDraft.minCgpa),
      minTenthPercentage: companyDraft.minTenthPercentage === '' ? null : Number(companyDraft.minTenthPercentage),
      minTwelfthPercentage: companyDraft.minTwelfthPercentage === '' ? null : Number(companyDraft.minTwelfthPercentage),
      maxBacklogs: companyDraft.maxBacklogs === '' ? null : Number(companyDraft.maxBacklogs),
      branches: companyDraft.branches.split(',').map((branch) => branch.trim()).filter(Boolean),
      applicationStart: companyDraft.applicationStart || null,
      deadline: companyDraft.deadline || null,
    };
    setCompanySaving(true);
    try {
      const response = await fetch(editingCompanyId ? `${API_URL}/api/companies/${editingCompanyId}` : `${API_URL}/api/companies`, {
        method: editingCompanyId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save company drive');
      setManagedCompanies((prev) => editingCompanyId
        ? prev.map((company) => company._id === editingCompanyId ? data.company : company)
        : [...prev, data.company]);
      setCompanyFormOpen(false);
      showToast(editingCompanyId ? 'Company drive updated.' : 'Company drive created.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setCompanySaving(false);
    }
  }

  async function saveAdminEntry(event) {
    event.preventDefault();
    setAdminEntrySaving(true);
    try {
      const response = await fetch(`${APPLICATIONS_ENDPOINT}/admin-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(adminEntry),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not add placement record');

      const applicationsResponse = await fetch(APPLICATIONS_ENDPOINT);
      const applicationsData = await applicationsResponse.json();
      if (Array.isArray(applicationsData)) setApplications(applicationsData);
      setAdminEntry({ studentName: '', rollNumber: '', email: '', branch: '', companyName: '', package: '', status: 'Selected' });
      setAdminEntryOpen(false);
      showToast('Placement record added successfully.');
    } catch (error) {
      showToast(error.message || 'Could not add placement record');
    } finally {
      setAdminEntrySaving(false);
    }
  }

  async function closeCompany(company) {
    try {
      const response = await fetch(`${API_URL}/api/companies/${company._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not close company drive');
      setManagedCompanies((prev) => prev.map((item) => item._id === company._id ? data.company : item));
      showToast('Company drive closed.');
    } catch (error) {
      showToast(error.message);
    }
  }

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

  useEffect(() => {
    if (tab !== 'interview-shortlist') return undefined;
    let cancelled = false;

    async function fetchInterviewShortlist() {
      setShortlistLoading(true);
      setShortlistError(null);
      try {
        const response = await fetch(`${APPLICATIONS_ENDPOINT}/interview-shortlist`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const data = await response.json();
        if (!cancelled) setInterviewShortlist(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) {
          setShortlistError('Could not load interview shortlist.');
          setInterviewShortlist([]);
          console.error(error);
        }
      } finally {
        if (!cancelled) setShortlistLoading(false);
      }
    }

    fetchInterviewShortlist();
    return () => { cancelled = true; };
  }, [tab]);

  useEffect(() => {
    let cancelled = false;

    async function fetchStudents() {
      setStudentLoading(true);
      setStudentLoadError(null);
      try {
        const params = new URLSearchParams();
        if (studentSearch.trim()) params.set('search', studentSearch.trim());
        if (studentBranchFilter.trim()) params.set('branch', studentBranchFilter.trim());
        if (studentCgpaFilter.trim()) params.set('minCgpa', studentCgpaFilter.trim());
        if (studentTwelfthFilter.trim()) params.set('minTwelfthPercentage', studentTwelfthFilter.trim());

        const response = await fetch(`${API_URL}/api/student/profile-verifications-admin?${params.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const payload = await response.json();
        if (cancelled) return;
        if (!payload || !Array.isArray(payload.verifications)) {
          throw new Error('Expected profile verifications from the API');
        }
        setStudents(payload.verifications);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setStudentLoadError('Could not load student profiles from the server.');
          setStudents([]);
        }
      } finally {
        if (!cancelled) setStudentLoading(false);
      }
    }

    fetchStudents();
    return () => {
      cancelled = true;
    };
  }, [studentSearch, studentBranchFilter, studentCgpaFilter, studentTwelfthFilter, studentRefreshKey]);

  // Fetch profile verifications for admin review
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;

    async function fetchProfileVerifications() {
      if (tab !== 'profile-verification') return;
      
      setVerificationLoading(true);
      try {
        const params = new URLSearchParams();
        if (verificationBranchFilter) params.set('branch', verificationBranchFilter);
        if (verificationSearch) params.set('search', verificationSearch);

        const response = await fetch(`${API_URL}/api/student/profile-verifications-admin?${params.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        if (data.verifications && Array.isArray(data.verifications)) {
          setProfileVerifications(data.verifications);
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to load profile verifications');
      } finally {
        if (!cancelled) setVerificationLoading(false);
      }
    }

    fetchProfileVerifications();
    return () => {
      cancelled = true;
    };
  }, [tab, verificationStatusFilter, verificationBranchFilter, verificationSearch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(''), 4000);
  }

  function exportPlacementCsv(rows) {
    const headers = ['Name', 'Roll No', 'Branch', 'CGPA', 'Status', 'Company', 'Package (LPA)'];
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows.map((row) => [
      row.student.name,
      row.student.rollNumber,
      row.student.branch,
      row.student.cgpa ?? '',
      row.placementStatus,
      row.company.name,
      row.package || row.company.package || '',
    ])].map((line) => line.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'placement-status.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportApplicationsExcel(rows, filename = 'student-applications.xls') {
    if (!rows.length) {
      showToast('There are no applications to export.');
      return;
    }

    const escapeHtml = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const headers = ['Student', 'Roll number', 'Branch', 'CGPA', 'Company', 'Status', 'Eligibility', 'Verification', 'Applied on'];
    const values = rows.map((application) => [
      application.student.name,
      application.student.rollNumber,
      application.student.branch,
      application.student.cgpa ?? '',
      application.company.name,
      application.status,
      application.eligible ? 'Eligible' : 'Not eligible',
      application.verificationStatus || 'Pending',
      application.appliedOn,
    ]);
    const workbook = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>table{border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:6px 10px}th{background:#0f766e;color:#fff}</style></head><body><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${values.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} application${rows.length === 1 ? '' : 's'} to Excel.`);
  }

  function setVerificationBanner(message, tone = 'success') {
    setVerificationNotice({ message, tone });
  }

  function openSendNotificationForFirstCompany() {
    const company = managedCompanies.find((item) => item.status !== 'Closed') || managedCompanies[0] || null;
    if (!company) {
      showToast('Create a placement drive before sending notifications.');
      setTab('companies');
      return;
    }
    setNotifyModalFor(company);
  }

  async function updateProfileVerification(verificationId, status, note) {
    if (!verificationId || !status) return;
    
    setVerifyingId(verificationId);
    try {
      const response = await fetch(`${API_URL}/api/student/profile-verification/${verificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify({
          verificationStatus: status,
          verificationNote: note,
          verifiedBy: admin.name || 'Admin',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const successMessage = `Profile ${status.toLowerCase()} successfully`;
        setVerificationBanner(successMessage, 'success');
        showToast(successMessage);
        setVerifyModalData(null);
        setVerificationNote('');
        if (status === 'Verified') setStudentRefreshKey((current) => current + 1);
        
        // Update local state
        setProfileVerifications(prev => 
          prev.map(v => String(v._id) === String(verificationId)
            ? {
                ...v,
                verificationStatus: data.verification?.verificationStatus || status,
                verificationNote: data.verification?.verificationNote || note,
                verifiedBy: data.verification?.verifiedBy || v.verifiedBy,
                verificationDate: data.verification?.verificationDate || v.verificationDate,
              }
            : v)
        );
      } else {
        const errorMessage = data.message || 'Failed to update verification';
        setVerificationBanner(errorMessage, 'error');
        showToast(errorMessage);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = 'Error updating profile verification';
      setVerificationBanner(errorMessage, 'error');
      showToast(errorMessage);
    } finally {
      setVerifyingId(null);
    }
  }

  // Called from NotifyEligibleStudentsModal once the admin has reviewed the
  // matched-student list and clicked Send. Reuses the same notify-students
  // endpoint as the "notify visible students" action on the Students tab,
  // just scoped to whoever matched the company's criteria plus a
  // company-specific message.
  async function handleSendCompanyNotification(company, matchedStudents, subject, message) {
    if (!matchedStudents || matchedStudents.length === 0) return;
    setSendingEmailsFor(company.id);
    try {
      const rollNumbers = matchedStudents.map((s) => s.rollNumber).filter(Boolean);
      const response = await fetch(`${APPLICATIONS_ENDPOINT}/notify-students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify({ rollNumbers, subject, message, companyName: company.name, type: 'Recruitment' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to notify students');
      const emailResult = data.emailStatus || 'Email status unavailable';
      showToast(`Notified ${data.sent ?? rollNumbers.length} student(s). ${emailResult}.`);
      setNotifyModalFor(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to notify students');
    } finally {
      setSendingEmailsFor(null);
    }
  }

  async function sendVisibleStudentsNotification(subject, message) {
    if (!students || students.length === 0) return;
    setNotifyingStudents(true);
    try {
      const rollNumbers = students.map((s) => s.rollNumber).filter(Boolean);
      const response = await fetch(`${APPLICATIONS_ENDPOINT}/notify-students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify({ rollNumbers, subject, message, companyName: 'Placement Office', type: 'Info' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to notify students');
      showToast(data.message || `Notified ${data.sent ?? rollNumbers.length} students.`);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to notify students');
    } finally {
      setNotifyingStudents(false);
    }
  }

  async function updateStatus(appId, status) {
    const app = applications.find((a) => (a._id || a.id) === appId);

    if (status === 'Interview Scheduled') {
      if (app) {
        setInterviewModal({
          appId,
          studentName: app.student.name,
          companyName: app.company.name,
        });
        setInterviewDraft({
          date: app.interviewSchedule?.date || '',
          time: app.interviewSchedule?.time || '',
          round: app.interviewSchedule?.round || 'Round 1',
          location: app.interviewSchedule?.location || '',
          panel: app.interviewSchedule?.panel || '',
          notes: app.interviewSchedule?.notes || '',
        });
      }
      return;
    }

    try {
      const response = await fetch(`${APPLICATIONS_ENDPOINT}/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, package: app?.company?.package || app?.package || '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update status');
      const refreshResponse = await fetch(APPLICATIONS_ENDPOINT);
      const refreshData = await refreshResponse.json();
      if (Array.isArray(refreshData)) setApplications(refreshData);
      if (app) showToast(`${app.student.name}'s application moved to ${status}.`);
    } catch (error) {
      showToast(error.message || 'Failed to update status');
    }
  }

  function openRoundModal(app) {
    setRoundModal({ appId: app._id || app.id, studentName: app.student.name, companyName: app.company.name });
    setRoundDraft({ roundName: 'Aptitude', date: '', time: '', location: '', score: '', feedback: '', status: 'Qualified' });
  }

  async function saveApplicationRound() {
    if (!roundModal?.appId) return;
    try {
      const response = await fetch(`${APPLICATIONS_ENDPOINT}/${roundModal.appId}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        body: JSON.stringify(roundDraft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save round result');
      setApplications((prev) => prev.map((application) => (
        (application._id || application.id) === roundModal.appId ? data.application : application
      )));
      setInterviewShortlist((prev) => prev.map((record) => (
        String(record.applicationId) === String(roundModal.appId)
          ? { ...record, status: data.application.status }
          : record
      )));
      setRoundModal(null);
      showToast('Round result saved successfully.');
    } catch (error) {
      showToast(error.message || 'Could not save round result');
    }
  }

  async function saveInterviewSchedule() {
    if (!interviewModal?.appId) return;

    try {
      const response = await fetch(`${APPLICATIONS_ENDPOINT}/${interviewModal.appId}/schedule-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify(interviewDraft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not schedule interview');

      const refreshResponse = await fetch(APPLICATIONS_ENDPOINT);
      const refreshData = await refreshResponse.json();
      if (Array.isArray(refreshData)) setApplications(refreshData);

      setInterviewModal(null);
      setInterviewDraft({ date: '', time: '', round: 'Round 1', location: '', panel: '', notes: '' });
      showToast('Interview scheduled successfully.');
    } catch (error) {
      showToast(error.message || 'Could not schedule interview');
    }
  }

  async function downloadSelectedStudents(company) {
    const params = new URLSearchParams();
    if (company.id) params.set('companyId', company.id);
    if (company.name) params.set('companyName', company.name);

    try {
      const response = await fetch(`${APPLICATIONS_ENDPOINT}/selected-students/download?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Could not download selected students');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${company.name || 'company'}-selected-students.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Downloaded selected students for ${company.name}.`);
    } catch (error) {
      console.error('Error downloading selected students:', error);
      showToast(error.message || 'Could not download selected students');
    }
  }

  async function downloadCompanyApplicants(company) {
    const params = new URLSearchParams({ companyId: company.id, companyName: company.name, status: 'all' });

    try {
      const response = await fetch(`${APPLICATIONS_ENDPOINT}/company-applications/download?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Could not download applicants');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${company.name || 'company'}-applicants.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Downloaded applicants for ${company.name}.`);
    } catch (error) {
      console.error('Error downloading applicants:', error);
      showToast(error.message || 'Could not download applicants');
    }
  }

  async function updateVerificationStatus(appId, verificationStatus, verificationNote) {
    const app = applications.find((item) => (item._id || item.id) === appId);
    if (!app) return;

    try {
      const response = await fetch(`${APPLICATIONS_ENDPOINT}/${appId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus,
          verificationNote: verificationNote || 'Verification updated by admin.',
          verifiedBy: admin.name || 'Admin',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update verification');
      }

      setApplications((prev) => prev.map((item) => ((item._id || item.id) === appId ? { ...item, verificationStatus: data.verificationStatus || verificationStatus } : item)));
      showToast(`${app.student.name}'s verification marked as ${verificationStatus}.`);
    } catch (err) {
      console.error('Error updating verification status:', err);
      showToast(err.message || 'Failed to update verification');
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
          branch: displayBranch(rawStudent.branch),
          cgpa: typeof rawStudent.cgpa === 'number' ? rawStudent.cgpa : null,
          backlogs: typeof rawStudent.backlogs === 'number' ? rawStudent.backlogs : null,
          // 12th (higher secondary) percentage — accept a few possible field
          // names from the backend so this works regardless of naming.
          twelfthPercentage:
            typeof rawStudent.twelfthPercentage === 'number' ? rawStudent.twelfthPercentage :
            typeof rawStudent.twelfth === 'number' ? rawStudent.twelfth :
            typeof rawStudent.twelfthPercent === 'number' ? rawStudent.twelfthPercent :
            typeof rawStudent.hscPercentage === 'number' ? rawStudent.hscPercentage :
            null,
          documents: Array.isArray(rawStudent.documents) ? rawStudent.documents : [],
        };
        const documents = Array.isArray(student.documents)
          ? student.documents
          : Array.isArray(a.documents)
          ? a.documents
          : [];
        const eligible = isEligible(company, student);
        const reasons = eligibilityReasons(company, student);
        const verificationStatus = a.verificationStatus || 'Pending';
        return { ...a, id: a._id || a.id, company, student, eligible, reasons, documents, verificationStatus };
      })
      .filter(Boolean);
  }, [applications]);

  const totalApplications = enrichedApplications.length;
  const pendingCount = enrichedApplications.filter((a) => a.status === 'Applied').length;
  const placedCount = enrichedApplications.filter((a) => a.status === 'Placed').length;
  const placementTotal = totalApplications || 0;
  const placementPercentage = placementTotal > 0 ? Math.round((placedCount / placementTotal) * 100) : 0;
  const placementStudentRows = useMemo(() => {
    const stageRank = { Rejected: 0, Applied: 1, Shortlisted: 2, 'Interview Scheduled': 3, Selected: 4, Placed: 5 };
    const byStudent = new Map();
    enrichedApplications.forEach((application) => {
      const key = application.student.rollNumber || application.student.id || application.id;
      const current = byStudent.get(key);
      if (!current || (stageRank[application.status] ?? 0) >= (stageRank[current.status] ?? 0)) {
        byStudent.set(key, application);
      }
    });
    return Array.from(byStudent.values()).map((application) => ({
      ...application,
      placementStatus: application.status === 'Placed'
        ? 'Placed'
        : application.status === 'Rejected'
          ? 'Not Placed'
          : 'In Process',
    }));
  }, [enrichedApplications]);
  const filteredPlacementRows = placementStudentRows.filter((row) => (
    (!placementSearch.trim() || [row.student.name, row.student.rollNumber, row.student.branch, row.company.name]
      .join(' ').toLowerCase().includes(placementSearch.trim().toLowerCase())) &&
    (placementBranchFilter === 'All' || row.student.branch === placementBranchFilter) &&
    (placementStatusFilter === 'All' || row.placementStatus === placementStatusFilter)
  ));
  const placementStatusCounts = placementStudentRows.reduce((counts, row) => {
    counts[row.placementStatus] = (counts[row.placementStatus] || 0) + 1;
    return counts;
  }, { Placed: 0, 'In Process': 0, 'Not Placed': 0 });
  const placementBranchCounts = placementStudentRows.reduce((counts, row) => {
    const branch = row.student.branch || 'Unassigned';
    counts[branch] = (counts[branch] || 0) + 1;
    return counts;
  }, {});
  const placementBranchParts = Object.entries(placementBranchCounts).map(([label, value], index) => ({
    label,
    value,
    color: placementChartPalette[index % placementChartPalette.length],
  }));
  const placementStudentTotal = placementStudentRows.length;
  const placementStudentRate = placementStudentTotal
    ? Math.round((placementStatusCounts.Placed / placementStudentTotal) * 100)
    : 0;

  // Branch options are derived from whichever branches actually show up in
  // the fetched applications, so the filter never goes stale against a
  // hardcoded list.
  const branchOptions = useMemo(() => {
    const set = new Set(BASE_BRANCH_OPTIONS);
    enrichedApplications.forEach((a) => {
      if (a.student.branch) set.add(a.student.branch);
    });
    const uniqueBranches = new Map();
    Array.from(set).forEach((branch) => {
      const key = String(branch).trim().toLowerCase();
      if (key && !uniqueBranches.has(key)) uniqueBranches.set(key, branch);
    });
    return Array.from(uniqueBranches.values()).sort();
  }, [enrichedApplications]);

  const applicationCompanyOptions = [...new Set(enrichedApplications.map((application) => application.company.name).filter(Boolean))].sort();

  function toggleBranch(branch) {
    setBranchFilter((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  }

  const filteredApplications = enrichedApplications.filter((a) => {
    if (a.status === 'Placed') return false;
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (applicationCompanyFilter !== 'All' && a.company.name !== applicationCompanyFilter) return false;
    if (applicationBranchFilter !== 'All' && normalizeBranch(a.student.branch) !== normalizeBranch(applicationBranchFilter)) return false;
    if (cgpaFilter.trim()) {
      const cgpaNumber = Number(cgpaFilter);
      if (!Number.isFinite(cgpaNumber) || typeof a.student.cgpa !== 'number') return false;
      if (a.student.cgpa < cgpaNumber) return false;
    }
    if (twelfthFilter.trim()) {
      const twelfthNumber = Number(twelfthFilter);
      if (!Number.isFinite(twelfthNumber) || typeof a.student.twelfthPercentage !== 'number') return false;
      if (a.student.twelfthPercentage < twelfthNumber) return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${a.student.name} ${a.student.rollNumber} ${a.company.name}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const applicationPageCount = Math.max(1, Math.ceil(filteredApplications.length / applicationPageSize));
  const visibleApplications = filteredApplications.slice(
    (applicationPage - 1) * applicationPageSize,
    applicationPage * applicationPageSize
  );

  const applicationGroups = useMemo(() => {
    const companies = new Map();
    visibleApplications.forEach((application) => {
      const companyName = application.company.name || 'Unknown company';
      const branchName = application.student.branch || 'Unassigned branch';
      if (!companies.has(companyName)) companies.set(companyName, new Map());
      const branches = companies.get(companyName);
      if (!branches.has(branchName)) branches.set(branchName, []);
      branches.get(branchName).push(application);
    });
    return Array.from(companies, ([companyName, branches]) => ({
      companyName,
      branches: Array.from(branches, ([branchName, applications]) => ({ branchName, applications })),
    }));
  }, [visibleApplications]);

  useEffect(() => {
    setApplicationPage(1);
  }, [applicationCompanyFilter, applicationBranchFilter, statusFilter, cgpaFilter, twelfthFilter, search, applicationPageSize]);

  useEffect(() => {
    if (applicationPage > applicationPageCount) setApplicationPage(applicationPageCount);
  }, [applicationPage, applicationPageCount]);

  // The "companies" view is derived entirely from whichever companies show
  // up in the fetched applications — there's no separate master list, so a
  // company with zero applications simply won't appear here.
  const companyStats = useMemo(() => {
    const byId = new Map();
    for (const a of enrichedApplications) {
      const key = a.company.id;
      if (!byId.has(key)) {
        byId.set(key, { ...a.company, applicantCount: 0, pendingCount: 0, eligibleCount: 0, verifiedCount: 0, apps: [] });
      }
      const entry = byId.get(key);
      entry.applicantCount += 1;
      if (a.status === 'Applied') entry.pendingCount += 1;
      if (a.eligible) entry.eligibleCount += 1;
      if (a.verificationStatus === 'Verified') entry.verifiedCount += 1;
      if (a.status === 'Placed') entry.selectedCount += 1;
      entry.apps.push(a);
    }
    return Array.from(byId.values());
  }, [enrichedApplications]);

  const totalCompanies = companyStats.length;

  const [admin] = useState(() => {
    try {
      const raw = window.localStorage.getItem('user') || window.localStorage.getItem('admin');
      if (!raw) return DEFAULT_ADMIN;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        return { ...DEFAULT_ADMIN, name: parsed.name, role: parsed.role || DEFAULT_ADMIN.role };
      }
      return DEFAULT_ADMIN;
    } catch {
      return DEFAULT_ADMIN;
    }
  });

  const initials = (admin.name || DEFAULT_ADMIN.name).split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const pageCopy = {
    dashboard: ['Placement dashboard', 'A quick view of applications, workflow progress, and confirmed placements.'],
    applications: ['Application review', 'Review eligibility, documents, interviews, and application decisions.'],
    companies: ['Companies & placement drives', 'Create drives, define eligibility, and manage recruiting companies.'],
    'interview-shortlist': ['Interview shortlist', 'See every shortlisted student grouped by the company they are interviewing with.'],
    'placement-records': ['Confirmed placements', 'Review final placement records and package outcomes.'],
    'profile-verification': ['Profile verification', 'Review submitted documents and approve student profiles.'],
  }[tab] || ['Placement workspace', 'Manage the campus placement lifecycle from one focused workspace.'];
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const applicationStudentCount = new Set(enrichedApplications.map((application) => application.student.rollNumber || application.student.id).filter(Boolean)).size;
  const totalStudentCount = students.length || applicationStudentCount;
  const activeCompanyCount = managedCompanies.filter((company) => company.status !== 'Closed').length || companyStats.filter((company) => company.status !== 'Closed').length;
  const pendingVerificationCount = students.filter((student) => ['Pending', 'Not Sent'].includes(student.verificationStatus || 'Pending')).length;
  const rosterStatusText = students.length === 0 && totalApplications > 0
    ? `Student profile roster unavailable. Showing ${totalStudentCount} linked application record${totalStudentCount === 1 ? '' : 's'}.`
    : `${pendingVerificationCount} student profile${pendingVerificationCount === 1 ? '' : 's'} awaiting verification.`;
  const closingDriveCount = managedCompanies.filter((company) => company.status === 'Closing soon').length;
  const stageRank = { Applied: 0, Shortlisted: 1, 'Interview Scheduled': 2, Selected: 3, Placed: 4 };
  const activeApplications = enrichedApplications.filter((application) => application.status !== 'Rejected');
  const dashboardShortlistedCount = activeApplications.filter((application) => (stageRank[application.status] ?? 0) >= 1).length;
  const dashboardInterviewCount = activeApplications.filter((application) => (stageRank[application.status] ?? 0) >= 2).length;
  const dashboardSelectedCount = activeApplications.filter((application) => (stageRank[application.status] ?? 0) >= 3).length;
  const dashboardPlacedCount = activeApplications.filter((application) => (stageRank[application.status] ?? 0) >= 4).length;
  const shortlistedRate = totalApplications ? ((dashboardShortlistedCount / totalApplications) * 100).toFixed(1) : '0.0';
  const selectedRate = dashboardShortlistedCount ? ((dashboardSelectedCount / dashboardShortlistedCount) * 100).toFixed(1) : '0.0';
  const placedRate = dashboardSelectedCount ? ((dashboardPlacedCount / dashboardSelectedCount) * 100).toFixed(1) : '0.0';
  const upcomingInterviews = enrichedApplications
    .filter((application) => application.interviewSchedule?.date)
    .slice(0, 3);
  const recentActivity = enrichedApplications.slice(0, 4).map((application) => ({
    name: application.student.name === 'Unknown student' ? 'Student profile unavailable' : application.student.name,
    text: `Moved to ${application.status} · ${displayCompanyName(application.company.name)}`,
    date: application.updatedAt || application.createdAt,
    status: application.status,
    key: `${application.id}-${application.status}`,
  }));
  const funnelStages = [
    ['Applications', totalApplications, ''],
    ['Shortlisted', dashboardShortlistedCount, `${shortlistedRate}%`],
    ['Interview', dashboardInterviewCount, `${dashboardShortlistedCount ? ((dashboardInterviewCount / dashboardShortlistedCount) * 100).toFixed(1) : '0.0'}%`],
    ['Selected', dashboardSelectedCount, `${selectedRate}%`],
    ['Placed', dashboardPlacedCount, `${placedRate}%`],
  ];
  const verificationStatusCounts = profileVerifications.reduce((counts, verification) => {
    const status = verification.verificationStatus || 'Pending';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, { Pending: 0, Verified: 0, Rejected: 0 });
  const visibleProfileVerifications = profileVerifications.filter((verification) => {
    return verificationStatusFilter === 'All' || (verification.verificationStatus || 'Pending') === verificationStatusFilter;
  });
  // ---------------- Dashboard ----------------
  return (
    <div style={styles.page}>
      <DashboardShell role="admin" active={tab} onNavigate={setTab} user={admin} onSendNotification={openSendNotificationForFirstCompany}>
        <main style={styles.body}>
        <div style={styles.intro}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              {tab === 'dashboard' && <p style={{ margin: '0 0 5px', color: colors.teal, fontSize: 12, fontWeight: 800 }}>{greeting}, Placement Officer</p>}
              <h1 style={{ ...styles.h1, color: colors.ink }}>{pageCopy[0]}</h1>
              <p style={styles.introSub}>{tab === 'dashboard' ? "Here's what's happening across your placement process." : pageCopy[1]}</p>
            </div>
            {tab === 'dashboard' && (
              <div style={styles.dashboardActionRow}>
                <span style={{ color: colors.teal, fontSize: 11.5, fontWeight: 700 }}>● Live data</span>
                <span style={{ color: colors.muted, fontSize: 11.5 }}>Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <button type="button" style={styles.btnGhost} onClick={() => window.location.reload()}>↻ Refresh</button>
                <button type="button" style={styles.btnAccept} onClick={openSendNotificationForFirstCompany}>Send notification</button>
                <button type="button" style={styles.btnAccept} onClick={() => setTab('companies')}>+ Quick action</button>
              </div>
            )}
          </div>
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

        {tab === 'dashboard' && (
          <AdminOverview
            admin={admin}
            totalStudentCount={totalStudentCount}
            activeCompanyCount={activeCompanyCount}
            totalApplications={totalApplications}
            shortlistedCount={dashboardShortlistedCount}
            selectedCount={dashboardSelectedCount}
            placedCount={dashboardPlacedCount}
            applications={enrichedApplications}
            managedCompanies={managedCompanies}
            students={students}
            onNavigate={setTab}
          />
        )}

        {tab === 'companies' && (
          <AdminCompaniesDrives
            companies={managedCompanies}
            companyStats={companyStats}
            companyDraft={companyDraft}
            companyFormOpen={companyFormOpen}
            companySaving={companySaving}
            editingCompanyId={editingCompanyId}
            onStartCreate={startCompanyCreate}
            onStartEdit={startCompanyEdit}
            onDraftChange={(field, value) => setCompanyDraft((previous) => ({ ...previous, [field]: value }))}
            onSave={saveCompany}
            onCloseForm={() => setCompanyFormOpen(false)}
            onCloseCompany={closeCompany}
            onNotifyCompany={(company) => company && setNotifyModalFor(company)}
          />
        )}

        {tab === 'interview-shortlist' && (
          <InterviewShortlistView
            records={interviewShortlist}
            loading={shortlistLoading}
            error={shortlistError}
            onSchedule={(record) => updateStatus(record.applicationId, 'Interview Scheduled')}
            onRecordRound={(record) => {
              const application = applications.find((item) => String(item._id || item.id) === String(record.applicationId));
              if (application) openRoundModal(application);
              else showToast('Application details are still loading. Refresh and try again.');
            }}
          />
        )}

        {tab === 'dashboard' && false && (
          <>
            <div style={styles.intro}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: '0 0 8px', color: colors.teal, fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Placement Overview
                  </p>
                  <h1 style={{ ...styles.h1, marginBottom: 8 }}>September 7, 2026</h1>
                  <p style={{ ...styles.introSub, margin: 0 }}>Academic Year 2026–27</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: colors.inkSoft, fontSize: 12.5, fontWeight: 600 }}>Last updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button type="button" style={{ ...styles.btnGhost, padding: '9px 12px' }} onClick={() => window.location.reload()}>↻ Refresh</button>
                  <button type="button" style={{ ...styles.btnSelect, padding: '9px 14px' }} onClick={() => setTab('companies')}>+ Create Drive</button>
                </div>
              </div>
            </div>

            <div style={styles.statRow}>
              {[
                ['Students', totalStudentCount, 'Registered', '○', ['#12A48A', '#0C7D69']],
                ['Active drives', activeCompanyCount, `${closingDriveCount} closing soon`, '▣', ['#14B8A6', '#0F766E']],
                ['Applications', totalApplications, 'Live this cycle', '↗', ['#12A48A', '#0C7D69']],
                ['Shortlisted', dashboardShortlistedCount, `${shortlistedRate}%`, '◒', ['#C9A13E', '#A67F1F']],
                ['Selected', dashboardSelectedCount, `${selectedRate}%`, '✓', ['#12A48A', '#0C7D69']],
                ['Placed', dashboardPlacedCount, `${placedRate}%`, '★', ['#2DD4BF', '#115E59']],
              ].map(([label, value, meta, icon, gradient]) => (
                <div style={styles.statCard} key={label}>
                  <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})` }} />
                  <div style={styles.dashboardKpiHeader}>
                    <span style={{ ...styles.dashboardKpiIcon, background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`, color: '#fff', boxShadow: `0 4px 10px ${gradient[0]}40` }}>{icon}</span>
                  </div>
                  <div style={{ ...styles.statValue, color: colors.ink }}>{value.toLocaleString()}</div>
                  <div style={styles.statLabel}>{label}</div>
                  <div style={{ ...styles.dashboardKpiMeta, color: gradient[1] }}>{meta}</div>
                </div>
              ))}
            </div>

            {students.length === 0 && totalApplications > 0 && (
              <div style={{ ...styles.statusBanner, marginBottom: 18, padding: '12px 16px', background: 'rgba(212,154,52,0.1)', borderColor: 'rgba(212,154,52,0.35)' }}>
                <span style={{ ...styles.statusDot, background: colors.gold }} />
                <p style={{ ...styles.statusText, flex: 1 }}><strong>Student roster needs attention.</strong> {rosterStatusText}</p>
                <button type="button" style={{ ...styles.btnGhost, padding: '6px 9px', fontSize: 11 }} onClick={() => setTab('profile-verification')}>Fix →</button>
              </div>
            )}

            <section style={{ ...styles.dashboardWidget, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={styles.dashboardWidgetTitle}>Placement funnel</h2>
                  <p style={styles.dashboardWidgetSub}>Application-to-offer conversion across the cycle.</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.teal, background: 'rgba(15,118,110,0.08)', borderRadius: 999, padding: '6px 10px' }}>
                  {totalApplications > 0 ? `${Math.round((dashboardPlacedCount / Math.max(totalApplications, 1)) * 100)}% conversion` : '0% conversion'}
                </span>
              </div>

              <div style={styles.funnelList}>
                {funnelStages.map(([label, count, conversion]) => (
                  <div style={styles.funnelStage} key={label}>
                    <div style={styles.funnelStageLabel}>{label}</div>
                    <div style={styles.funnelStageValue}>{count}</div>
                    <div style={styles.funnelConversion}>{conversion ? `${conversion}%` : 'Base stage'}</div>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(260px, 0.8fr)', gap: 16, marginBottom: 18 }}>
              <section style={styles.dashboardWidget}>
                <h2 style={styles.dashboardWidgetTitle}>Placement Analytics</h2>
                <p style={styles.dashboardWidgetSub}>Company demand and placement status at a glance.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18, marginTop: 18 }}>
                  <div>
                    <div style={{ marginBottom: 10, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.05em', color: colors.inkSoft, textTransform: 'uppercase' }}>
                      Applications by Company
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {companyStats.slice(0, 5).map((company, index) => (
                        <div key={company.id || company.name || index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: colors.inkSoft, background: colors.paper, border: `1px solid ${colors.line}`, borderRadius: 10, padding: '10px 12px' }}>
                          <span style={{ fontWeight: 600, color: colors.ink }}>{company.name}</span>
                          <span style={{ fontWeight: 700, color: colors.teal }}>{company.applicantCount || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ marginBottom: 10, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.05em', color: colors.inkSoft, textTransform: 'uppercase' }}>
                      Placement Status
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
                      <div style={{ ...styles.placementDonut, width: 152, height: 152, background: `conic-gradient(${colors.teal} 0 ${Math.min(100, placementPercentage)}%, #DCE6F1 ${Math.min(100, placementPercentage)}% 100%)` }}>
                        <div style={styles.placementDonutInner}>
                          <strong style={{ fontSize: 26, color: colors.ink }}>{placementPercentage}%</strong>
                          <span style={{ fontSize: 10, opacity: 0.55 }}>Placed</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ ...styles.placementLegend, marginTop: 12, justifyContent: 'space-between', padding: '0 8px' }}>
                      <span style={styles.placementLegendItem}><i style={styles.placementLegendDot(colors.teal)} />Placed</span>
                      <span style={styles.placementLegendItem}><i style={styles.placementLegendDot('#DCE6F1')} />Open</span>
                    </div>
                  </div>
                </div>
              </section>

              <section style={styles.dashboardWidget}>
                <h2 style={styles.dashboardWidgetTitle}>Needs attention</h2>
                <p style={styles.dashboardWidgetSub}>Action items for the placement team.</p>
                <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                  {[
                    { title: `${pendingCount} Application${pendingCount === 1 ? '' : 's'} pending`, description: 'Review candidate applications', action: 'Review →', color: '#E65050', route: 'applications' },
                    { title: `${Math.max(0, dashboardInterviewCount - upcomingInterviews.length)} Interviews unscheduled`, description: 'Candidates are waiting for interview schedules', action: 'Schedule →', color: '#E77A29', route: 'applications' },
                    { title: 'Student roster unavailable', description: 'Reconnect student records', action: 'Fix →', color: '#3B82F6', route: 'profile-verification' },
                  ].map((item) => (
                    <div key={item.title} style={{ border: `1px solid ${colors.line}`, borderRadius: 12, padding: '12px 12px 10px', background: colors.paper, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, marginTop: 7, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 11.5, color: colors.inkSoft, marginBottom: 8 }}>{item.description}</div>
                        <button type="button" onClick={() => setTab(item.route)} style={{ border: 'none', background: 'transparent', color: colors.teal, padding: 0, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{item.action}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, marginBottom: 18 }}>
              <section style={styles.dashboardWidget}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                  <h2 style={styles.dashboardWidgetTitle}>Upcoming Interviews</h2>
                  <button type="button" style={{ ...styles.btnGhost, padding: '5px 8px', fontSize: 11 }} onClick={() => setTab('applications')}>View all</button>
                </div>

                {upcomingInterviews.length === 0 ? (
                  <div style={{ color: colors.inkSoft, fontSize: 12.5 }}>
                    No interviews scheduled yet.
                  </div>
                ) : (
                  <div style={styles.interviewList}>
                    {upcomingInterviews.map((application) => (
                      <div style={styles.interviewRow} key={application.id}>
                        <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{application.student.name}</strong>
                        <span>{displayCompanyName(application.company.name)}</span>
                        <span style={{ color: colors.teal, fontWeight: 700 }}>{application.interviewSchedule?.time || 'Scheduling'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={styles.dashboardWidget}>
                <h2 style={styles.dashboardWidgetTitle}>Recent activity</h2>
                <p style={styles.dashboardWidgetSub}>Latest movement across the placement pipeline.</p>
                {recentActivity.length === 0 ? (
                  <p style={{ color: colors.inkSoft, opacity: .58, fontSize: 12 }}>Activity will appear when students apply or move through a stage.</p>
                ) : (
                  <ul style={styles.activityList}>
                    {recentActivity.map((activity) => (
                      <li style={styles.activityItem} key={activity.key}>
                        <span style={{ ...styles.activityDot, background: activity.status === 'Rejected' ? colors.red : activity.status === 'Placed' ? colors.teal : activity.status === 'Selected' ? colors.gold : '#5576A6' }} />
                        <span>
                          <strong style={{ display: 'block', color: colors.ink }}>{activity.name}</strong>
                          <span>{activity.text}</span>
                          <small style={{ display: 'block', marginTop: 2, color: colors.muted, fontSize: 10.5 }}>
                            {activity.date ? new Date(activity.date).toLocaleString() : 'Recent update'}
                          </small>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section style={styles.dashboardWidget}>
              <h2 style={styles.dashboardWidgetTitle}>Quick actions</h2>
              <p style={styles.dashboardWidgetSub}>Start the most common placement-office tasks.</p>
              <div style={styles.quickAccessGrid}>
                {[
                  ['+ Add company', 'companies'],
                  ['+ Create drive', 'companies'],
                  ['Send notification', 'notification'],
                  ['Review applications', 'applications'],
                  ['Verify students', 'profile-verification'],
                ].map(([label, destination]) => (
                  <button type="button" style={styles.quickAccessItem} key={label} onClick={() => {
                    if (destination === 'notification') {
                      openSendNotificationForFirstCompany();
                      return;
                    }
                    setTab(destination);
                  }}>
                    <strong style={{ fontSize: 12 }}>{label}</strong>
                    <span style={{ color: colors.muted, fontSize: 11 }}>Open →</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'applications' && (
          <section>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>Student applications</h2>
                <p style={styles.sectionSub}>Eligibility is recalculated live from each student's branch, CGPA, and backlog record.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9, minWidth: 0 }}>
                <div style={styles.actionRow}>
                  <button type="button" style={styles.btnGhost} onClick={() => exportApplicationsExcel(filteredApplications)} disabled={loading || filteredApplications.length === 0}>Export Excel</button>
                  <button type="button" style={styles.btnAccept} onClick={() => setAdminEntryOpen((open) => !open)}>
                    {adminEntryOpen ? 'Close entry form' : '+ Add placement record'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ ...styles.filterRow, marginBottom: 18 }}>
              <span style={styles.filterGroupLabel}>Branch pages</span>
              <button type="button" style={styles.filterBtn(applicationBranchFilter === 'All')} onClick={() => setApplicationBranchFilter('All')}>All branches</button>
              {branchOptions.map((branch) => (
                <button key={branch} type="button" style={styles.filterBtn(normalizeBranch(applicationBranchFilter) === normalizeBranch(branch))} onClick={() => setApplicationBranchFilter(branch)}>
                  {branch}
                </button>
              ))}
            </div>

            <div style={{ ...styles.filterRow, marginBottom: 18 }}>
              <span style={styles.filterGroupLabel}>Find applications</span>
              <select style={{ ...styles.searchInput, minWidth: 220 }} value={applicationCompanyFilter} onChange={(event) => setApplicationCompanyFilter(event.target.value)}>
                <option value="All">All companies / drives</option>
                {applicationCompanyOptions.map((company) => <option key={company} value={company}>{company}</option>)}
              </select>
              <select style={{ ...styles.searchInput, minWidth: 170 }} value={applicationBranchFilter} onChange={(event) => setApplicationBranchFilter(event.target.value)}>
                <option value="All">All branches</option>
                {branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
              </select>
              <select style={{ ...styles.searchInput, minWidth: 150 }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="All">All statuses</option>
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button type="button" style={styles.btnSelect} onClick={() => setStatusFilter('Shortlisted')}>Show shortlisted</button>
              {(applicationCompanyFilter !== 'All' || applicationBranchFilter !== 'All' || statusFilter !== 'All') && (
                <button type="button" style={styles.btnGhost} onClick={() => {
                  setApplicationCompanyFilter('All');
                  setApplicationBranchFilter('All');
                  setStatusFilter('All');
                }}>Clear filters</button>
              )}
            </div>

            {adminEntryOpen && (
              <form onSubmit={saveAdminEntry} style={{ ...styles.card, marginBottom: 18 }}>
                <h3 style={styles.sectionTitle}>Add student placement record</h3>
                <p style={styles.sectionSub}>Enter a student and company manually. The record will be saved with the selected status.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {[
                    ['studentName', 'Student name', 'text', true],
                    ['rollNumber', 'Roll number', 'text', true],
                    ['email', 'Email', 'email', false],
                    ['branch', 'Branch', 'text', false],
                    ['companyName', 'Company name', 'text', true],
                    ['package', 'Package', 'text', false],
                  ].map(([field, label, type, required]) => (
                    <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 600 }}>
                      {label}
                      <input
                        type={type}
                        required={required}
                        value={adminEntry[field]}
                        onChange={(event) => setAdminEntry((prev) => ({ ...prev, [field]: event.target.value }))}
                        style={styles.searchInput}
                      />
                    </label>
                  ))}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 600 }}>
                    Status
                    <select value={adminEntry.status} onChange={(event) => setAdminEntry((prev) => ({ ...prev, status: event.target.value }))} style={styles.searchInput}>
                      <option>Selected</option>
                      <option>Shortlisted</option>
                      <option>Applied</option>
                      <option>Rejected</option>
                    </select>
                  </label>
                </div>
                <div style={{ ...styles.actionRow, marginTop: 14 }}>
                  <button type="submit" style={styles.btnAccept} disabled={adminEntrySaving}>{adminEntrySaving ? 'Saving...' : 'Save placement record'}</button>
                  <button type="button" style={styles.btnGhost} onClick={() => setAdminEntryOpen(false)}>Cancel</button>
                </div>
              </form>
            )}

            {!loading && filteredApplications.length === 0 && (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>
                  {enrichedApplications.length === 0 ? 'No applications yet' : 'No applications match this filter'}
                </p>
                <p style={styles.emptySub}>
                  {enrichedApplications.length === 0
                    ? 'Once students apply, their applications will show up here.'
                    : 'Try different status, branch, CGPA, or 12th % filters, or clear your search.'}
                </p>
              </div>
            )}

            {!loading && filteredApplications.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12, color: colors.inkSoft, fontSize: 13 }}>
                  <span>
                    Showing {((applicationPage - 1) * applicationPageSize) + 1}-{Math.min(applicationPage * applicationPageSize, filteredApplications.length)} of {filteredApplications.length} applications
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Per page
                      <select style={{ ...styles.searchInput, minWidth: 82, padding: '7px 10px' }} value={applicationPageSize} onChange={(event) => setApplicationPageSize(Number(event.target.value))}>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </label>
                    <button type="button" style={styles.btnGhost} disabled={applicationPage === 1} onClick={() => setApplicationPage((page) => Math.max(1, page - 1))}>Previous</button>
                    <strong>Page {applicationPage} of {applicationPageCount}</strong>
                    <button type="button" style={styles.btnGhost} disabled={applicationPage === applicationPageCount} onClick={() => setApplicationPage((page) => Math.min(applicationPageCount, page + 1))}>Next</button>
                  </div>
                </div>
                <div style={{ overflowX: 'auto', border: `1px solid ${colors.lineDark}`, borderRadius: 12, background: '#fff' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Student</th>
                        <th style={styles.th}>Company</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Eligibility</th>
                        <th style={styles.th}>Applied</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicationGroups.map((companyGroup) => (
                        <Fragment key={companyGroup.companyName}>
                          <tr>
                            <td colSpan={6} style={{ ...styles.td, background: colors.ink, color: colors.paper, fontFamily: fonts.head, fontWeight: 800, fontSize: 15 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                                <span>{companyGroup.companyName} <span style={{ opacity: 0.7, fontSize: 12, fontWeight: 500 }}>({companyGroup.branches.reduce((total, group) => total + group.applications.length, 0)} applications)</span></span>
                                <button
                                  type="button"
                                  style={{ ...styles.btnGhost, padding: '6px 10px', fontSize: 11, color: colors.paper, borderColor: 'rgba(255,255,255,0.45)' }}
                                  onClick={() => exportApplicationsExcel(
                                    enrichedApplications.filter((application) => application.company.name === companyGroup.companyName),
                                    `${companyGroup.companyName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'company'}-applications.xls`
                                  )}
                                >
                                  Export Excel
                                </button>
                              </span>
                            </td>
                          </tr>
                          {companyGroup.branches.map((branchGroup) => (
                            <Fragment key={`${companyGroup.companyName}-${branchGroup.branchName}`}>
                              <tr>
                                <td colSpan={6} style={{ ...styles.td, background: colors.paper, color: colors.teal, fontFamily: fonts.head, fontWeight: 800, fontSize: 13 }}>
                                  Branch: {branchGroup.branchName} <span style={{ color: colors.inkMuted, fontWeight: 500 }}>({branchGroup.applications.length})</span>
                                </td>
                              </tr>
                              {branchGroup.applications.map((application) => (
                                <tr key={application.id}>
                                  <td style={styles.td}>
                                    <strong>{application.student.name}</strong>
                                    <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 3 }}>
                                      {application.student.rollNumber || 'Unknown roll'}{application.student.branch ? ` · ${application.student.branch}` : ''}
                                    </div>
                                  </td>
                                  <td style={styles.td}>{application.company.name}</td>
                                  <td style={styles.td}><span style={styles.statusPill(application.status)}>{application.status}</span></td>
                                  <td style={styles.td}><span style={styles.eligPill(application.eligible)}>{application.eligible ? 'Eligible' : 'Not eligible'}</span></td>
                                  <td style={styles.td}>{application.appliedOn}</td>
                                  <td style={styles.td}>
                                    <div style={styles.actionRow}>
                                      {(application.verificationStatus === 'Pending' || !application.verificationStatus) && (
                                        <button type="button" style={styles.btnAccept} onClick={() => updateVerificationStatus(application.id, 'Verified', 'Admin verified the student application.')}>Approve verify</button>
                                      )}
                                      {application.status === 'Applied' && (
                                        <button type="button" style={styles.btnAccept} onClick={() => updateStatus(application.id, 'Shortlisted')}>Shortlist</button>
                                      )}
                                      {['Shortlisted', 'Interview Scheduled'].includes(application.status) && (
                                        <button type="button" style={styles.btnSelect} onClick={() => updateStatus(application.id, 'Interview Scheduled')}>
                                          {application.status === 'Interview Scheduled' ? 'Reschedule interview' : 'Schedule interview'}
                                        </button>
                                      )}
                                      {application.status === 'Selected' && (
                                        <button type="button" style={styles.btnAccept} onClick={() => updateStatus(application.id, 'Placed')}>Mark placed</button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </Fragment>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {/* grouped application table rendered above */}
            {false && (
              <div style={{ overflowX: 'auto', border: `1px solid ${colors.lineDark}`, borderRadius: 12, background: '#fff' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Company</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Eligibility</th>
                      <th style={styles.th}>Applied</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicationGroups.map((companyGroup) => (
                      <Fragment key={companyGroup.companyName}>
                        <tr>
                          <td colSpan={6} style={{ ...styles.td, background: colors.ink, color: colors.paper, fontFamily: fonts.head, fontWeight: 800, fontSize: 15 }}>
                            {companyGroup.companyName} <span style={{ opacity: 0.7, fontSize: 12, fontWeight: 500 }}>({companyGroup.branches.reduce((total, group) => total + group.applications.length, 0)} applications)</span>
                          </td>
                        </tr>
                        {companyGroup.branches.map((branchGroup) => (
                          <Fragment key={`${companyGroup.companyName}-${branchGroup.branchName}`}>
                            <tr>
                              <td colSpan={6} style={{ ...styles.td, background: colors.paper, color: colors.teal, fontFamily: fonts.head, fontWeight: 800, fontSize: 13 }}>
                                Branch: {branchGroup.branchName} <span style={{ color: colors.inkMuted, fontWeight: 500 }}>({branchGroup.applications.length})</span>
                              </td>
                            </tr>
                            {branchGroup.applications.map((application) => (
                              <tr key={application.id}>
                                <td style={styles.td}>
                                  <strong>{application.student.name}</strong>
                                  <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 3 }}>
                                    {application.student.rollNumber || 'Unknown roll'}{application.student.branch ? ` · ${application.student.branch}` : ''}
                                  </div>
                                </td>
                                <td style={styles.td}>{application.company.name}</td>
                                <td style={styles.td}><span style={styles.statusPill(application.status)}>{application.status}</span></td>
                                <td style={styles.td}><span style={styles.eligPill(application.eligible)}>{application.eligible ? 'Eligible' : 'Not eligible'}</span></td>
                                <td style={styles.td}>{application.appliedOn}</td>
                                <td style={styles.td}>
                                  <div style={styles.actionRow}>
                                    {(application.verificationStatus === 'Pending' || !application.verificationStatus) && (
                                      <button type="button" style={styles.btnAccept} onClick={() => updateVerificationStatus(application.id, 'Verified', 'Admin verified the student application.')}>Approve verify</button>
                                    )}
                                    {application.status === 'Applied' && (
                                      <button type="button" style={styles.btnAccept} onClick={() => updateStatus(application.id, 'Shortlisted')}>Shortlist</button>
                                    )}
                                    {application.status === 'Selected' && (
                                      <button type="button" style={styles.btnAccept} onClick={() => updateStatus(application.id, 'Placed')}>Mark placed</button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === 'placement-records' && (
          <section>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>Placement Dashboard</h2>
                <p style={styles.sectionSub}>Track student placement status at a glance.</p>
              </div>
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                <button type="button" style={styles.btnGhost} onClick={() => exportPlacementCsv(filteredPlacementRows)}>Export CSV</button>
                <button type="button" style={styles.btnAccept} onClick={() => setPlacementAddOpen((open) => !open)}>{placementAddOpen ? 'Close form' : '+ Add Student'}</button>
              </div>
            </div>

            <div style={styles.statRow}>
              {[
                ['Total Students', placementStudentTotal, colors.teal],
                ['Placed', placementStatusCounts.Placed, '#0f766e'],
                ['In Process', placementStatusCounts['In Process'], '#d9a640'],
                ['Not Placed', placementStatusCounts['Not Placed'], '#c74d5f'],
                ['Placement Rate', `${placementStudentRate}%`, '#115e59'],
              ].map(([label, value, color]) => (
                <div style={{ ...styles.statCard, minHeight: 104 }} key={label}>
                  <span style={{ position: 'absolute', inset: '0 0 auto', height: 3, background: color }} />
                  <div style={{ ...styles.statValue, color }}>{value}</div>
                  <div style={styles.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ ...styles.filterRow, marginBottom: 18 }}>
              <input
                style={{ ...styles.searchInput, minWidth: 220, flex: '1 1 220px' }}
                placeholder="Search name / roll no / company"
                value={placementSearch}
                onChange={(event) => setPlacementSearch(event.target.value)}
              />
              <select style={{ ...styles.searchInput, minWidth: 150 }} value={placementBranchFilter} onChange={(event) => setPlacementBranchFilter(event.target.value)}>
                <option value="All">All Branches</option>
                {branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
              </select>
              <select style={{ ...styles.searchInput, minWidth: 140 }} value={placementStatusFilter} onChange={(event) => setPlacementStatusFilter(event.target.value)}>
                <option value="All">All Status</option>
                <option value="Placed">Placed</option>
                <option value="In Process">In Process</option>
                <option value="Not Placed">Not Placed</option>
              </select>
              {(placementSearch || placementBranchFilter !== 'All' || placementStatusFilter !== 'All') && (
                <button type="button" style={{ ...styles.btnGhost, padding: '9px 12px', fontSize: 12 }} onClick={() => { setPlacementSearch(''); setPlacementBranchFilter('All'); setPlacementStatusFilter('All'); }}>Clear</button>
              )}
            </div>

            {placementAddOpen && (
              <form onSubmit={(event) => { saveAdminEntry(event); setPlacementAddOpen(false); }} style={{ ...styles.dashboardWidget, marginBottom: 18 }}>
                <h3 style={styles.dashboardWidgetTitle}>Add Student</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 14 }}>
                  {[
                    ['studentName', 'Name', 'text', true],
                    ['rollNumber', 'Roll No', 'text', true],
                    ['branch', 'Branch (e.g. CSE)', 'text', false],
                    ['email', 'Email', 'email', false],
                    ['companyName', 'Company (if any)', 'text', false],
                    ['package', 'Package (LPA)', 'text', false],
                  ].map(([field, placeholder, type, required]) => (
                    <input key={field} type={type} required={required} placeholder={placeholder} value={adminEntry[field]} onChange={(event) => setAdminEntry((previous) => ({ ...previous, [field]: event.target.value }))} style={styles.input} />
                  ))}
                  <select value={adminEntry.status} onChange={(event) => setAdminEntry((previous) => ({ ...previous, status: event.target.value }))} style={styles.input}>
                    <option value="Rejected">Not Placed</option>
                    <option value="Applied">In Process</option>
                    <option value="Selected">Selected</option>
                    <option value="Placed">Placed</option>
                  </select>
                </div>
                <div style={{ ...styles.actionRow, marginTop: 14 }}>
                  <button type="submit" style={styles.btnAccept} disabled={adminEntrySaving}>{adminEntrySaving ? 'Saving...' : 'Add Student'}</button>
                </div>
              </form>
            )}

            <div style={styles.placementTableWrap}>
              <table style={styles.placementTable}>
                <thead><tr><th style={styles.placementTh}>Name</th><th style={styles.placementTh}>Roll No</th><th style={styles.placementTh}>Branch</th><th style={styles.placementTh}>CGPA</th><th style={styles.placementTh}>Status</th><th style={styles.placementTh}>Company</th><th style={styles.placementTh}>Package (LPA)</th></tr></thead>
                <tbody>
                  {filteredPlacementRows.map((row) => (
                    <tr key={`placement-${row.id}`}>
                      <td style={{ ...styles.placementTd, ...styles.placementStudent }}>{row.student.name}</td>
                      <td style={styles.placementTd}>{row.student.rollNumber || '—'}</td>
                      <td style={styles.placementTd}>{row.student.branch || '—'}</td>
                      <td style={styles.placementTd}>{typeof row.student.cgpa === 'number' ? row.student.cgpa.toFixed(1) : '—'}</td>
                      <td style={styles.placementTd}><span style={styles.statusPill(row.placementStatus === 'Placed' ? 'Placed' : row.placementStatus === 'Not Placed' ? 'Rejected' : 'Shortlisted')}>{row.placementStatus}</span></td>
                      <td style={styles.placementTd}>{row.placementStatus === 'Not Placed' ? '—' : displayCompanyName(row.company.name)}</td>
                      <td style={{ ...styles.placementTd, ...styles.companyPackage }}>{row.placementStatus === 'Placed' ? row.package || row.company.package || '—' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPlacementRows.length === 0 && <div style={styles.emptyState}>No students match these filters.</div>}
            </div>

            <section style={{ ...styles.dashboardWidget, marginTop: 18 }}>
              <h3 style={styles.dashboardWidgetTitle}>Branch-wise Student Distribution</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
                {placementBranchParts.map((part) => (
                  <span key={part.label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.inkSoft, fontSize: 12 }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: part.color }} />
                    {part.label} ({Math.round((part.value / Math.max(placementStudentTotal, 1)) * 100)}%)
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, flexWrap: 'wrap', marginTop: 16 }}>
                {placementStudentTotal > 0 ? <PlacementPieChart parts={placementBranchParts} total={placementStudentTotal} /> : <div style={styles.emptySub}>No student data available.</div>}
              </div>
            </section>
          </section>
        )}

        {tab === 'profile-verification' && (
          <section>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>Profile Verifications</h2>
                <p style={styles.sectionSub}>Review and verify student profile submissions. Filter by verification status, branch, or search by roll number/name.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  style={styles.searchInput}
                  placeholder="Search roll number or name…"
                  value={verificationSearch}
                  onChange={(e) => setVerificationSearch(e.target.value)}
                />
                <select
                  style={{ ...styles.searchInput, minWidth: 140 }}
                  value={verificationBranchFilter}
                  onChange={(e) => setVerificationBranchFilter(e.target.value)}
                >
                  <option value="">All branches</option>
                  {BASE_BRANCH_OPTIONS.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.filterRow}>
              <span style={styles.filterGroupLabel}>Status</span>
              {['All', 'Pending', 'Verified', 'Rejected'].map((s) => (
                <button
                  key={s}
                  type="button"
                  style={styles.filterBtn(verificationStatusFilter === s)}
                  onClick={() => setVerificationStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 18 }}>
              {[
                ['Total submitted', profileVerifications.length, colors.ink, 'All student submissions'],
                ['Verified', verificationStatusCounts.Verified, colors.teal, 'Approved profiles'],
                ['Pending', verificationStatusCounts.Pending, colors.gold, 'Waiting for review'],
                ['Rejected', verificationStatusCounts.Rejected, colors.red, 'Needs correction'],
              ].map(([label, count, color, hint]) => (
                <div key={label} style={{ background: '#fff', border: `1px solid ${colors.lineDark}`, borderRadius: 12, padding: '13px 15px', borderTop: `3px solid ${color}` }}>
                  <div style={{ color: colors.inkSoft, fontSize: 11, fontWeight: 700 }}>{label}</div>
                  <strong style={{ display: 'block', color, fontSize: 23, marginTop: 3 }}>{count}</strong>
                  <span style={{ color: colors.inkSoft, opacity: 0.7, fontSize: 10.5 }}>{hint}</span>
                </div>
              ))}
            </div>

            {verificationNotice && (
              <div style={{
                ...styles.statusBanner,
                ...(verificationNotice.tone === 'error' ? styles.statusBannerError : { background: 'rgba(15,118,110,0.06)', borderColor: 'rgba(15,118,110,0.3)' }),
                marginBottom: 18,
              }}>
                <span style={{
                  ...styles.statusDot,
                  ...(verificationNotice.tone === 'error' ? styles.statusDotError : { background: colors.teal }),
                }} />
                <p style={styles.statusText}>{verificationNotice.message}</p>
              </div>
            )}

            {verificationLoading && (
              <div style={styles.statusBanner}>
                <span style={styles.statusDot} />
                <p style={styles.statusText}>Loading profile verifications…</p>
              </div>
            )}

            {!verificationLoading && visibleProfileVerifications.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>No profile verifications found</p>
                <p style={styles.emptySub}>No student profiles have been submitted for verification yet.</p>
              </div>
            ) : (
              <div className="verification-list">
                {visibleProfileVerifications.map((verification) => (
                  <div className="verification-card" key={verification._id}>
                    <div className="verification-details">
                      <div style={styles.cardTop}>
                        <div>
                          <h3 style={styles.appName}>{verification.name || 'Unknown'}</h3>
                          <p style={styles.appSub}>{verification.rollNumber || 'No roll number'} · {verification.branch || 'No branch'}</p>
                        </div>
                        <span style={{
                          ...styles.companyPackage,
                          backgroundColor: verification.verificationStatus === 'Verified' ? colors.teal :
                                            verification.verificationStatus === 'Rejected' ? colors.red :
                                            colors.gold,
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {verification.verificationStatus || 'Pending'}
                        </span>
                      </div>
                      <div style={styles.pillRow}>
                        <span style={{ ...styles.pill, fontSize: 14 }}>CGPA {typeof verification.cgpa === 'number' ? verification.cgpa.toFixed(2) : '—'}</span>
                        <span style={{ ...styles.pill, fontSize: 14 }}>10th {typeof verification.tenthPercentage === 'number' ? `${verification.tenthPercentage}%` : '—'}</span>
                        <span style={{ ...styles.pill, fontSize: 14 }}>12th {typeof verification.twelfthPercentage === 'number' ? `${verification.twelfthPercentage}%` : '—'}</span>
                        <span style={{ ...styles.pill, fontSize: 14 }}>Backlogs {verification.backlogs ?? '—'}</span>
                      </div>
                      <div className="verification-meta" style={{ fontSize: 17, color: colors.inkSoft, lineHeight: 1.7 }}>
                        <p><strong>Email:</strong> {verification.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {verification.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> {verification.address || 'N/A'}</p>
                        <p><strong>Graduation year:</strong> {verification.graduationYear || 'N/A'}</p>
                        <p><strong>Diploma percentage:</strong> {verification.diplomaPercentage ?? 'N/A'}</p>
                        <p><strong>Graduation marks:</strong> {verification.graduationMarks ?? 'N/A'}</p>
                        <p><strong>Submitted:</strong> {verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Skills:</strong> {verification.skills || 'N/A'}</p>
                        <p><strong>Certifications:</strong> {verification.certifications || 'N/A'}</p>
                        <p><strong>Projects:</strong> {verification.projects || 'N/A'}</p>
                        <p><strong>LinkedIn:</strong> {verification.linkedin || 'N/A'}</p>
                        <p><strong>GitHub:</strong> {verification.github || 'N/A'}</p>
                        <p><strong>Portfolio:</strong> {verification.portfolio || 'N/A'}</p>
                        <p><strong>Profile photo:</strong> {verification.profilePhoto ? 'Uploaded' : 'Not uploaded'}</p>
                      </div>
                      <button
                        type="button"
                        style={styles.btnDocsSmall}
                        onClick={() => setDocsFor({
                          student: verification,
                          documents: normalizeVerificationDocuments({
                            ...(verification.documents || {}),
                            ...(verification.profilePhoto ? {
                              profilePhoto: { url: verification.profilePhoto, fileName: 'Profile photo' },
                            } : {}),
                          }),
                        })}
                      >
                        Documents
                      </button>
                    </div>
                    {verification.verificationStatus === 'Pending' && (
                      <div className="verification-actions">
                        <span className="verification-actions-label">Review profile</span>
                        <div style={styles.actionRow}>
                          <button
                            type="button"
                            style={{ ...styles.btnAccept, flex: 1 }}
                            onClick={() => setVerifyModalData({ id: verification._id, action: 'Verified', name: verification.name })}
                            disabled={verifyingId !== null}
                          >
                            ✓ Verify
                          </button>
                          <button
                            type="button"
                            style={{ ...styles.btnReject, flex: 1 }}
                            onClick={() => setVerifyModalData({ id: verification._id, action: 'Rejected', name: verification.name })}
                            disabled={verifyingId !== null}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {false && tab === 'companies' && (
          <section>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>Companies that arrived</h2>
                <p style={styles.sectionSub}>{totalCompanies} companies have received applications so far. Open "Notify eligible students" to set the exact criteria, preview matches, and email everyone who qualifies.</p>
              </div>
              <button type="button" style={styles.btnAccept} onClick={startCompanyCreate}>+ Create placement drive</button>
            </div>

            {companyFormOpen && (
              <div style={{ ...styles.card, marginBottom: 24 }}>
                <h3 style={styles.sectionTitle}>{editingCompanyId ? 'Edit placement drive' : 'Create placement drive'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {[
                    ['name', 'Company name', 'text'], ['role', 'Role', 'text'], ['package', 'Package', 'text'],
                    ['minCgpa', 'Minimum CGPA', 'number'], ['minTenthPercentage', 'Minimum 10th %', 'number'],
                    ['minTwelfthPercentage', 'Minimum 12th %', 'number'], ['maxBacklogs', 'Maximum backlogs', 'number'],
                    ['applicationStart', 'Application start', 'datetime-local'], ['deadline', 'Closing date and time', 'datetime-local'],
                  ].map(([field, label, type]) => (
                    <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 600 }}>
                      {label}
                      <input
                        type={type}
                        value={companyDraft[field]}
                        min={type === 'number' ? 0 : undefined}
                        max={field === 'minCgpa' ? 10 : field.includes('Percentage') ? 100 : undefined}
                        onChange={(event) => setCompanyDraft((prev) => ({ ...prev, [field]: event.target.value }))}
                        style={styles.searchInput}
                      />
                    </label>
                  ))}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 600 }}>
                    Eligible branches (comma separated)
                    <input value={companyDraft.branches} onChange={(event) => setCompanyDraft((prev) => ({ ...prev, branches: event.target.value }))} placeholder="CSE, IT, ECE" style={styles.searchInput} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={companyDraft.noBacklogs} onChange={(event) => setCompanyDraft((prev) => ({ ...prev, noBacklogs: event.target.checked }))} />
                    No active backlogs
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 600 }}>
                    Status
                    <select value={companyDraft.status} onChange={(event) => setCompanyDraft((prev) => ({ ...prev, status: event.target.value }))} style={styles.searchInput}>
                      <option>Open</option><option>Closing soon</option><option>Closed</option>
                    </select>
                  </label>
                </div>
                <div style={{ ...styles.actionRow, marginTop: 16 }}>
                  <button type="button" style={styles.btnAccept} onClick={saveCompany} disabled={companySaving}>{companySaving ? 'Saving...' : editingCompanyId ? 'Save changes' : 'Create Drive'}</button>
                  <button type="button" style={styles.btnGhost} onClick={() => setCompanyFormOpen(false)}>Cancel</button>
                </div>
              </div>
            )}

            {managedCompanies.length > 0 && (
              <div style={{ ...styles.grid, gridTemplateColumns: '1fr', marginBottom: 28 }}>
                {managedCompanies.map((company) => (
                  <div style={{ ...styles.card, display: 'grid', gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(250px, 2fr) minmax(220px, 1fr)', alignItems: 'center', gap: 20 }} key={company._id}>
                    <div style={styles.cardTop}><div><h3 style={styles.appName}>{company.name}</h3><p style={styles.appSub}>{company.role}</p></div><span style={styles.statusPill(company.status)}>{company.status}</span></div>
                    <div style={styles.pillRow}><span style={styles.pill}>{company.package || 'Package not set'}</span><span style={styles.pill}>CGPA {company.minCgpa ?? 'Any'}</span><span style={styles.pill}>{(company.branches || []).join(', ') || 'All branches'}</span></div>
                    <div style={styles.cardFootRow}><span style={styles.deadline}>{company.deadline ? `Closes ${new Date(company.deadline).toLocaleString()}` : 'No closing time'}</span><div style={styles.actionRow}><button type="button" style={styles.btnGhost} onClick={() => startCompanyEdit(company)}>Edit</button>{company.status !== 'Closed' && <button type="button" style={styles.btnReject} onClick={() => closeCompany(company)}>Close</button>}</div></div>
                  </div>
                ))}
              </div>
            )}

            {companyLoading && (
              <div style={styles.statusBanner}>
                <span style={styles.statusDot} />
                <p style={styles.statusText}>Loading placement drives...</p>
              </div>
            )}

            {!companyLoading && managedCompanies.length === 0 ? (
              <div style={{ ...styles.emptyState, position: 'relative', overflow: 'hidden', padding: '42px 24px', background: `linear-gradient(135deg, ${colors.ink} 0%, #0C7D69 100%)`, color: colors.paper, border: 'none' }}>
                <div style={{ position: 'absolute', top: -34, right: 28, width: 118, height: 118, border: `1px solid ${colors.gold}`, borderRadius: '50%', opacity: 0.35 }} />
                <div style={{ position: 'absolute', top: -10, right: 52, width: 70, height: 70, border: `1px solid ${colors.gold}`, borderRadius: '50%', opacity: 0.45 }} />
                <p style={{ margin: 0, color: colors.gold, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Placement workspace</p>
                <p style={{ ...styles.emptyTitle, color: colors.paper, fontSize: 24, margin: '8px 0 6px' }}>Shape the next opportunity</p>
                <p style={{ ...styles.emptySub, color: colors.paper, opacity: 0.72, marginBottom: 18 }}>Create a placement drive and make it visible to every matching student.</p>
                <button type="button" style={styles.btnAccept} onClick={startCompanyCreate}>+ Create placement drive</button>
              </div>
            ) : (
              <table style={{ ...styles.table, display: 'none' }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Company</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Package</th>
                    <th style={styles.th}>Min CGPA</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Applicants</th>
                    <th style={styles.th}>Pending review</th>
                    <th style={styles.th}>Verified students</th>
                    <th style={styles.th}>Selected</th>
                  </tr>
                </thead>
                <tbody>
                  {companyStats.map((c) => (
                    <>
                      <tr key={c.id}>
                        <td style={{ ...styles.td, fontWeight: 600, fontFamily: fonts.display }}>{c.name}</td>
                        <td style={styles.td}>{c.role}</td>
                        <td style={{ ...styles.td, color: colors.teal, fontWeight: 600 }}>{c.package}</td>
                        <td style={styles.td}>{typeof c.minCgpa === 'number' ? c.minCgpa.toFixed(1) : 'Any'}</td>
                        <td style={styles.td}><span style={styles.statusPill(c.status)}>{c.status}</span></td>
                        <td style={styles.td}>{c.applicantCount}</td>
                        <td style={styles.td}>{c.pendingCount}</td>
                        <td style={styles.td}>{c.verifiedCount}</td>
                        <td style={styles.td}>{c.selectedCount}</td>
                      </tr>
                      {expandedCompany === c.id && (
                        <tr key={`${c.id}-detail`}>
                          <td style={{ ...styles.td, background: 'rgba(15,22,38,0.02)' }} colSpan={9}>
                            {c.apps.length === 0 ? (
                              <span style={{ fontSize: 13, opacity: 0.55 }}>No applicants yet for this drive.</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <strong style={{ fontSize: 13 }}>Verified students ({c.verifiedCount})</strong>
                                {c.apps.filter((application) => application.verificationStatus === 'Verified').length === 0 ? (
                                  <span style={{ fontSize: 13, opacity: 0.55 }}>No students verified for this drive yet.</span>
                                ) : (
                                  c.apps.filter((application) => application.verificationStatus === 'Verified').map((application) => (
                                    <div key={`verified-${application.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${colors.line}` }}>
                                      <span><strong>{application.student.name}</strong> · {application.student.rollNumber} · {application.student.branch || 'Branch not set'}</span>
                                      <button type="button" style={styles.btnDocsSmall} onClick={() => setDocsFor({ student: application.student, documents: application.documents })}>Documents ({application.documents.length})</button>
                                    </div>
                                  ))
                                )}
                                <strong style={{ fontSize: 13, marginTop: 8 }}>All applicants</strong>
                                {c.apps.map((a) => (
                                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
                                    <span>
                                      <strong>{a.student.name}</strong> · {a.student.rollNumber} · CGPA {typeof a.student.cgpa === 'number' ? a.student.cgpa.toFixed(1) : '—'}
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
        </main>
      </DashboardShell>

      {docsFor && (
        <DocumentsModal
          student={docsFor.student}
          documents={docsFor.documents}
          onClose={() => setDocsFor(null)}
        />
      )}

      {notifyModalFor && (
        <NotifyEligibleStudentsModal
          company={notifyModalFor}
          branchOptions={branchOptions}
          sending={sendingEmailsFor === notifyModalFor.id}
          onClose={() => setNotifyModalFor(null)}
          onSend={(matchedStudents, subject, message) => handleSendCompanyNotification(notifyModalFor, matchedStudents, subject, message)}
        />
      )}

      {verifyModalData && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{ marginBottom: 16, color: colors.ink }}>
              {verifyModalData.action === 'Verified' ? '✓ Verify Profile' : '✗ Reject Profile'}
            </h3>
            <p style={{ marginBottom: 16, color: colors.inkSoft }}>
              {verifyModalData.action === 'Verified' 
                ? `Verify profile for ${verifyModalData.name}?` 
                : `Reject profile for ${verifyModalData.name}? Please provide a reason.`}
            </p>
            <textarea
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 6,
                border: `1px solid ${colors.inkSoft}`,
                fontFamily: fonts.body,
                fontSize: 14,
                marginBottom: 16,
                minHeight: 80,
                boxSizing: 'border-box',
              }}
              placeholder={verifyModalData.action === 'Verified' ? 'Optional note...' : 'Reason for rejection (required)...'}
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={styles.btnGhost}
                onClick={() => {
                  setVerifyModalData(null);
                  setVerificationNote('');
                }}
                disabled={verifyingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  ...styles.btnGhost,
                  backgroundColor: verifyModalData.action === 'Verified' ? colors.teal : colors.red,
                  color: '#fff',
                }}
                onClick={() => updateProfileVerification(verifyModalData.id, verifyModalData.action, verificationNote)}
                disabled={verifyingId !== null}
              >
                {verifyingId === verifyModalData.id ? 'Processing…' : (verifyModalData.action === 'Verified' ? 'Verify' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {interviewModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: 560 }}>
            <h2 style={styles.sectionTitle}>Schedule interview</h2>
            <p style={styles.sectionSub}>{interviewModal.studentName} · {interviewModal.companyName}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {[
                ['date', 'Date', 'date'], ['time', 'Time', 'time'], ['location', 'Location', 'text'],
                ['panel', 'Panel', 'text'],
              ].map(([field, label, type]) => (
                <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 700 }}>
                  {label}
                  <input type={type} value={interviewDraft[field]} onChange={(event) => setInterviewDraft((prev) => ({ ...prev, [field]: event.target.value }))} style={styles.searchInput} />
                </label>
              ))}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 700 }}>
                Round
                <input value={interviewDraft.round} onChange={(event) => setInterviewDraft((prev) => ({ ...prev, round: event.target.value }))} style={styles.searchInput} />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10, fontSize: 12, fontWeight: 700 }}>
              Notes
              <textarea value={interviewDraft.notes} onChange={(event) => setInterviewDraft((prev) => ({ ...prev, notes: event.target.value }))} style={{ ...styles.searchInput, minHeight: 80, resize: 'vertical' }} />
            </label>
            <div style={{ ...styles.actionRow, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" style={styles.btnGhost} onClick={() => setInterviewModal(null)}>Cancel</button>
              <button type="button" style={styles.btnAccept} onClick={saveInterviewSchedule}>Save schedule</button>
            </div>
          </div>
        </div>
      )}

      {roundModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: 560 }}>
            <h2 style={styles.sectionTitle}>Record interview round</h2>
            <p style={styles.sectionSub}>{roundModal.studentName} · {roundModal.companyName}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 700 }}>
                Round
                <select value={roundDraft.roundName} onChange={(event) => setRoundDraft((prev) => ({ ...prev, roundName: event.target.value }))} style={styles.searchInput}>
                  <option>Aptitude</option><option>Technical</option><option>HR</option><option>Final</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 700 }}>
                Result
                <select value={roundDraft.status} onChange={(event) => setRoundDraft((prev) => ({ ...prev, status: event.target.value }))} style={styles.searchInput}>
                  <option>Qualified</option><option>Pending</option><option>Rejected</option>
                </select>
              </label>
              {[
                ['date', 'Date', 'date'], ['time', 'Time', 'time'], ['location', 'Location', 'text'], ['score', 'Score', 'text'],
              ].map(([field, label, type]) => (
                <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 700 }}>
                  {label}
                  <input type={type} value={roundDraft[field]} onChange={(event) => setRoundDraft((prev) => ({ ...prev, [field]: event.target.value }))} style={styles.searchInput} />
                </label>
              ))}
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10, fontSize: 12, fontWeight: 700 }}>
              Feedback
              <textarea value={roundDraft.feedback} onChange={(event) => setRoundDraft((prev) => ({ ...prev, feedback: event.target.value }))} style={{ ...styles.searchInput, minHeight: 80, resize: 'vertical' }} />
            </label>
            <div style={{ ...styles.actionRow, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" style={styles.btnGhost} onClick={() => setRoundModal(null)}>Cancel</button>
              <button type="button" style={styles.btnAccept} onClick={saveApplicationRound}>Save round result</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}