import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Circle,
  Trophy,
  Clock,
  Bell,
  X,
  Briefcase,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  Undo2,
  Sparkles,
  Award,
  Star,
  BellRing,
  CalendarPlus,
  Scale,
  Paperclip,
  Upload,
  Download,
  FileText,
  StickyNote,
  ExternalLink,
  Globe,
  CheckSquare,
  Square,
  Mail,
  Bot,
  Send,
  MessageCircle,
  Phone,
  Pencil,
  Github,
  Linkedin,
  Link2,
  Camera,
  IdCard,
  LogOut,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* =========================================================================
   DESIGN TOKENS  (matched to the CampusBridge "My Profile" screen)
   ========================================================================= */
const T = {
  sidebarBg: "#0F172A",
  sidebarActiveBg: "rgba(223, 250, 246, 0.18)",
  sidebarText: "#E2E8F0",
  sidebarMuted: "#BFDBFE",
  accent: "#0F766E",
  accentDark: "#115E59",
  accentSoft: "#DFFAF6",
  cream: "#F4FBFB",
  card: "#FFFFFF",
  border: "#D9EDF0",
  ink: "#0F172A",
  inkMuted: "#475569",
  inkSoft: "#334155",
  serif: "'Iowan Old Style', 'Palatino Linotype', Georgia, 'Times New Roman', serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif",
};

const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

function mapCompanyToDrive(company) {
  return {
    id: company._id,
    company: company.name,
    role: company.role,
    type: "Placement drive",
    package: company.package || "Package not specified",
    location: "Campus",
    driveDate: company.deadline || company.applicationStart || new Date().toISOString(),
    deadline: company.deadline || company.applicationStart || new Date().toISOString(),
    status: company.status,
    minCgpa: company.minCgpa ?? 0,
    minTenthPercentage: company.minTenthPercentage ?? 0,
    minTwelfthPercentage: company.minTwelfthPercentage ?? 0,
    branches: company.branches || [],
    maxBacklogs: company.maxBacklogs ?? null,
    backlogsAllowed: company.maxBacklogs !== null && company.maxBacklogs !== undefined ? company.maxBacklogs > 0 : !company.noBacklogs,
    applicants: 0,
    rounds: ["Application review", "Selection process"],
    description: "Placement opportunity published by the placement office.",
  };
}

function getStoredStudent() {
  try {
    const raw = localStorage.getItem('studentUser') || localStorage.getItem('user') || localStorage.getItem('admin');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
}

function persistStudentProfile(nextProfile) {
  const current = getStoredStudent() || {};
  const saved = {
    ...current,
    fullName: nextProfile.name,
    name: nextProfile.name,
    rollNumber: nextProfile.roll,
    branch: nextProfile.branch,
    email: nextProfile.email,
    phone: nextProfile.phone,
    address: nextProfile.address,
    cgpa: nextProfile.cgpa,
    tenthPercentage: nextProfile.tenth,
    twelfthPercentage: nextProfile.twelfth,
    backlogs: nextProfile.backlogs,
    resume: nextProfile.resume,
    profilePhoto: nextProfile.documentPaths?.photo || nextProfile.profilePhoto,
    documents: nextProfile.documents,
    documentPaths: nextProfile.documentPaths,
    skills: nextProfile.skills,
    graduationYear: nextProfile.graduationYear,
    graduationMarks: nextProfile.graduationMarks,
  };
  localStorage.setItem('studentUser', JSON.stringify(saved));
  localStorage.setItem('user', JSON.stringify(saved));
}

const PALETTE = [
  { from: "#0F766E", to: "#0F172A" },
  { from: "#14B8A6", to: "#0F766E" },
  { from: "#0EA5A4", to: "#134E4A" },
  { from: "#2DD4BF", to: "#0F172A" },
  { from: "#0F766E", to: "#1D4ED8" },
  { from: "#14B8A6", to: "#0F172A" },
];

function paletteFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/* =========================================================================
   MOCK DATA
   ========================================================================= */
const DRIVES = [
  { id: "d1", company: "Infotech Nexus", role: "Software Engineer", type: "Full-time", package: "12 LPA",
    location: "Pune", driveDate: "2026-09-22", deadline: "2026-09-18", status: "Open", minCgpa: 7.5,
    branches: ["CSE", "IT"], backlogsAllowed: false, applicants: 214,
    rounds: ["Online Assessment", "Technical Interview", "HR Interview"],
    description: "Product engineering role building backend services for the payments platform." },
  { id: "d2", company: "Verdant Systems", role: "Data Analyst Intern", type: "Internship", package: "35k/mo",
    location: "Remote", driveDate: "2026-09-25", deadline: "2026-09-20", status: "Open", minCgpa: 7.0,
    branches: ["CSE", "IT", "ECE"], backlogsAllowed: true, applicants: 132,
    rounds: ["Resume Shortlist", "Case Study", "Interview"],
    description: "Six-month internship on the analytics team, pre-placement offer possible." },
  { id: "d3", company: "Orbital Cloud", role: "Cloud Support Engineer", type: "Full-time", package: "9.5 LPA",
    location: "Bengaluru", driveDate: "2026-09-14", deadline: "2026-09-12", status: "Closed", minCgpa: 7.5,
    branches: ["CSE", "IT", "ECE", "MECH"], backlogsAllowed: false, applicants: 341,
    rounds: ["Aptitude Test", "Technical Interview"],
    description: "L1/L2 support for enterprise cloud customers, rotational shifts." },
  { id: "d4", company: "Lumen Finserv", role: "Quant Analyst", type: "Full-time", package: "18 LPA",
    location: "Mumbai", driveDate: "2026-09-08", deadline: "2026-09-05", status: "Results Declared", minCgpa: 8.5,
    branches: ["CSE"], backlogsAllowed: false, applicants: 88,
    rounds: ["Online Assessment", "Technical Round 1", "Technical Round 2", "HR"],
    description: "Building pricing models for the derivatives desk." },
  { id: "d5", company: "Northgate Retail", role: "Associate Software Engineer", type: "Full-time", package: "7.2 LPA",
    location: "Hyderabad", driveDate: "2026-10-02", deadline: "2026-09-28", status: "Upcoming", minCgpa: 6.5,
    branches: ["CSE", "IT", "ECE"], backlogsAllowed: true, applicants: 46,
    rounds: ["Group Discussion", "Technical Interview"],
    description: "Internal tools team, works closely with store operations." },
  { id: "d6", company: "Ferrix Robotics", role: "Embedded Systems Engineer", type: "Full-time", package: "10 LPA",
    location: "Chennai", driveDate: "2026-09-30", deadline: "2026-09-24", status: "Open", minCgpa: 7.0,
    branches: ["ECE", "MECH"], backlogsAllowed: false, applicants: 59,
    rounds: ["Written Test", "Technical Interview", "HR"],
    description: "Firmware for autonomous warehouse robots." },
];

const INITIAL_APPLICATIONS = [
  { id: "a1", driveId: "d3", company: "Orbital Cloud", role: "Cloud Support Engineer", package: "9.5 LPA",
    appliedDate: "2026-09-06", stage: "Interview Scheduled", stageDate: "2026-09-16",
    history: [
      { stage: "Applied", date: "2026-09-06", done: true },
      { stage: "Shortlisted", date: "2026-09-10", done: true },
      { stage: "Interview Scheduled", date: "2026-09-16", done: true },
      { stage: "Offer", date: null, done: false },
    ],
    note: "Technical interview scheduled — check email for the meeting link.",
    personalNote: "",
    feedback: { rating: 0, text: "" },
    documents: { resume: "Rahul_Patil_Resume.pdf", idProof: "Aadhaar_Card.pdf", marksheet: null, offerLetter: null } },
  { id: "a2", driveId: "d4", company: "Lumen Finserv", role: "Quant Analyst", package: "18 LPA",
    appliedDate: "2026-09-02", stage: "Rejected", stageDate: "2026-09-09",
    history: [
      { stage: "Applied", date: "2026-09-02", done: true },
      { stage: "Shortlisted", date: "2026-09-05", done: true },
      { stage: "Interview", date: "2026-09-08", done: true },
      { stage: "Rejected", date: "2026-09-09", done: true },
    ],
    note: "Not selected after the technical round. Keep an eye out for the next quant drive.",
    personalNote: "Struggled on the probability questions — revise before the next quant interview.",
    feedback: { rating: 3, text: "Two tough technical rounds focused on stochastic processes. Panel was fair but pace was fast." },
    documents: { resume: "Rahul_Patil_Resume.pdf", idProof: "Aadhaar_Card.pdf", marksheet: "Sem7_Marksheet.pdf", offerLetter: null } },
  { id: "a3", driveId: "d1", company: "Infotech Nexus", role: "Software Engineer", package: "12 LPA",
    appliedDate: "2026-09-10", stage: "Applied", stageDate: "2026-09-10",
    history: [
      { stage: "Applied", date: "2026-09-10", done: true },
      { stage: "Shortlisted", date: null, done: false },
      { stage: "Interview", date: null, done: false },
      { stage: "Offer", date: null, done: false },
    ],
    note: "Application received. Results for the online assessment are usually out in 5-7 days.",
    personalNote: "",
    feedback: { rating: 0, text: "" },
    documents: { resume: "Rahul_Patil_Resume.pdf", idProof: null, marksheet: null, offerLetter: null } },
];

const DRIVE_HISTORY = [
];

/* Company profile lookups — used by the "view company" modal available from
   any drive, history, or application card. Falls back to a generic profile
   for any company not listed here. */
const COMPANY_PROFILES = {
  "Infotech Nexus": {
    industry: "Enterprise software", founded: 2009, website: "infotechnexus.example",
    description: "Builds backend platforms for payments and fintech infrastructure, serving mid-size banks across South Asia.",
    hiringHistory: [{ year: 2023, hired: 14, avgPackage: 9.8 }, { year: 2024, hired: 19, avgPackage: 10.6 }, { year: 2025, hired: 22, avgPackage: 11.4 }],
    alumni: [{ name: "Priya Sharma", batch: "2023", role: "SDE II" }, { name: "Arjun Rao", batch: "2024", role: "SDE I" }],
  },
  "Orbital Cloud": {
    industry: "Cloud infrastructure", founded: 2015, website: "orbitalcloud.example",
    description: "Cloud infrastructure and managed-support provider for enterprise customers running mission-critical workloads.",
    hiringHistory: [{ year: 2023, hired: 20, avgPackage: 7.9 }, { year: 2024, hired: 25, avgPackage: 8.6 }, { year: 2025, hired: 28, avgPackage: 9.1 }],
    alumni: [{ name: "Sana Iyer", batch: "2022", role: "Cloud Support Lead" }, { name: "Devansh Mehta", batch: "2024", role: "Cloud Support Engineer" }],
  },
  "Lumen Finserv": {
    industry: "Quantitative finance", founded: 2011, website: "lumenfinserv.example",
    description: "Runs systematic and derivatives trading desks; the campus program hires directly into the quant research pipeline.",
    hiringHistory: [{ year: 2023, hired: 3, avgPackage: 16.5 }, { year: 2024, hired: 5, avgPackage: 17.8 }, { year: 2025, hired: 4, avgPackage: 18.2 }],
    alumni: [{ name: "Kabir Desai", batch: "2023", role: "Quant Analyst" }],
  },
  "Kestrel Systems": {
    industry: "Developer tools", founded: 2018, website: "kestrelsystems.example",
    description: "Builds CI/CD and observability tooling used by mid-market engineering teams.",
    hiringHistory: [{ year: 2024, hired: 12, avgPackage: 6.4 }, { year: 2025, hired: 22, avgPackage: 7.1 }],
    alumni: [{ name: "Meera Nair", batch: "2024", role: "SDE Intern → SDE I" }],
  },
};

function companyProfile(name) {
  return (
    COMPANY_PROFILES[name] || {
      industry: "Not listed", founded: null, website: null,
      description: "No detailed profile has been added for this company yet.",
      hiringHistory: [], alumni: [],
    }
  );
}

/* =========================================================================
   HELPERS
   ========================================================================= */
const BRANCH_ALIASES = {
  CSE: "COMPUTER SCIENCE",
  "COMPUTER SCIENCE": "COMPUTER SCIENCE",
  IT: "INFORMATION TECHNOLOGY",
  "INFORMATION TECHNOLOGY": "INFORMATION TECHNOLOGY",
  ECE: "ELECTRONICS & COMMUNICATION",
  "ELECTRONICS & COMMUNICATION": "ELECTRONICS & COMMUNICATION",
  ME: "MECHANICAL",
  MECH: "MECHANICAL",
  MECHANICAL: "MECHANICAL",
};
function normalizeBranch(branch) {
  const value = String(branch || "").trim().toUpperCase();
  return BRANCH_ALIASES[value] || value;
}
function isEligible(drive, student) {
  return student.cgpa >= drive.minCgpa
    && (!drive.minTenthPercentage || student.tenth >= drive.minTenthPercentage)
    && (!drive.minTwelfthPercentage || student.twelfth >= drive.minTwelfthPercentage)
    && (!drive.branches.length || drive.branches.some((branch) => normalizeBranch(branch) === normalizeBranch(student.branch)))
    && (drive.maxBacklogs !== null && drive.maxBacklogs !== undefined
      ? student.backlogs <= drive.maxBacklogs
      : (drive.backlogsAllowed || student.backlogs === 0));
}
function eligibilityReasons(drive, student) {
  const r = [];
  if (student.cgpa < drive.minCgpa) r.push(`CGPA below ${drive.minCgpa} minimum`);
  if (drive.minTenthPercentage && student.tenth < drive.minTenthPercentage) r.push(`10th percentage below ${drive.minTenthPercentage}%`);
  if (drive.minTwelfthPercentage && student.twelfth < drive.minTwelfthPercentage) r.push(`12th percentage below ${drive.minTwelfthPercentage}%`);
  if (drive.branches.length && !drive.branches.some((branch) => normalizeBranch(branch) === normalizeBranch(student.branch))) r.push(`Not open to ${student.branch}`);
  if (drive.maxBacklogs !== null && drive.maxBacklogs !== undefined && student.backlogs > drive.maxBacklogs) r.push(`More than ${drive.maxBacklogs} active backlog${drive.maxBacklogs === 1 ? "" : "s"} allowed`);
  else if (!drive.backlogsAllowed && student.backlogs > 0) r.push("Active backlogs not permitted");
  return r;
}
function parseDriveDate(value) {
  if (!value) return null;
  return new Date(String(value).includes("T") ? value : `${value}T00:00:00`);
}
function fmtDate(iso) {
  const date = parseDriveDate(iso);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(iso) {
  const date = parseDriveDate(iso);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function daysUntil(iso) {
  const now = new Date("2026-09-12T00:00:00");
  const date = parseDriveDate(iso);
  return date ? Math.round((date - now) / 86400000) : -1;
}
function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function downloadICS(drive) {
  const dt = drive.driveDate.replace(/-/g, "");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
    `UID:${drive.id}@campusbridge`,
    `DTSTART;VALUE=DATE:${dt}`,
    `SUMMARY:${drive.company} — ${drive.role} drive`,
    `DESCRIPTION:Placement drive for ${drive.role} at ${drive.company}. Application deadline ${drive.deadline}.`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\n");
  downloadBlob(`${drive.company.replace(/\s+/g, "_")}_drive.ics`, ics, "text/calendar");
}
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  downloadBlob(filename, lines.join("\n"), "text/csv");
}

const DRIVE_STATUS_STYLE = {
  Open: { bg: "#E6FFFB", fg: "#0F766E" },
  Upcoming: { bg: "#EAF7FF", fg: "#0F172A" },
  Closed: { bg: "#EEF3F8", fg: "#475569" },
  "Results Declared": { bg: "#EAF7F5", fg: "#0F766E" },
};
const APP_STAGE_STYLE = {
  Applied: { bg: "#EAF7F5", fg: "#0F766E" },
  Shortlisted: { bg: "#EAF7FF", fg: "#0F172A" },
  "Interview Scheduled": { bg: "#EAF7F5", fg: "#0F766E" },
  Interview: { bg: "#EAF7F5", fg: "#0F766E" },
  Offer: { bg: "#DFFAF6", fg: "#0F766E" },
  Rejected: { bg: "#EEF3F8", fg: "#334155" },
  Withdrawn: { bg: "#EEF3F8", fg: "#475569" },
};
const OUTCOME_STYLE = {
  Selected: { bg: "#DFFAF6", fg: "#0F766E" },
  "Not selected": { bg: "#EEF3F8", fg: "#334155" },
  "In progress": { bg: "#EAF7F5", fg: "#0F766E" },
  "Did not apply": { bg: "#EEF3F8", fg: "#475569" },
  "Not eligible": { bg: "#EEF3F8", fg: "#475569" },
};
const ROUND_RESULT_STYLE = {
  Cleared: { bg: "#DFFAF6", fg: "#0F766E", icon: CheckCircle2 },
  Rejected: { bg: "#EEF3F8", fg: "#334155", icon: XCircle },
  Scheduled: { bg: "#EAF7FF", fg: "#0F172A", icon: Clock },
  "Not attended": { bg: "#F1F5F9", fg: "#475569", icon: Square },
};
/* Derives, round by round, whether the student attended and whether they cleared
   it — from the summary fields already on a drive-history record (rounds,
   roundsCleared, totalRounds, outcome, participated). */
function deriveRoundStatuses(h) {
  if (!h.participated || !h.rounds || !h.rounds.length) return [];
  return h.rounds.map((name, i) => {
    if (i < h.roundsCleared) return { round: name, attended: true, result: "Cleared" };
    if (i === h.roundsCleared) {
      if (h.outcome === "Not selected") return { round: name, attended: true, result: "Rejected" };
      if (h.outcome === "In progress") return { round: name, attended: false, result: "Scheduled" };
      if (h.outcome === "Selected") return { round: name, attended: true, result: "Cleared" };
    }
    return { round: name, attended: false, result: "Not attended" };
  });
}

/* =========================================================================
   SMALL UI PRIMITIVES
   ========================================================================= */
function Pill({ children, bg, fg, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: bg, color: fg, whiteSpace: "nowrap", ...style }}>
      {children}
    </span>
  );
}
function Avatar({ text, size = 40, name = "" }) {
  const p = name ? paletteFor(name) : null;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: p ? `linear-gradient(135deg, ${p.from}, ${p.to})` : "#f0ece1", color: p ? "#fff" : T.ink, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.36, flexShrink: 0, boxShadow: p ? `0 3px 8px ${p.from}55` : "none", border: p ? "none" : `1px solid ${T.border}` }}>
      {text}
    </div>
  );
}
function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function IconBtn({ icon: Icon, active, activeColor = T.accentDark, onClick, title, size = 15 }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      title={title}
      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${active ? activeColor : T.border}`, background: active ? `${activeColor}14` : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
    >
      <Icon size={size} color={active ? activeColor : T.inkSoft} fill={active ? activeColor : "none"} />
    </button>
  );
}
function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "40px 20px", color: T.inkMuted, fontSize: 13.5, border: `1px dashed ${T.border}`, borderRadius: 12 }}>{text}</div>;
}
function DetailItem({ icon: Icon, label, value }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.inkMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        <Icon size={12} /> {label}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{value}</div>
    </div>
  );
}
function RoundStatusList({ rounds }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rounds.map((r, i) => {
        const style = ROUND_RESULT_STYLE[r.result] || { bg: "#eee", fg: "#555", icon: Clock };
        const Icon = style.icon;
        return (
          <div key={r.round} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", background: "#fff" }}>
            <span style={{ fontSize: 11.5, color: T.inkMuted, width: 16, flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.ink }}>{r.round}</span>
            <Pill bg={style.bg} fg={style.fg}><Icon size={11} /> {r.result}</Pill>
          </div>
        );
      })}
    </div>
  );
}
const selectStyle = { padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 15, color: T.ink, background: "#fff", cursor: "pointer" };
const inputStyle = { width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 15, color: T.ink, fontFamily: T.sans, resize: "vertical" };

/* =========================================================================
   APP SHELL
   ========================================================================= */
function Sidebar({ active, onNavigate, savedCount }) {
  const items = [
    { key: "profile", label: "My Profile", icon: Users },
    { key: "drives", label: "Placement Drives", icon: Briefcase, badge: savedCount },
    { key: "history", label: "Drive History", icon: Clock },
    { key: "applications", label: "My Applications", icon: TrendingUp },
    { key: "toolkit", label: "Career Toolkit", icon: Award },
    { key: "notifications", label: "Notifications", icon: Bell },
  ];
  return (
    <aside style={{ width: 264, minHeight: "100vh", background: "linear-gradient(180deg, #0b1324 0%, #0f2330 100%)", display: "flex", flexDirection: "column", padding: "24px 16px 18px", flexShrink: 0, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 10px 28px" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${T.accentSoft}, #70d7ca)`, display: "flex", alignItems: "center", justifyContent: "center", color: T.ink, fontWeight: 900, fontSize: 17, boxShadow: "0 8px 18px rgba(45,212,191,.18)" }}>C</div>
        <div><span style={{ display: "block", color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: "-.02em" }}>Campus<span style={{ color: "#70d7ca" }}>Bridge</span></span><span style={{ display: "block", color: "#8ca4b5", fontSize: 10.5, marginTop: 2 }}>STUDENT WORKSPACE</span></div>
      </div>
      <div style={{ fontSize: 10.5, letterSpacing: "0.1em", color: "#6f8a9c", fontWeight: 800, padding: "0 10px 9px", textTransform: "uppercase" }}>Workspace</div>
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.key;
        return (
          <button key={it.key} onClick={() => onNavigate(it.key)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 9, border: isActive ? "1px solid rgba(223,250,246,.8)" : "1px solid transparent", background: isActive ? "linear-gradient(135deg, #dffaf6 0%, #8ee2d5 100%)" : "transparent", color: isActive ? "#0f172a" : "#c2d1d9", fontSize: 13.5, fontWeight: isActive ? 750 : 500, cursor: "pointer", textAlign: "left", marginBottom: 4, boxShadow: isActive ? "inset 4px 0 0 #d9a640, 0 12px 24px rgba(15,118,110,.3)" : "none" }}>
            <Icon size={16} color={isActive ? "#0f766e" : "#91adbc"} />
            {it.label}
            {!!it.badge && (
              <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, background: "#62d4c6", color: "#0b2930", borderRadius: 999, padding: "2px 7px" }}>{it.badge}</span>
            )}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "16px 10px 0", fontSize: 11.5, color: "#8ca4b5" }}>
        <div style={{ fontWeight: 750, color: "#d9efec", marginBottom: 4 }}>Need help?</div>
        <div>Contact placement office</div>
      </div>
    </aside>
  );
}

