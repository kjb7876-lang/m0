# R1048 EGO 3D → 8방향 미리 렌더 시트(사용자 2026-11-15 07:24~07:25Z "에고각성 히든영웅만 … 초일류급 … 3디로").
# 실행: python3 render_sheets.py <model.glb> <out_dir> [--cell 192] [--samples 24] [--dirs 8] [--only idle,walk]
#  · Blender 5.x(bpy 모듈)로 돌린다. GPU 없이 Cycles CPU.
#  · 카메라: 게임 쿼터뷰(project: 화면 x=(x-y)*64, y=(x+y)*32 → 2:1, 내려다보는 각 ≈30°)와 같은 직교 카메라. 캐릭터를 돌리고 카메라는 고정.
#  · 동작: 모델에 같은 이름 동작이 있으면 그것, 없으면 아래 PROC(손으로 넣은 열쇠 자세 — 시험용)로 만든다.
#  · 출력: <out>/<action>-<dir>.png (가로 한 줄 시트, 칸 cell×cell, 발은 칸 아래 12% 선), <out>/sheets.json(칸 수·fps·발 위치·걸음 길이).
#  · 윤곽선: Freestyle(원화처럼 어두운 붉은 갈색 선). 조명: 검붉은 테두리빛 + 따뜻한 위쪽 주광.
# 이 파일은 도구다(게임 런타임에 들어가지 않음). 임시 인체 모델로 만든 결과는 시험용이고 EGO 최종 그림이 아니다.
import bpy, sys, os, json, math
from mathutils import Vector, Euler, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
MODEL, OUT = argv[0], argv[1]
def opt(name, d):
    return type(d)(argv[argv.index(name) + 1]) if name in argv else d
CELL = opt('--cell', 192); INK = opt('--ink', 1); SAMPLES = opt('--samples', 24); NDIR = opt('--dirs', 8)
ONLY = [s for s in opt('--only', '').split(',') if s]; PROBE = opt('--probe', 0)
os.makedirs(OUT, exist_ok=True)

# 동작 표: 칸 수·fps·반복·걸음 길이(이동 1초당 칸 → 게임 발 미끄럼 방지용)
ACTIONS = {
    'idle':    {'frames': 12, 'fps': 8,  'loop': True,  'src': ['Idle', 'idle']},
    'walk':    {'frames': 12, 'fps': 14, 'loop': True,  'src': ['Walk', 'walk'], 'stride': True},
    'run':     {'frames': 10, 'fps': 18, 'loop': True,  'src': ['Run', 'run'], 'stride': True},
    'attack':  {'frames': 16, 'fps': 20, 'loop': False, 'src': ['Attack', 'attack'], 'phases': {'windup': [0, 4], 'strike': [5, 10], 'follow': [11, 15]}},
    'hit':     {'frames': 8,  'fps': 16, 'loop': False, 'src': ['Hit', 'hit']},
    'discard': {'frames': 20, 'fps': 16, 'loop': False, 'src': ['Discard', 'discard'], 'phases': {'gather': [0, 8], 'release': [9, 13], 'settle': [14, 19]}},
}
# 8방향: 게임 방향 이름(화면 기준) → 캐릭터 몸 회전(z). 카메라는 -Y 쪽에서 +45° 돌려 본다(쿼터뷰).
DIRS8 = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw']
DIRS = DIRS8 if NDIR == 8 else ['s', 'e', 'n', 'w']
if opt('--dirlist', ''): DIRS = opt('--dirlist', '').split(',')  # 시험 렌더용

def clear():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for a in list(bpy.data.actions): bpy.data.actions.remove(a)

if MODEL.endswith('.blend'):
    bpy.ops.wm.open_mainfile(filepath=MODEL)  # EGO 2판: 뼈대·동작·의상이 든 .blend 를 바로 연다
    for o in list(bpy.data.objects):
        if o.type in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o, do_unlink=True)
