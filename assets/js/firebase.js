// Firebase connection for airlex-site (public web config — access is enforced by firestore.rules)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyApeP99fb19Q8TGSSUujZL14azggOOGVtE',
  authDomain: 'airlex-site.firebaseapp.com',
  projectId: 'airlex-site',
  storageBucket: 'airlex-site.firebasestorage.app',
  messagingSenderId: '542959512570',
  appId: '1:542959512570:web:9a05f7ebb820ee01b59243',
  measurementId: 'G-ST5EYDPDYX',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const MONTHS = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
/** "2026-07-01" or Timestamp -> "Ιούλιος 2026" */
export function monthLabel(value) {
  const d = value && value.toDate ? value.toDate() : new Date(value);
  return isNaN(d) ? '' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