function StudentOverviewPage({ profile, applications, appliedDriveIds, bookmarks, onNavigate }) {
  const activeApplications = applications.filter((app) => !["Rejected", "Withdrawn"].includes(app.stage));
  const nextDrive = DRIVES.filter((drive) => ["Open", "Upcoming"].includes(drive.status)).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
  const profileFields = [profile.name, profile.roll, profile.branch, profile.email, profile.phone, profile.skills].filter(Boolean).length;
  const profilePercent = Math.round((profileFields / 6) * 100);
  return (
    <div>
      <PageHeader eyebrow="Student workspace" title={`Good morning, ${profile.name.split(" ")[0]}`} right={<button type="button" onClick={() => onNavigate("drives")} style={{ border: 0, borderRadius: 9, background: T.accentDark, color: "#fff", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><Briefcase size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />Explore drives</button>} />
      <div style={{ padding: "22px 32px 50px", display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, .85fr)", gap: 16 }}>
          <div style={{ borderRadius: 20, padding: "24px", color: "#fff", background: `linear-gradient(135deg, ${T.accentDark}, ${T.accent})`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 1 }}><Pill bg="rgba(255,255,255,.15)" fg="#fff">Placement season 2026-27</Pill><h2 style={{ margin: "16px 0 7px", fontSize: 25 }}>Your next opportunity is closer than you think.</h2><p style={{ margin: 0, maxWidth: 510, color: "rgba(255,255,255,.78)", fontSize: 13, lineHeight: 1.55 }}>Stay ready, track your applications, and prepare for the roles that match your profile.</p><div style={{ display: "flex", gap: 24, marginTop: 22, flexWrap: "wrap" }}>{[[activeApplications.length, "Active applications"], [appliedDriveIds.size, "Drives applied"], [bookmarks.size, "Saved drives"]].map(([value, label]) => <div key={label}><strong style={{ display: "block", fontSize: 23 }}>{value}</strong><span style={{ color: "rgba(255,255,255,.72)", fontSize: 11 }}>{label}</span></div>)}</div></div>
            <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", border: "1px solid rgba(255,255,255,.13)", right: -80, bottom: -120 }} />
          </div>
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 20, padding: "20px", boxShadow: "0 12px 28px rgba(15,118,110,.05)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong style={{ color: T.ink, fontSize: 15 }}>Profile readiness</strong><GraduationCap size={18} color={T.accentDark} /></div><div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18 }}><div style={{ width: 76, height: 76, borderRadius: "50%", background: `conic-gradient(${T.accent} ${profilePercent}%, ${T.border} 0)`, display: "grid", placeItems: "center" }}><div style={{ width: 58, height: 58, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", color: T.accentDark, fontWeight: 800 }}>{profilePercent}%</div></div><div><strong style={{ display: "block", color: T.ink, fontSize: 13 }}>{profilePercent === 100 ? "Ready to apply" : "Complete your profile"}</strong><span style={{ display: "block", color: T.inkMuted, fontSize: 11.5, lineHeight: 1.45, marginTop: 4 }}>A complete profile improves eligibility matching.</span><button type="button" onClick={() => onNavigate("profile")} style={{ marginTop: 9, padding: 0, border: 0, background: "transparent", color: T.accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Update profile →</button></div></div></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, .75fr)", gap: 16 }}>
          <section style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 18, padding: "20px", boxShadow: "0 12px 28px rgba(15,118,110,.05)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div><h2 style={{ margin: 0, color: T.ink, fontSize: 16 }}>Application progress</h2><p style={{ margin: "4px 0 0", color: T.inkMuted, fontSize: 12 }}>Your latest placement activity</p></div><button type="button" onClick={() => onNavigate("applications")} style={{ border: 0, background: "transparent", color: T.accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View all</button></div>{activeApplications.length ? activeApplications.slice(0, 3).map((app) => <div key={app.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 0", borderTop: `1px solid ${T.border}` }}><Avatar text={initials(app.company)} name={app.company} size={36} /><div style={{ flex: 1, minWidth: 0 }}><strong style={{ display: "block", color: T.ink, fontSize: 13 }}>{app.company}</strong><span style={{ color: T.inkMuted, fontSize: 11.5 }}>{app.role}</span></div><Pill bg={T.accentSoft} fg={T.accentDark}>{app.stage}</Pill><ChevronRightIcon size={15} color={T.inkMuted} /></div>) : <EmptyState text="Apply to a drive to start tracking progress." />}</section>
          <section style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 18, padding: "20px", boxShadow: "0 12px 28px rgba(15,118,110,.05)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h2 style={{ margin: 0, color: T.ink, fontSize: 16 }}>Next deadline</h2><p style={{ margin: "4px 0 0", color: T.inkMuted, fontSize: 12 }}>Keep this one on your radar</p></div><BellRing size={18} color={T.accentDark} /></div>{nextDrive && <div style={{ marginTop: 18, padding: "15px", borderRadius: 13, background: T.cream }}><Pill bg={T.accentSoft} fg={T.accentDark}>{daysUntil(nextDrive.deadline)} days left</Pill><strong style={{ display: "block", color: T.ink, fontSize: 15, marginTop: 12 }}>{nextDrive.company}</strong><span style={{ display: "block", color: T.inkMuted, fontSize: 12, marginTop: 4 }}>{nextDrive.role} · {nextDrive.package}</span><div style={{ display: "flex", alignItems: "center", gap: 6, color: T.inkMuted, fontSize: 11.5, marginTop: 14 }}><Calendar size={13} /> Apply by {fmtDate(nextDrive.deadline)}</div><button type="button" onClick={() => onNavigate("drives")} style={{ width: "100%", marginTop: 14, border: 0, borderRadius: 8, background: T.accentDark, color: "#fff", padding: "9px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>View opportunity</button></div>}</section>
        </div>

        <section style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 18, padding: "20px", boxShadow: "0 12px 28px rgba(15,118,110,.05)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div><h2 style={{ margin: 0, color: T.ink, fontSize: 16 }}>Quick actions</h2><p style={{ margin: "4px 0 0", color: T.inkMuted, fontSize: 12 }}>Keep your placement preparation moving</p></div><Award size={18} color={T.accentDark} /></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>{[["Career Toolkit", "Analyze skills and readiness", "toolkit", GraduationCap], ["My Applications", "Review your pipeline", "applications", TrendingUp], ["Placement History", "Learn from previous drives", "history", Clock], ["Resource Hub", "Prepare for your next round", "toolkit", FileText]].map(([label, description, target, Icon]) => <button type="button" key={label} onClick={() => onNavigate(target)} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: `1px solid ${T.border}`, background: T.cream, borderRadius: 11, padding: "12px", cursor: "pointer" }}><Icon size={17} color={T.accentDark} /><span><strong style={{ display: "block", color: T.ink, fontSize: 12.5 }}>{label}</strong><small style={{ color: T.inkMuted, fontSize: 11 }}>{description}</small></span></button>)}</div></section>
      </div>
    </div>
  );
}

function ChevronRightIcon({ size = 15, color = "currentColor" }) { return <ChevronDown size={size} color={color} style={{ transform: "rotate(-90deg)" }} />; }

/* =========================================================================
   CAREER TOOLKIT
   ========================================================================= */
