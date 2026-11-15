/* ============ ESCENARIO: KENNEDY HOY / CON LA PROPUESTA ============
   Un solo selector arriba al centro cambia TODO el territorio:
   - Hoy: Kennedy como es. Sin huertas (terrazas, balcones, hidroponía, Bavaria), Bavaria en ruinas, Corabastos completo,
     sintaxis espacial de la red actual, camiones tal como se grabaron (SUMO) y sin la fauna que llega a las huertas.
   - Con la propuesta: las estrategias E1-E9 en su lugar (Bavaria Común, Corabastos reducido, corredor de humedales, red de huertas),
     huertas hidropónicas en techos y balcones, huertas de Bavaria, naves junto a La Vaca retiradas, sintaxis con los pasajes de
     Bavaria Común (data3d/sintaxis_proyecto.json), parte de los camiones pasa a furgonetas de reparto (mapa de ruido) y la fauna de
     las huertas.
   El tablero (data3d/tablero.js) escucha el evento «escenario» y muestra los datos del escenario activo; la franja de cifras de este
   selector sale de data3d/escenarios.json (tools/escenarios_build.js). */
export function iniciarEscenario({ T3, say = () => {} }) {
  const CHOY = '#8fb0c9', CPRO = '#e2a55b';
  const css = document.createElement('style');
  css.textContent = `
#esc{position:fixed;z-index:30;top:14px;left:50%;transform:translateX(-50%);width:min(440px,calc(100vw - 600px));min-width:330px;
  font-family:var(--ui-sans,Inter,system-ui,sans-serif);color:var(--ui-tx,#e9ebec);background:var(--ui-bg,rgba(13,15,18,.74));
  border:1px solid var(--ui-bd,rgba(255,255,255,.075));border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.28);
  -webkit-backdrop-filter:blur(16px) saturate(1.1);backdrop-filter:blur(16px) saturate(1.1);padding:6px}
#esc .sw{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:0;background:rgba(255,255,255,.03);border-radius:8px;padding:2px}
#esc .sw i{position:absolute;top:2px;bottom:2px;left:2px;width:calc(50% - 2px);border-radius:7px;background:rgba(143,176,201,.16);
  border:1px solid rgba(143,176,201,.45);transition:transform .35s cubic-bezier(.3,.7,.2,1),background .35s,border-color .35s}
#esc[data-e="proyecto"] .sw i{transform:translateX(100%);background:rgba(226,165,91,.15);border-color:rgba(226,165,91,.5)}
#esc .sw button{position:relative;z-index:1;height:34px;border:0;background:none;color:var(--ui-tx2,#9aa2a7);cursor:pointer;
  font:500 12.5px var(--ui-sans,Inter,system-ui,sans-serif);letter-spacing:.01em;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:7px}
#esc .sw button b{width:7px;height:7px;border-radius:50%;display:inline-block;opacity:.55}
#esc .sw button[aria-pressed="true"]{color:var(--ui-tx,#e9ebec)}
#esc .sw button[aria-pressed="true"] b{opacity:1}
#esc .sw button:focus-visible{outline:2px solid var(--ui-acc,#e2a55b);outline-offset:1px}
#esc .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-top:6px}
#esc .kp div{padding:4px 6px 3px;border-radius:6px;background:rgba(255,255,255,.025);min-width:0}
#esc .kp small{display:block;font:400 9px var(--ui-mono,ui-monospace,monospace);letter-spacing:.08em;text-transform:uppercase;color:var(--ui-tx3,#646c71);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#esc .kp span{display:block;font:500 13px var(--ui-mono,ui-monospace,monospace);color:var(--ui-tx,#e9ebec);white-space:nowrap}
#esc .kp em{font-style:normal;font-size:10px;margin-left:4px}
#esc .pie{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:5px;padding:0 4px 1px;font-size:10.5px;color:var(--ui-tx2,#9aa2a7);line-height:1.3}
#esc .pie button{flex:none;border:1px solid var(--ui-bd2,rgba(255,255,255,.13));background:none;color:var(--ui-tx2,#9aa2a7);border-radius:6px;height:24px;padding:0 9px;font:500 10.5px var(--ui-sans,sans-serif);cursor:pointer}
#esc .pie button:hover{color:var(--ui-tx,#e9ebec)}
#esc.min .kp,#esc.min .pie span{display:none}
@media(max-width:1100px){#esc{width:min(440px,calc(100vw - 32px));top:auto;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 70px)}}
@media(max-width:760px){#esc{min-width:0;width:calc(100vw - 16px);padding:4px}#esc .sw button{height:36px;font-size:12px}#esc .kp small{font-size:8.5px;letter-spacing:.04em}#esc .kp span{font-size:12px}#esc .pie span{display:none}#esc .pie{justify-content:flex-end;margin-top:4px}
  body.tb-abierto #esc{display:none}
  body #hid-red{bottom:calc(max(12px,env(safe-area-inset-bottom)) + 212px)!important}}
@media(min-width:761px) and (max-width:1100px){body #hid-red{bottom:calc(max(12px,env(safe-area-inset-bottom)) + 218px)!important}}
@media(prefers-reduced-motion:reduce){#esc .sw i{transition:none}}`;
  document.head.appendChild(css);
  const el = document.createElement('section'); el.id = 'esc'; el.setAttribute('aria-label', 'Escenario del territorio'); el.dataset.e = 'hoy';
  el.innerHTML = `<div class="sw" role="group" aria-label="Escenario"><i aria-hidden="true"></i>
      <button type="button" data-e="hoy" aria-pressed="true"><b style="background:${CHOY}"></b>Kennedy hoy</button>
      <button type="button" data-e="proyecto" aria-pressed="false"><b style="background:${CPRO}"></b>Con la propuesta</button></div>
    <div class="kp" id="esc-kp"></div>
    <div class="pie"><span id="esc-txt"></span><button type="button" id="esc-tab">Tablero</button></div>`;
  document.body.appendChild(el);
  const $ = (id) => el.querySelector('#' + id);

  let D = null; // indicadores medidos (data3d/escenarios.json)
  fetch('data3d/escenarios.json?v=1').then(r => r.json()).then(d => { D = d; T3.retiroCamiones = d.corabastos.retiroNaves / 100; pintar(); }).catch(e => console.warn('escenarios:', e));
  const nf = (v, d = 0) => v.toLocaleString('es-CO', { maximumFractionDigits: d, minimumFractionDigits: d });
  const energia = (L) => { let s = 0, q = 0; for (const a of L) { s += a.flujoH * 10 ** (a.dB / 10); q += a.flujoH; } return 10 * Math.log10(s / Math.max(1, q)); };
  function kpis() {
    if (!D) return null; const A = D.corabastos.accesos, po = D.polinizadores, sum = (k) => A.reduce((s, a) => s + a[k].camH, 0);
    return [
      { n: 'Camiones/h', t: 'Camiones por hora en el borde de Corabastos (hora pico, SUMO)', h: sum('hoy'), p: sum('proyecto'), f: (v) => nf(v), menos: true },
      { n: 'Ruido', t: 'Ruido del tráfico en el borde de Corabastos (L10 a 10 m, CoRTN)', h: energia(A.map(a => a.hoy)), p: energia(A.map(a => a.proyecto)), f: (v) => nf(v, 1) + ' dB', menos: true },
      { n: 'Polinizadores', t: `Kennedy a menos de ${po.radio} m de un recurso floral`, h: po.hoy, p: po.proyecto, f: (v) => nf(v, 1) + ' %' },
      { n: 'Huertas', t: 'Huertas y techos productivos', h: po.m2Hoy, p: po.m2Proyecto, f: (v) => v >= 1e4 ? nf(v / 1e4) + ' ha' : nf(v) + ' m²' }
    ];
  }
  const TXT = { hoy: 'Kennedy como es: sin huertas ni intervenciones.', proyecto: 'Huertas, Bavaria Común, Corabastos reducido, pasajes y reparto en furgonetas.' };
  function pintar() {
    const e = T3.escenario || 'hoy', pro = e === 'proyecto', K = kpis();
    $('esc-txt').textContent = TXT[e];
    if (!K) { $('esc-kp').innerHTML = ''; return; }
    $('esc-kp').innerHTML = K.map(k => {
      const v = pro ? k.p : k.h; let dif = '';
      if (pro) { const c = k.h ? (k.p - k.h) / Math.abs(k.h) * 100 : null, mejor = c === null ? true : k.menos ? c < 0 : c > 0;
        dif = `<em style="color:${mejor ? CPRO : '#c96349'}">${c === null ? 'nuevo' : (c > 0 ? '+' : '−') + nf(Math.abs(c), 1) + '%'}</em>`; }
      return `<div title="${k.t}"><small>${k.n}</small><span>${k.f(v)}${dif}</span></div>`;
    }).join('');
  }

  function aplicar(e) {
    const pro = e === 'proyecto'; T3.escenario = e; el.dataset.e = e;
    el.querySelectorAll('.sw button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.e === e)));
    // estrategias E1-E9 en el 3D (Bavaria Común, Corabastos reducido, corredor de humedales, red de huertas): botón del panel izquierdo
    const b = document.getElementById('gs-cv-b'); if (b && b.classList.contains('on') !== pro) b.click();
    // huertas: hidroponía en techos y balcones (reemplaza las camas de tierra de las terrazas), torres con balcones-huerta, Bavaria
    const EST = T3.EST;
    if (EST && EST.hidroponia) EST.hidroponia(pro); T3.conHidro = pro && !!EST;
    if (T3.huertas && T3.huertas.grupo) T3.huertas.grupo.visible = pro && !EST;
    if (T3.torres && T3.torres.huertas) T3.torres.huertas(pro);
    const bv = T3.bavaria; if (bv && bv.userData && bv.userData.mallasHuerta) bv.userData.mallasHuerta.forEach(m => { m.visible = pro; });
    // Corabastos reducido: las naves a menos de 120 m del humedal La Vaca se retiran
    const co = T3.scene && T3.scene.getObjectByName('corabastos'); if (co && co.userData.quitadas) co.userData.quitadas.visible = !pro;
    // fauna de las huertas (data3d/biotica.js) y sintaxis espacial (data3d/giro_sim.js)
    if (T3.bio && T3.bio.ESTADO) T3.bio.ESTADO.escenario = e;
    if (T3.sintaxisEscenario) T3.sintaxisEscenario();
    const re = document.getElementById('ruido-esc'); if (re) re.textContent = nombre();
    pintar();
    window.dispatchEvent(new CustomEvent('escenario', { detail: e }));
  }
  const nombre = () => T3.escenario === 'proyecto' ? 'CON LA PROPUESTA' : 'KENNEDY HOY';
  function poner(e) {
    if (e === T3.escenario) return; aplicar(e);
    say(e === 'proyecto' ? 'Con la propuesta: huertas, Bavaria Común, Corabastos reducido y pasajes' : 'Kennedy hoy: el territorio como es', 3500);
  }
  el.querySelectorAll('.sw button').forEach(b => b.onclick = () => poner(b.dataset.e));
  $('esc-tab').onclick = () => { if (T3.tablero && T3.tablero.abrir) { T3.tablero.abrir(true); if (T3.tablero.verPestana) T3.tablero.verPestana('esc'); } else say('El tablero aún está cargando', 2500); };
  window.KEN_ESC = { poner, nombre, get e() { return T3.escenario; } };
  // arranque en «hoy». Los módulos que llegan después (botón de estrategias, Corabastos, Bavaria, tablero) se ajustan solos o aquí
  aplicar('hoy');
  let n = 0; const re = setInterval(() => { n++; aplicar(T3.escenario); if (n >= 6) clearInterval(re); }, 2500);
  return window.KEN_ESC;
}
