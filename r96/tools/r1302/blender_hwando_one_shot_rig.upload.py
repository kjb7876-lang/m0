"""
StoryWorld 환도 영웅 (Hwando Hero) — Blender 원큐 분리 · 리깅 · 대각 베기 모션 · GLB 내보내기 스크립트
(Blender 4.x / 5.x 호환, 로컬 PC 또는 Claude Code 백그라운드 실행용)

실행 명령어:
  blender --background --python blender_hwando_one_shot_rig.py -- \
    --input hwando_hero_trellis2_fixed.glb \
    --output hwando_hero_rigged_final.glb \
    --blend hwando_hero_rigged_final.blend

수행 작업 (원큐 자동 처리):
  1. GLB 임포트 및 1.75m 신장 / 발바닥 Z=0 정규화 (원본 미보정 GLB면 칼날 길이 자동 보정)
  2. bmesh로 환도 칼날·코등이·술 영역을 몸체(옷자락)에서 완전 분리 (Hwando_Weapon / Hwando_Body)
  3. StoryWorld 공용 10-본 인간형 Armature(Hwando_Rig) + 오른손 무기 소켓(Weapon_Socket) 생성
  4. 몸체는 Blender 자동 웨이트(ARMATURE_AUTO)로 부드럽게 바인딩, 환도는 Weapon_Socket에 강체 부착
     -> 팔을 크게 휘둘러도 옷자락이 칼에 딸려오는 현상 0%
  5. 3종 NLA 애니메이션 키프레임 생성:
     - Idle (대기)
     - Walk (좌/우 측면 가독성 중심 걷기)
     - Attack_DiagonalSlash (칼날 하향 유지 + 오른손 왼쪽 어깨 위 -> 오른쪽 아래 대각 내려베기)
  6. 게임용 .glb 및 편집용 .blend 동시 저장
"""

import math
import os
import sys
import bpy
import bmesh
from mathutils import Vector, Euler

D2R = math.pi / 180.0
FPS = 30


def parse_args():
    argv = sys.argv
    extra = argv[argv.index("--") + 1:] if "--" in argv else []
    args = {
        "input": "hwando_hero_trellis2_fixed.glb",
        "output": "hwando_hero_rigged_final.glb",
        "blend": "hwando_hero_rigged_final.blend",
    }
    i = 0
    while i < len(extra):
        if extra[i] == "--input" and i + 1 < len(extra):
            args["input"] = extra[i + 1]; i += 2
        elif extra[i] == "--output" and i + 1 < len(extra):
            args["output"] = extra[i + 1]; i += 2
        elif extra[i] == "--blend" and i + 1 < len(extra):
            args["blend"] = extra[i + 1]; i += 2
        else:
            i += 1
    return args


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS


