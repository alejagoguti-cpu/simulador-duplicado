/* ============ BAVARIA COMÚN · DISTRITO DE TECNOLOGÍAS CONVERGENTES (NBIC) ============
   Se prende al escoger «Bavaria Común» en la leyenda de «Con la propuesta» (data3d/escenario.js).
   Estudiantes, investigadores, productores y comerciantes trabajan sobre un mismo sistema: cultivar, conservar, distribuir y aprovechar
   los residuos. Los laboratorios quedan en el centro de los recorridos: aula -> laboratorios -> cultivo -> poscosecha -> mercado.
   - Programa por edificio (volumen de luz de color sobre el edificio real + etiqueta con área).
   - Retiros D1 (27) y D2 (20): el edificio se quita (grupo «bavaria_demoler» de bavaria.js) y queda su contorno rojo; aparecen la
     plaza de entrada y el patio de transferencia.
   - Campo experimental: 4 módulos x 8 camas de 1,25 x 10 m (A y B en invernadero), estación de compostaje (3 composteras),
     estación solar (20 paneles de 500 Wp = 10 kWp) y dos puntos de observación ecológica en el borde del bosque.
   - Accesos A (Tv. 71B), B (Calle 7A), C (Av. Boyacá) y tres recorridos animados: calle peatonal pública, carga y recorrido docente.
   - «Seguir una cosecha»: una caja de lechuga viaja del aula al compostaje con la cámara y un texto por paso.
   Edificios del modelo (data3d/bavaria.json): 3 instituto (L), 11 laboratorios, 0 poscosecha, 8 mercado, 2 foro, 6 silos.
   Áreas = metas de anteproyecto. */
