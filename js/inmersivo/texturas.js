// Texturas procedurales (canvas) para el recorrido inmersivo.
// Nada se descarga: concreto, yeso, madera, metal cepillado, pavimento, grava,
// follaje y cielo se dibujan al cargar, de modo que la pagina funciona sola.
import * as THREE from 'three';

const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })];
}

function mancha(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace('ALPHA', alpha));
  g.addColorStop(1, color.replace('ALPHA', 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

function textura(c, aniso, repetir = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  return t;
}

// Convierte un mapa de altura en un mapa de normales tangente.
function normalDe(c, fuerza = 1.6, aniso = 4) {
  const w = c.width, h = c.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  const src = x.getImageData(0, 0, w, h).data;
  const out = x.createImageData(w, h);
  const d = out.data;
  const H = (i, j) => {
    const ii = (i + w) % w, jj = (j + h) % h;
    return src[(jj * w + ii) * 4] / 255;
  };
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const dx = (H(i + 1, j) - H(i - 1, j)) * fuerza;
      const dy = (H(i, j + 1) - H(i, j - 1)) * fuerza;
      const nx = -dx, ny = dy, nz = 1;
      const l = Math.hypot(nx, ny, nz) || 1;
      const k = (j * w + i) * 4;
      d[k] = (nx / l * 0.5 + 0.5) * 255;
      d[k + 1] = (ny / l * 0.5 + 0.5) * 255;
      d[k + 2] = (nz / l * 0.5 + 0.5) * 255;
      d[k + 3] = 255;
    }
  }
  x.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  return t;
}

function yeso(aniso) {
  const [c, x] = lienzo(512, 512);
  x.fillStyle = '#e7e3da'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 34; i++) mancha(x, rnd(0, 512), rnd(0, 512), rnd(40, 180), i % 3 ? 'rgba(201,196,187,ALPHA)' : 'rgba(246,243,236,ALPHA)', rnd(0.05, 0.15));
  for (let i = 0; i < 22000; i++) {
    x.fillStyle = `rgba(${Math.random() > 0.5 ? '255,253,248' : '146,142,134'},${rnd(0.015, 0.06)})`;
    x.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }
  // marcas de llana muy suaves
  for (let i = 0; i < 9; i++) {
    x.strokeStyle = `rgba(178,173,164,${rnd(0.04, 0.1)})`;
    x.lineWidth = rnd(2, 8);
    x.beginPath();
    let px = rnd(-40, 512), py = rnd(0, 512);
    x.moveTo(px, py);
    for (let k = 0; k < 5; k++) { px += rnd(60, 130); py += rnd(-18, 18); x.lineTo(px, py); }
    x.stroke();
  }
  const map = textura(c, aniso);

  const [ch, xh] = lienzo(512, 512);
  xh.fillStyle = '#808080'; xh.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) {
    const v = Math.floor(rnd(90, 175));
    xh.fillStyle = `rgba(${v},${v},${v},${rnd(0.12, 0.4)})`;
    xh.beginPath(); xh.arc(Math.random() * 512, Math.random() * 512, rnd(0.6, 2.6), 0, TAU); xh.fill();
  }
  for (let i = 0; i < 60; i++) mancha(xh, rnd(0, 512), rnd(0, 512), rnd(20, 90), 'rgba(120,120,120,ALPHA)', rnd(0.05, 0.16));
  const normal = normalDe(ch, 1.1, aniso);
  return { map, normal };
}

