/* ============ SIMULACIONES · SIM-01, SIM-02 y SIM-03 (documento «Modelamiento dinámico y simulación») ============
   Se corren semana a semana durante 10 años (520 semanas) en los escenarios del documento y se dibujan en el tablero.
   «Kennedy hoy» = escenario A (sin intervención). «Con la propuesta» = B o C (por defecto C).
   SIM-01 Red de huertas, abastecimiento, conocimiento y decisión
     A sin intervención · B nodo único con decisión central · C clúster con decisión rotativa
     G1 Producción = Huertas activas × Rendimiento ÷ 52 × Clima × Calidad de manejo; Autoconsumo = P × PAR02; Merma = P × PAR04; Excedente = resto
     G2 Personas alimentadas = Producción anual × (1 − pérdida en huerta) ÷ (frutas y verduras recomendadas × 365) y % de Kennedy
     G3 Dependencia de Corabastos en la zona = máx(0; 1 − Personas alimentadas ÷ Población de la zona); cae al 50 % en zona = 2 × Personas
     G4 Difusión de Bass: Adopciones = (p + q × Activos ÷ N) × (N − Activos); p = cupos × alcance ÷ N; N: B 2.506, C 5.400
     G5 m² por promotor = Área ÷ Promotores; Calidad = mín(1; c ÷ m² por promotor); c = 1.000 m²; 6 promotores al inicio
     G6 Tiempo de espera = 1 ÷ (μ − λ) si λ < μ (si no, crece la cola); μ rotativo = asambleas × μa × (1 − pérdida por relevo)
     Estreses (B y C): sequía, bloqueo del mayorista, crecimiento poblacional, revocación de baldíos por valorización del suelo.
   SIM-02 Orgánicos y compostaje: A ruta actual · B estación de compostaje barrial · C compostaje en Bavaria Común
   SIM-03 Hábitat y fauna: A sin huertas · B huertas sin criterio de ubicación · C huertas con corredores; con y sin medida antitrampa
   Los valores de partida que no da el documento están marcados [SUP] (supuestos para discutir con el grupo). */
