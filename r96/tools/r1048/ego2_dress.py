# R1048 EGO 2판 — 3단계: 의상(원화 기준: 붉은 안감 두건·흰 머리·검은 긴 코트와 금장·가죽 장갑·끈 장화·흰→붉은 깃털 망토·붉은 술 환도 검).
# 실행: python3 ego2_dress.py -- <anim.blend> <out.blend>
#  · 몸을 따라 입히는 옷(바지·코트 윗부분·장화·장갑·두건)은 몸 메시를 뼈 무게로 골라 복제해 바깥으로 띄운다(무게가 그대로 따라감).
#  · 코트 자락은 허리 고리에서 종아리까지 퍼지는 판(앞·옆 트임)으로 새로 만들고, 아래로 갈수록 허벅지 무게를 섞는다.
#  · 깃털 망토는 등 위쪽 망토 뼈(cape0..)에 줄마다 묶는다 — render_sheets 의 스프링 2차 동작이 돌린다.
import bpy, bmesh, sys, math, random
from mathutils import Vector, Matrix, Euler

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
SRC, OUT = argv[0], argv[1]
def _opt(n, d): return type(d)(argv[argv.index(n) + 1]) if n in argv else d
import os, glob
TEX = _opt('--tex', '')  # 깃털·머리 카드 텍스처 폴더(tex_feather.py 결과 또는 제미나이 가공본). 없으면 정점색 깃털
FEATHER_TEX = sorted(glob.glob(os.path.join(TEX, 'feather_*.png'))) if TEX else []
HAIR_TEX = sorted(glob.glob(os.path.join(TEX, 'hair_*.png'))) if TEX else []
def _tf(n): p_ = os.path.join(TEX, n) if TEX else ''; return p_ if p_ and os.path.exists(p_) else ''
GOLD_TEX, COAT_H, FACE_TEX = _tf('gold_trim.png'), _tf('coat_height.png'), _tf('face_front.png')  # prep_gemini.py 결과
FILL = _opt('--fill', float(open(os.path.join(TEX, 'fill.txt')).read()) if TEX and os.path.exists(os.path.join(TEX, 'fill.txt')) else .42)  # 텍스처 폭 중 깃털 반폭 비율(prep_gemini.py 가 fill.txt 로 적음)
random.seed(1048)
bpy.ops.wm.open_mainfile(filepath=SRC)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
body = bpy.data.objects['EGO-body']
sc = bpy.context.scene
BN = arm.data.bones
def J(n, tail=False): b = BN[n]; return (b.tail_local if tail else b.head_local).copy()
H = J('Head', True).z
HS = (J('Head', True).z - J('Head').z) / .225  # 머리 크기 비(실측 기준 몸 = 1; 다리 늘린 몸은 키를 다시 맞추며 줄어듦)

# ---------- 재질 ----------
def P(m): return m.node_tree.nodes['Principled BSDF']
def mat(name, rgb, rough=.5, metal=0., coat=0., sss=0., sheen=0., emit=None, bump=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True; p = P(m); nt = m.node_tree
    p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    if coat: p.inputs['Coat Weight'].default_value = coat
    if sss: p.inputs['Subsurface Weight'].default_value = sss; p.inputs['Subsurface Radius'].default_value = (.9, .35, .2)
    if sheen: p.inputs['Sheen Weight'].default_value = sheen
    if emit: p.inputs['Emission Color'].default_value = (*emit[0], 1); p.inputs['Emission Strength'].default_value = emit[1]
    if bump:  # 천·가죽 결
        tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = 140; tex.inputs['Detail'].default_value = 6
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
        nt.links.new(tex.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], p.inputs['Normal'])
    return m
