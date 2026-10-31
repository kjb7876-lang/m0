#!/usr/bin/env python3
"""R163 — pixelfx(patch-gg/pixelfx, MIT) 이펙트를 게임용 시트로 뽑는다.

사용자 2026-10-31: "불·폭발·물·얼음·번개·근접·피격·투사체·회복·상태 이상·날씨·UI·아이템 획득·화면 전환 … 이것도 개선 활용".
pixelfx 는 코드로 그리는 픽셀 이펙트 모음(MIT, NOTICE: 일부 효과는 Sprite Fusion 의 MIT 효과를 각색)이고 외부 게임의 그림을 뽑은 것이 아니다.
그 저장소의 tools/render.mjs --sheet 로 투명 PNG + Aseprite JSON 을 만든 뒤, 내용 있는 칸만 2칸마다 하나(15장/초)로 줄여
WebP 한 장(격자, R166 부터 손실 q90)과 index.json(출처 커밋·효과 id·팔레트·칸 크기·기준점·sha256)으로 저장한다.

  python3 scripts/r163-pixelfx-sheets.py /path/to/pixelfx [out_dir]
"""
import hashlib, json, math, os, subprocess, sys, tempfile
from PIL import Image, ImageFilter
import numpy as np

BLOOD = ["#070203", "#1a0508", "#3a0a12", "#64111f", "#931c2c", "#c43a44", "#ec8a86", "#ffe6df"]
GRAY = ["#050505", "#1c1c1c", "#383838", "#5a5a5a", "#808080", "#a8a8a8", "#d2d2d2", "#ffffff"]  # R175: 게임에서 물들일 회색
TEAL = ["#02090a", "#06222a", "#0b4a52", "#13807e", "#2fb8a8", "#7ae0cf", "#c8fff2", "#ffffff"]
# 게임 이름: (pixelfx 효과, 옵션, 쓰는 곳)
EFFECTS = {
    "tendrils-blood": ("shadow/shadow-tendrils", {"palette": BLOOD, "seed": 3}, "사몽 보스 촉수 패턴(R162) — 촉수 자리마다"),
    "hands-blood": ("shadow/grasping-hands", {"palette": BLOOD, "seed": 5}, "B 광장 중간보스가 나타날 때"),
    "meteor": ("fire/meteor", {"seed": 2}, "사몽 보스 운석 패턴(R162) — 떨어져 터지는 자리"),
    "dark-explosion-blood": ("shadow/dark-explosion", {"palette": BLOOD, "seed": 4}, "분신 돌진이 끝나는 자리, 중간보스가 쓰러질 때"),
    "collect-burst": ("pickups/collect-burst", {"seed": 1}, "단서조각을 주울 때"),
    "crit-hit": ("impacts/crit-hit", {"seed": 1}, "기본공격 5연타 폭발(R160)"),
    "hit-flash": ("impacts/hit-flash", {"seed": 1}, "정화의 코어에 적이 닿을 때"),
    "core-orb-teal": ("arcane/arcane-orb", {"palette": TEAL, "seed": 1}, "정화의 코어(D 구역) 빛"),
    # R165 (사용자 2026-10-31 "부족한 이펙트 총개선, 이미 괜찮은 건 놔두고"): 공용 그림 한 장뿐이던 순간들
    "level-up": ("holy/holy-pillar", {"seed": 1}, "레벨이 오를 때(본편은 공용 회복 문양 한 장) — R166: ui/level-up 은 기둥 안에 픽셀 사람 윤곽이 남아 빛기둥으로"),
    "heal-aoe": ("holy/heal-aoe", {"seed": 1}, "체력 회복(레벨업·5연타 보호막 회복) — 발밑 빛 고리"),
    # R166: poof-ash(만화풍 동글 구름)는 게임 그림체와 맞지 않아 빼고, 몹 사망은 게임의 칠한 연기·불티 스프라이트로 그린다(effects-r165.js).
    "portal-teal": ("arcane/portal", {"palette": TEAL, "seed": 1}, "사몽 구역의 열린 끝의 문(반복)"),
    # R175(사용자 "pixelfx … 이것도 활용, 이펙트 색은 각자의 이름색+고유색+보조색"): 잡몹 공격 타격 — 지역 서사별 모양을 회색으로 뽑아
    #  게임에서 그 몹의 R114 고유색·보조색으로 물들인다(pixelfx-r163 tint). 초안 24개를 나란히 그려 보고 고른 것(사람·글씨·검은 배경 든 것은 뺌).
    "mob-domestic": ("melee/double-slash", {"palette": GRAY, "seed": 2}, "집 — 할퀸 듯한 두 번 베기"),
    "mob-forge": ("melee/hammer-smash", {"palette": GRAY, "seed": 2}, "대장간 — 망치 내려치기 불티"),
    "mob-memory": ("shadow/hex-sigil", {"palette": GRAY, "seed": 2}, "기억 — 육망성 문양"),
    "mob-neural": ("lightning/zap-hit", {"palette": GRAY, "seed": 2}, "신경 — 신경 가지처럼 갈라지는 전류"),
    "mob-clinical": ("melee/thrust", {"palette": GRAY, "seed": 2}, "병원 — 메스로 찌르기"),
    "mob-garden": ("nature/vine-whip", {"palette": GRAY, "seed": 2}, "정원 — 덩굴 채찍"),
    "mob-stone": ("nature/earth-spike", {"palette": GRAY, "seed": 2}, "석조·동굴 — 솟는 돌가시"),
    "mob-snow": ("ice/ice-shatter", {"palette": GRAY, "seed": 2}, "눈 — 얼음 깨짐"),
    "mob-coast": ("water/splash", {"palette": GRAY, "seed": 2}, "해안·늪 — 물 튐"),
    "mob-regional": ("melee/sword-slash", {"palette": GRAY, "seed": 2}, "그 밖 — 베기"),
}
STEP = 2


