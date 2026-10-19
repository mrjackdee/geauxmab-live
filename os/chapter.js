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

(() => {
  document.querySelectorAll('[data-club-events]').forEach(async container => {
    const list = container.querySelector('[data-event-list]');
    const status = container.querySelector('[data-calendar-status]');
    const limit = Number(container.dataset.limit) || 3;
    const render = events => {
      list.replaceChildren();
      if (!events.length) {
        const empty = document.createElement('p');
        empty.className = 'calendar-empty';
        empty.textContent = 'No upcoming public events are currently listed on the chapter calendar.';
        list.append(empty);
        return;
      }
      events.slice(0, limit).forEach((event, index) => {
        const row = document.createElement('a');
        row.className = 'event-row';
        row.href = event.url;
        row.target = '_blank';
        row.rel = 'noopener noreferrer';
        const count = document.createElement('span');
        count.className = 'event-count';
        count.textContent = String(index + 1).padStart(2, '0');
        const details = document.createElement('div');
        const date = document.createElement('p');
        date.textContent = event.dateLabel || 'See event details for date and time';
        const title = document.createElement('h3');
        title.textContent = event.title;
        details.append(date, title);
        const action = document.createElement('span');
        action.className = 'event-impact';
        action.textContent = 'Details and registration';
        const arrow = document.createElement('span');
        arrow.className = 'circle-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '↗';
        row.append(count, details, action, arrow);
        list.append(row);
      });
    };
    list.querySelectorAll('[data-snapshot-end]').forEach(row => {
      if (Date.parse(row.dataset.snapshotEnd) < Date.now()) row.remove();
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(container.dataset.feedUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok || !/application\/json/i.test(response.headers.get('content-type') || '')) throw new Error('Feed unavailable');
      const feed = await response.json();
      if (feed.status !== 'ok' || !Array.isArray(feed.events)) throw new Error('Invalid feed');
      const valid = feed.events.every(event => {
        try {
          const url = new URL(event.url);
          return typeof event.title === 'string' && event.title.trim() &&
            url.protocol === 'https:' && url.hostname === 'omicronsigma.clubexpress.com' &&
            url.pathname === '/content.aspx' && url.searchParams.get('club_id') === '182064' &&
            url.searchParams.get('page_id') === '4002' && /^\d+$/.test(url.searchParams.get('item_id') || '');
        } catch { return false; }
      });
      if (!valid) throw new Error('Invalid events');
      render(feed.events);
      status.textContent = 'Updated from the chapter calendar. Event details and registration are on ClubExpress.';
    } catch {
      status.textContent = list.children.length
        ? 'The live calendar could not be refreshed. Showing the listing last checked October 19, 2026. Confirm details on the official calendar.'
        : 'The live calendar could not be loaded. Open the official calendar for upcoming events.';
    } finally {
      clearTimeout(timeout);
    }
  });
})();
