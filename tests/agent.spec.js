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

// 2026-11-17: real AI answers from /api/ask (server/server.js); built-in answers are the fallback.
test.describe('ask-me agent: AI mode', () => {
  test('shows the AI answer as safe text, linkifies URLs and emails', async ({ page }) => {
    await page.route('**/api/health', r => r.fulfill({ json: { ok: true, ai: true } }));
    await page.route('**/api/ask', r => r.fulfill({ json: { answer: 'See https://github.com/RajathT2000 or email rajatht@icloud.com <img src=x onerror="window.__y=1">' } }));
    await load(page); await scrollPastAbout(page);
    const a = await ask(page, 'Where is your code?');
    expect(a).toContain('See https://github.com/RajathT2000 or email rajatht@icloud.com');
    const bubble = page.locator('#askLog .msg.bot').last();
    await expect(bubble.locator('a[href="https://github.com/RajathT2000"][target="_blank"][rel="noopener"]')).toHaveCount(1);
    await expect(bubble.locator('a[href="mailto:rajatht@icloud.com"]')).toHaveCount(1);
    await expect(page.locator('#askLog img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__y)).toBeUndefined();
    await expect(page.locator('.ask-head small')).toContainText('AI');
  });

  test('sends the question with recent chat history', async ({ page }) => {
    const bodies = [];
    await page.route('**/api/ask', r => { bodies.push(r.request().postDataJSON()); r.fulfill({ json: { answer: 'Answer ' + bodies.length } }); });
    await load(page); await scrollPastAbout(page);
    await ask(page, 'first question');
    await ask(page, 'second question');
    expect(bodies[0]).toEqual({ question: 'first question', history: [] });
    expect(bodies[1].question).toBe('second question');
    expect(bodies[1].history).toEqual([{ role: 'user', content: 'first question' }, { role: 'assistant', content: 'Answer 1' }]);
  });

  test('falls back to built-in answers when the AI is unavailable', async ({ page }) => {
    await page.route('**/api/ask', r => r.fulfill({ status: 502, json: { error: 'AI is unavailable right now.' } }));
    await load(page); await scrollPastAbout(page);
    expect(await ask(page, 'What are your hobbies?')).toMatch(/athletics and playing the piano/);
  });

  test('rate-limited: shows the server message', async ({ page }) => {
    await page.route('**/api/ask', r => r.fulfill({ status: 429, json: { error: 'Too many questions. Please try again in a few minutes.' } }));
    await load(page); await scrollPastAbout(page);
    expect(await ask(page, 'hobbies')).toMatch(/Too many questions/);
  });
});
