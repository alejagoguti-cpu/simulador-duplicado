// Construye el interior como geometria solida con materiales PBR, luz solar,
// luminarias, sombras, cielo exterior y detalles (zocalos, marcos, reflejos).
// Sustituye el muestreo de puntos de la version anterior.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { crearLetrero } from './texturas.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);

export function construirEscena({ E0, C, M, EQ, R, T, materiales, MOV }) {
  RectAreaLightUniformsLib.init();
  const S = new THREE.Scene();
  S.fog = new THREE.FogExp2(0xc9c1ad, 0.0034);

  const pmrem = new THREE.PMREMGenerator(R);
  pmrem.compileEquirectangularShader();
  const envTex = T.cielo.clone();
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.needsUpdate = true;
  S.environment = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();

  const mat = (k) => materiales.deColor(k);
  const grupos = new Map();
  const push = (g, m, su = 1, sv = 1) => {
    if (!g.attributes.uv) return;
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    let a = grupos.get(m); if (!a) { a = []; grupos.set(m, a); }
    a.push(g);
  };
  const caja = (x, y, z, w, h, d, k, ry = 0, uv = true) => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    push(g, mat(k), uv ? Math.max(w, d) / 1.7 : 1, uv ? Math.max(h, d) / 1.7 : 1);
  };
  const cil = (x, y, z, r, h, k, seg = 20) => {
    const g = new THREE.CylinderGeometry(r, r, h, seg);
    g.translate(x, y, z);
    push(g, mat(k), 1, Math.max(1, h / 1.5));
  };
  const plano = (x, y, z, w, d, k, rotX = -Math.PI / 2, su = w / 4, sv = d / 4) => {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(rotX); g.translate(x, y, z);
    push(g, mat(k), su, sv);
  };

  const { L, W, H } = E0;
  const ALTO_MURO = H;
  const ven = [];

  /* ---------- cascaron ---------- */
  if (E0.silo) {
    const rE = L / 2, rI = rE - 0.08;
    const aceroD = mat('acero').clone(); aceroD.side = THREE.DoubleSide;
    const grisD = mat('gris').clone(); grisD.side = THREE.DoubleSide;
    const TAU = Math.PI * 2;
    const PUERTA = 0.62;                 // hueco de entrada, centrado en +z
    const MIRADOR = 1.6;                 // hueco del mirador, centrado en -x/-z
    const thMira = Math.PI * 1.25;
    const gajo = (r, y0, y1, th0, thL) => {
      const g = new THREE.CylinderGeometry(r, r, y1 - y0, 64, 1, true, th0, thL);
      g.translate(0, (y0 + y1) / 2, 0);
      return g;
    };
    const tramos = [
      [0, 2.5, PUERTA / 2, TAU - PUERTA],
      [2.5, H - 2.2, 0, TAU],
      [H - 2.2, H, thMira + MIRADOR / 2, TAU - MIRADOR]
    ];
    for (const [y0, y1, th0, thL] of tramos) {
      push(gajo(rE, y0, y1, th0, thL), aceroD, 6, (y1 - y0) / 2);
      push(gajo(rI, y0, y1, th0, thL), grisD, 6, (y1 - y0) / 2);
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < PUERTA / 2 + 0.12) continue;
      caja(Math.sin(a) * (rE + 0.02), H / 2, Math.cos(a) * (rE + 0.02), 0.1, H, 0.14, 'gris', -a, false);
    }
    const circ = (y, k, arriba) => {
      const g = new THREE.CircleGeometry(rI - 0.01, 64);
      g.rotateX(arriba ? -Math.PI / 2 : Math.PI / 2);
      g.translate(0, y, 0);
      push(g, mat(k), rE / 2, rE / 2);
    };
    circ(0.02, 'pisoC', true);
    circ(H - 0.02, 'techo', false);
    caja(0, 0.055, rE + 0.28, 2.3, 0.11, 0.7, 'pisoC');
  } else {
    plano(0, 0.012, 0, L, W, E0.malla ? 'tierra' : 'piso', -Math.PI / 2, L / 4, W / 4);
    plano(0, H - 0.02, 0, L, W, E0.malla ? 'policarbonato' : 'techo', Math.PI / 2, L / 4, W / 4);

    const grosor = 0.16;
    const muro = (x, z, w, rot, { puerta = false, ventanas = true } = {}) => {
      const nx0 = -x, nz0 = -z, nl = Math.hypot(nx0, nz0) || 1;
      const ux = nx0 / nl, uz = nz0 / nl;          // normal hacia el interior
      const zoff = grosor / 2 + 0.012;
      const zoc = (cx, cz, cw) => caja(cx + ux * zoff, 0.07, cz + uz * zoff, cw, 0.14, 0.03, 'negro', rot, false);
      let n = Math.max(1, Math.round(w / 3.2));
      if (puerta && n % 2 === 0) n += 1;           // el vano queda centrado
      const sw = w / n, mid = Math.floor(n / 2);
      for (let i = 0; i < n; i++) {
        const lx = -w / 2 + sw * (i + 0.5);
        const wx = x + Math.cos(rot) * lx, wz = z - Math.sin(rot) * lx;
        if (puerta && i === mid) {
          const ancho = 1.9;
          const lado = (sw - ancho) / 2;
          if (lado > 0.02) {
            caja(wx - Math.cos(rot) * (ancho / 2 + lado / 2), ALTO_MURO / 2, wz + Math.sin(rot) * (ancho / 2 + lado / 2), lado, ALTO_MURO, grosor, 'muro', rot);
            caja(wx + Math.cos(rot) * (ancho / 2 + lado / 2), ALTO_MURO / 2, wz - Math.sin(rot) * (ancho / 2 + lado / 2), lado, ALTO_MURO, grosor, 'muro', rot);
          }
          caja(wx, (2.5 + ALTO_MURO) / 2, wz, sw, ALTO_MURO - 2.5, grosor, 'muro', rot);
          // marco con profundidad y sombra
          for (const s of [-1, 1]) caja(wx + Math.cos(rot) * s * 0.98, 1.25, wz - Math.sin(rot) * s * 0.98, 0.1, 2.5, 0.3, 'gris', rot, false);
          caja(wx, 2.52, wz, ancho + 0.2, 0.1, 0.3, 'gris', rot, false);
          // hoja abierta contra el muro interior, fuera del eje de la mirada
          const hinge = new THREE.Matrix4().makeRotationY(2.55).setPosition(wx - 0.86, 0, wz - 0.1);
          const hoja = (cx, cy, cz, bw, bh, bd, k) => {
            const g = new THREE.BoxGeometry(bw, bh, bd); g.translate(cx, cy, cz); g.applyMatrix4(hinge);
            push(g, mat(k), Math.max(bw, bd) / 1.2, Math.max(bh, bd) / 1.2);
          };
          hoja(0.44, 1.22, 0, 0.88, 2.38, 0.035, 'vidrio');
          hoja(0.02, 1.22, 0, 0.06, 2.42, 0.06, 'gris');
          hoja(0.86, 1.22, 0, 0.06, 2.42, 0.06, 'gris');
          hoja(0.44, 0.02, 0, 0.94, 0.06, 0.06, 'gris');
          hoja(0.44, 2.42, 0, 0.94, 0.06, 0.06, 'gris');
          const man = new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8);
          man.rotateX(Math.PI / 2); man.translate(0.74, 1.08, 0.05); man.applyMatrix4(hinge);
          push(man, mat('acero'), 1, 1);
          // umbral y felpudo
          caja(wx, 0.03, wz + 0.25, ancho, 0.03, 0.5, 'pisoC', rot);
          caja(wx, 0.045, wz + 0.62, 1.5, 0.015, 0.9, 'negro', rot, false);
          continue;
        }
        if (ventanas && i % 2 === 0) {
          caja(wx, 0.48, wz, sw, 0.96, grosor, 'muro', rot);
          caja(wx, (2.6 + ALTO_MURO) / 2, wz, sw, ALTO_MURO - 2.6, grosor, 'muro', rot);
          caja(wx, 1.78, wz, sw - 0.16, 1.6, 0.035, 'vidrio', rot, false);
          ven.push({ x: wx, z: wz, rot, w: sw });
          const g2 = 0.075;
          for (const s of [-1, 1]) caja(wx + Math.cos(rot) * s * (sw / 2 - 0.08), 1.78, wz - Math.sin(rot) * s * (sw / 2 - 0.08), g2, 1.74, 0.22, 'negro', rot, false);
          caja(wx, 0.98, wz, sw - 0.1, g2, 0.22, 'negro', rot, false);
          caja(wx, 2.58, wz, sw - 0.1, g2, 0.22, 'negro', rot, false);
          caja(wx, 1.78, wz, 0.045, 1.6, 0.22, 'negro', rot, false);
          // alfeizar interior y exterior, con vuelo
          caja(wx + ux * 0.12, 0.92, wz + uz * 0.12, sw + 0.08, 0.055, 0.38, 'pisoC', rot);
          caja(wx - ux * 0.14, 0.95, wz - uz * 0.14, sw + 0.1, 0.075, 0.36, 'pisoC', rot);
        } else {
          caja(wx, ALTO_MURO / 2, wz, sw, ALTO_MURO, grosor, 'muro', rot);
        }
      }
      if (puerta) {
        const seg = (w / 2 - 1.05);
        if (seg > 0.1) {
          const off = w / 2 - seg / 2;
          zoc(x + Math.cos(rot) * -off, z + Math.sin(rot) * off, seg);
          zoc(x + Math.cos(rot) * off, z - Math.sin(rot) * off, seg);
        }
      } else zoc(x, z, w - 0.2);
    };

    if (E0.malla) {
      const bajo = (x, z, w, rot) => {
        caja(x, 0.28, z, w, 0.56, 0.18, 'pisoC', rot);
        caja(x, (0.56 + H) / 2, z, w, H - 0.56, 0.03, 'policarbonato', rot, false);
      };
      bajo(0, -W / 2, L, 0); bajo(0, W / 2, L, 0); bajo(-L / 2, 0, W, Math.PI / 2); bajo(L / 2, 0, W, Math.PI / 2);
      for (let k = 0; k <= 8; k++) {
        const g = new THREE.TorusGeometry(W / 2, 0.045, 6, 24, Math.PI);
        g.rotateY(Math.PI / 2); g.translate(-L / 2 + k * L / 8, H - W / 2, 0);
        push(g, mat('acero'), 3, 1);
      }
      for (let k = 0; k <= 8; k++) caja(-L / 2 + k * L / 8, H / 2, -W / 2, 0.09, H, 0.12, 'acero', 0, false);
      for (let k = 0; k <= 8; k++) caja(-L / 2 + k * L / 8, H / 2, W / 2, 0.09, H, 0.12, 'acero', 0, false);
    } else {
      muro(0, -W / 2, L, 0, { ventanas: true });
      muro(0, W / 2, L, 0, { ventanas: true, puerta: true });
      muro(-L / 2, 0, W, Math.PI / 2, { ventanas: true });
      muro(L / 2, 0, W, Math.PI / 2, { ventanas: true });

      // remate de cubierta y zócalo exterior
      caja(0, H + 0.05, -W / 2, L + 0.24, 0.14, 0.34, 'gris');
      caja(0, H + 0.05, W / 2, L + 0.24, 0.14, 0.34, 'gris');
      caja(-L / 2, H + 0.05, 0, 0.34, 0.14, W, 'gris');
      caja(L / 2, H + 0.05, 0, 0.34, 0.14, W, 'gris');
      const pl = 0.24;
      caja(0, pl / 2, -W / 2 - 0.012, L, pl, 0.05, 'negro');
      caja(-L / 2 - 0.012, pl / 2, 0, 0.05, pl, W, 'negro');
      caja(L / 2 + 0.012, pl / 2, 0, 0.05, pl, W, 'negro');
      const segZ = (L - 2.0) / 2;
      if (segZ > 0.1) {
        caja(-(1.0 + segZ / 2), pl / 2, W / 2 + 0.012, segZ, pl, 0.05, 'negro');
        caja(1.0 + segZ / 2, pl / 2, W / 2 + 0.012, segZ, pl, 0.05, 'negro');
      }
      // canalones y bajantes en las esquinas
      for (const s of [-1, 1]) {
        cil(s * (L / 2 - 0.12), H / 2, W / 2 + 0.14, 0.045, H, 'gris', 10);
        caja(s * (L / 2 - 0.12), 0.16, W / 2 + 0.22, 0.09, 0.32, 0.09, 'gris');
      }
      // junta horizontal de fachada a la altura de los alféizares
      caja(0, 0.96, W / 2 + 0.006, L - 0.2, 0.012, 0.012, 'gris', 0, false);
      caja(0, 2.62, W / 2 + 0.006, L - 0.2, 0.012, 0.012, 'gris', 0, false);
    }

    if (!E0.malla) {
      const luces = [];
      for (const x of [-L / 2 + 2.5, L / 2 - 2.5]) {
        for (const z of [-W / 2 + 1.9, W / 2 - 1.9]) luces.push([x, z]);
      }
      S.userData.luces = luces;
    }
  }

  /* ---------- equipos (los mismos del programa) ---------- */
  const G = [];
  E0.arma(G, EQ);
  for (const p of G) {
    if (p.t === 'b') caja(p.x, p.y, p.z, p.w, p.h, p.d, p.c, p.ry);
    else cil(p.x, p.y, p.z, p.r, p.h, p.c, 18);
  }
  // detalles de mobiliario: zócalo, junta de puerta y tirador en los cuerpos
  // que apoyan en el suelo, para que no lean como cajas blancas
  const cuerpos = ['blanco', 'inox', 'gris', 'madera', 'maderaC', 'negro', 'acero'];
  for (const p of G) {
    if (p.t !== 'b' || p.h < 0.6 || p.w < 0.45 || p.d < 0.35) continue;
    if (!cuerpos.includes(p.c)) continue;
    const minY = p.y - p.h / 2;
    if (minY > 0.12) continue;
    const ry = p.ry || 0;
    const cs = Math.cos(ry), sn = Math.sin(ry);
    const at = (lx, lz) => [p.x + cs * lx + sn * lz, p.z - sn * lx + cs * lz];
    const [fx, fz] = at(0, p.d / 2 + 0.004);
    caja(fx, minY + 0.045, fz, p.w * 0.97, 0.07, 0.005, 'negro', ry, false);
    caja(fx, p.y + p.h * 0.16, fz, p.w * 0.92, 0.008, 0.005, 'gris', ry, false);
    if (p.h > 0.55) caja(fx, p.y, fz, 0.011, p.h * 0.62, 0.005, 'gris', ry, false);
    if (p.h > 1.15) {
      const [hx, hz] = at(0, p.d / 2 + 0.028);
      caja(hx, p.y + p.h * 0.14, hz, 0.018, 0.26, 0.018, 'acero', ry, false);
    } else if (p.h > 0.6) {
      for (const s of [-1, 1]) {
        const [hx, hz] = at(s * p.w * 0.22, p.d / 2 + 0.018);
        caja(hx, p.y + p.h * 0.2, hz, 0.12, 0.015, 0.014, 'acero', ry, false);
      }
    }
    if (p.h > 1.4 && p.w > 0.5 && p.c !== 'negro') {
      const [sx, sz] = at(p.w * 0.22, p.d / 2 + 0.012);
      caja(sx, p.y + p.h * 0.3, sz, 0.14, 0.09, 0.008, 'pantalla', ry, false);
    }
  }
  // interiores de vitrinas y campanas: fondo oscuro y entrepaño
  for (const p of G) {
    if (p.t !== 'b' || p.c !== 'vidrio' || p.h < 0.3 || p.w < 0.4 || p.d < 0.3) continue;
    const ry = p.ry || 0, cs = Math.cos(ry), sn = Math.sin(ry);
    const at = (lx, lz) => [p.x + cs * lx + sn * lz, p.z - sn * lx + cs * lz];
    const [ax, az] = at(0, -p.d / 2 + 0.02);
    const [bx, bz] = at(0, p.d / 2 - 0.02);
    const fuera = ax * ax + az * az > bx * bx + bz * bz;
    caja(fuera ? ax : bx, p.y, fuera ? az : bz, p.w * 0.96, p.h * 0.92, 0.02, 'gris', ry, false);
    const [sx, sz] = at(0, 0);
    caja(sx, p.y - p.h * 0.12, sz, p.w * 0.9, 0.018, p.d * 0.82, 'acero', ry, false);
  }

  /* ---------- exterior ---------- */
  T.cesped.repeat.set(64, 64);
  T.cespedN.repeat.set(64, 64);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat('cesped'));
  suelo.rotation.x = -Math.PI / 2; suelo.position.y = -0.03; suelo.receiveShadow = true;
  S.add(suelo);

  if (!E0.silo) {
    // plaza de pavimento con borde y junta
    const anchoPlaza = Math.min(7.2, L + 1.4);
    const largoPlaza = Math.max(6.6, W * 1.15 + 3.2);
    const zPlaza = W / 2 + largoPlaza / 2 - 0.2;
    const plazaGeo = new THREE.BoxGeometry(anchoPlaza, 0.08, largoPlaza);
    const puv = plazaGeo.attributes.uv;
    for (let i = 0; i < puv.count; i++) puv.setXY(i, puv.getX(i) * (anchoPlaza / 4.8), puv.getY(i) * (largoPlaza / 4.8));
    const plaza = new THREE.Mesh(plazaGeo, mat('pavimento'));
    plaza.position.set(0, 0.01, zPlaza); plaza.receiveShadow = true;
    S.add(plaza);
    // borde de hormigon
    const b = 0.14;
    for (const [x, z, w, d] of [
      [0, zPlaza + largoPlaza / 2 + b / 2, anchoPlaza + b * 2, b],
      [0, zPlaza - largoPlaza / 2 - b / 2, anchoPlaza + b * 2, b],
      [-anchoPlaza / 2 - b / 2, zPlaza, b, largoPlaza],
      [anchoPlaza / 2 + b / 2, zPlaza, b, largoPlaza]
    ]) caja(x, 0.055, z, w, 0.11, d, 'pisoC');

    // franja de grava contra la fachada, con perfil de acero
    const grava = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.6, 0.62), mat('grava'));
    grava.rotation.x = -Math.PI / 2; grava.position.set(0, 0.03, W / 2 + 0.45); grava.receiveShadow = true;
    S.add(grava);
    for (const s of [-1, 1]) caja(0, 0.06, W / 2 + 0.45 + s * 0.33, L - 0.55, 0.08, 0.035, 'acero');

    if (!E0.malla) {
      // pórtico de entrada: losa, pilares, rótulo y jardineras
      const zc = W / 2 + 0.95;
      caja(0, 2.98, zc, 4.7, 0.14, 1.9, 'gris');
      caja(0, 3.06, zc, 4.7, 0.04, 1.9, 'negro');
      caja(0, 2.9, zc, 4.3, 0.02, 1.65, 'pisoC');
      for (const s of [-1, 1]) caja(s * 2.2, 1.48, W / 2 + 1.78, 0.1, 2.96, 0.1, 'acero');
      // rótulo colgante con fondo, marco y separadores
      caja(0, 2.68, W / 2 + 1.84, 3.6, 0.54, 0.07, 'negro');
      const letreroTex = crearLetrero(E0.n, E0.c);
      const letreroMat = new THREE.MeshStandardMaterial({
        map: letreroTex, roughness: 0.42, metalness: 0.15,
        emissive: 0xffffff, emissiveMap: letreroTex, emissiveIntensity: 0.24
      });
      const letrero = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.525), letreroMat);
      letrero.position.set(0, 2.68, W / 2 + 1.885);
      S.add(letrero);
      for (const s of [-1, 1]) for (const y of [2.86, 2.5]) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.06, 8), mat('acero'));
        st.rotation.x = Math.PI / 2; st.position.set(s * 1.55, y, W / 2 + 1.87); S.add(st);
      }
      // downlights bajo el pórtico
      for (const s of [-1, 0, 1]) {
        const d = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 12), mat('luz'));
        d.position.set(s * 1.45, 2.9, W / 2 + 1.0); S.add(d);
      }
      const aplique = new THREE.PointLight(0xffd2a0, 5.2, 4.8, 2);
      aplique.position.set(0, 2.62, W / 2 + 1.05);
      S.add(aplique);
      // umbral, felpudo y luminarias de fachada
      caja(0, 0.055, W / 2 + 0.28, 2.2, 0.11, 0.56, 'pisoC');
      for (const s of [-1, 1]) {
        caja(s * 1.28, 2.28, W / 2 + 0.12, 0.14, 0.22, 0.12, 'negro');
        caja(s * 1.28, 2.23, W / 2 + 0.18, 0.1, 0.06, 0.02, 'luz');
        const pl = new THREE.PointLight(0xffd9a8, 2.2, 3.2, 2);
        pl.position.set(s * 1.28, 2.2, W / 2 + 0.42); S.add(pl);
      }
      // jardineras de hormigón con matas
      const px = Math.max(2.4, Math.min(L / 2 - 0.9, 4.1));
      for (const s of [-1, 1]) {
        caja(s * px, 0.28, W / 2 + 0.95, 1.2, 0.56, 0.72, 'pisoC');
        caja(s * px, 0.56, W / 2 + 0.95, 1.02, 0.04, 0.56, 'tierra');
      }
      // banco de hormigón y madera al lado de la plaza
      const bx = anchoPlaza / 2 + 1.2;
      caja(bx, 0.24, W / 2 + 3.4, 1.8, 0.12, 0.5, 'pisoC', Math.PI / 2);
      for (let k = 0; k < 4; k++) caja(bx, 0.34, W / 2 + 3.0 + k * 0.16, 1.75, 0.05, 0.12, 'madera', Math.PI / 2);
      for (const s of [-1, 1]) caja(bx + s * 0.72, 0.15, W / 2 + 3.4, 0.12, 0.3, 0.44, 'gris', Math.PI / 2);
      // bolardos
      for (const s of [-1, 0, 1]) {
        cil(s * 2.5, 0.44, W / 2 + largoPlaza - 0.5, 0.07, 0.88, 'negro', 12);
        cil(s * 2.5, 0.9, W / 2 + largoPlaza - 0.5, 0.075, 0.05, 'luz', 12);
      }
    }
  }

  // cielo: esfera invertida con horizonte, sol y arboles lejanos
  const skyMap = T.cielo.clone();
  skyMap.mapping = THREE.UVMapping;
  skyMap.needsUpdate = true;
  const cielo = new THREE.Mesh(
    new THREE.SphereGeometry(160, 64, 32),
    new THREE.MeshBasicMaterial({ map: skyMap, side: THREE.BackSide, fog: false, toneMapped: false })
  );
  S.add(cielo);

  /* ---------- arboles y vegetacion ---------- */
  if (!E0.silo) {
    const troncos = [];
    const rama = (x, y, z, r0, r1, h, rx, rz) => {
      const g = new THREE.CylinderGeometry(r1, r0, h, 7);
      g.translate(0, h / 2, 0);
      const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, 0, rz));
      g.applyMatrix4(m);
      g.translate(x, y, z);
      troncos.push(g);
    };
    const arboles = [
      [-L / 2 - 5.5, W / 2 + 3.2, 1.35],
      [L / 2 + 6.5, W / 2 + 2.4, 1.15],
      [-L / 2 - 8.5, -W / 2 - 4.5, 1.2],
      [L / 2 + 9, -W / 2 + 1.5, 1.3],
      [-L / 2 - 14, W / 2 + 8.5, 1.05],
      [L / 2 + 15, W / 2 + 9.5, 1.2],
      [-L / 2 - 16, -W / 2 - 9, 1.0]
    ];
    for (const [x, z, s] of arboles) {
      rama(x, 0, z, 0.2 * s, 0.14 * s, 3.3 * s, 0, 0);
      for (let k = 0; k < 3; k++) {
        const a = rnd(0, Math.PI * 2);
        rama(x, 2.3 * s, z, 0.09 * s, 0.05 * s, 1.7 * s, rnd(-0.5, 0.5), Math.cos(a) * rnd(0.4, 0.8));
      }
    }
    const tg = mergeGeometries(troncos, false);
    if (tg) {
      const tm = new THREE.Mesh(tg, mat('tronco'));
      tm.castShadow = true; tm.receiveShadow = true; S.add(tm);
      troncos.forEach((g) => g.dispose());
    }

    // follaje: tarjetas con textura de hojas, instanciadas
    const hojaGeo = new THREE.PlaneGeometry(1.7, 1.7);
    const hojas = [];
    const colores = [0x7d9459, 0x6b844c, 0x8ea268, 0x5e7742, 0x97a973, 0x718a50];
    for (const [x, z, s] of arboles) {
      const cy = 4.5 * s;
      for (let k = 0; k < 165; k++) {
        const a = rnd(0, Math.PI * 2);
        const r = Math.cbrt(Math.random()) * 2.35 * s;
        const yy = cy + rnd(-1.7, 1.8) * s * (1 - 0.28 * (r / (2.35 * s)));
        hojas.push({
          x: x + Math.cos(a) * r,
          y: yy,
          z: z + Math.sin(a) * r * 0.92,
          rx: rnd(-0.7, 0.7),
          ry: a + rnd(-0.8, 0.8),
          rz: rnd(-0.5, 0.5),
          s: rnd(0.6, 1.25) * s,
          c: colores[(Math.random() * colores.length) | 0]
        });
      }
    }
    // plantas de interior en las esquinas del frente
    for (const [px, pz] of [[-L / 2 + 0.55, W / 2 - 0.85], [L / 2 - 0.55, W / 2 - 0.85]]) {
      cil(px, 0.22, pz, 0.2, 0.44, 'gris');
      cil(px, 0.44, pz, 0.17, 0.03, 'tierra');
      for (let k = 0; k < 22; k++) {
        const a = rnd(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 0.32;
        hojas.push({
          x: px + Math.cos(a) * r, y: 0.62 + rnd(0, 0.58), z: pz + Math.sin(a) * r,
          rx: rnd(-0.6, 0.6), ry: rnd(0, Math.PI * 2), rz: rnd(-0.5, 0.5),
          s: rnd(0.3, 0.5), c: colores[(Math.random() * colores.length) | 0]
        });
      }
    }
    // arbustos junto a la entrada y bajo las ventanas
    const arbustos = [];
    for (const s of [-1, 1]) {
      for (let k = 0; k < 22; k++) {
        const a = rnd(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 0.5;
        arbustos.push({
          x: s * Math.max(2.4, Math.min(L / 2 - 0.9, 4.1)) + Math.cos(a) * r,
          y: 0.56 + rnd(0, 0.3),
          z: W / 2 + 0.95 + Math.sin(a) * r,
          rx: rnd(-0.6, 0.6), ry: rnd(0, Math.PI * 2), rz: rnd(-0.4, 0.4),
          s: rnd(0.4, 0.72), c: colores[(Math.random() * colores.length) | 0]
        });
      }
    }
    const todas = hojas.concat(arbustos);
    const im = new THREE.InstancedMesh(hojaGeo, mat('follaje'), todas.length);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    todas.forEach((h, i) => {
      dummy.position.set(h.x, h.y, h.z);
      dummy.rotation.set(h.rx, h.ry, h.rz);
      dummy.scale.setScalar(h.s);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
      im.setColorAt(i, col.setHex(h.c));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
    S.add(im);

    // matas de hierba en los bordes de la plaza y la fachada
    const cruces = [];
    for (let k = 0; k < 3; k++) {
      const g = new THREE.PlaneGeometry(0.46, 0.34);
      g.translate(0, 0.17, 0);
      g.rotateY((k / 3) * Math.PI);
      cruces.push(g);
    }
    const grassGeo = mergeGeometries(cruces, false);
    cruces.forEach((g) => g.dispose());
    const puntos = [];
    const anchoP = Math.min(7.2, L + 1.4);
    const largoP = Math.max(6.6, W * 1.15 + 3.2);
    const zP = W / 2 + largoP / 2 - 0.2;
    const ocupado = (x, z) =>
      (Math.abs(x) < anchoP / 2 + 0.5 && z > zP - largoP / 2 - 0.5 && z < zP + largoP / 2 + 0.6) ||
      (Math.abs(x) < L / 2 + 0.35 && z > -W / 2 - 0.6 && z < W / 2 + 0.7);
    let intentos = 0;
    while (puntos.length < 430 && intentos < 4000) {
      intentos++;
      const lado = Math.random() < 0.7 ? 1 : -1;
      let x, z;
      if (lado > 0) {
        x = rnd(-L / 2 - 5.5, L / 2 + 5.5);
        z = rnd(W / 2 + 0.4, W / 2 + 9.5);
      } else {
        x = (Math.random() < 0.5 ? -1 : 1) * rnd(L / 2 + 0.5, L / 2 + 7.5);
        z = rnd(-W / 2 - 4, W / 2 + 3);
      }
      if (ocupado(x, z)) continue;
      puntos.push({ x, z, s: rnd(0.5, 0.95), ry: rnd(0, Math.PI * 2), c: rnd(0.75, 1.15) });
    }
    const gm = new THREE.InstancedMesh(grassGeo, mat('hierba'), puntos.length);
    puntos.forEach((p, i) => {
      dummy.position.set(p.x, 0.0, p.z);
      dummy.rotation.set(0, p.ry, 0);
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      gm.setMatrixAt(i, dummy.matrix);
      gm.setColorAt(i, col.setRGB(p.c, p.c * 1.02, p.c * 0.86));
    });
    gm.instanceMatrix.needsUpdate = true;
    if (gm.instanceColor) gm.instanceColor.needsUpdate = true;
    gm.receiveShadow = true; gm.frustumCulled = false;
    S.add(gm);
  }

  /* ---------- luces ---------- */
  const sol = new THREE.DirectionalLight(0xffd0a0, 3.3);
  sol.position.set(-L * 1.05, H * 2.3 + 3.2, W * 0.9 + 5.2);
  sol.target.position.set(0, 0.9, 0);
  sol.castShadow = true;
  const md = Math.max(L, W) * 1.05 + 5;
  sol.shadow.mapSize.set(MOV ? 1024 : 2048, MOV ? 1024 : 2048);
  sol.shadow.camera.left = -md; sol.shadow.camera.right = md;
  sol.shadow.camera.top = md; sol.shadow.camera.bottom = -md;
  sol.shadow.camera.near = 0.5; sol.shadow.camera.far = 110;
  sol.shadow.bias = -0.00035; sol.shadow.normalBias = 0.03;
  S.add(sol, sol.target);

  S.add(new THREE.HemisphereLight(0xa8c6e2, 0x6a5a42, 0.58));
  const relleno = new THREE.DirectionalLight(0x9fc2e8, 0.28);
  relleno.position.set(L, H * 1.4, -W);
  S.add(relleno);

  if (!E0.malla) {
    const luces = S.userData.luces || [];
    let n = 0;
    for (const [x, z] of luces) {
      // luminaria lineal suspendida
      caja(x, H - 0.075, z, 0.012, 0.15, 0.012, 'acero', 0, false);
      caja(x, H - 0.16, z, 1.45, 0.07, 0.22, 'negro');
      caja(x, H - 0.2, z, 1.36, 0.018, 0.16, 'luz', 0, false);
      if (n++ < 4) {
        const p = new THREE.PointLight(0xffe0b4, 2.0, 7.6, 2);
        p.position.set(x, H - 0.34, z);
        S.add(p);
      }
    }
    // relleno suave de techo (la cara emisiva mira hacia abajo)
    const ra = new THREE.RectAreaLight(0xffe6c4, 2.6, Math.min(6.4, W * 0.92), Math.min(5.6, L * 0.62));
    ra.position.set(0, H - 0.1, 0);
    ra.rotation.x = Math.PI / 2;
    S.add(ra);
    // luz de acento con sombra sobre la mesa central
    const sp = new THREE.SpotLight(0xffd7a8, 11, 9, 0.95, 0.85, 2);
    sp.position.set(0, H - 0.2, 0.4);
    sp.target.position.set(0, 0.8, 0.2);
    sp.castShadow = !MOV;
    sp.shadow.mapSize.set(MOV ? 512 : 1024, MOV ? 512 : 1024);
    sp.shadow.bias = -0.0004;
    S.add(sp, sp.target);
    // luz cálida de la puerta
    const pd = new THREE.PointLight(0xffd7a8, 2.4, 4.2, 2);
    pd.position.set(0, 2.55, W / 2 - 0.45);
    S.add(pd);
  } else {
    for (let k = 0; k < 4; k++) {
      const p = new THREE.PointLight(0xfff2d8, 6, 12, 2);
      p.position.set(-L / 2 + 2 + k * (L - 4) / 3, H - 0.6, 0);
      S.add(p);
    }
  }
  if (E0.silo) {
    for (let y = 2.6; y < H; y += 4.2) {
      const p = new THREE.PointLight(0xffe6c4, 7, 9, 2);
      p.position.set(0, y, 0);
      S.add(p);
    }
  }

  /* ---------- sombras de contacto ---------- */
  const matSombra = new THREE.MeshBasicMaterial({ map: T.sombra, transparent: true, opacity: 0.4, depthWrite: false });
  let ns = 0;
  for (const p of G) {
    if (p.t !== 'b' || p.y > 1.4 || p.w * p.d < 0.9 || ns > 34) continue;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w * 1.45, p.d * 1.45), matSombra);
    m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.03 + ns * 0.0004, p.z);
    S.add(m); ns++;
  }

  /* ---------- haces de sol por las ventanas ---------- */
  if (!E0.silo && !E0.malla) {
    const dir = sol.position.clone().negate().normalize();
    const matHaz = new THREE.MeshBasicMaterial({
      map: T.haz, transparent: true, opacity: 0.2,
      blending: THREE.AdditiveBlending, depthWrite: false,
      side: THREE.DoubleSide, fog: false, toneMapped: false
    });
    let nh = 0;
    const frente = ven.filter((v) => v.z > W / 2 - 0.35);
    for (const v of frente) {
      if (nh++ > 4) break;
      const top = new THREE.Vector3(v.x, 2.55, v.z);
      const len = 2.55 / Math.max(0.25, -dir.y);
      const centro = top.clone().addScaledVector(dir, len / 2);
      const yAxis = dir.clone().normalize();
      const xAxis = new THREE.Vector3(Math.cos(v.rot), 0, -Math.sin(v.rot));
      const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
      const m = new THREE.Mesh(new THREE.PlaneGeometry(v.w * 0.82, len), matHaz);
      m.matrixAutoUpdate = false;
      const mtx = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis).setPosition(centro);
      m.matrix.copy(mtx);
      S.add(m);
    }
  }

  /* ---------- meshes fusionados ---------- */
  // Se fusiona al final: incluye el cascaron, los equipos y todos los detalles
  // exteriores/interiores añadidos con caja(), cil() y plano().
  const oscuros = new Set([M.pantalla, M.luz, M.hoja, M.verde]);
  for (const [m, geos] of grupos) {
    const g = mergeGeometries(geos, false);
    if (!g) continue;
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = !(m.transparent || oscuros.has(m));
    mesh.receiveShadow = true;
    if (m.transparent) { mesh.renderOrder = 4; }
    S.add(mesh);
    geos.forEach((x) => x.dispose());
  }

  return { S, EQ };
}
