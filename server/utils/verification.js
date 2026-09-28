const VERIFICATION_STATUSES = ['Pending', 'Verified', 'Rejected'];

function normalizeVerificationStatus(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  const status = VERIFICATION_STATUSES.find((item) => item.toLowerCase() === normalized);
  return status || 'Pending';
}

function canSetVerificationStatus(currentStatus, nextStatus) {
  const current = normalizeVerificationStatus(currentStatus);
  const next = normalizeVerificationStatus(nextStatus);

  if (current === next) return true;
  if (current === 'Pending') return ['Verified', 'Rejected'].includes(next);
  return current === 'Verified' && next === 'Rejected';
}

module.exports = {
  normalizeVerificationStatus,
  canSetVerificationStatus,
};