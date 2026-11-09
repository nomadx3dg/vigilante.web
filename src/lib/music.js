// Procedural "bedrot" track (Web Audio synth). Used when music.wav is not found.
export const NXMusic = (function () {
  const BPM = 96;
  const STEP = 60 / BPM / 4;
  const STEPS = 32;
  const PASSES = 4;
  const LOOP_STEPS = STEPS * PASSES;
  const TOTAL = LOOP_STEPS * STEP;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteName = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);

  const CHORDS = [
    { root: 45, pad: [57, 60, 64] },
    { root: 41, pad: [53, 57, 60] },
    { root: 48, pad: [55, 60, 64] },
    { root: 43, pad: [55, 59, 62] }
  ];
  const chordAt = (bar) => CHORDS[bar % 4];

  const SCALE = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79];

  function buildMelody(bytes) {
    const out = [];
    for (let p = 0; p < PASSES; p++) {
      let k = 5;
      for (let s = 0; s < STEPS; s++) {
        const b = bytes[s % bytes.length];
        k += ((b + p * 3) % 5) - 2;
        if (k < 0) k = -k;
        if (k > SCALE.length - 1) k = 2 * (SCALE.length - 1) - k;
        k = Math.max(0, Math.min(SCALE.length - 1, k));
        const down = s % 4 === 0;
        const even = s % 2 === 0;
        let gate = even || b % 3 === 0;
        if (p === 0) gate = even;
        if (down) gate = true;
        out.push({ midi: SCALE[k], gate: gate, vel: down ? 1 : even ? 0.72 : 0.5 });
      }
    }
    return out;
  }

  function impulse(ctx, secs, power) {
    const rate = ctx.sampleRate, len = Math.floor(rate * secs);
    const buf = ctx.createBuffer(2, len, rate);
    let seed = 1337;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        lp += 0.32 * (rnd() - lp);
        d[i] = lp * Math.pow(1 - i / len, power);
      }
    }
    return buf;
  }

  const MIX = { pad: 1.15, bass: 0.28, kick: 0.6, snare: 2.7, hat: 2.5, pluck: 1.95, master: 0.62 };

  function create(ctx, bytes, mixOverride) {
    const mel = buildMelody(bytes);
    const mx = Object.assign({}, MIX, mixOverride || {});

    const bus = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3.5;
    comp.attack.value = 0.01; comp.release.value = 0.22;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20;
    lim.attack.value = 0.002; lim.release.value = 0.08;
    const master = ctx.createGain();
    master.gain.value = mx.master;
    bus.connect(comp); comp.connect(lim); lim.connect(master); master.connect(ctx.destination);

    const rev = ctx.createConvolver();
    rev.buffer = impulse(ctx, 2.4, 2.6);
    const revIn = ctx.createGain(); revIn.gain.value = 1;
    const revOut = ctx.createGain(); revOut.gain.value = 0.34;
    revIn.connect(rev); rev.connect(revOut); revOut.connect(bus);

    const dly = ctx.createDelay(1.5); dly.delayTime.value = STEP * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.36;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400;
    const dlyIn = ctx.createGain(); dlyIn.gain.value = 1;
    const dlyOut = ctx.createGain(); dlyOut.gain.value = 0.38;
    dlyIn.connect(dly); dly.connect(dlp); dlp.connect(fb); fb.connect(dly);
    dlp.connect(dlyOut); dlyOut.connect(bus); dlyOut.connect(revIn);

    const nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    { const d = nbuf.getChannelData(0); let seed = 99;
      for (let i = 0; i < d.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; d[i] = seed / 4294967296 * 2 - 1; } }
    const noise = () => { const s = ctx.createBufferSource(); s.buffer = nbuf; return s; };

    const env = (g, t, peak, attack, decay) => {
      g.gain.value = 0.0001;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    };

    function kick(t, v) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(155, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.13);
      env(g, t, 0.95 * v * mx.kick, 0.004, 0.36);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + 0.45);
      const n = noise(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      nf.type = 'bandpass'; nf.frequency.value = 2400; nf.Q.value = 0.8;
      env(ng, t, 0.16 * v * mx.kick, 0.001, 0.012);
      n.connect(nf); nf.connect(ng); ng.connect(bus);
      n.start(t); n.stop(t + 0.05);
    }

    function snare(t, v) {
      const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7;
      env(g, t, 0.34 * v * mx.snare, 0.002, 0.17);
      n.connect(f); f.connect(g); g.connect(bus); g.connect(revIn);
      n.start(t, 0.1); n.stop(t + 0.3);
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(205, t);
      o.frequency.exponentialRampToValueAtTime(130, t + 0.09);
      env(og, t, 0.24 * v * mx.snare, 0.002, 0.1);
      o.connect(og); og.connect(bus);
      o.start(t); o.stop(t + 0.18);
    }

    function hat(t, v, open) {
      const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'highpass'; f.frequency.value = 7200;
      env(g, t, (open ? 0.12 : 0.14) * v * mx.hat, 0.001, open ? 0.2 : 0.04);
      n.connect(f); f.connect(g); g.connect(bus);
      n.start(t, 0.3); n.stop(t + (open ? 0.3 : 0.08));
    }

    function bass(t, midi, dur) {
      const f0 = mtof(midi);
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
      o1.type = 'triangle'; o2.type = 'sawtooth';
      o1.frequency.value = f0; o2.frequency.value = f0;
      const mix2 = ctx.createGain(); mix2.gain.value = 0.28;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2;
      lp.frequency.setValueAtTime(1000, t);
      lp.frequency.exponentialRampToValueAtTime(320, t + 0.2);
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.5 * mx.bass, 0.0002), t + 0.008);
      g.gain.exponentialRampToValueAtTime(Math.max(0.32 * mx.bass, 0.0002), t + 0.08);
      g.gain.setValueAtTime(Math.max(0.32 * mx.bass, 0.0002), t + dur);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
      o1.connect(lp); o2.connect(mix2); mix2.connect(lp); lp.connect(g); g.connect(bus);
      o1.start(t); o2.start(t); o1.stop(t + dur + 0.15); o2.stop(t + dur + 0.15);
    }

    function pad(t, notes, dur) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
      lp.frequency.setValueAtTime(500, t);
      lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.5);
      lp.frequency.linearRampToValueAtTime(700, t + dur);
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.9 * mx.pad, t + 0.45);
      g.gain.setValueAtTime(0.9 * mx.pad, t + dur - 0.1);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.7);
      lp.connect(g); g.connect(bus); g.connect(revIn);
      notes.forEach((m) => {
        [-8, 8].forEach((cents) => {
          const o = ctx.createOscillator(), og = ctx.createGain();
          o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = cents;
          og.gain.value = 0.055;
          o.connect(og); og.connect(lp);
          o.start(t); o.stop(t + dur + 0.8);
        });
      });
    }

    function pluck(t, midi, v) {
      const f0 = mtof(midi);
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
      o1.type = 'square'; o2.type = 'triangle';
      o1.frequency.value = f0; o2.frequency.value = f0 * 2;
      const g2 = ctx.createGain(); g2.gain.value = 0.55;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2.5;
      lp.frequency.setValueAtTime(900 + 3000 * v, t);
      lp.frequency.exponentialRampToValueAtTime(520, t + 0.22);
      const g = ctx.createGain();
      env(g, t, 0.17 * v * mx.pluck, 0.004, 0.26);
      const send = ctx.createGain(); send.gain.value = 0.55;
      const rsend = ctx.createGain(); rsend.gain.value = 0.35;
      o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
      g.connect(bus); g.connect(send); send.connect(dlyIn); g.connect(rsend); rsend.connect(revIn);
      o1.start(t); o2.start(t); o1.stop(t + 0.35); o2.stop(t + 0.35);
    }

    const BASS_FULL = [[0, 0, 0.45], [3, 0, 0.2], [6, 12, 0.2], [8, 0, 0.45], [11, 0, 0.2], [14, 7, 0.2]];
    const BASS_SPARSE = [[0, 0, 0.9], [8, 0, 0.9]];
    const KICK = [0, 7, 10];
    const SNARE = [4, 12];

    function step(n, t) {
      const ls = n % LOOP_STEPS;
      const pass = Math.floor(ls / STEPS);
      const s = ls % STEPS;
      const bar = pass * 2 + Math.floor(s / 16);
      const bs = s % 16;
      const chord = chordAt(bar);
      const swing = (s % 2 === 1) ? STEP * 0.14 : 0;

      if (bs === 0 && mx.pad > 0) pad(t, chord.pad, STEP * 16);

      if (pass >= 1 && mx.bass > 0) {
        (pass === 1 ? BASS_SPARSE : BASS_FULL).forEach((h) => {
          if (h[0] === bs) bass(t + (h[0] % 2 ? swing : 0), chord.root + h[1], h[2]);
        });
      }
      if (pass >= 2) {
        if (mx.kick > 0 && KICK.indexOf(bs) >= 0) kick(t, bs === 0 ? 1 : 0.8);
        if (mx.snare > 0 && SNARE.indexOf(bs) >= 0) snare(t, 1);
        if (mx.hat > 0) {
          if (bs % 2 === 0) hat(t, bs % 4 === 0 ? 0.9 : 0.6, false);
          if (pass === 3) {
            if (bs % 2 === 1) hat(t + swing, 0.32, false);
            if (bs === 14) hat(t, 0.8, true);
          }
        }
        if (mx.snare > 0 && pass === 3 && bar % 2 === 1 && bs >= 13) snare(t, 0.35 + (bs - 13) * 0.18);
      }
      const m = mel[ls];
      if (m.gate && mx.pluck > 0) pluck(t + swing, m.midi, m.vel);
    }

    // Mute everything this engine has already scheduled (used when seeking).
    function stop() {
      const t = ctx.currentTime;
      try {
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 0.04);
      } catch (err) {}
      setTimeout(() => { try { master.disconnect(); } catch (err) {} }, 1500);
    }

    // Start playing from the middle of a bar: sound the rest of that bar's chord pad.
    function enterAt(n, t) {
      const ls = n % LOOP_STEPS;
      const s = ls % STEPS;
      const bs = s % 16;
      const bar = Math.floor(ls / STEPS) * 2 + Math.floor(s / 16);
      if (bs > 0 && mx.pad > 0) pad(t, chordAt(bar).pad, STEP * (16 - bs));
    }

    return { step: step, stop: stop, enterAt: enterAt, stepDur: STEP, stepsPerPass: STEPS, total: TOTAL, loopSteps: LOOP_STEPS, melody: mel, noteName: noteName };
  }

  return { create: create, STEP: STEP, STEPS: STEPS, TOTAL: TOTAL, LOOP_STEPS: LOOP_STEPS, noteName: noteName };
})();
