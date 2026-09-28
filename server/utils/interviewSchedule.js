function normalizeInterviewSchedule(data = {}) {
  const normalized = {
    date: String(data.date ?? '').trim(),
    time: String(data.time ?? '').trim(),
    round: String(data.round ?? 'Round 1').trim() || 'Round 1',
    location: String(data.location ?? '').trim(),
    panel: String(data.panel ?? '').trim(),
    notes: String(data.notes ?? '').trim(),
  };

  if (normalized.round) {
    const roundValue = normalized.round.trim();
    normalized.round = /^round\s*\d+/i.test(roundValue)
      ? roundValue.replace(/^round\s*/i, 'Round ')
      : /^round\b/i.test(roundValue)
        ? roundValue.replace(/^round\b/i, 'Round')
        : `Round ${roundValue}`;
  }

  return normalized;
}

function validateInterviewSchedule(data = {}) {
  const normalized = normalizeInterviewSchedule(data);
  const errors = [];

  if (!normalized.date) {
    errors.push('Interview date is required.');
  }

  if (!normalized.time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(normalized.time)) {
    errors.push('Interview time must be in HH:MM format.');
  }

  return {
    valid: errors.length === 0,
    normalized,
    errors,
  };
}

function findInterviewConflict(existingSchedules, candidate, currentApplicationId = null) {
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const candidateDate = normalize(candidate.date);
  const candidateTime = normalize(candidate.time);
  const candidatePanel = normalize(candidate.panel);
  const candidateLocation = normalize(candidate.location);

  return existingSchedules.find((record) => {
    if (currentApplicationId && String(record.applicationId) === String(currentApplicationId)) return false;

    const schedule = record.interviewSchedule || {};
    if (normalize(schedule.date) !== candidateDate || normalize(schedule.time) !== candidateTime) return false;

    const sameStudent = normalize(record.studentId) === normalize(candidate.studentId);
    const samePanel = candidatePanel && candidatePanel === normalize(schedule.panel);
    const sameLocation = candidateLocation && candidateLocation === normalize(schedule.location);
    return sameStudent || samePanel || sameLocation;
  });
}

module.exports = {
  normalizeInterviewSchedule,
  validateInterviewSchedule,
  findInterviewConflict,
};
