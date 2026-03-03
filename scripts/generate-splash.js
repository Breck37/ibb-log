#!/usr/bin/env node
/**
 * Generates assets/images/splash-icon.png as a programmatic barbell.
 * Pure Node.js — no external dependencies, uses built-in zlib for PNG encoding.
 *
 * Run: node scripts/generate-splash.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const WIDTH = 1024;
const HEIGHT = 1024;

// Colors — matches BarbellLogo.tsx neon treatment
const BG = [0x0b, 0x0d, 0x12]; // #0B0D12
const SHAFT_CORE = [0x45, 0x4d, 0xcc]; // #454dcc — primary accent
const PLATE_OUTER = [0x98, 0x98, 0xb4]; // #9898B4 — cool chrome
const PLATE_INNER = [0x78, 0x78, 0xa0]; // #7878A0 — recessed

// Simulated shaft glow — concentric layers blending #454dcc into the bg.
// Painted back-to-front so the core sits on top.
function blend(fg, alpha) {
  return fg.map((c, i) => Math.round(c * alpha + BG[i] * (1 - alpha)));
}
const SHAFT_GLOW_3 = blend(SHAFT_CORE, 0.18); // outermost halo
const SHAFT_GLOW_2 = blend(SHAFT_CORE, 0.38);
const SHAFT_GLOW_1 = blend(SHAFT_CORE, 0.65); // innermost halo

// Barbell geometry — scaled to ~600px wide, centred on 1024×1024.
// Mirrors the proportions of BarbellLogo.tsx.
const OUTER_W = 40; // 14px × ~2.86
const OUTER_H = 148; // 52px × ~2.85
const INNER_W = 28; // 10px × ~2.8
const INNER_H = 114; // 40px × ~2.85
const SHAFT_W = 452; // 160px × ~2.825
const SHAFT_H = 8; //  3px × ~2.67 (bumped up for visibility)
const GAP = 6; //  2px × 3

// Derived positions
const TOTAL_W = OUTER_W + GAP + INNER_W + SHAFT_W + INNER_W + GAP + OUTER_W; // 600
const X0 = Math.floor((WIDTH - TOTAL_W) / 2);
const Y_PLATE = Math.floor((HEIGHT - OUTER_H) / 2);
const Y_INNER = Y_PLATE + Math.floor((OUTER_H - INNER_H) / 2);
const Y_SHAFT = Y_PLATE + Math.floor((OUTER_H - SHAFT_H) / 2);
const LEFT_OUTER_X = X0;
const LEFT_INNER_X = X0 + OUTER_W + GAP;
const SHAFT_X = LEFT_INNER_X + INNER_W;
const RIGHT_INNER_X = SHAFT_X + SHAFT_W;
const RIGHT_OUTER_X = RIGHT_INNER_X + INNER_W + GAP;

// Pixel buffer (RGB)
const buf = Buffer.alloc(WIDTH * HEIGHT * 3);

// Fill background
for (let i = 0; i < buf.length; i += 3) {
  buf[i] = BG[0];
  buf[i + 1] = BG[1];
  buf[i + 2] = BG[2];
}

function fillRect(x, y, w, h, color) {
  for (let row = Math.max(y, 0); row < Math.min(y + h, HEIGHT); row++) {
    for (let col = Math.max(x, 0); col < Math.min(x + w, WIDTH); col++) {
      const i = (row * WIDTH + col) * 3;
      buf[i] = color[0];
      buf[i + 1] = color[1];
      buf[i + 2] = color[2];
    }
  }
}

// Draw barbell
// Plates
fillRect(LEFT_OUTER_X, Y_PLATE, OUTER_W, OUTER_H, PLATE_OUTER);
fillRect(LEFT_INNER_X, Y_INNER, INNER_W, INNER_H, PLATE_INNER);
fillRect(RIGHT_INNER_X, Y_INNER, INNER_W, INNER_H, PLATE_INNER);
fillRect(RIGHT_OUTER_X, Y_PLATE, OUTER_W, OUTER_H, PLATE_OUTER);

// Shaft glow — outermost to innermost, core last
const G3 = 10,
  G2 = 6,
  G1 = 3; // px of glow spread on each side
fillRect(SHAFT_X, Y_SHAFT - G3, SHAFT_W, SHAFT_H + G3 * 2, SHAFT_GLOW_3);
fillRect(SHAFT_X, Y_SHAFT - G2, SHAFT_W, SHAFT_H + G2 * 2, SHAFT_GLOW_2);
fillRect(SHAFT_X, Y_SHAFT - G1, SHAFT_W, SHAFT_H + G1 * 2, SHAFT_GLOW_1);
fillRect(SHAFT_X, Y_SHAFT, SHAFT_W, SHAFT_H, SHAFT_CORE);

// ── PNG encoder ─────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8;
ihdr[9] = 2; // 8-bit RGB

// Raw scanlines: filter byte (0 = None) + RGB row
const raw = Buffer.alloc(HEIGHT * (1 + WIDTH * 3));
for (let y = 0; y < HEIGHT; y++) {
  const base = y * (1 + WIDTH * 3);
  raw[base] = 0;
  buf.copy(raw, base + 1, y * WIDTH * 3, (y + 1) * WIDTH * 3);
}

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
  makeChunk('IHDR', ihdr),
  makeChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  makeChunk('IEND', Buffer.alloc(0)),
]);

const outPath = path.join(
  __dirname,
  '..',
  'assets',
  'images',
  'splash-icon.png',
);
fs.writeFileSync(outPath, png);
console.log(
  `✓  splash-icon.png  ${WIDTH}×${HEIGHT}  ${Math.round(png.length / 1024)} KB`,
);
console.log(`   Barbell: ${TOTAL_W}px wide × ${OUTER_H}px tall, centred`);
