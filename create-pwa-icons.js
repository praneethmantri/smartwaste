import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, 'frontend/public');

// 1. Create Favicon SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="24" fill="#2E7D32"/>
  <path d="M30 35 h40 v45 c0 4-3 7-7 7 h-26 c-4 0-7-3-7-7 z" fill="#FFFFFF"/>
  <path d="M25 28 h50 v5 h-50 z" fill="#C8E6C9"/>
  <path d="M42 22 h16 v5 h-16 z" fill="#C8E6C9"/>
  <path d="M40 45 v25 M50 45 v25 M60 45 v25" stroke="#2E7D32" stroke-width="3" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');

// Function to generate raw PNG buffer
function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const toCrc = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw rounded rectangle effect or waste icon shape
      const border = 8;
      const isInside = x >= border && x < width - border && y >= border && y < height - border;
      const isInnerLogo = x >= width * 0.3 && x <= width * 0.7 && y >= height * 0.35 && y <= height * 0.8;
      if (isInnerLogo) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
        rawData[pxOffset + 3] = 255;
      } else if (isInside) {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = 220;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate 192x192 and 512x512
const png192 = createPng(192, 192, 46, 125, 50); // #2E7D32
const png512 = createPng(512, 512, 46, 125, 50);
const png32 = createPng(32, 32, 46, 125, 50);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);

// Standard ICO file holding 32x32 PNG
// ICO header: 6 bytes
// Icon directory entry: 16 bytes
// PNG data follows
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type 1 = icon
icoHeader.writeUInt16LE(1, 4); // 1 image

const dirEntry = Buffer.alloc(16);
dirEntry[0] = 32; // width
dirEntry[1] = 32; // height
dirEntry[2] = 0;  // colors
dirEntry[3] = 0;  // reserved
dirEntry.writeUInt16LE(1, 4); // color planes
dirEntry.writeUInt16LE(32, 6); // bpp
dirEntry.writeUInt32LE(png32.length, 8); // size of image data
dirEntry.writeUInt32LE(22, 12); // offset: 6 + 16 = 22

const icoFile = Buffer.concat([icoHeader, dirEntry, png32]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);

console.log('✓ Successfully created favicon.svg, favicon.ico, icon-192.png, icon-512.png in frontend/public');
