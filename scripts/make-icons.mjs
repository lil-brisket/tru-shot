// Draws the True Shot app icon (an original basketball mark) as SVG and PNG from one set of
// shapes, so the files never drift apart. Run `node scripts/make-icons.mjs` after changing them;
// the output in packages/web/public is committed.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = new URL('../packages/web/public/', import.meta.url);
const BG = '#14181f';
const BALL = '#f28c28';
const SEAM_WIDTH = 12;
// Shapes on a 512-unit canvas. The ball stays inside the maskable safe zone (radius 204).
const BALL_CIRCLE = { cx: 256, cy: 256, r: 176 };
const SIDE_SEAMS = [
  { cx: -30, cy: 256, r: 210 },
  { cx: 542, cy: 256, r: 210 },
];

function svg() {
  const { cx, cy, r } = BALL_CIRCLE;
  const seams = SIDE_SEAMS.map((s) => `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<title>True Shot</title>
<defs><clipPath id="ball"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
<rect width="512" height="512" fill="${BG}"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BALL}"/>
<g clip-path="url(#ball)" fill="none" stroke="${BG}" stroke-width="${SEAM_WIDTH}">
<path d="M${cx} 0V512M0 ${cy}H512"/>${seams}
</g>
</svg>
`;
}

function colorAt(x, y) {
  const { cx, cy, r } = BALL_CIRCLE;
  if (Math.hypot(x - cx, y - cy) > r) return BG;
  const half = SEAM_WIDTH / 2;
  const onSeam =
    Math.abs(x - cx) < half ||
    Math.abs(y - cy) < half ||
    SIDE_SEAMS.some((s) => Math.abs(Math.hypot(x - s.cx, y - s.cy) - s.r) < half);
  return onSeam ? BG : BALL;
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

function pixels(size) {
  const grid = 4; // 4x4 samples per pixel for smooth edges
  const scale = 512 / size;
  const rows = [];
  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(1 + size * 4); // leading 0 = PNG "no filter" byte
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < grid; sy++) {
        for (let sx = 0; sx < grid; sx++) {
          const rgb = hexToRgb(
            colorAt((px + (sx + 0.5) / grid) * scale, (py + (sy + 0.5) / grid) * scale),
          );
          for (let c = 0; c < 3; c++) sum[c] += rgb[c];
        }
      }
      for (let c = 0; c < 3; c++) row[1 + px * 4 + c] = Math.round(sum[c] / (grid * grid));
      row[1 + px * 4 + 3] = 255;
    }
    rows.push(row);
  }
  return Buffer.concat(rows);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function png(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(pixels(size), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(new URL('icon.svg', OUT), svg());
writeFileSync(new URL('icon-192.png', OUT), png(192));
writeFileSync(new URL('icon-512.png', OUT), png(512));
writeFileSync(new URL('apple-touch-icon.png', OUT), png(180));
console.log('Wrote icon.svg, icon-192.png, icon-512.png and apple-touch-icon.png');
