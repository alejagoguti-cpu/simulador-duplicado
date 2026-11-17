/* ============ HUERTAS DE BARRIO (solo con la propuesta) ============
   Red distribuida de producción alimentaria: módulos de bancales de madera en los lotes baldíos de E8 y en parques vecinales y de
   bolsillo, en claros sin árboles, canchas ni edificios (tools/huertas_barrio_build.py -> data3d/huertas_barrio.json).
   Cada módulo: piso de viruta, bancales elevados de tablas con tierra, paja y surcos, cultivo por bancal, cerca baja de madera,
   composteras de listones, tanque de agua lluvia, caseta de herramientas y borde de girasoles. Las plantas (hojas reales en
   tarjetas, como en el distrito Bavaria Común) solo se arman cerca de la cámara. */
export async function crearHuertasBarrio({ THREE, T3, D, movil = false }) {
  const grupo = new THREE.Group(); grupo.name = 'huertas-barrio'; grupo.visible = false; T3.scene.add(grupo);
  const YG = (T3.sueloY != null ? T3.sueloY : 0.35) + 0.14; // piso de la huerta, apenas sobre el terreno
  const ANIS = Math.min(8, T3.renderer.capabilities.getMaxAnisotropy ? T3.renderer.capabilities.getMaxAnisotropy() : 4);
  let sem = 7; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
  const lienzo = (w, h, f, rep = true) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANIS; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const mStd = (c, ex = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0, ...ex });

  /* ---------- texturas ---------- */
  const texTabla = lienzo(512, 128, (g, w, h) => { // dos tablas horizontales con veta, juntas y clavos
    for (let k = 0; k < 2; k++) { const y = k * 64; g.fillStyle = `rgb(${118 + rnd() * 26},${84 + rnd() * 18},${54 + rnd() * 12})`; g.fillRect(0, y, w, 64);
      for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(${55 + rnd() * 30},${36 + rnd() * 18},18,${0.18 + rnd() * 0.25})`; g.lineWidth = 1; const yy = y + 4 + rnd() * 56; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(150, yy + 3 * (rnd() - 0.5), 350, yy + 4 * (rnd() - 0.5), w, yy + 2 * (rnd() - 0.5)); g.stroke(); }
      g.fillStyle = 'rgba(30,18,8,.6)'; g.fillRect(0, y, w, 3); for (const x of [10, 250, 500]) { g.fillStyle = '#3b3b3b'; g.fillRect(x, y + 14, 3, 3); g.fillRect(x, y + 46, 3, 3); } }
    g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 260; i++) g.fillRect(rnd() * w, rnd() * h, 2, 1); });
  const texViruta = lienzo(256, 256, (g, w, h) => { g.fillStyle = '#8a6a48'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3200; i++) { const v = rnd(); g.fillStyle = v < 0.4 ? 'rgba(70,48,28,.65)' : v < 0.8 ? 'rgba(170,135,92,.6)' : 'rgba(205,180,140,.6)'; g.save(); g.translate(rnd() * w, rnd() * h); g.rotate(rnd() * 3); g.fillRect(0, 0, 3 + rnd() * 7, 1.2 + rnd() * 1.8); g.restore(); } });
  // cultivos: [nombre, color, color 2, filas, paso entre plantas (m), paleta de flores]
  const CULT = {
    lechuga: { c: '#86c44c', c2: '#a7d86a', fil: 2, paso: 0.32 }, morada: { c: '#7a3b52', c2: '#9b5a5f', fil: 2, paso: 0.32 },
    acelga: { c: '#2f6b2a', c2: '#3f7f30', fil: 2, paso: 0.4 }, cilantro: { c: '#5fae3a', c2: '#7cc455', fil: 3, paso: 0.2 },
    repollo: { c: '#6f9a86', c2: '#89b39d', fil: 2, paso: 0.5 }, cebolla: { c: '#7fae5a', c2: '#9cc275', fil: 3, paso: 0.16 },
    fresa: { c: '#3d7a35', c2: '#c0392b', fil: 2, paso: 0.3 }, flores: { c: '#a855f7', c2: '#facc15', pal: ['#a855f7', '#facc15', '#f97316', '#f8fafc', '#ec4899', '#60a5fa'], fil: 3, paso: 0.28 }
  };
  const ORDEN = ['lechuga', 'acelga', 'cebolla', 'morada', 'repollo', 'cilantro', 'fresa', 'flores'];
  const texCama = (k) => lienzo(512, 64, (g, w, h) => { const C = CULT[k];
    g.fillStyle = '#4a3527'; g.fillRect(0, 0, w, h); for (let n = 0; n < 1500; n++) { g.fillStyle = `rgba(${30 + rnd() * 40},${20 + rnd() * 25},${12 + rnd() * 15},.55)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    for (let n = 0; n < 300; n++) { g.strokeStyle = `rgba(${190 + rnd() * 40},${160 + rnd() * 30},90,.5)`; g.lineWidth = 1; const x = rnd() * w, y = rnd() * h, a = rnd() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.stroke(); } // paja
    const pas = C.paso / 4 * 512; // la textura cubre 4 m de bancal
    for (let f = 0; f < C.fil; f++) { const y = (f + 0.5) * h / C.fil; for (let x = pas / 2; x < w; x += pas) { const r = Math.min(h / C.fil, pas) * 0.46 * (0.8 + rnd() * 0.35);
      if (C.pal) { g.fillStyle = '#3f7a35'; g.beginPath(); g.ellipse(x, y, r, r, 0, 0, 7); g.fill(); g.fillStyle = C.pal[Math.floor(rnd() * C.pal.length)]; g.beginPath(); g.ellipse(x, y, r * 0.55, r * 0.55, 0, 0, 7); g.fill(); continue; }
      g.fillStyle = rnd() < 0.5 ? C.c : C.c2; g.beginPath(); g.ellipse(x + (rnd() - 0.5) * 2, y, r, r, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(x - r * 0.25, y - r * 0.25, r * 0.35, r * 0.35, 0, 0, 7); g.fill(); } } });
  /* plantas con hojas de verdad: tarjetas con la forma de la hoja en grises (el color lo pone cada instancia) */
  const texHoja = (tipo) => lienzo(256, 256, (g) => { g.clearRect(0, 0, 256, 256);
    const gr = (y0, y1) => { const q = g.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, '#f2f2f2'); q.addColorStop(1, '#9a9a9a'); return q; };
    if (tipo === 'rizada' || tipo === 'lisa') { g.fillStyle = gr(20, 250); g.beginPath();
      for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2, rr = 1 + (tipo === 'rizada' ? 0.09 * Math.sin(a * 22) + 0.05 * Math.sin(a * 9) : 0.02 * Math.sin(a * 5)); g.lineTo(128 + Math.sin(a) * 100 * rr, 140 - Math.cos(a) * 112 * rr); }
      g.fill(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = tipo === 'lisa' ? 9 : 5; g.beginPath(); g.moveTo(128, 254); g.lineTo(128, 36); g.stroke(); g.lineWidth = 2;
      for (let k = 0; k < 7; k++) { const y = 220 - k * 26; g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(160, y - 18, 205, y - 34); g.moveTo(128, y); g.quadraticCurveTo(96, y - 18, 51, y - 34); g.stroke(); } }
    if (tipo === 'fina') { g.fillStyle = '#d8d8d8'; for (let k = 0; k < 9; k++) { const a = -1.2 + k * 0.3, x = 128 + Math.sin(a) * 70, y = 150 - Math.cos(a) * 80; g.beginPath(); g.ellipse(x, y, 26, 18, a, 0, 7); g.fill(); g.strokeStyle = '#bbb'; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 250); g.lineTo(x, y); g.stroke(); } }
    if (tipo === 'tira') { g.fillStyle = gr(0, 256); for (const dx of [-30, 0, 30]) { g.beginPath(); g.moveTo(128 + dx - 9, 256); g.quadraticCurveTo(128 + dx, 120, 128 + dx * 1.6, 4); g.quadraticCurveTo(128 + dx + 4, 120, 128 + dx + 9, 256); g.fill(); } }
    if (tipo === 'trebol') { g.fillStyle = gr(30, 250); for (const a of [-0.9, 0, 0.9]) { g.save(); g.translate(128, 200); g.rotate(a); g.beginPath(); for (let i = 0; i <= 40; i++) { const t2 = i / 40 * Math.PI * 2, rr = 1 + 0.08 * Math.sin(t2 * 14); g.lineTo(Math.sin(t2) * 42 * rr, -95 - Math.cos(t2) * 58 * rr); } g.fill(); g.restore(); }
      g.fillStyle = '#5a5a5a'; for (const [x, y] of [[70, 230], [190, 226], [128, 244]]) { g.beginPath(); g.ellipse(x, y, 16, 20, 0, 0, 7); g.fill(); } }
    if (tipo === 'flor') { g.fillStyle = '#f0f0f0'; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; g.beginPath(); g.ellipse(128 + Math.cos(a) * 62, 128 + Math.sin(a) * 62, 40, 16, a, 0, 7); g.fill(); } g.fillStyle = '#7a7a7a'; g.beginPath(); g.arc(128, 128, 38, 0, 7); g.fill(); }
  }, false);
  const unirUV = (gs) => { const P = [], N = [], U = []; for (const g0 of gs) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); if (g.attributes.uv) U.push(...g.attributes.uv.array); else for (let i = 0; i < g.attributes.position.count; i++) U.push(0.5, 0.5); }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); return G; };
  const roseta = (n, l, a, inc, alto = 0) => unirUV(Array.from({ length: n }, (_, i) => { const p = new THREE.PlaneGeometry(a, l); p.translate(0, l / 2, 0); p.rotateX(-(inc + (i % 2) * 0.18)); p.rotateY(i / n * Math.PI * 2 + (i % 3) * 0.4); p.translate(0, alto, 0); return p; }));
  const GEO = {
    lechuga: roseta(10, 0.17, 0.16, 1.0), morada: roseta(10, 0.16, 0.15, 0.95), repollo: unirUV([roseta(9, 0.2, 0.2, 1.15), new THREE.SphereGeometry(0.1, 10, 8).scale(1, 0.85, 1).translate(0, 0.09, 0)]),
    acelga: roseta(7, 0.32, 0.14, 0.35), cilantro: roseta(8, 0.17, 0.13, 0.55), cebolla: roseta(5, 0.34, 0.06, 0.12), fresa: roseta(6, 0.15, 0.13, 0.85),
    flores: unirUV([roseta(5, 0.18, 0.08, 0.7), new THREE.CylinderGeometry(0.006, 0.008, 0.42, 4).translate(0, 0.21, 0), new THREE.PlaneGeometry(0.11, 0.11).rotateX(-Math.PI / 2).translate(0, 0.43, 0)]),
    girasol: unirUV([roseta(6, 0.3, 0.22, 0.9, 0.5), roseta(4, 0.24, 0.18, 0.8, 1.05), new THREE.CylinderGeometry(0.014, 0.022, 1.7, 5).translate(0, 0.85, 0)])
  };
  const HOJA = { lechuga: 'rizada', morada: 'rizada', repollo: 'lisa', acelga: 'lisa', cilantro: 'fina', cebolla: 'tira', fresa: 'trebol', flores: 'flor', girasol: 'lisa' };
  const TXH = {}; for (const k in HOJA) TXH[HOJA[k]] = TXH[HOJA[k]] || texHoja(HOJA[k]);
  const MATP = {}; for (const k in HOJA) MATP[k] = new THREE.MeshStandardMaterial({ color: '#ffffff', map: TXH[HOJA[k]], alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.72 });

  /* ---------- módulos ---------- */
  const MODS = []; D.huertas.forEach((h, hi) => h.m.forEach((m, mi) => MODS.push({ ...m, hi, pri: mi === 0, n: h.n })));
  const loc = (m, u, v) => { const c = Math.cos(m.a), s = Math.sin(m.a); return [m.c[0] + u * c - v * s, m.c[1] + u * s + v * c]; };
  const o = new THREE.Object3D(), cc = new THREE.Color();
  const pon = (im, i, m, u, v, y, sx = 1, sy = 1, sz = 1, giro = 0) => { const q = loc(m, u, v); o.position.set(q[0], y, q[1]); o.rotation.set(0, -m.a + giro, 0); o.scale.set(sx, sy, sz); o.updateMatrix(); im.setMatrixAt(i, o.matrix); };
  // camas: a lo largo del módulo, dejando 4,5 m en un extremo para compost, agua y caseta
  const CAMAS = []; // {m, u, v, len, k}
  MODS.forEach((m, mi) => { const len = m.l - 6.5, u0 = -2.25; let j = 0;
    for (let v = -m.w / 2 + 1.7; v <= m.w / 2 - 1.6; v += 1.95) CAMAS.push({ m, u: u0, v, len, k: ORDEN[(mi * 3 + j++) % ORDEN.length] }); });
  // piso de viruta: una sola malla con UV en metros
  { const P = [], U = [], I = []; for (const m of MODS) { const b = P.length / 3; for (const [u, v] of [[-m.l / 2, -m.w / 2], [m.l / 2, -m.w / 2], [m.l / 2, m.w / 2], [-m.l / 2, m.w / 2]]) { const q = loc(m, u, v); P.push(q[0], YG, q[1]); U.push(q[0] / 3, q[1] / 3); } I.push(b, b + 2, b + 1, b, b + 3, b + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    const piso = new THREE.Mesh(g, mStd('#ffffff', { map: texViruta, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); piso.receiveShadow = !movil; grupo.add(piso); }
  // bancales: caja de tablas por largo (UV a escala) + tapa de tierra con el cultivo
  const porLargo = {}; for (const c of CAMAS) (porLargo[c.len] = porLargo[c.len] || []).push(c);
  const matTabla = mStd('#ffffff', { map: texTabla, roughness: 0.9 });
  for (const len in porLargo) { const L = +len, lista = porLargo[len];
    const bg = new THREE.BoxGeometry(L, 0.42, 1.2); { const uv = bg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L / 2.4); }
    const caja = new THREE.InstancedMesh(bg, matTabla, lista.length); caja.castShadow = !movil; caja.receiveShadow = !movil;
    lista.forEach((c, i) => pon(caja, i, c.m, c.u, c.v, YG + 0.21)); grupo.add(caja);
    const porK = {}; for (const c of lista) (porK[c.k] = porK[c.k] || []).push(c);
    for (const k in porK) { const tg = new THREE.PlaneGeometry(L - 0.12, 1.06).rotateX(-Math.PI / 2); { const uv = tg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (L - 0.12) / 4); }
      const tapa = new THREE.InstancedMesh(tg, mStd('#ffffff', { map: texCama(k), roughness: 0.95 }), porK[k].length); tapa.receiveShadow = !movil;
      porK[k].forEach((c, i) => pon(tapa, i, c.m, c.u, c.v, YG + 0.4)); grupo.add(tapa); }
  }
  // riego por goteo sobre cada bancal
  { const riego = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 4).rotateZ(Math.PI / 2), mStd('#15181b', { roughness: 0.5 }), CAMAS.length * 2);
    CAMAS.forEach((c, i) => { pon(riego, i * 2, c.m, c.u, c.v - 0.25, YG + 0.43, c.len - 0.2); pon(riego, i * 2 + 1, c.m, c.u, c.v + 0.25, YG + 0.43, c.len - 0.2); }); grupo.add(riego); }
  // cerca baja de madera: postes cada 2,4 m y dos travesaños; entrada en el lado corto de la caseta
  { const POST = [], RIEL = [];
    for (const m of MODS) { const L2 = m.l / 2, W2 = m.w / 2;
      const lado = (u0, v0, u1, v1, puerta) => { const d = Math.hypot(u1 - u0, v1 - v0), n = Math.max(1, Math.round(d / 2.4));
        for (let i = 0; i <= n; i++) { const f = i / n; if (puerta && Math.abs(f - 0.5) < 0.12) continue; POST.push([m, u0 + (u1 - u0) * f, v0 + (v1 - v0) * f]); }
        const ang = Math.atan2(v1 - v0, u1 - u0); if (puerta) { for (const [a, b] of [[0, 0.38], [0.62, 1]]) RIEL.push([m, u0 + (u1 - u0) * (a + b) / 2, v0 + (v1 - v0) * (a + b) / 2, d * (b - a), ang]); }
        else RIEL.push([m, (u0 + u1) / 2, (v0 + v1) / 2, d, ang]); };
      lado(-L2, -W2, L2, -W2); lado(L2, -W2, L2, W2, true); lado(L2, W2, -L2, W2); lado(-L2, W2, -L2, -W2, true); }
    const mPoste = mStd('#6b4f36', { roughness: 0.95 });
    const ip = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 1.0, 0.09).translate(0, 0.5, 0), mPoste, POST.length); POST.forEach((p, i) => pon(ip, i, p[0], p[1], p[2], YG)); ip.castShadow = !movil;
    const ir = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.07, 0.035), mPoste, RIEL.length * 2); RIEL.forEach((r, i) => { const q = loc(r[0], r[1], r[2]); for (const [k, y] of [[0, 0.45], [1, 0.88]]) { o.position.set(q[0], YG + y, q[1]); o.rotation.set(0, -r[0].a - r[4], 0); o.scale.set(r[3], 1, 1); o.updateMatrix(); ir.setMatrixAt(i * 2 + k, o.matrix); } });
    grupo.add(ip, ir); }
  // composteras de listones (3 por módulo), tanque de agua lluvia (IBC) y caseta de herramientas en el módulo principal
  { const comp = MODS.map(m => [0, 1, 2].map(j => [m, m.l / 2 - 1.6, -m.w / 2 + 1.4 + j * 1.35])).flat();
    const tx = lienzo(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); for (let y = 0; y < h; y += 26) { g.fillStyle = `rgb(${120 + rnd() * 30},${88 + rnd() * 16},${56 + rnd() * 10})`; g.fillRect(0, y, w, 18); } });
    const ic = new THREE.InstancedMesh(new THREE.BoxGeometry(1.15, 0.95, 1.15).translate(0, 0.475, 0), mStd('#ffffff', { map: tx, alphaTest: 0.5, side: THREE.DoubleSide }), comp.length);
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.55, 10, 6, 0, 6.29, 0, 1.4).scale(1, 0.55, 1).translate(0, 0.62, 0), mStd('#3a2a1e', { roughness: 1 }), comp.length);
    comp.forEach((p, i) => { pon(ic, i, p[0], p[1], p[2], YG); pon(im, i, p[0], p[1], p[2], YG); }); ic.castShadow = !movil; grupo.add(ic, im);
    const tq = MODS.map(m => [m, m.l / 2 - 1.6, m.w / 2 - 1.3]);
    const it = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 1.0, 1.2).translate(0, 0.62, 0), mStd('#e9ece8', { roughness: 0.45 }), tq.length);
    const ij = new THREE.InstancedMesh(new THREE.BoxGeometry(1.06, 0.12, 1.26).translate(0, 0.06, 0), mStd('#7a5c3e'), tq.length);
    const ik = new THREE.InstancedMesh(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04, 1.04, 1.24)).translate(0, 0.62, 0), new THREE.LineBasicMaterial({ color: '#8d969c' }), tq.length);
    tq.forEach((p, i) => { pon(it, i, p[0], p[1], p[2], YG); pon(ij, i, p[0], p[1], p[2], YG); }); it.castShadow = !movil; grupo.add(it, ij);
    const lk = []; tq.forEach(p => { const q = loc(p[0], p[1], p[2]); lk.push(new THREE.Matrix4().compose(new THREE.Vector3(q[0], YG, q[1]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -p[0].a, 0)), new THREE.Vector3(1, 1, 1))); });
    for (const mtx of lk) { const s = new THREE.LineSegments(ik.geometry, ik.material); s.applyMatrix4(mtx); grupo.add(s); }
    const cs = MODS.filter(m => m.pri && m.l >= 20).map(m => [m, m.l / 2 - 1.7, 0.4]);
    const ica = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 2.1, 2.4).translate(0, 1.05, 0), mStd('#ffffff', { map: texTabla }), cs.length);
    const techo = new THREE.BoxGeometry(2.4, 0.06, 2.9).rotateZ(-0.2).translate(0, 2.32, 0);
    const ite = new THREE.InstancedMesh(techo, mStd('#56615a', { roughness: 0.55, metalness: 0.35 }), cs.length);
    cs.forEach((p, i) => { pon(ica, i, p[0], p[1], p[2], YG); pon(ite, i, p[0], p[1], p[2], YG); }); ica.castShadow = ite.castShadow = !movil; grupo.add(ica, ite);
  }

  /* ---------- plantas: solo cerca de la cámara ---------- */
  const CAP = movil ? 5000 : 18000, ims = {};
  for (const k in GEO) { ims[k] = new THREE.InstancedMesh(GEO[k], MATP[k], Math.round(CAP / (k === 'girasol' ? 6 : 3))); ims[k].count = 0; ims[k].receiveShadow = !movil; ims[k].castShadow = false; ims[k].frustumCulled = false; grupo.add(ims[k]); }
  const GIR = MODS.map(m => ({ m, v: -m.w / 2 + 0.55, len: m.l - 7 })); // borde de girasoles para polinizadores
  let ux = 1e9, uz = 1e9, uy = 0;
  const actualizar = (forzar) => {
    if (!grupo.visible) return;
    const t = T3.orbit ? T3.orbit.target : T3.camera.position, cam = T3.camera.position;
    if (cam.y > 380) { if (ux < 1e8) { for (const k in ims) ims[k].count = 0; ux = 1e9; } return; }
    if (!forzar && Math.hypot(t.x - ux, t.z - uz) < 25 && Math.abs(cam.y - uy) < 40) return; ux = t.x; uz = t.z; uy = cam.y;
    const R = Math.min(200, 70 + cam.y * 0.7), n = {}; for (const k in ims) n[k] = 0;
    const cerca = (m) => Math.hypot(m.c[0] - t.x, m.c[1] - t.z) < R + m.l / 2;
    for (const c of CAMAS) { if (!cerca(c.m)) continue; const C = CULT[c.k], im = ims[c.k], cap = im.instanceMatrix.count, pas = C.paso * (movil ? 1.6 : 1);
      for (let f = 0; f < C.fil; f++) { const dv = (f + 0.5) / C.fil * 1.0 - 0.5;
        for (let s = -c.len / 2 + 0.2; s < c.len / 2 - 0.15 && n[c.k] < cap; s += pas) {
          const h = Math.sin((c.m.c[0] + s) * 12.9898 + (c.m.c[1] + c.v + f) * 78.233) * 43758.5453, r = h - Math.floor(h);
          const q = loc(c.m, c.u + s, c.v + dv + (r - 0.5) * 0.05); o.position.set(q[0], YG + 0.42, q[1]); o.rotation.set(0, r * 6.28, 0); const e = 0.78 + r * 0.5; o.scale.set(e, e * (0.9 + r * 0.2), e); o.updateMatrix(); im.setMatrixAt(n[c.k], o.matrix);
          im.setColorAt(n[c.k], cc.set(C.pal ? C.pal[Math.floor(r * 997) % C.pal.length] : (r < 0.5 ? C.c : C.c2)).multiplyScalar(0.85 + r * 0.3)); n[c.k]++; } } }
    { const im = ims.girasol, cap = im.instanceMatrix.count;
      for (const g of GIR) { if (!cerca(g.m)) continue; for (let s = -g.len / 2 - 2; s < g.len / 2 - 2 && n.girasol < cap; s += movil ? 1.3 : 0.75) {
        const h = Math.sin((g.m.c[0] + s) * 3.7 + g.m.c[1] * 1.3) * 43758.5453, r = h - Math.floor(h), q = loc(g.m, s, g.v + (r - 0.5) * 0.2);
        o.position.set(q[0], YG, q[1]); o.rotation.set(0, -g.m.a + Math.PI + (r - 0.5) * 0.8, 0); const e = 0.85 + r * 0.35; o.scale.set(e, e, e); o.updateMatrix(); im.setMatrixAt(n.girasol, o.matrix); im.setColorAt(n.girasol, cc.set(r < 0.5 ? '#3f7a2c' : '#4a8a32')); n.girasol++; } } }
    for (const k in ims) { ims[k].count = n[k]; ims[k].instanceMatrix.needsUpdate = true; if (ims[k].instanceColor) ims[k].instanceColor.needsUpdate = true; }
  };
  // la flor del girasol: amarilla (la tarjeta 'lisa' se tiñe verde; la cabeza se pinta con un disco aparte)
  { const disco = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.3).rotateX(-0.5).translate(0, 1.74, 0.06), new THREE.MeshStandardMaterial({ color: '#f0bf2a', map: TXH.flor, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7 }), ims.girasol.instanceMatrix.count);
    const centro = new THREE.InstancedMesh(new THREE.SphereGeometry(0.052, 10, 6).scale(1, 1, 0.45).rotateX(-0.5).translate(0, 1.745, 0.065), mStd('#3d2614', { roughness: 0.95 }), ims.girasol.instanceMatrix.count);
    disco.count = centro.count = 0; disco.frustumCulled = centro.frustumCulled = false; grupo.add(disco, centro);
    const base = actualizar; const sinc = () => { const g = ims.girasol; disco.count = centro.count = g.count; for (let i = 0; i < g.count; i++) { g.getMatrixAt(i, o.matrix); disco.setMatrixAt(i, o.matrix); centro.setMatrixAt(i, o.matrix); } disco.instanceMatrix.needsUpdate = centro.instanceMatrix.needsUpdate = true; };
    var actualizarTodo = (f) => { const c0 = ims.girasol.count, u0 = ux; base(f); if (ims.girasol.count !== c0 || ux !== u0) sinc(); }; }
  const timer = setInterval(() => actualizarTodo(false), 400);

  const area = D.area || MODS.reduce((s, m) => s + m.l * m.w, 0);
  return {
    grupo, n: D.huertas.length, area,
    ver(on) { grupo.visible = !!on; if (on) actualizarTodo(true); },
    // polígonos de cada huerta (módulo principal) para la red biótica
    sitios: () => sitiosHuertasBarrio(D),
    quitar() { clearInterval(timer); T3.scene.remove(grupo); }
  };
}
// hábitats «huerta» para la red biótica (solo los parques: los lotes baldíos ya entran por las estrategias)
export function sitiosHuertasBarrio(D) {
  return (D && D.huertas || []).filter(h => h.tipo === 'parque').map(h => { const m = h.m[0], c = Math.cos(m.a), s = Math.sin(m.a);
    return { id: 'E8', n: h.n, poly: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => { const u = a * m.l / 2, v = b * m.w / 2; return [m.c[0] + u * c - v * s, m.c[1] + u * s + v * c]; }),
      cnt: { abeja: 6, lombriz: 3, copeton: 1, mirla: 1, colibri: 1 } }; });
}
