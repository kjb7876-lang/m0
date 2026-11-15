# R1048 원화 기준 EGO 3D 시안 모델(사용자 2026-11-15 07:51Z "최우선", 코디네이터: Dots 모델이 늦으면 직접 만들어 시안).
# 실행: python3 build_ego.py -- <rig.glb(믹사모 이름 뼈)> <out.glb>
#  · 몸 메시는 숨기고, 뼈마다 의상 조각을 뼈에 붙여(뼈 부모) 원화 외형을 만든다: 검붉은 두건·흰 머리·검은 코트와 붉은 안감·금장 장갑·
#    갈색 끈 장화·흰→붉은 깃털 망토(어깨 깃 + 등 뒤로 땅까지 펼친 날개 모양)·붉은 술 달린 환도 검.
#  · 망토 깃털 줄마다 'cape' 빈 객체를 두어 render_sheets.py 의 2차 동작(늦게 따라오는 흔들림)이 돌릴 수 있게 한다.
#  · 이건 시안이다. Dots 모델(CX-0105E3)이 오면 그 모델로 같은 도구를 돌린다.
import bpy, sys, math, random
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
RIG, OUT = argv[0], argv[1]
random.seed(1048)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=RIG)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
for o in bpy.data.objects:
    if o.type == 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
arm.data.pose_position = 'REST'
bpy.context.view_layer.update()

def B(n):
    for k in ('mixamorig:' + n, n, 'mixamorig' + n):
        if k in arm.pose.bones: return arm.pose.bones[k]
    raise KeyError(n)
def H(n): return arm.matrix_world @ B(n).head
def T(n): return arm.matrix_world @ B(n).tail
# 키(머리끝-발) 기준 단위
top = H('Head').z + 1.9 * (H('Head').z - H('Neck').z)  # 뼈 끝(tail) 길이는 리그마다 들쭉날쭉해 머리·목 간격으로 정한다
foot = min(H('LeftToeBase').z, H('LeftFoot').z) - .015 * top
U = (top - foot)  # 키

