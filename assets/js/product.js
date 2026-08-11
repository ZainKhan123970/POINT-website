document.addEventListener('DOMContentLoaded', () => {

  /* Thumbnail -> main image swap */
  const thumbs   = document.querySelectorAll('.product-thumb');
  const mainImg  = document.getElementById('productMainImg');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImg) {
        mainImg.style.opacity = 0;
        setTimeout(() => {
          mainImg.src = thumb.dataset.full;
          mainImg.style.opacity = 1;
        }, 120);
      }
    });
  });

  /* Color select */
  const colorSwatches = document.querySelectorAll('.product-colors .swatch');
  const colorLabel = document.getElementById('selectedColor');
  colorSwatches.forEach(sw => {
    sw.addEventListener('click', () => {
      colorSwatches.forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      if (colorLabel) colorLabel.textContent = sw.dataset.color;
      if (sw.dataset.img && mainImg) {
        mainImg.style.opacity = 0;
        setTimeout(() => {
          mainImg.src = sw.dataset.img;
          mainImg.style.opacity = 1;
        }, 120);
      }
    });
  });

  /* Size select */
  const sizePills = document.querySelectorAll('.product-sizes .size-pill');
  sizePills.forEach(pill => {
    pill.addEventListener('click', () => {
      sizePills.forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });

  function currentSelection() {
    const selectedColorEl = document.querySelector('.product-colors .swatch.selected');
    const selectedSizeEl  = document.querySelector('.product-sizes .size-pill.selected');
    const color = selectedColorEl ? selectedColorEl.dataset.color : 'Black';
    return {
      name: 'Point Logo Tee — ' + color,
      price: 3499,
      img: mainImg ? mainImg.src : 'assets/images/tee-black.png',
      size: selectedSizeEl ? selectedSizeEl.textContent.trim() : 'M',
      color,
    };
  }

  /* Add to Cart -> pushes a real line item into the shared cart */
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (window.PointCart) window.PointCart.add(currentSelection());
      const original = addToCartBtn.textContent;
      addToCartBtn.textContent = 'Added ✓';
      setTimeout(() => { addToCartBtn.textContent = original; }, 1400);
    });
  }

  /* Buy Now -> add to cart, then jump straight to checkout (cart page) */
  const buyNowBtn = document.getElementById('buyNowBtn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      if (window.PointCart) window.PointCart.add(currentSelection());
      window.location.href = 'cart.html';
    });
  }

});
