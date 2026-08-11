document.addEventListener('DOMContentLoaded', () => {

  const scrollSection = document.getElementById('lookbookScroll');
  const frame  = document.getElementById('lookbookFrame');
  const matrix = document.getElementById('lookbookMatrix');
  const caption = document.getElementById('lookbookCaption');
  if (!scrollSection || !frame || !matrix) return;

  const cols = Array.from(matrix.querySelectorAll('.lookbook-col'));
  // [from%, to%] vertical drift per column — mirrors the reference parallax component
  const colRanges = [
    [0, -40],
    [-40, 10],
    [0, -40],
    [-30, 20],
  ];

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp  = (a, b, t) => a + (b - a) * t;
  const remap = (v, inMin, inMax, outMin, outMax) => {
    const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
    return lerp(outMin, outMax, t);
  };

  let ticking = false;

  function update () {
    ticking = false;

    const total = scrollSection.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const rect = scrollSection.getBoundingClientRect();
    const scrolled = -rect.top;
    const progress = clamp(scrolled / total, 0, 1);

    // Banner unfurls from a rounded 90vw card into a full-bleed frame (0 -> 0.15)
    const w  = remap(progress, 0, 0.15, 90, 100);
    const h  = remap(progress, 0, 0.15, 80, 100);
    const r  = remap(progress, 0, 0.15, 48, 0);
    const bw = remap(progress, 0, 0.15, 4, 0);
    frame.style.setProperty('--lb-w', w + 'vw');
    frame.style.setProperty('--lb-h', h + 'vh');
    frame.style.setProperty('--lb-r', r + 'px');
    frame.style.setProperty('--lb-bw', bw + 'px');

    // 3D matrix settles from a tilted stack into a near-flat grid (0.15 -> 1)
    const rx = remap(progress, 0.15, 1, 25, 4);
    const ry = remap(progress, 0.15, 1, -45, -8);
    const rz = remap(progress, 0.15, 1, 15, 2);
    const tz = remap(progress, 0.15, 1, -800, 0);
    matrix.style.setProperty('--lb-rx', rx + 'deg');
    matrix.style.setProperty('--lb-ry', ry + 'deg');
    matrix.style.setProperty('--lb-rz', rz + 'deg');
    matrix.style.setProperty('--lb-tz', tz + 'px');

    // Column parallax drift
    cols.forEach((col, i) => {
      const [from, to] = colRanges[i % colRanges.length];
      const y = remap(progress, 0.15, 1, from, to);
      col.style.setProperty('--lb-y', y + '%');
    });

    // Caption fades out early so it doesn't fight the gallery
    if (caption) {
      const capOpacity = 1 - remap(progress, 0.02, 0.14, 0, 1);
      caption.style.setProperty('--lb-cap', clamp(capOpacity, 0, 1));
    }
  }

  function onScroll () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  update();
});