else:
    clear()
    bpy.ops.import_scene.gltf(filepath=MODEL)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']  # glTF 가 만드는 뼈 모양(Icosphere)은 장면 밖이라 뺀다
root = bpy.data.objects.new('r1048-root', None); bpy.context.scene.collection.objects.link(root)
for o in bpy.context.scene.objects:
    if o.parent is None and o is not root: o.parent = root
# 키 맞추기: 바닥 0, 높이 1.8
bpy.context.view_layer.update()
def bounds():
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    dg = bpy.context.evaluated_depsgraph_get()
    for m in meshes:
        ev = m.evaluated_get(dg)
        for c in ev.bound_box:
            w = ev.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    return lo, hi
lo, hi = bounds(); h = hi.z - lo.z or 1
root.scale = (1.8 / h,) * 3; bpy.context.view_layer.update(); lo, hi = bounds(); root.location.z -= lo.z

# ---- 손으로 넣는 동작(시험용, mixamo 뼈 이름) ----
def set_action(act):
    for t in arm.animation_data.nla_tracks: t.mute = True  # glTF 가 동작들을 NLA 에 깔아 둠 — 섞이지 않게
    arm.animation_data.action = act
    try:
        if hasattr(act, 'slots') and len(act.slots): arm.animation_data.action_slot = act.slots[0]
    except Exception: pass
def bone(n):
    for k in (n, 'mixamorig:' + n, 'mixamorig' + n):
        if k in arm.pose.bones: return arm.pose.bones[k]
    return None
BASE = {}
def capture_base():
    # 손 동작은 대기 동작 첫 자세(T 자세가 아님) 위에 더한다
    src = next((bpy.data.actions.get(s) for s in ACTIONS['idle']['src'] if bpy.data.actions.get(s)), None)
    arm.animation_data_create()
    if src: set_action(src)
    bpy.context.scene.frame_set(int(src.frame_range[0]) if src else 0)
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'; BASE[b.name] = (b.rotation_quaternion.copy(), b.location.copy())
def keyrot(act, frame, pose):
    for b in arm.pose.bones:
        q, l = BASE.get(b.name, (None, None))
        if q is None: continue
        b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = q.copy(); b.location = l.copy()
        for n, (x, y, z) in pose.items():
            nb = bone(n)
            if nb is not None and nb.name == b.name:  # 파이썬 래퍼는 매번 새로 생겨 'is' 비교가 늘 거짓
                b.rotation_quaternion = q @ Euler((math.radians(x), math.radians(y), math.radians(z))).to_quaternion()
        b.keyframe_insert('rotation_quaternion', frame=frame); b.keyframe_insert('location', frame=frame)
