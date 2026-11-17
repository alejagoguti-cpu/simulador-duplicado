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
export function iniciarSimulaciones({ T3, tb, verPestana }) {
  const SEM = 520, AÑO = 52, POB_K = 1034000; // población de Kennedy (proyección DANE 2024, aprox.)
  const COL = { A: '#3987e5', B: '#d95926', C: '#199e70' }, NOMBRE = { A: 'A · sin intervención', B: 'B · nodo central', C: 'C · clúster rotativo' };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (v, d = 0) => (v == null || !isFinite(v)) ? '–' : v.toLocaleString('es-CO', { maximumFractionDigits: d, minimumFractionDigits: d });
  const fmtK = (v) => v >= 1e6 ? fmt(v / 1e6, 1) + ' M' : v >= 1e4 ? fmt(v / 1e3, 0) + ' mil' : fmt(v);

  /* ---------------- parámetros (sliders) ---------------- */
  const P1 = { rend: 6, alcance: 0.5, auto: 0.35, merma: 0.1, precio: 2600, acopio: 15000, reac: 0.5, cupos: 12, retardo: 12, c: 1000, rotacion: 12, mu: 6, zona: 50000,
    sequia: false, bloqueo: false, crece: false, baldios: false };
  const P2 = { frac: 0.4, cap: 6000, mad: 10, sust: 0.2, dist: 1.5 };
  const P3 = { disp: 400, borde: 20, arboles: 0.4, luz: 0.5, anti: true, rec: 0.02 };

  /* ---------------- SIM-01 ---------------- */
  function sim01(e, P) {
    const N = e === 'A' ? 300 : e === 'B' ? 2506 : 5400; // A: huerteros que ya existen sin apoyo [SUP]
    const q = e === 'A' ? 0.0025 : 0.0073, area0 = 50; // m² por huerta (documento)
    const out = { prod: [], auto: [], merma: [], exc: [], pers: [], pct: [], dep: [], act: [], m2p: [], cal: [], prom: [], espera: [], pc: [] };
    let A_ = e === 'A' ? 120 : 60, prom = e === 'A' ? 0 : 6, cola = 0, pob = POB_K, Nef = N; const pipeline = [];
    for (let t = 0; t < SEM; t++) {
      if (P.crece && e !== 'A') pob *= Math.pow(1.015, 1 / AÑO);
      if (P.baldios && e !== 'A' && t === 300) { Nef = N * 0.65; A_ *= 0.7; } // revocación de baldíos
      const clima = P.sequia && t >= 150 && t < 200 ? 0.55 : 1, bloqueo = P.bloqueo && t >= 260 && t < 290;
      // promotores formados por Bavaria (llegan con el retardo de aprendizaje)
      if (e !== 'A') { if (t % 13 === 0) pipeline.push(t + P.retardo); while (pipeline.length && pipeline[0] <= t) { pipeline.shift(); prom += P.cupos; } }
      const area = A_ * area0, m2p = prom ? area / prom : Infinity, cal = e === 'A' ? 0.55 : Math.min(1, P.c / m2p);
      // difusión (Bass)
      const p = e === 'A' ? 0.0002 : Math.max(0.00058, (P.cupos / 13) * P.alcance / Nef);
      const adop = Math.max(0, (p + q * A_ / Nef) * (Nef - A_));
      const carga = e === 'A' ? 1.2 : Math.max(0, m2p / P.c), alivio = e === 'C' ? Math.max(0.35, 1 - 6 / P.rotacion * 0.6) : 1;
      const retiro = A_ * 0.0018 * (1 + 3 * Math.max(0, carga - 1)) * alivio;
      A_ = Math.max(0, Math.min(Nef, A_ + adop - retiro));
      // producción y destino
      const prod = area * P.rend / AÑO * clima * cal;
      const auto = prod * P.auto; let merma = prod * P.merma; let exc = prod - auto - merma;
      if (e !== 'A' && exc > P.acopio) { merma += exc - P.acopio; exc = P.acopio; } // acopio lleno: sube la merma
      if (e === 'A') { merma += exc * 0.5; exc *= 0.5; } // sin acopio la mitad del excedente se pierde [SUP]
      // personas alimentadas (frutas y verduras recomendadas: 400 g/día, OMS)
      const pers = prod * AÑO * (1 - 0.1) / (0.4 * 365);
      // decisión: λ solicitudes por semana; μ central o rotativo
      const lam = adop * 0.3 + A_ * 0.002 + (bloqueo ? 3 : 0);
      const perdida = Math.min(0.5, 0.15 * 12 / P.rotacion), mu = e === 'A' ? 0 : e === 'B' ? P.mu : 4 * (P.mu * 0.6) * (1 - perdida);
      let espera = null; if (e !== 'A') { cola = Math.max(0, cola + lam - mu); espera = lam < mu && cola < 1 ? 1 / (mu - lam) : (cola + lam) / Math.max(0.1, mu); }
      const pc = 3000 * (bloqueo ? 1.6 : 1) * (1 - P.reac * Math.min(1, pers / P.zona) * 0.25); // precio de Corabastos [SUP]
      out.prod.push(prod); out.auto.push(auto); out.merma.push(merma); out.exc.push(exc); out.pers.push(pers); out.pct.push(pers / pob * 100);
      out.dep.push(Math.max(0, 1 - pers / P.zona) * (bloqueo ? 1 : 1)); out.act.push(A_); out.m2p.push(isFinite(m2p) ? m2p : null); out.cal.push(cal); out.prom.push(prom); out.espera.push(espera); out.pc.push(pc);
    }
    return out;
  }
  /* ---------------- SIM-02 ---------------- */
  function sim02(e, P, pobZona) {
    const gen = pobZona * 0.45 * 7, out = { relleno: [], compost: [], hongos: [], vuelve: [], pct: [], km: [], pila: [] }; // 0,45 kg/día de orgánicos por persona [SUP]
    const cap = e === 'A' ? 0 : e === 'B' ? P.cap : P.cap * 3.5, frac = e === 'A' ? 0.02 : P.frac, dist = e === 'A' ? 28 : e === 'B' ? P.dist : 4.5; // Doña Juana a ~28 km; Bavaria a ~4,5 km [SUP]
    const entra = []; let pila = 0;
    for (let t = 0; t < SEM; t++) {
      const adopc = Math.min(1, 0.15 + t / 156); // la separación en la fuente se aprende en ~3 años [SUP]
      const desv = Math.min(gen * frac * adopc, cap || gen * frac * adopc * (e === 'A' ? 1 : 0)), rell = gen - desv;
      entra.push(desv); pila += desv; const madura = t >= P.mad ? entra[t - P.mad] : 0; pila -= madura;
      const sust = e === 'C' ? madura * P.sust : e === 'B' ? madura * P.sust * 0.3 : 0, comp = madura * 0.5 - sust * 0.5, hongos = sust * 0.15;
      out.relleno.push(rell); out.compost.push(Math.max(0, comp)); out.hongos.push(hongos); out.vuelve.push(Math.max(0, comp)); out.pct.push(Math.max(0, comp) / gen * 100 * 2); out.pila.push(pila);
      out.km.push(rell / 8000 * 28 * 2 + desv / 1500 * dist * 2); // camión de 8 t a relleno; triciclo/furgón de 1,5 t a la estación
    }
    return out;
  }
  /* ---------------- SIM-03 ---------------- */
  function sim03(e, P, anti) {
    const out = { aves: [], riq: [], hum: [], trampa: [] };
    let B = 900, W = 0.55, muertes = 0;
    const huertas = e === 'A' ? 0 : P.borde, conect = e === 'A' ? 0.2 : e === 'B' ? 1 - Math.exp(-P.disp / 600) : 1 - Math.exp(-P.disp / 250);
    for (let t = 0; t < SEM; t++) {
      const presion = 0.004 + (e === 'A' ? 0 : huertas * 0.00012 * (e === 'B' ? 1.6 : 0.7));
      W = Math.max(0.05, Math.min(1, W + P.rec * (1 - W) * 0.2 - presion * W));
      const K = 900 * (0.6 + 0.6 * W + 0.5 * P.arboles + (e === 'A' ? 0 : 0.4 * conect + huertas * 0.006));
      const m = (e === 'A' ? 0.0004 : huertas / 40 * 0.004 * P.luz * (e === 'B' ? 1 : 0.6)) * (anti ? 0.3 : 1); // trampa ecológica: luz y vidrio
      const r = 0.012; const crece = r * B * (1 - B / K), muere = B * m; muertes += muere; B = Math.max(20, B + crece - muere + conect * 1.5);
      out.aves.push(B); out.riq.push(Math.round(42 * (0.45 + 0.35 * conect + 0.3 * W))); out.hum.push(W * 100); out.trampa.push(muertes);
    }
    return out;
  }

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
#tb .sim-var label input[type=range]{grid-column:1/-1;width:100%;accent-color:#199e70}
#tb .sim-var label output{text-align:right;font:500 11px var(--ui-mono,monospace);color:#fff}
#tb .sim-var .chk{display:flex;flex-wrap:wrap;gap:6px}
#tb .sim-var .chk label{display:inline-flex;gap:6px;padding:5px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.1);cursor:pointer}
#tb .sim-play{display:flex;align-items:center;gap:8px;margin:0 0 10px}
#tb .sim-play button{height:30px;padding:0 12px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font:500 11.5px var(--ui-sans,Inter,sans-serif);cursor:pointer}
#tb .sim-play input{flex:1;accent-color:#e2a55b}#tb .sim-play output{font:500 11px var(--ui-mono,monospace);color:#fff;min-width:64px;text-align:right}
#tb .sim-nota{font-size:10px;line-height:1.45;color:var(--ui-tx3,#8e979d);margin:4px 0 6px}`;
  document.head.appendChild(css);

  /* ---------------- estructura en el tablero ---------------- */
  const tabs = tb.querySelector('#tb-tabs'); const bt = document.createElement('button'); bt.dataset.k = 'sim'; bt.textContent = 'Simulación'; tabs.insertBefore(bt, tabs.firstChild);
  bt.onclick = () => verPestana('sim');
  const cont = document.createElement('div'); cont.className = 'gr sim'; cont.dataset.tab = 'sim';
  const ancla = tb.querySelector('.cuerpo .gr'); ancla.parentNode.insertBefore(cont, ancla);
  const tip = document.createElement('div'); tip.className = 'sim-tip'; tb.appendChild(tip);
  let sim = 'S1', escP = 'C', t = SEM - 1, play = null;
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
    return `<p class="sim-q">${q}</p>
      <div class="sim-esc"><span>Escenario</span>${escs.map(k => `<button data-e="${k}" style="--c:${COL[k]}" class="${k === e ? 'on' : ''}" ${(!pro && k !== 'A') || (pro && k === 'A') ? 'disabled' : ''}><i style="background:${COL[k]}"></i>${esc(NOMBRE[k])}</button>`).join('')}</div>
      <div class="sim-play"><button data-play>${play ? 'Pausa' : '▶ Correr 10 años'}</button><input type="range" min="0" max="${SEM - 1}" value="${t}" data-t aria-label="Semana de la simulación"><output>${semLabel(t).replace('semana', 'sem.')}</output></div>`;
  }
  const S = { S1: null, S2: null, S3: null };
  function correr() {
    S.S1 = { A: sim01('A', P1), B: sim01('B', P1), C: sim01('C', P1) };
    const z = P1.zona; S.S2 = { A: sim02('A', P2, z), B: sim02('B', P2, z), C: sim02('C', P2, z) };
    S.S3 = { A: sim03('A', P3, P3.anti), B: sim03('B', P3, P3.anti), C: sim03('C', P3, P3.anti), Bsin: sim03('B', P3, false), Csin: sim03('C', P3, false) };
  }
  function pintar() {
    if (!S.S1) correr(); const e = escAct();
    const sub = `<div class="sim-sub" role="tablist">${[['S1', 'SIM-01 · Huertas'], ['S2', 'SIM-02 · Orgánicos'], ['S3', 'SIM-03 · Fauna']].map(([k, n]) => `<button data-s="${k}" class="${k === sim ? 'on' : ''}">${n}</button>`).join('')}</div>`;
    let h = '';
    if (sim === 'S1') {
      const R = S.S1, r = R[e], a = R.A;
      h = cabecera('¿Cuánto baja la <b>dependencia de Corabastos</b> cuando Bavaria forma promotores, las huertas abastecen a tiendas y comedores, y cambia quién decide cómo se reparten los recursos?', ['A', 'B', 'C']) +
        `<div class="sim-kpi"><div><b>${fmtK(r.pers[t])}</b><small>personas alimentadas con frutas y verduras</small><em>hoy (A): ${fmtK(a.pers[t])}</em></div>
          <div><b>${fmt(r.pct[t], 2)} %</b><small>de Kennedy</small><em>hoy (A): ${fmt(a.pct[t], 2)} %</em></div>
          <div><b>${fmt(r.dep[t] * 100)} %</b><small>dependencia de Corabastos en la zona de ${fmtK(P1.zona)} hab.</small><em>hoy (A): ${fmt(a.dep[t] * 100)} %</em></div>
          <div><b>${fmt(r.act[t])}</b><small>hogares con huerta activa</small><em>hoy (A): ${fmt(a.act[t])}</em></div></div>
        <div class="sim-g"><h4>G1 · Producción y destino semanal<span>kg por semana · escenario ${e}</span></h4><canvas data-c="g1"></canvas>${ley([['#199e70', 'Autoconsumo'], ['#3987e5', 'Excedente al acopio'], ['#9085e9', 'Merma']])}</div>
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
          <div class="chk">${[['sequia', 'Sequía (años 3-4)'], ['bloqueo', 'Bloqueo del mayorista (año 6)'], ['crece', 'Crecimiento poblacional'], ['baldios', 'Revocación de baldíos (año 6)']].map(([k, n]) => `<label><input type="checkbox" data-b="${k}" ${P1[k] ? 'checked' : ''}>${n}</label>`).join('')}</div>
          <p class="sim-nota">Fórmulas del documento (G1-G6). [SUP]: A parte de 120 hogares sin apoyo; población de Kennedy 1.034.000; 400 g/día de frutas y verduras por persona; 10 % de pérdida en huerta.</p></div></details>`;
    } else if (sim === 'S2') {
      const R = S.S2, r = R[e], a = R.A, año = (arr) => arr.slice(Math.max(0, t - 51), t + 1).reduce((s, v) => s + v, 0);
      h = cabecera('¿Cuánta <b>materia orgánica vuelve al suelo</b> en vez de salir del barrio?', ['A', 'B', 'C']) +
        `<div class="sim-kpi"><div><b>${fmt(año(r.vuelve) / 1000, 1)} t</b><small>de compost al año vuelven al suelo</small><em>hoy (A): ${fmt(año(a.vuelve) / 1000, 1)} t</em></div>
          <div><b>${fmt(año(r.relleno) / 1000)} t</b><small>al año siguen saliendo al relleno</small><em>hoy (A): ${fmt(año(a.relleno) / 1000)} t</em></div>
          <div><b>${fmt(año(r.hongos), 0)} kg</b><small>de hongos al año (sustrato al distrito)</small><em>hoy (A): 0 kg</em></div>
          <div><b>${fmt(año(r.km))}</b><small>km recorridos al año por los residuos</small><em>hoy (A): ${fmt(año(a.km))} km</em></div></div>
        <div class="sim-g"><h4>Destino de los orgánicos<span>kg por semana · escenario ${e}</span></h4><canvas data-c="o1"></canvas>${ley([['#8e979d', 'Al relleno (Doña Juana)'], ['#199e70', 'Compost que vuelve al suelo'], ['#c98500', 'Hongos (proteína)']])}</div>
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
        `<div class="sim-kpi"><div><b>${fmt(r.aves[t])}</b><small>aves en los parches del borde del humedal</small><em>hoy (A): ${fmt(a.aves[t])}</em></div>
          <div><b>${fmt(r.riq[t])}</b><small>especies presentes</small><em>hoy (A): ${fmt(a.riq[t])}</em></div>
          <div><b>${fmt(r.hum[t])} %</b><small>integridad del humedal</small><em>hoy (A): ${fmt(a.hum[t])} %</em></div>
          <div><b>${fmt(r.trampa[t])}</b><small>aves muertas en trampas (luz y vidrio), acumulado</small><em>${P3.anti ? 'con' : 'sin'} medida antitrampa</em></div></div>
        <div class="sim-g"><h4>Aves en el borde del humedal<span>individuos · A · B · C</span></h4><canvas data-c="f1"></canvas>${ley([[COL.A, 'A sin huertas'], [COL.B, 'B sin criterio'], [COL.C, 'C con corredores']])}</div>
        <div class="sim-g"><h4>Con y sin medida antitrampa<span>aves · escenario ${e === 'A' ? 'C' : e}</span></h4><canvas data-c="f2"></canvas>${ley([[COL[e === 'A' ? 'C' : e], 'con antitrampa'], [COL[e === 'A' ? 'C' : e], 'sin antitrampa', true]])}</div>
        <div class="sim-g"><h4>Integridad del humedal<span>% · A · B · C</span></h4><canvas data-c="f3"></canvas>${ley([[COL.A, 'A'], [COL.B, 'B'], [COL.C, 'C']])}</div>
        <details class="sim-var"><summary>Variables (sliders)</summary><div class="cv">
          ${slider(P3, 'disp', 'Alcance de dispersión de las aves (m)', 100, 1500, 50)}${slider(P3, 'borde', 'Número de huertas en el borde', 0, 60, 1)}
          ${slider(P3, 'arboles', 'Densidad de árboles', 0, 1, 0.05, v => fmt(v, 2))}${slider(P3, 'luz', 'Intensidad de luz y vidrio', 0, 1, 0.05, v => fmt(v, 2))}
          ${slider(P3, 'rec', 'Tasa de recuperación del humedal', 0, 0.1, 0.005, v => fmt(v, 3))}
          <div class="chk"><label><input type="checkbox" data-b3="anti" ${P3.anti ? 'checked' : ''}>Medida antitrampa</label></div>
          <p class="sim-nota">[SUP] Crecimiento logístico de las aves con capacidad de carga según el humedal, los árboles, la conectividad entre parches (mayor en C por los corredores) y las huertas; la trampa ecológica es mortalidad por luz y vidrio en las huertas del borde, que la medida antitrampa reduce al 30 %.</p></div></details>`;
    }
    cont.innerHTML = sub + h;
    dibujar(); conectar();
  }
  function dibujar() {
    const e = escAct(), c = (k) => cont.querySelector(`canvas[data-c="${k}"]`), kg = (v) => fmtK(v), pct = (v) => fmt(v, 1) + ' %';
    if (sim === 'S1') { const R = S.S1, r = R[e];
      grafica(c('g1'), { apilar: true, series: [{ name: 'Autoconsumo', color: '#199e70', data: r.auto }, { name: 'Excedente', color: '#3987e5', data: r.exc }, { name: 'Merma', color: '#9085e9', data: r.merma }], yfmt: kg });
      grafica(c('g2'), { series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: R[k].pers, w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), yfmt: kg });
      const zs = Array.from({ length: 61 }, (_, i) => 5000 + i * 5000), xz = (i) => 40 + i / 60 * ((c('g3').clientWidth || 400) - 48);
      grafica(c('g3'), { x: xz, series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: zs.map(z => Math.max(0, 1 - R[k].pers[SEM - 1] / z) * 100), w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), y: { max: 100 }, yfmt: (v) => fmt(v) + ' %' });
      grafica(c('g4'), { series: ['A', 'B', 'C'].map(k => ({ name: NOMBRE[k], color: COL[k], data: R[k].act, w: k === e ? 2.6 : 1.5, alfa: k === e ? 1 : 0.55 })), yfmt: (v) => fmt(v) });
      const k5 = e === 'A' ? 'C' : e; grafica(c('g5'), { series: [{ name: 'm² por promotor', color: COL[k5], data: R[k5].m2p }, { name: 'Capacidad c', color: '#e2a55b', data: R[k5].m2p.map(() => P1.c), dash: [4, 3], w: 1.5 }], yfmt: (v) => fmt(v) + ' m²' });
      grafica(c('g6'), { series: [{ name: 'B central', color: COL.B, data: R.B.espera }, { name: 'C rotativa', color: COL.C, data: R.C.espera }], yfmt: (v) => fmt(v, 1) + ' sem' });
      for (const k of ['g1', 'g2', 'g4', 'g5', 'g6']) hover(c(k), semLabel); hover(c('g3'), (i) => `Zona de ${fmtK(zs[i])} habitantes`);
    } else if (sim === 'S2') { const R = S.S2, r = R[e];
      grafica(c('o1'), { apilar: true, series: [{ name: 'Relleno', color: '#8e979d', data: r.relleno }, { name: 'Compost', color: '#199e70', data: r.compost }, { name: 'Hongos', color: '#c98500', data: r.hongos }], yfmt: kg });
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
    cont.querySelectorAll('.sim-sub button').forEach(b => b.onclick = () => { sim = b.dataset.s; pintar(); });
    cont.querySelectorAll('.sim-esc button').forEach(b => b.onclick = () => { escP = b.dataset.e; pintar(); });
    const pb = cont.querySelector('[data-play]'); if (pb) pb.onclick = () => { if (play) { clearInterval(play); play = null; pintar(); return; } if (t >= SEM - 1) t = 0; play = setInterval(() => { t = Math.min(SEM - 1, t + 4); if (t >= SEM - 1) { clearInterval(play); play = null; } pintar(); }, 60); pintar(); };
    const ts = cont.querySelector('[data-t]'); if (ts) { ts.oninput = () => { t = +ts.value; if (play) { clearInterval(play); play = null; } const o = ts.nextElementSibling; if (o) o.textContent = semLabel(t).replace('semana', 'sem.'); dibujar(); }; ts.onchange = () => pintar(); }
    const det = cont.querySelector('.sim-var'); if (det) { det.open = !!abiertoVar; det.ontoggle = () => { abiertoVar = det.open; }; }
    cont.querySelectorAll('input[data-k]').forEach(inp => { const P = sim === 'S1' ? P1 : sim === 'S2' ? P2 : P3, o = cont.querySelector(`output[data-o="${inp.dataset.k}"]`);
      inp.oninput = () => { P[inp.dataset.k] = +inp.value; if (o) o.textContent = inp.value; correr(); dibujar(); }; inp.onchange = () => pintar(); });
    cont.querySelectorAll('input[data-b]').forEach(inp => inp.onchange = () => { P1[inp.dataset.b] = inp.checked; correr(); pintar(); });
    cont.querySelectorAll('input[data-b3]').forEach(inp => inp.onchange = () => { P3.anti = inp.checked; correr(); pintar(); });
  }
  let abiertoVar = false;
  addEventListener('escenario', () => { if (T3.escenario !== 'proyecto') escP = escP === 'A' ? 'C' : escP; pintar(); });
  addEventListener('resize', () => { if (cont.classList.contains('vis')) dibujar(); });
  correr(); pintar();
  return { pintar, S };
}
