# R1048 EGO 2판 — 2단계: CMU 모션캡처를 EGO 뼈대로 옮긴다(리타깃) + 피격·관측 폐기는 손으로 더한다.
# 실행: python3 ego2_anim.py -- <body.blend> <cmu_dir> <out.blend> [--fps 30]
#  · 리타깃: 뼈마다 '방향(관절 위치)'과 '비틀림 기준 벡터(CMU 뼈 회전으로 돌린 앞/오른쪽)'로 틀을 만들어
#    휴지 자세 틀 → 목표 틀 회전을 구한다. 휴지 자세가 달라도(CMU T 자세 / EGO A 자세) 그대로 옮겨진다.
#  · 걷기·달리기는 자세 거리가 가장 작은 한 주기를 찾아 제자리 반복 고리로 만든다(앞으로 나가는 양은 지움 — 게임이 이동을 맡음).
#  · 동작 이름은 render_sheets.py 가 찾는 이름(Idle·Walk·Run·Attack·Hit·Discard).
import bpy, sys, os, math
import numpy as np
from mathutils import Matrix, Vector, Quaternion, Euler
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cmu

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
BODY, CMU, OUT = argv[0], argv[1], argv[2]
def opt(n, d): return type(d)(argv[argv.index(n) + 1]) if n in argv else d
FPS = opt('--fps', 30)
bpy.ops.wm.open_mainfile(filepath=BODY)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
arm.animation_data_create()
T = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], float)  # CMU → Blender
UP = np.array([0, 0, 1.]); RIGHT = np.array([-1., 0, 0]); FWD = np.array([0, -1., 0])
# 리그 뼈 → (CMU 시작 관절, 끝 관절, 회전을 읽을 CMU 뼈, 비틀림 기준)
MAP = {'Spine': ('root', 'lowerback', 'lowerback', RIGHT), 'Spine1': ('lowerback', 'upperback', 'upperback', RIGHT),
       'Spine2': ('upperback', 'lowerneck', 'thorax', RIGHT), 'Neck': ('lowerneck', 'upperneck', 'upperneck', RIGHT),
       'Head': ('upperneck', 'head', 'head', RIGHT)}
for s, c in (('Left', 'l'), ('Right', 'r')):
    MAP.update({s + 'Shoulder': ('thorax', c + 'clavicle', c + 'clavicle', FWD), s + 'Arm': (c + 'clavicle', c + 'humerus', c + 'humerus', FWD),
                s + 'ForeArm': (c + 'humerus', c + 'radius', c + 'radius', FWD), s + 'Hand': (c + 'radius', c + 'hand', c + 'hand', FWD),
                s + 'UpLeg': (c + 'hipjoint', c + 'femur', c + 'femur', FWD), s + 'Leg': (c + 'femur', c + 'tibia', c + 'tibia', FWD),
                s + 'Foot': (c + 'tibia', c + 'foot', c + 'foot', RIGHT), s + 'ToeBase': (c + 'foot', c + 'toes', c + 'toes', RIGHT)})

def frame3(d, r):
    d = d / (np.linalg.norm(d) + 1e-9); r = r - d * np.dot(r, d); r = r / (np.linalg.norm(r) + 1e-9)
    return np.stack([r, d, np.cross(r, d)], axis=1)  # 열: x=기준, y=뼈 방향, z

PB = arm.pose.bones; BN = arm.data.bones
REST = {b.name: b.matrix_local.copy() for b in BN}
ORDER = []
def walk(b):
    ORDER.append(b.name)
    for c in b.children: walk(c)
for b in BN:
    if b.parent is None: walk(b)
REST_FRAME = {}
for n, (a, b, mb, ref) in MAP.items():
    bn = BN[n]; d = np.array(bn.tail_local - bn.head_local); REST_FRAME[n] = frame3(d, ref)
hb = BN['Hips']; REST_FRAME['Hips'] = frame3(np.array(hb.tail_local - hb.head_local), RIGHT)

def load(asf, amc, a, b):
    sk = cmu.Skeleton(os.path.join(CMU, asf)); fr = cmu.read_amc(os.path.join(CMU, amc))[a:b]
    P = []; M = []
    for f in fr:
        p, m = sk.fk(f)
        P.append({k: T @ v for k, v in p.items()}); M.append({k: T @ v @ T.T for k, v in m.items()})
    return sk, P, M

