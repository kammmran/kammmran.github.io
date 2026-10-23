(() => {
    const mouse = document.querySelector('.mouse-link');
    if (!mouse) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cheese = document.createElement('span');
    cheese.className = 'mouse-cheese';
    cheese.hidden = true;
    cheese.setAttribute('aria-hidden', 'true');
    cheese.innerHTML = `<svg viewBox="0 0 32 28" width="28" height="25" fill="none">
        <path d="m3 11 17-8 9 10v12H3Z" fill="#efba4b" stroke="#9b6824" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="m3 11 26 2-9-10Z" fill="#ffdb78" stroke="#9b6824" stroke-width="1.4" stroke-linejoin="round"/>
        <g fill="#c38a2d"><ellipse cx="18" cy="8" rx="2.5" ry="1.3"/><circle cx="10" cy="18" r="2.5"/><circle cx="23" cy="19" r="2"/><circle cx="16" cy="24" r="1.5"/></g>
    </svg>`;
    document.body.append(cheese);

    const random = (min, max) => min + Math.random() * (max - min);
    const clamp = (value, max) => Math.max(8, Math.min(value, max));
    let x, y, target, food;
    let bounds;
    let state = 'sniffing';
    let time = 0;
    let until = 1;
    let speed = 85;
    let velocity = 0;
    let heading = random(-Math.PI, Math.PI);
    let wanderUntil = 0;
    // Match the 88 x 68 link; the nose is 35px ahead of its centre.
    const centre = { x: 44, y: 34 };
    const noseReach = 35;
    let frame = null;
    let lastTime = null;
    let hovered = false;
    let focused = false;

    function setState(value, duration = 0) {
        state = value;
        mouse.dataset.action = value;
        until = time + duration;
        if (value !== 'wandering' && value !== 'chasing') velocity = 0;
    }

    function drawMouse() {
        mouse.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    function drawCheese() {
        cheese.style.left = `${food.x - 14}px`;
        cheese.style.top = `${food.y - 12}px`;
    }

    function resize() {
        bounds = {
            x: Math.max(8, window.innerWidth - 96),
            y: Math.max(8, window.innerHeight - 76)
        };
        x = clamp(x ?? random(8, bounds.x), bounds.x);
        y = clamp(y ?? random(8, bounds.y), bounds.y);
        if (target && state !== 'chasing') {
            target.x = clamp(target.x, bounds.x);
            target.y = clamp(target.y, bounds.y);
        }
        if (food) {
            food.x = Math.max(centre.x + 8, Math.min(food.x, bounds.x + centre.x));
            food.y = Math.max(centre.y + 8, Math.min(food.y, bounds.y + centre.y));
            drawCheese();
        }
        drawMouse();
        mouse.style.setProperty('--mouse-heading', `${heading}rad`);
    }

    function wander() {
        target = { x: random(8, bounds.x), y: random(8, bounds.y) };
        speed = random(65, 100);
        wanderUntil = time + random(2.5, 5);
        setState('wandering');
    }

    function spawnCheese() {
        // Choose a few candidates so the snack usually appears away from the mouse.
        for (let attempt = 0; attempt < 8; attempt++) {
            food = {
                x: random(8, bounds.x) + centre.x,
                y: random(8, bounds.y) + centre.y
            };
            if (Math.hypot(food.x - x - centre.x, food.y - y - centre.y) > 140) break;
        }
        drawCheese();
        cheese.hidden = false;
        delete cheese.dataset.eaten;
        setState('sniffing', random(0.2, 0.8));
    }

    function tick(timestamp) {
        frame = null;
        const dt = lastTime === null ? 0 : Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;
        time += dt;

        if (!food) spawnCheese();

        if ((state === 'sniffing' || state === 'grooming') && time >= until) {
            if (food) {
                target = food;
                speed = random(125, 155);
                setState('chasing');
            } else wander();
        } else if (state === 'eating' && time >= until) {
            spawnCheese();
        }

        if (state === 'wandering' || state === 'chasing') {
            const chasing = state === 'chasing';
            const dx = target.x - x - (chasing ? centre.x : 0);
            const dy = target.y - y - (chasing ? centre.y : 0);
            const distance = Math.hypot(dx, dy);
            const remaining = Math.max(0, distance - (chasing ? noseReach : 0));
            const desiredHeading = Math.atan2(dy, dx);
            // Turn through the shortest arc instead of flipping the artwork.
            const turn = Math.atan2(Math.sin(desiredHeading - heading), Math.cos(desiredHeading - heading));
            const maxTurn = 5 * dt;
            heading += Math.max(-maxTurn, Math.min(turn, maxTurn));
            mouse.style.setProperty('--mouse-heading', `${heading}rad`);

            if (remaining < 3 && Math.abs(turn) < 0.3) {
                if (chasing) {
                    cheese.dataset.eaten = 'true';
                    setState('eating', 1.8);
                } else setState(Math.random() < 0.25 ? 'grooming' : 'sniffing', random(0.9, 2));
            } else if (!chasing && time >= wanderUntil) {
                setState(Math.random() < 0.25 ? 'grooming' : 'sniffing', random(0.9, 2));
            } else {
                // Ease into each run, slow for corners and brake near the snack.
                const desiredSpeed = Math.min(speed, remaining * 4) * Math.max(0, Math.cos(turn));
                const acceleration = (desiredSpeed > velocity ? 220 : 360) * dt;
                velocity += Math.max(-acceleration, Math.min(desiredSpeed - velocity, acceleration));
                const step = Math.min(velocity * dt, remaining);
                x = clamp(x + Math.cos(heading) * step, bounds.x);
                y = clamp(y + Math.sin(heading) * step, bounds.y);
                mouse.style.setProperty('--mouse-gait', `${Math.max(0.14, 0.36 - velocity / 700)}s`);
                drawMouse();
            }
        }
        frame = requestAnimationFrame(tick);
    }

    function updatePlayback() {
        const paused = reducedMotion.matches || document.hidden || hovered || focused;
        mouse.classList.toggle('is-paused', paused);
        cheese.classList.toggle('is-paused', paused);
        if (paused) {
            if (frame !== null) cancelAnimationFrame(frame);
            frame = null;
            lastTime = null;
        } else if (frame === null) frame = requestAnimationFrame(tick);
    }

    function updateMotion() {
        mouse.classList.toggle('is-roaming', !reducedMotion.matches);
        if (reducedMotion.matches) {
            mouse.style.removeProperty('transform');
            mouse.style.removeProperty('--mouse-heading');
            velocity = 0;
            heading = -Math.PI / 2;
            cheese.hidden = true;
            food = null;
            setState('sniffing', 1);
        } else {
            resize();
            if (!food) spawnCheese();
        }
        updatePlayback();
    }

    mouse.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch') return;
        hovered = true;
        updatePlayback();
    });
    mouse.addEventListener('pointerleave', () => {
        hovered = false;
        updatePlayback();
    });
    mouse.addEventListener('focus', () => { focused = true; updatePlayback(); });
    mouse.addEventListener('blur', () => { focused = false; updatePlayback(); });
    document.addEventListener('visibilitychange', updatePlayback);
    reducedMotion.addEventListener('change', updateMotion);
    window.addEventListener('resize', () => {
        if (!reducedMotion.matches) resize();
    });
    updateMotion();
})();
