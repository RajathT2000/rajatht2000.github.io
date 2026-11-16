# Portfolio site — project rules

Single-page portfolio (`index.html`), hosted on GitHub Pages:
- Live: https://rajatht2000.github.io
- Repo: https://github.com/RajathT2000/rajatht2000.github.io (push to `main` deploys)

## Tests

Playwright, in `tests/`. Runs 4 workers in parallel (`playwright.config.js`).

| Script | Files | Run after changing |
|---|---|---|
| `npm run test:unit` | `content.spec.js`, `agent-answers.unit.spec.js` (no browser, ~1s) | anything (always run) |
| `npm run test:agent` | `agent-answers.unit.spec.js`, `agent.spec.js` | Ask-me agent (KB, answers, chat UI), or any text the agent quotes |
| `npm run test:tour` | `tour.spec.js` | welcome tutorial, header, theme button, Ask-me avatar, contact section |
| `npm run test:projects` | `projects.spec.js` | Projects section / card styles (`.cert`, `.proj`) |
| `npm run test:motion` | `motion.spec.js` | Lenis, animations, reveals, hovers, section transitions, theme colours |
| `npm run test:site` | `site.spec.js` | loader, theme, nav/scroll, header, layout, section titles |
| `npm test` | everything (~2.5 min) | before `git push`, or when the user says "full test" |

A changed test file: run that file. Unsure which area: run the two most likely scripts.

## Rules (always follow)

1. After every update, run `npm run test:unit` plus only the scripts related to the changed area (table above), and fix every failure before replying.
1a. Run the full suite (`npm test`) only before `git push` or when the user says "full test".
1b. Keep tests fast: prefer unit tests (no browser) for logic and content; use browser tests only for real UI behaviour. Converting a browser test to a unit test is allowed; deleting a test is not.
2. When the user reports a mistake, fix it AND add a test that catches it, so it never returns. Log it under "Regression log" below.
3. Never delete, skip or weaken existing tests (no loosening assertions, no `.skip`/`.only`, no removing cases). If a test must change because the user changed a requirement, update it to the new requirement and say so.
4. Content rule: use only details the user has given; invent nothing.
5. Reply format per update: the changed code, then one line: `tests passed X/Y` (say which scripts ran).
6. Never push to GitHub (live site) on your own. After an update: run tests, show it in the local preview (http://localhost:5173), and push only when the user says to.

## Regression log

- 2026-11-16: "Tell me about your bachelor degree" got the intro answer ("about your" matched "about you"). Fixed with word boundaries; covered by `agent.spec.js` bachelor case.
- 2026-11-16: After loading/reloading, the page jumped to Education (browser restored scroll position / #hash). Fixed: always start at the top, nav clicks no longer add #hash. Covered by `site.spec.js` "starts at the top", "reload ... returns to the top", "nav clicks do not add a #hash".
- 2026-11-16: User asked to remove the circle following the cursor. Removed; covered by `content.spec.js` + `site.spec.js` "no cursor-follower circle".
- 2026-11-16: Tutorial step 3 said "tap my name to get to the top", but the header (name + menu) hides when scrolling down. Message now says to scroll up a little to bring it back. Covered by `tour.spec.js` "step 3 tells how to bring the header back" and `site.spec.js` header/name tests.
- 2026-11-16: Part of the "Projects" title was clipped while scrolling: the title reveal used an overflow:hidden mask with line-height 1 (cut the "j" descender), and the parallax moved the title inside that mask. Fixed: parallax moved to the wrapper, glyph padding added, title reveal is now a non-clipping fade-up. Covered by `site.spec.js` "section titles are never clipped while scrolling" (desktop + mobile).
- 2026-11-17: Contact section was an inverted band (white in dark mode, black in light). Now follows the page theme. Covered by `motion.spec.js` "contact follows the light/dark theme".
