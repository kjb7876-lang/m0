# R1048 EGO 2판 — 1단계: CC0 사실적 인체(Blender 재단 Human Base Meshes v1.4.1, realistic male) + EGO 전용 뼈대 + 자동 무게.
# 실행: python3 ego2_body.py -- <human_base_meshes_bundle.blend> <out.blend> [--height 1.8] [--multires 1]
#  · 뼈 이름은 믹사모식(Hips·Spine·…·LeftArm…)으로 둬서 렌더 도구·리타깃이 같은 이름을 쓴다(믹사모 자산은 쓰지 않는다).
#  · 관절 위치는 메시를 높이 띠로 잘라 그 단면의 무게중심으로 잡는다(A 자세 기준).
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
SRC, OUT = argv[0], argv[1]
def opt(n, d): return type(d)(argv[argv.index(n) + 1]) if n in argv else d
HEIGHT = opt('--height', 1.8); MRES = opt('--multires', 1); LEG = opt('--leg', 1.0); SHO = opt('--shoulder', 1.0)

bpy.ops.wm.open_mainfile(filepath=SRC)
keep = {'GEO-body_male_realistic', 'GEO-body_male_realistic.eye.L', 'GEO-body_male_realistic.eye.R'}
for o in list(bpy.data.objects):
    if o.name not in keep: bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    pass
body = bpy.data.objects['GEO-body_male_realistic']
eyes = [bpy.data.objects['GEO-body_male_realistic.eye.L'], bpy.data.objects['GEO-body_male_realistic.eye.R']]
sc = bpy.context.scene
for o in [body] + eyes:
    if o.name not in sc.collection.objects: sc.collection.objects.link(o)
# 멀티레즈 적용(조각 디테일을 메시로)
bpy.context.view_layer.objects.active = body
for m in list(body.modifiers):
    if m.type == 'MULTIRES':
        m.levels = MRES; m.render_levels = MRES
        bpy.ops.object.multires_base_apply(modifier=m.name) if False else None
        bpy.ops.object.modifier_apply(modifier=m.name)
# 눈을 몸 기준 세계 좌표로 풀어 둔다
for e in eyes:
    mw = e.matrix_world.copy(); e.parent = None; e.matrix_world = mw
bpy.context.view_layer.update()
# 비율 손질(검수 5회차: 약 5.5등신으로 읽힘): 엉덩이 아래를 LEG 배 늘리고, 어깨 높이 띠의 폭을 SHO 배로.
if LEG != 1.0 or SHO != 1.0:
    allv = [(o, v) for o in [body] + eyes for v in o.data.vertices]
    ws = [(o.matrix_world @ v.co) for o, v in allv]
    zmin = min(w.z for w in ws); zmax = max(w.z for w in ws); Hh = zmax - zmin; hz = zmin + .5 * Hh
    cxw = sum(w.x for w in ws) / len(ws)  # 묶음 파일에서 몸이 x=0 에 있지 않다 — 가운데 기준으로 줄인다
    for (o, v), w in zip(allv, ws):
        z = w.z
        nz = zmin + (z - zmin) * LEG if z < hz else z + (hz - zmin) * (LEG - 1)
        f = 1.0
        if SHO != 1.0:  # 어깨 띠(키 .74~.86): 가운데에서 바깥으로 갈수록 x 를 줄임, 팔도 함께 안쪽으로
            t = (z - zmin) / Hh
            f = 1 + (SHO - 1) * max(0., min(1., (t - .66) / .08)) * max(0., min(1., (.9 - t) / .04))
        nw = w.copy(); nw.z = nz; nw.x = cxw + (w.x - cxw) * f
        v.co = o.matrix_world.inverted() @ nw
    bpy.context.view_layer.update()
# 원점·크기 맞추기: 발 z=0, 가운데 x=0, 키 HEIGHT
vs = [body.matrix_world @ v.co for v in body.data.vertices]
z0 = min(v.z for v in vs); z1 = max(v.z for v in vs); cx = sum(v.x for v in vs) / len(vs)
k = HEIGHT / (z1 - z0)
for o in [body] + eyes:
    o.matrix_world = __import__('mathutils').Matrix.Diagonal((k, k, k, 1)) @ __import__('mathutils').Matrix.Translation((-cx, 0, -z0)) @ o.matrix_world
    bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.context.view_layer.update()
V = [v.co.copy() for v in body.data.vertices]; H = HEIGHT

K_ = 1 + .5 * (LEG - 1)
def F(f):  # 다리를 늘린 만큼 관절 높이 비율을 옮긴다(키 .5 아래는 LEG 배, 위는 그대로 밀림 → 다시 키로 나눔)
    return (f * LEG if f < .5 else f + .5 * (LEG - 1)) / K_
def band(f, w=.012, side=0, xmin=None, xmax=None):
    f = F(f)
    out = []
    for v in V:
        if abs(v.z / H - f) > w: continue
        if side and v.x * side <= 0: continue
        ax = abs(v.x)
        if xmin is not None and ax < xmin: continue
        if xmax is not None and ax > xmax: continue
        out.append(v)
    return out
