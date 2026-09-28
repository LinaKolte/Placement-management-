const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizePlacementStatus,
  normalizeRoundName,
  getNextPlacementStage,
  getAllowedPlacementTransitions,
  canTransitionPlacementStatus,
} = require('../utils/placementLifecycle');

test('normalizes placement lifecycle statuses', () => {
  assert.equal(normalizePlacementStatus(' placed '), 'Placed');
  assert.equal(normalizePlacementStatus('shortlisted'), 'Shortlisted');
  assert.equal(normalizePlacementStatus('unknown'), 'Applied');
});

test('normalizes custom round names consistently', () => {
  assert.equal(normalizeRoundName(' technical round '), 'Technical Round');
  assert.equal(normalizeRoundName('hr'), 'HR Round');
});

test('advances through the major placement stages in order', () => {
  assert.equal(getNextPlacementStage('Applied'), 'Shortlisted');
  assert.equal(getNextPlacementStage('Shortlisted'), 'Interview Scheduled');
  assert.equal(getNextPlacementStage('Interview Scheduled'), 'Selected');
  assert.equal(getNextPlacementStage('Selected'), 'Placed');
});

test('only allows adjacent placement transitions', () => {
  assert.deepEqual(getAllowedPlacementTransitions('Shortlisted'), ['Interview Scheduled', 'Rejected']);
  assert.equal(canTransitionPlacementStatus('Applied', 'Selected'), false);
  assert.equal(canTransitionPlacementStatus('Selected', 'Placed'), true);
  assert.equal(canTransitionPlacementStatus('Placed', 'Applied'), false);
  assert.equal(canTransitionPlacementStatus('Rejected', 'Applied'), true);
});
