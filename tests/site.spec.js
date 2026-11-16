// Browser behaviour: loader, theme, reveal, layout, errors.
const { test, expect } = require('@playwright/test');
const { load } = require('./helpers');

test.describe('site', () => {
  test('loads with no console or page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await load(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    expect(errors).toEqual([]);
  });

  test('loader shows first, then is removed and page unlocks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#loader')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/loaded/, { timeout: 8000 });
    await expect(page.locator('#loader')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('body')).not.toHaveClass(/loading/);
  });

  test('hero headline and name visible after load', async ({ page }) => {
    await load(page);
    await expect(page.locator('#heroTitle')).toContainText('Building the future');
    await expect(page.locator('#heroTitle')).toContainText('intelligent agents');
    await expect(page.locator('.hero-foot')).toContainText('Rajath Thaliyadath');
  });

  for (const scheme of ['light', 'dark']) {
    test(`default theme is light even when OS prefers ${scheme}`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: scheme });
      const page = await ctx.newPage();
      await load(page);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe('rgb(246, 244, 239)');
      await ctx.close();
    });
  }

  test('theme toggle switches to dark and persists on reload', async ({ page }) => {
    await load(page);
    await page.locator('#theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await load(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(14, 14, 13)');
  });

  test('sections reveal when scrolled into view', async ({ page }) => {
    await load(page);
    const cert = page.locator('.cert').first();
    await cert.scrollIntoViewIfNeeded();
    await expect(cert).toHaveClass(/\bin\b/, { timeout: 3000 });
  });

  test('nav links scroll to their sections', async ({ page }) => {
    await load(page);
    await page.locator('.nav-r a[href="#education"]').click();
    await expect.poll(() => page.evaluate(() =>
      Math.abs(document.getElementById('education').getBoundingClientRect().top)), { timeout: 4000 }).toBeLessThan(120);
  });

  test('mobile: no horizontal scroll', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await load(page);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over).toBeLessThanOrEqual(0);
    await ctx.close();
  });

  test('reduced motion: content still shows', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await load(page);
    await expect(page.locator('#heroTitle')).toBeVisible();
    await ctx.close();
  });

  // Regression 2026-11-16: page opened scrolled to Education instead of the top.
  for (const url of ['/', '/#education', '/#contact']) {
    test(`after loading, page starts at the top (home), url ${url}`, async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('body')).toHaveClass(/loaded/, { timeout: 8000 });
      await page.waitForTimeout(600);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      expect(await page.evaluate(() => location.hash)).toBe('');
    });
  }

  test('reload after scrolling to a section returns to the top', async ({ page }) => {
    await load(page);
    await page.locator('.nav-r a[href="#education"]').click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBeGreaterThan(200);
    await page.reload();
    await expect(page.locator('body')).toHaveClass(/loaded/, { timeout: 8000 });
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('nav clicks do not add a #hash to the URL', async ({ page }) => {
    await load(page);
    await page.locator('.nav-r a[href="#skills"]').click();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => location.hash)).toBe('');
  });

  // Regression 2026-11-16: user asked to remove the circle that followed the cursor.
  test('no cursor-follower circle', async ({ page }) => {
    await load(page);
    await page.mouse.move(300, 300);
    await page.mouse.move(400, 350);
    await expect(page.locator('#cursor')).toHaveCount(0);
  });

  // Regression 2026-11-16: tutorial said "tap my name" but the header (name + menu) hides when scrolling down.
  test('header hides on scroll down and comes back on scroll up', async ({ page }) => {
    await load(page);
    await page.mouse.wheel(0, 1200);
    await expect(page.locator('#hdr')).toHaveClass(/hide/, { timeout: 3000 });
    await page.mouse.wheel(0, -200);
    await expect(page.locator('#hdr')).not.toHaveClass(/hide/, { timeout: 3000 });
    await expect(page.locator('.mark')).toBeInViewport();
  });

  test('clicking my name returns to the top', async ({ page }) => {
    await load(page);
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 3000 }).toBe(1500);
    await page.waitForTimeout(200);
    await page.mouse.wheel(0, -100);
    await expect(page.locator('#hdr')).not.toHaveClass(/hide/, { timeout: 3000 });
    await page.locator('.mark').click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBe(0);
  });

  // Regression 2026-11-16: part of the "Projects" title was clipped while scrolling
  // (overflow:hidden reveal mask + line-height 1 cut the "j" descender, and parallax moved the title out of its mask).
  for (const vp of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
    test(`section titles are never clipped while scrolling (${vp.width}px)`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      await load(page);
      const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const problems = [];
      for (let y = 0; y <= max; y += 90) {
        await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y);
        await page.waitForTimeout(60);
        const bad = await page.evaluate(() => {
          const out = [];
          document.querySelectorAll('.sh h2').forEach(h => {
            const sec = h.closest('section').getBoundingClientRect();
            if (sec.bottom < 0 || sec.top > innerHeight) return; // section not on screen
            if (!h.closest('.mask, .mask.in') || !h.closest('.mask').classList.contains('in')) return; // not revealed yet
            const range = document.createRange(); range.selectNodeContents(h);
            const t = range.getBoundingClientRect(); // full glyph box incl. ascenders/descenders
            for (let a = h.parentElement; a && a !== document.body; a = a.parentElement) {
              const cs = getComputedStyle(a);
              if (cs.overflow === 'visible' && cs.overflowX === 'visible' && cs.overflowY === 'visible' && cs.clipPath === 'none') continue;
              const r = a.getBoundingClientRect();
              if (t.top < r.top - 0.5 || t.bottom > r.bottom + 0.5 || t.left < r.left - 0.5 || t.right > r.right + 0.5) {
                out.push(`${h.textContent} clipped by .${a.className} (text ${t.top.toFixed(1)}-${t.bottom.toFixed(1)}, box ${r.top.toFixed(1)}-${r.bottom.toFixed(1)})`);
              }
            }
          });
          return out;
        });
        bad.forEach(b => problems.push(`scrollY=${y}: ${b}`));
      }
      expect(problems).toEqual([]);
      await ctx.close();
    });
  }
});
