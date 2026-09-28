const test = require('node:test');
const assert = require('node:assert/strict');
const { isStudentEligibleForCompany } = require('../utils/eligibilityMail');

test('matches students by branch and cgpa requirements', () => {
  const company = {
    name: 'TechNova',
    branches: ['CSE', 'IT'],
    minCgpa: 7.5,
    noBacklogs: true,
  };

  assert.equal(
    isStudentEligibleForCompany({ branch: 'CSE', cgpa: 8.2, backlogs: 0 }, company),
    true
  );
  assert.equal(
    isStudentEligibleForCompany({ branch: 'ECE', cgpa: 8.2, backlogs: 0 }, company),
    false
  );
  assert.equal(
    isStudentEligibleForCompany({ branch: 'CSE', cgpa: 7.0, backlogs: 0 }, company),
    false
  );
  assert.equal(
    isStudentEligibleForCompany({ branch: 'CSE', cgpa: 8.2, backlogs: 2 }, company),
    false
  );
});