def leather_mat(name, dark, light, rough=(.3, .55), coat=.3, grain=420, bump=.35):
    """11회차(장식 질감): 무료 절차 가죽 — 보로노이 오톨도톨 결 + 큰 주름 노이즈. 색은 어두운 쪽↔닳은 쪽 두 톤, 거칠기도 결 따라 바뀜(70px 에서 '검은 덩어리'가 아니라 가죽으로 읽히게)."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; p = P(m); L = nt.links.new
    tc = nt.nodes.new('ShaderNodeTexCoord')
    vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = grain; L(tc.outputs['Object'], vo.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 18; nz.inputs['Detail'].default_value = 8; L(tc.outputs['Object'], nz.inputs['Vector'])
    wr = nt.nodes.new('ShaderNodeMapRange'); wr.clamp = True; L(nz.outputs['Fac'], wr.inputs['Value']); wr.inputs['From Min'].default_value = .42; wr.inputs['From Max'].default_value = .66
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; L(wr.outputs['Result'], mx.inputs['Factor'])
    sk = lambda ss, i_: next(x for x in ss if x.identifier == i_)
    sk(mx.inputs, 'A_Color').default_value = (*dark, 1); sk(mx.inputs, 'B_Color').default_value = (*light, 1)
    L(sk(mx.outputs, 'Result_Color'), p.inputs['Base Color'])
    rr = nt.nodes.new('ShaderNodeMapRange'); rr.clamp = True; L(vo.outputs['Distance'], rr.inputs['Value']); rr.inputs['From Max'].default_value = .6
    rr.inputs['To Min'].default_value = rough[0]; rr.inputs['To Max'].default_value = rough[1]; L(rr.outputs['Result'], p.inputs['Roughness'])
    if coat: p.inputs['Coat Weight'].default_value = coat
    ad = nt.nodes.new('ShaderNodeMath'); ad.operation = 'MULTIPLY_ADD'; ad.inputs[1].default_value = .35; L(vo.outputs['Distance'], ad.inputs[0]); L(nz.outputs['Fac'], ad.inputs[2])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = .0015
    L(ad.outputs['Value'], bp.inputs['Height']); L(bp.outputs['Normal'], p.inputs['Normal'])
    return m
M = dict(
    skin=mat('skin', (.86, .7, .62), .45, sss=.25),
    cloth=mat('cloth', (.007, .0065, .007), .85, sheen=.35, bump=.15),
    coat=mat('coat', (.011, .0098, .012), .85, sheen=.35, bump=.3),
    lining=mat('lining', (.254, .005, .008), .55, sheen=.4),
    leather=leather_mat('leather', (.024, .011, .009), (.075, .034, .024)),  # 11회차: 절차 가죽(검은 덩어리 → 닳은 소가죽)
    glove=leather_mat('glove', (.03, .009, .01), (.11, .025, .028), rough=(.25, .45), coat=.45, grain=650, bump=.25),  # 검붉은 광택 가죽 장갑
    gold=mat('gold', (.78, .5, .12), .28, 1.),
    hood=mat('hood', (.009, .007, .009), .82, sheen=.45, bump=.08),
    hair=mat('hair', (.86, .84, .82), .38, sheen=.5, emit=((.86, .84, .82), .6)),  # #E8E4E0, 그늘에서도 읽히게
    blade=mat('blade', (.75, .77, .8), .3, .9, emit=((.85, .88, .95), .2)),  # 강철 흰빛(70px 에서 읽히게, 8회차: 흰 발광 .2)
    capelin=mat('capelin', (.16, .008, .012), .7, sheen=.4),  # 망토 밑 안감(검붉게 — 들려도 흰 판으로 안 보이게)
    edge=mat('edge', (.9, .05, .1), .25, emit=((1, .06, .12), .5)),
    tassel=mat('tassel', (.6, .01, .04), .55, sheen=.5),
    eye=mat('eyeglow', (.9, .05, .08), .3, emit=((1, .08, .1), .8)),
    socket=mat('socket', (.012, .004, .005), .6),
)
def feather_mat():
    m = bpy.data.materials.new('feather'); m.use_nodes = True; nt = m.node_tree; p = P(m)
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = .55; p.inputs['Sheen Weight'].default_value = .6
    p.inputs['Subsurface Weight'].default_value = .15
    # 붉은 끝은 살짝 빛나게(원화의 붉은 깃 끝)
    sep = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(vc.outputs['Color'], sep.inputs['Color'])
    mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'SUBTRACT'; nt.links.new(sep.outputs[0], mth.inputs[0]); nt.links.new(sep.outputs[1], mth.inputs[1])
    sub2 = nt.nodes.new('ShaderNodeMath'); sub2.operation = 'SUBTRACT'; sub2.use_clamp = True; sub2.inputs[1].default_value = .15; nt.links.new(mth.outputs[0], sub2.inputs[0])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = .7; nt.links.new(sub2.outputs[0], mul.inputs[0])
    p.inputs['Emission Color'].default_value = (1, .08, .1, 1); nt.links.new(mul.outputs[0], p.inputs['Emission Strength'])
    return m
M['feather'] = feather_mat()
def tex_mat(path, rough=.55, sheen=.5, emit=0., tint=None, tag='', grad=False, g0=.72):
    m = bpy.data.materials.new('tex-' + os.path.basename(path) + tag); m.use_nodes = True; nt = m.node_tree; p = P(m)
    im = nt.nodes.new('ShaderNodeTexImage'); im.image = bpy.data.images.get(os.path.basename(path)) or bpy.data.images.load(path); im.image.alpha_mode = 'STRAIGHT'
    if tint:  # 색 배율(깃털 하이라이트 날림 줄이기 .72, 통째 진홍·검은 속깃)
        mx_ = nt.nodes.new('ShaderNodeMix'); mx_.data_type = 'RGBA'; mx_.blend_type = 'MULTIPLY'; mx_.inputs['Factor'].default_value = 1
        nt.links.new(im.outputs['Color'], [x for x in mx_.inputs if x.identifier == 'A_Color'][0]); [x for x in mx_.inputs if x.identifier == 'B_Color'][0].default_value = (*tint, 1)
        col_out = [x for x in mx_.outputs if x.identifier == 'Result_Color'][0]
    else: col_out = im.outputs['Color']
    if grad:  # 9회차: 깃 뿌리 .6 → 끝 1.0 명도(층 깊이). 카드 UV v = 1 - t
        uvn_ = nt.nodes.new('ShaderNodeUVMap'); sp_ = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(uvn_.outputs['UV'], sp_.inputs['Vector'])
        mr_ = nt.nodes.new('ShaderNodeMapRange'); nt.links.new(sp_.outputs['Y'], mr_.inputs['Value']); mr_.inputs['To Min'].default_value = 1.; mr_.inputs['To Max'].default_value = g0  # 10회차: 뿌리 .6→.72
        mg_ = nt.nodes.new('ShaderNodeMix'); mg_.data_type = 'RGBA'; mg_.blend_type = 'MULTIPLY'; mg_.inputs['Factor'].default_value = 1
        nt.links.new(col_out, [x for x in mg_.inputs if x.identifier == 'A_Color'][0]); cr_ = nt.nodes.new('ShaderNodeCombineColor')
        for ch in ('Red', 'Green', 'Blue'): nt.links.new(mr_.outputs['Result'], cr_.inputs[ch])
        nt.links.new(cr_.outputs['Color'], [x for x in mg_.inputs if x.identifier == 'B_Color'][0])
        col_out = [x for x in mg_.outputs if x.identifier == 'Result_Color'][0]
    nt.links.new(col_out, p.inputs['Base Color'])
    nt.links.new(im.outputs['Alpha'], p.inputs['Alpha'])
    p.inputs['Roughness'].default_value = rough; p.inputs['Sheen Weight'].default_value = sheen
    if emit: nt.links.new(col_out, p.inputs['Emission Color']); p.inputs['Emission Strength'].default_value = emit
    try: m.surface_render_method = 'DITHERED'
    except Exception: pass
    return m
def _node(nt, kind, **kw):
    n = nt.nodes.new(kind)
    for k_, v_ in kw.items(): setattr(n, k_, v_)
    return n
def _sock(sockets, ident): return next(x for x in sockets if x.identifier == ident)
def gold_tex_mat(path):
    """금장 띠 문양(UV 'UV'): 문양 = 금속 금, 바탕 = 어두운 칠, 문양 높이로 범프."""
    m = bpy.data.materials.new('goldtex'); m.use_nodes = True; nt = m.node_tree; p = P(m); L = nt.links.new
    uvn = _node(nt, 'ShaderNodeUVMap', uv_map='UV'); im = _node(nt, 'ShaderNodeTexImage'); im.image = bpy.data.images.load(path)
    L(uvn.outputs['UV'], im.inputs['Vector'])
    bw = _node(nt, 'ShaderNodeRGBToBW'); L(im.outputs['Color'], bw.inputs['Color'])
    mr = _node(nt, 'ShaderNodeMapRange', clamp=True); L(bw.outputs['Val'], mr.inputs['Value']); mr.inputs['From Min'].default_value = .04; mr.inputs['From Max'].default_value = .3
    mx = _node(nt, 'ShaderNodeMix', data_type='RGBA'); L(mr.outputs['Result'], mx.inputs['Factor'])
    _sock(mx.inputs, 'A_Color').default_value = (.09, .05, .015, 1); L(im.outputs['Color'], _sock(mx.inputs, 'B_Color'))
    L(_sock(mx.outputs, 'Result_Color'), p.inputs['Base Color'])
    rr = _node(nt, 'ShaderNodeMapRange', clamp=True); L(mr.outputs['Result'], rr.inputs['Value']); rr.inputs['To Min'].default_value = .5; rr.inputs['To Max'].default_value = .26
    L(rr.outputs['Result'], p.inputs['Roughness'])
    mm = _node(nt, 'ShaderNodeMapRange', clamp=True); L(mr.outputs['Result'], mm.inputs['Value']); mm.inputs['To Min'].default_value = .45; mm.inputs['To Max'].default_value = 1.
    L(mm.outputs['Result'], p.inputs['Metallic'])
    bp = _node(nt, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = .6; bp.inputs['Distance'].default_value = .002
    L(bw.outputs['Val'], bp.inputs['Height']); L(bp.outputs['Normal'], p.inputs['Normal'])
    L(im.outputs['Color'], p.inputs['Emission Color']); em = _node(nt, 'ShaderNodeMath', operation='MULTIPLY'); em.inputs[1].default_value = .3
    L(mr.outputs['Result'], em.inputs[0]); L(em.outputs[0], p.inputs['Emission Strength'])  # 6회차: 70px 에서도 금선이 읽히게
    return m
GOLD_AR = 4.57
if GOLD_TEX:
    M['goldtex'] = gold_tex_mat(GOLD_TEX); _gi = bpy.data.images[os.path.basename(GOLD_TEX)]; GOLD_AR = _gi.size[0] / max(1, _gi.size[1])
GOLDT = M.get('goldtex', M['gold'])
def coat_tex_copy(base, dims, tile=1.0):
    """천 높이맵을 Generated(뼈 변형 전 좌표) 상자 투영으로 — 걸어도 결이 미끄러지지 않는다. 조각 크기마다 배율이 달라 조각마다 사본."""
    m = base.copy(); m.name = base.name + '-tex'; nt = m.node_tree; L = nt.links.new
    noise = next((n for n in nt.nodes if n.type == 'TEX_NOISE'), None); bp = next((n for n in nt.nodes if n.type == 'BUMP'), None)
    if not bp: return m
    tc = _node(nt, 'ShaderNodeTexCoord'); mp = _node(nt, 'ShaderNodeMapping'); mp.inputs['Scale'].default_value = tuple(max(d, .01) / tile for d in dims)
    im = _node(nt, 'ShaderNodeTexImage', projection='BOX', projection_blend=.3); im.image = bpy.data.images.get(os.path.basename(COAT_H)) or bpy.data.images.load(COAT_H)
    im.image.colorspace_settings.name = 'Non-Color'
    L(tc.outputs['Generated'], mp.inputs['Vector']); L(mp.outputs['Vector'], im.inputs['Vector']); L(im.outputs['Color'], bp.inputs['Height'])
    if noise: nt.nodes.remove(noise)
    bp.inputs['Distance'].default_value = .004
    return m
FEATHER_MATS = [tex_mat(f, emit=.12, tint=(.72, .72, .72), grad=True) for f in FEATHER_TEX]
FEATHER_MATS_SH = [tex_mat(f, emit=.30, tint=(.72, .72, .72), tag='-sh', grad=True, g0=.85) for f in FEATHER_TEX]  # 10회차: 어깨 깃 밝게  # 8회차: 그늘 쪽 깃이 검은 줄로 보이지 않게 자기 색 .15
_wf = [f for f in FEATHER_TEX if 'white' in os.path.basename(f)] or FEATHER_TEX
FEATHER_TINTS = [tex_mat(_wf[0], emit=.04, tint=(.42, .03, .05), tag='-crimson', grad=True), tex_mat(_wf[-1], .7, .3, tint=(.05, .04, .045), tag='-black')] if _wf else []
HAIR_MATS = [tex_mat(f, .38, .5, .3 if FACE_TEX else .6) for f in HAIR_TEX]
body.data.materials.clear(); body.data.materials.append(M['skin']); body.data.materials.append(M['socket'])
for poly in body.data.polygons:  # 눈알(머리 앞 작은 섬)을 어두운 눈구멍 재질로
    c_ = poly.center
    e_ = J('Head') + Vector((0, -.03, .107)) * HS
    if abs(abs(c_.x) - .035 * HS) < .016 and abs(c_.z - e_.z) < .016 and c_.y < e_.y + .02: poly.material_index = 1
# 눈(머리 무게만 가진 작은 덩어리) 붉게
# ---------- 뼈 무게로 몸 부분 고르기 ----------
gname = {g.index: g.name for g in body.vertex_groups}
def dominant(v):
    best = max(v.groups, key=lambda x: x.weight, default=None)
    return gname.get(best.group) if best else None
def weight(v, name):
    for g in v.groups:
        if gname.get(g.group) == name: return g.weight
    return 0.
DOM = [dominant(v) for v in body.data.vertices]
# 검수 3회차: 술통형 몸통 → 허리 -10%·가슴 -7%(몸통 뼈 무게만큼), 머리 94%(7.5등신 쪽)
_TS = ('Hips', 'Spine', 'Spine1', 'Spine2')
_zs, _zc = J('Spine').z + .02, J('Spine2').z
_hj = J('Head')
for v in body.data.vertices:
    tw_ = sum(weight(v, g_) for g_ in _TS)
    if tw_ > 0 and J('Hips').z - .05 < v.co.z < J('Neck').z:
        f_ = .2 * math.exp(-((v.co.z - _zs) / .1) ** 2) + .08 * math.exp(-((v.co.z - _zc) / .09) ** 2)  # 4회차: 배 -12% 더
        cy_ = J('Spine1').y; v.co.x *= 1 - f_ * tw_ * .6; v.co.y = cy_ + (v.co.y - cy_) * (1 - f_ * tw_)
    hw_ = weight(v, 'Head')
    if hw_ > 0: v.co = _hj + (v.co - _hj) * (1 - .06 * hw_)

def shell(name, keep, offset, m, solid=0., lining=None, smooth=1, relax=0):
    """몸에서 keep(v_index)→True 인 면만 복제해 법선 방향으로 offset 만큼 띄운 옷 조각(무게 그대로)."""
    bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
    bpy.ops.object.duplicate(); o = bpy.context.object; o.name = name
    me = o.data; bm = bmesh.new(); bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    dead = [v for v in bm.verts if not keep(v.index)]
    bmesh.ops.delete(bm, geom=dead, context='VERTS')
    bm.normal_update()
    for v in bm.verts: v.co += v.normal * offset
    for _ in range(relax):  # 몸의 잔 굴곡(귀·코·근육)을 지워 천처럼 매끈하게
        bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=.6, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.to_mesh(me); bm.free()
    me.materials.clear(); me.materials.append(m)
    if lining: me.materials.append(lining)
    if smooth:
        c = o.modifiers.new('cs', 'CORRECTIVE_SMOOTH'); c.iterations = 4
    if solid:  # 두께는 맨 마지막(아마추어·보정 뒤)
        s = o.modifiers.new('solid', 'SOLIDIFY'); s.thickness = solid; s.offset = 1; s.material_offset = 1 if lining else 0
    return o
V = body.data.vertices
headc = J('Head') + Vector((0, .045, .115)) * .94 * HS   # 머리뼈 가운데(실측: 머리 z 1.555~1.8, y -.175~.06)
EYEC = J('Head') + Vector((0, -.03, .107)) * .94 * HS    # 두 눈 가운데(실측: 눈알 ±.035, -.13, 1.682)
if FACE_TEX:  # 얼굴 참고 그림을 정면 평면 투영(UV 'faceproj', 가림 정도는 UV 'facemask'.x) — 눈 위치·눈 사이를 그림에 맞춘다
    FE_PX, FE_PY, FE_SP, FE_N = 630, 468, 280, 1254          # 그림 속 두 눈 가운데·눈 사이(px), 그림 크기
    ppm = FE_SP / (.07 * .94 * HS)
    me_ = body.data; fu = me_.uv_layers.new(name='faceproj'); fm = me_.uv_layers.new(name='facemask')
    def _ss(x): x = min(1., max(0., x)); return x * x * (3 - 2 * x)
    for lp in me_.loops:
        co = me_.vertices[lp.vertex_index].co
        fu.data[lp.index].uv = ((FE_PX + (co.x - EYEC.x) * ppm) / FE_N, 1 - (FE_PY - (co.z - EYEC.z) * ppm) / FE_N)
        hw_ = weight(me_.vertices[lp.vertex_index], 'Head') + weight(me_.vertices[lp.vertex_index], 'Neck')
        mk = _ss(1 - (co.y - EYEC.y - .03) / .05) * _ss(1 - (abs(co.x - EYEC.x) - .062) / .014) * _ss((co.z - (EYEC.z - .16)) / .03) * min(1., hw_)
        fm.data[lp.index].uv = (mk, 0)
    sk = M['skin'].copy(); sk.name = 'skinface'; nt = sk.node_tree; L = nt.links.new; p = P(sk)
    u1 = _node(nt, 'ShaderNodeUVMap', uv_map='faceproj'); u2 = _node(nt, 'ShaderNodeUVMap', uv_map='facemask')
    im = _node(nt, 'ShaderNodeTexImage', extension='CLIP'); im.image = bpy.data.images.load(FACE_TEX); L(u1.outputs['UV'], im.inputs['Vector'])
    sp = _node(nt, 'ShaderNodeSeparateXYZ'); L(u2.outputs['UV'], sp.inputs['Vector'])
    mx = _node(nt, 'ShaderNodeMix', data_type='RGBA'); L(sp.outputs['X'], mx.inputs['Factor'])
    _sock(mx.inputs, 'A_Color').default_value = p.inputs['Base Color'].default_value[:]; L(im.outputs['Color'], _sock(mx.inputs, 'B_Color'))
    L(_sock(mx.outputs, 'Result_Color'), p.inputs['Base Color'])
    me_.materials[0] = sk
    for poly in me_.polygons: poly.material_index = 0  # 눈은 그림이 그린다(눈구멍 재질 끔)
ank_z = J('LeftFoot').z
def is_face(i):
    v = V[i].co
    return DOM[i] in ('Head', 'Neck') and v.y < headc.y - .03 and (headc.z - .14) < v.z < (headc.z + .07) and abs(v.x) < .085
TORSO = {'Hips', 'Spine', 'Spine1', 'Spine2', 'LeftShoulder', 'RightShoulder', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm'}
LEGS = {'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'}
# 속옷(검은 바지·셔츠): 몸통·다리 전부
under = shell('EGO-under', lambda i: (DOM[i] in TORSO | LEGS or (DOM[i] == 'Neck' and V[i].co.z < J('Neck').z + .03)) and V[i].co.z > ank_z + .02, .004, M['cloth'], smooth=0)
# 코트 윗부분: 몸통+팔(손목 3cm 전까지)
wristL, wristR = J('LeftHand'), J('RightHand')
def coat_keep(i):
    d = DOM[i]; v = V[i].co
    if d in ('LeftForeArm', 'RightForeArm'):
        w = wristL if v.x > 0 else wristR
        return (v - w).length > .06
    return d in TORSO and v.z > J('Hips').z - .07 or (d == 'Neck' and v.z < J('Neck').z + .05)
coat = shell('EGO-coat', coat_keep, .013, M['coat'], solid=.006, lining=M['lining'], relax=6)
_zw = J('Spine').z + .03; _cyw = J('Spine').y
for v in coat.data.vertices:  # 검수: 허리 둘레를 줄여 '흉갑·배' 덩어리 느낌을 없앰
    f = math.exp(-((v.co.z - _zw) / .09) ** 2) * .05
    v.co.x *= 1 - f; v.co.y = _cyw + (v.co.y - _cyw) * (1 - f)
# 장갑·건틀릿
glove = shell('EGO-glove', lambda i: DOM[i] in ('LeftHand', 'RightHand') or (DOM[i] in ('LeftForeArm', 'RightForeArm') and (V[i].co - (wristL if V[i].co.x > 0 else wristR)).length < .085), .0035, M['glove'], smooth=0)
# 장화: 정강이 아래쪽 + 발
boot = shell('EGO-boot', lambda i: DOM[i] in ('LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase') or (DOM[i] in ('LeftLeg', 'RightLeg') and V[i].co.z < J('LeftLeg').z - .03), .016, M['leather'], relax=26)
for v in boot.data.vertices:  # 밑창: 바닥을 평평하게
    if v.co.z < .03: v.co.z = max(0., v.co.z - .004)
# 두건: 몸 메시를 복제하지 않고 머리 둘레 매개 격자로 새로 만든다(검수 1회차: 얼굴이 가려짐·원뿔 모양).
#  위 85°→아래 -24° 머리 줄 + 어깨로 흘러내리는 자락 4줄. 얼굴 트임은 이마 위(52°↑)는 닫히고 아래로 갈수록 반각 62°까지.
#  머리 위 여유 10~15%, 트임 가장자리(챙)는 앞으로 .03, 뒤 꼭대기는 살짝 뾰족. 안쪽은 붉은 안감(#8a1016).
nk = J('Neck'); hc2 = headc + Vector((0, .005, 0))
EA, EB_, EC = .125 * .94 * HS, .137 * .94 * HS, .142 * .94 * HS
ELEVS = [86, 74, 62, 50, 38, 26, 14, 2, -10, -22]; DRAPE = 4; NA = 40
def open_half(e):  # 검수 2회차: 트임 폭 26cm 쪽으로 넓힘
    if e >= 62: return 0.   # 6회차: 트임 +15%
    if e <= 26: return 80.
    return 80. * (62 - e) / 36
hv = []; hgrp = {'Head': [], 'Neck': [], 'Spine2': []}
NR = len(ELEVS) + DRAPE
ring_last = None
for r in range(NR):
    dr = 0. if r < len(ELEVS) else (r - len(ELEVS) + 1) / DRAPE
    e = ELEVS[min(r, len(ELEVS) - 1)]
    wo = math.radians(open_half(e) if dr == 0 else 80 + 6 * dr)
    ce, se_ = math.cos(math.radians(e)), math.sin(math.radians(e))
    for c in range(NA + 1):
        az = wo + (2 * math.pi - 2 * wo) * c / NA  # 0 = 앞(-Y), 시계 반대
        dx, dy = math.sin(az), -math.cos(az)
        if dr == 0:
            p = hc2 + Vector((dx * EA * ce, dy * EB_ * ce, EC * se_ * (.87 if se_ > 0 else 1)))  # 6회차: 탄두 모양 → 높이 -13%
            p += Vector((0, .018, .008)) * max(0, dy) * max(0, se_) ** 2      # 뒤 꼭대기(5cm 이내)
            p.z += .008 * max(0, -dy) * max(0, se_)                            # 이마 위 여유
        else:  # 자락: 마지막 머리 줄에서 어깨 고리(반지름 .21×.16, 목 아래 .1)로
            top = hc2 + Vector((dx * EA * ce, dy * EB_ * ce, EC * se_ * (.87 if se_ > 0 else 1)))
            sh = Vector((dx * .215, nk.y + .012 + dy * .155, nk.z - .1 - .02 * max(0, dy)))
            k = dr ** .8; p = top.lerp(sh, k)
            p += Vector((dx, dy, 0)) * (.02 * math.sin(math.pi * dr) + .007 * max(0, dy) * math.sin(4 * math.pi * dr))  # 부풂 + 목 뒤 주름 2줄
        edge = min(c, NA - c)
        if wo > 0 and edge <= 2:  # 챙: 트임 가장자리를 앞으로·조금 바깥으로
            k = (1 - edge / 3) * (1 if dr == 0 else max(0, 1 - dr * 1.5))
            p += Vector((dx * .006, -.015, 0)) * k
        if dr == 0 and 40 <= e <= 64:  # 이마 위 닫힌 줄의 앞쪽도 챙처럼 내밀기
            p.y -= .01 * max(0, -dy) ** 4
        hv.append(p); i = len(hv) - 1
        if dr == 0 and e > -5: hgrp['Head'].append((i, 1.))
        elif dr == 0: hgrp['Head'].append((i, .7)); hgrp['Neck'].append((i, .3))
        else:
            hgrp['Head'].append((i, .45 * (1 - dr))); hgrp['Neck'].append((i, .55 * (1 - dr))); hgrp['Spine2'].append((i, dr))
hf = []
for r in range(NR - 1):
    for c in range(NA):
        a_ = r * (NA + 1) + c; hf.append((a_, a_ + 1, a_ + NA + 2, a_ + NA + 1))
hv.append(hc2 + Vector((0, .006, EC + .002))); pole = len(hv) - 1; hgrp['Head'].append((pole, 1.))  # 꼭대기 마개 — 무게를 꼭 줘야 함(없으면 휴지 자리에 남아 뿔처럼 솟음)
for c in range(NA): hf.append((c + 1, c, pole))
# 바깥을 보게(뒤 가운데 면의 법선이 바깥인지 보고 뒤집기)
fi = 4 * NA + NA // 2; f0 = hf[fi]
nrm = (hv[f0[1]] - hv[f0[0]]).cross(hv[f0[3]] - hv[f0[0]])
if nrm.dot(hv[f0[0]] - hc2) < 0: hf = [tuple(reversed(f)) for f in hf]
parts = [under, coat, glove, boot]


# ---------- 새로 만드는 조각: 뼈 무게를 직접 준다 ----------
def new_obj(name, verts, faces, m, groups, cols=None, uvs=None, mats=None, fmat=None):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o)
    for m_ in (mats or [m]): me.materials.append(m_)
    if fmat:
        for p_, k_ in zip(me.polygons, fmat): p_.material_index = k_
    if uvs:
        uvl = me.uv_layers.new(name='UV')
        for p_ in me.polygons:
            for li in p_.loop_indices: uvl.data[li].uv = uvs[me.loops[li].vertex_index]
    for gname_, ws in groups.items():
        g = o.vertex_groups.get(gname_) or o.vertex_groups.new(name=gname_)
        for idx, w in ws:
            if w > 0: g.add([idx], w, 'REPLACE')
    if cols:
        ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        for i, c in enumerate(cols): ca.data[i].color = c
    for p in me.polygons: p.use_smooth = True
    parts.append(o); return o
def rigid(o, bone):
    g = o.vertex_groups.new(name=bone); g.add(list(range(len(o.data.vertices))), 1.0, 'REPLACE'); parts.append(o); return o

hood = new_obj('EGO-hood', hv, hf, M['hood'], hgrp); hood.data.materials.append(M['lining'])
s = hood.modifiers.new('solid', 'SOLIDIFY'); s.thickness = .007; s.material_offset = 1
# 코트 자락: 허리 둘레 고리 → 종아리 단, 앞 트임
hipz = J('Hips').z - .06; hemz = J('LeftLeg').z - .16  # 무릎 아래 ~ 종아리 가운데(검수: 다리·장화가 보이게)
ring_body = [V[i].co for i in range(len(V)) if abs(V[i].co.z - hipz) < .01 and DOM[i] in ('Hips', 'LeftUpLeg', 'RightUpLeg')]
cy = sum((c.y for c in ring_body), 0) / max(1, len(ring_body))
rx = max(abs(c.x) for c in ring_body) + .03; ry = max(abs(c.y - cy) for c in ring_body) + .035
NV = 14; gap = math.radians(22)  # 앞 트임 반각(전체 44°)
def skirt_pt(a, t):
    flare = 1 + .52 * t ** 1.3 + .06 * math.sin(a * 6) * t  # A라인
    back = 1 + .12 * t * max(0, math.sin(a))
    return Vector((math.cos(a) * rx * flare * back, cy + math.sin(a) * ry * flare * back, hipz + (hemz - hipz) * t - .05 * t * max(0, math.sin(a))))
# 코트 판 4장: 앞왼·뒤왼·뒤오른·앞오른. 위쪽(35%까지)은 서로 겹쳐 닫히고, 아래로는 옆·뒤 트임이 벌어진다.
PANELS = [(-90 + 22, 0), (0, 90), (90, 180), (180, 270 - 22)]
hem_rows = []
for pi_, (d0, d1) in enumerate(PANELS):
    ns = max(6, int((d1 - d0) / 9)); verts = []; faces = []; gh = []; gl = []; gr = []
    for j in range(NV + 1):
        t = j / NV
        ov = 5 * max(0, 1 - t / .35); sl = 2.5 * max(0, (t - .35) / .65)  # 위는 겹침(°), 아래는 트임(°)
        lo_ = d0 if pi_ == 0 else d0 - ov + sl
        hi_ = d1 if pi_ == 3 else d1 + ov - sl
        row = []
        for i in range(ns + 1):
            a = math.radians(lo_ + (hi_ - lo_) * i / ns)
            v = skirt_pt(a, t); v += Vector((math.cos(a), math.sin(a), 0)) * .004 * (pi_ % 2)  # 겹치는 판끼리 떨어지게
            verts.append(v); row.append(v)
            k = len(verts) - 1; side = abs(math.cos(a)); wl = min(.7, t * 1.1) * (.35 + .65 * side)
            gh.append((k, 1 - wl)); (gl if v.x > 0 else gr).append((k, wl))
        if j == NV: hem_rows.append(row)
    for j in range(NV):
        for i in range(ns):
            a_ = j * (ns + 1) + i; faces.append((a_, a_ + ns + 1, a_ + ns + 2, a_ + 1))  # 바깥을 보게
    sk_ = new_obj(f'EGO-skirt{pi_}', verts, faces, M['coat'], {'Hips': gh, 'LeftUpLeg': gl, 'RightUpLeg': gr})
    sk_.data.materials.append(M['lining'])
    s = sk_.modifiers.new('solid', 'SOLIDIFY'); s.thickness = .007; s.material_offset = 1
# 허리띠·금 버클·금장 단(코트 앞섶 가장자리 금 줄)
def tube(name, pts, r, m, groups_fn, sides=8, uv=None):
    """uv='along': 금장 띠를 줄 길이 방향으로(둘레에 두 번), 'around': 둘레 방향으로(손목 띠). UV 가 있으면 이음 정점을 겹쳐 둔다."""
    ring = sides + (1 if uv else 0); verts = []; faces = []; grp = {}; uvs = []
    acc = [0.]
    for j in range(1, len(pts)): acc.append(acc[-1] + (pts[j] - pts[j - 1]).length)
    Lt = max(acc[-1], 1e-4); kr = max(1, round(2 * math.pi * r / (GOLD_AR * Lt)))
    for j, p in enumerate(pts):
        d = (pts[min(j + 1, len(pts) - 1)] - pts[max(j - 1, 0)]).normalized()
        u = d.cross(Vector((0, 0, 1))) if abs(d.z) < .95 else d.cross(Vector((1, 0, 0))); u.normalize(); w = d.cross(u)
        for i in range(ring):
            a = 2 * math.pi * i / sides; verts.append(p + (u * math.cos(a) + w * math.sin(a)) * r)
            if uv == 'along': uvs.append((acc[j] / (GOLD_AR * math.pi * r), 2 * i / sides))
            elif uv == 'around': uvs.append((kr * i / sides, acc[j] / Lt))
            for g, wt in groups_fn(j / max(1, len(pts) - 1), p).items(): grp.setdefault(g, []).append((len(verts) - 1, wt))
    for j in range(len(pts) - 1):
        for i in range(sides):
            a = j * ring + i; b = j * ring + ((i + 1) if uv else (i + 1) % sides); faces.append((a, b, b + ring, a + ring))
    if uv: return new_obj(name, verts, faces, m, grp, uvs=uvs)
    return new_obj(name, verts, faces, m, grp)
# 트임 테두리에 붉은 안감이 2cm 띠로 말려 나오게
_hw = {}
for g_, lst in hgrp.items():
    for i_, w_ in lst: _hw.setdefault(i_, {})[g_] = w_
_rows = [r for r in range(NR) if (open_half(ELEVS[min(r, len(ELEVS) - 1)]) if r < len(ELEVS) else 1) > 0]
_edge = [r * (NA + 1) for r in reversed(_rows)] + [r * (NA + 1) + NA for r in _rows]
_ep = [hv[i_] + (hv[i_] - hc2).normalized() * .002 for i_ in _edge]
_ew = {tuple(round(c, 5) for c in p_): _hw[i_] for p_, i_ in zip(_ep, _edge)}
tube('EGO-hoodrim', _ep, .006, M['lining'], lambda t, p: _ew.get(tuple(round(c, 5) for c in p), {'Head': 1.}), sides=6)
_gp = [p_ + (p_ - hc2).normalized() * .006 for p_ in _ep]; _gw = {tuple(round(c, 5) for c in g_): _ew[tuple(round(c, 5) for c in p_)] for g_, p_ in zip(_gp, _ep)}
_seam = [hv[r * (NA + 1) + NA // 2] for r in range(NR)]; _hwp = {tuple(round(c, 5) for c in p_ * 1): _hw.get(r * (NA + 1) + NA // 2, {'Head': 1.}) for r, p_ in enumerate(_seam)}
_seam = [p_ + (p_ - hc2).normalized() * .005 for p_ in _seam]; _hws = {tuple(round(c, 5) for c in q_): w_ for q_, w_ in zip(_seam, _hwp.values())}
tube('EGO-hoodseam', _seam, .008, M['hood'], lambda t, p: _hws.get(tuple(round(c, 5) for c in p), {'Head': 1.}), sides=5)  # 9회차: 뒤 가운데 봉제선
_hem = [hv[(NR - 1) * (NA + 1) + c] for c in range(NA + 1)]; _hwh = {tuple(round(c_, 5) for c_ in p_): _hw.get((NR - 1) * (NA + 1) + c, {'Spine2': 1.}) for c, p_ in enumerate(_hem)}
tube('EGO-hoodhem', _hem, .012, GOLDT, lambda t, p: _hwh.get(tuple(round(c, 5) for c in p), {'Spine2': 1.}), sides=6, uv='along')  # 9회차: 두건 자락 밑단 금띠
tube('EGO-hoodgold', _gp, .0035, M['gold'], lambda t, p: _gw.get(tuple(round(c, 5) for c in p), {'Head': 1.}), sides=5)  # 8회차: 두건 테두리 금선
belt_pts = [Vector((math.cos(a) * (rx - .015), cy + math.sin(a) * (ry - .02), J('Hips').z - .02)) for a in [2 * math.pi * k / 48 for k in range(49)]]
tube('EGO-belt', belt_pts, .018, M['leather'], lambda t, p: {'Hips': 1.})
for side in (-1, 1):  # 앞섶 금 줄(트임 가장자리)
    a = -math.pi / 2 + side * gap
    pts = [skirt_pt(a, j / NV) for j in range(NV + 1)]
    tube(f'EGO-trim{side}', pts, .022, GOLDT, lambda t, p: {'Hips': 1 - min(.7, t * 1.1) * .4, ('LeftUpLeg' if p.x > 0 else 'RightUpLeg'): min(.7, t * 1.1) * .4}, uv='along')
for k, row in enumerate(hem_rows):  # 판마다 금 단
    tube(f'EGO-hem{k}', [v + Vector((0, 0, .008)) for v in row], .014, GOLDT, lambda t, p: {'Hips': .45, ('LeftUpLeg' if p.x > 0 else 'RightUpLeg'): .55}, uv='along')
for side in (-1, 1):  # 앞섶 안감 접힘(트임 양쪽 5cm 씩 붉은 안감이 보이게)
    fv = []; ff = []; fg = {'Hips': [], 'LeftUpLeg': [], 'RightUpLeg': []}
    for j in range(NV + 1):
        t = j / NV
        for q in range(3):
            a = -math.pi / 2 + side * (gap + math.radians(30) * q / 2)  # 5회차: 안감 노출 +50%(9회차: 21→30°)
            v = skirt_pt(a, t); v += Vector((math.cos(a), math.sin(a), 0)) * (.003 + .002 * q); fv.append(v)
            wl = min(.7, t * 1.1) * .4; fg['Hips'].append((len(fv) - 1, 1 - wl)); fg['LeftUpLeg' if v.x > 0 else 'RightUpLeg'].append((len(fv) - 1, wl))
    for j in range(NV):
        for q in range(2):
            a_ = j * 3 + q; ff.append((a_, a_ + 3, a_ + 4, a_ + 1) if side > 0 else (a_, a_ + 1, a_ + 4, a_ + 3))
    new_obj(f'EGO-facing{side}', fv, ff, M['lining'], fg)
_pl = []
for k_ in range(9):  # 앞여밈 금 줄(목 → 허리)
    z_ = J('Neck').z - .04 - (J('Neck').z - .04 - J('Hips').z - .02) * k_ / 8
    cands = [v.co.y for v in coat.data.vertices if abs(v.co.z - z_) < .012 and abs(v.co.x) < .015]
    _pl.append(Vector((0, (min(cands) if cands else J('Spine1').y - .15) - .004, z_)))
tube('EGO-placket', _pl, .007, GOLDT, lambda t, p: {('Spine2' if p.z > J('Spine2').z else 'Spine1' if p.z > J('Spine1').z else 'Spine'): 1.}, sides=6, uv='along')
for row_ in range(3):  # 앞섶 금 단추 2열 × 3
    z_ = J('Spine1').z + .05 + row_ * .075; bn_ = 'Spine1' if row_ < 2 else 'Spine2'
    for sx in (-1, 1):
        x_ = sx * .05; cands = [v.co.y for v in coat.data.vertices if abs(v.co.z - z_) < .012 and abs(v.co.x - x_) < .012]
        y_ = (min(cands) if cands else J(bn_).y - .14) - .006
        bpy.ops.mesh.primitive_uv_sphere_add(radius=.0085, segments=10, ring_count=6, location=(x_, y_, z_))
        o = bpy.context.object; o.name = f'EGO-button{row_}{sx}'; o.data.materials.append(M['gold']); rigid(o, bn_)
# 두 번째 허리띠(오른쪽이 내려간 칼띠) + 앞 왼쪽에 늘어진 붉은 술
belt2 = [Vector((math.cos(a) * (rx + .004), cy + math.sin(a) * (ry - .005), J('Hips').z - .075 + .03 * math.cos(a))) for a in [2 * math.pi * k / 48 for k in range(49)]]
tube('EGO-belt2', belt2, .014, M['leather'], lambda t, p: {'Hips': 1.})
ta = -math.pi / 2 + .55; tb = Vector((math.cos(ta) * (rx + .02), cy + math.sin(ta) * (ry + .01), J('Hips').z - .075 + .03 * math.cos(ta)))
tube('EGO-wknot', [tb + Vector((0, 0, .012)), tb - Vector((0, 0, .02))], .011, M['gold'], lambda t, p: {'Hips': 1.}, sides=8)
for k in range(5):
    end = tb + Vector(((k - 2) * .007, -.008 - .003 * abs(k - 2), -.2 - .015 * (k % 2)))
    tube(f'EGO-wtassel{k}', [tb - Vector((0, 0, .02)), tb.lerp(end, .5) + Vector((0, -.006, 0)), end], .0055, M['tassel'],
         lambda t, p: {'Hips': 1 - .5 * t, 'LeftUpLeg': .5 * t}, sides=5)
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=.03, depth=.014, location=(0, cy - ry - .005, J('Hips').z - .02), rotation=(math.radians(90), 0, 0))
o = bpy.context.object; o.name = 'EGO-buckle'; o.data.materials.append(M['gold']); rigid(o, 'Hips')
# 손목 금 띠
for side, w in (('Left', wristL), ('Right', wristR)):
    d = (J(side + 'ForeArm') - w).normalized()
    tube(f'EGO-cuff{side}', [w + d * .05, w + d * .085], .056, GOLDT, lambda t, p, s_=side: {s_ + 'ForeArm': 1.}, sides=14, uv='around')
    tube(f'EGO-band{side}', [w + d * .13, w + d * .145], .06, GOLDT, lambda t, p, s_=side: {s_ + 'ForeArm': 1.}, sides=14, uv='around')
# 장화 끈·장화 목
for side in ('Left', 'Right'):
    k0, a0 = J(side + 'Leg'), J(side + 'Foot')
    for k in range(5):
        t = .3 + k * .13; c = k0.lerp(a0, t); d = (a0 - k0).normalized()
        ring = [c + (Vector((math.cos(a), math.sin(a) * .9, 0)) * .056) for a in [2 * math.pi * q / 16 for q in range(17)]]
        tube(f'EGO-strap{side}{k}', ring, .0045, M['gold'] if k == 0 else M['leather'], lambda t_, p, s_=side: {s_ + 'Leg': 1.}, sides=5)
for side in ('Left', 'Right'):  # 장화 목(접힌 가죽 단)
    k0, a0 = J(side + 'Leg'), J(side + 'Foot'); c = k0.lerp(a0, .12)
    ring = [c + Vector((math.cos(a) * .067, math.sin(a) * .062, 0)) for a in [2 * math.pi * q / 20 for q in range(21)]]
    tube(f'EGO-bootcuff{side}', ring, .012, M['leather'], lambda t_, p, s_=side: {s_ + 'Leg': 1.}, sides=6)
    c2 = k0.lerp(a0, .84); ring2 = [c2 + Vector((math.cos(a) * .058, math.sin(a) * .056, 0)) for a in [2 * math.pi * q / 24 for q in range(25)]]  # 발목(코트 밑으로 보이는 자리)
    tube(f'EGO-bootgold{side}', ring2, .0065, GOLDT, lambda t_, p, s_=side: {s_ + 'Leg': 1.}, sides=6, uv='along')  # 11회차: 장화 목 금선
    toe = J(side + 'ToeBase'); bpy.ops.mesh.primitive_uv_sphere_add(radius=.03, segments=12, ring_count=8, location=(toe.x, toe.y - .05, .026))
    o = bpy.context.object; o.scale = (1., 1.25, .55); o.name = f'EGO-toecap{side}'; o.data.materials.append(M['gold']); rigid(o, side + 'ToeBase')  # 금 코받이
# 11회차: 허리 금 사슬(앞 왼쪽 → 오른쪽 옆, 처짐) — 링 하나씩 엇갈려 꿴다
_c0, _c1 = -math.pi / 2 - .75, -math.pi / 2 + 1.05; _NL = 26
for k in range(_NL):
    u = k / (_NL - 1); a = _c0 + (_c1 - _c0) * u
    pt = Vector((math.cos(a) * (rx + .05), cy + math.sin(a) * (ry + .055), J('Hips').z - .03 - .07 * math.sin(math.pi * u)))
    a2 = a + .01; pt2 = Vector((math.cos(a2) * (rx + .05), cy + math.sin(a2) * (ry + .055), J('Hips').z - .03 - .07 * math.sin(math.pi * (u + .01 / (_c1 - _c0)))))
    tg = (pt2 - pt).normalized(); side_ = tg.cross(Vector((0, 0, 1))).normalized(); ax = side_ if k % 2 == 0 else tg.cross(side_).normalized()
    bpy.ops.mesh.primitive_torus_add(major_radius=.011, minor_radius=.0028, major_segments=10, minor_segments=5, location=pt)
    o = bpy.context.object; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(ax)
    o.name = f'EGO-chain{k:02d}'; o.data.materials.append(M['gold']); rigid(o, 'Hips')
# 목깃(선 깃) — 붉은 안감
nk = J('Neck'); ring = []
cpts = []
for j, h in enumerate((nk.z - .03, nk.z + .06)):
    cpts.append([Vector((math.cos(a) * .072, nk.y + .005 + math.sin(a) * .066, h)) for a in [2 * math.pi * q / 24 for q in range(25)]])
verts = cpts[0] + cpts[1]; faces = [(i, i + 25, i + 26, i + 1) for i in range(24)]
col = new_obj('EGO-collar', verts, faces, M['hood'], {'Neck': [(i, 1) for i in range(len(verts))]})
col.data.materials.append(M['lining']); s = col.modifiers.new('solid', 'SOLIDIFY'); s.thickness = .006; s.material_offset = 1

# 흰 머리: 이마·옆으로 흘러내리는 머리 카드(두건 밑)
hair_v = []; hair_f = []; hair_uv = []
def strand(root, d, L, w):
    base = len(hair_v); d = d.normalized(); side = d.cross(Vector((0, -1, 0))); side = side.normalized() if side.length > 1e-6 else Vector((1, 0, 0))
    n = 6
    for k in range(n + 1):
        t = k / n; c = root + d * L * t + Vector((0, 0, -.02 * t * t))
        ww = w * 1.8 * (1 - t * .3) if HAIR_MATS else w * (1 - t * .85)  # 텍스처면 넓은 카드(가닥 모양은 알파가 만듦)
        hair_v.extend([c + side * ww, c - side * ww]); hair_uv.extend([(1, 1 - t), (0, 1 - t)])
    for k in range(n): hair_f.append((base + 2 * k, base + 2 * k + 1, base + 2 * k + 3, base + 2 * k + 2))
for k in (range(0) if FACE_TEX else range(5)):  # 검수 3회차: 앞머리 5가닥, 한쪽 눈(오른쪽)만 가리게 비스듬히(얼굴 그림이 있으면 앞머리는 그림이 그린다 — 카드는 빗살처럼 보임)
    x = (k - 3) * .015; root = EYEC + Vector((x, -.014 + abs(x) * .3, .082 - abs(x) * .35))
    strand(root + Vector((0, -.02, 0)), Vector((-.45 + x, -.8, -1)), .066 + .01 * random.random() + abs(x) * .2, .01)  # 트임 밖으로 조금, 얼굴은 가리지 않게
for side in (-1, 1):  # 옆머리: 얼굴 옆을 감싸 광대 높이까지
    for k in (range(7) if FACE_TEX else range(5)):
        root = EYEC + Vector((side * (.068 + k * .004), .005 + k * .012 - (.02 if FACE_TEX else 0), .065))
        if FACE_TEX: strand(root, Vector((side * (.35 + .06 * k), -.5 + .06 * k, -1)), .1 + .03 * random.random() - .006 * k, .0105)  # 6회차: 두건 밖으로 흰 머리(7회차: 7가닥·폭 1.5배)
        else: strand(root, Vector((side * .3, -.12, -1)), .08 + .02 * random.random(), .009)
hair = new_obj('EGO-hair', hair_v, hair_f, M['hair'], {'Head': [(i, 1) for i in range(len(hair_v))]}, uvs=hair_uv,
               mats=HAIR_MATS or None, fmat=[k_ % max(1, len(HAIR_MATS)) for k_ in range(len(hair_f))] if HAIR_MATS else None)
if not HAIR_MATS: s = hair.modifiers.new('solid', 'SOLIDIFY'); s.thickness = .002  # 알파 카드엔 두께를 주지 않는다(옆면이 흰 막대로 보임)
# 붉은 눈빛(작게)
for sx in ((1,) if FACE_TEX else (-1, 1)):  # 얼굴 그림: 오른눈은 앞머리에 덮여 있다
    bpy.ops.mesh.primitive_uv_sphere_add(radius=.0045, location=EYEC + Vector((sx * .035, -.014, 0)))
    o = bpy.context.object; o.name = f'EGO-eyeglow{sx}'; o.data.materials.append(M['eye']); rigid(o, 'Head')

# ---------- 환도 검: 오른손 축을 따라 아래로(원화처럼 다리 옆에 늘어뜨림), 붉은 술 ----------
wr = J('RightHand'); tip = J('RightHand', True); hd = (tip - wr).normalized()
grip = wr.lerp(tip, .45) + Vector((0, -.012, 0))
# 검수: 칼날 약 0.9m·손 폭 40%(.036)·휜 날·금 코등이·붉은 술 15cm, 대기에서 칼끝이 앞-아래로 → 손 축에서 앞(-Y)으로 35° 기울인다.
fw = Vector((0, -1, 0)); fw = (fw - hd * hd.dot(fw)).normalized(); A35 = math.radians(35)
bd = (hd * math.cos(A35) + fw * math.sin(A35)).normalized()
ow = Vector((-1, 0, 0)); ow = (ow - bd * bd.dot(ow)).normalized(); bd = (bd + ow * math.tan(math.radians(25))).normalized()  # 검수: 바깥으로 25°(정면에서 몸 가운데 세로선 피하기)
side = bd.cross(Vector((0, -1, 0)))
side = side.normalized() if side.length > 1e-4 else Vector((1, 0, 0)); thick = bd.cross(side).normalized()
_rl = Matrix.Rotation(math.radians(15), 3, bd); side = _rl @ side; thick = _rl @ thick  # 8회차: 날 롤 15°(정면에서 면이 빛을 받게)
bv = []; bf = []; edge_pts = []; L = .78; n = 24
for i in range(n + 1):
    t = i / n; c = grip + bd * (.075 + L * t) + thick * (.09 * t * t)  # 등 쪽으로 휜 칼(9회차: 휨 .055→.09)
    w = .066 * (1 - .8 * max(0, (t - .82) / .18) ** 1.5) if t < .985 else .004  # 8회차: 날 폭 ×1.3
    bv.extend([c - thick * w * .5, c + side * .003, c + thick * w * .5, c - side * .003])  # 날·면·등·면(마름모 단면)
    edge_pts = edge_pts + [c - thick * (w * .5 + .0004)] if i else [c - thick * (w * .5 + .0004)]
for i in range(n):
    a = 4 * i; bf.extend([(a + k, a + (k + 1) % 4, a + 4 + (k + 1) % 4, a + 4 + k) for k in range(4)])
blade = new_obj('EGO-blade', bv, bf, M['blade'], {'RightHand': [(i, 1) for i in range(len(bv))]})
tube('EGO-edge', edge_pts, .0012, M['edge'], lambda t, p: {'RightHand': 1.}, sides=4)  # 날 끝 붉은 빛 실선
tube('EGO-habaki', [grip + bd * .06, grip + bd * .085], .02, M['gold'], lambda t, p: {'RightHand': 1.}, sides=8)
tube('EGO-tsuba', [grip + bd * .052, grip + bd * .064], .035, M['gold'], lambda t, p: {'RightHand': 1.}, sides=12)
tube('EGO-tsuka', [grip - bd * .13, grip + bd * .052], .015, M['tassel'], lambda t, p: {'RightHand': 1.}, sides=8)
tube('EGO-kashira', [grip - bd * .14, grip - bd * .125], .018, M['gold'], lambda t, p: {'RightHand': 1.}, sides=8)
pom = grip - bd * .14
for k in range(5):
    b = pom + Vector(((k - 2) * .007, -.006 + .004 * (k % 2), -.12 - .01 * (k % 2)))
    tube(f'EGO-tassel{k}', [pom, pom.lerp(b, .5) + Vector((0, .012, 0)), b], .0055, M['tassel'], lambda t, p: {'RightHand': 1 - .5 * t, 'RightForeArm': .5 * t}, sides=6)

# ---------- 깃털 ----------
IVORY = (.863, .791, .745); CRIMSON = (.451, .006, .012)  # #efe6e0 · #b3121b (선형)
def feather(base, d, length, width, tint, curl=.06):
    """잎 모양 깃털(폭 = 길이의 약 20%, 끝이 뾰족). 밑 70% 상아색 → 끝 붉은색. 가운데 깃대는 조금 어둡게."""
    d = d.normalized()
    d = (Matrix.Rotation(math.radians(random.uniform(-12, 12)), 3, Vector((0, 1, 0))) @ d).normalized()  # 검수 3회차: 깃마다 좌우 ±12°
    sd = d.cross(Vector((0, 0, 1)))  # 깃 면은 늘 수평 옆 방향으로 편다(거의 수직 깃이 옆으로 서서 막대처럼 보이던 문제)
    sd = sd.normalized() if sd.length > .05 else Vector((1, 0, 0))
    sd = (Matrix.Rotation(math.radians(random.uniform(-8, 8)), 3, d) @ sd).normalized(); nm = sd.cross(d)  # 비틀림 ±8°
    n = 21; vs = []; cs = []; fs = []
    uv = []
    for i in range(n + 1):
        t = i / n; ww = width * math.sin(math.pi * (.1 + .9 * t)) ** .6 * (1 - .15 * t)
        if t > .3: ww *= 1 - .22 * ((t * 7) % 1)  # 가장자리 톱니 6~7개
        if FEATHER_MATS: ww = width / FILL * (1 - .1 * t)  # 텍스처 카드: 모양은 알파가 만든다
        uv += [(1, 1 - t), (.5, 1 - t), (0, 1 - t)]
        c = base + d * length * t + nm * (curl * length * math.sin(math.pi * t * .9))
        red = min(1, max(0, (t - .72 + tint) / .2)); red = red * red * (3 - 2 * red)
        col = [IVORY[k] * (1 - red) + CRIMSON[k] * red for k in range(3)]
        for sgn in (1, 0, -1):
            vs.append(c + sd * ww * sgn + nm * (.003 if sgn == 0 else -.002 * abs(sgn)))
            sh = .82 if sgn == 0 else 1
            cs.append((col[0] * sh, col[1] * sh, col[2] * sh, 1))
    for i in range(n):
        a = 3 * i; fs.extend([(a, a + 1, a + 4, a + 3), (a + 1, a + 2, a + 5, a + 4)])
    feather.last = (nm, length, n)
    return vs, fs, cs, uv
def feather_group(name, specs, groups_for, mix=None, mats_=None):
    """mix=(진홍 비율, 검은 속깃 비율): 텍스처 깃을 통째로 물들인 변형을 섞는다(6회차 검수).
    모양 키 flapA·flapB: 깃마다 다른 위상으로 끝이 법선 방향으로 휜다 → 렌더에서 A=cos·B=sin 으로 돌리면 깃마다 늦게 흔들림."""
    V_ = []; F_ = []; C_ = []; G = {}; U_ = []; FM = []; FL = []
    nv = len(FEATHER_MATS)
    for spec in specs:
        curl = spec[6] if len(spec) > 6 else .06
        vs, fs, cs, uv = feather(*spec[:5], curl=curl); base = len(V_)
        nm, Lf, n = feather.last; ph = random.uniform(0, 2 * math.pi); amp = Lf * math.tan(math.radians(5))
        for i in range(len(vs)):
            t = (i // 3) / n; dsp = nm * amp * t * t
            FL.append((dsp * math.sin(ph), dsp * math.cos(ph)))
        V_ += vs; C_ += cs; U_ += uv; F_ += [tuple(base + x for x in f) for f in fs]
        if nv:  # 변형 고르기: 붉은 끝 변형(이름에 red·d)은 아래 단·짧은 깃 끝에 더 자주
            red_ix = [k for k, f in enumerate(FEATHER_TEX) if 'red' in os.path.basename(f) or f.endswith('_d.png')] or list(range(nv))
            k_ = random.choice(red_ix) if random.random() < .55 else random.randrange(nv)
            if mix and len(spec) > 7 and spec[7]: k_ = nv + {'c': 0, 'b': 1}[spec[7]]  # 7회차: 진홍·검은 속깃은 망토 짜는 곳에서 자리 보고 고른다
            FM += [k_] * len(fs)
        for g, w in groups_for(spec).items():
            G.setdefault(g, []).extend((base + k, w) for k in range(len(vs)))
    mats = (FEATHER_MATS + FEATHER_TINTS if mix else (mats_ or FEATHER_MATS)) or None
    o = new_obj(name, V_, F_, M['feather'], G, C_, uvs=U_, mats=mats, fmat=FM or None)
    if not FEATHER_MATS: s = o.modifiers.new('solid', 'SOLIDIFY'); s.thickness = .0025  # 알파 카드는 두께 없이(겹 수 절반)
    o.shape_key_add(name='Basis')
    for kname, idx in (('flapA', 0), ('flapB', 1)):
        kb = o.shape_key_add(name=kname); kb.slider_min = -10; kb.slider_max = 10; kb.value = 0
        for i, f_ in enumerate(FL): kb.data[i].co = V_[i] + f_[idx]
    return o
# 등 뒤 표면 y(높이 z 에서): 몸 + (허리 아래면) 코트 자락 위쪽
def back_y(z):
    ys = [v.co.y for v in V if abs(v.co.z - z) < .025 and abs(v.co.x) < .1]
    y = max(ys) if ys else J('Spine2').y + .1
    if z < hipz + .08: y = max(y, cy + ry * 1.05)
    return y
# 망토 뼈: 3단(어깨·허리·종아리) × 2줄(엇갈림) = cape0..5. 렌더에서 스프링 + 중력 정렬이 돌린다.
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
sp2 = arm.data.edit_bones['Spine2']; neck = J('Neck')
LEAN = math.radians(15)  # 뒤로 15~25°
TIERS = [  # (위에서 내려온 거리, 감싸는 반각°, 깃 수, 길이, 퍼짐) — 검수 2회차: 양어깨를 덮는 대칭 만틀(위 단 220°)
    (.05, 110, 21, .30, .3),    # 7회차: 깃 수 ×1.6, 윗단은 짧은 덮깃
    (.33, 80, 19, .44, .12),
    (.62, 62, 18, .56, .04),   # 검수 4회차: 아래 끝을 무릎선으로(6회차: 밑단까지)
]
cyt = J('Spine2').y
ROWS = []
for k, (dz, half, N, L, sp) in enumerate(TIERS):
    for s_ in range(2):
        z = neck.z - dz - .045 * s_; yb = back_y(z) + .03 + .012 * k + .006 * s_
        r = len(ROWS)
        eb = arm.data.edit_bones.new(f'cape{r}'); eb.head = (0, yb, z); eb.tail = (0, yb + .15 * math.sin(LEAN), z - .15 * math.cos(LEAN)); eb.parent = sp2
        rxe = .215 * (1, .82, .66)[k] + .006 * s_; rye = (yb - cyt) * (1, .95, .9)[k]  # 아래로 갈수록 좁게(달걀 덩어리 → 접힌 날개)
        ROWS.append((k, s_, z, rxe, rye, half, N - s_, L, sp))
bpy.ops.object.mode_set(mode='OBJECT')
specs = []; lin_v = []; lin_f = []; lin_g = {}
for r, (k, s_, z, rxe, rye, half, N, L, sp) in enumerate(ROWS):
    for c in range(N):
        u = (c + .5 * s_) / (N - 1 + s_) * 2 - 1 if N > 1 else 0
        ph = math.radians(half) * u; sx, cx_ = math.sin(ph), math.cos(ph)
        if k and abs(math.degrees(ph)) < 6: continue  # 뒤 가운데 12° 틈(5회차: 30° 는 구멍처럼 보임)
        base = Vector((sx * rxe, cyt + cx_ * rye, z - .02 * (1 - cx_) + random.uniform(-.03, .03)))  # 6회차: 단 경계선 흩기
        d = Vector((sx * sp, cx_ * sp + math.tan(LEAN) * max(0, cx_), -1))
        Lc = L * random.uniform(.6, 1.7) ** .85 * (1 - .12 * u * u)  # 6회차: 길이 .6~1.7(붉은 끝이 한 줄로 서지 않게)
        if abs(u) > .6: d = d + Vector((sx, cx_ * .3, 0)) * .47  # 6회차: 바깥 20% 는 사선 ±25°
        # 7회차: 진홍은 아랫단·바깥쪽에 몰아 15%, 검은 속깃은 겉에 내지 않고 2cm 안쪽 층에만
        var = 'c' if random.random() < (.04 + .1 * k + .1 * (abs(u) > .5)) else None
        wf_ = 1.5 if k == 0 and random.random() < .3 else 1.  # 8회차: 윗단 30% 는 넓은 덮깃
        specs.append((base, d, Lc, .09 * Lc * wf_, .04 * random.random() - .02 * k, r, random.uniform(.12, .26), var))
        if random.random() < .3 and abs(u) < .6:  # 9회차: 옆으로는 내지 않음
            inward = Vector((sx, cx_, 0)).normalized() * -.02
            specs.append((base + inward + Vector((0, 0, -.02)), d, Lc * .85, .09 * Lc, 0, r, random.uniform(.08, .16), 'b'))
    if s_ == 0:  # 단마다 밑 안감 한 장(깃 사이로 몸이 비치지 않게)
        M_ = 16; b0 = len(lin_v)
        for c in range(M_ + 1):
            ph = math.radians(half * .9) * (c / M_ * 2 - 1); sx, cx_ = math.sin(ph), math.cos(ph)
            base = Vector((sx * (rxe - .004), cyt + cx_ * (rye - .006), z - .02 * (1 - cx_)))
            d = Vector((sx * sp, cx_ * sp + math.tan(LEAN) * max(0, cx_), -1)).normalized()
            for q in range(4): lin_v.append(base + d * L * .62 * q / 3); lin_g.setdefault(f'cape{r}', []).append((len(lin_v) - 1, 1.))
        for c in range(M_):
            for q in range(3):
                a_ = b0 + c * 4 + q; lin_f.append((a_, a_ + 1, a_ + 5, a_ + 4))
for sgn in ():  # 9회차: 앞에서 어두운 가닥으로 보여 뺌 — 8회차: 아랫단 바깥에 .8~.9m 긴 깃 3장씩, 바깥으로 휘게(컷인의 길게 휘는 큰 깃)
    k, s_, z, rxe, rye, half, N, L, sp = ROWS[4]
    for j in range(2):
        ph = math.radians(half) * sgn * (.84 + .1 * j); sx, cx_ = math.sin(ph), math.cos(ph)
        base = Vector((sx * rxe, cyt + cx_ * rye, z + .05 - .03 * j))
        d = Vector((sx * (.35 + .12 * j), cx_ * .2 + math.tan(LEAN) * max(0, cx_), -1))
        specs.append((base, d, random.uniform(.7, .8), .1 * .75, -.03, 4, .22, None))
feather_group('EGO-cape', specs, lambda s_: {f'cape{s_[5]}': 1.}, mix=(.25, .15) if FEATHER_MATS else None)
cl = new_obj('EGO-capelining', lin_v, lin_f, M['capelin'], lin_g); s = cl.modifiers.new('solid', 'SOLIDIFY'); s.thickness = .004
# 어깨 깃(두 겹): 목둘레·어깨를 덮고 바깥-아래로(검수: 어깨의 검은 덩어리를 가림)
mspecs = []
for layer in range(2):
    N = 13 + layer * 4
    for k in range(N):
        a = -math.pi / 2 + (k / (N - 1) - .5) * math.radians(250)  # 앞쪽 가운데는 비움(8회차: 가슴 110° 비움)
        ca, sa = math.cos(a), math.sin(a)
        base = Vector((ca * (.12 + .045 * layer), neck.y + .01 + sa * (.1 + .025 * layer), neck.z - .045 - .05 * layer))  # 5회차: 어깨에서 2cm 띄움
        d = Vector((ca * (.8 + .25 * layer), sa * .6 + .25 + .35 * max(0, -sa), -1.15 - .3 * layer - .5 * max(0, -sa)))  # 7회차: 앞쪽 깃은 아래·뒤로 30° 눕혀 해바라기 목깃 피하기
        L = (.17 + .07 * layer + .03 * random.random()) * (1 + .2 * max(0, -sa))  # 4회차: 앞쪽 깃은 가슴까지(7회차: ×0.7)
        sideb = 'LeftShoulder' if ca > .25 else ('RightShoulder' if ca < -.25 else 'Spine2')
        mspecs.append((base, d, L, .15 * L + .004, .02 - .03 * layer, sideb))
for sgn in (-1, 1):  # 8회차: 양 어깨 상아색 견갑 깃 11장씩(폭 ×1.4) — 앞에서도 흰 깃 표지가 읽히게
    sb_ = 'LeftShoulder' if sgn > 0 else 'RightShoulder'; sh_ = J('LeftArm' if sgn > 0 else 'RightArm')
    for k in range(15 + 9):  # 9회차: 15장 + 짧은 둘째 줄 9장
        row2 = k >= 15; f_ = (k - 15) / 8 if row2 else k / 14
        base = Vector((sgn * (abs(sh_.x) - .05 + .04 * f_), sh_.y - .05 + .1 * f_, sh_.z + .045 - .015 * abs(f_ - .5)))
        d = Vector((sgn * (.55 + .3 * random.random()), -.25 + .5 * f_, -1))
        L = (.15 + .05 * random.random() + .03 * (1 - abs(f_ - .5) * 2)) * (.6 if row2 else 1)
        if row2: base = base + Vector((sgn * .012, 0, .018))
        mspecs.append((base, d, L, (.15 * L + .004) * 1.4, -.05, sb_))
feather_group('EGO-mantle', mspecs, lambda s_: {s_[5]: .7, 'Spine2': .3} if s_[5] != 'Spine2' else {'Spine2': 1.}, mats_=FEATHER_MATS_SH)

if COAT_H:  # 코트·두건 천 결(제미나이 능직 높이맵)
    _cache = {}
    for o in parts:
        for sl in o.material_slots:
            if sl.material in (M['coat'], M['hood']):
                vs = [v.co for v in o.data.vertices]
                dims = tuple(max(c[i] for c in vs) - min(c[i] for c in vs) for i in range(3))
                sl.material = coat_tex_copy(sl.material, dims)
# ---------- 모든 옷 조각: 아마추어 변형 ----------
for o in parts:
    o.parent = arm; o.matrix_parent_inverse = arm.matrix_world.inverted()
    if not any(m.type == 'ARMATURE' for m in o.modifiers):
        m = o.modifiers.new('arm', 'ARMATURE'); m.object = arm
    # 아마추어가 맨 앞
    ai = [k for k, m in enumerate(o.modifiers) if m.type == 'ARMATURE'][0]
    if ai: o.modifiers.move(ai, 0)
# 몸의 옷 밑 부분은 렌더에서 빼도 되지만, 움직일 때 틈이 보이지 않게 그대로 둔다(얼굴·목만 보임)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('dressed', len(parts), 'parts', OUT)
