/* ============ BAVARIA COMÚN · DISTRITO DE TECNOLOGÍAS CONVERGENTES (NBIC) ============
   Se prende al escoger «Bavaria Común» en la leyenda de «Con la propuesta» (data3d/escenario.js). Al prenderse, en secuencia:
   1. los edificios se levantan como volúmenes de luz de su uso (programa NBIC en 12 edificios: nano, bio, info, cogno + aulas,
      poscosecha, mercado, incubadora, alimentos, polinizadores y torre de monitoreo);
   2. la red de calles cambia a la NUEVA SINTAXIS ESPACIAL (integración angular a 800 m, después de abrir los 25 pasajes) y los pasajes
      se dibujan con gente caminando (data3d/bavaria_distrito_sx.json, de tools/bavaria_distrito_sx.py);
   3. la red de datos une el centro de datos con los edificios y los sensores;
   4. salen las INTERACCIONES BIÓTICAS que el distrito fomenta: abejas, abejorros, colibríes, mariposas, aves insectívoras, cernícalo,
      lechuza, murciélagos, ranas y libélulas, mariquitas y lombrices, cada una con su módulo de fauna y la tecnología que la mide.
   Huertas en todo el claro al oriente de la nave grande (módulos de 8 camas, invernaderos, franjas de flores), plantas 3D de cerca.
   Retiros D1 (27) y D2 (20): bavaria.js los deja en un grupo aparte que aquí se esconde.
   Marco: bavaria.json y la sintaxis en el marco del modelo; lw() los pasa al mundo. */
