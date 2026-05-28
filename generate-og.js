const { PNG } = require('pngjs');
const fs = require('fs');

const W = 1200, H = 630;
const png = new PNG({ width: W, height: H });

// Warm white background matching --white token (oklch 98% 0.012 80)
for (let i = 0; i < W * H; i++) {
  const idx = i * 4;
  png.data[idx]   = 250;
  png.data[idx+1] = 246;
  png.data[idx+2] = 240;
  png.data[idx+3] = 255;
}

// Accent red matching --accent token (oklch 57% 0.21 28) ≈ rgb(215, 40, 36)
const [rR, rG, rB] = [215, 40, 36];

// Heart parametric: x=16sin³t, y=-(13cost-5cos2t-2cos3t-cos4t)
// Scaled to fill roughly 65% of image height, centered
const cx = W / 2;
const cy = H / 2 + 25;
const sx = 250 / 16;
const sy = 250 / 14;

const N = 4000;
const pts = [];
for (let i = 0; i <= N; i++) {
  const t = (i / N) * Math.PI * 2;
  const hx = 16 * Math.pow(Math.sin(t), 3);
  const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
  pts.push([cx + hx * sx, cy + hy * sy]);
}

// Scanline fill
const yMin = Math.floor(Math.min(...pts.map(p => p[1])));
const yMax = Math.ceil(Math.max(...pts.map(p => p[1])));

for (let y = Math.max(0, yMin); y <= Math.min(H - 1, yMax); y++) {
  const xs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    if ((ay <= y && by > y) || (by <= y && ay > y)) {
      xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
    }
  }
  xs.sort((a, b) => a - b);
  for (let j = 0; j + 1 < xs.length; j += 2) {
    const x0 = Math.max(0, Math.floor(xs[j]));
    const x1 = Math.min(W - 1, Math.ceil(xs[j + 1]));
    for (let x = x0; x <= x1; x++) {
      const idx = (y * W + x) * 4;
      png.data[idx]   = rR;
      png.data[idx+1] = rG;
      png.data[idx+2] = rB;
      png.data[idx+3] = 255;
    }
  }
}

fs.writeFileSync('og-image.png', PNG.sync.write(png));
console.log('Generated og-image.png (1200x630)');