function concreto(aniso) {
  const [c, x] = lienzo(1024, 1024);
  x.fillStyle = '#b1aba0'; x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 52; i++) mancha(x, rnd(0, 1024), rnd(0, 1024), rnd(80, 360), i % 3 ? 'rgba(148,141,131,ALPHA)' : 'rgba(214,208,198,ALPHA)', rnd(0.04, 0.16));
  for (let i = 0; i < 32000; i++) {
    const a = Math.random() * 0.1;
    x.fillStyle = Math.random() > 0.5 ? `rgba(255,252,244,${a})` : `rgba(60,56,50,${a})`;
    x.fillRect(Math.random() * 1024, Math.random() * 1024, 1, 1);
  }
  // juntas de corte cada 2 m (la textura se repite cada 4 m)
  x.strokeStyle = 'rgba(104,98,90,.5)'; x.lineWidth = 4;
  x.beginPath(); x.moveTo(512, 0); x.lineTo(512, 1024); x.moveTo(0, 512); x.lineTo(1024, 512); x.stroke();
  x.strokeStyle = 'rgba(240,236,228,.35)'; x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(516, 0); x.lineTo(516, 1024); x.moveTo(0, 516); x.lineTo(1024, 516); x.stroke();
  for (let i = 0; i < 9; i++) {
    x.strokeStyle = 'rgba(88,82,74,.18)'; x.lineWidth = 0.9; x.beginPath();
    let px = rnd(0, 1024), py = rnd(0, 1024); x.moveTo(px, py);
    for (let k = 0; k < 24; k++) { px += rnd(-24, 24); py += rnd(-16, 16); x.lineTo(px, py); }
    x.stroke();
  }
  // manchas de uso
  for (let i = 0; i < 16; i++) mancha(x, rnd(0, 1024), rnd(0, 1024), rnd(20, 90), 'rgba(70,64,56,ALPHA)', rnd(0.03, 0.08));
  const map = textura(c, aniso);

  const [ch, xh] = lienzo(512, 512);
  xh.fillStyle = '#8a8a8a'; xh.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 12000; i++) {
    const v = Math.floor(rnd(100, 190));
    xh.fillStyle = `rgba(${v},${v},${v},${rnd(0.06, 0.18)})`;
    xh.fillRect(Math.random() * 512, Math.random() * 512, rnd(1, 3), rnd(1, 3));
  }
  xh.strokeStyle = 'rgba(50,50,50,.75)'; xh.lineWidth = 3;
  xh.beginPath(); xh.moveTo(256, 0); xh.lineTo(256, 512); xh.moveTo(0, 256); xh.lineTo(512, 256); xh.stroke();
  const normal = normalDe(ch, 0.7, aniso);

  const [cr, xr] = lienzo(512, 512);
  xr.fillStyle = '#8e8e8e'; xr.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = Math.floor(rnd(100, 190));
    xr.fillStyle = `rgba(${v},${v},${v},.12)`;
    xr.fillRect(Math.random() * 512, Math.random() * 512, rnd(1, 3), rnd(1, 3));
  }
  xr.strokeStyle = 'rgba(205,205,205,.7)'; xr.lineWidth = 2;
  xr.beginPath(); xr.moveTo(256, 0); xr.lineTo(256, 512); xr.moveTo(0, 256); xr.lineTo(512, 256); xr.stroke();
  const rough = new THREE.CanvasTexture(cr);
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  rough.anisotropy = aniso;
  return { map, normal, rough };
}

function madera(aniso, base = '#a77b52', oscura = '60,35,18') {
  const [c, x] = lienzo(512, 512);
  x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 210; i++) {
    const px = Math.random() * 512;
    x.strokeStyle = `rgba(${oscura},${rnd(0.04, 0.14)})`;
    x.lineWidth = rnd(0.5, 2.6);
    x.beginPath();
    for (let y = 0; y <= 512; y += 6) {
      const xx = px + Math.sin(y * 0.017 + i) * 3.5 + Math.sin(y * 0.005 + i * 2.1) * 7;
      y ? x.lineTo(xx, y) : x.moveTo(xx, y);
    }
    x.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const px = rnd(30, 482), py = rnd(30, 482);
    x.strokeStyle = `rgba(${oscura},.22)`; x.lineWidth = 1.2;
    for (let k = 1; k < 6; k++) { x.beginPath(); x.ellipse(px, py, 3 + k * 3, 9 + k * 7, 0.2, 0, TAU); x.stroke(); }
  }
  for (let i = 0; i < 6000; i++) {
    x.fillStyle = `rgba(255,240,220,${rnd(0.01, 0.05)})`;
    x.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }
  const map = textura(c, aniso);

  const [ch, xh] = lienzo(256, 256);
  xh.fillStyle = '#808080'; xh.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 130; i++) {
    const px = Math.random() * 256;
    xh.strokeStyle = `rgba(${Math.random() > 0.5 ? '110,110,110' : '60,60,60'},${rnd(0.1, 0.3)})`;
    xh.lineWidth = rnd(0.6, 1.8);
    xh.beginPath();
    for (let y = 0; y <= 256; y += 4) {
      const xx = px + Math.sin(y * 0.05 + i) * 2 + Math.sin(y * 0.014 + i * 2) * 3;
      y ? xh.lineTo(xx, y) : xh.moveTo(xx, y);
    }
    xh.stroke();
  }
  const normal = normalDe(ch, 1.2, aniso);
  return { map, normal };
}