def leg_len_rig():
    return (BN['LeftUpLeg'].length + BN['LeftLeg'].length)
def leg_len_cmu(P):
    p = P[0]; return np.linalg.norm(p['lfemur'] - p['lhipjoint']) + np.linalg.norm(p['ltibia'] - p['lfemur'])

def heading(p):
    r = p['rhipjoint'] - p['lhipjoint']; r[2] = 0; f = np.cross(UP, r / (np.linalg.norm(r) + 1e-9)); return math.atan2(f[0], -f[1])  # 0 = -Y 를 봄

def find_cycle(P, tmin, tmax, search):
    """자세 거리(뿌리 기준 관절 위치·속도)가 가장 작은 [a, a+T) 를 찾는다."""
    keys = ['lfoot', 'rfoot', 'ltibia', 'rtibia', 'lhand', 'rhand', 'head']
    def feat(i):
        p = P[i]; h = heading(p); c, s = math.cos(-h), math.sin(-h); R = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
        return np.concatenate([R @ (p[k] - p['root'] * np.array([1, 1, 0])) for k in keys])
    F = np.array([feat(i) for i in range(len(P))]); best = None
    for a in range(search[0], min(search[1], len(P) - tmax - 2)):
        for t in range(tmin, tmax):
            d = np.linalg.norm(F[a] - F[a + t]) + .5 * np.linalg.norm((F[a + 1] - F[a]) - (F[a + t + 1] - F[a + t])) * 10
            if best is None or d < best[0]: best = (d, a, t)
    return best

def frame_R(p, m, Ry):
    """한 프레임의 뼈별 월드 회전(휴지 틀 → 목표 틀)."""
    R = {}
    Mr = Ry @ m['root']; R['Hips'] = frame3(Mr @ UP, Mr @ RIGHT) @ REST_FRAME['Hips'].T
    for bn, (a, b, mb, ref) in MAP.items():
        R[bn] = frame3(Ry @ (p[b] - p[a]), Ry @ (m[mb] @ ref)) @ REST_FRAME[bn].T
    return R
def yawm(yaw):
    c, s = math.cos(-yaw), math.sin(-yaw); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
def blend_R(R, R2, w):
    for k in R:
        if k in R2:
            q = Matrix(R[k].tolist()).to_quaternion().slerp(Matrix(R2[k].tolist()).to_quaternion(), w); R[k] = np.array(q.to_matrix())
def retarget(name, P, M, loop, scale, yaw, inplace, add=None, addloc=None):
    n = len(P); act = bpy.data.actions.new(name); arm.animation_data.action = act
    c, s = math.cos(-yaw), math.sin(-yaw); Ry = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
    root0 = P[0]['root'].copy(); drift = (P[-1]['root'] - P[0]['root']) if loop else np.zeros(3)
    rig_hip = np.array(BN['Hips'].head_local)
    cmu_hip_z = np.mean([p['root'][2] for p in P])
    for i in range(n):
        p, m = P[i], M[i]; t = i / max(1, n - 1)
        R = frame_R(p, m, Ry)
        if add: add(i, n, R)
        # 뿌리 위치: 제자리면 수평 이동을 지운다(반복 고리는 처음-끝 선형 표류만)
        rp = p['root'] - root0 - drift * t
        if inplace: rp = rp * np.array([.35, .35, 1])  # 좌우·앞뒤 흔들림은 조금 남김
        rp = Ry @ rp
        loc = Vector((rig_hip[0] + rp[0] * scale, rig_hip[1] + rp[1] * scale, rig_hip[2] + (p['root'][2] - cmu_hip_z) * scale))
        if addloc: loc = loc + Vector(addloc(i, n))
        pose = {}
        for bn in ORDER:
            pb = PB[bn]; rest = REST[bn]
            Rw = Matrix(R.get(bn, np.eye(3)).tolist()) if bn in R else None
            if pb.parent is None:
                parent_chain = rest
            else:
                parent_chain = pose[pb.parent.name] @ REST[pb.parent.name].inverted() @ rest
            if Rw is None:
                pose[bn] = parent_chain
            else:
                rot = Rw @ rest.to_3x3()
                M4 = rot.to_4x4(); M4.translation = loc if pb.parent is None else parent_chain.translation
                pose[bn] = M4
            basis = parent_chain.inverted() @ pose[bn]
            pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = basis.to_quaternion()
            pb.keyframe_insert('rotation_quaternion', frame=i)
            if pb.parent is None:
                pb.location = basis.translation; pb.keyframe_insert('location', frame=i)
    act.use_fake_user = True
    print('action', name, n, 'frames')
    return act

