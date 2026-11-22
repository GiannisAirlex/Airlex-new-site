// Airlex Hellas — admin panel (Firebase Auth + Firestore)
import { app, db, monthLabel } from '../assets/js/firebase.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  collection, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy,
  serverTimestamp, Timestamp, writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const auth = getAuth(app);
const $ = (id) => document.getElementById(id);
const views = { login: $('loginView'), denied: $('deniedView'), app: $('appView') };
function showView(name) { Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; }); }
function toast(text) {
  const t = $('toast'); t.textContent = text; t.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const AUTH_ERRORS = {
  'auth/invalid-credential': 'Λάθος email ή κωδικός.',
  'auth/invalid-email': 'Μη έγκυρο email.',
  'auth/too-many-requests': 'Πολλές προσπάθειες. Δοκιμάστε ξανά σε λίγο.',
  'auth/network-request-failed': 'Πρόβλημα σύνδεσης στο διαδίκτυο.',
  'auth/operation-not-allowed': 'Η σύνδεση με email δεν έχει ενεργοποιηθεί στο Firebase.',
  'auth/configuration-not-found': 'Το Firebase Authentication δεν έχει ενεργοποιηθεί ακόμη.',
};

/* ---------------- Auth ---------------- */
let unsubs = [];
onAuthStateChanged(auth, async (user) => {
  unsubs.forEach((u) => u()); unsubs = [];
  if (!user) { showView('login'); return; }
  let isAdmin = false;
  try { isAdmin = (await getDoc(doc(db, 'admins', user.uid))).exists(); } catch (e) { console.warn(e); }
  if (!isAdmin) {
    $('deniedEmail').textContent = user.email; $('deniedUid').textContent = user.uid;
    showView('denied'); return;
  }
  $('userEmail').textContent = user.email;
  showView('app');
  startMessages(); startNews();
});

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('loginMsg'); msg.className = 'msg'; msg.textContent = '';
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, $('loginEmail').value.trim(), $('loginPassword').value);
  } catch (err) {
    msg.textContent = AUTH_ERRORS[err.code] || 'Η σύνδεση απέτυχε (' + (err.code || err.message) + ').';
  } finally { btn.disabled = false; }
});
$('resetBtn').addEventListener('click', async () => {
  const msg = $('loginMsg'); const email = $('loginEmail').value.trim();
  if (!email) { msg.className = 'msg'; msg.textContent = 'Γράψτε πρώτα το email σας.'; return; }
  try { await sendPasswordResetEmail(auth, email); msg.className = 'msg ok'; msg.textContent = 'Σας στείλαμε email για νέο κωδικό.'; }
  catch (err) { msg.className = 'msg'; msg.textContent = AUTH_ERRORS[err.code] || err.message; }
});
$('logoutBtn').addEventListener('click', () => signOut(auth));
$('deniedLogout').addEventListener('click', () => signOut(auth));

/* ---------------- Tabs ---------------- */
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  $('tab-messages').hidden = b.dataset.tab !== 'messages';
  $('tab-news').hidden = b.dataset.tab !== 'news';
}));

