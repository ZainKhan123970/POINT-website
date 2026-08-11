document.addEventListener('DOMContentLoaded', () => {
  if (!window.PointCart) return;

  /* -----------------------------------------------------------------------
     ORDER SUMMARY — mini read-only list pulled from the shared cart
     ----------------------------------------------------------------------- */
  const summaryList = document.getElementById('checkoutSummaryList');
  const summarySubtotal = document.getElementById('checkoutSubtotal');
  const summaryShipping = document.getElementById('checkoutShipping');
  const summaryTotal = document.getElementById('checkoutTotal');
  const FREE_SHIP_THRESHOLD = 7500;
  const SHIPPING_FLAT = 250;

  function money (n) { return 'Rs. ' + n.toLocaleString('en-PK'); }

  function renderSummary () {
    const cart = window.PointCart.getCart();
    if (!summaryList) return;
    summaryList.innerHTML = cart.map(item => `
      <div class="checkout-mini-item">
        <img src="${item.img}" alt="${item.name}">
        <div>
          <div class="name">${item.name}</div>
          <div class="meta">${item.color ? item.color + ' · ' : ''}Size ${item.size} · Qty ${item.qty}</div>
        </div>
        <span class="price">${money(item.price * item.qty)}</span>
      </div>
    `).join('');

    const subtotal = window.PointCart.subtotal();
    const shipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT;
    if (summarySubtotal) summarySubtotal.textContent = money(subtotal);
    if (summaryShipping) summaryShipping.textContent = shipping === 0 ? 'Free' : money(shipping);
    if (summaryTotal) summaryTotal.textContent = money(subtotal + shipping);
  }
  renderSummary();

  /* -----------------------------------------------------------------------
     PAYMENT METHOD TABS
     ----------------------------------------------------------------------- */
  const methodBtns = document.querySelectorAll('.pay-method');
  const panels = {
    cod: document.getElementById('payPanelCod'),
    bank: document.getElementById('payPanelBank'),
    jazzcash: document.getElementById('payPanelJazzcash'),
    card: document.getElementById('payPanelCard'),
  };
  let currentMethod = 'cod';

  function switchMethod (method) {
    currentMethod = method;
    methodBtns.forEach(b => b.classList.toggle('active', b.dataset.method === method));
    Object.entries(panels).forEach(([key, panel]) => {
      if (!panel) return;
      panel.classList.toggle('active', key === method);
    });
    updatePlaceOrderBtn();
  }

  methodBtns.forEach(btn => btn.addEventListener('click', () => switchMethod(btn.dataset.method)));

  /* -----------------------------------------------------------------------
     CREDIT CARD FORM — live preview + flip on CVV focus + brand detection
     ----------------------------------------------------------------------- */
  const ccNumber   = document.getElementById('ccNumber');
  const ccName     = document.getElementById('ccName');
  const ccMonth    = document.getElementById('ccMonth');
  const ccYear     = document.getElementById('ccYear');
  const ccCvv      = document.getElementById('ccCvv');
  const ccCard     = document.getElementById('ccCard');
  const ccNumberDisplay = document.getElementById('ccNumberDisplay');
  const ccNameDisplay   = document.getElementById('ccNameDisplay');
  const ccExpiryDisplay = document.getElementById('ccExpiryDisplay');
  const ccCvvDisplay    = document.getElementById('ccCvvDisplay');
  const ccBrandFront    = document.getElementById('ccBrandFront');
  const ccBrandBack     = document.getElementById('ccBrandBack');

  const MASTERCARD_LOGO = '<span class="mc-circle red"></span><span class="mc-circle orange"></span>';
  const VISA_LOGO = '<span class="visa-text">VISA</span>';
  const GENERIC_LOGO = '<span class="generic-text">CARD</span>';

  function detectBrand (digits) {
    if (/^4/.test(digits)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^6(011|5)/.test(digits)) return 'discover';
    return 'generic';
  }

  function brandLogo (brand) {
    if (brand === 'visa') return VISA_LOGO;
    if (brand === 'mastercard') return MASTERCARD_LOGO;
    if (brand === 'amex') return '<span class="generic-text">AMEX</span>';
    if (brand === 'discover') return '<span class="generic-text">DISCOVER</span>';
    return GENERIC_LOGO;
  }

  // populate month / year selects
  if (ccMonth) {
    for (let m = 1; m <= 12; m++) {
      const v = String(m).padStart(2, '0');
      ccMonth.insertAdjacentHTML('beforeend', `<option value="${v}">${v}</option>`);
    }
  }
  if (ccYear) {
    const y = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      const v = y + i;
      ccYear.insertAdjacentHTML('beforeend', `<option value="${v}">${v}</option>`);
    }
  }

  if (ccNumber) {
    ccNumber.addEventListener('input', () => {
      let digits = ccNumber.value.replace(/\D/g, '').slice(0, 16);
      ccNumber.value = digits.replace(/(.{4})/g, '$1 ').trim();

      const brand = detectBrand(digits);
      if (ccBrandFront) ccBrandFront.innerHTML = brandLogo(brand);
      if (ccBrandBack) ccBrandBack.innerHTML = brandLogo(brand);

      const padded = digits.padEnd(16, '#');
      const grouped = padded.match(/.{1,4}/g).join(' ');
      if (ccNumberDisplay) ccNumberDisplay.textContent = grouped;

      updatePlaceOrderBtn();
    });
  }

  if (ccName) {
    ccName.addEventListener('input', () => {
      const val = ccName.value.trim().toUpperCase();
      if (ccNameDisplay) ccNameDisplay.textContent = val || 'YOUR NAME';
      updatePlaceOrderBtn();
    });
  }

  function updateExpiryDisplay () {
    const m = ccMonth && ccMonth.value ? ccMonth.value : 'MM';
    const y = ccYear && ccYear.value ? String(ccYear.value).slice(-2) : 'YY';
    if (ccExpiryDisplay) ccExpiryDisplay.textContent = `${m}/${y}`;
    updatePlaceOrderBtn();
  }
  if (ccMonth) ccMonth.addEventListener('change', updateExpiryDisplay);
  if (ccYear) ccYear.addEventListener('change', updateExpiryDisplay);

  if (ccCvv) {
    ccCvv.addEventListener('input', () => {
      ccCvv.value = ccCvv.value.replace(/\D/g, '').slice(0, 4);
      if (ccCvvDisplay) ccCvvDisplay.textContent = ccCvv.value || '***';
      updatePlaceOrderBtn();
    });
    ccCvv.addEventListener('focus', () => ccCard && ccCard.classList.add('flipped'));
    ccCvv.addEventListener('blur',  () => ccCard && ccCard.classList.remove('flipped'));
  }

  function cardValid () {
    if (!ccNumber) return false;
    const digits = ccNumber.value.replace(/\D/g, '');
    return digits.length >= 15 &&
      ccName && ccName.value.trim().length > 1 &&
      ccMonth && ccMonth.value &&
      ccYear && ccYear.value &&
      ccCvv && ccCvv.value.length >= 3;
  }

  /* -----------------------------------------------------------------------
     PLACE ORDER
     ----------------------------------------------------------------------- */
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const checkoutMain  = document.getElementById('checkoutMain');

  function updatePlaceOrderBtn () {
    if (!placeOrderBtn) return;
    if (currentMethod === 'card') {
      const valid = cardValid();
      placeOrderBtn.disabled = !valid;
      placeOrderBtn.textContent = valid ? 'Pay & Place Order' : 'Complete all fields';
    } else {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order';
    }
  }

  const OWNER_WHATSAPP = '923218633268'; // +92 321 8633268

  function sendOrderToWhatsApp (cart, subtotal, shipping, total, methodLabel) {
    const lines = cart.map(item =>
      `• ${item.name} (${item.color ? item.color + ', ' : ''}Size ${item.size}) x${item.qty} — ${money(item.price * item.qty)}`
    ).join('\n');

    const message =
      `New order from POINT website!\n\n` +
      `${lines}\n\n` +
      `Subtotal: ${money(subtotal)}\n` +
      `Shipping: ${shipping === 0 ? 'Free' : money(shipping)}\n` +
      `Total: ${money(total)}\n` +
      `Payment method: ${methodLabel}`;

    const url = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
  }

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
      if (placeOrderBtn.disabled) return;

      const cart = window.PointCart.getCart();
      const subtotal = window.PointCart.subtotal();
      const shipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT;
      const total = subtotal + shipping;
      const methodLabel = {
        cod: 'Cash on Delivery',
        bank: 'Bank Transfer',
        jazzcash: 'JazzCash',
        card: 'Card',
      }[currentMethod];

      sendOrderToWhatsApp(cart, subtotal, shipping, total, methodLabel);
      window.PointCart.clear();

      checkoutMain.innerHTML = `
        <div class="order-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>
          <h2>Order Placed!</h2>
          <p>Thanks — your order will be paid via <strong>${methodLabel}</strong>. We've sent your order details to our WhatsApp — we'll reach out shortly to confirm delivery.</p>
          <a href="shop.html" class="btn btn--solid">Continue Shopping</a>
        </div>
      `;
      const summaryPanel = document.querySelector('.checkout-order-summary');
      if (summaryPanel) summaryPanel.style.display = 'none';
    });
  }

  switchMethod('cod');
});
