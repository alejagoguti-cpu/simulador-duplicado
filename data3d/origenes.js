/* ============ ¿DE DÓNDE VIENEN LOS CARROS? (puntos de origen de la simulación) ============
   En la simulación SUMO cada vehículo «nace» (spawn) en un punto: en el borde del mapa si viene de fuera de Kennedy, o adentro si sale de un
   parqueadero, una casa o una bodega. Aquí se lee la grabación (T3.TRAF.steps): el primer paso en que aparece cada id es su punto de origen;
   se agrupan en celdas de 150 m y se muestran los que más vehículos generan (anillos: naranja = entra desde fuera de Kennedy, azul = sale de adentro).
   Además, las rutas regionales por las que llega la comida a Corabastos y su horario (la carga entra de noche: 6 p. m. a 11 p. m.; la venta
   mayorista abre a las 2 a. m.; Corabastos recibe 900 a 1.200 vehículos de carga al día; el 42 % de los alimentos viene de Cundinamarca). */
export function crearOrigenes({ T3, izq, despues }) {
  const THREE = T3.THREE, CORA = [1132.1, 948.6], CEL = 150;
  const grupo = new THREE.Group(); grupo.name = 'origenes'; grupo.visible = false; T3.scene.add(grupo);
  const Y = (T3.viaY != null ? T3.viaY : 0.62) + 0.4;
  let celdas = [], hecho = false, nSteps = 0;
  function calcular() {
    const TR = T3.TRAF, LC = T3.LC; if (!TR || !LC) return false;
    const S = TR.steps, M = new Map(); let prev = null, n = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let k = 0; k < S.length; k++) { const A = S[k]; if (!A) { prev = null; continue; } n++;
      if (prev) { let j = 0; for (let i = 0; i < A.ids.length; i++) { const id = A.ids[i]; while (j < prev.length && prev[j] < id) j++; if (j < prev.length && prev[j] === id) continue;
        const x = A.xs[i] - LC.x, z = LC.y - A.ys[i], key = Math.floor(x / CEL) * 100003 + Math.floor(z / CEL); let c = M.get(key); if (!c) M.set(key, c = { n: 0, x: 0, z: 0 }); c.n++; c.x += x; c.z += z; } }
      for (let i = 0; i < A.ids.length; i += 7) { const x = A.xs[i] - LC.x, z = LC.y - A.ys[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      prev = A.ids; }
    if (n < 3) return false;
    nSteps = n; const dur = n; // un paso = 1 s
    celdas = [...M.values()].map(c => ({ n: c.n, x: c.x / c.n, z: c.z / c.n })).sort((a, b) => b.n - a.n).slice(0, 36);
    for (const c of celdas) { c.borde = Math.min(c.x - x0, x1 - c.x, c.z - z0, z1 - c.z) < 350; c.hora = Math.round(c.n / dur * 3600); }
    return true;
  }
  // anillos que laten sobre el suelo + columna de luz tenue
  const UA = { uT: { value: 0 } };
  const mAnillo = new THREE.ShaderMaterial({ uniforms: UA, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
    vertexShader: 'attribute vec3 col; attribute float fase; varying vec2 vU; varying vec3 vC; varying float vF; void main(){ vU = uv; vC = col; vF = fase; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vU; varying vec3 vC; varying float vF; void main(){ float d = length(vU - 0.5) * 2.0; if (d > 1.0) discard;
      float r = fract(uT * 0.45 + vF); float onda = smoothstep(0.09, 0.0, abs(d - r)) * (1.0 - r);
      float nucleo = smoothstep(0.24, 0.16, d); float aro = smoothstep(0.06, 0.0, abs(d - 0.95));
      gl_FragColor = vec4(vC, max(nucleo * 0.85, max(onda * 0.9, aro * 0.5)));
      #include <colorspace_fragment>
    }` });
  let anillos = null, columnas = null;
  const ET = []; // etiquetas HTML
  const css = document.createElement('style'); css.textContent = `.og-et{position:fixed;left:0;top:0;z-index:7;pointer-events:none;padding:4px 8px;border-radius:7px;background:rgba(10,14,16,.84);border:1px solid rgba(255,255,255,.14);
  font:400 10.5px var(--ui-sans,Inter,system-ui,sans-serif);color:#e9ebec;white-space:nowrap;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-variant-numeric:tabular-nums}
.og-et b{font-weight:600}.og-et.reg{border-color:rgba(251,146,60,.5)}.og-et small{display:block;color:#9aa2a7;font-size:9.5px}@media(max-width:760px){.og-et{font-size:9.5px;padding:3px 6px}}`; document.head.appendChild(css);
  const etiqueta = (html, x, y, z, cls = '') => { const d = document.createElement('div'); d.className = 'og-et ' + cls; d.innerHTML = html; d.style.display = 'none'; document.body.appendChild(d); ET.push({ d, p: new THREE.Vector3(x, y, z) }); };
  function armar() {
    const N = celdas.length, g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), col = new Float32Array(N * 3), fase = new Float32Array(N), O = new THREE.Object3D(), C = new THREE.Color();
    anillos = new THREE.InstancedMesh(g, mAnillo, N); anillos.renderOrder = 9; anillos.frustumCulled = false;
    columnas = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 12, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false, vertexColors: false }), N);
    columnas.frustumCulled = false; columnas.renderOrder = 8;
    const mx = celdas[0] ? celdas[0].n : 1;
    celdas.forEach((c, i) => { const s = 110 + 260 * Math.sqrt(c.n / mx); /* se leen desde la vista de toda la localidad */ O.position.set(c.x, Y, c.z); O.rotation.set(0, 0, 0); O.scale.set(s, 1, s); O.updateMatrix(); anillos.setMatrixAt(i, O.matrix);
      C.set(c.borde ? '#fb923c' : '#38bdf8'); col.set([C.r, C.g, C.b], i * 3); fase[i] = (i * 0.137) % 1;
      O.scale.set(5, 60 + 260 * c.n / mx, 5); O.updateMatrix(); columnas.setMatrixAt(i, O.matrix); columnas.setColorAt(i, C);
      if (i < 10) etiqueta(`<b>${c.borde ? 'Entrada a Kennedy' : 'Origen dentro del barrio'}</b><small>${c.hora.toLocaleString('es-CO')} vehículos/hora nacen aquí</small>`, c.x, Y + 70 + 260 * c.n / mx, c.z); });
    g.setAttribute('col', new THREE.InstancedBufferAttribute(col, 3)); g.setAttribute('fase', new THREE.InstancedBufferAttribute(fase, 1));
    grupo.add(anillos, columnas);
    // rutas regionales hacia Corabastos (de dónde viene la comida): arcos animados desde fuera del mapa
    const REG = [
      { n: 'Cundinamarca · Sabana de Occidente', d: '42 % de los alimentos (Alcaldía de Bogotá)', a: [-5200, -900], via: [-1600, 300] },  // Calle 13 / Av. Centenario
      { n: 'Tolima y Huila', d: 'por la Autopista Sur', a: [-2600, 6200], via: [-300, 3000] },
      { n: 'Meta · Villavicencio', d: 'por la vía al Llano y la Av. Boyacá', a: [5200, 6400], via: [3000, 3400] },
      { n: 'Boyacá y norte de la Sabana', d: 'por la Av. Boyacá y la NQS', a: [4200, -6200], via: [2600, -2400] }
    ];
    const UD = { uT: UA.uT };
    const mRuta = new THREE.ShaderMaterial({ uniforms: UD, transparent: true, depthWrite: false, toneMapped: false,
      vertexShader: 'varying float vS; attribute float s; void main(){ vS = s; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uT; varying float vS; void main(){ float f = smoothstep(0.55, 1.0, fract(vS / 260.0 - uT * 0.5)); gl_FragColor = vec4(mix(vec3(0.98, 0.57, 0.24), vec3(1.0, 0.85, 0.6), f), 0.35 + 0.6 * f);
        #include <colorspace_fragment>
      }` });
    for (const R of REG) {
      const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(R.a[0], 260, R.a[1]), new THREE.Vector3(R.via[0], 420, R.via[1]), new THREE.Vector3(CORA[0], 30, CORA[1]));
      const tg = new THREE.TubeGeometry(curva, 120, 9, 6, false), pos = tg.attributes.position, s = new Float32Array(pos.count), L = curva.getLength();
      for (let i = 0; i < pos.count; i++) s[i] = Math.floor(i / 7) / 120 * L; tg.setAttribute('s', new THREE.BufferAttribute(s, 1));
      const m = new THREE.Mesh(tg, mRuta); m.renderOrder = 10; m.frustumCulled = false; grupo.add(m);
      const p = curva.getPoint(0.12); etiqueta(`<b>${R.n}</b><small>${R.d}</small>`, p.x, p.y + 30, p.z, 'reg'); }
    etiqueta('<b>Corabastos</b><small>900–1.200 camiones al día · llegan de 6 p. m. a 11 p. m.</small>', CORA[0], 120, CORA[1], 'reg');
    hecho = true;
  }
  const V = new THREE.Vector3();
  function cuadro(t) { requestAnimationFrame(cuadro); if (!grupo.visible) { for (const e of ET) if (e.d.style.display !== 'none') e.d.style.display = 'none'; return; }
    UA.uT.value = t / 1000; const W = innerWidth, H = innerHeight;
    for (const e of ET) { V.copy(e.p).project(T3.camera); const ok = V.z < 1 && Math.abs(V.x) < 0.95 && Math.abs(V.y) < 0.92; e.d.style.display = ok ? 'block' : 'none'; if (ok) e.d.style.transform = `translate(${((V.x + 1) / 2 * W).toFixed(1)}px,${((1 - V.y) / 2 * H).toFixed(1)}px) translate(-50%,-100%)`; } }
  requestAnimationFrame(cuadro);
  function ver(on) {
    if (on && !hecho) { if (!calcular()) { setTimeout(() => ver(true), 1500); return; } armar(); }
    grupo.visible = !!on;
  }
  // ---- panel: bajo el bloque de Corabastos del flujo de carros ----
  if (izq) {
    const H = (h, m = 0) => h * 60 + m;
    (despues || izq.lastElementChild).insertAdjacentHTML('afterend', `<div id="gs-og">
      <div class="gs-sub">¿DE DÓNDE VIENEN? <span>puntos de origen</span></div>
      <div class="gs-fila" style="grid-template-columns:1fr 1fr" id="gs-ogb"><button data-v="1">Ver</button><button data-v="" class="on">Apagar</button></div>
      <div style="font-size:10.5px;line-height:1.45;color:#94a3b8;margin:6px 0 4px"><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#fb923c;margin-right:4px"></i>entra desde fuera de Kennedy · <i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#38bdf8;margin:0 4px"></i>sale de adentro</div>
      <div class="gs-fila" style="grid-template-columns:1fr 1fr" id="gs-ogh"><button data-h="22">22:00 · llega la carga</button><button data-h="2">02:00 · abre la venta</button></div>
      <div style="font-size:10px;color:#64748b;margin-top:4px;line-height:1.4">Corabastos recibe 900 a 1.200 vehículos de carga al día; la carga entra de 6 p. m. a 11 p. m. y la venta mayorista abre a las 2 a. m. En esas horas, cerca de Corabastos uno de cada cinco vehículos es camión.</div></div>`);
    const caja = izq.querySelector('#gs-og');
    caja.querySelectorAll('#gs-ogb button').forEach(b => b.onclick = () => { ver(!!b.dataset.v); caja.querySelectorAll('#gs-ogb button').forEach(x => x.classList.toggle('on', x === b)); });
    caja.querySelectorAll('#gs-ogh button').forEach(b => b.onclick = () => { if (T3.reloj) { const h = +b.dataset.h, t = H(h); if (T3.reloj.t > t && h < 12) T3.reloj.dia = (T3.reloj.dia || 1) + 1; T3.reloj.t = t; }
      ver(true); caja.querySelectorAll('#gs-ogb button').forEach(x => x.classList.toggle('on', x.dataset.v === '1'));
      const FCb = document.querySelector('#gs-fc button[data-v="1"]'); if (FCb && !FCb.classList.contains('on')) FCb.click();
      if (T3.orbit) { const c = T3.orbit.target, p0 = T3.camera.position.clone(), c0 = c.clone(), p1 = new THREE.Vector3(CORA[0] + 900, 3400, CORA[1] + 2600), c1 = new THREE.Vector3(CORA[0], 0, CORA[1]); T3.anim = { t: 0, dur: 2.4, p0, c0, p1, c1 }; } });
  }
  return { ver, grupo, get celdas() { return celdas; } };
}
