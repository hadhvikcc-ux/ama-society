const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table for PNG chunk validation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
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
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcBuf = chunk.subarray(4, 8 + len);
  const crcVal = crc32(crcBuf);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

/**
 * Creates a raw PNG Buffer from raw RGBA pixel buffer
 */
function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bits per channel
  ihdr.writeUInt8(6, 9); // RGBA (color type 6)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines with filter byte 0x00 at start of each row
  const scanlineLength = width * 4;
  const rawScanlines = Buffer.alloc(height * (1 + scanlineLength));

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + scanlineLength);
    rawScanlines[rowStart] = 0; // Filter None
    const srcStart = y * scanlineLength;
    rgbaBuffer.copy(rawScanlines, rowStart + 1, srcStart, srcStart + scanlineLength);
  }

  const compressedData = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// -------------------------------------------------------------
// Drawing Helpers
// -------------------------------------------------------------
class CanvasMock {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4);
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    // Simple alpha blending
    if (a === 255) {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = 255;
    } else {
      const alpha = a / 255;
      const invAlpha = 1 - alpha;
      this.buffer[idx] = Math.round(r * alpha + this.buffer[idx] * invAlpha);
      this.buffer[idx + 1] = Math.round(g * alpha + this.buffer[idx + 1] * invAlpha);
      this.buffer[idx + 2] = Math.round(b * alpha + this.buffer[idx + 2] * invAlpha);
      this.buffer[idx + 3] = Math.max(this.buffer[idx + 3], a);
    }
  }

  fillGradient(c1, c2, horizontal = false) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const t = horizontal ? x / this.width : y / this.height;
        const r = Math.round(c1[0] * (1 - t) + c2[0] * t);
        const g = Math.round(c1[1] * (1 - t) + c2[1] * t);
        const b = Math.round(c1[2] * (1 - t) + c2[2] * t);
        this.setPixel(x, y, r, g, b, 255);
      }
    }
  }

  fillRadial(cx, cy, radius, cInner, cOuter) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dist = Math.hypot(x - cx, y - cy);
        const t = Math.min(1, dist / radius);
        const r = Math.round(cInner[0] * (1 - t) + cOuter[0] * t);
        const g = Math.round(cInner[1] * (1 - t) + cOuter[1] * t);
        const b = Math.round(cInner[2] * (1 - t) + cOuter[2] * t);
        this.setPixel(x, y, r, g, b, 255);
      }
    }
  }

  drawCircle(cx, cy, r, color) {
    const r2 = r * r;
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(this.width - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(this.height - 1, Math.ceil(cy + r));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d2 = (x - cx) ** 2 + (y - cy) ** 2;
        if (d2 <= r2) {
          // Antialiasing on outer edge
          const edge = r - Math.sqrt(d2);
          const alpha = Math.min(255, Math.max(0, Math.round(edge * 255)));
          this.setPixel(x, y, color[0], color[1], color[2], alpha);
        }
      }
    }
  }

  drawRoundedRect(x, y, w, h, radius, color) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        let inside = true;
        // Check 4 corners
        if (px < x + radius && py < y + radius) {
          inside = Math.hypot(px - (x + radius), py - (y + radius)) <= radius;
        } else if (px > x + w - radius && py < y + radius) {
          inside = Math.hypot(px - (x + w - radius), py - (y + radius)) <= radius;
        } else if (px < x + radius && py > y + h - radius) {
          inside = Math.hypot(px - (x + radius), py - (y + h - radius)) <= radius;
        } else if (px > x + w - radius && py > y + h - radius) {
          inside = Math.hypot(px - (x + w - radius), py - (y + h - radius)) <= radius;
        }

        if (inside) {
          this.setPixel(px, py, color[0], color[1], color[2], color[3] ?? 255);
        }
      }
    }
  }

  // Draws stylized AMA monogram / Greek temple pillars
  drawEmblem(cx, cy, size, color) {
    const s = size / 100;
    
    // Triangular Pediment / Roof
    const topY = cy - 36 * s;
    const baseRoofY = cy - 14 * s;
    const roofHalfW = 42 * s;

    for (let py = Math.floor(topY); py <= Math.ceil(baseRoofY); py++) {
      const t = (py - topY) / (baseRoofY - topY);
      const halfW = t * roofHalfW;
      for (let px = Math.floor(cx - halfW); px <= Math.ceil(cx + halfW); px++) {
        this.setPixel(px, py, color[0], color[1], color[2], 255);
      }
    }

    // Architrave (horizontal beam under pediment)
    this.drawRoundedRect(Math.floor(cx - 44 * s), Math.floor(baseRoofY + 2 * s), Math.ceil(88 * s), Math.ceil(8 * s), Math.ceil(2 * s), color);

    // 4 Columns / Pillars
    const colW = Math.ceil(9 * s);
    const colH = Math.ceil(34 * s);
    const colY = Math.floor(baseRoofY + 12 * s);
    const colXs = [
      Math.floor(cx - 36 * s),
      Math.floor(cx - 15 * s),
      Math.floor(cx + 6 * s),
      Math.floor(cx + 27 * s)
    ];

    for (const cX of colXs) {
      this.drawRoundedRect(cX, colY, colW, colH, Math.ceil(2 * s), color);
    }

    // Base podium / Steps (3 tiers)
    const baseY = colY + colH + Math.ceil(2 * s);
    this.drawRoundedRect(Math.floor(cx - 46 * s), baseY, Math.ceil(92 * s), Math.ceil(6 * s), Math.ceil(2 * s), color);
    this.drawRoundedRect(Math.floor(cx - 50 * s), baseY + Math.ceil(7 * s), Math.ceil(100 * s), Math.ceil(6 * s), Math.ceil(2 * s), color);
    this.drawRoundedRect(Math.floor(cx - 54 * s), baseY + Math.ceil(14 * s), Math.ceil(108 * s), Math.ceil(7 * s), Math.ceil(2 * s), color);
  }

  toPNG() {
    return encodePNG(this.width, this.height, this.buffer);
  }
}

