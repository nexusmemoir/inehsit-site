// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
  });
}, { threshold: 0.08 });
revealEls.forEach(el => io.observe(el));

// Form submit — sends to /api/submit, stores in admin panel
async function submitForm(page) {
  const name = document.getElementById('f-name')?.value.trim();
  const phone = document.getElementById('f-phone')?.value.trim();
  if (!name || !phone) {
    alert('Lütfen en azından adınızı ve telefon numaranızı girin.');
    return;
  }

  // Collect all form fields
  const data = {
    source: page,
    name,
    phone,
    brand: document.getElementById('f-brand')?.value || '',
    email: document.getElementById('f-email')?.value || '',
    service: document.getElementById('f-service')?.value || '',
    occasion: document.getElementById('f-occasion')?.value || '',
    person: document.getElementById('f-person')?.value || '',
    note: document.getElementById('f-note')?.value || '',
  };

  // Google Ads conversion tracking — aktif edince yorumu kaldırın
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXXX/XXXXXXXXXXXXXXXX' });
  // }

  try {
    const btn = document.querySelector('.btn-submit, .btn-submit-new');
    if (btn) { btn.textContent = 'Gönderiliyor...'; btn.disabled = true; }

    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    // Redirect to thank you page
    window.location.href = 'tesekkur.html?src=' + page;

  } catch (err) {
    console.error(err);
    const btn = document.querySelector('.btn-submit, .btn-submit-new');
    if (btn) { btn.textContent = 'Hata oluştu, tekrar deneyin'; btn.disabled = false; }
  }
}
