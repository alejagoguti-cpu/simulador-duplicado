"""Huertas de barrio de la propuesta (red distribuida de producción alimentaria) -> data3d/huertas_barrio.json
(lo usa data3d/huertas_barrio.js; también entran a la red biótica como hábitats «huerta», solo con la propuesta).

Sitios:
1. Lotes baldíos de la estrategia E8 (estrategias.json, marco modelo x0,5): se llenan con varios módulos.
2. Parques vecinales y de bolsillo del IDRD (parques.json) de 1.000 a 20.000 m² dentro de Kennedy, a más de 250 m de los
   parques-huerta de la red de colegios: un módulo por parque, repartidos (mínimo 320 m entre huertas).
Cada módulo es un rectángulo de bancales (26x16, 20x12 o 13x9 m), alineado con el parque, a 2 m o más del borde y sin tocar
árboles del censo (copa), canchas, edificios ni agua.
Uso: python tools/huertas_barrio_build.py
"""
import json, math, os
from shapely.geometry import Polygon, Point, box
from shapely import affinity
from shapely.strtree import STRtree

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = lambda f: os.path.join(RAIZ, 'data3d', f)
J = lambda f: json.load(open(D(f), encoding='utf-8'))
lw = lambda x, y: (x - 5341.33, 3161.9 - y)
giro = lambda x, z: (x + 2095.67, z - 109.06)
LAT0, LON0 = 4.640683, -74.149778
MX = 111320 * math.cos(math.radians(4.63)); MY = 110540.0
def xy(lon, lat): return ((lon - LON0) * MX + 2095.67, -(lat - LAT0) * MY - 109.06)
LIM = Polygon([xy(*p) for p in J('kennedy.json')['limite']]).buffer(0)

ES = J('estrategias.json'); esc = ES.get('escala', 0.5)
e8 = [e for e in ES['estrategias'] if e['id'] == 'E8'][0]
bal = [c for c in e8['capas'] if 'bald' in c['n'].lower()][0]
LOTES = []
for fl in bal['lotes']:
    pg = Polygon([lw(fl[k] * esc, fl[k + 1] * esc) for k in range(0, len(fl), 2)]).buffer(0)
    if not pg.is_empty: LOTES.append(pg)
CR = J('colegios_red.json')['huertas']
COLH = [Point(*h['c']) for h in CR]
TIN = Polygon([lw(*q) for q in J('tintal.json')['zona_modelo']]).buffer(30)

PAR = []
for p in J('parques.json'):
    if p.get('tipo') not in ('PARQUE VECINAL', 'PARQUE DE BOLSILLO') or len(p.get('pts') or []) < 4: continue
    pg = Polygon([lw(*q) for q in p['pts']]).buffer(0)
    if pg.geom_type == 'MultiPolygon': pg = max(pg.geoms, key=lambda g: g.area)
    if pg.is_empty or not (1000 <= pg.area <= 20000) or not LIM.contains(pg.representative_point()): continue
    if pg.intersects(TIN) or any(pg.distance(c) < 250 for c in COLH): continue
    PAR.append({'n': p.get('nombre') or 'Parque vecinal', 'pg': pg})
print('lotes', len(LOTES), 'parques candidatos', len(PAR))

ZONA = [x['pg'] for x in PAR] + LOTES
zt = STRtree([z.buffer(15) for z in ZONA])
TR = J('trees.json')['t']
obst = []
for t in TR:
    q = Point(*lw(t[0], t[1]))
    if len(zt.query(q, predicate='intersects')): obst.append(q.buffer(max(3.5, min(7, (t[2] if len(t) > 2 else 3) * 0.9))))
print('árboles cerca', len(obst))
for c in J('canchas.json')['canchas']:
    x, z = giro(*c['c']); r = box(-c['L'] / 2 - 3, -c['W'] / 2 - 3, c['L'] / 2 + 3, c['W'] / 2 + 3)
    q = affinity.translate(affinity.rotate(r, c['a'], use_radians=True, origin=(0, 0)), x, z)
    if len(zt.query(q, predicate='intersects')): obst.append(q)
