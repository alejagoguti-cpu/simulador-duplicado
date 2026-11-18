/* ============ INDICADORES EN 3D (los picos de https://anasoficasca-code.github.io/picos/) ============
   Cada indicador es una superficie de picos sobre Kennedy: más alto y más intenso = valor más alto (0 a 1), con la rampa de color
   de las láminas. Datos: data3d/indicadores/*.json (tools/indicadores_extraer.js). Marco de picos (x este, y norte, m) ->
   mundo del simulador: giro de -28,1° y desplazamiento (1692, -588), alineado con 409 de 446 edificios altos. Botón "Indicadores": empieza apagado. */
export async function crearIndicadores({ THREE, T3 }) {
  const I = await (await fetch('data3d/indicadores/index.json?v=2')).json();
  const g = new THREE.Group(); g.name = 'indicadores'; g.visible = false; T3.scene.add(g);
  const dec = (b) => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const mallas = new Map(); let alto = 0.3, sel = null, anio = false;
  async function malla(f) {
    if (mallas.has(f)) return mallas.get(f);
    const d = await (await fetch('data3d/indicadores/' + f + '?v=1')).json();
    const q = new Uint16Array(dec(d.pos).buffer), n = d.nV, [x0, x1, y0, y1, zlo, zhi] = d.b, zs = zhi - zlo;
    const pos = new Float32Array(n * 3), z = new Float32Array(n);
    const ra = (I.rot || 0) * Math.PI / 180, cs = Math.cos(ra), sn = Math.sin(ra); /* la lámina está girada respecto al norte */
    for (let k = 0; k < n; k++) { const x = x0 + q[k * 3] / 65535 * (x1 - x0), zz = -(y0 + q[k * 3 + 1] / 65535 * (y1 - y0)); pos[k * 3] = x * cs - zz * sn + I.ox; pos[k * 3 + 2] = x * sn + zz * cs + I.oz; z[k] = q[k * 3 + 2] / 65535 * zs; }
    const cu = dec(d.col), qi = new Uint16Array(dec(d.idx).buffer), idx = new Uint32Array(d.nF * 6);
    for (let f2 = 0; f2 < d.nF; f2++) { const a = qi[f2 * 4], b = qi[f2 * 4 + 1], c = qi[f2 * 4 + 2], e = qi[f2 * 4 + 3]; idx.set([a, c, b, a, e, c], f2 * 6); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const col = new Float32Array(n * 3); for (let k = 0; k < n * 3; k++) col[k] = Math.pow(cu[k] / 255, 2.2); /* rampa de las láminas (sRGB -> lineal) */
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.9, emissive: 0xffffff, emissiveIntensity: 0, toneMapped: false }));
    /* sombreado suave: color propio + algo de luz del sol para leer el relieve */
    m.material.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = mix(diffuseColor.rgb, outgoingLight, 0.45);\n#include <opaque_fragment>'); };
    m.frustumCulled = false; m.renderOrder = 3; m.userData = { z, d };
    const M = { mesh: m, d, z, z0: z.slice(), zP: z.slice(), col0: col.slice(), zs, pos, code: f.replace(/(_2020)?\.json$/, ''), ramp: (I.lista.find(x => x.f === f) || {}).ramp }; mallas.set(f, M); return M;
  }
  function elevar(M) {
    const p = M.mesh.geometry.attributes.position.array, z = M.z, base = (T3.viaY != null ? T3.viaY : 0.6) + 2;
    for (let k = 0; k < z.length; k++) p[k * 3 + 1] = base + z[k] * alto;
    M.mesh.geometry.attributes.position.needsUpdate = true; M.mesh.geometry.computeVertexNormals(); M.mesh.geometry.computeBoundingSphere();
  }

  /* ---------- CON LA PROPUESTA: cada indicador cambia donde actúa la propuesta ----------
     [SUP] modelo espacial para discutir con el grupo (no viene de las láminas): las láminas son «Kennedy hoy»; con la propuesta el valor de cada punto
     se corrige según su cercanía a lo que cambia:
       · Corabastos descentralizado (los mismos % de carros y camiones de los sliders del flujo de carros, data3d/alivio_cali.js): baja PM, PA, EPO, CV y CCL
       · Bavaria Común (logística y conocimiento nuevos): sube CCL y CO
       · Parches de árboles nativos y huertas (verde nuevo): sube SE, bajan IC y PA; las huertas (juntas que las cuidan) suben OC */
  const CORA = [1132.1, 948.6], BAV = [3966, 49];
  const caida = (d, r0, r1) => d <= r0 ? 1 : d >= r1 ? 0 : 1 - (d - r0) / (r1 - r0);
  let VERDE = [], HUERTA = [];
  fetch('data3d/huertas_barrio.json?v=3').then(r => r.json()).then(D => { HUERTA = (D.huertas || []).map(h => h.c).filter(Boolean); }).catch(() => {});
  const leerParches = () => import('./parches_arboles.js?v=6').then(m => { const P = m.parchesCalculados(); if (P) VERDE = P.map(p => p.c); return !!P; }).catch(() => false);
  const cerca = (L, x, z, r0, r1) => { let w = 0; for (const c of L) { const dx = c[0] - x, dz = c[1] - z; if (Math.abs(dx) > r1 || Math.abs(dz) > r1) continue; const v = caida(Math.hypot(dx, dz), r0, r1); if (v > w) w = v; } return w; };
  const reduccion = () => { const A = T3.alivio, M = A && A.manual; if (!A) return { car: 0.4, cam: 0.7 }; return { car: 1 - (M ? M.keep : 1) * A.KEEP, cam: 1 - (M ? M.keepCam : 1) * A.KEEP_CAM }; }; // sliders de Corabastos × dependencia del escenario
  function calcularPropuesta(M) {
    const n = M.z0.length, Z = M.zP, r = reduccion(), c = M.code;
    for (let k = 0; k < n; k++) {
      const x = M.pos[k * 3], z = M.pos[k * 3 + 2], v = M.z0[k] / (M.zs || 1);
      const wC = caida(Math.hypot(x - CORA[0], z - CORA[1]), 600, 2600), wB = caida(Math.hypot(x - BAV[0], z - BAV[1]), 400, 1600);
      const wV = (c === 'SE' || c === 'IC' || c === 'PA') ? Math.max(cerca(VERDE, x, z, 60, 450), cerca(HUERTA, x, z, 40, 300) * 0.7) : 0, wH = c === 'OC' ? cerca(HUERTA, x, z, 80, 600) : 0;
      let u = v;
      if (c === 'PM') u = v * (1 - 0.9 * r.car * wC);
      else if (c === 'PA') u = v * (1 - 0.6 * r.car * wC) * (1 - 0.2 * wV);
      else if (c === 'EPO') u = v * (1 - 0.45 * r.car * wC);
      else if (c === 'CV') u = v * (1 - 0.55 * r.cam * wC);
      else if (c === 'CCL') u = v * (1 - 0.8 * r.cam * wC) + (1 - v) * 0.25 * wB;
      else if (c === 'IC') u = v * (1 - 0.35 * wV);
      else if (c === 'SE') u = v + (1 - v) * 0.5 * wV;
      else if (c === 'OC') u = v + (1 - v) * 0.45 * wH;
      else if (c === 'CO') u = v + (1 - v) * 0.5 * wB;
      Z[k] = Math.max(0, Math.min(1, u)) * (M.zs || 1);
    }
  }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)].map(q => Math.pow(q / 255, 2.2));
  function colorear(M, pro) { // el color sigue al valor nuevo con la misma rampa de la lámina
    const col = M.mesh.geometry.attributes.color.array;
    if (!pro || !M.ramp) { col.set(M.col0); M.mesh.geometry.attributes.color.needsUpdate = true; return; }
    const R = M.ramp.map(hex), n = M.z.length;
    for (let k = 0; k < n; k++) { const d = M.z[k] - M.z0[k]; if (Math.abs(d) < 1e-4 * (M.zs || 1)) { col[k * 3] = M.col0[k * 3]; col[k * 3 + 1] = M.col0[k * 3 + 1]; col[k * 3 + 2] = M.col0[k * 3 + 2]; continue; }
      const t = Math.max(0, Math.min(0.9999, M.z[k] / (M.zs || 1))) * (R.length - 1), i = Math.floor(t), f = t - i;
      for (let j = 0; j < 3; j++) col[k * 3 + j] = R[i][j] + (R[i + 1][j] - R[i][j]) * f; }
    M.mesh.geometry.attributes.color.needsUpdate = true;
  }
  let anim = 0;
  async function aplicarEscenario(suave = true) {
    const pro = T3.escenario === 'proyecto'; if (pro) await leerParches();
    const vis = [...mallas.values()].filter(M => M.mesh.visible); if (!vis.length) return;
    for (const M of vis) { if (pro) calcularPropuesta(M); M.zA = M.z.slice(); M.zB = pro ? M.zP : M.z0; }
    const id = ++anim, t0 = performance.now(), dur = suave ? 1600 : 0;
    const paso = (t) => { if (id !== anim) return; const f = dur ? Math.min(1, (t - t0) / dur) : 1, e = f * f * (3 - 2 * f);
      for (const M of vis) { for (let k = 0; k < M.z.length; k++) M.z[k] = M.zA[k] + (M.zB[k] - M.zA[k]) * e; elevar(M); if (f === 1) colorear(M, pro); }
      if (f < 1) requestAnimationFrame(paso); else api.onCambio && api.onCambio(); };
    requestAnimationFrame(paso);
  }
  addEventListener('escenario', () => setTimeout(() => aplicarEscenario(true), 120));
  let tSl = 0; addEventListener('cora-cambio', () => { clearTimeout(tSl); tSl = setTimeout(() => { if (T3.escenario === 'proyecto') aplicarEscenario(false); }, 250); });
  const resumen = () => { const M = [...mallas.values()].find(q => q.mesh.visible); if (!M || T3.escenario !== 'proyecto') return null;
    let a = 0, b = 0, mx = 0; for (let k = 0; k < M.z0.length; k++) { a += M.z0[k]; b += M.zP[k]; const d = (M.zP[k] - M.z0[k]) / (M.zs || 1); if (Math.abs(d) > Math.abs(mx)) mx = d; }
    return { prom: a ? (b / a - 1) * 100 : 0, max: mx * 100 }; };
  const api = {
    lista: I.lista.filter(x => !x.year), tiene2020: (code) => I.lista.some(x => x.code === code && x.year),
    get sel() { return sel; }, get anio() { return anio; }, get alto() { return alto; },
    async mostrar(code, en2020) {
      sel = code; anio = !!en2020 && api.tiene2020(code);
      for (const M of mallas.values()) M.mesh.visible = false;
      if (!code) return null;
      const it = I.lista.find(x => x.code === code && (anio ? x.year : !x.year)); const M = await malla(it.f);
      if (sel !== code) return null; /* se eligió otro mientras cargaba */
      if (!M.mesh.parent) g.add(M.mesh); M.mesh.visible = true; anim++;
      const pro = T3.escenario === 'proyecto'; if (pro) { await leerParches(); calcularPropuesta(M); }
      M.z.set(pro ? M.zP : M.z0); elevar(M); colorear(M, pro); return it;
    },
    resumen, onCambio: null,
    altura(v) { alto = v; for (const M of mallas.values()) if (M.mesh.visible) elevar(M); },
    ver(on) { g.visible = on; }
  };
  return api;
}