REST = {'Spine': (0, 0, 0), 'Spine1': (0, 0, 0), 'RightArm': (0, 0, 0), 'RightForeArm': (0, 0, 0), 'LeftArm': (0, 0, 0), 'LeftForeArm': (0, 0, 0), 'Head': (0, 0, 0), 'Hips': (0, 0, 0)}
# 축(믹사모 리그 실측, qa: 스크래치 axes.py): 팔 y+ = 앞으로 들어 올림, 팔 z+ = 몸 앞을 가로지름(오른팔)·바깥으로 엶(왼팔), 아래팔 y+ = 팔꿈치 굽힘,
#  척추·엉덩이 x+ = 앞으로 숙임, y = 몸통 비틀기, z = 옆으로 기울임.
PROC = {
    # 환도 베기: 예비(칼을 어깨 위로, 몸을 뒤로 비틂) → 타격(대각선으로 빠르게 내려 벰) → 여운(몸 앞을 가로질러 낮게 멈췄다 천천히 돌아옴)
    'attack': [(0, REST),
               (3, {'Hips': (0, 14, 0), 'Spine1': (-6, 28, 0), 'RightArm': (0, 105, -35), 'RightForeArm': (0, 75, 0), 'LeftArm': (0, 25, 10), 'Head': (0, -12, 0)}),
               (5, {'Hips': (6, -12, 0), 'Spine1': (14, -30, 0), 'RightArm': (0, 60, 45), 'RightForeArm': (0, 12, 0), 'LeftArm': (0, 15, -10), 'Head': (6, 10, 0)}),
               (7, {'Hips': (8, -16, 0), 'Spine1': (18, -36, 0), 'RightArm': (0, 28, 62), 'RightForeArm': (0, 14, 0), 'LeftArm': (0, 10, -12), 'Head': (8, 12, 0)}),
               (11, REST)],
    # 피격: 맞은 순간 뒤로 젖혀졌다가(빠르게) 천천히 회복
    'hit': [(0, REST), (1, {'Hips': (-6, 0, 0), 'Spine': (-18, 0, 4), 'Spine1': (-14, 0, 4), 'Head': (-22, 0, 6), 'LeftArm': (0, 20, 15), 'RightArm': (0, 20, -15)}),
            (3, {'Hips': (-4, 0, 0), 'Spine': (-12, 0, 3), 'Spine1': (-9, 0, 3), 'Head': (-14, 0, 4), 'LeftArm': (0, 12, 10), 'RightArm': (0, 12, -10)}), (7, REST)],
    # 관측 폐기: 왼손을 얼굴 앞으로 들어 무언가를 쥐고(모음) → 바깥으로 펼쳐 흩뜨린다(놓음) → 고요히 내림
    'discard': [(0, REST), (6, {'LeftArm': (0, 95, -5), 'LeftForeArm': (0, 70, 0), 'Head': (8, 0, 0), 'Spine1': (4, 8, 0)}),
                (9, {'LeftArm': (0, 85, 45), 'LeftForeArm': (0, 8, 0), 'Head': (-8, -6, 0), 'Spine1': (-6, -8, 0), 'RightArm': (0, 10, 0)}),
                (15, REST)],
}
def action_for(name, spec):
    for s in spec['src']:
        a = bpy.data.actions.get(s)
        if a: return a, False
    if name in PROC:
        if not BASE: capture_base()
        arm.animation_data_create(); a = bpy.data.actions.new('r1048-' + name); set_action(a)
        for f, pose in PROC[name]: keyrot(a, f, pose)
        return a, True
    return None, False

# ---- 장면: 카메라·빛·윤곽선 ----
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = SAMPLES; sc.cycles.device = 'CPU'
sc.cycles.transparent_max_bounces = 96  # 알파 깃털 카드가 여러 겹 — 모자라면 검게 찍힘
try: sc.cycles.use_denoising = True
except Exception: pass
sc.render.resolution_x = sc.render.resolution_y = CELL; sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.1
ELEV = math.radians(30); AZ = math.radians(45); D = 20
cam.location = (D * math.cos(ELEV) * math.sin(AZ), -D * math.cos(ELEV) * math.cos(AZ), D * math.sin(ELEV) + 1.0)
cam.rotation_euler = Euler((math.radians(90) - ELEV, 0, AZ))
# 발이 칸 아래 12% 선에 오도록 카메라 이동(직교라 화면 이동 = 카메라 이동)
cam.data.shift_y = 0.0
# 빛은 카메라 기준 방향으로 둔다(캐릭터만 돌고 빛·카메라는 고정 → 8방향 모두 같은 조명 언어).
#  검수 1회차: 주광 = 화면 왼쪽 위 45° 따뜻한 흰빛 3, 보조 .6, 붉은 테두리빛 #ff3030 2~3 을 뒤에서.
CR = Vector((math.cos(AZ), math.sin(AZ), 0)); CT = Vector((math.sin(AZ) * math.cos(ELEV), -math.cos(AZ) * math.cos(ELEV), math.sin(ELEV)))  # 화면 오른쪽 · 카메라 쪽
UPV = Vector((0, 0, 1))
def light(name, kind, energy, color, toward, angle=None):
    L = bpy.data.lights.new(name, kind); L.energy = energy; L.color = color
    if angle is not None: L.angle = math.radians(angle)
    o = bpy.data.objects.new(name, L); o.rotation_euler = toward.normalized().to_track_quat('Z', 'Y').to_euler(); o.location = (0, 0, 4); sc.collection.objects.link(o)
