// Parked: jungle / drum and bass music engine. NOT loaded by index.html right now.
// To bring it back: add <script src="js/music.js"></script> after audio.js, call musicStart() at the end of
// audioInit(), restore a Music button wired to setMusic(!AU.music), and toggle its .on class in renderAll().
Object.assign(AU, { musicGain: null, music: false, seq: null, step: 0 });
try { AU.music = localStorage.getItem('bs-music') === '1'; } catch (e) {}

// ---------- music: jungle / drum and bass, driven by the live game state ----------
// A lookahead scheduler on the audio clock (not setInterval timing) so tempo can change mid-bar.
// Mood is read every tick from run/R (defined in game.js, always initialised before the first tick):
//   level 0 = full hearts (rolling), 1 = lost a heart (tense), 2 = last heart (critical)
//   boss rounds run faster with extra kicks and hats stacked into the break.
const MUSIC = { bpm: 170, bossBpm: 180, root: 55 /* A1 */ };
const semi = (n, oct = 0) => MUSIC.root * Math.pow(2, n / 12 + oct);
// two-bar break on a 16th grid (32 steps): bar 1 is a two-step, bar 2 is a chopped amen-style turnaround
const KICK  = new Set([0, 10, 16, 18, 26]);
const KICK_BOSS = new Set([0, 2, 10, 12, 16, 18, 22, 26, 28]);
const SNARE = new Set([4, 12, 20, 27, 30]);
const GHOST = new Set([7, 15, 23, 25]);
const OPEN  = new Set([14, 30]);
// bass phrases per mood: [step, semitone, length in steps]; reese + sub, long notes when calm, stabs when critical
const BASS_PAT = [
  [[0, 0, 6], [6, 0, 2], [8, 10, 4], [12, 7, 4], [16, 0, 6], [22, 0, 2], [24, 5, 4], [28, 7, 4]],
  [[0, 0, 6], [6, 0, 2], [8, 8, 4], [12, 7, 4], [16, 0, 4], [20, 1, 2], [22, 0, 2], [24, 8, 4], [28, 10, 4]],
  [[0, 0, 2], [2, 1, 2], [4, 0, 2], [6, 6, 2], [8, 0, 2], [10, 1, 2], [12, 6, 2], [14, 0, 2], [16, 0, 2], [18, 1, 2], [20, 6, 2], [22, 0, 2], [24, 1, 2], [26, 6, 2], [28, 1, 1], [29, 1, 1], [30, 6, 2]],
];
const LEAD_SCALE = [[0, 3, 7, 10, 12, 15, 19], [0, 3, 7, 8, 12, 15, 19], [0, 1, 6, 7, 12, 13, 18]];
const LEAD_PAT = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 6, 5, 4, 3, 1]; // indexes into the scale
const bassAt = (level, beat) => BASS_PAT[level].find(n => n[0] === beat);

