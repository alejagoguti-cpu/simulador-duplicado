/* ============ LAS CAPAS DE LA IZQUIERDA CAMBIAN CON LA PROPUESTA (y dicen por qué) ============
   · Sintaxis: botón «Ver dónde cambia» (los 20 pasajes de Bavaria Común y las 61 calles vecinas) + por qué.
   · Ruido de carros: el mapa ya sale de los carros de la simulación; aquí se mide la Av. Ciudad de Cali hoy vs. con la propuesta
     (dB con la regla de energía: 10·log10(propuesta/hoy), un camión = 4 carros) y se explica.
   · Usos del suelo: con la propuesta Bavaria pasa de industrial a dotacional/educativo y aparece la agricultura urbana
     (huertas de barrio, techos, Bavaria) con su área; el panel muestra hoy -> propuesta.
   · Indicadores: tabla HOY -> CON LA PROPUESTA en el panel de la derecha, con la razón de cada cambio (escenarios_sim.js).
   Al cambiar a la propuesta sale una tarjeta corta que resume qué cambió en cada capa. */
import { SEM, AÑO, SIMST } from './sim_modelos.js?v=2';
export function iniciarCapasEscenario({ T3, ES }) {
  const fmt = (v, d = 0) => (v == null || !isFinite(v)) ? '–' : v.toLocaleString('es-CO', { maximumFractionDigits: d, minimumFractionDigits: d });
  const pro = () => T3.escenario === 'proyecto';
  const css = document.createElement('style'); css.textContent = `
#ci-ind{margin:4px 0 6px}#ci-ind .ci-ir{margin:0 0 0 4px;font-size:10px}#ci-ind .h{display:flex;justify-content:space-between;font:500 9.5px var(--ui-mono,monospace);letter-spacing:.14em;color:var(--ui-tx3,#949da3);text-transform:uppercase;margin:6px 0 4px}
#ci-ind .r{display:grid;grid-template-columns:1fr auto auto;gap:0 8px;align-items:baseline;padding:4px 0;border-top:1px solid rgba(255,255,255,.06);font-size:11px}
#ci-ind .r span{color:var(--ui-tx2,#c3cace)}#ci-ind .r b{font-weight:500;color:#9aa4aa;font-variant-numeric:tabular-nums;text-align:right}#ci-ind .r strong{font-weight:600;font-variant-numeric:tabular-nums;text-align:right;min-width:56px}
#ci-ind .br{grid-column:1/-1;display:grid;gap:2px;margin:4px 0 2px}#ci-ind .br b{display:block;height:4px;border-radius:2px;min-width:2px}
#ci-ind .lg{display:inline-block;width:8px;height:8px;border-radius:2px;margin:0 4px 0 2px;vertical-align:-1px}
#ci-ind .r small{grid-column:1/-1;color:var(--ui-tx3,#949da3);font-size:10px;line-height:1.35;margin-top:1px}#ci-ind .bien{color:#8fd18a}#ci-ind .mal{color:#ff8a80}
.ci-por{margin-top:6px;font-size:10.5px;line-height:1.4;color:var(--ui-tx2,#c3cace)}.ci-por b{color:#fff;font-weight:600}
.ci-ir{all:unset;cursor:pointer;display:inline-block;margin-top:6px;font-size:10.5px;font-weight:600;color:#f2c995}.ci-ir:hover{text-decoration:underline}
#ci-toast{position:fixed;left:292px;top:84px;z-index:30;width:min(320px,calc(100vw - 32px));padding:12px 14px;border-radius:14px;color:#eef1f2;font:400 11.5px/1.45 var(--ui-sans,Inter,system-ui,sans-serif);
  background:var(--ui-glass,rgba(14,16,20,.86));border:1px solid var(--ui-glass-bd,rgba(255,255,255,.16));box-shadow:0 18px 40px rgba(0,0,0,.4);backdrop-filter:var(--ui-glass-fx,blur(24px));-webkit-backdrop-filter:var(--ui-glass-fx,blur(24px));
  opacity:0;transform:translateY(-6px);transition:opacity .35s,transform .35s;pointer-events:none}
#ci-toast.on{opacity:1;transform:none;pointer-events:auto}#ci-toast h4{margin:0 0 6px;font-size:12.5px;font-weight:600}#ci-toast ul{margin:0;padding:0 0 0 14px}#ci-toast li{margin:2px 0}#ci-toast li b{color:#fff}
#ci-toast button{all:unset;cursor:pointer;position:absolute;right:10px;top:8px;color:#b3bbc0;font-size:15px}
@media(max-width:760px){#ci-toast{left:8px;right:8px;width:auto;top:auto;bottom:140px}}
@media(prefers-reduced-motion:reduce){#ci-toast{transition:none}}`;
  document.head.appendChild(css);

  /* ---------- números de las capas ---------- */
  const HA_HUERTAS = () => { const b = window.KEN_BAV; const hb = 2.4; const techos = (13717 + 35268) / 1e4; return { barrio: hb, bavaria: b && b.ha ? b.ha : 2.9, techos }; };
  const ruidoCali = () => { const a = T3.alivio; if (!a || !(a.hoy > 0.5)) return null; const eh = a.hoy + 3 * a.camHoy, ep = a.pro + 3 * a.camPro; return { db: 10 * Math.log10(Math.max(0.05, ep / eh)), veh: (1 - a.pro / a.hoy) * 100 }; };
  const sx = () => { const n = document.getElementById('gs-sx-pro'); const m = n && n.textContent.match(/(\d+) pasajes nuevos.*?\(([\d.]+) m\)/); return m ? { pas: +m[1], m: m[2] } : { pas: 20, m: '4.000' }; };
  const volar = (c, alto) => { const o = T3.orbit; if (!o) return; const THREE = T3.THREE, p0 = T3.camera.position.clone(), t0 = o.target.clone(), p1 = new THREE.Vector3(c[0] + alto * 0.15, alto, c[1] + alto * 0.55), t1 = new THREE.Vector3(c[0], 0, c[1]), ini = performance.now();
    const f = () => { const k = Math.min(1, (performance.now() - ini) / 1500), e = k * k * (3 - 2 * k); T3.camera.position.lerpVectors(p0, p1, e); o.target.lerpVectors(t0, t1, e); o.update(); if (k < 1) requestAnimationFrame(f); }; f(); };

  /* ---------- sintaxis: por qué y dónde ---------- */
  function sintaxis() {
    const n = document.getElementById('gs-sx-pro'); if (!n) return;
    let x = n.parentElement.querySelector('.ci-sx'); if (!x) { x = document.createElement('div'); x.className = 'ci-sx ci-por'; n.after(x); }
    const s = sx();
    x.innerHTML = pro() ? `<b>Por qué cambia:</b> Bavaria hoy es un predio cerrado de casi 40 ha. La propuesta abre ${s.pas} pasajes peatonales que lo atraviesan y lo unen a las calles del barrio: el recorrido más corto entre barrios pasa por dentro, por eso esas calles ganan integración y elección.<br><button type="button" class="ci-ir" data-sx>Ver dónde cambia →</button>`
      : `<b>Hoy:</b> el predio de Bavaria es una barrera de casi 40 ha que obliga a rodearlo. Cambia a «Con la propuesta» para ver los pasajes.`;
    const b = x.querySelector('[data-sx]'); if (b) b.onclick = () => { const bi = document.querySelector('#gs-capa button[data-c="i"]'); if (bi && !bi.classList.contains('on')) bi.click(); volar([4080, 120], 950); };
  }
  /* ---------- ruido: Av. Ciudad de Cali hoy vs. propuesta ---------- */
  function ruido() {
    const el = document.getElementById('ruido-panel'); if (!el) return;
    let x = el.querySelector('.ci-ru'); if (!x) { x = document.createElement('div'); x.className = 'ci-ru ci-por'; x.style.cssText = 'margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.1)'; el.appendChild(x); }
    const r = ruidoCali(), e = el.querySelector('#ruido-esc'); if (e) e.textContent = pro() ? 'CON LA PROPUESTA' : 'KENNEDY HOY';
    x.innerHTML = r ? (pro() ? `<b>Av. Ciudad de Cali: ${fmt(r.db, 1)} dB</b> (−${fmt(r.veh)} % de vehículos). <b>Por qué:</b> si los barrios compran en mercados de barrio y huertas, menos camiones y carros van a Corabastos; cada vez que el tráfico se reduce a la mitad el ruido baja unos 3 dB.<br><button type="button" class="ci-ir" data-ru>Ver la avenida →</button>`
      : `<b>Hoy</b> la Av. Ciudad de Cali es de las más ruidosas: lleva el tráfico hacia Corabastos. Con la propuesta bajaría unos <b>${fmt(Math.abs(r.db), 1)} dB</b>.`) : 'Midiendo el tráfico de la Av. Ciudad de Cali…';
    const b = x.querySelector('[data-ru]'); if (b) b.onclick = () => { const m = T3.alivio && T3.alivio.mid; if (m) volar(m, 700); };
  }
  /* ---------- usos: Bavaria cambia de uso y aparece la agricultura urbana ---------- */
  let usosPend = 0;
  async function usos(forzar) {
    const bt = document.getElementById('us-btn'); if (!bt || !bt.classList.contains('on')) return;
    if (forzar) { try { const m = await import('./usos_suelo.js?v=7'); m.pintarModelos({ THREE: T3.THREE, T3, on: true }); } catch (e) { console.warn('usos:', e); } }
    const el = document.getElementById('usos-panel'); if (!el) return;
    let x = el.querySelector('.ci-us'); if (!x) { x = document.createElement('div'); x.className = 'ci-us'; x.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.1);font-size:11px'; el.appendChild(x); }
    const h = HA_HUERTAS(), tot = h.barrio + h.bavaria + h.techos;
    x.innerHTML = `<div style="letter-spacing:.14em;font-size:10px;font-weight:700;color:#94a3b8;margin-bottom:6px">${pro() ? 'CON LA PROPUESTA CAMBIA' : 'SI SE HACE LA PROPUESTA'}</div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 8px;align-items:center">
      <span style="width:10px;height:10px;border-radius:2px;background:#7b2d8e"></span><span>Bavaria: <b>industrial</b> → <b style="color:#7fb3d5">dotacional y educativo</b> (escuela, laboratorios, mercado)</span>
      <span style="width:10px;height:10px;border-radius:2px;background:#59a14f"></span><span><b>Agricultura urbana: +${fmt(tot, 1)} ha</b> (${fmt(h.barrio, 1)} ha en parques y lotes, ${fmt(h.bavaria, 1)} ha en Bavaria, ${fmt(h.techos, 1)} ha en techos)</span>
      <span style="width:10px;height:10px;border-radius:2px;background:#e63946"></span><span>Comercio de barrio: los mercados de barrio reciben lo que antes se compraba en Corabastos</span></div>
      <div class="ci-por"><b>Por qué:</b> el suelo industrial ocioso pasa a enseñar a producir alimento; los parques y techos producen sin quitarle espacio a nadie.</div>`;
  }
  /* ---------- indicadores: hoy -> propuesta ---------- */
  function indicadores() {
    const der = document.querySelector('#esim .cuerpo'), S = window.KEN_ESIM; if (!der || !S || !S.R) return; // un solo panel: los indicadores van en el de escenarios
    let x = document.getElementById('ci-ind'); if (!x) { x = document.createElement('div'); x.id = 'ci-ind'; der.prepend(x); const k = der.querySelector('[data-kpi]'); if (k) k.style.display = 'none'; }
    const R = S.R, e = pro() ? SIMST.esc : 'C', t = Math.max(0, Math.min(SEM - 1, Math.floor(SIMST.t))), A = R.S1.A, P = R.S1[e], A2 = R.S2.A, P2 = R.S2[e], A3 = R.S3.A, P3 = R.S3[e], ru = ruidoCali();
    let ii = 0; const IR = ['huertas', 'trafico', 'trafico', 'trafico', 'compost', 'humedal', null];
    const CP = e === 'B' ? '#b07aa1' : '#e2a55b'; // color del escenario de la propuesta (el mismo del tablero)
    // raw = [hoy, propuesta] en números: dos barritas en la misma escala para ver la diferencia de un vistazo
    const fila = (n, hoy, prop, mejor, por, raw) => { const ir = IR[ii++]; let br = '';
      if (raw && pro() && raw.every(v => isFinite(v) && v >= 0)) { const m = Math.max(raw[0], raw[1], 1e-9), w = (v) => Math.max(2, v / m * 100).toFixed(1); br = `<i class="br"><b style="width:${w(raw[0])}%;background:#8fb0c9"></b><b style="width:${w(raw[1])}%;background:${CP}"></b></i>`; }
      return `<div class="r"><span>${n}</span><b>${hoy}</b><strong class="${pro() ? (mejor ? 'bien' : 'mal') : ''}">${pro() ? prop : '–'}</strong>${br}<small>${por}${ir ? ` <button type="button" class="ci-ir" data-ir="${ir}">Ver en el mapa →</button>` : ''}</small></div>`; };
    x.innerHTML = `<div class="h"><span>Indicadores · ${2026 + Math.floor(t / AÑO) + 1}</span><span><i class="lg" style="background:#8fb0c9"></i>hoy → <i class="lg" style="background:${CP}"></i>propuesta ${pro() ? e : ''}</span></div>` +
      fila('Hogares con huerta', fmt(A.act[t]), fmt(P.act[t]), true, 'Bavaria forma promotores que abren y acompañan huertas.', [A.act[t], P.act[t]]) +
      fila('Dependencia de Corabastos', fmt(A.dep[t] * 100) + ' %', fmt(P.dep[t] * 100) + ' %', true, 'Huertas y compras directas a la región abastecen tiendas y comedores.', [A.dep[t], P.dep[t]]) +
      fila('Vehículos en la Av. Ciudad de Cali', '100 %', ru ? fmt(100 - ru.veh) + ' %' : '–', true, 'Menos viajes de carga y de compra hacia Corabastos.', ru ? [100, 100 - ru.veh] : null) +
      fila('Ruido en la Av. Ciudad de Cali', '0 dB', ru ? fmt(ru.db, 1) + ' dB' : '–', true, 'Menos camiones: el ruido baja con el tráfico pesado.') +
      fila('Orgánicos que vuelven a la tierra', fmt(A2.pct[t], 1) + ' %', fmt(P2.pct[t], 1) + ' %', true, 'Se compostan en el barrio o en Bavaria en vez de ir a Doña Juana.', [A2.pct[t], P2.pct[t]]) +
      fila('Aves en el humedal El Burro', fmt(A3.aves[t]), fmt(P3.aves[t]), P3.aves[t] >= A3.aves[t], 'Las huertas con corredores unen parches de hábitat.', [A3.aves[t], P3.aves[t]]) +
      fila('Pasajes nuevos (sintaxis)', '0', String(sx().pas), true, 'Abrir Bavaria une barrios que hoy lo rodean.');
  }
  /* ---------- tarjeta al cambiar a la propuesta ---------- */
  let tToast = 0;
  function tarjeta() {
    let el = document.getElementById('ci-toast'); if (!el) { el = document.createElement('div'); el.id = 'ci-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    if (!pro()) { el.classList.remove('on'); return; }
    const ru = ruidoCali(), h = HA_HUERTAS(), s = sx();
    el.innerHTML = `<button type="button" aria-label="Cerrar">×</button><h4>Con la propuesta cambia, a la izquierda:</h4><ul>
      <li><b>Sintaxis:</b> ${s.pas} pasajes abren Bavaria y unen barrios.</li>
      <li><b>Ruido de carros:</b> la Av. Ciudad de Cali ${ru ? `baja ${fmt(Math.abs(ru.db), 1)} dB` : 'baja'} con menos tráfico a Corabastos.</li>
      <li><b>Usos:</b> Bavaria pasa de industrial a educativo y aparecen ${fmt(h.barrio + h.bavaria + h.techos, 1)} ha de agricultura urbana.</li>
      <li><b>Indicadores:</b> la tabla de la derecha compara hoy con la propuesta.</li></ul>`;
    el.classList.add('on'); el.querySelector('button').onclick = () => el.classList.remove('on'); clearTimeout(tToast); tToast = setTimeout(() => el.classList.remove('on'), 12000);
  }
  const todo = () => { sintaxis(); ruido(); usos(false); indicadores(); };
  addEventListener('escenario', () => setTimeout(() => { usos(true); todo(); tarjeta(); }, 400));
  addEventListener('sim-cambio', () => setTimeout(indicadores, 50));
  document.addEventListener('click', (ev) => { if (ev.target.closest('#us-btn,#rc-btn,#gs-capa button')) setTimeout(() => { usos(true); todo(); }, 700); });
  setInterval(todo, 1200);
}