export function panelIndicadores(api, on) {
  let el = document.getElementById('ind-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'ind-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;left:' + (innerWidth > 760 ? 290 : 8) + 'px;bottom:96px;z-index:41;width:min(262px,calc(100vw - 32px));max-height:calc(100vh - 200px);overflow:auto;background:rgba(13,15,18,.86);border:1px solid rgba(255,255,255,.075);border-radius:10px;padding:9px 11px;color:#e9ebec;font:10.5px/1.35 Inter,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)';
  const grad = (r) => 'linear-gradient(to top,' + r.join(',') + ')', gradH = (r) => 'linear-gradient(90deg,' + r.join(',') + ')';
  // qué hace la propuesta en cada indicador (texto corto para el panel)
  const QUE = { PM: 'Menos carros y camiones hacia Corabastos: baja la presión en sus vías.', PA: 'Menos tráfico a Corabastos y más árboles: baja la presión sobre el aire.',
    EPO: 'Menos camiones cerca de Corabastos: menos gente expuesta.', CV: 'Corabastos reducido: menos conflicto entre vivienda y carga.',
    CCL: 'La logística se reparte: baja en Corabastos y sube en Bavaria Común.', IC: 'Parches de árboles y huertas: bajan las islas de calor.',
    SE: 'Parches de árboles nativos y huertas: sube el soporte ecológico.', OC: 'Cada huerta tiene una junta que la cuida: suben las organizaciones.', CO: 'Escuela de huertas y laboratorios de Bavaria Común: sube el conocimiento.' };
  const escBox = () => { const pro = (window.KEN_ESC && window.KEN_ESC.e) === 'proyecto', r = api.resumen(), b = (on, t, e) => `<button data-e="${e}" style="flex:1;padding:5px;border:0;font:inherit;cursor:pointer;background:${on ? (e === 'hoy' ? '#e9ebec' : '#34d399') : 'transparent'};color:${on ? '#0d0f12' : '#c9cdd0'}">${t}</button>`;
    return `<div style="display:flex;border:1px solid rgba(255,255,255,.12);border-radius:7px;overflow:hidden;margin-top:9px">${b(!pro, 'Kennedy hoy', 'hoy')}${b(pro, 'Con la propuesta', 'proyecto')}</div>
      <div style="margin-top:6px;color:#9aa2a7;font-size:10px;line-height:1.4">${pro ? `${QUE[api.sel] || ''}${r ? `<div style="margin-top:4px;color:#e9ebec;font:500 10.5px 'JetBrains Mono',monospace">Promedio en Kennedy ${r.prom >= 0 ? '+' : '−'}${Math.abs(r.prom).toFixed(1)} % · donde más cambia ${r.max >= 0 ? '+' : '−'}${Math.abs(r.max * 0.01).toFixed(2)}</div>` : ''}<div style="margin-top:3px;color:#646c71;font-size:9px">Supuesto del simulador sobre la lámina; los % de Corabastos salen de los sliders del flujo de carros.</div>`
        : 'Así está hoy, según las láminas. Pasa a <b style="color:#6ee7b7">Con la propuesta</b> para ver cómo cambia.'}</div>`; };
  api.onCambio = () => { if (document.getElementById('ind-panel')) pintar(); };
  const pintar = () => {
    const it = api.lista.find(x => x.code === api.sel), t2 = api.sel && api.tiene2020(api.sel);
    el.innerHTML = `<div style="font:500 9px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#646c71;text-transform:uppercase;margin-bottom:7px">Indicadores</div>
      <div style="display:grid;gap:4px">${api.lista.map(x => `<button data-c="${x.code}" style="position:relative;display:flex;align-items:center;gap:7px;width:100%;text-align:left;padding:6px 8px 6px 14px;background:${x.code === api.sel ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.03)'};border:1px solid ${x.code === api.sel ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.08)'};border-radius:7px;color:#e9ebec;font:inherit;cursor:pointer;overflow:hidden"><i style="position:absolute;left:0;top:0;bottom:0;width:6px;background:${grad(x.ramp)}"></i><b style="font:500 10px 'JetBrains Mono',monospace;min-width:30px;color:#fff">${x.code}</b><span>${x.name.replace(/\s*\([A-Z]+\)\s*$/, '')}</span></button>`).join('')}</div>
      ${it ? `<div style="margin-top:8px">${t2 ? `<div style="display:flex;border:1px solid rgba(255,255,255,.12);border-radius:7px;overflow:hidden;margin-bottom:7px">${['Actual', 'Antes 2020'].map((t, k) => `<button data-a="${k}" style="flex:1;padding:5px;border:0;font:inherit;cursor:pointer;background:${(k === 1) === api.anio ? '#e9ebec' : 'transparent'};color:${(k === 1) === api.anio ? '#0d0f12' : '#c9cdd0'}">${t}</button>`).join('')}</div>` : ''}
        <div style="height:8px;border-radius:2px;background:${gradH(it.ramp)}"></div>
        <div style="display:flex;justify-content:space-between;color:#9aa2a7;font:400 9.5px 'JetBrains Mono',monospace;margin-top:2px"><span>0 · bajo</span><span>0,5</span><span>1 · alto</span></div>
        <label style="display:flex;justify-content:space-between;color:#9aa2a7;margin-top:7px">Altura de los picos <span id="ind-av">${api.alto.toFixed(2)}×</span></label>
        <input id="ind-alt" type="range" min="0.05" max="1" step="0.05" value="${api.alto}" style="width:100%">
        ${escBox()}</div>` : '<div style="margin-top:7px;color:#9aa2a7;font-size:10px">Elige un indicador: se levanta como picos sobre Kennedy (más alto = valor más alto).</div>'}
      <div style="margin-top:6px;color:#646c71;font:400 9px 'JetBrains Mono',monospace">Fuente: Indicadores en 3D · láminas del grupo</div>`;
    el.querySelectorAll('button[data-c]').forEach(b => b.onclick = async () => { const c = b.dataset.c === api.sel ? null : b.dataset.c; const p = api.mostrar(c, false); pintar(); await p; });
    el.querySelectorAll('button[data-a]').forEach(b => b.onclick = async () => { const p = api.mostrar(api.sel, b.dataset.a === '1'); pintar(); await p; });
    el.querySelectorAll('button[data-e]').forEach(b => b.onclick = () => { const K = window.KEN_ESC; if (K && K.poner) K.poner(b.dataset.e); setTimeout(pintar, 150); });
    const r = el.querySelector('#ind-alt'); if (r) r.oninput = () => { api.altura(+r.value); el.querySelector('#ind-av').textContent = (+r.value).toFixed(2) + '×'; };
  };
  pintar();
}
