const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeOfferPackage, isOfferAllowed } = require('../utils/offerPolicy');

test('normalizes Indian-style package strings', () => {
  assert.equal(normalizeOfferPackage('₹12.5 LPA'), 12.5);
  assert.equal(normalizeOfferPackage('8 LPA'), 8);
  assert.equal(normalizeOfferPackage(15), 15);
});

test('blocks offers below double the existing package', () => {
  assert.equal(isOfferAllowed(12, 20), false);
  assert.equal(isOfferAllowed(12, 24), true);
  assert.equal(isOfferAllowed(8.5, 17), true);
  assert.equal(isOfferAllowed(12, ''), false);
});