function metal(aniso) {
  const [c, x] = lienzo(512, 512);
  x.fillStyle = '#d9d9d9'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3000; i++) {
    const v = Math.floor(rnd(140, 255));
    x.strokeStyle = `rgba(${v},${v},${v},${rnd(0.03, 0.16)})`;
    x.lineWidth = rnd(0.5, 2);
    const px = Math.random() * 512;
    x.beginPath(); x.moveTo(px, 0); x.lineTo(px + rnd(-6, 6), 512); x.stroke();
  }
  const rough = new THREE.CanvasTexture(c);
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  rough.anisotropy = aniso;
  return rough;
}

function techo(aniso) {
  const [c, x] = lienzo(512, 512);
  x.fillStyle = '#e2ded5'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) mancha(x, rnd(0, 512), rnd(0, 512), rnd(30, 130), 'rgba(196,192,184,ALPHA)', rnd(0.04, 0.1));
  for (let i = 0; i < 14000; i++) {
    x.fillStyle = `rgba(${Math.random() > 0.5 ? '255,253,248' : '156,152,144'},${rnd(0.015, 0.05)})`;
    x.beginPath(); x.arc(Math.random() * 512, Math.random() * 512, 0.8, 0, TAU); x.fill();
  }
  for (let gx = 0; gx < 4; gx++) for (let gy = 0; gy < 4; gy++) {
    x.strokeStyle = 'rgba(122,118,110,.34)'; x.lineWidth = 2;
    x.strokeRect(gx * 128 + 1.5, gy * 128 + 1.5, 125, 125);
    x.strokeStyle = 'rgba(255,255,250,.22)'; x.lineWidth = 1;
    x.strokeRect(gx * 128 + 3, gy * 128 + 3, 121, 121);
  }
  const map = textura(c, aniso);

  const [ch, xh] = lienzo(256, 256);
  xh.fillStyle = '#9a9a9a'; xh.fillRect(0, 0, 256, 256);
  for (let gx = 0; gx < 4; gx++) for (let gy = 0; gy < 4; gy++) {
    xh.fillStyle = '#c8c8c8';
    xh.fillRect(gx * 64 + 2, gy * 64 + 2, 60, 60);
    xh.strokeStyle = '#4a4a4a'; xh.lineWidth = 3;
    xh.strokeRect(gx * 64 + 1, gy * 64 + 1, 62, 62);
  }
  const normal = normalDe(ch, 0.9, aniso);
  return { map, normal };
}

