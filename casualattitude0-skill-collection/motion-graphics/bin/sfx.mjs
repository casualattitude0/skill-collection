#!/usr/bin/env node
// node sfx.mjs cues.json out.wav [--bpm 120 --dur 20]
// cues: [{"t": 0.5, "type": "click"}, ...]  t in seconds
// --bpm adds a music bed (kick, hat, bass, pad) on the same beat grid.
import { readFileSync, writeFileSync } from 'node:fs';

const [cuesPath, outPath] = process.argv.slice(2);
const flag = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? Number(process.argv[i + 1]) : d; };
if (!cuesPath || !outPath) { console.error('usage: sfx.mjs cues.json out.wav [--bpm N --dur S]'); process.exit(1); }

const SR = 48000, TAU = 2 * Math.PI;
const cues = JSON.parse(readFileSync(cuesPath, 'utf8'));
const bpm = flag('bpm', 0);
const dur = flag('dur', Math.max(0, ...cues.map((c) => c.t)) + 2);
const buf = new Float32Array(Math.ceil(dur * SR));

// Seeded noise: the same cues always produce the same file
let seed = 42;
const noise = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2147483648 - 1;

// [length in seconds, sample(t)]
const VOICES = {
  click:  [0.05, (t) => Math.sin(TAU * 1800 * t) * Math.exp(-t * 90) * 0.5],
  pop:    [0.15, (t) => Math.sin(TAU * (600 + 900 * t) * t) * Math.exp(-t * 30) * 0.4],
  thump:  [0.50, (t) => Math.sin(TAU * (90 - 60 * t) * t) * Math.exp(-t * 9) * 0.9],
  whoosh: [0.35, (t) => noise() * Math.sin(Math.PI * Math.min(1, t / 0.35)) * 0.25],
  riser:  [1.00, (t) => (noise() * 0.12 + Math.sin(TAU * (200 + 600 * t) * t) * 0.15) * t * t],
  kick:   [0.30, (t) => Math.sin(TAU * (110 - 200 * t) * t) * Math.exp(-t * 14) * 0.7],
  hat:    [0.04, (t) => noise() * Math.exp(-t * 120) * 0.12],
};

const add = (start, len, fn) => {
  const s0 = Math.floor(start * SR);
  for (let i = 0; i < len * SR && s0 + i < buf.length; i++) if (s0 + i >= 0) buf[s0 + i] += fn(i / SR);
};

for (const c of cues) {
  const v = VOICES[c.type];
  if (!v) { console.error(`unknown cue type: ${c.type}`); process.exit(1); }
  // a riser ends on its cue time, everything else starts on it
  add(c.type === 'riser' ? c.t - v[0] : c.t, v[0], v[1]);
}

if (bpm > 0) {
  const beat = 60 / bpm;
  const roots = [55, 43.65, 65.41, 49]; // A1 F1 C2 G1, one bar each
  for (let b = 0; b * beat < dur; b++) {
    const t0 = b * beat, root = roots[Math.floor(b / 4) % roots.length];
    add(t0, ...VOICES.kick);
    add(t0 + beat / 2, ...VOICES.hat);
    add(t0, beat * 0.9, (t) => Math.sin(TAU * root * t) * Math.exp(-t * 3) * 0.3);
    if (b % 4 === 0) {
      const len = beat * 4, env = (t) => Math.sin(Math.PI * t / len) * 0.05;
      for (const m of [4, 5, 6]) add(t0, len, (t) => Math.sin(TAU * root * m * t) * env(t));
    }
  }
}

const n = buf.length, wav = Buffer.alloc(44 + n * 2); // 16-bit mono
wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 2, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) wav.writeInt16LE(Math.round(Math.tanh(buf[i] * 0.8) * 32767), 44 + i * 2); // soft limit
writeFileSync(outPath, wav);
console.log(`${outPath}: ${dur}s, ${cues.length} cues${bpm ? `, ${bpm} BPM bed` : ''}`);
