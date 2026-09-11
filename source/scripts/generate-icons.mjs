import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(buffer) { let crc = 0xffffffff; for (const byte of buffer) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const name = Buffer.from(type); const length = Buffer.alloc(4); length.writeUInt32BE(data.length); const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data]))); return Buffer.concat([length, name, data, checksum]); }
function insideRoundedRect(x, y, size, radius) { const cx = x < radius ? radius : x >= size - radius ? size - radius - 1 : x; const cy = y < radius ? radius : y >= size - radius ? size - radius - 1 : y; return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2; }
function makeIcon(size) {
  const rows = []; const radius = Math.max(3, Math.round(size * 0.23)); const center = size / 2;
  for (let y = 0; y < size; y += 1) { const row = Buffer.alloc(1 + size * 4); for (let x = 0; x < size; x += 1) { const offset = 1 + x * 4; let rgba = [0, 0, 0, 0]; if (insideRoundedRect(x, y, size, radius)) rgba = [24, 113, 95, 255]; const dx = Math.abs(x - center); const leafTop = size * 0.22; const leafBottom = size * 0.74; const halfWidth = ((y - leafTop) / (leafBottom - leafTop)) * size * 0.26; const inLeaf = y >= leafTop && y <= leafBottom && dx <= Math.max(size * 0.05, halfWidth) && dx <= (leafBottom - y) * 0.65 + size * 0.07; const inStem = y >= size * 0.46 && y <= size * 0.8 && dx <= Math.max(1, size * 0.035); if (inLeaf || inStem) rgba = [245, 255, 251, 255]; row.set(rgba, offset); } rows.push(row); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
for (const size of [16, 32, 48, 96, 128]) writeFileSync(new URL(`../public/icon/${size}.png`, import.meta.url), makeIcon(size));
