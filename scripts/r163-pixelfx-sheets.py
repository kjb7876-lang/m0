#!/usr/bin/env python3
"""R163 — pixelfx(patch-gg/pixelfx, MIT) 이펙트를 게임용 시트로 뽑는다.

사용자 2026-10-31: "불·폭발·물·얼음·번개·근접·피격·투사체·회복·상태 이상·날씨·UI·아이템 획득·화면 전환 … 이것도 개선 활용".
pixelfx 는 코드로 그리는 픽셀 이펙트 모음(MIT, NOTICE: 일부 효과는 Sprite Fusion 의 MIT 효과를 각색)이고 외부 게임의 그림을 뽑은 것이 아니다.
그 저장소의 tools/render.mjs --sheet 로 투명 PNG + Aseprite JSON 을 만든 뒤, 내용 있는 칸만 2칸마다 하나(15장/초)로 줄여
무손실 WebP 한 장(격자)과 index.json(출처 커밋·효과 id·팔레트·칸 크기·기준점·sha256)으로 저장한다.

  python3 scripts/r163-pixelfx-sheets.py /path/to/pixelfx [out_dir]
"""
import hashlib, json, math, os, subprocess, sys, tempfile
from PIL import Image

BLOOD = ["#070203", "#1a0508", "#3a0a12", "#64111f", "#931c2c", "#c43a44", "#ec8a86", "#ffe6df"]
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
}
STEP = 2


def main():
    src = os.path.abspath(sys.argv[1])
    out = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else "r96/runtime-text/assets/r163/pixelfx")
    os.makedirs(out, exist_ok=True)
    commit = subprocess.check_output(["git", "-C", src, "rev-parse", "HEAD"], text=True).strip()
    index = {"source": "https://github.com/patch-gg/pixelfx", "commit": commit, "license": "MIT (Copyright (c) 2026 Patch, Copyright (c) 2026 Hugo Duprez)",
             "notice": "src/core/sim.js 와 일부 효과는 Sprite Fusion(Hugo Duprez, MIT) 효과를 각색 — 저장소 NOTICE.md", "step": STEP, "effects": {}}
    with tempfile.TemporaryDirectory() as tmp:
        for name, (fx, opts, use) in EFFECTS.items():
            subprocess.run(["node", "tools/render.mjs", fx, "--sheet", "--opts", json.dumps(opts), "--out", tmp], cwd=src, check=True, stdout=subprocess.DEVNULL)
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
                cells.append(cell)
            cols = min(len(cells), max(1, int(math.ceil(math.sqrt(len(cells) * fh / fw)))))
            rows = int(math.ceil(len(cells) / cols))
            atlas = Image.new("RGBA", (cols * fw, rows * fh))
            for k, c in enumerate(cells):
                atlas.paste(c, ((k % cols) * fw, (k // cols) * fh))
            path = os.path.join(out, name + ".webp")
            atlas.save(path, "WEBP", lossless=True, method=6)
            b = open(path, "rb").read()
            index["effects"][name] = {"fx": fx, "options": opts, "use": use, "file": name + ".webp", "sha256": hashlib.sha256(b).hexdigest(), "bytes": len(b),
                                      "frame": [fw, fh], "pivot": pf["pivot"], "columns": cols, "frames": len(cells), "fps": pf["fps"] / STEP, "loop": pf["loop"]}
            print(name, fx, len(cells), "frames", atlas.size, len(b), "bytes")
    json.dump(index, open(os.path.join(out, "index.json"), "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
