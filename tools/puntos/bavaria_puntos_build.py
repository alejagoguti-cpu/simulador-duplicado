"""Bavaria Común en puntos -> data3d/puntos/bavaria_campo.bin + bavaria_campo.json (los usa bavaria_puntos.html)

1. Captura (en el simulador, con la propuesta y el distrito Bavaria Común prendidos): vista peatonal en el campo experimental,
   color + profundidad EXACTA del 3D (huertas, invernaderos, árboles existentes del censo y edificios):
     node tools/puntos/cdp_captura.mjs http://127.0.0.1:8795/index.html tools/cache/puntos_bavaria_cap.json 115 tools/puntos/captura_bavaria.js
2. python tools/puntos/bavaria_puntos_build.py
   - guarda los puntos (int16 cada 4 cm, relativos al ojo + color RGB),
   - ubica cada especie sobre el punto 3D que está en su píxel de la vista,
   - fotos de iNaturalist con licencia libre (CC) de cada especie, con su atribución.
"""
import json, math, os, re, base64, urllib.request, urllib.parse
import numpy as np

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
CAP = json.load(open(os.path.join(RAIZ, 'tools', 'cache', 'puntos_bavaria_cap.json'), encoding='utf-8'))
n, W, H = CAP['n'], CAP['W'], CAP['H']
raw = base64.b64decode(CAP['pts'])
P = np.frombuffer(raw[:n * 6], dtype=np.int16).reshape(n, 3).astype(np.float32) * CAP['esc']
os.makedirs(os.path.join(RAIZ, 'data3d', 'puntos'), exist_ok=True)
open(os.path.join(RAIZ, 'data3d', 'puntos', 'bavaria_campo.bin'), 'wb').write(raw)

# proyección de cada punto a su píxel (misma cámara de la captura)
eye, look = np.array(CAP['eye'], np.float32), np.array(CAP['look'], np.float32)
f = look - eye; f /= np.linalg.norm(f); r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
z = P @ f; tY = math.tan(math.radians(CAP['fov'] / 2)); tX = tY * W / H
px = ((P @ r) / z / tX + 1) / 2 * W; py = (1 - (P @ u) / z / tY) / 2 * H
def punto(x, y, dy=0.0):
    d2 = (px - x) ** 2 + (py - y) ** 2; m = d2 < 49
    if not m.any(): m = d2 < 400
    i = np.where(m)[0]; k = i[np.argmin(z[i])]  # el más cercano a la cámara en ese píxel
    q = P[k].copy(); q[1] += dy; return [round(float(v), 2) for v in q]

def foto(sci):
    try:
        q = 'https://api.inaturalist.org/v1/taxa?per_page=1&q=' + urllib.parse.quote(sci)
        t = json.load(urllib.request.urlopen(urllib.request.Request(q, headers={'User-Agent': 'simulador-kennedy'}), timeout=20))['results'][0]
        d = json.load(urllib.request.urlopen(urllib.request.Request(f"https://api.inaturalist.org/v1/taxa/{t['id']}", headers={'User-Agent': 'simulador-kennedy'}), timeout=20))['results'][0]
        for tp in d.get('taxon_photos', []):
            p = tp['photo']
            if p.get('license_code'): return {'url': p['medium_url'], 'atr': p['attribution'], 'lic': p['license_code']}
    except Exception as e: print('foto', sci, e)
    return None

