/* ============ ESCENARIO: KENNEDY HOY / CON LA PROPUESTA ============
   Un solo selector arriba al centro (abajo en celular).
   - Hoy: Kennedy como es.
   - Con la propuesta (en revisión): por ahora SOLO un punto por cada lugar de las 5 estrategias, sin polígonos ni redes:
       Bavaria Común · Mercados de abastecimiento (reemplaza Tiendas barriales) · Corabastos · Gestión de residuos ·
       Red de distribución alimentaria.
     Lo de la propuesta anterior (estrategias E1-E9 en polígonos, huertas en techos/balcones/Bavaria, naves retiradas, sintaxis con
     pasajes, camiones a furgonetas, fauna de huertas, carga desplazada e indicadores) queda APAGADO con T3.PROP; el código sigue
     en sus módulos por si se retoma. */
export function iniciarEscenario({ T3, say = () => {} }) {
  const CHOY = '#8fb0c9', CPRO = '#e2a55b';
  // qué de la propuesta anterior se usa (todo apagado mientras se redefine)
  // sintaxis con pasajes, fauna de las huertas (interacciones que fomenta la propuesta) e indicadores hoy vs. propuesta: sí; carga desplazada: no
  T3.PROP = { sintaxis: true, camiones: false, fauna: true, carga: false, comparar: true };
  const LC = { x: 5341.33, y: 3161.9 }, lw = (x, y) => [x - LC.x, LC.y - y]; // marco «modelo» -> mundo
  const css = document.createElement('style');
  css.textContent = `
#esc{position:fixed;z-index:30;top:14px;left:50%;transform:translateX(-50%);width:min(468px,calc(100vw - 640px));min-width:360px;
  font-family:var(--ui-sans,Inter,system-ui,sans-serif);color:var(--ui-tx,#e9ebec);background:linear-gradient(180deg,rgba(22,25,29,.86),rgba(12,14,17,.86));
  border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 18px 40px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05);
  -webkit-backdrop-filter:blur(18px) saturate(1.15);backdrop-filter:blur(18px) saturate(1.15);padding:6px}
#esc .sw{position:relative;display:grid;grid-template-columns:1fr 1fr;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.05);border-radius:11px;padding:3px}
#esc .sw i{position:absolute;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);border-radius:8px;
  background:linear-gradient(180deg,rgba(143,176,201,.24),rgba(143,176,201,.1));box-shadow:inset 0 0 0 1px rgba(143,176,201,.42),inset 0 1px 0 rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.3);
  transition:transform .4s cubic-bezier(.3,.7,.2,1),background .4s,box-shadow .4s}
#esc[data-e="proyecto"] .sw i{transform:translateX(100%);background:linear-gradient(180deg,rgba(226,165,91,.26),rgba(226,165,91,.1));box-shadow:inset 0 0 0 1px rgba(226,165,91,.5),inset 0 1px 0 rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.3)}
#esc .sw button{position:relative;z-index:1;height:46px;border:0;background:none;color:var(--ui-tx2,#9aa2a7);cursor:pointer;padding:0 12px;
  font:500 13px var(--ui-sans,Inter,system-ui,sans-serif);display:flex;align-items:center;justify-content:center;gap:10px;border-radius:8px;text-align:left;transition:color .3s}
#esc .sw button span{display:flex;flex-direction:column;line-height:1.15}
#esc .sw button small{font:400 10px var(--ui-mono,'JetBrains Mono',ui-monospace,monospace);letter-spacing:.04em;color:var(--ui-tx3,#646c71);margin-top:2px;transition:color .3s}
#esc .sw button b{width:8px;height:8px;border-radius:50%;flex:none;opacity:.45;transition:opacity .3s,box-shadow .3s}
#esc .sw button:hover{color:var(--ui-tx,#e9ebec)}
#esc .sw button[aria-pressed="true"]{color:#fff}
#esc .sw button[aria-pressed="true"] small{color:var(--ui-tx2,#b4bbc0)}
#esc .sw button[data-e="hoy"][aria-pressed="true"] b{opacity:1;box-shadow:0 0 0 3px rgba(143,176,201,.22),0 0 10px rgba(143,176,201,.6)}
#esc .sw button[data-e="proyecto"][aria-pressed="true"] b{opacity:1;box-shadow:0 0 0 3px rgba(226,165,91,.22),0 0 10px rgba(226,165,91,.6)}
#esc .sw button:focus-visible{outline:2px solid var(--ui-acc,#e2a55b);outline-offset:1px}
#esc .ley{display:none;flex-wrap:wrap;gap:6px;padding:10px 4px 4px}
#esc[data-e="proyecto"] .ley{display:flex;animation:escIn .35s ease-out}
@keyframes escIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
#esc .ley-h{flex:1 0 100%;display:flex;justify-content:space-between;align-items:baseline;padding:0 4px 2px;font:500 9.5px var(--ui-mono,'JetBrains Mono',monospace);letter-spacing:.16em;text-transform:uppercase;color:var(--ui-tx3,#646c71)}
#esc .ley-h small{font:400 10px var(--ui-sans,Inter,sans-serif);letter-spacing:0;text-transform:none}
#esc .ley span{display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 11px 0 9px;border-radius:14px;cursor:pointer;white-space:nowrap;
  font:500 11px var(--ui-sans,Inter,sans-serif);color:var(--ui-tx2,#a3abb0);background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);transition:background .2s,border-color .2s,color .2s,opacity .2s}
#esc .ley span:hover{color:var(--ui-tx,#e9ebec);border-color:color-mix(in srgb,var(--c) 45%,transparent);background:color-mix(in srgb,var(--c) 8%,transparent)}
#esc .ley i{width:7px;height:7px;border-radius:50%;background:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 22%,transparent)}.esc-pt{position:fixed;z-index:6;left:0;top:0;pointer-events:none;display:none;align-items:center;gap:6px;transform:translate(-5px,-5px);
  font:500 11px var(--ui-sans,Inter,system-ui,sans-serif);color:#f4f5f6;text-shadow:0 1px 3px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.6);white-space:nowrap}
.esc-pt i{width:10px;height:10px;border-radius:50%;border:2px solid #fff;flex:none;box-shadow:0 1px 4px rgba(0,0,0,.6)}
.esc-pt.chico span{display:none}
.esc-pt.col i{width:9px;height:9px;border-width:1.5px;animation:escCol 2.4s ease-out infinite}
.esc-pt.col span{display:none}.esc-pt.col.cerca span{display:inline}
@keyframes escCol{0%{box-shadow:0 0 0 0 rgba(232,121,249,.75),0 1px 4px rgba(0,0,0,.6)}70%{box-shadow:0 0 0 9px rgba(232,121,249,0),0 1px 4px rgba(0,0,0,.6)}100%{box-shadow:0 0 0 0 rgba(232,121,249,0),0 1px 4px rgba(0,0,0,.6)}}
body.esc-solo-col #hid-red{display:none!important}
#esc .ley span.off{opacity:.42}
#esc .ley span.on{color:#fff;background:color-mix(in srgb,var(--c) 18%,transparent);border-color:color-mix(in srgb,var(--c) 65%,transparent);box-shadow:0 0 14px color-mix(in srgb,var(--c) 25%,transparent)}
#esc .ley span:focus-visible{outline:2px solid var(--ui-acc,#e2a55b);outline-offset:2px}
#esc .ley em{font-style:normal;font:500 10px var(--ui-mono,'JetBrains Mono',ui-monospace,monospace);color:var(--ui-tx3,#8e979d);padding:1px 5px;border-radius:6px;background:rgba(255,255,255,.06)}
@property --escAng{syntax:'<angle>';inherits:false;initial-value:0deg}
#esc{--escC:#8fb0c9;isolation:isolate}
#esc[data-e="proyecto"]{--escC:#e2a55b}
#esc::before{content:'';position:absolute;inset:-1px;border-radius:17px;padding:1px;pointer-events:none;z-index:2;
  background:conic-gradient(from var(--escAng),transparent 0 62%,color-mix(in srgb,var(--escC) 90%,#fff) 78%,transparent 92%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:escGira 6s linear infinite;opacity:.85}
@keyframes escGira{to{--escAng:360deg}}
#esc::after{content:'';position:absolute;inset:0;border-radius:16px;pointer-events:none;z-index:3;opacity:0;
  background:linear-gradient(105deg,transparent 35%,color-mix(in srgb,var(--escC) 30%,transparent) 48%,rgba(255,255,255,.14) 50%,transparent 62%);background-size:250% 100%}
#esc.barre::after{animation:escBarre .9s cubic-bezier(.3,.7,.2,1)}
@keyframes escBarre{0%{opacity:1;background-position:120% 0}100%{opacity:0;background-position:-40% 0}}
#esc .cab{display:flex;justify-content:space-between;align-items:center;padding:3px 8px 7px;font:500 9.5px var(--ui-mono,'JetBrains Mono',monospace);letter-spacing:.16em;text-transform:uppercase;color:var(--ui-tx3,#646c71)}
#esc .cab .st{display:inline-flex;align-items:center;gap:7px;letter-spacing:.08em;color:var(--escC);transition:color .4s}
#esc .cab .st i{width:6px;height:6px;border-radius:50%;background:var(--escC);box-shadow:0 0 8px var(--escC);animation:escLate 1.8s ease-in-out infinite}
@keyframes escLate{50%{opacity:.35}}
#esc .sw button kbd{margin-left:auto;font:500 9.5px var(--ui-mono,'JetBrains Mono',monospace);color:var(--ui-tx3,#646c71);padding:2px 5px;border-radius:4px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04)}
#esc .sw button[aria-pressed="true"] kbd{color:var(--escC);border-color:color-mix(in srgb,var(--escC) 50%,transparent)}
#esc .sw button:active{transform:scale(.98)}
#esc .ley span:hover{transform:translateY(-1px);box-shadow:0 6px 16px color-mix(in srgb,var(--c) 22%,transparent)}
#esc .ley span:hover i{box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 30%,transparent),0 0 10px var(--c)}
@media(max-width:760px){#esc .sw button kbd{display:none}#esc .cab{padding:2px 6px 5px}}
@media(prefers-reduced-motion:reduce){#esc::before,#esc .cab .st i{animation:none}#esc.barre::after{animation:none}}
/* la propuesta anterior no se ofrece mientras se redefine: botón y lista de estrategias del panel, y la Visión */
body .gs-est, body .gs-sub:has(+ .gs-est), body #gs-cv-b, body #vi-btn{display:none!important}
body .gs-fila:has(> #gs-cv-b){grid-template-columns:1fr!important}
@media(max-width:1100px){#esc{width:min(468px,calc(100vw - 32px));min-width:0;top:auto;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 70px)}}
@media(max-width:760px){#esc{min-width:0;width:calc(100vw - 16px);padding:5px;border-radius:14px}#esc .sw button{height:42px;font-size:12.5px;gap:8px;padding:0 8px}#esc .sw button small{font-size:9.5px}#esc .ley{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding:8px 2px 2px;-webkit-mask:linear-gradient(90deg,#000 88%,transparent)}#esc .ley::-webkit-scrollbar{display:none}#esc .ley-h{display:none}#esc .ley span{flex:none;height:30px}
  body.tb-abierto #esc,body.gs-abierto #esc{display:none} /* con el panel de simulación abierto en celular, el selector no lo tapa */
  body #hid-red{bottom:calc(max(12px,env(safe-area-inset-bottom)) + 196px)!important}}
@media(min-width:761px) and (max-width:1100px){body #hid-red{bottom:calc(max(12px,env(safe-area-inset-bottom)) + 180px)!important}}
@media(prefers-reduced-motion:reduce){#esc .sw i{transition:none}#esc[data-e="proyecto"] .ley{animation:none}.esc-pt.col i{animation:none}}`;
  document.head.appendChild(css);
  const el = document.createElement('section'); el.id = 'esc'; el.setAttribute('aria-label', 'Escenario del territorio'); el.dataset.e = 'hoy';
  el.innerHTML = `<div class="cab"><span>Escenario</span><span class="st"><i></i><em id="esc-st" style="font-style:normal">Kennedy hoy</em></span></div><div class="sw" role="group" aria-label="Escenario"><i aria-hidden="true"></i>
      <button type="button" data-e="hoy" aria-pressed="true"><b style="background:${CHOY}"></b><span>Kennedy hoy<small>el territorio actual</small></span><kbd>H</kbd></button>
      <button type="button" data-e="proyecto" aria-pressed="false"><b style="background:${CPRO}"></b><span>Con la propuesta<small>las 5 estrategias</small></span><kbd>P</kbd></button></div>
    <div class="ley" id="esc-ley"></div>`;
  document.body.appendChild(el);

  /* ---------- las 5 estrategias: un punto en cada lugar ---------- */
  const EST5 = [
    { id: 'bav', n: 'Bavaria Común', c: '#ef4444' },
    { id: 'mer', n: 'Mercados de abastecimiento', c: '#38bdf8' },
    { id: 'cor', n: 'Corabastos', c: '#f59e0b' },
    { id: 'res', n: 'Gestión de residuos', c: '#a78bfa' },
    { id: 'red', n: 'Red de distribución alimentaria', c: '#4ade80' },
    { id: 'col', n: 'Colegios', c: '#e879f9' } // solo se prenden al escogerlos en la leyenda
  ];
  $ley().innerHTML = `<div class="ley-h">Estrategias<small>toca una para verla sola</small></div>` + EST5.map(s => `<span data-s="${s.id}" title="Ver solo ${s.n}" style="--c:${s.c}"><i></i>${s.n}${s.id === 'col' ? ' <em id="esc-ncol"></em>' : ''}</span>`).join('');
  function $ley() { return el.querySelector('#esc-ley'); }
  const PUNTOS = []; // { s, x, z, d (div), vis }
  let solo = null; // estrategia escogida en la leyenda (solo esa se prende)
  /* ---------- edificios de los colegios resaltados: un volumen de luz que envuelve cada edificio (0,7 m más grande) con aristas brillantes ---------- */
  let COLE = null, GCOL = null; const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  function armarColegios() {
    const THREE = T3.THREE, P = [], I = [], L = [];
    for (const c of COLE) for (const e of c.ed || []) {
      let W = e.p; if (W.length > 3 && W[0][0] === W[W.length - 1][0] && W[0][1] === W[W.length - 1][1]) W = W.slice(0, -1);
      const n = W.length; if (n < 3) continue;
      let cx = 0, cz = 0; for (const q of W) { cx += q[0]; cz += q[1]; } cx /= n; cz /= n;
      W = W.map(q => { const dx = q[0] - cx, dz = q[1] - cz, d = Math.hypot(dx, dz) || 1; return [q[0] + dx / d * 0.7, q[1] + dz / d * 0.7]; });
      const y0 = 0.2, y1 = Math.max(3, e.h) + 0.7, b = P.length / 3;
      for (const q of W) P.push(q[0], y0, q[1]); for (const q of W) P.push(q[0], y1, q[1]);
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; I.push(b + i, b + j, b + n + i, b + j, b + n + j, b + n + i);
        L.push(W[i][0], y1, W[i][1], W[j][0], y1, W[j][1], W[i][0], y0, W[i][1], W[i][0], y1, W[i][1]); }
      let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(W.map(q => new THREE.Vector2(q[0], q[1])), []); } catch (er) {}
      for (const t of tri) I.push(b + n + t[0], b + n + t[1], b + n + t[2]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
    const mv = new THREE.MeshBasicMaterial({ color: '#e879f9', transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    const ml = new THREE.LineBasicMaterial({ color: '#fbe7ff', transparent: true, opacity: 0.95, toneMapped: false });
    GCOL = new THREE.Group(); GCOL.name = 'colegios_resaltados'; const m = new THREE.Mesh(g, mv), li = new THREE.LineSegments(gl, ml);
    m.renderOrder = 8; li.renderOrder = 9; GCOL.add(m, li); GCOL.userData = { mv, ml }; GCOL.visible = false; T3.scene.add(GCOL);
  }
  /* ---------- Bavaria Común: al escogerla se abre el distrito (data3d/bavaria_distrito.js) ---------- */
  let DIST = null, pDist = null;
  addEventListener('bav-cerrar', () => { const sp = $ley().querySelector('[data-s="bav"]'); if (solo === 'bav' && sp) sp.click(); }); // la × del panel vuelve a todas las estrategias
  function distritoBavaria() {
    const on = T3.escenario === 'proyecto' && solo === 'bav';
    if (on && !DIST && !pDist) pDist = Promise.all([import('./bavaria_distrito.js?v=11'), cj('data3d/bavaria.json?v=3'), cj('data3d/bavaria_arboles.json?v=3').then(j => j.arboles.filter(q => q[4] === 1)).catch(() => []), cj('data3d/bavaria_distrito_sx.json?v=1').catch(() => null)])
      .then(([m, D, ARB, SX]) => { DIST = m.crearDistritoBavaria({ T3, lw, D, ARB, SX }); /* ARB: bosque denso (las huertas no lo tocan) */ window.KEN_BAV = DIST; distritoBavaria(); }).catch(e => console.warn('distrito Bavaria:', e));
    if (DIST) DIST.ver(on);
  }
  /* ---------- red de colegios: enlaces entre colegios, parques-huerta de dos pisos y visitas a Bavaria Común (data3d/colegios_red.js) ---------- */
  let RED = null, pRed = null, redOn = false;
  addEventListener('col-cerrar', () => { const sp = $ley().querySelector('[data-s="col"]'); if (solo === 'col' && sp) sp.click(); });
  function redColegios() {
    const on = T3.escenario === 'proyecto' && solo === 'col';
    if (on && !RED && !pRed) pRed = import('./colegios_red.js?v=2').then(m => { RED = m.crearRedColegios({ T3, lw, COLE }); window.KEN_RED = RED; redColegios(); }).catch(e => console.warn('red de colegios:', e));
    if (RED) { RED.ver(on); if (on && !redOn) Promise.resolve(RED.listo).then(() => { if (RED.on) RED.general(); }); } // vista de toda la red cuando llegan los datos
    redOn = on;
  }
  function resaltarColegios() {
    distritoBavaria(); redColegios();
    const on = T3.escenario === 'proyecto' && solo === 'col' && !!COLE;
    if (on && !GCOL) armarColegios();
    if (GCOL) GCOL.visible = on;
  }
  const cj = (u) => (window.cargarJSON ? window.cargarJSON(u) : fetch(u).then(r => r.json()));
  /* ---------- Av. Ciudad de Cali: con la propuesta baja su tráfico (data3d/alivio_cali.js); el conteo corre también en «hoy» ---------- */
  let CALI = null;
  Promise.all([import('./alivio_cali.js?v=1'), cj('data3d/alivio_cali.json?v=1')]).then(([m, D]) => { CALI = m.crearAlivioCali({ T3, D }); window.KEN_CALI = CALI; CALI.ver(T3.escenario === 'proyecto' && !solo); }).catch(e => console.warn('Av. Ciudad de Cali:', e));
  const centro = (P) => [P.reduce((a, p) => a + p[0], 0) / P.length, P.reduce((a, p) => a + p[1], 0) / P.length];
  const poner = (sid, x, z, n) => { const s = EST5.find(q => q.id === sid), d = document.createElement('div'); d.className = 'esc-pt';
    d.innerHTML = `<i style="background:${s.c}"></i><span>${n === undefined ? s.n : n}</span>`; if (sid === 'col') d.classList.add('col'); document.body.appendChild(d); PUNTOS.push({ s, x, z, d, vis: solo ? sid === solo : sid !== 'col' }); };
  Promise.all([
    cj('data3d/bavaria.json?v=3').then(B => { const c = centro(B.sitio), w = lw(c[0], c[1]); poner('bav', w[0], w[1]); }).catch(() => {}),
    cj('data3d/corabastos.json').then(C => { const c = centro(C.poly), w = lw(c[0], c[1]); poner('cor', w[0], w[1]); }).catch(() => {}),
    // mercados de abastecimiento: los 8 lugares de mercado de barrio ya definidos (data3d/carga.json)
    fetch('data3d/carga.json?v=1').then(r => r.json()).then(K => K.mercados.forEach((m, i) => { const w = lw(m.p[0], m.p[1]); poner('mer', w[0], w[1], i ? '' : undefined); })).catch(() => {}),
    // gestión de residuos (lugar de E4, distrito biotecnológico) y red de distribución alimentaria (centro de la red E8 de huertas)
    // colegios de Kennedy (OpenStreetMap, tools/colegios_build.py): ya vienen en el marco del mundo
    // solo los que tienen edificio levantado en el 3D; cada uno trae las huellas y alturas de sus edificios (c.ed)
    cj('data3d/colegios.json?v=2').then(C => { COLE = C.colegios; C.colegios.forEach(c => poner('col', c.c[0], c.c[1], c.n)); const ne = el.querySelector('#esc-ncol'); if (ne) ne.textContent = C.colegios.length; resaltarColegios(); }).catch(() => {}),
    new Promise(r => { const mira = (k) => { const E = T3.EST; if (E && E.lugar) { const a = E.lugar('E4'), b = E.lugar('E8'); if (a) poner('res', a.c[0], a.c[1]); if (b) poner('red', b.c[0], b.c[1]); r(); } else if (k < 40) setTimeout(() => mira(k + 1), 500); else r(); }; mira(0); })
  ]).then(() => { PUNTOS.forEach(p => { if (!p.d.querySelector('span').textContent) p.d.classList.add('chico'); }); });
  // los puntos se dibujan en pantalla (siempre del mismo tamaño), sobre la posición 3D a 2 m del suelo
  let raf = 0; const V = new T3.THREE.Vector3();
  function cuadro() {
    raf = requestAnimationFrame(cuadro); const cam = T3.camera, W = innerWidth, H = innerHeight;
    const cp = cam.position;
    if (GCOL && GCOL.visible && !RMQ.matches) GCOL.userData.mv.opacity = 0.34 + 0.14 * Math.sin(performance.now() / 420); // los colegios «respiran»
    for (const p of PUNTOS) { if (!p.vis) { if (p.d.style.display !== 'none') p.d.style.display = 'none'; continue; }
      if (p.s.id === 'col') p.d.classList.toggle('cerca', Math.hypot(cp.x - p.x, cp.y, cp.z - p.z) < 1600); // el nombre del colegio solo de cerca
      V.set(p.x, 2 + (T3.alzaVia ? T3.alzaVia(p.x, p.z) : 0), p.z).project(cam);
      const ok = V.z < 1 && Math.abs(V.x) < 1.05 && Math.abs(V.y) < 1.05; p.d.style.display = ok ? 'flex' : 'none';
      if (ok) p.d.style.transform = `translate(${((V.x + 1) / 2 * W - 5).toFixed(1)}px,${((1 - V.y) / 2 * H - 5).toFixed(1)}px)`; }
  }
  function verPuntos(on) { cancelAnimationFrame(raf); if (on) cuadro(); else PUNTOS.forEach(p => { p.d.style.display = 'none'; }); }
  // tocar una estrategia de la leyenda: se prende SOLO esa y la cámara va a sus puntos; tocarla otra vez vuelve a mostrar todas.
  // Los colegios no se muestran con todas (son más de cien): solo cuando se escogen.
  function filtrar() {
    PUNTOS.forEach(p => { p.vis = solo ? p.s.id === solo : p.s.id !== 'col'; });
    document.body.classList.toggle('esc-solo-col', solo === 'col'); // sin huertas no se muestra el panel de polinización
    resaltarColegios();
    $ley().querySelectorAll('[data-s]').forEach(sp => { sp.classList.toggle('on', sp.dataset.s === solo); sp.classList.toggle('off', !!solo && sp.dataset.s !== solo); sp.setAttribute('aria-pressed', String(sp.dataset.s === solo)); });
  }
  T3.escSolo = () => solo;
  $ley().addEventListener('click', (ev) => { const sp = ev.target.closest('[data-s]'); if (!sp) return;
    solo = solo === sp.dataset.s ? null : sp.dataset.s; filtrar(); limpiarAnterior();
    if (solo === 'col') say(`Colegios de Kennedy: ${PUNTOS.filter(p => p.s.id === 'col').length} (OpenStreetMap)`, 3000);
    const L = PUNTOS.filter(p => p.vis); if (!L.length || !T3.orbit || solo === 'bav' || solo === 'col') return; // Bavaria y colegios: la cámara la mueve su módulo
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of L) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, s = Math.min(4200, Math.max(500, (x1 - x0) * 0.75, (z1 - z0) * 0.75)), o = T3.orbit, THREE = T3.THREE;
    const p0 = T3.camera.position.clone(), t0 = o.target.clone(), p1 = new THREE.Vector3(cx + s * 0.35, s * 0.8, cz + s * 0.6), t1 = new THREE.Vector3(cx, 0, cz), ini = performance.now();
    const vuela = () => { const k = Math.min(1, (performance.now() - ini) / 1400), e2 = k * k * (3 - 2 * k); T3.camera.position.lerpVectors(p0, p1, e2); o.target.lerpVectors(t0, t1, e2); o.update(); if (k < 1) requestAnimationFrame(vuela); };
    vuela(); });
  $ley().querySelectorAll('[data-s]').forEach(sp => { sp.setAttribute('role', 'button'); sp.setAttribute('tabindex', '0'); sp.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sp.click(); } }); });
  filtrar();
  /* ---------- apagar lo de la propuesta anterior; las HUERTAS (techos, balcones y Bavaria) sí van con la propuesta ---------- */
  function limpiarAnterior() {
    const pro = T3.escenario === 'proyecto', hu = pro && solo !== 'col'; // con «solo colegios» se apagan las huertas
    const b = document.getElementById('gs-cv-b'); if (b && b.classList.contains('on')) b.click(); // estrategias E1-E9 (polígonos, conexiones, red de huertas)
    const EST = T3.EST; if (EST && EST.hidroponia) EST.hidroponia(hu); T3.conHidro = hu && !!EST; // huertas hidropónicas en techos y balcones con sus polinizadores
    if (T3.huertas && T3.huertas.grupo) T3.huertas.grupo.visible = hu && !EST; // camas de tierra en terrazas solo si no hay hidroponía
    if (T3.torres && T3.torres.huertas) T3.torres.huertas(hu);
    const bv = T3.bavaria; if (bv && bv.userData && bv.userData.mallasHuerta) bv.userData.mallasHuerta.forEach(m => { m.visible = hu && solo !== 'bav'; }); // con el distrito, su campo experimental reemplaza las parcelas
    const co = T3.scene && T3.scene.getObjectByName('corabastos'); if (co && co.userData.quitadas) co.userData.quitadas.visible = true;
    if (T3.bio && T3.bio.ESTADO) T3.bio.ESTADO.escenario = pro && T3.PROP.fauna ? 'proyecto' : 'hoy'; // fauna e interacciones de las huertas
    if (T3.sintaxisEscenario) T3.sintaxisEscenario();
    if (CALI) CALI.ver(pro && !solo); // Av. Ciudad de Cali con menos tráfico (se oculta al mirar una sola estrategia)
  }
  function aplicar(e) {
    T3.escenario = e; el.dataset.e = e; const st = el.querySelector('#esc-st'); if (st) st.textContent = e === 'proyecto' ? 'Con la propuesta' : 'Kennedy hoy';
    el.querySelectorAll('.sw button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.e === e)));
    limpiarAnterior(); verPuntos(e === 'proyecto'); resaltarColegios();
    const re = document.getElementById('ruido-esc'); if (re) re.textContent = nombre();
    window.dispatchEvent(new CustomEvent('escenario', { detail: e }));
  }
  const nombre = () => T3.escenario === 'proyecto' ? 'CON LA PROPUESTA' : 'KENNEDY HOY';
  function cambiar(e) { if (e === T3.escenario) return; el.classList.remove('barre'); void el.offsetWidth; el.classList.add('barre'); aplicar(e); say(e === 'proyecto' ? 'Con la propuesta: las 5 estrategias' : 'Kennedy hoy: el territorio como es', 3000); }
  el.querySelectorAll('.sw button').forEach(b => b.onclick = () => cambiar(b.dataset.e));
  addEventListener('keydown', (ev) => { if (ev.ctrlKey || ev.metaKey || ev.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName || '')) return; const k = ev.key.toLowerCase(); if (k === 'h') cambiar('hoy'); else if (k === 'p') cambiar('proyecto'); }); // atajos: H = hoy, P = propuesta
  window.KEN_ESC = { poner: cambiar, nombre, get e() { return T3.escenario; } };
  // arranque en «hoy»; los módulos que terminan de cargar después se vuelven a apagar
  aplicar('hoy');
  let n = 0; const rep = setInterval(() => { n++; limpiarAnterior(); if (n >= 8) clearInterval(rep); }, 2500);
  return window.KEN_ESC;
}
