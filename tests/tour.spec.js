// Welcome tutorial: starts after load, max 5 steps, any click advances, last click ends.
const { test, expect } = require('@playwright/test');

async function loadWithTour(page) {
  await page.goto('/');
  await expect(page.locator('body')).toHaveClass(/loaded/, { timeout: 8000 });
  await expect(page.locator('#tour')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#loader')).toHaveCount(0, { timeout: 5000 });
}

async function settle(page) { await page.waitForTimeout(900); }

/** Highlight box and target element overlap, and target is on screen. */
async function expectHighlights(page, selector) {
  const hole = await page.locator('.tour-hole').boundingBox();
  const t = await page.locator(selector).first().boundingBox();
  const vp = page.viewportSize();
  expect(t, selector).not.toBeNull();
  expect(t.width).toBeGreaterThan(0);
  expect(t.y + t.height / 2).toBeGreaterThan(0);
  expect(t.y + t.height / 2).toBeLessThan(vp.height);
  const cx = t.x + t.width / 2, cy = t.y + t.height / 2;
  expect(cx).toBeGreaterThanOrEqual(hole.x - 2);
  expect(cx).toBeLessThanOrEqual(hole.x + hole.width + 2);
  expect(cy).toBeGreaterThanOrEqual(hole.y - 2);
  expect(cy).toBeLessThanOrEqual(hole.y + hole.height + 2);
}

async function expectBoxOnScreen(page) {
  const b = await page.locator('.tour-box').boundingBox();
  const vp = page.viewportSize();
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.y).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(vp.width);
  expect(b.y + b.height).toBeLessThanOrEqual(vp.height);
}

test.describe('welcome tutorial', () => {
  test('starts automatically after the page finishes loading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#tour')).toHaveCount(0);
    await expect(page.locator('body')).toHaveClass(/loaded/, { timeout: 8000 });
    await expect(page.locator('#tour')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('body')).toHaveClass(/touring/);
  });

  test('has at most 5 steps', async ({ page }) => {
    await loadWithTour(page);
    const n = await page.locator('.tour-dots i').count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(5);
    await expect(page.locator('.tour-step')).toHaveText(/^01 \/ 0[1-5]$/);
  });

  test('step 1: highlights the light/dark button with the exact message', async ({ page }) => {
    await loadWithTour(page);
    await settle(page);
    await expect(page.locator('.tour-msg')).toHaveText('This switches light and dark mode.');
    await expectHighlights(page, '#theme');
    await expect(page.locator('.tour-ptr')).toBeVisible();
    await expectBoxOnScreen(page);
  });

  test('step 2: highlights the miniature me (Ask me agent) and explains it', async ({ page }) => {
    await loadWithTour(page);
    await page.locator('#tour').click();
    await settle(page);
    await expect(page.locator('.tour-step')).toHaveText(/^02 \//);
    await expect(page.locator('.tour-msg')).toContainText(/ask/i);
    await expect(page.locator('#askBtn')).toBeVisible();
    await expectHighlights(page, '#askBtn .ask-av');
    await expectBoxOnScreen(page);
  });

  test('any click advances; last click ends the tutorial and returns home', async ({ page }) => {
    await loadWithTour(page);
    const total = await page.locator('.tour-dots i').count();
    for (let i = 1; i <= total; i++) {
      await expect(page.locator('.tour-step')).toHaveText(new RegExp(`^0${i} /`));
      await settle(page);
      await expectBoxOnScreen(page);
      // click somewhere different each time: any click must advance
      await page.mouse.click(40 + i * 30, 200 + i * 40);
    }
    await expect(page.locator('#tour')).toHaveCount(0, { timeout: 3000 });
    await expect(page.locator('body')).not.toHaveClass(/touring/);
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBe(0);
  });

  test('clicking the highlighted theme button only advances (does not toggle)', async ({ page }) => {
    await loadWithTour(page);
    await settle(page);
    const t = await page.locator('#theme').boundingBox();
    await page.mouse.click(t.x + t.width / 2, t.y + t.height / 2);
    await expect(page.locator('.tour-step')).toHaveText(/^02 \//);
    expect(await page.locator('html').getAttribute('data-theme')).toBeNull();
  });

  test('every step highlights a visible element and keeps the box on screen', async ({ page }) => {
    await loadWithTour(page);
    const total = await page.locator('.tour-dots i').count();
    for (let i = 0; i < total; i++) {
      await settle(page);
      const hole = await page.locator('.tour-hole').boundingBox();
      expect(hole.width).toBeGreaterThan(10);
      expect(hole.height).toBeGreaterThan(10);
      await expectBoxOnScreen(page);
      await page.locator('#tour').click();
    }
  });

  test('Ask me agent is hidden again after the tutorial (until scrolling past About)', async ({ page }) => {
    await loadWithTour(page);
    await page.locator('#tour').click(); // to step 2 (agent shown)
    await settle(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#tour')).toHaveCount(0);
    await expect(page.locator('#ask')).not.toHaveClass(/show/);
  });

  test('Escape ends the tutorial early', async ({ page }) => {
    await loadWithTour(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#tour')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/touring/);
  });

  test('matches the theme: message box uses the site colours in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await loadWithTour(page);
    const bg = await page.locator('.tour-box').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(14, 14, 13)');
  });
});

test.describe('welcome tutorial: mobile', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('all steps fit the phone screen and highlight visible elements', async ({ page }) => {
    await loadWithTour(page);
    const total = await page.locator('.tour-dots i').count();
    for (let i = 0; i < total; i++) {
      await settle(page);
      await expectBoxOnScreen(page);
      const hole = await page.locator('.tour-hole').boundingBox();
      expect(hole.width).toBeGreaterThan(10);
      expect(hole.x).toBeGreaterThanOrEqual(-12);
      expect(hole.x + hole.width).toBeLessThanOrEqual(375 + 12);
      await page.locator('#tour').tap();
    }
    await expect(page.locator('#tour')).toHaveCount(0, { timeout: 3000 });
  });
});
