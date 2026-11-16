// Projects: Split card (matches existing cards, full text on hover/focus/tap).
const { test, expect } = require('@playwright/test');
const { load } = require('./helpers');

const SHORT = 'Shared expense tracker for groups, trips, and households.';
const FULL = 'Split is a live web app for sharing bills fairly. Create a group, add members, log expenses with equal or custom splits, track who owes whom, and settle up. Built with Django and PostgreSQL, it supports recurring expenses and shareable edit links—no account login required.';
const opacity = loc => loc.evaluate(el => Number(getComputedStyle(el).opacity));

test.describe('projects: Split', () => {
  test('card shows title and short description; full text hidden until hover', async ({ page }) => {
    await load(page);
    const card = page.locator('#projects .proj', { hasText: 'Split' });
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('h4')).toHaveText('Split');
    await expect(card.locator('.proj-short')).toHaveText(SHORT);
    await page.waitForTimeout(1200);
    expect(await opacity(card.locator('.proj-short'))).toBe(1);
    expect(await opacity(card.locator('.proj-full'))).toBe(0);
  });

  test('hover shows the full text', async ({ page }) => {
    await load(page);
    const card = page.locator('#projects .proj').first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await card.hover();
    await page.waitForTimeout(700);
    await expect(card.locator('.proj-full')).toHaveText(FULL);
    expect(await opacity(card.locator('.proj-full'))).toBe(1);
    expect(await opacity(card.locator('.proj-short'))).toBe(0);
    await page.mouse.move(5, 5);
    await page.waitForTimeout(700);
    expect(await opacity(card.locator('.proj-full'))).toBe(0);
  });

  test('keyboard focus also shows the full text', async ({ page }) => {
    await load(page);
    const card = page.locator('#projects .proj').first();
    await card.focus();
    await page.waitForTimeout(700);
    expect(await opacity(card.locator('.proj-full'))).toBe(1);
  });

  test('matches the existing cards (same style as certification cards)', async ({ page }) => {
    await load(page);
    const style = sel => page.locator(sel).first().evaluate(el => {
      const c = getComputedStyle(el);
      return [c.borderTopWidth, c.borderTopStyle, c.borderTopColor, c.borderRadius, c.backgroundColor, c.paddingTop];
    });
    expect(await style('#projects .proj')).toEqual(await style('#education .cert'));
    const font = sel => page.locator(sel).first().evaluate(el => getComputedStyle(el).fontFamily);
    expect(await font('#projects .proj h4')).toEqual(await font('#education .cert h4'));
  });
});

test.describe('projects: Split link', () => {
  test.beforeEach(async ({ context }) => {
    await context.route('https://split.rajatht.me/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Split</title>ok' }));
  });

  test('clicking the card opens https://split.rajatht.me/ in a new tab', async ({ page, context }) => {
    await load(page);
    const card = page.locator('#projects .proj', { hasText: 'Split' });
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const [tab] = await Promise.all([context.waitForEvent('page'), card.click()]);
    await tab.waitForLoadState();
    expect(tab.url()).toBe('https://split.rajatht.me/');
    expect(page.url()).toMatch(/127\.0\.0\.1:5174/); // portfolio stays open
  });

  test('keyboard: Enter on the focused card opens the live site', async ({ page, context }) => {
    await load(page);
    const card = page.locator('#projects .proj').first();
    await card.focus();
    const [tab] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Enter')]);
    await tab.waitForLoadState();
    expect(tab.url()).toBe('https://split.rajatht.me/');
  });

  test('card shows it can be opened (pointer cursor + open hint)', async ({ page }) => {
    await load(page);
    const card = page.locator('#projects .proj').first();
    expect(await card.evaluate(el => getComputedStyle(el).cursor)).toBe('pointer');
    await expect(card.locator('.proj-go')).toHaveText('↗');
  });
});

test.describe('projects: Split on mobile', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('tap shows the full text; card fits the screen', async ({ page, context }) => {
    await context.route('https://split.rajatht.me/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }));
    await load(page);
    const card = page.locator('#projects .proj').first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const b = await card.boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(375);
    await card.tap();
    await page.waitForTimeout(700);
    expect(await opacity(card.locator('.proj-full'))).toBe(1);
  });
});
