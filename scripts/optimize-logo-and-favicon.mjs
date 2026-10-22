import fs from 'node:fs';
import zlib from 'node:zlib';

// 1. Decode original logo-header.png
const srcPath = 'public/icons/logo-header.png';
const backupPath = 'public/icons/logo-header.original.png';

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(srcPath, backupPath);
}

const inputBuf = fs.readFileSync(backupPath);
let pos = 8;
const chunks = [];
while (pos < inputBuf.length) {
  const len = inputBuf.readUInt32BE(pos);
  const type = inputBuf.toString('ascii', pos + 4, pos + 8);
  const data = inputBuf.subarray(pos + 8, pos + 8 + len);
  chunks.push({ type, len, data });
  pos += 12 + len;
}

const origWidth = 668;
const origHeight = 373;
const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
const uncompressed = zlib.inflateSync(idat);

const origRgba = Buffer.alloc(origWidth * origHeight * 4);
let prevRow = Buffer.alloc(origWidth * 4);
for (let y = 0; y < origHeight; y++) {
  const filter = uncompressed[y * (1 + origWidth * 4)];
  const rowStart = y * (1 + origWidth * 4) + 1;
  const currentRow = Buffer.alloc(origWidth * 4);

  for (let i = 0; i < origWidth * 4; i++) {
    const rawVal = uncompressed[rowStart + i];
    if (filter === 0) {
      currentRow[i] = rawVal;
    } else if (filter === 1) {
      const left = i >= 4 ? currentRow[i - 4] : 0;
      currentRow[i] = (rawVal + left) & 0xff;
    } else if (filter === 2) {
      const up = prevRow[i];
      currentRow[i] = (rawVal + up) & 0xff;
    }
  }
  currentRow.copy(origRgba, y * origWidth * 4);
  prevRow = currentRow;
}

// Find bounding box of visible artwork
let minX = origWidth;
let maxX = 0;
let minY = origHeight;
let maxY = 0;
for (let y = 0; y < origHeight; y++) {
  for (let x = 0; x < origWidth; x++) {
    const a = origRgba[(y * origWidth + x) * 4 + 3];
    if (a > 15) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Detected content bounding box:', { minX, maxX, minY, maxY });

// Add 6px padding around artwork for clean anti-aliasing
const pad = 6;
const cropX1 = Math.max(0, minX - pad);
const cropY1 = Math.max(0, minY - pad);
const cropX2 = Math.min(origWidth - 1, maxX + pad);
const cropY2 = Math.min(origHeight - 1, maxY + pad);
const cropWidth = cropX2 - cropX1 + 1;
const cropHeight = cropY2 - cropY1 + 1;

console.log('Cropped dimensions:', cropWidth, 'x', cropHeight);

const croppedRgba = Buffer.alloc(cropWidth * cropHeight * 4);
for (let y = 0; y < cropHeight; y++) {
  for (let x = 0; x < cropWidth; x++) {
    const srcIdx = ((cropY1 + y) * origWidth + (cropX1 + x)) * 4;
    const dstIdx = (y * cropWidth + x) * 4;
    origRgba.copy(croppedRgba, dstIdx, srcIdx, srcIdx + 4);
  }
}

// CRC32 table
const crcTable = new Uint32Array(256);
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

function encodePng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const ihdr = makeChunk('IHDR', ihdrData);

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (1 + width * 4);
    scanlines[scanlineOffset] = 0;
    rgbaBuffer.copy(scanlines, scanlineOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines, { level: 9 });
  const idat = makeChunk('IDAT', idatData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Write the tightly cropped logo-header.png
const croppedPng = encodePng(cropWidth, cropHeight, croppedRgba);
fs.writeFileSync('public/icons/logo-header.png', croppedPng);
console.log('Saved cropped public/icons/logo-header.png (' + croppedPng.length + ' bytes)');

// Also generate a square icon for metadata / favicon where artwork is centered & scaled to fit square
const sqSize = 256;
const sqRgba = Buffer.alloc(sqSize * sqSize * 4, 0); // transparent background

// Scale cropped image to fit sqSize with minimal margin (e.g. width = 248, scaled height)
const targetW = 248;
const scale = targetW / cropWidth;
const targetH = Math.round(cropHeight * scale);
const offsetY = Math.round((sqSize - targetH) / 2);
const offsetX = Math.round((sqSize - targetW) / 2);

console.log('Square icon dimensions: ' + sqSize + 'x' + sqSize + ', content scaled to ' + targetW + 'x' + targetH);

for (let y = 0; y < targetH; y++) {
  const srcY = Math.min(cropHeight - 1, Math.floor(y / scale));
  for (let x = 0; x < targetW; x++) {
    const srcX = Math.min(cropWidth - 1, Math.floor(x / scale));
    const srcIdx = (srcY * cropWidth + srcX) * 4;
    const dstIdx = ((offsetY + y) * sqSize + (offsetX + x)) * 4;
    sqRgba[dstIdx] = croppedRgba[srcIdx];
    sqRgba[dstIdx + 1] = croppedRgba[srcIdx + 1];
    sqRgba[dstIdx + 2] = croppedRgba[srcIdx + 2];
    sqRgba[dstIdx + 3] = croppedRgba[srcIdx + 3];
  }
}

const squarePng = encodePng(sqSize, sqSize, sqRgba);
fs.writeFileSync('public/icons/logo-square.png', squarePng);
fs.writeFileSync('public/favicon.ico', squarePng);
fs.writeFileSync('src/app/favicon.ico', squarePng);
fs.writeFileSync('src/app/icon.png', squarePng);

console.log('Square favicons and metadata icons written successfully!');