function pantalla() {
  const [c, x] = lienzo(512, 320);
  x.fillStyle = '#05080c'; x.fillRect(0, 0, 512, 320);
  x.fillStyle = '#0b1a26'; x.fillRect(0, 0, 512, 26);
  x.fillStyle = '#2f7fb5'; x.fillRect(0, 26, 512, 2);
  const cols = ['#38bdf8', '#34d399', '#f59e0b', '#f472b6'];
  for (let i = 0; i < 4; i++) {
    x.fillStyle = cols[i]; x.globalAlpha = 0.85;
    x.fillRect(18 + i * 122, 48, 104, 8);
    x.globalAlpha = 0.25;
    x.fillRect(18 + i * 122, 64, 104, 40);
    x.globalAlpha = 1;
  }
  x.strokeStyle = 'rgba(56,189,248,.9)'; x.lineWidth = 2; x.beginPath();
  for (let i = 0; i <= 40; i++) {
    const px = 18 + i * 12, py = 250 - (Math.sin(i * 0.5) * 0.5 + 0.5) * 90 - rnd(0, 10);
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.stroke();
  x.fillStyle = 'rgba(226,240,250,.55)';
  for (let i = 0; i < 14; i++) x.fillRect(18, 280 + (i % 3) * 10, rnd(40, 220), 3);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function cielo(aniso) {
  const [c, x] = lienzo(2048, 1024);
  const g = x.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0.0, '#24507c');
  g.addColorStop(0.18, '#4a7fa8');
  g.addColorStop(0.34, '#7fa8c2');
  g.addColorStop(0.44, '#b9c4bb');
  g.addColorStop(0.475, '#e8d5ae');
  g.addColorStop(0.497, '#ffe2b0');
  g.addColorStop(0.512, '#c8b489');
  g.addColorStop(0.56, '#7d8460');
  g.addColorStop(0.62, '#4e5c3d');
  g.addColorStop(1.0, '#33402c');
  x.fillStyle = g; x.fillRect(0, 0, 2048, 1024);

  // sol bajo a la izquierda de la fachada (u ~ 0.28), con halo cálido
  mancha(x, 575, 430, 420, 'rgba(255,226,176,ALPHA)', 0.35);
  mancha(x, 575, 430, 210, 'rgba(255,241,208,ALPHA)', 0.7);
  mancha(x, 575, 430, 74, 'rgba(255,255,246,ALPHA)', 0.98);

  // nubes altas en bandas
  for (let i = 0; i < 70; i++) {
    const px = rnd(0, 2048), py = rnd(70, 390), r = rnd(70, 260);
    const a = rnd(0.03, 0.13);
    mancha(x, px, py, r, 'rgba(255,251,242,ALPHA)', a);
    if (px < 300) mancha(x, px + 2048, py, r, 'rgba(255,251,242,ALPHA)', a);
  }
  for (let i = 0; i < 22; i++) {
    const px = rnd(0, 2048), py = rnd(360, 470), r = rnd(120, 320);
    mancha(x, px, py, r, 'rgba(255,240,214,ALPHA)', rnd(0.03, 0.1));
  }

  // colinas y arboleda lejana, en varias capas con niebla
  for (let capa = 0; capa < 3; capa++) {
    const base = 512 + capa * 16;
    const alfa = 0.2 + capa * 0.16;
    for (let i = 0; i < 90; i++) {
      const px = Math.random() * 2048, r = rnd(70, 240);
      const v = 70 + capa * 18;
      x.fillStyle = `rgba(${v - 18},${v},${v - 30},${alfa * rnd(0.3, 0.8)})`;
      x.beginPath(); x.ellipse(px, base + rnd(-10, 10), r, r * rnd(0.18, 0.34), 0, 0, TAU); x.fill();
      if (px < 140) { x.beginPath(); x.ellipse(px + 2048, base, r, r * 0.24, 0, 0, TAU); x.fill(); }
    }
  }
  // arboles cercanos del horizonte
  for (let i = 0; i < 520; i++) {
    const px = Math.random() * 2048, py = 522 + rnd(-6, 16), r = rnd(8, 30);
    const v = Math.floor(rnd(42, 82));
    x.fillStyle = `rgba(${v - 12},${v},${v - 24},${rnd(0.18, 0.52)})`;
    x.beginPath(); x.ellipse(px, py, r, r * rnd(0.7, 1.5), 0, 0, TAU); x.fill();
    if (px < 60) { x.beginPath(); x.ellipse(px + 2048, py, r, r, 0, 0, TAU); x.fill(); }
  }
  // banda de calima
  const h = x.createLinearGradient(0, 470, 0, 540);
  h.addColorStop(0, 'rgba(238,228,206,0)');
  h.addColorStop(0.55, 'rgba(238,228,206,.3)');
  h.addColorStop(1, 'rgba(238,228,206,0)');
  x.fillStyle = h; x.fillRect(0, 470, 2048, 70);

  const map = textura(c, aniso, false);
  map.mapping = THREE.EquirectangularReflectionMapping;
  return map;
}

function cesped(aniso) {
  const [c, x] = lienzo(512, 512);
  x.fillStyle = '#56663f'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) mancha(x, rnd(0, 512), rnd(0, 512), rnd(30, 150), i % 2 ? 'rgba(64,84,44,ALPHA)' : 'rgba(126,138,86,ALPHA)', rnd(0.05, 0.18));
  for (let i = 0; i < 16000; i++) {
    x.strokeStyle = `rgba(${Math.random() > 0.5 ? '124,146,82' : '56,76,40'},${rnd(0.05, 0.22)})`;
    x.lineWidth = 0.7;
    const px = Math.random() * 512, py = Math.random() * 512;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + rnd(-2, 2), py - rnd(2, 7)); x.stroke();
  }
  // tréboles y florecillas mínimas
  for (let i = 0; i < 90; i++) {
    x.fillStyle = `rgba(${rnd(120, 170) | 0},${rnd(150, 190) | 0},${rnd(80, 120) | 0},${rnd(0.2, 0.5)})`;
    x.beginPath(); x.arc(Math.random() * 512, Math.random() * 512, rnd(0.6, 1.6), 0, TAU); x.fill();
  }
  const map = textura(c, aniso);
  map.repeat.set(22, 22);

  const [ch, xh] = lienzo(256, 256);
  xh.fillStyle = '#808080'; xh.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    xh.strokeStyle = `rgba(${Math.random() > 0.5 ? '180,180,180' : '60,60,60'},${rnd(0.1, 0.3)})`;
    xh.lineWidth = 1;
    const px = Math.random() * 256, py = Math.random() * 256;
    xh.beginPath(); xh.moveTo(px, py); xh.lineTo(px + rnd(-2, 2), py - rnd(2, 6)); xh.stroke();
  }
  const normal = normalDe(ch, 1.4, aniso);
  normal.repeat.set(22, 22);
  return { map, normal };
}

