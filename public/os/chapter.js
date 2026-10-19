(() => {
  const root = document.documentElement;
  const updateScroll = () => {
    const distance = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--scroll-progress', String(distance > 0 ? window.scrollY / distance : 0));
    document.body.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();
  document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', () => {
    document.querySelector('.mobile-menu')?.removeAttribute('open');
  }));
  const form = document.querySelector('.contact-form');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const topic = String(data.get('topic') || 'General inquiry');
    const body = `Name: ${data.get('name') || ''}\nEmail: ${data.get('email') || ''}\nTopic: ${topic}\n\n${data.get('message') || ''}`;
    form.querySelector('.form-note').textContent = 'Your email app is opening with your message ready to send.';
    window.location.href = `mailto:omicronsigma1914@gmail.com?subject=${encodeURIComponent(`[Website] ${topic}`)}&body=${encodeURIComponent(body)}`;
  });
})();
