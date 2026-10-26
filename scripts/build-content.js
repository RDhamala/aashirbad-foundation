#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');

const readJson = (fileName) => {
    const filePath = path.join(dataDir, fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const stories = readJson('stories.json');
const programs = readJson('programs.json');

const renderStories = () => {
    const cards = stories
        .map((story) => {
            // quote and metrics are optional: only render a blockquote for a real,
            // attributable quote, and only render the meta list when facts exist.
            const quoteBlock = story.quote
                ? `\n                            <blockquote class="story-quote">“${story.quote}”</blockquote>`
                : '';
            const metricsBlock = story.metrics && story.metrics.length
                ? `\n                            <ul class="story-meta">\n${story.metrics
                      .map((item) => `                                <li>${item}</li>`)
                      .join('\n')}\n                            </ul>`
                : '';
            return `                    <article class="story-card fade-in">
                        <div class="story-media">
                            <img src="${story.image.src}" alt="${story.image.alt}" loading="lazy" width="${story.image.width}" height="${story.image.height}">
                            <span class="story-tag">${story.tag}</span>
                        </div>
                        <div class="story-content">
                            <h3>${story.title}</h3>
                            <p>${story.summary}</p>${quoteBlock}${metricsBlock}
                        </div>
                    </article>`;
        })
        .join('\n');

    return `                <div class="stories-grid">
${cards}
                </div>`;
};

const renderProgramImage = (image) => {
    // A <picture> is only worth emitting when there is a real fallback to fall
    // back to. Without this guard, a webp-only entry rendered src="undefined".
    if (image.webp && image.fallback) {
        return `                        <picture>
                            <source srcset="${image.webp}" type="image/webp">
                            <img src="${image.fallback}" alt="${image.alt}" loading="lazy" width="${image.width}" height="${image.height}">
                        </picture>`;
    }
    const src = image.webp || image.fallback;
    return `                        <img src="${src}" alt="${image.alt}" loading="lazy" width="${image.width}" height="${image.height}">`;
};

const renderPrograms = () => {
    const cards = programs
        .map((program) => {
            const bullets = program.bullets
                .map((item) => `                                <li>${item}</li>`)
                .join('\n');
            const idAttr = program.id ? ` id="${program.id}"` : '';
            return `                    <article class="program-card fade-in"${idAttr}>
${renderProgramImage(program.image)}
                        <div class="program-body">
                            <h3>${program.title}</h3>
                            <p>${program.description}</p>
                            <ul class="program-bullets">
${bullets}
                            </ul>
                            <p class="impact">${program.impact}</p>
                        </div>
                    </article>`;
        })
        .join('\n');

    return `                <div class="program-grid">
${cards}
                </div>`;
};

const replaceBlock = (fileName, marker, content, indent = '') => {
    const filePath = path.join(root, fileName);
    const start = `<!-- ${marker}:START -->`;
    const end = `<!-- ${marker}:END -->`;
    const file = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(`(${start})([\\s\\S]*?)(${end})`, 'm');
    if (!regex.test(file)) {
        throw new Error(`Markers not found in ${fileName}`);
    }
    const updated = file.replace(regex, `$1\n${content}\n${indent}${end}`);
    fs.writeFileSync(filePath, updated);
};

const readPartial = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8').trim();

const indentLines = (content, indent) =>
    content
        .split('\n')
        .map((line) => `${indent}${line}`)
        .join('\n');

const applyPartials = () => {
    const header = indentLines(readPartial('partials/header.html'), '    ');
    const cta = indentLines(readPartial('partials/cta.html'), '    ');
    const footer = indentLines(readPartial('partials/footer.html'), '    ');
    // Temporary campaign banner. To retire the campaign, delete the
    // CAMPAIGN markers from the pages below and this block.
    const campaign = indentLines(readPartial('partials/campaign-banner.html'), '        ');
    const allPages = [
        'index.html',
        'about.html',
        'programs.html',
        'impact.html',
        'donate.html',
        'thank-you.html',
        'privacy.html',
        'flood-education-recovery.html',
        '404.html'
    ];
    const ctaPages = [
        'index.html',
        'about.html',
        'programs.html',
        'impact.html',
        'donate.html',
        'thank-you.html',
        'privacy.html',
        '404.html'
    ];

    allPages.forEach((page) => {
        replaceBlock(page, 'HEADER', header, '    ');
        replaceBlock(page, 'FOOTER', footer, '    ');
    });

    ctaPages.forEach((page) => {
        replaceBlock(page, 'CTA', cta, '    ');
    });

    // Every page except the campaign page itself.
    allPages
        .filter((page) => page !== 'flood-education-recovery.html')
        .forEach((page) => {
            replaceBlock(page, 'CAMPAIGN', campaign, '        ');
        });
};

/* ---------------------------------------------------------
   Content-hashed assets
   ---------------------------------------------------------
   style.css -> style.<hash>.css, script.js -> script.<hash>.js,
   with every HTML reference rewritten to match. The hash changes
   only when the file's bytes change, so a deploy invalidates
   caches instantly and unchanged assets stay cached.

   css/style.css and js/script.js remain the editable sources.
   The hashed copies are build output and are committed, because
   the host serves this repo directly with no build step.
   --------------------------------------------------------- */

const HASHED_ASSETS = [
    { dir: 'css', base: 'style', ext: 'css' },
    { dir: 'css', base: 'refinements', ext: 'css' },
    { dir: 'js', base: 'script', ext: 'js' }
];

// Photographs are content-hashed for the same reason the CSS and JS are.
// Replacing an image's bytes under a stable filename leaves the old copy in
// browser and CDN caches for the length of its max-age, and Cloudflare will
// serve the stale object from some edge nodes and the new one from others,
// so the same visitor can see either. Hashing the filename makes every
// replacement a new URL, which no cache can answer with the old bytes.
const IMAGE_DIRS = ['images', 'images/campaigns', 'images/programs', 'images/stories', 'images/share'];
const IMAGE_EXTS = /\.(webp|jpe?g|png)$/i;
const HASHED_RE = /\.[0-9a-f]{8}\.(webp|jpe?g|png)$/i;

const collectImages = () =>
    IMAGE_DIRS.flatMap((dir) => {
        const abs = path.join(root, dir);
        if (!fs.existsSync(abs)) return [];
        return fs
            .readdirSync(abs)
            .filter((f) => IMAGE_EXTS.test(f) && !HASHED_RE.test(f))
            .map((f) => {
                const ext = f.slice(f.lastIndexOf('.') + 1);
                return { dir, base: f.slice(0, f.lastIndexOf('.')), ext };
            });
    });

const hashContent = (buf) =>
    crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);

// Hash one or more assets, write the hashed copies, drop stale ones, and
// return the rewrite rules for their references.
const hashAssets = (assets, { write = true } = {}) =>
    assets.map(({ dir, base, ext }) => {
        const source = fs.readFileSync(path.join(root, dir, `${base}.${ext}`));
        const hash = hashContent(source);
        const hashedName = `${base}.${hash}.${ext}`;
        const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (write) {
            fs.readdirSync(path.join(root, dir))
                .filter((f) => new RegExp(`^${escaped}\\.[0-9a-f]{8}\\.${ext}$`).test(f) && f !== hashedName)
                .forEach((f) => fs.unlinkSync(path.join(root, dir, f)));
            fs.writeFileSync(path.join(root, dir, hashedName), source);
        }
        return {
            pattern: new RegExp(`${dir}/${escaped}(\\.[0-9a-f]{8})?\\.${ext}`, 'g'),
            replacement: `${dir}/${hashedName}`,
            label: `${dir}/${hashedName}`
        };
    });

const buildHashedAssets = ({ checkOnly = false } = {}) => {
    const pages = fs
        .readdirSync(root)
        .filter((f) => f.endsWith('.html'));

    const rewrites = [];

    // Images first: the stylesheet references them, so its own hash has to be
    // computed after those references have been rewritten.
    const images = collectImages();
    if (checkOnly) {
        rewrites.push(...hashAssets(images, { write: false }));
    } else {
        const imageRewrites = hashAssets(images);
        const cssPath = path.join(root, 'css', 'style.css');
        const before = fs.readFileSync(cssPath, 'utf8');
        let after = before;
        imageRewrites.forEach(({ pattern, replacement }) => {
            after = after.replace(pattern, replacement);
        });
        if (after !== before) fs.writeFileSync(cssPath, after);
        rewrites.push(...imageRewrites);
    }

    HASHED_ASSETS.forEach(({ dir, base, ext }) => {
        const sourcePath = path.join(root, dir, `${base}.${ext}`);
        const source = fs.readFileSync(sourcePath);
        const hash = hashContent(source);
        const hashedName = `${base}.${hash}.${ext}`;

        if (!checkOnly) {
            // Drop hashed builds from previous runs so stale copies do not pile up.
            fs.readdirSync(path.join(root, dir))
                .filter((f) => {
                    const stale = new RegExp(`^${base}\\.[0-9a-f]{8}\\.${ext}$`);
                    return stale.test(f) && f !== hashedName;
                })
                .forEach((f) => fs.unlinkSync(path.join(root, dir, f)));

            fs.writeFileSync(path.join(root, dir, hashedName), source);
        }

        // Matches the plain reference and any previously hashed one, so
        // rebuilds are idempotent.
        rewrites.push({
            pattern: new RegExp(`${dir}/${base}(\\.[0-9a-f]{8})?\\.${ext}`, 'g'),
            replacement: `${dir}/${hashedName}`,
            label: `${dir}/${hashedName}`
        });
    });

    let touched = 0;
    const stalePages = [];
    pages.forEach((page) => {
        const filePath = path.join(root, page);
        const before = fs.readFileSync(filePath, 'utf8');
        let after = before;
        rewrites.forEach(({ pattern, replacement }) => {
            after = after.replace(pattern, replacement);
        });
        if (after !== before) {
            if (checkOnly) {
                stalePages.push(page);
            } else {
                fs.writeFileSync(filePath, after);
                touched += 1;
            }
        }
    });

    // In check mode also confirm the hashed artifact actually exists on disk.
    const missing = checkOnly
        ? HASHED_ASSETS.map(({ dir, base, ext }) => {
              const source = fs.readFileSync(path.join(root, dir, `${base}.${ext}`));
              const name = `${base}.${hashContent(source)}.${ext}`;
              return fs.existsSync(path.join(root, dir, name)) ? null : `${dir}/${name}`;
          }).filter(Boolean)
        : [];

    return { assets: rewrites.map((r) => r.label), touched, stalePages, missing };
};

const checkOnly = process.argv.includes('--check');

try {
    if (checkOnly) {
        // Read-only guard: fails if css/js were edited without rebuilding,
        // which would silently ship the previous asset.
        const { stalePages, missing } = buildHashedAssets({ checkOnly: true });
        if (stalePages.length || missing.length) {
            if (missing.length) {
                console.error(`Missing hashed asset(s): ${missing.join(', ')}`);
            }
            if (stalePages.length) {
                console.error(`Stale asset references in: ${stalePages.join(', ')}`);
            }
            console.error('Run `node scripts/build-content.js` and commit the result.');
            process.exit(1);
        }
        console.log('Asset hashes are up to date.');
    } else {
        applyPartials();
        replaceBlock('impact.html', 'STORIES', renderStories(), '                ');
        replaceBlock('programs.html', 'PROGRAMS', renderPrograms(), '                ');
        console.log('Content sections updated from data files and partials.');
        const { assets, touched } = buildHashedAssets();
        console.log(`Hashed assets: ${assets.join(', ')} (${touched} page(s) updated).`);
    }
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
