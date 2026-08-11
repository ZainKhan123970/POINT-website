document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const btn   = item.querySelector('.faq-q');
    const panel = item.querySelector('.faq-a');
    if (!btn || !panel) return;

    panel.style.maxHeight = '0px';

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // close any other open item first
      items.forEach(other => {
        if (other !== item && other.classList.contains('open')) {
          const otherPanel = other.querySelector('.faq-a');
          otherPanel.style.maxHeight = otherPanel.scrollHeight + 'px';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => { otherPanel.style.maxHeight = '0px'; });
          });
          other.classList.remove('open');
        }
      });

      if (isOpen) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { panel.style.maxHeight = '0px'; });
        });
        item.classList.remove('open');
      } else {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        item.classList.add('open');
      }
    });
  });
});
