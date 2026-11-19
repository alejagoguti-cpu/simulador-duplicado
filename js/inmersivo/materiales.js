// Biblioteca de materiales PBR del interior. Las claves son los colores del
// programa original (C.*), de modo que los equipos no cambian de sitio ni de
// color: solo pasan de puntos a superficies con luz y reflejos.
import * as THREE from 'three';

export function crearMateriales(T) {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const fis = (o) => new THREE.MeshPhysicalMaterial(o);

  const M = {
    piso: fis({
      map: T.concreto, normalMap: T.concretoN, roughnessMap: T.concretoR,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 1, metalness: 0.02, clearcoat: 0.22, clearcoatRoughness: 0.42,
      envMapIntensity: 0.6, color: 0xc7c1b5
    }),
    pisoC: fis({
      map: T.concreto, normalMap: T.concretoN, roughnessMap: T.concretoR,
      normalScale: new THREE.Vector2(0.25, 0.25),
      roughness: 0.62, metalness: 0.03, clearcoat: 0.3, clearcoatRoughness: 0.32,
      envMapIntensity: 0.75, color: 0xd8d3c8
    }),
    muro: std({
      map: T.yeso, normalMap: T.yesoN, normalScale: new THREE.Vector2(0.42, 0.42),
      roughness: 0.94, metalness: 0.0, envMapIntensity: 0.35, color: 0xd6cfc2
    }),
    techo: std({
      map: T.techo, normalMap: T.techoN, normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.93, metalness: 0.0, envMapIntensity: 0.35, color: 0xd2cdc2
    }),
    vidrio: fis({
      color: 0xeef7fa, roughness: 0.02, metalness: 0,
      transparent: true, opacity: 0.07, envMapIntensity: 1.4,
      clearcoat: 0.55, clearcoatRoughness: 0.03,
      side: THREE.DoubleSide, depthWrite: false
    }),
    vidrioLab: fis({
      color: 0xffffff, roughness: 0.06, metalness: 0,
      transparent: true, opacity: 0.16, envMapIntensity: 0.5,
      clearcoat: 0.15, clearcoatRoughness: 0.05,
      side: THREE.DoubleSide, depthWrite: false
    }),
    policarbonato: fis({
      color: 0xe7f0ea, roughness: 0.3, metalness: 0,
      transparent: true, opacity: 0.3, envMapIntensity: 1.2,
      side: THREE.DoubleSide, depthWrite: false
    }),
    acero: std({
      color: 0xc7ccd1, metalness: 0.95, roughness: 0.34,
      roughnessMap: T.metalR, envMapIntensity: 1.5
    }),
    inox: std({
      color: 0xdde1e4, metalness: 1.0, roughness: 0.22,
      roughnessMap: T.metalR, envMapIntensity: 1.7
    }),
    blanco: std({ color: 0xd9dcd8, roughness: 0.5, metalness: 0.02, envMapIntensity: 0.7, roughnessMap: T.metalR, normalMap: T.yesoN, normalScale: new THREE.Vector2(0.1, 0.1) }),
    negro: std({ color: 0x1d2022, roughness: 0.46, metalness: 0.1, envMapIntensity: 0.6 }),
    gris: std({ color: 0x767d82, roughness: 0.5, metalness: 0.3, envMapIntensity: 0.8 }),
    madera: std({ map: T.madera, normalMap: T.maderaN, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.52, metalness: 0.0, envMapIntensity: 0.45 }),
    maderaC: std({ map: T.maderaClara, normalMap: T.maderaClaraN, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.48, metalness: 0.0, envMapIntensity: 0.45 }),
    verde: std({ color: 0x4f8f45, roughness: 0.66, metalness: 0.0 }),
    hoja: std({ color: 0x5c9a49, roughness: 0.72, metalness: 0.0 }),
    tierra: std({ color: 0x4e3a2b, roughness: 1.0, metalness: 0.0 }),
    azul: std({ color: 0x3b82f6, roughness: 0.36, metalness: 0.05 }),
    rojo: std({ color: 0xd9473b, roughness: 0.38, metalness: 0.04 }),
    amar: std({ color: 0xf2c43a, roughness: 0.38, metalness: 0.05 }),
    naranja: std({ color: 0xf08a24, roughness: 0.4, metalness: 0.04 }),
    pantalla: std({ color: 0x05080c, roughness: 0.26, metalness: 0.1, emissive: 0xffffff, emissiveMap: T.pantalla, emissiveIntensity: 1.5 }),
    luz: std({ color: 0xfff8ea, emissive: 0xfff1d8, emissiveIntensity: 2.6, roughness: 0.5, metalness: 0 }),
    cesped: std({ map: T.cesped, normalMap: T.cespedN, normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.96, metalness: 0 }),
    pavimento: std({ map: T.pavimento, normalMap: T.pavimentoN, normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.82, metalness: 0.02, color: 0xcfc9bd }),
    grava: std({ map: T.grava, normalMap: T.gravaN, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.98, metalness: 0 }),
    tronco: std({ color: 0x5d4933, roughness: 0.96, metalness: 0 }),
    teja: std({ color: 0x8b8f88, roughness: 0.85, metalness: 0.05 }),
    follaje: std({ map: T.hoja, alphaTest: 0.38, side: THREE.DoubleSide, roughness: 0.78, metalness: 0.0, color: 0xffffff }),
    hierba: std({ map: T.hierba, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.85, metalness: 0.0, color: 0xffffff })
  };

  // material para cualquier color de equipo que no tenga clave propia
  const cache = new Map();
  const plasticos = new Map();
  function deColor(c) {
    if (M[c]) return M[c];
    const k = String(c).toLowerCase();
    if (plasticos.has(k)) return plasticos.get(k);
    const col = new THREE.Color(k);
    const hsl = {}; col.getHSL(hsl);
    const m = std({
      color: col,
      roughness: 0.32 + (1 - hsl.l) * 0.2,
      metalness: 0.03,
      envMapIntensity: 0.7
    });
    plasticos.set(k, m);
    return m;
  }

  function nombre(n) { return M[n] || deColor(n); }
  return { M, deColor, nombre };
}
