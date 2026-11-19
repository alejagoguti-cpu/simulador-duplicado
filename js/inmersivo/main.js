// Recorrido inmersivo: scroll nativo sobre un camino de camara con paradas.
// La escena es solida (sin nube de puntos): materiales PBR, sol, sombras,
// postproceso y etiquetas de los equipos.
import * as THREE from 'three';
import { ED, ORDEN, C, M } from './datos.js';
import { crearTexturas } from './texturas.js';
import { crearMateriales } from './materiales.js';
import { construirEscena } from './escena.js';
import { crearCamino } from './camino.js';
import { crearPost } from './post.js';

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const MOV = matchMedia('(max-width: 760px)').matches || matchMedia('(pointer: coarse)').matches;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const raf = () => new Promise((r) => {
  let hecho = false;
  const fin = () => { if (!hecho) { hecho = true; r(); } };
  requestAnimationFrame(() => requestAnimationFrame(fin));
  setTimeout(fin, 150);
});
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- edificio ---------- */
const params = new URLSearchParams(location.search);
const k0 = params.get('e');
const K = ED[k0] ? k0 : 'bio';
const E0 = ED[K];
document.documentElement.style.setProperty('--c', E0.c);
document.title = E0.n + ' por dentro · Bavaria Común';
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
const cargaTit = document.getElementById('carga-tit');
if (cargaTit) cargaTit.textContent = E0.n;
const cargaNombre = document.getElementById('carga-nombre');
if (cargaNombre) cargaNombre.textContent = E0.kp.map((k) => k[0]).join(' · ');

/* ---------- interfaz de edificios ---------- */
const edif = $('#edif');
for (const k of ORDEN) {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.k = k;
  b.textContent = ED[k].n;
  b.style.setProperty('--c', ED[k].c);
  if (k === K) b.classList.add('on');
  edif.appendChild(b);
}
edif.addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]');
  if (b) location.search = '?e=' + b.dataset.k;
});

/* ---------- render ---------- */
const canvas = $('#c');
let R;
try {
  R = new THREE.WebGLRenderer({ canvas, antialias: !MOV, powerPreference: 'high-performance', alpha: false, stencil: false });
} catch (err) {
  fallar('Este navegador no pudo crear el contexto WebGL. Prueba con Chrome, Edge o Safari actualizados.');
  throw err;
}
R.setPixelRatio(Math.min(devicePixelRatio || 1, MOV ? 1.6 : 1.75));
R.setSize(innerWidth, innerHeight, false);
R.outputColorSpace = THREE.SRGBColorSpace;
R.toneMapping = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 0.66;
R.shadowMap.enabled = true;
R.shadowMap.type = THREE.PCFSoftShadowMap;

/* ---------- estado ---------- */
let S = null, EQ = [], camino = [], cam = null, post = null, polvo = null;
let n = 7, idxActual = -1, prog = 0, objetivo = 0, auto = false, autoVel = 0;
let ultimo = performance.now(), ultimaEtiqueta = 0, ultimaOclusion = 0;
let capturaPedida = null;
let yaw = 0, pitch = 0, yawT = 0, pitchT = 0, parYaw = 0, parPitch = 0, parYawT = 0, parPitchT = 0;
let ratonX = 0.5, ratonY = 0.5, ratonDentro = false;
let arrastrando = false, ultimoPuntero = null;
const oclusores = [];
const etiquetas = [];

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _target = new THREE.Vector3();
const _v = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _tmp2 = new THREE.Vector3();
const _cd = new THREE.Vector3();
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _ray = new THREE.Raycaster();
const _sph = new THREE.Sphere();

function fallar(msg) {
  const c = $('#carga');
  if (!c) return;
  c.classList.add('error');
  $('#carga-tit').textContent = 'No se pudo cargar';
  $('#carga-txt').textContent = msg;
  $('#carga-barra').style.transform = 'scaleX(0)';
  $('#carga-pct').textContent = '—';
}

function paso(txt, p) {
  const t = $('#carga-txt'), b = $('#carga-barra'), pc = $('#carga-pct');
  if (t) t.textContent = txt;
  if (b) b.style.transform = `scaleX(${p})`;
  if (pc) pc.textContent = Math.round(p * 100) + '%';
}

