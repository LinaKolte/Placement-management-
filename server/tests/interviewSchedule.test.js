const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeInterviewSchedule,
  validateInterviewSchedule,
  findInterviewConflict,
} = require('../utils/interviewSchedule');

test('normalizes interview schedule data for storage', () => {
  const payload = {
    date: '2026-09-12',
    time: ' 15:30 ',
    round: ' round 1 ',
    location: ' Hall A ',
    panel: ' Tech Panel ',
    notes: ' Bring resume ',
  };

  assert.deepEqual(normalizeInterviewSchedule(payload), {
    date: '2026-09-12',
    time: '15:30',
    round: 'Round 1',
    location: 'Hall A',
    panel: 'Tech Panel',
    notes: 'Bring resume',
  });
});

test('rejects invalid interview scheduling payloads', () => {
  assert.equal(validateInterviewSchedule({ date: '' }).valid, false);
  assert.equal(validateInterviewSchedule({ date: '2026-09-12', time: 'bad-time' }).valid, false);
  assert.equal(validateInterviewSchedule({ date: '2026-09-12', time: '15:30' }).valid, true);
});

test('detects student, panel, and location interview conflicts at the same time', () => {
  const existing = [{
    applicationId: 'application-1',
    studentId: '21CS001',
    interviewSchedule: { date: '2026-09-12', time: '15:30', panel: 'Tech Panel', location: 'Hall A' },
  }];

  assert.equal(findInterviewConflict(existing, { studentId: '21CS001', date: '2026-09-12', time: '15:30' })?.applicationId, 'application-1');
  assert.equal(findInterviewConflict(existing, { studentId: '21CS002', date: '2026-09-12', time: '15:30', panel: 'tech panel' })?.applicationId, 'application-1');
  assert.equal(findInterviewConflict(existing, { studentId: '21CS002', date: '2026-09-12', time: '15:30', location: 'hall a' })?.applicationId, 'application-1');
  assert.equal(findInterviewConflict(existing, { studentId: '21CS002', date: '2026-09-12', time: '16:00', panel: 'Tech Panel' }), undefined);
});

test('allows rescheduling the same application', () => {
  const existing = [{
    applicationId: 'application-1',
    studentId: '21CS001',
    interviewSchedule: { date: '2026-09-12', time: '15:30', panel: 'Tech Panel', location: 'Hall A' },
  }];

  assert.equal(findInterviewConflict(existing, { studentId: '21CS001', date: '2026-09-12', time: '15:30', panel: 'Tech Panel', location: 'Hall A' }, 'application-1'), undefined);
});
