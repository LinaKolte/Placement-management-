function normalizeOfferPackage(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const cleaned = trimmed.replace(/₹/g, '').replace(/,/g, '').replace(/lpa/i, '').trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isOfferAllowed(existingPackage, newPackage) {
  const prev = normalizeOfferPackage(existingPackage);
  const next = normalizeOfferPackage(newPackage);
  if (prev === null || next === null) {
    return false;
  }
  return next >= prev * 2;
}

module.exports = {
  normalizeOfferPackage,
  isOfferAllowed,
};