function texturaMota() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,250,238,1)');
  g.addColorStop(0.35, 'rgba(255,246,228,.55)');
  g.addColorStop(1, 'rgba(255,246,228,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function crearPolvo() {
  const N = MOV ? 160 : 320;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const fase = new Float32Array(N);
  const vel = new Float32Array(N);
  const rMax = E0.silo ? E0.L / 2 - 0.6 : 0;
  for (let i = 0; i < N; i++) {
    let x, z;
    if (E0.silo) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * rMax;
      x = Math.sin(a) * r; z = Math.cos(a) * r;
    } else {
      x = (Math.random() - 0.5) * (E0.L - 1.2);
      z = (Math.random() - 0.5) * (E0.W - 1.2);
    }
    const y = 0.35 + Math.random() * (E0.H - 0.9);
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    fase[i] = Math.random() * Math.PI * 2;
    vel[i] = 0.018 + Math.random() * 0.035;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: MOV ? 0.026 : 0.018,
    map: texturaMota(),
    color: 0xfff2d8,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  p.userData = { fase, vel, N };
  S.add(p);
  return p;
}

function actualizarPolvo(t, dt) {
  if (!polvo) return;
  const pos = polvo.geometry.attributes.position;
  const { fase, vel, N } = polvo.userData;
  const alto = E0.H - 0.6;
  for (let i = 0; i < N; i++) {
    let y = pos.getY(i) + vel[i] * dt;
    if (y > alto) y = 0.3;
    pos.setY(i, y);
    pos.setX(i, pos.getX(i) + Math.sin(t * 0.35 + fase[i]) * 0.0009);
    pos.setZ(i, pos.getZ(i) + Math.cos(t * 0.28 + fase[i] * 1.3) * 0.0007);
  }
  pos.needsUpdate = true;
}

/* ---------- capitulos ---------- */
function construirInterfaz() {
  n = camino.length;
  document.documentElement.style.setProperty('--n', n);

  const rail = $('#rail');
  camino.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.i = i;
    const num = document.createElement('b');
    num.textContent = String(i).padStart(2, '0');
    const sp = document.createElement('span');
    sp.textContent = p.titulo;
    b.append(num, sp);
    rail.appendChild(b);
  });
  rail.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    detenerAuto();
    irA(Number(b.dataset.i));
  });

  EQ.forEach((e, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'lb';
    el.dataset.i = i;
    const b = document.createElement('b');
    b.textContent = e[0];
    el.appendChild(b);
    if (e[1]) {
      const it = document.createElement('i');
      it.textContent = e[1];
      el.appendChild(it);
    }
    const s = document.createElement('s');
    const u = document.createElement('u');
    el.append(s, u);
    el.addEventListener('click', () => abrirFicha(i));
    el.addEventListener('pointerenter', () => { el.classList.add('hov'); });
    el.addEventListener('pointerleave', () => { el.classList.remove('hov'); });
    $('#etiquetas').appendChild(el);
    etiquetas.push({ i, el, p: new THREE.Vector3(e[3], e[4], e[5]), ocluido: false });
  });

  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  autoVel = max / (RM ? 85 : 58);

  $('#b-rec').addEventListener('click', () => { auto = !auto; actualizarAuto(); if (auto) detenerPista(); });
  $('#b-ant').addEventListener('click', () => { detenerAuto(); irA(Math.max(0, idxActual - 1)); });
  $('#b-sig').addEventListener('click', () => { detenerAuto(); irA(Math.min(n - 1, idxActual + 1)); });
  $('#b-full').addEventListener('click', alternarPantalla);
  if (!document.documentElement.requestFullscreen) $('#b-full').style.display = 'none';

  $('#f-cerrar').addEventListener('click', cerrarFicha);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarFicha();
    if (e.key === 'Home') { detenerAuto(); window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); }
    if (e.key === 'End') { detenerAuto(); window.scrollTo({ top: max, behavior: RM ? 'auto' : 'smooth' }); }
  });

  for (const ev of ['wheel', 'touchstart']) {
    window.addEventListener(ev, detenerAuto, { passive: true });
  }
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) detenerAuto();
  }, { passive: true });
}

function actualizarAuto() {
  const b = $('#b-rec');
  b.textContent = auto ? 'Pausar' : 'Recorrer';
  b.setAttribute('aria-pressed', auto ? 'true' : 'false');
  b.classList.toggle('on', auto);
}

function detenerAuto() {
  if (!auto) return;
  auto = false;
  actualizarAuto();
}

function detenerPista() {
  $('#pista').style.opacity = '0';
}

function irA(i) {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const s = n > 1 ? i / (n - 1) : 0;
  window.scrollTo({ top: s * max, behavior: RM ? 'auto' : 'smooth' });
}

