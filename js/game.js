// ---------- state ----------
const $ = id => document.getElementById(id);
const rnd = n => Math.floor(Math.random() * n);
let run, R, best = 0;
try { best = +localStorage.getItem('bs-best') || 0; } catch (e) {}

function has(id){ return run.relics.includes(id); }

function newRun(){
  run = { round: 1, hearts: 3, maxHearts: 3, coins: 4, relics: [], cellsDug: 0, shopItems: [], nextBoss: null, deadmanUsed: false };
  startRound();
}
function makeBoss(round){ return round % 3 === 0 ? BOSSES[rnd(BOSSES.length)] : null; }
function startRound(){
  const r = run.round;
  const cols = Math.min(16, 8 + r), rows = Math.min(12, 7 + Math.floor(r / 2));
  const density = Math.min(0.22, 0.12 + 0.012 * r);
  const mines = Math.round(rows * cols * density);
  const boss = run.nextBoss || makeBoss(r);
  run.nextBoss = null;
  const safe = rows * cols - mines;
  const target = Math.round(safe * (1 + 8 * density) * (0.7 + 0.05 * r) * (boss && boss.id === 'tax' ? 1.4 : 1));
  R = { rows, cols, mines, boss, target, score: 0, mult: has('warm') ? 2 : 1, reveals: 0, safeLeft: safe,
        first: true, kevlarUsed: false, sonarUsed: false, shovelUsed: false, sidestepUsed: false, mode: 'dig', over: false,
        grid: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ mine: false, n: 0, rev: false, flag: false, peek: null, state: '' }))) };
  buildBoard();
  renderAll();
  if (boss) toast(`Boss: ${boss.name}. ${boss.desc}`, 3200);
  else if (r === 1) toast('Dig anywhere. The first cell is always safe.', 2600);
}