# 검수 2회차: 주광 +60%(3200K 쪽), 테두리빛 채도 -25%(#D8323A), 얼굴 전용 보조광(머리를 따라감)
light('key', 'SUN', 4.8, (1.0, .82, .62), -CR * .75 + UPV * 1.0 + CT * .55, 8)
light('rim', 'SUN', 1.8, (.69, .032, .042), -CT * 1.0 + UPV * .45 + CR * .25, 4)
light('rim2', 'SUN', 4.5, (1., .84, .58), -CT * 1.0 + UPV * .3 - CR * .45, 4)  # 12회차(AD): 금·백 테두리광 — 어두운 바닥·발밑 붉은 고리와 명도·색 분리 (6회차: 은청)
try:  # 검수 3회차: 흰 깃털·머리는 붉은 테두리빛을 받지 않게(빛 연결)
    _rc = bpy.data.collections.new('rim-receivers')
    for o_ in sc.objects:
        if o_.type == 'MESH' and not any(k_ in o_.name for k_ in ('cape', 'mantle', 'hair', 'blade', 'edge')): _rc.objects.link(o_)
    for n_ in ('rim', 'rim2'): bpy.data.objects[n_].light_linking.receiver_collection = _rc
except Exception as e_: print('light linking off', e_)
FL = bpy.data.lights.new('face', 'POINT'); FL.energy = 2.3; FL.color = (1, .86, .76); FL.shadow_soft_size = .05
FACE_LIGHT = bpy.data.objects.new('face', FL); sc.collection.objects.link(FACE_LIGHT)
FL2 = bpy.data.lights.new('face2', 'POINT'); FL2.energy = 1.2; FL2.color = (1, .88, .8); FL2.shadow_soft_size = .08
FACE_LIGHT2 = bpy.data.objects.new('face2', FL2); sc.collection.objects.link(FACE_LIGHT2)
def face_light_follow():
    hb_ = bone('Head')
    if not hb_: return
    bpy.context.view_layer.update()
    m = arm.matrix_world @ hb_.matrix
    FACE_LIGHT.location = m @ Vector((0, .06, .32 / max(1e-6, m.to_scale().x)))  # 머리뼈 로컬 +Z = 얼굴 앞, 32cm
    FACE_LIGHT2.location = m.translation + CT * .4 + UPV * .12  # 8회차: 카메라 쪽 얼굴 보조광(SE·E 에서 얼굴이 어두움)
light('fill', 'SUN', .85, (.62, .66, .8), CR * .9 + CT * .6 - UPV * .1, 20)  # 6회차: 몸통 보조광 +0.5스톱
w = bpy.data.worlds.new('w'); w.use_nodes = True; sc.world = w
bg = w.node_tree.nodes.get('Background') or w.node_tree.nodes.new('ShaderNodeBackground'); bg.inputs[0].default_value = (.03, .02, .025, 1); bg.inputs[1].default_value = .4
sc.render.use_freestyle = bool(INK)  # 정점 많은 2판 모델은 Freestyle 이 메모리를 다 먹는다 → --ink 0 + 묶을 때 실루엣 윤곽
ls = sc.view_layers[0].freestyle_settings.linesets.new('ink') if not sc.view_layers[0].freestyle_settings.linesets else sc.view_layers[0].freestyle_settings.linesets[0]
ls.linestyle.color = (.16, .03, .04); ls.linestyle.thickness = max(1.0, CELL / 160)
sc.render.line_thickness_mode = 'ABSOLUTE'

