#!/usr/bin/env python3
"""R1378 네온·라우렌 임시 3D 창 GLB 만들기(코드로 만든 임시판 — Dots 정식 GLB 가 오면 같은 이름으로 바꿔 끼움).
Armory 규격: 단위 m, 원점 = GripSocket, +Y = 창끝(BladeTip), 넓은 면 ±X. 필수 확장 없음.
실행: python3 scripts/r1378-weapon-glb.py  → r96/runtime-text/assets/r1378/*.glb
"""
import json, math, struct, os
RAD = 1.7  # R1378 헤드리스 전후 장면: 1배 굵기는 60px 키에서 자루가 1px 아래라 안 보였음
OUT = os.path.join(os.path.dirname(__file__), '..', 'r96', 'runtime-text', 'assets', 'r1378')

class Mesh:
    def __init__(s): s.tris = []  # (mat, (p0,p1,p2))
    def tri(s, m, a, b, c): s.tris.append((m, (a, b, c)))
    def quad(s, m, a, b, c, d): s.tri(m, a, b, c); s.tri(m, a, c, d)

def lathe(M, mat, prof, seg=12, rot=0.0):
    """prof = [(y, r)…] 아래→위. 옆면 + 열린 끝 마개."""
    ring = lambda y, r: [(r*math.cos(rot+2*math.pi*k/seg), y, r*math.sin(rot+2*math.pi*k/seg)) for k in range(seg)]
    rings = [ring(y, r) for y, r in prof]
    for a, b in zip(rings, rings[1:]):
        for k in range(seg):
            k2 = (k+1) % seg; M.quad(mat, a[k], a[k2], b[k2], b[k])
    for (y, r), rg, top in ((prof[0], rings[0], False), (prof[-1], rings[-1], True)):
        if r > 1e-6:
            c = (0, y, 0)
            for k in range(seg):
                k2 = (k+1) % seg
                (M.tri(mat, c, rg[k2], rg[k]) if top else M.tri(mat, c, rg[k], rg[k2]))

def blade(M, mat, prof, x0=0.0):
    """다이아몬드 단면 날: prof = [(y, 반폭 w, 반두께 t)…], 폭은 ±X, 두께는 ±Z."""
    sec = [[(x0+w, y, 0), (x0, y, t), (x0-w, y, 0), (x0, y, -t)] for y, w, t in prof]
    for a, b in zip(sec, sec[1:]):
        for k in range(4):
            k2 = (k+1) % 4; M.quad(mat, a[k], a[k2], b[k2], b[k])
    a = sec[0]; M.quad(mat, a[0], a[3], a[2], a[1])

def ribbon(M, mat, pts, widths, t):
    """XY 평면 길 pts 를 따라 다이아몬드 단면 가지(날개)."""
    secs = []
    for i, (x, y) in enumerate(pts):
        j0, j1 = max(0, i-1), min(len(pts)-1, i+1)
        dx, dy = pts[j1][0]-pts[j0][0], pts[j1][1]-pts[j0][1]; L = math.hypot(dx, dy) or 1
        nx, ny = -dy/L, dx/L; w = widths[i]
        secs.append([(x+nx*w, y+ny*w, 0), (x, y, t*(w > 1e-5)), (x-nx*w, y-ny*w, 0), (x, y, -t*(w > 1e-5))])
    for a, b in zip(secs, secs[1:]):
        for k in range(4):
            k2 = (k+1) % 4; M.quad(mat, a[k], a[k2], b[k2], b[k])
    a = secs[0]; M.quad(mat, a[0], a[3], a[2], a[1])

