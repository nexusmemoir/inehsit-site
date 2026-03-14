// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
  });
}, { threshold: 0.08 });
revealEls.forEach(el => io.observe(el));

// Form submit
function submitForm(page) {
  const name = document.getElementById('f-name')?.value.trim();
  const phone = document.getElementById('f-phone')?.value.trim();
  if (!name || !phone) {
    alert('Lütfen en azından adınızı ve telefon numaranızı girin.');
    return;
  }

  // Google Ads conversion tracking — aktif edince yorumu kaldırın
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXXX/XXXXXXXXXXXXXXXX' });
  // }

  // Redirect to thank you page
  window.location.href = 'tesekkur.html?src=' + page;
}
