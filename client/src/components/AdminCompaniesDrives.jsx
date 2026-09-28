import { useMemo, useState } from 'react';
import { Building2, Calendar, Pencil, Plus, Search, Trash2, Users, Briefcase, TrendingUp, X } from 'lucide-react';
import './AdminCompaniesDrives.css';

const statusStyles = {
  Open: ['#dffaf6', '#0f766e'],
  'Closing soon': ['#fef3c7', '#a16207'],
  Closed: ['#f1f5f9', '#64748b'],
};

function StatusBadge({ status }) {
  const [background, color] = statusStyles[status] || statusStyles.Closed;
  return <span className="admin-drives-badge" style={{ background, color }}>{status || 'Open'}</span>;
}

function Modal({ title, onClose, children }) {
  return <div className="admin-drives-modal-backdrop" onClick={onClose}><div className="admin-drives-modal" onClick={(event) => event.stopPropagation()}><div className="admin-drives-modal-heading"><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>{children}</div></div>;
}

export default function AdminCompaniesDrives({ companies, companyStats, companyDraft, companyFormOpen, companySaving, editingCompanyId, onStartCreate, onStartEdit, onDraftChange, onSave, onCloseForm, onCloseCompany, onNotifyCompany }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const filteredCompanies = useMemo(() => companies.filter((company) => {
    const matchesQuery = `${company.name} ${company.role} ${(company.branches || []).join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === 'All' || company.status === statusFilter);
  }), [companies, query, statusFilter]);
  const applicantTotal = companyStats.reduce((sum, company) => sum + (company.applicantCount || 0), 0);
  const averagePackage = companies.length ? companies.reduce((sum, company) => sum + (Number.parseFloat(company.package) || 0), 0) / companies.length : 0;
  const fields = [
    ['name', 'Company name', 'text'], ['role', 'Role', 'text'], ['package', 'Package', 'text'],
    ['minCgpa', 'Minimum CGPA', 'number'], ['minTenthPercentage', 'Minimum 10th %', 'number'],
    ['minTwelfthPercentage', 'Minimum 12th %', 'number'], ['maxBacklogs', 'Maximum backlogs', 'number'],
    ['applicationStart', 'Application start', 'datetime-local'], ['deadline', 'Closing date and time', 'datetime-local'],
  ];

  return <div className="admin-drives-page">
    <div className="admin-drives-header">
      <div><div className="admin-drives-eyebrow">Recruiter workspace</div><h1>Companies &amp; Drives</h1><p>Manage recruiters and placement drives for season 2026-27.</p></div>
      <div className="admin-drives-actions">
        <label className="admin-drives-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies or drives..." /></label>
        <button type="button" className="admin-drives-secondary" onClick={onStartCreate}><Building2 size={16} /> Add Company</button>
        <button type="button" className="admin-drives-primary" onClick={() => onNotifyCompany?.(companies.find((company) => company.status !== 'Closed') || companies[0])}><Users size={16} /> Send notification</button>
        <button type="button" className="admin-drives-primary" onClick={onStartCreate}><Plus size={16} /> New Drive</button>
      </div>
    </div>

    <div className="admin-drives-stats">
      <article><Building2 size={17} /><strong>{companies.length}</strong><span>Companies Onboarded</span></article>
      <article className="gold"><Briefcase size={17} /><strong>{companies.filter((company) => company.status !== 'Closed').length}</strong><span>Active Drives</span></article>
      <article><Users size={17} /><strong>{applicantTotal.toLocaleString()}</strong><span>Total Applicants</span></article>
      <article><TrendingUp size={17} /><strong>{averagePackage ? `₹${averagePackage.toFixed(1)}` : '-'}</strong><span>Avg. Package Offered</span></article>
    </div>

    {companyFormOpen && <Modal title={editingCompanyId ? 'Edit placement drive' : 'Schedule a drive'} onClose={onCloseForm}><form className="admin-drives-form" onSubmit={(event) => { event.preventDefault(); onSave(); }}><div className="admin-drives-form-grid">{fields.map(([field, label, type]) => <label key={field}>{label}<input type={type} value={companyDraft[field]} min={type === 'number' ? 0 : undefined} onChange={(event) => onDraftChange(field, event.target.value)} /></label>)}<label>Eligible branches<input value={companyDraft.branches} onChange={(event) => onDraftChange('branches', event.target.value)} placeholder="CSE, IT, ECE" /></label><label>Status<select value={companyDraft.status} onChange={(event) => onDraftChange('status', event.target.value)}><option>Open</option><option>Closing soon</option><option>Closed</option></select></label><label className="admin-drives-checkbox"><input type="checkbox" checked={companyDraft.noBacklogs} onChange={(event) => onDraftChange('noBacklogs', event.target.checked)} /> No active backlogs</label></div><div className="admin-drives-form-actions"><button type="button" className="admin-drives-secondary" onClick={onCloseForm}>Cancel</button><button type="submit" className="admin-drives-primary" disabled={companySaving}>{companySaving ? 'Saving...' : editingCompanyId ? 'Save changes' : 'Create Drive'}</button></div></form></Modal>}

    <div className="admin-drives-layout"><section className="admin-drives-panel"><div className="admin-drives-panel-heading"><div><h2>Placement drives</h2><p>Every drive scheduled this season</p></div><div className="admin-drives-filters">{['All', 'Open', 'Closing soon', 'Closed'].map((filter) => <button type="button" className={statusFilter === filter ? 'active' : ''} onClick={() => setStatusFilter(filter)} key={filter}>{filter}</button>)}</div></div><div className="admin-drives-list">{filteredCompanies.map((company) => <article className="admin-drive-row" key={company._id}><div className="admin-drive-main"><div className="admin-drive-title"><strong>{company.name}</strong><StatusBadge status={company.status} /></div><span>{company.role} · {(company.branches || []).join(', ') || 'All branches'}</span><small><Calendar size={13} /> {company.deadline ? `Closes ${new Date(company.deadline).toLocaleString()}` : 'No closing time'} · {companyStats.find((item) => item.id === company._id)?.applicantCount || 0} applicants</small></div><div className="admin-drive-actions"><strong>{company.package || 'Package not set'}</strong><button type="button" className="admin-drive-action-button" onClick={() => onNotifyCompany?.(company)} aria-label={`Send notification for ${company.name}`} title="Send notification"><Users size={15} /></button><button type="button" onClick={() => onStartEdit(company)} aria-label={`Edit ${company.name}`}><Pencil size={15} /></button>{company.status !== 'Closed' && <button type="button" onClick={() => onCloseCompany(company)} aria-label={`Close ${company.name}`}><Trash2 size={15} /></button>}</div></article>)}{filteredCompanies.length === 0 && <p className="admin-drives-empty">No drives match your filters.</p>}</div></section>

      <section className="admin-drives-panel"><div className="admin-drives-panel-heading"><div><h2>Onboarded companies</h2><p>Recruiter directory and relationship status</p></div></div><div className="admin-drives-company-list">{filteredCompanies.map((company) => <div className="admin-company-row" key={company._id}><div><strong>{company.name}</strong><span>{company.role || 'Placement recruiter'}</span></div><div><span>{company.branches?.length ? company.branches.join(', ') : 'All branches'}</span><StatusBadge status={company.status} /></div></div>)}{filteredCompanies.length === 0 && <p className="admin-drives-empty">No companies match your search.</p>}</div></section></div>
  </div>;
}