# especies: [clave, nombre, científico, grupo, píxel x, y, altura sobre el punto, color, qué hace aquí, qué la atrae, qué prospera con ella]
E = [  # píxeles sobre la captura de la huerta docente de hortalizas (vista hacia los frutales y el bosque comestible)
    ['lechuga', 'Lechuga', 'Lactuca sativa', 'cultivo', 800, 720, 0.25, '#a3e635', 'Se cosecha a las 6–8 semanas: la primera práctica de los cursos de Bavaria; va a los comedores escolares.', 'Camas elevadas con compost del distrito.', 'Las mariquitas la protegen de los pulgones; no necesita plaguicidas.'],
    ['morada', 'Lechuga morada', 'Lactuca sativa var. crispa', 'cultivo', 925, 500, 0.2, '#be185d', 'Variedad de color: se enseña a comparar rendimiento y sabor con la verde.', 'Suelo vivo y riego por goteo.', 'Más diversidad en la cama: menos plagas.'],
    ['acelga', 'Acelga', 'Beta vulgaris var. cicla', 'cultivo', 430, 660, 0.35, '#65a30d', 'Hoja que se corta y vuelve a crecer: cosecha continua para la cocina escolar.', 'Suelo con lombrices.', 'Las aves insectívoras controlan las orugas que la comen.'],
    ['zanahoria', 'Zanahoria', 'Daucus carota', 'cultivo', 150, 612, 0.25, '#f97316', 'Raíz que enseña a leer el suelo: si está compacto, sale torcida.', 'Suelo suelto con compost maduro.', 'Si se deja florecer, sus flores atraen avispas que comen pulgones.'],
    ['cilantro', 'Cilantro en flor', 'Coriandrum sativum', 'flor', 1320, 572, 0.3, '#f5f5f4', 'Se deja florecer una franja: sus flores blancas son comida para abejas y mariposas.', 'Néctar y polen pequeños, fáciles para insectos.', 'Más polinizadores y más enemigos naturales de las plagas en toda la huerta.'],
    ['tomate', 'Tomate', 'Solanum lycopersicum', 'cultivo', 60, 420, 0.8, '#ef4444', 'En el invernadero: protegido del frío de la sabana.', 'Flores que solo suelta el zumbido del abejorro.', 'Polinizado por abejorro nativo, sin vibrador eléctrico.'],
    ['abeja', 'Abeja de miel', 'Apis mellifera', 'fauna', 1300, 520, 1.0, '#facc15', 'Va del cilantro en flor a las flores de los árboles; sale del apiario del distrito.', 'Franjas de flores y el apiario.', 'Semillas y frutos más parejos; miel para el mercado.'],
    ['abejorro', 'Abejorro', 'Bombus atratus', 'fauna', 95, 400, 1.0, '#eab308', 'Poliniza por zumbido el tomate del invernadero; es nativo de la sabana.', 'Nidos de abejorro nativo y flores tubulares.', 'Tomate del invernadero.'],
    ['mariposa', 'Mariposa', 'Vanessa cardui', 'fauna', 1180, 500, 1.4, '#fb923c', 'Toma néctar del cilantro en flor; sus orugas viven en plantas nativas del borde.', 'Franjas de flores y borde nativo.', 'Indicador de una huerta sin plaguicidas.'],
    ['colibri', 'Colibrí', 'Colibri coruscans', 'fauna', 240, 380, 1.8, '#22d3ee', 'Busca néctar en las flores de los árboles del borde y en las tubulares del jardín de polinizadores.', 'Flores tubulares y perchas cerca.', 'Flores nativas del borde.'],
    ['mariquita', 'Mariquita', 'Coccinellidae', 'fauna', 780, 690, 0.35, '#dc2626', 'Se come los pulgones de la lechuga y la acelga: control natural de plagas.', 'Hoteles de insectos y franjas de flores.', 'Lechuga y acelga sanas.'],
    ['lombriz', 'Lombriz roja', 'Eisenia fetida', 'fauna', 300, 772, 0.05, '#b87c8c', 'Convierte el compost del distrito en suelo fértil para las camas.', 'Compost y suelo húmedo con materia orgánica.', 'Todas las camas: suelo vivo.'],
    ['copeton', 'Copetón', 'Zonotrichia capensis', 'fauna', 650, 600, 0.15, '#a3a3a3', 'Salta entre las camas comiendo semillas de maleza e insectos.', 'Árboles existentes para posarse y anidar.', 'Menos malezas y orugas.'],
    ['mirla', 'Mirla patiamarilla', 'Turdus fuscater', 'fauna', 690, 520, 0.2, '#78716c', 'Busca lombrices e insectos en el suelo húmedo de los caminos.', 'Árboles existentes y suelo con lombrices.', 'Control de babosas y orugas.'],
    ['murcielago', 'Murciélago', 'Glossophaga soricina', 'fauna', 1100, 250, 0.6, '#a78bfa', 'Al anochecer come polillas y poliniza flores nocturnas.', 'Refugios de murciélagos en los árboles.', 'Menos polillas en el invernadero.'],
    ['eucalipto', 'Eucalipto', 'Eucalyptus globulus', 'arbol', 1300, 200, 2.0, '#4d7c0f', 'Árbol existente del bosque de Bavaria: se conserva. Sus flores dan néctar a las abejas en invierno.', 'Ya está: no se tala.', 'Alimento de abejas y percha de aves.'],
    ['acacia', 'Acacia negra', 'Acacia melanoxylon', 'arbol', 180, 230, 2.0, '#65a30d', 'Árbol existente: sombra y nido para copetones y mirlas al borde de las huertas.', 'Ya está: no se tala.', 'Nidos de aves insectívoras.'],
    ['urapan', 'Urapán', 'Fraxinus uhdei', 'arbol', 760, 330, 2.0, '#3f6212', 'Árbol existente: refugio de aves y murciélagos junto al campo.', 'Ya está: no se tala.', 'Refugio de murciélagos.'],
]
# relaciones críticas que fomenta el campo: [quién, a quién, tipo]
REL = [['abeja', 'cilantro', 'Polinización'], ['abeja', 'eucalipto', 'Polinización'], ['abejorro', 'tomate', 'Polinización'], ['mariposa', 'cilantro', 'Polinización'], ['colibri', 'eucalipto', 'Polinización'], ['mariquita', 'lechuga', 'Control de plagas'], ['mariquita', 'acelga', 'Control de plagas'], ['mariquita', 'morada', 'Control de plagas'], ['lombriz', 'lechuga', 'Suelo vivo'], ['lombriz', 'zanahoria', 'Suelo vivo'], ['mirla', 'lombriz', 'Depredación'], ['copeton', 'acelga', 'Control de plagas'], ['copeton', 'acacia', 'Refugio'], ['mirla', 'urapan', 'Refugio'], ['murcielago', 'urapan', 'Refugio'], ['murcielago', 'tomate', 'Control de plagas']]
TIPOS = {'Polinización': '#facc15', 'Control de plagas': '#f87171', 'Suelo vivo': '#c084fc', 'Depredación': '#fb923c', 'Refugio': '#4ade80'}
FOTOS0 = json.load(open(os.path.join(RAIZ, 'data3d', 'especies_fotos.json'), encoding='utf-8'))['esp']
out = []
for k, nom, sci, g, x, y, dy, c, hace, atrae, prospera in E:
    fo = {'url': FOTOS0[k], 'atr': 'Red de relaciones bióticas del Humedal El Burro / iNaturalist'} if k in FOTOS0 else foto(re.sub(r' var\. \w+', '', sci).replace('× ', ''))
    out.append({'k': k, 'n': nom, 'sci': sci, 'g': g, 'p': punto(x, y, dy), 'c': c, 'hace': hace, 'atrae': atrae, 'prospera': prospera, 'foto': fo})
    print(k, out[-1]['p'], (fo or {}).get('lic', '-'))
