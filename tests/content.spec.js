// Static checks on index.html: content, structure, links, safety.
const { test, expect } = require('@playwright/test');
const { html } = require('./helpers');

test.describe('content', () => {
  test('page title', () => {
    expect(html).toContain('<title>Rajath - AI & Software Engineer Portfolio</title>');
  });

  test('required sections exist', () => {
    for (const id of ['about', 'education', 'skills', 'contact']) {
      expect(html, `section #${id}`).toContain(`id="${id}"`);
    }
  });

  test('every in-page nav link points to an existing id', () => {
    const hrefs = [...html.matchAll(/href="#([\w-]+)"/g)].map(m => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const id of new Set(hrefs)) expect(html, `#${id}`).toContain(`id="${id}"`);
  });

  test('no projects section or old project links (user has no projects yet)', () => {
    expect(html).not.toContain('id="work"');
    expect(html).not.toMatch(/rajatht\.me|resume-agent|onrender\.com|hf\.space/);
  });

  test('Masters shown as completed Oct 2026, not "pursuing"', () => {
    expect(html).not.toMatch(/pursuing/i);
    expect(html).toContain('completed my Masters of IT in AI at Macquarie University');
    expect(html).toContain('October 2026');
  });

  test('"Now" block: learning about agents, building small projects', () => {
    expect(html).toContain('Learning about AI agents');
    expect(html).toContain('Small projects to practise what I learn');
  });

  test('education, certifications and tech stack present', () => {
    for (const s of ['Masters of IT in AI', 'LBS College of Engineering, Kasaragod', 'Python Programming',
      'Django Framework', 'AI &amp; Machine Learning', 'Selenium', 'athletics and playing the piano', 'QBurst']) {
      expect(html, s).toContain(s);
    }
  });

  test('light theme is the default (no OS dark-mode override)', () => {
    expect(html).not.toContain('prefers-color-scheme');
  });

  test('new-tab links use rel="noopener"', () => {
    const blanks = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map(m => m[0]);
    for (const a of blanks) expect(a, a).toMatch(/rel="[^"]*noopener/);
  });

  test('no external scripts; only Google Fonts stylesheets', () => {
    expect(html).not.toMatch(/<script[^>]+src=/);
    const sheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m => m[0]);
    for (const l of sheets) expect(l).toContain('fonts.googleapis.com');
  });

  test('responsive meta + language set', () => {
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain('<html lang="en">');
  });

  test('footer copyright', () => {
    expect(html).toContain('© 2026 Rajath Thaliyadath. All rights reserved.');
  });
});