def box(M, mat, c, h):
    x, y, z = c; a, b, d = h
    v = [(x+sx*a, y+sy*b, z+sz*d) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
        M.quad(mat, *[v[i] for i in f])

def cone(M, mat, base, tip, r, seg=6):
    bx, by, bz = base; tx, ty, tz = tip
    d = (tx-bx, ty-by, tz-bz); L = math.sqrt(sum(q*q for q in d)); d = tuple(q/L for q in d)
    u = (0, 0, 1) if abs(d[2]) < .9 else (1, 0, 0)
    e1 = (d[1]*u[2]-d[2]*u[1], d[2]*u[0]-d[0]*u[2], d[0]*u[1]-d[1]*u[0]); l1 = math.sqrt(sum(q*q for q in e1)); e1 = tuple(q/l1 for q in e1)
    e2 = (d[1]*e1[2]-d[2]*e1[1], d[2]*e1[0]-d[0]*e1[2], d[0]*e1[1]-d[1]*e1[0])
    rg = [tuple(base[i]+r*(math.cos(2*math.pi*k/seg)*e1[i]+math.sin(2*math.pi*k/seg)*e2[i]) for i in range(3)) for k in range(seg)]
    for k in range(seg):
        k2 = (k+1) % seg; M.tri(mat, rg[k], rg[k2], tip); M.tri(mat, base, rg[k2], rg[k])

def write(path, name, M, mats, tip, rad=None):
    RADW = RAD if rad is None else rad
    # 게임 배율에서 창이 몸 뒤로 사라지지 않게 굵기(X·Z)만 RAD 배 — 길이(Y)는 그대로
    M.tris = [(m, tuple((p[0]*RADW, p[1], p[2]*RADW) for p in t)) for m, t in M.tris]
    order = sorted({m for m, _ in M.tris}); bin_ = bytearray(); acc = []; views = []; prims = []
    def add(data, target, comp, cnt, typ, mn=None, mx=None):
        while len(bin_) % 4: bin_.append(0)
        off = len(bin_); bin_.extend(data); views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data), 'target': target})
        a = {'bufferView': len(views)-1, 'componentType': comp, 'count': cnt, 'type': typ}
        if mn is not None: a['min'], a['max'] = mn, mx
        acc.append(a); return len(acc)-1
    for m in order:
        P, N = [], []
        for mm, (a, b, c) in M.tris:
            if mm != m: continue
            u = [b[i]-a[i] for i in range(3)]; v = [c[i]-a[i] for i in range(3)]
            n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]; l = math.sqrt(sum(q*q for q in n)) or 1
            n = [q/l for q in n]
            for p in (a, b, c): P.append(p); N.append(n)
        mn = [min(p[i] for p in P) for i in range(3)]; mx = [max(p[i] for p in P) for i in range(3)]
        pa = add(b''.join(struct.pack('<3f', *p) for p in P), 34962, 5126, len(P), 'VEC3', mn, mx)
        na = add(b''.join(struct.pack('<3f', *n) for n in N), 34962, 5126, len(N), 'VEC3')
        ia = add(b''.join(struct.pack('<H', i) for i in range(len(P))), 34963, 5123, len(P), 'SCALAR')
        prims.append({'attributes': {'POSITION': pa, 'NORMAL': na}, 'indices': ia, 'material': order.index(m)})
    materials = []
    for m in order:
        c, metal, rough, em = mats[m]
        mat = {'name': m, 'pbrMetallicRoughness': {'baseColorFactor': list(c)+[1], 'metallicFactor': metal, 'roughnessFactor': rough}, 'doubleSided': True}
        if em: mat['emissiveFactor'] = list(em)
        materials.append(mat)
    j = {'asset': {'version': '2.0', 'generator': 'StoryWorld R1378 임시판(코드 생성)'}, 'scene': 0, 'scenes': [{'nodes': [0]}],
         'nodes': [{'name': name, 'children': [1, 2, 3]}, {'name': 'GripSocket'}, {'name': 'BladeTip', 'translation': [0, tip, 0]}, {'name': name+'_MESH', 'mesh': 0}],
         'meshes': [{'name': name+'_MESH', 'primitives': prims}], 'materials': materials, 'accessors': acc, 'bufferViews': views,
         'buffers': [{'byteLength': len(bin_)}]}
    js = json.dumps(j, ensure_ascii=False, separators=(',', ':')).encode()
    js += b' '*((4-len(js) % 4) % 4)
    while len(bin_) % 4: bin_.append(0)
    out = struct.pack('<4sII', b'glTF', 2, 12+8+len(js)+8+len(bin_)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(bin_), b'BIN\0') + bytes(bin_)
    os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'wb').write(out); print(path, len(out), 'bytes', len(M.tris), 'tris')

