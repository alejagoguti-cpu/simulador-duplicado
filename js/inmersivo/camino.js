// Camino de camara del recorrido: llegada, umbral, cuatro equipos y plano final.
// Cada parada tiene posicion, mirada, campo visual y el texto que la acompana.
import * as THREE from 'three';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function crearCamino(E0, EQ) {
  const { L, W, H } = E0;
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const P = [];
  const add = (pos, look, fov, eyebrow, titulo, texto, med = '', eq = -1) =>
    P.push({ pos, look, fov, eyebrow, titulo, texto, med, eq });

  if (E0.silo) {
    const r = L / 2;
    add(v(r * 0.55, 1.7, r * 1.95), v(0, H * 0.42, 0), 50, 'Bavaria Común · por dentro', E0.n, E0.d, '');
    add(v(2.7, 1.66, 0.6), v(-2.4, 1.2, -1.2), 66, '01 · La base', 'Sensores y escalera', 'Los gabinetes de clima, aire y ruido concentran la red del distrito; la escalera sube al mirador.', '2,4 m');
    add(v(2.7, 6.4, 1.1), v(-1.8, 6.2, -1.4), 60, '02 · A media altura', 'La torre por dentro', 'Los silos de la antigua fábrica se vuelven torre de monitoreo: cada nivel tiene su propia luz y su sensor.', '6,4 m');
    add(v(2.6, 13.4, 1.2), v(2.2, 15.3, 1.4), 54, '03 · Arriba', 'Caja nido de la lechuza', 'Con cámara y sin molestar: la lechuza que de noche controla los roedores de huertas y compost.', '15,4 m');
    add(v(0.9, 15.2, 0.9), v(-14, 14.5, -14), 58, 'Fin del recorrido', 'El mirador', 'Por la boca del silo se leen el bosque, las huertas y los edificios del distrito. Desliza para volver a subir.', '16 m');
    return P;
  }

  const total = EQ.length;
  const want = Math.min(4, total);
  const idx = [];
  for (let k = 0; k < want; k++) {
    const i = want === 1 ? 0 : Math.round(k * (total - 1) / (want - 1));
    if (!idx.includes(i)) idx.push(i);
  }

  let n;
  if (E0.malla) {
    // invernadero: se entra sin atravesar el policarbonato
    add(v(0, 1.7, W / 2 - 1.6), v(0, 1.28, -1.2), 62, 'Bavaria Común · por dentro', E0.n, E0.d, '');
    n = 1;
  } else {
    // llegada en tres cuartos: fachada y costado, con la plaza en primer plano
    add(
      v(L * 0.52, 1.62, W / 2 + Math.max(7.0, W * 1.05)),
      v(0, Math.min(H * 0.42, 1.58), 0.2),
      50,
      'Bavaria Común · por dentro', E0.n, E0.d, ''
    );
    // umbral: se cruza la puerta y se mira en diagonal hacia el interior
    add(
      v(0, 1.62, W / 2 - 0.7),
      v(-W * 0.42, 1.3, -W * 0.32),
      63,
      '01 · El umbral', 'Entrar',
      'La puerta queda abierta y la luz de la tarde entra por las ventanas. Desliza para recorrer el espacio.',
      ''
    );
    n = 2;
  }

  for (const i of idx) {
    const [nombre, med, txt, x, y, z] = EQ[i];
    const centro = Math.abs(z) < 1.15 && Math.abs(x) < Math.max(1.6, L * 0.16);
    const paredZ = Math.abs(z) > W / 2 - 1.35;
    const paredX = Math.abs(x) > L / 2 - 1.35;
    let px, pz;
    if (centro) {
      // equipos de isla: se miran de costado para que la mesa no tape el fondo
      px = x + (x >= 0 ? -2.7 : 2.7);
      pz = z + 0.35;
    } else if (paredZ && y < 1.7) {
      // equipo bajo de muro: cámara en el pasillo junto al muro, sin mesón delante
      px = clamp(x + (x >= 0 ? -1.2 : 1.2), -L / 2 + 1.0, L / 2 - 1.0);
      pz = z + (z > 0 ? -1.3 : 1.3);
    } else if (paredZ) {
      // equipo alto de muro: cámara en el pasillo central, por encima del mesón
      px = x * 0.55;
      pz = z > 0 ? z - 3.0 : z + 3.0;
    } else if (paredX && y < 1.7) {
      px = x + (x > 0 ? -1.3 : 1.3);
      pz = clamp(z + (z >= 0 ? -1.4 : 1.4), -W / 2 + 1.0, W / 2 - 1.0);
    } else if (paredX) {
      px = x * 0.55;
      pz = z > 0 ? z - 2.8 : z + 2.8;
    } else {
      px = x;
      pz = z + (z >= 0 ? -1.6 : 1.6);
    }
    px = clamp(px, -L / 2 + 1.0, L / 2 - 1.0);
    pz = clamp(pz, -W / 2 + 1.0, W / 2 - 1.0);
    // si la etiqueta cae entre dos máquinas, apuntar a la de la derecha
    const lx = paredZ && Math.abs(x) < 0.6 ? x + 0.4 : x;
    add(
      v(px, clamp(y + 0.04, 1.5, 1.78), pz),
      v(lx, Math.max(0.55, y * 0.72), z),
      48,
      `0${n} · En detalle`, nombre, txt, med, i
    );
    n++;
  }

  add(
    v(-L / 2 + 1.25, 2.0, W / 2 - 1.2),
    v(L * 0.08, 1.0, -W * 0.22),
    68,
    'Fin del recorrido', 'El edificio completo',
    'Ya recorriste el interior. Desliza para volver a entrar o elige otro edificio en la barra de arriba.',
    E0.kp.map((k) => k[0]).join(' · ')
  );
  return P;
}
