// Requirement change 2026-11-17: the user asked to remove the voice intro ("Listen to my intro") from About.
// These tests replace the old voice-player tests and make sure it stays removed.
const { test, expect } = require('@playwright/test');
const { load } = require('./helpers');

test.describe('voice intro removed', () => {
  test('About has no voice player and never speaks', async ({ page }) => {
    await page.addInitScript(() => {
      window.__spoken = 0;
      if (window.speechSynthesis) window.speechSynthesis.speak = () => { window.__spoken++; };
    });
    await load(page);
    await expect(page.locator('#voice, #voiceBtn, #voiceAudio')).toHaveCount(0);
    await expect(page.locator('#about')).not.toContainText('Listen to my intro');
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__spoken)).toBe(0);
  });

  test('About text starts the section again', async ({ page }) => {
    await load(page);
    const first = await page.locator('#about .body > div:last-child > *').first().getAttribute('id');
    expect(first).toBe('aboutText');
  });
});