// -------------------------------------------------------------
// ASSET GENERATORS
// -------------------------------------------------------------

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('🎨 Generating Google Play Store assets in:', assetsDir);

// 1. App Icon (512x512 PNG, 32-bit color, no transparency for Play Store)
console.log('  -> Generating icon.png (512x512)...');
const iconCanvas = new CanvasMock(512, 512);
// Deep Royal Indigo Gradient: #312E81 to #4F46E5
iconCanvas.fillRadial(256, 200, 360, [79, 70, 229], [30, 27, 75]);

// Soft ambient glow circle
iconCanvas.drawCircle(256, 240, 180, [99, 102, 241]);

// Center Squircle / Shield backdrop
iconCanvas.drawRoundedRect(80, 70, 352, 352, 76, [255, 255, 255, 35]);
iconCanvas.drawRoundedRect(92, 82, 328, 328, 68, [49, 46, 129, 230]);

// Gold accent badge ring
iconCanvas.drawCircle(256, 236, 118, [245, 158, 11]);
iconCanvas.drawCircle(256, 236, 110, [67, 56, 202]);

// White Temple / Society Emblem
iconCanvas.drawEmblem(256, 232, 130, [255, 255, 255]);

// Small golden star at pediment peak
iconCanvas.drawCircle(256, 166, 7, [251, 191, 36]);

fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconCanvas.toPNG());
console.log('     ✓ Saved icon.png');

// 2. Adaptive Icon Foreground (432x432 PNG with transparent background)
console.log('  -> Generating adaptive-icon.png (432x432)...');
const adaptCanvas = new CanvasMock(432, 432);
// Transparent canvas
adaptCanvas.drawCircle(216, 216, 130, [255, 255, 255]);
adaptCanvas.drawCircle(216, 216, 122, [67, 56, 202]);
adaptCanvas.drawEmblem(216, 214, 120, [255, 255, 255]);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptCanvas.toPNG());
console.log('     ✓ Saved adaptive-icon.png');

// 3. Feature Graphic (1024x500 PNG, required for Google Play Store listing)
console.log('  -> Generating feature-graphic.png (1024x500)...');
const featCanvas = new CanvasMock(1024, 500);
// Elegant indigo-slate gradient: #1E1B4B to #4338CA
featCanvas.fillRadial(300, 250, 600, [67, 56, 202], [15, 23, 42]);

