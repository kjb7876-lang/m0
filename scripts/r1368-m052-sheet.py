"""R1368 '공실 표기 잔재'(우두머리 포함) 시트 — 사용자 2026-11-27 "공실표기 잔재 우두머리 왜케 떠다니는거 같고 이미지방향을 못잡냐".

원래 시트 assets/r290/mobs/m052.webp(4×3, 칸 256×320, 발 y≈297):
 - 걷기 8칸(1·2줄) = 옛 r92 정면 그림. 칸끼리 다리 차이가 거의 없어(반 박자 칸 화소 차 3.7~5.5) 걸어도 미끄러지듯 '떠다님'.
 - 공격 4칸(3줄) = Dots 다시 그린 그림인데 왼쪽을 본다. R248 그리기는 그림이 오른쪽을 본다고 가정(face=+1 → 그대로)하므로
   영웅이 오른쪽에 있으면 왼쪽으로 할퀴고, 왼쪽에 있으면 오른쪽으로 할퀴었다(좌우 반대).
고친 시트(assets/r1368/m052.webp, 같은 격자·발 줄·pivot):
 - 3줄 공격 4칸: 칸 가운데(pivot x=128) 기준 좌우 반전 → 오른쪽을 봄.
 - 1·2줄 걷기 8칸: 공격 마지막 칸(회수, 같은 Dots 그림체로 선 자세)을 반전한 그림에서 관절 메시 걷기 8칸(SW-0014 remap).
   대기는 R248 이 걷기 0·1칸을 번갈아 그리므로 같은 그림체·같은 방향이 된다.
사용: python3 scripts/r1368-m052-sheet.py
"""
import hashlib, importlib.util, json, math
from pathlib import Path
from PIL import Image, ImageOps
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sw14", ROOT / "scripts/build-sw0014-motion.py")
sw14 = importlib.util.module_from_spec(spec); spec.loader.exec_module(sw14)
RT = ROOT / "r96/runtime-text"
SRC = RT / "assets/r290/mobs/m052.webp"
OUT = RT / "assets/r1368/m052.webp"
CW, CH = 256, 320
# 반전한 회수 자세에서의 발(몸 상자 비율): 왼발(뒤) .35,.88 · 오른발(앞) .58,.95
LEFT, RIGHT, SWING, LIFT = (.35, .88), (.58, .95), .075, .05


def cell(im, i):
    return im.crop(((i % 4)*CW, (i // 4)*CH, (i % 4+1)*CW, (i // 4+1)*CH))


def controls(ph):
    s, c = math.sin(ph), math.cos(ph)
    lL, lR = LIFT, LIFT*.25  # 아래쪽(앞) 발은 조금만 들어 발 줄을 지킨다
    return [(LEFT[0], LEFT[1], .12, .11, SWING*s, -lL*max(0, c)),
            (RIGHT[0], RIGHT[1], .12, .11, -SWING*s, -lR*max(0, -c)),
            (LEFT[0], LEFT[1]-.16, .13, .11, .5*SWING*s, -.5*lL*max(0, c)),
            (RIGHT[0], RIGHT[1]-.16, .13, .11, -.5*SWING*s, -.5*lR*max(0, -c)),
            (.80, .62, .14, .16, -.03*s, .01*c),   # 앞(오른) 팔 발톱이 걸음 반대로
            (.18, .60, .14, .16, .03*s, -.01*c),   # 뒤(왼) 팔
            (.50, .30, .30, .22, -.010*s, 0)]


def main():
    im = Image.open(SRC).convert("RGBA")
    assert im.size == (CW*4, CH*3), im.size
    sheet = Image.new("RGBA", im.size)
    for k in range(4):  # 공격 줄 반전
        sheet.paste(ImageOps.mirror(cell(im, 8+k)), (k*CW, 2*CH))
    base = ImageOps.mirror(cell(im, 11))
    bbox = sw14.body_box(base)
    for i in range(8):
        f = sw14.remap(base, bbox, controls(2*math.pi*i/8))
        sheet.paste(f, ((i % 4)*CW, (i // 4)*CH))
    sheet.save(OUT, "WEBP", lossless=True, method=6)
    meta = {"source": "assets/r290/mobs/m052.webp", "sourceSha256": hashlib.sha256(SRC.read_bytes()).hexdigest(),
            "path": "assets/r1368/m052.webp", "sha256": hashlib.sha256(OUT.read_bytes()).hexdigest(), "bytes": OUT.stat().st_size,
            "layout": "4x3, 256x320, walk 8 (rows 1-2) + attack 4 (row 3), faces right, foot y~297",
            "method": "attack row mirrored at pivot; walk = SW-0014 articulated mesh from mirrored recovery cell"}
    (OUT.parent / "m052.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False)+"\n")
    print(meta["bytes"])


if __name__ == "__main__":
    main()