function alternarPantalla() {
  detenerAuto();
  const p = document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.();
  if (p && p.catch) p.catch(() => {});
}

/* ---------- ficha ---------- */
function abrirFicha(i) {
  const e = EQ[i];
  if (!e) return;
  $('#f-nombre').textContent = e[0];
  $('#f-med').textContent = e[1] || '';
  $('#f-med').style.display = e[1] ? 'inline-flex' : 'none';
  $('#f-txt').textContent = e[2] || '';
  $('#ficha').classList.add('on');
  document.body.classList.add('ficha');
  detenerAuto();
}
function cerrarFicha() {
  $('#ficha').classList.remove('on');
  document.body.classList.remove('ficha');
}

/* ---------- scroll ---------- */
function maxScroll() {
  return Math.max(1, (document.scrollingElement || document.documentElement).scrollHeight - innerHeight);
}
function leerScroll() {
  objetivo = clamp((window.scrollY || document.scrollingElement.scrollTop || 0) / maxScroll(), 0, 1);
}
window.addEventListener('scroll', leerScroll, { passive: true });

/* ---------- camara ---------- */
function catmull(a, b, c, d, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}

function aplicarCamara(t, dt) {
  const q = clamp(prog, 0, 1) * (n - 1);
  let i = Math.floor(q);
  if (i > n - 2) i = n - 2;
  if (i < 0) i = 0;
  const f = clamp(q - i, 0, 1);
  const g = smooth(0.3, 0.7, f);

  const A = camino[Math.max(0, i - 1)].pos;
  const B = camino[i].pos;
  const Cc = camino[i + 1].pos;
  const D = camino[Math.min(n - 1, i + 2)].pos;
  _pos.set(
    catmull(A.x, B.x, Cc.x, D.x, g),
    catmull(A.y, B.y, Cc.y, D.y, g),
    catmull(A.z, B.z, Cc.z, D.z, g)
  );

  const LA = camino[Math.max(0, i - 1)].look;
  const LB = camino[i].look;
  const LC = camino[i + 1].look;
  const LD = camino[Math.min(n - 1, i + 2)].look;
  _look.set(
    catmull(LA.x, LB.x, LC.x, LD.x, g),
    catmull(LA.y, LB.y, LC.y, LD.y, g),
    catmull(LA.z, LB.z, LC.z, LD.z, g)
  );

  if (!RM) {
    _pos.y += Math.sin(t * 0.55) * 0.006 + Math.sin(t * 1.31) * 0.0022;
    _look.x += Math.sin(t * 0.42) * 0.004;
  }

  const fovBase = lerp(camino[i].fov, camino[i + 1].fov, g);
  const vel = Math.abs(objetivo - prog);
  const fov = fovBase + (RM ? 0 : Math.min(3.6, vel * 26));
  if (Math.abs(cam.fov - fov) > 0.01) {
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }

  // arrastre para mirar y parallax suave del puntero
  if (!arrastrando) {
    yawT *= Math.exp(-dt * 2.6);
    pitchT *= Math.exp(-dt * 2.6);
  }
  yaw += (yawT - yaw) * Math.min(1, dt * 11);
  pitch += (pitchT - pitch) * Math.min(1, dt * 11);
  parYaw += (parYawT - parYaw) * Math.min(1, dt * 5);
  parPitch += (parPitchT - parPitch) * Math.min(1, dt * 5);

  _dir.copy(_look).sub(_pos).normalize();
  _e.set(pitch + parPitch, yaw + parYaw, 0, 'YXZ');
  _q.setFromEuler(_e);
  _dir.applyQuaternion(_q);

  cam.position.copy(_pos);
  _target.copy(_pos).add(_dir);
  cam.lookAt(_target);
  cam.updateMatrixWorld();

  return { i, f, g, qEase: i + g };
}