// Abstract decorative geometric circles
featCanvas.drawCircle(840, 120, 160, [99, 102, 241]);
featCanvas.drawCircle(840, 120, 140, [30, 27, 75]);
featCanvas.drawCircle(920, 380, 120, [245, 158, 11]);
featCanvas.drawCircle(920, 380, 105, [30, 27, 75]);

// Left hero emblem
featCanvas.drawRoundedRect(80, 100, 280, 300, 48, [255, 255, 255, 25]);
featCanvas.drawRoundedRect(92, 112, 256, 276, 40, [49, 46, 129, 240]);
featCanvas.drawCircle(220, 240, 85, [245, 158, 11]);
featCanvas.drawCircle(220, 240, 78, [67, 56, 202]);
featCanvas.drawEmblem(220, 238, 90, [255, 255, 255]);

// Right bento feature cards mockup
// Card 1: Gate Security Pass (Green)
featCanvas.drawRoundedRect(420, 80, 260, 100, 20, [16, 185, 129, 230]);
featCanvas.drawCircle(460, 130, 24, [255, 255, 255]);
featCanvas.drawRoundedRect(500, 115, 150, 12, 6, [255, 255, 255]);
featCanvas.drawRoundedRect(500, 135, 100, 8, 4, [255, 255, 255, 180]);

// Card 2: Google Maps Live Tracking (Blue)
featCanvas.drawRoundedRect(710, 80, 260, 100, 20, [59, 130, 246, 230]);
featCanvas.drawCircle(750, 130, 24, [255, 255, 255]);
featCanvas.drawRoundedRect(790, 115, 150, 12, 6, [255, 255, 255]);
featCanvas.drawRoundedRect(790, 135, 90, 8, 4, [255, 255, 255, 180]);

// Card 3: Instant UPI Maintenance Billing (Purple)
featCanvas.drawRoundedRect(420, 200, 550, 120, 22, [255, 255, 255, 30]);
featCanvas.drawRoundedRect(432, 212, 526, 96, 16, [30, 41, 59, 220]);
featCanvas.drawCircle(475, 260, 26, [245, 158, 11]);
featCanvas.drawRoundedRect(520, 242, 280, 14, 7, [255, 255, 255]);
featCanvas.drawRoundedRect(520, 266, 180, 10, 5, [148, 163, 184]);

// Bottom Badge Pills
featCanvas.drawRoundedRect(420, 340, 170, 44, 22, [67, 56, 202]);
featCanvas.drawRoundedRect(605, 340, 175, 44, 22, [13, 148, 136]);
featCanvas.drawRoundedRect(795, 340, 175, 44, 22, [217, 119, 6]);

fs.writeFileSync(path.join(assetsDir, 'feature-graphic.png'), featCanvas.toPNG());
console.log('     ✓ Saved feature-graphic.png');

// 4. Splash Screen (1284x2778 PNG, mobile launch screen)
console.log('  -> Generating splash.png (1284x2778)...');
const splashCanvas = new CanvasMock(1284, 2778);
// Solid Royal Indigo #4338CA with subtle center vertical lighting
splashCanvas.fillRadial(642, 1389, 1100, [79, 70, 229], [30, 27, 75]);

// Center circular aura
splashCanvas.drawCircle(642, 1340, 260, [99, 102, 241]);
splashCanvas.drawCircle(642, 1340, 220, [67, 56, 202]);

// White Temple Emblem (large size)
splashCanvas.drawEmblem(642, 1330, 240, [255, 255, 255]);

// Subtitle pill at bottom
splashCanvas.drawRoundedRect(462, 1620, 360, 56, 28, [255, 255, 255, 35]);
splashCanvas.drawRoundedRect(472, 1628, 340, 40, 20, [30, 27, 75, 200]);

// Footer dots
splashCanvas.drawCircle(602, 2600, 8, [255, 255, 255, 120]);
splashCanvas.drawCircle(642, 2600, 10, [245, 158, 11]);
splashCanvas.drawCircle(682, 2600, 8, [255, 255, 255, 120]);

fs.writeFileSync(path.join(assetsDir, 'splash.png'), splashCanvas.toPNG());
console.log('     ✓ Saved splash.png');

console.log('🎉 All 4 Google Play Store visual assets generated successfully!');
