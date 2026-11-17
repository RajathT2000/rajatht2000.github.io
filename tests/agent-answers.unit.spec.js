// Unit tests (no browser): run the agent's real answer() from index.html in Node.
const { test, expect } = require('@playwright/test');
const vm = require('vm');
const { html } = require('./helpers');
const { cases, unrelated, notOngoing, REFUSAL } = require('./agent-cases');

const start = html.indexOf('  var KB=[');
const end = html.indexOf('  function add(html,who){', start);
if (start < 0 || end < 0) throw new Error('agent KB/answer() not found in index.html');
const answer = vm.runInNewContext(html.slice(start, end) + '; answer;', {});
const text = q => answer(q).replace(/<a\b[^>]*href="([^"]+)"[^>]*>/g, ' $1 ').replace(/<[^>]+>/g, '');

test.describe('agent answers (unit)', () => {
  for (const [q, re] of cases) {
    test(`answers from portfolio: "${q}"`, () => { expect(text(q)).toMatch(re); });
  }
  for (const q of unrelated) {
    test(`refuses unrelated: "${q}"`, () => { expect(text(q)).toMatch(REFUSAL); });
  }
  test('never claims Masters is ongoing', () => {
    for (const q of notOngoing) expect(text(q)).not.toMatch(/pursuing|currently studying/i);
  });
  test('answers contain only safe, known links', () => {
    for (const [q] of cases) {
      // requirement change 2026-11-17: LinkedIn, GitHub (profile + price-tracker repo) and CV links are also allowed
      for (const m of answer(q).matchAll(/href="([^"]+)"/g)) expect(m[1]).toMatch(/^(#contact|mailto:rajatht@icloud\.com|https:\/\/www\.linkedin\.com\/in\/rajath-thaliyadath-77b040181|https:\/\/github\.com\/RajathT2000(\/price-tracker)?|https:\/\/pdf\.rajatht\.me\/|cv\/Rajath_Thaliyadath_CV\.pdf)$/);
    }
  });
  test('every answer speaks in first person as Rajath', () => {
    const third = /\bRajath(?:'s)?\s+(?:is|has|was|completed|specializes|enjoys|worked)\b|\b(?:his|he)\s+(?:Masters|phone|tech|listed)\b/i;
    for (const [q] of cases) {
      const a = text(q);
      expect(a, q).toMatch(/\b(?:I|I'm|I've|my|me)\b/i);
      expect(a, q).not.toMatch(third);
    }
    expect(text('hello')).toMatch(/\bmy portfolio\b/);
    expect(text('What is the capital of France?')).toMatch(/my portfolio/);
  });
});