from bpy_extras.object_utils import world_to_camera_view
# 칸 맞추기: 대기 자세 메시 점을 4방향으로 찍어 보고, 키가 칸의 FIT(76%)이 되게 직교 폭을 정하고 발을 칸 아래 FOOT(88%) 선에 둔다.
FIT = .60; FOOT = .88  # 6회차: 동·서 방향 달리기·걷기 칼끝이 칸 밖으로 잘림 → 키 비율 76→64%
def fit_camera():
    a0 = next((bpy.data.actions.get(x) for x in ACTIONS['idle']['src'] if bpy.data.actions.get(x)), None)
    arm.animation_data_create()
    if a0: set_action(a0); sc.frame_set(int(a0.frame_range[0]))
    ys = []; z0 = root.rotation_euler.z
    for k in range(4):
        root.rotation_euler.z = z0 + math.radians(90 * k); bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        for m in meshes:
            ev = m.evaluated_get(dg); me = ev.to_mesh()
            for v in list(me.vertices)[::7]:
                ys.append(world_to_camera_view(sc, cam, ev.matrix_world @ v.co).y)
            ev.to_mesh_clear()
    root.rotation_euler.z = z0
    foot = world_to_camera_view(sc, cam, root.matrix_world.translation).y
    span = (max(ys) - foot) * cam.data.ortho_scale  # 발에서 머리까지(카메라 단위)
    cam.data.ortho_scale = max(.5, span / FIT)
    bpy.context.view_layer.update()
    foot = world_to_camera_view(sc, cam, root.matrix_world.translation).y  # 0=아래 1=위
    cam.data.shift_y = foot - (1 - FOOT)
fit_camera()

# 화면에서 발 위치(칸 픽셀) 재기
def foot_px():
    p = world_to_camera_view(sc, cam, root.matrix_world.translation)
    return [round(p.x * CELL, 1), round((1 - p.y) * CELL, 1)]

# ---- 망토 2차 동작: cape0..N 뼈를 몸 움직임보다 늦게 따라오게(스프링) + 이동 중 뒤로 들림 + 잔물결 ----
CAPE = sorted([b for b in arm.pose.bones if b.name.startswith('cape')], key=lambda b: b.name)
LIFT = {'walk': 12, 'run': 25, 'attack': 6, 'discard': 4}
CAP = {'run': 25, 'attack': 30}
DELAY = [0, 1, 1, 2, 2, 3]  # 단마다 늦게 따라옴(칸)
GRAV = .85
spec_loop = [True]  # 망토 뼈를 '몸이 똑바를 때 늘어지는 방향'으로 70% 되돌림(숙이거나 젖혀도 아래로 흐르게)
def cape_plan(name, spec, act, times):
    """동작 시간마다 망토 뼈 각(도)을 미리 계산한다. 반복 동작은 두 바퀴 돌려 시작·끝이 이어지게."""
    if not CAPE: return None
    sb = bone('Spine2') or bone('Spine1')
    pos = []
    for t in times:
        sc.frame_set(int(t), subframe=t - int(t)); bpy.context.view_layer.update()
        m = arm.matrix_world @ sb.matrix; pos.append((m.translation.copy(), m.to_quaternion()))
    n = len(times); dt = 1 / spec['fps']; ang = [0.0, 0.0]; vel = [0.0, 0.0]; out = [None] * n
    loops = 2 if spec['loop'] else 1
    for L in range(loops):
        for i in range(n):
            j = i - 1 if i else (n - 1 if spec['loop'] else 0)
            dp = (pos[i][0] - pos[j][0]) / dt; dq = pos[j][1].rotation_difference(pos[i][1]).to_euler()
            dl = (pos[j][1].inverted() @ pos[i][1]).to_euler()  # 가슴 로컬: x = 숙임(+)/젖힘(-)
            # 몸이 앞으로(로컬 -Y) 움직이거나 비틀리면 망토는 반대로 늦게 따라온다. 젖히면(피격) 앞으로 쏠린다.
            tgt = [-dp.z * 25 + LIFT.get(name, 0) + math.degrees(dl.x) / dt * .08, -math.degrees(dq.z) * 1.4]
            sub = max(1, int(dt * 240))  # 작은 걸음으로 나눠 적분(큰 dt 에서 스프링이 진동해 터지지 않게)
            for _ in range(sub):
                h = dt / sub
                for k in range(2):
                    acc = (tgt[k] - ang[k]) * 90 - vel[k] * 11.4  # 감쇠비 .6
                    vel[k] += acc * h; ang[k] += vel[k] * h
            if L == loops - 1:
                ph = i / n
                out[i] = [max(-25, min(CAP.get(name, 40), ang[0])), max(-18, min(18, ang[1]))]
    return out
