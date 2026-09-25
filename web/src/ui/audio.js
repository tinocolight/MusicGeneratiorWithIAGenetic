// Small Web Audio synthesiser: plays up to three voices (a canon = the same line several times,
// each voice later and possibly transposed), with one simple preset per instrument family.

import { instrument } from '../core/instruments.js';

// formants (Hz) for the sung vowels
const VOWELS = { a: [800, 1150, 2900], o: [450, 800, 2830] };

export function createPlayer() {
  let ctx = null;
  let master = null;
  let nodes = [];
  let raf = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function envelope(g, t0, dur, peak, attack, release, sustain = 0.85) {
    g.setValueAtTime(0, t0);
    g.linearRampToValueAtTime(peak, t0 + attack);
    g.setValueAtTime(peak * sustain, t0 + Math.max(attack + 0.01, dur - release));
    g.linearRampToValueAtTime(0, t0 + dur);
  }

  function osc(type, f, t0) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.start(t0);
    return o;
  }

  function note(t0, dur, midi, inst, pan, gainScale) {
    const f = 440 * 2 ** ((midi - 69) / 12);
    const out = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = pan;
      out.connect(panner);
      panner.connect(master);
    } else out.connect(master);
    const g = out.gain;
    const peak = 0.2 * gainScale;
    const oscs = [];
    const lowpass = (cut, q = 0.7) => {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = Math.min(12000, cut);
      lp.Q.value = q;
      lp.connect(out);
      return lp;
    };
    const vibrato = (o, depth, delay) => {
      const v = osc('sine', 5.5, t0);
      const vg = ctx.createGain();
      vg.gain.setValueAtTime(0, t0);
      vg.gain.linearRampToValueAtTime(f * depth, t0 + Math.min(delay, dur));
      v.connect(vg);
      vg.connect(o.frequency);
      oscs.push(v);
    };
    switch (inst.synth) {
      case 'pluck': {
        const o = osc('square', f, t0);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(f * 8, t0);
        lp.frequency.exponentialRampToValueAtTime(f * 2, t0 + 0.4);
        lp.connect(out);
        o.connect(lp);
        g.setValueAtTime(0, t0);
        g.linearRampToValueAtTime(peak * 0.8, t0 + 0.004);
        g.exponentialRampToValueAtTime(peak * 0.03, t0 + Math.max(0.35, dur * 1.3));
        oscs.push(o);
        break;
      }
      case 'piano': {
        const o = osc('triangle', f, t0);
        const o2 = osc('sine', 2 * f, t0);
        const g2 = ctx.createGain();
        g2.gain.value = 0.25;
        o.connect(out);
        o2.connect(g2);
        g2.connect(out);
        g.setValueAtTime(0, t0);
        g.linearRampToValueAtTime(peak * 1.1, t0 + 0.006);
        g.exponentialRampToValueAtTime(peak * 0.05, t0 + Math.max(0.5, dur * 1.5));
        oscs.push(o, o2);
        break;
      }
      case 'organ': {
        for (const [mult, amp] of [[1, 1], [2, 0.5], [3, 0.25], [4, 0.2]]) {
          const o = osc('sine', f * mult, t0);
          const og = ctx.createGain();
          og.gain.value = amp * 0.45;
          o.connect(og);
          og.connect(out);
          oscs.push(o);
        }
        envelope(g, t0, dur, peak, 0.02, 0.03, 1);
        break;
      }
      case 'flute':
      case 'recorder': {
        const o = osc(inst.synth === 'flute' ? 'triangle' : 'sine', f, t0);
        const o2 = osc('sine', f * 2, t0);
        const g2 = ctx.createGain();
        g2.gain.value = inst.synth === 'flute' ? 0.15 : 0.08;
        o.connect(out);
        o2.connect(g2);
        g2.connect(out);
        if (inst.synth === 'flute') vibrato(o, 0.004, 0.3);
        envelope(g, t0, dur, peak, 0.05, 0.06, 0.9);
        oscs.push(o, o2);
        break;
      }
      case 'single-reed': {
        const o = osc('square', f, t0);
        o.connect(lowpass(f * 3.5, 1));
        envelope(g, t0, dur, peak * 0.7, 0.03, 0.05, 0.9);
        oscs.push(o);
        break;
      }
      case 'double-reed': {
        const o = osc('sawtooth', f, t0);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = Math.min(6000, f * (inst.bright || 5));
        bp.Q.value = 1.2;
        bp.connect(out);
        o.connect(bp);
        o.connect(lowpass(f * 2, 0.5));
        vibrato(o, 0.003, 0.35);
        envelope(g, t0, dur, peak * 1.1, 0.03, 0.05, 0.85);
        oscs.push(o);
        break;
      }
      case 'brass': {
        const o = osc('sawtooth', f, t0);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(f * 1.5, t0);
        lp.frequency.linearRampToValueAtTime(f * (inst.bright || 4), t0 + 0.08);
        lp.connect(out);
        o.connect(lp);
        envelope(g, t0, dur, peak * 0.85, 0.07, 0.06, 0.9);
        oscs.push(o);
        break;
      }
      case 'voice': {
        const o = osc('sawtooth', f, t0);
        vibrato(o, 0.007, 0.25);
        for (const [i, fr] of (VOWELS[inst.vowel] || VOWELS.a).entries()) {
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = fr;
          bp.Q.value = 6;
          const bg = ctx.createGain();
          bg.gain.value = [1, 0.5, 0.2][i] * 2.2;
          o.connect(bp);
          bp.connect(bg);
          bg.connect(out);
        }
        envelope(g, t0, dur, peak, 0.08, 0.08, 0.9);
        oscs.push(o);
        break;
      }
      default: {
        // bowed strings: sawtooth through a low-pass, delayed vibrato
        const o = osc('sawtooth', f, t0);
        o.connect(lowpass(f * (inst.bright || 4.5), 0.8));
        vibrato(o, 0.006, 0.35);
        envelope(g, t0, dur, peak * 0.75, 0.04, 0.05, 0.93);
        oscs.push(o);
      }
    }
    for (const o of oscs) o.stop(t0 + dur + 0.8);
    nodes.push({ oscs, out });
  }

  const api = {
    get playing() {
      return raf !== 0;
    },
    /**
     * voices: [{events: [{pitch, start, dur}], offset (16ths), map (pitch => pitch),
     *           instrument (id), pan, gain}]
     * opts: {bpm, onStep(step), onEnd()}
     */
    play(voices, { bpm = 90, onStep = null, onEnd = null } = {}) {
      api.stop();
      ensure();
      const stepSec = 60 / bpm / 4;
      const t0 = ctx.currentTime + 0.08;
      let lastStep = 0;
      for (const v of voices) {
        const inst = instrument(v.instrument);
        const map = v.map || ((p) => p);
        for (const e of v.events) {
          if (e.pitch === null) continue;
          const start = e.start + (v.offset || 0);
          lastStep = Math.max(lastStep, start + e.dur);
          note(t0 + start * stepSec, Math.max(0.05, e.dur * stepSec * 0.97), map(e.pitch), inst, v.pan || 0, v.gain ?? 1);
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
    },
  };
  return api;
}
