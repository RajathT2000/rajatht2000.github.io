# Portfolio site — project rules

Single-page portfolio (`index.html`), hosted on GitHub Pages:
- Live: https://rajatht2000.github.io
- Repo: https://github.com/RajathT2000/rajatht2000.github.io (push to `main` deploys)

## Tests

Regression suite: Playwright, in `tests/`.

```bash
npm test
```

- `tests/content.spec.js`: static checks on `index.html` (content, links, safety).
- `tests/site.spec.js`: browser behaviour (loader, theme, reveal, layout, errors).
- `tests/agent.spec.js`: "Ask me" agent (visibility, chat UI, answers, refusals).
- `tests/tour.spec.js`: welcome tutorial (starts after load, max 5 steps, any click advances, last click ends, mobile fit). `load()` in `tests/helpers.js` closes the tutorial with Escape before other tests run.

## Rules (always follow)

1. After every update the user requests, run all tests (`npm test`) and fix every failure before replying.
2. When the user reports a mistake, fix it AND add a test that catches it, so it never returns. Log it under "Regression log" below.
3. Never delete, skip or weaken existing tests (no loosening assertions, no `.skip`/`.only`, no removing cases). If a test must change because the user changed a requirement, update it to the new requirement and say so.
4. Content rule: use only details the user has given; invent nothing.
5. Reply format per update: the changed code, then one line: `tests passed X/Y`.

## Regression log

- 2026-11-16: "Tell me about your bachelor degree" got the intro answer ("about your" matched "about you"). Fixed with word boundaries; covered by `agent.spec.js` bachelor case.
- 2026-11-16: After loading/reloading, the page jumped to Education (browser restored scroll position / #hash). Fixed: always start at the top, nav clicks no longer add #hash. Covered by `site.spec.js` "starts at the top", "reload ... returns to the top", "nav clicks do not add a #hash".
- 2026-11-16: User asked to remove the circle following the cursor. Removed; covered by `content.spec.js` + `site.spec.js` "no cursor-follower circle".
