"""Bavaria Común en puntos -> data3d/puntos/bavaria_campo.bin + bavaria_campo.json (los usa bavaria_puntos.html)

1. Captura (en el simulador, con la propuesta y el distrito Bavaria Común prendidos): vista peatonal en el campo experimental,
   color + profundidad EXACTA del 3D (huertas, invernaderos, árboles existentes del censo y edificios):
     node tools/puntos/cdp_captura.mjs http://127.0.0.1:8795/index.html tools/cache/puntos_bavaria_cap.json 115 tools/puntos/captura_bavaria.js
2. python tools/puntos/bavaria_puntos_build.py
   - guarda los puntos (int16 cada 4 cm, relativos al ojo + color RGB),
   - ubica cada especie sobre el punto 3D que está en su píxel de la vista,
   - fotos de iNaturalist con licencia libre (CC) de cada especie, con su atribución.
"""
import json, math, os, base64, urllib.request, urllib.parse
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
E = [
    ['lechuga', 'Lechuga', 'Lactuca sativa', 'cultivo', 560, 700, 0.3, '#a3e635', 'Se cosecha a las 6–8 semanas; va al mercado del distrito y a los comedores escolares.', 'Camas elevadas con compost del distrito.', 'Las mariquitas la protegen de los pulgones; no necesita plaguicidas.'],
    ['acelga', 'Acelga', 'Beta vulgaris var. cicla', 'cultivo', 150, 730, 0.3, '#84cc16', 'Hoja que se corta y vuelve a crecer: cosecha continua para la cocina escolar.', 'Suelo vivo con lombrices.', 'Las aves insectívoras controlan las orugas que la comen.'],
    ['fresa', 'Fresa', 'Fragaria × ananassa', 'cultivo', 330, 515, 0.25, '#f43f5e', 'Fruta para comer en el lugar: los niños la cosechan en las salidas de campo.', 'Flores blancas que atraen abejas.', 'Con abejas polinizando, frutos más grandes y parejos.'],
    ['tomate', 'Tomate', 'Solanum lycopersicum', 'cultivo', 400, 425, 0.6, '#ef4444', 'En el invernadero de túnel: protegido del frío de la sabana.', 'Flores que solo suelta el zumbido del abejorro.', 'Polinizado por abejorro nativo, sin vibrador eléctrico.'],
    ['calendula', 'Caléndula', 'Calendula officinalis', 'flor', 120, 505, 0.3, '#f59e0b', 'Franja de flores entre camas: comida para polinizadores y planta medicinal.', 'Néctar y polen todo el año.', 'Más abejas, mariposas y mariquitas en todo el campo.'],
    ['abeja', 'Abeja de miel', 'Apis mellifera', 'fauna', 200, 482, 1.1, '#facc15', 'Poliniza fresa, caléndula y las flores del eucalipto; sale del apiario del distrito.', 'Franjas de flores y el apiario inteligente.', 'Fresa y hortalizas de flor; miel para el mercado.'],
    ['abejorro', 'Abejorro', 'Bombus atratus', 'fauna', 470, 455, 1.0, '#eab308', 'Poliniza por zumbido el tomate y la fresa; es nativo de la sabana.', 'Nidos de abejorro nativo y flores tubulares.', 'Tomate del invernadero.'],
    ['mariposa', 'Mariposa', 'Vanessa cardui', 'fauna', 265, 470, 1.6, '#fb923c', 'Visita la caléndula; sus orugas viven en plantas nativas del borde.', 'Franjas de flores y borde nativo.', 'Indicador de un campo sin plaguicidas.'],
    ['colibri', 'Colibrí', 'Colibri coruscans', 'fauna', 600, 395, 1.8, '#22d3ee', 'Poliniza flores tubulares junto a los invernaderos.', 'Flores tubulares y perchas cerca.', 'Flores nativas del borde.'],
    ['mariquita', 'Mariquita', 'Coccinellidae', 'fauna', 760, 640, 0.35, '#dc2626', 'Se come los pulgones de la lechuga y la acelga: control natural de plagas.', 'Hoteles de insectos y franjas de flores.', 'Lechuga y acelga sanas.'],
    ['lombriz', 'Lombriz roja', 'Eisenia fetida', 'fauna', 660, 785, 0.05, '#b87c8c', 'Convierte el compost del distrito en suelo fértil para las camas.', 'Compost y suelo húmedo con materia orgánica.', 'Todas las camas: suelo vivo.'],
    ['copeton', 'Copetón', 'Zonotrichia capensis', 'fauna', 940, 452, 0.25, '#a3a3a3', 'Come semillas de maleza e insectos entre las camas.', 'Árboles existentes para posarse y nidos.', 'Menos malezas y orugas.'],
    ['mirla', 'Mirla patiamarilla', 'Turdus fuscater', 'fauna', 1120, 440, 0.3, '#78716c', 'Busca lombrices e insectos en el suelo húmedo del borde del bosque.', 'Árboles existentes y suelo con lombrices.', 'Control de babosas y orugas.'],
    ['cernicalo', 'Cernícalo', 'Falco sparverius', 'fauna', 1250, 125, 0.6, '#f97316', 'Caza ratones y saltamontes desde las ramas altas.', 'Perchas altas y árboles existentes.', 'Menos roedores en las camas y en el compost.'],
    ['lechuza', 'Lechuza', 'Tyto alba', 'fauna', 1395, 215, 0.5, '#e7e5e4', 'De noche controla roedores; anida en la caja de los silos.', 'Caja nido en los silos y bosque.', 'Cosecha y compost sin ratas.'],
    ['murcielago', 'Murciélago', 'Glossophaga soricina', 'fauna', 860, 170, 0.6, '#a78bfa', 'Al anochecer come polillas y poliniza flores nocturnas.', 'Refugios de murciélagos en los árboles.', 'Menos polillas en el invernadero.'],
    ['eucalipto', 'Eucalipto', 'Eucalyptus globulus', 'arbol', 1310, 250, 2.0, '#4d7c0f', 'Árbol existente del bosque de Bavaria: se conserva. Sus flores dan néctar a las abejas en invierno.', 'Ya está: no se tala.', 'Percha del cernícalo y alimento de abejas.'],
    ['acacia', 'Acacia negra', 'Acacia melanoxylon', 'arbol', 1010, 255, 2.0, '#65a30d', 'Árbol existente: sombra y nido para copetones y mirlas al borde de las huertas.', 'Ya está: no se tala.', 'Nidos de aves insectívoras.'],
    ['urapan', 'Urapán', 'Fraxinus uhdei', 'arbol', 770, 235, 2.0, '#3f6212', 'Árbol existente: refugio de aves y murciélagos junto al campo.', 'Ya está: no se tala.', 'Refugio de murciélagos.'],
]
# relaciones críticas que fomenta el campo: [quién, a quién, tipo]
REL = [['abeja', 'fresa', 'Polinización'], ['abeja', 'calendula', 'Polinización'], ['abeja', 'eucalipto', 'Polinización'], ['abejorro', 'tomate', 'Polinización'],
       ['abejorro', 'fresa', 'Polinización'], ['mariposa', 'calendula', 'Polinización'], ['colibri', 'calendula', 'Polinización'], ['mariquita', 'lechuga', 'Control de plagas'],
       ['mariquita', 'acelga', 'Control de plagas'], ['lombriz', 'lechuga', 'Suelo vivo'], ['lombriz', 'acelga', 'Suelo vivo'], ['mirla', 'lombriz', 'Depredación'],
       ['copeton', 'acelga', 'Control de plagas'], ['copeton', 'acacia', 'Refugio'], ['mirla', 'acacia', 'Refugio'], ['cernicalo', 'eucalipto', 'Percha'],
       ['lechuza', 'urapan', 'Refugio'], ['murcielago', 'urapan', 'Refugio'], ['murcielago', 'tomate', 'Control de plagas'], ['cernicalo', 'lechuga', 'Control de plagas']]
