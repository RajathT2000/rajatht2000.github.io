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
});
