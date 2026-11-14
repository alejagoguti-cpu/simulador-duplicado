/* ============ TABLERO · RELACIONES BIÓTICAS ============
   Indicadores en vivo de la red biótica del simulador (data3d/biotica.js), en un solo panel sobrio: secciones separadas
   por líneas finas, cifras en texto y gráficas simples (sin anillos, radares ni brillos).
   - Actividad: cada especie tiene un ritmo de 24 horas [SUP] (actividad(k, h) en biotica.js); al terminar cada pausa el animal
     sigue en reposo con probabilidad 1 - actividad. "Esperada" = promedio del ritmo; "medida" = individuos que no están en reposo.
   - Conexiones: enlaces de la red entre individuos y árboles. Encuentro: los dos a menos de 18 m (la interacción ocurre).
   Se actualiza dos veces por segundo; los datos se acumulan aunque el tablero esté cerrado. */
export function iniciarTablero({ T3, bio }) {
  const { AG, ESP, LINKS, TIPOS, CAT, CUENTA, ENC, CERCA, flora, actividad, ESTADO } = bio;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hhmm = (min) => { min = ((Math.floor(min) % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); };
  const pct = (v) => Math.round(v * 100);
  const num = (v) => v.toLocaleString('es-CO');

  /* ---------- datos fijos ---------- */
  const GR = [...new Set(AG.map(a => ESP[a.e].cat))].sort((p, q) => p - q);
  const nomGr = (c) => ({ 'Lombrices (suelo)': 'Lombrices', 'Flora y arbolado': 'Flora' }[CAT[c].n] || CAT[c].n);
  const grupoHab = (h) => h.tipo === 'humedal' ? h.n : h.tipo === 'huerta' ? 'Huertas urbanas' : h.cnt ? (/bavaria/i.test(h.n) ? 'Bosque de Bavaria' : h.n) : 'Parques y zonas verdes';
  const HABS = []; { const m = new Map(); for (const a of AG) { const k = grupoHab(a.h); if (!m.has(k)) { const o = { n: k, ag: [] }; m.set(k, o); HABS.push(o); } m.get(k).ag.push(a); } HABS.sort((p, q) => q.ag.length - p.ag.length); }
  const MOD = Array.from({ length: 96 }, (_, i) => { let s = 0; for (const a of AG) s += actividad(a.e, i / 4); return s / AG.length; });
  const MODG = {}; for (const c of GR) { const L = AG.filter(a => ESP[a.e].cat === c); MODG[c] = Array.from({ length: 48 }, (_, i) => L.reduce((s, a) => s + actividad(a.e, i / 2), 0) / L.length); }

  /* ---------- series ---------- */
  let diaAct = -1, primado = false, tFeed = 0;
  const MED = new Array(96).fill(null), FEED = [], VISTO = new Map();
  let ult = { t: 0, h: 0, dia: 1, mov: 0, ale: 0, rep: 0, act: 0, gr: {}, hab: [], con: 0, enc: 0 };

  /* ---------- estilos: los mismos tokens de ui_sobrio.css ---------- */
  const css = document.createElement('style'); css.textContent = `
#tb{position:fixed;z-index:13;right:14px;top:14px;bottom:84px;width:400px;display:none;flex-direction:column;overflow:hidden;
  font:400 12px var(--ui-sans,'Inter',system-ui,sans-serif);color:var(--ui-tx,#e9ebec);background:var(--ui-bg,rgba(13,15,18,.8));
  border:1px solid var(--ui-bd,rgba(255,255,255,.075));border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.28);
  -webkit-backdrop-filter:blur(16px) saturate(1.1);backdrop-filter:blur(16px) saturate(1.1);font-variant-numeric:tabular-nums}
body.tb-abierto #tb{display:flex}
body.tb-abierto #dock{display:none}
#tb .cab{flex:none;display:flex;align-items:center;justify-content:space-between;padding:12px 12px 12px 16px;border-bottom:1px solid var(--ui-bd,rgba(255,255,255,.075))}
#tb .cab h2{margin:0;font:500 13px var(--ui-sans,sans-serif)}
#tb .cab h2 span{color:var(--ui-tx3,#646c71);font-weight:400;margin-left:6px}
#tb .x{width:26px;height:26px;border:0;border-radius:6px;background:none;color:var(--ui-tx2,#9aa2a7);font:300 18px/1 var(--ui-sans,sans-serif);cursor:pointer}
#tb .x:hover{background:rgba(255,255,255,.06);color:var(--ui-tx,#e9ebec)}
#tb .cuerpo{overflow:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.12) transparent}
#tb .sec{padding:14px 16px;border-top:1px solid var(--ui-bd,rgba(255,255,255,.075))}
#tb .sec:first-child{border-top:0}
#tb .tit{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:0 0 10px;font-size:12px;font-weight:500}
#tb .tit span{font-weight:400;font-size:11px;color:var(--ui-tx3,#646c71);text-align:right}
#tb .hora{display:flex;align-items:baseline;gap:12px}
#tb .hora b{font:300 34px/1 var(--ui-sans,sans-serif);letter-spacing:-.01em}
#tb .hora span{color:var(--ui-tx2,#9aa2a7);font-size:12px;line-height:1.35}
#tb .kpis{display:grid;grid-template-columns:repeat(3,1fr);margin-top:14px}
#tb .kpis div{padding:0 12px;border-left:1px solid var(--ui-bd,rgba(255,255,255,.075))}
#tb .kpis div:first-child{padding-left:0;border-left:0}
#tb .kpis b{display:block;font:400 20px/1.1 var(--ui-sans,sans-serif)}
#tb .kpis small{display:block;margin-top:3px;font-size:11px;color:var(--ui-tx3,#646c71)}
#tb .graf{position:relative;touch-action:none;cursor:ew-resize}
#tb .graf svg{display:block;width:100%;height:118px}
#tb .ejes{display:flex;justify-content:space-between;margin-top:4px;font-size:10px;color:var(--ui-tx3,#646c71)}
#tb .ley{display:flex;gap:16px;margin-top:8px;font-size:11px;color:var(--ui-tx2,#9aa2a7)}
#tb .ley span{display:flex;align-items:center;gap:6px}#tb .ley i{width:14px;border-top:1.5px solid}
#tb .filas{display:grid;gap:7px}
#tb .fila{display:grid;grid-template-columns:minmax(0,1fr) 96px 54px;gap:10px;align-items:center;width:100%;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left}
#tb button.fila{cursor:pointer}
#tb button.fila:hover .n{color:var(--ui-acc-tx,#f2c995)}
#tb .fila.off{opacity:.35}
#tb .fila .n{display:flex;align-items:center;gap:8px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ui-tx,#e9ebec)}
#tb .fila .n i{flex:none;width:6px;height:6px;border-radius:50%}
#tb .fila .v{text-align:right;color:var(--ui-tx2,#9aa2a7);font-size:11px}
#tb .fila .v b{color:var(--ui-tx,#e9ebec);font-weight:400}
#tb .barra{position:relative;height:3px;border-radius:2px;background:rgba(255,255,255,.07)}
#tb .barra i{position:absolute;left:0;top:0;bottom:0;border-radius:2px;transition:width .4s ease}
#tb .barra .t{background:rgba(255,255,255,.22)}#tb .barra .e{background:var(--ui-acc,#e2a55b)}
#tb .grupo{grid-template-columns:76px minmax(0,1fr) 38px}
#tb .grupo svg{display:block;width:100%;height:20px}
#tb .grupo .v{color:var(--ui-tx,#e9ebec)}
#tb .bit{display:grid;gap:0}
#tb .ev{display:grid;grid-template-columns:40px 1fr;gap:8px;padding:7px 0;border-top:1px solid rgba(255,255,255,.045);cursor:pointer}
#tb .ev:first-child{border-top:0;padding-top:0}
#tb .ev time{color:var(--ui-tx3,#646c71);font-size:11px}
#tb .ev div{line-height:1.4}
#tb .ev small{display:block;font-size:11px;color:var(--ui-tx3,#646c71)}
#tb .ev:hover div>span{color:var(--ui-acc-tx,#f2c995)}
#tb .vacio{color:var(--ui-tx3,#646c71)}
#tb .nota{padding:12px 16px 16px;border-top:1px solid var(--ui-bd,rgba(255,255,255,.075));font-size:10.5px;line-height:1.5;color:var(--ui-tx3,#646c71)}
#b-tablero svg{opacity:.8}
@media(max-width:760px){
  #tb{left:8px;right:8px;width:auto;top:auto;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 64px);height:min(72vh,700px);z-index:26}
  #tb .fila{grid-template-columns:minmax(0,1fr) 70px 50px}
  body #hud-c{max-width:calc(100vw - 16px);padding:3px!important}
  body #hud-c button{padding:10px 4px!important;letter-spacing:.02em!important;font-size:10px!important}
  body #hud-c #b-pajaro{padding:10px 10px!important;letter-spacing:.08em!important}
  body #hud-c #b-tablero{font-size:0!important;letter-spacing:0!important;padding:10px 13px!important}
  body #hud-c #b-tablero svg{margin:0!important}
}`;
  document.head.appendChild(css);

  /* ---------- estructura ---------- */
  const W = 360, HG = 118, Y0 = 104, AMP = 92, X = (i, n) => i / (n - 1) * W, Y = (v) => Y0 - v * AMP;
  // noche (antes de las 5:45 y después de las 18:45) como un sombreado suave detrás de la curva
  const noche = `<rect x="0" y="0" width="${(5.75 / 24 * W).toFixed(1)}" height="${Y0}" fill="rgba(0,0,0,.22)"/><rect x="${(18.75 / 24 * W).toFixed(1)}" y="0" width="${(W - 18.75 / 24 * W).toFixed(1)}" height="${Y0}" fill="rgba(0,0,0,.22)"/>`;
  const tb = document.createElement('section'); tb.id = 'tb'; tb.setAttribute('aria-label', 'Tablero de relaciones bióticas');
  tb.innerHTML = `
  <div class="cab"><h2>Relaciones bióticas<span>tablero</span></h2><button class="x" aria-label="Cerrar">×</button></div>
  <div class="cuerpo">
    <div class="sec">
      <div class="hora"><b id="tb-hora">00:00</b><span id="tb-fase"></span></div>
      <div class="kpis"><div><b id="tb-k1">0 %</b><small>despiertos</small></div><div><b id="tb-k2">0</b><small>conexiones</small></div><div><b id="tb-k3">0</b><small>encuentros ahora</small></div></div>
    </div>
    <div class="sec">
      <div class="tit">Actividad durante el día<span id="tb-lect">arrastra para cambiar la hora</span></div>
      <div class="graf" id="tb-graf"><svg viewBox="0 0 ${W} ${HG}" preserveAspectRatio="none" aria-label="Porcentaje de individuos despiertos durante el día">
        ${noche}
        ${[0.5, 1].map(v => `<line x1="0" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(255,255,255,.06)" vector-effect="non-scaling-stroke"/>`).join('')}
        <line x1="0" x2="${W}" y1="${Y0}" y2="${Y0}" stroke="rgba(255,255,255,.14)" vector-effect="non-scaling-stroke"/>
        <path id="tb-pmod" fill="none" stroke="#7d858a" stroke-width="1.2" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>
        <path id="tb-parea" fill="rgba(226,165,91,.10)"/>
        <path id="tb-pmed" fill="none" stroke="#e2a55b" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <line id="tb-cur" y1="0" y2="${Y0}" stroke="#e9ebec" stroke-width="1" vector-effect="non-scaling-stroke"/>
      </svg></div>
      <div class="ejes"><span>0 h</span><span>6</span><span>12</span><span>18</span><span>24</span></div>
      <div class="ley"><span><i style="border-color:#e2a55b"></i>Medida</span><span><i style="border-color:#7d858a;border-top-style:dashed"></i>Esperada según cada especie</span></div>
    </div>
    <div class="sec"><div class="tit">Interacciones ahora<span>encuentros / conexiones</span></div><div class="filas" id="tb-tipos"></div></div>
    <div class="sec"><div class="tit">Grupos<span>ritmo de 24 h · despiertos</span></div><div class="filas" id="tb-grupos"></div></div>
    <div class="sec"><div class="tit">Hábitats<span>despiertos / individuos</span></div><div class="filas" id="tb-habs"></div></div>
    <div class="sec"><div class="tit">Bitácora<span>toca para ir al lugar</span></div><div class="bit" id="tb-feed"><div class="vacio">Esperando encuentros…</div></div></div>
    <div class="nota">Calculado en vivo sobre los ${num(AG.length)} agentes no humanos de la simulación y la Red de Interacciones Bióticas de Kennedy. El ritmo de 24 horas de cada especie es un supuesto de modelación [SUP]: aves con coro del alba y pico de la tarde, polinizadores y reptiles con el sol, fauna nocturna. Encuentro: dos agentes relacionados a menos de ${CERCA} m.</div>
  </div>`;
  document.body.appendChild(tb);
  const $ = (id) => tb.querySelector('#' + id);

  // botón en la barra inferior (antes de JUGAR)
  const hud = document.getElementById('hud-c'), pj = document.getElementById('b-pajaro');
  const btn = document.createElement('button'); btn.id = 'b-tablero'; btn.title = 'Tablero de las relaciones bióticas, en vivo';
  btn.innerHTML = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/></svg>Tablero';
  if (hud) { if (pj && pj.parentElement === hud) hud.insertBefore(btn, pj); else hud.appendChild(btn); } else { btn.style.cssText = 'position:fixed;z-index:12;right:14px;bottom:20px'; document.body.appendChild(btn); }
  const abrir = (on) => { document.body.classList.toggle('tb-abierto', on); btn.classList.toggle('on', on); if (on) pintar(); };
  btn.onclick = () => abrir(!document.body.classList.contains('tb-abierto'));
  tb.querySelector('.x').onclick = () => abrir(false);

  // gráfica del día: la curva esperada es fija; arrastrar sobre ella mueve el reloj; pasar el puntero lee los valores
  $('tb-pmod').setAttribute('d', MOD.map((v, i) => (i ? 'L' : 'M') + X(i, 96).toFixed(1) + ' ' + Y(v).toFixed(1)).join(''));
  const graf = $('tb-graf'), lect = $('tb-lect'); let arr = false;
  const enGraf = (e) => { const r = graf.getBoundingClientRect(); return Math.max(0, Math.min(0.9999, (e.clientX - r.left) / r.width)); };
  const leer = (f) => { const i = Math.round(f * 95); lect.textContent = `${hhmm(i * 15)} · medida ${MED[i] === null ? '–' : pct(MED[i]) + ' %'} · esperada ${pct(MOD[i])} %`; };
  graf.addEventListener('pointerdown', (e) => { arr = true; graf.setPointerCapture(e.pointerId); mover(e); });
  graf.addEventListener('pointermove', (e) => { if (arr) mover(e); else leer(enGraf(e)); });
  const soltar = () => { arr = false; }; graf.addEventListener('pointerup', soltar); graf.addEventListener('pointercancel', soltar);
  graf.addEventListener('pointerleave', () => { if (!arr) lect.textContent = 'arrastra para cambiar la hora'; });
  function mover(e) { const f = enGraf(e), r = T3.reloj; if (r) { r.t = Math.round(f * 1440 / 5) * 5; tick(); pintar(); } leer(f); }

  // interacciones por tipo: tocar una prende o apaga ese tipo en el 3D (igual que en el panel de la red biótica)
  const tipos = $('tb-tipos');
  tipos.innerHTML = TIPOS.map(t => `<button class="fila" data-t="${t.id}" title="Mostrar u ocultar en el territorio"><span class="n"><i style="background:${t.c}"></i>${esc(t.n)}</span><span class="barra"><i class="t" style="width:0"></i><i class="e" style="width:0"></i></span><span class="v">0</span></button>`).join('');
  tipos.querySelectorAll('.fila').forEach(b => b.onclick = () => {
    const t = +b.dataset.t; if (ESTADO.tipos.has(t)) ESTADO.tipos.delete(t); else ESTADO.tipos.add(t);
    const off = !ESTADO.tipos.has(t); b.classList.toggle('off', off); const o = document.querySelector(`#bt-pan .bt-tipo[data-t="${t}"]`); if (o) o.classList.toggle('off', off);
  });

  // grupos: la curva de 24 h de cada grupo (esperada) con la hora actual marcada
  const SW = 120, SH = 20, sy = (v) => SH - 2 - v * (SH - 4);
  $('tb-grupos').innerHTML = GR.map(c => `<div class="fila grupo"><span class="n">${esc(nomGr(c))}</span>
    <svg viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none" aria-hidden="true"><path d="${MODG[c].map((v, i) => (i ? 'L' : 'M') + (i / 47 * SW).toFixed(1) + ' ' + sy(v).toFixed(1)).join('')}" fill="none" stroke="#7d858a" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <line id="tb-gl${c}" y1="0" y2="${SH}" stroke="rgba(255,255,255,.18)" vector-effect="non-scaling-stroke"/><circle id="tb-gp${c}" r="2.2" fill="#e2a55b"/></svg>
    <span class="v" id="tb-gv${c}">0 %</span></div>`).join('');

  // hábitats
  const NH = HABS.length;
  $('tb-habs').innerHTML = HABS.map((h, i) => `<div class="fila"><span class="n">${esc(h.n)}</span><span class="barra"><i class="e" id="tb-hb${i}" style="width:0"></i></span><span class="v" id="tb-h${i}">0</span></div>`).join('');

  /* ---------- toma de datos (siempre, dos veces por segundo) ---------- */
  const nombreDe = (o, L) => o.id !== undefined ? ESP[o.e].n : ((L && flora[L.f] && flora[L.f].n) || o.n || 'árbol');
  const VERBO = { 0: 'caza a', 1: 'se alimenta de', 2: 'dispersa semillas de', 3: 'coopera con', 4: 'se refugia en', 5: 'visita las flores de', 6: 'anida en', 7: 'parasita el nido de', 8: 'compite con' };
  function tick() {
    const r = T3.reloj, t = r && r.t >= 0 ? r.t : 540, dia = r ? r.dia : 1, h = (t / 60) % 24;
    if (dia !== diaAct) { diaAct = dia; MED.fill(null); }
    let mov = 0, ale = 0, rep = 0; const gr = {}; for (const c of GR) gr[c] = [0, 0];
    for (const a of AG) {
      const g = gr[ESP[a.e].cat]; g[1]++;
      if (a.duerme) { rep++; continue; }
      g[0]++;
      if (a.vel > 0.02 || a.st === 'liba' || a.salto || a.st === 'vuelo') mov++; else ale++;
    }
    const hab = HABS.map(x => { let n = 0; for (const a of x.ag) if (!a.duerme) n++; return n; });
    const act = (mov + ale) / AG.length; MED[Math.floor(t / 15) % 96] = act;
    let con = 0, enc = 0; for (let i = 0; i < CUENTA.length; i++) { con += CUENTA[i]; enc += ENC[i]; }
    // encuentros nuevos para la bitácora (una pareja vuelve a contar solo si pasaron 60 s reales desde su último encuentro)
    const nuevos = [], ahora = performance.now();
    for (const L of LINKS.values()) {
      if (L.al < 0.3 || Math.hypot(L.b.x - L.a.x, L.b.z - L.a.z) >= CERCA) continue;
      const k = L.a.id + '|' + (L.b.id !== undefined ? 'a' + L.b.id : 'f' + Math.round(L.b.x) + ',' + Math.round(L.b.z)), u0 = VISTO.get(k);
      if (primado && (u0 === undefined || ahora - u0 > 60000)) nuevos.push(L);
      VISTO.set(k, ahora);
    }
    if (VISTO.size > 20000) for (const [k, u0] of VISTO) if (ahora - u0 > 60000) VISTO.delete(k);
    primado = true;
    if (nuevos.length && ahora > tFeed) {
      const L = nuevos[Math.floor(Math.random() * nuevos.length)]; tFeed = ahora + 2500;
      FEED.unshift({ t, a: L.a, txt: `${nombreDe(L.a)} ${VERBO[L.t] || '→'} ${nombreDe(L.b, L).toLowerCase()}`, tipo: L.t, hab: L.a.h.n }); if (FEED.length > 5) FEED.pop(); ult.feedNuevo = true;
    }
    Object.assign(ult, { t, h, dia, mov, ale, rep, act, gr, hab, con, enc });
  }

  /* ---------- dibujo (solo con el tablero abierto) ---------- */
  const fase = (h) => h < 4.75 ? 'Noche, fauna nocturna activa' : h < 5.67 ? 'Madrugada' : h < 9 ? 'Amanecer, coro del alba' : h < 11.5 ? 'Mañana, forrajeo' : h < 14.5 ? 'Mediodía, polinizadores y reptiles al sol' : h < 17 ? 'Tarde, forrajeo' : h < 18.6 ? 'Atardecer, regreso a los dormideros' : h < 20 ? 'Anochecer, relevo nocturno' : 'Noche, fauna nocturna activa';
  function pintar() {
    if (!document.body.classList.contains('tb-abierto')) return;
    const u = ult, r = T3.reloj;
    $('tb-hora').textContent = hhmm(u.t);
    $('tb-fase').innerHTML = `${fase(u.h)}<br>Día ${u.dia}${r && r.play === false ? ', en pausa' : ''}`;
    $('tb-k1').textContent = pct(u.act) + ' %'; $('tb-k2').textContent = num(u.con); $('tb-k3').textContent = num(u.enc);
    // curva medida (tramos continuos)
    let d = '', area = '', tr = [];
    const cerrar = () => { if (tr.length > 1) { const p = tr.map(([i, v], k) => (k ? 'L' : 'M') + X(i, 96).toFixed(1) + ' ' + Y(v).toFixed(1)).join(''); d += p; area += p + `L${X(tr[tr.length - 1][0], 96).toFixed(1)} ${Y0}L${X(tr[0][0], 96).toFixed(1)} ${Y0}Z`; } tr = []; };
    for (let i = 0; i < 96; i++) { if (MED[i] === null) cerrar(); else tr.push([i, MED[i]]); } cerrar();
    $('tb-pmed').setAttribute('d', d); $('tb-parea').setAttribute('d', area);
    const cx = (u.t / 1440 * W).toFixed(1); $('tb-cur').setAttribute('x1', cx); $('tb-cur').setAttribute('x2', cx);
    // tipos
    const maxT = Math.max(1, ...CUENTA);
    tipos.querySelectorAll('.fila').forEach(b => { const t = +b.dataset.t; b.querySelector('.t').style.width = (CUENTA[t] / maxT * 100).toFixed(1) + '%'; b.querySelector('.e').style.width = (ENC[t] / maxT * 100).toFixed(1) + '%'; b.querySelector('.v').innerHTML = `<b>${ENC[t]}</b> / ${CUENTA[t]}`; b.classList.toggle('off', !ESTADO.tipos.has(t)); });
    // grupos
    const gx = (u.h / 24 * SW).toFixed(1);
    for (const c of GR) { const g = u.gr[c] || [0, 1], v = g[1] ? g[0] / g[1] : 0; $('tb-gv' + c).textContent = pct(v) + ' %'; const l = $('tb-gl' + c); l.setAttribute('x1', gx); l.setAttribute('x2', gx); const p = $('tb-gp' + c); p.setAttribute('cx', gx); p.setAttribute('cy', sy(MODG[c][Math.round(u.h * 2) % 48]).toFixed(1)); }
    // hábitats
    for (let i = 0; i < NH; i++) { $('tb-h' + i).innerHTML = `<b>${u.hab[i]}</b> / ${HABS[i].ag.length}`; $('tb-hb' + i).style.width = (u.hab[i] / HABS[i].ag.length * 100).toFixed(1) + '%'; }
    // bitácora
    if (ult.feedNuevo) {
      ult.feedNuevo = false;
      $('tb-feed').innerHTML = FEED.map((f, i) => `<div class="ev" data-i="${i}"><time>${hhmm(f.t)}</time><div><span>${esc(f.txt)}</span><small>${esc(TIPOS[f.tipo].n)} · ${esc(f.hab)}</small></div></div>`).join('');
      $('tb-feed').querySelectorAll('.ev').forEach(el => el.onclick = () => { const f = FEED[+el.dataset.i]; if (f && f.a && bio.seleccionar) bio.seleccionar(f.a, true); });
    }
  }

  tick(); setInterval(() => { tick(); pintar(); }, 500);
  return { abrir, tb };
}