/* ---------------- Messages ---------------- */
let messages = [];
function startMessages() {
  unsubs.push(onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (snap) => {
    messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderMessages();
  }, (err) => toast('Σφάλμα μηνυμάτων: ' + err.code)));
}
$('onlyUnread').addEventListener('change', renderMessages);
function renderMessages() {
  const unread = messages.filter((m) => !m.read).length;
  $('unreadBadge').hidden = !unread; $('unreadBadge').textContent = unread;
  const list = $('messagesList');
  const shown = $('onlyUnread').checked ? messages.filter((m) => !m.read) : messages;
  $('messagesEmpty').hidden = shown.length > 0;
  list.replaceChildren(...shown.map((m) => {
    const card = el('article', 'card msg-card' + (m.read ? '' : ' unread'));
    const left = el('div');
    left.append(el('div', 'name', m.name));
    const meta = el('div', 'meta');
    const when = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString('el-GR', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    meta.append(el('span', null, when));
    if (m.email) { const a = el('a', null, m.email); a.href = 'mailto:' + m.email; meta.append(a); }
    if (m.phone) { const a = el('a', null, m.phone); a.href = 'tel:' + m.phone.replace(/[^+\d]/g, ''); meta.append(a); }
    left.append(meta);
    const acts = el('div', 'row-actions');
    const readBtn = el('button', 'btn', m.read ? 'Αδιάβαστο' : 'Αναγνώστηκε');
    readBtn.onclick = () => updateDoc(doc(db, 'messages', m.id), { read: !m.read }).catch((e) => toast(e.code));
    const delBtn = el('button', 'btn btn-danger', 'Διαγραφή');
    delBtn.onclick = () => { if (confirm('Διαγραφή του μηνύματος από ' + m.name + ';')) deleteDoc(doc(db, 'messages', m.id)).then(() => toast('Διαγράφηκε')).catch((e) => toast(e.code)); };
    acts.append(readBtn, delBtn);
    card.append(left, acts, el('div', 'body', m.message));
    return card;
  }));
}

/* ---------------- News ---------------- */
let news = [];
let editingId = null;
function startNews() {
  unsubs.push(onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc')), (snap) => {
    news = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderNews();
  }, (err) => toast('Σφάλμα νέων: ' + err.code)));
}
function renderNews() {
  $('newsEmpty').hidden = news.length > 0;
  $('importBtn').hidden = news.length > 0;
  $('newsList').replaceChildren(...news.map((n) => {
    const row = el('article', 'card news-row');
    const left = el('div');
    const date = el('div', 'date', monthLabel(n.date));
    const title = el('div', 'title', n.title);
    if (!n.published) title.append(el('span', 'pill', 'Πρόχειρο'));
    left.append(date, title, el('div', 'excerpt', n.excerpt || ''));
    const acts = el('div', 'row-actions');
    const edit = el('button', 'btn', 'Επεξεργασία'); edit.onclick = () => openNewsForm(n);
    const del = el('button', 'btn btn-danger', 'Διαγραφή');
    del.onclick = () => { if (confirm('Διαγραφή του άρθρου «' + n.title + '»;')) deleteDoc(doc(db, 'news', n.id)).then(() => toast('Διαγράφηκε')).catch((e) => toast(e.code)); };
    acts.append(edit, del);
    row.append(left, acts);
    return row;
  }));
}
function openNewsForm(n) {
  editingId = n ? n.id : null;
  $('newsFormTitle').textContent = n ? 'Επεξεργασία άρθρου' : 'Νέο άρθρο';
  $('newsTitle').value = n?.title || '';
  const d = n?.date?.toDate ? n.date.toDate() : new Date();
  $('newsDate').value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $('newsExcerpt').value = n?.excerpt || '';
  $('newsPublished').checked = n ? !!n.published : true;
  $('newsForm').hidden = false; $('newsTitle').focus();
}
$('newNewsBtn').addEventListener('click', () => openNewsForm(null));
$('newsCancel').addEventListener('click', () => { $('newsForm').hidden = true; });
$('newsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!e.target.checkValidity()) { e.target.reportValidity(); return; }
  const data = {
    title: $('newsTitle').value.trim(),
    excerpt: $('newsExcerpt').value.trim(),
    date: Timestamp.fromDate(new Date($('newsDate').value + 'T12:00:00')),
    published: $('newsPublished').checked,
  };
  try {
    if (editingId) await updateDoc(doc(db, 'news', editingId), data);
    else await addDoc(collection(db, 'news'), { ...data, createdAt: serverTimestamp() });
    $('newsForm').hidden = true; toast('Αποθηκεύτηκε — εμφανίζεται ήδη στην ιστοσελίδα');
  } catch (err) { toast('Δεν αποθηκεύτηκε: ' + err.code); }
});

// One-time import of the news that were hard-coded on the site
const EXISTING_NEWS = [
  ['2026-07-01', 'Νέες παραλαβές εξοπλισμού αερισμού για έργα υποδομής', 'Ενισχύσαμε το απόθεμά μας σε αξονικούς ανεμιστήρες και jet fans για έργα μετρό & τούνελ, με στόχο ταχύτερους χρόνους παράδοσης.'],
  ['2026-06-01', 'Επέκταση γκάμας σε προϊόντα παθητικής πυροπροστασίας', 'Νέα πιστοποιημένα υλικά πυροφραγμών & πυράντοχων διελεύσεων προστέθηκαν στο χαρτοφυλάκιο προϊόντων μας.'],
  ['2026-05-01', 'Airlex Hellas: Νέος ιστότοπος, ίδια δέσμευση σε ποιότητα', 'Ανανεώσαμε την online παρουσία μας για ταχύτερη & ευκολότερη πρόσβαση στα προϊόντα & τις κατηγορίες μας.'],
  ['2026-04-01', 'Νέες παραλαβές αντλιών θερμότητας ενόψει σεζόν', 'Ενημερωθείτε για τη διαθεσιμότητα νέων μοντέλων αντλιών θερμότητας υψηλής ενεργειακής απόδοσης.'],
  ['2026-03-01', 'Συμμετοχή σε τεχνικές ημερίδες για έργα υποδομής', 'Η ομάδα μας συμμετείχε σε ενημερωτικές συναντήσεις για τον εξοπλισμό αερισμού σε υπόγεια έργα.'],
  ['2026-02-01', 'Νέες κούπολες & θυρίδες καπνού στο χαρτοφυλάκιό μας', 'Διευρύναμε τη γκάμα μας σε προϊόντα φυσικού φωτισμού & εξαερισμού καπνού οροφής.'],
];
$('importBtn').addEventListener('click', async () => {
  const batch = writeBatch(db);
  EXISTING_NEWS.forEach(([d, title, excerpt]) => batch.set(doc(collection(db, 'news')), {
    title, excerpt, date: Timestamp.fromDate(new Date(d + 'T12:00:00')), published: true, createdAt: serverTimestamp(),
  }));
  try { await batch.commit(); toast('Εισήχθησαν ' + EXISTING_NEWS.length + ' νέα'); } catch (e) { toast('Σφάλμα: ' + e.code); }
});
