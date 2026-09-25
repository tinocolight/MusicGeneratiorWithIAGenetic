// Small Web Audio synthesiser: plays one or more voices (a canon = the same line twice,
// the second voice `offset` steps later), with three simple timbres.

export const TIMBRES = {
  violin: 'Violino',
  flute: 'Flauta',
  harpsichord: 'Cravo',
};

export function createPlayer() {
  let ctx = null;
  let master = null;
  let nodes = [];
  let raf = 0;
  let stopTimer = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function note(t0, dur, midi, timbre, pan, gainScale) {
    const f = 440 * 2 ** ((midi - 69) / 12);
    const out = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = pan;
      out.connect(panner);
      panner.connect(master);
    } else out.connect(master);
    const g = out.gain;
    const peak = 0.22 * gainScale;
    const oscs = [];
    if (timbre === 'harpsichord') {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(f * 8, t0);
      lp.frequency.exponentialRampToValueAtTime(f * 2, t0 + 0.4);
      o.connect(lp);
      lp.connect(out);
      g.setValueAtTime(0, t0);
      g.linearRampToValueAtTime(peak * 0.8, t0 + 0.004);
      g.exponentialRampToValueAtTime(peak * 0.05, t0 + Math.max(0.3, dur * 1.2));
      oscs.push(o);
    } else if (timbre === 'flute') {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = f * 2;
      const g2 = ctx.createGain();
      g2.gain.value = 0.15;
      o.connect(out);
      o2.connect(g2);
      g2.connect(out);
      g.setValueAtTime(0, t0);
      g.linearRampToValueAtTime(peak, t0 + 0.05);
      g.setValueAtTime(peak * 0.9, t0 + Math.max(0.06, dur - 0.06));
      g.linearRampToValueAtTime(0, t0 + dur);
      oscs.push(o, o2);
    } else {
      // violin-like: sawtooth through a low-pass, delayed vibrato
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const vib = ctx.createOscillator();
      vib.frequency.value = 5.6;
      const vibGain = ctx.createGain();
      vibGain.gain.setValueAtTime(0, t0);
      vibGain.gain.linearRampToValueAtTime(f * 0.006, t0 + Math.min(0.35, dur));
      vib.connect(vibGain);
      vibGain.connect(o.frequency);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = Math.min(9000, f * 4.5);
      lp.Q.value = 0.8;
      o.connect(lp);
      lp.connect(out);
      g.setValueAtTime(0, t0);
      g.linearRampToValueAtTime(peak * 0.75, t0 + 0.04);
      g.setValueAtTime(peak * 0.7, t0 + Math.max(0.05, dur - 0.05));
      g.linearRampToValueAtTime(0, t0 + dur);
      oscs.push(o, vib);
    }
    for (const o of oscs) {
      o.start(t0);
      o.stop(t0 + dur + 0.6);
    }
    nodes.push({ oscs, out });
  }

  const api = {
    get playing() {
      return raf !== 0;
    },
    /**
     * voices: [{events: [{pitch, start, dur}], offset, timbre, pan, gain}]
     * opts: {bpm, onStep(step), onEnd()}
     */
    play(voices, { bpm = 90, onStep = null, onEnd = null } = {}) {
      api.stop();
      ensure();
      const stepSec = 60 / bpm / 4;
      const t0 = ctx.currentTime + 0.08;
      let lastStep = 0;
      for (const v of voices) {
        for (const e of v.events) {
          if (e.pitch === null) continue;
          const start = e.start + (v.offset || 0);
          lastStep = Math.max(lastStep, start + e.dur);
          note(t0 + start * stepSec, Math.max(0.05, e.dur * stepSec * 0.97), e.pitch, v.timbre || 'violin', v.pan || 0, v.gain ?? 1);
        }
      }
      const total = lastStep * stepSec;
      const tick = () => {
        const step = (ctx.currentTime - t0) / stepSec;
        if (onStep) onStep(step);
        if (ctx.currentTime - t0 < total + 0.1) raf = requestAnimationFrame(tick);
        else {
          raf = 0;
          if (onStep) onStep(null);
          if (onEnd) onEnd();
        }
      };
      raf = requestAnimationFrame(tick);
      stopTimer = total;
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (!ctx) return;
      const now = ctx.currentTime;
      for (const n of nodes) {
        try {
          n.out.gain.cancelScheduledValues(now);
          n.out.gain.setValueAtTime(n.out.gain.value, now);
          n.out.gain.linearRampToValueAtTime(0, now + 0.03);
          for (const o of n.oscs) o.stop(now + 0.05);
        } catch (e) {
          /* already stopped */
        }
      }
      nodes = [];
      void stopTimer;
    },
  };
  return api;
}