def resample(P, M, src_fps, a, b, dst_fps):
    idx = np.arange(a, b, src_fps / dst_fps).round().astype(int)
    return [P[i] for i in idx], [M[i] for i in idx]

def crossfade(P, M, k):
    """끝 k 프레임을 처음 자세로 섞어 반복 이음매를 없앤다(위치·회전 모두 선형 — 작은 차이에만 씀)."""
    n = len(P)
    for j in range(k):
        w = (j + 1) / (k + 1); i = n - k + j
        P[i] = {kk: P[i][kk] * (1 - w) + P[0][kk] * w for kk in P[i]}
        out = {}
        for kk in M[i]:
            q = Matrix(M[i][kk].tolist()).to_quaternion().slerp(Matrix(M[0][kk].tolist()).to_quaternion(), w)
            out[kk] = np.array(q.to_matrix())
        M[i] = out
    return P, M

# ---- 손 동작 덧씌우기: 캐릭터 기준 축(x=오른쪽 -X 아님, 월드 X)으로 돌린다 ----
def addrot(R, bone, ex, ey, ez):
    """월드 축 회전을 그 뼈와 모든 자식 뼈의 방향에 함께 더한다(자식이 따라오게)."""
    q = np.array(Euler((math.radians(ex), math.radians(ey), math.radians(ez))).to_matrix())
    for b in [BN[bone]] + list(BN[bone].children_recursive):
        if b.name in R: R[b.name] = q @ R[b.name]
def addrot_m(R, bone, q):
    for b in [BN[bone]] + list(BN[bone].children_recursive):
        if b.name in R: R[b.name] = q @ R[b.name]
def axis_angle(axis, deg):
    return np.array(Matrix.Rotation(math.radians(deg), 3, Vector(axis)))
def ease(x): return x * x * (3 - 2 * x)
def env(i, n, keys):
    t = i / max(1, n - 1)
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t0 <= t <= t1: return v0 + (v1 - v0) * ease((t - t0) / max(1e-6, t1 - t0))
    return keys[-1][1]

made = {}
# 대기: 82_09 서 있는 구간 3초, 끝을 처음으로 섞어 반복
sk, P, M = load('82.asf', '82_09.amc', 60, 600)
scale = leg_len_rig() / leg_len_cmu(P)
yaw = float(np.mean([heading(p) for p in P]))
Pi, Mi = resample(P, M, 120, 0, 360, FPS); Pi, Mi = crossfade(Pi, Mi, 10)
def idle_add(i, n, R):  # 숨쉬기: 가슴이 두 번 오르내림(반복 이음매 0)
    b = math.sin(2 * math.pi * 2 * i / n); addrot(R, 'Spine1', -2.2 * b, 0, 0); addrot(R, 'Spine2', -1.8 * b, 0, 0); addrot(R, 'Neck', 3.4 * b, 0, 0)  # 10회차: 가슴 오르내림 키움
    addrot(R, 'RightHand', 3 * math.sin(2 * math.pi * i / n + 1.1), 0, 0)  # 10회차: 칼끝 ±3° 흔들림
    f = R['Head'] @ np.array([0, -1., 0]); yw = math.degrees(math.atan2(f[0], -f[1]))  # 모캡 배우가 고개를 17~51° 돌림 → 75% 되돌려 앞을 보게
    addrot(R, 'Neck', 0, 0, -.75 * yw)