function pavimento(aniso) {
  // 4.8 x 4.8 m: 8 hiladas de 0.6 m y 16 piezas de 0.3 m
  const [c, x] = lienzo(1024, 1024);
  x.fillStyle = '#8d867a'; x.fillRect(0, 0, 1024, 1024);
  const fw = 128, fh = 64;
  for (let row = 0; row < 16; row++) {
    for (let col = -1; col < 8; col++) {
      const off = (row % 2) * fw * 0.5;
      const px = col * fw + off, py = row * fh;
      const v = rnd(0.86, 1.08);
      const r = Math.round(168 * v), g = Math.round(160 * v), b = Math.round(148 * v);
      x.fillStyle = `rgb(${r},${g},${b})`;
      x.fillRect(px + 2, py + 2, fw - 4, fh - 4);
      // bisel
      x.strokeStyle = 'rgba(255,255,250,.18)'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(px + 2, py + fh - 3); x.lineTo(px + 2, py + 2); x.lineTo(px + fw - 3, py + 2); x.stroke();
      x.strokeStyle = 'rgba(40,36,30,.25)';
      x.beginPath(); x.moveTo(px + fw - 3, py + 3); x.lineTo(px + fw - 3, py + fh - 3); x.lineTo(px + 3, py + fh - 3); x.stroke();
      // grano y manchas por pieza
      for (let i = 0; i < 90; i++) {
        x.fillStyle = `rgba(${Math.random() > 0.5 ? '255,252,244' : '72,66,58'},${rnd(0.02, 0.08)})`;
        x.fillRect(px + rnd(4, fw - 5), py + rnd(4, fh - 5), 1, 1);
      }
      if (Math.random() < 0.18) mancha(x, px + rnd(20, fw - 20), py + rnd(10, fh - 10), rnd(10, 28), 'rgba(70,64,54,ALPHA)', rnd(0.05, 0.13));
    }
  }
  // juntas de arena
  for (let row = 0; row < 16; row++) {
    x.fillStyle = 'rgba(92,86,74,.55)';
    x.fillRect(0, row * fh - 1, 1024, 2);
  }
  const map = textura(c, aniso);

  const [ch, xh] = lienzo(512, 512);
  xh.fillStyle = '#b0b0b0'; xh.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) {
    xh.fillStyle = '#d0d0d0';
    xh.fillRect(0, row * 64 + 3, 512, 58);
    xh.fillStyle = '#3a3a3a';
    xh.fillRect(0, row * 64, 512, 3);
    xh.fillStyle = 'rgba(60,60,60,.5)';
    for (let col = 0; col < 8; col++) xh.fillRect(col * 64 + (row % 2) * 32, row * 64, 2, 64);
  }
  const normal = normalDe(ch, 0.55, aniso);
  return { map, normal };
}