/* ---------- capitulo visible ---------- */
function pintarCapitulo(qEase) {
  const idx = clamp(Math.round(qEase), 0, n - 1);
  const op = 1 - Math.min(1, Math.abs(qEase - idx) / 0.34);
  const cap = $('#cap');
  cap.style.opacity = op.toFixed(3);
  cap.style.transform = `translateY(${((1 - op) * 12).toFixed(1)}px)`;

  if (idx !== idxActual) {
    idxActual = idx;
    const p = camino[idx];
    $('#ey').textContent = p.eyebrow;
    $('#tit').textContent = p.titulo;
    $('#des').textContent = p.texto;
    $('#med').textContent = p.med || '';
    $('#med').style.display = p.med ? 'inline-flex' : 'none';
    $('#num').textContent = String(idx).padStart(2, '0') + ' / ' + String(n - 1).padStart(2, '0');
    $('#kp').style.display = idx === 0 ? 'flex' : 'none';
    if (idx === 0) {
      $('#kp').innerHTML = '';
      for (const [b, s] of E0.kp) {
        const d = document.createElement('div');
        const bb = document.createElement('b'); bb.textContent = b;
        const ss = document.createElement('span'); ss.textContent = s;
        d.append(bb, ss);
        $('#kp').appendChild(d);
      }
    }
    $('#nota').style.display = idx === n - 1 ? 'block' : 'none';
    document.querySelectorAll('#rail button').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === idx));
    etiquetas.forEach((l) => l.el.classList.toggle('sel', camino[idx].eq === l.i));
  }
}

/* ---------- etiquetas ---------- */
function actualizarEtiquetas(t) {
  if (t - ultimaEtiqueta < 0.055) return;
  ultimaEtiqueta = t;
  const w = innerWidth, h = innerHeight;
  cam.getWorldDirection(_cd);
  // solo se muestran al recorrer el interior, nunca en la llegada ni en el plano final
  const q = prog * (n - 1);
  const foco = smooth(1.5, 1.95, q) * (1 - smooth(n - 2.35, n - 1.92, q));
  const vis = [];
  for (const l of etiquetas) {
    _v.copy(l.p).project(cam);
    const d = cam.position.distanceTo(l.p);
    const delante = _tmp.copy(l.p).sub(cam.position).normalize().dot(_cd) > 0.22;
    const enCuadro = _v.z > -1 && _v.z < 1 && Math.abs(_v.x) < 1.12 && Math.abs(_v.y) < 1.12;
    const op = delante && enCuadro ? smooth(14, 7, d) * foco * (l.ocluido ? 0 : 1) : 0;
    if (op > 0.02) vis.push({ l, op, d, x: (_v.x * 0.5 + 0.5) * w, y: (-_v.y * 0.5 + 0.5) * h });
  }
  vis.sort((a, b) => a.d - b.d);
  const max = MOV ? 3 : 6;
  vis.forEach((o, k) => {
    const el = o.l.el;
    if (k < max) {
      el.style.opacity = (o.op * (k === 0 ? 1 : 0.86)).toFixed(3);
      el.style.transform = `translate3d(${o.x.toFixed(1)}px,${o.y.toFixed(1)}px,0) translate(-50%,-100%)`;
      el.style.pointerEvents = 'auto';
      el.style.zIndex = String(60 - k);
    } else {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    }
  });
  for (const l of etiquetas) {
    if (!vis.some((o) => o.l === l)) {
      l.el.style.opacity = '0';
      l.el.style.pointerEvents = 'none';
    }
  }

  // oclusion: un rayo por etiqueta visible, solo en escritorio y a 4 Hz
  if (!MOV && t - ultimaOclusion > 0.26) {
    ultimaOclusion = t;
    for (const o of vis.slice(0, 6)) {
      const dir = _tmp2.copy(o.l.p).sub(cam.position);
      const dist = dir.length();
      _ray.set(cam.position, dir.normalize());
      _ray.far = Math.max(0.2, dist - 0.5);
      const hit = _ray.intersectObjects(oclusores, false);
      o.l.ocluido = hit.length > 0;
    }
  }
}

/* ---------- bucle ---------- */
function bucle(now) {
  const t = now * 0.001;
  const dt = Math.min(0.06, Math.max(0.001, (now - ultimo) * 0.001));
  ultimo = now;

  if (auto) {
    const el = document.scrollingElement || document.documentElement;
    const y = (window.scrollY || el.scrollTop || 0) + autoVel * dt;
    if (y >= maxScroll() - 0.5) {
      window.scrollTo(0, maxScroll());
      auto = false;
      actualizarAuto();
    } else {
      window.scrollTo(0, y);
    }
  }

  leerScroll();
  const k = 1 - Math.exp(-dt * 9);
  prog += (objetivo - prog) * k;
  if (Math.abs(objetivo - prog) < 0.0004) prog = objetivo;

  const q = aplicarCamara(t, dt);
  pintarCapitulo(q.qEase);
  actualizarEtiquetas(t);
  actualizarPolvo(t, dt);

  $('#prog').style.transform = `scaleX(${prog.toFixed(4)})`;
  if (prog > 0.012) detenerPista();

  post.grade.uniforms.uT.value = t;
  const trans = Math.pow(Math.sin(Math.PI * q.g), 1.4);
  post.grade.uniforms.uTrans.value = trans * (MOV ? 0.45 : 0.9);

  if (window.__sinPost) R.render(S, cam);
  else post.composer.render();

  if (capturaPedida) {
    const { nombre, resolver } = capturaPedida;
    capturaPedida = null;
    let data = '';
    try { data = canvas.toDataURL('image/jpeg', 0.86); } catch (_) {}
    fetch('http://127.0.0.1:8124/shot', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre, data })
    }).then((r) => r.json()).then(resolver).catch(() => resolver({ ok: false }));
  }
}