def mat(name, rgb, rough=.55, metal=0., emit=None, sheen=0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    if emit:
        p.inputs['Emission Color'].default_value = (*emit[0], 1); p.inputs['Emission Strength'].default_value = emit[1]
    return m
def feather_mat():
    m = bpy.data.materials.get('feather')
    if m: return m
    m = bpy.data.materials.new('feather'); m.use_nodes = True; nt = m.node_tree
    p = nt.nodes['Principled BSDF']; p.inputs['Roughness'].default_value = .7
    a = nt.nodes.new('ShaderNodeVertexColor'); a.layer_name = 'Col'
    nt.links.new(a.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Emission Color'].default_value = (.9, .05, .08, 1); p.inputs['Emission Strength'].default_value = 0.0
    return m
M = dict(coat=mat('coat', (.035, .028, .032), .6), lining=mat('lining', (.42, .02, .04), .5), hood=mat('hood', (.06, .025, .028), .7),
         skin=mat('skin', (.78, .62, .55), .6), hair=mat('hair', (.86, .86, .9), .45), gold=mat('gold', (.78, .55, .2), .3, .9),
         boot=mat('boot', (.12, .07, .05), .45), blade=mat('blade', (.9, .92, .95), .15, 1.), edge=mat('edge', (.8, .05, .08), .3, 0, ((1, .05, .1), 2.5)),
         tassel=mat('tassel', (.65, .02, .05), .6), strap=mat('strap', (.2, .12, .07), .5), eye=mat('eye', (1, .1, .1), .3, 0, ((1, .1, .1), 6)))
parts = []
def attach(o, bone):
    """조각을 뼈 하나에 무게 1로 묶는다(끝에 한 메시로 합쳐 스킨으로 내보냄 — glTF 에서 뼈 부모 행렬이 어긋나지 않게)."""
    name = bone if (bone in arm.data.bones or bone.startswith('cape')) else B(bone).name
    vg = o.vertex_groups.get(name) or o.vertex_groups.new(name=name)
    vg.add(list(range(len(o.data.vertices))), 1.0, 'REPLACE')
    parts.append(o); return o
def cone(name, a, b, r0, r1, m, bone, sides=12, sx=1., sy=1., cap=True):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=sides, radius1=r0, radius2=r1, depth=d.length, end_fill_type='NGON' if cap else 'NOTHING')
    o = bpy.context.object; o.name = name; o.scale = (sx, sy, 1)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    o.location = (a + b) / 2; o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    return attach(o, bone)
def ball(name, c, r, m, bone, sc=(1, 1, 1), seg=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=c)
    o = bpy.context.object; o.name = name; o.scale = sc; o.data.materials.append(m); bpy.ops.object.shade_smooth()
    return attach(o, bone)

r = U  # 비율 단위
# ---- 다리·장화 ----
for s in ('Left', 'Right'):
    cone(f'thigh{s}', H(f'{s}UpLeg'), H(f'{s}Leg'), .062 * r, .05 * r, M['coat'], f'{s}UpLeg')
    cone(f'shin{s}', H(f'{s}Leg'), H(f'{s}Foot'), .05 * r, .042 * r, M['boot'], f'{s}Leg')
    for k in range(4):  # 장화 끈
        t = .25 + k * .18; p = H(f'{s}Leg').lerp(H(f'{s}Foot'), t)
        bpy.ops.mesh.primitive_torus_add(major_radius=.051 * r, minor_radius=.006 * r, location=p)
        o = bpy.context.object; o.name = f'strap{s}{k}'; o.data.materials.append(M['strap'])
        o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference((H(f'{s}Foot') - H(f'{s}Leg')).normalized()); attach(o, f'{s}Leg')
    cone(f'foot{s}', H(f'{s}Foot'), H(f'{s}ToeBase') + (H(f'{s}ToeBase') - H(f'{s}Foot')).normalized() * .05 * r * 0 + Vector((0, -.04 * r, 0)), .046 * r, .03 * r, M['boot'], f'{s}Foot', sy=.75)
# ---- 몸통·코트 ----
hips, neck = H('Hips'), H('Neck')
cone('torso', hips, neck, .12 * r, .1 * r, M['coat'], 'Spine1', sx=1., sy=.72)
cone('chest', H('Spine2'), neck.lerp(H('Spine2'), .1), .115 * r, .07 * r, M['coat'], 'Spine2', sx=1.05, sy=.8)
cone('belt', hips + Vector((0, 0, .02 * r)), hips + Vector((0, 0, .055 * r)), .118 * r, .118 * r, M['strap'], 'Hips', sy=.76)
ball('buckle', hips + Vector((0, -.09 * r, .038 * r)), .018 * r, M['gold'], 'Hips', sc=(1, .4, 1))
# 코트 자락: 넓적다리마다 앞·뒤 한 장(다리를 따라 움직여 걸을 때 뚫리지 않게), 안감 붉게
for s in ('Left', 'Right'):
    a, b = H(f'{s}UpLeg'), H(f'{s}Leg').lerp(H(f'{s}Foot'), .35)
    for side, off in (('f', -1), ('b', 1)):
        o = cone(f'skirt{s}{side}', a + Vector((0, off * .03 * r, .03 * r)), b + Vector((0, off * .06 * r, 0)), .085 * r, .12 * r, M['coat'], f'{s}UpLeg', sides=10, sy=.55, cap=False)
        o.data.materials.append(M['lining'])
        bpy.ops.object.modifier_add(type='SOLIDIFY'); o.modifiers[-1].thickness = .006 * r; o.modifiers[-1].material_offset = 1
# ---- 팔·장갑 ----
for s in ('Left', 'Right'):
    cone(f'shoulder{s}', H(f'{s}Arm'), H(f'{s}Arm').lerp(H(f'{s}ForeArm'), .2), .058 * r, .052 * r, M['coat'], f'{s}Arm')
    cone(f'upper{s}', H(f'{s}Arm'), H(f'{s}ForeArm'), .046 * r, .04 * r, M['coat'], f'{s}Arm')
    cone(f'fore{s}', H(f'{s}ForeArm'), H(f'{s}Hand'), .04 * r, .036 * r, M['coat'], f'{s}ForeArm')
    cone(f'cuff{s}', H(f'{s}ForeArm').lerp(H(f'{s}Hand'), .55), H(f'{s}Hand'), .045 * r, .042 * r, M['gold'], f'{s}ForeArm')
    ball(f'hand{s}', H(f'{s}Hand') + (H(f'{s}Hand') - H(f'{s}ForeArm')).normalized() * .035 * r, .03 * r, M['coat'], f'{s}Hand', sc=(1, 1, 1.2))
# ---- 머리·두건 ----
hc = H('Head') + Vector((0, 0, .06 * U))
ball('face', hc + Vector((0, -.022 * r, -.008 * r)), .05 * r, M['skin'], 'Head', sc=(.9, .95, 1.1))
for k in (-1, 1):
    ball(f'eye{k}', hc + Vector((k * .019 * r, -.068 * r, .0)), .006 * r, M['eye'], 'Head')
for k in range(9):  # 흰 앞머리(두건 밑으로 흘러내림)
    x = (k - 4) * .012 * r; a = hc + Vector((x, -.035 * r, .045 * r)); b = a + Vector((x * .4, -.03 * r, -.07 * r - abs(x) * .3))
    cone(f'hair{k}', a, b, .016 * r, .002 * r, M['hair'], 'Head', sides=6)
o = ball('hood', hc + Vector((0, .03 * r, .02 * r)), .075 * r, M['hood'], 'Head', sc=(.95, 1.0, 1.08))
cone('hoodtip', hc + Vector((0, .07 * r, .02 * r)), hc + Vector((0, .13 * r, -.06 * r)), .045 * r, .004 * r, M['hood'], 'Head', sides=8)
bpy.ops.mesh.primitive_torus_add(major_radius=.058 * r, minor_radius=.008 * r, location=hc + Vector((0, -.062 * r, .0)))
o = bpy.context.object; o.name = 'hoodrim'; o.scale = (.85, 1, 1.15); o.rotation_euler = (math.radians(80), 0, 0); o.data.materials.append(M['lining']); attach(o, 'Head')
cone('collar', neck - Vector((0, 0, .02 * r)), neck + Vector((0, 0, .05 * r)), .075 * r, .06 * r, M['hood'], 'Neck', sy=.85)
# ---- 환도 검(오른손), 붉은 술 ----
hand_a = H('RightHand'); hand_b = hand_a + (H('RightHand') - H('RightForeArm')).normalized() * .07 * U
dirv = (hand_b - hand_a).normalized(); grip = hand_b
blade_dir = (dirv + Vector((0, -.25, 0))).normalized()
side = blade_dir.cross(Vector((0, 0, 1))).normalized()
def blade():
    n = 14; L = .62 * r; w = .018 * r; verts = []; faces = []
    for i in range(n + 1):
        t = i / n; c = grip + blade_dir * (.08 * r + L * t) + side * (.05 * r * t * t)  # 살짝 휜 칼
        ww = w * (1 - .7 * t ** 3)
        verts += [c + side * ww * .1 + Vector((0, 0, 0)), c - side * ww * .1 + blade_dir.cross(side) * ww]
    for i in range(n): faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    me = bpy.data.meshes.new('blade'); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
    o = bpy.data.objects.new('blade', me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(M['blade']); bpy.context.view_layer.objects.active = o
    m = o.modifiers.new('s', 'SOLIDIFY'); m.thickness = .004 * r
    return attach(o, 'RightHand')
blade()
cone('tsuba', grip + blade_dir * .065 * r, grip + blade_dir * .078 * r, .03 * r, .03 * r, M['gold'], 'RightHand', sides=10)
cone('hilt', grip - blade_dir * .06 * r, grip + blade_dir * .066 * r, .012 * r, .012 * r, M['tassel'], 'RightHand', sides=8)
for k in range(3):
    a = grip - blade_dir * .06 * r; b = a + Vector(((k - 1) * .01 * r, 0, -.11 * r))
    cone(f'tassel{k}', a, b, .004 * r, .012 * r, M['tassel'], 'RightHand', sides=6)
# ---- 깃털 망토 ----
FM = feather_mat()
def feather(name, base, d, length, width, bone, tint=0.):
    """끝이 들쭉날쭉한 긴 깃털 한 장(평면). 밑동 흰색 → 끝 붉은색(정점 색)."""
    d = Vector(d).normalized(); up = Vector((0, 0, 1)) if abs(d.z) < .9 else Vector((1, 0, 0))
    sidev = d.cross(up).normalized(); norm = sidev.cross(d)
    pts = []; n = 9
    for i in range(n + 1):
        t = i / n; ww = width * math.sin(math.pi * min(1, t * 1.15)) ** .8 * (1 - .35 * t)
        jag = (.35 if i % 2 else 0) * ww
        c = Vector(base) + d * length * t + norm * (.06 * length * math.sin(math.pi * t))
        pts.append((c + sidev * (ww - jag * .5), c - sidev * (ww - jag), t))
    verts = []; cols = []
    for a, b, t in pts:
        verts += [tuple(a), tuple(b)]
        red = min(1, max(0, (t - .62 + tint) / .3)) ** 1.5
        col = (1 - .25 * red, .92 * (1 - red) + .04 * red, .9 * (1 - red) + .06 * red, 1)
        cols += [col, col]
    faces = [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(n)]
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for i, c in enumerate(cols): ca.data[i].color = c
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o); o.data.materials.append(FM)
    return o
cape_rows = []
sh_l, sh_r = H('LeftArm'), H('RightArm'); back = Vector((0, 1, 0))
ROWS = 5
for row in range(ROWS):
    t = row / (ROWS - 1)
    loc = neck.lerp(hips, .15 + .2 * t) + back * (.07 * r)
    cape_rows.append((f'cape{row}', loc))
    cols = 9 + row * 2
    for c in range(cols):
        u = c / (cols - 1) * 2 - 1  # -1(왼) … 1(오)
        base = loc + Vector((u * (.13 + .05 * t) * r, .01 * r * row, -.02 * r * row))
        spread = u * (.55 + .5 * t)
        d = Vector((spread, .35 + .25 * t, -1)).normalized()
        L = (.38 + .32 * t + .08 * random.random()) * r * (1 - .25 * abs(u) ** 2)
        f = feather(f'f{row}_{c}', base, d, L, .045 * r, 'Spine2', tint=.1 * t); attach(f, f'cape{row}')
# 어깨 깃(목둘레를 덮는 짧은 깃털)
for c in range(16):
    a = c / 16 * math.tau; dv = Vector((math.cos(a) * .8, math.sin(a) * .7, -.7))
    base = neck + Vector((math.cos(a) * .06 * r, math.sin(a) * .05 * r, -.02 * r))
    f = feather(f'mantle{c}', base, dv, .16 * r, .03 * r, 'Spine2', tint=.2); attach(f, 'Spine2')
# 망토 뼈(등 위쪽에서 아래로 늘어진 짧은 뼈) — render_sheets 의 2차 동작이 돌린다
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
inv = arm.matrix_world.inverted(); sp2 = arm.data.edit_bones[B('Spine2').name]
for name, loc in cape_rows:
    eb = arm.data.edit_bones.new(name); eb.head = inv @ loc; eb.tail = inv @ (loc + Vector((0, .02 * r, -.12 * r))); eb.parent = sp2
bpy.ops.object.mode_set(mode='OBJECT')
# 조각 합치기: 변형(크기·회전·solidify) 적용 → 한 메시 → 아마추어 스킨
bpy.ops.object.select_all(action='DESELECT')
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
for o in parts:
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in parts:
    if max(o.dimensions) > U: print('BIG', o.name, tuple(round(v, 2) for v in o.dimensions), tuple(round(v, 2) for v in o.location))
print('U', U, 'top', top, 'foot', foot)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.object; body.name = 'EGO'
body.parent = arm; body.matrix_parent_inverse = arm.matrix_world.inverted()
mod = body.modifiers.new('arm', 'ARMATURE'); mod.object = arm
arm.data.pose_position = 'POSE'
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_animations=True)
print('EGO built', len(parts), 'parts', OUT)
