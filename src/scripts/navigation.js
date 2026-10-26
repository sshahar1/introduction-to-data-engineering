import { navigate } from 'astro:transitions/client';

const NEXT_KEYS = ['ArrowRight', 'Enter', ' '];
const PREV_KEY = 'ArrowLeft';
const SWIPE_DELTA = 10;

// Read the current position from the page on every event: the client router
// swaps the DOM, so values captured at load time would go stale.
function go(delta) {
  const slide = document.getElementById('slide');
  const index = Number(slide?.dataset.index);
  const total = Number(slide?.dataset.total);
  if (!index || !total) return;

  const target = index + delta;
  if (target < 1 || target > total) return;
  navigate(`/${target}`);
}

document.addEventListener('keydown', ({ key }) => {
  if (NEXT_KEYS.includes(key)) go(1);
  else if (key === PREV_KEY) go(-1);
});

let start = null;

document.addEventListener(
  'touchstart',
  ({ touches }) => {
    start = { x: touches[0].clientX, y: touches[0].clientY };
  },
  { passive: true }
);

document.addEventListener('touchend', ({ changedTouches }) => {
  if (!start) return;
  const dx = changedTouches[0].clientX - start.x;
  const dy = changedTouches[0].clientY - start.y;
  start = null;
  if (Math.abs(dx) < SWIPE_DELTA || Math.abs(dx) <= Math.abs(dy)) return;
  go(dx < 0 ? 1 : -1);
});
