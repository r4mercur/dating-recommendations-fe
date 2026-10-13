/** Shared animation helpers for reactions (Web Animations API, no library). */

export const SPRING = 'cubic-bezier(.34, 1.56, .64, 1)';
export const EASE_IN = 'cubic-bezier(.5, 0, .75, 0)';

export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function centerOf(element) {
    const rect = element.getBoundingClientRect();
    return {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2};
}

/** Short scale bounce, e.g. on a button that was used. */
export function pop(element, {rotate = false} = {}) {
    if (!element || prefersReducedMotion()) return;
    element.animate([
        {transform: 'scale(1) rotate(0)'},
        {transform: `scale(1.25) rotate(${rotate ? 180 : 0}deg)`},
        {transform: `scale(1) rotate(${rotate ? 360 : 0}deg)`},
    ], {duration: 420, easing: SPRING});
}

export function shake(element) {
    element?.animate([
        {transform: 'translateX(0)'},
        {transform: 'translateX(-6px)'},
        {transform: 'translateX(6px)'},
        {transform: 'translateX(0)'},
    ], {duration: 260});
}

/** Particles (icon font classes) flying outwards from a viewport point. */
export function burst({x, y}, {icon = 'icon-heart-fill', color = '#ff4d79', count = 10, distance = 70, size = 16} = {}) {
    if (prefersReducedMotion()) return;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('i');
        particle.className = `icon ${icon}`;
        particle.setAttribute('aria-hidden', 'true');
        Object.assign(particle.style, {
            position: 'fixed', left: '0', top: '0', zIndex: '1100', pointerEvents: 'none',
            color, fontSize: `${size}px`,
        });
        document.body.appendChild(particle);

        const angle = Math.PI * 2 * i / count + Math.random() * 0.5;
        const reach = distance * (0.7 + Math.random() * 0.5);
        const start = `translate(${x - size / 2}px, ${y - size / 2}px)`;
        particle.animate([
            {transform: `${start} scale(.3)`, opacity: 1},
            {
                transform: `translate(${x - size / 2 + Math.cos(angle) * reach}px, ${y - size / 2 + Math.sin(angle) * reach}px) scale(1) rotate(${Math.random() * 90 - 45}deg)`,
                opacity: 0
            },
        ], {duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2, .8, .3, 1)'})
            .finished.then(() => particle.remove());
    }
}

/** Expanding ring, used for the super like. */
export function shockwave({x, y}, color = '#64b5f6') {
    if (prefersReducedMotion()) return;
    const ring = document.createElement('div');
    Object.assign(ring.style, {
        position: 'fixed', left: '0', top: '0', zIndex: '1100', pointerEvents: 'none',
        width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${color}`,
    });
    document.body.appendChild(ring);
    const at = `translate(${x - 20}px, ${y - 20}px)`;
    ring.animate([
        {transform: `${at} scale(.5)`, opacity: 1},
        {transform: `${at} scale(8)`, opacity: 0},
    ], {duration: 700, easing: 'cubic-bezier(.2, .8, .3, 1)'}).finished.then(() => ring.remove());
}

export function confetti(count = 70) {
    if (prefersReducedMotion()) return;
    const colors = ['#ff4d79', '#ffa726', '#64b5f6', '#5dcaa5', '#ffe082'];
    const width = window.innerWidth;
    const height = window.innerHeight;
    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        Object.assign(piece.style, {
            position: 'fixed', left: '0', top: '0', zIndex: '1300', pointerEvents: 'none',
            width: '8px', height: '12px', borderRadius: '2px', background: colors[i % colors.length],
        });
        document.body.appendChild(piece);
        const x = width / 2 + (Math.random() - 0.5) * 160;
        const drift = (Math.random() - 0.5) * width;
        piece.animate([
            {transform: `translate(${x}px, ${height / 2 - 40}px)`},
            {transform: `translate(${x + drift * 0.6}px, ${height * 0.1 + Math.random() * 80}px) rotate(${Math.random() * 360}deg)`, offset: 0.35},
            {transform: `translate(${x + drift}px, ${height + 20}px) rotate(${Math.random() * 900}deg)`},
        ], {duration: 1800 + Math.random() * 1000, easing: 'cubic-bezier(.25, .6, .4, 1)'})
            .finished.then(() => piece.remove());
    }
}