# 깃 하나하나의 늦은 흔들림(옷 입힐 때 만든 모양 키 flapA·flapB: 깃마다 위상이 다름). 단위 = 끝 5°.
FLAP = {'idle': (1., 1), 'walk': (2., 2), 'run': (3.6, 3), 'attack': (3.6, 2), 'hit': (2.4, 1), 'discard': (2., 2)}
FLAP_OBJS = [o for o in bpy.data.objects if o.type == 'MESH' and o.data.shape_keys and 'flapA' in o.data.shape_keys.key_blocks]
def flap_apply(name, i, n):
    amp, cyc = FLAP.get(name, (1., 1)); w = 2 * math.pi * cyc * i / max(1, n)
    for o in FLAP_OBJS:
        a_ = min(amp, 1.6) if 'mantle' in o.name else amp  # 7회차: 앞 목깃은 ±8° 까지
        kb = o.data.shape_keys.key_blocks; kb['flapA'].value = a_ * math.cos(w); kb['flapB'].value = a_ * math.sin(w)
def cape_apply(vals, i):
    if not vals: return
    for b in CAPE: b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = (1, 0, 0, 0)
    bpy.context.view_layer.update()
    R0 = arm.matrix_world.to_3x3().normalized()
    for k, b in enumerate(CAPE):
        W = (arm.matrix_world @ b.matrix).to_3x3().normalized()
        cur = W.col[1].normalized(); tgt = (R0 @ b.bone.matrix_local.to_3x3().col[1]).normalized()
        q = Quaternion().slerp(cur.rotation_difference(tgt), GRAV)
        C = W.inverted() @ q.to_matrix() @ W
        a, z = vals[(i - DELAY[min(k, len(DELAY) - 1)]) % len(vals)] if spec_loop[0] else vals[max(0, i - DELAY[min(k, len(DELAY) - 1)])]
        w = (k + 1) / len(CAPE)  # 아래 줄일수록 크게
        flutter = 3.5 * math.sin(2 * math.pi * (i / max(1, len(vals)) * 2 + k * .35))
        S = Euler((math.radians(-(a * w + flutter * w)), 0, math.radians(z * w))).to_matrix()
        b.rotation_quaternion = (C @ S).to_quaternion()
