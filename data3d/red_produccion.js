/* ============ RED DE PRODUCCIÓN ALIMENTARIA (estrategia «red», solo con la propuesta) ============
   Una red DISTRIBUIDA con clústeres de barrio. Por qué se conectan:
   1. Techo -> huerta de parque más cercana: los techos productivos (cubiertas en altura y casas) llevan ahí su compost y su
      cosecha para el mercado del barrio, y reciben plántulas del semillero de la huerta.
   2. Huerta -> nodo del clúster: las huertas vecinas comparten un nodo (la huerta más central del clúster): banco de semillas,
      herramientas, compost maduro y punto de cosecha para el mercado de barrio.
   3. Nodo -> Bavaria Común: semillas certificadas y bioinsumos del hub de biotecnología, formación en el instituto y datos de
      sensores (suelo, riego, polinizadores) al gemelo digital. Bavaria es el centro de conocimiento de la red, no su centro de acopio.
   Datos: huertas_barrio.json (parques y lotes), estrategias.json (E8: techos), bavaria.json (edificios del conocimiento). */
export async function crearRedProduccion({ T3, lw, cj }) {
  const THREE = T3.THREE, MOV = matchMedia('(pointer:coarse)').matches, RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const [HB, ES, BV] = await Promise.all([cj('data3d/huertas_barrio.json?v=2'), cj('data3d/estrategias.json?v=5'), cj('data3d/bavaria.json?v=3')]);
  const grupo = new THREE.Group(); grupo.name = 'red_produccion'; grupo.visible = false; T3.scene.add(grupo);
  const PAL = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f']; // Tableau 10 (convencional)
  const Y = (T3.sueloY != null ? T3.sueloY : 0.35);

  /* ---------- nodos ---------- */
  const HU = HB.huertas.map(h => ({ n: h.n, tipo: h.tipo, c: h.c || h.m[0].c }));
  const e8 = ES.estrategias.find(e => e.id === 'E8'), esc = ES.escala || 0.5;
  const cen = (fl) => { let x = 0, y = 0, n = fl.length >> 1; for (let k = 0; k < n; k++) { x += fl[k * 2]; y += fl[k * 2 + 1]; } return lw(x / n * esc, y / n * esc); };
  const TE = [];
  for (const c of e8.capas) { if (/bald/i.test(c.n)) continue; const alto = /altura/i.test(c.n); c.lotes.forEach((l, i) => { if (!alto && MOV && i % 2) return; TE.push({ c: cen(l), y: alto ? 24 : 9, alto }); }); }
  const BC = (i) => { const p = BV.edif[i].p; let x = 0, y = 0; for (const q of p) { x += q[0]; y += q[1]; } return lw(x / p.length, y / p.length); };
  const BAV = [{ n: 'Hub de biotecnología', d: 'semillas y bioinsumos', c: BC(0) }, { n: 'Instituto de enseñanza', d: 'formación', c: BC(3) }, { n: 'Centro de datos', d: 'datos de sensores', c: BC(4) }];

  /* ---------- clústeres: k-medias sobre las huertas (semilla: puntos más alejados) ---------- */
  const K = Math.min(8, Math.max(3, Math.round(HU.length / 7)));
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const C = [HU[0].c.slice()]; while (C.length < K) { let m = null, md = -1; for (const h of HU) { const d = Math.min(...C.map(c => d2(c, h.c))); if (d > md) { md = d; m = h; } } C.push(m.c.slice()); }
  for (let it = 0; it < 25; it++) { const S = C.map(() => [0, 0, 0]); for (const h of HU) { let b = 0; C.forEach((c, k) => { if (d2(c, h.c) < d2(C[b], h.c)) b = k; }); h.k = b; S[b][0] += h.c[0]; S[b][1] += h.c[1]; S[b][2]++; } S.forEach((s, k) => { if (s[2]) C[k] = [s[0] / s[2], s[1] / s[2]]; }); }
  const CL = C.map((c, k) => { const m = HU.filter(h => h.k === k); if (!m.length) return null; const hub = m.reduce((a, h) => d2(h.c, c) < d2(a.c, c) ? h : a, m[0]); hub.hub = true;
    const nom = (hub.n.replace(/^Huerta (efímera )?(del parque |en )?/i, '').split(',')[0] || 'Barrio').replace(/^Urbanización /i, ''); return { k, c, hub, m, nom, col: PAL[k % PAL.length], te: 0, r: 0 }; }).filter(Boolean);
  const near = (p) => { let b = HU[0], bd = 1e18; for (const h of HU) { const d = d2(h.c, p); if (d < bd) { bd = d; b = h; } } return b; };
  for (const t of TE) { t.h = near(t.c); CL.find(q => q.k === t.h.k).te++; }
  for (const q of CL) q.r = Math.sqrt(Math.max(...q.m.map(h => d2(h.c, q.c)), ...TE.filter(t => t.h.k === q.k).map(t => d2(t.c, q.c)), 1)) + 90; for (const q of CL) q.r = Math.min(q.r, 650);

  /* ---------- dibujo ---------- */
  const col = new THREE.Color();
  // halos de clúster: disco suave en el suelo
  const matHalo = (c) => new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color(c) } }, transparent: true, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uC; varying vec2 vU; void main(){ float d=length(vU-.5)*2.; float a=smoothstep(1.,.6,d)*.07+smoothstep(.025,0.,abs(d-.975))*.6; gl_FragColor=vec4(uC,a);\n#include <colorspace_fragment>\n}' });
  for (const q of CL) { const m = new THREE.Mesh(new THREE.CircleGeometry(q.r, 64).rotateX(-Math.PI / 2), matHalo(q.col)); m.position.set(q.c[0], Y + 0.6, q.c[1]); m.renderOrder = 3; grupo.add(m); }
  // líneas: techo -> huerta (finas), huerta -> nodo (medias), nodo -> Bavaria (arcos altos)
  const curva = (a, b, ya, yb, alto) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L = Math.hypot(b[0] - a[0], b[1] - a[1]); return new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0], ya, a[1]), new THREE.Vector3(m[0], Math.max(ya, yb) + (alto ? L * 0.22 : L * 0.08 + 4), m[1]), new THREE.Vector3(b[0], yb, b[1])); };
  const capa = (lista, op) => { const P = [], Cc = []; for (const [cv, c] of lista) { const pts = cv.getPoints(16); for (let i = 1; i < pts.length; i++) { P.push(pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, pts[i].x, pts[i].y, pts[i].z); col.set(c); Cc.push(col.r, col.g, col.b, col.r, col.g, col.b); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: op, depthWrite: false, toneMapped: false })); l.renderOrder = 9; grupo.add(l); return l; };
  const CLc = (k) => CL.find(q => q.k === k).col;
  const L1 = TE.filter(t => d2(t.c, t.h.c) < 900 * 900).map(t => [curva(t.c, t.h.c, t.y, Y + 2, false), CLc(t.h.k)]);
  const L2 = HU.filter(h => !h.hub).map(h => { const q = CL.find(x => x.k === h.k); return [curva(h.c, q.hub.c, Y + 2, Y + 3, false), q.col]; });
  const L3 = []; for (const q of CL) for (const b of BAV) L3.push([curva(q.hub.c, b.c, Y + 3, 26, true), q.col]);
  capa(L1, 0.45); capa(L2, 0.85); const l3 = capa(L3, 0.6);
  // nodos: techos (puntos), huertas (discos), nodos de clúster (anillo grande), Bavaria (faro)
  const pt = (lista, tam, op) => { const P = [], Cc = []; for (const [p, y, c] of lista) { P.push(p[0], y, p[1]); col.set(c); Cc.push(col.r, col.g, col.b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ size: tam, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: op, depthWrite: false, toneMapped: false })); m.renderOrder = 10; grupo.add(m); return m; };
  pt(TE.map(t => [t.c, t.y, CLc(t.h.k)]), MOV ? 3 : 4, 0.9);
  pt(HU.map(h => [h.c, Y + 2.5, CLc(h.k)]), MOV ? 7 : 9, 1);
  pt(CL.map(q => [q.hub.c, Y + 3.5, '#ffffff']), MOV ? 11 : 14, 0.95);
  pt(BAV.map(b => [b.c, 26, '#ffffff']), MOV ? 12 : 16, 1);
  // flujo animado sobre los arcos a Bavaria (conocimiento que va y viene)
  const NP = L3.length * 3, gp = new THREE.BufferGeometry(), PP = new Float32Array(NP * 3), PC = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) { col.set(L3[i % L3.length][1]); PC.set([col.r, col.g, col.b], i * 3); }
  gp.setAttribute('position', new THREE.BufferAttribute(PP, 3)); gp.setAttribute('color', new THREE.BufferAttribute(PC, 3));
  const flujo = new THREE.Points(gp, new THREE.PointsMaterial({ size: MOV ? 4 : 5, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false })); flujo.renderOrder = 11; grupo.add(flujo);
  const V = new THREE.Vector3();
  const animar = () => { if (!grupo.visible) return; const t = RMQ.matches ? 0.5 : performance.now() / 6000; for (let i = 0; i < NP; i++) { const cv = L3[i % L3.length][0], f = (t + Math.floor(i / L3.length) / 3 + (i % 7) * 0.031) % 1; cv.getPoint(i % 2 ? f : 1 - f, V); PP[i * 3] = V.x; PP[i * 3 + 1] = V.y; PP[i * 3 + 2] = V.z; } gp.attributes.position.needsUpdate = true; };
  let raf = 0; const loop = () => { animar(); raf = grupo.visible ? requestAnimationFrame(loop) : 0; };

  /* ---------- etiquetas de los clústeres y explicación ---------- */
  const st = document.createElement('style');
  st.textContent = `.rp-et{position:fixed;left:0;top:0;z-index:5;pointer-events:none;transform:translate(-50%,-100%);font:500 11px/1.25 var(--ui-sans,Inter,system-ui,sans-serif);color:#eef1f2;padding:5px 8px;border-radius:9px;background:var(--ui-glass,rgba(14,16,20,.6));border:1px solid var(--ui-glass-bd,rgba(255,255,255,.16));backdrop-filter:blur(14px) saturate(1.6);-webkit-backdrop-filter:blur(14px) saturate(1.6);white-space:nowrap;display:none}
.rp-et i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:1px}.rp-et small{display:block;color:#aeb6bb;font-weight:400;font-size:10px;margin-top:1px}
#rp-ley{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:6;width:min(560px,calc(100vw - 32px));box-sizing:border-box;padding:12px 14px;border-radius:16px;background:var(--ui-glass,rgba(14,16,20,.6));border:1px solid var(--ui-glass-bd,rgba(255,255,255,.16));box-shadow:var(--ui-glass-sh,none);backdrop-filter:blur(26px) saturate(1.9);-webkit-backdrop-filter:blur(26px) saturate(1.9);color:#e9ecee;font:400 11.5px/1.45 var(--ui-sans,Inter,system-ui,sans-serif);display:none}
#rp-ley h4{margin:0 0 2px;font-weight:600;font-size:13px;letter-spacing:.01em}#rp-ley p{margin:0 0 8px;color:#b9c1c6}#rp-ley ol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
#rp-ley li{padding:8px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}#rp-ley li b{display:block;font-weight:600;font-size:11.5px;margin-bottom:2px}#rp-ley li span{color:#aeb6bb;font-size:10.5px}
#rp-ley .ln{display:block;height:2px;border-radius:2px;margin-bottom:6px;background:#cfd6da}#rp-ley .ln.f{opacity:.45}#rp-ley .ln.a{background:repeating-linear-gradient(90deg,#fff 0 6px,transparent 6px 10px)}
@media (max-width:640px){#rp-ley{bottom:78px;padding:10px}#rp-ley ol{grid-template-columns:1fr;gap:5px}#rp-ley li{padding:6px 8px}#rp-ley p{display:none}}`;
  document.head.appendChild(st);
  const ET = CL.map(q => { const d = document.createElement('div'); d.className = 'rp-et'; d.innerHTML = `<i style="background:${q.col}"></i>Clúster ${q.nom}<small>${q.m.length} huertas · ${q.te} techos</small>`; document.body.appendChild(d); return { q, d }; });
  const EB = document.createElement('div'); EB.className = 'rp-et'; EB.innerHTML = `<i style="background:#fff"></i>Bavaria Común<small>conocimiento: semillas, formación y datos</small>`; document.body.appendChild(EB);
  const ley = document.createElement('div'); ley.id = 'rp-ley';
  ley.innerHTML = `<h4>Red de producción alimentaria</h4><p>${HU.length} huertas en parques y lotes y ${TE.length.toLocaleString('es-CO')} techos productivos, agrupados en ${CL.length} clústeres de barrio. Cada color es un clúster.</p>
<ol><li><i class="ln f"></i><b>Techo → huerta de parque</b><span>Lleva compost y cosecha; recibe plántulas del semillero.</span></li>
<li><i class="ln"></i><b>Huerta → nodo del clúster</b><span>Banco de semillas, herramientas y compost compartidos; acopio para el mercado del barrio.</span></li>
<li><i class="ln a"></i><b>Nodo → Bavaria Común</b><span>Semillas y bioinsumos, formación y datos de sensores.</span></li></ol>`;
  document.body.appendChild(ley);
  let rafE = 0; const P2 = new THREE.Vector3();
  const etiquetas = () => { const cam = T3.camera, W = innerWidth, H = innerHeight; const pon = (d, x, y, z) => { P2.set(x, y, z).project(cam); const ok = P2.z < 1 && Math.abs(P2.x) < 1 && Math.abs(P2.y) < 1; d.style.display = ok ? 'block' : 'none'; if (ok) d.style.transform = `translate(${((P2.x + 1) / 2 * W).toFixed(1)}px,${((1 - P2.y) / 2 * H).toFixed(1)}px) translate(-50%,-115%)`; };
    for (const e of ET) pon(e.d, e.q.hub.c[0], Y + 8, e.q.hub.c[1]); const b = BAV[0].c; pon(EB, b[0], 40, b[1]); rafE = requestAnimationFrame(etiquetas); };

  // vista de toda la red
  const volar = () => { if (!T3.orbit) return; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of HU.map(h => h.c).concat(BAV.map(b => b.c))) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, s = Math.max(x1 - x0, z1 - z0), o = T3.orbit, p0 = T3.camera.position.clone(), t0 = o.target.clone(), p1 = new THREE.Vector3(cx, Math.min(2350, s * 0.62), cz + Math.min(950, s * 0.25)), t1 = new THREE.Vector3(cx, 0, cz + s * 0.06), ini = performance.now();
    const f = () => { const k = Math.min(1, (performance.now() - ini) / 1500), e = k * k * (3 - 2 * k); T3.camera.position.lerpVectors(p0, p1, e); o.target.lerpVectors(t0, t1, e); o.update(); if (k < 1) requestAnimationFrame(f); }; f(); };

  return {
    clusters: CL.length, huertas: HU.length, techos: TE.length,
    ver(on) { on = !!on; if (on === grupo.visible) return; grupo.visible = on; ley.style.display = on ? 'block' : 'none';
      cancelAnimationFrame(rafE); if (on) { etiquetas(); volar(); if (!raf) loop(); } else { ET.forEach(e => { e.d.style.display = 'none'; }); EB.style.display = 'none'; } }
  };
}