function ToolkitSection({ icon: Icon, title, description, children, action }) {
  return (
    <section style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 18, padding: "20px", boxShadow: "0 12px 28px rgba(15,118,110,0.05)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: T.accentSoft, color: T.accentDark, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={18} /></div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: T.ink, fontSize: 17, fontWeight: 800 }}>{title}</h2>
          <p style={{ margin: "4px 0 0", color: T.inkMuted, fontSize: 12.5, lineHeight: 1.45 }}>{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PlacementAssistant({ profile, applications, drives, expanded = false }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { from: "assistant", text: `Hi ${profile.name.split(" ")[0]}! Ask me about drives, eligibility, deadlines, applications, or interview preparation.` },
  ]);
  const suggestedQuestions = ["Which drives am I eligible for?", "What is my next deadline?", "How do I prepare for an interview?"];

  async function answerQuestion(value) {
    const text = value.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const availableDrives = drives || [];
    const nextDrive = availableDrives.filter((drive) => ["Open", "Upcoming"].includes(drive.status)).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
    let answer = "I can help with placement drives, eligibility, deadlines, applications, documents, and interview preparation. Try asking about your next deadline or eligible drives.";

    if (lower.includes("eligible") || lower.includes("eligibility")) {
      const eligible = availableDrives.filter((drive) => isEligible(drive, profile));
      answer = eligible.length ? `You currently match ${eligible.length} drives: ${eligible.map((drive) => drive.company).join(", ")}. Open Placement Drives to review each requirement.` : "No current drive matches every eligibility requirement in your profile.";
    } else if (lower.includes("deadline") || lower.includes("due") || lower.includes("when should")) {
      answer = nextDrive ? `Your next deadline is ${fmtDate(nextDrive.deadline)} for ${nextDrive.company}. The role is ${nextDrive.role}, offering ${nextDrive.package}.` : "There are no open application deadlines right now.";
    } else if (lower.includes("application") || lower.includes("status") || lower.includes("applied")) {
      answer = applications.length ? `You have ${applications.length} application${applications.length === 1 ? "" : "s"}, with ${applications.filter((app) => !["Rejected", "Withdrawn"].includes(app.stage)).length} still active. Visit My Applications for timelines and document checklists.` : "You have not applied to a drive yet. Visit Placement Drives to find an opportunity.";
    } else if (lower.includes("shortlist") || lower.includes("selected for interview") || lower.includes("which compan")) {
      const shortlistedApplications = applications.filter((app) => ["Shortlisted", "Interview Scheduled"].includes(app.stage));
      answer = shortlistedApplications.length
        ? `Based on your application history, you are shortlisted for: ${shortlistedApplications.map((app) => `${app.company} (${app.stage})`).join(", ")}.`
        : "Based on your application history, you are not currently shortlisted for any company.";
    } else if (lower.includes("interview") || lower.includes("prepare") || lower.includes("preparation")) {
      answer = "Start with the role's required skills, revise DSA and SQL, prepare two project stories, and practise explaining your resume. Record what you learn after each interview in Feedback after interviews.";
    } else if (lower.includes("document") || lower.includes("resume")) {
      answer = "Keep your resume, government ID, latest marksheet, and profile details ready. You can upload or replace documents from the expanded application record.";
    } else if (lower.includes("profile") || lower.includes("cgpa")) {
      answer = `Your profile shows ${profile.branch} with a ${profile.cgpa} CGPA and ${profile.backlogs} active backlogs. Complete missing contact details and skills to improve matching.`;
    }

    const isApplicationFactQuestion = lower.includes("shortlist") || lower.includes("selected for interview") || lower.includes("which compan");
    try {
      if (isApplicationFactQuestion) {
        setMessages((previous) => [...previous, { from: "student", text }, { from: "assistant", text: answer }]);
        setQuestion("");
        return;
      }

      const response = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("studentToken") || ""}`,
        },
        body: JSON.stringify({ question: text, student: profile, applications, drives: availableDrives }),
      });
      const result = await response.json();
      if (response.ok && result.answer) answer = result.answer;
    } catch (error) {
      // Keep the local placement answer when the AI service is unavailable.
    }

    setMessages((previous) => [...previous, { from: "student", text }, { from: "assistant", text: answer }]);
    setQuestion("");
  }

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", background: T.cream }}>
      <div style={{ maxHeight: expanded ? "calc(100vh - 285px)" : 250, minHeight: expanded ? 300 : 0, overflowY: "auto", padding: expanded ? "20px 22px" : "12px 14px", display: "grid", gap: expanded ? 14 : 9 }}>
        {messages.map((message, index) => <div key={`${message.from}-${index}`} style={{ display: "flex", justifyContent: message.from === "student" ? "flex-end" : "flex-start", gap: 7 }}><div style={{ maxWidth: "86%", padding: expanded ? "13px 15px" : "9px 11px", borderRadius: message.from === "student" ? "12px 12px 3px 12px" : "12px 12px 12px 3px", background: message.from === "student" ? T.accentDark : "#fff", color: message.from === "student" ? "#fff" : T.ink, fontSize: expanded ? 15 : 12, lineHeight: 1.55, boxShadow: "0 2px 6px rgba(15,118,110,.05)" }}>{message.from === "assistant" && <Bot size={expanded ? 15 : 12} style={{ display: "inline", verticalAlign: "-2px", marginRight: 5, color: T.accentDark }} />}{message.text}</div></div>)}
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", padding: expanded ? "0 22px 14px" : "0 14px 10px" }}>{suggestedQuestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => answerQuestion(suggestion)} style={{ border: `1px solid ${T.border}`, borderRadius: 999, background: "#fff", color: T.accentDark, padding: expanded ? "8px 12px" : "5px 9px", cursor: "pointer", fontSize: expanded ? 12.5 : 10.5 }}>{suggestion}</button>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); answerQuestion(question); }} style={{ display: "flex", gap: 8, padding: expanded ? "14px 18px" : "10px 12px", background: "#fff", borderTop: `1px solid ${T.border}` }}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a placement question..." aria-label="Ask a placement question" style={{ ...inputStyle, flex: 1, borderRadius: 9, background: T.cream, fontSize: expanded ? 15 : 13 }} /><button type="submit" aria-label="Send question" style={{ width: expanded ? 48 : 38, border: 0, borderRadius: 9, background: T.accentDark, color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><Send size={expanded ? 19 : 15} /></button></form>
    </div>
  );
}

function StudentChatbot({ profile, applications, drives }) {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);

  return (
    <div style={{ position: "fixed", right: maximized ? 16 : 22, bottom: maximized ? 16 : 22, zIndex: 120, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, width: maximized ? "min(720px, calc(100vw - 32px))" : "min(390px, calc(100vw - 32px))" }}>
      {open && (
        <div style={{ width: "100%", background: "#fff", border: "2px solid #0b1324", borderRadius: 16, boxShadow: "0 18px 45px rgba(15,35,48,.2)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 15px", background: T.accentDark, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Bot size={16} /><strong style={{ fontSize: 13 }}>Placement Assistant</strong></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button type="button" onClick={() => setMaximized((value) => !value)} aria-label={maximized ? "Restore placement assistant" : "Maximize placement assistant"} style={{ border: 0, background: "transparent", color: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>{maximized ? "❐" : "□"}</button>
              <button type="button" onClick={() => { setOpen(false); setMaximized(false); }} aria-label="Close placement assistant" style={{ border: 0, background: "transparent", color: "#fff", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          </div>
          <div style={{ maxHeight: maximized ? "calc(100vh - 150px)" : "none", overflowY: maximized ? "auto" : "visible" }}>
            <PlacementAssistant profile={profile} applications={applications} drives={drives} expanded={maximized} />
          </div>
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "2px solid #0b1324", borderRadius: 999, padding: "12px 16px", background: T.accentDark, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 12px 25px rgba(15,118,110,.3)" }}>
        <Bot size={17} /> {open ? "Close assistant" : "Ask Placement Assistant"}
      </button>
    </div>
  );
}

function CareerToolkitPage({ profile, applications, drives, onUpdateApplication }) {
  const [reminders, setReminders] = useState(new Set(["d1", "d2"]));
  const [faqOpen, setFaqOpen] = useState(0);
  const [feedbackId, setFeedbackId] = useState(applications[0]?.id || "");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const upcomingDrives = DRIVES.filter((drive) => ["Open", "Upcoming"].includes(drive.status)).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const skillSet = new Set((profile.skills || "").split(",").map((skill) => skill.trim().toLowerCase()).filter(Boolean));
  const skillRows = [
    { role: "Software Engineer", skills: ["Java", "DSA", "SQL", "System Design"], demand: "High" },
    { role: "Data Analyst", skills: ["SQL", "Python", "Statistics", "Excel"], demand: "Growing" },
    { role: "Cloud Support Engineer", skills: ["Linux", "Networking", "Cloud", "Troubleshooting"], demand: "High" },
  ];
  const analytics = {
    total: applications.length,
    active: applications.filter((app) => !["Rejected", "Withdrawn"].includes(app.stage)).length,
    interviews: applications.filter((app) => app.stage.includes("Interview") || app.history.some((step) => step.stage.includes("Interview") && step.done)).length,
    offers: applications.filter((app) => app.stage === "Offer").length,
  };
  const calendarItems = [
    ...upcomingDrives.slice(0, 4).map((drive) => ({ date: drive.deadline, label: `${drive.company} application deadline`, type: "Deadline", icon: Bell })),
    ...applications.filter((app) => app.stage.includes("Interview")).map((app) => ({ date: app.stageDate, label: `${app.company} interview`, type: "Interview", icon: Calendar })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));
  const faqs = [
    ["How do I know if I am eligible for a drive?", "Open any placement drive to see branch, CGPA, and backlog requirements matched against your profile."],
    ["What should I prepare before a technical interview?", "Revise data structures, SQL, your projects, and the role-specific skills shown in Skill Gap Analysis."],
    ["Can I withdraw an application?", "Yes. Open My Applications, expand the application, and choose Withdraw while the application is still active."],
  ];

  function toggleReminder(id) {
    setReminders((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function saveFeedback() {
    if (!feedbackId || !feedbackText.trim()) return;
    const app = applications.find((item) => item.id === feedbackId);
    const feedback = app?.feedback ? { ...app.feedback, text: feedbackText.trim() } : { rating: 0, text: feedbackText.trim() };
    onUpdateApplication(feedbackId, { feedback });
    setFeedbackSaved(true);
    setFeedbackText("");
  }

  return (
    <div>
      <PageHeader eyebrow="Career toolkit" title="Everything for your placement journey" />
      <div style={{ padding: "22px 32px 50px", display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[[Bell, "Deadline reminders", `${reminders.size} active`], [TrendingUp, "Application progress", `${analytics.active}/${analytics.total || 0} active`], [Award, "Achievement points", "420 points"], [BarChart, "Placement readiness", "78% ready"]].map(([Icon, label, value]) => (
            <div key={label} style={{ background: T.accentSoft, borderRadius: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 11 }}><Icon size={18} color={T.accentDark} /><div><div style={{ fontSize: 11.5, color: T.inkMuted }}>{label}</div><strong style={{ color: T.ink, fontSize: 16 }}>{value}</strong></div></div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <ToolkitSection icon={Bell} title="Deadline reminders" description="Never miss an application window or campus test.">
            <div style={{ display: "grid", gap: 9 }}>{upcomingDrives.slice(0, 4).map((drive) => (
              <div key={drive.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ flex: 1 }}><strong style={{ display: "block", color: T.ink, fontSize: 13 }}>{drive.company}</strong><span style={{ color: T.inkMuted, fontSize: 11.5 }}>Apply by {fmtDate(drive.deadline)}</span></div>
                <button type="button" onClick={() => toggleReminder(drive.id)} style={{ border: `1px solid ${reminders.has(drive.id) ? T.accent : T.border}`, borderRadius: 8, background: reminders.has(drive.id) ? T.accentSoft : "#fff", color: reminders.has(drive.id) ? T.accentDark : T.inkMuted, padding: "7px 10px", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}>{reminders.has(drive.id) ? "On" : "Remind me"}</button>
              </div>
            ))}</div>
          </ToolkitSection>

          <ToolkitSection icon={Building2} title="Company insights" description="Compare hiring history, roles, packages, and eligibility.">
            <div style={{ display: "grid", gap: 9 }}>{DRIVES.slice(0, 4).map((drive) => { const insight = companyProfile(drive.company); return <div key={drive.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}><div><strong style={{ color: T.ink, fontSize: 13 }}>{drive.company}</strong><div style={{ color: T.inkMuted, fontSize: 11.5 }}>{insight.industry} · {drive.role}</div></div><div style={{ textAlign: "right", color: T.accentDark, fontSize: 11.5, fontWeight: 700 }}>{drive.package}<br /><span style={{ color: T.inkMuted, fontWeight: 500 }}>{drive.minCgpa} CGPA+</span></div></div>; })}</div>
          </ToolkitSection>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <ToolkitSection icon={GraduationCap} title="Skill gap analysis" description="See what your target roles need and where to focus next.">
            <div style={{ display: "grid", gap: 12 }}>{skillRows.map((row) => { const missing = row.skills.filter((skill) => !skillSet.has(skill.toLowerCase())); return <div key={row.role} style={{ padding: "11px 12px", background: T.cream, borderRadius: 11 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong style={{ color: T.ink, fontSize: 13 }}>{row.role}</strong><Pill bg={row.demand === "High" ? T.accentSoft : "#f8f1df"} fg={row.demand === "High" ? T.accentDark : "#966c18"}>{row.demand} demand</Pill></div><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>{row.skills.map((skill) => { const ready = skillSet.has(skill.toLowerCase()); return <Pill key={skill} bg={ready ? "#e8f7f2" : "#fff0f1"} fg={ready ? T.accentDark : "#b24150"}>{ready ? "Ready" : "Build"} · {skill}</Pill>; })}</div><small style={{ display: "block", marginTop: 8, color: T.inkMuted }}>{missing.length ? `${missing.length} skill${missing.length > 1 ? "s" : ""} to strengthen` : "Strong match for this role"}</small></div>; })}</div>
          </ToolkitSection>

          <ToolkitSection icon={Calendar} title="Placement calendar" description="Your deadlines, tests, and interviews in one view.">
            <div style={{ display: "grid", gap: 8 }}>{calendarItems.length ? calendarItems.map((item, index) => { const Icon = item.icon; return <div key={`${item.label}-${index}`} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}><div style={{ width: 35, height: 35, borderRadius: 9, background: T.accentSoft, color: T.accentDark, display: "grid", placeItems: "center" }}><Icon size={15} /></div><div><strong style={{ display: "block", fontSize: 12.5, color: T.ink }}>{item.label}</strong><span style={{ color: T.inkMuted, fontSize: 11.5 }}>{fmtDate(item.date)} · {item.type}</span></div></div>; }) : <EmptyState text="Your placement calendar is clear." />}</div>
          </ToolkitSection>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <ToolkitSection icon={Award} title="Leaderboard and achievements" description="Build momentum through consistent preparation.">
            <div style={{ display: "grid", gap: 9 }}>{[["You", "420 pts", "Profile 100% complete"], ["Aisha Verma", "510 pts", "Completed 12 practice sets"], ["Karan Shah", "475 pts", "Attended 8 mock interviews"]].map(([name, points, badge], index) => <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}><strong style={{ width: 22, color: index === 0 ? T.accentDark : T.inkMuted }}>#{index + 1}</strong><Avatar text={initials(name)} name={name} size={32} /><div style={{ flex: 1 }}><strong style={{ display: "block", color: T.ink, fontSize: 12.5 }}>{name}</strong><span style={{ color: T.inkMuted, fontSize: 11 }}>{badge}</span></div><strong style={{ color: T.accentDark, fontSize: 12 }}>{points}</strong></div>)}</div>
          </ToolkitSection>

          <ToolkitSection icon={BookOpenIcon} title="Resource hub" description="Curated material for aptitude, coding, and interviews.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 9 }}>{[["Aptitude", "Practice set 08", Clock], ["Coding", "Arrays and strings", FileText], ["Interview", "Top HR questions", Users], ["Projects", "Resume checklist", CheckSquare]].map(([label, title, Icon]) => <button type="button" key={title} style={{ textAlign: "left", border: `1px solid ${T.border}`, borderRadius: 10, background: T.cream, padding: "11px", cursor: "pointer" }}><Icon size={15} color={T.accentDark} /><strong style={{ display: "block", marginTop: 7, color: T.ink, fontSize: 12 }}>{label}</strong><span style={{ color: T.inkMuted, fontSize: 11 }}>{title}</span></button>)}</div>
          </ToolkitSection>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <ToolkitSection icon={Users} title="Alumni connect" description="Find graduates who have already made the transition into industry.">
            <div style={{ display: "grid", gap: 9 }}>{Object.entries(COMPANY_PROFILES).slice(0, 3).flatMap(([company, data]) => data.alumni.slice(0, 1).map((alumnus) => <div key={alumnus.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}><Avatar text={initials(alumnus.name)} name={alumnus.name} size={34} /><div style={{ flex: 1 }}><strong style={{ display: "block", color: T.ink, fontSize: 12.5 }}>{alumnus.name}</strong><span style={{ color: T.inkMuted, fontSize: 11 }}>{alumnus.role} · {company}</span></div><button type="button" style={{ border: `1px solid ${T.border}`, background: "#fff", borderRadius: 8, padding: "6px 9px", color: T.accentDark, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Connect</button></div>))}</div>
          </ToolkitSection>

          <ToolkitSection icon={MessageCircleIcon} title="Placement FAQ and assistant" description="Quick answers for the questions students ask most.">
            <div style={{ display: "grid", gap: 7 }}>{faqs.map(([question, answer], index) => <div key={question} style={{ borderBottom: `1px solid ${T.border}` }}><button type="button" onClick={() => setFaqOpen(faqOpen === index ? -1 : index)} style={{ display: "flex", width: "100%", justifyContent: "space-between", gap: 10, border: 0, background: "transparent", padding: "9px 0", color: T.ink, textAlign: "left", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{question}<ChevronDown size={15} style={{ transform: faqOpen === index ? "rotate(180deg)" : "none", flexShrink: 0 }} /></button>{faqOpen === index && <p style={{ margin: "0 0 10px", color: T.inkMuted, fontSize: 12, lineHeight: 1.5 }}>{answer}</p>}</div>)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "16px 0 9px", color: T.accentDark, fontSize: 11.5, fontWeight: 800 }}><MessageCircle size={14} /> Ask the placement assistant</div>
            <PlacementAssistant profile={profile} applications={applications} drives={drives} />
          </ToolkitSection>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <ToolkitSection icon={FileText} title="Feedback after interviews" description="Capture what you learned while the experience is still fresh." action={feedbackSaved && <Pill bg={T.accentSoft} fg={T.accentDark}>Saved</Pill>}>
            <select value={feedbackId} onChange={(event) => setFeedbackId(event.target.value)} style={{ ...selectStyle, width: "100%", marginBottom: 9 }}><option value="">Choose an interview</option>{applications.filter((app) => app.history.some((step) => step.stage.includes("Interview") && step.done)).map((app) => <option key={app.id} value={app.id}>{app.company} · {app.role}</option>)}</select>
            <textarea value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} placeholder="What questions came up? What will you prepare next time?" rows={3} style={{ ...inputStyle, marginBottom: 9 }} />
            <button type="button" onClick={saveFeedback} style={{ border: 0, borderRadius: 8, background: T.accentDark, color: "#fff", padding: "9px 13px", fontWeight: 700, cursor: "pointer" }}>Save interview notes</button>
          </ToolkitSection>

          <ToolkitSection icon={BarChart} title="Personal analytics" description="Understand your application-to-selection journey.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>{[["Applied", analytics.total], ["Active", analytics.active], ["Interview", analytics.interviews], ["Offers", analytics.offers]].map(([label, value]) => <div key={label} style={{ background: T.cream, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}><strong style={{ display: "block", fontSize: 20, color: T.accentDark }}>{value}</strong><span style={{ color: T.inkMuted, fontSize: 10.5 }}>{label}</span></div>)}</div>
            <div style={{ marginTop: 14, height: 9, borderRadius: 999, background: T.border, overflow: "hidden" }}><div style={{ width: `${analytics.total ? Math.min(100, Math.round((analytics.interviews / analytics.total) * 100)) : 0}%`, height: "100%", background: `linear-gradient(90deg, ${T.accent}, ${T.accentDark})` }} /></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, color: T.inkMuted, fontSize: 11.5 }}><span>Application to interview</span><strong style={{ color: T.accentDark }}>{analytics.total ? Math.round((analytics.interviews / analytics.total) * 100) : 0}%</strong></div>
          </ToolkitSection>
        </div>
      </div>
    </div>
  );
}

function BookOpenIcon({ size = 18, color = "currentColor" }) { return <FileText size={size} color={color} />; }
function MessageCircleIcon({ size = 18, color = "currentColor" }) { return <Mail size={size} color={color} />; }
function Topbar({ title, badgeCount, name, branch }) {
  const signOut = () => {
    ['studentToken', 'studentUser', 'adminToken', 'admin', 'user'].forEach((key) => localStorage.removeItem(key));
    window.location.href = '/login';
  };

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", minWidth: 0, padding: "15px 34px", borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,.92)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 20 }}>
      <div>
        <div style={{ fontSize: 10.5, color: T.inkMuted, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 800 }}>Campus placement portal</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 14, color: T.ink, fontWeight: 800 }}><span style={{ color: T.inkMuted, fontWeight: 500 }}>Workspace /</span>{title}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 0 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 999, background: T.accentSoft, color: T.accentDark, fontSize: 11, fontWeight: 750 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#20a77d" }} />Placement season live</span>
        <button aria-label="Notifications" style={{ position: "relative", border: `1px solid ${T.border}`, background: "#fff", width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Bell size={15} color={T.inkMuted} />
          {badgeCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#d64545", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{badgeCount}</span>}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 9, paddingLeft: 4 }}>
          <Avatar text={initials(name)} size={36} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{name}</div>
            <div style={{ fontSize: 11, color: T.inkMuted }}>{branch} student</div>
          </div>
        </div>
        <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" style={{ display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 11px", background: "#fff", color: T.ink, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <LogOut size={15} /> <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
function PageHeader({ eyebrow, title, right, compact = false }) {
  return (
    <div style={{ position: "relative", padding: compact ? "14px 32px 12px" : "24px 32px 18px", borderBottom: `1px solid ${T.border}`, overflow: "hidden", background: "linear-gradient(135deg, rgba(15,118,110,0.04), rgba(255,255,255,0.24))" }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${T.accent}18, transparent 70%)` }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fff", fontWeight: 700, marginBottom: 10, background: `linear-gradient(135deg, ${T.accent}, ${T.accentDark})`, padding: "4px 10px", borderRadius: 999 }}>
            <Sparkles size={11} /> {eyebrow}
          </div>
          <h1 style={{ fontFamily: T.serif, fontSize: compact ? 27 : 30, fontWeight: 700, color: T.ink, margin: 0 }}>{title}</h1>
        </div>
        {right}
      </div>
    </div>
  );
}
function StatCard({ label, value, icon: Icon, gradient, sublabel }) {
  const g = gradient || [T.accent, T.accentDark];
  return (
    <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 18, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 168, position: "relative", overflow: "hidden", boxShadow: "0 16px 30px rgba(15,118,110,0.05)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${g[0]}, ${g[1]})` }} />
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 10px ${g[0]}40` }}>
        <Icon size={19} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, lineHeight: 1.1, fontFamily: T.serif }}>{value}</div>
        <div style={{ fontSize: 12.5, color: T.inkMuted, marginTop: 3, fontWeight: 600 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: g[1], marginTop: 2, fontWeight: 700 }}>{sublabel}</div>}
      </div>
    </div>
  );
}
function ChartCard({ title, children, span }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px 8px", flex: span || 1, minWidth: 220, boxShadow: "0 1px 2px rgba(20,30,28,0.04)" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkMuted, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
        <Sparkles size={13} color={T.accentDark} /> {title}
      </div>
      {children}
    </div>
  );
}
function DonutBreakdown({ data, centerLabel, centerValue }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 108, height: 108, position: "relative", flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={34} outerRadius={52} paddingAngle={3} stroke="none">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, fontFamily: T.serif }}>{centerValue}</div>
          <div style={{ fontSize: 9.5, color: T.inkMuted, fontWeight: 600 }}>{centerLabel}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ color: T.ink, fontWeight: 600, flex: 1 }}>{d.name}</span>
            <span style={{ color: T.inkMuted, fontWeight: 700 }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function StatusBarChart({ data, height = 170 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} stroke={T.border} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: T.inkMuted }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11, fill: T.inkMuted }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: T.cream }} formatter={(value) => [value, 'Drives']} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function MiniBarChart({ data, color = T.accentDark, height = 140 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={T.border} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.inkMuted }} axisLine={{ stroke: T.border }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: T.inkMuted }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: T.cream }} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
          <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 32, background: T.ink, color: "#fff", padding: "12px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 60 }}>
      <CheckCircle2 size={16} color={T.accent} />
      {message}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 6, padding: 2 }}>
        <X size={14} color="#c9c9c9" />
      </button>
    </div>
  );
}
function ModalShell({ onClose, width = 480, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,20,18,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width, maxWidth: "100%", maxHeight: "85vh", overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
function ConfirmModal({ title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <ModalShell onClose={onCancel} width={380}>
      <h3 style={{ fontFamily: T.serif, fontSize: 20, margin: "0 0 10px", color: T.ink }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: T.inkMuted, lineHeight: 1.6, margin: "0 0 20px" }}>{body}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#a53737", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{confirmLabel}</button>
      </div>
    </ModalShell>
  );
}

/* Company profile modal — reused from drives, history, and applications */
function CompanyProfileModal({ company, onClose }) {
  const p = companyProfile(company);
  const pal = paletteFor(company);
  return (
    <ModalShell onClose={onClose} width={480}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Avatar text={initials(company)} name={company} size={46} />
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: T.ink }}>{company}</div>
          <div style={{ fontSize: 12.5, color: T.inkMuted }}>{p.industry}{p.founded ? ` · Est. ${p.founded}` : ""}</div>
        </div>
        <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>
          <X size={18} color={T.inkSoft} />
        </button>
      </div>

      <p style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.6, margin: "0 0 16px" }}>{p.description}</p>

      {p.website && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.accentDark, fontWeight: 600, marginBottom: 18 }}>
          <Globe size={13} /> {p.website} <ExternalLink size={11} />
        </div>
      )}

      {p.hiringHistory.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Hiring history on campus</div>
          <MiniBarChart height={120} color={pal.from} data={p.hiringHistory.map((h) => ({ name: String(h.year), value: h.hired }))} />
        </div>
      )}

      {p.alumni.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Alumni placed here</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {p.alumni.map((al) => (
              <div key={al.name} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px" }}>
                <Avatar text={initials(al.name)} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{al.name}</div>
                  <div style={{ fontSize: 11.5, color: T.inkMuted }}>{al.role} · Batch of {al.batch}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {p.hiringHistory.length === 0 && p.alumni.length === 0 && (
        <EmptyState text="No hiring history or alumni records for this company yet." />
      )}
    </ModalShell>
  );
}

/* Compare drives modal */
function CompareModal({ drives, onRemove, onClose }) {
  const rows = [
    { label: "Role", get: (d) => d.role },
    { label: "Package", get: (d) => d.package },
    { label: "Location", get: (d) => d.location },
    { label: "Type", get: (d) => d.type },
    { label: "Min. CGPA", get: (d) => d.minCgpa.toFixed(1) },
    { label: "Branches", get: (d) => d.branches.join(", ") },
    { label: "Backlogs allowed", get: (d) => (d.backlogsAllowed ? "Yes" : "No") },
    { label: "Deadline", get: (d) => fmtDate(d.deadline) },
    { label: "Rounds", get: (d) => d.rounds.length },
    { label: "Applicants", get: (d) => d.applicants },
    { label: "You're eligible", get: (d) => (isEligible(d, STUDENT) ? "Yes" : "No") },
  ];
  return (
    <ModalShell onClose={onClose} width={Math.min(760, 220 + drives.length * 200)}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontFamily: T.serif, fontSize: 20, margin: 0, color: T.ink, display: "flex", alignItems: "center", gap: 8 }}>
          <Scale size={18} color={T.accentDark} /> Compare drives
        </h3>
        <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>
          <X size={18} color={T.inkSoft} />
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr>
              <td style={{ width: 130 }} />
              {drives.map((d) => (
                <td key={d.id} style={{ padding: "0 10px 12px", minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar text={initials(d.company)} name={d.company} size={30} />
                    <div style={{ fontWeight: 700, color: T.ink, fontSize: 13 }}>{d.company}</div>
                    <button onClick={() => onRemove(d.id)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>
                      <X size={13} color={T.inkSoft} />
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td style={{ padding: "8px 10px 8px 0", color: T.inkMuted, fontWeight: 600, borderTop: `1px solid ${T.border}` }}>{r.label}</td>
                {drives.map((d) => (
                  <td key={d.id} style={{ padding: "8px 10px", color: T.ink, borderTop: `1px solid ${T.border}` }}>{r.get(d)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModalShell>
  );
}

/* Star rating input, used for interview feedback */
function StarRating({ value, onChange, readOnly }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={readOnly}
          onClick={() => onChange && onChange(n)}
          style={{ background: "none", border: "none", padding: 0, cursor: readOnly ? "default" : "pointer" }}
        >
          <Star size={16} color={n <= value ? "#c9a13e" : T.border} fill={n <= value ? "#c9a13e" : "none"} />
        </button>
      ))}
    </div>
  );
}

/* Document checklist used inside an application's expanded view */
const DOC_ITEMS = [
  { key: "resume", label: "Resume" },
  { key: "idProof", label: "ID proof" },
  { key: "marksheet", label: "Latest marksheet" },
  { key: "offerLetter", label: "Offer letter" },
];
const PROFILE_DOC_ITEMS = [
  { key: "photo", label: "Profile photo" },
  { key: "idProof", label: "Government ID proof" },
  { key: "tenthMarksheet", label: "10th marksheet" },
  { key: "twelfthMarksheet", label: "12th marksheet" },
  { key: "semesterMarksheets", label: "Latest semester marksheet" },
];
function DocumentChecklist({ documents, onUpload, items = DOC_ITEMS }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => {
        const fileName = documents[item.key];
        return (
          <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", background: "#fff", flexWrap: "wrap" }}>
            {fileName ? <CheckSquare size={16} color={T.accentDark} /> : <Square size={16} color={T.inkSoft} />}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{item.label}</div>
              <div style={{ fontSize: 13, color: fileName ? T.accentDark : T.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {fileName || "Not uploaded"}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 700, color: T.accentDark, border: `1px solid ${T.accentDark}55`, background: "#eef7f4", borderRadius: 7, padding: "6px 10px", cursor: "pointer", flexShrink: 0 }}>
              <Upload size={12} /> {fileName ? "Replace" : "Upload"}
              <input
                type="file"
                accept={item.key === "tenthMarksheet" || item.key === "twelfthMarksheet" || item.key === "semesterMarksheets" ? ".pdf,application/pdf" : undefined}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (file) onUpload(item.key, file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================================
   PLACEMENT DRIVES PAGE
   ========================================================================= */
function StudentPlacementCards({ drives, applications, profile, onApply }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const applicationByDrive = useMemo(() => new Map(applications.map((application) => [application.driveId, application])), [applications]);
  const getStatus = (drive) => applicationByDrive.get(drive.id)?.stage || "not_applied";
  const isEligibleForStudent = (drive) => isEligible(drive, {
    branch: profile.branch,
    cgpa: profile.cgpa === "" ? Number.NaN : Number(profile.cgpa),
    tenth: profile.tenth === "" ? Number.NaN : Number(profile.tenth),
    twelfth: profile.twelfth === "" ? Number.NaN : Number(profile.twelfth),
    backlogs: profile.backlogs === "" ? Number.NaN : Number(profile.backlogs),
  });
  const isClosed = (drive) => ["Closed", "Results Declared"].includes(drive.status) || daysUntil(drive.deadline) < 0;
  const statusMeta = {
    Applied: { label: "Applied", background: "#eff6ff", color: "#1d4ed8", icon: Clock },
    "Interview Scheduled": { label: "Interview scheduled", background: "#fffbeb", color: "#d97706", icon: Clock },
    Selected: { label: "Selected", background: T.accentSoft, color: T.accentDark, icon: CheckCircle2 },
    Offer: { label: "Selected", background: T.accentSoft, color: T.accentDark, icon: CheckCircle2 },
    Rejected: { label: "Not selected", background: "#fff1f2", color: "#e11d48", icon: XCircle },
  };

  const counts = {
    all: drives.length,
    eligible: drives.filter((drive) => isEligibleForStudent(drive) && !applicationByDrive.has(drive.id) && !isClosed(drive)).length,
    applied: drives.filter((drive) => applicationByDrive.has(drive.id)).length,
  };
  const filtered = useMemo(() => drives.filter((drive) => {
    const matchesQuery = `${drive.company} ${drive.role}`.toLowerCase().includes(query.toLowerCase());
    const applied = applicationByDrive.has(drive.id);
    const matchesFilter = filter === "all"
      || (filter === "eligible" && isEligibleForStudent(drive) && !applied && !isClosed(drive))
      || (filter === "applied" && applied);
    return matchesQuery && matchesFilter;
  }), [drives, query, filter, applicationByDrive]);

  return (
    <div style={{ minHeight: "100%", background: "#f0fbfa", padding: "20px 28px 46px", color: T.ink }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div><h1 style={{ margin: 0, fontFamily: T.serif, fontSize: 25 }}>Placement Drives</h1><p style={{ margin: "5px 0 0", color: T.inkMuted, fontSize: 13 }}>{profile.name ? `Hi ${profile.name.split(" ")[0]}` : "Complete your profile"}{profile.branch ? ` - ${profile.branch}` : ""}{profile.cgpa !== "" ? `, CGPA ${profile.cgpa}` : ""}</p></div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, width: "min(300px, 100%)", padding: "8px 11px", border: `1px solid ${T.border}`, borderRadius: 8, background: "#fff" }}><Search size={14} color={T.inkMuted} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies or roles..." style={{ width: "100%", minWidth: 0, border: 0, outline: 0, background: "transparent", color: T.ink, fontSize: 13 }} /></div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {[['all', `All (${counts.all})`], ['eligible', `Eligible to apply (${counts.eligible})`], ['applied', `My applications (${counts.applied})`]].map(([key, label]) => <button type="button" key={key} onClick={() => setFilter(key)} style={{ border: filter === key ? 0 : `1px solid ${T.border}`, borderRadius: 999, padding: "8px 13px", background: filter === key ? T.accent : "#fff", color: filter === key ? "#fff" : T.inkMuted, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{label}</button>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 15 }}>
        {filtered.map((drive) => {
          const eligible = isEligibleForStudent(drive);
          const closed = isClosed(drive);
          const currentStatus = getStatus(drive);
          const meta = statusMeta[currentStatus];
          const StatusIcon = meta?.icon;
          return <article key={drive.id} style={{ display: "flex", flexDirection: "column", minWidth: 0, background: "#fff", border: `1px solid ${T.border}`, borderTop: `4px solid ${T.accent}`, borderRadius: 14, padding: 16, boxShadow: "0 8px 18px rgba(15,118,110,.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><div style={{ width: 36, height: 36, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: 9, background: T.accentSoft, color: T.accentDark }}><Building2 size={17} /></div><div style={{ minWidth: 0 }}><strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 15 }}>{drive.company}</strong><span style={{ display: "block", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.inkMuted, fontSize: 12.5 }}>{drive.role}</span></div></div>
            <div style={{ marginTop: 14, color: "#b77900", fontFamily: T.serif, fontSize: 19, fontWeight: 700 }}>{drive.package}</div>
            <div style={{ display: "grid", gap: 6, marginTop: 13, color: T.inkMuted, fontSize: 12 }}><span><Calendar size={12} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />Drive on {fmtDate(drive.driveDate)}</span><span><MapPin size={12} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />{drive.location || "Campus"}</span><span><Briefcase size={12} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />{(drive.branches || []).join(", ") || "All branches"} · CGPA {drive.minCgpa ?? "Any"}+</span></div>
            <div style={{ marginTop: 13 }}>{!eligible ? <span style={{ display: "inline-flex", borderRadius: 999, padding: "5px 9px", background: "#f1f5f9", color: "#94a3b8", fontSize: 11, fontWeight: 800 }}>Not eligible</span> : <span style={{ display: "inline-flex", borderRadius: 999, padding: "5px 9px", background: T.accentSoft, color: T.accentDark, fontSize: 11, fontWeight: 800 }}>Eligible</span>}</div>
            <div style={{ marginTop: "auto", paddingTop: 16 }}>{currentStatus === "not_applied" ? <button type="button" disabled={!eligible || closed} onClick={() => onApply(drive)} style={{ width: "100%", padding: "10px 8px", border: 0, borderRadius: 8, background: eligible && !closed ? T.accent : "#f1f5f9", color: eligible && !closed ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: 700, cursor: eligible && !closed ? "pointer" : "not-allowed" }}>{closed ? "Applications closed" : `Apply by ${fmtDate(drive.deadline)}`}</button> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 8px", borderRadius: 8, background: meta.background, color: meta.color, fontSize: 13, fontWeight: 700 }}>{StatusIcon && <StatusIcon size={14} />}{meta.label}</div>}</div>
          </article>;
        })}
        {filtered.length === 0 && <div style={{ gridColumn: "1 / -1", padding: "56px 16px", color: T.inkMuted, textAlign: "center", fontSize: 13 }}>No drives match your filters.</div>}
      </div>
    </div>
  );
}

function StudentNotificationsPage({ profile }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchNotifications() {
      if (!profile.roll) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/apply/notifications/${encodeURIComponent(profile.roll)}`);
        if (!response.ok) throw new Error('Could not load notifications');
        const data = await response.json();
        if (!cancelled) setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNotifications();
    const refreshTimer = window.setInterval(fetchNotifications, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [profile.roll]);

  async function dismissNotification(notificationId) {
    try {
      setDismissingId(notificationId);
      const response = await fetch(`${API_BASE}/api/apply/notifications/${encodeURIComponent(notificationId)}/${encodeURIComponent(profile.roll)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not dismiss notification');
      setNotifications((current) => current.filter((notification) => notification._id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    } finally {
      setDismissingId(null);
    }
  }

  return (
    <div style={{ padding: "24px 32px", color: T.ink }}>
      <h1 style={{ margin: 0, color: T.ink, fontFamily: T.serif, fontSize: 27 }}>Notifications</h1>
      <p style={{ margin: "6px 0 18px", color: T.inkMuted, fontSize: 13 }}>Placement announcements and application updates.</p>
      {loading && <p style={{ color: T.inkMuted, fontSize: 13 }}>Loading notifications...</p>}
      {!loading && notifications.length === 0 && <p style={{ color: T.inkMuted, fontSize: 13 }}>No notifications yet.</p>}
      {!loading && notifications.length > 0 && <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>{notifications.map((notification) => (
        <article key={notification._id} style={{ background: "#fff", border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.accent}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <strong style={{ display: "block", color: T.ink, fontSize: 14 }}>{notification.companyName || "Placement Office"}</strong>
            <button
              type="button"
              onClick={() => dismissNotification(notification._id)}
              disabled={dismissingId === notification._id}
              aria-label={`Dismiss notification from ${notification.companyName || 'Placement Office'}`}
              style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", background: "#fff", color: T.inkMuted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {dismissingId === notification._id ? "Dismissing..." : "Dismiss"}
            </button>
          </div>
          <span style={{ display: "block", marginTop: 4, color: T.inkMuted, fontSize: 12 }}>{notification.message}</span>
          <small style={{ display: "block", marginTop: 8, color: T.inkMuted, fontSize: 11 }}>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "Recent"}</small>
        </article>
      ))}</div>}
    </div>
  );
}

function PlacementDrivesPage({ drives, applications, appliedDriveIds, onApply, bookmarks, onToggleBookmark }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("deadline");
  const [expandedId, setExpandedId] = useState(null);
  const [reminders, setReminders] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [profileCompany, setProfileCompany] = useState(null);
  const [selectedDriveId, setSelectedDriveId] = useState(drives.find((drive) => drive.status === "Open")?.id || drives[0]?.id || null);

  function toggleReminder(id) {
    setReminders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleCompare(id) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  const filtered = useMemo(() => {
    let list = drives.filter((d) => {
      const matchesQuery = d.company.toLowerCase().includes(query.toLowerCase()) || d.role.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "All"
        || d.status === statusFilter
        || (statusFilter === "Upcoming" && d.status === "Open")
        || (statusFilter === "Ongoing" && d.status === "Closing soon");
      const matchesEligible = !eligibleOnly || isEligible(d, STUDENT);
      const matchesSaved = !savedOnly || bookmarks.has(d.id);
      return matchesQuery && matchesStatus && matchesEligible && matchesSaved;
    });
    list.sort((a, b) => {
      if (sortBy === "deadline") return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === "package") return parseFloat(b.package) - parseFloat(a.package);
      if (sortBy === "applicants") return b.applicants - a.applicants;
      return 0;
    });
    return list;
  }, [query, statusFilter, eligibleOnly, savedOnly, sortBy, bookmarks]);

  const stats = { total: drives.length, open: drives.filter((d) => d.status === "Open").length, eligible: drives.filter((d) => isEligible(d, STUDENT)).length, applied: appliedDriveIds.size };
  const compareDrives = drives.filter((d) => compareIds.includes(d.id));
  const selectedDrive = drives.find((drive) => drive.id === selectedDriveId) || filtered[0];
  const selectedApplications = applications.filter((application) => application.driveId === selectedDrive?.id);
  const selectedFunnel = {
    applied: selectedApplications.length,
    shortlisted: selectedApplications.filter((application) => ["Shortlisted", "Interview Scheduled", "Selected", "Offer"].includes(application.stage)).length,
    interview: selectedApplications.filter((application) => application.stage.includes("Interview") || application.history?.some((step) => step.stage.includes("Interview") && step.done)).length,
    selected: selectedApplications.filter((application) => ["Selected", "Offer"].includes(application.stage)).length,
    placed: selectedApplications.filter((application) => ["Placed", "Offer"].includes(application.stage)).length,
  };

  return (
    <div style={{ paddingBottom: compareIds.length ? 70 : 0 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "24px 32px 18px", borderBottom: `1px solid ${T.border}`, background: "linear-gradient(135deg, rgba(15,118,110,.04), rgba(255,255,255,.24))" }}>
        <div><h1 style={{ margin: 0, color: T.ink, fontFamily: T.serif, fontSize: 27 }}>Placement Drives</h1><p style={{ margin: "6px 0 0", color: T.inkMuted, fontSize: 13 }}>Track every drive from application to offer</p></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: "min(320px, 100%)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", background: "#fff" }}><Search size={15} color={T.inkSoft} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by company or role..." style={{ border: 0, outline: 0, width: "100%", minWidth: 0, color: T.ink, background: "transparent", fontSize: 13.5 }} /></div>
      </div>

      <div style={{ padding: "22px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 }}>
          {[[stats.total, "Total Drives"], [drives.filter((drive) => ["Open", "Upcoming"].includes(drive.status)).length, "Upcoming"], [drives.filter((drive) => drive.status === "Closing soon").length, "Ongoing"], [drives.reduce((sum, drive) => sum + (drive.applicants || 0), 0).toLocaleString(), "Total Applicants"]].map(([value, label], index) => <div key={label} style={{ background: "#fff", border: `1px solid ${T.border}`, borderTop: `4px solid ${index === 1 ? "#d9a640" : T.accent}`, borderRadius: 14, padding: "16px 18px", boxShadow: "0 10px 22px rgba(15,118,110,.04)" }}><div style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 9, background: index === 1 ? "#d9a640" : T.accent, color: "#fff", fontSize: 15, fontWeight: 800 }}><Briefcase size={16} /></div><strong style={{ display: "block", marginTop: 12, color: T.ink, fontFamily: T.serif, fontSize: 25 }}>{value}</strong><span style={{ display: "block", marginTop: 5, color: T.inkMuted, fontSize: 12.5 }}>{label}</span></div>)}
        </div>
        <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            {["All", "Upcoming", "Ongoing", "Closed"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            <option value="deadline">Sort: Deadline soonest</option>
            <option value="package">Sort: Highest package</option>
            <option value="applicants">Sort: Most applicants</option>
          </select>
          <button onClick={() => setEligibleOnly((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: `1px solid ${eligibleOnly ? T.accentDark : T.border}`, background: eligibleOnly ? "#eef7f4" : "#fff", color: eligibleOnly ? T.accentDark : T.inkMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <SlidersHorizontal size={13} /> Eligible only
          </button>
          <button onClick={() => setSavedOnly((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: `1px solid ${savedOnly ? T.accent : T.border}`, background: savedOnly ? T.accentSoft : "#fff", color: savedOnly ? T.accentDark : T.inkMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Star size={13} fill={savedOnly ? T.accentDark : "none"} /> Saved ({bookmarks.size})
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><strong style={{ color: T.ink, fontSize: 14 }}>{filtered.length} opportunities</strong><span style={{ color: T.inkMuted, fontSize: 12 }}>Select a drive to view details</span></div>
        <div style={{ display: "grid", gridTemplateColumns: selectedDrive ? "minmax(0, 1fr) minmax(min(320px, 100%), 1.3fr)" : "1fr", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && <EmptyState text="No drives match your filters. Try clearing search or filters." />}

          {filtered.map((d) => {
            const eligible = isEligible(d, STUDENT);
            const applied = appliedDriveIds.has(d.id);
            const expanded = expandedId === d.id;
            const statusStyle = DRIVE_STATUS_STYLE[d.status] || { bg: "#eee", fg: "#555" };
            const dLeft = daysUntil(d.deadline);
            const isOpenForApps = d.status === "Open" || d.status === "Upcoming" || d.status === "Closing soon";

            return (
              <div key={d.id} style={{ background: "#fff", border: `1px solid ${compareIds.includes(d.id) ? T.accentDark : T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(20,30,28,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", cursor: "pointer" }} onClick={() => { setSelectedDriveId(d.id); setExpandedId(expanded ? null : d.id); }}>
                  <Avatar text={initials(d.company)} name={d.company} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setProfileCompany(d.company); }}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 700, fontSize: 14.5, color: T.ink, textDecoration: "underline", textDecorationColor: T.border, textUnderlineOffset: 3 }}
                      >
                        {d.company}
                      </button>
                      <Pill bg={statusStyle.bg} fg={statusStyle.fg}>{d.status}</Pill>
                      {eligible ? <Pill bg="#e5f5f0" fg="#0c7d69"><CheckCircle2 size={11} /> Eligible</Pill> : <Pill bg="#fbeaea" fg="#a53737"><XCircle size={11} /> Not eligible</Pill>}
                      {applied && <Pill bg={T.accentSoft} fg={T.accentDark}>Applied</Pill>}
                    </div>
                    <div style={{ fontSize: 13, color: T.inkMuted, marginTop: 3 }}>{d.role} · {d.type} · {d.package}</div>
                  </div>

                  <div style={{ textAlign: "right", fontSize: 12.5, color: T.inkMuted, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}><Calendar size={12} /> {fmtDate(d.driveDate)}</div>
                    <div style={{ marginTop: 3, color: dLeft <= 3 && dLeft >= 0 ? "#a53737" : T.inkMuted, fontWeight: dLeft <= 3 && dLeft >= 0 ? 700 : 400 }}>
                      {d.status === "Closed" || d.status === "Results Declared" ? "Applications closed" : dLeft >= 0 ? `Closes ${fmtDateTime(d.deadline)} · ${dLeft}d left` : "Closing time passed"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <IconBtn icon={Star} active={bookmarks.has(d.id)} activeColor={T.accentDark} onClick={() => onToggleBookmark(d.id)} title="Save drive" />
                    {isOpenForApps && (
                      <IconBtn icon={BellRing} active={reminders.has(d.id)} activeColor={T.accentDark} onClick={() => toggleReminder(d.id)} title="Remind me before deadline" />
                    )}
                      <IconBtn icon={Scale} active={compareIds.includes(d.id)} activeColor={T.accentDark} onClick={() => toggleCompare(d.id)} title="Add to compare" />
                  </div>

                  {expanded ? <ChevronUp size={16} color={T.inkSoft} /> : <ChevronDown size={16} color={T.inkSoft} />}
                </div>

                {expanded && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px 18px", background: T.cream }}>
                    <p style={{ fontSize: 13.5, color: T.ink, margin: "0 0 14px", lineHeight: 1.6 }}>{d.description}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 14 }}>
                      <DetailItem icon={MapPin} label="Location" value={d.location} />
                      <DetailItem icon={GraduationCap} label="Min. CGPA" value={d.minCgpa.toFixed(1)} />
                      <DetailItem icon={Users} label="Applicants" value={d.applicants} />
                      <DetailItem icon={Building2} label="Branches" value={d.branches.join(", ")} />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Selection rounds</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {d.rounds.map((r, i) => (
                          <span key={r} style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 8, background: "#fff", border: `1px solid ${T.border}`, color: T.ink }}>{i + 1}. {r}</span>
                        ))}
                      </div>
                    </div>

                    {!eligible && (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#fbeaea", border: "1px solid #f3caca", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12.5, color: "#7a2b2b" }}>
                        <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span>{eligibilityReasons(d, STUDENT).join(" · ")}</span>
                      </div>
                    )}

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginBottom: 6, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        <StickyNote size={12} /> Your private notes
                      </div>
                      <textarea
                        value={notes[d.id] || ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        placeholder="e.g. Ask senior about interview pattern, prep DBMS before this one..."
                        rows={2}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        disabled={!eligible || applied || !isOpenForApps}
                        onClick={(e) => { e.stopPropagation(); onApply(d); }}
                        style={{ padding: "9px 18px", borderRadius: 8, border: "none", fontSize: 13.5, fontWeight: 700, cursor: !eligible || applied || !isOpenForApps ? "not-allowed" : "pointer", background: applied ? T.accentSoft : !eligible || !isOpenForApps ? "#eef3f3" : T.accentDark, color: applied ? T.accentDark : !eligible || !isOpenForApps ? T.inkSoft : "#fff" }}
                      >
                        {applied ? "Application submitted" : !isOpenForApps ? "Applications closed" : !eligible ? "Not eligible" : "Apply now"}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); downloadICS(d); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        <CalendarPlus size={14} /> Add to calendar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {selectedDrive && (
            <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderTop: `4px solid ${T.accent}`, borderRadius: 14, padding: "20px", boxShadow: "0 10px 24px rgba(15,118,110,.06)", position: "sticky", top: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, color: T.ink, fontFamily: T.serif, fontSize: 21 }}>{selectedDrive.company} - {selectedDrive.role}</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8, color: T.inkMuted, fontSize: 12 }}><span><Calendar size={12} style={{ display: "inline", marginRight: 4 }} />{fmtDate(selectedDrive.driveDate)}</span><span><MapPin size={12} style={{ display: "inline", marginRight: 4 }} />{selectedDrive.location || "Campus"}</span><span><Users size={12} style={{ display: "inline", marginRight: 4 }} />{(selectedDrive.branches || []).join(", ") || "All branches"}</span></div>
                </div>
                <Pill bg={(DRIVE_STATUS_STYLE[selectedDrive.status] || {}).bg || T.accentSoft} fg={(DRIVE_STATUS_STYLE[selectedDrive.status] || {}).fg || T.accentDark}>{selectedDrive.status}</Pill>
              </div>
              <div style={{ marginTop: 14, color: "#b77900", fontFamily: T.serif, fontSize: 20, fontWeight: 700 }}>{selectedDrive.package}</div>
              <div style={{ marginTop: 22 }}><div style={{ marginBottom: 10, color: T.inkMuted, fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Application funnel</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 9 }}>{[["Applications", selectedFunnel.applied || selectedDrive.applicants || 0], ["Shortlisted", selectedFunnel.shortlisted], ["Interview", selectedFunnel.interview], ["Selected", selectedFunnel.selected], ["Placed", selectedFunnel.placed]].map(([label, value], index) => <div key={label} style={{ background: T.cream, borderRadius: 10, padding: "11px 12px" }}><div style={{ color: T.inkMuted, fontSize: 11 }}>{label}</div><strong style={{ display: "block", marginTop: 4, color: T.ink, fontFamily: T.serif, fontSize: 20 }}>{value}</strong><span style={{ color: T.accentDark, fontSize: 10.5, fontWeight: 700 }}>{index === 0 ? "Base stage" : `${selectedFunnel.applied ? Math.round((value / selectedFunnel.applied) * 100) : 0}%`}</span></div>)}</div></div>
              <div style={{ marginTop: 22 }}><div style={{ marginBottom: 10, color: T.inkMuted, fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Selection rounds</div><div style={{ display: "grid", gap: 10 }}>{(selectedDrive.rounds || []).map((round, index) => <div key={round} style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: `2px solid ${T.border}`, borderRadius: "50%", color: T.accentDark, fontSize: 12, fontWeight: 800 }}>{index + 1}</span><div><strong style={{ display: "block", color: T.ink, fontSize: 13 }}>{round}</strong><span style={{ color: T.inkMuted, fontSize: 11 }}>{index === 0 ? "Upcoming" : "Pending"}</span></div></div>)}</div></div>
              <div style={{ display: "flex", gap: 9, marginTop: 22 }}><button type="button" disabled={appliedDriveIds.has(selectedDrive.id) || !isEligible(selectedDrive, STUDENT) || !["Open", "Upcoming", "Closing soon"].includes(selectedDrive.status)} onClick={() => onApply(selectedDrive)} style={{ flex: 1, border: 0, borderRadius: 8, padding: "10px 12px", background: appliedDriveIds.has(selectedDrive.id) ? T.accentSoft : T.accentDark, color: appliedDriveIds.has(selectedDrive.id) ? T.accentDark : "#fff", fontSize: 13, fontWeight: 700 }}>{appliedDriveIds.has(selectedDrive.id) ? "Application submitted" : "Apply now"}</button><button type="button" onClick={() => setExpandedId(selectedDrive.id)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", background: "#fff", color: T.ink, fontSize: 13, fontWeight: 700 }}>View details</button></div>
            </div>
          )}
        </div>
      </div>

      {compareIds.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 240, right: 0, background: "#fff", borderTop: `1px solid ${T.border}`, padding: "12px 32px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 -4px 14px rgba(20,30,28,0.06)", zIndex: 40 }}>
          <Scale size={16} color={T.accentDark} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{compareIds.length} drive{compareIds.length > 1 ? "s" : ""} selected to compare</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setCompareIds([])} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.inkMuted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Clear</button>
          <button
            disabled={compareIds.length < 2}
            onClick={() => setCompareOpen(true)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: compareIds.length < 2 ? "#efece3" : T.accentDark, color: compareIds.length < 2 ? T.inkSoft : "#fff", fontSize: 12.5, fontWeight: 700, cursor: compareIds.length < 2 ? "not-allowed" : "pointer" }}
          >
            Compare
          </button>
        </div>
      )}

      {compareOpen && <CompareModal drives={compareDrives} onRemove={(id) => setCompareIds((p) => p.filter((x) => x !== id))} onClose={() => setCompareOpen(false)} />}
      {profileCompany && <CompanyProfileModal company={profileCompany} onClose={() => setProfileCompany(null)} />}
    </div>
  );
}

