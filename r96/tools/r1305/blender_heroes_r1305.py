"""
[R1305] TRELLIS.2 영웅 9명(seoha·neon·lauren·michaela·slayer·hunter·gunner·persona·hidden_ego) 리깅 · 3종 모션 · GLB 내보내기.
 바탕: 사용자 전 영웅 공용 스크립트(tools/r1303/blender_storyworld_heroes_all.upload.py)의 프리셋·12뼈·무기 소켓·Idle/Walk/공격.
 고친 점(Blender 5.3 · TRELLIS 원본 메시):
  · 원문은 TRELLIS 원본 메시에 바로 ARMATURE_AUTO 를 걸어 열 확산이 실패(R1302 와 같은 증상)한다 →
    R1302 방식(merge-by-distance + decimate → 복셀 대리 메시 자동 무게 → 몸으로 전송 → 빈 정점 뼈 거리 채우기)을 쓴다.
  · 원문 프리셋에 없는 seoha·neon 을 넣는다(무기 없음, 시전 공격). 출력 파일 이름은 게임 영웅 id(hidden_ego → ego).
  · 무기는 사용자 원문 절차형 무기 그대로(Weapon_Socket 강체), 몸 하단 로브는 R1304/R1305 와 같은 70/15/15 규칙으로 섞는다.
 실행: blender --background --python blender_heroes_r1305.py -- --hero seoha --input trellis_raw/seoha_trellis2.glb --output out.glb
"""
import importlib.util
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


U = load("sw_heroes_all", os.path.join(HERE, "..", "r1303", "blender_storyworld_heroes_all.upload.py"))
H = load("sw_hwando_r1305", os.path.join(HERE, "blender_hwando_walk_r1305.py"))

U.HERO_PRESETS.setdefault("seoha", {"height": 1.70, "weapon": "none", "color": (0.20, 0.86, 0.92, 1.0), "attack": "Attack_EgoCast"})
U.HERO_PRESETS.setdefault("neon", {"height": 1.70, "weapon": "none", "color": (0.46, 0.96, 0.36, 1.0), "attack": "Attack_EgoCast"})
GAME_ID = {"hidden_ego": "ego"}


def arg(name, default=None):
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return a[a.index(name) + 1] if name in a and a.index(name) + 1 < len(a) else default


def rebalance_robe(arm, body, h):
    """R1304 로브 규칙(키 비례, 다리 뼈에서 0.085h 넘게 먼 자락만): 중앙 |X|<0.30h/1.75, 0.36~1.02 h/1.75 높이, 하체 무게 65% 넘는 정점을 Pelvis 70/Thigh 15/15 로."""
    s = h / 1.75
    names = ("Pelvis", "Thigh_R", "Shin_R", "Thigh_L", "Shin_L")
    if any(body.vertex_groups.get(n) is None for n in names):
        return 0
    by_index = {g.index: g.name for g in body.vertex_groups}
    mw = arm.matrix_world
    legs = [(mw @ arm.data.bones[n].head_local, mw @ arm.data.bones[n].tail_local) for n in ("Thigh_R", "Shin_R", "Thigh_L", "Shin_L")]
    changed = 0
    for v in body.data.vertices:
        p = body.matrix_world @ v.co
        cur = {by_index[g.group]: g.weight for g in v.groups if g.group in by_index}
        if abs(p.x) >= 0.30 * s or p.z < 0.36 * s or p.z > 1.02 * s or sum(cur.get(n, 0) for n in names) <= 0.65:
            continue
        # 바지·다리 살(뼈 선분 가까이)은 다리를 따라야 한다 → 코트·로브 자락(뼈에서 먼 정점)만 섞는다.
        if min(H._seg_dist(p, a, b) for a, b in legs) <= 0.085 * s:
            continue
        u = max(0.0, min(1.0, (p.z - 0.36 * s) / (0.22 * s)))
        f = u * u * (3 - 2 * u)
        b = {n: w * (1 - f) for n, w in cur.items()}
        for n, t in (("Pelvis", .70), ("Thigh_R", .15), ("Thigh_L", .15)):
            b[n] = b.get(n, 0) + t * f
        tot = sum(b.values()) or 1
        for n in set(cur) | {"Pelvis", "Thigh_R", "Thigh_L"}:
            w = b.get(n, 0) / tot
            if w > 1e-8:
                body.vertex_groups[n].add([v.index], w, "REPLACE")
            elif n in cur:
                body.vertex_groups[n].remove([v.index])
        changed += 1
    print(f"[StoryWorld][R1305] robe rebalance changed={changed:,}")
    return changed


