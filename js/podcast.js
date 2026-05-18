// Shared logic for the podcast section.
// Works from /podcast.html (listing) and /podcast/{detail,listen}.html (sub-pages).
// Auto-dispatches to the right page initializer on DOMContentLoaded.

(function () {
    // Detect whether we're in the /podcast/ subfolder or at the site root.
    const IN_SUBFOLDER = /\/podcast\//.test(location.pathname);
    const BASE = IN_SUBFOLDER ? '../' : '';

    const INDEX_URL = BASE + 'data/podcasts/index.json';

    function fetchEpisodes() {
        return fetch(INDEX_URL).then(r => r.json()).then(items =>
            [...items].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        );
    }

    function epNumber(idx, total) {
        return String(total - idx).padStart(2, '0');
    }

    function slugFromFile(file) {
        return encodeURIComponent(file.replace(/^data\/podcasts\//, '').replace(/\.md$/, ''));
    }

    function findEpisode(items, id) {
        const target = `data/podcasts/${id}.md`;
        const idx = items.findIndex(p => p.file === target || p.file.endsWith(`/${id}.md`));
        return idx === -1 ? null : { meta: items[idx], idx };
    }

    function formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    // Build a URL pointing to a podcast sub-page from the current location.
    function subpageUrl(page, id) {
        if (IN_SUBFOLDER) return `${page}.html?id=${id}`;
        return `podcast/${page}.html?id=${id}`;
    }

    // Resolve a data path (cover, audio, file) relative to the current page.
    function resolveData(p) {
        if (!p) return p;
        if (/^https?:/.test(p) || p.startsWith('/')) return p;
        return BASE + p;
    }

    // Rewrite relative paths inside rendered markdown so images and links
    // (e.g. ![](data/podcasts/images/1.png)) work from /podcast/detail.html.
    function rewriteMarkdownPaths(html) {
        if (!IN_SUBFOLDER) return html;
        return html
            .replace(/(<img[^>]+src=)"(?!https?:|\/|data:)([^"]+)"/g,
                     (_, pre, src) => `${pre}"${BASE}${src}"`)
            .replace(/(<a[^>]+href=)"(?!https?:|\/|#|mailto:)([^"]+)"/g,
                     (_, pre, href) => `${pre}"${BASE}${href}"`);
    }

    // ---- Listing page (podcast.html) ----------------------------------
    function initList() {
        const grid = document.getElementById('podcast-grid');
        const countEl = document.getElementById('podcast-count');
        if (!grid) return;

        fetchEpisodes()
            .then(items => {
                if (!items.length) {
                    grid.innerHTML = '<p class="podcast-empty">No episodes yet — first conversation coming soon.</p>';
                    if (countEl) countEl.textContent = '0';
                    return;
                }
                if (countEl) countEl.textContent = items.length.toString().padStart(2, '0');
                const total = items.length;
                grid.innerHTML = items.map((p, i) => {
                    const slug = slugFromFile(p.file);
                    const detailUrl = subpageUrl('detail', slug);
                    const listenUrl = subpageUrl('listen', slug);
                    const epNum = epNumber(i, total);
                    const dateStr = p.date || '';
                    const cover = resolveData(p.cover);
                    const listenBtn = p.audio ? `<a href="${listenUrl}" class="podcast-action podcast-listen">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>
                        Listen <span aria-hidden="true">→</span>
                    </a>` : '';
                    const watchBtn = p.video ? `<a href="${p.video}" class="podcast-action podcast-watch" target="_blank" rel="noopener">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Watch <span aria-hidden="true">→</span>
                    </a>` : '';
                    return `
                        <article class="podcast-card">
                            <a href="${detailUrl}" class="podcast-cover-link" aria-label="${p.title}">
                                <div class="podcast-cover" style="background-image: url('${cover}');">
                                    <span class="podcast-epnum">EP ${epNum}</span>
                                    <span class="podcast-play" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                    </span>
                                </div>
                            </a>
                            <div class="podcast-meta">
                                <div class="podcast-meta-top">
                                    <span class="podcast-guest">${p.guest || ''}</span>
                                    <span class="podcast-dot">·</span>
                                    <span class="podcast-date">${dateStr}</span>
                                </div>
                                <a href="${detailUrl}" class="podcast-title">${p.title}</a>
                                <div class="podcast-actions">${listenBtn}${watchBtn}</div>
                            </div>
                        </article>
                    `;
                }).join('');
            })
            .catch(err => {
                console.error('Error loading podcasts:', err);
                grid.innerHTML = '<p class="podcast-empty">Could not load episodes.</p>';
            });
    }

    // ---- Detail page (podcast/detail.html) ----------------------------
    function initDetail() {
        const titleEl = document.getElementById('podcast-title');
        if (!titleEl) return;
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const subEl = document.getElementById('podcast-sub');
        const bodyEl = document.getElementById('podcast-body');
        const epNumEl = document.getElementById('podcast-epnum');
        const bgEl = document.getElementById('podcast-hero-bg');
        const actionsEl = document.getElementById('podcast-detail-actions');

        if (!id) { titleEl.textContent = 'Episode not found'; return; }

        fetchEpisodes()
            .then(items => {
                const found = findEpisode(items, id);
                if (!found) { titleEl.textContent = 'Episode not found'; return; }
                const { meta, idx } = found;
                const epNum = epNumber(idx, items.length);
                document.title = `Kamran Heydarov - ${meta.title}`;
                titleEl.textContent = meta.title;
                epNumEl.textContent = `— Episode ${epNum}`;
                subEl.innerHTML = `
                    <span>${meta.guest || ''}</span>
                    <span class="podcast-dot">·</span>
                    <span>${meta.date || ''}</span>
                `;
                if (meta.cover) bgEl.style.backgroundImage = `url('${resolveData(meta.cover)}')`;
                const parts = [];
                if (meta.audio) {
                    parts.push(`<a href="${subpageUrl('listen', id)}" class="podcast-action podcast-action-light">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>
                        Listen <span aria-hidden="true">→</span>
                    </a>`);
                }
                if (meta.video) {
                    parts.push(`<a href="${meta.video}" class="podcast-action podcast-action-light" target="_blank" rel="noopener">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Watch <span aria-hidden="true">→</span>
                    </a>`);
                }
                actionsEl.innerHTML = parts.join('');
                return fetch(resolveData(meta.file)).then(r => r.text());
            })
            .then(md => {
                if (md === undefined) return;
                const rendered = window.marked && window.marked.parse ? window.marked.parse(md) : md;
                bodyEl.innerHTML = rewriteMarkdownPaths(rendered);
            })
            .catch(err => {
                console.error('Error loading episode:', err);
                titleEl.textContent = 'Could not load episode';
            });
    }

    // ---- Listen page (podcast/listen.html) ----------------------------
    function initListen() {
        const titleEl = document.getElementById('listen-title');
        if (!titleEl) return;
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const subEl = document.getElementById('listen-sub');
        const epNumEl = document.getElementById('listen-epnum');
        const coverEl = document.getElementById('listen-cover');
        const bgEl = document.getElementById('listen-bg');
        const audio = document.getElementById('listen-audio');
        const playBtn = document.getElementById('listen-play');
        const playIcon = document.getElementById('listen-play-icon');
        const pauseIcon = document.getElementById('listen-pause-icon');
        const progressEl = document.getElementById('listen-progress');
        const fillEl = document.getElementById('listen-progress-fill');
        const currentEl = document.getElementById('listen-current');
        const durationEl = document.getElementById('listen-duration');
        const eqEl = document.getElementById('listen-eq');
        const detailLink = document.getElementById('listen-detail-link');
        const watchLink = document.getElementById('listen-watch-link');

        if (!id) { titleEl.textContent = 'Episode not found'; return; }

        fetchEpisodes()
            .then(items => {
                const found = findEpisode(items, id);
                if (!found) { titleEl.textContent = 'Episode not found'; return; }
                const { meta, idx } = found;
                const epNum = epNumber(idx, items.length);

                document.title = `Listen — ${meta.title}`;
                titleEl.textContent = meta.title;
                epNumEl.textContent = `— Episode ${epNum}`;
                subEl.innerHTML = `
                    <span>${meta.guest || ''}</span>
                    <span class="podcast-dot">·</span>
                    <span>${meta.date || ''}</span>
                `;
                if (meta.cover) {
                    const c = resolveData(meta.cover);
                    coverEl.style.backgroundImage = `url('${c}')`;
                    bgEl.style.backgroundImage = `url('${c}')`;
                }
                detailLink.href = subpageUrl('detail', id);
                if (meta.video) {
                    watchLink.href = meta.video;
                    watchLink.style.display = '';
                }
                if (meta.audio) {
                    audio.src = resolveData(meta.audio);
                } else {
                    playBtn.disabled = true;
                    titleEl.insertAdjacentHTML('afterend', '<p class="listen-warning">No audio file available for this episode.</p>');
                }
            })
            .catch(err => {
                console.error('Error loading episode:', err);
                titleEl.textContent = 'Could not load episode';
            });

        playBtn.addEventListener('click', () => {
            if (audio.paused) audio.play(); else audio.pause();
        });
        audio.addEventListener('play', () => {
            playIcon.style.display = 'none';
            pauseIcon.style.display = '';
            eqEl.classList.add('is-playing');
        });
        audio.addEventListener('pause', () => {
            playIcon.style.display = '';
            pauseIcon.style.display = 'none';
            eqEl.classList.remove('is-playing');
        });
        audio.addEventListener('loadedmetadata', () => {
            durationEl.textContent = formatTime(audio.duration);
        });
        audio.addEventListener('timeupdate', () => {
            const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
            fillEl.style.width = pct + '%';
            currentEl.textContent = formatTime(audio.currentTime);
        });
        progressEl.addEventListener('click', (e) => {
            if (!audio.duration) return;
            const rect = progressEl.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audio.currentTime = pct * audio.duration;
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('podcast-grid')) initList();
        else if (document.getElementById('listen-audio')) initListen();
        else if (document.getElementById('podcast-body')) initDetail();
    });
})();
