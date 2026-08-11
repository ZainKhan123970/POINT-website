document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------------
     THEME TOGGLE (light / dark) — matches brand palette in both modes
     --------------------------------------------------------------------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');

  function setTheme(mode){
    root.setAttribute('data-theme', mode);
    themeBtn.setAttribute('aria-pressed', mode === 'dark');
    themeBtn.querySelector('.theme-toggle__knob').textContent = mode === 'dark' ? '🌙' : '☀️';
  }
  // default to system preference, session-only (no persistence needed)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');

  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  /* ---------------------------------------------------------------------
     SCROLL REVEAL ANIMATIONS
     --------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));

  /* ---------------------------------------------------------------------
     PRODUCT CARD — quick hover (near-instant), flip-to-details, quick view
     --------------------------------------------------------------------- */
  const cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    const flipBtn   = card.querySelector('.card__details-btn');
    const backClose = card.querySelector('.card__back-close');
    const media     = card.querySelector('.card__media');
    const quickBtn  = card.querySelector('.card__quick-btn');

    // Flip card to show details on back
    if (flipBtn){
      flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.add('flipped');
      });
    }
    // Flip back
    if (backClose){
      backClose.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.remove('flipped');
      });
    }
    // Click product image or "Quick View" -> open modal, freeze background
    if (media)    media.addEventListener('click', () => openModal(card));
    if (quickBtn) quickBtn.addEventListener('click', (e) => { e.stopPropagation(); openModal(card); });
  });

  /* ---------------------------------------------------------------------
     QUICK VIEW MODAL — proper open + frozen background
     (only present on pages with a product grid: index, shop, product)
     --------------------------------------------------------------------- */
  const backdrop   = document.getElementById('modalBackdrop');

  if (backdrop) {
    const modalImg   = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDesc  = document.getElementById('modalDesc');
    const modalClose = document.getElementById('modalClose');
    const modalAddToCart = document.getElementById('modalAddToCart');
    const sizePills  = document.querySelectorAll('.size-pill');

    let currentModalData = null;

    window.openModal = function openModal(card){
      const data = card.dataset;
      currentModalData = data;
      modalImg.src = data.img;
      modalImg.alt = data.name;
      modalTitle.textContent = data.name;
      modalPrice.textContent = data.price;
      modalDesc.textContent = data.desc;

      backdrop.classList.add('active');
      document.body.classList.add('modal-open'); // freezes background scroll
    };
    function closeModal(){
      backdrop.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
    modalClose.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    if (modalAddToCart) {
      modalAddToCart.addEventListener('click', () => {
        if (!currentModalData || !window.PointCart) return;
        const selectedSize = document.querySelector('.modal__sizes .size-pill.selected');
        window.PointCart.add({
          name: currentModalData.name,
          price: currentModalData.price,
          img: currentModalData.img,
          size: selectedSize ? selectedSize.textContent.trim() : 'M',
        });
        modalAddToCart.textContent = 'Added ✓';
        setTimeout(() => { modalAddToCart.textContent = 'Add to Cart'; }, 1300);
      });
    }

    sizePills.forEach(pill => {
      pill.addEventListener('click', () => {
        sizePills.forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Mobile-friendly hover: make hover-driven UI (quick view / flip button)
     appear on a very quick tap-hold too, not just mouse hover.
     --------------------------------------------------------------------- */
  let pressTimer;
  cards.forEach(card => {
    card.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => card.classList.add('touch-hover'), 100); // 0.1s
    }, { passive:true });
    card.addEventListener('touchend', () => clearTimeout(pressTimer));
  });

  /* ---------------------------------------------------------------------
     ABOUT PAGE — flip tiles (white/black tee). Hover flips on desktop;
     tap toggles the flip on touch devices.
     --------------------------------------------------------------------- */
  document.querySelectorAll('.flip-tile').forEach(tile => {
    tile.addEventListener('click', () => tile.classList.toggle('flipped'));
  });

  /* ---------------------------------------------------------------------
     EXPANDABLE NAV SEARCH — click to open, type + Enter to search,
     click outside / Escape to close. Runs on every page.
     --------------------------------------------------------------------- */
  const navSearch = document.getElementById('navSearch');
  if (navSearch) {
    const toggleBtn = navSearch.querySelector('.nav-search__toggle');
    const input     = navSearch.querySelector('.nav-search__input');

    function openSearch () {
      navSearch.classList.add('active');
      setTimeout(() => input.focus(), 180);
    }
    function closeSearch () {
      navSearch.classList.remove('active');
      input.blur();
    }
    function runSearch () {
      const term = input.value.trim();
      if (!term) { input.focus(); return; }
      window.location.href = 'shop.html?q=' + encodeURIComponent(term);
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navSearch.classList.contains('active') && document.activeElement === input) {
        runSearch();
      } else {
        openSearch();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch();
      if (e.key === 'Escape') closeSearch();
    });

    document.addEventListener('click', (e) => {
      if (navSearch.classList.contains('active') && !navSearch.contains(e.target)) closeSearch();
    });

    // Pre-fill from ?q= so the box shows the term when landing on shop.html
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) { input.value = q; openSearch(); }
  }

});