def import_and_normalize(glb_path):
    """GLB를 불러와 단일 메시로 합치고, Blender Z-up 기준 신장 1.75m · 발바닥 Z=0 · 정면 -Y로 정렬."""
    bpy.ops.import_scene.gltf(filepath=glb_path)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"GLB에서 메시를 찾지 못했습니다: {glb_path}")

    bpy.ops.object.select_all(action="DESELECT")
    for m in meshes:
        m.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()

    obj = bpy.context.active_object
    obj.name = "Hwando_Body"
    # 부모 해제 및 트랜스폼 적용
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # 남은 빈 오브젝트 정리
    for o in list(bpy.context.scene.objects):
        if o != obj:
            bpy.data.objects.remove(o, do_unlink=True)

    # Blender 임포트 시 glTF(+Y up, +Z front) -> Blender(+Z up, -Y front)로 변환됨
    verts = [obj.matrix_world @ v.co for v in obj.data.vertices]
    min_z = min(v.z for v in verts)
    max_z = max(v.z for v in verts)
    raw_h = max_z - min_z
    sc = 1.75 / max(raw_h, 0.01)

    # 머리(상단 15%) 기준으로 몸체 X, Y 중심 계산 (앞으로 뻗은 칼날 제외)
    head_pts = [v for v in verts if v.z >= min_z + raw_h * 0.82]
    cx = sum(v.x for v in head_pts) / max(len(head_pts), 1)
    cy = sum(v.y for v in head_pts) / max(len(head_pts), 1)

    for v in obj.data.vertices:
        v.co.x = (v.co.x - cx) * sc
        v.co.y = (v.co.y - cy) * sc
        v.co.z = (v.co.z - min_z) * sc
    obj.data.update()

    # 원본 미보정 TRELLIS.2 GLB라면(전방 -Y로 칼날이 1.25m 이상 뻗어 있으면) 칼날 길이 자동 보정
    min_y = min(v.co.y for v in obj.data.vertices if v.co.z < 1.18)
    if min_y < -1.25:
        tip_v = min((v.co for v in obj.data.vertices if v.co.z < 1.18), key=lambda c: c.y)
        guard = Vector((-0.28, -0.20, 0.76))
        bdir = (tip_v - guard).normalized()
        target_scale = 0.85 / max((tip_v - guard).length, 0.85)
        for v in obj.data.vertices:
            if v.co.y < -0.18 and v.co.z < 1.18:
                along = (v.co - guard).dot(bdir)
                if along > 0:
                    t = max(0.0, min(1.0, (-v.co.y - 0.18) / 0.06))
                    mask = t * t * (3.0 - 2.0 * t)
                    v.co -= bdir * (along * (1.0 - target_scale) * mask)
        obj.data.update()
        print("[StoryWorld] Over-extended blade automatically shortened to ~0.85m.")

    print(f"[StoryWorld] Normalized hero mesh: height=1.75m, verts={len(obj.data.vertices):,}")
    return obj


def separate_hwando_weapon(body_obj):
    """
    bmesh로 환도 칼날·코등이·술(Hwando_Weapon)을 몸체/옷자락(Hwando_Body)에서 완전 분리합니다.
    (Blender 좌표계: +Z 위, -Y 정면, -X 캐릭터 오른편)
    """
    bpy.context.view_layer.objects.active = body_obj
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(body_obj.data)
    bm.faces.ensure_lookup_table()

    # 1) 몸체와 칼날 사이 용접된 브리지 면 판별 및 무기 면 선택
    weapon_faces = []
    bridge_faces = []

    for f in bm.faces:
        c = f.calc_center_median()
        # 전방 칼날 (-Y > 0.205, 즉 y < -0.205), 하단 술 (x < -0.41, z ∈ [0.50, 0.76]),
        # 손잡이/코등이 (x < -0.34, y < -0.04, z ∈ [0.72, 0.96])
        is_blade = (c.y < -0.205 and c.z < 1.05)
        is_tassel = (c.x < -0.41 and 0.50 <= c.z <= 0.76 and c.y < 0.08)
        is_hilt = (c.x < -0.34 and c.y < -0.04 and 0.72 <= c.z <= 0.96)

        if is_blade or is_tassel or is_hilt:
            weapon_faces.append(f)
        else:
            # 칼날과 허벅지/옷자락을 직접 잇는 얇은 용접 면 제거
            ys = [v.co.y for v in f.verts]
            if min(ys) < -0.19 and max(ys) > -0.175 and c.z < 0.88 and c.x > -0.34:
                bridge_faces.append(f)

    if bridge_faces:
        bmesh.ops.delete(bm, geom=bridge_faces, context="FACES")
        bm.faces.ensure_lookup_table()

    bpy.ops.mesh.select_all(action="DESELECT")
    for f in weapon_faces:
        if f.is_valid:
            f.select = True

    bmesh.update_edit_mesh(body_obj.data)
    bpy.ops.mesh.separate(type="SELECTED")
    bpy.ops.object.mode_set(mode="OBJECT")

    weapon_obj = [o for o in bpy.context.scene.objects if o.type == "MESH" and o != body_obj][0]
    weapon_obj.name = "Hwando_Weapon"

    # 무기 피벗(오리진)을 오른손 그립 위치로 정렬
    grip_world = Vector((-0.34, -0.10, 0.82))
    for v in weapon_obj.data.vertices:
        v.co -= grip_world
    weapon_obj.location = grip_world
    weapon_obj.data.update()

    # 칼날이 자연스럽게 아래쪽을 향하도록 미세 하향 오프셋 (약 14도)
    weapon_obj.rotation_euler = Euler((math.radians(-14.0), 0.0, 0.0), "XYZ")
    bpy.context.view_layer.objects.active = weapon_obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    print(f"[StoryWorld] Separated weapon: Body={len(body_obj.data.polygons):,} tris, Weapon={len(weapon_obj.data.polygons):,} tris")
    return weapon_obj


