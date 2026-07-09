import { initPassportBook } from './passport.js';
import { initCountdown } from './countdown.js';
import { renderClues } from './clues.js';

let stopCountdown = null;

initPassportBook({
  onSealed: () => {
    stopCountdown = initCountdown((diffMs) => renderClues(diffMs));
  },
});

window.addEventListener('beforeunload', () => {
  if (stopCountdown) stopCountdown();
});