# la fauna va pegada a la planta con la que interactúa (el píxel puede caer en un fondo lejano)
JUNTO = {'abeja': ('cilantro', 0.5, 0.9, 0.4), 'mariposa': ('cilantro', -0.9, 1.3, 0.8), 'colibri': ('cilantro', 1.6, 1.7, 1.2), 'abejorro': ('tomate', -1.2, 1.1, -1.5),
         'mariquita': ('lechuga', 0.15, 0.22, 0.1), 'lombriz': ('lechuga', -0.35, -0.3, 0.3)}  # copetón y mirla: su píxel ya cae en el camino de viruta
PK = {o['k']: o for o in out}
for k, (b, dx, dy, dz) in JUNTO.items():
    if k in PK and b in PK: q = PK[b]['p']; PK[k]['p'] = [round(q[0] + dx, 2), round(q[1] + dy, 2), round(q[2] + dz, 2)]
meta = {'fuente': 'Captura del simulador (propuesta, distrito Bavaria Común): color y profundidad del 3D; tools/puntos/bavaria_puntos_build.py',
        'n': n, 'esc': CAP['esc'], 'eye': CAP['eye'], 'look': CAP['look'], 'fov': CAP['fov'], 'W': W, 'H': H,
        'especies': out, 'rel': REL, 'tipos': TIPOS}
json.dump(meta, open(os.path.join(RAIZ, 'data3d', 'puntos', 'bavaria_campo.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('puntos', n, 'especies', len(out), 'relaciones', len(REL), 'MB', round(len(raw) / 1e6, 1))
