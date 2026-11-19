// Datos del programa de Bavaria Comun: piezas de cada equipo y los 12 edificios.
// Extraido de bavaria_interior.html (version en puntos) sin cambios de contenido.
const C = { acero: '#c9ced3', inox: '#dfe3e6', blanco: '#eef0ee', madera: '#a77b52', maderaC: '#c9a77c', negro: '#202325', gris: '#7d8489', vidrio: '#a8d4e6', verde: '#4f9a4a', hoja: '#5fa04a', tierra: '#5b4331', azul: '#3b82f6', rojo: '#d9473b', amar: '#f2c43a', naranja: '#f08a24', pantalla: '#1f6fae', piso: '#b9b4aa', pisoC: '#d8d4cc', muro: '#e6e3dc', techo: '#cfccc5' };
function caja(G, x, y, z, w, h, d, c, ry = 0) { G.push({ t: 'b', x, y, z, w, h, d, c, ry }); }
function cil(G, x, y, z, r, h, c) { G.push({ t: 'c', x, y, z, r, h, c }); }
const M = { // equipos: (G, x, z, rot) -> piezas; devuelven [ancho, fondo] para chocar
  mesonLab(G, x, z, r) {
    caja(G, x, 0.45, z, 1.8, 0.9, 0.75, C.blanco, r);
    caja(G, x, 0.92, z, 1.84, 0.04, 0.79, C.negro, r);
    caja(G, x, 1.5, z, 1.8, 0.03, 0.26, C.gris, r);
    const at = (dx, dz) => [x + dx * Math.cos(r) + dz * Math.sin(r), z - dx * Math.sin(r) + dz * Math.cos(r)];
    for (const s of [-1, 1]) { const [bx, bz] = at(s * 0.68, 0); caja(G, bx, 1.22, bz, 0.03, 0.56, 0.03, C.acero, r, false); }
    for (let k = 0; k < 5; k++) {
      const [sx, sz] = at(-0.62 + k * 0.31, 0.02);
      const hh = [0.13, 0.16, 0.11, 0.17, 0.14][k];
      const cc = [C.amar, C.verde, C.amar, C.azul, C.verde][k];
      cil(G, sx, 1.515 + hh / 2, sz, 0.026, hh, 'vidrioLab');
      cil(G, sx, 1.515 + hh * 0.34, sz, 0.021, hh * 0.6, cc);
      cil(G, sx, 1.515 + hh + 0.015, sz, 0.017, 0.03, C.negro);
    }
    const props = [
      [-0.62, 0.02, 0.065, 0.17, 'vidrioLab', 0.05, 0.09, C.verde],
      [-0.4, 0.1, 0.05, 0.13, 'vidrioLab', 0.038, 0.07, C.amar],
      [0.38, -0.02, 0.17, 0.06, C.gris, 0, 0, ''],
      [0.66, 0.12, 0.04, 0.12, C.amar, 0, 0, '']
    ];
    for (const [dx, dz, rr, hh, cc, rl, hl, cl] of props) {
      const [px, pz] = at(dx, dz);
      cil(G, px, 0.94 + hh / 2, pz, rr, hh, cc);
      if (rl) cil(G, px, 0.94 + hl / 2 + 0.01, pz, rl, hl, cl);
    }
    const [tx, tz] = at(0.38, -0.02);
    for (let k = 0; k < 6; k++) cil(G, tx - 0.06 + (k % 3) * 0.06, 0.99, tz + (k > 2 ? 0.04 : -0.04), 0.014, 0.09, [C.rojo, C.amar, C.azul][k % 3]);
    const [nx, nz] = at(0.64, -0.12);
    caja(G, nx, 0.955, nz, 0.24, 0.025, 0.3, C.negro, r, false);
    cil(G, x - 0.5, 1.1, z, 0.03, 0.4, C.gris);
  },
  taburete(G, x, z) { cil(G, x, 0.32, z, 0.03, 0.64, C.gris); cil(G, x, 0.66, z, 0.18, 0.05, C.negro); },
  campana(G, x, z, r) { caja(G, x, 0.45, z, 1.3, 0.9, 0.8, C.blanco, r); caja(G, x, 1.25, z, 1.3, 0.7, 0.8, C.vidrio, r); caja(G, x, 1.95, z, 1.3, 0.7, 0.8, C.blanco, r); },
  autoclave(G, x, z) { cil(G, x, 0.5, z, 0.3, 1.0, C.inox); cil(G, x, 1.03, z, 0.32, 0.06, C.gris); },
  incubadora(G, x, z, r) { caja(G, x, 0.9, z, 0.7, 1.8, 0.7, C.blanco, r); caja(G, x, 1.3, z + 0.36, 0.5, 0.5, 0.02, C.vidrio, r); },
  nevera(G, x, z, r) { caja(G, x, 0.95, z, 0.75, 1.9, 0.75, C.inox, r); },
  microscopio(G, x, z) { caja(G, x, 0.97, z, 0.25, 0.06, 0.3, C.negro); cil(G, x, 1.15, z, 0.03, 0.35, C.negro); cil(G, x, 1.32, z, 0.05, 0.12, C.blanco); },
  pcr(G, x, z) { caja(G, x, 1.02, z, 0.45, 0.2, 0.35, C.blanco); caja(G, x, 1.13, z, 0.42, 0.02, 0.32, C.azul); },
  lavadero(G, x, z, r) { caja(G, x, 0.45, z, 1.6, 0.9, 0.65, C.inox, r); cil(G, x, 1.1, z - 0.2, 0.02, 0.4, C.acero); },
  estante(G, x, z, r, c = C.acero, w = 1.2) { for (let k = 0; k < 5; k++) caja(G, x, 0.1 + k * 0.45, z, w, 0.03, 0.45, c, r); caja(G, x - w / 2, 1.0, z, 0.03, 2.0, 0.45, c, r); caja(G, x + w / 2, 1.0, z, 0.03, 2.0, 0.45, c, r); },
  frascos(G, x, z, n = 10) { for (let k = 0; k < n; k++) cil(G, x - 0.5 + (k % 5) * 0.25, 0.65 + Math.floor(k / 5) * 0.45, z, 0.06, 0.18, k % 3 ? C.amar : C.verde); },
  germinacion(G, x, z, r) { for (let k = 0; k < 4; k++) { caja(G, x, 0.2 + k * 0.5, z, 1.4, 0.03, 0.6, C.acero, r); caja(G, x, 0.24 + k * 0.5, z, 1.3, 0.06, 0.5, C.hoja, r); caja(G, x, 0.62 + k * 0.5, z, 1.2, 0.02, 0.06, '#e9d5ff', r); } },
  escritorio(G, x, z, r) { caja(G, x, 0.73, z, 1.4, 0.04, 0.7, C.maderaC, r); caja(G, x - 0.66, 0.36, z, 0.04, 0.72, 0.66, C.gris, r); caja(G, x + 0.66, 0.36, z, 0.04, 0.72, 0.66, C.gris, r); },
  pc(G, x, z) { caja(G, x, 1.02, z, 0.6, 0.36, 0.03, C.pantalla); caja(G, x, 0.8, z, 0.05, 0.12, 0.05, C.negro); caja(G, x, 0.76, z - 0.25, 0.45, 0.02, 0.15, C.negro); },
  silla(G, x, z) { caja(G, x, 0.45, z, 0.45, 0.06, 0.45, C.negro); caja(G, x, 0.75, z + 0.22, 0.45, 0.5, 0.05, C.negro); cil(G, x, 0.22, z, 0.03, 0.42, C.gris); },
  pantallaGrande(G, x, z, r, w = 4, h = 2.25) { caja(G, x, 0.9 + h / 2, z, w, h, 0.08, C.pantalla, r); caja(G, x, 0.9 + h / 2, z - 0.05, w + 0.1, h + 0.1, 0.02, C.negro, r); },
  rack(G, x, z, r) { caja(G, x, 1.0, z, 0.6, 2.0, 1.0, C.negro, r); for (let k = 0; k < 12; k++) caja(G, x, 0.2 + k * 0.15, z - 0.51, 0.5, 0.04, 0.01, k % 4 ? '#22c55e' : '#38bdf8', r); },
  osciloscopio(G, x, z) { caja(G, x, 1.0, z, 0.4, 0.18, 0.3, C.gris); caja(G, x - 0.05, 1.0, z - 0.16, 0.18, 0.12, 0.01, '#22d3ee'); },
  impresora3d(G, x, z) { caja(G, x, 0.95, z, 0.5, 0.06, 0.5, C.negro); caja(G, x, 1.3, z, 0.5, 0.6, 0.5, C.vidrio); caja(G, x, 1.62, z, 0.52, 0.04, 0.52, C.negro); },
  laser(G, x, z, r) { caja(G, x, 0.5, z, 1.4, 1.0, 0.9, C.negro, r); caja(G, x, 1.05, z, 1.3, 0.1, 0.8, '#f59e0b', r); },
  camaraClima(G, x, z, r) { caja(G, x, 0.95, z, 1.0, 1.9, 0.9, C.blanco, r); caja(G, x, 1.2, z - 0.46, 0.5, 0.6, 0.02, C.vidrio, r); },
  pupitre(G, x, z) { caja(G, x, 0.75, z, 0.7, 0.03, 0.5, C.maderaC); caja(G, x, 0.37, z, 0.04, 0.74, 0.04, C.gris); M.silla(G, x, z + 0.45); },
  tablero(G, x, z, r, w = 3.6) { caja(G, x, 1.5, z, w, 1.2, 0.04, '#f4f4f2', r); caja(G, x, 1.5, z, w + 0.06, 1.26, 0.02, C.gris, r); },
  casilleros(G, x, z, r, n = 8) { for (let k = 0; k < n; k++) caja(G, x - n * 0.2 + k * 0.4 + 0.2, 0.9, z, 0.38, 1.8, 0.45, ['#60a5fa', '#93c5fd', '#3b82f6'][k % 3], r); },
  mesaInox(G, x, z, r, w = 2.0) { caja(G, x, 0.9, z, w, 0.04, 0.8, C.inox, r); caja(G, x, 0.25, z, w - 0.1, 0.03, 0.7, C.inox, r); for (const s of [-1, 1]) for (const t of [-1, 1]) caja(G, x + s * (w / 2 - 0.05), 0.45, z + t * 0.35, 0.04, 0.9, 0.04, C.acero, r); },
  bascula(G, x, z) { caja(G, x, 0.06, z, 1.0, 0.12, 1.0, C.gris); caja(G, x + 0.45, 0.6, z, 0.06, 1.0, 0.06, C.acero); caja(G, x + 0.45, 1.15, z, 0.25, 0.2, 0.08, '#22c55e'); },
  canastillas(G, x, z, n = 5) { for (let k = 0; k < n; k++) caja(G, x, 0.15 + k * 0.29, z, 0.6, 0.27, 0.4, ['#ef4444', '#22c55e', '#3b82f6'][k % 3]); for (let k = 0; k < n - 1; k++) caja(G, x, 0.32 + k * 0.29, z, 0.5, 0.06, 0.32, [C.verde, C.rojo, C.naranja, C.amar][k % 4]); },
  camaraFria(G, x, z, w, d) { caja(G, x, 1.3, z, w, 2.6, d, C.blanco); caja(G, x, 1.1, z - d / 2 - 0.01, 1.1, 2.1, 0.02, C.inox); },
  estiba(G, x, z) { caja(G, x, 0.07, z, 1.2, 0.14, 1.0, C.madera); for (let k = 0; k < 6; k++) caja(G, x - 0.3 + (k % 2) * 0.6, 0.3 + Math.floor(k / 2) * 0.3, z, 0.55, 0.28, 0.9, k % 2 ? '#d1b07a' : '#c19a62'); },
  caneca(G, x, z, c = C.verde) { cil(G, x, 0.45, z, 0.28, 0.9, c); },
  puesto(G, x, z, r, c) { caja(G, x, 0.9, z, 2.6, 0.06, 1.0, C.madera, r); caja(G, x, 0.45, z, 2.5, 0.9, 0.9, C.maderaC, r); for (const s of [-1, 1]) caja(G, x + s * 1.3, 1.25, z + 0.5, 0.06, 2.5, 0.06, C.gris, r); caja(G, x, 2.5, z + 0.1, 3.0, 0.04, 1.6, c, r);
    for (let k = 0; k < 8; k++) caja(G, x - 1.05 + k * 0.3, 1.02, z - 0.2 + (k % 2) * 0.3, 0.26, 0.16, 0.26, [C.rojo, C.verde, C.naranja, C.amar, '#7c3aed'][k % 5], r); },
  gradas(G, x, z, w = 6) { for (let k = 0; k < 4; k++) caja(G, x, 0.22 + k * 0.45, z + k * 0.8, w, 0.45 + k * 0.45, 0.8, C.madera); },
  vitrina(G, x, z, r) { caja(G, x, 0.45, z, 1.2, 0.9, 0.6, C.blanco, r); caja(G, x, 1.2, z, 1.2, 0.6, 0.6, C.vidrio, r); cil(G, x, 1.05, z, 0.12, 0.2, C.verde); },
  maceta(G, x, z, h = 1) { cil(G, x, 0.2, z, 0.22, 0.4, '#8a5a3c'); cil(G, x, 0.4 + h * 0.4, z, 0.35 * h, 0.8 * h, C.hoja); },
  jardinera(G, x, z, r, w = 3) { caja(G, x, 0.3, z, w, 0.6, 0.9, C.madera, r); for (let k = 0; k < w * 3; k++) cil(G, x - w / 2 + 0.2 + k * 0.33, 0.75 + (k % 3) * 0.08, z + ((k * 7) % 3 - 1) * 0.25, 0.14, 0.3, [C.amar, '#e879f9', C.naranja, '#f8fafc', C.hoja][k % 5]); },
  jaulaCria(G, x, z, r) { caja(G, x, 1.0, z, 0.9, 2.0, 0.6, '#e8f1f2', r); for (let k = 0; k < 4; k++) caja(G, x, 0.3 + k * 0.45, z, 0.85, 0.02, 0.55, C.acero, r); },
  colmenaVidrio(G, x, z) { caja(G, x, 0.5, z, 0.5, 1.0, 0.5, C.madera); caja(G, x, 1.25, z, 0.5, 0.5, 0.08, '#f2c43a'); },
  poste(G, x, z, h = 2.6) { cil(G, x, h / 2, z, 0.04, h, C.gris); caja(G, x, h, z, 0.18, 0.12, 0.14, C.negro); },
  cocina(G, x, z, r) { caja(G, x, 0.45, z, 2.0, 0.9, 0.8, C.inox, r); for (let k = 0; k < 4; k++) cil(G, x - 0.7 + k * 0.45, 0.93, z, 0.14, 0.03, C.negro); caja(G, x, 2.1, z, 2.2, 0.5, 1.0, C.inox, r); },
  horno(G, x, z, r) { caja(G, x, 0.9, z, 0.9, 1.8, 0.8, C.inox, r); caja(G, x, 1.2, z - 0.41, 0.6, 0.4, 0.02, C.negro, r); },
  deshidratador(G, x, z) { caja(G, x, 1.2, z, 0.8, 0.8, 0.6, C.negro); caja(G, x, 0.45, z, 0.9, 0.9, 0.7, C.inox); },
  cabina(G, x, z) { caja(G, x, 0.75, z, 0.8, 0.04, 0.6, C.blanco); caja(G, x - 0.4, 1.0, z, 0.03, 1.2, 0.6, C.blanco); caja(G, x + 0.4, 1.0, z, 0.03, 1.2, 0.6, C.blanco); M.silla(G, x, z + 0.5); },
  mesaReunion(G, x, z, w = 3, d = 1.2) { caja(G, x, 0.74, z, w, 0.04, d, C.maderaC); caja(G, x, 0.37, z, 0.2, 0.72, 0.6, C.gris); for (let k = 0; k < Math.round(w / 0.8); k++) { M.silla(G, x - w / 2 + 0.4 + k * 0.8, z + d / 2 + 0.35); M.silla(G, x - w / 2 + 0.4 + k * 0.8, z - d / 2 - 0.35); } },
  escalera(G, x, z, rr = 1.6, H = 12) { for (let k = 0; k < H / 0.18; k++) { const a = k * 0.3, y = k * 0.18; caja(G, x + Math.cos(a) * rr * 0.55, y, z + Math.sin(a) * rr * 0.55, 1.0, 0.05, 0.32, C.acero, -a); } cil(G, x, H / 2, z, 0.12, H, C.gris); },
  sensorRack(G, x, z) { caja(G, x, 1.1, z, 0.6, 2.2, 0.4, C.gris); for (let k = 0; k < 6; k++) caja(G, x, 0.4 + k * 0.3, z - 0.21, 0.5, 0.18, 0.01, ['#22d3ee', '#22c55e', '#facc15'][k % 3]); }
};
/* ================= los 12 edificios: tamaño, qué hay y qué se etiqueta ================= */
const ED = {
  bio: { n: 'Hub de biotecnología', c: '#34d399', L: 10, W: 6, H: 3.4, d: 'Biotecnología vegetal, microbiología del suelo y ADN ambiental. Bioinsumos y banco de semillas; sale directo a los invernaderos.', kp: [['60 m²', 'laboratorio'], ['12', 'estudiantes'], ['6', 'mesas en parejas']],
    arma(G, E) { for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { M.mesonLab(G, -2.6 + k * 2.6, s * 0.75, s > 0 ? 0 : Math.PI); M.taburete(G, -3.1 + k * 2.6, s * 1.5); M.taburete(G, -2.1 + k * 2.6, s * 1.5); }
      M.microscopio(G, -3.0, -0.75); M.microscopio(G, -0.4, 0.75); M.pcr(G, 2.4, -0.75);
      M.campana(G, -4.3, -2.55, 0); M.autoclave(G, -2.6, -2.6); M.incubadora(G, -1.6, -2.6, 0); M.nevera(G, -0.6, -2.6, 0); M.nevera(G, 0.3, -2.6, 0); M.lavadero(G, 2.0, -2.6, 0);
      M.estante(G, 4.2, -2.5, 0, C.madera, 1.4); M.frascos(G, 4.2, -2.5, 15); M.germinacion(G, 4.0, 2.55, 0); M.germinacion(G, 2.3, 2.55, 0); M.estante(G, -4.0, 2.55, 0); M.frascos(G, -4.0, 2.55, 10);
      E.push(['Campana de flujo laminar', '1,3 × 0,8 m', 'Trabajo estéril con cultivos de microorganismos del suelo y hongos benéficos.', -4.3, 2.4, -2.55], ['Autoclave vertical 50 L', 'Ø 0,6 × 1,0 m', 'Esteriliza medios de cultivo, frascos y material antes y después de cada ensayo.', -2.6, 1.2, -2.6],
        ['Incubadora 150 L', '0,7 × 1,8 m', 'Mantiene 25–37 °C para crecer bacterias y hongos de bioinsumos.', -1.6, 1.9, -2.6], ['Refrigerador y congelador de muestras', '4 °C / −20 °C', 'Guarda muestras de suelo, agua de la charca (eDNA) y cepas.', -0.15, 2.0, -2.6],
        ['Termociclador PCR', '0,45 × 0,35 m', 'Amplifica el ADN ambiental de la charca: qué especies hay sin verlas.', 2.4, 1.25, -0.75], ['Microscopios', 'en mesa', 'Observación de hongos, esporas y microfauna del suelo.', -3.0, 1.45, -0.75],
        ['Mesones de laboratorio', '6 × 1,8 × 0,75 m', 'Seis mesas en parejas para 12 estudiantes, con toma de agua, gas y repisa.', 0, 1.6, 0.75], ['Cámara de germinación LED', '4 niveles', 'Ensayos de germinación y crecimiento contra camas de control.', 3.2, 2.2, 2.55],
        ['Banco de semillas', 'estantería', 'Semillas nativas y de las huertas, con su registro.', 4.2, 2.3, -2.5], ['Lavado y ducha de emergencia', '1,6 m', 'Lavado de material y seguridad del laboratorio.', 2.0, 1.4, -2.6]); } },
  nano: { n: 'Centro de nanotecnología y sensores', c: '#c084fc', L: 10, W: 6, H: 3.4, d: 'Materiales y nanosensores: indicadores de humedad para empaques y los sensores de colmenas, suelo y agua del distrito.', kp: [['60 m²', 'laboratorio'], ['6', 'puestos'], ['1', 'universidad aliada']],
    arma(G, E) { for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { M.escritorio(G, -2.5 + k * 2.4, s * 0.8, 0); M.pc(G, -2.5 + k * 2.4, s * 0.8 + 0.2); M.silla(G, -2.5 + k * 2.4, s * 0.8 + 0.7 * s); }
      M.mesonLab(G, -3.4, -2.55, 0); M.osciloscopio(G, -3.8, -2.55); M.osciloscopio(G, -3.0, -2.55); M.campana(G, -1.4, -2.55, 0); M.camaraClima(G, 0.4, -2.5, 0); M.camaraClima(G, 1.5, -2.5, 0);
      M.mesonLab(G, 3.6, -2.55, 0); M.impresora3d(G, 3.2, -2.55); M.impresora3d(G, 4.0, -2.55); M.estante(G, 3.8, 2.55, 0, C.acero, 1.6); M.estante(G, -3.8, 2.55, 0, C.acero, 1.6); M.mesonLab(G, 0.6, 2.55, 0);
      E.push(['Banco de electrónica', 'osciloscopio, fuente, soldadura', 'Arma y calibra los sensores de colmenas, suelo y agua del distrito.', -3.4, 1.5, -2.55], ['Campana de extracción', '1,3 m', 'Síntesis y recubrimientos de nanomateriales con solventes.', -1.4, 2.4, -2.55],
        ['Cámaras climáticas', '−10 a 60 °C, humedad', 'Envejecen empaques con indicador de humedad para medir su vida útil.', 0.95, 2.2, -2.5], ['Impresoras 3D', '0,5 m', 'Carcasas de sensores y prototipos de empaques.', 3.6, 2.0, -2.55],
        ['Seis puestos de trabajo', 'con computador', 'Diseño, programación y análisis de datos de los sensores.', 0, 1.6, 0.8], ['Mesa de ensayo de empaques', '1,8 m', 'Compara el indicador nanoestructurado con un sensor convencional; primero en banco.', 0.6, 1.5, 2.55]); } },
  datos: { n: 'Centro de datos e IA · gemelo digital', c: '#38bdf8', L: 10, W: 6, H: 3.4, d: 'Recibe los datos de todo el distrito: cosechas, energía, compost, pedidos y fauna. IA que cuenta polinizadores y reconoce cantos de aves y murciélagos.', kp: [['60 m²', 'sala'], ['12', 'estaciones'], ['1', 'gemelo digital']],
    arma(G, E) { for (let f = 0; f < 3; f++) for (let k = 0; k < 4; k++) { const x = -3.0 + k * 1.6, z = -1.4 + f * 1.4; M.escritorio(G, x, z, 0); M.pc(G, x, z + 0.15); M.silla(G, x, z + 0.6); }
      M.pantallaGrande(G, 0, 2.9, 0, 4.4, 2.0); M.rack(G, -4.4, -2.4, 0); M.rack(G, -3.6, -2.4, 0); M.mesaReunion(G, 3.2, -2.1, 2.2, 1.0);
      E.push(['Gemelo digital del distrito', 'pantalla 4,4 × 2,0 m', 'El tablero real: qué cama se cosechó, cuánto pesó, cuánta energía, cuántos kilos a compost y a qué mercado fue el lote.', 0, 3.2, 2.9],
        ['Doce estaciones de trabajo', '1,4 × 0,7 m', 'Análisis de datos y entrenamiento de la IA que cuenta polinizadores y reconoce cantos de aves y murciélagos.', -0.6, 1.6, -0.0], ['Servidores', '2 racks de 42U', 'Guardan las grabaciones de cámaras y sensores; alimentados en parte por la estación solar.', -4.0, 2.3, -2.4],
        ['Mesa de reunión', '2,2 m', 'Revisión semanal de resultados con productores y docentes.', 3.2, 1.3, -2.1]); } },
  cogn: { n: 'Ciencias cognitivas y diseño', c: '#f472b6', L: 6, W: 5, H: 3.2, d: 'Cómo entienden las personas las etiquetas, alertas y datos del distrito; diseño de la divulgación para colegios y vecinos.', kp: [['30 m²', 'laboratorio'], ['1', 'mesa de prueba'], ['2', 'puestos de observación']],
    arma(G, E) { M.mesaReunion(G, -0.6, 0, 2.4, 1.0); M.pantallaGrande(G, -0.6, 2.4, 0, 2.2, 1.2); caja(G, 2.1, 1.6, 0, 0.06, 2.6, 4.6, C.vidrio); M.escritorio(G, 2.6, -1.0, Math.PI / 2); M.pc(G, 2.6, -1.0); M.escritorio(G, 2.6, 1.0, Math.PI / 2); M.pc(G, 2.6, 1.0);
      M.estante(G, -2.6, -2.1, 0, C.madera, 1.2); M.frascos(G, -2.6, -2.1, 10);
      E.push(['Mesa de prueba', '2,4 × 1,0 m', 'Un comerciante o vecino lee etiquetas y alertas; se mide qué entiende, cuánto tarda y qué decide.', -0.6, 1.3, 0], ['Sala de observación', 'vidrio', 'Dos investigadores observan por turnos sin interrumpir la prueba.', 2.6, 1.6, 0],
        ['Muestras de etiquetas', 'estantería', 'Versiones de etiquetas y empaques con indicador para comparar.', -2.6, 2.3, -2.1], ['Pantalla de divulgación', '2,2 m', 'Prototipos de lo que se muestra a colegios y vecinos.', -0.6, 2.8, 2.4]); } },
  inst: { n: 'Instituto de enseñanza', c: '#60a5fa', L: 22, W: 12, H: 3.6, d: 'Aquí empieza la jornada: los grupos reciben el ensayo del día y salen por la cara interior de la L hacia laboratorios y cultivos.', kp: [['290 m²', 'instituto'], ['96', 'estudiantes por jornada'], ['2', 'aulas de 60 m²']],
    arma(G, E) { for (const ox of [-6, 5]) { for (let f = 0; f < 4; f++) for (let k = 0; k < 6; k++) M.pupitre(G, ox - 2.5 + k * 1.0, -3.8 + f * 1.25); M.tablero(G, ox, -5.9, 0, 4.2); M.escritorio(G, ox, -5.0, 0); }
      caja(G, 0, 1.8, -2.5, 0.1, 3.6, 7, C.muro); M.casilleros(G, 0, 5.7, 0, 18); M.escritorio(G, -8.5, 4.2, 0); M.escritorio(G, -7.0, 4.2, 0); M.mesaReunion(G, 7.5, 4.0, 3, 1.2); M.maceta(G, 3.2, 3.0); M.maceta(G, -3.2, 3.0);
      E.push(['Aula 1 · 60 m²', '24 estudiantes', 'Recibe el ensayo del día antes de salir a laboratorios y cultivos.', -6, 2.0, -2.0], ['Aula 2 · 60 m²', '24 estudiantes', 'Cuatro grupos que rotan por jornada (96 estudiantes).', 5, 2.0, -2.0],
        ['Casilleros', '35 m²', 'Botas, batas y herramientas de cada grupo.', 0, 2.2, 5.7], ['Recepción', '35 m²', 'Llegada de los colegios de la red (Conectografía escolar).', -7.7, 1.4, 4.2], ['Sala docente', '30 m²', 'Planeación de los ensayos con los laboratorios.', 7.5, 1.4, 4.0]); } },
  foro: { n: 'Foro y nave de innovación', c: '#e7e5e4', L: 14, W: 9, H: 6, d: 'Punto de encuentro antes de recorrer el predio, fab lab y exhibición de ensayos, cosechas y resultados de energía, agua, compost y fauna.', kp: [['120 m²', 'iniciales'], ['60', 'personas en gradas'], ['1', 'fab lab']],
    arma(G, E) { M.gradas(G, -2, 1.2, 7); M.pantallaGrande(G, -2, -4.2, 0, 5, 2.8); M.laser(G, 4.8, -3.6, 0); M.impresora3d(G, 5.6, -1.6); M.impresora3d(G, 4.8, -1.6); M.mesonLab(G, 5.2, -1.6, 0); M.vitrina(G, 5.5, 1.2, 0); M.vitrina(G, 5.5, 2.8, 0); M.vitrina(G, 5.5, 4.0, 0);
      E.push(['Gradas móviles', '60 personas', 'Encuentro antes de recorrer el predio; asambleas del barrio.', -2, 2.6, 2.4], ['Pantalla de resultados', '5 × 2,8 m', 'Energía, agua, compost y fauna medidos en el distrito.', -2, 4.0, -4.2],
        ['Fab lab', 'cortadora láser e impresoras 3D', 'Prototipos de empaques, carcasas de sensores y mobiliario.', 5.0, 2.2, -2.6], ['Vitrinas de ensayos', 'cosechas y empaques', 'Exhibición de lo que funcionó y lo que no.', 5.5, 2.0, 2.4]); } },
  poli: { n: 'Laboratorio vivo de polinizadores', c: '#fb923c', L: 16, W: 10, H: 5, malla: true, d: 'Mariposario e invernadero de cría de polinizadores dentro de la estructura de la antigua nave: se estudian abejas, abejorros y mariposas.', kp: [['160 m²', 'mariposario'], ['5', 'cámaras con IA'], ['3', 'especies estudiadas']],
    arma(G, E) { for (let k = 0; k < 4; k++) { M.jardinera(G, -5 + k * 3.4, -2.5, 0, 2.8); M.jardinera(G, -5 + k * 3.4, 2.5, 0, 2.8); } for (let k = 0; k < 4; k++) M.jaulaCria(G, 7.2, -3 + k * 1.2, Math.PI / 2);
      M.colmenaVidrio(G, -7.2, 0); M.colmenaVidrio(G, -7.2, 1.2); for (const [x, z] of [[-3, 0], [1, 0], [5, 0], [-6, -4], [4, -4]]) M.poste(G, x, z); for (let k = 0; k < 10; k++) M.maceta(G, -6 + k * 1.4, 4.3, 0.8 + (k % 3) * 0.2);
      E.push(['Estaciones de flores nativas', 'jardineras 2,8 m', 'Néctar y polen todo el año para abejas, abejorros y mariposas.', -1.6, 1.4, -2.5], ['Cámaras de conteo con IA', '5 postes', 'Cuentan visitas por especie y hora; los datos van al gemelo digital.', 1, 3.0, 0],
        ['Cría de mariposas', '4 jaulas', 'Huevos y orugas sobre plantas hospederas; los adultos se sueltan en las franjas florales.', 7.2, 2.4, -1.2], ['Colmena de observación', 'con vidrio', 'Los estudiantes ven el panal por dentro sin abrir la colmena.', -7.2, 1.8, 0.6]); } },
  pos: { n: 'Planta docente de poscosecha', c: '#f59e0b', L: 16, W: 12, H: 4.2, d: 'Se recibe lo cosechado, se pesa, se selecciona, se empaca con los sensores del laboratorio y se despacha a los mercados de Kennedy.', kp: [['190 m²', 'planta'], ['20 m²', 'cámara fría'], ['7', 'zonas']],
    arma(G, E) { M.bascula(G, -6.5, -4); for (let k = 0; k < 4; k++) M.canastillas(G, -7.3 + k * 0.7, -2.4, 5); M.mesaInox(G, -2.5, -3.2, 0, 2.4); M.mesaInox(G, -2.5, -1.4, 0, 2.4); M.lavadero(G, 0.6, -4.6, 0); M.lavadero(G, 2.4, -4.6, 0);
      M.mesaInox(G, 1.5, 0.6, 0, 2.4); M.mesaInox(G, 1.5, 2.2, 0, 2.4); M.camaraFria(G, 5.8, -3.0, 4, 5); M.estiba(G, 5.0, 3.6); M.estiba(G, 6.5, 3.6); for (let k = 0; k < 4; k++) M.caneca(G, -7 + k * 0.7, 4.8, [C.verde, '#a16207', C.gris, C.verde][k]);
      E.push(['Recepción y pesaje', 'báscula de plataforma', 'Se pesa cada lote al llegar del campo: el primer dato de su trazabilidad.', -6.5, 1.6, -4], ['Selección y lavado', 'mesas de acero inoxidable', 'Se separa lo que va a mercado, a la cocina y a compost.', -1.0, 1.5, -2.3],
        ['Empaque con sensores', 'mesas de 2,4 m', 'Empaques con el indicador de humedad del laboratorio de nanotecnología.', 1.5, 1.5, 1.4], ['Cámara fría', '4 × 5 m · 2–4 °C', 'Alarga la vida útil; su energía se mide en la estación solar.', 5.8, 3.0, -3.0],
        ['Despacho', 'estibas', 'Salida a los mercados de Kennedy en vehículos livianos.', 5.7, 1.6, 3.6], ['Orgánicos', 'canecas', 'Lo que no sirve como alimento va al compostaje, pesado.', -6, 1.3, 4.8]); } },
  mer: { n: 'Mercado experimental', c: '#fb7185', L: 21, W: 15, H: 5.5, d: 'Los productores venden, los estudiantes registran qué llega y qué se vende, y los compradores participan voluntariamente en pruebas.', kp: [['315 m²', 'mercado'], ['12', 'puestos de 9 m²'], ['1', 'puerta barrial']],
    arma(G, E) { for (let k = 0; k < 6; k++) { M.puesto(G, -7.5 + k * 3.0, -5.4, 0, ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#14b8a6'][k]); M.puesto(G, -7.5 + k * 3.0, 0.6, Math.PI, ['#14b8a6', '#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'][k]); }
      M.bascula(G, 8.5, 4.8); M.mesaReunion(G, -6, 5, 3.2, 1.2); M.estiba(G, 8.5, -5.6); M.estiba(G, 8.5, -4.0);
      E.push(['Doce puestos', '3 × 3 m', 'Productores de Kennedy y de las huertas; cada venta se registra.', -0.0, 3.0, -5.4], ['Pasillo de compradores', '120 m²', 'Los compradores participan voluntariamente en pruebas de etiquetas.', 0, 1.8, -2.4],
        ['Demostración', '45 m²', 'Cocina y degustación con lo que el mercado no vendió.', -6, 1.4, 5], ['Pesaje', '18 m²', 'Pesa lo que llega y lo que sobra: de cada 100 kg, cuántos se venden.', 8.5, 1.6, 4.8]); } },
  inc: { n: 'Incubadora agrotech', c: '#a3e635', L: 12, W: 8, H: 3.4, d: 'Emprendimientos de vecinos y egresados que llevan a los mercados lo que funcionó en los ensayos: bioinsumos, empaques, sensores.', kp: [['96 m²', 'propuestos'], ['8', 'puestos de cotrabajo'], ['1', 'sala de prototipos']],
    arma(G, E) { for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { M.escritorio(G, -3.5 + k * 1.8, s * 1.0, 0); M.pc(G, -3.5 + k * 1.8, s * 1.0 + 0.15); M.silla(G, -3.5 + k * 1.8, s * 1.0 + 0.65 * s); }
      M.mesaReunion(G, 3.8, 2.4, 2.4, 1.0); M.estante(G, 4.4, -3.4, 0, C.madera, 1.6); M.frascos(G, 4.4, -3.4, 15); M.mesonLab(G, 2.0, -3.4, 0); M.impresora3d(G, 1.6, -3.4); M.tablero(G, -3.5, 3.85, Math.PI, 3.0);
      E.push(['Puestos de cotrabajo', '8', 'Vecinos y egresados con sus emprendimientos.', -0.8, 1.6, 0], ['Vitrina de productos', 'bioinsumos, empaques, sensores', 'Lo que funcionó en los ensayos, listo para los mercados.', 4.4, 2.3, -3.4],
        ['Banco de prototipos', '1,8 m', 'Ajustes finales antes de producir.', 2.0, 1.5, -3.4], ['Sala de reuniones', '2,4 m', 'Asesoría con la universidad y la asamblea.', 3.8, 1.3, 2.4]); } },
  alim: { n: 'Laboratorio de alimentos', c: '#fde047', L: 12, W: 8, H: 3.4, d: 'Conservación y vida útil: prueba los empaques con nanosensores y aprovecha lo que el mercado no vende.', kp: [['96 m²', 'propuestos'], ['5', 'cabinas sensoriales'], ['1', 'cocina de proceso']],
    arma(G, E) { M.cocina(G, -3.5, -3.4, 0); M.horno(G, -1.6, -3.5, 0); M.deshidratador(G, -0.5, -3.5); M.mesaInox(G, -2.5, -0.8, 0, 2.6); M.mesaInox(G, 1.2, -0.8, 0, 2.0); M.nevera(G, 3.0, -3.5, 0); M.nevera(G, 3.9, -3.5, 0); M.camaraClima(G, 5.0, -3.5, 0);
      for (let k = 0; k < 5; k++) M.cabina(G, -3.6 + k * 1.0, 3.3); M.lavadero(G, 3.6, 3.4, Math.PI);
      E.push(['Cocina de proceso', 'acero inoxidable', 'Conservas, deshidratados y salsas con lo que el mercado no vende.', -2.2, 2.6, -3.4], ['Envasado', 'mesas de acero', 'Empaques con nanosensores de humedad.', -0.6, 1.5, -0.8],
        ['Cámara de vida útil', 'temperatura y humedad', 'Mide cuántos días dura cada alimento en cada empaque.', 5.0, 2.2, -3.5], ['Análisis sensorial', '5 cabinas', 'Vecinos prueban y califican sabor, color y textura.', -1.6, 1.6, 3.3]); } },
  torre: { n: 'Torre de monitoreo ambiental', c: '#22d3ee', L: 8, W: 8, H: 16, silo: true, d: 'Los silos se vuelven torre de sensores (clima, aire, ruido) y mirador. Arriba, la caja nido de la lechuza que controla roedores.', kp: [['16 m', 'de alto'], ['1', 'estación meteorológica'], ['1', 'caja nido con cámara']],
    arma(G, E) { M.escalera(G, 0, 0, 2.6, 14); M.sensorRack(G, -2.4, -1.5); M.sensorRack(G, -2.4, -0.5); caja(G, 0, 14.2, 0, 4, 0.12, 4, C.acero); caja(G, 2.2, 15, 1.4, 0.6, 0.5, 0.5, C.madera);
      E.push(['Escalera al mirador', '16 m', 'Sube al mirador sobre el bosque y las huertas.', 0, 6, 1.4], ['Gabinetes de sensores', 'clima, aire, ruido', 'Concentran la red de sensores del distrito y envían los datos al gemelo digital.', -2.4, 2.4, -1.0],
        ['Caja nido de la lechuza', 'con cámara', 'Arriba, la lechuza que de noche controla los roedores de huertas y compost.', 2.2, 15.4, 1.4]); } }
};
const ORDEN = ['bio', 'nano', 'datos', 'cogn', 'inst', 'foro', 'poli', 'pos', 'mer', 'inc', 'alim', 'torre'];
export { C, M, ED, ORDEN };
