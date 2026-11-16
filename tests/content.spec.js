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

  // Requirement change 2026-11-17: the user gave Split's live URL; it is the only project link allowed.
  test('no old project links (only links the user gave are listed)', () => {
    expect(html).not.toContain('id="work"');
    const rest = html.split('https://split.rajatht.me/').join('');
    expect(rest).not.toMatch(/rajatht\.me|resume-agent|onrender\.com|hf\.space/);
  });

  test('project cards: a card is a link only if it has a live URL, opening in a new tab', () => {
    const cards = [...html.matchAll(/<(a|article)\b[^>]*class="[^"]*\bproj\b[^"]*"[^>]*>/g)].map(m => m[0]);
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) {
      if (c.startsWith('<a')) {
        expect(c).toMatch(/href="https:\/\/[^"]+"/);
        expect(c).toContain('target="_blank"');
        expect(c).toMatch(/rel="[^"]*noopener/);
      } else {
        expect(c).not.toContain('href=');
      }
    }
    expect(html).toMatch(/<a\b[^>]*class="[^"]*\bproj\b[^"]*"[^>]*href="https:\/\/split\.rajatht\.me\/"/);
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

  // 2026-11-17: premium "R." favicon (Instrument Serif italic R + green dot), SVG with PNG fallbacks.
  test('favicon: linked in <head> and files are valid', () => {
    const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toContain('<link rel="icon" href="favicon.svg" type="image/svg+xml">');
    expect(head).toContain('<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">');
    expect(head).toContain('<link rel="apple-touch-icon" href="apple-touch-icon.png">');
    const svg = fs.readFileSync(path.join(root, 'favicon.svg'), 'utf8');
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/);
    expect(svg).toMatch(/<path class="fg" d="M[^"]{50,}"/);       // the R outline
    expect(svg).toContain('<circle class="dot"');                // the green dot
    expect(svg).toContain('prefers-color-scheme:dark');          // adapts to dark browser tabs
    expect(svg).not.toMatch(/<text|<script|href=/);              // pure shapes, no fonts/scripts
    const png = f => { const b = fs.readFileSync(path.join(root, f)); expect(b.slice(1, 4).toString()).toBe('PNG'); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
    expect(png('favicon-32.png')).toEqual([32, 32]);
    expect(png('apple-touch-icon.png')).toEqual([180, 180]);
  });
});