TIPOS = {'Polinización': '#facc15', 'Control de plagas': '#f87171', 'Suelo vivo': '#c084fc', 'Depredación': '#fb923c', 'Refugio': '#4ade80', 'Percha': '#38bdf8'}
FOTOS0 = json.load(open(os.path.join(RAIZ, 'data3d', 'especies_fotos.json'), encoding='utf-8'))['esp']
out = []
for k, nom, sci, g, x, y, dy, c, hace, atrae, prospera in E:
    fo = {'url': FOTOS0[k], 'atr': 'Red de relaciones bióticas del Humedal El Burro / iNaturalist'} if k in FOTOS0 else foto(sci.replace(' var. cicla', '').replace('× ', ''))
    out.append({'k': k, 'n': nom, 'sci': sci, 'g': g, 'p': punto(x, y, dy), 'c': c, 'hace': hace, 'atrae': atrae, 'prospera': prospera, 'foto': fo})
    print(k, out[-1]['p'], (fo or {}).get('lic', '-'))
meta = {'fuente': 'Captura del simulador (propuesta, distrito Bavaria Común): color y profundidad del 3D; tools/puntos/bavaria_puntos_build.py',
        'n': n, 'esc': CAP['esc'], 'eye': CAP['eye'], 'look': CAP['look'], 'fov': CAP['fov'], 'W': W, 'H': H,
        'especies': out, 'rel': REL, 'tipos': TIPOS}
json.dump(meta, open(os.path.join(RAIZ, 'data3d', 'puntos', 'bavaria_campo.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('puntos', n, 'especies', len(out), 'relaciones', len(REL), 'MB', round(len(raw) / 1e6, 1))
