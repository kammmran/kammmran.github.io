(() => {
    const root = document.documentElement;
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const storageKey = 'site-theme';
    let savedTheme;
    try {
        savedTheme = localStorage.getItem(storageKey);
    } catch (_) { /* Storage can be unavailable in private browsing. */ }
    if (savedTheme !== 'light' && savedTheme !== 'dark') savedTheme = null;

    function applyTheme(theme) {
        root.dataset.theme = theme;
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        const dark = theme === 'dark';
        const icon = dark
            ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
            : '<path d="M20.9 13.3A9 9 0 0 1 10.7 3.1a9 9 0 1 0 10.2 10.2Z"/>';
        toggle.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icon}</svg>`;
        const label = `Switch to ${dark ? 'light' : 'dark'} mode`;
        toggle.setAttribute('aria-label', label);
        toggle.setAttribute('title', label);
    }

    applyTheme(savedTheme || (preference.matches ? 'dark' : 'light'));
    preference.addEventListener('change', event => {
        if (!savedTheme) applyTheme(event.matches ? 'dark' : 'light');
    });

    document.addEventListener('DOMContentLoaded', () => {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        toggle.hidden = false;
        applyTheme(root.dataset.theme);
        toggle.addEventListener('click', () => {
            savedTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
            applyTheme(savedTheme);
            try {
                localStorage.setItem(storageKey, savedTheme);
            } catch (_) { /* The toggle still works without persistence. */ }
        });
    });
})();