# ── 네온: 심연 장창(검은 강철 자루·청록 룬·가시 칼라·버들잎 창날) — 선택 화면 원래 그림·2D 공격 그림
N = Mesh(); TIP_N = 1.12
lathe(N, 'steel', [(-.58, 0), (-.50, .018), (-.48, .016), (.78, .015)], 10)        # 물미·자루
lathe(N, 'wrap', [(-.11, .0195), (.13, .0195)], 10)                                  # 손잡이 감개
for y in (-.30, .24, .52):
    lathe(N, 'teal', [(y, .0185), (y+.022, .0185)], 10)                             # 룬 고리
for k in range(4):  # 심사 7.54: 자루가 몸 녹갈색과 섞임 → 청록 발광 테두리 선 4줄이 자루 거의 전체를 따라감
    a = 2*math.pi*k/4+.4; box(N, 'teal', (.0160*math.cos(a), .14, .0160*math.sin(a)), (.0030, .60, .0030))
lathe(N, 'steel2', [(.76, .016), (.78, .032), (.83, .030), (.85, .014)], 10)         # 칼라
for k in range(6):
    a = 2*math.pi*k/6 + .3; cone(N, 'steel2', (.031*math.cos(a), .80, .031*math.sin(a)), (.065*math.cos(a), .86, .065*math.sin(a)), .008, 5)
blade(N, 'blade', [(.84, .012, .010), (.88, .040, .010), (.95, .046, .009), (1.03, .030, .007), (TIP_N, 0, 0)])
box(N, 'teal', (0, .97, 0), (.004, .09, .0105))                                       # 날 가운데 발광 홈(양면)
write(os.path.join(OUT, 'neon-abyss-spear.glb'), 'SW_NEON_ABYSS_SPEAR', N, {
    'steel': ((.07, .13, .17), .60, .32, None), 'steel2': ((.20, .22, .24), .70, .28, None), 'wrap': ((.06, .07, .07), .2, .6, None),
    'blade': ((.42, .45, .48), .70, .25, None), 'teal': ((.15, .85, .70), .3, .4, (.25, 1.0, .82))}, TIP_N, rad=2.45)  # 네온만 더 굵게(심사: 1.4~1.6배)

# ── 라우렌: 보랏빛 날개 창(검은 자루·은 감개·날개 가지·보라 결정·다면 창날) — 선택 화면 그림
L = Mesh(); TIP_L = 1.16
lathe(L, 'silver', [(-.56, 0), (-.48, .020), (-.44, .018)], 10)                      # 물미
lathe(L, 'shaft', [(-.44, .017), (.80, .016)], 10)                                   # 자루
for y0, y1 in ((-.12, -.08), (.10, .14), (.40, .43)):
    lathe(L, 'silver', [(y0, .0195), (y1, .0195)], 10)                               # 은 감개
lathe(L, 'silver', [(.78, .017), (.80, .026), (.86, .022), (.88, .012)], 10)         # 창날 받침
for sx in (1, -1):                                                                   # 날개 가지(위로 휘어 오름)
    ribbon(L, 'silver', [(sx*.015, .86), (sx*.055, .865), (sx*.085, .89), (sx*.10, .93), (sx*.105, .98)], [.012, .012, .010, .007, 0], .006)
cone(L, 'violet', (0, .875, 0), (0, .925, 0), .024, 4); cone(L, 'violet', (0, .875, 0), (0, .85, 0), .024, 4)  # 보라 결정
blade(L, 'silver2', [(.88, .014, .012), (.93, .050, .012), (.99, .056, .011), (1.07, .036, .008), (TIP_L, 0, 0)])
box(L, 'violet', (0, 1.00, 0), (.004, .10, .0125))                                    # 보라 발광 능선(양면)
write(os.path.join(OUT, 'lauren-violet-lance.glb'), 'SW_LAUREN_VIOLET_LANCE', L, {
    'silver': ((.68, .70, .76), .70, .28, None), 'silver2': ((.74, .75, .80), .70, .25, None), 'shaft': ((.08, .07, .10), .3, .5, None),
    'violet': ((.55, .25, .95), .3, .4, (.60, .30, 1.0))}, TIP_L)