for b in J('buildings.json'):
    p = b.get('pts')
    if not p or len(p) < 4: continue
    q = Polygon([lw(*t) for t in p])
    if not q.is_valid: q = q.buffer(0)
    if len(zt.query(q, predicate='intersects')): obst.append(q.buffer(3))
for w in J('water_bodies.json'):
    if w.get('pts') and len(w['pts']) > 3:
        q = Polygon([lw(*t) for t in w['pts']]).buffer(0)
        if len(zt.query(q, predicate='intersects')): obst.append(q.buffer(6))
OB = STRtree(obst); print('obstáculos', len(obst))

def eje(pg):  # ángulo del lado largo del rectángulo mínimo
    r = list(pg.minimum_rotated_rectangle.exterior.coords)
    a = max(((r[i], r[i + 1]) for i in range(4)), key=lambda s: math.dist(*s))
    return math.atan2(a[1][1] - a[0][1], a[1][0] - a[0][0])

TAM = [(26, 16), (20, 12), (13, 9)]
def libre(rc, pg_in, ya):
    if not pg_in.contains(rc): return False
    if any(rc.intersects(o) for o in ya): return False
    return not any(obst[i].intersects(rc) for i in OB.query(rc))

def modulo(pg, ya, tams=TAM, paso=2.0):
    ang = eje(pg); pin = pg.buffer(-2)
    if pin.is_empty: return None
    cx, cy = pg.centroid.x, pg.centroid.y
    for L, W in tams:
        mejor = None
        for a in (ang, ang + math.pi / 2):
            base = affinity.rotate(box(-L / 2, -W / 2, L / 2, W / 2), a, use_radians=True, origin=(0, 0))
            x0, y0, x1, y1 = pin.bounds; y = y0
            while y <= y1:
                x = x0
                while x <= x1:
                    if pin.contains(Point(x, y)):
                        rc = affinity.translate(base, x, y)
                        if libre(rc, pin, ya):
                            d = math.hypot(x - cx, y - cy)
                            if not mejor or d < mejor[0]: mejor = (d, x, y, a, L, W, rc)
                    x += paso
                y += paso
        if mejor: return mejor
    return None

R = lambda v: round(v, 2)
OUT = []
for k, pg in enumerate(LOTES):  # lotes baldíos: varios módulos
    ya, mods = [], []
    for _ in range(8):
        m = modulo(pg, [r.buffer(3) for r in ya], tams=TAM[:2], paso=3.0)
        if not m: break
        _, x, y, a, L, W, rc = m; ya.append(rc); mods.append({'c': [R(x), R(y)], 'a': round(a, 4), 'l': L, 'w': W})
    if mods: OUT.append({'n': 'Huerta en lote baldío', 'tipo': 'lote', 'm': mods})
    print('lote', k, round(pg.area), len(mods))
PAR.sort(key=lambda p: -p['pg'].area)
puestos = [Point(*h['m'][0]['c']) for h in OUT]
for p in PAR:
    c = p['pg'].centroid
    if any(c.distance(q) < 320 for q in puestos): continue
    m = modulo(p['pg'], [])
    if not m: continue
    _, x, y, a, L, W, rc = m
    OUT.append({'n': 'Huerta del parque ' + p['n'].replace('PARQUE ', '').title() if p['n'] else 'Huerta de parque', 'tipo': 'parque', 'm': [{'c': [R(x), R(y)], 'a': round(a, 4), 'l': L, 'w': W}]})
    puestos.append(Point(x, y))
    if len(OUT) >= 48: break
area = sum(m['l'] * m['w'] for h in OUT for m in h['m'])
print('huertas', len(OUT), 'módulos', sum(len(h['m']) for h in OUT), 'm2', area)
json.dump({'fuente': 'tools/huertas_barrio_build.py: lotes baldíos E8 + parques vecinales y de bolsillo (IDRD), sin árboles, canchas, edificios ni agua',
           'area': area, 'huertas': OUT}, open(D('huertas_barrio.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