function grava(aniso) {
  const [c, x] = lienzo(512, 512);
  x.fillStyle = '#6f6a60'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 520; i++) {
    const px = Math.random() * 512, py = Math.random() * 512;
    const r = rnd(2, 7);
    const v = rnd(0.7, 1.25);
    x.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(144 * v)},${Math.round(132 * v)})`;
    x.beginPath(); x.ellipse(px, py, r, r * rnd(0.6, 1.1), rnd(0, TAU), 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,255,250,.15)';
    x.beginPath(); x.ellipse(px - r * 0.2, py - r * 0.25, r * 0.5, r * 0.3, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgba(30,28,24,.25)';
    x.beginPath(); x.ellipse(px + r * 0.25, py + r * 0.3, r * 0.55, r * 0.3, 0, 0, TAU); x.fill();
  }
  const map = textura(c, aniso);
  map.repeat.set(4, 4);

  const [ch, xh] = lienzo(256, 256);
  xh.fillStyle = '#6a6a6a'; xh.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    const px = Math.random() * 256, py = Math.random() * 256;
    const r = rnd(1, 3.4);
    const g = xh.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(255,255,255,.9)');
    g.addColorStop(0.7, 'rgba(150,150,150,.5)');
    g.addColorStop(1, 'rgba(40,40,40,0)');
    xh.fillStyle = g;
    xh.beginPath(); xh.arc(px, py, r, 0, TAU); xh.fill();
  }
  const normal = normalDe(ch, 2.0, aniso);
  normal.repeat.set(4, 4);
  return { map, normal };
}

function hojaTarjeta() {
  const [c, x] = lienzo(512, 512);
  x.clearRect(0, 0, 512, 512);
  const verdes = ['#4c7a3a', '#5f8f45', '#3f6b32', '#6b9a4d', '#557f3d', '#759f56'];
  for (let i = 0; i < 130; i++) {
    const a = Math.random() * TAU;
    const r = Math.pow(Math.random(), 0.6) * 205;
    const px = 256 + Math.cos(a) * r * rnd(0.75, 1.05);
    const py = 256 + Math.sin(a) * r * rnd(0.7, 1.0) * 0.92;
    const s = rnd(9, 26);
    x.save();
    x.translate(px, py);
    x.rotate(a + rnd(-0.7, 0.7));
    x.fillStyle = verdes[(Math.random() * verdes.length) | 0];
    x.globalAlpha = rnd(0.75, 1);
    x.beginPath();
    x.moveTo(-s, 0);
    x.quadraticCurveTo(0, -s * rnd(0.5, 0.9), s, 0);
    x.quadraticCurveTo(0, s * rnd(0.5, 0.9), -s, 0);
    x.fill();
    x.strokeStyle = 'rgba(28,44,22,.35)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(-s * 0.8, 0); x.lineTo(s * 0.8, 0); x.stroke();
    x.restore();
  }
  // ramitas
  for (let i = 0; i < 9; i++) {
    x.strokeStyle = 'rgba(70,54,38,.55)'; x.lineWidth = rnd(1.5, 3);
    x.beginPath();
    const a = rnd(0, TAU);
    x.moveTo(256, 256);
    x.quadraticCurveTo(256 + Math.cos(a) * 90, 256 + Math.sin(a) * 90, 256 + Math.cos(a) * 190, 256 + Math.sin(a) * 190);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function hierbaTarjeta() {
  const [c, x] = lienzo(256, 256);
  x.clearRect(0, 0, 256, 256);
  const verdes = ['#4d6a35', '#5c7d3f', '#6b8f49', '#3f5a2c', '#7b9a55'];
  for (let i = 0; i < 34; i++) {
    const bx = 128 + rnd(-58, 58);
    const h = rnd(90, 235);
    const lean = rnd(-48, 48);
    x.strokeStyle = verdes[(Math.random() * verdes.length) | 0];
    x.lineWidth = rnd(1.6, 4.2);
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(bx, 256);
    x.quadraticCurveTo(bx + lean * 0.25, 256 - h * 0.55, bx + lean, 256 - h);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function haz() {
  const [c, x] = lienzo(128, 512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, 'rgba(255,240,206,.5)');
  g.addColorStop(0.45, 'rgba(255,236,196,.18)');
  g.addColorStop(1, 'rgba(255,236,196,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 512);
  const h = x.createLinearGradient(0, 0, 128, 0);
  h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.2, 'rgba(0,0,0,0)');
  h.addColorStop(0.8, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 128, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function sombra() {
  const [c, x] = lienzo(128, 128);
  const g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.62)');
  g.addColorStop(0.55, 'rgba(0,0,0,.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function crearLetrero(texto, color) {
  const [c, x] = lienzo(1600, 240);
  // fondo verde muy oscuro con un degradado sutil
  const g = x.createLinearGradient(0, 0, 0, 240);
  g.addColorStop(0, '#111b15');
  g.addColorStop(1, '#080d0a');
  x.fillStyle = g; x.fillRect(0, 0, 1600, 240);
  // filo metálico y línea de acento
  x.strokeStyle = 'rgba(214,224,216,.28)'; x.lineWidth = 3;
  x.strokeRect(1.5, 1.5, 1597, 237);
  x.fillStyle = color; x.fillRect(48, 30, 52, 3);
  x.fillStyle = 'rgba(238,244,240,.55)';
  x.font = '500 23px "JetBrains Mono", ui-monospace, monospace';
  x.fillText('B A V A R I A   C O M Ú N', 48, 76);
  let size = 96;
  const t = texto.toUpperCase();
  const poner = () => { x.font = `300 ${size}px "Barlow Condensed", Inter, sans-serif`; };
  poner();
  while (x.measureText(t).width > 1500 && size > 38) { size -= 2; poner(); }
  x.fillStyle = '#f3f7f4';
  x.fillText(t, 48, 188);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

export function crearTexturas(R) {
  const aniso = Math.min(8, R.capabilities.getMaxAnisotropy());
  const con = concreto(aniso);
  const yes = yeso(aniso);
  const mad = madera(aniso, '#a77b52', '60,35,18');
  const madC = madera(aniso, '#c9a77c', '92,62,34');
  const tec = techo(aniso);
  const ces = cesped(aniso);
  const pav = pavimento(aniso);
  const grav = grava(aniso);
  return {
    concreto: con.map,
    concretoN: con.normal,
    concretoR: con.rough,
    yeso: yes.map,
    yesoN: yes.normal,
    madera: mad.map,
    maderaN: mad.normal,
    maderaClara: madC.map,
    maderaClaraN: madC.normal,
    metalR: metal(aniso),
    techo: tec.map,
    techoN: tec.normal,
    pantalla: pantalla(),
    cielo: cielo(aniso),
    cesped: ces.map,
    cespedN: ces.normal,
    pavimento: pav.map,
    pavimentoN: pav.normal,
    grava: grav.map,
    gravaN: grav.normal,
    hoja: hojaTarjeta(),
    hierba: hierbaTarjeta(),
    haz: haz(),
    sombra: sombra()
  };
}
