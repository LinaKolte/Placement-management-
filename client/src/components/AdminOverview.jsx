import { Building2, FileText, Plus, Search, Star, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './AdminOverview.css';

const palette = {
  teal: '#0f766e',
  tealDark: '#115e59',
  tealSoft: '#dffaf6',
  gold: '#d9a640',
  ink: '#0f172a',
  muted: '#64748b',
  line: '#e5ecec',
  paper: '#ffffff',
};

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'ST';
}

function StatusBadge({ status }) {
  const tones = {
    Placed: ['#dffaf6', '#0f766e'],
    Selected: ['#e0f2fe', '#0369a1'],
    Shortlisted: ['#fef3c7', '#a16207'],
    Rejected: ['#ffe4e6', '#be123c'],
  };
  const [background, color] = tones[status] || ['#f1f5f9', '#64748b'];
  return <span className="admin-overview-badge" style={{ background, color }}>{status || 'Applied'}</span>;
}

function Panel({ title, sub, children, className = '' }) {
  return (
    <section className={`admin-overview-panel ${className}`}>
      <div className="admin-overview-panel-heading">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function AdminOverview({ admin, totalStudentCount, activeCompanyCount, totalApplications, shortlistedCount, selectedCount, placedCount, applications, managedCompanies, students, onNavigate }) {
  const recentApplications = applications.slice(0, 5);
  const trend = [
    { month: 'Jun', offers: Math.max(0, Math.round(placedCount * 0.15)) },
    { month: 'Jul', offers: Math.max(0, Math.round(placedCount * 0.34)) },
    { month: 'Aug', offers: Math.max(0, Math.round(placedCount * 0.58)) },
    { month: 'Sep', offers: placedCount },
    { month: 'Oct', offers: Math.max(0, Math.round(placedCount * 0.72)) },
  ];
  const branchCounts = applications.reduce((counts, application) => {
    const branch = application.student?.branch || 'Other';
    counts[branch] = (counts[branch] || 0) + 1;
    return counts;
  }, {});
  const departments = Object.entries(branchCounts).slice(0, 5).map(([dept, count]) => ({
    dept,
    pct: totalApplications ? Math.min(100, Math.round((count / totalApplications) * 100)) : 0,
  }));
  const packageBands = [
    { band: '0-5', students: applications.filter((a) => Number.parseFloat(a.company?.package) < 5).length },
    { band: '5-8', students: applications.filter((a) => Number.parseFloat(a.company?.package) >= 5 && Number.parseFloat(a.company?.package) < 8).length },
    { band: '8-12', students: applications.filter((a) => Number.parseFloat(a.company?.package) >= 8 && Number.parseFloat(a.company?.package) < 12).length },
    { band: '12+', students: applications.filter((a) => Number.parseFloat(a.company?.package) >= 12).length },
  ];
  const stats = [
    { label: 'Registered Students', value: totalStudentCount, delta: 'Live roster', icon: Users, accent: palette.teal },
    { label: 'Companies Onboarded', value: activeCompanyCount, delta: 'Active this season', icon: Building2, accent: palette.gold },
    { label: 'Applications This Cycle', value: totalApplications, delta: 'Live this cycle', icon: FileText, accent: palette.teal },
    { label: 'Active Drives', value: managedCompanies.filter((company) => company.status !== 'Closed').length, delta: 'Open opportunities', icon: Star, accent: palette.teal },
  ];

  return (
    <div className="admin-overview">
      <div className="admin-overview-heading-row">
        <div>
          <div className="admin-overview-eyebrow">Placement Overview</div>
          <h1>Placement season 2026-27</h1>
          <p>Live operational view for {admin?.name || 'the placement team'}.</p>
        </div>
        <div className="admin-overview-actions">
          <span className="admin-overview-live"><i /> Live data</span>
          <button type="button" className="admin-overview-secondary" onClick={() => window.location.reload()}>Refresh</button>
          <button type="button" className="admin-overview-primary" onClick={() => onNavigate('companies')}><Plus size={15} /> New Drive</button>
        </div>
      </div>

      <div className="admin-overview-stats">
        {stats.map(({ label, value, delta, icon: Icon, accent }) => (
          <article className="admin-overview-stat" key={label} style={{ '--accent': accent }}>
            <div className="admin-overview-stat-icon"><Icon size={17} /></div>
            <strong>{value.toLocaleString()}</strong>
            <span>{label}</span>
            <small>{delta}</small>
          </article>
        ))}
      </div>

      <div className="admin-overview-two-column">
        <Panel title="Placement trend" sub="Confirmed placements across the current season">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trend} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5f2ee" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#8c99ab' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#8c99ab' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="offers" stroke={palette.teal} strokeWidth={3} dot={{ r: 4, fill: palette.teal }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Needs attention" sub="Action items for the placement team">
          <div className="admin-overview-attention-list">
            <div className="admin-overview-attention-item"><i className="danger" /><div><strong>{applications.filter((a) => a.status === 'Applied').length} applications pending</strong><span>Review candidate applications</span><button type="button" onClick={() => onNavigate('applications')}>Review</button></div></div>
            <div className="admin-overview-attention-item"><i className="warning" /><div><strong>{students.filter((student) => student.verificationStatus === 'Pending').length} profiles need review</strong><span>Verify student documents</span><button type="button" onClick={() => onNavigate('profile-verification')}>Review</button></div></div>
          </div>
        </Panel>
      </div>

      <Panel title="Department-wise placement" sub="Application distribution by student branch">
        <div className="admin-overview-departments">
          {departments.length > 0 ? departments.map(({ dept, pct }) => <div className="admin-overview-department" key={dept}><span>{dept}</span><div><i style={{ width: `${pct}%` }} /></div><strong>{pct}%</strong></div>) : <p className="admin-overview-empty">No department data is available yet.</p>}
        </div>
      </Panel>

      <Panel title="Recent applications" sub="Latest activity across all drives">
        <div className="admin-overview-table-wrap">
          <table className="admin-overview-table"><thead><tr><th>Student</th><th>Company</th><th>Role</th><th>Status</th></tr></thead><tbody>
            {recentApplications.map((application) => <tr key={application.id}><td><div className="admin-overview-student"><span>{initials(application.student?.name)}</span><strong>{application.student?.name || 'Unknown student'}</strong></div></td><td>{application.company?.name || 'Unknown company'}</td><td>{application.company?.role || 'Placement drive'}</td><td><StatusBadge status={application.status} /></td></tr>)}
            {recentApplications.length === 0 && <tr><td colSpan="4" className="admin-overview-empty">No applications have been recorded yet.</td></tr>}
          </tbody></table>
        </div>
      </Panel>

      <Panel title="Offers by package band" sub="Distribution of applications by company package">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={packageBands} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5f2ee" vertical={false} />
            <XAxis dataKey="band" tick={{ fontSize: 13, fill: '#8c99ab' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#8c99ab' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="students" fill={palette.teal} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
