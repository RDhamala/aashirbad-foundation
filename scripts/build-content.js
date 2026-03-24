#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

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
            const metrics = story.metrics
                .map((item) => `                                <li>${item}</li>`)
                .join('\n');
            return `                    <article class="story-card fade-in">
                        <div class="story-media">
                            <img src="${story.image.src}" alt="${story.image.alt}" loading="lazy" width="${story.image.width}" height="${story.image.height}">
                            <span class="story-tag">${story.tag}</span>
                        </div>
                        <div class="story-content">
                            <h3>${story.title}</h3>
                            <p>${story.summary}</p>
                            <blockquote class="story-quote">“${story.quote}”</blockquote>
                            <ul class="story-meta">
${metrics}
                            </ul>
                        </div>
                    </article>`;
        })
        .join('\n');

    return `                <div class="stories-grid">
${cards}
                </div>`;
};

const renderProgramImage = (image) => {
    if (image.webp) {
        return `                        <picture>
                            <source srcset="${image.webp}" type="image/webp">
                            <img src="${image.fallback}" alt="${image.alt}" loading="lazy" width="${image.width}" height="${image.height}">
                        </picture>`;
    }
    return `                        <img src="${image.fallback}" alt="${image.alt}" loading="lazy" width="${image.width}" height="${image.height}">`;
};

const renderPrograms = () => {
    const cards = programs
        .map((program) => {
            const bullets = program.bullets
                .map((item) => `                                <li>${item}</li>`)
                .join('\n');
            return `                    <article class="program-card fade-in">
${renderProgramImage(program.image)}
                        <div class="program-body">
                            <h3>${program.title}</h3>
                            <p>${program.description}</p>
                            <ul>
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

const renderProgramPreview = () => {
    return programs
        .slice(0, 3)
        .map(
            (program) => `                    <article class="info-card fade-in">
                        <h3>${program.title}</h3>
                        <p>${program.teaser}</p>
                        <a class="text-link" href="programs.html">View details</a>
                    </article>`
        )
        .join('\n');
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
    const allPages = [
        'index.html',
        'about.html',
        'programs.html',
        'impact.html',
        'stories.html',
        'transparency.html',
        'donate.html',
        'contact.html',
        'resources.html'
    ];
    const ctaPages = [
        'index.html',
        'about.html',
        'impact.html',
        'transparency.html',
        'donate.html',
        'contact.html',
        'resources.html'
    ];

    allPages.forEach((page) => {
        replaceBlock(page, 'HEADER', header, '    ');
        replaceBlock(page, 'FOOTER', footer, '    ');
    });

    ctaPages.forEach((page) => {
        replaceBlock(page, 'CTA', cta, '    ');
    });
};

try {
    applyPartials();
    replaceBlock('stories.html', 'STORIES', renderStories(), '                ');
    replaceBlock('programs.html', 'PROGRAMS', renderPrograms(), '                ');
    replaceBlock('index.html', 'PROGRAMS-PREVIEW', renderProgramPreview(), '                    ');
    console.log('Content sections updated from data files and partials.');
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
