const PLACEMENT_STATUSES = [
  'Applied',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Placed',
  'Rejected',
];

const ROUND_ORDER = [
  'Aptitude',
  'Technical',
  'HR',
  'Final',
];

const PLACEMENT_TRANSITIONS = {
  Applied: ['Shortlisted', 'Rejected'],
  Shortlisted: ['Interview Scheduled', 'Rejected'],
  'Interview Scheduled': ['Selected', 'Rejected'],
  Selected: ['Placed', 'Rejected'],
  Placed: [],
  Rejected: ['Applied'],
};

function normalizePlacementStatus(value) {
  const status = String(value ?? '').trim();
  if (!status) return 'Applied';

  const normalized = status.toLowerCase();
  if (normalized === 'placed' || normalized === 'offer accepted') return 'Placed';
  if (normalized === 'selected' || normalized === 'final selected') return 'Selected';
  if (normalized.includes('interview') || normalized.includes('round')) return 'Interview Scheduled';
  if (normalized === 'shortlisted' || normalized.includes('shortlist')) return 'Shortlisted';
  if (normalized === 'rejected' || normalized.includes('reject')) return 'Rejected';
  return 'Applied';
}

function normalizeRoundName(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Aptitude Round';

  const lower = raw.toLowerCase();
  if (lower.includes('apt')) return 'Aptitude Round';
  if (lower.includes('tech')) return 'Technical Round';
  if (lower.includes('hr')) return 'HR Round';
  if (lower.includes('final')) return 'Final Round';

  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ') + ' Round';
}

function getNextPlacementStage(currentStatus) {
  const status = normalizePlacementStatus(currentStatus);
  const index = PLACEMENT_STATUSES.indexOf(status);
  if (index === -1) return 'Shortlisted';
  if (index === PLACEMENT_STATUSES.length - 1) return status;
  return PLACEMENT_STATUSES[index + 1];
}

function getAllowedPlacementTransitions(currentStatus) {
  return PLACEMENT_TRANSITIONS[normalizePlacementStatus(currentStatus)] || [];
}

function canTransitionPlacementStatus(currentStatus, nextStatus) {
  const current = normalizePlacementStatus(currentStatus);
  const next = normalizePlacementStatus(nextStatus);
  return current === next || getAllowedPlacementTransitions(current).includes(next);
}

module.exports = {
  PLACEMENT_STATUSES,
  ROUND_ORDER,
  PLACEMENT_TRANSITIONS,
  normalizePlacementStatus,
  normalizeRoundName,
  getNextPlacementStage,
  getAllowedPlacementTransitions,
  canTransitionPlacementStatus,
};
