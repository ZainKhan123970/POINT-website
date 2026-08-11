document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------------------------
     EXPANDABLE FILTER ACCORDIONS — smooth height animation (replaces
     the old instant-snap <details>/<summary> behaviour)
     ----------------------------------------------------------------------- */
  const filterGroups = document.querySelectorAll('.filter-group');

  filterGroups.forEach(group => {
    const btn   = group.querySelector('.filter-summary');
    const panel = group.querySelector('.filter-panel');
    if (!btn || !panel) return;

    if (group.classList.contains('open')) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    } else {
      panel.style.maxHeight = '0px';
    }

    btn.setAttribute('aria-expanded', group.classList.contains('open'));

    btn.addEventListener('click', () => {
      const isOpen = group.classList.contains('open');

      if (isOpen) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { panel.style.maxHeight = '0px'; });
        });
        group.classList.remove('open');
      } else {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        group.classList.add('open');
      }
      btn.setAttribute('aria-expanded', !isOpen);
    });

    window.addEventListener('resize', () => {
      if (group.classList.contains('open')) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* -----------------------------------------------------------------------
     PRODUCT FILTERING — size, color, and price (price was previously
     unwired, so choosing a price range did nothing)
     ----------------------------------------------------------------------- */
  const grid = document.querySelector('.shop-page-grid');
  if (!grid) return;

  const cards      = Array.from(grid.querySelectorAll('.card'));
  const countEl    = document.querySelector('.shop-toolbar .count');
  const sizeInputs = document.querySelectorAll('input[name="size"]');
  const priceInputs = document.querySelectorAll('input[name="price"]');
  const swatches   = document.querySelectorAll('.swatch');
  const sortSelect = document.querySelector('.sort-select');

  let activeColor = 'all';

  const searchParams = new URLSearchParams(window.location.search);
  const searchTerm = (searchParams.get('q') || '').trim().toLowerCase();

  function parsePrice(str) {
    const cleaned = String(str || '0').replace(/Rs\.?/gi, '').replace(/,/g, '').trim();
    return parseFloat(cleaned.replace(/[^\d.]/g, '')) || 0;
  }

  function applyFilters() {
    const checkedSizes = Array.from(sizeInputs).filter(i => i.checked).map(i => i.value);
    const activePriceInput = document.querySelector('input[name="price"]:checked');
    const activePrice = activePriceInput ? activePriceInput.value : 'all';
    let visibleCount = 0;

    cards.forEach(card => {
      const cardSizes = (card.dataset.sizes || '').split(',');
      const cardColor = card.dataset.color || '';
      const cardPrice = parsePrice(card.dataset.price);
      const cardName  = (card.dataset.name || '').toLowerCase();

      const sizeMatch   = checkedSizes.length === 0 || checkedSizes.some(s => cardSizes.includes(s));
      const colorMatch  = activeColor === 'all' || cardColor === activeColor;
      const searchMatch = !searchTerm || cardName.includes(searchTerm);

      let priceMatch = true;
      if (activePrice === 'low')  priceMatch = cardPrice >= 3000 && cardPrice <= 3500;
      if (activePrice === 'high') priceMatch = cardPrice > 3500 && cardPrice <= 4000;

      const show = sizeMatch && colorMatch && priceMatch && searchMatch;
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    if (countEl) countEl.textContent = `${visibleCount} products`;
  }

  sizeInputs.forEach(input => input.addEventListener('change', applyFilters));
  priceInputs.forEach(input => input.addEventListener('change', applyFilters));

  swatches.forEach(sw => {
    sw.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      activeColor = sw.dataset.color;
      applyFilters();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const mode = sortSelect.value;
      const sorted = [...cards].sort((a, b) => {
        const priceA = parsePrice(a.dataset.price);
        const priceB = parsePrice(b.dataset.price);
        if (mode === 'price-low')  return priceA - priceB;
        if (mode === 'price-high') return priceB - priceA;
        return 0;
      });
      sorted.forEach(card => grid.appendChild(card));
    });
  }

  applyFilters();
});
