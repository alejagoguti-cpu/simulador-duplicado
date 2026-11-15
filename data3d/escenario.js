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
  T3.PROP = { sintaxis: false, camiones: false, fauna: false, carga: false, comparar: false };
  const LC = { x: 5341.33, y: 3161.9 }, lw = (x, y) => [x - LC.x, LC.y - y]; // marco «modelo» -> mundo
  const css = document.createElement('style');
  css.textContent = `
#esc{position:fixed;z-index:30;top:14px;left:50%;transform:translateX(-50%);width:min(380px,calc(100vw - 600px));min-width:300px;
  font-family:var(--ui-sans,Inter,system-ui,sans-serif);color:var(--ui-tx,#e9ebec);background:var(--ui-bg,rgba(13,15,18,.74));
  border:1px solid var(--ui-bd,rgba(255,255,255,.075));border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.28);
  -webkit-backdrop-filter:blur(16px) saturate(1.1);backdrop-filter:blur(16px) saturate(1.1);padding:5px}
#esc .sw{position:relative;display:grid;grid-template-columns:1fr 1fr;background:rgba(255,255,255,.03);border-radius:8px;padding:2px}
#esc .sw i{position:absolute;top:2px;bottom:2px;left:2px;width:calc(50% - 2px);border-radius:7px;background:rgba(143,176,201,.16);
  border:1px solid rgba(143,176,201,.45);transition:transform .35s cubic-bezier(.3,.7,.2,1),background .35s,border-color .35s}
#esc[data-e="proyecto"] .sw i{transform:translateX(100%);background:rgba(226,165,91,.15);border-color:rgba(226,165,91,.5)}
#esc .sw button{position:relative;z-index:1;height:34px;border:0;background:none;color:var(--ui-tx2,#9aa2a7);cursor:pointer;
  font:500 12.5px var(--ui-sans,Inter,system-ui,sans-serif);display:flex;align-items:center;justify-content:center;gap:8px;border-radius:7px}
#esc .sw button b{width:7px;height:7px;border-radius:50%;display:inline-block;opacity:.55}
#esc .sw button[aria-pressed="true"]{color:var(--ui-tx,#e9ebec)}
#esc .sw button[aria-pressed="true"] b{opacity:1}
#esc .sw button:focus-visible{outline:2px solid var(--ui-acc,#e2a55b);outline-offset:1px}
#esc .ley{display:none;flex-wrap:wrap;gap:4px 12px;padding:7px 6px 3px;font-size:11px;color:var(--ui-tx2,#9aa2a7)}
#esc[data-e="proyecto"] .ley{display:flex}
#esc .ley span{display:inline-flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap}
#esc .ley span:hover{color:var(--ui-tx,#e9ebec)}
#esc .ley i{width:8px;height:8px;border-radius:50%;box-shadow:0 0 0 2px rgba(0,0,0,.35)}
.esc-pt{position:fixed;z-index:6;left:0;top:0;pointer-events:none;display:none;align-items:center;gap:6px;transform:translate(-5px,-5px);
  font:500 11px var(--ui-sans,Inter,system-ui,sans-serif);color:#f4f5f6;text-shadow:0 1px 3px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.6);white-space:nowrap}
.esc-pt i{width:10px;height:10px;border-radius:50%;border:2px solid #fff;flex:none;box-shadow:0 1px 4px rgba(0,0,0,.6)}
.esc-pt.chico span{display:none}
/* la propuesta anterior no se ofrece mientras se redefine: botón y lista de estrategias del panel, y la Visión */
body .gs-est, body .gs-sub:has(+ .gs-est), body #gs-cv-b, body #vi-btn{display:none!important}
body .gs-fila:has(> #gs-cv-b){grid-template-columns:1fr!important}
@media(max-width:1100px){#esc{width:min(380px,calc(100vw - 32px));top:auto;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 70px)}}
@media(max-width:760px){#esc{min-width:0;width:calc(100vw - 16px);padding:4px}#esc .sw button{height:36px;font-size:12px}#esc .ley{font-size:10.5px;gap:4px 10px}
  body.tb-abierto #esc{display:none}
  body #hid-red{bottom:calc(max(12px,env(safe-area-inset-bottom)) + 196px)!important}}
@media(min-width:761px) and (max-width:1100px){body #hid-red{bottom:calc(max(12px,env(safe-area-inset-bottom)) + 180px)!important}}
@media(prefers-reduced-motion:reduce){#esc .sw i{transition:none}}`;
  document.head.appendChild(css);
  const el = document.createElement('section'); el.id = 'esc'; el.setAttribute('aria-label', 'Escenario del territorio'); el.dataset.e = 'hoy';
  el.innerHTML = `<div class="sw" role="group" aria-label="Escenario"><i aria-hidden="true"></i>
      <button type="button" data-e="hoy" aria-pressed="true"><b style="background:${CHOY}"></b>Kennedy hoy</button>
      <button type="button" data-e="proyecto" aria-pressed="false"><b style="background:${CPRO}"></b>Con la propuesta</button></div>
    <div class="ley" id="esc-ley"></div>`;
  document.body.appendChild(el);

  /* ---------- las 5 estrategias: un punto en cada lugar ---------- */
  const EST5 = [
    { id: 'bav', n: 'Bavaria Común', c: '#ef4444' },
    { id: 'mer', n: 'Mercados de abastecimiento', c: '#38bdf8' },
    { id: 'cor', n: 'Corabastos', c: '#f59e0b' },
    { id: 'res', n: 'Gestión de residuos', c: '#a78bfa' },
    { id: 'red', n: 'Red de distribución alimentaria', c: '#4ade80' }
  ];
  $ley().innerHTML = EST5.map(s => `<span data-s="${s.id}" title="Ir a ${s.n}"><i style="background:${s.c}"></i>${s.n}</span>`).join('');
  function $ley() { return el.querySelector('#esc-ley'); }
  const PUNTOS = []; // { s, x, z, n, d (div) }
  const cj = (u) => (window.cargarJSON ? window.cargarJSON(u) : fetch(u).then(r => r.json()));
  const centro = (P) => [P.reduce((a, p) => a + p[0], 0) / P.length, P.reduce((a, p) => a + p[1], 0) / P.length];
  const poner = (sid, x, z, n) => { const s = EST5.find(q => q.id === sid), d = document.createElement('div'); d.className = 'esc-pt';
    d.innerHTML = `<i style="background:${s.c}"></i><span>${n === undefined ? s.n : n}</span>`; document.body.appendChild(d); PUNTOS.push({ s, x, z, d }); };
  Promise.all([
    cj('data3d/bavaria.json?v=3').then(B => { const c = centro(B.sitio), w = lw(c[0], c[1]); poner('bav', w[0], w[1]); }).catch(() => {}),
    cj('data3d/corabastos.json').then(C => { const c = centro(C.poly), w = lw(c[0], c[1]); poner('cor', w[0], w[1]); }).catch(() => {}),
    // mercados de abastecimiento: los 8 lugares de mercado de barrio ya definidos (data3d/carga.json)
    fetch('data3d/carga.json?v=1').then(r => r.json()).then(K => K.mercados.forEach((m, i) => { const w = lw(m.p[0], m.p[1]); poner('mer', w[0], w[1], i ? '' : undefined); })).catch(() => {}),
    // gestión de residuos (lugar de E4, distrito biotecnológico) y red de distribución alimentaria (centro de la red E8 de huertas)
    new Promise(r => { const mira = (k) => { const E = T3.EST; if (E && E.lugar) { const a = E.lugar('E4'), b = E.lugar('E8'); if (a) poner('res', a.c[0], a.c[1]); if (b) poner('red', b.c[0], b.c[1]); r(); } else if (k < 40) setTimeout(() => mira(k + 1), 500); else r(); }; mira(0); })
  ]).then(() => { PUNTOS.forEach(p => { if (!p.d.querySelector('span').textContent) p.d.classList.add('chico'); }); });
  // los puntos se dibujan en pantalla (siempre del mismo tamaño), sobre la posición 3D a 2 m del suelo
  let raf = 0; const V = new T3.THREE.Vector3();
  function cuadro() {
    raf = requestAnimationFrame(cuadro); const cam = T3.camera, W = innerWidth, H = innerHeight;
    for (const p of PUNTOS) { V.set(p.x, 2 + (T3.alzaVia ? T3.alzaVia(p.x, p.z) : 0), p.z).project(cam);
      const ok = V.z < 1 && Math.abs(V.x) < 1.05 && Math.abs(V.y) < 1.05; p.d.style.display = ok ? 'flex' : 'none';
      if (ok) p.d.style.transform = `translate(${((V.x + 1) / 2 * W - 5).toFixed(1)}px,${((1 - V.y) / 2 * H - 5).toFixed(1)}px)`; }
  }
  function verPuntos(on) { cancelAnimationFrame(raf); if (on) cuadro(); else PUNTOS.forEach(p => { p.d.style.display = 'none'; }); }
  // tocar una estrategia de la leyenda: la cámara va a su(s) punto(s)
  $ley().addEventListener('click', (ev) => { const sp = ev.target.closest('[data-s]'); if (!sp) return; const L = PUNTOS.filter(p => p.s.id === sp.dataset.s); if (!L.length || !T3.orbit) return;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of L) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, s = Math.max(500, (x1 - x0) * 1.3, (z1 - z0) * 1.3), o = T3.orbit, THREE = T3.THREE;
    const p0 = T3.camera.position.clone(), t0 = o.target.clone(), p1 = new THREE.Vector3(cx + s * 0.35, s * 0.8, cz + s * 0.6), t1 = new THREE.Vector3(cx, 0, cz), ini = performance.now();
    const vuela = () => { const k = Math.min(1, (performance.now() - ini) / 1400), e2 = k * k * (3 - 2 * k); T3.camera.position.lerpVectors(p0, p1, e2); o.target.lerpVectors(t0, t1, e2); o.update(); if (k < 1) requestAnimationFrame(vuela); };
    vuela(); });

  /* ---------- apagar lo de la propuesta anterior; las HUERTAS (techos, balcones y Bavaria) sí van con la propuesta ---------- */
  function limpiarAnterior() {
    const pro = T3.escenario === 'proyecto';
    const b = document.getElementById('gs-cv-b'); if (b && b.classList.contains('on')) b.click(); // estrategias E1-E9 (polígonos, conexiones, red de huertas)
    const EST = T3.EST; if (EST && EST.hidroponia) EST.hidroponia(pro); T3.conHidro = pro && !!EST; // huertas hidropónicas en techos y balcones con sus polinizadores
    if (T3.huertas && T3.huertas.grupo) T3.huertas.grupo.visible = pro && !EST; // camas de tierra en terrazas solo si no hay hidroponía
    if (T3.torres && T3.torres.huertas) T3.torres.huertas(pro);
    const bv = T3.bavaria; if (bv && bv.userData && bv.userData.mallasHuerta) bv.userData.mallasHuerta.forEach(m => { m.visible = pro; });
    const co = T3.scene && T3.scene.getObjectByName('corabastos'); if (co && co.userData.quitadas) co.userData.quitadas.visible = true;
    if (T3.bio && T3.bio.ESTADO) T3.bio.ESTADO.escenario = 'hoy';
    if (T3.sintaxisEscenario) T3.sintaxisEscenario();
  }
  function aplicar(e) {
    T3.escenario = e; el.dataset.e = e;
    el.querySelectorAll('.sw button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.e === e)));
    limpiarAnterior(); verPuntos(e === 'proyecto');
    const re = document.getElementById('ruido-esc'); if (re) re.textContent = nombre();
    window.dispatchEvent(new CustomEvent('escenario', { detail: e }));
  }
  const nombre = () => T3.escenario === 'proyecto' ? 'CON LA PROPUESTA' : 'KENNEDY HOY';
  function cambiar(e) { if (e === T3.escenario) return; aplicar(e); say(e === 'proyecto' ? 'Con la propuesta: las 5 estrategias' : 'Kennedy hoy: el territorio como es', 3000); }
  el.querySelectorAll('.sw button').forEach(b => b.onclick = () => cambiar(b.dataset.e));
  window.KEN_ESC = { poner: cambiar, nombre, get e() { return T3.escenario; } };
  // arranque en «hoy»; los módulos que terminan de cargar después se vuelven a apagar
  aplicar('hoy');
  let n = 0; const rep = setInterval(() => { n++; limpiarAnterior(); if (n >= 8) clearInterval(rep); }, 2500);
  return window.KEN_ESC;
}