meta = {'cell': CELL, 'bodyPx': round(FIT * CELL, 1), 'foot': [CELL / 2, round(FOOT * CELL, 1)], 'dirs': DIRS, 'camera': {'elevationDeg': 30, 'azimuthDeg': 45, 'ortho': cam.data.ortho_scale}, 'model': os.path.basename(MODEL), 'actions': {}}
base_rot = root.rotation_euler.z
for name, spec in ACTIONS.items():
    if ONLY and name not in ONLY: continue
    act, proc = action_for(name, spec)
    if not act: print('skip', name); continue
    arm.animation_data_create(); set_action(act)
    f0, f1 = act.frame_range
    if spec.get('stride'):  # 6회차: 렌더 때 애니메이션이 다시 평가되어 hb.location=0 이 지워짐 → 엉덩이 수평 이동 곡선을 끈다(제자리 걸음)
        def _fcs(ac):
            try: return list(ac.fcurves)
            except Exception: return [fc for l in ac.layers for st in l.strips for cb in st.channelbags for fc in cb.fcurves]
        for fc in _fcs(act):
            if fc.data_path == 'pose.bones["Hips"].location' and fc.array_index in (0, 2): fc.mute = True
    n = spec['frames']
    times = [f0 + (f1 - f0) * (i / n if spec['loop'] else i / max(1, n - 1)) for i in range(n)]
    rows = {}
    cape_vals = None
    for di, d in enumerate(DIRS):
        # 모델 정면(-Y)을 카메라 쪽(+45°)으로 돌린 것이 s(화면 아래), 거기서 45°씩 시계 반대로 돌면 se·e·ne… (카메라 오른쪽 = 월드 (1,1))
        root.rotation_euler.z = base_rot + math.radians(45 + (90 * di if len(DIRS) == 4 and NDIR == 4 else 45 * DIRS8.index(d)))
        if cape_vals is None: cape_vals = cape_plan(name, spec, act, times) or []
        tiles = []
        for i, t in enumerate(times):
            sc.frame_set(int(t), subframe=t - int(t))
            # 제자리 동작: 엉덩이 수평 이동을 지운다(게임이 이동을 맡음)
            hb = bone('Hips')
            if hb and spec.get('stride'): hb.location.x = 0; hb.location.z = 0
            spec_loop[0] = spec['loop']; cape_apply(cape_vals, i); flap_apply(name, i, n); face_light_follow()
            if PROBE:  # 렌더 없이: 망토 깃이 두건 위로 솟는지 검사
                bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); zs = {}
                for m in meshes:
                    ev = m.evaluated_get(dg); me = ev.to_mesh(); zs[m.name] = max((ev.matrix_world @ v.co).z for v in me.vertices); ev.to_mesh_clear()
                top = {k: round(v - zs['EGO-hood'], 3) for k, v in zs.items() if v > zs['EGO-hood'] - .01 and k not in ('EGO-hood', 'EGO-body', 'EGO-glove', 'EGO-blade', 'EGO-edge')}
                if top: print('PROBE', name, d, i, top, [[round(x, 1) for x in cape_vals[i]]], flush=True)
                continue
            path = os.path.join(OUT, f'_t_{name}_{d}_{i:02d}.png'); sc.render.filepath = path
            bpy.ops.render.render(write_still=True); tiles.append(path)
        rows[d] = tiles
    if PROBE: continue
    # 줄 시트로 묶기
    for d, tiles in rows.items():
        imgs = [bpy.data.images.load(p) for p in tiles]
        sheet = bpy.data.images.new(f'{name}-{d}', CELL * len(imgs), CELL, alpha=True)
        px = [0.0] * (CELL * len(imgs) * CELL * 4)
        for k, im in enumerate(imgs):
            src = list(im.pixels)
            for y in range(CELL):
                a = y * CELL * 4; b = (y * CELL * len(imgs) + k * CELL) * 4
                px[b:b + CELL * 4] = src[a:a + CELL * 4]
        sheet.pixels = px; sheet.filepath_raw = os.path.join(OUT, f'{name}-{d}.png'); sheet.file_format = 'PNG'; sheet.save()
        for im in imgs: bpy.data.images.remove(im)
        for p in tiles: os.remove(p)
    meta['actions'][name] = {'frames': n, 'fps': spec['fps'], 'loop': spec['loop'], 'procedural': proc, 'phases': spec.get('phases'), 'foot': foot_px()}
    print('done', name, flush=True)
root.rotation_euler.z = base_rot
json.dump(meta, open(os.path.join(OUT, 'sheets.json'), 'w'), ensure_ascii=False, indent=1)
print('ALL DONE', OUT)