function musicMood(){
  const live = typeof run !== 'undefined' && run && typeof R !== 'undefined' && R && !R.over;
  if (!live) return { level: 0, boss: false, danger: 0 };
  const level = run.hearts <= 1 ? 2 : run.hearts < run.maxHearts ? 1 : 0;
  return { level, boss: !!R.boss, danger: 1 - run.hearts / run.maxHearts };
}
function musicStart(){
  if (!AU.ctx || AU.seq) return;
  const c = AU.ctx;
  if (!AU.musicGain) { AU.musicGain = c.createGain(); AU.musicGain.gain.value = AU.music ? 1 : 0; AU.musicGain.connect(AU.master); }
  // drone bed: two detuned saws on the root through a lowpass; a third osc a tritone up fades in when critical
  AU.droneFilter = c.createBiquadFilter(); AU.droneFilter.type = 'lowpass'; AU.droneFilter.frequency.value = 180;
  const droneGain = c.createGain(); droneGain.gain.value = 0.035;
  AU.droneFilter.connect(droneGain).connect(AU.musicGain);
  for (const det of [-6, 6]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = semi(0); o.detune.value = det; o.connect(AU.droneFilter); o.start(); }
  AU.droneTri = c.createGain(); AU.droneTri.gain.value = 0; AU.droneTri.connect(AU.droneFilter);
  { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = semi(6); o.connect(AU.droneTri); o.start(); }
  // bass bus: resonant lowpass for the reese; opens up as things get worse
  AU.bassFilter = c.createBiquadFilter(); AU.bassFilter.type = 'lowpass'; AU.bassFilter.frequency.value = 320; AU.bassFilter.Q.value = 2;
  AU.bassFilter.connect(AU.musicGain);
  AU.next = c.currentTime + 0.1;
  AU.seq = setInterval(musicTick, 25);
}
function musicTick(){
  const c = AU.ctx, now = c.currentTime;
  if (!AU.music || document.hidden) { AU.next = now + 0.05; return; } // hold the clock while muted
  const m = musicMood();
  const stepDur = 60 / (m.boss ? MUSIC.bossBpm : MUSIC.bpm) / 4; // one 16th note
  // continuous mood parameters, smoothed
  AU.bassFilter.frequency.setTargetAtTime(320 + 800 * m.danger, now, 0.4);
  AU.bassFilter.Q.setTargetAtTime(2 + 6 * m.danger, now, 0.4);
  AU.droneFilter.frequency.setTargetAtTime(180 + 300 * m.danger, now, 0.6);
  AU.droneTri.gain.setTargetAtTime(m.level === 2 ? 1 : 0, now, 0.8);
  while (AU.next < now + 0.12) { musicStep(AU.step++, AU.next - now, m, stepDur); AU.next += stepDur; }
}
function snare(d, vol){
  noise({ dur: 0.14, vol, cutoff: 1400, filter: 'highpass', delay: d, dest: AU.musicGain });
  tone({ f: 190, type: 'sine', dur: 0.07, vol: vol * 0.9, slide: -60, delay: d, dest: AU.musicGain });
}
function musicStep(s, d, m, stepDur){
  const bus = AU.musicGain, beat = s % 32, hard = m.level >= 1;
  // break
  if ((m.boss ? KICK_BOSS : KICK).has(beat)) tone({ f: 130, type: 'sine', dur: 0.18, vol: 0.4, slide: -90, delay: d, dest: bus });
  if (SNARE.has(beat)) snare(d, 0.17);
  else if (GHOST.has(beat) && (hard || m.boss)) snare(d, 0.06);
  // hats: 8ths when rolling, 16ths when tense or in a boss round; open hats on the turnarounds
  if (OPEN.has(beat)) noise({ dur: 0.16, vol: 0.05, cutoff: 6000, filter: 'highpass', delay: d, dest: bus });
  else if (beat % 2 === 0) noise({ dur: 0.04, vol: 0.05, cutoff: 8000, filter: 'highpass', delay: d, dest: bus });
  else if (hard || m.boss) noise({ dur: 0.025, vol: 0.03, cutoff: 9000, filter: 'highpass', delay: d, dest: bus });
  // critical: snare roll into every two-bar phrase
  if (m.level === 2 && beat >= 28) snare(d, 0.05 + 0.03 * (beat - 28));
  // bass: reese (two saws a few cents apart) plus a sub sine an octave down
  const bn = bassAt(m.level, beat);
  if (bn) {
    const dur = bn[2] * stepDur * 0.9, f = semi(bn[1], m.boss && beat % 8 === 6 ? 1 : 0);
    tone({ f, type: 'sawtooth', dur, vol: 0.05, delay: d, dest: AU.bassFilter });
    tone({ f: f * 1.006, type: 'sawtooth', dur, vol: 0.05, delay: d, dest: AU.bassFilter });
    tone({ f: f / 2, type: 'sine', dur, vol: 0.16, delay: d, dest: bus });
  }
  // lead: sparse arpeggio on the offbeat of each quarter; critical swaps it for a tritone alarm on every 8th
  if (m.level === 2) { if (beat % 2 === 0) tone({ f: semi(beat % 4 ? 6 : 0, 3), type: 'square', dur: stepDur, vol: 0.035, delay: d, dest: bus }); }
  else if (beat % 4 === 2) {
    const n = LEAD_SCALE[m.level][LEAD_PAT[(s >> 2) % LEAD_PAT.length]];
    tone({ f: semi(n, 2), type: m.level ? 'sawtooth' : 'triangle', dur: stepDur * 3, vol: m.level ? 0.03 : 0.045, delay: d, dest: bus });
  }
}
function setMusic(on){
  AU.music = on;
  if (AU.musicGain) AU.musicGain.gain.setTargetAtTime(on ? 1 : 0, AU.ctx.currentTime, 0.3);
  try { localStorage.setItem('bs-music', on ? '1' : '0'); } catch (e) {}
}
