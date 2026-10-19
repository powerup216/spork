// MicDrop: scatters X-ray style skeletons across the page background.
// Drawings are simple original line art; positions come from a seeded random
// generator so the splatter is the same on every visit.
(function () {
    const BONE = '#e6eef0';
    const SHAPES = {
        skull: `
            <path d="M50 8 C25 8 12 26 12 46 C12 60 19 68 26 72 L28 84 C28 88 32 90 36 90 L64 90 C68 90 72 88 72 84 L74 72 C81 68 88 60 88 46 C88 26 75 8 50 8 Z"/>
            <ellipse cx="35" cy="48" rx="10" ry="11"/>
            <ellipse cx="65" cy="48" rx="10" ry="11"/>
            <path d="M50 58 L44 70 L56 70 Z"/>
            <path d="M34 80 L66 80 M40 76 L40 88 M46 76 L46 88 M52 76 L52 88 M58 76 L58 88"/>`,
        ribs: `
            <path d="M50 4 L50 96"/>
            <path d="M48 16 C30 14 18 22 16 34 M52 16 C70 14 82 22 84 34"/>
            <path d="M48 28 C28 26 14 36 13 50 M52 28 C72 26 86 36 87 50"/>
            <path d="M48 40 C28 39 14 50 14 64 M52 40 C72 39 86 50 86 64"/>
            <path d="M48 52 C30 52 18 62 19 76 M52 52 C70 52 82 62 81 76"/>
            <path d="M48 64 C34 65 26 72 26 82 M52 64 C66 65 74 72 74 82"/>
            <path d="M44 8 L56 8 M44 20 L56 20 M44 32 L56 32 M44 44 L56 44 M44 56 L56 56 M44 68 L56 68 M44 80 L56 80 M44 92 L56 92"/>`,
        hand: `
            <path d="M30 96 L30 62 C30 56 34 52 40 52 L62 52 C68 52 72 56 72 62 L72 96"/>
            <path d="M34 52 L28 34 M28 30 L24 18 M24 14 L22 6"/>
            <path d="M44 52 L42 30 M42 26 L41 14 M41 10 L40 2"/>
            <path d="M54 52 L55 28 M55 24 L56 12 M56 8 L56 0"/>
            <path d="M64 52 L68 32 M69 28 L72 18 M73 14 L75 6"/>
            <path d="M72 66 L84 56 M87 53 L94 46"/>
            <path d="M38 62 L38 90 M46 62 L46 90 M54 62 L54 90 M62 62 L62 90"/>`,
        femur: `
            <path d="M30 10 C22 4 12 10 16 18 C10 22 14 32 22 30 L70 78 C68 86 78 92 82 86 C90 90 96 80 88 74 C94 68 86 60 80 64 L32 16 C34 10 32 10 30 10 Z"/>`,
        skeleton: `
            <circle cx="50" cy="10" r="8"/>
            <path d="M50 18 L50 58"/>
            <path d="M50 24 C40 24 34 30 34 38 M50 24 C60 24 66 30 66 38 M50 32 C42 32 37 37 37 44 M50 32 C58 32 63 37 63 44 M50 40 C44 40 40 44 40 49 M50 40 C56 40 60 44 60 49"/>
            <path d="M34 22 L66 22 M34 22 L26 42 L24 60 M66 22 L74 42 L76 60"/>
            <path d="M40 58 C40 66 60 66 60 58 Z"/>
            <path d="M44 64 L40 80 L40 96 M56 64 L60 80 L60 96 M36 96 L42 96 M58 96 L64 96"/>`,
    };
    const KINDS = Object.keys(SHAPES);

    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6d2b79f5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function draw() {
        let layer = document.getElementById('bs-skeletons');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'bs-skeletons';
            layer.setAttribute('aria-hidden', 'true');
            document.body.prepend(layer);
        }
        layer.innerHTML = '';
        const w = window.innerWidth, h = window.innerHeight;
        const rand = mulberry32(0xb0e5);
        const count = Math.round(Math.min(34, Math.max(14, (w * h) / 42000)));
        for (let i = 0; i < count; i++) {
            const kind = KINDS[Math.floor(rand() * KINDS.length)];
            const size = 54 + rand() * (kind === 'skeleton' ? 170 : 120);
            const x = rand() * (w + size) - size / 2;
            const y = rand() * (h + size) - size / 2;
            const rot = Math.round(rand() * 360);
            const opacity = (0.07 + rand() * 0.11).toFixed(3);
            const blur = rand() < 0.3 ? 'filter:blur(1px);' : '';
            const svg = `<svg viewBox="0 0 100 100" width="${size.toFixed(0)}" height="${size.toFixed(0)}"
                style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;transform:rotate(${rot}deg);opacity:${opacity};${blur}"
                fill="${BONE}" fill-opacity="0.08" stroke="${BONE}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${SHAPES[kind]}</svg>`;
            layer.insertAdjacentHTML('beforeend', svg);
        }
    }

    let timer;
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(draw, 150); });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw);
    else draw();
})();
