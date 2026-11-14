/* ============ TABLERO · RELACIONES BIÓTICAS ============
   Indicadores en vivo de la red biótica del simulador (data3d/biotica.js). Todo sale del estado de los agentes en cada momento:
   - Actividad: cada especie tiene un ritmo de 24 horas [SUP] (actividad(k, h) en biotica.js); al terminar cada pausa el animal
     sigue en reposo con probabilidad 1 - actividad. "Esperada" = el promedio del ritmo; "medida" = los individuos que no están en reposo.
   - Conexiones: enlaces de la red entre individuos y árboles (hasta 220 m / 90 m). Encuentro: los dos a menos de 18 m (la interacción ocurre).
   - Encuentros por hora: encuentros nuevos registrados en cada hora simulada del día.
   Se actualiza dos veces por segundo; los datos se acumulan aunque el tablero esté cerrado. */
export function iniciarTablero({ T3, bio }) {
  const { AG, ESP, LINKS, TIPOS, CAT, CUENTA, ENC, CERCA, flora, actividad, ESTADO } = bio;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hhmm = (min) => { min = ((Math.floor(min) % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); };
  const pct = (v) => Math.round(v * 100);
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- datos fijos: grupos, hábitats y la curva esperada de 24 h ---------- */
  const GR = [...new Set(AG.map(a => ESP[a.e].cat))].sort((p, q) => p - q);
  const nomGr = (c) => ({ 'Lombrices (suelo)': 'Lombrices', 'Flora y arbolado': 'Flora' }[CAT[c].n] || CAT[c].n);
  const grupoHab = (h) => h.tipo === 'humedal' ? h.n : h.tipo === 'huerta' ? 'Huertas urbanas' : h.cnt ? (/bavaria/i.test(h.n) ? 'Bosque Bavaria' : h.n) : 'Parques y zonas verdes';
  const HABS = []; { const m = new Map(); for (const a of AG) { const k = grupoHab(a.h); if (!m.has(k)) { const o = { n: k, ag: [] }; m.set(k, o); HABS.push(o); } m.get(k).ag.push(a); } HABS.sort((p, q) => q.ag.length - p.ag.length); }
  const MOD = Array.from({ length: 96 }, (_, i) => { let s = 0; for (const a of AG) s += actividad(a.e, i / 4); return s / AG.length; });
  const modGr = (c, h) => { let s = 0, n = 0; for (const a of AG) if (ESP[a.e].cat === c) { s += actividad(a.e, h); n++; } return n ? s / n : 0; };

  /* ---------- series que se van llenando ---------- */
  let diaAct = -1, primado = false;
  const MED = new Array(96).fill(null), HORA = new Array(24).fill(0), FEED = [], VISTO = new Map();
  let ult = { mov: 0, ale: 0, rep: 0, act: 0, gr: {}, hab: [], con: 0, enc: 0 }, tFeed = 0;

  /* ---------- estilos (mismo sistema visual que ui_sobrio.css: grafito, Inter + JetBrains Mono, acento ámbar) ---------- */
  const css = document.createElement('style'); css.textContent = `
#tb{position:fixed;z-index:13;right:14px;top:14px;bottom:84px;width:448px;display:none;flex-direction:column;overflow:hidden;
  font-family:var(--ui-sans,'Inter',system-ui,sans-serif);color:var(--ui-tx,#e9ebec);background:var(--ui-bg,rgba(13,15,18,.8));
  border:1px solid var(--ui-bd,rgba(255,255,255,.075));border-radius:14px;box-shadow:0 18px 44px rgba(0,0,0,.38);
  -webkit-backdrop-filter:blur(18px) saturate(1.1);backdrop-filter:blur(18px) saturate(1.1)}
body.tb-abierto #tb{display:flex}
body.tb-abierto #dock{display:none}
#tb .tb-cab{flex:none;display:flex;align-items:center;gap:10px;padding:10px 12px 9px 14px;border-bottom:1px solid var(--ui-bd,rgba(255,255,255,.075))}
#tb .tb-cab h2{margin:0;flex:1;font:500 10px var(--ui-mono,ui-monospace,monospace);letter-spacing:.18em;color:var(--ui-tx2,#9aa2a7);text-transform:uppercase}
#tb .tb-cab h2 b{color:var(--ui-acc-tx,#f2c995);font-weight:500}
#tb .tb-vivo{display:flex;align-items:center;gap:6px;font:400 10px var(--ui-mono,monospace);color:var(--ui-tx3,#646c71);letter-spacing:.06em}
#tb .tb-vivo i{width:6px;height:6px;border-radius:50%;background:var(--ui-acc,#e2a55b);box-shadow:0 0 0 0 rgba(226,165,91,.6);animation:tbLat 2s infinite}
@keyframes tbLat{0%{box-shadow:0 0 0 0 rgba(226,165,91,.55)}70%{box-shadow:0 0 0 7px rgba(226,165,91,0)}100%{box-shadow:0 0 0 0 rgba(226,165,91,0)}}
#tb .tb-x{flex:none;width:28px;height:28px;border:1px solid var(--ui-bd,rgba(255,255,255,.075));border-radius:8px;background:rgba(255,255,255,.035);color:var(--ui-tx2,#9aa2a7);font:400 15px var(--ui-sans,sans-serif);cursor:pointer;line-height:1}
#tb .tb-x:hover{color:var(--ui-tx,#e9ebec)}
#tb .tb-grid{overflow:auto;padding:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-content:start;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.12) transparent}
#tb .tb-c{position:relative;min-width:0;padding:12px 12px 11px;border-radius:12px;border:1px solid rgba(255,255,255,.06);
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.012))}
#tb .w2{grid-column:span 2}
#tb .tb-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:0 0 9px;font:500 9.5px var(--ui-mono,monospace);letter-spacing:.15em;color:var(--ui-tx3,#646c71);text-transform:uppercase}
#tb .tb-h span{letter-spacing:.03em;text-transform:none;color:var(--ui-tx3,#646c71);font-weight:400;text-align:right}
#tb .tb-heroc{background:radial-gradient(120% 110% at 100% 0%,rgba(226,165,91,.17),transparent 58%),linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.012))}
#tb .tb-hero{display:grid;grid-template-columns:1fr auto;gap:4px 14px;align-items:end}
#tb .tb-hora{font:300 44px/1 var(--ui-sans,sans-serif);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
#tb .tb-fase{margin-top:6px;font-size:12px;color:var(--ui-acc-tx,#f2c995)}
#tb .tb-dia{margin-top:2px;font:400 10px var(--ui-mono,monospace);color:var(--ui-tx3,#646c71);letter-spacing:.05em}
#tb .tb-kpi{text-align:right}
#tb .tb-kpi b{display:block;font:300 34px/1 var(--ui-sans,sans-serif);font-variant-numeric:tabular-nums}
#tb .tb-kpi small{display:block;margin-top:5px;font:400 10px var(--ui-mono,monospace);color:var(--ui-tx3,#646c71);letter-spacing:.04em}
#tb .tb-banda{position:relative;height:30px;margin-top:12px}
#tb .tb-banda svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
#tb .tb-banda input{position:absolute;inset:-6px 0;width:100%;height:42px;margin:0;opacity:0;cursor:ew-resize}
#tb .tb-ejes{display:flex;justify-content:space-between;margin-top:4px;font:400 9px var(--ui-mono,monospace);color:var(--ui-tx3,#646c71)}
#tb .tb-anillo{display:grid;grid-template-columns:80px 1fr;gap:10px;align-items:center}
#tb .tb-anillo .r{position:relative;width:80px;height:80px}
#tb .tb-anillo .r svg{width:100%;height:100%;transform:rotate(-90deg)}
#tb .tb-anillo .r div{position:absolute;inset:0;display:grid;place-content:center;text-align:center}
#tb .tb-anillo .r b{font:300 22px/1 var(--ui-sans,sans-serif);font-variant-numeric:tabular-nums}
#tb .tb-anillo .r b small{font-size:12px;color:var(--ui-tx2,#9aa2a7)}
#tb .tb-anillo .r em{font:normal 400 8.5px var(--ui-mono,monospace);color:var(--ui-tx3,#646c71);letter-spacing:.06em;margin-top:3px}
#tb .tb-ley{display:grid;gap:5px;font-size:10.5px;color:var(--ui-tx2,#9aa2a7);min-width:0}
#tb .tb-ley div{display:grid;grid-template-columns:8px 1fr auto;gap:6px;align-items:center}
#tb .tb-ley i{width:8px;height:8px;border-radius:2px}
#tb .tb-ley b{font:400 10.5px var(--ui-mono,monospace);color:var(--ui-tx,#e9ebec);font-variant-numeric:tabular-nums}
#tb .tb-lin{position:relative}
#tb .tb-lin svg{display:block;width:100%;height:132px;overflow:visible}
#tb .tb-tip{position:absolute;z-index:2;pointer-events:none;display:none;padding:6px 8px;border-radius:8px;background:rgba(10,11,13,.94);border:1px solid rgba(255,255,255,.12);font:400 10.5px var(--ui-sans,sans-serif);color:var(--ui-tx,#e9ebec);white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.35)}
#tb .tb-tip b{font:500 10px var(--ui-mono,monospace);color:var(--ui-acc-tx,#f2c995);display:block;margin-bottom:2px}
#tb .tb-tip span{display:flex;align-items:center;gap:6px}#tb .tb-tip i{width:10px;height:2px;border-radius:1px;display:inline-block}
#tb .tb-leyl{display:flex;gap:14px;margin-top:6px;font-size:10.5px;color:var(--ui-tx2,#9aa2a7)}
#tb .tb-leyl span{display:flex;align-items:center;gap:6px}#tb .tb-leyl i{width:14px;height:0;border-top:2px solid}
#tb .tb-tipos{display:grid;gap:6px}
#tb .tb-tipo{display:grid;grid-template-columns:minmax(0,1fr) 112px 30px;gap:8px;align-items:center;padding:0;border:0;background:none;color:var(--ui-tx,#e9ebec);font:400 11px var(--ui-sans,sans-serif);text-align:left;cursor:pointer}
#tb .tb-tipo.off{opacity:.35}
#tb .tb-tipo span{display:flex;align-items:center;gap:7px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tb .tb-tipo span i{flex:none;width:8px;height:8px;border-radius:50%}
#tb .tb-tipo .bar{position:relative;height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden}
#tb .tb-tipo .bar i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;transition:width .45s ease}
#tb .tb-tipo .bar i.a{opacity:.38}
#tb .tb-tipo b{font:400 10.5px var(--ui-mono,monospace);text-align:right;font-variant-numeric:tabular-nums}
#tb .tb-radar svg{display:block;width:100%;height:auto;overflow:visible}
#tb .tb-habs{display:grid;gap:8px}
#tb .tb-hab{font-size:10.5px;color:var(--ui-tx2,#9aa2a7)}
#tb .tb-hab div{display:flex;justify-content:space-between;gap:6px;margin-bottom:4px}
#tb .tb-hab div span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tb .tb-hab b{font:400 10px var(--ui-mono,monospace);color:var(--ui-tx,#e9ebec);font-variant-numeric:tabular-nums}
#tb .tb-hab p{margin:0;height:4px;border-radius:2px;background:rgba(255,255,255,.06);overflow:hidden}
#tb .tb-hab p i{display:block;height:100%;border-radius:2px;background:var(--ui-acc,#e2a55b);transition:width .45s ease}
#tb .tb-col{position:relative}
#tb .tb-col svg{display:block;width:100%;height:96px}
#tb .tb-feed{display:grid;gap:0}
#tb .tb-ev{display:grid;grid-template-columns:38px 1fr;gap:8px;align-items:start;padding:7px 0;border-top:1px solid rgba(255,255,255,.05);cursor:pointer;animation:tbEntra .5s ease}
#tb .tb-ev:first-child{border-top:0;padding-top:2px}
#tb .tb-ev:hover .t{color:var(--ui-acc-tx,#f2c995)}
#tb .tb-ev time{font:400 10px var(--ui-mono,monospace);color:var(--ui-tx3,#646c71);padding-top:1px}
#tb .tb-ev .t{font-size:11.5px;line-height:1.35}
#tb .tb-ev small{display:flex;align-items:center;gap:6px;margin-top:2px;font-size:10px;color:var(--ui-tx3,#646c71)}
#tb .tb-ev small i{width:7px;height:7px;border-radius:50%;flex:none}
#tb .tb-vacio{font-size:11px;color:var(--ui-tx3,#646c71);padding:4px 0}
@keyframes tbEntra{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
#tb .tb-nota{grid-column:span 2;padding:2px 4px 4px;font-size:9.5px;line-height:1.45;color:var(--ui-tx3,#646c71)}
#b-tablero svg{opacity:.8}
@media(max-width:760px){body #hud-c{max-width:calc(100vw - 16px);padding:3px!important}body #hud-c button{padding:10px 4px!important;letter-spacing:.02em!important;font-size:10px!important}body #hud-c #b-pajaro{padding:10px 10px!important;letter-spacing:.08em!important}body #hud-c #b-tablero{font-size:0!important;letter-spacing:0!important;padding:10px 13px!important}body #hud-c #b-tablero svg{margin:0!important}}
@media(max-width:760px){
  #tb{left:8px;right:8px;width:auto;top:auto;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 64px);height:min(74vh,720px);z-index:26}
  #tb .tb-hora{font-size:36px}#tb .tb-kpi b{font-size:28px}
  #tb .tb-anillo{grid-template-columns:1fr;justify-items:center}
  #tb .tb-ley{width:100%}
  #tb .tb-tipo{grid-template-columns:minmax(0,1fr) 72px 26px}
}`;
  document.head.appendChild(css);

  /* ---------- estructura ---------- */
  const tb = document.createElement('section'); tb.id = 'tb'; tb.setAttribute('aria-label', 'Tablero de relaciones bióticas');
  const fondoDia = (h) => h < 4.7 || h >= 19.3 ? '#1c2233' : h < 5.6 ? '#4a3d5c' : h < 6.6 ? '#9c6a45' : h < 17.2 ? '#56656e' : h < 18.1 ? '#a36d3e' : '#5e3f55';
  let banda = ''; for (let i = 0; i < 96; i++) banda += `<rect x="${(i / 96 * 100).toFixed(3)}" y="9" width="${(100 / 96 + 0.05).toFixed(3)}" height="12" fill="${fondoDia(i / 4)}"/>`;
  tb.innerHTML = `
  <div class="tb-cab"><h2>Tablero · <b>relaciones bióticas</b></h2><div class="tb-vivo"><i></i>en vivo</div><button class="tb-x" aria-label="Cerrar tablero">×</button></div>
  <div class="tb-grid">
    <div class="tb-c w2 tb-heroc">
      <div class="tb-h">Simulación <span id="tb-vel"></span></div>
      <div class="tb-hero">
        <div><div class="tb-hora" id="tb-hora">00:00</div><div class="tb-fase" id="tb-fase"></div><div class="tb-dia" id="tb-dia"></div></div>
        <div class="tb-kpi"><b id="tb-enc">0</b><small>encuentros ocurriendo</small></div>
      </div>
      <div class="tb-banda"><svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">${banda}
        <polyline id="tb-bmod" fill="none" stroke="rgba(242,201,149,.75)" stroke-width="1.2" vector-effect="non-scaling-stroke" points=""/>
        <line id="tb-bcur" x1="0" x2="0" y1="3" y2="27" stroke="#f2c995" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
        <input type="range" id="tb-rango" min="0" max="1439" step="5" aria-label="Hora de la simulación"></div>
      <div class="tb-ejes"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
    </div>
    <div class="tb-c"><div class="tb-h">Actividad</div>
      <div class="tb-anillo"><div class="r"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="9"/>
        <circle id="tb-r1" cx="50" cy="50" r="40" fill="none" stroke="#e2a55b" stroke-width="9" stroke-linecap="butt" stroke-dasharray="0 999"/>
        <circle id="tb-r2" cx="50" cy="50" r="40" fill="none" stroke="rgba(226,165,91,.42)" stroke-width="9" stroke-dasharray="0 999"/></svg>
        <div><b id="tb-act">0<small>%</small></b><em>despiertos</em></div></div>
        <div class="tb-ley"><div><i style="background:#e2a55b"></i>Moviéndose<b id="tb-l1">0</b></div><div><i style="background:rgba(226,165,91,.42)"></i>Posados<b id="tb-l2">0</b></div><div><i style="background:rgba(255,255,255,.1)"></i>En reposo<b id="tb-l3">0</b></div></div></div></div>
    <div class="tb-c"><div class="tb-h">Red</div>
      <div class="tb-anillo"><div class="r"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="9"/>
        <circle id="tb-r3" cx="50" cy="50" r="40" fill="none" stroke="#e2a55b" stroke-width="9" stroke-linecap="round" stroke-dasharray="0 999"/></svg>
        <div><b id="tb-con">0</b><em>conexiones</em></div></div>
        <div class="tb-ley"><div><i style="background:#e2a55b"></i>Encuentros<b id="tb-l4">0</b></div><div><i style="background:rgba(255,255,255,.1)"></i>A distancia<b id="tb-l5">0</b></div><div style="grid-template-columns:1fr auto"><span>Proporción</span><b id="tb-l6">0 %</b></div></div></div></div>
    <div class="tb-c w2"><div class="tb-h">Ritmo de 24 horas <span>% de individuos despiertos</span></div>
      <div class="tb-lin" id="tb-lin"><svg viewBox="0 0 400 132" preserveAspectRatio="none" aria-label="Actividad esperada y medida durante el día">
        <defs><linearGradient id="tb-ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2a55b" stop-opacity=".34"/><stop offset="1" stop-color="#e2a55b" stop-opacity="0"/></linearGradient>
        <filter id="tb-glow" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>
        <g stroke="rgba(255,255,255,.06)" stroke-width="1" vector-effect="non-scaling-stroke">${[10, 60, 110].map(y => `<line x1="0" x2="400" y1="${y}" y2="${y}" vector-effect="non-scaling-stroke"/>`).join('')}</g>
        <path id="tb-pmod" fill="none" stroke="#9aa2a7" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>
        <path id="tb-parea" fill="url(#tb-ga)"/>
        <path id="tb-pglow" fill="none" stroke="#e2a55b" stroke-width="4" opacity=".55" filter="url(#tb-glow)" vector-effect="non-scaling-stroke"/>
        <path id="tb-pmed" fill="none" stroke="#f0b56c" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <line id="tb-lcur" y1="4" y2="114" stroke="rgba(242,201,149,.5)" stroke-width="1" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>
        <line id="tb-lhov" y1="4" y2="114" stroke="rgba(255,255,255,.35)" stroke-width="1" vector-effect="non-scaling-stroke" style="display:none"/>
      </svg><div class="tb-tip" id="tb-tip1"></div></div>
      <div class="tb-ejes"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
      <div class="tb-leyl"><span><i style="border-color:#f0b56c"></i>Medida en la simulación</span><span><i style="border-color:#9aa2a7;border-top-style:dashed"></i>Esperada por el ritmo de cada especie</span></div>
    </div>
    <div class="tb-c w2"><div class="tb-h">Relaciones por tipo <span>sólido: encuentro · claro: a distancia</span></div><div class="tb-tipos" id="tb-tipos"></div></div>
    <div class="tb-c"><div class="tb-h">Grupos despiertos</div><div class="tb-radar" id="tb-radar"></div>
      <div class="tb-leyl" style="gap:10px;font-size:10px"><span><i style="border-color:#f0b56c"></i>Medida</span><span><i style="border-color:#9aa2a7;border-top-style:dashed"></i>Esperada</span></div></div>
    <div class="tb-c"><div class="tb-h">Hábitats <span>despiertos</span></div><div class="tb-habs" id="tb-habs"></div></div>
    <div class="tb-c w2"><div class="tb-h">Encuentros por hora <span id="tb-tot">hoy · 0</span></div>
      <div class="tb-col" id="tb-col"><svg viewBox="0 0 400 96" preserveAspectRatio="none" aria-label="Encuentros nuevos en cada hora del día"></svg><div class="tb-tip" id="tb-tip2"></div></div>
      <div class="tb-ejes"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div></div>
    <div class="tb-c w2"><div class="tb-h">Lo que está pasando <span>toca para verlo</span></div><div class="tb-feed" id="tb-feed"><div class="tb-vacio">Esperando encuentros…</div></div></div>
    <div class="tb-nota">Indicadores calculados en vivo sobre los ${AG.length.toLocaleString('es-CO')} agentes no humanos de la simulación y la Red de Interacciones Bióticas de Kennedy. El ritmo de 24 horas de cada especie (aves diurnas con coro del alba, polinizadores y reptiles con el sol, fauna nocturna) es un supuesto de modelación [SUP]: al terminar cada pausa, un animal sigue en reposo con probabilidad 1 − actividad. Encuentro: dos agentes relacionados a menos de ${CERCA} m.</div>
  </div>`;
  document.body.appendChild(tb);
  const $ = (id) => tb.querySelector('#' + id);

  // botón en la barra inferior (antes de JUGAR)
  const hud = document.getElementById('hud-c'), pj = document.getElementById('b-pajaro');
  const btn = document.createElement('button'); btn.id = 'b-tablero'; btn.title = 'Tablero de indicadores de las relaciones bióticas, en vivo';
  btn.innerHTML = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/></svg>Tablero';
  if (hud) { if (pj && pj.parentElement === hud) hud.insertBefore(btn, pj); else hud.appendChild(btn); } else { btn.style.cssText = 'position:fixed;z-index:12;right:14px;bottom:20px'; document.body.appendChild(btn); }
  const abrir = (on) => { document.body.classList.toggle('tb-abierto', on); btn.classList.toggle('on', on); if (on) pintar(); };
  btn.onclick = () => abrir(!document.body.classList.contains('tb-abierto'));
  tb.querySelector('.tb-x').onclick = () => abrir(false);

  // hora: arrastrar sobre la banda del día mueve el reloj de la simulación
  const rango = $('tb-rango');
  rango.addEventListener('input', () => { const r = T3.reloj; if (r) { r.t = +rango.value; tick(); pintar(); } });
  $('tb-bmod').setAttribute('points', MOD.map((v, i) => `${(i / 95 * 100).toFixed(2)},${(27 - v * 24).toFixed(2)}`).join(' '));

  // tipos de relación: barras; tocar una prende o apaga ese tipo en el 3D (igual que en el panel de la red biótica)
  const tipos = $('tb-tipos');
  tipos.innerHTML = TIPOS.map(t => `<button class="tb-tipo" data-t="${t.id}" title="Mostrar u ocultar ${esc(t.n)} en el territorio"><span><i style="background:${t.c}"></i>${esc(t.n)}</span><div class="bar"><i class="a" style="background:${t.c};width:0"></i><i class="e" style="background:${t.c};width:0"></i></div><b>0</b></button>`).join('');
  tipos.querySelectorAll('.tb-tipo').forEach(b => b.onclick = () => {
    const t = +b.dataset.t; if (ESTADO.tipos.has(t)) ESTADO.tipos.delete(t); else ESTADO.tipos.add(t);
    const off = !ESTADO.tipos.has(t); b.classList.toggle('off', off); const o = document.querySelector(`#bt-pan .bt-tipo[data-t="${t}"]`); if (o) o.classList.toggle('off', off);
  });

  // radar de grupos
  const RX = 110, RY = 92, RR = 64, ang = (i) => -Math.PI / 2 + i / GR.length * Math.PI * 2;
  const pr = (i, v) => [RX + Math.cos(ang(i)) * RR * v, RY + Math.sin(ang(i)) * RR * v];
  { let s = `<svg viewBox="0 0 220 184" aria-label="Porcentaje despierto por grupo">`;
    for (const k of [0.25, 0.5, 0.75, 1]) s += `<polygon points="${GR.map((_, i) => pr(i, k).map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="rgba(255,255,255,${k === 1 ? 0.1 : 0.05})"/>`;
    GR.forEach((c, i) => { const [x, y] = pr(i, 1), [lx, ly] = pr(i, 1.2); s += `<line x1="${RX}" y1="${RY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.05)"/><text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="${Math.abs(lx - RX) < 6 ? 'middle' : lx > RX ? 'start' : 'end'}" font-size="9" fill="#9aa2a7" font-family="Inter,system-ui,sans-serif">${esc(nomGr(c))}</text>`; });
    s += `<polygon id="tb-rmod" fill="none" stroke="#9aa2a7" stroke-width="1.2" stroke-dasharray="3 3"/><polygon id="tb-rmed" fill="rgba(226,165,91,.2)" stroke="#f0b56c" stroke-width="1.6" stroke-linejoin="round"/>`;
    s += GR.map((_, i) => `<circle id="tb-rp${i}" r="2.6" fill="#f0b56c" stroke="rgba(13,15,18,.9)" stroke-width="1.5"/>`).join('') + '</svg>';
    $('tb-radar').innerHTML = s; }

  // hábitats
  $('tb-habs').innerHTML = HABS.slice(0, 6).map((h, i) => `<div class="tb-hab"><div><span>${esc(h.n.replace('Humedal ', 'H. '))}</span><b id="tb-h${i}">0/${h.ag.length}</b></div><p><i id="tb-hb${i}" style="width:0"></i></p></div>`).join('');

  // columnas por hora
  const colSvg = $('tb-col').querySelector('svg');
  { let s = ''; for (let h = 0; h < 24; h++) { const x = h / 24 * 400 + 3; s += `<rect id="tb-cb${h}" x="${x.toFixed(1)}" y="92" width="${(400 / 24 - 6).toFixed(1)}" height="2" rx="2" fill="rgba(255,255,255,.07)"/>`; } colSvg.innerHTML = s; }

  /* ---------- toma de datos (siempre, dos veces por segundo) ---------- */
  const nombreDe = (o, L) => o.id !== undefined ? ESP[o.e].n : ((L && flora[L.f] && flora[L.f].n) || o.n || 'árbol');
  function tick() {
    const r = T3.reloj, t = r && r.t >= 0 ? r.t : 540, dia = r ? r.dia : 1, h = (t / 60) % 24;
    if (dia !== diaAct) { diaAct = dia; MED.fill(null); HORA.fill(0); }
    let mov = 0, ale = 0, rep = 0; const gr = {}; for (const c of GR) gr[c] = [0, 0];
    const hab = HABS.map(() => 0), ix = new Map(HABS.map((x, i) => [x, i]));
    for (const a of AG) {
      const g = gr[ESP[a.e].cat]; g[1]++;
      if (a.duerme) { rep++; continue; }
      g[0]++;
      if (a.vel > 0.02 || a.st === 'liba' || a.salto || a.st === 'vuelo') mov++; else ale++;
    }
    HABS.forEach((x, i) => { let n = 0; for (const a of x.ag) if (!a.duerme) n++; hab[i] = n; });
    const act = (mov + ale) / AG.length; MED[Math.floor(t / 15) % 96] = act;
    let con = 0, enc = 0; for (let i = 0; i < CUENTA.length; i++) { con += CUENTA[i]; enc += ENC[i]; }
    // encuentros nuevos: el enlace pasa de "a distancia" a "encuentro"
    // (una pareja cuenta otra vez solo si pasaron 60 s reales desde su último encuentro: así no cuenta el ir y venir en el borde de los 18 m)
    const nuevos = [], ahora = performance.now();
    for (const L of LINKS.values()) {
      if (L.al < 0.3) continue;
      if (Math.hypot(L.b.x - L.a.x, L.b.z - L.a.z) >= CERCA) continue;
      const k = L.a.id + '|' + (L.b.id !== undefined ? 'a' + L.b.id : 'f' + Math.round(L.b.x) + ',' + Math.round(L.b.z)), u0 = VISTO.get(k);
      if (primado && (u0 === undefined || ahora - u0 > 60000)) { HORA[Math.floor(h)]++; nuevos.push(L); }
      VISTO.set(k, ahora);
    }
    if (VISTO.size > 20000) for (const [k, u0] of VISTO) if (ahora - u0 > 60000) VISTO.delete(k);
    primado = true;
    if (nuevos.length && performance.now() > tFeed) {
      const L = nuevos[Math.floor(Math.random() * nuevos.length)]; tFeed = performance.now() + 1600;
      FEED.unshift({ t, L, a: L.a, txt: `${nombreDe(L.a)} → ${nombreDe(L.b, L)}`, tipo: L.t, hab: L.a.h.n }); if (FEED.length > 6) FEED.pop(); ult.feedNuevo = true;
    }
    Object.assign(ult, { t, h, dia, mov, ale, rep, act, gr, hab, con, enc });
  }

  /* ---------- dibujo (solo con el tablero abierto) ---------- */
  const C = 2 * Math.PI * 40;
  const arco = (el, desde, frac, gap = 0) => { const l = Math.max(0, frac * C - gap); el.setAttribute('stroke-dasharray', `${l.toFixed(2)} ${C}`); el.setAttribute('stroke-dashoffset', (-desde * C).toFixed(2)); };
  const fase = (h) => h < 4.75 ? 'Noche · fauna nocturna activa' : h < 5.67 ? 'Madrugada · alba' : h < 9 ? 'Amanecer · coro del alba' : h < 11.5 ? 'Mañana · forrajeo' : h < 14.5 ? 'Mediodía · polinizadores y reptiles al sol' : h < 17 ? 'Tarde · forrajeo' : h < 18.6 ? 'Atardecer · regreso a los dormideros' : h < 20 ? 'Anochecer · relevo nocturno' : 'Noche · fauna nocturna activa';
  const X = (i) => i / 95 * 400, Y = (v) => 110 - v * 100;
  $('tb-pmod').setAttribute('d', MOD.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(''));
  function pintar() {
    if (!document.body.classList.contains('tb-abierto')) return;
    const u = ult, r = T3.reloj;
    $('tb-hora').textContent = hhmm(u.t); $('tb-fase').textContent = fase(u.h);
    $('tb-dia').textContent = `DÍA ${u.dia}${r && r.play === false ? ' · EN PAUSA' : ''}`;
    $('tb-vel').textContent = r ? `reloj x${r.vel}` : '';
    $('tb-enc').textContent = u.enc.toLocaleString('es-CO');
    if (document.activeElement !== rango) rango.value = Math.floor(u.t);
    const bx = (u.t / 1440 * 100).toFixed(2); $('tb-bcur').setAttribute('x1', bx); $('tb-bcur').setAttribute('x2', bx);
    // anillo de actividad
    const N = AG.length; arco($('tb-r1'), 0, u.mov / N, u.ale ? 1.5 : 0); arco($('tb-r2'), u.mov / N, u.ale / N, 1.5);
    $('tb-act').innerHTML = `${pct(u.act)}<small>%</small>`; $('tb-l1').textContent = u.mov; $('tb-l2').textContent = u.ale; $('tb-l3').textContent = u.rep;
    // anillo de la red
    arco($('tb-r3'), 0, u.con ? u.enc / u.con : 0);
    $('tb-con').textContent = u.con.toLocaleString('es-CO'); $('tb-con').style.fontSize = u.con >= 1000 ? '17px' : ''; $('tb-l4').textContent = u.enc; $('tb-l5').textContent = Math.max(0, u.con - u.enc); $('tb-l6').textContent = (u.con ? pct(u.enc / u.con) : 0) + ' %';
    // línea de 24 h: tramos continuos de lo medido
    let d = '', area = '', tramo = [];
    const cerrar = () => { if (tramo.length > 1) { const p = tramo.map(([i, v], k) => (k ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(''); d += p; area += p + `L${X(tramo[tramo.length - 1][0]).toFixed(1)} 110L${X(tramo[0][0]).toFixed(1)} 110Z`; } tramo = []; };
    for (let i = 0; i < 96; i++) { if (MED[i] === null) cerrar(); else tramo.push([i, MED[i]]); } cerrar();
    $('tb-pmed').setAttribute('d', d); $('tb-pglow').setAttribute('d', d); $('tb-parea').setAttribute('d', area);
    const cx = (u.t / 1440 * 400).toFixed(1); $('tb-lcur').setAttribute('x1', cx); $('tb-lcur').setAttribute('x2', cx);
    // tipos
    const maxT = Math.max(1, ...CUENTA);
    tipos.querySelectorAll('.tb-tipo').forEach(b => { const t = +b.dataset.t; b.querySelector('i.a').style.width = (CUENTA[t] / maxT * 100).toFixed(1) + '%'; b.querySelector('i.e').style.width = (ENC[t] / maxT * 100).toFixed(1) + '%'; b.querySelector('b').textContent = CUENTA[t]; b.classList.toggle('off', !ESTADO.tipos.has(t)); });
    // radar
    const vm = GR.map(c => u.gr[c] && u.gr[c][1] ? u.gr[c][0] / u.gr[c][1] : 0), ve = GR.map(c => modGr(c, u.h));
    $('tb-rmed').setAttribute('points', vm.map((v, i) => pr(i, Math.max(0.03, v)).map(q => q.toFixed(1)).join(',')).join(' '));
    $('tb-rmod').setAttribute('points', ve.map((v, i) => pr(i, Math.max(0.03, v)).map(q => q.toFixed(1)).join(',')).join(' '));
    vm.forEach((v, i) => { const [x, y] = pr(i, Math.max(0.03, v)); const c = $('tb-rp' + i); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); });
    // hábitats
    HABS.slice(0, 6).forEach((x, i) => { $('tb-h' + i).textContent = `${u.hab[i]}/${x.ag.length}`; $('tb-hb' + i).style.width = (u.hab[i] / x.ag.length * 100).toFixed(1) + '%'; });
    // columnas
    const maxH = Math.max(4, ...HORA), hAct = Math.floor(u.h);
    let tot = 0; for (let k = 0; k < 24; k++) { tot += HORA[k]; const el = $('tb-cb' + k), hh = HORA[k] ? Math.max(3, HORA[k] / maxH * 84) : 2; el.setAttribute('y', (94 - hh).toFixed(1)); el.setAttribute('height', hh.toFixed(1)); el.setAttribute('fill', k === hAct ? '#f0b56c' : HORA[k] ? 'rgba(226,165,91,.45)' : 'rgba(255,255,255,.07)'); }
    $('tb-tot').textContent = `hoy · ${tot.toLocaleString('es-CO')}`;
    // lo que está pasando
    if (ult.feedNuevo || !$('tb-feed').dataset.ok) {
      ult.feedNuevo = false; $('tb-feed').dataset.ok = 1;
      if (FEED.length) $('tb-feed').innerHTML = FEED.map((f, i) => `<div class="tb-ev" data-i="${i}"><time>${hhmm(f.t)}</time><div><div class="t">${esc(f.txt)}</div><small><i style="background:${TIPOS[f.tipo].c}"></i>${esc(TIPOS[f.tipo].n)} · ${esc(f.hab)}</small></div></div>`).join('');
      $('tb-feed').querySelectorAll('.tb-ev').forEach(el => el.onclick = () => { const f = FEED[+el.dataset.i]; if (f && f.a && bio.seleccionar) bio.seleccionar(f.a, true); });
    }
  }

  // ayudas al pasar el puntero: línea de 24 h y columnas
  const lin = $('tb-lin'), tip1 = $('tb-tip1'), hov = $('tb-lhov');
  lin.addEventListener('pointermove', (e) => {
    const rc = lin.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - rc.left) / rc.width)), i = Math.round(f * 95);
    hov.style.display = ''; hov.setAttribute('x1', X(i)); hov.setAttribute('x2', X(i));
    tip1.style.display = 'block'; tip1.innerHTML = `<b>${hhmm(i * 15)}</b><span><i style="background:#f0b56c"></i>Medida ${MED[i] === null ? '—' : pct(MED[i]) + ' %'}</span><span><i style="background:#9aa2a7"></i>Esperada ${pct(MOD[i])} %</span>`;
    const w = tip1.offsetWidth; tip1.style.left = Math.min(rc.width - w, Math.max(0, f * rc.width + 10)) + 'px'; tip1.style.top = '6px';
  });
  lin.addEventListener('pointerleave', () => { hov.style.display = 'none'; tip1.style.display = 'none'; });
  const col = $('tb-col'), tip2 = $('tb-tip2');
  col.addEventListener('pointermove', (e) => {
    const rc = col.getBoundingClientRect(), f = Math.max(0, Math.min(0.999, (e.clientX - rc.left) / rc.width)), k = Math.floor(f * 24);
    tip2.style.display = 'block'; tip2.innerHTML = `<b>${String(k).padStart(2, '0')}:00 – ${String(k + 1).padStart(2, '0')}:00</b>${HORA[k].toLocaleString('es-CO')} encuentros nuevos`;
    const w = tip2.offsetWidth; tip2.style.left = Math.min(rc.width - w, Math.max(0, f * rc.width + 10)) + 'px'; tip2.style.top = '0px';
  });
  col.addEventListener('pointerleave', () => { tip2.style.display = 'none'; });

  tick(); setInterval(() => { tick(); pintar(); }, 500);
  return { abrir, tb };
}