export function crearDistritoBavaria({ T3, lw, D, ARB = [], SX = null }) {
  const THREE = T3.THREE, MOV = innerWidth < 760, RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const W = (p) => lw(p[0], p[1]), M = (x, y) => lw(x, y);
  const grupo = new THREE.Group(); grupo.name = 'bavaria_distrito'; grupo.visible = false; T3.scene.add(grupo);
  const ED = D.edif.map(e => ({ W: e.p.map(W), h: e.h }));
  const centro = (P) => { let x = 0, z = 0; for (const q of P) { x += q[0]; z += q[1]; } return [x / P.length, z / P.length]; };
  const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
  const e2 = ED[2].W, ANG = Math.atan2(e2[1][1] - e2[0][1], e2[1][0] - e2[0][0]), CU = Math.cos(ANG), SU = Math.sin(ANG);
  const loc = (c, u, v) => [c[0] + u * CU - v * SU, c[1] + u * SU + v * CU];
  const rect = (c, w, d) => [loc(c, -w / 2, -d / 2), loc(c, w / 2, -d / 2), loc(c, w / 2, d / 2), loc(c, -w / 2, d / 2)];
  const fmt = (n) => Math.round(n).toLocaleString('es-CO');
  const TU = { value: 0 }; // tiempo compartido por los shaders
  const COLSP = '\n#include <colorspace_fragment>\n';

  /* ---------- programa NBIC ---------- */
  const PROG = [
    { k: 'inst', n: 'Instituto de enseñanza', c: '#60a5fa', e: 3, g: 'Aulas', a: '290 m²', d: 'Aquí empieza la jornada: los grupos reciben el ensayo del día y salen por la cara interior de la L hacia laboratorios y cultivos.', x: 'Dos aulas de 60 m² (24 estudiantes c/u), recepción 35, sala de trabajo 45, sala docente 30, coordinación 25 y casilleros 35 m². 96 estudiantes por jornada en 4 grupos que rotan.' },
    { k: 'bio', n: 'Hub de biotecnología', c: '#34d399', e: 0, g: 'B · Bio', a: 'lab. 60 m²', d: 'Biotecnología vegetal, microbiología del suelo y ADN ambiental. Bioinsumos y banco de semillas; sale directo a los invernaderos.', x: 'Seis mesas en parejas, lavado y muestras. Entrega ensayos documentados de germinación, crecimiento o bioinsumos contra camas de control, y analiza el ADN ambiental de la charca.' },
    { k: 'nano', n: 'Centro de nanotecnología y sensores', c: '#c084fc', e: 11, g: 'N · Nano', a: 'lab. 60 m²', d: 'Materiales y nanosensores: indicadores de humedad para empaques y los sensores de colmenas, suelo y agua del distrito.', x: 'Seis puestos, banco de electrónica y ensayo de empaques, con una universidad aliada. Compara un indicador nanoestructurado con un sensor convencional; primero en banco.' },
    { k: 'datos', n: 'Centro de datos e IA · gemelo digital', c: '#38bdf8', e: 4, g: 'I · Info', a: 'lab. 60 m²', d: 'Recibe los datos de todo el distrito: cosechas, energía, compost, pedidos y fauna. IA que cuenta polinizadores y reconoce cantos de aves y murciélagos.', x: 'Doce estaciones y pantalla común. El tablero real del distrito: qué cama se cosechó, cuánto pesó, cuánta energía, cuántos kilos a compost y a qué mercado fue el lote.' },
    { k: 'cogn', n: 'Ciencias cognitivas y diseño', c: '#f472b6', e: 5, g: 'C · Cogno', a: 'lab. 30 m²', d: 'Cómo entienden las personas las etiquetas, alertas y datos del distrito; diseño de la divulgación para colegios y vecinos.', x: 'Mesa de prueba, muestras de etiquetas y observación por turnos: qué entiende mejor un comerciante, cuánto tarda y qué decide con la caja.' },
    { k: 'foro', n: 'Foro y nave de innovación', c: '#e7e5e4', e: 2, g: 'Foro', a: '120 m²', d: 'Punto de encuentro antes de recorrer el predio, fab lab y exhibición de ensayos, cosechas y resultados de energía, agua, compost y fauna.', x: '120 m² iniciales con mobiliario móvil; lo que se abra al público depende del estado de la estructura. Memoria industrial de la fábrica.' },
    { k: 'poli', n: 'Laboratorio vivo de polinizadores', c: '#fb923c', e: 23, g: 'Fauna', a: 'mariposario', d: 'Mariposario e invernadero de cría de polinizadores dentro de la estructura de la antigua nave: se estudian abejas, abejorros y mariposas.', x: 'Cámaras de conteo con IA, estaciones de flores nativas y cría de mariposas para soltar en las franjas florales.' },
    { k: 'pos', n: 'Planta docente de poscosecha', c: '#f59e0b', e: 9, g: 'Sistema', a: '190 m²', d: 'Se recibe lo cosechado, se pesa, se selecciona, se empaca con los sensores del laboratorio y se despacha a los mercados de Kennedy.', x: 'Recepción 30, selección y lavado 40, empaque 35, cámara fría 20, canastillas 20, orgánicos 15 y despacho 30 m².' },
    { k: 'mer', n: 'Mercado experimental', c: '#fb7185', e: 8, g: 'Sistema', a: '315 m²', d: 'Los productores venden, los estudiantes registran qué llega y qué se vende, y los compradores participan voluntariamente en pruebas.', x: 'Doce puestos de 9 m², 120 m² de circulación, 45 de demostración, 18 de pesaje y 24 de almacenamiento. Puerta barrial por la Calle 7A.' },
    { k: 'inc', n: 'Incubadora agrotech', c: '#a3e635', e: 15, g: 'Sistema', a: '', d: 'Emprendimientos de vecinos y egresados que llevan a los mercados lo que funcionó en los ensayos: bioinsumos, empaques, sensores.', x: '' },
    { k: 'alim', n: 'Laboratorio de alimentos', c: '#fde047', e: 7, g: 'Sistema', a: '', d: 'Conservación y vida útil: prueba los empaques con nanosensores y aprovecha lo que el mercado no vende.', x: '' },
    { k: 'torre', n: 'Torre de monitoreo ambiental', c: '#22d3ee', e: 6, g: 'Fauna', a: 'silos', d: 'Los silos se vuelven torre de sensores (clima, aire, ruido) y mirador. Arriba, la estación meteorológica.', x: 'Estación meteorológica, antenas de la red de sensores, grabadora acústica y caja nido con cámara.' },
    { k: 'campo', n: 'Campo experimental y huertas', c: '#4ade80', g: 'Sistema', a: '', d: 'La misma especie bajo condiciones distintas: qué cambia, cuánto cuesta y qué conviene llevar a otros mercados de Kennedy.', x: '' },
    { k: 'comp', n: 'Compostaje y lombricultura', c: '#d4a373', g: 'Sistema', a: '60 m²', d: 'Recibe por el lado de servicio lo que sobra de cultivo, poscosecha y mercado; los estudiantes siguen cada lote del pesaje a la maduración.', x: 'Recepción y pesaje 10, material seco 10, tres composteras de ~1 m³ 18, maduración y tamizado 12, herramientas y registro 10 m².' },
    { k: 'sol', n: 'Estación solar', c: '#facc15', g: 'Sistema', a: '10 kWp', d: '20 paneles de 500 Wp en la cubierta con mejor asoleación. Mide bombeo, sensores, iluminación y cámara fría; los datos llegan al centro de datos.', x: 'Los kWh/día y el porcentaje cubierto salen de la simulación de sombras, radiación y cargas.' }
  ];
  PROG.forEach(p => { if (p.e !== undefined && !p.a) p.a = 'huella ' + fmt(area(ED[p.e].W)) + ' m²'; });
  const PK = Object.fromEntries(PROG.map(p => [p.k, p]));

  /* ---------- lugares (marco del modelo -> mundo) ---------- */
  const C_CAMPO = M(9478, 3066), C_COMP = M(9527, 3133), C_PLAZA = M(9163, 2878);
  const ACC = [
    { k: 'A', n: 'Entrada A · Transversal 71B', d: 'Portería Tv. 71B n.º 9-01. Plaza de entrada y recepción del instituto.', p: M(9580, 2697) },
    { k: 'B', n: 'Entrada B · Calle 7A', d: 'Puerta barrial al mercado: se compra aunque el instituto esté cerrado.', p: M(9180, 2390) },
    { k: 'C', n: 'Entrada C · Av. Boyacá', d: 'Servicio: carga y descarga hacia poscosecha, el patio D2 y orgánicos.', p: M(8974, 3008) }
  ];
  const FA = { // módulos de fauna
    apiario: { n: 'Apiario inteligente', p: M(9660, 2990), c: '#fbbf24' }, abejorro: { n: 'Nidos de abejorro nativo', p: M(9514, 3212), c: '#facc15' },
    charca: { n: 'Charca didáctica', p: M(9550, 2893), c: '#60a5fa' },
    murc: [M(9694, 3060), M(9250, 3330), M(9480, 2772)], nidos: [M(9438, 2968), M(9520, 2950), M(9596, 3127), M(9420, 3120)],
    perchas: [M(9520, 3020), M(9600, 3020), M(9500, 3100)], hoteles: [M(9470, 3000), M(9554, 3086), M(9620, 2960)]
  };
  // pasajes nuevos (sintaxis) en el mundo
  const SEG = (SX && SX.seg) || [], PAS = SEG.filter(s => s.n).map(s => s.p.map(q => M(q[0], q[1])));

  /* ---------- materiales y utilidades ---------- */
  const mBasic = (c, o, ex = {}) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, toneMapped: false, ...ex });
  const mStd = (c, ex = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...ex });
  const lineas = (P, y, col, op = 1, cerrado = true, dash = 0) => { const a = []; const n = P.length; for (let i = 0; i < (cerrado ? n : n - 1); i++) { const p = P[i], q = P[(i + 1) % n]; a.push(p[0], y, p[1], q[0], y, q[1]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    const m = dash ? new THREE.LineDashedMaterial({ color: col, dashSize: dash, gapSize: dash * 0.7, transparent: true, opacity: op, depthWrite: false, toneMapped: false }) : new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, toneMapped: false });
    const l = new THREE.LineSegments(g, m); if (dash) l.computeLineDistances(); return l; };
  const losa = (P, y, mat) => { const s = new THREE.Shape(P.map(q => new THREE.Vector2(q[0], -q[1]))); const g = new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2); g.translate(0, y, 0); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m; };
  const unir = (gs) => { const P = [], N = []; for (const g0 of gs) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); return g; };
  const dentro = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const dSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); };
  const distBorde = (P, x, z) => { let m = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) m = Math.min(m, dSeg(x, z, P[j], P[i])); return m; };
  const distPolilinea = (P, x, z) => { let m = 1e9; for (let i = 1; i < P.length; i++) m = Math.min(m, dSeg(x, z, P[i - 1], P[i])); return m; };
  const espectro = (t) => { // azul -> cian -> verde -> amarillo -> rojo (como DepthmapX)
    const S = [[0.16, 0.26, 0.72], [0.12, 0.65, 0.86], [0.24, 0.78, 0.36], [0.98, 0.84, 0.2], [0.92, 0.22, 0.16]], f = Math.max(0, Math.min(0.999, t)) * 4, i = Math.floor(f), k = f - i;
    return [0, 1, 2].map(j => S[i][j] + (S[i + 1][j] - S[i][j]) * k); };

  /* ---------- 1. edificios del programa: volumen de luz «tecnológico» (pisos, retícula y una banda de escaneo que sube) ---------- */
  const SHELL = [];
  const matShell = (col, h) => new THREE.ShaderMaterial({
    uniforms: { uT: TU, uC: { value: new THREE.Color(col) }, uH: { value: h }, uRise: { value: 0 }, uDim: { value: 1 } },
    vertexShader: 'uniform float uRise; varying vec3 vW; varying vec3 vN; void main(){ vec3 p=position; p.y=0.2+(p.y-0.2)*max(uRise,0.001); vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz; vN=normal; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: 'uniform vec3 uC; uniform float uT,uH,uRise,uDim; varying vec3 vW; varying vec3 vN;\nvoid main(){ float piso=step(.9,fract(vW.y/3.6)); float ret=step(.94,fract((vW.x+vW.z)/6.)); float techo=step(.9,vN.y);\n float b=exp(-pow(vW.y-mod(uT*7.,uH+14.),2.)/5.);\n float a=.10+max(piso,ret*(1.-techo))*.32+b*.55+techo*(.12+.25*step(.9,fract(vW.x/6.))*step(.9,fract(vW.z/6.)));\n gl_FragColor=vec4(uC*(1.+b*.8),a*uDim*min(1.,uRise*1.5));' + COLSP + '}',
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false
  });
  const envolver = (i, p) => {
    const Wp = ED[i].W, h = ED[i].h, n = Wp.length, [cx, cz] = centro(Wp), Q = Wp.map(q => { const dx = q[0] - cx, dz = q[1] - cz, d = Math.hypot(dx, dz) || 1; return [q[0] + dx / d * 0.9, q[1] + dz / d * 0.9]; }), y0 = 0.2, y1 = h + 1.2;
    const P = [], N = [], I = [], L = [];
    for (let k = 0; k < n; k++) { const j = (k + 1) % n, b = P.length / 3, ex = Q[j][0] - Q[k][0], ez = Q[j][1] - Q[k][1], l = Math.hypot(ex, ez) || 1;
      for (const [q, y] of [[Q[k], y0], [Q[j], y0], [Q[j], y1], [Q[k], y1]]) { P.push(q[0], y, q[1]); N.push(ez / l, 0, -ex / l); } I.push(b, b + 1, b + 2, b, b + 2, b + 3);
      L.push(Q[k][0], y1, Q[k][1], Q[j][0], y1, Q[j][1], Q[k][0], y0, Q[k][1], Q[k][0], y1, Q[k][1]); }
    const bt = P.length / 3; for (const q of Q) { P.push(q[0], y1, q[1]); N.push(0, 1, 0); }
    let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(Q.map(q => new THREE.Vector2(q[0], q[1])), []); } catch (e) {} for (const t of tri) I.push(bt + t[0], bt + t[1], bt + t[2]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
    const mat = matShell(p.c, y1), m = new THREE.Mesh(g, mat); m.renderOrder = 8;
    const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); const ml = new THREE.LineBasicMaterial({ color: p.c, transparent: true, opacity: 0, toneMapped: false }), li = new THREE.LineSegments(gl, ml); li.renderOrder = 9;
    const gr = new THREE.Group(); gr.add(m, li); grupo.add(gr);
    SHELL.push({ k: p.k, mat, ml, li, h: y1, c: [cx, cz], orden: SHELL.length });
  };
  PROG.forEach(p => { if (p.e !== undefined) envolver(p.e, p); });
  const POS = {}; PROG.forEach(p => { if (p.e !== undefined) { const c = centro(ED[p.e].W); POS[p.k] = [c[0], ED[p.e].h + 5, c[1]]; } });
  POS.campo = [C_CAMPO[0], 9, C_CAMPO[1]]; POS.comp = [C_COMP[0], 7, C_COMP[1]];

  /* ---------- 2. retiros D1 y D2 ---------- */
  const RET = [
    { k: 'D1', i: 27, n: 'D1 · Acceso al instituto', se: 'Caseta o anexo deteriorado que obstruye la conexión desde la portería de la Tv. 71B hacia el edificio en L.', pone: 'Plaza de entrada del distrito: bicicleteros, bancas, punto de información y encuentro para 24 estudiantes.' },
    { k: 'D2', i: 20, n: 'D2 · Patio de transferencia', se: 'Anexo liviano de contratistas o servicio con deterioro comprobado.', pone: 'Patio de transferencia y demostración: canastillas por la mañana, talleres de empaque y encuentros con productores después.' }
  ];
  RET.forEach(r => { const e = ED[r.i]; grupo.add(lineas(e.W, 0.6, '#ef4444', 1, true, 1.6), lineas(e.W, e.h, '#ef4444', 0.55, true, 1.6)); r.c = centro(e.W); r.h = e.h; });
  {
    const P = rect(C_PLAZA, 30, 18); grupo.add(losa(P, 0.35, mStd('#cfc8bb', { roughness: 0.9 })), lineas(P, 0.4, '#fbbf24', 0.8));
    const bancas = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 0.45, 0.6), mStd('#8a6a48'), 6), bici = new THREE.InstancedMesh(new THREE.TorusGeometry(0.42, 0.05, 6, 16, Math.PI), mStd('#9ca3af', { metalness: 0.6, roughness: 0.4 }), 10), o = new THREE.Object3D();
    for (let i = 0; i < 6; i++) { const q = loc(C_PLAZA, -11 + i * 4.4, 6.5); o.position.set(q[0], 0.6, q[1]); o.rotation.set(0, -ANG, 0); o.updateMatrix(); bancas.setMatrixAt(i, o.matrix); }
    for (let i = 0; i < 10; i++) { const q = loc(C_PLAZA, -12 + i * 1.1, -7); o.position.set(q[0], 0.35, q[1]); o.rotation.set(0, -ANG + Math.PI / 2, 0); o.updateMatrix(); bici.setMatrixAt(i, o.matrix); }
    grupo.add(bancas, bici);
  }
  const C_D2 = centro(ED[20].W);
  {
    const P = rect(C_D2, 46, 20); grupo.add(losa(P, 0.32, mStd('#bdb6aa', { roughness: 0.95 })), lineas(P, 0.38, '#ef4444', 0.5));
    const can = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.3, 0.4), mStd('#22c55e', { roughness: 0.6 }), 36), o = new THREE.Object3D(); let k = 0;
    for (let s = 0; s < 6; s++) for (let a = 0; a < 6; a++) { const q = loc(C_D2, -15 + s * 1.4, -5 + (a % 2) * 0.7); o.position.set(q[0], 0.5 + Math.floor(a / 2) * 0.32, q[1]); o.rotation.set(0, -ANG, 0); o.updateMatrix(); can.setMatrixAt(k++, o.matrix); }
    grupo.add(can);
  }

  /* ---------- 3. huertas en todo el claro (módulos de 15 x 15 m con 8 camas; respetan bosque, pasajes y módulos de fauna) ---------- */
  const MODS = [
    { k: 'A', n: 'A · Referencia bajo cubierta', inv: true, cul: ['lechuga'], q: '¿Cuánta agua, tiempo y superficie para una caja vendible?', u: -7.5, v: -7.5 },
    { k: 'B', n: 'B · Biotecnología', inv: true, cul: ['lechuga'], q: '¿El tratamiento biológico cambia el peso comercial o la pérdida de plantas?', u: 7.5, v: -7.5 },
    { k: 'C', n: 'C · Cultivo exterior', inv: false, cul: ['lechuga'], q: '¿Qué cambia frente al módulo A en agua, temperatura, fauna y kilos aprovechables?', u: -7.5, v: 7.5 },
    { k: 'D', n: 'D · Producción por pedido', inv: false, cul: ['acelga', 'acelga', 'acelga', 'acelga', 'cilantro', 'cilantro', 'cilantro', 'cilantro'], q: '¿Cuánto sembrar para cumplir un pedido real y cuánto queda sin vender? (4 acelga, 4 cilantro)', u: 7.5, v: 7.5 }
  ];
  const CULT = {
    lechuga: { c: '#86c44c', c2: '#a7d86a', paso: 0.32, fil: 2 }, morada: { c: '#7a3b52', c2: '#9b5a5f', paso: 0.32, fil: 2 },
    acelga: { c: '#2f6b2a', c2: '#3f7f30', paso: 0.4, fil: 2 }, cilantro: { c: '#5fae3a', c2: '#7cc455', paso: 0.18, fil: 3 },
    repollo: { c: '#6f9a86', c2: '#89b39d', paso: 0.5, fil: 2 }, cebolla: { c: '#7fae5a', c2: '#9cc275', paso: 0.15, fil: 3 },
    fresa: { c: '#3d7a35', c2: '#c0392b', paso: 0.3, fil: 2 }, flores: { c: '#a855f7', c2: '#facc15', pal: ['#a855f7', '#facc15', '#f97316', '#f8fafc', '#ec4899', '#60a5fa'], paso: 0.28, fil: 3 }, nada: null
  };
  const ROT = ['lechuga', 'morada', 'acelga', 'cilantro', 'repollo', 'cebolla', 'lechuga', 'fresa', 'acelga', 'lechuga', 'nada'];
  const SITIO = D.sitio.map(W), REGS = [[[9405, 2840], [9725, 2840], [9725, 3255], [9405, 3255]], [[9330, 3270], [9560, 3270], [9560, 3480], [9330, 3480]], [[9120, 3090], [9250, 3090], [9250, 3290], [9120, 3290]]].map(R => R.map(q => M(q[0], q[1]))), ARBW = (ARB || []).map(a => W(a));
  const PUNTOS_FAUNA = [[FA.apiario.p, 16], [FA.abejorro.p, 10], [FA.charca.p, 26], ...FA.murc.map(p => [p, 8]), ...FA.nidos.map(p => [p, 8]), ...FA.perchas.map(p => [p, 8]), ...FA.hoteles.map(p => [p, 9])];
  const CEL = [];
  {
    const ocupa = new Map(); for (const a of ARBW) { const k = Math.round(a[0] / 12) + '_' + Math.round(a[1] / 12); if (!ocupa.has(k)) ocupa.set(k, []); ocupa.get(k).push(a); }
    const arbolCerca = (x, z) => { for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const a of ocupa.get((Math.round(x / 12) + dx) + '_' + (Math.round(z / 12) + dz)) || []) if (Math.abs(a[0] - x) < 11 && Math.abs(a[1] - z) < 11) return true; return false; };
    let sem = 7; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
    for (let i = -24; i < 24; i++) for (let j = -24; j < 24; j++) {
      const u = (i + 0.5) * 15, v = (j + 0.5) * 15, c = loc(C_CAMPO, u, v), doc = MODS.find(m => Math.abs(m.u - u) < 1 && Math.abs(m.v - v) < 1);
      if (!doc) { if (!REGS.some(R => dentro(R, c[0], c[1])) || !dentro(SITIO, c[0], c[1]) || distBorde(SITIO, c[0], c[1]) < 16) continue;
        if (ED.some((e, k) => k !== 20 && k !== 27 && (dentro(e.W, c[0], c[1]) || distBorde(e.W, c[0], c[1]) < 18))) continue;
        if (Math.hypot(c[0] - C_COMP[0], c[1] - C_COMP[1]) < 14 || arbolCerca(c[0], c[1])) continue;
        if (PAS.some(P => distPolilinea(P, c[0], c[1]) < 9)) continue;
        if (PUNTOS_FAUNA.some(([p, r]) => Math.hypot(p[0] - c[0], p[1] - c[1]) < r + 9)) continue; }
      let cul, flor = false;
      if (doc) cul = Array.from({ length: 8 }, (_, k) => doc.cul[k % doc.cul.length]);
      else if (((i * 7 + j * 3) % 9 + 9) % 9 === 4) { cul = Array(8).fill('flores'); flor = true; } // franja polinizadora
      else { const a = ROT[Math.floor(rnd() * ROT.length)], b = ROT[Math.floor(rnd() * ROT.length)]; cul = Array.from({ length: 8 }, (_, k) => (k < 4 ? a : b)); }
      CEL.push({ c, u, v, i, j, cul, flor, inv: doc ? doc.inv : (!flor && ((j % 5 + 5) % 5 === 2)), doc: doc ? doc.k : null });
    }
  }
  const HA = CEL.length * 225 / 10000, NFLOR = CEL.filter(c => c.flor).length;
  PK.campo.a = HA.toFixed(1).replace('.', ',') + ' ha';
  PK.campo.x = `${CEL.length} módulos de 15 × 15 m con 8 camas (${fmt(CEL.length * 8)} camas de 1,25 × 10 m): los 4 docentes A-D en el centro, ${NFLOR} franjas de flores nativas para polinizadores y el resto productivo, con lechuga verde y morada, acelga, cilantro, repollo, cebolla y fresa en rotación. Una franja de cada cinco va bajo invernadero.`;
  const texCama = (k) => { const C = CULT[k], cv = document.createElement('canvas'); cv.width = 64; cv.height = 512; const g = cv.getContext('2d');
    g.fillStyle = '#4a3527'; g.fillRect(0, 0, 64, 512); for (let n = 0; n < 1400; n++) { g.fillStyle = `rgba(${30 + Math.random() * 40},${20 + Math.random() * 25},${12 + Math.random() * 15},.55)`; g.fillRect(Math.random() * 64, Math.random() * 512, 2, 2); }
    for (let n = 0; n < 260; n++) { g.strokeStyle = `rgba(${190 + Math.random() * 40},${160 + Math.random() * 30},90,.55)`; g.lineWidth = 1; const x = Math.random() * 64, y = Math.random() * 512, a = Math.random() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.stroke(); } // paja
    if (C) { const filas = C.fil, pas = Math.max(6, C.paso / 9.7 * 512); for (let f = 0; f < filas; f++) { const x = (f + 0.5) * 64 / filas; for (let y = pas / 2; y < 512; y += pas) { const r = Math.min(64 / filas, pas) * 0.48 * (0.8 + Math.random() * 0.35);
      if (C.pal) { g.fillStyle = '#3f7a35'; g.beginPath(); g.ellipse(x, y, r, r, 0, 0, 7); g.fill(); g.fillStyle = C.pal[Math.floor(Math.random() * C.pal.length)]; g.beginPath(); g.ellipse(x + (Math.random() - 0.5) * 3, y, r * 0.6, r * 0.6, 0, 0, 7); g.fill(); continue; }
      g.fillStyle = Math.random() < 0.5 ? C.c : C.c2; g.beginPath(); g.ellipse(x + (Math.random() - 0.5) * 2, y, r, r, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(x - r * 0.25, y - r * 0.25, r * 0.35, r * 0.35, 0, 0, 7); g.fill(); } } }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const hojas = (n, sx, sy, sz, inc, alto, centro0 = 0) => { const L = []; for (let k = 0; k < n; k++) { const h = new THREE.SphereGeometry(1, 5, 3); h.scale(sx, sy, sz); h.translate(0, 0, sz * 0.8); h.rotateX(-inc); h.rotateY(k / n * Math.PI * 2 + (k % 2) * 0.3); h.translate(0, alto, 0); L.push(h); }
    if (centro0) { const c = new THREE.SphereGeometry(centro0, 6, 4); c.scale(1, 0.8, 1); c.translate(0, alto + centro0 * 0.5, 0); L.push(c); } return unir(L); };
  /* plantas con HOJAS de verdad: tarjetas con la forma de la hoja (textura en grises con nervadura; el color lo pone cada planta) */
  const texHoja = (tipo) => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.clearRect(0, 0, 256, 256);
    const gr = (y0, y1) => { const q = g.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, '#f2f2f2'); q.addColorStop(1, '#9a9a9a'); return q; };
    if (tipo === 'rizada' || tipo === 'lisa') { g.fillStyle = gr(20, 250); g.beginPath();
      for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2, rr = 1 + (tipo === 'rizada' ? 0.09 * Math.sin(a * 22) + 0.05 * Math.sin(a * 9) : 0.02 * Math.sin(a * 5)); g.lineTo(128 + Math.sin(a) * 100 * rr, 140 - Math.cos(a) * 112 * rr); }
      g.fill(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = tipo === 'lisa' ? 9 : 5; g.beginPath(); g.moveTo(128, 254); g.lineTo(128, 36); g.stroke(); g.lineWidth = 2;
      for (let k = 0; k < 7; k++) { const y = 220 - k * 26; g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(160, y - 18, 205, y - 34); g.moveTo(128, y); g.quadraticCurveTo(96, y - 18, 51, y - 34); g.stroke(); } }
    if (tipo === 'fina') { g.fillStyle = '#d8d8d8'; for (let k = 0; k < 9; k++) { const a = -1.2 + k * 0.3, x = 128 + Math.sin(a) * 70, y = 150 - Math.cos(a) * 80; g.beginPath(); g.ellipse(x, y, 26, 18, a, 0, 7); g.fill(); g.strokeStyle = '#bbb'; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 250); g.lineTo(x, y); g.stroke(); } }
    if (tipo === 'tira') { g.fillStyle = gr(0, 256); for (const dx of [-30, 0, 30]) { g.beginPath(); g.moveTo(128 + dx - 9, 256); g.quadraticCurveTo(128 + dx, 120, 128 + dx * 1.6, 4); g.quadraticCurveTo(128 + dx + 4, 120, 128 + dx + 9, 256); g.fill(); } }
    if (tipo === 'trebol') { g.fillStyle = gr(30, 250); for (const a of [-0.9, 0, 0.9]) { g.save(); g.translate(128, 200); g.rotate(a); g.beginPath(); for (let i = 0; i <= 40; i++) { const t2 = i / 40 * Math.PI * 2, rr = 1 + 0.08 * Math.sin(t2 * 14); g.lineTo(Math.sin(t2) * 42 * rr, -95 - Math.cos(t2) * 58 * rr); } g.fill(); g.restore(); }
      g.fillStyle = '#5a5a5a'; for (const [x, y] of [[70, 230], [190, 226], [128, 244]]) { g.beginPath(); g.ellipse(x, y, 16, 20, 0, 0, 7); g.fill(); } }
    if (tipo === 'flor') { g.fillStyle = '#f0f0f0'; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; g.beginPath(); g.ellipse(128 + Math.cos(a) * 62, 128 + Math.sin(a) * 62, 40, 16, a, 0, 7); g.fill(); } g.fillStyle = '#7a7a7a'; g.beginPath(); g.arc(128, 128, 38, 0, 7); g.fill(); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx; };
  const unirUV = (gs) => { const P = [], N = [], U = []; for (const g0 of gs) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); if (g.attributes.uv) U.push(...g.attributes.uv.array); else for (let i = 0; i < g.attributes.position.count; i++) U.push(0.5, 0.5); }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); return G; };
  // roseta: n hojas que salen del centro, inclinadas (inc: 0 = parada, PI/2 = acostada); l = largo, a = ancho
  const roseta = (n, l, a, inc, alto = 0) => unirUV(Array.from({ length: n }, (_, i) => { const p = new THREE.PlaneGeometry(a, l); p.translate(0, l / 2, 0); p.rotateX(-(inc + (i % 2) * 0.18)); p.rotateY(i / n * Math.PI * 2 + (i % 3) * 0.4); p.translate(0, alto, 0); return p; }));
  const GEO = {
    lechuga: roseta(10, 0.17, 0.16, 1.0), morada: roseta(10, 0.16, 0.15, 0.95), repollo: unirUV([roseta(9, 0.2, 0.2, 1.15), new THREE.SphereGeometry(0.1, 10, 8).scale(1, 0.85, 1).translate(0, 0.09, 0)]),
    acelga: roseta(7, 0.32, 0.14, 0.35), cilantro: roseta(8, 0.17, 0.13, 0.55), cebolla: roseta(5, 0.34, 0.06, 0.12), fresa: roseta(6, 0.15, 0.13, 0.85),
    flores: unirUV([roseta(5, 0.18, 0.08, 0.7), new THREE.CylinderGeometry(0.006, 0.008, 0.42, 4).translate(0, 0.21, 0), new THREE.PlaneGeometry(0.11, 0.11).rotateX(-Math.PI / 2).translate(0, 0.43, 0)])
  };
  const HOJA = { lechuga: 'rizada', morada: 'rizada', repollo: 'lisa', acelga: 'lisa', cilantro: 'fina', cebolla: 'tira', fresa: 'trebol', flores: 'flor' };
  const MATP = {}; for (const k in HOJA) MATP[k] = new THREE.MeshStandardMaterial({ color: '#ffffff', map: texHoja(HOJA[k]), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.72 });
  // bancales de tablas, tierra con surcos y paja, caminos de viruta
  const lienzoT = (w, h, f, rx = 1, ry = 1) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(rx, ry); tx.anisotropy = 8; return tx; };
  const texTabla = lienzoT(128, 512, (g, w, h) => { g.fillStyle = '#7d5a3a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 64) { g.fillStyle = `rgb(${110 + Math.random() * 30},${78 + Math.random() * 20},${48 + Math.random() * 15})`; g.fillRect(0, y + 2, w, 60); g.fillStyle = 'rgba(40,25,12,.55)'; g.fillRect(0, y, w, 3); }
    for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${60 + Math.random() * 30},${40 + Math.random() * 20},20,.35)`; g.lineWidth = 1; const y = Math.random() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(40, y + 3, 90, y - 3, w, y + (Math.random() - 0.5) * 4); g.stroke(); } }, 1, 1);
  const texViruta = lienzoT(256, 256, (g, w, h) => { g.fillStyle = '#8a6a48'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { const v = Math.random(); g.fillStyle = v < 0.4 ? 'rgba(70,48,28,.65)' : v < 0.8 ? 'rgba(170,135,92,.6)' : 'rgba(205,180,140,.6)'; g.save(); g.translate(Math.random() * w, Math.random() * h); g.rotate(Math.random() * 3); g.fillRect(0, 0, 3 + Math.random() * 7, 1.2 + Math.random() * 1.8); g.restore(); } }, 5, 5);  {
    const o = new THREE.Object3D(), N = CEL.length * 8, cuenta = {}; for (const c of CEL) for (const k of c.cul) cuenta[k] = (cuenta[k] || 0) + 1;
    const piso = new THREE.InstancedMesh(new THREE.PlaneGeometry(15, 15).rotateX(-Math.PI / 2), mStd('#ffffff', { map: texViruta, roughness: 1 }), CEL.length);
    const cama = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, 0.4, 10), mStd('#ffffff', { map: texTabla, roughness: 0.9 }), N);
    const riego = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.035, 10), mStd('#111827', { roughness: 0.6 }), N);
    const tops = {}, idx = {}; for (const k in cuenta) { tops[k] = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.1, 9.7).rotateX(-Math.PI / 2), mStd('#ffffff', { map: texCama(k), roughness: 0.9 }), cuenta[k]); idx[k] = 0; }
    let n = 0;
    CEL.forEach((c, ci) => {
      o.position.set(c.c[0], 0.22, c.c[1]); o.rotation.set(0, -ANG, 0); o.updateMatrix(); piso.setMatrixAt(ci, o.matrix); c.camas = [];
      for (let b = 0; b < 8; b++) { const q = loc(c.c, -5.6 + b * 1.6, 0); o.position.set(q[0], 0.45, q[1]); o.updateMatrix(); cama.setMatrixAt(n, o.matrix);
        const k = c.cul[b]; o.position.y = 0.66; o.updateMatrix(); tops[k].setMatrixAt(idx[k]++, o.matrix);
        o.position.y = 0.7; o.updateMatrix(); riego.setMatrixAt(n, o.matrix); c.camas.push({ q, k }); n++; }
    });
    piso.receiveShadow = cama.receiveShadow = true; cama.castShadow = !MOV; grupo.add(piso, cama, riego); Object.values(tops).forEach(t => { t.receiveShadow = true; grupo.add(t); });
    const INV = CEL.filter(c => c.inv);
    if (INV.length) {
      const piel = [], cost = [];
      for (const s of [-3.7, 3.7]) { const p = new THREE.CylinderGeometry(3.7, 3.7, 14.8, 16, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2); p.scale(1, 0.95, 1); p.translate(s, 2.2, 0); piel.push(p);
        for (const e of [-7.4, 7.4]) { const t = new THREE.CircleGeometry(3.7, 16, 0, Math.PI); t.scale(1, 0.95, 1); t.translate(s, 2.2, e); piel.push(t); }
        for (let z = -7.4; z <= 7.45; z += 1.48) { const r = new THREE.TorusGeometry(3.7, 0.05, 3, 16, Math.PI); r.scale(1, 0.95, 1); r.translate(s, 2.2, z); cost.push(r); } }
      for (const x of [-7.4, 0, 7.4]) for (let z = -7.4; z <= 7.45; z += 2.96) { const p = new THREE.BoxGeometry(0.1, 2.2, 0.1); p.translate(x, 1.1, z); cost.push(p); }
      const lados = []; for (const x of [-7.4, 7.4]) { const p = new THREE.PlaneGeometry(14.8, 2.2).rotateY(Math.PI / 2); p.translate(x, 1.1, 0); lados.push(p); } for (const z of [-7.4, 7.4]) { const p = new THREE.PlaneGeometry(14.8, 2.2); p.translate(0, 1.1, z); lados.push(p); }
      const gP = unir([...piel, ...lados]), gC = unir(cost);
      const mP = new THREE.MeshStandardMaterial({ color: '#f1f7f4', roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
      const iP = new THREE.InstancedMesh(gP, mP, INV.length), iC = new THREE.InstancedMesh(gC, mStd('#cbd2d6', { metalness: 0.6, roughness: 0.35 }), INV.length);
      INV.forEach((c, k) => { o.position.set(c.c[0], 0.22, c.c[1]); o.rotation.set(0, -ANG, 0); o.updateMatrix(); iP.setMatrixAt(k, o.matrix); iC.setMatrixAt(k, o.matrix); });
      iP.renderOrder = 7; iC.castShadow = !MOV; grupo.add(iC, iP);
    }
    { const bordes = CEL.filter((c, k) => !c.doc && k % 23 === 5), cas = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 2.6, 2.4).translate(0, 1.5, 0), mStd('#8d6e4f'), bordes.length), tan = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 2.2, 16).translate(0, 1.3, 0), mStd('#1f2937', { roughness: 0.5 }), bordes.length);
      bordes.forEach((c, k) => { const q = loc(c.c, 6.4, 6.2); o.position.set(q[0], 0.2, q[1]); o.rotation.set(0, -ANG, 0); o.updateMatrix(); cas.setMatrixAt(k, o.matrix); const r = loc(c.c, 3, 6.6); o.position.set(r[0], 0.2, r[1]); o.updateMatrix(); tan.setMatrixAt(k, o.matrix); });
      grupo.add(cas, tan); }
    grupo.add(lineas(rect(C_CAMPO, 30, 30), 0.75, '#4ade80', 0.95));
  }
  const PLANTAS = (() => {
    const CAP = MOV ? 6000 : 22000, ims = {}, o = new THREE.Object3D(), cc = new THREE.Color();
    for (const k in GEO) { ims[k] = new THREE.InstancedMesh(GEO[k], MATP[k] || new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75 }), Math.round(CAP / 3)); ims[k].castShadow = false; ims[k].count = 0; ims[k].receiveShadow = true; ims[k].frustumCulled = false; grupo.add(ims[k]); }
    let ux = 1e9, uz = 1e9;
    return function actualizar(forzar) {
      const t = T3.orbit.target, cam = T3.camera.position; if (cam.y > 420) { for (const k in ims) ims[k].count = 0; ux = 1e9; return; }
      if (!forzar && Math.hypot(t.x - ux, t.z - uz) < 30) return; ux = t.x; uz = t.z;
      const R = Math.min(170, 60 + cam.y * 0.6), cerca = CEL.filter(c => Math.hypot(c.c[0] - t.x, c.c[1] - t.z) < R).sort((a, b) => Math.hypot(a.c[0] - t.x, a.c[1] - t.z) - Math.hypot(b.c[0] - t.x, b.c[1] - t.z));
      const n = {}; for (const k in ims) n[k] = 0;
      for (const c of cerca) for (const cm of c.camas) { const C = CULT[cm.k], im = ims[cm.k]; if (!C || !im) continue;
        const pas = C.paso * (MOV ? 1.6 : 1), fil = C.fil, cap = im.instanceMatrix.count;
        for (let f = 0; f < fil; f++) { const du = (f + 0.5) / fil * 1.1 - 0.55; for (let s = -4.8; s < 4.85 && n[cm.k] < cap; s += pas) {
          const h = Math.sin((cm.q[0] + s) * 12.9898 + (cm.q[1] + f) * 78.233) * 43758.5453, r = h - Math.floor(h), q = loc(cm.q, du + (r - 0.5) * 0.04, s);
          o.position.set(q[0], 0.86, q[1]); o.rotation.set(0, r * 6.28, 0); const e = 0.75 + r * 0.5; o.scale.set(e, e * (0.9 + r * 0.2), e); o.updateMatrix(); im.setMatrixAt(n[cm.k], o.matrix);
          im.setColorAt(n[cm.k], cc.set(C.pal ? C.pal[Math.floor(r * 997) % C.pal.length] : (r < 0.5 ? C.c : C.c2)).multiplyScalar(0.85 + r * 0.3)); n[cm.k]++; } } }
      for (const k in ims) { ims[k].count = n[k]; ims[k].instanceMatrix.needsUpdate = true; if (ims[k].instanceColor) ims[k].instanceColor.needsUpdate = true; }
    };
  })();

  /* ---------- 4. compostaje y estación solar ---------- */
  {
    const g = new THREE.Group(); g.position.set(C_COMP[0], 0, C_COMP[1]); g.rotation.y = -ANG;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 6).translate(0, 0.3, 0), mStd('#9ca3af')));
    const poste = new THREE.BoxGeometry(0.18, 3.6, 0.18), mp = mStd('#4b5563', { metalness: 0.4 });
    for (const x of [-4.9, 0, 4.9]) for (const z of [-2.9, 2.9]) { const m = new THREE.Mesh(poste, mp); m.position.set(x, 2.1, z); g.add(m); }
    const techo = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.08, 6.6), mStd('#6b7f6a', { transparent: true, opacity: 0.85 })); techo.position.set(0, 3.9, 0); techo.rotation.x = 0.06; g.add(techo);
    for (let i = 0; i < 3; i++) { const caja = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 1.3), mStd('#8b5a2b')); caja.position.set(-2.6 + i * 2.2, 0.95, -1); g.add(caja);
      const tope = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 1.15), mStd('#3b2a1a')); tope.position.set(-2.6 + i * 2.2, 1.46, -1); g.add(tope); }
    grupo.add(g);
  }
  {
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, 0.05, 2.1), new THREE.MeshStandardMaterial({ color: '#1d3557', roughness: 0.25, metalness: 0.5, emissive: '#0b1a2e' }), 20), o = new THREE.Object3D();
    const e = ED[8], c = centro(e.W); let L0 = 0, a = 0; for (let i = 0; i < e.W.length; i++) { const p = e.W[i], q = e.W[(i + 1) % e.W.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l > L0) { L0 = l; a = Math.atan2(q[1] - p[1], q[0] - p[0]); } }
    for (let i = 0; i < 20; i++) { const u = -5.4 + (i % 10) * 1.2, v = i < 10 ? -1.3 : 1.3; o.position.set(c[0] + u * Math.cos(a) - v * Math.sin(a), e.h + 0.55, c[1] + u * Math.sin(a) + v * Math.cos(a)); o.rotation.set(0, -a, 0.17); o.updateMatrix(); pm.setMatrixAt(i, o.matrix); }
    grupo.add(pm); POS.sol = [c[0] + 6, e.h + 9, c[1] + 4];
  }

  /* ---------- 5. módulos de fauna (con su tecnología) ---------- */
  const mMadera = mStd('#8b6a4a'), mPoste = mStd('#4b5563', { metalness: 0.5, roughness: 0.5 }), mSensor = new THREE.MeshStandardMaterial({ color: '#0ea5e9', emissive: '#0ea5e9', emissiveIntensity: 0.9 });
  const pieza = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; grupo.add(m); return m; };
  const LUCES = []; // leds de sensores que titilan
  const sensor = (x, y, z) => { const m = pieza(new THREE.SphereGeometry(0.16, 10, 8), mSensor.clone(), x, y, z); LUCES.push(m); };
  { // apiario: 2 filas de 3 colmenas tipo Langstroth sobre bases, cerca baja y mástil con sensores
    const p = FA.apiario.p; grupo.add(losa(rect(p, 16, 10), 0.28, mStd('#9b8f74', { roughness: 1 })));
    for (let i = 0; i < 6; i++) { const q = loc(p, -5 + (i % 3) * 5, i < 3 ? -2 : 2.2);
      pieza(new THREE.BoxGeometry(0.6, 0.4, 0.6), mStd('#475569'), q[0], 0.45, q[1], -ANG);
      for (let s = 0; s < 3; s++) pieza(new THREE.BoxGeometry(0.5, 0.26, 0.42), mStd(['#f8fafc', '#fde68a', '#fef3c7'][s]), q[0], 0.8 + s * 0.27, q[1], -ANG);
      pieza(new THREE.BoxGeometry(0.58, 0.06, 0.5), mStd('#94a3b8', { metalness: 0.4 }), q[0], 1.62, q[1], -ANG); sensor(q[0], 1.72, q[1]); }
    const m = loc(p, 7, 0); pieza(new THREE.CylinderGeometry(0.08, 0.08, 5, 8).translate(0, 2.5, 0), mPoste, m[0], 0.2, m[1]); sensor(m[0], 5.2, m[1]);
    pieza(new THREE.BoxGeometry(1.2, 0.05, 0.7), mStd('#1d3557', { metalness: 0.5, roughness: 0.3 }), m[0], 4.5, m[1], -ANG);
  }
  { // nidos de abejorro nativo + hotel de abejas solitarias
    const p = FA.abejorro.p;
    for (let i = 0; i < 5; i++) { const q = loc(p, -4 + i * 2, 0); pieza(new THREE.CylinderGeometry(0.05, 0.05, 1, 6).translate(0, 0.5, 0), mPoste, q[0], 0.2, q[1]); pieza(new THREE.BoxGeometry(0.4, 0.35, 0.4), mMadera, q[0], 1.38, q[1], -ANG); }
    const h = loc(p, 0, 3); pieza(new THREE.BoxGeometry(2.4, 1.8, 0.5), mStd('#a0784f'), h[0], 1.3, h[1], -ANG); pieza(new THREE.BoxGeometry(2.6, 0.12, 0.8), mStd('#5b4636'), h[0], 2.3, h[1], -ANG); sensor(h[0], 2.5, h[1]);
  }
  { // charca didáctica: lámina de agua, juncos, muelle de observación y boya con sensor (ADN ambiental)
    const p = FA.charca.p, ag = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1e3a4c', roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.92 }));
    ag.scale.set(16, 1, 9); ag.position.set(p[0], 0.32, p[1]); ag.rotation.y = -ANG; grupo.add(ag);
    const borde = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 48).rotateX(-Math.PI / 2), mStd('#6b5b45')); borde.scale.set(16, 1, 9); borde.position.set(p[0], 0.3, p[1]); borde.rotation.y = -ANG; grupo.add(borde);
    const N = 90, jun = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 1.4, 4).translate(0, 0.7, 0), mStd('#5d7a3a'), N), o = new THREE.Object3D();
    for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2 + Math.sin(i) * 0.1, r = 0.95 + Math.sin(i * 7.1) * 0.08, q = loc(p, Math.cos(t) * 16 * r, Math.sin(t) * 9 * r); o.position.set(q[0], 0.3, q[1]); o.rotation.set(Math.sin(i) * 0.15, 0, Math.cos(i) * 0.15); o.scale.setScalar(0.7 + (i % 5) * 0.12); o.updateMatrix(); jun.setMatrixAt(i, o.matrix); }
    grupo.add(jun);
    const m = loc(p, -14, 0), mm = loc(p, -9, 0); pieza(new THREE.BoxGeometry(10, 0.2, 1.8), mMadera, (m[0] + mm[0]) / 2, 0.7, (m[1] + mm[1]) / 2, -ANG);
    const b = loc(p, 4, 2); pieza(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 12), mStd('#f97316'), b[0], 0.5, b[1]); sensor(b[0], 0.9, b[1]);
  }
  FA.murc.forEach(p => { pieza(new THREE.CylinderGeometry(0.09, 0.09, 6, 8).translate(0, 3, 0), mPoste, p[0], 0.2, p[1]); pieza(new THREE.BoxGeometry(0.6, 0.8, 0.22), mStd('#3f3a36'), p[0], 5.6, p[1] + 0.2, -ANG); sensor(p[0], 6.4, p[1]); });
  FA.nidos.forEach(p => { pieza(new THREE.CylinderGeometry(0.06, 0.06, 3, 8).translate(0, 1.5, 0), mPoste, p[0], 0.2, p[1]); pieza(new THREE.BoxGeometry(0.3, 0.42, 0.3), mMadera, p[0], 3.2, p[1], -ANG); pieza(new THREE.ConeGeometry(0.28, 0.2, 4), mStd('#5b4636'), p[0], 3.5, p[1], -ANG + Math.PI / 4); sensor(p[0], 3.75, p[1]); });
  FA.perchas.forEach(p => { pieza(new THREE.CylinderGeometry(0.07, 0.09, 6.5, 8).translate(0, 3.25, 0), mMadera, p[0], 0.2, p[1]); pieza(new THREE.BoxGeometry(1.6, 0.08, 0.08), mMadera, p[0], 6.6, p[1], -ANG); });
  FA.hoteles.forEach(p => { pieza(new THREE.BoxGeometry(1.8, 1.5, 0.5), mStd('#a0784f'), p[0], 1.2, p[1], -ANG); pieza(new THREE.BoxGeometry(2, 0.1, 0.8), mStd('#5b4636'), p[0], 2.0, p[1], -ANG);
    for (const s of [-0.75, 0.75]) { const q = loc(p, s, 0); pieza(new THREE.BoxGeometry(0.1, 0.5, 0.1), mPoste, q[0], 0.25, q[1]); } });
  { const s = centro(ED[6].W); pieza(new THREE.BoxGeometry(0.6, 0.8, 0.6), mMadera, s[0] + 2, ED[6].h + 1.6, s[1]); sensor(s[0] + 2, ED[6].h + 2.3, s[1]); pieza(new THREE.CylinderGeometry(0.05, 0.05, 6, 6).translate(0, 3, 0), mPoste, s[0] - 3, ED[6].h + 1.2, s[1]); sensor(s[0] - 3, ED[6].h + 7.4, s[1]); }

  /* ---------- 6. interacciones bióticas: arcos con partículas (la posición se calcula en la GPU) ---------- */
  const celCerca = (p, n, filtro = () => true) => CEL.filter(filtro).map(c => [c, Math.hypot(c.c[0] - p[0], c.c[1] - p[1])]).sort((a, b) => a[1] - b[1]).slice(0, n).map(a => a[0].c);
  const bosque = (n, ref) => ARBW.map(a => [a, Math.hypot(a[0] - ref[0], a[1] - ref[1])]).filter(a => a[1] > 25).sort((a, b) => a[1] - b[1]).filter((_, i) => i % 7 === 0).slice(0, n).map(a => a[0]);
  const flores = CEL.filter(c => c.flor).map(c => c.c), invs = CEL.filter(c => c.inv).map(c => c.c), poli = centro(ED[23].W), silo = centro(ED[6].W);
  const INTER = [
    { k: 'abeja', n: 'Abeja de miel', sp: 'Apis mellifera', c: '#fbbf24', mod: 'Apiario inteligente (6 colmenas)', serv: 'Poliniza fresa, cilantro y las franjas de flores; miel y cera para el mercado.', tec: 'Colmenas con balanza, temperatura y sonido (IoT) del laboratorio de nanosensores; el centro de datos alerta si la colonia se debilita.', pares: celCerca(FA.apiario.p, 16).map(c => [FA.apiario.p, c]), h: [8, 16], v: 26, y0: 1.8 },
    { k: 'abejorro', n: 'Abejorro nativo', sp: 'Bombus atratus', c: '#facc15', mod: 'Nidos de abejorro y hotel de abejas solitarias', serv: 'Poliniza por vibración dentro de los invernaderos, donde la abeja de miel trabaja poco.', tec: 'Cámaras de conteo de visitas con IA en la entrada de los nidos.', pares: (invs.length ? invs : celCerca(FA.abejorro.p, 8)).slice(0, 10).map(c => [FA.abejorro.p, c]), h: [6, 12], v: 20, y0: 1.5 },
    { k: 'colibri', n: 'Colibrí chillón', sp: 'Colibri coruscans', c: '#2dd4bf', mod: 'Franjas de flores nativas', serv: 'Poliniza flores tubulares y une el bosque con las huertas.', tec: 'Grabadoras acústicas (tipo AudioMoth) y reconocimiento de cantos con IA.', pares: flores.slice(0, 8).flatMap((f, i) => { const b = bosque(8, f)[i % 8] || FA.apiario.p; return [[b, f]]; }), h: [10, 20], v: 34, y0: 6 },
    { k: 'mariposa', n: 'Mariposas', sp: 'Lepidoptera', c: '#fb923c', mod: 'Laboratorio vivo de polinizadores (mariposario)', serv: 'Se crían y se sueltan en las franjas de flores; indicadoras de la salud del ecosistema.', tec: 'Conteo con cámaras e IA en el mariposario y en las franjas.', pares: flores.map(f => [poli, f]), h: [12, 24], v: 14, y0: 4 },
    { k: 'ave', n: 'Aves insectívoras', sp: 'Copetón (Zonotrichia capensis) y otras', c: '#d6a77a', mod: 'Cajas nido en postes', serv: 'Comen orugas y saltamontes de las camas.', tec: 'Cajas nido con cámara y sensor de ocupación.', pares: FA.nidos.flatMap(p => celCerca(p, 3).map(c => [p, c])), h: [6, 12], v: 22, y0: 3.4 },
    { k: 'murcielago', n: 'Murciélagos insectívoros', sp: 'Chiroptera', c: '#a78bfa', mod: 'Refugios para murciélagos', serv: 'Comen polillas y mosquitos de noche: menos plagas en las camas.', tec: 'Detectores ultrasónicos y clasificación de llamadas con IA.', pares: FA.murc.flatMap(p => celCerca(p, 5).map(c => [p, c])), h: [8, 16], v: 30, y0: 5.6 },
    { k: 'rana', n: 'Rana sabanera y libélulas', sp: 'Dendropsophus molitor · Odonata', c: '#60a5fa', mod: 'Charca didáctica', serv: 'La rana come insectos; las libélulas, mosquitos. La charca une el distrito con los humedales de Kennedy.', tec: 'ADN ambiental (eDNA) en el agua, analizado en el hub de biotecnología, y sensor de calidad del agua.', pares: [...celCerca(FA.charca.p, 4), ...bosque(4, FA.charca.p)].map(c => [FA.charca.p, c]), h: [2, 5], v: 10, y0: 0.5 },
    { k: 'mariquita', n: 'Mariquitas y crisopas', sp: 'Coccinellidae · Chrysopidae', c: '#f87171', mod: 'Hoteles de insectos', serv: 'Comen pulgones: control biológico sin químicos.', tec: 'Trampas cromáticas con cámara para contar plagas y enemigos naturales.', pares: FA.hoteles.flatMap(p => celCerca(p, 4).map(c => [p, c])), h: [1.5, 4], v: 8, y0: 1.2 },
    { k: 'lombriz', n: 'Lombrices y microorganismos', sp: 'Eisenia fetida', c: '#c08457', mod: 'Compostaje y lombricultura', serv: 'Convierten los residuos en abono y vida del suelo para las camas.', tec: 'Sondas de temperatura y humedad por lote de compost.', pares: celCerca(C_COMP, 8).map(c => [C_COMP, c]), h: [1, 3], v: 6, y0: 0.6 }
  ];
  const FOC = new Float32Array(16).fill(1), FOCo = new Float32Array(16).fill(1);
  {
    let n = 0; const POR = MOV ? 3 : 6; INTER.forEach(I => { n += I.pares.length * POR; });
    const a0 = new Float32Array(n * 3), a1 = new Float32Array(n * 3), a2 = new Float32Array(n * 3), of = new Float32Array(n), ve = new Float32Array(n), cl = new Float32Array(n * 3), fi = new Float32Array(n);
    let k = 0; const cc = new THREE.Color(), lin = [];
    INTER.forEach((I, ii) => { cc.set(I.c); const L = [];
      I.pares.forEach(([p, q], pi) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]), hh = I.h[0] + (I.h[1] - I.h[0]) * ((pi * 0.37) % 1), A = new THREE.Vector3(p[0], I.y0, p[1]), B = new THREE.Vector3(q[0], 1.2, q[1]), C = A.clone().lerp(B, 0.5); C.y = Math.max(A.y, B.y) + hh + d * 0.05;
        const cur = new THREE.QuadraticBezierCurve3(A, C, B), pts = cur.getPoints(18); for (let s = 1; s < pts.length; s++) L.push(pts[s - 1].x, pts[s - 1].y, pts[s - 1].z, pts[s].x, pts[s].y, pts[s].z);
        for (let r = 0; r < POR; r++, k++) { A.toArray(a0, k * 3); C.toArray(a1, k * 3); B.toArray(a2, k * 3); cc.toArray(cl, k * 3); of[k] = (r / POR + pi * 0.13) % 1; ve[k] = I.v / Math.max(30, d) * (0.8 + ((k * 0.61) % 0.4)) * (r % 2 ? 1 : -1); fi[k] = ii; } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
      const ln = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: I.c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); ln.renderOrder = 11; ln.visible = false; grupo.add(ln); I.ln = ln; }); // sin líneas entre edificios: solo se mueve la fauna
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(a0, 3)); geo.setAttribute('a1', new THREE.BufferAttribute(a1, 3)); geo.setAttribute('a2', new THREE.BufferAttribute(a2, 3));
    geo.setAttribute('aOf', new THREE.BufferAttribute(of, 1)); geo.setAttribute('aVe', new THREE.BufferAttribute(ve, 1)); geo.setAttribute('aC', new THREE.BufferAttribute(cl, 3)); geo.setAttribute('aF', new THREE.BufferAttribute(fi, 1));
    var UBIO = { uVis: { value: 0 }, uFoc: { value: FOC }, uPx: { value: devicePixelRatio || 1 } };
    const pm = new THREE.ShaderMaterial({ uniforms: { uT: TU, ...UBIO },
      vertexShader: 'attribute vec3 a1,a2,aC; attribute float aOf,aVe,aF; uniform float uT,uPx; uniform float uFoc[16]; varying vec3 vC; varying float vA;\nvoid main(){ float t=fract(aOf+uT*abs(aVe)); if(aVe<0.) t=1.-t; float u=1.-t; vec3 p=u*u*position+2.*u*t*a1+t*t*a2; p.y+=sin(uT*9.+aOf*40.)*.25; vec4 mv=modelViewMatrix*vec4(p,1.);\n vC=aC; vA=uFoc[int(aF)]; gl_PointSize=clamp(1500.*uPx/-mv.z,2.*uPx,11.*uPx); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform float uVis; varying vec3 vC; varying float vA;\nvoid main(){ float r=length(gl_PointCoord-.5); if(r>.5) discard; float a=smoothstep(.5,0.,r); a=a*a+smoothstep(.15,0.,r); gl_FragColor=vec4(mix(vC,vec3(1.),smoothstep(.15,0.,r)*.6)*a*vA*uVis,1.);' + COLSP + '}',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const pts = new THREE.Points(geo, pm); pts.frustumCulled = false; pts.renderOrder = 12; pts.visible = false; grupo.add(pts); // sin arcos de partículas entre edificios
  }

  /* ---------- 7. sintaxis espacial: la red alrededor del predio, de hoy a «con el distrito» (integración angular 800 m) ---------- */
  const SXU = { uT: TU, uMix: { value: 0 }, uDraw: { value: 0 }, uVis: { value: 0 } };
  {
    const P = [], CA = [], CB = [], AN = [], AS = [], I = [];
    for (const s of SEG) { if (!s.n) continue; // en el distrito NO se pinta la sintaxis: solo los pasajes nuevos, como piso (la sintaxis va en el panel izquierdo con la propuesta)
      const pts = s.p.map(q => M(q[0], q[1])), w = 7, y = 1.4, ca = [0.86, 0.82, 0.74], cb = ca;
      let Lt = 0; for (let i = 1; i < pts.length; i++) Lt += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); let acc = 0;
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2, base = P.length / 3, s0 = acc / Lt, s1 = (acc + l) / Lt; acc += l;
        P.push(a[0] + nx, y, a[1] + nz, a[0] - nx, y, a[1] - nz, b[0] - nx, y, b[1] - nz, b[0] + nx, y, b[1] + nz);
        for (let k = 0; k < 4; k++) { CA.push(...ca); CB.push(...cb); AN.push(s.n ? 1 : 0); } AS.push(s0, s0, s1, s1); I.push(base, base + 1, base + 2, base, base + 2, base + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('cA', new THREE.Float32BufferAttribute(CA, 3)); g.setAttribute('cB', new THREE.Float32BufferAttribute(CB, 3));
    g.setAttribute('aN', new THREE.Float32BufferAttribute(AN, 1)); g.setAttribute('aS', new THREE.Float32BufferAttribute(AS, 1)); g.setIndex(I);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: SXU,
      vertexShader: 'attribute vec3 cA,cB; attribute float aN,aS; varying vec3 vC; varying float vN,vS; uniform float uMix; void main(){ vC=mix(cA,cB,uMix); vN=aN; vS=aS; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float uT,uMix,uDraw,uVis; varying vec3 vC; varying float vN,vS;\nvoid main(){ float a=.82; vec3 c=vC; if(vN>.5){ if(vS>uDraw||uMix<.5) discard; float p=pow(fract(vS*6.-uT*.5),8.); c=mix(c,vec3(1.),.08+p*.6); a=1.; } gl_FragColor=vec4(c,a*uVis);' + COLSP + '}',
      transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    m.renderOrder = 6; m.frustumCulled = false; grupo.add(m);
  }
  const SXR = SX ? SX.resumen : null, SUBEN = SEG.filter(s => s.ia !== null && s.ib !== null && s.ib > s.ia + 0.01).length, PAS_M = SX ? SX.pasajes_m : 0;
  // gente caminando por los pasajes nuevos
  const CAM = (() => {
    const L = PAS.map(P => { const acc = [0]; for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return { P, acc, L: acc[acc.length - 1] }; }).filter(p => p.L > 20);
    const n = MOV ? 50 : 140, im = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.28, 1.1, 3, 6).translate(0, 0.85, 0), mStd('#fde68a', { roughness: 0.6 }), n), cc = new THREE.Color(), PAL = ['#fde68a', '#93c5fd', '#f9a8d4', '#86efac', '#fdba74', '#e5e7eb'];
    const A = Array.from({ length: n }, (_, i) => ({ r: L[i % L.length], t: (i * 0.618) % 1, v: (1.1 + (i % 5) * 0.12) * (i % 2 ? 1 : -1), lado: ((i * 0.37) % 1 - 0.5) * 2.4 }));
    A.forEach((a, i) => im.setColorAt(i, cc.set(PAL[i % PAL.length]))); im.castShadow = !MOV; grupo.add(im); const o = new THREE.Object3D();
    return (dt, mov) => { if (!L.length) return; A.forEach((a, i) => { if (mov) a.t = (a.t + dt * a.v / a.r.L + 1) % 1; const s = a.t * a.r.L, { P, acc } = a.r; let k = 1; while (k < acc.length - 1 && acc[k] < s) k++; const f = (s - acc[k - 1]) / ((acc[k] - acc[k - 1]) || 1), p = P[k - 1], q = P[k], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
      o.position.set(p[0] + dx * f - dz / l * a.lado, 0.3, p[1] + dz * f + dx / l * a.lado); o.rotation.set(0, Math.atan2(dx * Math.sign(a.v), dz * Math.sign(a.v)), 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.instanceMatrix.needsUpdate = true; };
  })();

  /* ---------- 8. red de datos: del centro de datos a los edificios, sensores y huertas ---------- */
  const RD = { uT: TU, uDraw: { value: 0 }, uVis: { value: 0 } };
  {
    const o = POS.datos, dest = [...Object.entries(POS).filter(([k]) => k !== 'datos' && k !== 'sol').map(([, p]) => p), [FA.apiario.p[0], 5, FA.apiario.p[1]], [FA.charca.p[0], 1, FA.charca.p[1]], [FA.abejorro.p[0], 2.5, FA.abejorro.p[1]], ...FA.murc.map(p => [p[0], 6.4, p[1]])];
    const mat = new THREE.ShaderMaterial({ uniforms: RD,
      vertexShader: 'varying float vU; void main(){ vU=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float uT,uDraw,uVis; varying float vU;\nvoid main(){ if(vU>uDraw) discard; float p=pow(fract(vU*5.-uT*.8),10.); vec3 c=vec3(.22,.74,.97); gl_FragColor=vec4(c*(.35+p*2.),(.25+p)*uVis);' + COLSP + '}',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    for (const d of dest) { const A = new THREE.Vector3(o[0], o[1] + 2, o[2]), B = new THREE.Vector3(d[0], d[1], d[2]), C = A.clone().lerp(B, 0.5); C.y = Math.max(A.y, B.y) + 18 + A.distanceTo(B) * 0.12;
      const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, C, B), 40, 0.35, 5), mat); t.renderOrder = 10; t.visible = false; grupo.add(t); } // la red de datos no se dibuja (eran conexiones entre edificios)
  }

  /* ---------- 9. carga y accesos ---------- */
  const matRuta = (col, rep) => new THREE.ShaderMaterial({ uniforms: { uT: TU, uC: { value: new THREE.Color(col) }, uRep: { value: rep } },
    vertexShader: 'varying float vU; void main(){ vU=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uC; uniform float uT,uRep; varying float vU;\nvoid main(){ float d=fract(vU*uRep-uT*.6); float a=.35+pow(d,5.)*1.4; gl_FragColor=vec4(uC*a,min(1.,a));' + COLSP + '}', transparent: true, depthWrite: false, toneMapped: false });
  const CARGA = (() => { const p = [[8974, 3008], [9040, 3050], [9150, 3110], [9200, 3214], [9300, 3186], [9368, 3214], [9420, 3238], [9490, 3200], [9488, 3170], [9520, 3140]];
    const curva = new THREE.CatmullRomCurve3(p.map(q => { const w = M(q[0], q[1]); return new THREE.Vector3(w[0], 1.1, w[1]); }), false, 'centripetal'), L = curva.getLength();
    const m = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.round(L / 3), 0.85, 6), matRuta('#ef4444', L / 9)); m.renderOrder = 10; m.visible = false; grupo.add(m); // sin la línea roja de la carga
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 2.1, 4.6).translate(0, 1.05, 0), mStd('#f8fafc', { roughness: 0.6 }), 3); grupo.add(im); const t = [0, 0.33, 0.66], o = new THREE.Object3D();
    return (dt, mov) => { for (let i = 0; i < 3; i++) { if (mov) t[i] = (t[i] + dt * 4.5 / L) % 1; const q = curva.getPointAt(t[i]), g = curva.getTangentAt(t[i]); o.position.set(q.x, 0.3, q.z); o.rotation.set(0, Math.atan2(g.x, g.z), 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } im.instanceMatrix.needsUpdate = true; }; })();
  ACC.forEach(a => { const g = new THREE.Group(); g.position.set(a.p[0], 0, a.p[1]);
    const ani = new THREE.Mesh(new THREE.RingGeometry(3, 3.8, 40).rotateX(-Math.PI / 2), mBasic('#fbbf24', 0.8, { side: THREE.DoubleSide })); ani.position.y = 0.6;
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 9, 12).translate(0, 4.5, 0), mBasic('#ffffff', 0.85)), ani); grupo.add(g); a.ani = ani; });

  /* ---------- 10. la caja de lechuga (seguir una cosecha) ---------- */
  const COSECHA = [
    { t: 'Sale el grupo del aula', x: 'Un grupo de 24 recibe el ensayo del día en el instituto y sale por la cara interior de la L.', k: 'inst', p: [[9185, 2990]] },
    { t: 'Pasa por el hub de biotecnología', x: 'Biotecnología vegetal prepara el registro del ensayo: camas de tratamiento y de control.', k: 'bio', p: [[9150, 3080], [9200, 3215], [9300, 3200]] },
    { t: 'Cosecha en el invernadero A', x: 'Los abejorros nativos ya polinizaron; el grupo recoge lechugas, pesa una caja y registra el lote.', k: 'campo', p: [[9370, 3180], [9440, 3140], [9478, 3085]] },
    { t: 'Poscosecha: sensor en el empaque', x: 'Se selecciona, se empaca y se prueba el indicador de humedad del centro de nanotecnología.', k: 'pos', p: [[9470, 3000], [9420, 2930]] },
    { t: 'Mercado: ¿se entiende la etiqueta?', x: 'Ciencias cognitivas observa si el comerciante entiende la información y qué decide con la caja.', k: 'mer', p: [[9360, 2930], [9300, 2938]] },
    { t: 'Lo que sobra, a compostaje', x: 'Las hojas descartadas van al compostaje; las lombrices las vuelven abono para las camas.', k: 'comp', p: [[9380, 2965], [9445, 3060], [9500, 3120], [9527, 3133]] },
    { t: 'El tablero del distrito', x: 'El centro de datos junta peso vendido, residuos, energía y visitas de fauna. De cada 100 kg que recibe el mercado: cuántos se venden, cuántos siguen siendo alimento y cuántos van a compost.', k: 'datos', p: [[9527, 3133]] }
  ];
  const caja = new THREE.Group(); caja.visible = false; grupo.add(caja);
  caja.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 1.2), new THREE.MeshBasicMaterial({ color: '#86efac', toneMapped: false })));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 14), mBasic('#4ade80', 0.18, { blending: THREE.AdditiveBlending })); caja.add(halo);
  caja.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 60, 8).translate(0, 30, 0), mBasic('#bbf7d0', 0.5, { blending: THREE.AdditiveBlending })));

  /* ---------- etiquetas y panel ---------- */
  const css = document.createElement('style');
  css.textContent = `
.bd-lb{position:fixed;left:0;top:0;z-index:7;display:none;cursor:pointer;font-family:Inter,system-ui,sans-serif;color:#eef1f3;white-space:nowrap}
.bd-lb .cj{display:flex;align-items:stretch;background:rgba(10,13,17,.8);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);border-radius:6px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.bd-lb .k{display:flex;align-items:center;padding:0 6px;font:600 10px 'JetBrains Mono',ui-monospace,monospace;color:#0b0d10;background:var(--c)}
.bd-lb .t{padding:4px 8px 4px 7px;line-height:1.15}
.bd-lb b{display:block;font-weight:600;font-size:11px}
.bd-lb small{display:block;font:400 9.5px 'JetBrains Mono',ui-monospace,monospace;color:#9aa4ab;letter-spacing:.04em;margin-top:1px}
.bd-lb .pt{position:absolute;left:10px;top:100%;width:1px;height:18px;background:linear-gradient(var(--c),transparent)}
.bd-lb.act .cj,.bd-lb:hover .cj{border-color:var(--c);box-shadow:0 0 0 1px var(--c),0 8px 22px rgba(0,0,0,.45)}
.bd-lb.dim{opacity:.35}
.bd-lb.ret .cj{border-style:dashed;border-color:#ef4444}.bd-lb.ret .k{background:#ef4444;color:#fff}
@media(max-width:760px){.bd-lb small{display:none}.bd-lb b{font-size:10px}.bd-lb .t{padding:3px 6px}}
#bd{position:fixed;z-index:32;right:14px;top:14px;width:390px;max-height:calc(100vh - 118px);display:none;flex-direction:column;font-family:Inter,system-ui,sans-serif;color:#e9ebec;
  background:rgba(12,14,17,.86);-webkit-backdrop-filter:blur(18px) saturate(1.1);backdrop-filter:blur(18px) saturate(1.1);border:1px solid rgba(255,255,255,.08);border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,.4);overflow:hidden}
#bd.on{display:flex;animation:bdIn .45s cubic-bezier(.2,.8,.2,1)}
@keyframes bdIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
body.bd-on #dock,body.bd-on #hid-red{display:none!important}
#bd header,#bd .tabs,#bd .pie{flex:none}#bd .cuerpo{flex:1 1 auto;min-height:0}
#bd header{position:relative;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.06)}
#bd .cerrar{position:absolute;right:10px;top:10px;width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cfd5d9;font:400 17px/1 Inter,system-ui,sans-serif;cursor:pointer}
#bd .cerrar:hover{background:rgba(255,255,255,.1);color:#fff}#bd .cerrar:focus-visible{outline:2px solid #34d399;outline-offset:1px}
#bd .ey{font:500 9.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#34d399;padding-right:34px}
#bd h2{margin:5px 0 6px;font:600 18px Inter,system-ui,sans-serif;letter-spacing:-.01em}
#bd .lead{margin:0;font-size:12.5px;line-height:1.5;color:#b9c1c6}
#bd .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
#bd .kp div{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:7px 8px}
#bd .kp b{display:block;font:500 14px 'JetBrains Mono',ui-monospace,monospace;color:#fff}
#bd .kp span{font-size:10px;color:#8e979d;line-height:1.25;display:block;margin-top:2px}
#bd .tabs{display:flex;gap:2px;padding:6px 8px 0;overflow-x:auto;scrollbar-width:none}
#bd .tabs button{flex:none;border:0;background:none;color:#8e979d;font:500 11.5px Inter,system-ui,sans-serif;padding:7px 9px;border-radius:7px 7px 0 0;cursor:pointer;border-bottom:2px solid transparent}
#bd .tabs button[aria-selected="true"]{color:#fff;border-bottom-color:#34d399}
#bd .tabs button:focus-visible{outline:2px solid #34d399;outline-offset:-2px}
#bd .cuerpo{overflow:auto;padding:10px 12px 12px;border-top:1px solid rgba(255,255,255,.06);overscroll-behavior:contain}
#bd .it{display:grid;grid-template-columns:22px 1fr auto;gap:2px 9px;align-items:start;padding:8px 6px;border-radius:8px;cursor:pointer}
#bd .it:hover,#bd .it.act{background:rgba(255,255,255,.05)}
#bd .it:focus-visible{outline:2px solid #34d399;outline-offset:-2px}
#bd .it i{grid-row:span 2;width:22px;height:22px;border-radius:6px;background:var(--c);display:flex;align-items:center;justify-content:center;font:600 9.5px 'JetBrains Mono',ui-monospace,monospace;color:#0b0d10;font-style:normal}
#bd .it b{font-size:12.5px;font-weight:600}
#bd .it em{font:500 10px 'JetBrains Mono',ui-monospace,monospace;color:#cfd5d9;font-style:normal;text-align:right}
#bd .it p{grid-column:2 / 4;margin:0;font-size:11.5px;line-height:1.45;color:#9aa4ab}
#bd .it .x{display:none;color:#cfd5d9;margin-top:4px}
#bd .it.act .x{display:block}
#bd .it .tec{display:block;margin-top:4px;font:500 10px 'JetBrains Mono',ui-monospace,monospace;color:#7dd3fc;letter-spacing:.02em}
#bd .sub{font:500 9.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#7b858c;margin:12px 6px 4px}
#bd .nota{font-size:10.5px;color:#7b858c;line-height:1.45;margin:10px 6px 0}
#bd .ind{margin:6px 6px 0;padding:10px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);font-size:11.5px;color:#b9c1c6;line-height:1.45}
#bd .sw2{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:2px 6px 8px;padding:3px;border-radius:9px;background:rgba(255,255,255,.04)}
#bd .sw2 button{height:30px;border:0;border-radius:7px;background:none;color:#9aa4ab;font:500 12px Inter,system-ui,sans-serif;cursor:pointer}
#bd .sw2 button[aria-pressed="true"]{background:rgba(52,211,153,.16);color:#fff;box-shadow:inset 0 0 0 1px rgba(52,211,153,.45)}
#bd .rampa{height:8px;border-radius:4px;margin:4px 6px 2px;background:linear-gradient(90deg,#2942b8,#1fa6db,#3dc75c,#fad633,#eb3829)}
#bd .rampa-t{display:flex;justify-content:space-between;margin:0 6px;font:500 9.5px 'JetBrains Mono',ui-monospace,monospace;color:#7b858c}
#bd table{width:calc(100% - 12px);margin:8px 6px 0;border-collapse:collapse;font-size:11.5px}
#bd th{font:500 9.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#7b858c;text-align:right;padding:5px 4px;border-bottom:1px solid rgba(255,255,255,.08)}
#bd th:first-child,#bd td:first-child{text-align:left}
#bd td{padding:6px 4px;border-bottom:1px solid rgba(255,255,255,.05);text-align:right;font-family:'JetBrains Mono',ui-monospace,monospace;color:#e9ebec}
#bd td:first-child{font-family:Inter,system-ui,sans-serif;color:#b9c1c6}
#bd td.up{color:#4ade80}
#bd .pie{display:flex;gap:6px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.06)}
#bd .pie button{flex:1;height:34px;border-radius:8px;cursor:pointer;font:500 12px Inter,system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:7px}
#bd .go{border:1px solid rgba(74,222,128,.5);background:linear-gradient(180deg,rgba(74,222,128,.22),rgba(74,222,128,.08));color:#dcfce7}
#bd .go:hover{background:rgba(74,222,128,.3);color:#fff}
#bd .sec2{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cfd5d9}
#bd .pie button:focus-visible{outline:2px solid #34d399;outline-offset:1px}
#bd-cap{position:fixed;z-index:33;left:50%;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 84px);transform:translateX(-50%);width:min(480px,calc(100vw - 24px));display:none;
  font-family:Inter,system-ui,sans-serif;color:#eef1f3;background:rgba(10,13,17,.86);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:11px 14px 12px;box-shadow:0 16px 40px rgba(0,0,0,.4)}
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
  #bd header{padding:10px 12px 8px;cursor:pointer}#bd h2{font-size:15px;margin:3px 0 4px}#bd .kp{grid-template-columns:repeat(2,1fr)}
  body.bd-on #esc{display:none}
}
@media(prefers-reduced-motion:reduce){#bd.on,#bd-cap.on{animation:none}}`;
  document.head.appendChild(css);
  const ETQ = [];
  const etiqueta = (n, sub, col, pos, grupoE, fn, num, cls = '') => { const d = document.createElement('div'); d.className = 'bd-lb ' + cls; d.style.setProperty('--c', col);
    d.innerHTML = `<div class="cj"><span class="k">${num}</span><span class="t"><b>${n}</b>${sub ? `<small>${sub}</small>` : ''}</span></div><i class="pt"></i>`;
    d.setAttribute('role', 'button'); d.tabIndex = 0; d.onclick = fn; d.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
    document.body.appendChild(d); const o = { d, pos, g: grupoE, k: null }; ETQ.push(o); return o; };
  const LBP = {};
  PROG.forEach((p, i) => { const ps = POS[p.k]; if (!ps) return; LBP[p.k] = etiqueta(p.n, p.g + (p.a ? ' · ' + p.a : ''), p.c, [ps[0], ps[1], ps[2]], ['sol', 'comp', 'campo'].includes(p.k) ? 'huerta' : 'dist', () => enfocar(p.k), String(i + 1).padStart(2, '0')); LBP[p.k].k = p.k; });
  if (POS.sol) LBP.sol.pos = POS.sol;
  RET.forEach(r => etiqueta(r.n, 'se retira', '#ef4444', [r.c[0], r.h + 5, r.c[1]], 'dist', () => volarA(r.c, 90), r.k, 'ret'));
  ACC.forEach(a => etiqueta(a.n, '', '#fbbf24', [a.p[0], 11, a.p[1]], 'sx', () => volarA(a.p, 160), a.k));
  const FPOS = { abeja: [FA.apiario.p, 4], abejorro: [FA.abejorro.p, 4], colibri: [flores[0] || FA.apiario.p, 3], mariposa: [poli, ED[23].h + 4], ave: [FA.nidos[0], 5], cernicalo: [FA.perchas[0], 8], lechuza: [[silo[0] + 2, silo[1]], ED[6].h + 5], murcielago: [FA.murc[0], 8], rana: [FA.charca.p, 3], mariquita: [FA.hoteles[0], 3.5], lombriz: [C_COMP, 6] };
  const LBF = {}; INTER.forEach((I, i) => { const [p, y] = FPOS[I.k]; LBF[I.k] = etiqueta(I.n, I.mod, I.c, [p[0], y, p[1]], 'fauna', () => enfocarFauna(I.k), 'F' + (i + 1)); });
  let tab = 'dist';
  const verGrupoEtq = () => { const g = { dist: ['dist'], sx: ['sx'], fauna: ['fauna'], huerta: ['huerta', 'fauna'], ciclo: ['huerta', 'sx'] }[tab] || ['dist']; ETQ.forEach(e => { e.on = g.includes(e.g); }); };

  const pan = document.createElement('section'); pan.id = 'bd'; pan.setAttribute('aria-label', 'Bavaria Común, distrito de tecnologías convergentes');
  const fila = (num, col, n, a, d, x, data, tec) => `<div class="it" ${data} tabindex="0" role="button" style="--c:${col}"><i>${num}</i><b>${n}</b><em>${a || ''}</em><p>${d}${tec ? `<span class="tec">◉ ${tec}</span>` : ''}${x ? `<span class="x">${x}</span>` : ''}</p></div>`;
  const pct = (a, b, mejor = 1) => { const d = (b - a) / a * 100; return `<td class="${d * mejor > 0.05 ? 'up' : ''}">${d > 0 ? '+' : ''}${d.toFixed(1).replace('.', ',')} %</td>`; };
  const nf = (v, d = 3) => v.toFixed(d).replace('.', ',');
  const TABS = {
    dist: () => `<div class="sub" style="margin-top:2px">Laboratorios NBIC</div>` + PROG.filter(p => ['bio', 'nano', 'datos', 'cogn'].includes(p.k)).map(p => fila(p.g[0], p.c, p.n, p.a, p.d, p.x, `data-k="${p.k}"`)).join('') +
      `<div class="sub">Formación y encuentro</div>` + PROG.filter(p => ['inst', 'foro', 'poli', 'torre'].includes(p.k)).map(p => fila(String(PROG.indexOf(p) + 1).padStart(2, '0'), p.c, p.n, p.a, p.d, p.x, `data-k="${p.k}"`)).join('') +
      `<div class="sub">Del cultivo al mercado</div>` + PROG.filter(p => ['pos', 'mer', 'alim', 'inc'].includes(p.k)).map(p => fila(String(PROG.indexOf(p) + 1).padStart(2, '0'), p.c, p.n, p.a, p.d, p.x, `data-k="${p.k}"`)).join('') +
      `<div class="sub">Se propone retirar</div>` + RET.map(r => fila(r.k, '#ef4444', r.n, '', `<b style="font-weight:600;color:#fca5a5">Se retira:</b> ${r.se}`, `<b style="font-weight:600;color:#e9ebec">Aparece:</b> ${r.pone}`, `data-ret="${r.k}"`)).join('') +
      `<p class="nota">Se conservan y adaptan los volúmenes recuperables de la fábrica; la obra nueva son invernaderos, cubiertas livianas, plazas y módulos de fauna. Antes de usar una cubierta o un suelo se cruza con las antiguas áreas de combustible y las cubiertas de asbesto-cemento del estudio ambiental. Áreas: metas de anteproyecto.</p>`,
    sx: () => `<div class="sw2" role="group" aria-label="Estado de la red"><button type="button" data-sx="0" aria-pressed="${SXU.uMix.value < 0.5}">Hoy · predio cerrado</button><button type="button" data-sx="1" aria-pressed="${SXU.uMix.value >= 0.5}">Con el distrito</button></div>
      <div class="rampa"></div><div class="rampa-t"><span>menos integrado</span><span>integración angular 800 m</span><span>más</span></div>
      <div class="ind" style="margin-top:10px">Hoy el predio es un vacío de <b style="color:#fff">71 ha</b> que corta la red: hay que rodearlo. El distrito abre <b style="color:#fff">${PAS.length} pasajes peatonales (${fmt(PAS_M)} m)</b> que unen las puertas del borde con la plaza central, siguiendo la retícula de las naves y sin pasar por el bosque. <b style="color:#fff">${fmt(SUBEN)}</b> tramos de la zona quedan más integrados.</div>` +
      (SXR ? `<table><thead><tr><th>A 600 m del predio</th><th>Hoy</th><th>Distrito</th><th>Cambio</th></tr></thead><tbody>
        <tr><td>Integración 800 m (NAIN)</td><td>${nf(SXR.antes_600m.nain8)}</td><td>${nf(SXR.despues_600m.nain8)}</td>${pct(SXR.antes_600m.nain8, SXR.despues_600m.nain8)}</tr>
        <tr><td>Integración global (NAIN)</td><td>${nf(SXR.antes_600m.nain)}</td><td>${nf(SXR.despues_600m.nain)}</td>${pct(SXR.antes_600m.nain, SXR.despues_600m.nain)}</tr>
        <tr><td>Profundidad media</td><td>${nf(SXR.antes_600m.prof, 2)}</td><td>${nf(SXR.despues_600m.prof, 2)}</td>${pct(SXR.antes_600m.prof, SXR.despues_600m.prof, -1)}</tr>
        <tr><td>Sinergia (local–global)</td><td>${nf(SXR.antes_600m.sinergia)}</td><td>${nf(SXR.despues_600m.sinergia)}</td>${pct(SXR.antes_600m.sinergia, SXR.despues_600m.sinergia)}</tr>
        <tr><td>Red caminable (km)</td><td>${nf(SXR.antes_600m.km, 1)}</td><td>${nf(SXR.despues_600m.km, 1)}</td>${pct(SXR.antes_600m.km, SXR.despues_600m.km)}</tr></tbody></table>` : '') +
      `<div class="sub">Accesos</div>` + ACC.map(a => fila(a.k, '#fbbf24', a.n, '', a.d, '', `data-acc="${a.k}"`)).join('') +
      `<p class="nota">Análisis angular de segmentos (método DepthmapX) de toda la red de Kennedy, antes y después de abrir los pasajes. Para la entrega faltan los objetivos de diseño: minutos a pie desde 71B y 7A al mercado, giros hasta la recepción, metros de una canastilla de la cama a poscosecha y cruces entre compradores y carga.</p>`,
    fauna: () => `<div class="ind" style="margin-top:0">Cada módulo atrae fauna que <b style="color:#fff">trabaja para las huertas</b> (poliniza, controla plagas y roedores, hace suelo) y cada interacción se <b style="color:#fff">mide con tecnología</b> del distrito: es material de clase para los colegios y dato para los laboratorios.</div>` +
      INTER.map((I, i) => fila('F' + (i + 1), I.c, I.n, I.sp, `<b style="font-weight:500;color:#cfd5d9">${I.mod}.</b> ${I.serv}`, '', `data-f="${I.k}"`, I.tec)).join('') +
      `<p class="nota">La mirla (Turdus fuscater) se come la fruta y las semillas: por eso la fresa y los semilleros van bajo malla o invernadero. El bosque no se interviene.</p>`,
    huerta: () => `<div class="ind" style="margin-top:0"><b style="color:#fff">${HA.toFixed(1).replace('.', ',')} ha de huerta</b> en todo el claro al oriente de la nave grande: ${CEL.length} módulos de 15 × 15 m con 8 camas cada uno (${fmt(CEL.length * 8)} camas). ${NFLOR} franjas de flores nativas para los polinizadores; una franja de cada cinco bajo invernadero multitúnel. Respetan el bosque, los pasajes y los módulos de fauna.</div>` +
      `<div class="sub">Módulos docentes (centro)</div>` + MODS.map(m => fila(m.k, m.inv ? '#86efac' : '#4ade80', m.n, m.inv ? 'invernadero' : 'exterior', m.q, '', `data-mod="${m.k}"`)).join('') +
      `<div class="ind">Los 300 m² de lechuga docente podrían entregar <b style="color:#fff">unas 90–200 unidades de 250 g por semana</b> (siembra escalonada y 15 % de merma supuesta). La cifra se comprueba pesando cosechas.</div>`,
    ciclo: () => PROG.filter(p => ['comp', 'sol'].includes(p.k)).map(p => fila(p.k === 'sol' ? '☀' : '♻', p.c, p.n, p.a, p.d, p.x, `data-k="${p.k}"`)).join('') +
      `<div class="sub">Compostaje paso a paso</div>` + ['Separación: en cultivo, poscosecha y mercado se recogen aparte los restos vegetales aptos.', 'Pesaje: se registran los kilos de cada actividad.', 'Proceso: mezcla con material seco; temperatura, humedad y manejo por lote.', 'Maduración y destino: primero jardinería demostrativa; en camas alimentarias solo con controles de calidad.', 'Ajuste: cuatro semanas pesando entradas para saber si alcanzan las tres composteras.']
        .map((t, i) => fila(i + 1, '#d4a373', t.split(':')[0], '', t.split(':').slice(1).join(':'), '', '')).join('') +
      `<div class="ind"><b style="color:#fff">Indicador:</b> de cada 100 kg que recibe el mercado, cuántos se venden, cuántos siguen siendo alimento y cuántos van a compost (se mide en el piloto).</div>`
  };
  pan.innerHTML = `<header><button type="button" class="cerrar" aria-label="Cerrar Bavaria Común">&#215;</button><div class="ey">Bavaria Común · distrito de tecnologías convergentes</div><h2>Nano, bio, info y cogno sobre un mismo sistema alimentario</h2>
      <p class="lead">Estudiantes, investigadores, productores y comerciantes cultivan, conservan, distribuyen y aprovechan los residuos; la fauna que llega trabaja para las huertas y todo se mide. El predio cerrado se abre al barrio con pasajes.</p>
      <div class="kp"><div><b>12</b><span>edificios con programa NBIC</span></div><div><b>${HA.toFixed(1).replace('.', ',')} ha</b><span>de huertas</span></div><div><b>${INTER.length}</b><span>interacciones bióticas</span></div><div><b>${PAS.length}</b><span>pasajes nuevos</span></div></div></header>
    <nav class="tabs" role="tablist">${[['dist', 'Distrito NBIC'], ['fauna', 'Fauna'], ['huerta', 'Huertas'], ['ciclo', 'Compost y energía']].map(([k, n], i) => `<button type="button" role="tab" data-t="${k}" aria-selected="${!i}">${n}</button>`).join('')}</nav>
    <div class="cuerpo" role="tabpanel"></div>
    <div class="pie"><button type="button" class="go" id="bd-go"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z" fill="currentColor"/></svg>Seguir una cosecha</button><a class="sec2" id="bd-pts" href="bavaria_puntos.html" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">En puntos</a><a class="sec2" id="bd-dentro" href="bavaria_interior.html?e=bio" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Por dentro</a><button type="button" class="sec2" id="bd-ver">Vista general</button></div>`;
  document.body.appendChild(pan);
  const cuerpo = pan.querySelector('.cuerpo');
  let sxObj = 1, focoFauna = null;
  const pintar = () => { cuerpo.innerHTML = TABS[tab](); pan.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab))); cuerpo.scrollTop = 0; verGrupoEtq(); };
  pan.querySelector('.tabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; pintar(); focoFauna = null; resaltar(null);
    if (tab === 'sx') volar(...vistaSx()); else if (tab === 'fauna') volarA(C_CAMPO, 260); else if (tab === 'huerta') volarA(C_CAMPO, 90); else if (tab === 'ciclo') enfocar('comp', true); else general(); };
  const clicFila = (e) => { const sw = e.target.closest('[data-sx]'); if (sw) { sxObj = +sw.dataset.sx; cuerpo.querySelectorAll('[data-sx]').forEach(b => b.setAttribute('aria-pressed', String(b === sw))); return; }
    const it = e.target.closest('.it'); if (!it) return; cuerpo.querySelectorAll('.it.act').forEach(x => x !== it && x.classList.remove('act')); it.classList.toggle('act');
    if (it.dataset.k) enfocar(it.dataset.k, true); else if (it.dataset.f) enfocarFauna(it.dataset.f, true); else if (it.dataset.ret) { const r = RET.find(q => q.k === it.dataset.ret); volarA(r.c, 90); }
    else if (it.dataset.mod) { const m = MODS.find(q => q.k === it.dataset.mod); volarA(loc(C_CAMPO, m.u, m.v), 60); } else if (it.dataset.acc) volarA(ACC.find(a => a.k === it.dataset.acc).p, 160); };
  cuerpo.addEventListener('click', clicFila); cuerpo.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clicFila(e); } });
  pan.querySelector('.cerrar').onclick = (e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('bav-cerrar')); };
  pan.querySelector('header').addEventListener('click', () => { if (innerWidth < 760) pan.classList.toggle('min'); });
  pan.querySelector('#bd-go').onclick = () => (paso >= 0 ? parar() : irPaso(0));
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
  const desplaza = (p1, t, d) => { const dir = t.clone().sub(p1).setY(0).normalize(), der = new THREE.Vector3(-dir.z, 0, dir.x);
    if (innerWidth > 760) { const k = d * 0.3; p1.addScaledVector(der, k); t.addScaledVector(der, k); } else { const k = -d * 0.22; p1.addScaledVector(dir, k); t.addScaledVector(dir, k); } };
  function volarA(c, dist, alto) { const t = new THREE.Vector3(c[0], 0, c[1]), a = -ANG + 0.9, p1 = new THREE.Vector3(c[0] + Math.sin(a) * dist, alto || dist * 0.75, c[1] + Math.cos(a) * dist); desplaza(p1, t, dist); volar(p1, t); }
  function general() { const c = M(9335, 3020), sm = MOV ? 1.5 : 1, t = new THREE.Vector3(c[0], 0, c[1]), p1 = new THREE.Vector3(c[0] + 170 * sm, 250 * sm, c[1] + 330 * sm); desplaza(p1, t, 330 * sm); volar(p1, t); }
  function vistaSx() { const c = M(9319, 2943), sm = MOV ? 1.4 : 1, t = new THREE.Vector3(c[0], 0, c[1]), p1 = new THREE.Vector3(c[0] + 300 * sm, 1250 * sm, c[1] + 700 * sm); desplaza(p1, t, 900 * sm); return [p1, t, 1800]; }
  function resaltar(k) { SHELL.forEach(s => { s.dim = !!k && s.k !== k; }); Object.entries(LBP).forEach(([kk, o]) => { o.d.classList.toggle('act', kk === k); o.d.classList.toggle('dim', !!k && kk !== k); }); }
  function enfocar(k, desdePanel) { { const pd = document.getElementById('bd-dentro'); if (pd && ['inst', 'bio', 'nano', 'datos', 'cogn', 'foro', 'poli', 'pos', 'mer', 'inc', 'alim', 'torre'].includes(k)) { pd.href = 'bavaria_interior.html?e=' + k; pd.textContent = 'Entrar: ' + (PK[k] ? PK[k].n.split(' ')[0] : 'edificio'); } }
    resaltar(k); const ps = POS[k]; if (!ps) return;
    const dist = { inst: 190, bio: 220, nano: 140, datos: 190, cogn: 180, foro: 260, poli: 150, pos: 150, mer: 140, inc: 140, alim: 140, torre: 160, campo: 260, comp: 60, sol: 70 }[k] || 160;
    volarA([ps[0], ps[2]], dist);
    if (!desdePanel) { const t = ['campo'].includes(k) ? 'huerta' : ['comp', 'sol'].includes(k) ? 'ciclo' : 'dist'; if (t !== tab) { tab = t; pintar(); } const it = cuerpo.querySelector(`[data-k="${k}"]`); if (it) { it.classList.add('act'); it.scrollIntoView({ block: 'nearest', behavior: RMQ.matches ? 'auto' : 'smooth' }); } }
  }
  function enfocarFauna(k, desdePanel) {
    focoFauna = k; INTER.forEach((I, i) => { FOCo[i] = I.k === k ? 1 : 0.12; }); const [p] = FPOS[k]; volarA(p, k === 'lechuza' ? 200 : 110);
    if (!desdePanel) { if (tab !== 'fauna') { tab = 'fauna'; pintar(); } const it = cuerpo.querySelector(`[data-f="${k}"]`); if (it) { it.classList.add('act'); it.scrollIntoView({ block: 'nearest' }); } }
  }

  /* ---------- seguir una cosecha ---------- */
  const cap = document.createElement('section'); cap.id = 'bd-cap'; cap.setAttribute('aria-live', 'polite');
  cap.innerHTML = `<div class="tp"><span></span><span><i></i></span><button type="button" data-a="p" aria-label="Paso anterior">&#8249;</button><button type="button" data-a="n" aria-label="Paso siguiente">&#8250;</button><button type="button" data-a="x" aria-label="Terminar">&#215;</button></div><h3></h3><p></p>`;
  document.body.appendChild(cap);
  cap.onclick = (e) => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'p') irPaso(paso - 1); else if (b.dataset.a === 'n') irPaso(paso + 1); else parar(); };
  let paso = -1, tPaso = 0, cajaDe = null; const DUR = 6500;
  function irPaso(i) {
    if (i < 0) i = 0; if (i >= COSECHA.length) { parar(); return; }
    const prev = paso >= 0 ? COSECHA[paso] : null; paso = i; const P = COSECHA[i];
    cap.querySelector('.tp span').textContent = `${String(i + 1).padStart(2, '0')} / ${String(COSECHA.length).padStart(2, '0')}`; cap.querySelector('h3').textContent = P.t; cap.querySelector('p').textContent = P.x; cap.classList.add('on');
    const ini = prev ? prev.p[prev.p.length - 1] : P.p[0], pts = [ini, ...P.p].map(q => { const w = M(q[0], q[1]); return new THREE.Vector3(w[0], 2.2, w[1]); });
    cajaDe = pts.length > 1 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null; caja.visible = true; if (!cajaDe) caja.position.copy(pts[0]);
    resaltar(P.k); const fin = P.p[P.p.length - 1], w = M(fin[0], fin[1]);
    if (P.k === 'datos') enfocar('datos', true); else volarA(w, P.k === 'pos' ? 150 : P.k === 'mer' ? 120 : P.k === 'bio' ? 200 : 90);
    tPaso = performance.now(); pan.querySelector('#bd-go').lastChild.textContent = 'Detener recorrido';
  }
  function parar() { if (paso < 0) return; paso = -1; cap.classList.remove('on'); caja.visible = false; resaltar(null); pan.querySelector('#bd-go').lastChild.textContent = 'Seguir una cosecha'; }
  addEventListener('keydown', (e) => { if (paso >= 0 && e.key === 'Escape') parar(); });

  /* ---------- animación ---------- */
  let raf = 0, ult = performance.now(), tOn = 0, on = false; const V = new THREE.Vector3();
  const ease = (k) => { k = Math.max(0, Math.min(1, k)); return 1 - Math.pow(1 - k, 3); };
  function cuadro() {
    raf = requestAnimationFrame(cuadro); const ahora = performance.now(), dt = Math.min(0.1, (ahora - ult) / 1000); ult = ahora;
    const mov = !RMQ.matches, t = RMQ.matches ? 99 : (ahora - tOn) / 1000; if (mov) TU.value += dt;
    if ((cuadro.n = (cuadro.n || 0) + 1) % 12 === 0) PLANTAS();
    // secuencia de entrada: edificios (0-2,4 s), sintaxis (1,6-3,4 s), pasajes (2-4,5 s), red de datos (2,8-4,6 s), fauna (3,8-5 s)
    SHELL.forEach(s => { s.mat.uniforms.uRise.value = ease((t - s.orden * 0.18) / 1.0); const objD = s.dim ? 0.3 : 1; s.mat.uniforms.uDim.value += (objD - s.mat.uniforms.uDim.value) * Math.min(1, dt * 5); s.ml.opacity = 0.9 * s.mat.uniforms.uDim.value * s.mat.uniforms.uRise.value; });
    const sxDest = sxObj * ease((t - 1.6) / 1.8); SXU.uMix.value += (sxDest - SXU.uMix.value) * Math.min(1, dt * 3); SXU.uDraw.value = ease((t - 2) / 2.5); SXU.uVis.value = ease((t - 0.8) / 0.8);
    RD.uDraw.value = ease((t - 2.8) / 1.8); RD.uVis.value = ease((t - 2.8) / 0.6);
    UBIO.uVis.value = ease((t - 3.8) / 1.2); for (let i = 0; i < INTER.length; i++) { const obj = focoFauna ? FOCo[i] : 1; FOC[i] += (obj - FOC[i]) * Math.min(1, dt * 4); INTER[i].ln.material.opacity = 0.22 * FOC[i] * UBIO.uVis.value; }
    LUCES.forEach((l, i) => { l.material.emissiveIntensity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(ahora / 300 + i)); });
    CAM(dt, mov && SXU.uMix.value > 0.5); CARGA(dt, mov);
    ACC.forEach(a => { const s = 1 + 0.25 * Math.sin(ahora / 350); a.ani.scale.set(s, 1, s); });
    if (paso >= 0) { const k = Math.min(1, (ahora - tPaso) / DUR); cap.querySelector('.tp i').style.width = (k * 100).toFixed(1) + '%';
      if (cajaDe) { const kk = Math.min(1, (ahora - tPaso) / 2600), e = kk * kk * (3 - 2 * kk); caja.position.copy(cajaDe.getPointAt(e)); } caja.rotation.y += dt; halo.scale.setScalar(1 + 0.2 * Math.sin(ahora / 200)); if (k >= 1) irPaso(paso + 1); }
    const cam = T3.camera, Wd = innerWidth, H = innerHeight;
    for (const e of ETQ) { let ok = e.on && t > 1.2; if (ok) { V.set(e.pos[0], e.pos[1], e.pos[2]).project(cam); ok = V.z < 1 && Math.abs(V.x) < 1.02 && Math.abs(V.y) < 1.02; }
      e.d.style.display = ok ? 'block' : 'none'; if (ok) e.d.style.transform = `translate(${((V.x + 1) / 2 * Wd - 10).toFixed(1)}px,${((1 - V.y) / 2 * H - e.d.offsetHeight - 18).toFixed(1)}px)`; }
  }

  return {
    ver(v) {
      if (v === on) return; on = v; grupo.visible = v;
      const bv = T3.bavaria; if (bv && bv.userData) { if (bv.userData.demoler) bv.userData.demoler.visible = !v; if (bv.userData.mallasHuerta && v) bv.userData.mallasHuerta.forEach(m => { m.visible = false; }); }
      pan.classList.toggle('on', v); document.body.classList.toggle('bd-on', v);
      if (v) { pan.classList.toggle('min', innerWidth < 760); tab = 'dist'; sxObj = 1; focoFauna = null; pintar(); tOn = ult = performance.now(); SXU.uMix.value = 0; if (!raf) cuadro(); PLANTAS(true); general(); }
      else { parar(); cancelAnimationFrame(raf); raf = 0; ETQ.forEach(e => { e.d.style.display = 'none'; }); }
    },
    get on() { return on; }, grupo
  };
}
