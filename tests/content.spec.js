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

  test('no old project links (only projects the user gave are listed)', () => {
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

  // Requirement change 2026-11-17: Lenis added. Scripts/styles may load only from the site's own vendor/ folder.
  test('no external scripts; only Google Fonts or local vendor/ stylesheets', () => {
    const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
    for (const src of srcs) expect(src, src).toMatch(/^vendor\/[\w.-]+\.js$/);
    const sheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m => m[0]);
    for (const l of sheets) expect(l).toMatch(/fonts\.googleapis\.com|href="vendor\/[\w.-]+\.css"/);
  });

  test('Lenis is vendored locally and matches the installed package', () => {
    const fs = require('fs'), path = require('path');
    const root = path.join(__dirname, '..');
    expect(html).toContain('<script src="vendor/lenis.min.js"></script>');
    const vendored = fs.readFileSync(path.join(root, 'vendor/lenis.min.js'), 'utf8');
    const pkg = fs.readFileSync(path.join(root, 'node_modules/lenis/dist/lenis.min.js'), 'utf8');
    expect(vendored).toBe(pkg);
  });

  test('responsive meta + language set', () => {
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain('<html lang="en">');
  });

  test('footer copyright', () => {
    expect(html).toContain('© 2026 Rajath Thaliyadath. All rights reserved.');
  });

  test('no cursor-follower circle code', () => {
    expect(html).not.toContain('id="cursor"');
    expect(html).not.toMatch(/#cursor\b/);
  });

  test('contact email is rajatht@icloud.com (no placeholder)', () => {
    expect(html).not.toContain('you@example.com');
    expect(html).toContain('href="mailto:rajatht@icloud.com"');
    expect(html).toMatch(/>rajatht@icloud\.com</);
  });

  test('Projects section lists Split with its short and full text', () => {
    expect(html).toContain('id="projects"');
    expect(html).toContain('href="#projects"');
    expect(html).toMatch(/<h4>Split<\/h4>/);
    expect(html).toContain('Shared expense tracker for groups, trips, and households.');
    expect(html).toContain('Split is a live web app for sharing bills fairly. Create a group, add members, log expenses with equal or custom splits, track who owes whom, and settle up. Built with Django and PostgreSQL, it supports recurring expenses and shareable edit links—no account login required.');
  });
});
