// "Ask me" resume agent: visibility, chat UI, portfolio-only answers.
const { test, expect } = require('@playwright/test');
const { load, scrollPastAbout, ask } = require('./helpers');

const REFUSAL = /only answer questions about Rajath's portfolio/;

test.describe('ask-me agent: visibility', () => {
  test('hidden on load, before scrolling past About', async ({ page }) => {
    await load(page);
    await expect(page.locator('#ask')).not.toHaveClass(/show/);
    const op = await page.locator('#askBtn').evaluate(el => getComputedStyle(el).opacity);
    expect(Number(op)).toBe(0);
    await expect(page.locator('#askBtn')).toHaveAttribute('tabindex', '-1');
  });

  test('still hidden while About is on screen', async ({ page }) => {
    await load(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await expect(page.locator('#ask')).not.toHaveClass(/show/);
  });

  test('pops up after scrolling past About', async ({ page }) => {
    await load(page);
    await scrollPastAbout(page);
    await expect(page.locator('#askBtn')).toBeVisible();
    await expect(page.locator('#askBtn')).toHaveAttribute('tabindex', '0');
  });

  test('avatar has the waving hand', async ({ page }) => {
    await load(page);
    await expect(page.locator('.ask-wave')).toHaveText('👋');
  });
});

test.describe('ask-me agent: chat', () => {
  test.beforeEach(async ({ page }) => { await load(page); await scrollPastAbout(page); });

  test('opens with a greeting and closes with × and Escape', async ({ page }) => {
    await page.locator('#askBtn').click();
    await expect(page.locator('#ask')).toHaveClass(/open/);
    await expect(page.locator('#askLog .msg.bot').first()).toContainText("Hi, I'm Rajath");
    await page.locator('#askClose').click();
    await expect(page.locator('#ask')).not.toHaveClass(/open/);
    await page.locator('#askBtn').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#ask')).not.toHaveClass(/open/);
  });

  test('send button disabled until text typed', async ({ page }) => {
    await page.locator('#askBtn').click();
    await expect(page.locator('#askSend')).toBeDisabled();
    await page.locator('#askInput').fill('hi');
    await expect(page.locator('#askSend')).toBeEnabled();
  });

  test('suggestion chip asks the question', async ({ page }) => {
    await page.locator('#askBtn').click();
    await page.locator('#askChips button', { hasText: 'Hobbies' }).click();
    await expect(page.locator('#askLog .msg.bot').last()).toContainText('piano', { timeout: 4000 });
  });

  test('user text is shown as text, never as HTML', async ({ page }) => {
    await ask(page, '<img src=x onerror="window.__x=1"> hello');
    await expect(page.locator('#askLog img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__x)).toBeUndefined();
  });

  // Answer cases run as fast unit tests in agent-answers.unit.spec.js (same cases, no browser).
  // These browser tests check the full path: typed question -> chat bubble.
  const { cases, unrelated } = require('./agent-cases');
  test('end to end: answers and refusals appear in the chat', async ({ page }) => {
    const sample = [cases[0], cases.find(c => /email/.test(c[0])), cases.find(c => /Split/.test(c[0]))];
    for (const [q, re] of sample) expect(await ask(page, q)).toMatch(re);
    expect(await ask(page, unrelated[0])).toMatch(REFUSAL);
  });

  test('contact answer contains a working mailto link', async ({ page }) => {
    await ask(page, 'What is your email?');
    await expect(page.locator('#askLog .msg.bot').last().locator('a[href="mailto:rajatht@icloud.com"]')).toHaveCount(1);
  });
});

test.describe('ask-me agent: mobile', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('label hidden, panel fits the screen', async ({ page }) => {
    await load(page);
    await scrollPastAbout(page);
    await expect(page.locator('.ask-label')).toBeHidden();
    await page.locator('#askBtn').click();
    await page.waitForTimeout(700);
    const r = await page.locator('#askPanel').boundingBox();
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(375);
  });
});
