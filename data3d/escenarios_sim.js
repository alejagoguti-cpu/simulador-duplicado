/* ============ ESCENARIOS EN EL TERRITORIO (SIM-01, SIM-02 y SIM-03 con sliders, sobre el mapa) ============
   A = «Kennedy hoy» (sin intervención). B = nodo único con decisión central. C = clúster con decisión rotativa.
   El modelo (data3d/sim_modelos.js, el mismo del tablero) corre 10 años semana a semana y CADA resultado se ve en el 3D:
   · SIM-01  hogares con huerta  -> huertas de barrio que se abren desde Bavaria hacia afuera (y se cierran si hay abandono)
             dependencia de Corabastos -> menos carros y camiones en la Av. Ciudad de Cali (T3.alivio.KEEP) y el anillo de Corabastos
             promotores formados -> etiqueta en Bavaria Común
   · SIM-02  orgánicos: camiones al relleno Doña Juana (A) / estaciones barriales de compostaje (B) / planta de Bavaria (C),
             con partículas proporcionales a los kilos y la ocupación de cada estación
   · SIM-03  aves -> fracción de aves visibles en la red biótica (T3.bio.ESTADO.fauna); integridad del humedal -> anillo de El Burro;
             trampas ecológicas (luz y vidrio) -> huertas del borde en rojo si no hay medida antitrampa */
