import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import {continueRender, delayRender} from 'remotion';

const handle = delayRender('Loading Manrope (Greek + Latin)');
const sample = 'Αα Ωω Airlex 0123';
Promise.all(
  ['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Manrope`, sample)),
)
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
