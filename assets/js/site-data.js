// Live content for the public site: news from Firestore, contact form into Firestore.
// If Firebase is unreachable or empty, the static HTML stays as it is.
import { db, monthLabel } from './firebase.js';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ---------- News ---------- */
async function loadNews() {
  const grid = document.querySelector('[data-news-grid]');
  if (!grid) return;
  const limit = parseInt(grid.getAttribute('data-news-limit') || '0', 10);
  const asLinks = grid.getAttribute('data-news-links') === 'true';
  try {
    const snap = await getDocs(query(collection(db, 'news'), where('published', '==', true)));
    let items = snap.docs.map((d) => d.data())
      .filter((n) => n.title)
      .sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
    if (!items.length) return; // keep the static fallback
    if (limit) items = items.slice(0, limit);
    grid.replaceChildren(...items.map((n) => {
      const card = document.createElement(asLinks ? 'a' : 'article');
      card.className = 'news-card';
      if (asLinks) card.href = 'news.html';
      const date = document.createElement('span'); date.className = 'news-date'; date.textContent = monthLabel(n.date);
      const h3 = document.createElement('h3'); h3.textContent = n.title;
      const p = document.createElement('p'); p.textContent = n.excerpt || '';
      card.append(date, h3, p);
      return card;
    }));
  } catch (e) {
    console.warn('News: using static content', e);
  }
}

/* ---------- Contact form ---------- */
window.AirlexForms = {
  async send(data) {
    await addDoc(collection(db, 'messages'), {
      name: data.name.slice(0, 120),
      phone: (data.phone || '').slice(0, 40),
      email: data.email.slice(0, 200),
      message: data.message.slice(0, 5000),
      createdAt: serverTimestamp(),
      read: false,
    });
  },
};

loadNews();
