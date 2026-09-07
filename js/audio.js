// ---------- audio (all synthesized with Web Audio, no files) ----------
const AU = { ctx: null, master: null, sfx: true };
try { AU.sfx = localStorage.getItem('bs-sfx') !== '0'; } catch (e) {}
function audioInit(){
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  AU.ctx = new C();
  AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.6; AU.master.connect(AU.ctx.destination);
}
// one enveloped oscillator note
function tone({ f = 440, type = 'square', dur = 0.08, vol = 0.2, slide = 0, delay = 0, dest = null }){
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime + delay, o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest || AU.master); o.start(t); o.stop(t + dur + 0.05);
}
// filtered white-noise burst (explosions, hits)
function noise({ dur = 0.4, vol = 0.5, cutoff = 800, delay = 0, dest = null, filter = 'lowpass' }){
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime + delay, len = Math.floor(AU.ctx.sampleRate * dur), buf = AU.ctx.createBuffer(1, len, AU.ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = AU.ctx.createBufferSource(), f = AU.ctx.createBiquadFilter(), g = AU.ctx.createGain();
  s.buffer = buf; f.type = filter;
  if (filter === 'highpass') f.frequency.setValueAtTime(cutoff, t);
  else { f.frequency.setValueAtTime(cutoff * 3, t); f.frequency.exponentialRampToValueAtTime(cutoff / 4, t + dur); }
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(dest || AU.master); s.start(t);
}
const SFX = {
  dig(chips, i){ if (AU.sfx) tone({ f: 260 + Math.min(chips, 12) * 35 + i * 12, type: 'square', dur: 0.06, vol: 0.09, delay: i * 0.022 }); },
  tick(){ if (AU.sfx) tone({ f: 1500 + Math.random() * 300, type: 'square', dur: 0.018, vol: 0.035 }); },
  flag(on){ if (AU.sfx) tone({ f: on ? 880 : 620, type: 'triangle', dur: 0.06, vol: 0.14 }); },
  boom(){ if (!AU.sfx) return; noise({ dur: 0.6, vol: 0.7, cutoff: 600 }); tone({ f: 90, type: 'sine', dur: 0.55, vol: 0.6, slide: -60 }); },
  defuse(){ if (!AU.sfx) return; noise({ dur: 0.2, vol: 0.25, cutoff: 2000 }); tone({ f: 500, type: 'triangle', dur: 0.25, vol: 0.2, slide: 300 }); },
  cash(){ if (AU.sfx) [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.22, vol: 0.18, delay: i * 0.085 })); },
  buy(){ if (!AU.sfx) return; tone({ f: 660, type: 'triangle', dur: 0.09, vol: 0.16 }); tone({ f: 990, type: 'triangle', dur: 0.14, vol: 0.16, delay: 0.08 }); },
  nope(){ if (AU.sfx) tone({ f: 180, type: 'sawtooth', dur: 0.16, vol: 0.12, slide: -70 }); },
  sonar(mine){ if (!AU.sfx) return; tone({ f: 1400, type: 'sine', dur: 0.5, vol: 0.14, slide: -900 }); if (mine) tone({ f: 220, type: 'square', dur: 0.2, vol: 0.12, delay: 0.3 }); },
  momentum(){ if (!AU.sfx) return; tone({ f: 440, type: 'square', dur: 0.08, vol: 0.14 }); tone({ f: 880, type: 'square', dur: 0.14, vol: 0.14, delay: 0.07 }); },
  over(){ if (!AU.sfx) return; [330, 294, 262, 220].forEach((f, i) => tone({ f, type: 'sawtooth', dur: 0.35, vol: 0.12, delay: i * 0.22 })); },
};
function setSfx(on){ AU.sfx = on; try { localStorage.setItem('bs-sfx', on ? '1' : '0'); } catch (e) {} }