def build_humanoid_armature():
    """StoryWorld 공용 10-본 휴머노이드 Armature + Weapon_Socket 생성 (Blender Z-up, -Y front)."""
    arm_data = bpy.data.armatures.new("Hwando_RigData")
    arm_obj = bpy.data.objects.new("Hwando_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="EDIT")

    eb = arm_data.edit_bones

    def add_bone(name, head, tail, parent=None, connected=False):
        b = eb.new(name)
        b.head = Vector(head)
        b.tail = Vector(tail)
        if parent:
            b.parent = parent
            b.use_connect = connected
        return b

    b_root   = add_bone("Root",        (0.0, 0.0, 0.0),    (0.0, 0.0, 0.20))
    b_pelvis = add_bone("Pelvis",      (0.0, 0.0, 0.86),   (0.0, 0.0, 1.08), b_root)
    b_chest  = add_bone("Spine_Chest", (0.0, 0.0, 1.08),   (0.0, 0.0, 1.44), b_pelvis, True)
    b_head   = add_bone("Head_Hood",   (0.0, 0.0, 1.44),   (0.0, 0.0, 1.74), b_chest, True)

    b_arm_r  = add_bone("Arm_R",       (-0.24, 0.0, 1.36), (-0.34, -0.10, 0.82), b_chest)
    b_sock   = add_bone("Weapon_Socket", (-0.34, -0.10, 0.82), (-0.34, -0.45, 0.68), b_arm_r, True)

    b_arm_l  = add_bone("Arm_L",       (0.24, 0.0, 1.36),  (0.34, -0.04, 0.84), b_chest)

    b_th_r   = add_bone("Thigh_R",     (-0.11, 0.0, 0.84), (-0.11, 0.0, 0.42), b_pelvis)
    b_sh_r   = add_bone("Shin_R",      (-0.11, 0.0, 0.42), (-0.11, -0.05, 0.04), b_th_r, True)

    b_th_l   = add_bone("Thigh_L",     (0.11, 0.0, 0.84),  (0.11, 0.0, 0.42), b_pelvis)
    b_sh_l   = add_bone("Shin_L",      (0.11, 0.0, 0.42),  (0.11, -0.05, 0.04), b_th_l, True)

    bpy.ops.object.mode_set(mode="OBJECT")
    return arm_obj


def bind_body_and_weapon(arm_obj, body_obj, weapon_obj):
    """몸체는 Blender 자동 웨이트(ARMATURE_AUTO), 환도는 Weapon_Socket 본에 강체 부착."""
    # 1. Body -> Armature with Automatic Weights
    bpy.ops.object.select_all(action="DESELECT")
    body_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    # 2. Weapon -> Weapon_Socket bone rigid parenting (옷자락 딸림 0%)
    bpy.ops.object.select_all(action="DESELECT")
    weapon_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")
    arm_obj.data.bones.active = arm_obj.data.bones["Weapon_Socket"]
    bpy.ops.object.parent_set(type="BONE", keep_transform=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    print("[StoryWorld] Bound Body (ARMATURE_AUTO) & Weapon (Rigid Weapon_Socket).")


def create_animations(arm_obj):
    """Idle, Walk, Attack_DiagonalSlash(칼날 하향 + 왼쪽 어깨 위 -> 오른쪽 아래 대각 베기) 3종 액션 생성."""
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")

    for pb in arm_obj.pose.bones:
        pb.rotation_mode = "XYZ"

    def reset_pose():
        for pb in arm_obj.pose.bones:
            pb.location = (0.0, 0.0, 0.0)
            pb.rotation_euler = (0.0, 0.0, 0.0)

    def key_all(frame):
        for pb in arm_obj.pose.bones:
            pb.keyframe_insert(data_path="location", frame=frame)
            pb.keyframe_insert(data_path="rotation_euler", frame=frame)

    def set_rot(name, rx, ry, rz):
        arm_obj.pose.bones[name].rotation_euler = (rx * D2R, ry * D2R, rz * D2R)

    def push_action(name):
        act = arm_obj.animation_data.action
        act.name = name
        track = arm_obj.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, int(act.frame_range[0]), act)
        arm_obj.animation_data.action = None

    if not arm_obj.animation_data:
        arm_obj.animation_data_create()

    # --- 1. Idle (48 frames = 1.6s) ---
    arm_obj.animation_data.action = bpy.data.actions.new("Idle")
    for f, s in [(1, 0.0), (24, 1.0), (48, 0.0)]:
        reset_pose()
        arm_obj.pose.bones["Pelvis"].location = (0.0, 0.0, -0.015 * s)
        set_rot("Spine_Chest", 4 + 3 * s, 0, 0)
        set_rot("Head_Hood", 3 + 2 * s, 0, 0)
        set_rot("Arm_R", 4 + 4 * s, 4 * s, -4)
        set_rot("Arm_L", 5 - 3 * s, -3 * s, 4)
        key_all(f)
    push_action("Idle")

    # --- 2. Walk (24 frames = 0.8s) ---
    arm_obj.animation_data.action = bpy.data.actions.new("Walk")
    walk_keys = [
        (1,  -26, 12,  26, 18,  7, -8,  0.00),
        (7,   -4, 34,   4,  8,  0,  0,  0.03),
        (13,  26, 18, -26, 12, -7,  8,  0.00),
        (19,   4,  8,  -4, 34,  0,  0,  0.03),
        (25, -26, 12,  26, 18,  7, -8,  0.00),
    ]
    for f, rth, rsh, lth, lsh, pyaw, cyaw, bob in walk_keys:
        reset_pose()
        arm_obj.pose.bones["Pelvis"].location = (0.0, 0.0, bob - 0.02)
        set_rot("Pelvis", 0, 0, pyaw)
        set_rot("Spine_Chest", 9, 0, cyaw)
        set_rot("Head_Hood", -4, 0, -cyaw * 0.5)
        set_rot("Thigh_R", rth, 0, 0)
        set_rot("Shin_R", rsh, 0, 0)
        set_rot("Thigh_L", lth, 0, 0)
        set_rot("Shin_L", lsh, 0, 0)
        set_rot("Arm_R", 10 + rth * 0.25, 0, -6)
        set_rot("Arm_L", -rth * 0.5, 0, 4)
        key_all(f)
    push_action("Walk")

    # --- 3. Attack_DiagonalSlash (22 frames = 0.73s) ---
    # 칼날이 아래를 향하게 유지하면서 오른손이 왼쪽 어깨 위 -> 오른쪽 아래 대각선으로 내려베기
    arm_obj.animation_data.action = bpy.data.actions.new("Attack_DiagonalSlash")

    # Frame 1: 시작 자세
    reset_pose()
    key_all(1)

    # Frame 7: 왼쪽 어깨 위로 오른손 감아올리기 (칼날 하향 유지)
    reset_pose()
    arm_obj.pose.bones["Pelvis"].location = (0.0, 0.08, -0.02)
    set_rot("Pelvis", 0, 0, 16)
    set_rot("Spine_Chest", 10, 12, 34)
    set_rot("Head_Hood", -4, -6, -18)
    set_rot("Arm_R", -68, 36, 54)
    set_rot("Weapon_Socket", -18, 0, 0)  # 칼날 하향 유지
    set_rot("Arm_L", -14, 0, -10)
    key_all(7)

    # Frame 12: 왼쪽 어깨 위 -> 오른쪽 아래 대각 내려베기 피크 + 전방 런지
    reset_pose()
    arm_obj.pose.bones["Pelvis"].location = (0.0, -0.18, -0.14)
    set_rot("Pelvis", 6, 0, -18)
    set_rot("Spine_Chest", 26, -12, -38)
    set_rot("Head_Hood", -10, 6, 20)
    set_rot("Thigh_R", -36, 0, 0)
    set_rot("Shin_R", 44, 0, 0)
    set_rot("Thigh_L", 30, 0, 0)
    set_rot("Shin_L", 14, 0, 0)
    set_rot("Arm_R", 26, -36, -48)
    set_rot("Weapon_Socket", -22, 0, 0)  # 내려베기 끝에서도 칼날 하향 유지
    set_rot("Arm_L", 22, 0, -20)
    key_all(12)

    # Frame 16: 잔상 유지 (Follow-through)
    arm_obj.pose.bones["Pelvis"].location = (0.0, -0.16, -0.12)
    set_rot("Arm_R", 30, -38, -50)
    key_all(16)

    # Frame 22: 대기 자세 복귀
    reset_pose()
    key_all(22)
    push_action("Attack_DiagonalSlash")

    bpy.ops.object.mode_set(mode="OBJECT")
    print("[StoryWorld] Created 3 NLA animations: Idle, Walk, Attack_DiagonalSlash")


def setup_storyworld_camera_and_light():
    """편집용 .blend에 스토리월드 직교투영 카메라(45° / 32.5°)와 주광원 배치."""
    cam_data = bpy.data.cameras.new("StoryWorld_IsoCam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 2.75
    cam_obj = bpy.data.objects.new("StoryWorld_IsoCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    yaw, elev, dist = 45.0 * D2R, 32.5 * D2R, 8.0
    target = Vector((0.0, 0.0, 0.90))
    cam_obj.location = Vector((
        dist * math.cos(elev) * math.sin(yaw),
        -dist * math.cos(elev) * math.cos(yaw),
        0.90 + dist * math.sin(elev),
    ))
    cam_obj.rotation_euler = (target - cam_obj.location).to_track_quat("-Z", "Y").to_euler()

    sun_data = bpy.data.lights.new("StoryWorld_KeySun", type="SUN")
    sun_data.energy = 3.0
    sun_obj = bpy.data.objects.new("StoryWorld_KeySun", sun_data)
    bpy.context.scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = Euler((math.radians(38.0), 0.0, math.radians(35.0)), "XYZ")


def main():
    args = parse_args()
    if not os.path.exists(args["input"]):
        raise FileNotFoundError(f"입력 GLB 파일을 찾을 수 없습니다: {args['input']}")

    clear_scene()
    body_obj = import_and_normalize(args["input"])
    weapon_obj = separate_hwando_weapon(body_obj)
    arm_obj = build_humanoid_armature()
    bind_body_and_weapon(arm_obj, body_obj, weapon_obj)
    create_animations(arm_obj)
    setup_storyworld_camera_and_light()

    # 1. 편집용 .blend 저장
    if args["blend"]:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args["blend"]))
        print(f"[StoryWorld] Saved .blend: {os.path.abspath(args['blend'])}")

    # 2. 게임용 .glb 내보내기 (NLA 애니메이션 포함, 카메라/조명 제외)
    bpy.ops.object.select_all(action="DESELECT")
    arm_obj.select_set(True)
    body_obj.select_set(True)
    weapon_obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(args["output"]),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_nla_strips=True,
        export_yup=True,
    )
    print(f"[StoryWorld] Exported rigged & animated GLB: {os.path.abspath(args['output'])}")


if __name__ == "__main__":
    main()