import { SEM, AÑO, POB_K, PAR, SIMST, avisar, sim03, correrTodo } from './sim_modelos.js?v=2';
export function iniciarSimulaciones({ T3, tb, verPestana }) {
  const { P1, P2, P3 } = PAR; // los mismos parámetros que el panel de escenarios del mapa (data3d/sim_modelos.js)
  const COL = { A: '#8fb0c9', B: '#7f8a93', C: '#e2a55b' } /* los mismos del simulador: hoy azul grisáceo, propuesta ámbar */, NOMBRE = { A: 'A · sin intervención', B: 'B · nodo central', C: 'C · clúster rotativo' };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (v, d = 0) => (v == null || !isFinite(v)) ? '–' : v.toLocaleString('es-CO', { maximumFractionDigits: d, minimumFractionDigits: d });
  const fmtK = (v) => v >= 1e6 ? fmt(v / 1e6, 1) + ' M' : v >= 1e4 ? fmt(v / 1e3, 0) + ' mil' : fmt(v);


  /* ---------------- estilos ---------------- */
  const css = document.createElement('style'); css.textContent = `
#tb .sim{padding:2px 16px 8px}
#tb .sim-sub{display:flex;gap:3px;margin:0 0 10px;padding:3px;border-radius:10px;background:rgba(255,255,255,.05)}
#tb .sim-sub button{flex:1;height:30px;border:0;border-radius:7px;background:none;color:var(--ui-tx2,#9aa2a7);font:500 11.5px var(--ui-sans,Inter,sans-serif);cursor:pointer}
#tb .sim-sub button.on{background:rgba(255,255,255,.12);color:#fff}
#tb .sim-q{margin:0 0 10px;font-size:12px;line-height:1.5;color:#d6dbde}#tb .sim-q b{color:#fff;font-weight:600}
#tb .sim-esc{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:0 0 10px}
#tb .sim-esc span{font:500 9.5px var(--ui-mono,monospace);letter-spacing:.12em;color:var(--ui-tx3,#7d868c);text-transform:uppercase;margin-right:2px}
#tb .sim-esc button{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:var(--ui-tx2,#b9c1c6);font:500 11px var(--ui-sans,Inter,sans-serif);cursor:pointer}
#tb .sim-esc button i{width:8px;height:8px;border-radius:50%}
#tb .sim-esc button.on{color:#fff;border-color:var(--c);background:color-mix(in srgb,var(--c) 20%,transparent)}
#tb .sim-esc button:disabled{opacity:.35;cursor:default}
#tb .sim-kpi{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:0 0 10px}
#tb .sim-kpi div{padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}
#tb .sim-kpi b{display:block;font:300 22px/1.1 var(--ui-sans,Inter,sans-serif);color:#fff}
#tb .sim-kpi small{display:block;margin-top:3px;font-size:10.5px;line-height:1.3;color:var(--ui-tx2,#b9c1c6)}
#tb .sim-kpi em{font-style:normal;font-size:10.5px;color:var(--ui-tx3,#8e979d)}
#tb .sim-g{margin:0 0 12px;padding:10px 10px 6px;border-radius:12px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06)}
#tb .sim-g h4{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:0 0 2px;font:600 12px var(--ui-sans,Inter,sans-serif);color:#fff}
#tb .sim-g h4 span{font:400 10.5px var(--ui-sans,Inter,sans-serif);color:var(--ui-tx3,#8e979d);text-align:right}
#tb .sim-g p{margin:0 0 6px;font-size:10.5px;line-height:1.4;color:var(--ui-tx2,#aeb6bb)}
#tb .sim-g canvas{display:block;width:100%;height:150px;cursor:crosshair}
#tb .sim-ley{display:flex;flex-wrap:wrap;gap:4px 12px;margin:4px 0 0;font-size:10.5px;color:var(--ui-tx2,#b9c1c6)}
#tb .sim-ley span{display:inline-flex;align-items:center;gap:5px}#tb .sim-ley i{width:12px;height:3px;border-radius:2px}
#tb .sim-tip{position:fixed;z-index:40;pointer-events:none;display:none;padding:7px 9px;border-radius:8px;background:rgba(10,12,15,.92);border:1px solid rgba(255,255,255,.14);font:400 11px var(--ui-sans,Inter,sans-serif);color:#e9ebec;white-space:nowrap}
#tb .sim-tip b{font-weight:600}#tb .sim-tip i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px}
#tb .sim-var{margin:4px 0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}
#tb .sim-var summary{cursor:pointer;padding:9px 12px;font:600 11.5px var(--ui-sans,Inter,sans-serif);color:#fff;list-style:none}
#tb .sim-var summary::-webkit-details-marker{display:none}#tb .sim-var summary::after{content:' +';color:var(--ui-tx3,#8e979d)}#tb .sim-var[open] summary::after{content:' –'}
#tb .sim-var .cv{display:grid;gap:9px;padding:2px 12px 12px}
#tb .sim-var label{display:grid;grid-template-columns:minmax(0,1fr) 64px;gap:2px 10px;align-items:center;font-size:11px;color:var(--ui-tx2,#c0c7cb)}
#tb .sim-var label input[type=range]{grid-column:1/-1;width:100%;accent-color:#e2a55b}
#tb .sim-var label output{text-align:right;font:500 11px var(--ui-mono,monospace);color:#fff}
#tb .sim-var .chk{display:flex;flex-wrap:wrap;gap:6px}
#tb .sim-var .chk label{display:inline-flex;gap:6px;padding:5px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.1);cursor:pointer}
#tb .sim-play{display:flex;align-items:center;gap:8px;margin:0 0 10px}
#tb .sim-play button{height:30px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font:500 11.5px var(--ui-sans,Inter,sans-serif);cursor:pointer}
#tb .sim-play input{flex:1;accent-color:#e2a55b}#tb .sim-play output{font:500 11px var(--ui-mono,monospace);color:#fff;min-width:64px;text-align:right}
#tb .sim-frase{margin:0 0 12px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-left:3px solid #e2a55b;font:400 14px/1.45 var(--ui-sans,Inter,sans-serif);color:#e9eef0}#tb .sim-frase b{color:#fff;font-weight:600}
#tb .sim-cmp{display:grid;gap:10px;margin:0 0 12px}
#tb .cmp{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}
#tb .cmp .cn{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 7px;font:600 12px var(--ui-sans,Inter,sans-serif);color:#fff}
#tb .cmp .cn em{font:600 11px var(--ui-sans,Inter,sans-serif);font-style:normal;padding:2px 8px;border-radius:10px;background:rgba(255,255,255,.08);color:#cfd5d9}
#tb .cmp .cn em.up{background:rgba(226,165,91,.16);color:#f2c995}#tb .cmp .cn em.dn{background:rgba(255,255,255,.08);color:#b9c1c6}
#tb .cmp .cb{display:grid;grid-template-columns:104px minmax(0,1fr) 74px;gap:8px;align-items:center;font-size:11px;color:var(--ui-tx2,#b9c1c6);margin-top:4px}
#tb .cmp .cb i{display:block;height:10px;border-radius:5px;background:rgba(255,255,255,.05);overflow:hidden}#tb .cmp .cb i b{display:block;height:100%;border-radius:5px;transition:width .4s}
#tb .cmp .cb strong{text-align:right;font:600 12px var(--ui-sans,Inter,sans-serif);color:#fff;font-variant-numeric:tabular-nums}
#tb .sim-gp canvas{height:170px}
#tb .sim-tec{margin:4px 0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02)}
#tb .sim-tec > summary{cursor:pointer;padding:10px 12px;font:500 11.5px var(--ui-sans,Inter,sans-serif);color:var(--ui-tx2,#c0c7cb);list-style:none}#tb .sim-tec > summary::-webkit-details-marker{display:none}
#tb .sim-tec > summary::before{content:'+ ';color:#e2a55b}#tb .sim-tec[open] > summary::before{content:'– '}
#tb .sim-tec-c{padding:0 10px 4px}
#tb .sim-nota{font-size:10px;line-height:1.45;color:var(--ui-tx3,#8e979d);margin:4px 0 6px}`;
  document.head.appendChild(css);

  /* ---------------- estructura en el tablero ---------------- */
  const tabs = tb.querySelector('#tb-tabs'); const bt = document.createElement('button'); bt.dataset.k = 'sim'; bt.textContent = 'Simulación'; tabs.insertBefore(bt, tabs.firstChild);
  bt.onclick = () => verPestana('sim');
  const cont = document.createElement('div'); cont.className = 'gr sim'; cont.dataset.tab = 'sim';
  const ancla = tb.querySelector('.cuerpo .gr'); ancla.parentNode.insertBefore(cont, ancla);
  const tip = document.createElement('div'); tip.className = 'sim-tip'; tb.appendChild(tip);
  let sim = 'S1', escP = SIMST.esc, t = SEM - 1, play = null;
  const escAct = () => (T3.escenario === 'proyecto' ? escP : 'A');

  /* ---------------- gráfica de líneas o áreas apiladas (un solo eje) ---------------- */
  function grafica(cv, { series, y, yfmt, apilar, x }) {
    const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth || 400, H = 150; cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const L = 40, R = 8, Tp = 8, B = 20, n = series[0].data.length, X = x || ((i) => L + i / (n - 1) * (W - L - R));
    let max = 0; if (apilar) { for (let i = 0; i < n; i++) { let s = 0; for (const se of series) s += se.data[i] || 0; max = Math.max(max, s); } } else for (const se of series) for (const v of se.data) if (v != null && isFinite(v)) max = Math.max(max, v);
    max = y && y.max != null ? y.max : max * 1.08 || 1; const Y = (v) => H - B - v / max * (H - B - Tp);
    g.clearRect(0, 0, W, H); g.font = '400 10px Inter,system-ui,sans-serif'; g.fillStyle = '#8e979d'; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const k of [0, 0.5, 1]) { const v = max * k, yy = Math.round(Y(v)) + 0.5; g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; g.beginPath(); g.moveTo(L, yy); g.lineTo(W - R, yy); g.stroke(); g.fillText(yfmt(v), L - 5, yy); }
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; if (!x) for (let a = 0; a <= 10; a += 2) { g.textAlign = a === 0 ? 'left' : a === 10 ? 'right' : 'center'; g.fillText('año ' + a, X(Math.min(n - 1, a * AÑO)), H - 5); } g.textAlign = 'center';
    const lim = x ? n : t + 1;
    if (apilar) { const base = new Float32Array(n);
      for (const se of series) { g.beginPath(); for (let i = 0; i < lim; i++) g.lineTo(X(i), Y(base[i] + (se.data[i] || 0))); for (let i = lim - 1; i >= 0; i--) g.lineTo(X(i), Y(base[i])); g.closePath(); g.fillStyle = se.color; g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
        g.strokeStyle = '#141619'; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < lim; i++) g.lineTo(X(i), Y(base[i] + (se.data[i] || 0))); g.stroke(); for (let i = 0; i < n; i++) base[i] += se.data[i] || 0; } }
    else for (const se of series) { g.beginPath(); let on = false; for (let i = 0; i < lim; i++) { const v = se.data[i]; if (v == null || !isFinite(v)) { on = false; continue; } const px = X(i), py = Y(Math.min(v, max)); on ? g.lineTo(px, py) : g.moveTo(px, py); on = true; }
      g.strokeStyle = se.color; g.lineWidth = se.w || 2; g.globalAlpha = se.alfa || 1; g.setLineDash(se.dash || []); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
    if (!x && t < n - 1) { const xx = Math.round(X(t)) + 0.5; g.strokeStyle = 'rgba(226,165,91,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xx, Tp); g.lineTo(xx, H - B); g.stroke(); }
    cv._g = { X, Y, n, L, R, W, series, yfmt, x: !!x };
  }
  function hover(cv, xlabel) {
    if (!cv || cv._hov) return; cv._hov = 1;
    cv.addEventListener('pointermove', (ev) => { const G = cv._g; if (!G) return; const r = cv.getBoundingClientRect(), mx = ev.clientX - r.left; const i = Math.max(0, Math.min(G.n - 1, Math.round((mx - G.L) / (G.W - G.L - G.R) * (G.n - 1))));
      tip.innerHTML = `<b>${xlabel(i)}</b><br>` + G.series.map(s => `<i style="background:${s.color}"></i>${esc(s.name)}: <b>${G.yfmt(s.data[i])}</b>`).join('<br>');
      tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - 220, ev.clientX + 14) + 'px'; tip.style.top = (ev.clientY + 12) + 'px'; });
    cv.addEventListener('pointerleave', () => { tip.style.display = 'none'; });
  }
  const semLabel = (i) => `Año ${Math.floor(i / AÑO) + 1}, semana ${i % AÑO + 1}`;
  const ley = (L) => `<div class="sim-ley">${L.map(([c, n, d]) => `<span><i style="background:${c};${d ? 'background:repeating-linear-gradient(90deg,' + c + ' 0 4px,transparent 4px 7px)' : ''}"></i>${esc(n)}</span>`).join('')}</div>`;
  const slider = (P, k, n, min, max, paso, f = (v) => v) => `<label>${esc(n)}<output data-o="${k}">${f(P[k])}</output><input type="range" data-k="${k}" min="${min}" max="${max}" step="${paso}" value="${P[k]}"></label>`;

  /* ---------------- pintar cada simulación ---------------- */
  function cabecera(q, escs) {
    const e = escAct(), pro = T3.escenario === 'proyecto';
    return `<div class="sim-esc"><span>Escenario</span>${escs.map(k => `<button data-e="${k}" style="--c:${COL[k]}" class="${k === e ? 'on' : ''}" ${(!pro && k !== 'A') || (pro && k === 'A') ? 'disabled' : ''}><i style="background:${COL[k]}"></i>${esc(NOMBRE[k])}</button>`).join('')}</div>
`;
  }
  const S = { S1: null, S2: null, S3: null };
  function correr() { Object.assign(S, correrTodo()); }
  function pintar() {
    if (!S.S1) correr(); const e = escAct();
    const sub = `<div class="sim-sub" role="tablist">${[['S1', 'Comida'], ['S2', 'Residuos'], ['S3', 'Aves y humedal']].map(([k, n]) => `<button data-s="${k}" class="${k === sim ? 'on' : ''}">${n}</button>`).join('')}</div>`;
    let h = '';
    if (sim === 'S1') {
      const R = S.S1, r = R[e], a = R.A;
      h = cabecera('¿Cuánto baja la <b>dependencia de Corabastos</b> cuando Bavaria forma promotores, las huertas abastecen a tiendas y comedores, y cambia quién decide cómo se reparten los recursos?', ['A', 'B', 'C']) +
        `        <div class="sim-g"><h4>G1 · Producción y destino semanal<span>kg por semana · escenario ${e}</span></h4><canvas data-c="g1"></canvas>${ley([['#e2a55b', 'Autoconsumo'], ['#a87a44', 'Excedente al acopio'], ['#5c636a', 'Merma']])}</div>
        <div class="sim-g"><h4>G2 · Personas alimentadas<span>A · B · C</span></h4><canvas data-c="g2"></canvas>${ley([[COL.A, 'A sin intervención'], [COL.B, 'B nodo central'], [COL.C, 'C clúster rotativo']])}</div>
        <div class="sim-g"><h4>G3 · Dependencia de Corabastos según la zona<span>al año 10, % de dependencia</span></h4><p>Más grande la zona de servicio, más depende. Cae al 50 % en una zona de ${fmtK(2 * r.pers[SEM - 1])} habitantes.</p><canvas data-c="g3"></canvas>${ley([[COL.A, 'A'], [COL.B, 'B'], [COL.C, 'C']])}</div>
        <div class="sim-g"><h4>G4 · Difusión de huertas (curva de Bass)<span>hogares activos</span></h4><canvas data-c="g4"></canvas>${ley([[COL.A, 'A'], [COL.B, 'B (techo 2.506)'], [COL.C, 'C (techo 5.400)']])}</div>
        <div class="sim-g"><h4>G5 · Saturación del acompañamiento<span>m² por promotor · escenario ${e}</span></h4><p>Por encima de ${fmt(P1.c)} m² por promotor baja la calidad de manejo y suben los cierres.</p><canvas data-c="g5"></canvas>${ley([[COL[e === 'A' ? 'C' : e], 'm² por promotor'], ['#e2a55b', 'Capacidad c', true]])}</div>
        <div class="sim-g"><h4>G6 · Cola y tiempo de decisión<span>semanas de espera</span></h4><p>B: una institución central decide. C: asambleas rotativas (más capacidad, con pérdida por relevo).</p><canvas data-c="g6"></canvas>${ley([[COL.B, 'B decisión central'], [COL.C, 'C decisión rotativa']])}</div>
        <details class="sim-var"><summary>Variables (sliders) y estreses</summary><div class="cv">
          ${slider(P1, 'rend', 'Rendimiento (kg/m²·año)', 1, 12, 1)}${slider(P1, 'alcance', 'Alcance sobre lotes y techos', 0.1, 1, 0.05, v => fmt(v * 100) + ' %')}
          ${slider(P1, 'auto', 'Autoconsumo (PAR02)', 0.1, 0.7, 0.05, v => fmt(v * 100) + ' %')}${slider(P1, 'precio', 'Precio de excedentes ($/kg)', 1500, 4500, 100, v => '$' + fmt(v))}
          ${slider(P1, 'acopio', 'Capacidad de acopio (kg/semana)', 2000, 40000, 1000, v => fmt(v))}${slider(P1, 'reac', 'Reacción de precio de la central', 0, 1, 0.05, v => fmt(v, 2))}
          ${slider(P1, 'cupos', 'Cupos de formación (por trimestre)', 0, 40, 1)}${slider(P1, 'retardo', 'Retardo de aprendizaje (semanas)', 2, 40, 1)}
          ${slider(P1, 'c', 'm² por promotor (capacidad c)', 400, 3000, 100, v => fmt(v))}${slider(P1, 'rotacion', 'Periodo de rotación (semanas)', 4, 52, 1)}
          ${slider(P1, 'mu', 'Capacidad de decisión central (solicitudes/semana)', 1, 20, 1)}${slider(P1, 'zona', 'Población de la zona de servicio', 10000, 300000, 5000, v => fmtK(v))}
          ${slider(P1, 'sup', 'Huertas de la propuesta: parques, techos y Bavaria (m²)', 0, 200000, 5000, v => fmtK(v))}${slider(P1, 'regional', 'Compras directas a productores de la región', 0, 0.8, 0.05, v => fmt(v * 100) + ' %')}
          <div class="chk">${[['sequia', 'Sequía (años 3-4)'], ['bloqueo', 'Bloqueo del mayorista (año 6)'], ['crece', 'Crecimiento poblacional'], ['baldios', 'Revocación de baldíos (año 6)']].map(([k, n]) => `<label><input type="checkbox" data-b="${k}" ${P1[k] ? 'checked' : ''}>${n}</label>`).join('')}</div>
          <p class="sim-nota">Fórmulas del documento (G1-G6). [SUP]: A parte de 120 hogares sin apoyo; población de Kennedy 1.034.000; 400 g/día de frutas y verduras por persona; 10 % de pérdida en huerta.</p></div></details>`;
    } else if (sim === 'S2') {
      const R = S.S2, r = R[e], a = R.A, año = (arr) => arr.slice(Math.max(0, t - 51), t + 1).reduce((s, v) => s + v, 0);
      h = cabecera('¿Cuánta <b>materia orgánica vuelve al suelo</b> en vez de salir del barrio?', ['A', 'B', 'C']) +
        `        <div class="sim-g"><h4>Destino de los orgánicos<span>kg por semana · escenario ${e}</span></h4><canvas data-c="o1"></canvas>${ley([['#5c636a', 'Al relleno (Doña Juana)'], ['#e2a55b', 'Compost que vuelve al suelo'], ['#c9b08a', 'Hongos (proteína)']])}</div>
        <div class="sim-g"><h4>% de los orgánicos que vuelve al suelo<span>A · B · C</span></h4><canvas data-c="o2"></canvas>${ley([[COL.A, 'A ruta actual'], [COL.B, 'B estación barrial'], [COL.C, 'C Bavaria Común']])}</div>
        <div class="sim-g"><h4>Material en maduración<span>kg en las pilas</span></h4><canvas data-c="o3"></canvas>${ley([[COL.B, 'B'], [COL.C, 'C']])}</div>
        <div class="sim-g"><h4>Kilómetros de transporte<span>km por semana</span></h4><canvas data-c="o4"></canvas>${ley([[COL.A, 'A'], [COL.B, 'B'], [COL.C, 'C']])}</div>
        <details class="sim-var"><summary>Variables (sliders)</summary><div class="cv">
          ${slider(P2, 'frac', 'Fracción desviada', 0.05, 0.9, 0.05, v => fmt(v * 100) + ' %')}${slider(P2, 'cap', 'Capacidad de la estación (kg/semana)', 1000, 30000, 500, v => fmt(v))}
          ${slider(P2, 'mad', 'Semanas de maduración', 4, 24, 1)}${slider(P2, 'sust', 'Fracción de sustrato al distrito', 0, 0.6, 0.05, v => fmt(v * 100) + ' %')}
          ${slider(P2, 'dist', 'Distancia estación – huertas (km)', 0.2, 6, 0.1, v => fmt(v, 1))}
          <p class="sim-nota">[SUP] 0,45 kg/día de orgánicos por persona en la zona de servicio (de SIM-01); el compost pesa la mitad del material que entra; Bavaria procesa 3,5 veces la capacidad de una estación; Doña Juana a ~28 km.</p></div></details>`;
    } else {
      const R = S.S3, r = R[e], a = R.A;
      h = cabecera('¿Dónde y con qué especies las huertas <b>ayudan al hábitat</b> y dónde crean <b>trampas ecológicas</b>?', ['A', 'B', 'C']) +
        `        <div class="sim-g"><h4>Aves en el borde del humedal<span>individuos · A · B · C</span></h4><canvas data-c="f1"></canvas>${ley([[COL.A, 'A sin huertas'], [COL.B, 'B sin criterio'], [COL.C, 'C con corredores']])}</div>
        <div class="sim-g"><h4>Con y sin medida antitrampa<span>aves · escenario ${e === 'A' ? 'C' : e}</span></h4><canvas data-c="f2"></canvas>${ley([[COL[e === 'A' ? 'C' : e], 'con antitrampa'], [COL[e === 'A' ? 'C' : e], 'sin antitrampa', true]])}</div>
        <div class="sim-g"><h4>Integridad del humedal<span>% · A · B · C</span></h4><canvas data-c="f3"></canvas>${ley([[COL.A, 'A'], [COL.B, 'B'], [COL.C, 'C']])}</div>
        <details class="sim-var"><summary>Variables (sliders)</summary><div class="cv">
          ${slider(P3, 'disp', 'Alcance de dispersión de las aves (m)', 100, 1500, 50)}${slider(P3, 'borde', 'Número de huertas en el borde', 0, 60, 1)}
          ${slider(P3, 'arboles', 'Densidad de árboles', 0, 1, 0.05, v => fmt(v, 2))}${slider(P3, 'luz', 'Intensidad de luz y vidrio', 0, 1, 0.05, v => fmt(v, 2))}
          ${slider(P3, 'rec', 'Tasa de recuperación del humedal', 0, 0.1, 0.005, v => fmt(v, 3))}
          <div class="chk"><label><input type="checkbox" data-b3="anti" ${P3.anti ? 'checked' : ''}>Medida antitrampa</label></div>
          <p class="sim-nota">[SUP] Crecimiento logístico de las aves con capacidad de carga según el humedal, los árboles, la conectividad entre parches (mayor en C por los corredores) y las huertas; la trampa ecológica es mortalidad por luz y vidrio en las huertas del borde, que la medida antitrampa reduce al 30 %.</p></div></details>`;
    }
    cont.innerHTML = sub + resumen() + `<details class="sim-tec"${abiertoTec ? ' open' : ''}><summary>Detalle técnico · gráficas del modelo, escenarios B y C y variables</summary><div class="sim-tec-c">${h}</div></details>`;
    dibujar(); conectar();
  }
  /* ---------- resumen: una frase, la comparación hoy / con la propuesta y una sola gráfica ---------- */
  const proK = () => (T3.escenario === 'proyecto' ? escP : 'C');
  const año10 = () => Math.floor(t / AÑO) + 1;
  function fila(n, hoy, pro, f, menos) {
    const m = Math.max(hoy, pro, 1e-9), mejor = menos ? pro < hoy : pro > hoy, igual = Math.abs(pro - hoy) < 1e-9 * m;
    const chip = igual ? 'igual' : hoy > 0 && pro / hoy >= 2 ? '×' + fmt(pro / hoy, pro / hoy < 10 ? 1 : 0) : hoy > 0 && hoy / pro >= 2 && menos ? '÷' + fmt(hoy / pro, hoy / pro < 10 ? 1 : 0) : (pro >= hoy ? '+' : '−') + fmt(Math.abs(pro - hoy) / Math.max(hoy, 1e-9) * 100) + ' %';
    return `<div class="cmp"><div class="cn">${esc(n)}<em class="${igual ? '' : mejor ? 'up' : 'dn'}">${chip}</em></div>
      <div class="cb"><span>Hoy</span><i><b style="width:${(hoy / m * 100).toFixed(1)}%;background:${COL.A}"></b></i><strong>${f(hoy)}</strong></div>
      <div class="cb"><span>Con la propuesta</span><i><b style="width:${(pro / m * 100).toFixed(1)}%;background:${COL.C}"></b></i><strong>${f(pro)}</strong></div></div>`;
  }
  function resumen() {
    const p = proK(), ti = Math.floor(t), sem = (arr) => arr.slice(Math.max(0, ti - 51), ti + 1).reduce((s, v) => s + v, 0);
    let q = '', frase = '', filas = '', gtit = '';
    if (sim === 'S1') { const A = S.S1.A, P = S.S1[p];
      q = '¿Cuánto deja Kennedy de depender de Corabastos si las huertas del barrio abastecen tiendas y comedores?';
      frase = `En ${año10()} ${año10() === 1 ? 'año' : 'años'}, con la propuesta, <b>${fmtK(P.pers[t])} personas</b> comen frutas y verduras de las huertas del barrio. Hoy serían <b>${fmtK(A.pers[t])}</b>.`;
      filas = fila('Hogares con huerta', A.act[t], P.act[t], (v) => fmt(v)) + fila('Personas que comen de las huertas', A.pers[t], P.pers[t], fmtK) +
        fila(`Dependencia de Corabastos (zona de ${fmtK(P1.zona)} hab.)`, A.dep[t] * 100, P.dep[t] * 100, (v) => fmt(v) + ' %', true) + fila('Comida producida por semana', A.prod[t], P.prod[t], (v) => fmtK(v) + ' kg');
      gtit = 'Personas que comen de las huertas, año a año';
    } else if (sim === 'S2') { const A = S.S2.A, P = S.S2[p];
      q = '¿Cuánta basura orgánica vuelve a la tierra como abono en vez de irse al relleno?';
      frase = `Con la propuesta, <b>${fmt(sem(P.vuelve) / 1000)} toneladas</b> de residuos orgánicos al año vuelven a la tierra como abono. Hoy, <b>${fmt(sem(A.vuelve) / 1000)} toneladas</b>.`;
      filas = fila('Abono que vuelve a la tierra (t/año)', sem(A.vuelve) / 1000, sem(P.vuelve) / 1000, (v) => fmt(v)) + fila('Residuos que se van al relleno (t/año)', sem(A.relleno) / 1000, sem(P.relleno) / 1000, (v) => fmt(v), true) +
        fila('Hongos para comer (kg/año)', sem(A.hongos), sem(P.hongos), (v) => fmt(v)) + fila('Kilómetros que viajan los residuos (al año)', sem(A.km), sem(P.km), (v) => fmtK(v), true);
      gtit = '% de los orgánicos que vuelve a la tierra';
    } else { const A = S.S3.A, P = S.S3[p];
      q = '¿Las huertas ayudan a las aves y al humedal, o les ponen trampas?';
      frase = `Con la propuesta hay <b>${fmt(P.aves[t])} aves</b> en el borde del humedal y <b>${fmt(P.riq[t])} especies</b>. Hoy, <b>${fmt(A.aves[t])}</b> aves y <b>${fmt(A.riq[t])}</b> especies.`;
      filas = fila('Aves en el borde del humedal', A.aves[t], P.aves[t], (v) => fmt(v)) + fila('Especies de aves', A.riq[t], P.riq[t], (v) => fmt(v)) +
        fila('Estado del humedal', A.hum[t], P.hum[t], (v) => fmt(v) + ' %') + fila('Aves que mueren por luz y vidrio (acumulado)', A.trampa[t], P.trampa[t], (v) => fmt(v), true);
      gtit = 'Aves en el borde del humedal, año a año';
    }
    return `<div class="sim-res"><p class="sim-q">${q}</p><div class="sim-frase">${frase}</div>
      <div class="sim-play"><button data-play>${play ? 'Pausa' : '▶ Correr 10 años'}</button><input type="range" min="0" max="${SEM - 1}" value="${t}" data-t aria-label="Tiempo de la simulación"><output>año ${año10()}</output></div>
      <div class="sim-cmp">${filas}</div>
      <div class="sim-g sim-gp"><h4>${esc(gtit)}</h4><canvas data-c="res"></canvas></div></div>`;
  }
  function dibujarResumen() {
    const cv = cont.querySelector('canvas[data-c="res"]'); if (!cv) return; const p = proK();
    const d = sim === 'S1' ? [S.S1.A.pers, S.S1[p].pers, fmtK] : sim === 'S2' ? [S.S2.A.pct, S.S2[p].pct, (v) => fmt(v, 1) + ' %'] : [S.S3.A.aves, S.S3[p].aves, (v) => fmt(v)];
    grafica(cv, { series: [{ name: 'Hoy', color: COL.A, data: d[0], w: 2.4 }, { name: 'Con la propuesta', color: COL.C, data: d[1], w: 2.8 }], yfmt: d[2] });
    // rótulos directos al final de cada línea
    const G = cv._g, g = cv.getContext('2d'), i = Math.floor(t); g.font = '600 11px Inter,system-ui,sans-serif'; g.textAlign = 'right';
    [[d[0], COL.A, 'Hoy'], [d[1], COL.C, 'Con la propuesta']].forEach(([arr, c, n]) => { const v = arr[i]; if (v == null) return; const x = G.X(i), y = G.Y(v); g.fillStyle = c; g.beginPath(); g.arc(x, y, 4, 0, 6.29); g.fill(); g.fillStyle = '#fff'; g.fillText(`${n}: ${d[2](v)}`, Math.max(120, x - 8), y - 9); });
    hover(cv, (k) => `Año ${Math.floor(k / AÑO) + 1}`);
  }
  function dibujar() {
    dibujarResumen();
    if (!cont.querySelector('.sim-tec') || !cont.querySelector('.sim-tec').open) return; // lo técnico solo se dibuja abierto
    const e = escAct(), c = (k) => cont.querySelector(`canvas[data-c="${k}"]`), kg = (v) => fmtK(v), pct = (v) => fmt(v, 1) + ' %';
    if (sim === 'S1') { const R = S.S1, r = R[e];
      grafica(c('g1'), { apilar: true, series: [{ name: 'Autoconsumo', color: '#e2a55b', data: r.auto }, { name: 'Excedente', color: '#a87a44', data: r.exc }, { name: 'Merma', color: '#5c636a', data: r.merma }], yfmt: kg });
      grafica(c('g2'), { series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: R[k].pers, w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), yfmt: kg });
      const zs = Array.from({ length: 61 }, (_, i) => 5000 + i * 5000), xz = (i) => 40 + i / 60 * ((c('g3').clientWidth || 400) - 48);
      grafica(c('g3'), { x: xz, series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: zs.map(z => Math.max(0, 1 - R[k].pers[SEM - 1] / z) * 100), w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), y: { max: 100 }, yfmt: (v) => fmt(v) + ' %' });
      grafica(c('g4'), { series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: R[k].act, w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), yfmt: (v) => fmt(v) });
      const k5 = e === 'A' ? 'C' : e; grafica(c('g5'), { series: [{ name: 'm² por promotor', color: COL[k5], data: R[k5].m2p }, { name: 'Capacidad c', color: '#e2a55b', data: R[k5].m2p.map(() => P1.c), dash: [4, 3], w: 1.5 }], yfmt: (v) => fmt(v) + ' m²' });
      grafica(c('g6'), { series: [{ name: 'B central', color: COL.B, data: R.B.espera }, { name: 'C rotativa', color: COL.C, data: R.C.espera }], yfmt: (v) => fmt(v, 1) + ' sem' });
      for (const k of ['g1', 'g2', 'g4', 'g5', 'g6']) hover(c(k), semLabel); hover(c('g3'), (i) => `Zona de ${fmtK(zs[i])} habitantes`);
    } else if (sim === 'S2') { const R = S.S2, r = R[e];
      grafica(c('o1'), { apilar: true, series: [{ name: 'Relleno', color: '#5c636a', data: r.relleno }, { name: 'Compost', color: '#e2a55b', data: r.compost }, { name: 'Hongos', color: '#c9b08a', data: r.hongos }], yfmt: kg });
      grafica(c('o2'), { series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: R[k].pct, w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), yfmt: pct });
      grafica(c('o3'), { series: ['B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: R[k].pila })), yfmt: kg });
      grafica(c('o4'), { series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: R[k].km, w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), yfmt: (v) => fmt(v) + ' km' });
      for (const k of ['o1', 'o2', 'o3', 'o4']) hover(c(k), semLabel);
    } else { const R = S.S3, k2 = e === 'A' ? 'C' : e;
      grafica(c('f1'), { series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: R[k].aves, w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), yfmt: (v) => fmt(v) });
      grafica(c('f2'), { series: [{ name: 'con antitrampa', color: COL[k2], data: sim03(k2, P3, true).aves }, { name: 'sin antitrampa', color: COL[k2], data: R[k2 + 'sin'].aves, dash: [4, 3] }], yfmt: (v) => fmt(v) });
      grafica(c('f3'), { series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: R[k].hum, w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), y: { max: 100 }, yfmt: (v) => fmt(v) + ' %' });
      for (const k of ['f1', 'f2', 'f3']) hover(c(k), semLabel);
    }
  }
  function conectar() {
    cont.querySelectorAll('.sim-sub button').forEach(b => b.onclick = () => { sim = b.dataset.s; pintar(); animar(); });
    cont.querySelectorAll('.sim-esc button').forEach(b => b.onclick = () => { escP = SIMST.esc = b.dataset.e; avisar('tablero'); pintar(); animar(); });
    const det = cont.querySelector('.sim-var'); if (det) { det.open = !!abiertoVar; det.ontoggle = () => { abiertoVar = det.open; }; }
    const tec = cont.querySelector('.sim-tec'); if (tec) tec.ontoggle = () => { abiertoTec = tec.open; if (tec.open) dibujar(); };
    cont.querySelectorAll('input[data-k]').forEach(inp => { const P = sim === 'S1' ? P1 : sim === 'S2' ? P2 : P3, o = cont.querySelector(`output[data-o="${inp.dataset.k}"]`);
      inp.oninput = () => { P[inp.dataset.k] = +inp.value; if (o) o.textContent = inp.value; correr(); dibujar(); avisar('tablero'); }; inp.onchange = () => pintar(); });
    cont.querySelectorAll('input[data-b]').forEach(inp => inp.onchange = () => { P1[inp.dataset.b] = inp.checked; correr(); pintar(); avisar('tablero'); });
    cont.querySelectorAll('input[data-b3]').forEach(inp => inp.onchange = () => { P3.anti = inp.checked; correr(); pintar(); avisar('tablero'); });
  }
  let abiertoVar = false, abiertoTec = false;
  function refrescar() { const r = cont.querySelector('.sim-res'); if (r) r.outerHTML = resumen(); dibujar(); }
  function parar() { if (play) { cancelAnimationFrame(play); play = null; } }
  function arrancar(desde0 = true) { parar(); if (desde0 || t >= SEM - 1) t = 0; let prev = performance.now(), tf = t;
    const paso = (now) => { const dt = Math.min(0.1, (now - prev) / 1000); prev = now; tf = Math.min(SEM - 1, tf + dt * 66); t = Math.floor(tf); /* ~8 s los 10 años; t siempre entero */
      if (t >= SEM - 1) { t = SEM - 1; play = null; refrescar(); return; } play = requestAnimationFrame(paso); refrescar(); };
    play = requestAnimationFrame(paso); }
  cont.addEventListener('click', (e) => { if (e.target.closest('[data-play]')) { if (play) { parar(); refrescar(); } else arrancar(t >= SEM - 1); } });
  cont.addEventListener('input', (e) => { const ts = e.target.closest('[data-t]'); if (!ts) return; parar(); t = +ts.value; const o = ts.nextElementSibling; if (o) o.textContent = 'año ' + año10(); dibujar(); });
  cont.addEventListener('change', (e) => { if (e.target.closest('[data-t]')) refrescar(); });
  // el panel de escenarios del mapa cambió algo: mismo escenario y mismos parámetros aquí
  addEventListener('sim-cambio', (ev) => { if (ev.detail && ev.detail.origen === 'tablero') return; escP = SIMST.esc; correr(); if (cont.classList.contains('vis')) pintar(); });
  const RMQ = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visible = () => cont.classList.contains('vis') && document.body.classList.contains('tb-abierto');
  const animar = () => { if (RMQ) { t = SEM - 1; refrescar(); return; } if (visible()) arrancar(true); };
  const btnTab = document.getElementById('b-tablero'); if (btnTab) btnTab.addEventListener('click', () => setTimeout(animar, 120));
  bt.addEventListener('click', () => setTimeout(animar, 60));
  addEventListener('escenario', () => { if (T3.escenario !== 'proyecto') escP = escP === 'A' ? 'C' : escP; pintar(); animar(); });
  addEventListener('resize', () => { if (cont.classList.contains('vis')) dibujar(); });
  correr(); pintar();
  return { pintar, S };
}