made['Idle'] = retarget('Idle', Pi, Mi, True, scale, yaw, True, idle_add)
idleP, idleM = Pi, Mi
IDLE_R0 = frame_R(idleP[0], idleM[0], yawm(yaw))
# 걷기: 82_09 당당한 걷기에서 한 주기
sk, P, M = load('82.asf', '82_09.amc', 760, 1240)
best = find_cycle(P, 100, 160, (40, 200)); d, a, t = best; print('walk cycle', a + 760, t, round(d, 3))
yaw = float(np.mean([heading(p) for p in P[a:a + t]]))
Pw, Mw = resample(P, M, 120, a, a + t, FPS); Pw, Mw = crossfade(Pw, Mw, 2)
def walk_add(i, n, R):  # 검수: 팔을 몸 쪽으로 붙이고 팔꿈치 15° 굽힘
    addrot(R, 'LeftArm', 0, 0, -7); addrot(R, 'RightArm', 0, 0, 7)
    addrot(R, 'LeftForeArm', -15, 0, 0); addrot(R, 'RightForeArm', -15, 0, 0)
    blend_R(R, {k: IDLE_R0[k] for k in SWORD_ARM if k in IDLE_R0}, .5)  # 8회차: 칼 든 팔 흔들림 절반(칼이 앞으로 찌르듯 나오지 않게)
SWORD_ARM = ('RightArm', 'RightForeArm', 'RightHand')
made['Walk'] = retarget('Walk', Pw, Mw, True, scale, yaw, True, walk_add)
# 달리기: 16_35
sk, P, M = load('16.asf', '16_35.amc', 0, None)
best = find_cycle(P, 55, 95, (0, 60)); d, a, t = best; print('run cycle', a, t, round(d, 3))
yaw = float(np.mean([heading(p) for p in P[a:a + t]]))
Pr, Mr_ = resample(P, M, 120, a, a + t, FPS); Pr, Mr_ = crossfade(Pr, Mr_, 2)
def run_add(i, n, R):  # 검수: 앞으로 12~15° 숙임, 칼끝은 손목만 조금 뒤로
    addrot(R, 'Spine', 10, 0, 0); addrot(R, 'Spine1', 6, 0, 0); addrot(R, 'Head', -9, 0, 0)  # 검수 2회차: 18°
    blend_R(R, {k: IDLE_R0[k] for k in SWORD_ARM if k in IDLE_R0}, .55)  # 8회차: 칼 든 팔은 대기 자세 쪽으로 55%(칼끝 아래·뒤)
    addrot(R, 'RightHand', 12, 0, 0)  # 손목을 크게 꺾으면 팔 흔들림 때 칼이 머리 위로 솟음(2b 렌더)
made['Run'] = retarget('Run', Pr, Mr_, True, leg_len_rig() / leg_len_cmu(P), yaw, True, run_add)
# 공격: 02_07 머리 위로 들었다 내려 베기(1040~1190)
sk, P, M = load('02.asf', '02_07.amc', 960, 1320)  # 965 부근: 손이 옆에 내려온 자세에서 들어 올리기 시작
yaw = heading(P[106])  # 베기 시작 순간의 몸 방향을 앞으로
# 검수 2회차: 베는 구간에 칸을 몰아 준다(시간 다시 매기기). 손 높이 실측(960 기준): 5~95 들어 올림, 106~175 내려 벰, 175~235 멈춤, 235~350 되돌아옴.
#  렌더 16칸 = 들기 5 + 베기 6 + 멈춤 2 + 복귀 3 (render_sheets phases 와 맞춤)
IDX = list(np.linspace(5, 96, 5, endpoint=False)) + list(np.linspace(100, 175, 6, endpoint=False)) + list(np.linspace(175, 235, 2, endpoint=False)) + list(np.linspace(235, 290, 3))
IDX[10] = IDX[9] + 3  # 9회차: 타격 순간 멈춤(9→10 칸이 거의 같은 자세 = 힛스톱)
Pa = [P[int(round(x))] for x in IDX]; Ma = [M[int(round(x))] for x in IDX]
_c, _s = math.cos(-yaw), math.sin(-yaw); RyA = np.array([[_c, -_s, 0], [_s, _c, 0], [0, 0, 1]])
def attack_add(i, n, R):  # 검수: 허리 숙임을 35° 로 제한(망토가 머리 위로 넘어가지 않게)
    v = RyA @ (Pa[i]['lowerneck'] - Pa[i]['root']); v = v / (np.linalg.norm(v) + 1e-9)
    th = math.degrees(math.acos(max(-1, min(1, v[2]))))
    if th > 35:
        ax = np.cross(v, UP); ax = ax / (np.linalg.norm(ax) + 1e-9)
        addrot_m(R, 'Spine', axis_angle(ax, th - 35))
    tw = [0, .4, .8, 1, .7, .3] + [0] * 10   # 검수 3회차: 들어 올릴 때 몸통을 오른쪽으로 20° 틀었다가 벨 때 풀기
    addrot(R, 'Spine1', 0, 0, -20 * tw[min(i, 15)])
    bl = {0: .85, 1: .45, 11: .2, 12: .4, 13: .6, 14: .8, 15: 1.}.get(i, 0)  # 4회차: 처음 2칸은 대기에서 이어지고, 마지막 5칸에 걸쳐 대기로 돌아감
    if bl: blend_R(R, IDLE_R0, bl)
    if i in (8, 9, 10): addrot(R, 'Spine', (4, 8, 8)[i - 8], 0, 0)  # 9회차: 벨 때 상체를 앞으로 8°(무게)
