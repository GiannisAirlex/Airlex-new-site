# Airlex Hellas website

Static site (plain HTML/CSS/JS, no build step), Greek language.

## Deployment
- **Live site: https://airlex-site.web.app** (Firebase Hosting, project `airlex-site`).
- ⚠️ This repo does NOT deploy anymore (automatic deploy removed 2026-11-22). The real site is the
  separate "airlex site 2.1" codebase. Never deploy this repo to airlex-site: it would overwrite the real site.
- `recovery/` holds the files of earlier Firebase versions (see recovery/_meta) — keep it.
- GitHub Pages (giannisairlex.github.io/Airlex-new-site) also builds from `main`, but it is not the official address.

## Structure
- `index.html`, `about.html`, `news.html`, `contact.html`, `products.html`
- `products-*.html`: category pages; `product-lg-*.html`: LG series pages
- `assets/css/style.css`, `assets/js/main.js`, `assets/img/`
- Header, footer and menu are duplicated in every HTML file: change them in all pages.

## Known open items
- Contact form does not send (`onsubmit="return false"` in contact.html).
- Social icons in the footer are `href="#"`.
- No product photos; news cards link back to news.html.

## Promo video
- `promo/` is a Remotion project for the Instagram Story video (1080×1920, 24s). It is excluded from the Firebase deploy.
- `cd promo && npm install && npm run render` → `promo/out/airlex-instagram-story.mp4` (`npm run studio` for live preview).
- `ClayStory` composition: claymorphic funny customer story (22s) with synthesized music/SFX.
  Regenerate audio with `python3 promo/scripts/make_clay_audio.py`, then
  `npx remotion render src/index.ts ClayStory out/airlex-clay-story.mp4` from `promo/`.
- Cache busting: every page loads `assets/css/style.css?v=…` and `assets/js/main.js?v=…`.
  When CSS/JS change, bump the `v=` value in all HTML files (e.g. to the short commit hash) so phones fetch the new files.

## Admin panel (/admin)
- `admin/` — Firebase Auth (email/password) + Firestore. Admins = documents in `admins/{uid}` (added by hand in the Firebase console).
- Collections: `news` (title, excerpt, date, published) shown on news.html and the homepage via `assets/js/site-data.js`
  (static HTML stays as fallback when the collection is empty); `messages` (contact form inbox).
- Security rules live in `firestore.rules`; publish them from the Firebase console (Firestore → Rules) or `firebase deploy --only firestore:rules`.
  The GitHub workflow deploys hosting only.
