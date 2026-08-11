/* ==========================================================================
   POINT — Shared Cart Engine
   Loaded on every page (before main.js) so "Add to Cart" works the same
   from the shop grid, quick-view modal, and the product page — and the
   nav badge always reflects real cart contents.
   ========================================================================== */
window.PointCart = (function () {
  const KEY = 'point_cart_v1';

  function getCart () {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart (cart) {
    localStorage.setItem(KEY, JSON.stringify(cart));
    updateBadge();
    document.dispatchEvent(new CustomEvent('point-cart-updated', { detail: { cart } }));
  }

  function parsePrice (val) {
    if (typeof val === 'number') return val;
    // Strip currency label ("Rs.") and thousand separators first, so a
    // period left over from "Rs." doesn't get misread as a decimal point
    // (that bug turned "Rs. 3,499" into 0.3499).
    const cleaned = String(val || '0').replace(/Rs\.?/gi, '').replace(/,/g, '').trim();
    return parseFloat(cleaned.replace(/[^\d.]/g, '')) || 0;
  }

  function add (item) {
    const cart = getCart();
    const size = item.size || 'M';
    const color = item.color || '';
    const key = `${item.name}__${size}__${color}`;
    const existing = cart.find(c => c.key === key);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        key,
        name: item.name,
        price: parsePrice(item.price),
        img: item.img,
        size,
        color,
        qty: 1,
      });
    }
    saveCart(cart);
    bumpBadge();
  }

  function updateQty (key, qty) {
    let cart = getCart();
    cart = cart.map(c => (c.key === key ? { ...c, qty: Math.max(1, qty) } : c));
    saveCart(cart);
  }

  function remove (key) {
    const cart = getCart().filter(c => c.key !== key);
    saveCart(cart);
  }

  function clear () {
    saveCart([]);
  }

  function totalCount () {
    return getCart().reduce((n, c) => n + c.qty, 0);
  }

  function subtotal () {
    return getCart().reduce((n, c) => n + c.qty * c.price, 0);
  }

  function updateBadge () {
    const badge = document.querySelector('.cart-count');
    if (badge) badge.textContent = totalCount();
  }

  function bumpBadge () {
    const badge = document.querySelector('.cart-count');
    if (!badge) return;
    badge.classList.remove('bump');
    void badge.offsetWidth; // restart animation
    badge.classList.add('bump');
  }

  document.addEventListener('DOMContentLoaded', updateBadge);

  return { getCart, add, updateQty, remove, clear, totalCount, subtotal, updateBadge, parsePrice };
})();
