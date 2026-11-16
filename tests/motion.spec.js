// Rebuild: Lenis smooth scrolling + scroll reveals, section transitions, hover effects.
const { test, expect } = require('@playwright/test');
const { load } = require('./helpers');

test.describe('lenis smooth scrolling', () => {
  test('Lenis is running', async ({ page }) => {
    await load(page);
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    expect(await page.evaluate(() => typeof window.Lenis === 'function' && !!window.__lenis)).toBe(true);
  });

  test('mouse wheel scrolls smoothly over several frames', async ({ page }) => {
    await load(page);
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 800);
    const samples = await page.evaluate(() => new Promise(res => {
      const ys = []; let n = 0;
      (function f() { ys.push(window.scrollY); if (++n < 30) requestAnimationFrame(f); else res(ys); })();
    }));
    const distinct = new Set(samples.map(Math.round));
    expect(distinct.size).toBeGreaterThan(4);           // eased, not one jump
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBeGreaterThan(300);
  });

  test('stopped while the loader runs and during the tutorial', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/lenis-stopped/);
    await expect(page.locator('body')).toHaveClass(/loaded/, { timeout: 8000 });
    await expect(page.locator('#tour')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('html')).toHaveClass(/lenis-stopped/);
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
  });

  test('chat log scrolls on its own (not hijacked by Lenis)', async ({ page }) => {
    await load(page);
    await expect(page.locator('#askLog')).toHaveAttribute('data-lenis-prevent', '');
  });

  test('reduced motion: no Lenis, native scrolling', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await load(page);
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
    await ctx.close();
  });
});

test.describe('animations', () => {
  test('section divider line draws in when a section enters', async ({ page }) => {
    await load(page);
    const sec = page.locator('#education');
    await sec.scrollIntoViewIfNeeded();
    await expect(sec).toHaveClass(/\bin\b/, { timeout: 3000 });
    await page.waitForTimeout(1600);
    const t = await sec.evaluate(el => getComputedStyle(el, '::before').transform);
    expect(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });

  test('cards wipe in, then lose the clip so 3D tilt still works', async ({ page }) => {
    await load(page);
    const card = page.locator('#education .cert').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveClass(/\bin\b/, { timeout: 3000 });
    await expect.poll(() => card.evaluate(el => getComputedStyle(el).clipPath), { timeout: 4000 }).toBe('none');
  });

  test('section transition: contact turns into an inverted band when in view', async ({ page }) => {
    await load(page);
    const before = await page.locator('#contact').evaluate(el => getComputedStyle(el).backgroundColor);
    await page.evaluate(() => window.__lenis.scrollTo(document.body.scrollHeight, { immediate: true }));
    await expect(page.locator('#contact')).toHaveClass(/flip/, { timeout: 3000 });
    await page.waitForTimeout(1000);
    const after = await page.locator('#contact').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(after).not.toBe(before);
    expect(after).toBe('rgb(21, 21, 21)');
    await expect(page.locator('#contact a[href="mailto:rajatht@icloud.com"]').first()).toBeVisible();
  });

  test('scroll velocity skews big headings, then settles back to 0', async ({ page }) => {
    await load(page);
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(120);
    const during = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--skew')) || 0);
    expect(Math.abs(during)).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() =>
      Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--skew')) || 0)), { timeout: 5000 }).toBeLessThan(0.05);
  });

  test('hover: education row shows an arrow', async ({ page }) => {
    await load(page);
    const row = page.locator('.edu').first();
    await row.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1300);
    const arrow = row.locator('.edu-ar');
    expect(Number(await arrow.evaluate(el => getComputedStyle(el).opacity))).toBe(0);
    await row.hover();
    await page.waitForTimeout(600);
    expect(Number(await arrow.evaluate(el => getComputedStyle(el).opacity))).toBe(1);
  });

  test('hover: skill word draws an underline', async ({ page }) => {
    await load(page);
    const w = page.locator('.sk b').first();
    await w.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await w.hover();
    await page.waitForTimeout(700);
    const t = await w.evaluate(el => getComputedStyle(el, '::after').transform);
    expect(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });
});
