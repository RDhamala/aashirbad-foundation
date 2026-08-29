# Aashirbad Foundation Website

A modern, multi-page static site for the Aashirbad Foundation, a 501(c)(3) nonprofit providing technology scholarships for students in Nepal. The site highlights mission, programs, stories, impact data, and transparency resources with an accessible, mobile-first design.

## Tech Stack

- **HTML5** for semantic content structure across Home, About, Programs, Impact, Stories, Transparency, Donate, and Contact pages.
- **CSS3** (custom design system) for responsive layouts, accessibility helpers, gradient sections, and component styling.
- **Vanilla JavaScript** for lightweight interactivity: mobile navigation, scroll animations, donation amount selectors, and form feedback.

No build tools are required. The project can be served as pure static files. After editing content in `/data`, the shared partials in `/partials`, **or `css/style.css` / `js/script.js`**, run:

```bash
node scripts/build-content.js
```

The script regenerates the HTML snippets and refreshes the content-hashed asset filenames, keeping the site ready for static hosting.

### Content-hashed assets

`css/style.css` and `js/script.js` are the files you edit. The build step copies each one to a content-hashed name (for example `css/style.ef4b427e.css`) and rewrites every HTML reference to point at it.

The hash is derived from the file's bytes, so:

- Changing a file changes its hash, which changes its URL, so browsers fetch the new version **immediately** instead of waiting out a cache TTL.
- Leaving a file alone keeps its hash, so returning visitors keep using their cached copy.
- `_headers` serves the hashed files with `max-age=31536000, immutable`, which is only safe *because* the names are content-addressed.

Two things to know:

- **The hashed files are committed.** The host serves this repo directly with no build step, so the generated artifacts have to be in version control.
- **Run the build before committing** any CSS or JS change. If you skip it, the hashed copy and the HTML references will still point at the previous version and your change will not go live.

Re-running the build with no changes is a no-op, and stale hashed files from earlier builds are deleted automatically.

## Project Structure

```
Aashirbad Foundation/
├── data/
│   ├── programs.json
│   └── stories.json
├── scripts/
│   └── build-content.js
├── css/
│   └── style.css
├── js/
│   └── script.js
├── images/
│   ├── campaigns/
│   │   └── hero-students.(JPG|webp)
│   ├── programs/
│   │   └── stem-lab.(JPG|webp)
│   ├── stories/ (drop future story photos here)
│   └── logo.svg, favicon.svg
├── index.html
├── about.html
├── programs.html
├── impact.html
├── stories.html
├── transparency.html
├── donate.html
├── contact.html
├── sitemap.xml
└── robots.txt
```

## Local Development

1. Clone the repo and open the folder locally.
2. Serve the site with any static file server (recommended for proper relative paths):
    ```bash
    npx serve .
    ```
    or open `index.html` directly in your browser for a quick preview.
3. Update HTML/CSS/JS files as needed. When changing stories/programs, edit `/data/*.json` and rerun `node scripts/build-content.js`.

## Deployment

Because the site is static, it can be deployed easily via GitHub Pages, Cloudflare Pages, Netlify, or any static hosting provider.

- **GitHub Pages**: Point the Pages configuration to the `main` branch and `/` root; the existing `sitemap.xml` and `robots.txt` files will help search engines index content.
- **Cloudflare Pages**: Set the build command to `npm run build` (leave blank) and build output directory to `/` (root). Since there is no build step, deployment is immediate.

Remember to update DNS to map `aashirbafoundation.com` to your hosting provider and enforce HTTPS.

## Content & Asset Workflow

- **Stories & Programs:** Edit `data/stories.json` or `data/programs.json` to add/remove entries, then run `node scripts/build-content.js`. The script updates `stories.html`, `programs.html`, and the program preview cards on the home page.
- **Images:** Store new assets inside the relevant folder (`images/stories`, `images/programs`, `images/campaigns`). Include both `.webp` and `.jpg/.png` variants when possible for performance. Use descriptive filenames like `stories-sita-mentor.webp`.
- Maintain semantic headings and aria attributes to preserve the site’s WCAG-friendly structure.
- Keep mission statements and trust content consistent across pages (footer, about, story sections).
- For new interactive behavior, extend `js/script.js` in modular functions following the existing pattern.

## Contact

Questions or contributions? Reach out via `info@aashirbadfoundation.org` or open an issue/PR in this repository.