def cen(pts):
    return sum(pts, Vector()) / max(1, len(pts))
def snap(p, r, side=0, xmin=None):
    pts = [v for v in V if (v - p).length < r and (not side or v.x * side > 0) and (xmin is None or abs(v.x) >= xmin)]
    return cen(pts) if len(pts) > 8 else p

J = {}
mid = lambda f: cen(band(f, xmax=.16 * H / 1.69))
J['hips'] = mid(.53); J['spine'] = mid(.59); J['spine1'] = mid(.66); J['spine2'] = mid(.73)
J['neck'] = mid(.835); J['head'] = mid(.875); J['headtop'] = Vector((0, J['head'].y, H))
for s, n in ((1, 'L'), (-1, 'R')):
    tip = max((v for v in V if v.x * s > 0), key=lambda v: abs(v.x))  # 손끝(A 자세에서 가장 바깥)
    sh = snap(Vector((s * .175 * SHO * H / 1.69, J['spine2'].y, F(.815) * H)), .06 * H / 1.69, s, .1 * H / 1.69)
    wr = tip + (sh - tip).normalized() * .108 * H / K_
    el = snap(sh.lerp(wr, .56), .05 * H / 1.69, s, .15 * H / 1.69)
    J['clav' + n] = Vector((s * .03 * H / 1.69, J['spine2'].y, F(.80) * H))
    J['shoulder' + n] = sh; J['elbow' + n] = el; J['wrist' + n] = snap(wr, .035 * H / 1.69, s); J['hand' + n] = tip
    thigh = cen(band(.47, side=s, xmax=.2 * H / 1.69)); knee = cen(band(.28, side=s)); ank = cen(band(.06, w=.01, side=s))
    J['hip' + n] = Vector((thigh.x, J['hips'].y, F(.51) * H)); J['knee' + n] = knee; J['ankle' + n] = Vector((ank.x, ank.y, F(.045) * H))
    toe = min((v for v in V if v.x * s > 0 and v.z < F(.03) * H), key=lambda v: v.y)
    J['toe' + n] = Vector((J['ankle' + n].x, toe.y, F(.012) * H)); J['ball' + n] = J['ankle' + n].lerp(J['toe' + n], .72); J['ball' + n].z = F(.015) * H
for k_, v in J.items(): print('J', k_, tuple(round(c, 3) for c in v))

# 뼈대
arm_data = bpy.data.armatures.new('EGO-rig'); arm = bpy.data.objects.new('EGO-rig', arm_data); sc.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
EB = arm_data.edit_bones
def bone(name, h, t, parent=None, connect=False):
    b = EB.new(name); b.head = h; b.tail = t
    if parent: b.parent = EB[parent]; b.use_connect = connect
    return b
bone('Hips', J['hips'], J['spine'])
bone('Spine', J['spine'], J['spine1'], 'Hips', True); bone('Spine1', J['spine1'], J['spine2'], 'Spine', True)
bone('Spine2', J['spine2'], J['neck'], 'Spine1', True); bone('Neck', J['neck'], J['head'], 'Spine2', True)
bone('Head', J['head'], J['headtop'], 'Neck', True)
for n, side in (('L', 'Left'), ('R', 'Right')):
    bone(side + 'Shoulder', J['clav' + n], J['shoulder' + n], 'Spine2')
    bone(side + 'Arm', J['shoulder' + n], J['elbow' + n], side + 'Shoulder', True)
    bone(side + 'ForeArm', J['elbow' + n], J['wrist' + n], side + 'Arm', True)
    bone(side + 'Hand', J['wrist' + n], J['hand' + n], side + 'ForeArm', True)
    bone(side + 'UpLeg', J['hip' + n], J['knee' + n], 'Hips')
    bone(side + 'Leg', J['knee' + n], J['ankle' + n], side + 'UpLeg', True)
    bone(side + 'Foot', J['ankle' + n], J['ball' + n], side + 'Leg', True)
    bone(side + 'ToeBase', J['ball' + n], J['toe' + n], side + 'Foot', True)
for b in EB: b.roll = 0
bpy.ops.object.mode_set(mode='OBJECT')
# 자동 무게(열 확산)
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
empty = [g.name for g in body.vertex_groups if not any(g.index == x.group for v in body.data.vertices[:0] for x in v.groups)]
print('groups', len(body.vertex_groups))
# 눈은 머리 뼈에 무게 1로 붙여 몸과 합친다
for e in eyes:
    g = e.vertex_groups.new(name='Head'); g.add(list(range(len(e.data.vertices))), 1.0, 'REPLACE')
bpy.ops.object.select_all(action='DESELECT')
for o in eyes + [body]: o.select_set(True)
bpy.context.view_layer.objects.active = body; bpy.ops.object.join()
body.name = 'EGO-body'
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT, len(body.data.vertices))