// ---------- board ----------
const boardEl = $('board'), mainEl = $('main');
function neighbours(r, c){
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < R.rows && cc >= 0 && cc < R.cols) out.push([rr, cc]);
  }
  return out;
}
function placeMines(sr, sc){
  const safeZone = new Set([`${sr},${sc}`, ...neighbours(sr, sc).map(([a, b]) => `${a},${b}`)]);
  const spots = [];
  for (let r = 0; r < R.rows; r++) for (let c = 0; c < R.cols; c++) if (!safeZone.has(`${r},${c}`)) spots.push([r, c]);
  if (has('lodestone')) {
    // mines fill the wall ring first, overflowing inward — the middle opens up
    const edge = spots.filter(([r, c]) => isBorder(r, c)), inner = spots.filter(([r, c]) => !isBorder(r, c));
    for (const arr of [edge, inner]) for (let i = arr.length - 1; i > 0; i--) { const j = rnd(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    spots.length = 0; spots.push(...edge, ...inner);
  } else {
    for (let i = spots.length - 1; i > 0; i--) { const j = rnd(i + 1); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  }
  R.mines = Math.min(R.mines, spots.length);
  for (let i = 0; i < R.mines; i++) R.grid[spots[i][0]][spots[i][1]].mine = true;
  for (let r = 0; r < R.rows; r++) for (let c = 0; c < R.cols; c++) R.grid[r][c].n = neighbours(r, c).filter(([a, b]) => R.grid[a][b].mine).length;
  R.safeLeft = R.rows * R.cols - R.mines;
}
function isBorder(r, c){ return r === 0 || c === 0 || r === R.rows - 1 || c === R.cols - 1; }
function isCorner(r, c){ return (r === 0 || r === R.rows - 1) && (c === 0 || c === R.cols - 1); }
function cellChips(r, c){
  const cell = R.grid[r][c];
  let chips = cell.n === 0 ? 1 : 1 + cell.n;
  if (has('numer') && cell.n >= 3) chips *= 2;
  return chips;
}
function hasBonus(r, c){
  return has('numer') && R.grid[r][c].n >= 3;
}

function buildBoard(){
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${R.cols}, var(--cell))`;
  for (let r = 0; r < R.rows; r++) for (let c = 0; c < R.cols; c++) {
    const d = document.createElement('div');
    d.className = 'cell'; d.dataset.r = r; d.dataset.c = c;
    boardEl.appendChild(d);
  }
  fitBoard();
}
function fitBoard(){
  if (!R) return;
  const w = mainEl.clientWidth - 40, h = mainEl.clientHeight - 40;
  const size = Math.max(20, Math.min(44, Math.floor(w / R.cols) - 2, Math.floor(h / R.rows) - 2));
  document.documentElement.style.setProperty('--cell', size + 'px');
}
addEventListener('resize', fitBoard);

// ---------- actions ----------
function dig(r, c, opts = {}){
  if (R.over) return;
  const cell = R.grid[r][c];
  if (cell.rev || cell.flag) return;
  if (R.first) {
    R.first = false;
    placeMines(r, c);
    if (has('carto')) {
      const pool = [];
      for (let a = 0; a < R.rows; a++) for (let b = 0; b < R.cols; b++) if (!R.grid[a][b].mine && (a !== r || b !== c)) pool.push([a, b]);
      for (let i = 0; i < 4 && pool.length; i++) { const [a, b] = pool.splice(rnd(pool.length), 1)[0]; reveal(a, b, true); }
    }
    if (has('survey')) for (let a = 0; a < R.rows; a++) for (let b = 0; b < R.cols; b++) if ((a === r || b === c) && R.grid[a][b].mine) R.grid[a][b].peek = 'mine';
    if (has('groundswell')) {
      const empties = [];
      for (let a = 0; a < R.rows; a++) for (let b = 0; b < R.cols; b++) { const x = R.grid[a][b]; if (!x.mine && !x.rev && x.n === 0 && (a !== r || b !== c)) empties.push([a, b]); }
      if (empties.length) { const [a, b] = empties[rnd(empties.length)]; reveal(a, b, true); }
    }
  }
  if (cell.mine) {
    // Sidestep: the first mine hit each round is relocated; you keep the cell and the heart.
    // Runs before anything else so a player owning both Sidestep and Kevlar triggers exactly one.
    if (has('sidestep') && !R.sidestepUsed) {
      const pool = [];
      for (let a = 0; a < R.rows; a++) for (let b = 0; b < R.cols; b++) { const x = R.grid[a][b]; if (!x.rev && !x.mine && !x.flag && (a !== r || b !== c)) pool.push([a, b]); }
      if (pool.length) {
        R.sidestepUsed = true;
        const [a, b] = pool[rnd(pool.length)];
        R.grid[a][b].mine = true; cell.mine = false;
        for (let rr = 0; rr < R.rows; rr++) for (let cc = 0; cc < R.cols; cc++) R.grid[rr][cc].n = neighbours(rr, cc).filter(([x, y]) => R.grid[x][y].mine).length;
        R.safeLeft++;
        SFX.defuse(); toast('Sidestep. The mine slid away.');
        const gained = reveal(r, c, false);
        showGain(gained); renderAll();
        if (R.score >= R.target) return roundClear();
        if (R.safeLeft <= 0) return endRun(false, 'The board is clean and the target is still out of reach.');
        return;
      }
      // no room to relocate: fall through to a normal hit
    }
    cell.rev = true;
    if (has('kevlar') && !R.kevlarUsed) { R.kevlarUsed = true; cell.state = 'defused'; toast('Kevlar took the blast.'); SFX.defuse(); }
    else {
      const cost = R.boss && R.boss.id === 'double' ? 2 : 1;
      // Dead Man's Switch: once per run, defuse the hit that would end the run (covers 2-heart Heavy Ordnance)
      if (has('deadman') && !run.deadmanUsed && run.hearts - cost <= 0) {
        run.deadmanUsed = true; cell.state = 'defused'; SFX.defuse();
        toast("Dead man's switch. That one was going to end it.");
        renderAll(); return;
      }
      run.hearts -= cost; cell.state = 'hit'; SFX.boom(); fxBurstCell(r, c);
      mainEl.classList.remove('shake'); void mainEl.offsetWidth; mainEl.classList.add('shake');
      if (has('insurance')) { run.coins += 3; toast(`Boom. −${cost} heart, +3 coins from Insurance.`); }
      else toast(`Boom. −${cost} heart${cost > 1 ? 's' : ''}.`);
      // Bloodhound: a mine hit gives up the location of another mine
      if (has('hound')) {
        const rest = [];
        for (let a = 0; a < R.rows; a++) for (let b = 0; b < R.cols; b++) { const z = R.grid[a][b]; if (z.mine && !z.rev && z.peek !== 'mine') rest.push([a, b]); }
        if (rest.length) { const [a, b] = rest[rnd(rest.length)]; R.grid[a][b].peek = 'mine'; }
      }
      if (run.hearts <= 0) { run.hearts = 0; renderAll(); return endRun(false, 'The last heart went with the last mine.'); }
      // Powder Keg: the blast clears the 3×3 around the hit mine (neighbour mines defused, not chained)
      if (has('powderkeg')) {
        for (const [a, b] of neighbours(r, c)) { const x = R.grid[a][b]; if (x.rev) continue; if (x.mine) { x.rev = true; x.state = 'defused'; } else reveal(a, b, false); }
        if (R.score >= R.target) { renderAll(); return roundClear(); }
      }
    }
    renderAll();
    return;
  }
  const before = R.reveals;
  let gained = reveal(r, c, false);
  // Deep Vein: a big cascade (8+ cells) pulls up one more safe cell for free
  if (has('deepvein') && R.reveals - before >= 8) {
    const pool = [];
    for (let a = 0; a < R.rows; a++) for (let b = 0; b < R.cols; b++) { const x = R.grid[a][b]; if (!x.rev && !x.mine) pool.push([a, b]); }
    if (pool.length) { const [a, b] = pool[rnd(pool.length)]; gained += reveal(a, b, true); }
  }
  // Cold Sweat: at one heart, mark the clicked cell's hidden neighbours
  if (has('coldsweat') && run.hearts === 1) for (const [a, b] of neighbours(r, c)) { const x = R.grid[a][b]; if (!x.rev && !x.flag && !x.peek) x.peek = x.mine ? 'mine' : 'safe'; }
  showGain(gained);
  renderAll();
  if (R.score >= R.target) return roundClear();
  if (R.safeLeft <= 0) return endRun(false, 'The board is clean and the target is still out of reach.');
}
// reveals safe cell (with cascade), returns score gained
function reveal(r, c, silent){
  const stack = [[r, c]];
  let gained = 0, k = 0;
  while (stack.length) {
    const [a, b] = stack.pop();
    const cell = R.grid[a][b];
    if (cell.rev || cell.mine) continue;
    if (cell.flag) cell.flag = false;
    cell.rev = true; cell.state = 'pop'; cell.k = k;
    R.reveals++; R.safeLeft--; run.cellsDug++;
    if (has('momentum') && R.reveals % 12 === 0) { R.mult++; if (!silent) { toast(`Momentum. Mult is now ×${R.mult}.`); SFX.momentum(); } }
    const chips = cellChips(a, b);
    if (!silent && k < 14) SFX.dig(chips, k);
    if (!silent && hasBonus(a, b)) R.bonusHit = true; // consumed by renderAll to flash the mult badge
    k++;
    gained += chips * R.mult;
    if (cell.n === 0 && !(R.boss && R.boss.id === 'nocascade')) for (const nb of neighbours(a, b)) stack.push(nb);
  }
  R.score += gained;
  return gained;
}
function toggleFlag(r, c){
  if (R.over) return;
  const cell = R.grid[r][c];
  if (cell.rev) return;
  cell.flag = !cell.flag;
  SFX.flag(cell.flag);
  renderCell(r, c);
}
function sonar(r, c){
  const cell = R.grid[r][c];
  if (cell.rev || R.first) { toast(R.first ? 'Dig one cell first.' : 'Already dug.'); return; }
  cell.peek = cell.mine ? 'mine' : 'safe';
  R.sonarUsed = true; R.mode = 'dig';
  SFX.sonar(cell.mine);
  toast(cell.mine ? 'Sonar: that one is a mine.' : 'Sonar: that one is safe.');
  renderAll();
}
function shovel(){
  if (R.first) { toast('Dig one cell first.'); return; }
  const pool = [];
  for (let a = 0; a < R.rows; a++) for (let b = 0; b < R.cols; b++) { const x = R.grid[a][b]; if (!x.rev && !x.mine) pool.push([a, b]); }
  if (!pool.length) return;
  R.shovelUsed = true;
  const [a, b] = pool[rnd(pool.length)];
  dig(a, b);
}

// ---------- round flow ----------
function roundClear(){
  R.over = true;
  const lines = [];
  let earn = 4; lines.push(['Round cleared', 4]);
  lines.push(['Hearts remaining', run.hearts]); earn += run.hearts;
  const interest = Math.min(5, Math.floor(run.coins / 5)); if (interest) { lines.push(['Interest (1 per 5 held, max 5)', interest]); earn += interest; }
  if (has('pockets')) { lines.push(['Deep Pockets', 2]); earn += 2; }
  if (has('flagpole')) { let f = 0; for (const row of R.grid) for (const x of row) if (x.flag && x.mine) f++; if (f) { lines.push([`Flagpole (${f} correct flags)`, f]); earn += f; } }
  run.coins += earn;
  if (run.round > best) { best = run.round; try { localStorage.setItem('bs-best', best); } catch (e) {} }
  // reveal remaining mines for the player's satisfaction
  for (const row of R.grid) for (const x of row) if (x.mine && !x.rev) x.state = 'mineshow';
  SFX.cash();
  mainEl.classList.remove('cash'); void mainEl.offsetWidth; mainEl.classList.add('cash');
  renderAll();
  setTimeout(() => openShop(lines, earn), 900);
}
function openShop(lines, earn){
  $('shop-round').textContent = run.round;
  $('earn').innerHTML = lines.map(([k, v]) => `<span>${k}</span><b>+${v}</b>`).join('') + `<span class="tot">Total</span><b class="tot">+${earn}</b>`;
  run.shopItems = rollShop();
  run.nextBoss = makeBoss(run.round + 1);
  const nb = $('nextboss');
  nb.hidden = !run.nextBoss;
  if (run.nextBoss) nb.innerHTML = `Next round is a boss: <b>${run.nextBoss.name}</b>. ${run.nextBoss.desc}`;
  renderShop();
  $('shop').hidden = false;
  { const panel = document.querySelector('#shop .panel'); if (panel) fxCoins(panel.getBoundingClientRect()); }
  if (run.round === 8) toast('Round 8 cleared. The city is defused. Everything past here is endless.', 4000);
}
function rollShop(){
  const pool = RELICS.filter(x => !has(x.id));
  for (let i = pool.length - 1; i > 0; i--) { const j = rnd(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const items = pool.slice(0, 3).map(x => ({ ...x, sold: false }));
  items.push({ ...MEDKIT, sold: false });
  return items;
}
function renderShop(){
  $('shop-coins').textContent = run.coins;
  $('shopitems').innerHTML = run.shopItems.map((x, i) => `<div class="relic ${x.sold ? 'sold' : ''}" data-i="${i}"><span><b>${x.name}</b><small>${x.desc}</small></span><span class="price"><em class="buy"></em>${x.sold ? 'Sold' : x.price + ' c'}</span></div>`).join('');
  $('reroll').disabled = run.coins < 2;
  $('shop-msg').textContent = run.relics.length >= MAX_RELICS ? `Relic slots full (${MAX_RELICS}).` : `${run.relics.length}/${MAX_RELICS} relic slots used.`;
}
const TOUCH_ONLY = matchMedia('(hover: none)').matches;
$('shopitems').addEventListener('click', e => {
  const el = e.target.closest('.relic'); if (!el) return;
  const item = run.shopItems[+el.dataset.i];
  if (item.sold) return;
  if (run.coins < item.price) { toast('Not enough coins.'); SFX.nope(); return; }
  if (!item.consumable && run.relics.length >= MAX_RELICS) { toast('Relic slots are full.'); SFX.nope(); return; }
  // no hover on touch screens, so the first tap arms the card and the second buys
  if (TOUCH_ONLY && !el.classList.contains('armed')) { for (const x of el.parentNode.children) x.classList.remove('armed'); el.classList.add('armed'); return; }
  run.coins -= item.price; item.sold = true; SFX.buy();
  if (item.id === 'medkit') { run.hearts = Math.min(run.maxHearts, run.hearts + 1); toast('Healed one heart.'); }
  else { run.relics.push(item.id); if (item.id === 'heart') { run.maxHearts++; run.hearts = Math.min(run.maxHearts, run.hearts + 1); } toast(`Bought ${item.name}.`); }
  renderShop(); renderAll();
});
$('reroll').addEventListener('click', () => { if (run.coins < 2) return; run.coins -= 2; run.shopItems = rollShop(); SFX.buy(); renderShop(); });
$('nextbtn').addEventListener('click', () => { $('shop').hidden = true; run.round++; startRound(); });

function endRun(won, text){
  R.over = true;
  SFX.over();
  for (const row of R.grid) for (const x of row) if (x.mine && !x.rev) x.state = 'mineshow';
  renderAll();
  $('over-title').textContent = won ? 'Run complete' : 'Run over';
  $('over-text').textContent = text;
  $('o-round').textContent = run.round; $('o-cells').textContent = run.cellsDug; $('o-best').textContent = best;
  setTimeout(() => { $('over').hidden = false; }, 700);
}

