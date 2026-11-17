/* ============ ESCENA DE HUERTAS DE BAVARIA COMÚN, EN PUNTOS (vista amplia, recorrible) ============
   Una escena propia, inspirada en los referentes del grupo: hileras largas de cultivos con un sendero de madera al centro,
   un pabellón paramétrico (cubierta ondulada de costillas sobre un volumen de vidrio), un invernadero de vidrio con cerchas
   de acero y muchos árboles (los modelos 3D reales del simulador: jacarandá, árboles de isla y árbol pequeño).
   Todo se convierte en PUNTOS con color: los árboles y plantas se muestrean sobre sus mallas con el color de su textura
   (MeshSurfaceSampler + uv), y la luz se hornea en el color (sol bajo de la tarde + cielo).
   Marco: el ojo está en (0, 1,6, 0) y mira hacia +z; y = 0 es el suelo. Devuelve los anclajes de cada especie (sobre su planta). */
export async function crearEscenaHuerta({ THREE, MOV = false, progreso = () => {} }) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
  const { MeshSurfaceSampler } = await import('three/addons/math/MeshSurfaceSampler.js');
  const K = MOV ? 0.38 : 1; // densidad
  let sem = 11; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647), r2 = (a, b) => a + rnd() * (b - a);
  const P = [], C = []; const SOL = new THREE.Vector3(-0.55, 0.62, -0.56).normalize();
  const luz = (c, n, ao = 1) => { const d = n ? Math.max(0, n.dot(SOL)) : 0.6; const k = (0.62 + 0.85 * d) * ao; return [c[0] * k + 0.03, c[1] * k + 0.04, c[2] * k + 0.05]; };
  const pt = (x, y, z, c) => { P.push(x, y, z); C.push(c[0], c[1], c[2]); };
  const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  const mezcla = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const UP = new THREE.Vector3(0, 1, 0);

  /* ---------- modelos reales (árboles y plantas): nube local de cada uno con el color de su textura ---------- */
  const carg = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const texPix = new Map();
  const leerTex = (tx) => { if (!tx || !tx.image) return null; if (texPix.has(tx)) return texPix.get(tx); const im = tx.image, w = Math.min(512, im.width || 0), h = Math.min(512, im.height || 0); if (!w) return null;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.drawImage(im, 0, 0, w, h); const o = { w, h, d: g.getImageData(0, 0, w, h).data }; texPix.set(tx, o); return o; };
  async function nube(urls, n, altoObj) {
    const pts = [], cols = [], nor = []; const escenas = await Promise.all(urls.map(u => carg.loadAsync('data3d/models/' + u + '.glb').catch(() => null)));
    const mallas = []; for (const s of escenas) if (s) { s.scene.updateMatrixWorld(true); s.scene.traverse(o => { if (o.isMesh) mallas.push(o); }); }
    if (!mallas.length) return null;
    const area = mallas.map(m => { const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry; let a = 0; const p = g.attributes.position, A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(); for (let i = 0; i < p.count; i += 3) { A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i + 1); Cc.fromBufferAttribute(p, i + 2); a += B.sub(A).cross(Cc.sub(A)).length() / 2; } return a; });
    const tot = area.reduce((a, b) => a + b, 0) || 1;
    const v = new THREE.Vector3(), nn = new THREE.Vector3(), uv = new THREE.Vector2(), col = new THREE.Color(), dummy = new THREE.Color();
    mallas.forEach((m, i) => {
      const cuantos = Math.round(n * area[i] / tot); if (!cuantos) return;
      const geo = m.geometry.clone(); geo.applyMatrix4(m.matrixWorld); if (!geo.attributes.normal) geo.computeVertexNormals();
      const sm = new MeshSurfaceSampler(new THREE.Mesh(geo)).build(), mat = [].concat(m.material)[0] || {}, tp = leerTex(mat.map), base = mat.color ? [mat.color.r, mat.color.g, mat.color.b] : [0.5, 0.5, 0.5];
      for (let k = 0, tries = 0; k < cuantos && tries < cuantos * 3; tries++) {
        sm.sample(v, nn, dummy, uv); let c = base;
        if (tp && geo.attributes.uv) { const x = Math.floor(((uv.x % 1) + 1) % 1 * tp.w), y = Math.floor((1 - (((uv.y % 1) + 1) % 1)) * tp.h), j = (y * tp.w + x) * 4; if (tp.d[j + 3] < 110) continue;
          col.setRGB(tp.d[j] / 255, tp.d[j + 1] / 255, tp.d[j + 2] / 255, THREE.SRGBColorSpace); c = [col.r * base[0], col.g * base[1], col.b * base[2]]; }
        pts.push(v.x, v.y, v.z); cols.push(c[0], c[1], c[2]); nor.push(nn.x, nn.y, nn.z); k++;
      }
    });
    // normalizar: base en y = 0, centrado, altura 1
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < pts.length; i += 3) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); z0 = Math.min(z0, pts[i + 2]); z1 = Math.max(z1, pts[i + 2]); }
    const h = (y1 - y0) || 1, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; for (let i = 0; i < pts.length; i += 3) { pts[i] = (pts[i] - cx) / h * altoObj; pts[i + 1] = (pts[i + 1] - y0) / h * altoObj; pts[i + 2] = (pts[i + 2] - cz) / h * altoObj; }
    return { pts, cols, nor };
  }
  const poner = (N, x, z, esc, rot, tinte = null) => { if (!N) return; const cs = Math.cos(rot), sn = Math.sin(rot), n = new THREE.Vector3();
    for (let i = 0; i < N.pts.length; i += 3) { const px = N.pts[i] * esc, py = N.pts[i + 1] * esc, pz = N.pts[i + 2] * esc; n.set(N.nor[i], N.nor[i + 1], N.nor[i + 2]);
      let c = [N.cols[i], N.cols[i + 1], N.cols[i + 2]]; if (tinte) c = mezcla(c, tinte, 0.18); { const m = (c[0] + c[1] + c[2]) / 3; c = [m + (c[0] - m) * 1.5, m + (c[1] - m) * 1.5, m + (c[2] - m) * 1.5]; } /* más saturado */ const ao = 0.55 + 0.45 * Math.min(1, py / (esc * 0.6 + 0.01));
      pt(x + px * cs - pz * sn, py, z + px * sn + pz * cs, luz(c, n, ao)); } };
  progreso(0.05);
  const AR = await Promise.all([
    nube(['jacaranda_L0_madera', 'jacaranda_L0_hojas'], 60000 * K, 1),
    nube(['island_tree_01_L0_madera', 'island_tree_01_L0_hojas'], 55000 * K, 1),
    nube(['island_tree_02_L0_madera', 'island_tree_02_L0_hojas'], 55000 * K, 1),
    nube(['arbolpeq_L0_madera', 'arbolpeq_L0_hojas'], 45000 * K, 1)]);
  const PL = await Promise.all(['fern_02', 'calathea_orbifolia_01', 'nettle_plant', 'periwinkle_plant', 'celandine_01'].map(u => nube([u], 900, 1)));
  progreso(0.35);

  /* ---------- suelo: pasto con matas y tierra entre hileras ---------- */
  const PASTO = [hex('#4f7a32'), hex('#6b8f3c'), hex('#3d6a2c'), hex('#7d9a4a')], TIERRA = [hex('#5a4030'), hex('#6b4c37'), hex('#4a3426')];
  const nG = Math.round(700000 * K);
  for (let i = 0; i < nG; i++) { const cerca = i % 3 === 0, x = cerca ? r2(-18, 18) : r2(-95, 95), z = cerca ? r2(-4, 20) : r2(-6, 150); const enCult = Math.abs(x) > 2.2 && Math.abs(x) < 42 && z > 4 && z < 62; if (enCult) continue;
    const enCamino = Math.abs(x) < 1.6 && z < 70; const c = enCamino ? null : PASTO[(rnd() * 4) | 0]; if (enCamino) continue;
    pt(x, rnd() * 0.06, z, luz(mezcla(c, [0.75, 0.8, 0.55], rnd() * 0.2), UP, 0.85 + rnd() * 0.25)); }
  // sendero de madera (tablas de 14 cm con junta)
  const MAD = hex('#a07a55');
  for (let z = 1.2; z < 70; z += (z < 20 ? 0.02 : 0.04) / K) for (let x = -1.2; x <= 1.2; x += 0.06 / K) { const tabla = Math.floor((z + 100) / 0.15) % 2, junta = ((z + 100) % 0.15) < 0.012; const c = mezcla(MAD, [0.3, 0.22, 0.15], junta ? 0.6 : tabla * 0.08 + rnd() * 0.08); pt(x + r2(-0.02, 0.02), 0.12, z, luz(c, UP)); }
  progreso(0.45);

  /* ---------- hileras de cultivos a lado y lado (como el referente 4) ---------- */
  const CULT = [
    { k: 'lechuga', h: 0.24, r: 0.17, c: ['#7fbf4d', '#9ccf5d', '#6aa843'] }, { k: 'morada', h: 0.24, r: 0.17, c: ['#6d2f4b', '#8b3d5e', '#53304a'] },
    { k: 'kale', h: 0.5, r: 0.24, c: ['#4f7a6b', '#5d8a78', '#3e6657'] }, { k: 'lavanda', h: 0.55, r: 0.28, c: ['#8b6fc4', '#a58ad8', '#6d5aa6'], tallo: '#6f8b5c' },
    { k: 'acelga', h: 0.4, r: 0.2, c: ['#2f6b2a', '#3f7f30', '#c0392b'] }, { k: 'alcachofa', h: 0.9, r: 0.38, c: ['#7f9f9a', '#94b3ac', '#6b8b86'] },
    { k: 'cebolla', h: 0.45, r: 0.08, c: ['#8fb46a', '#a3c37c', '#7aa55a'] }, { k: 'repollo', h: 0.3, r: 0.22, c: ['#7aa39a', '#93b8ad', '#5f8a80'] }];
  const FILAS = [];
  for (const lado of [-1, 1]) for (let f = 0; f < 44; f++) { const x = lado * (2.6 + f * 0.9), ku = CULT[(f * 3 + (lado > 0 ? 5 : 0)) % CULT.length]; FILAS.push({ x, ku }); if (Math.abs(x) > 19 && Math.abs(x) < 25) continue;
    // camellón de tierra
    for (let z = 4; z < 62; z += (Math.abs(x) < 14 && z < 25 ? 0.03 : 0.07) / K) for (let w = -0.28; w <= 0.28; w += 0.09) pt(x + w + r2(-0.03, 0.03), 0.06 + (0.08 - Math.abs(w) * 0.25), z + r2(-0.03, 0.03), luz(TIERRA[(rnd() * 3) | 0], UP, 0.8));
    // plantas: matas de hojas con la forma de su cultivo
    const paso = Math.max(0.22, ku.r * 1.5) / Math.sqrt(K);
    for (let z = 4.2; z < 61.8; z += paso * r2(0.85, 1.15)) { const cx = x + r2(-0.05, 0.05), hh = ku.h * r2(0.8, 1.2), nP = Math.round((ku.k === 'cebolla' ? 30 : 60 + ku.r * 260) * K * (Math.abs(x) < 14 && z < 25 ? 4 : 1.2)) + 6;
      for (let i = 0; i < nP; i++) {
        if (ku.k === 'cebolla') { const t = rnd(), a = r2(0, 6.28); pt(cx + Math.cos(a) * 0.03 * (1 + t), t * hh, z + Math.sin(a) * 0.03 * (1 + t), luz(hex(ku.c[(rnd() * 3) | 0]), new THREE.Vector3(Math.cos(a), 0.3, Math.sin(a)).normalize(), 0.6 + t * 0.4)); continue; }
        if (ku.k === 'lavanda') { const a = r2(0, 6.28), t = Math.sqrt(rnd()), rr = ku.r * t; const top = rnd() < 0.55; const y = top ? hh * r2(0.75, 1.05) : hh * r2(0.05, 0.7) * (1 - t * 0.4);
          pt(cx + Math.cos(a) * rr, y, z + Math.sin(a) * rr, luz(hex(top ? ku.c[(rnd() * 3) | 0] : ku.tallo), new THREE.Vector3(Math.cos(a), 0.6, Math.sin(a)).normalize(), 0.65 + 0.35 * (y / hh))); continue; }
        // hojas: puntos en una semiesfera con capas (la parte de afuera más clara)
        const a = r2(0, 6.28), e = Math.acos(r2(0.05, 1)), rr = ku.r * r2(0.45, 1), n = new THREE.Vector3(Math.sin(e) * Math.cos(a), Math.cos(e), Math.sin(e) * Math.sin(a));
        let c = hex(ku.c[(rnd() * 3) | 0]); if (ku.k === 'acelga' && rnd() < 0.25) c = hex('#c0392b'); if (ku.k === 'alcachofa' && rnd() < 0.05 && n.y > 0.7) c = hex('#6f8f5a');
        pt(cx + n.x * rr, 0.12 + n.y * hh * r2(0.7, 1.05), z + n.z * rr, luz(c, n, 0.55 + 0.45 * n.y));
      }
      if (ku.k === 'alcachofa' && rnd() < 0.35) { const yb = hh * 1.15; for (let i = 0; i < 70 * K + 10; i++) { const a = r2(0, 6.28), e = r2(0, 1.4); pt(cx + Math.sin(e) * Math.cos(a) * 0.07, yb + Math.cos(e) * 0.09, z + Math.sin(e) * Math.sin(a) * 0.07, luz(hex(rnd() < 0.3 ? '#7a5aa0' : '#7f9f9a'), UP)); } }
    }
  }
  progreso(0.6);

  /* ---------- plantas de borde (modelos escaneados) a lo largo del sendero ---------- */
  for (let z = 3; z < 66; z += 1.7) for (const lado of [-1, 1]) { const N = PL[(Math.floor(z * 3) + (lado > 0 ? 2 : 0)) % PL.length]; poner(N, lado * r2(1.45, 1.75), z + r2(-0.3, 0.3), r2(0.45, 0.8), r2(0, 6.28)); }

  /* ---------- árboles: muchos, alrededor del campo y al fondo ---------- */
  const ARB = [];
  const arbol = (x, z, alto) => { const N = AR[(rnd() * AR.length) | 0]; poner(N, x, z, alto, r2(0, 6.28)); ARB.push([x, z, alto]); };
  for (let z = 2; z < 72; z += r2(5, 7)) { arbol(r2(-48, -44), z, r2(8, 12)); arbol(r2(44, 48), z, r2(8, 12)); }     // alamedas al borde de las hileras
  for (let z = 6; z < 60; z += r2(9, 13)) { arbol(r2(-24, -20), z, r2(6, 9)); arbol(r2(20, 24), z, r2(6, 9)); }        // árboles de sombra dentro del campo
  for (let z = 8; z < 70; z += r2(7, 10)) { arbol(r2(-62, -54), z, r2(10, 15)); arbol(r2(54, 62), z, r2(10, 15)); }
  for (let i = 0; i < 26; i++) arbol(r2(-90, 90), r2(92, 135), r2(10, 17));                                         // bosque detrás del pabellón
  for (let i = 0; i < 10; i++) { const s = rnd() < 0.5 ? -1 : 1; arbol(s * r2(62, 92), r2(-4, 80), r2(10, 16)); }
  arbol(-7, 66.5, 7.5); arbol(8, 67.5, 8); // dos árboles junto a la entrada del pabellón
  progreso(0.75);

  /* ---------- pabellón paramétrico (referentes 1 y 4): volumen de vidrio bajo y cubierta ondulada de costillas ---------- */
  const BL = [0.94, 0.95, 0.93], VID = [0.62, 0.74, 0.78], ACERO = [0.82, 0.84, 0.86];
  const Z0 = 74, Z1 = 86, X0 = -34, X1 = 34;
  const techo = (x, z) => 5.2 + 0.9 * Math.sin(x * 0.18) * Math.cos(z * 0.35) + 0.6 * Math.sin(x * 0.07 + 1.3);
  // vidrio: fachada sur con montantes cada 1,5 m; adentro se ven reflejos y plantas
  for (let x = X0; x <= X1; x += 0.05 / K) for (let y = 0; y < 4.3; y += 0.07 / K) { if (rnd() < 0.55) continue; const mont = ((x + 100) % 1.5) < 0.06;
    pt(x, y, Z0, luz(mont ? BL : mezcla(VID, [0.9, 0.95, 1], y / 4.3 * 0.5 + rnd() * 0.1), new THREE.Vector3(0, 0, -1), mont ? 1 : 0.9)); }
  for (const x of [X0, X1]) for (let z = Z0; z <= Z1; z += 0.08 / K) for (let y = 0; y < 4.3; y += 0.08 / K) if (rnd() < 0.5) pt(x, y, z, luz(VID, new THREE.Vector3(Math.sign(x), 0, 0)));
  // plantas adentro (jardín interior)
  for (let i = 0; i < 18; i++) poner(PL[i % PL.length], r2(X0 + 2, X1 - 2), r2(Z0 + 2, Z1 - 1), r2(0.8, 1.4), r2(0, 6.28));
  // cubierta: costillas curvas cada 1,2 m que siguen la superficie ondulada, voladizo hacia el campo
  for (let x = X0 - 3; x <= X1 + 3; x += 1.2) for (let z = Z0 - 5; z <= Z1 + 2; z += 0.035 / K) { const y = techo(x, z); pt(x, y, z, luz(BL, UP)); pt(x, y - 0.25, z, luz(mezcla(BL, [0.5, 0.5, 0.5], 0.3), new THREE.Vector3(0, -1, 0))); }
  for (let z = Z0 - 5; z <= Z1 + 2; z += 2.4) for (let x = X0 - 3; x <= X1 + 3; x += 0.05 / K) pt(x, techo(x, z) - 0.12, z, luz(ACERO, UP));
  // óculos con jardineras (como el atrio del referente 1) y techo verde
  for (const [ox, oz] of [[-16, 80], [0, 79], [16, 81]]) for (let i = 0; i < 1400 * K; i++) { const a = r2(0, 6.28), rr = r2(2.2, 3.4); const x = ox + Math.cos(a) * rr, z = oz + Math.sin(a) * rr * 0.7; pt(x, techo(x, z) + r2(0.05, 0.6), z, luz(hex(rnd() < 0.15 ? '#c25b8a' : PASTO[(rnd() * 4) | 0]), UP)); }
  // columnas inclinadas en V
  for (let x = X0; x <= X1; x += 6) for (const s of [-1, 1]) for (let t = 0; t <= 1; t += 0.01 / K) { const z = Z0 - 3.5, y = t * techo(x, z); pt(x + s * t * 1.2, y, z + r2(-0.04, 0.04), luz(BL, new THREE.Vector3(0, 0, -1))); }
  progreso(0.85);

  /* ---------- invernadero de vidrio con cerchas de acero (referente 3) ---------- */
  const GX0 = 40, GX1 = 62, GZ0 = 64, GZ1 = 84, GH = 4.2;
  const caballete = (x) => GH + 2.2 * (1 - Math.abs((x - (GX0 + GX1) / 2) / ((GX1 - GX0) / 2)));
  for (let z = GZ0; z <= GZ1; z += 2) { for (let x = GX0; x <= GX1; x += 0.04 / K) pt(x, caballete(x), z, luz(ACERO, UP)); for (let y = 0; y <= GH; y += 0.04 / K) { pt(GX0, y, z, luz(ACERO, null)); pt(GX1, y, z, luz(ACERO, null)); }
    for (let k = 0; k < 6; k++) { const xa = GX0 + k * (GX1 - GX0) / 6, xb = xa + (GX1 - GX0) / 6; for (let t = 0; t <= 1; t += 0.03 / K) pt(xa + (xb - xa) * t, GH + (k % 2 ? 1 - t : t) * 0.9, z, luz(ACERO, null)); } }
  for (let x = GX0; x <= GX1; x += 0.08 / K) for (let z = GZ0; z <= GZ1; z += 0.09 / K) if (rnd() < 0.45) pt(x, caballete(x) + 0.02, z, luz(mezcla(VID, [1, 1, 1], 0.35), UP, 0.95));
  for (let z = GZ0; z <= GZ1; z += 0.08 / K) for (let y = 0; y < GH; y += 0.1 / K) if (rnd() < 0.4) pt(GX0, y, z, luz(VID, new THREE.Vector3(-1, 0, 0)));
  for (let x = GX0 + 2; x < GX1 - 1; x += 3.2) for (let z = GZ0 + 1.5; z < GZ1 - 1; z += 0.25) { for (let y = 0; y < 0.8; y += 0.08) pt(x, y, z, luz(BL, null)); poner(PL[(Math.floor(x + z)) % PL.length], x, z, 0.45, r2(0, 6.28)); }

  /* ---------- fondo: torres de la ciudad, apenas insinuadas ---------- */
  for (const [x, z, w, h] of [[-75, 230, 14, 34], [-40, 245, 12, 44], [38, 235, 16, 38], [76, 225, 12, 30]]) for (let i = 0; i < 3500 * K; i++) { const f = rnd() < 0.5; const x2 = x + (f ? r2(-w / 2, w / 2) : (rnd() < 0.5 ? -w / 2 : w / 2)), y = r2(0, h); pt(x2, y, z - (f ? w / 2 : r2(-w / 2, w / 2)), luz([0.68, 0.7, 0.74], new THREE.Vector3(0, 0, -1), 0.8)); }
  progreso(0.95);

  /* ---------- anclajes de las especies (sobre su planta, cerca del ojo) ---------- */
  const fila = (k, lado) => FILAS.filter(f => f.ku.k === k && Math.sign(f.x) === lado).sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[0];
  const A = (k, lado, z, dy) => { const f = fila(k, lado) || FILAS[0]; return [f.x, (f.ku.h || 0.3) + dy, z]; };
  const ANC = {
    cilantro: A('lavanda', 1, 9, 0.05), lechuga: A('lechuga', -1, 7, 0), tomate: A('alcachofa', 1, 13, 0.1), acelga: A('kale', -1, 11, 0), zanahoria: A('acelga', 1, 6, 0),
    eucalipto: ARB.length ? [ARB[0][0], ARB[0][2] * 0.75, ARB[0][1]] : [-50, 9, 10]
  };
  ANC.copeton = [0.6, 0.13, 6.5]; ANC.mirla = [-0.5, 0.13, 9]; ANC.lombriz = [ANC.zanahoria[0] - 0.1, 0.1, 5.4];
  ANC.abeja = ANC.cilantro; ANC.mariposa = ANC.cilantro; ANC.colibri = ANC.cilantro; ANC.abejorro = ANC.tomate; ANC.mariquita = ANC.lechuga; ANC.murcielago = [ANC.eucalipto[0] + 2, ANC.eucalipto[1], ANC.eucalipto[2]];
  progreso(1);
  return { pos: new Float32Array(P), col: new Float32Array(C), anc: ANC, n: P.length / 3 };
}