import { SEM, AÑO, PAR, SIMST, avisar, correrTodo } from './sim_modelos.js?v=2';
export async function iniciarEscenariosSim({ T3, cj }) {
  const THREE = T3.THREE, MOV = innerWidth < 760, RMQ = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HB = await cj('data3d/huertas_barrio.json?v=3').catch(() => ({ huertas: [] }));
  const { P1, P2, P3 } = PAR;
  let R = correrTodo();
  const fmt = (v, d = 0) => (v == null || !isFinite(v)) ? '–' : v.toLocaleString('es-CO', { maximumFractionDigits: d, minimumFractionDigits: d });
  const fmtK = (v) => v >= 1e6 ? fmt(v / 1e6, 1) + ' M' : v >= 1e4 ? fmt(v / 1e3, 0) + ' mil' : fmt(v);
  const Y = T3.sueloY != null ? T3.sueloY : 0.35;
  const esc = () => (T3.escenario === 'proyecto' ? SIMST.esc : 'A');

  /* ---------------- lugares ---------------- */
  const BURRO = [2095.67, -109.06], CORA = [1132.1, 948.6], BAV = [4136, 96], DJ = [5200, 2900]; // Doña Juana queda al sureste, fuera del mapa
  const BAVC = () => (window.KEN_BAV && window.KEN_BAV.compost) || [4185.7, 28.9];
  // estaciones barriales de compostaje (B): 8 huertas de parque bien repartidas (punto más lejano)
  const PQ = HB.huertas.filter(h => h.tipo === 'parque').map(h => h.c);
  const EST = []; if (PQ.length) { EST.push(PQ[0]); while (EST.length < Math.min(8, PQ.length)) { let m = null, md = -1; for (const p of PQ) { const d = Math.min(...EST.map(e => Math.hypot(e[0] - p[0], e[1] - p[1]))); if (d > md) { md = d; m = p; } } EST.push(m); } }
  const BORDE = PQ.filter(p => Math.hypot(p[0] - BURRO[0], p[1] - BURRO[1]) < 1100); // huertas del borde del humedal (trampas)

  /* ---------------- 3D ---------------- */
  const grupo = new THREE.Group(); grupo.name = 'escenarios_sim'; T3.scene.add(grupo);
  const anillo = (r0, r1, c) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); m.renderOrder = 7; grupo.add(m); return m; };
  const aHum = anillo(300, 312, '#59a14f'); aHum.visible = false; aHum.position.set(BURRO[0], Y + 1.2, BURRO[1]);
  const aCor = anillo(330, 342, '#e15759'); aCor.visible = false; aCor.position.set(CORA[0], Y + 1.2, CORA[1]);
  // estaciones barriales: caseta + tres pilas de compost cuya altura sigue la ocupación (G12)
  const mMad = new THREE.MeshStandardMaterial({ color: '#7b5a3c', roughness: 0.9 }), mPila = new THREE.MeshStandardMaterial({ color: '#3b2b1f', roughness: 1 }), mTecho = new THREE.MeshStandardMaterial({ color: '#59615c', roughness: 0.6, metalness: 0.3 });
  const ESTM = EST.map(p => { const g = new THREE.Group(); g.position.set(p[0] + 14, Y, p[1] + 10);
    const caseta = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 4).translate(0, 1.3, 0), mMad), techo = new THREE.Mesh(new THREE.BoxGeometry(7, 0.12, 5).translate(0, 2.8, 0), mTecho);
    const pilas = [-3, 0, 3].map(x => { const m = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 8, 0, 6.29, 0, 1.4).scale(1.4, 1, 1), mPila); m.position.set(x, 0, 4.2); g.add(m); return m; });
    caseta.castShadow = techo.castShadow = true; g.add(caseta, techo); g.visible = false; grupo.add(g); return { g, pilas }; });
  // rutas de orgánicos (partículas): relleno, estación, Bavaria
  const curva = (a, b, h) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0], Y + 4, a[1]), new THREE.Vector3((a[0] + b[0]) / 2, Y + 4 + L * h, (a[1] + b[1]) / 2), new THREE.Vector3(b[0], Y + 4, b[1])); };
  const FUENTE = EST.map(p => [p[0] + 160, p[1] - 120]); // barrios que separan sus orgánicos (al lado de cada estación)
  const RUTAS = { rell: EST.map((p, i) => curva(FUENTE[i], DJ, 0.05)), est: EST.map((p, i) => curva(FUENTE[i], p, 0.25)), bav: EST.map((p, i) => curva(FUENTE[i], BAVC(), 0.08)) };
  const NP = MOV ? 260 : 520, PP = new Float32Array(NP * 3), PC = new Float32Array(NP * 3), gp = new THREE.BufferGeometry();
  gp.setAttribute('position', new THREE.BufferAttribute(PP, 3)); gp.setAttribute('color', new THREE.BufferAttribute(PC, 3));
  const puntos = new THREE.Points(gp, new THREE.PointsMaterial({ size: MOV ? 5 : 6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false })); puntos.renderOrder = 11; puntos.visible = false; // (los puntos que viajaban confundían: el cambio de los residuos se lee en las etiquetas)
  const PART = Array.from({ length: NP }, (_, i) => ({ r: 'rell', k: i % Math.max(1, EST.length), f: Math.random(), on: false }));
  const COLR = { rell: new THREE.Color('#9aa1a6'), est: new THREE.Color('#c8a26a'), bav: new THREE.Color('#e2a55b') };
  // trampas ecológicas: huertas del borde del humedal en rojo (luz y vidrio sin medida antitrampa)
  /* ---------- CAPA DE CAMBIOS: se lee desde lejos (los cambios reales miden metros y desde 1 km no se verían) ----------
     · cada huerta abierta = punto verde con halo que nunca baja de ~9 px (parques y lotes en el orden en que se abren, Bavaria y colegios)
     · Av. Ciudad de Cali = línea de puntos que va de rojo (mucho tráfico hacia Corabastos) a verde (menos) */
  const COLR2 = await cj('data3d/colegios_red.json?v=3').catch(() => null);
  const MK = []; // [x, z, radio m, tipo, orden]
  const parques = HB.huertas.filter(h => h.tipo === 'parque').sort((a, b) => Math.hypot(a.c[0] - BAV[0], a.c[1] - BAV[1]) - Math.hypot(b.c[0] - BAV[0], b.c[1] - BAV[1]));
  parques.forEach((h, i) => MK.push([h.c[0], h.c[1], 22, 'par', i / Math.max(1, parques.length)]));
  HB.huertas.filter(h => h.tipo === 'lote').forEach(h => h.m.forEach(m => MK.push([m.c[0], m.c[1], 16, 'lote', 0.06])));
  (COLR2 && COLR2.huertas || []).forEach(h => MK.push([h.c[0], h.c[1], h.r || 30, 'col', 0.02]));
  const gm = new THREE.BufferGeometry(), mP = new Float32Array(MK.length * 3), mR = new Float32Array(MK.length), mO = new Float32Array(MK.length);
  MK.forEach((m, i) => { mP.set([m[0], Y + 3, m[1]], i * 3); mR[i] = m[2]; });
  gm.setAttribute('position', new THREE.BufferAttribute(mP, 3)); gm.setAttribute('rad', new THREE.BufferAttribute(mR, 1)); gm.setAttribute('on', new THREE.BufferAttribute(mO, 1));
  const UM = { uPx: { value: innerHeight * Math.min(2, devicePixelRatio || 1) }, uT: { value: 0 }, uA: { value: 0 } };
  const marcas = new THREE.Points(gm, new THREE.ShaderMaterial({ uniforms: UM, transparent: true, depthWrite: false, depthTest: false, toneMapped: false,
    vertexShader: `attribute float rad, on; uniform float uPx, uT; varying float vO; void main(){ vO = on; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
      float px = rad * 2.6 * uPx / max(-mv.z, 1.0) * 0.55; gl_PointSize = on > 0.01 ? clamp(px, 18.0, 110.0) : 0.0; }`,
    fragmentShader: `uniform float uT, uA; varying float vO; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q) * 2.0; if (d > 1.0) discard;
      float nucleo = smoothstep(0.42, 0.3, d), halo = smoothstep(1.0, 0.45, d) * 0.45, anillo = smoothstep(0.08, 0.0, abs(d - 0.62)) * 0.8;
      vec3 c = mix(vec3(0.3, 0.85, 0.35), vec3(0.85, 1.0, 0.7), nucleo); gl_FragColor = vec4(c, (nucleo * 0.95 + halo + anillo) * vO * uA);
      #include <colorspace_fragment>
    }` }));
  marcas.renderOrder = 12; marcas.frustumCulled = false; grupo.add(marcas);
  // Av. Ciudad de Cali: puntos a lo largo de la vía (de la cinta de data3d/alivio_cali.js)
  let via = null;
  const armarVia = () => { const C = window.KEN_CALI; if (via || !C || !C.cinta) return; const P = C.cinta.geometry.attributes.position, A = [];
    const mid = (i) => [(P.getX(i) + P.getX(i + 1)) / 2, P.getY(i) + 1.5, (P.getZ(i) + P.getZ(i + 1)) / 2];
    for (let i = 0; i + 3 < P.count; i += 2) { const a = mid(i), b = mid(i + 2), L = Math.hypot(b[0] - a[0], b[2] - a[2]); if (L > 400) continue; const n = Math.max(1, Math.ceil(L / 6)); for (let k = 0; k < n; k++) { const t = k / n; A.push(a[0] + (b[0] - a[0]) * t, a[1], a[2] + (b[2] - a[2]) * t); } }
    const gv = new THREE.BufferGeometry(); gv.setAttribute('position', new THREE.Float32BufferAttribute(A, 3));
    via = new THREE.Points(gv, new THREE.PointsMaterial({ size: 9, sizeAttenuation: false, color: '#e15759', transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, toneMapped: false }));
    via.renderOrder = 12; via.frustumCulled = false; grupo.add(via); };
  /* ---------- FRANJA DE TRÁFICO de la Av. Ciudad de Cali: color y grosor = cuántos vehículos van hacia Corabastos ----------
     roja y gruesa = tráfico alto (A, Kennedy hoy) · naranja = medio · verde y delgada = bajo. Ancho en pantalla casi constante: se ve desde lejos. */
  const DC = await cj('data3d/alivio_cali.json?v=1').catch(() => null);
  const UB = { uW: { value: 12 }, uC: { value: new THREE.Color('#e15759') }, uA: { value: 0 } };
  let banda = null;
  if (DC && DC.lineas) { const P = [], N = [], I = [];
    for (const L of DC.lineas) { const b0 = P.length / 3;
      for (let k = 0; k < L.length; k++) { const a = L[Math.max(0, k - 1)], b = L[Math.min(L.length - 1, k + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        const x = L[k][0], z = L[k][1], y = (T3.viaY != null ? T3.viaY : 0.62) + 0.5 + (T3.alzaVia ? T3.alzaVia(x, z) : 0);
        P.push(x, y, z, x, y, z); N.push(-dz, dx, 1, -dz, dx, -1); if (k < L.length - 1) { const v = b0 + k * 2; I.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); } } }
    const gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gb.setAttribute('lado', new THREE.Float32BufferAttribute(N, 3)); gb.setIndex(I);
    banda = new THREE.Mesh(gb, new THREE.ShaderMaterial({ uniforms: UB, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, toneMapped: false,
      vertexShader: 'attribute vec3 lado; uniform float uW; varying float vS; void main(){ vS = lado.z; vec3 p = position + vec3(lado.x, 0.0, lado.y) * lado.z * uW; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
      fragmentShader: `uniform vec3 uC; uniform float uA; varying float vS; void main(){ float s = abs(vS); float a = 1.0 - smoothstep(0.78, 1.0, s); vec3 c = mix(uC, uC * 1.25, smoothstep(0.5, 0.0, s));
        gl_FragColor = vec4(c, uA * 0.78 * a);
        #include <colorspace_fragment>
      }` }));
    banda.renderOrder = 11; banda.frustumCulled = false; banda.name = 'trafico_escenario'; grupo.add(banda); }
  let kTr = 1; // fracción del tráfico de hoy que sigue en la vía (1 = como hoy)
  const C_ROJO = new THREE.Color('#e15759'), C_NAR = new THREE.Color('#f28e2b'), C_VER = new THREE.Color('#59a14f');
  const colorTr = (k) => { const u = Math.max(0, Math.min(1, (k - 0.5) / 0.5)); return u > 0.5 ? C_NAR.clone().lerp(C_ROJO, (u - 0.5) * 2) : C_VER.clone().lerp(C_NAR, u * 2); };
  const nivelTr = (k) => k > 0.85 ? 'alto' : k > 0.65 ? 'medio' : 'bajo';
  /* ---------- COMPOST en el mapa: B = 8 estaciones de barrio · C = una planta grande en Bavaria (A: nada, todo va en camión al relleno) ---------- */
  const CP = [...EST.map(p => [p[0], p[1], 26]), [BAVC()[0], BAVC()[1], 46]];
  const gc = new THREE.BufferGeometry(), cPos = new Float32Array(CP.length * 3), cTam = new Float32Array(CP.length), cOn = new Float32Array(CP.length);
  CP.forEach((c, i) => { cPos.set([c[0], Y + 4, c[1]], i * 3); cTam[i] = c[2]; });
  gc.setAttribute('position', new THREE.BufferAttribute(cPos, 3)); gc.setAttribute('tam', new THREE.BufferAttribute(cTam, 1)); gc.setAttribute('on', new THREE.BufferAttribute(cOn, 1));
  const UC = { uA: { value: 0 }, uR: { value: Math.min(2, devicePixelRatio || 1) } };
  const compostM = new THREE.Points(gc, new THREE.ShaderMaterial({ uniforms: UC, transparent: true, depthWrite: false, depthTest: false, toneMapped: false,
    vertexShader: 'attribute float tam, on; uniform float uR; varying float vO; void main(){ vO = on; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = on > 0.01 ? tam * uR : 0.0; }',
    fragmentShader: `uniform float uA; varying float vO; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q) * 2.0; if (d > 1.0) discard;
      float anillo = smoothstep(0.86, 0.8, d) - smoothstep(0.72, 0.66, d); float centro = smoothstep(0.66, 0.6, d);
      vec3 c = mix(vec3(0.55, 0.38, 0.2), vec3(0.85, 0.66, 0.42), smoothstep(0.6, 0.0, d)); c = mix(c, vec3(1.0), anillo);
      gl_FragColor = vec4(c, uA * vO * max(centro * 0.95, anillo) );
      #include <colorspace_fragment>
    }` }));
  compostM.renderOrder = 12; compostM.frustumCulled = false; grupo.add(compostM);
  let fMarcas = 0;
  const TR = BORDE.map(p => { const m = anillo(16, 22, '#ff5a4f'); m.position.set(p[0], Y + 1.5, p[1]); m.visible = false; m.userData.nunca = true; return m; });

  /* ---------------- etiquetas sobre el territorio ---------------- */
  const css = document.createElement('style'); css.textContent = `
.es-et{position:fixed;left:0;top:0;z-index:5;pointer-events:none;display:none;padding:6px 10px;border-radius:10px;font:400 11px/1.3 var(--ui-sans,Inter,system-ui,sans-serif);color:#eef1f2;white-space:nowrap;
  background:var(--ui-glass,rgba(14,16,20,.6));border:1px solid var(--ui-glass-bd,rgba(255,255,255,.16));backdrop-filter:blur(14px) saturate(1.6);-webkit-backdrop-filter:blur(14px) saturate(1.6);font-variant-numeric:tabular-nums}
.es-et b{display:block;font-weight:600;font-size:11.5px}.es-et i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}.es-et em{font-style:normal;color:#f2c995}
#esim{position:fixed;right:16px;bottom:86px;z-index:8;width:330px;max-height:calc(100vh - 470px);min-height:150px;display:flex;flex-direction:column;border-radius:18px;overflow:hidden;color:#e9ecee;
  font:400 12px/1.4 var(--ui-sans,Inter,system-ui,sans-serif);background:var(--ui-glass,rgba(14,16,20,.62));border:1px solid var(--ui-glass-bd,rgba(255,255,255,.16));box-shadow:var(--ui-glass-sh,0 20px 40px rgba(0,0,0,.3));
  backdrop-filter:var(--ui-glass-fx,blur(24px) saturate(1.8));-webkit-backdrop-filter:var(--ui-glass-fx,blur(24px) saturate(1.8))}
#esim .cab{display:flex;align-items:center;gap:8px;padding:11px 12px 8px 14px}#esim .cab b{flex:1;font-weight:600;font-size:13px}
#esim .cab button{all:unset;cursor:pointer;width:26px;height:26px;display:grid;place-items:center;border-radius:8px;color:#b3bbc0}#esim .cab button:hover{background:rgba(255,255,255,.08);color:#fff}
#esim .cab button:focus-visible,#esim .seg button:focus-visible,#esim .tl button:focus-visible{outline:2px solid #fff;outline-offset:1px}
#esim .seg{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin:0 12px;padding:3px;border-radius:11px;background:rgba(0,0,0,.22)}
#esim .seg button{all:unset;cursor:pointer;text-align:center;padding:6px 4px;border-radius:8px;color:#b3bbc0;font-size:11px;line-height:1.2}#esim .seg button b{display:block;font-size:12px;color:#e9ecee;font-weight:600}
#esim .seg button[aria-pressed=true]{background:color-mix(in srgb,var(--c) 22%,transparent);box-shadow:inset 0 0 0 1px var(--c);color:#fff}
#esim .seg button b::before{content:"";display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;background:var(--c)}
#esim .tl{display:flex;align-items:center;gap:8px;padding:10px 12px 6px}#esim .tl button{all:unset;cursor:pointer;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#e2a55b;color:#1a1208;font-size:12px;flex:none}
#esim .tl input{flex:1;accent-color:#e2a55b;min-width:0}#esim .tl output{width:58px;text-align:right;font-variant-numeric:tabular-nums;color:#d5dadd;font-size:11px}
#esim .cuerpo{overflow:auto;padding:2px 12px 12px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}
#esim ul{list-style:none;margin:4px 0 8px;padding:0;display:grid;gap:4px}#esim li{display:grid;grid-template-columns:1fr auto;gap:0 8px;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.04)}
#esim li span{color:#c3cace;font-size:11px}#esim li strong{font-weight:600;font-size:12.5px;text-align:right;font-variant-numeric:tabular-nums}#esim li small{grid-column:1/-1;color:#949da3;font-size:10.5px}
#esim li small em{font-style:normal;color:#f2c995}
#esim details{margin-top:6px;border-top:1px solid rgba(255,255,255,.08);padding-top:6px}#esim summary{cursor:pointer;font-weight:600;font-size:11.5px;padding:4px 0;color:#dfe4e6}
#esim label{display:grid;grid-template-columns:1fr auto;gap:2px 8px;margin:7px 0;font-size:11px;color:#c3cace}#esim label output{color:#fff;font-variant-numeric:tabular-nums}
#esim label input[type=range]{grid-column:1/-1;width:100%;accent-color:#e2a55b}#esim .chk label{display:flex;gap:6px;align-items:center;margin:5px 0}#esim .chk input{accent-color:#e2a55b}
#esim .nota{color:#8d969b;font-size:10.5px;margin:6px 0 0}#esim .ir{all:unset;cursor:pointer;display:block;text-align:center;margin-top:10px;padding:8px;border-radius:9px;background:rgba(255,255,255,.07);font-weight:500}
#esim .ir:hover{background:rgba(255,255,255,.12)}
#esim.min .cuerpo,#esim.min .exp{display:none}#esim.min{min-height:0}
#esim .exp{margin:0 14px 8px;font-size:11px;line-height:1.45;color:#c3cace}#esim .ley2 i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:-1px}
#esim li button{all:unset;cursor:pointer;grid-column:1/-1;justify-self:start;margin-top:4px;font-size:10.5px;font-weight:600;color:#f2c995}#esim li button:hover{text-decoration:underline}#esim li button:focus-visible{outline:2px solid #fff;outline-offset:2px}
#esim .aviso{margin:6px 12px 0;padding:8px 10px;border-radius:10px;background:rgba(226,165,91,.14);border:1px solid rgba(226,165,91,.35);font-size:11px;line-height:1.4;color:#f3e3cc;display:flex;gap:8px;align-items:center}
#esim .aviso[hidden]{display:none}#esim .aviso span{flex:1}#esim .aviso button{all:unset;cursor:pointer;font-weight:600;color:#fff;padding:4px 8px;border-radius:7px;background:rgba(255,255,255,.12);white-space:nowrap}
#esim .tl .yr{font-size:10px;color:#949da3;display:block;text-align:right}
body.tb-abierto #esim{display:none}
#esim .mapa{margin:6px 12px 2px;padding:8px 10px 6px;border-radius:12px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.07)}
#esim .mapa h5{display:flex;flex-wrap:wrap;gap:2px 8px;justify-content:space-between;margin:0 0 4px;font:600 9.5px var(--ui-mono,monospace);letter-spacing:.12em;text-transform:uppercase;color:#cfd5d9}#esim .mapa h5 span{color:var(--c)}
#esim .mapa button{all:unset;cursor:pointer;box-sizing:border-box;display:grid;grid-template-columns:22px minmax(0,1fr);gap:8px;align-items:center;width:100%;padding:4px 2px;border-radius:7px;font-size:11px;line-height:1.35;color:#d5dadd}
#esim .mapa button:hover{background:rgba(255,255,255,.06)}#esim .mapa button:focus-visible{outline:2px solid #fff}#esim .mapa button b{color:#fff;font-weight:600}
#esim .mapa .sw{justify-self:center;display:block}#esim .mapa .sw.b{width:22px;border-radius:3px}#esim .mapa .sw.p{width:12px;height:12px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.7)}
#esim.min .mapa{display:block}
@media (max-width:760px){#esim{left:8px;right:8px;width:auto;top:146px;bottom:auto;max-height:40vh}#esim .cab{padding:8px 10px 6px 12px}}`;
  document.head.appendChild(css);
  const chip = (html) => { const d = document.createElement('div'); d.className = 'es-et'; d.innerHTML = html; document.body.appendChild(d); return d; };
  const ET = { via: chip(''), cora: chip(''), hum: chip(''), bav: chip(''), comp: chip(''), dj: chip('') };
  const POS = { via: () => { const m = T3.alivio && T3.alivio.mid; return m ? [m[0], 20, m[1]] : [0, -999, 0]; }, cora: () => [CORA[0], 40, CORA[1]], hum: () => [BURRO[0], 30, BURRO[1]], bav: () => [BAV[0], 70, BAV[1]], comp: () => { const e = esc(); return e === 'C' ? [BAVC()[0], 30, BAVC()[1]] : EST[0] ? [EST[0][0], 20, EST[0][1]] : [0, 0, 0]; }, dj: () => { const f = FUENTE[0] || [0, 0]; return [(f[0] * 2 + DJ[0]) / 3, 50, (f[1] * 2 + DJ[1]) / 3]; } };

  /* ---------------- panel ---------------- */
  const slider = (P, k, n, min, max, paso, f = (v) => fmt(v)) => `<label>${n}<output data-o="${k}">${f(P[k])}</output><input type="range" data-g="${P === P1 ? 1 : P === P2 ? 2 : 3}" data-k="${k}" min="${min}" max="${max}" step="${paso}" value="${P[k]}"></label>`;
  const pct = (v) => fmt(v * 100) + ' %';
  const FMT = { alcance: pct, auto: pct, frac: pct, sust: pct, precio: (v) => '$' + fmt(v), zona: fmtK, reac: (v) => fmt(v, 2), arboles: (v) => fmt(v, 2), luz: (v) => fmt(v, 2), rec: (v) => fmt(v, 3), dist: (v) => fmt(v, 1) };
  const el = document.createElement('section'); el.id = 'esim'; el.setAttribute('aria-label', 'Escenarios de la simulación');
  el.innerHTML = `<div class="cab"><b>Escenarios · 10 años de la propuesta</b><button type="button" data-guia aria-label="Cómo se usa" title="Cómo se usa">?</button><button type="button" data-min aria-label="Plegar" title="Plegar">–</button></div>
<p class="exp">Escoge un escenario y dale ▶: corren 10 años y el mapa cambia. Mueve las variables de abajo y mira qué pasa en el territorio.</p>
<p class="exp ley2"><i style="background:#8fd18a"></i>cada punto verde fijo en el mapa es una huerta que se abrió </p>
<div class="seg" role="group" aria-label="Escenario"><button type="button" data-e="A" style="--c:#8fb0c9"><b>A</b>Kennedy hoy</button><button type="button" data-e="B" style="--c:#b07aa1"><b>B</b>Nodo central</button><button type="button" data-e="C" style="--c:#e2a55b"><b>C</b>Clúster rotativo</button></div>
<div class="tl"><button type="button" data-play aria-label="Correr 10 años">▶</button><input type="range" min="0" max="${SEM - 1}" value="${SIMST.t}" data-t aria-label="Semana de la simulación"><output data-año></output></div>
<div class="mapa" data-mapa aria-live="polite"></div><div class="aviso" data-aviso hidden></div><div class="cuerpo"><ul data-kpi></ul>
<details><summary>Comida · huertas y Corabastos (SIM-01)</summary>
${slider(P1, 'rend', 'Rendimiento (kg/m²·año)', 1, 12, 1)}${slider(P1, 'alcance', 'Alcance sobre lotes y techos', 0.1, 1, 0.05, pct)}${slider(P1, 'auto', 'Autoconsumo', 0.1, 0.7, 0.05, pct)}
${slider(P1, 'precio', 'Precio de excedentes ($/kg)', 1500, 4500, 100, FMT.precio)}${slider(P1, 'acopio', 'Capacidad de acopio (kg/semana)', 2000, 40000, 1000)}${slider(P1, 'reac', 'Reacción de precio de la central', 0, 1, 0.05, FMT.reac)}
${slider(P1, 'cupos', 'Cupos de formación en Bavaria (por trimestre)', 0, 40, 1)}${slider(P1, 'retardo', 'Retardo de aprendizaje (semanas)', 2, 40, 1)}${slider(P1, 'c', 'm² por promotor', 400, 3000, 100)}
${slider(P1, 'rotacion', 'Periodo de rotación (semanas)', 4, 52, 1)}${slider(P1, 'mu', 'Capacidad de decisión central (solicitudes/semana)', 1, 20, 1)}${slider(P1, 'zona', 'Población de la zona de servicio', 10000, 300000, 5000, fmtK)}
${slider(P1, 'sup', 'Huertas de la propuesta: parques, techos y Bavaria (m²)', 0, 200000, 5000, fmtK)}${slider(P1, 'regional', 'Compras directas a productores de la región', 0, 0.8, 0.05, pct)}
<div class="chk">${[['sequia', 'Sequía (años 3-4)'], ['bloqueo', 'Bloqueo del mayorista (año 6)'], ['crece', 'Crecimiento poblacional'], ['baldios', 'Revocación de baldíos (año 6)']].map(([k, n]) => `<label><input type="checkbox" data-b="${k}" ${P1[k] ? 'checked' : ''}>${n}</label>`).join('')}</div>
<p class="nota">Los estreses solo afectan B y C. [SUP] Las compras directas a productores de la región (acopio de Bavaria y mercados de barrio) también bajan la dependencia de Corabastos.</p></details>
<details><summary>Residuos orgánicos y compost (SIM-02)</summary>
${slider(P2, 'frac', 'Fracción desviada', 0.05, 0.9, 0.05, pct)}${slider(P2, 'cap', 'Capacidad de la estación (kg/semana)', 1000, 30000, 500)}${slider(P2, 'mad', 'Semanas de maduración', 4, 24, 1)}
${slider(P2, 'sust', 'Fracción de sustrato al distrito (hongos)', 0, 0.6, 0.05, pct)}${slider(P2, 'dist', 'Distancia estación – huertas (km)', 0.2, 6, 0.1, FMT.dist)}
<p class="nota">B: estaciones de compostaje en los barrios. C: todo va a la planta de Bavaria Común.</p></details>
<details><summary>Aves y humedal (SIM-03)</summary>
${slider(P3, 'disp', 'Alcance de dispersión de las aves (m)', 100, 1500, 50)}${slider(P3, 'borde', 'Huertas en el borde del humedal', 0, 60, 1)}${slider(P3, 'arboles', 'Densidad de árboles', 0, 1, 0.05, FMT.arboles)}
${slider(P3, 'luz', 'Intensidad de luz y vidrio', 0, 1, 0.05, FMT.luz)}${slider(P3, 'rec', 'Tasa de recuperación del humedal', 0, 0.1, 0.005, FMT.rec)}
<div class="chk"><label><input type="checkbox" data-anti ${P3.anti ? 'checked' : ''}>Medida antitrampa</label></div>
<p class="nota">B: huertas sin criterio de ubicación. C: huertas con corredores entre parches.</p></details>
<button type="button" class="ir" data-tab>Ver todas las gráficas en el tablero</button></div>`;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  if (MOV) { el.classList.add('min'); $('[data-min]').textContent = '+'; } // en el celular empieza plegado (solo escenario y tiempo)

  /* ---------------- «ver en el mapa»: vuela al lugar donde cambia y prende la capa que lo muestra ---------------- */
  const volar = (c, alto, atras = 0.55) => { if (!T3.orbit) return; const o = T3.orbit, p0 = T3.camera.position.clone(), t0 = o.target.clone(), p1 = new THREE.Vector3(c[0] + alto * 0.2, alto, c[1] + alto * atras), t1 = new THREE.Vector3(c[0], 0, c[1]), ini = performance.now();
    const f = () => { const k = Math.min(1, (performance.now() - ini) / 1500), e2 = k * k * (3 - 2 * k); T3.camera.position.lerpVectors(p0, p1, e2); o.target.lerpVectors(t0, t1, e2); o.update(); if (k < 1) requestAnimationFrame(f); }; f(); };
  // vista general al escoger un escenario: la Av. Ciudad de Cali, Corabastos, El Burro y Bavaria en un solo cuadro (usa el vuelo del simulador, T3.anim)
  const vistaGeneral = () => { if (!T3.orbit) return; const m = (T3.alivio && T3.alivio.mid) || [1700, 400], P = [BURRO, BAV, CORA, m], xs = P.map(p => p[0]), zs = P.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2 + (MOV ? 0 : 250), cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const alto = 2250, c1 = new THREE.Vector3(cx, 0, cz), p1 = new THREE.Vector3(cx + alto * 0.12, alto, cz + alto * 0.45);
    T3.anim = { t: 0, dur: 2.2, p0: T3.camera.position.clone(), c0: T3.orbit.target.clone(), p1, c1 }; };
  const capaFlujo = (on) => { const b = document.querySelector(`#gs-fc button[data-v="${on ? '1' : ''}"]`); if (b && !b.classList.contains('on')) b.click(); };
  const LUGAR = {
    huertas: { n: 'las huertas que se abren desde Bavaria', ir: () => { capaFlujo(false); volar([3500, 300], 1500, 0.7); } },
    trafico: { n: 'el tráfico de la Av. Ciudad de Cali y Corabastos (capa de flujo de carros)', ir: () => { capaFlujo(true); const m = T3.alivio && T3.alivio.mid; volar(m || CORA, 900, 0.6); } },
    compost: { n: 'el camino de los residuos orgánicos', ir: () => { capaFlujo(false); const e = esc(); volar(e === 'C' ? BAVC() : (EST[0] || BAV), e === 'C' ? 500 : 700, 0.6); } },
    humedal: { n: 'las aves y el estado del Humedal El Burro', ir: () => { capaFlujo(false); volar(BURRO, 750, 0.6); } }
  };
  const GRUPO = { 1: ['huertas', 'trafico'], 2: ['compost'], 3: ['humedal'] };
  let tAviso = 0;
  const avisar2 = (txt, lugar) => { const d = $('[data-aviso]'); d.hidden = false; d.innerHTML = `<span>${txt}: mira ${LUGAR[lugar].n}.</span><button type="button" data-ir="${lugar}">Ver en el mapa</button>`; clearTimeout(tAviso); tAviso = setTimeout(() => { d.hidden = true; }, 9000); };

  /* ---------------- aplicar al territorio ---------------- */
  let ultHB = -1, ultAb = null;
  function aplicar() {
    const e = esc(), t = Math.max(0, Math.min(SEM - 1, Math.floor(SIMST.t))), A = R.S1.A, s1 = R.S1[e], s2 = R.S2[e], s3 = R.S3[e], s3A = R.S3.A;
    // SIM-01 · huertas abiertas y Corabastos
    const f = e === 'A' ? 0 : s1.act[t] / R.S1.C.N; let ab = null;
    const HBAR = window.KEN_HBAR; if (HBAR && HBAR.fraccion && Math.abs(f - ultHB) > 0.004) { ab = HBAR.fraccion(f); ultHB = f; } if (ab) ultAb = ab; else ab = ultAb;
    { const vis = e === 'A' ? 0 : f; if (Math.abs(vis - fMarcas) > 0.002 || e === 'A') { fMarcas = vis; MK.forEach((m, i) => { mO[i] = e === 'A' ? 0 : (m[3] === 'par' ? (m[4] < vis ? 1 : 0) : m[3] === 'lote' ? (vis > 0.06 ? 1 : 0) : 1); }); gm.attributes.on.needsUpdate = true; } }
    const dep = s1.dep[t], al = T3.alivio; if (al) { al.KEEP = e === 'A' ? 1 : 0.3 + 0.7 * dep; al.KEEP_CAM = e === 'A' ? 1 : 0.1 + 0.9 * dep; }
    kTr = e === 'A' ? 1 : 0.3 + 0.7 * dep; UB.uC.value.copy(colorTr(kTr)); // franja de tráfico de la Av. Ciudad de Cali
    aCor.material.color.set(dep > 0.66 ? '#e15759' : dep > 0.33 ? '#f28e2b' : '#59a14f');
    if (via) { const k2 = e === 'A' ? 1 : Math.max(0, Math.min(1, (dep - 0.2) / 0.8)); via.material.color.setRGB(0.35 + 0.53 * k2, 0.63 - 0.29 * k2, 0.31 + 0.04 * k2); } aCor.material.opacity = 0.35 + 0.4 * dep;
    // SIM-02 · orgánicos
    const gen = s2.gen, rel = s2.relleno[t] / gen, des = s2.desv[t] / gen;
    { const bc = BAVC(); cPos[(CP.length - 1) * 3] = bc[0]; cPos[(CP.length - 1) * 3 + 2] = bc[1]; gc.attributes.position.needsUpdate = true;
      CP.forEach((c, i) => { cOn[i] = e === 'B' ? (i < CP.length - 1 ? 1 : 0) : e === 'C' ? (i === CP.length - 1 ? 1 : 0) : 0; }); gc.attributes.on.needsUpdate = true; }
    ESTM.forEach(s => { s.g.visible = e === 'B'; const o = s2.ocup[t]; s.pilas.forEach((p, i) => { p.scale.set(1.4, Math.max(0.05, Math.min(1.6, o * 1.4 - i * 0.25)), 1); p.material.color.set(o > 1 ? '#5a2a1f' : '#3b2b1f'); }); });
    const nRel = Math.round(NP * Math.min(1, rel) * 0.6), nDes = Math.round(NP * Math.min(1, des) * 1.6);
    PART.forEach((p, i) => { if (i < nRel) { p.r = 'rell'; p.on = true; } else if (i < nRel + nDes && e !== 'A') { p.r = e === 'B' ? 'est' : 'bav'; p.on = true; } else p.on = false;
      const c = COLR[p.r]; PC.set([c.r, c.g, c.b], i * 3); });
    gp.attributes.color.needsUpdate = true;
    // SIM-03 · aves, humedal y trampas
    const BI = T3.bio && T3.bio.ESTADO; if (BI) BI.fauna = Math.max(0.12, Math.min(1, s3.aves[t] / 1400));
    const hum = s3.hum[t] / 100; aHum.material.color.setRGB(0.88 - 0.55 * hum, 0.35 + 0.45 * hum, 0.3); aHum.material.opacity = 0.4 + 0.3 * hum;
    const nTr = e === 'A' || P3.anti ? 0 : Math.round(TR.length * Math.min(1, P3.borde / 40) * P3.luz * 1.6); TR.forEach((m) => { m.visible = false; });
    // etiquetas
    const año = Math.floor(t / AÑO) + 1;
    ET.cora.innerHTML = `<b><i style="background:${aCor.material.color.getStyle()}"></i>Corabastos</b>Dependencia ${fmt(dep * 100)} %${e === 'A' ? '' : ` · <em>vías ${al && al.hoy > 0.5 ? '−' + fmt((1 - al.pro / al.hoy) * 100) + ' % carros' : 'con menos carros'}</em>`}`;
    ET.hum.innerHTML = `<b><i style="background:${aHum.material.color.getStyle()}"></i>Humedal El Burro</b>Integridad ${fmt(hum * 100)} % · ${fmt(s3.aves[t])} aves${nTr ? ` · <em style="color:#ff8a80">${nTr} huertas-trampa</em>` : ''}`;
    ET.bav.innerHTML = e === 'A' ? `<b><i style="background:#9aa1a6"></i>Bavaria</b>Sin intervención` : `<b><i style="background:#e2a55b"></i>Bavaria Común</b>${fmt(s1.prom[t])} promotores formados · ${fmt(s1.act[t])} hogares con huerta`;
    ET.comp.innerHTML = e === 'B' ? `<b><i style="background:#c8a26a"></i>Estaciones de compost (${EST.length})</b>Ocupación ${fmt(s2.ocup[t] * 100)} %` : e === 'C' ? `<b><i style="background:#e2a55b"></i>Planta de compost · Bavaria</b>${fmt(s2.desv[t] / 1000, 1)} t/semana · ${fmt(s2.hongos[t])} kg de hongos` : '';
    ET.dj.innerHTML = `<b><i style="background:#9aa1a6"></i>Al relleno Doña Juana</b>${fmt(s2.relleno[t] / 1000, 1)} t/semana · ${fmtK(s2.km[t])} km de camión`;
    const pctTr = Math.round(kTr * 100), cTr = colorTr(kTr).getStyle();
    ET.via.innerHTML = `<b><i style="background:${cTr}"></i>Av. Ciudad de Cali · tráfico ${nivelTr(kTr)}</b>${e === 'A' ? 'como hoy: todo el abastecimiento pasa hacia Corabastos' : `<em>${pctTr} % de los vehículos de hoy</em> (−${100 - pctTr} %)`}`;
    // «lo que ves en el mapa»: cada cosa que cambia, con su color, su número y un botón para ir
    { const nH = ab ? ab.abiertas : (e === 'A' ? 0 : null), COLE = { A: '#8fb0c9', B: '#b07aa1', C: '#e2a55b' }, NE = { A: 'Kennedy hoy', B: 'Nodo central', C: 'Clúster rotativo' };
      $('[data-mapa]').innerHTML = `<h5 style="--c:${COLE[e]}">Lo que ves en el mapa<span>${e} · ${NE[e]}</span></h5>
      <button type="button" data-ir="trafico"><i class="sw b" style="height:${(4 + 6 * kTr).toFixed(0)}px;background:${cTr}"></i><span>Franja sobre la <b>Av. Ciudad de Cali</b>: tráfico <b>${nivelTr(kTr)}</b> · ${e === 'A' ? '100 % (hoy)' : `${pctTr} % del de hoy`}</span></button>
      <button type="button" data-ir="huertas"><i class="sw p" style="background:#6fcf6a"></i><span>${e === 'A' ? '<b>Sin huertas nuevas</b>: solo las que ya hay en casas' : `Puntos verdes: <b>${nH != null ? fmt(nH) : '…'} huertas abiertas</b> · ${fmt(s1.act[t])} hogares`}</span></button>
      <button type="button" data-ir="compost"><i class="sw p" style="background:${e === 'A' ? '#9aa1a6' : '#b8875a'}"></i><span>${e === 'A' ? `<b>Sin compostaje</b>: ${fmt(s2.relleno[t] / 1000, 1)} t/semana van en camión a Doña Juana` : e === 'B' ? `Círculos café: <b>${EST.length} estaciones de compost</b> de barrio · ${fmt(s2.pct[t], 0)} % vuelve a la tierra` : `Círculo café: <b>1 planta de compost</b> en Bavaria · ${fmt(s2.pct[t], 0)} % vuelve a la tierra`}</span></button>
      <button type="button" data-ir="humedal"><i class="sw p" style="background:#7fb3d5"></i><span>Pájaros en el humedal El Burro: <b>${fmt(s3.aves[t])} aves</b>${e === 'A' ? '' : ` (${s3.aves[t] >= s3A.aves[t] ? '+' : '−'}${fmt(Math.abs(s3.aves[t] - s3A.aves[t]))} frente a hoy)`}</span></button>`; }
    // panel
    $('[data-t]').value = t; $('[data-año]').innerHTML = `${2026 + año}<span class="yr">año ${año} de 10</span>`;
    const d = (v, a, menos, f2) => { if (e === 'A' || !isFinite(a) || Math.abs(v - a) < 1e-9) return ''; const mej = menos ? v < a : v > a; return ` · <em style="color:${mej ? '#8fd18a' : '#ff8a80'}">${v >= a ? '+' : '−'}${f2(Math.abs(v - a))} frente a hoy</em>`; };
    const sA2 = R.S2.A;
    $('[data-kpi]').innerHTML = [
      ['Hogares con huerta', fmt(s1.act[t]), `huertas abiertas en el mapa${ab ? `: ${ab.abiertas} de ${ab.total}` : ''}${d(s1.act[t], A.act[t], false, fmt)}`],
      ['Personas que comen de las huertas', fmtK(s1.pers[t]), `${fmt(s1.pct[t], 1)} % de Kennedy${d(s1.pers[t], A.pers[t], false, fmtK)}`],
      ['Dependencia de Corabastos', fmt(dep * 100) + ' %', `menos tráfico en la Av. Ciudad de Cali${d(dep * 100, A.dep[t] * 100, true, (v) => fmt(v) + ' pts')}`],
      ['Orgánicos que vuelven a la tierra', fmt(s2.pct[t], 1) + ' %', `${fmt(s2.relleno[t] / 1000, 1)} t/semana siguen al relleno${d(s2.pct[t], sA2.pct[t], false, (v) => fmt(v, 1) + ' pts')}`],
      ['Aves en el borde del humedal', fmt(s3.aves[t]), `integridad del humedal ${fmt(hum * 100)} %${d(s3.aves[t], s3A.aves[t], false, fmt)}`]
    ].map(([n, v, s2], i) => `<li><span>${n}</span><strong>${v}</strong><small>${s2}</small><button type="button" data-ir="${['huertas', 'huertas', 'trafico', 'compost', 'humedal'][i]}">Ver en el mapa →</button></li>`).join('');
    el.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.e === e)));
  }

  /* ---------------- eventos ---------------- */
  let play = 0, prev = 0;
  const parar = () => { if (play) cancelAnimationFrame(play); play = 0; $('[data-play]').textContent = '▶'; };
  const paso = (now) => { const dt = Math.min(0.1, (now - prev) / 1000); prev = now; SIMST.t = Math.min(SEM - 1, SIMST.t + dt * 22); aplicar(); if (SIMST.t >= SEM - 1) { parar(); return; } play = requestAnimationFrame(paso); };
  const arrancar = () => { if (RMQ) { SIMST.t = SEM - 1; aplicar(); return; } if (SIMST.t >= SEM - 1) SIMST.t = 0; prev = performance.now(); $('[data-play]').textContent = '❚❚'; play = requestAnimationFrame(paso); };
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.ir) { LUGAR[b.dataset.ir].ir(); return; }
    if (b.dataset.guia !== undefined) { import('./guia.js?v=2').then(m => m.abrirGuia(true)); return; }
    if (b.dataset.min !== undefined) { el.classList.toggle('min'); b.textContent = el.classList.contains('min') ? '+' : '–'; return; }
    if (b.dataset.play !== undefined) { play ? parar() : arrancar(); return; }
    if (b.dataset.tab !== undefined) { const t = document.getElementById('b-tablero'); if (t) t.click(); return; }
    if (b.dataset.e) { const e = b.dataset.e; setTimeout(vistaGeneral, 250); if (e === 'A') { if (T3.escenario === 'proyecto') document.querySelector('.sw button[data-e="hoy"]')?.click(); }
      else { SIMST.esc = e; avisar('mapa'); if (T3.escenario !== 'proyecto') document.querySelector('.sw button[data-e="proyecto"]')?.click(); }
      SIMST.t = 0; aplicar(); arrancar(); }
  });
  el.addEventListener('input', (ev) => { const i = ev.target;
    if (i.dataset.t !== undefined) { parar(); SIMST.t = +i.value; aplicar(); return; }
    if (i.dataset.k) { const P = i.dataset.g === '1' ? P1 : i.dataset.g === '2' ? P2 : P3; P[i.dataset.k] = +i.value; const o = el.querySelector(`output[data-o="${i.dataset.k}"]`); if (o) o.textContent = (FMT[i.dataset.k] || fmt)(+i.value); R = correrTodo(); aplicar(); avisar('mapa');
      const lab = i.closest('label').firstChild.textContent.trim(); GRUPO[i.dataset.g].forEach((l, j) => { if (!j) avisar2(`Cambiaste «${lab}»`, i.dataset.g === '1' && /zona|regional|reac|precio/.test(i.dataset.k) ? 'trafico' : l); }); }
  });
  el.addEventListener('change', (ev) => { const i = ev.target;
    if (i.dataset.b) { P1[i.dataset.b] = i.checked; R = correrTodo(); aplicar(); avisar('mapa'); avisar2(i.checked ? 'Activaste un estrés' : 'Quitaste un estrés', 'huertas'); }
    if (i.dataset.anti !== undefined) { P3.anti = i.checked; R = correrTodo(); aplicar(); avisar('mapa'); avisar2(i.checked ? 'Con medida antitrampa' : 'Sin medida antitrampa', 'humedal'); } });
  addEventListener('sim-cambio', (ev) => { if (ev.detail && ev.detail.origen === 'mapa') return; R = correrTodo(); el.querySelectorAll('input[data-k]').forEach(i => { const P = i.dataset.g === '1' ? P1 : i.dataset.g === '2' ? P2 : P3; i.value = P[i.dataset.k]; }); aplicar(); });
  addEventListener('escenario', () => setTimeout(() => { SIMST.t = 0; ultHB = -1; aplicar(); arrancar(); }, 60));
  // la huerta de barrio carga después: se aplica cuando aparece
  const espera = setInterval(() => { if (window.KEN_HBAR && window.KEN_HBAR.fraccion) { clearInterval(espera); ultHB = -1; aplicar(); } }, 800);

  /* ---------------- cuadro: partículas y etiquetas ---------------- */
  const V = new THREE.Vector3();
  function cuadro(now) {
    requestAnimationFrame(cuadro);
    const tt = RMQ ? 0 : now / 1000, e = esc();
    for (let i = 0; i < NP; i++) { const p = PART[i]; if (!p.on || !EST.length) { PP[i * 3 + 1] = -999; continue; }
      const rutas = RUTAS[p.r], cv = rutas[p.k % rutas.length]; const v = p.r === 'rell' ? 0.05 : 0.11; cv.getPoint((p.f + tt * v) % 1, V); PP[i * 3] = V.x; PP[i * 3 + 1] = V.y; PP[i * 3 + 2] = V.z; }
    gp.attributes.position.needsUpdate = true;
    { const y = T3.camera.position.y, lejos = Math.max(0, Math.min(1, (y - 120) / 260)), solo = T3.escSolo && T3.escSolo(); UM.uA.value = solo === 'bav' || solo === 'col' ? 0 : lejos; const lejos2 = Math.max(0, Math.min(1, (y - 70) / 200)), libre = !solo || solo === 'red';
      if (banda) { UB.uA.value = libre ? 0.25 + 0.75 * lejos2 : 0; UB.uW.value = Math.max(6, Math.min(60, y * 0.009)) * (0.2 + 1.1 * kTr); banda.visible = UB.uA.value > 0.01 && y > 45; }
      UC.uA.value = libre ? Math.max(0.4, lejos2) : 0; UC.uR.value = Math.min(2, devicePixelRatio || 1);
      { const ae = document.getElementById('alivio-et'); if (ae) ae.style.display = 'none'; const KC = window.KEN_CALI; if (KC && KC.cinta) KC.cinta.visible = false; } /* la franja y la etiqueta de aqui reemplazan las de alivio_cali.js */ UM.uPx.value = innerHeight * Math.min(2, devicePixelRatio || 1);
      if (via) { via.visible = !solo && lejos > 0.05; via.material.opacity = 0.9 * lejos; } }
    const cam = T3.camera, W = innerWidth, H = innerHeight;
    for (const k in ET) { const d = ET[k]; if (!d.innerHTML || (k === 'comp' && e === 'A') || document.body.classList.contains('tb-abierto') || (T3.escSolo && T3.escSolo()) || cam.position.y < 140) { d.style.display = 'none'; continue; }
      const p = POS[k](); V.set(p[0], p[1], p[2]).project(cam); const ok = V.z < 1 && Math.abs(V.x) < 0.92 && Math.abs(V.y) < 0.9; d.style.display = ok ? 'block' : 'none';
      if (ok) d.style.transform = `translate(${((V.x + 1) / 2 * W).toFixed(1)}px,${((1 - V.y) / 2 * H).toFixed(1)}px) translate(-50%,-110%)`; }
  }
  requestAnimationFrame(cuadro);
  aplicar();
  setTimeout(() => import('./guia.js?v=2').then(m => m.abrirGuia(false)).catch(() => {}), 2500); // la primera vez: cómo se usa
  import('./mejora_tour.js?v=3').then(m => { T3.mejora = m.iniciarMejoraTour({ T3 }); }).catch(e => console.warn('recorrido:', e)); // «¿Cómo mejora Kennedy?»: antes y después en cada lugar
  import('./capas_escenario.js?v=3').then(m => m.iniciarCapasEscenario({ T3 })).catch(e => console.warn('capas:', e)); // sintaxis, ruido, usos e indicadores cambian con la propuesta
  return { aplicar, arrancar, get R() { return R; }, get via() { return via; }, marcas, mO };
}