# R166 (사용자 2026-10-31 "풀개선하되 기존 그림체와 일관성이 있게"): pixelfx 는 각진 픽셀 가장자리·원색이라 손으로 칠한 듯한 게임 그림 위에서 겉돈다.
# 칸마다 ① 픽셀 계단을 부드럽게(미리 곱한 색으로 0.8px 흐림) ② 밝은 곳에 은은한 빛 번짐(6px, 0.45) ③ 채도 0.82·아주 약한 따뜻한 쪽 색 맞춤.
# 모양·타이밍·기준점은 그대로, 그림 결만 게임 쪽(R106/R108 칠한 이펙트의 부드러운 빛)으로 맞춘다.
SOFT = {"blur": 0.8, "bloom": 6, "bloomK": 0.45, "sat": 0.82, "warm": 0.06}


def soften(cell):
    a = np.asarray(cell.convert("RGBA"), dtype=np.float32) / 255.0
    rgb, al = a[..., :3], a[..., 3:4]
    pm = np.concatenate([rgb * al, al], axis=-1)
    def blur(arr, r):
        ch = [np.asarray(Image.fromarray(np.uint8(np.clip(arr[..., i], 0, 1) * 255)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255.0 for i in range(arr.shape[-1])]
        return np.stack(ch, -1)
    pm = blur(pm, SOFT["blur"])
    lum = (pm[..., 0] * .3 + pm[..., 1] * .59 + pm[..., 2] * .11)
    bright = pm * np.clip((lum - .45) / .4, 0, 1)[..., None]
    glow = blur(bright, SOFT["bloom"]) * SOFT["bloomK"]
    pm = pm + glow * (1 - pm[..., 3:4])
    al = np.clip(pm[..., 3:4], 0, 1)
    rgb = np.where(al > 1e-4, pm[..., :3] / np.maximum(al, 1e-4), 0)
    g = (rgb * np.array([.3, .59, .11])).sum(-1, keepdims=True)
    rgb = g + (rgb - g) * SOFT["sat"]
    rgb = rgb * (1 - SOFT["warm"]) + np.array([.85, .70, .55]) * SOFT["warm"] * rgb.max(-1, keepdims=True)
    out = np.concatenate([np.clip(rgb, 0, 1), al], -1)
    return Image.fromarray(np.uint8(out * 255 + .5), "RGBA")


def main():
    src = os.path.abspath(sys.argv[1])
    out = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else "r96/runtime-text/assets/r163/pixelfx")
    os.makedirs(out, exist_ok=True)
    commit = subprocess.check_output(["git", "-C", src, "rev-parse", "HEAD"], text=True).strip()
    index = {"source": "https://github.com/patch-gg/pixelfx", "commit": commit, "license": "MIT (Copyright (c) 2026 Patch, Copyright (c) 2026 Hugo Duprez)",
             "notice": "src/core/sim.js 와 일부 효과는 Sprite Fusion(Hugo Duprez, MIT) 효과를 각색 — 저장소 NOTICE.md", "step": STEP, "soften": SOFT, "effects": {}}
    only = set(filter(None, os.environ.get("R163_ONLY", "").split(",")))  # R175: 이름만 골라 다시 뽑기(나머지 시트·출처표는 그대로)
    if only and os.path.exists(os.path.join(out, "index.json")):
        index["effects"] = json.load(open(os.path.join(out, "index.json")))["effects"]
    with tempfile.TemporaryDirectory() as tmp:
        for name, (fx, opts, use) in EFFECTS.items():
            if only and name not in only:
                continue
            subprocess.run(["node", "tools/render.mjs", fx, "--sheet", "--no-actor", "--opts", json.dumps(opts), "--out", tmp], cwd=src, check=True, stdout=subprocess.DEVNULL)
            base = os.path.join(tmp, fx, fx.split("/")[1])
            meta = json.load(open(base + ".json"))
            sheet = Image.open(base + ".png").convert("RGBA")
            pf = meta["meta"]["pixelfx"]
            fw, fh = pf["frameSize"]
            frames = meta["frames"] if isinstance(meta["frames"], list) else list(meta["frames"].values())
            cells = []
            for i in range(0, len(frames), STEP):
                f = frames[i]["frame"]
                cell = sheet.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
                if cell.getbbox() is None and not pf["loop"]:
                    continue
                cells.append(soften(cell))
            cols = min(len(cells), max(1, int(math.ceil(math.sqrt(len(cells) * fh / fw)))))
            rows = int(math.ceil(len(cells) / cols))
            atlas = Image.new("RGBA", (cols * fw, rows * fh))
            for k, c in enumerate(cells):
                atlas.paste(c, ((k % cols) * fw, (k // cols) * fh))
            path = os.path.join(out, name + ".webp")
            atlas.save(path, "WEBP", quality=90, alpha_quality=92, method=6)  # R166: 부드럽게 다듬은 뒤에는 손실 압축(무손실은 1MB 넘음)
            b = open(path, "rb").read()
            index["effects"][name] = {"fx": fx, "options": opts, "use": use, "file": name + ".webp", "sha256": hashlib.sha256(b).hexdigest(), "bytes": len(b),
                                      "frame": [fw, fh], "pivot": pf["pivot"], "columns": cols, "frames": len(cells), "fps": pf["fps"] / STEP, "loop": pf["loop"]}
            print(name, fx, len(cells), "frames", atlas.size, len(b), "bytes")
    json.dump(index, open(os.path.join(out, "index.json"), "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