made['Attack'] = retarget('Attack', Pa, Ma, False, leg_len_rig() / leg_len_cmu(P), yaw, True, attack_add)
# 피격: 대기 첫 자세 위에 뒤로 젖힘(빠르게) → 천천히 회복. 몸통 +X 회전 = 앞으로 숙임이므로 음수.
HITK = [(0, 0), (.12, 1), (.35, .85), (.7, .3), (1, 0)]  # 10회차: 첫 칸에 바로 최대  # 검수: 2칸 안에 최대, 몸통 20°+ 뒤로, 무게중심 10cm 뒤, 오른발 한 걸음 뒤로
def hit_add(i, n, R):
    k = env(i, n, HITK)
    addrot(R, 'Spine', -14 * k, 0, 5 * k); addrot(R, 'Spine1', -12 * k, 0, 4 * k); addrot(R, 'Spine2', -7 * k, 0, 0); addrot(R, 'Head', -15 * k, 0, 7 * k)  # 10회차: 반동 ×1.4
    addrot(R, 'LeftArm', 0, -18 * k, 0); addrot(R, 'RightArm', 0, 18 * k, 0)
    addrot(R, 'LeftUpLeg', -7 * k, 0, 0); addrot(R, 'RightUpLeg', 14 * k, 0, 0); addrot(R, 'RightLeg', 8 * k, 0, 0); addrot(R, 'RightFoot', -10 * k, 0, 0)
def hit_loc(i, n):
    k = env(i, n, HITK); return (0, .1 * k, -.025 * k)
Ph, Mh = idleP[:9], idleM[:9]
made['Hit'] = retarget('Hit', Ph, Mh, False, scale, float(np.mean([heading(p) for p in idleP])), True, hit_add, hit_loc)
# 관측 폐기: 왼손을 얼굴 앞으로 들어 쥐었다가(모음) 바깥으로 펼쳐 흩뜨림(놓음)
# 검수: 얼굴 앞 15cm 에서 3칸 멈춤 → 바깥으로 120° 호, 어깨·시선이 따라감 → 고요히 내림(20칸)
def discard_add(i, n, R):
    r = env(i, n, [(0, 0), (.28, 1), (.8, 1), (1, 0)])                  # 팔 들기
    g = env(i, n, [(0, 0), (.28, 1), (.45, 1), (.62, 0), (1, 0)])        # 쥐기(팔꿈치 굽혀 얼굴 앞으로) — .28~.45 멈춤
    o = env(i, n, [(0, 0), (.45, 0), (.68, 1), (.86, 1), (1, 0)])        # 120° 펼치기 — 끝에서 3칸 멈춤
    addrot(R, 'LeftArm', (-78 + 8 * o) * r, 0, -16 * g + 120 * o)       # X− = 앞으로 들기, Z+ = 왼팔을 바깥으로
    addrot(R, 'LeftForeArm', -64 * g, 0, 0)
    addrot(R, 'Spine1', 4 * g - 4 * o, 0, -6 * g + 14 * o); addrot(R, 'Spine2', 0, 0, 8 * o)
    addrot(R, 'Head', 8 * g - 6 * o, 0, 20 * o)
Pd, Md = (idleP * 2)[:24], (idleM * 2)[:24]
made['Discard'] = retarget('Discard', Pd, Md, False, scale, float(np.mean([heading(p) for p in idleP])), True, discard_add)
arm.animation_data.action = made['Idle']
bpy.context.scene.render.fps = FPS
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT)