export function crearDistritoBavaria({ T3, lw, D }) {
  const THREE = T3.THREE, MOV = innerWidth < 760, RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const W = (p) => lw(p[0], p[1]);
  const grupo = new THREE.Group(); grupo.name = 'bavaria_distrito'; grupo.visible = false; T3.scene.add(grupo);
  const ED = D.edif.map(e => ({ W: e.p.map(W), h: e.h }));
  const centro = (P) => { let x = 0, z = 0; for (const q of P) { x += q[0]; z += q[1]; } return [x / P.length, z / P.length]; };
  // eje del conjunto: el lado largo de la nave grande (2)
  const e2 = ED[2].W, ANG = Math.atan2(e2[1][1] - e2[0][1], e2[1][0] - e2[0][0]), CU = Math.cos(ANG), SU = Math.sin(ANG);
  const loc = (c, u, v) => [c[0] + u * CU - v * SU, c[1] + u * SU + v * CU]; // de ejes del conjunto (u, v) al mundo
  const rect = (c, w, d) => [loc(c, -w / 2, -d / 2), loc(c, w / 2, -d / 2), loc(c, w / 2, d / 2), loc(c, -w / 2, d / 2)];
  const M = (x, y) => lw(x, y); // del marco del modelo al mundo

  /* ---------- programa ---------- */
  const PROG = [
    { k: 'inst', n: 'Instituto de enseñanza', c: '#60a5fa', e: [3], a: '290 m²', d: 'Aquí comienza la jornada: los estudiantes reciben la explicación del ensayo y salen por la cara interior de la L hacia laboratorios y cultivos.', x: 'Dos aulas de 60 m² (24 estudiantes c/u), recepción 35, sala de trabajo 45, sala docente 30, coordinación 25 y casilleros 35 m².' },
    { k: 'lab', n: 'Centro de laboratorios NBIC', c: '#c084fc', e: [11], a: '250 m²', d: 'Núcleo del distrito. La práctica húmeda queda junto al cultivo; datos y pruebas con personas se conectan con el instituto y el mercado.', x: 'Cuatro laboratorios y dos apoyos. Un grupo de 24 entra dividido en equipos de 12.' },
    { k: 'campo', n: 'Campo experimental', c: '#4ade80', a: '800 m²', d: 'La misma especie bajo condiciones distintas: qué cambia, cuánto cuesta y qué conviene llevar a otros mercados de Kennedy.', x: 'Cuatro módulos de 8 camas (32 camas de 1,25 × 10 m), dos invernaderos, semillero, riego, herramientas y circulación.' },
    { k: 'pos', n: 'Planta docente de poscosecha', c: '#f59e0b', e: [0], a: '190 m²', d: 'Se recibe lo cosechado, se pesa, se selecciona, se empaca y se despacha: al mercado de Bavaria o a otro mercado barrial.', x: 'Recepción 30, selección y lavado 40, empaque 35, cámara fría 20, canastillas 20, orgánicos 15 y despacho 30 m².' },
    { k: 'mer', n: 'Mercado experimental', c: '#fb7185', e: [8], a: '315 m²', d: 'Los productores venden, los estudiantes registran qué llega y qué se vende, y los compradores participan voluntariamente en pruebas.', x: 'Doce puestos de 9 m², 120 m² de circulación, 45 de demostración, 18 de pesaje y 24 de almacenamiento. Entrada pública y recepción posterior.' },
    { k: 'foro', n: 'Foro del distrito y memoria industrial', c: '#e7e5e4', e: [2], a: '120 m²', d: 'Aquí se reúne un grupo antes de recorrer el predio. Se exhiben ensayos, cosechas y resultados de energía, agua y compost. Los silos orientan.', x: '120 m² iniciales con mobiliario móvil; lo que se abra al público depende del estado de la estructura.' },
    { k: 'comp', n: 'Estación docente de compostaje', c: '#d4a373', a: '60 m²', d: 'Recibe material vegetal por el lado de servicio. Los estudiantes siguen cada lote desde el pesaje hasta la maduración.', x: 'Recepción y pesaje 10, material seco 10, tres composteras de ~1 m³ 18, maduración y tamizado 12, herramientas y registro 10 m².' },
    { k: 'sol', n: 'Estación solar', c: '#facc15', a: '10 kWp', d: 'En la cubierta con mejor asoleación (se compara la del mercado y la de poscosecha). Los datos llegan al aula digital.', x: '20 paneles de 500 Wp en ~60 m² de cubierta: bombeo de riego, sensores, iluminación de trabajo y cámara fría.' },
    { k: 'obs', n: 'Observación ecológica', c: '#2dd4bf', a: '2 puntos', d: 'Se comparan sombra, temperatura y visitas de fauna en el borde del bosque con las del patio productivo.', x: 'Dos puntos, cada uno para 12 estudiantes, sobre recorridos existentes aptos. El bosque conserva su continuidad.' }
  ];
  const PK = Object.fromEntries(PROG.map((p, i) => [p.k, { ...p, i }]));

  /* ---------- lugares nuevos (marco del modelo) ---------- */
  const C_CAMPO = M(9478, 3066), C_COMP = M(9527, 3133), C_PLAZA = M(9163, 2878), OBS = [M(9640, 3030), M(9205, 3342)];
  const ACC = [
    { k: 'A', n: 'Entrada A · Transversal 71B', d: 'Portería Tv. 71B n.º 9-01. Plaza de entrada y recepción del instituto.', p: M(9580, 2697) },
    { k: 'B', n: 'Entrada B · Calle 7A', d: 'Puerta barrial al mercado: se compra aunque el instituto esté cerrado.', p: M(9180, 2390) },
    { k: 'C', n: 'Entrada C · Av. Boyacá', d: 'Servicio: carga y descarga hacia poscosecha, D2 y orgánicos.', p: M(8974, 3008) }
  ];
  const RUTAS = {
    pub: { n: 'Calle peatonal pública', c: '#fbbf24', d: '71B → plaza de entrada → foro → mercado → 7A', p: [[9580, 2697], [9470, 2770], [9300, 2757], [9240, 2810], [9168, 2874], [9232, 2948], [9300, 2988], [9300, 2938], [9262, 2862], [9245, 2790], [9205, 2738], [9198, 2600], [9180, 2392]] },
    car: { n: 'Carga y servicio', c: '#ef4444', d: 'Av. Boyacá → poscosecha → patio D2 → compostaje', p: [[8974, 3008], [9040, 3050], [9150, 3110], [9200, 3214], [9300, 3186], [9368, 3214], [9420, 3238], [9490, 3200], [9488, 3170], [9520, 3140]] },
    doc: { n: 'Recorrido docente', c: '#38bdf8', d: 'aula → laboratorios → cultivo → poscosecha', p: [[9185, 2990], [9290, 2985], [9365, 2972], [9440, 3055], [9440, 3150], [9478, 3085], [9500, 3195], [9420, 3238]] }
  };
  const COSECHA = [ // la caja de lechuga
    { t: 'Sale el grupo del aula', x: 'Un grupo de 24 recibe la explicación del ensayo en el instituto y sale por la cara interior de la L.', k: 'inst', p: [[9185, 2990]] },
    { t: 'Pasa por los laboratorios', x: 'Biotecnología vegetal prepara el registro del ensayo y sale directo al cultivo.', k: 'lab', p: [[9290, 2985], [9365, 2972], [9440, 3055], [9440, 3150]] },
    { t: 'Cosecha en el invernadero', x: 'Recoge lechugas del módulo A, pesa una caja y registra el lote.', k: 'campo', p: [[9478, 3085]] },
    { t: 'Poscosecha: sensor en el empaque', x: 'Se selecciona, se empaca y se prueba un indicador de humedad del laboratorio de materiales.', k: 'pos', p: [[9500, 3195], [9420, 3238], [9372, 3214]] },
    { t: 'Mercado: ¿se entiende la etiqueta?', x: 'Ciencias cognitivas observa si el comerciante entiende la información y qué decide con la caja.', k: 'mer', p: [[9420, 3238], [9445, 3100], [9380, 2965], [9300, 2938]] },
    { t: 'Las hojas descartadas, a compostaje', x: 'Lo que no se vende va en un carro corto al patio D2 y a la estación de compostaje; se pesa por lote.', k: 'comp', p: [[9380, 2965], [9445, 3060], [9500, 3120], [9527, 3133]] },
    { t: 'El tablero del distrito', x: 'Peso vendido, residuos y energía usada. De cada 100 kg que recibe el mercado: cuántos se venden, cuántos siguen siendo alimento y cuántos van a compost.', k: null, p: [[9527, 3133]] }
  ];

  /* ---------- materiales ---------- */
  const mBasic = (c, o, ex = {}) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, toneMapped: false, ...ex });
  const mStd = (c, ex = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...ex });
  const lineas = (P, y, col, op = 1, cerrado = true, dash = 0) => { const a = []; const n = P.length; for (let i = 0; i < (cerrado ? n : n - 1); i++) { const p = P[i], q = P[(i + 1) % n]; a.push(p[0], y, p[1], q[0], y, q[1]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    const m = dash ? new THREE.LineDashedMaterial({ color: col, dashSize: dash, gapSize: dash * 0.7, transparent: true, opacity: op, depthWrite: false, toneMapped: false }) : new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, toneMapped: false });
    const l = new THREE.LineSegments(g, m); if (dash) l.computeLineDistances(); return l; };
  const losa = (P, y, mat) => { const s = new THREE.Shape(P.map(q => new THREE.Vector2(q[0], -q[1]))); const g = new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2); g.translate(0, y, 0); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m; };

  /* ---------- 1. volúmenes de luz sobre los edificios del programa ---------- */
  const PULSO = []; // materiales que respiran
  const envolver = (Wp, h, col, k) => {
    const n = Wp.length, [cx, cz] = centro(Wp), Q = Wp.map(q => { const dx = q[0] - cx, dz = q[1] - cz, d = Math.hypot(dx, dz) || 1; return [q[0] + dx / d * 0.9, q[1] + dz / d * 0.9]; }), y0 = 0.2, y1 = h + 1.2;
    const P = [], I = [], L = []; for (const q of Q) P.push(q[0], y0, q[1]); for (const q of Q) P.push(q[0], y1, q[1]);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; I.push(i, j, n + i, j, n + j, n + i); L.push(Q[i][0], y1, Q[i][1], Q[j][0], y1, Q[j][1], Q[i][0], y0, Q[i][1], Q[i][0], y1, Q[i][1], Q[i][0], y0, Q[i][1], Q[j][0], y0, Q[j][1]); }
    let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(Q.map(q => new THREE.Vector2(q[0], q[1])), []); } catch (e) {} for (const t of tri) I.push(n + t[0], n + t[1], n + t[2]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
    const mv = mBasic(col, 0.26, { side: THREE.DoubleSide }), m = new THREE.Mesh(g, mv); m.renderOrder = 8;
    const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); const ml = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.95, toneMapped: false }), li = new THREE.LineSegments(gl, ml); li.renderOrder = 9;
    const gr = new THREE.Group(); gr.add(m, li); gr.userData = { k, mv, ml, base: 0.26 }; PULSO.push(gr); grupo.add(gr); return gr;
  };
  const ENV = {}; PROG.forEach(p => { if (p.e) ENV[p.k] = p.e.map(i => envolver(ED[i].W, ED[i].h, p.c, p.k)); });

  /* ---------- 2. retiros D1 y D2: contorno rojo punteado y lo que aparece en su lugar ---------- */
  const RET = [
    { k: 'D1', i: 27, n: 'D1 · Acceso al instituto', se: 'Caseta o anexo deteriorado que obstruye la conexión desde la portería de la Tv. 71B hacia el edificio en L.', pone: 'Plaza de entrada del distrito: bicicleteros, bancas, punto de información y encuentro para 24 estudiantes.' },
    { k: 'D2', i: 20, n: 'D2 · Patio de transferencia', se: 'Anexo liviano de contratistas o servicio con deterioro comprobado.', pone: 'Patio de transferencia y demostración: canastillas por la mañana, talleres de empaque y encuentros con productores después.' }
  ];
  RET.forEach(r => { const e = ED[r.i]; const l = lineas(e.W, 0.6, '#ef4444', 1, true, 1.6); l.renderOrder = 9; grupo.add(l); const l2 = lineas(e.W, e.h, '#ef4444', 0.55, true, 1.6); grupo.add(l2); r.c = centro(e.W); r.h = e.h; });
  // plaza de entrada (D1)
  {
    const P = rect(C_PLAZA, 30, 18), pl = losa(P, 0.35, mStd('#cfc8bb', { roughness: 0.9 })); grupo.add(pl, lineas(P, 0.4, '#fbbf24', 0.8));
    const bancas = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 0.45, 0.6), mStd('#8a6a48'), 6), bici = new THREE.InstancedMesh(new THREE.TorusGeometry(0.42, 0.05, 6, 16, Math.PI), mStd('#9ca3af', { metalness: 0.6, roughness: 0.4 }), 10), o = new THREE.Object3D();
    for (let i = 0; i < 6; i++) { const q = loc(C_PLAZA, -11 + i * 4.4, 6.5); o.position.set(q[0], 0.6, q[1]); o.rotation.set(0, -ANG, 0); o.updateMatrix(); bancas.setMatrixAt(i, o.matrix); }
    for (let i = 0; i < 10; i++) { const q = loc(C_PLAZA, -12 + i * 1.1, -7); o.position.set(q[0], 0.35, q[1]); o.rotation.set(0, -ANG + Math.PI / 2, 0); o.updateMatrix(); bici.setMatrixAt(i, o.matrix); }
    bancas.castShadow = bici.castShadow = true; grupo.add(bancas, bici);
    const info = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 1.2), mStd('#1f2937')); const q = loc(C_PLAZA, 8, -4); info.position.set(q[0], 1.45, q[1]); info.rotation.y = -ANG; grupo.add(info);
  }
  // patio de transferencia (D2): losa sobre la huella ampliada y pilas de canastillas
  const C_D2 = centro(ED[20].W);
  {
    const P = rect(C_D2, 46, 20), pl = losa(P, 0.32, mStd('#bdb6aa', { roughness: 0.95 })); grupo.add(pl, lineas(P, 0.38, '#ef4444', 0.5));
    const can = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.3, 0.4), mStd('#22c55e', { roughness: 0.6 }), 36), o = new THREE.Object3D(); let k = 0;
    for (let s = 0; s < 6; s++) for (let a = 0; a < 6; a++) { const q = loc(C_D2, -15 + s * 1.4, -5 + (a % 2) * 0.7); o.position.set(q[0], 0.5 + Math.floor(a / 2) * 0.32, q[1]); o.rotation.set(0, -ANG, 0); o.updateMatrix(); can.setMatrixAt(k++, o.matrix); }
    can.castShadow = true; grupo.add(can);
  }

  /* ---------- 3. campo experimental: 4 módulos de 8 camas (A y B bajo invernadero) ---------- */
  const MODS = [
    { k: 'A', n: 'A · Referencia bajo cubierta', inv: true, cul: ['#7cc243'], q: '¿Cuánta agua, tiempo y superficie para una caja vendible?', u: -7.2, v: -7.2 },
    { k: 'B', n: 'B · Biotecnología', inv: true, cul: ['#7cc243', '#a3d65c'], q: '¿El tratamiento biológico cambia el peso comercial o la pérdida de plantas?', u: 7.2, v: -7.2 },
    { k: 'C', n: 'C · Cultivo exterior', inv: false, cul: ['#86c64b'], q: '¿Qué cambia frente al módulo A en agua, temperatura, fauna y kilos aprovechables?', u: -7.2, v: 7.2 },
    { k: 'D', n: 'D · Producción por pedido', inv: false, cul: ['#2f6b2a', '#2f6b2a', '#2f6b2a', '#2f6b2a', '#5fae3a', '#5fae3a', '#5fae3a', '#5fae3a'], q: '¿Cuánto sembrar para cumplir un pedido real y cuánto queda sin vender? (4 acelga, 4 cilantro)', u: 7.2, v: 7.2 }
  ];
  {
    const P = rect(C_CAMPO, 28.6, 28.6); grupo.add(losa(P, 0.3, mStd('#a89a84', { roughness: 1 })), lineas(P, 0.36, '#4ade80', 0.9));
    const nC = MODS.length * 8, cama = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, 0.45, 10), mStd('#6b4f36'), nC), hoja = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.28, 9.7), mStd('#ffffff', { roughness: 0.7 }), nC), o = new THREE.Object3D(), cc = new THREE.Color(); let k = 0;
    const matPiel = new THREE.MeshStandardMaterial({ color: '#eef6f2', roughness: 0.15, metalness: 0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }), matCost = mStd('#d1d5db', { metalness: 0.5, roughness: 0.4 });
    for (const md of MODS) {
      const cm = loc(C_CAMPO, md.u, md.v);
      for (let b = 0; b < 8; b++) { const q = loc(cm, -5.6 + b * 1.6, 0); o.position.set(q[0], 0.55, q[1]); o.rotation.set(0, -ANG, 0); o.scale.set(1, 1, 1); o.updateMatrix(); cama.setMatrixAt(k, o.matrix);
        o.position.y = 0.92; o.updateMatrix(); hoja.setMatrixAt(k, o.matrix); hoja.setColorAt(k, cc.set(md.cul[b % md.cul.length]).multiplyScalar(0.9 + ((b * 37) % 10) / 50)); k++; }
      if (md.inv) { // túnel: piel translúcida y costillas cada 1,5 m, eje a lo largo de las camas
        const g = new THREE.Group(); g.position.set(cm[0], 0.3, cm[1]); g.rotation.y = -ANG;
        const piel = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.6, 13.4, 28, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2), matPiel); piel.scale.set(1, 0.72, 1); piel.renderOrder = 7; g.add(piel);
        for (let z = -6.6; z <= 6.7; z += 1.65) { const r = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.06, 4, 24, Math.PI), matCost); r.scale.set(1, 0.72, 1); r.position.z = z; g.add(r); }
        for (const s of [-1, 1]) { const tapa = new THREE.Mesh(new THREE.CircleGeometry(6.6, 24, 0, Math.PI), matPiel); tapa.scale.set(1, 0.72, 1); tapa.position.z = s * 6.7; g.add(tapa); }
        grupo.add(g);
      }
    }
    hoja.instanceColor.needsUpdate = true; cama.castShadow = cama.receiveShadow = hoja.receiveShadow = true; grupo.add(cama, hoja);
  }

  /* ---------- 4. compostaje: cubierta liviana de 10 x 6 m y tres composteras de ~1 m³ ---------- */
  {
    const g = new THREE.Group(); g.position.set(C_COMP[0], 0, C_COMP[1]); g.rotation.y = -ANG;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 6).translate(0, 0.3, 0), mStd('#9ca3af')));
    const poste = new THREE.BoxGeometry(0.18, 3.6, 0.18), mp = mStd('#4b5563', { metalness: 0.4 });
    for (const x of [-4.9, 0, 4.9]) for (const z of [-2.9, 2.9]) { const m = new THREE.Mesh(poste, mp); m.position.set(x, 2.1, z); g.add(m); }
    const techo = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.08, 6.6), mStd('#6b7f6a', { transparent: true, opacity: 0.85 })); techo.position.set(0, 3.9, 0); techo.rotation.x = 0.06; techo.castShadow = true; g.add(techo);
    for (let i = 0; i < 3; i++) { const caja = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 1.3), mStd('#8b5a2b')); caja.position.set(-2.6 + i * 2.2, 0.95, -1); caja.castShadow = true; g.add(caja);
      const tope = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 1.15), mStd('#3b2a1a')); tope.position.set(-2.6 + i * 2.2, 1.46, -1); g.add(tope); }
    grupo.add(g); grupo.add(lineas(rect(C_COMP, 10.8, 6.8), 0.5, '#d4a373', 0.9));
  }

  /* ---------- 5. estación solar: 20 paneles de 500 Wp (2,1 x 1,05 m) en la cubierta del mercado ---------- */
  {
    const e = ED[8], c = centro(e.W); let L0 = 0, a = 0; for (let i = 0; i < e.W.length; i++) { const p = e.W[i], q = e.W[(i + 1) % e.W.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l > L0) { L0 = l; a = Math.atan2(q[1] - p[1], q[0] - p[0]); } }
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, 0.05, 2.1), new THREE.MeshStandardMaterial({ color: '#1d3557', roughness: 0.25, metalness: 0.5, emissive: '#0b1a2e' }), 20), o = new THREE.Object3D();
    for (let i = 0; i < 20; i++) { const u = -5.4 + (i % 10) * 1.2, v = i < 10 ? -1.3 : 1.3, x = c[0] + u * Math.cos(a) - v * Math.sin(a), z = c[1] + u * Math.sin(a) + v * Math.cos(a);
      o.position.set(x, e.h + 0.55, z); o.rotation.set(0, -a, 0.17); o.updateMatrix(); pm.setMatrixAt(i, o.matrix); }
    pm.castShadow = true; grupo.add(pm);
  }

  /* ---------- 6. observación ecológica: dos plataformas en el borde del bosque ---------- */
  OBS.forEach(p => { const g = new THREE.Group(); g.position.set(p[0], 0, p[1]);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.35, 6).translate(0, 0.6, 0), mStd('#a47148')));
    for (let i = 0; i < 6; i++) { const t = i / 6 * Math.PI * 2, m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), mStd('#7c5a3a')); m.position.set(Math.cos(t) * 4, 1.3, Math.sin(t) * 4); g.add(m); }
    const ani = new THREE.Mesh(new THREE.RingGeometry(5.2, 6, 48).rotateX(-Math.PI / 2), mBasic('#2dd4bf', 0.7, { side: THREE.DoubleSide })); ani.position.y = 0.5; g.add(ani); PULSO.push({ userData: { mv: ani.material, base: 0.5 } });
    grupo.add(g); });

  /* ---------- 7. recorridos animados y accesos ---------- */
  const matRuta = (col, rep) => new THREE.ShaderMaterial({
    uniforms: { uT: TU, uC: { value: new THREE.Color(col) }, uRep: { value: rep }, uA: { value: 1 } },
    vertexShader: 'varying float vU; void main(){ vU=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uC; uniform float uT,uRep,uA; varying float vU;\nvoid main(){ float d=fract(vU*uRep-uT*.6); float a=.35+pow(d,5.)*1.4; gl_FragColor=vec4(uC*a,min(1.,a)*uA);\n#include <colorspace_fragment>\n}',
    transparent: true, depthWrite: false, toneMapped: false
  });
  const TU = { value: 0 };
  const RUT = {};
  for (const [k, r] of Object.entries(RUTAS)) {
    const curva = new THREE.CatmullRomCurve3(r.p.map(q => { const w = M(q[0], q[1]); return new THREE.Vector3(w[0], 1.1, w[1]); }), false, 'centripetal');
    const L = curva.getLength(), mat = matRuta(r.c, L / 9), m = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.round(L / 3), k === 'pub' ? 1.15 : 0.85, 6), mat); m.renderOrder = 10; grupo.add(m);
    RUT[k] = { ...r, curva, L, mat, m };
  }
  // gente y vehículos que recorren las rutas
  const AG = []; {
    const cap = new THREE.CapsuleGeometry(0.28, 1.1, 3, 6).translate(0, 0.85, 0), van = new THREE.BoxGeometry(2, 2.1, 4.6).translate(0, 1.05, 0);
    const def = [['pub', 34, cap, '#fde68a', 1.25], ['doc', 24, cap, '#7dd3fc', 1.1], ['car', 3, van, '#f8fafc', 4.5]];
    for (const [k, n, g, c, vel] of def) { const im = new THREE.InstancedMesh(g, mStd(c, { roughness: 0.6 }), n); im.castShadow = true; grupo.add(im);
      AG.push({ r: RUT[k], im, n, vel, t: Array.from({ length: n }, (_, i) => k === 'doc' ? (i / n) * 0.12 : i / n), lado: Array.from({ length: n }, () => (Math.random() - 0.5) * 2.2) }); }
  }
  ACC.forEach(a => { const g = new THREE.Group(); g.position.set(a.p[0], 0, a.p[1]);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 9, 12).translate(0, 4.5, 0), mBasic('#ffffff', 0.85)); const ani = new THREE.Mesh(new THREE.RingGeometry(3, 3.8, 40).rotateX(-Math.PI / 2), mBasic('#fbbf24', 0.8, { side: THREE.DoubleSide })); ani.position.y = 0.6;
    g.add(m, ani); grupo.add(g); a.ani = ani; });

  /* ---------- 8. la caja de lechuga (seguir una cosecha) ---------- */
  const caja = new THREE.Group(); caja.visible = false; grupo.add(caja);
  caja.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 1.2), new THREE.MeshBasicMaterial({ color: '#86efac', toneMapped: false })));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 14), mBasic('#4ade80', 0.18, { blending: THREE.AdditiveBlending })); caja.add(halo);
  const rastro = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 60, 8).translate(0, 30, 0), mBasic('#bbf7d0', 0.5, { blending: THREE.AdditiveBlending })); caja.add(rastro);

  /* ---------- etiquetas 3D (HTML proyectado) ---------- */
  const css = document.createElement('style');
  css.textContent = `
.bd-lb{position:fixed;left:0;top:0;z-index:7;display:none;cursor:pointer;font-family:Inter,system-ui,sans-serif;color:#eef1f3;white-space:nowrap}
.bd-lb .cj{display:flex;align-items:stretch;background:rgba(10,13,17,.78);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);border-radius:6px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.bd-lb .k{display:flex;align-items:center;padding:0 6px;font:600 10px 'JetBrains Mono',ui-monospace,monospace;color:#0b0d10;background:var(--c)}
.bd-lb .t{padding:4px 8px 4px 7px;line-height:1.15}
.bd-lb b{display:block;font-weight:600;font-size:11px}
.bd-lb small{display:block;font:400 9.5px 'JetBrains Mono',ui-monospace,monospace;color:#9aa4ab;letter-spacing:.04em;margin-top:1px}
.bd-lb .pt{position:absolute;left:10px;top:100%;width:1px;height:18px;background:linear-gradient(var(--c),transparent)}
.bd-lb.act .cj,.bd-lb:hover .cj{border-color:var(--c);box-shadow:0 0 0 1px var(--c),0 8px 22px rgba(0,0,0,.45)}
.bd-lb.dim{opacity:.35}
.bd-lb.ret .cj{border-style:dashed;border-color:#ef4444}.bd-lb.ret .k{background:#ef4444;color:#fff}
.bd-lb.acc .k{background:#fbbf24}
@media(max-width:760px){.bd-lb small{display:none}.bd-lb b{font-size:10px}.bd-lb .t{padding:3px 6px}.bd-lb.sec{display:none!important}}
#bd{position:fixed;z-index:32;right:14px;top:14px;width:380px;max-height:calc(100vh - 118px);display:none;flex-direction:column;font-family:Inter,system-ui,sans-serif;color:#e9ebec;
  background:rgba(12,14,17,.84);-webkit-backdrop-filter:blur(18px) saturate(1.1);backdrop-filter:blur(18px) saturate(1.1);border:1px solid rgba(255,255,255,.08);border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,.4);overflow:hidden}
#bd.on{display:flex;animation:bdIn .45s cubic-bezier(.2,.8,.2,1)}
@keyframes bdIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
body.bd-on #dock,body.bd-on #hid-red{display:none!important}
#bd header,#bd .tabs,#bd .pie{flex:none}#bd .cuerpo{flex:1 1 auto;min-height:0}
#bd header{position:relative;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.06)}
#bd .cerrar{position:absolute;right:10px;top:10px;width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cfd5d9;font:400 17px/1 Inter,system-ui,sans-serif;cursor:pointer}
#bd .cerrar:hover{background:rgba(255,255,255,.1);color:#fff}#bd .cerrar:focus-visible{outline:2px solid #fb7185;outline-offset:1px}
#bd .ey{padding-right:34px}
#bd .ey{font:500 9.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#fb7185}
#bd h2{margin:5px 0 6px;font:600 18px Inter,system-ui,sans-serif;letter-spacing:-.01em}
#bd .lead{margin:0;font-size:12.5px;line-height:1.5;color:#b9c1c6}
#bd .kp{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
#bd .kp div{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:7px 8px}
#bd .kp b{display:block;font:500 15px 'JetBrains Mono',ui-monospace,monospace;color:#fff}
#bd .kp span{font-size:10px;color:#8e979d;line-height:1.25;display:block;margin-top:2px}
#bd .tabs{display:flex;gap:2px;padding:6px 8px 0;overflow-x:auto;scrollbar-width:none}
#bd .tabs button{flex:none;border:0;background:none;color:#8e979d;font:500 11.5px Inter,system-ui,sans-serif;padding:7px 9px;border-radius:7px 7px 0 0;cursor:pointer;border-bottom:2px solid transparent}
#bd .tabs button[aria-selected="true"]{color:#fff;border-bottom-color:#fb7185}
#bd .tabs button:focus-visible{outline:2px solid #fb7185;outline-offset:-2px}
#bd .cuerpo{overflow:auto;padding:10px 12px 12px;border-top:1px solid rgba(255,255,255,.06);overscroll-behavior:contain}
#bd .it{display:grid;grid-template-columns:22px 1fr auto;gap:2px 9px;align-items:start;padding:8px 6px;border-radius:8px;cursor:pointer}
#bd .it:hover,#bd .it.act{background:rgba(255,255,255,.05)}
#bd .it:focus-visible{outline:2px solid #fb7185;outline-offset:-2px}
#bd .it i{grid-row:span 2;width:22px;height:22px;border-radius:6px;background:var(--c);display:flex;align-items:center;justify-content:center;font:600 10px 'JetBrains Mono',ui-monospace,monospace;color:#0b0d10;font-style:normal}
#bd .it b{font-size:12.5px;font-weight:600}
#bd .it em{font:500 10.5px 'JetBrains Mono',ui-monospace,monospace;color:#cfd5d9;font-style:normal}
#bd .it p{grid-column:2 / 4;margin:0;font-size:11.5px;line-height:1.45;color:#9aa4ab}
#bd .it .x{display:none;color:#cfd5d9;margin-top:4px}
#bd .it.act .x{display:block}
#bd .sub{font:500 9.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#7b858c;margin:12px 6px 4px}
#bd .nota{font-size:10.5px;color:#7b858c;line-height:1.45;margin:10px 6px 0}
#bd .ind{margin:6px 6px 0;padding:10px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);font-size:11.5px;color:#b9c1c6;line-height:1.45}
#bd .ind .bar{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:8px 0 6px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.06) 0 6px,transparent 6px 10px)}
#bd .ind .lg{display:flex;flex-wrap:wrap;gap:4px 12px;font:500 10px 'JetBrains Mono',ui-monospace,monospace;color:#9aa4ab}
#bd .ind .lg span{display:inline-flex;align-items:center;gap:5px}#bd .ind .lg i{width:8px;height:8px;border-radius:2px}
#bd .ruta{display:flex;gap:9px;align-items:flex-start;padding:7px 6px;font-size:11.5px;color:#b9c1c6;line-height:1.4}
#bd .ruta i{flex:none;width:18px;height:3px;border-radius:2px;margin-top:7px}
#bd .ruta b{color:#e9ebec;font-weight:600}
#bd .pie{display:flex;gap:6px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.06)}
#bd .pie button{flex:1;height:34px;border-radius:8px;cursor:pointer;font:500 12px Inter,system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:7px}
#bd .go{border:1px solid rgba(74,222,128,.5);background:linear-gradient(180deg,rgba(74,222,128,.22),rgba(74,222,128,.08));color:#dcfce7}
#bd .go:hover{background:rgba(74,222,128,.3);color:#fff}
#bd .sec2{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cfd5d9}
#bd .pie button:focus-visible{outline:2px solid #fb7185;outline-offset:1px}
#bd-cap{position:fixed;z-index:33;left:50%;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 84px);transform:translateX(-50%);width:min(480px,calc(100vw - 24px));display:none;
  font-family:Inter,system-ui,sans-serif;color:#eef1f3;background:rgba(10,13,17,.84);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:11px 14px 12px;box-shadow:0 16px 40px rgba(0,0,0,.4)}
#bd-cap.on{display:block;animation:bdCap .4s cubic-bezier(.2,.8,.2,1)}
@keyframes bdCap{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
#bd-cap .tp{display:flex;align-items:center;gap:8px;font:500 10.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em;color:#4ade80}
#bd-cap .tp span:nth-child(2){flex:1;height:2px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
#bd-cap .tp span:nth-child(2) i{display:block;height:100%;width:0;background:#4ade80}
#bd-cap button{width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cfd5d9;cursor:pointer;font:400 16px/1 Inter,system-ui,sans-serif}
#bd-cap h3{margin:8px 0 3px;font:600 15px Inter,system-ui,sans-serif}
#bd-cap p{margin:0;font-size:12.5px;line-height:1.5;color:#b9c1c6}
@media(max-width:1100px){#bd-cap{bottom:auto;top:calc(max(10px,env(safe-area-inset-top)) + 10px)}}
@media(max-width:760px){
  #bd{left:8px;right:8px;width:auto;top:auto;bottom:calc(max(8px,env(safe-area-inset-bottom)) + 66px);max-height:52vh}
  #bd.min .cuerpo,#bd.min .tabs,#bd.min .kp,#bd.min .lead{display:none}
  #bd.min h2::after{content:' ▴';color:#7b858c;font-size:12px}
  #bd header{padding:10px 12px 8px;cursor:pointer}#bd h2{font-size:15px;margin:3px 0 4px}
  body.bd-on #esc{display:none}
}
@media(prefers-reduced-motion:reduce){#bd.on,#bd-cap.on{animation:none}}`;
  document.head.appendChild(css);
  const ETQ = [];
  const etiqueta = (n, sub, col, pos, cls = '', fn = null, num = '') => { const d = document.createElement('div'); d.className = 'bd-lb ' + cls; d.style.setProperty('--c', col);
    d.innerHTML = `<div class="cj"><span class="k">${num}</span><span class="t"><b>${n}</b>${sub ? `<small>${sub}</small>` : ''}</span></div><i class="pt"></i>`;
    if (fn) { d.setAttribute('role', 'button'); d.tabIndex = 0; d.onclick = fn; d.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }; }
    document.body.appendChild(d); const o = { d, pos }; ETQ.push(o); return o; };
  const POS = {
    inst: [...centro(ED[3].W), ED[3].h + 4], lab: [...centro(ED[11].W), ED[11].h + 4], campo: [...C_CAMPO, 9], pos: [...centro(ED[0].W), ED[0].h + 4],
    mer: [...centro(ED[8].W), ED[8].h + 6], foro: [...centro(ED[2].W), ED[2].h + 4], comp: [...C_COMP, 7], sol: [...centro(ED[8].W), ED[8].h + 6], obs: [...OBS[0], 6]
  };
  const LBP = {};
  PROG.forEach((p, i) => { if (p.k === 'sol') return; const ps = POS[p.k]; LBP[p.k] = etiqueta(p.n, p.a, p.c, [ps[0], ps[2], ps[1]], '', () => enfocar(p.k), String(i + 1).padStart(2, '0')); });
  LBP.sol = etiqueta('Estación solar', '20 paneles · 10 kWp', '#facc15', [POS.sol[0] + 6, POS.sol[2] + 4, POS.sol[1] + 6], 'sec', () => enfocar('sol'), '08');
  etiqueta('Observación ecológica', '12 estudiantes', '#2dd4bf', [OBS[1][0], 6, OBS[1][1]], 'sec', () => enfocar('obs'), '09');
  RET.forEach(r => etiqueta(r.n, 'se retira', '#ef4444', [r.c[0], r.h + 5, r.c[1]], 'ret', () => enfocar(r.k), r.k));
  ACC.forEach(a => etiqueta(a.n, '', '#fbbf24', [a.p[0], 11, a.p[1]], 'acc', () => volarA(a.p, 160), a.k));

  /* ---------- panel ---------- */
  const pan = document.createElement('section'); pan.id = 'bd'; pan.setAttribute('aria-label', 'Bavaria Común, distrito de tecnologías convergentes');
  const fila = (num, col, n, a, d, x, data) => `<div class="it" ${data} tabindex="0" role="button" style="--c:${col}"><i>${num}</i><b>${n}</b><em>${a || ''}</em><p>${d}${x ? `<span class="x">${x}</span>` : ''}</p></div>`;
  const TABS = {
    prog: () => PROG.map((p, i) => fila(String(i + 1).padStart(2, '0'), p.c, p.n, p.a, p.d, p.x, `data-k="${p.k}"`)).join('') +
      `<div class="sub">Se propone retirar</div>` + RET.map(r => fila(r.k, '#ef4444', r.n, '', `<b style="font-weight:600;color:#fca5a5">Se retira:</b> ${r.se}`, `<b style="font-weight:600;color:#e9ebec">Aparece:</b> ${r.pone}`, `data-k="${r.k}"`)).join('') +
      `<p class="nota">Áreas: metas de anteproyecto. Se conservan y adaptan los volúmenes mayores recuperables; la obra nueva son los dos invernaderos, la cubierta del compostaje y las plazas. Antes de usar una cubierta o un suelo se cruza con las antiguas áreas de combustible y las cubiertas de asbesto-cemento del estudio ambiental.</p>`,
    cult: () => `<p class="nota" style="margin-top:2px">Cuatro módulos docentes, 32 camas de 1,25 × 10 m (100 m² sembrados por módulo). 800 m²: la mitad camas y la otra mitad pasillos, semillero (60), herramientas (30), riego (30), sustratos (40) y pesaje (20).</p>` +
      MODS.map(m => fila(m.k, m.inv ? '#86efac' : '#4ade80', m.n, m.inv ? 'invernadero' : 'exterior', m.q, '', `data-mod="${m.k}"`)).join('') +
      `<div class="ind">Los 300 m² de lechuga podrían entregar <b style="color:#fff">unas 90–200 unidades de 250 g por semana</b> (siembra escalonada en ocho semanas y 15 % de merma supuesta). La cifra se comprueba pesando cosechas.</div>`,
    labs: () => `<p class="nota" style="margin-top:2px">La práctica que los conecta: seguir una caja de lechuga desde la cama hasta el puesto que la vende.</p>` +
      [['Biotecnología vegetal', '60 m²', 'Seis mesas en parejas, lavado, mesón y muestras; salida directa a los invernaderos.', 'Entrega un ensayo documentado (germinación, crecimiento o bioinsumo) contrastado con las camas de control.'],
       ['Materiales y nanosensores', '60 m²', 'Seis puestos, banco de electrónica y ensayo de empaques, con una universidad aliada.', 'Compara un indicador de humedad nanoestructurado con un sensor convencional; primero en banco.'],
       ['Información y simulación', '60 m²', 'Doce estaciones y pantalla común con los registros de cultivo, energía, residuos y pedidos.', 'El tablero real del distrito: qué cama se cosechó, cuánto pesó, cuánta energía, cuántos kilos a compost y a qué mercado fue el lote.'],
       ['Ciencias cognitivas', '30 m²', 'Mesa de prueba, muestras de etiquetas y lugar para observar a un participante, por turnos.', 'Qué etiqueta o alerta entiende mejor un comerciante, cuánto tarda y qué decide con la caja.']]
        .map((l, i) => fila('L' + (i + 1), '#c084fc', l[0], l[1], l[2], 'Entrega: ' + l[3], '')).join('') +
      `<p class="nota">+25 m² de preparación y lavado y 15 m² de depósito técnico. Biotecnología sale al cultivo; sensores se conecta con empaque; datos recibe de todos; ciencias cognitivas queda cerca del mercado.</p>`,
    ciclo: () => `<div class="sub">Compostaje · 60 m² junto al patio D2</div>` +
      ['Separación: en cultivo, poscosecha y mercado se recogen aparte los restos vegetales aptos.', 'Pesaje: se registran los kilos de cada actividad (¿el descarte es al cosechar o después de la venta?).', 'Proceso: mezcla con material seco; temperatura, humedad y manejo por lote.', 'Maduración y destino: primero jardinería demostrativa; en camas alimentarias solo con controles de calidad.', 'Ajuste: cuatro semanas pesando entradas para saber si alcanzan las tres composteras.']
        .map((t, i) => fila(i + 1, '#d4a373', t.split(':')[0], '', t.split(':').slice(1).join(':'), '', '')).join('') +
      `<div class="ind"><b style="color:#fff">Indicador:</b> de cada 100 kg que recibe el mercado, cuántos se venden, cuántos siguen siendo alimento y cuántos van a compost.<div class="bar"></div><div class="lg"><span><i style="background:#fb7185"></i>vendido</span><span><i style="background:#4ade80"></i>alimento aprovechable</span><span><i style="background:#d4a373"></i>compost</span><span style="color:#7b858c">se mide en el piloto</span></div></div>` +
      `<div class="sub">Energía · 10 kWp</div>` + fila('☀', '#facc15', '20 paneles de 500 Wp', '~60 m²', 'Cubierta existente apta: se compara la del mercado y la de poscosecha por sombras, estado y cercanía al cuarto eléctrico.', 'Paneles, canalización, inversor, protecciones, medidor y conexión al tablero. Mide bombeo de riego, sensores, iluminación y cámara fría; la red cubre el resto. Los kWh/día salen de la simulación de sombras y cargas.', 'data-k="sol"'),
    acc: () => ACC.map(a => fila(a.k, '#fbbf24', a.n, '', a.d, '', `data-acc="${a.k}"`)).join('') + `<div class="sub">Recorridos</div>` +
      Object.values(RUTAS).map(r => `<div class="ruta"><i style="background:${r.c}"></i><div><b>${r.n}</b><br>${r.d}</div></div>`).join('') +
      `<div class="sub">¿Mejora la sintaxis espacial?</div><p class="nota" style="margin-top:0">Comparar estado actual, plan parcial oficial y Bavaria Común con el mismo perímetro: minutos a pie desde 71B y 7A al mercado, giros hasta la recepción, metros de una canastilla de la cama a poscosecha y cruces entre compradores y carga. Luego integración y elección angular a 400 y 800 m. Hasta correr el análisis son objetivos de diseño.</p>`
  };
  pan.innerHTML = `<header><button type="button" class="cerrar" aria-label="Cerrar Bavaria Común">&#215;</button><div class="ey">Bavaria Común · distrito NBIC</div><h2>Cultivar, conservar, distribuir y aprovechar</h2>
      <p class="lead">Estudiantes, investigadores, productores y comerciantes trabajan sobre un mismo sistema. El instituto dirige los ensayos, los cultivos producen datos y alimentos, y el mercado prueba los resultados con compradores reales.</p>
      <div class="kp"><div><b>96</b><span>estudiantes por jornada (4 × 24)</span></div><div><b>2.125</b><span>m² programados</span></div><div><b>32</b><span>camas en 4 módulos</span></div></div></header>
    <nav class="tabs" role="tablist">${[['prog', 'Programa'], ['cult', 'Cultivos'], ['labs', 'Laboratorios'], ['ciclo', 'Compost y energía'], ['acc', 'Accesos']].map(([k, n], i) => `<button type="button" role="tab" data-t="${k}" aria-selected="${!i}">${n}</button>`).join('')}</nav>
    <div class="cuerpo" role="tabpanel"></div>
    <div class="pie"><button type="button" class="go" id="bd-go"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z" fill="currentColor"/></svg>Seguir una cosecha</button><button type="button" class="sec2" id="bd-ver">Vista general</button></div>`;
  document.body.appendChild(pan);
  const cuerpo = pan.querySelector('.cuerpo');
  let tab = 'prog';
  const pintar = () => { cuerpo.innerHTML = TABS[tab](); pan.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab))); cuerpo.scrollTop = 0; };
  pan.querySelector('.tabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; pintar(); if (tab === 'cult') enfocar('campo'); else if (tab === 'labs') enfocar('lab'); else if (tab === 'ciclo') enfocar('comp'); else if (tab === 'acc') general(); };
  const clicFila = (e) => { const it = e.target.closest('.it'); if (!it) return; cuerpo.querySelectorAll('.it.act').forEach(x => x !== it && x.classList.remove('act')); it.classList.toggle('act');
    if (it.dataset.k) enfocar(it.dataset.k, true); else if (it.dataset.mod) { const m = MODS.find(q => q.k === it.dataset.mod); volarA(loc(C_CAMPO, m.u, m.v), 70); } else if (it.dataset.acc) volarA(ACC.find(a => a.k === it.dataset.acc).p, 160); };
  cuerpo.addEventListener('click', clicFila); cuerpo.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clicFila(e); } });
  pan.querySelector('.cerrar').onclick = (e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('bav-cerrar')); };
  pan.querySelector('header').addEventListener('click', () => { if (innerWidth < 760) pan.classList.toggle('min'); });
  pan.querySelector('#bd-go').onclick = () => (paso >= 0 ? parar() : cosecha());
  pan.querySelector('#bd-ver').onclick = () => { parar(); general(); };

  /* ---------- cámara ---------- */
  let vuelo = 0;
  function volar(p1, t1, ms = 1500) {
    const o = T3.orbit; cancelAnimationFrame(vuelo);
    if (RMQ.matches) { T3.camera.position.copy(p1); o.target.copy(t1); o.update(); return; }
    const p0 = T3.camera.position.clone(), q0 = o.target.clone(), ini = performance.now();
    const f = () => { const k = Math.min(1, (performance.now() - ini) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; T3.camera.position.lerpVectors(p0, p1, e); o.target.lerpVectors(q0, t1, e); o.update(); if (k < 1) vuelo = requestAnimationFrame(f); };
    f();
  }
  // el panel ocupa la derecha (escritorio) o abajo (celular): cámara y punto mirado se corren para que lo enfocado quede a la vista
  const desplaza = (p1, t, d) => { const dir = t.clone().sub(p1).setY(0).normalize(), der = new THREE.Vector3(-dir.z, 0, dir.x);
    if (innerWidth > 760) { const k = d * 0.3; p1.addScaledVector(der, k); t.addScaledVector(der, k); } else { const k = -d * 0.22; p1.addScaledVector(dir, k); t.addScaledVector(dir, k); } }; // celular: lo enfocado sube en la pantalla (el panel va abajo)
  function volarA(c, dist, alto) { const t = new THREE.Vector3(c[0], 0, c[1]), a = -ANG + 0.9, p1 = new THREE.Vector3(c[0] + Math.sin(a) * dist, alto || dist * 0.75, c[1] + Math.cos(a) * dist); desplaza(p1, t, dist); volar(p1, t); }
  function general() { const c = M(9335, 3020), sm = MOV ? 1.5 : 1, t = new THREE.Vector3(c[0], 0, c[1]), p1 = new THREE.Vector3(c[0] + 170 * sm, 250 * sm, c[1] + 330 * sm); desplaza(p1, t, 330 * sm); volar(p1, t); resaltar(null); }
  function resaltar(k) {
    PULSO.forEach(g => { if (g.userData.k === undefined) return; g.userData.dim = !!k && g.userData.k !== k; });
    Object.entries(LBP).forEach(([kk, o]) => { o.d.classList.toggle('act', kk === k); o.d.classList.toggle('dim', !!k && kk !== k); });
  }
  function enfocar(k, desdePanel) {
    resaltar(k);
    const dist = { inst: 190, lab: 140, campo: 90, pos: 200, mer: 140, foro: 260, comp: 60, sol: 70, obs: 150, D1: 90, D2: 110 }[k] || 160;
    const c = k === 'D1' ? C_PLAZA : k === 'D2' ? C_D2 : k === 'obs' ? OBS[0] : [POS[k][0], POS[k][1]];
    volarA(c, dist);
    if (!desdePanel) { const t = ['campo'].includes(k) ? 'cult' : k === 'lab' ? 'labs' : ['comp', 'sol'].includes(k) ? 'ciclo' : 'prog'; if (t !== tab) { tab = t; pintar(); } const it = cuerpo.querySelector(`[data-k="${k}"]`); if (it) { it.classList.add('act'); it.scrollIntoView({ block: 'nearest', behavior: RMQ.matches ? 'auto' : 'smooth' }); } }
  }

  /* ---------- seguir una cosecha ---------- */
  const cap = document.createElement('section'); cap.id = 'bd-cap'; cap.setAttribute('aria-live', 'polite');
  cap.innerHTML = `<div class="tp"><span></span><span><i></i></span><button type="button" data-a="p" aria-label="Paso anterior">&#8249;</button><button type="button" data-a="n" aria-label="Paso siguiente">&#8250;</button><button type="button" data-a="x" aria-label="Terminar">&#215;</button></div><h3></h3><p></p>`;
  document.body.appendChild(cap);
  cap.onclick = (e) => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'p') irPaso(paso - 1); else if (b.dataset.a === 'n') irPaso(paso + 1); else parar(); };
  let paso = -1, tPaso = 0, cajaDe = null, cajaA = null; const DUR = 6500;
  function irPaso(i) {
    if (i < 0) i = 0; if (i >= COSECHA.length) { parar(); return; }
    const prev = paso >= 0 ? COSECHA[paso] : null; paso = i; const P = COSECHA[i];
    cap.querySelector('.tp span').textContent = `${String(i + 1).padStart(2, '0')} / ${String(COSECHA.length).padStart(2, '0')}`; cap.querySelector('h3').textContent = P.t; cap.querySelector('p').textContent = P.x; cap.classList.add('on');
    // la caja viaja por los puntos del paso, desde donde estaba
    const ini = prev ? prev.p[prev.p.length - 1] : P.p[0], pts = [ini, ...P.p].map(q => { const w = M(q[0], q[1]); return new THREE.Vector3(w[0], 2.2, w[1]); });
    cajaDe = pts.length > 1 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null; cajaA = pts[pts.length - 1]; caja.visible = true; if (!cajaDe) caja.position.copy(cajaA);
    resaltar(P.k); const fin = P.p[P.p.length - 1], w = M(fin[0], fin[1]);
    if (P.k) volarA(w, P.k === 'pos' ? 150 : P.k === 'mer' ? 120 : 90); else general();
    tPaso = performance.now();
    pan.querySelector('#bd-go').lastChild.textContent = 'Detener recorrido';
  }
  function cosecha() { irPaso(0); }
  function parar() { if (paso < 0) return; paso = -1; cap.classList.remove('on'); caja.visible = false; resaltar(null); pan.querySelector('#bd-go').lastChild.textContent = 'Seguir una cosecha'; }
  addEventListener('keydown', (e) => { if (paso >= 0 && e.key === 'Escape') parar(); });

  /* ---------- animación ---------- */
  let raf = 0, ult = performance.now(); const V = new THREE.Vector3(), o3 = new THREE.Object3D();
  function cuadro() {
    raf = requestAnimationFrame(cuadro); const ahora = performance.now(), dt = Math.min(0.1, (ahora - ult) / 1000); ult = ahora;
    const mov = !RMQ.matches; if (mov) TU.value += dt;
    PULSO.forEach(g => { const u = g.userData; if (!u.mv) return; const b = u.base * (u.dim ? 0.35 : 1); u.mv.opacity = mov ? b * (0.8 + 0.35 * Math.sin(ahora / 480)) : b; if (u.ml) u.ml.opacity = u.dim ? 0.25 : 0.95; });
    ACC.forEach(a => { const s = 1 + 0.25 * Math.sin(ahora / 350); a.ani.scale.set(s, 1, s); });
    for (const A of AG) { const { r, im, n, vel } = A;
      for (let i = 0; i < n; i++) { if (mov) A.t[i] = (A.t[i] + dt * vel / r.L) % 1; const t = A.t[i], p = r.curva.getPointAt(t), tg = r.curva.getTangentAt(t);
        o3.position.set(p.x - tg.z * A.lado[i], 0.3, p.z + tg.x * A.lado[i]); o3.rotation.set(0, Math.atan2(tg.x, tg.z), 0); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); }
      im.instanceMatrix.needsUpdate = true; }
    if (paso >= 0) { const k = Math.min(1, (ahora - tPaso) / DUR); cap.querySelector('.tp i').style.width = (k * 100).toFixed(1) + '%';
      if (cajaDe) { const kk = Math.min(1, (ahora - tPaso) / 2600), e = kk * kk * (3 - 2 * kk); caja.position.copy(cajaDe.getPointAt(e)); }
      caja.rotation.y += dt; halo.scale.setScalar(1 + 0.2 * Math.sin(ahora / 200));
      if (k >= 1) irPaso(paso + 1); }
    const cam = T3.camera, Wd = innerWidth, H = innerHeight;
    for (const e of ETQ) { V.set(e.pos[0], e.pos[1], e.pos[2]).project(cam); const ok = V.z < 1 && Math.abs(V.x) < 1.02 && Math.abs(V.y) < 1.02; e.d.style.display = ok ? 'block' : 'none';
      if (ok) e.d.style.transform = `translate(${((V.x + 1) / 2 * Wd - 10).toFixed(1)}px,${((1 - V.y) / 2 * H - e.d.offsetHeight - 18).toFixed(1)}px)`; }
  }

  let on = false;
  return {
    ver(v) {
      if (v === on) return; on = v; grupo.visible = v;
      const bv = T3.bavaria; if (bv && bv.userData) { if (bv.userData.demoler) bv.userData.demoler.visible = !v; if (bv.userData.mallasHuerta && v) bv.userData.mallasHuerta.forEach(m => { m.visible = false; }); }
      pan.classList.toggle('on', v); document.body.classList.toggle('bd-on', v);
      if (v) { pan.classList.toggle('min', innerWidth < 760); /* celular: arranca recogido (toca el título para abrirlo) */ tab = 'prog'; pintar(); ult = performance.now(); if (!raf) cuadro(); general(); }
      else { parar(); cancelAnimationFrame(raf); raf = 0; ETQ.forEach(e => { e.d.style.display = 'none'; }); }
    },
    get on() { return on; }, grupo
  };
}
