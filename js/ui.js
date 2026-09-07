// ---------- rendering ----------
function renderCell(r, c){
  const cell = R.grid[r][c], el = boardEl.children[r * R.cols + c];
  let cls = 'cell', txt = '';
  if (cell.rev) {
    cls += ' rev';
    if (cell.mine) { cls += ' ' + cell.state; txt = cell.state === 'defused' ? '◌' : '✸'; }
    else if (cell.n === 0) cls += ' zero';
    else { const fog = R.boss && R.boss.id === 'fog' && cell.n > 3; cls += ' n' + cell.n; txt = fog ? '3+' : cell.n; }
    if (cell.state === 'pop') { cls += ' pop'; el.style.animationDelay = Math.min(cell.k || 0, 40) * 18 + 'ms'; cell.state = ''; }
    else el.style.animationDelay = '';
  } else {
    if (cell.flag) { cls += ' flag'; if (R.over && !cell.mine) cls += ' wrong'; }
    if (cell.state === 'mineshow') { cls += ' rev mineshow'; txt = '✸'; }
    if (cell.peek) cls += ' peek-' + cell.peek;
    if (!R.first && hasBonus(r, c) && !cell.mine && cell.peek === 'safe') cls += ' bonus';
  }
  if (cell.rev && !cell.mine && hasBonus(r, c)) cls += ' bonus';
  el.className = cls; el.textContent = txt;
}
function renderAll(){
  for (let r = 0; r < R.rows; r++) for (let c = 0; c < R.cols; c++) renderCell(r, c);
  $('round').textContent = run.round;
  $('bossname').textContent = R.boss ? 'Boss · ' + R.boss.name : '';
  $('target').textContent = R.target;
  setScore(R.score, R.first);
  $('bar').classList.toggle('done', R.score >= R.target);
  const mult = $('mult'); mult.textContent = '×' + R.mult;
  if (R.bonusHit) { R.bonusHit = false; mult.classList.remove('flash'); void mult.offsetWidth; mult.classList.add('flash'); }
  $('hearts').innerHTML = Array.from({ length: run.maxHearts }, (_, i) => `<span class="${i < run.hearts ? '' : 'lost'}">♥</span>`).join('');
  $('coins').textContent = run.coins;
  $('safeleft').textContent = R.first ? '—' : R.safeLeft;
  $('minecount').textContent = R.mines;
  $('relics').innerHTML = run.relics.length ? run.relics.map(id => { const x = RELICS.find(y => y.id === id); return `<div class="relic"><span><b>${x.name}</b><small>${x.desc}</small></span></div>`; }).join('') : '<div class="empty">None yet. Clear a round to shop.</div>';
  const sb = $('sonarbtn'), sh = $('shovelbtn');
  sb.hidden = !has('sonar'); sb.disabled = R.sonarUsed || R.over; sb.classList.toggle('on', R.mode === 'sonar'); sb.textContent = R.sonarUsed ? 'Sonar used' : 'Sonar';
  sh.hidden = !has('shovel'); sh.disabled = R.shovelUsed || R.over; sh.textContent = R.shovelUsed ? 'Shovel used' : 'Shovel';
  $('flagmode').classList.toggle('on', R.mode === 'flag');
  $('sfxbtn').classList.toggle('on', AU.sfx);
  mainEl.classList.toggle('sonar', R.mode === 'sonar');
}
// score counts up with a tick instead of jumping; the bar follows the displayed value
let shownScore = 0, scoreAnim = 0, lastTick = 0;
function setScore(v, snap){
  cancelAnimationFrame(scoreAnim);
  const el = $('score'), fill = $('bar').firstElementChild;
  const paint = n => { el.textContent = n; fill.style.width = Math.min(100, n / R.target * 100) + '%'; };
  if (snap || v < shownScore || document.hidden) { shownScore = v; paint(v); return; } // hidden: rAF is paused, so snap
  const from = shownScore, dur = Math.min(700, 220 + (v - from) * 5), t0 = performance.now();
  const frame = now => {
    const p = Math.min(1, (now - t0) / dur), n = Math.round(from + (v - from) * (1 - Math.pow(1 - p, 3)));
    if (n !== shownScore) { shownScore = n; paint(n); if (now - lastTick > 40) { lastTick = now; SFX.tick(); } }
    if (p < 1) scoreAnim = requestAnimationFrame(frame);
  };
  scoreAnim = requestAnimationFrame(frame);
}
let gainT;
function showGain(v){
  const g = $('gain'); g.textContent = '+' + v; g.classList.add('on');
  clearTimeout(gainT); gainT = setTimeout(() => g.classList.remove('on'), 900);
}
let toastT;
function toast(msg, ms = 1800){
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}