/* =========================================================================
   PLACEMENT DRIVE HISTORY PAGE
   ========================================================================= */
const MOCK_STUDENT_HISTORY = [
  { id: "mock-amazon", company: "Amazon", role: "SDE-1", package: "₹28.0 LPA", appliedDate: "2026-08-14", stage: "Offer", history: [{ stage: "Applied", done: true }, { stage: "Shortlisted", done: true }, { stage: "Technical Interview", done: true }, { stage: "Offer", done: true }] },
  { id: "mock-zoho", company: "Zoho", role: "Member of Technical Staff", package: "₹12.0 LPA", appliedDate: "2026-08-02", stage: "Interview Scheduled", history: [{ stage: "Applied", done: true }, { stage: "Shortlisted", done: true }, { stage: "Technical Interview", done: true }, { stage: "Final HR Round", done: false }] },
  { id: "mock-wipro", company: "Wipro", role: "Project Engineer", package: "₹5.8 LPA", appliedDate: "2026-07-20", stage: "Rejected", history: [{ stage: "Applied", done: true }, { stage: "Online Assessment", done: true }, { stage: "Technical Interview", done: false }] },
  { id: "mock-tcs", company: "TCS Digital", role: "Software Engineer", package: "₹9.0 LPA", appliedDate: "2026-07-05", stage: "Rejected", history: [{ stage: "Applied", done: true }, { stage: "Aptitude Test", done: true }, { stage: "Coding Round", done: false }] },
  { id: "mock-infosys", company: "Infosys", role: "Systems Engineer", package: "₹6.5 LPA", appliedDate: "2026-06-18", stage: "Withdrawn", history: [{ stage: "Applied", done: true }, { stage: "Technical Interview", done: false }] },
];

