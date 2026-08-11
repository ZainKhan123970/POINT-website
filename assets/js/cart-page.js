document.addEventListener('DOMContentLoaded', () => {
  if (!window.PointCart) return;

  const itemsWrap   = document.getElementById('cartItems');
  const emptyState  = document.getElementById('cartEmpty');
  const layout      = document.getElementById('cartLayout');
  const subtotalEl  = document.getElementById('cartSubtotal');
  const shippingEl  = document.getElementById('cartShipping');
  const totalEl     = document.getElementById('cartTotal');
  const countLabel  = document.getElementById('cartItemCount');
  const FREE_SHIP_THRESHOLD = 7500;
  const SHIPPING_FLAT = 250;

  function money (n) {
    return 'Rs. ' + n.toLocaleString('en-PK');
  }

  function render () {
    const cart = window.PointCart.getCart();

    if (cart.length === 0) {
      layout.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    layout.style.display = '';
    emptyState.style.display = 'none';

    itemsWrap.innerHTML = '';
    cart.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.style.animationDelay = (i * 0.06) + 's';
      row.dataset.key = item.key;
      row.innerHTML = `
        <div class="cart-item__media"><img src="${item.img}" alt="${item.name}"></div>
        <div class="cart-item__body">
          <h4>${item.name}</h4>
          <div class="cart-item__meta">${item.color ? item.color + ' · ' : ''}Size ${item.size}</div>
          <div class="cart-item__row">
            <div class="qty-stepper">
              <button type="button" class="qty-minus" aria-label="Decrease quantity">−</button>
              <span class="qty-val">${item.qty}</span>
              <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-item__price">${money(item.price * item.qty)}</span>
          </div>
        </div>
        <div class="cart-item__col-right">
          <button type="button" class="cart-remove" aria-label="Remove item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
      `;
      itemsWrap.appendChild(row);
    });

    const subtotal = window.PointCart.subtotal();
    const shipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT;
    const total = subtotal + shipping;
    const count = window.PointCart.totalCount();

    subtotalEl.textContent = money(subtotal);
    shippingEl.textContent = shipping === 0 ? 'Free' : money(shipping);
    totalEl.textContent = money(total);
    if (countLabel) countLabel.textContent = `${count} item${count === 1 ? '' : 's'}`;
  }

  itemsWrap.addEventListener('click', (e) => {
    const row = e.target.closest('.cart-item');
    if (!row) return;
    const key = row.dataset.key;
    const cart = window.PointCart.getCart();
    const item = cart.find(c => c.key === key);
    if (!item) return;

    if (e.target.closest('.qty-plus')) {
      window.PointCart.updateQty(key, item.qty + 1);
      pulseQty(row);
      render();
    } else if (e.target.closest('.qty-minus')) {
      if (item.qty <= 1) return;
      window.PointCart.updateQty(key, item.qty - 1);
      pulseQty(row);
      render();
    } else if (e.target.closest('.cart-remove')) {
      row.classList.add('removing');
      row.addEventListener('animationend', () => {
        window.PointCart.remove(key);
        render();
      }, { once: true });
    }
  });

  function pulseQty (row) {
    const val = row.querySelector('.qty-val');
    if (!val) return;
    val.classList.remove('pulse');
    void val.offsetWidth;
    val.classList.add('pulse');
  }

  render();
});
