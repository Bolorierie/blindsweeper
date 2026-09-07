// ---------- fx: canvas particle effects (mine burst, coin shower) ----------
// A single fixed, click-through canvas over the whole page. The rAF loop runs only while
// particles are alive and stops itself when the field empties, so it costs nothing at rest
// and pauses automatically when the tab is hidden. Honours prefers-reduced-motion.
const FX = { canvas: null, ctx: null, parts: [], raf: 0, dpr: 1 };
const fxReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FX_MAX = 320;

function fxInit(){
  if (FX.canvas) return;
  const c = document.createElement('canvas');
  c.id = 'fx';
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50';
  document.body.appendChild(c);
  FX.canvas = c; FX.ctx = c.getContext('2d');
  fxResize();
  addEventListener('resize', fxResize);
}
function fxResize(){
  if (!FX.canvas) return;
  FX.dpr = Math.min(2, window.devicePixelRatio || 1);
  FX.canvas.width = Math.floor(innerWidth * FX.dpr);
  FX.canvas.height = Math.floor(innerHeight * FX.dpr);
  FX.ctx.setTransform(FX.dpr, 0, 0, FX.dpr, 0, 0);
}
function fxTick(){
  const ctx = FX.ctx, alive = [];
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of FX.parts){
    p.vy += p.g; p.vx *= p.drag; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
    if (p.life <= 0 || p.y > innerHeight + 40) continue;
    const t = p.life / p.life0; // 1 at birth -> 0 at death
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.kind === 'ring'){
      ctx.globalAlpha = Math.max(0, t * 0.7);
      ctx.strokeStyle = p.color; ctx.lineWidth = 2 + (1 - t) * 3;
      ctx.beginPath(); ctx.arc(0, 0, (1 - t) * p.r, 0, Math.PI * 2); ctx.stroke();
    } else if (p.kind === 'coin'){
      ctx.globalAlpha = Math.max(0, Math.min(1, t * 3)); // hold, then fade at the end
      const w = Math.abs(Math.cos(p.rot)) * p.r + 1;     // squash to fake a spinning disc
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(0, 0, w, p.r, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(-w * 0.35, -1, w * 0.7, 1.4);          // a slot so it reads as a coin
    } else {
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
    }
    ctx.restore();
    alive.push(p);
  }
  ctx.globalAlpha = 1;
  FX.parts = alive;
  if (FX.parts.length) FX.raf = requestAnimationFrame(fxTick);
  else { FX.raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}
function fxRun(){ if (!FX.raf) FX.raf = requestAnimationFrame(fxTick); }
function fxAdd(p){ if (FX.parts.length < FX_MAX) FX.parts.push(p); }

// explosion at a viewport point: a shockwave ring plus sparks and debris
function fxBurst(x, y){
  if (fxReduced) return;
  fxInit();
  const cols = ['#d9443b', '#f08a24', '#e6c35c', '#7a1d18', '#e6e1cf'];
  fxAdd({ kind: 'ring', x, y, vx: 0, vy: 0, g: 0, drag: 1, r: 72, rot: 0, vr: 0, life: 26, life0: 26, color: '#f08a24' });
  for (let i = 0; i < 30; i++){
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7.5, life = 26 + Math.random() * 24;
    fxAdd({
      kind: Math.random() < 0.45 ? 'debris' : 'spark',
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.5,
      g: 0.36, drag: 0.95, r: 2 + Math.random() * 4.5,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.5,
      life, life0: life, color: cols[Math.floor(Math.random() * cols.length)],
    });
  }
  fxRun();
}
// burst centred on a board cell (called from dig on a mine hit)
function fxBurstCell(r, c){
  const el = boardEl.children[r * R.cols + c]; if (!el) return;
  const b = el.getBoundingClientRect();
  fxBurst(b.left + b.width / 2, b.top + b.height / 2);
}
// coins raining down over a rectangle (called when the shop / round-clear total appears)
function fxCoins(rect){
  if (fxReduced || !rect || !rect.width) return;
  fxInit();
  const cols = ['#e6c35c', '#f0d67a', '#c99b3a'];
  for (let i = 0; i < 36; i++){
    const life = 64 + Math.random() * 46;
    fxAdd({
      kind: 'coin',
      x: rect.left + Math.random() * rect.width,
      y: rect.top - 24 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 1.4, vy: 1 + Math.random() * 2.4,
      g: 0.2, drag: 0.997, r: 4 + Math.random() * 3,
      rot: Math.random() * Math.PI, vr: 0.16 + Math.random() * 0.22,
      life, life0: life, color: cols[Math.floor(Math.random() * cols.length)],
    });
  }
  fxRun();
}
