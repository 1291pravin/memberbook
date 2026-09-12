import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOrgContact } from '../../server/utils/org-contact.ts';

test('existing clients can omit both optional fields', () => {
  assert.deepEqual(parseOrgContact(undefined, undefined), { ownerWhatsapp: null, setupHelpConsentAt: null });
  assert.deepEqual(parseOrgContact('  ', false), { ownerWhatsapp: null, setupHelpConsentAt: null });
});

test('normalizes Indian and international numbers without implying consent', () => {
  for (const phone of ['9876543210', '+91 98765 43210', '+91 (98765) 43210']) {
    assert.deepEqual(parseOrgContact(phone, false), { ownerWhatsapp: '+919876543210', setupHelpConsentAt: null });
  }
  assert.equal(parseOrgContact('+44 7700 900123', false).ownerWhatsapp, '+447700900123');
});

test('records explicit consent with a server timestamp', () => {
  const result = parseOrgContact('9876543210', true);
  assert.ok(Number.isFinite(Date.parse(result.setupHelpConsentAt)));
});

test('rejects malformed numbers and consent without a number', () => {
  for (const phone of [1234567890, {}, '+91', 'abc9876543210', '++919876543210', '+911234567890', '+1234567890123456']) {
    assert.throws(() => parseOrgContact(phone, false));
  }
  assert.throws(() => parseOrgContact('', true));
  assert.throws(() => parseOrgContact('9876543210', 'true'));
});
