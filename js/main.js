document.addEventListener("DOMContentLoaded", () => {
    fetch('data/index.json')
        .then(response => response.json())
        .then(indexData => {
            // Fetch all markdown files based on the index
            const promises = indexData.map(item => 
                fetch(item.file)
                    .then(res => res.text())
                    .then(content => ({ ...item, content }))
            );

            return Promise.all(promises);
        })
        .then(data => {
            const blogContainer = document.getElementById('blog-container');
            if (blogContainer) {
                const posts = data.filter(d => d.type === 'post');
                blogContainer.innerHTML = posts.map(p => `
                    <div class="blog-post-content" style="margin-bottom: 30px;">
                        <header class="blog-header"><h1 style="color: var(--primary-color);">${p.title}</h1></header>
                        <div class="blog-content-text" style="margin-top: 10px;">${marked.parse ? marked.parse(p.content) : p.content}</div>
                    </div>
                `).join('');
            }

            const projectContent = document.getElementById('project-content');
            const projectMenu = document.getElementById('project-menu');
            if (projectContent && projectMenu) {
                const projects = data.filter(d => d.type === 'project');
                let menuHtml = '';
                let contentHtml = '';
                if(projects.length === 0) {
                    contentHtml = "<p>No projects yet.</p>";
                }
                projects.forEach((p, i) => {
                    const dateStr = p.date ? ` <span style="font-size: 0.8em; color: #666; margin-left: 5px;">(${p.date.substring(0, 4)})</span>` : '';
                    menuHtml += `<div class="year-section"><a href="#" class="post-link" onclick="showProject('proj-${i}'); return false;">${p.title}${dateStr}</a></div>`;
                    contentHtml += `<div id="proj-${i}" class="project-post-content" style="display: ${i === 0 ? 'block' : 'none'};"><div class="project-article"><header class="project-header"><h1 class="project-title">${p.title}</h1><div style="color: #666; margin-bottom: 15px;">${p.date || ''}</div></header><div class="project-content-text">${marked.parse ? marked.parse(p.content) : p.content}</div></div></div>`;
                });
                projectMenu.innerHTML = menuHtml;
                projectContent.innerHTML = contentHtml;
            }
        })
        .catch(err => console.error("Error loading data:", err));
});

function showProject(id) {
    document.querySelectorAll('.project-post-content').forEach(p => p.style.display = 'none');
    const el = document.getElementById(id);
    if(el) el.style.display = 'block';
}
