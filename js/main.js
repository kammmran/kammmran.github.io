// Projects page: builds a grouped index from data/index.json and shows one
// project at a time. Each project is addressable as projects.html#<slug>.

const CATEGORY_ORDER = ['Research & Engineering', 'Software & Tools', 'Games', 'Ventures & Outreach'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function renderMarkdown(md) {
    const html = marked.parse ? marked.parse(md) : md;
    // Markdown files live in data/projects/, but the page is at site root,
    // so rewrite relative media/ references to resolve correctly.
    return html
        .replace(/(<img[^>]+src=)"(?!https?:|\/|data:)(media\/[^"]+)"/g,
                 '$1"data/projects/$2"')
        .replace(/(<a[^>]+href=)"(?!https?:|\/|#|mailto:)(media\/[^"]+)"/g,
                 '$1"data/projects/$2"')
        // All projects are rendered up front; only load videos when shown.
        .replace(/<iframe(?![^>]*\bloading=)/g, '<iframe loading="lazy"');
}

// The page already shows the project title, so drop a leading markdown
// heading that only repeats it (e.g. "## TruthRadar").
function stripTitleHeading(md, names) {
    const match = md.match(/^\s*#{1,6}\s+(.+?)\s*#*\s*(?:\n|$)/);
    if (!match) return md;
    const norm = s => s.replace(/[*_`]/g, '').trim().toLowerCase();
    const repeatsTitle = names.some(name => name && norm(name) === norm(match[1]));
    return repeatsTitle ? md.slice(match[0].length) : md;
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function slugFor(item) {
    return item.slug || item.file.split('/').pop().replace(/\.md$/, '');
}

function formatDate(date) {
    if (!date) return '';
    const [year, month] = date.split('-');
    return month ? `${MONTHS[parseInt(month, 10) - 1]} ${year}` : year;
}

function groupByCategory(projects) {
    const groups = new Map();
    projects.forEach(p => {
        const name = p.category || 'Other';
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(p);
    });
    const rank = name => {
        const i = CATEGORY_ORDER.indexOf(name);
        return i === -1 ? CATEGORY_ORDER.length : i;
    };
    return [...groups.entries()]
        .sort((a, b) => rank(a[0]) - rank(b[0]))
        .map(([name, items]) => ({ name, items }));
}

function currentSlug() {
    return decodeURIComponent(window.location.hash.slice(1));
}

document.addEventListener('DOMContentLoaded', () => {
    const menu = document.getElementById('project-menu');
    const content = document.getElementById('project-content');
    const select = document.getElementById('project-select');
    if (!menu || !content) return;

    fetch('data/index.json')
        .then(response => response.json())
        .then(indexData => Promise.all(
            indexData.filter(item => item.type === 'project').map(item =>
                fetch(item.file)
                    .then(res => res.ok ? res.text() : Promise.reject(new Error(`${res.status} ${item.file}`)))
                    .then(md => ({ ...item, slug: slugFor(item), content: md }))
                    .catch(err => {
                        console.error('Skipping', item.file, err);
                        return null;
                    })
            )
        ))
        .then(results => {
            const projects = results.filter(Boolean);
            if (projects.length === 0) {
                content.innerHTML = '<p class="project-empty">No projects yet.</p>';
                return;
            }

            const groups = groupByCategory(projects);
            const ordered = groups.flatMap(g => g.items);
            const bySlug = new Map(ordered.map(p => [p.slug, p]));

            menu.innerHTML = groups.map(g => `
                <div class="menu-group">
                    <h2 class="menu-group-title">${escapeHtml(g.name)}</h2>
                    <ul class="menu-list">
                        ${g.items.map(p => `
                            <li><a class="menu-link" href="#${p.slug}" data-slug="${p.slug}">
                                <span class="menu-title">${escapeHtml(p.short || p.title)}</span>
                                <span class="menu-year">${p.date ? p.date.substring(0, 4) : ''}</span>
                            </a></li>`).join('')}
                    </ul>
                </div>`).join('');

            if (select) {
                select.innerHTML = groups.map(g => `
                    <optgroup label="${escapeHtml(g.name)}">
                        ${g.items.map(p => `<option value="${p.slug}">${escapeHtml(p.short || p.title)}</option>`).join('')}
                    </optgroup>`).join('');
                select.addEventListener('change', () => {
                    window.location.hash = select.value;
                });
            }

            content.innerHTML = ordered.map(p => {
                const meta = [escapeHtml(p.category || 'Other'), formatDate(p.date)].filter(Boolean).join(' &middot; ');
                const md = stripTitleHeading(p.content, [p.title, p.short]);
                const body = md.trim()
                    ? renderMarkdown(md)
                    : '<p class="project-empty">A write-up for this project is coming soon.</p>';
                return `
                    <article id="proj-${p.slug}" class="project-post-content" hidden>
                        <header class="project-header">
                            <p class="eyebrow">${meta}</p>
                            <h1 class="project-title">${escapeHtml(p.title)}</h1>
                        </header>
                        <div class="project-content-text prose">${body}</div>
                    </article>`;
            }).join('');

            const show = (scrollToTop) => {
                const project = bySlug.get(currentSlug()) || ordered[0];
                content.querySelectorAll('.project-post-content').forEach(el => {
                    el.hidden = el.id !== `proj-${project.slug}`;
                });
                menu.querySelectorAll('.menu-link').forEach(a => {
                    const active = a.dataset.slug === project.slug;
                    a.classList.toggle('active', active);
                    if (active) a.setAttribute('aria-current', 'true');
                    else a.removeAttribute('aria-current');
                });
                if (select) select.value = project.slug;
                document.title = `${project.short || project.title} - Kamran Heydarov`;
                if (scrollToTop) window.scrollTo(0, 0);
            };

            show(false);
            window.addEventListener('hashchange', () => show(true));
        })
        .catch(err => {
            console.error('Error loading data:', err);
            content.innerHTML = '<p class="project-empty">Could not load projects.</p>';
        });
});