/* ---------- inicio ---------- */
async function iniciar() {
  try {
    paso('Cargando tipografías', 0.06);
    await Promise.race([document.fonts.ready, esperar(1800)]);
    paso('Tejiendo materiales', 0.12);
    await raf();
    const T = crearTexturas(R);
    const materiales = crearMateriales(T);

    paso('Levantando muros y equipos', 0.44);
    await raf();
    const EQ0 = [];
    const escena = construirEscena({ E0, C, M, EQ: EQ0, R, T, materiales, MOV });
    S = escena.S;
    EQ = EQ0;
    camino = crearCamino(E0, EQ);

    paso('Encendiendo luces', 0.76);
    await raf();
    cam = new THREE.PerspectiveCamera(camino[0].fov, innerWidth / innerHeight, 0.05, 400);
    post = crearPost({ R, S, cam, MOV });
    polvo = crearPolvo();

    S.traverse((o) => {
      if (o.isMesh && o.material && !o.material.transparent && o.geometry.type !== 'SphereGeometry') oclusores.push(o);
    });

    paso('Ajustando la mirada', 0.94);
    await raf();
    construirInterfaz();
    leerScroll();
    prog = objetivo;
    aplicarCamara(performance.now() * 0.001, 0.016);
    actualizarEtiquetas(performance.now() * 0.001);
    R.setAnimationLoop(bucle);

    window.__inm = { R, S, cam, post, camino, EQ, E0, get prog() { return prog; } };
    window.__captura = (nombre) => new Promise((resolver) => { capturaPedida = { nombre, resolver }; });
    window.__irA = (i) => { detenerAuto(); irA(i); };

    paso('Listo', 1);
    await esperar(260);
    $('#carga').classList.add('listo');
    document.body.classList.add('listo');
    setTimeout(() => { const c = $('#carga'); if (c) c.remove(); }, 1000);
  } catch (err) {
    console.error(err);
    fallar('Ocurrió un error al construir la escena. Revisa la consola del navegador.');
  }
}

addEventListener('resize', () => {
  if (!cam || !post) return;
  R.setPixelRatio(Math.min(devicePixelRatio || 1, MOV ? 1.6 : 1.75));
  R.setSize(innerWidth, innerHeight, false);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
  post.setSize(innerWidth, innerHeight);
  leerScroll();
});

/* ---------- puntero ---------- */
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;
  arrastrando = true;
  ultimoPuntero = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture?.(e.pointerId);
  document.body.classList.add('arrastra');
  detenerAuto();
  e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') {
    ratonDentro = true;
    ratonX = e.clientX / innerWidth;
    ratonY = e.clientY / innerHeight;
    if (!arrastrando) {
      parYawT = -(ratonX - 0.5) * 0.055;
      parPitchT = -(ratonY - 0.5) * 0.036;
    }
  }
  if (!arrastrando || !ultimoPuntero) return;
  const dx = e.clientX - ultimoPuntero.x;
  const dy = e.clientY - ultimoPuntero.y;
  ultimoPuntero = { x: e.clientX, y: e.clientY };
  yawT = clamp(yawT - dx * 0.0032, -0.95, 0.95);
  pitchT = clamp(pitchT - dy * 0.0026, -0.46, 0.46);
});
function soltar(e) {
  if (!arrastrando) return;
  arrastrando = false;
  ultimoPuntero = null;
  document.body.classList.remove('arrastra');
  try { canvas.releasePointerCapture?.(e.pointerId); } catch (_) {}
}
canvas.addEventListener('pointerup', soltar);
canvas.addEventListener('pointercancel', soltar);
canvas.addEventListener('pointerleave', () => {
  if (!arrastrando) {
    ratonDentro = false;
    parYawT = 0;
    parPitchT = 0;
  }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

iniciar();