function StudentDriveHistoryCards({ applications }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const historySource = applications.length > 0 ? applications : MOCK_STUDENT_HISTORY;
  const history = useMemo(() => historySource.map((application) => {
    const outcome = application.stage === "Withdrawn"
      ? "withdrawn"
      : ["Offer", "Selected", "Placed"].includes(application.stage)
        ? "offered"
        : application.stage === "Rejected"
          ? "rejected"
          : "in_progress";
    const rounds = (application.history?.length ? application.history : [{ stage: "Application submitted", done: true }]).map((step) => ({
      name: step.stage,
      cleared: step.done === true ? true : application.stage === "Rejected" && step.stage === application.history?.at(-1)?.stage ? false : null,
    }));
    return { ...application, outcome, rounds };
  }), [historySource]);
  const filtered = useMemo(() => history.filter((item) => `${item.company} ${item.role}`.toLowerCase().includes(query.toLowerCase())).filter((item) => filter === "all" || item.outcome === filter), [history, query, filter]);
  const offers = history.filter((item) => item.outcome === "offered").length;
  const stats = [[history.length, "Drives Participated", Building2, false], [offers, "Offers Received", Trophy, true], [history.length ? `${Math.round((offers / history.length) * 100)}%` : "0%", "Success Rate", TrendingUp, false]];
  const outcomeMeta = {
    offered: { label: "Offer received", background: T.accentSoft, color: T.accentDark, icon: Trophy },
    in_progress: { label: "In progress", background: "#eff6ff", color: "#1d4ed8", icon: Circle },
    rejected: { label: "Not selected", background: "#fff1f2", color: "#e11d48", icon: XCircle },
    withdrawn: { label: "Withdrawn", background: "#f1f5f9", color: "#64748b", icon: Circle },
  };

  return <div style={{ minHeight: "100%", background: "#f0fbfa", padding: "20px 28px 46px", color: T.ink }}>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 18 }}><div><h1 style={{ margin: 0, fontFamily: T.serif, fontSize: 25 }}>Drive History</h1><p style={{ margin: "5px 0 0", color: T.inkMuted, fontSize: 13 }}>Every drive you've participated in this season</p></div><div style={{ display: "flex", alignItems: "center", gap: 7, width: "min(300px, 100%)", padding: "8px 11px", border: `1px solid ${T.border}`, borderRadius: 8, background: "#fff" }}><Search size={14} color={T.inkMuted} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies or roles..." style={{ width: "100%", minWidth: 0, border: 0, outline: 0, background: "transparent", color: T.ink, fontSize: 13 }} /></div></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>{stats.map(([value, label, Icon, gold]) => <article key={label} style={{ background: "#fff", border: `1px solid ${T.border}`, borderTop: `4px solid ${gold ? "#d9a640" : T.accent}`, borderRadius: 14, padding: "14px 16px", boxShadow: "0 8px 18px rgba(15,118,110,.04)" }}><div style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, background: gold ? "#d9a640" : T.accent, color: "#fff" }}><Icon size={15} /></div><strong style={{ display: "block", marginTop: 10, fontFamily: T.serif, fontSize: 23 }}>{value}</strong><span style={{ display: "block", marginTop: 4, color: T.inkMuted, fontSize: 12 }}>{label}</span></article>)}</div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>{["all", "offered", "in_progress", "rejected", "withdrawn"].map((key) => <button type="button" key={key} onClick={() => setFilter(key)} style={{ border: filter === key ? 0 : `1px solid ${T.border}`, borderRadius: 999, padding: "8px 13px", background: filter === key ? T.accent : "#fff", color: filter === key ? "#fff" : T.inkMuted, fontSize: 12.5, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{key.replace("_", " ")}</button>)}</div>
    <div style={{ display: "grid", gap: 12 }}>{filtered.map((item) => { const meta = outcomeMeta[item.outcome]; const Icon = meta.icon; return <article key={item.id} style={{ background: "#fff", border: `1px solid ${T.border}`, borderTop: `4px solid ${T.accent}`, borderRadius: 14, padding: 16, boxShadow: "0 8px 18px rgba(15,118,110,.04)" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 9, background: T.accentSoft, color: T.accentDark }}><Building2 size={17} /></div><div><strong style={{ display: "block", fontSize: 15 }}>{item.company} - {item.role}</strong><span style={{ display: "block", marginTop: 4, color: T.inkMuted, fontSize: 12 }}><Calendar size={12} style={{ display: "inline", marginRight: 5, verticalAlign: "-2px" }} />{fmtDate(item.appliedDate)} · {item.package}</span></div></div><span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 10px", background: meta.background, color: meta.color, fontSize: 12, fontWeight: 800 }}><Icon size={13} />{meta.label}</span></div><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>{item.rounds.map((round, index) => <span key={`${round.name}-${index}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 8, padding: "6px 9px", background: round.cleared === true ? T.accentSoft : round.cleared === false ? "#fff1f2" : "#f1f5f9", color: round.cleared === true ? T.accentDark : round.cleared === false ? "#e11d48" : "#94a3b8", fontSize: 11.5, fontWeight: 600 }}>{round.cleared === true ? <CheckCircle2 size={12} /> : round.cleared === false ? <XCircle size={12} /> : <Circle size={12} />}{round.name}</span>)}</div></article>; })}{filtered.length === 0 && <div style={{ padding: "56px 16px", color: T.inkMuted, textAlign: "center", fontSize: 13 }}>No drives match your filters.</div>}</div>
  </div>;
}

function PlacementDriveHistoryPage() {
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [participationFilter, setParticipationFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [expandedId, setExpandedId] = useState(null);
  const [profileCompany, setProfileCompany] = useState(null);

  const years = useMemo(() => ["All", ...Array.from(new Set(DRIVE_HISTORY.map((h) => h.year))).sort((a, b) => b - a)], []);
  const outcomes = ["All", "Selected", "Not selected", "In progress", "Did not apply", "Not eligible"];

  const filtered = useMemo(() => {
    let list = DRIVE_HISTORY.filter((h) => {
      const matchesQuery = h.company.toLowerCase().includes(query.toLowerCase()) || h.role.toLowerCase().includes(query.toLowerCase());
      const matchesYear = yearFilter === "All" || h.year === Number(yearFilter);
      const matchesOutcome = outcomeFilter === "All" || h.outcome === outcomeFilter;
      const matchesParticipation = participationFilter === "All" || (participationFilter === "Participated" && h.participated) || (participationFilter === "Not participated" && !h.participated);
      return matchesQuery && matchesYear && matchesOutcome && matchesParticipation;
    });
    list.sort((a, b) => {
      if (sortBy === "recent") return new Date(b.driveDate) - new Date(a.driveDate);
      if (sortBy === "oldest") return new Date(a.driveDate) - new Date(b.driveDate);
      if (sortBy === "package") return parseFloat(b.package) - parseFloat(a.package);
      return 0;
    });
    return list;
  }, [query, yearFilter, outcomeFilter, participationFilter, sortBy]);

  const stats = {
    total: DRIVE_HISTORY.length,
    participated: DRIVE_HISTORY.filter((h) => h.participated).length,
    selected: DRIVE_HISTORY.filter((h) => h.outcome === "Selected").length,
    successRate: (() => {
      const p = DRIVE_HISTORY.filter((h) => h.participated).length;
      const s = DRIVE_HISTORY.filter((h) => h.outcome === "Selected").length;
      return p ? Math.round((s / p) * 100) : 0;
    })(),
  };

  return (
    <div>
      <PageHeader eyebrow="Past drives" title="Placement drive history" />

      <div style={{ padding: "22px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(260px, .9fr)", gap: 14, marginBottom: 18 }}>
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 18, padding: "20px 22px", boxShadow: "0 12px 26px rgba(15,118,110,.05)" }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: T.accentDark, fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}><Clock size={14} /> Your placement journey</div><h2 style={{ margin: "10px 0 6px", color: T.ink, fontSize: 23 }}>Learn from every drive</h2><p style={{ margin: 0, color: T.inkMuted, fontSize: 13, lineHeight: 1.5 }}>Review what worked, compare outcomes, and use past hiring patterns to prepare for the next opportunity.</p><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 9, marginTop: 18 }}>{[[stats.total, "Concluded"], [stats.participated, "Participated"], [stats.selected, "Offers"], [`${stats.successRate}%`, "Success rate"]].map(([value, label]) => <div key={label} style={{ background: T.cream, borderRadius: 10, padding: "10px 8px" }}><strong style={{ display: "block", color: T.accentDark, fontSize: 18 }}>{value}</strong><span style={{ color: T.inkMuted, fontSize: 10.5 }}>{label}</span></div>)}</div></div>
          <div style={{ background: `linear-gradient(135deg, ${T.accentDark}, ${T.accent})`, borderRadius: 18, padding: "20px 22px", color: "#fff" }}><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", opacity: .8 }}>Outcome snapshot</div><div style={{ display: "grid", gap: 11, marginTop: 16 }}>{[["Selected", stats.selected, T.accentSoft], ["In progress", DRIVE_HISTORY.filter((h) => h.outcome === "In progress").length, "#b9f2e9"], ["Not selected", DRIVE_HISTORY.filter((h) => h.outcome === "Not selected").length, "#f7cbd1"]].map(([label, value, color]) => <div key={label}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 5 }}><span>{label}</span><strong>{value}</strong></div><div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.18)" }}><div style={{ width: `${stats.total ? Math.max(8, (value / stats.total) * 100) : 0}%`, height: "100%", borderRadius: 999, background: color }} /></div></div>)}</div></div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", flex: "1 1 220px", background: "#fff" }}>
            <Search size={15} color={T.inkSoft} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by company or role" style={{ border: "none", outline: "none", fontSize: 13.5, width: "100%", color: T.ink, background: "transparent" }} />
          </div>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={selectStyle}>
            {years.map((y) => <option key={y} value={y}>{y === "All" ? "All years" : y}</option>)}
          </select>
          <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)} style={selectStyle}>
            {outcomes.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select value={participationFilter} onChange={(e) => setParticipationFilter(e.target.value)} style={selectStyle}>
            {["All", "Participated", "Not participated"].map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            <option value="recent">Sort: Most recent</option>
            <option value="oldest">Sort: Oldest first</option>
            <option value="package">Sort: Highest package</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><strong style={{ color: T.ink, fontSize: 14 }}>{filtered.length} past drives</strong><span style={{ color: T.inkMuted, fontSize: 12 }}>Expand a record to see round details</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && <EmptyState text="No past drives match your filters." />}

          {filtered.map((h) => {
            const expanded = expandedId === h.id;
            const outcomeStyle = OUTCOME_STYLE[h.outcome] || { bg: "#eee", fg: "#555" };

            return (
              <div key={h.id} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(20,30,28,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : h.id)}>
                  <Avatar text={initials(h.company)} name={h.company} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={(e) => { e.stopPropagation(); setProfileCompany(h.company); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 700, fontSize: 14.5, color: T.ink, textDecoration: "underline", textDecorationColor: T.border, textUnderlineOffset: 3 }}>
                        {h.company}
                      </button>
                      <Pill bg={outcomeStyle.bg} fg={outcomeStyle.fg}>{h.outcome}</Pill>
                      {!h.participated && <Pill bg="#f0efe9" fg="#726f68">Not participated</Pill>}
                    </div>
                    <div style={{ fontSize: 13, color: T.inkMuted, marginTop: 3 }}>{h.role} · {h.type} · {h.package}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12.5, color: T.inkMuted, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}><Calendar size={12} /> {fmtDate(h.driveDate)}</div>
                    <div style={{ marginTop: 3 }}>{h.totalSelected} selected of {h.totalApplicants}</div>
                  </div>
                  {expanded ? <ChevronUp size={16} color={T.inkSoft} /> : <ChevronDown size={16} color={T.inkSoft} />}
                </div>

                {expanded && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px 18px", background: T.cream }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 14 }}>
                      <DetailItem icon={Building2} label="Branches invited" value={h.branches.join(", ")} />
                      <DetailItem icon={Users} label="Total applicants" value={h.totalApplicants} />
                      <DetailItem icon={CheckCircle2} label="Total selected" value={h.totalSelected} />
                      <DetailItem icon={GraduationCap} label="Your rounds cleared" value={h.participated ? `${h.roundsCleared} of ${h.totalRounds}` : "—"} />
                    </div>

                    {h.participated && (
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                        {Array.from({ length: h.totalRounds }).map((_, i) => (
                          <React.Fragment key={i}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: i < h.roundsCleared ? T.accentDark : "#fff", border: `2px solid ${i < h.roundsCleared ? T.accentDark : T.border}` }}>
                              {i < h.roundsCleared && <CheckCircle2 size={12} color="#fff" />}
                            </div>
                            {i < h.totalRounds - 1 && <div style={{ flex: 1, height: 2, background: i < h.roundsCleared - 1 ? T.accentDark : T.border }} />}
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {h.participated && h.rounds && h.rounds.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Round-by-round result</div>
                        <RoundStatusList rounds={deriveRoundStatuses(h)} />
                      </div>
                    )}

                    {!h.participated && (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#f0efe9", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12.5, color: T.inkMuted }}>
                        <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span>You didn't attend this drive — {h.outcome === "Not eligible" ? "you weren't eligible for it." : "no application was submitted."}</span>
                      </div>
                    )}

                    {h.outcome === "Selected" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, background: "#e5f5f0", border: "1px solid #b9e3d4", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#0c7d69", fontWeight: 600 }}>
                        <CheckCircle2 size={15} /> Offer accepted — {h.offerPackage}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {profileCompany && <CompanyProfileModal company={profileCompany} onClose={() => setProfileCompany(null)} />}
    </div>
  );
}

/* =========================================================================
   MY APPLICATIONS PAGE
   ========================================================================= */
function MyApplicationsPage({ applications, onWithdraw, onBulkWithdraw, onUpdateApplication, onNavigate }) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [expandedId, setExpandedId] = useState(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState(null);
  const [confirmBulkWithdraw, setConfirmBulkWithdraw] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [profileCompany, setProfileCompany] = useState(null);

  const STAGES = ["All", "Applied", "Shortlisted", "Interview Scheduled", "Offer", "Rejected", "Withdrawn"];

  const filtered = useMemo(() => {
    let list = applications.filter((a) => {
      const matchesQuery = a.company.toLowerCase().includes(query.toLowerCase()) || a.role.toLowerCase().includes(query.toLowerCase());
      const matchesStage = stageFilter === "All" || a.stage === stageFilter;
      return matchesQuery && matchesStage;
    });
    list.sort((a, b) => {
      if (sortBy === "recent") return new Date(b.appliedDate) - new Date(a.appliedDate);
      if (sortBy === "oldest") return new Date(a.appliedDate) - new Date(b.appliedDate);
      if (sortBy === "package") return parseFloat(b.package) - parseFloat(a.package);
      return 0;
    });
    return list;
  }, [applications, query, stageFilter, sortBy]);

  const stats = {
    total: applications.length,
    inProgress: applications.filter((a) => !["Offer", "Rejected", "Withdrawn"].includes(a.stage)).length,
    offers: applications.filter((a) => a.stage === "Offer").length,
    rejected: applications.filter((a) => a.stage === "Rejected").length,
  };
  const nextAction = applications.find((app) => app.stage.includes("Interview") || app.stage === "Shortlisted") || applications.find((app) => !["Rejected", "Withdrawn", "Offer"].includes(app.stage));
  const confirmTarget = applications.find((a) => a.id === confirmWithdrawId);
  const withdrawableSelected = filtered.filter((a) => selectedIds.has(a.id) && !["Rejected", "Withdrawn", "Offer"].includes(a.stage));
  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (allFilteredSelected) return new Set();
      return new Set(filtered.map((a) => a.id));
    });
  }
  function exportRows(list) {
    downloadCSV(
      "my_applications.csv",
      list.map((a) => ({
        Company: a.company, Role: a.role, Package: a.package, "Applied on": a.appliedDate,
        Stage: a.stage, "Last update": a.stageDate, "Personal note": a.personalNote || "",
      }))
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your progress"
        title="My applications"
        compact
        right={
          <button onClick={() => exportRows(filtered)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} /> Export CSV
          </button>
        }
      />

      <div style={{ padding: "14px 32px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: nextAction ? "minmax(0, 1.35fr) minmax(280px, .85fr)" : "minmax(0, 1fr)", gap: 14, marginBottom: 18 }}>
          {stats.total > 0 && <div style={{ background: `linear-gradient(135deg, ${T.accentDark}, ${T.accent})`, borderRadius: 18, padding: "21px 23px", color: "#fff" }}><div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", opacity: .82 }}><TrendingUp size={14} /> Application command centre</div><h2 style={{ margin: "10px 0 6px", fontSize: 23 }}>Keep every opportunity moving.</h2><p style={{ margin: 0, color: "rgba(255,255,255,.78)", fontSize: 13, lineHeight: 1.5 }}>Review updates, keep documents ready, and take the next action on your strongest applications.</p><div style={{ display: "flex", gap: 25, marginTop: 19, flexWrap: "wrap" }}>{[[stats.total, "Total"], [stats.inProgress, "In progress"], [stats.offers, "Offers"], [stats.rejected, "Closed"]].map(([value, label]) => <div key={label}><strong style={{ display: "block", fontSize: 22 }}>{value}</strong><span style={{ color: "rgba(255,255,255,.72)", fontSize: 11 }}>{label}</span></div>)}</div></div>}
          {nextAction && <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 18, padding: "20px", boxShadow: "0 12px 26px rgba(15,118,110,.05)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: T.accentDark, fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>Next action</span><Clock size={17} color={T.accentDark} /></div><strong style={{ display: "block", color: T.ink, fontSize: 16, marginTop: 14 }}>{nextAction.company}</strong><span style={{ display: "block", color: T.inkMuted, fontSize: 12, marginTop: 4 }}>{nextAction.role}</span><Pill bg={T.accentSoft} fg={T.accentDark} style={{ marginTop: 14 }}>{nextAction.stage}</Pill><div style={{ color: T.inkMuted, fontSize: 11.5, marginTop: 12 }}>Last updated {fmtDate(nextAction.stageDate)}</div></div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>{[["Applied", applications.filter((a) => a.stage === "Applied").length], ["Shortlisted", applications.filter((a) => a.stage === "Shortlisted").length], ["Interview", applications.filter((a) => a.stage.includes("Interview")).length], ["Offer", stats.offers]].map(([label, value]) => <div key={label} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}><div style={{ color: T.inkMuted, fontSize: 11 }}>{label}</div><strong style={{ display: "block", color: T.accentDark, fontSize: 21, marginTop: 4 }}>{value}</strong></div>)}</div>

        <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", flex: "1 1 220px", background: "#fff" }}>
            <Search size={15} color={T.inkSoft} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by company or role" style={{ border: "none", outline: "none", fontSize: 13.5, width: "100%", color: T.ink, background: "transparent" }} />
          </div>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={selectStyle}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            <option value="recent">Sort: Most recent</option>
            <option value="oldest">Sort: Oldest first</option>
            <option value="package">Sort: Highest package</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <strong style={{ color: T.ink, fontSize: 14 }}>{filtered.length} applications</strong>
          <span style={{ color: T.inkMuted, fontSize: 12 }}>Select rows to export or withdraw</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <button onClick={toggleSelectAll} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: T.inkMuted, fontWeight: 600, padding: 0 }}>
            {allFilteredSelected ? <CheckSquare size={15} color={T.accentDark} /> : <Square size={15} color={T.inkSoft} />}
            Select all ({filtered.length})
          </button>
          {selectedIds.size > 0 && (
            <>
              <span style={{ fontSize: 12.5, color: T.inkMuted }}>· {selectedIds.size} selected</span>
              <button onClick={() => exportRows(applications.filter((a) => selectedIds.has(a.id)))} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "#fff", color: T.ink, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Download size={12} /> Export selected
              </button>
              {withdrawableSelected.length > 0 && (
                <button onClick={() => setConfirmBulkWithdraw(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: "1px solid #e3b8b8", background: "#fff", color: "#a53737", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <Undo2 size={12} /> Withdraw selected ({withdrawableSelected.length})
                </button>
              )}
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && applications.length === 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap", padding: "22px 24px", border: `1px dashed ${T.border}`, borderRadius: 14, background: "linear-gradient(135deg, #ffffff 0%, #f2fbfa 100%)" }}>
              <div>
                <strong style={{ display: "block", color: T.ink, fontSize: 15 }}>Your application pipeline is empty</strong>
                <span style={{ display: "block", marginTop: 5, color: T.inkMuted, fontSize: 12.5 }}>Explore open placement drives and apply to start tracking your progress here.</span>
              </div>
              <button type="button" onClick={() => onNavigate("drives")} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 8, padding: "10px 14px", background: T.accentDark, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                <Briefcase size={14} /> Browse drives
              </button>
            </div>
          )}
          {filtered.length === 0 && applications.length > 0 && <EmptyState text="No applications match your filters yet." />}

          {filtered.map((a) => {
            const expanded = expandedId === a.id;
            const stageStyle = APP_STAGE_STYLE[a.stage] || { bg: "#eee", fg: "#555" };
            const canWithdraw = !["Rejected", "Withdrawn", "Offer"].includes(a.stage);
            const docsUploaded = DOC_ITEMS.filter((d) => a.documents[d.key]).length;

            return (
              <div key={a.id} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(20,30,28,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : a.id)}>
                  <button onClick={(e) => { e.stopPropagation(); toggleSelect(a.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                    {selectedIds.has(a.id) ? <CheckSquare size={17} color={T.accentDark} /> : <Square size={17} color={T.inkSoft} />}
                  </button>
                  <Avatar text={initials(a.company)} name={a.company} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={(e) => { e.stopPropagation(); setProfileCompany(a.company); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 700, fontSize: 14.5, color: T.ink, textDecoration: "underline", textDecorationColor: T.border, textUnderlineOffset: 3 }}>
                        {a.company}
                      </button>
                      <Pill bg={stageStyle.bg} fg={stageStyle.fg}>{a.stage}</Pill>
                      <Pill bg="#f4f2ea" fg={docsUploaded === DOC_ITEMS.length ? T.accentDark : T.inkMuted}>
                        <Paperclip size={10} /> {docsUploaded}/{DOC_ITEMS.length} docs
                      </Pill>
                    </div>
                    <div style={{ fontSize: 13, color: T.inkMuted, marginTop: 3 }}>{a.role} · {a.package}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12.5, color: T.inkMuted, flexShrink: 0 }}>
                    <div>Applied {fmtDate(a.appliedDate)}</div>
                    <div style={{ marginTop: 3 }}>Updated {fmtDate(a.stageDate)}</div>
                  </div>
                  {expanded ? <ChevronUp size={16} color={T.inkSoft} /> : <ChevronDown size={16} color={T.inkSoft} />}
                </div>

                {expanded && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: "18px", background: T.cream }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 18, fontSize: 12.5, color: T.ink }}>
                      <AlertCircle size={14} color={T.accentDark} style={{ marginTop: 1, flexShrink: 0 }} />
                      {a.note}
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>Application timeline</div>
                    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 20 }}>
                      {a.history.map((h, i) => (
                        <React.Fragment key={h.stage}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 120, flexShrink: 0 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: h.done ? (a.stage === "Rejected" && i === a.history.length - 1 ? "#a53737" : T.accentDark) : "#fff", border: `2px solid ${h.done ? (a.stage === "Rejected" && i === a.history.length - 1 ? "#a53737" : T.accentDark) : T.border}` }}>
                              {h.done && <CheckCircle2 size={13} color="#fff" />}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: h.done ? T.ink : T.inkSoft, marginTop: 8, textAlign: "center" }}>{h.stage}</div>
                            <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 2 }}>{fmtDate(h.date)}</div>
                          </div>
                          {i < a.history.length - 1 && <div style={{ flex: 1, height: 2, background: h.done ? T.accentDark : T.border, marginTop: 11 }} />}
                        </React.Fragment>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginBottom: 18 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginBottom: 8, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          <FileText size={12} /> Document checklist
                        </div>
                        <DocumentChecklist
                          documents={a.documents}
                          onUpload={(key, file) => onUpdateApplication(a.id, { documents: { ...a.documents, [key]: file.name } })}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginBottom: 8, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          <StickyNote size={12} /> Personal notes
                        </div>
                        <textarea
                          value={a.personalNote}
                          onChange={(e) => onUpdateApplication(a.id, { personalNote: e.target.value })}
                          placeholder="Prep reminders, referral contact, salary discussion notes..."
                          rows={3}
                          style={{ ...inputStyle, marginBottom: 14 }}
                        />

                        <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Interview feedback</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <StarRating value={a.feedback.rating} onChange={(n) => onUpdateApplication(a.id, { feedback: { ...a.feedback, rating: n } })} />
                          <span style={{ fontSize: 11.5, color: T.inkMuted }}>{a.feedback.rating > 0 ? `${a.feedback.rating}/5` : "Not rated"}</span>
                        </div>
                        <textarea
                          value={a.feedback.text}
                          onChange={(e) => onUpdateApplication(a.id, { feedback: { ...a.feedback, text: e.target.value } })}
                          placeholder="How did the interview go? Round difficulty, questions asked..."
                          rows={2}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      {canWithdraw && (
                        <button onClick={(e) => { e.stopPropagation(); setConfirmWithdrawId(a.id); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #e3b8b8", background: "#fff", color: "#a53737", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          <Undo2 size={13} /> Withdraw application
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {confirmTarget && (
        <ConfirmModal
          title="Withdraw application?"
          body={`You're about to withdraw your application to ${confirmTarget.company} for ${confirmTarget.role}. This can't be undone.`}
          confirmLabel="Withdraw"
          onCancel={() => setConfirmWithdrawId(null)}
          onConfirm={() => { onWithdraw(confirmTarget.id); setConfirmWithdrawId(null); }}
        />
      )}

      {confirmBulkWithdraw && (
        <ConfirmModal
          title={`Withdraw ${withdrawableSelected.length} applications?`}
          body="Every selected application that's still in progress will be marked withdrawn. This can't be undone."
          confirmLabel="Withdraw all"
          onCancel={() => setConfirmBulkWithdraw(false)}
          onConfirm={() => { onBulkWithdraw(withdrawableSelected.map((a) => a.id)); setSelectedIds(new Set()); setConfirmBulkWithdraw(false); }}
        />
      )}

      {profileCompany && <CompanyProfileModal company={profileCompany} onClose={() => setProfileCompany(null)} />}
    </div>
  );
}

/* =========================================================================
   MY PROFILE PAGE
   ========================================================================= */
const PERSONAL_FIELDS = [
  { key: "name", label: "Full name", icon: Users },
  { key: "roll", label: "Roll number", icon: IdCard },
  { key: "branch", label: "Branch", icon: Building2, options: ["CSE", "IT", "ECE", "MECH"] },
  { key: "email", label: "Email", icon: Mail, type: "email" },
  { key: "phone", label: "Phone", icon: Phone, type: "tel" },
  { key: "address", label: "Address", icon: MapPin },
];
const ACADEMIC_FIELDS = [
  { key: "cgpa", label: "Current CGPA", icon: GraduationCap, type: "number" },
  { key: "tenth", label: "10th percentage", icon: Award, type: "number" },
  { key: "twelfth", label: "12th percentage", icon: Award, type: "number" },
  { key: "graduationMarks", label: "Graduation percentage", icon: Award, type: "number" },
  { key: "backlogs", label: "Active backlogs", icon: AlertCircle, type: "number" },
];
const LINK_FIELDS = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "github", label: "GitHub", icon: Github },
  { key: "portfolio", label: "Portfolio / website", icon: Link2 },
];
const PROFILE_REQUIRED_KEYS = ["name", "roll", "branch", "email", "phone", "address", "skills"];

function profileCompletion(p) {
  const total = PROFILE_REQUIRED_KEYS.length + 1 + PROFILE_DOC_ITEMS.length;
  let filled = PROFILE_REQUIRED_KEYS.filter((k) => p[k] && String(p[k]).trim()).length;
  if (p.resume) filled += 1;
  filled += PROFILE_DOC_ITEMS.filter((d) => p.documents[d.key]).length;
  return Math.round((filled / total) * 100);
}

function ProfileField({ icon: Icon, label, value, editing, onChange, type = "text", options }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.inkMuted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        <Icon size={13} /> {label}
      </div>
      {editing ? (
        options ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
        )
      ) : (
        <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, minHeight: 22 }}>{value || value === 0 ? value : "—"}</div>
      )}
    </div>
  );
}

function MyProfilePage({ profile, onUpdateProfile }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  function startEdit() {
    setDraft(profile);
    setEditing(true);
  }
  function requestCancel() {
    setConfirmCancel(true);
  }
  function confirmCancelEdit() {
    setDraft(profile);
    setEditing(false);
    setConfirmCancel(false);
  }
  function saveChanges() {
    onUpdateProfile(draft, "Profile updated");
    setEditing(false);
  }
  function updateDraft(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }
  async function handleResumeUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("documentType", "resume");
    uploadData.append("rollNumber", profile.roll);
    uploadData.append("document", file);

    try {
      const uploadResponse = await fetch(`${API_BASE}/api/student/upload-document`, {
        method: "POST",
        body: uploadData,
      });
      const uploaded = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploaded.message || "Resume upload failed");

      const patch = {
        resume: uploaded.filePath || file.name,
      };

      onUpdateProfile(patch, "Resume uploaded");
      setDraft((current) => ({ ...current, ...patch }));
    } catch (error) {
      console.error(error);
      onUpdateProfile({ resume: file.name }, error.message || "Resume uploaded, but autofill failed");
      setDraft((current) => ({ ...current, resume: file.name }));
    } finally {
      e.target.value = "";
    }
  }
  async function handleDocUpload(key, file) {
    const uploadType = key === "photo" ? "profilePhoto" : key === "idProof" ? "idProof" : key;
    const uploadData = new FormData();
    uploadData.append("documentType", uploadType);
    uploadData.append("rollNumber", profile.roll);
    uploadData.append("document", file);

    try {
      const response = await fetch(`${API_BASE}/api/student/upload-document`, { method: "POST", body: uploadData });
      const uploaded = await response.json();
      if (!response.ok) throw new Error(uploaded.message || "Document upload failed");
      const nextDocs = { ...profile.documents, [key]: file.name };
      const documentPaths = { ...(profile.documentPaths || {}), [key]: uploaded.filePath };
      const patch = { documents: nextDocs, documentPaths };
      if (key === "twelfthMarksheet") patch.marksheet = uploaded.filePath;
      if (key === "tenthMarksheet") patch.tenthMarksheet = uploaded.filePath;
      if (key === "semesterMarksheets") patch.semesterMarksheets = uploaded.filePath;
      onUpdateProfile(patch, `${key === "twelfthMarksheet" ? "12th marksheet" : key === "tenthMarksheet" ? "10th marksheet" : key === "semesterMarksheets" ? "Semester marksheet" : "Document"} uploaded`);
      if (editing) setDraft((prev) => ({ ...prev, ...patch }));
    } catch (error) {
      onUpdateProfile({ documents: { ...profile.documents, [key]: file.name } }, error.message || "Document upload failed");
    }
  }

  async function submitForVerification() {
    if (!profile.roll?.trim()) {
      setVerificationError("Add your roll number to the profile before submitting for verification.");
      return;
    }

    setVerificationError("");
    setSubmittingVerification(true);
    const documents = Object.fromEntries(
      Object.entries(profile.documentPaths || {}).map(([key, filePath]) => [
        key,
        { filePath, fileName: profile.documents?.[key] || filePath.split(/[\\/]/).pop() },
      ])
    );

    try {
      const response = await fetch(`${API_BASE}/api/student/profile-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNumber: profile.roll,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          branch: profile.branch,
          skills: profile.skills,
          certifications: profile.certifications,
          projects: profile.projects,
          linkedin: profile.linkedin,
          github: profile.github,
          portfolio: profile.portfolio,
          profilePhoto: profile.profilePhoto,
          cgpa: profile.cgpa,
          tenthPercentage: profile.tenth,
          twelfthPercentage: profile.twelfth,
          graduationYear: profile.graduationYear,
          backlogs: profile.backlogs,
          graduationMarks: profile.graduationMarks,
          documents,
          submittedAt: new Date().toISOString(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Profile could not be submitted for verification");
      onUpdateProfile({}, "Profile submitted for verification");
      setVerificationError("");
    } catch (error) {
      console.error("Profile verification submission failed:", error);
      setVerificationError(error.message || "Could not reach the placement server. Start the backend and try again.");
      onUpdateProfile({}, error.message || "Could not reach the placement server. Start the backend and try again.");
    } finally {
      setSubmittingVerification(false);
    }
  }

  const view = editing ? draft : profile;
  const completion = profileCompletion(profile);
  const docsUploaded = PROFILE_DOC_ITEMS.filter((d) => profile.documents[d.key]).length;

  return (
    <div>
      <PageHeader
        eyebrow="Your profile"
        title="My profile"
        right={
          editing ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={requestCancel} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveChanges} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "none", background: T.accentDark, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                <CheckCircle2 size={14} /> Save changes
              </button>
            </div>
          ) : (
            <button onClick={startEdit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Pencil size={13} /> Edit profile
            </button>
          )
        }
      />

      <div style={{ padding: "22px 32px" }}>
        <p style={{ color: T.inkMuted, fontSize: 15, margin: "0 0 20px", maxWidth: 640, lineHeight: 1.6 }}>
          Keep your resume, documents, and academic details current — placement staff and
          recruiters see this information when shortlisting you for a drive.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 18 }}>
          {editing ? (
            <>
              <button type="button" onClick={requestCancel} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={saveChanges} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "none", background: T.accentDark, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                <CheckCircle2 size={14} /> Save changes
              </button>
            </>
          ) : (
            <button type="button" onClick={startEdit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Pencil size={13} /> Edit profile
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Profile completeness" value={`${completion}%`} icon={Sparkles} gradient={["#12a48a", "#0c7d69"]} sublabel={completion === 100 ? "All set" : "Add missing details"} />
          <StatCard label="Current CGPA" value={profile.cgpa} icon={GraduationCap} gradient={[T.accent, T.accentDark]} />
          <StatCard label="Active backlogs" value={profile.backlogs} icon={AlertCircle} gradient={["#2DD4BF", T.accentDark]} />
          <StatCard label="Documents on file" value={`${docsUploaded + (profile.resume ? 1 : 0)}/${PROFILE_DOC_ITEMS.length + 1}`} icon={FileText} gradient={["#14B8A6", T.accentDark]} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(360px, 1.1fr)", gap: 16, alignItems: "start" }}>
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.inkMuted, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>Personal information</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 22 }}>
              {PERSONAL_FIELDS.map((f) => (
                <ProfileField key={f.key} icon={f.icon} label={f.label} value={view[f.key]} editing={editing} type={f.type} options={f.options} onChange={(v) => updateDraft(f.key, v)} />
              ))}
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: T.inkMuted, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>Academic details</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 22 }}>
              {ACADEMIC_FIELDS.map((f) => (
                <ProfileField key={f.key} icon={f.icon} label={f.label} value={view[f.key]} editing={editing} type={f.type} onChange={(v) => updateDraft(f.key, f.type === "number" ? (v === "" ? "" : Number(v)) : v)} />
              ))}
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: T.inkMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Skills</div>
            {editing ? (
              <textarea value={draft.skills} onChange={(e) => updateDraft("skills", e.target.value)} placeholder="e.g. Java, React, SQL, DSA" rows={2} style={{ ...inputStyle, marginBottom: 22 }} />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
                {(profile.skills || "").split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} style={{ fontSize: 13.5, padding: "5px 10px", borderRadius: 8, background: T.cream, border: `1px solid ${T.border}`, color: T.ink }}>{s}</span>
                ))}
                {!profile.skills && <span style={{ fontSize: 13.5, color: T.inkMuted }}>No skills added yet.</span>}
              </div>
            )}

            <div style={{ fontSize: 14, fontWeight: 800, color: T.inkMuted, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>Links</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
              {LINK_FIELDS.map((f) => (
                <ProfileField key={f.key} icon={f.icon} label={f.label} value={view[f.key]} editing={editing} onChange={(v) => updateDraft(f.key, v)} />
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Avatar text={initials(profile.name)} size={48} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{profile.name}</div>
                <div style={{ fontSize: 13.5, color: T.inkMuted }}>{profile.roll} · {profile.branch}</div>
              </div>
            </div>
            <div style={{ height: 1, background: T.border, margin: "14px 0" }} />
            <div style={{ fontSize: 14.5, fontWeight: 800, color: T.inkMuted, marginBottom: 10, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              <Camera size={12} /> Documents
            </div>
            <DocumentChecklist documents={profile.documents} onUpload={handleDocUpload} items={PROFILE_DOC_ITEMS} />
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <FileText size={17} color={profile.resume ? T.accentDark : T.inkSoft} />
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Resume</div>
                <div style={{ fontSize: 13, color: profile.resume ? T.accentDark : T.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile.resume || "Not uploaded"}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 700, color: T.accentDark, border: `1px solid ${T.accentDark}55`, background: "#eef7f4", borderRadius: 7, padding: "6px 10px", cursor: "pointer", flexShrink: 0 }}>
                <Upload size={12} /> {profile.resume ? "Replace" : "Upload"}
                <input type="file" style={{ display: "none" }} onChange={handleResumeUpload} />
              </label>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={submitForVerification}
                disabled={submittingVerification}
                style={{ display: "flex", alignItems: "center", gap: 6, border: "none", borderRadius: 10, padding: "11px 18px", background: submittingVerification ? T.inkSoft : T.accentDark, color: "#fff", fontSize: 14, fontWeight: 800, cursor: submittingVerification ? "wait" : "pointer" }}
              >
                <Send size={12} /> {submittingVerification ? "Submitting..." : "Submit for verification"}
              </button>
            </div>
            {verificationError && <p role="alert" style={{ margin: "10px 0 0", color: "#a53737", fontSize: 12.5, textAlign: "right" }}>{verificationError}</p>}
          </div>
        </div>
      </div>

      {confirmCancel && (
        <ConfirmModal
          title="Discard changes?"
          body="Any edits you've made to your profile information will be lost. Documents and your resume have already been saved."
          confirmLabel="Discard"
          onCancel={() => setConfirmCancel(false)}
          onConfirm={confirmCancelEdit}
        />
      )}
    </div>
  );
}

/* =========================================================================
   ROOT
   ========================================================================= */
export default function StudentPortalApp({ initialTab = "drives" }) {
  const currentStudent = getStoredStudent();
  const [nav, setNav] = useState(initialTab);
  const [drives, setDrives] = useState(DRIVES);
  const [applications, setApplications] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [toast, setToast] = useState("");
  const [profile, setProfile] = useState({
    name: currentStudent?.fullName || currentStudent?.name || "",
    roll: currentStudent?.rollNumber || "",
    branch: currentStudent?.branch || "",
    cgpa: currentStudent?.cgpa ?? "",
    tenth: currentStudent?.tenthPercentage ?? currentStudent?.tenth ?? "",
    twelfth: currentStudent?.twelfthPercentage ?? currentStudent?.twelfth ?? "",
    graduationMarks: currentStudent?.graduationMarks ?? "",
    backlogs: currentStudent?.backlogs ?? "",
    graduationYear: currentStudent?.graduationYear ?? "",
    certifications: currentStudent?.certifications || "",
    projects: currentStudent?.projects || "",
    email: currentStudent?.email || "",
    phone: currentStudent?.phone || "",
    address: currentStudent?.address || "",
    skills: currentStudent?.skills || "",
    linkedin: currentStudent?.linkedin || "",
    github: currentStudent?.github || "",
    portfolio: currentStudent?.portfolio || "",
    resume: currentStudent?.resume || "",
    profilePhoto: currentStudent?.profilePhoto || null,
    documentPaths: currentStudent?.documentPaths || {},
    documents: {
      photo: currentStudent?.documentPaths?.photo ? currentStudent.documentPaths.photo.split(/[\\/]/).pop() : null,
      idProof: currentStudent?.documentPaths?.idProof ? currentStudent.documentPaths.idProof.split(/[\\/]/).pop() : null,
      tenthMarksheet: currentStudent?.documentPaths?.tenthMarksheet ? currentStudent.documentPaths.tenthMarksheet.split(/[\\/]/).pop() : null,
      twelfthMarksheet: currentStudent?.documentPaths?.twelfthMarksheet ? currentStudent.documentPaths.twelfthMarksheet.split(/[\\/]/).pop() : null,
      semesterMarksheets: currentStudent?.documentPaths?.semesterMarksheets ? currentStudent.documentPaths.semesterMarksheets.split(/[\\/]/).pop() : null,
    },
  });

  useEffect(() => {
    const student = getStoredStudent();
    if (!student?.rollNumber) return;

    const loadBackendProfile = async () => {
      const searches = [student.rollNumber, student.email].filter(Boolean);
      const accountEmail = String(student.email || '').trim().toLowerCase();
      let profileMismatch = false;
      for (const search of searches) {
        const response = await fetch(`${API_BASE}/api/student/profiles?search=${encodeURIComponent(search)}`);
        const profiles = await response.json();
        if (Array.isArray(profiles) && profiles.some((candidate) =>
          candidate.rollNumber === student.rollNumber && candidate.profileMatchesStudent === false
        )) {
          profileMismatch = true;
        }
        const backendProfile = Array.isArray(profiles)
          ? profiles.find((candidate) =>
              candidate.profileMatchesStudent !== false &&
              (student.rollNumber && candidate.rollNumber === student.rollNumber) ||
              (candidate.profileMatchesStudent !== false && accountEmail && String(candidate.email || '').trim().toLowerCase() === accountEmail)
            )
          : null;
        if (backendProfile) return { backendProfile, profileMismatch };
      }
      return { backendProfile: null, profileMismatch };
    };

    loadBackendProfile()
      .then(({ backendProfile, profileMismatch }) => {
        if (!backendProfile) {
          if (profileMismatch) {
            const accountOnlyProfile = {
              ...profile,
              name: student.fullName || student.name || '',
              roll: student.rollNumber || '',
              branch: student.branch || '',
              cgpa: student.cgpa ?? '',
              tenth: student.tenthPercentage ?? student.tenth ?? '',
              twelfth: student.twelfthPercentage ?? student.twelfth ?? '',
              graduationMarks: student.graduationMarks ?? '',
              backlogs: student.backlogs ?? '',
              graduationYear: student.graduationYear ?? '',
              certifications: '',
              projects: '',
              email: student.email || '',
              phone: '',
              address: '',
              skills: '',
              linkedin: '',
              github: '',
              portfolio: '',
              resume: '',
              profilePhoto: null,
              documentPaths: {},
              documents: { photo: null, idProof: null, tenthMarksheet: null, twelfthMarksheet: null, semesterMarksheets: null },
            };
            setProfile(accountOnlyProfile);
            persistStudentProfile(accountOnlyProfile);
          }
          return;
        }

        const mergedProfile = {
          name: student.fullName || student.name || backendProfile.name || "",
          roll: student.rollNumber || backendProfile.rollNumber || "",
          branch: backendProfile.branch || student.branch || "",
          cgpa: backendProfile.cgpa ?? student.cgpa ?? "",
          tenth: backendProfile.tenthPercentage ?? student.tenthPercentage ?? "",
          twelfth: backendProfile.twelfthPercentage ?? student.twelfthPercentage ?? "",
          graduationMarks: backendProfile.graduationMarks ?? student.graduationMarks ?? "",
          backlogs: backendProfile.backlogs ?? student.backlogs ?? "",
          graduationYear: backendProfile.graduationYear ?? student.graduationYear ?? "",
          certifications: backendProfile.certifications || student.certifications || "",
          projects: backendProfile.projects || student.projects || "",
          email: student.email || backendProfile.email || "",
          phone: backendProfile.phone || student.phone || "",
          address: backendProfile.address || student.address || "",
          skills: backendProfile.skills || student.skills || "",
          linkedin: backendProfile.linkedin || student.linkedin || "",
          github: backendProfile.github || student.github || "",
          portfolio: backendProfile.portfolio || student.portfolio || "",
          resume: backendProfile.resume || student.resume || "",
          profilePhoto: backendProfile.profilePhoto || student.profilePhoto || null,
          documentPaths: {
            photo: backendProfile.profilePhoto || student.documentPaths?.photo || student.profilePhoto || null,
            idProof: backendProfile.governmentId || student.documentPaths?.idProof || null,
            tenthMarksheet: backendProfile.tenthMarksheet || student.documentPaths?.tenthMarksheet || null,
            twelfthMarksheet: backendProfile.twelfthMarksheet || student.documentPaths?.twelfthMarksheet || null,
            semesterMarksheets: backendProfile.semesterMarksheets || student.documentPaths?.semesterMarksheets || null,
          },
          documents: {
            photo: backendProfile.profilePhoto ? backendProfile.profilePhoto.split(/[\\/]/).pop() : null,
            idProof: backendProfile.governmentId ? backendProfile.governmentId.split(/[\\/]/).pop() : (student.documentPaths?.idProof ? student.documentPaths.idProof.split(/[\\/]/).pop() : null),
            tenthMarksheet: backendProfile.tenthMarksheet ? backendProfile.tenthMarksheet.split(/[\\/]/).pop() : (student.documentPaths?.tenthMarksheet ? student.documentPaths.tenthMarksheet.split(/[\\/]/).pop() : null),
            twelfthMarksheet: backendProfile.twelfthMarksheet ? backendProfile.twelfthMarksheet.split(/[\\/]/).pop() : (student.documentPaths?.twelfthMarksheet ? student.documentPaths.twelfthMarksheet.split(/[\\/]/).pop() : null),
            semesterMarksheets: backendProfile.semesterMarksheets ? backendProfile.semesterMarksheets.split(/[\\/]/).pop() : (student.documentPaths?.semesterMarksheets ? student.documentPaths.semesterMarksheets.split(/[\\/]/).pop() : null),
          },
        };

        setProfile(mergedProfile);
        persistStudentProfile(mergedProfile);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadPlacementData() {
      try {
        const [companiesResponse, applicationsResponse] = await Promise.all([
          fetch(`${API_BASE}/api/companies`),
          fetch(`${API_BASE}/api/apply`),
        ]);
        const companies = await companiesResponse.json();
        const savedApplications = await applicationsResponse.json();

        if (companiesResponse.ok && Array.isArray(companies)) {
          setDrives(companies.map(mapCompanyToDrive));
        }

        if (applicationsResponse.ok && Array.isArray(savedApplications)) {
          setApplications(savedApplications
            .filter((application) => application.studentId === profile.roll)
            .map((application) => ({
              id: application._id,
              driveId: application.companyId,
              company: application.companyName,
              role: application.role || "Placement drive",
              package: application.package || "Package not specified",
              appliedDate: application.createdAt?.slice(0, 10) || "",
              stage: application.status || "Applied",
              stageDate: application.updatedAt?.slice(0, 10) || application.createdAt?.slice(0, 10) || "",
              history: [{ stage: "Applied", date: application.createdAt?.slice(0, 10) || null, done: true }],
              note: application.verificationNote || "Application received.",
              personalNote: "",
              feedback: { rating: 0, text: "" },
              documents: application.documents || {},
            })));
        }
      } catch (error) {
        console.error("Could not load placement data", error);
      }
    }

    loadPlacementData();
  }, [profile.roll]);

  const eligibleDrives = useMemo(
    () => drives.filter((drive) => isEligible(drive, {
      cgpa: profile.cgpa,
      tenth: profile.tenth,
      twelfth: profile.twelfth,
      backlogs: profile.backlogs,
      branch: profile.branch,
    })),
    [drives, profile.cgpa, profile.tenth, profile.twelfth, profile.backlogs, profile.branch]
  );

  const appliedDriveIds = useMemo(() => new Set(applications.filter((a) => a.stage !== "Withdrawn").map((a) => a.driveId)), [applications]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    if (!profile.roll) return undefined;

    let cancelled = false;
    const seenStorageKey = `campusbridge-notifications-${profile.roll}`;
    let seenNotificationIds = new Set();
    try {
      seenNotificationIds = new Set(JSON.parse(window.localStorage.getItem(seenStorageKey) || "[]"));
    } catch (error) {
      seenNotificationIds = new Set();
    }

    async function checkForNotifications() {
      try {
        const response = await fetch(`${API_BASE}/api/apply/notifications/${encodeURIComponent(profile.roll)}`);
        if (!response.ok) return;
        const notifications = await response.json();
        if (cancelled || !Array.isArray(notifications)) return;

        const newNotification = notifications.find((notification) => !seenNotificationIds.has(notification._id));
        notifications.forEach((notification) => seenNotificationIds.add(notification._id));
        window.localStorage.setItem(seenStorageKey, JSON.stringify([...seenNotificationIds]));
        if (newNotification) showToast(newNotification.message);
      } catch (error) {
        // Notifications are supplementary and should not interrupt the portal.
      }
    }

    checkForNotifications();
    const notificationTimer = window.setInterval(checkForNotifications, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(notificationTimer);
    };
  }, [profile.roll]);

  function toggleBookmark(id) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  async function handleApply(drive) {
    try {
      const response = await fetch(`${API_BASE}/api/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: profile.roll,
          companyId: drive.id,
          companyName: drive.company,
          package: drive.package,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Application could not be submitted");

      const newApp = {
      id: result.application?._id || "a" + Date.now(), driveId: drive.id, company: drive.company, role: drive.role, package: drive.package,
      appliedDate: "2026-09-12", stage: "Applied", stageDate: "2026-09-12",
      history: [
        { stage: "Applied", date: "2026-09-12", done: true },
        { stage: "Shortlisted", date: null, done: false },
        { stage: "Interview", date: null, done: false },
        { stage: "Offer", date: null, done: false },
      ],
      note: "Application received. We'll notify you when the next round is scheduled.",
      personalNote: "", feedback: { rating: 0, text: "" },
      documents: { resume: null, idProof: null, marksheet: null, offerLetter: null },
      };
      setApplications((prev) => [newApp, ...prev]);
      showToast(`Applied to ${drive.company}`);
    } catch (error) {
      showToast(error.message || "Application could not be submitted");
    }
  }
  function handleWithdraw(appId) {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, stage: "Withdrawn", stageDate: "2026-09-12" } : a)));
    showToast("Application withdrawn");
  }
  function handleBulkWithdraw(ids) {
    setApplications((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, stage: "Withdrawn", stageDate: "2026-09-12" } : a)));
    showToast(`${ids.length} applications withdrawn`);
  }
  function handleUpdateApplication(appId, patch) {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, ...patch } : a)));
  }
  function handleUpdateProfile(patch, message = "Profile updated") {
    const nextProfile = { ...profile, ...patch };
    setProfile(nextProfile);
    persistStudentProfile(nextProfile);

    const editableKeys = ["name", "email", "phone", "address", "branch", "skills", "certifications", "projects", "linkedin", "github", "portfolio", "cgpa", "graduationYear", "backlogs", "tenth", "twelfth", "graduationMarks"];
    if (!editableKeys.some((key) => Object.prototype.hasOwnProperty.call(patch, key))) {
      showToast(message);
      return;
    }

    fetch(`${API_BASE}/api/student/update-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollNumber: nextProfile.roll,
        name: nextProfile.name,
        email: nextProfile.email,
        phone: nextProfile.phone,
        address: nextProfile.address,
        branch: nextProfile.branch,
        skills: nextProfile.skills,
        certifications: nextProfile.certifications,
        projects: nextProfile.projects,
        linkedin: nextProfile.linkedin,
        github: nextProfile.github,
        portfolio: nextProfile.portfolio,
        cgpa: nextProfile.cgpa,
        graduationYear: nextProfile.graduationYear,
        backlogs: nextProfile.backlogs,
        tenthPercentage: nextProfile.tenth,
        twelfthPercentage: nextProfile.twelfth,
        graduationMarks: nextProfile.graduationMarks,
      }),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Profile could not be saved");
        showToast(message);
      })
      .catch((error) => showToast(error.message || "Profile could not be saved"));
  }

  return (
    <div style={{ display: "flex", width: "100%", maxWidth: "100%", height: "100vh", minWidth: 0, overflowX: "hidden", fontFamily: T.sans, background: "linear-gradient(135deg, #edf7f7 0%, #f8fbfc 48%, #eaf5f4 100%)" }}>
      <Sidebar active={nav} onNavigate={setNav} savedCount={bookmarks.size} />
      <div style={{ flex: 1, minWidth: 0, maxWidth: "100%", display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden" }}>
        <Topbar title={nav === "drives" ? "Placement drives" : nav === "history" ? "Drive history" : nav === "applications" ? "My applications" : nav === "profile" ? "My profile" : nav === "toolkit" ? "Career toolkit" : "Student portal"} badgeCount={2} name={profile.name} branch={profile.branch} />
        {nav === "drives" && <StudentPlacementCards drives={eligibleDrives} applications={applications} profile={profile} onApply={handleApply} />}
        {nav === "history" && <StudentDriveHistoryCards applications={applications} />}
        {nav === "applications" && (
          <MyApplicationsPage applications={applications} onWithdraw={handleWithdraw} onBulkWithdraw={handleBulkWithdraw} onUpdateApplication={handleUpdateApplication} onNavigate={setNav} />
        )}
        {nav === "profile" && <MyProfilePage profile={profile} onUpdateProfile={handleUpdateProfile} />}
        {nav === "toolkit" && <CareerToolkitPage profile={profile} applications={applications} drives={drives} onUpdateApplication={handleUpdateApplication} />}
        {nav === "notifications" && <StudentNotificationsPage profile={profile} />}
      </div>
      <StudentChatbot profile={profile} applications={applications} drives={drives} />
      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}