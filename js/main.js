// ---------- input ----------
let pressT = null, pressed = null, longFired = false;
boardEl.addEventListener('contextmenu', e => { e.preventDefault(); const el = e.target.closest('.cell'); if (el) toggleFlag(+el.dataset.r, +el.dataset.c); });
boardEl.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const el = e.target.closest('.cell'); if (!el) return;
  pressed = el; longFired = false;
  pressT = setTimeout(() => { longFired = true; toggleFlag(+el.dataset.r, +el.dataset.c); }, 380);
});
const release = e => {
  clearTimeout(pressT);
  const el = e.target.closest && e.target.closest('.cell');
  if (!longFired && el && el === pressed) {
    const r = +el.dataset.r, c = +el.dataset.c;
    if (R.mode === 'sonar') sonar(r, c);
    else if (R.mode === 'flag') toggleFlag(r, c);
    else dig(r, c);
  }
  pressed = null;
};
boardEl.addEventListener('pointerup', release);
boardEl.addEventListener('pointercancel', () => { clearTimeout(pressT); pressed = null; });
boardEl.addEventListener('pointerleave', () => { clearTimeout(pressT); pressed = null; });
$('flagmode').addEventListener('click', () => { R.mode = R.mode === 'flag' ? 'dig' : 'flag'; renderAll(); });
$('sonarbtn').addEventListener('click', () => { R.mode = R.mode === 'sonar' ? 'dig' : 'sonar'; renderAll(); if (R.mode === 'sonar') toast('Sonar armed. Tap a hidden cell.'); });
$('shovelbtn').addEventListener('click', shovel);
addEventListener('keydown', e => { if (e.code === 'KeyF' && R && !R.over) { R.mode = R.mode === 'flag' ? 'dig' : 'flag'; renderAll(); } });
$('sfxbtn').addEventListener('click', () => { audioInit(); setSfx(!AU.sfx); renderAll(); if (AU.sfx) SFX.buy(); });
// browsers only allow audio after a user gesture, so the context is created on the first click anywhere
addEventListener('pointerdown', audioInit, { once: true });
$('startbtn').addEventListener('click', () => { audioInit(); $('title').hidden = true; newRun(); });
$('againbtn').addEventListener('click', () => { $('over').hidden = true; newRun(); });

newRun();
