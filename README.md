# HQMC ON-LINE CV SYSTEM (KKIMCV1)

A static HTML/CSS/JS CV / portfolio template styled as an **IBM 3270 / CICS-style green-screen terminal**, built for Keoni Kim — GS-13 federal IT specialist / data analyst at HQMC M&RA. No framework, no build step, no dependencies, no persistence.

## What you get

- A CRT bezel with phosphor-green (default), amber, and white themes.
- Scanlines, vignette, and an ambient flicker that respect `prefers-reduced-motion`.
- A 24-row layout: banner, screen body, command line (`===>`), status/error line, PF-key footer.
- BMS-style field attributes via CSS classes: protected, unprotected, bright, reverse-video, numeric, MDT-changed, error.
- Multiple linked screens:
  - `MAIN` — main menu / logon banner with inline SVG logo
  - `PROF` — profile summary
  - `SKIL` — skills matrix with ASCII bar meters
  - `PROJ` — project inventory
  - `PRJ1` … `PRJ4` — per-project detail screens
  - `SYST` — systems & admin experience
  - `DODX` — DoD / personnel-data context (MCTFS, M&RA, clearance posture)
  - `EDUC` — education & certifications
  - `CONT` — contact / "transmit" form (no network calls)
  - `HELP` — PF-key cheat sheet
  - `BYE` — sign-off screen
- Keyboard:
  - Arrow keys move the highlighted (reverse-video) menu row.
  - **Enter** activates the highlighted row, or submits the command line.
  - Type a digit/letter to jump to a menu option, or type a TRANID like `PROF` on the command line.
  - **Esc** = back. **F1** Help. **F3** Exit/back. **F7/F8** page up/down. **F12** return to MAIN.
- Mouse: every menu row and PF key is also clickable.
- Hash routing (`#/PROF`, `#/PRJ2`, …) so screens are linkable. **No** `localStorage` / `sessionStorage` / cookies.

## Run it

It's a static project. Either:

1. **Open `index.html` directly** — works in any modern browser.
2. **Local static server** (recommended for clean hash routing):

   ```bash
   cd 3270-cics-cv-template
   python -m http.server 8000
   # then visit http://localhost:8000/
   ```

   Or with Node:

   ```bash
   npx serve .          # http://localhost:3000
   # or
   npx http-server -p 8000
   ```

3. **Deploy as a static site.** Upload `index.html`, `styles.css`, `app.js`, and `README.md` to any static host (S3, GitHub Pages, Netlify, Cloudflare Pages, etc.). No environment variables, no build.

## Customize

Almost everything content-related lives in `app.js`:

- `PROFILE`     — name, title, command, location, clearance, email, summary.
- `SKILLS`      — grouped list of `[name, percent]` rows for the skills matrix.
- `PROJECTS`    — array of projects; each one auto-generates a `PRJ<N>` detail screen.
- `SYSTEMS`     — systems / admin experience rows.
- `DOD_CONTEXT` — DoD / personnel-data narrative key/values.
- `EDUCATION`   — degrees, certs, training.
- `PF_KEYS`     — help-screen reference table.

Adding a new screen:

```js
SCREENS.AWRD = {
  tranid: "AWRD",
  title: "AWARDS",
  render(ctx) {
    return /* an HTMLElement built with el(...) */;
  },
};
```

Then either link it from another screen's `options` array (so it shows up in a menu), or just type `AWRD` on the command line.

### Theme

- Click **THEME** in the PF footer (or type `THEME` on the command line) to cycle **green → amber → white**.
- Or load with `?theme=amber` / `?theme=white`.
- Variables live at the top of `styles.css` under `:root`, `[data-theme="amber"]`, `[data-theme="white"]`. Adjust phosphor color, glow, and background per theme there.

### Effects

- Type `EFFECTS` on the command line (or set `body[data-effects="off"]`) to suppress scanlines/flicker/vignette.
- `prefers-reduced-motion: reduce` automatically turns effects off.

## Accessibility

- Skip link to the screen region.
- Semantic landmarks (`<main>`, `<header>`, `<footer>`, `<nav>`).
- Focus-visible outlines on menu rows and PF buttons.
- All interactive elements are reachable by Tab; no keyboard trap (typing inside form fields behaves normally; F-keys still work everywhere).
- Color choices target WCAG AA in green and amber themes; the white theme exists as a high-contrast fallback.
- Animation is disabled under `prefers-reduced-motion`.

## File map

```
3270-cics-cv-template/
├── index.html       # Terminal shell, banner/command/status/PF rows, inline SVG logo template
├── styles.css       # CRT bezel, scanlines, themes, BMS-like attribute classes, screen primitives
├── app.js           # SCREENS data, renderer, router, keyboard handling, theme cycling
└── README.md        # You are here
```

## Design / content notes

- The look is "tasteful 3270," not gimmick. Scanlines are subtle, the flicker is rare, and the body sticks to a strict mono grid with a ~24-row feel. Glow is kept low so text remains readable.
- The default palette is x3270-style phosphor green; amber matches the classic IBM 3279 amber tube; white is for users who want maximum legibility.
- Content is tailored from Keoni Kim's public LinkedIn profile: MISSO-09 supervision, data engineering / analytics architecture, MCTFS and TFDW work, PEBD validation, Cognos / Databricks / PySpark, IPAC leadership, audit analytics, personnel administration, and listed data-analytics certifications. Review `app.js` before publishing publicly.
- The inline SVG logo is a small terminal mark with a wordmark and is rendered on the MAIN screen. Edit the `<template id="svg-logo">` block in `index.html` to change it.

## License / use

Template is provided as-is. No tracking, no third-party fonts, no analytics.
