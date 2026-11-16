const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/** Open the page and wait for the loader to finish. */
async function load(page) {
  await page.goto('/');
  await expect(page.locator('body')).toHaveClass(/loaded/, { timeout: 8000 });
  await expect(page.locator('#loader')).toHaveCount(0, { timeout: 5000 });
}

/** Scroll past the About section so the Ask-me agent appears. */
async function scrollPastAbout(page) {
  await page.evaluate(() => {
    const a = document.getElementById('about');
    window.scrollTo(0, a.offsetTop + a.offsetHeight + 80);
  });
  await expect(page.locator('#ask')).toHaveClass(/show/, { timeout: 4000 });
}

/** Open the chat and ask a question; returns the bot's reply text. */
async function ask(page, question) {
  if (!(await page.locator('#ask').getAttribute('class')).includes('open')) {
    await page.locator('#askBtn').click();
  }
  const bots = page.locator('#askLog .msg.bot:not(:has(.typing))');
  const before = await bots.count();
  await page.locator('#askInput').fill(question);
  await page.locator('#askSend').click();
  await expect(bots).toHaveCount(before + 1, { timeout: 4000 });
  return (await bots.last().textContent()).trim();
}

module.exports = { html, load, scrollPastAbout, ask };
