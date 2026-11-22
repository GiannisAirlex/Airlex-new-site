# Airlex Hellas website

Static site (plain HTML/CSS/JS, no build step), Greek language.

## Deployment
- **Live site: https://airlex-site.web.app** (Firebase Hosting, project `airlex-site`).
- Every push to `main` deploys automatically via `.github/workflows/firebase-deploy.yml`.
  It needs the GitHub secret `FIREBASE_SERVICE_ACCOUNT_AIRLEX_SITE`.
- Changes are not live until they are merged into `main`.
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