def main():
    hero = arg("--hero")
    src = arg("--input")
    out = arg("--output")
    decimate = float(arg("--decimate", "0.30"))
    preset = U.HERO_PRESETS[hero]
    body = U.import_and_normalize(src, preset["height"], hero)
    H.lighten_body(body, decimate)
    arm = U.build_armature(hero, preset["height"])
    # Weapon_Socket_* 는 몸 무게를 받지 않는다(원문은 deform 기본값이라 칼 소켓이 몸을 끌었다).
    for b in arm.data.bones:
        b.use_deform = b.name not in ("Root", "Weapon_Socket_R", "Weapon_Socket_L")
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_NAME")  # 빈 그룹 + 아마추어 변형(무게는 아래 대리 메시에서)
    nz = H.proxy_heat_weights(arm, body)
    # ensure_weights 는 Weapon_Socket/Root 를 빼는데 공용 뼈 이름은 Weapon_Socket_R/L 이다 → 그룹을 지운 뒤 호출.
    for n in ("Root", "Weapon_Socket_R", "Weapon_Socket_L"):
        g = body.vertex_groups.get(n)
        if g:
            body.vertex_groups.remove(g)
    filled = ensure_weights_shared(arm, body)
    rebalance_robe(arm, body, preset["height"])

    weapon = U.create_weapon_mesh(hero, preset["weapon"], preset["color"])
    if weapon and preset["weapon"] in ("staff", "spear"):
        # 원문 지팡이·창은 손에서 뒤로 0.33m 가 남아 몸통·코트를 꿰뚫는다(렌더 확인) →
        # 지팡이는 세워 들고(머리 위로), 창은 손잡이 끝이 손 바로 뒤에 오게 앞으로 민다.
        for v in weapon.data.vertices:
            if preset["weapon"] == "staff":
                v.co = (v.co.x, -v.co.z, -v.co.y)
            else:
                v.co.y -= 0.28
        weapon.data.update()
    if weapon and preset["weapon"] == "bow":
        # 원문 활은 닫힌 고리(토러스)라 옆에서 보면 몸통을 둘러싼다(렌더 확인) → 앞쪽 반원만 남겨 손이 활 가운데(줌통)를 쥐게 한다.
        import bmesh
        bm = bmesh.new()
        bm.from_mesh(weapon.data)
        ys = [v.co.y for v in bm.verts]
        cy = (min(ys) + max(ys)) / 2
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > cy + 1e-4], context="VERTS")
        y0 = min(v.co.y for v in bm.verts)
        for v in bm.verts:
            v.co.y -= y0
        bm.to_mesh(weapon.data)
        bm.free()
        weapon.data.update()
    if weapon:
        sock = "Weapon_Socket_L" if preset["weapon"] == "bow" else "Weapon_Socket_R"
        s = preset["height"] / 1.70
        weapon.location = ((0.47 if sock.endswith("_L") else -0.47) * s, 0.0, 0.92 * s)
        bpy.ops.object.select_all(action="DESELECT")
        weapon.select_set(True)
        arm.select_set(True)
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode="POSE")
        arm.data.bones.active = arm.data.bones[sock]
        bpy.ops.object.parent_set(type="BONE", keep_transform=True)
        bpy.ops.object.mode_set(mode="OBJECT")

    U.bake_hero_animations(arm, hero, preset)
    for tr in arm.animation_data.nla_tracks:
        tr.mute = False  # 원문은 mute=True 인데 Blender 5.3 익스포터는 음소거 트랙을 건너뛴다 → NLA_TRACKS 로 트랙별 클립 추출

    bpy.ops.object.select_all(action="DESELECT")
    for o in (arm, body, weapon):
        if o:
            o.select_set(True)
    kw = dict(filepath=os.path.abspath(out), export_format="GLB", use_selection=True, export_animations=True,
              export_force_sampling=True, export_yup=True)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties
    if "export_animation_mode" in props:
        kw["export_animation_mode"] = "NLA_TRACKS"
    bpy.ops.export_scene.gltf(**kw)
    print(f"[StoryWorld][R1305] {hero}: verts={len(body.data.vertices):,} weighted_proxy={nz:,} filled={filled:,} weapon={bool(weapon)} -> {out}")


def ensure_weights_shared(arm, body, smooth_repeat=4):
    """H.ensure_weights 와 같되 공용 뼈 이름(Head, Weapon_Socket_R/L)에 맞춘다."""
    skip = ("Root", "Weapon_Socket_R", "Weapon_Socket_L")
    deform = [b for b in arm.data.bones if b.name not in skip]
    mw = arm.matrix_world
    segs = [(b.name, mw @ b.head_local, mw @ b.tail_local) for b in deform]
    groups = {n: body.vertex_groups.get(n) or body.vertex_groups.new(name=n) for n, _, _ in segs}
    valid = {g.index for g in groups.values()}
    filled = 0
    for v in body.data.vertices:
        if sum(g.weight for g in v.groups if g.group in valid) > 1e-4:
            continue
        p = body.matrix_world @ v.co
        ds = sorted((H._seg_dist(p, a, b), n) for n, a, b in segs)[:2]
        w0, w1 = 1 / max(ds[0][0], .01) ** 2, 1 / max(ds[1][0], .01) ** 2
        groups[ds[0][1]].add([v.index], w0 / (w0 + w1), "REPLACE")
        groups[ds[1][1]].add([v.index], w1 / (w0 + w1), "REPLACE")
        filled += 1
    if filled and smooth_repeat:
        bpy.ops.object.select_all(action="DESELECT")
        body.select_set(True)
        bpy.context.view_layer.objects.active = body
        bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
        bpy.ops.object.vertex_group_smooth(group_select_mode="ALL", factor=0.5, repeat=smooth_repeat)
        bpy.ops.object.vertex_group_normalize_all(lock_active=False)
        bpy.ops.object.mode_set(mode="OBJECT")
    return filled


if __name__ == "__main__":
    main()
