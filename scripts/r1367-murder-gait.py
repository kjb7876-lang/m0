"""R1367 제7부(윤하람~옥상순환) 중간보스 4종 걷기 8칸 — 사용자 2026-11-27 "이동모션을 안하는거 같더만".

이 보스들은 R104 열쇠 자세 4장(준비·타격·이어짐·회수)뿐이라 걷는 동안 R1029 '떠서 이동'(회수 자세 + 발밑 안개 웅덩이)이
그려졌다. 다리가 움직이지 않고 안개 위를 미끄러져 '이동 모션을 안 한다'로 보였다.
SW-0014(scripts/build-sw0014-motion.py)와 같은 관절 메시 변형으로 회수 자세(p4)에서 걷기 8칸을 굽는다.
 - 두 발이 번갈아 들리고(디딤발은 바닥에 붙음) 무릎·옷자락이 따라오며, 윗몸은 반대로 조금 흔들린다.
 - 칸 크기·여백·발 줄은 8칸 모두 같다(시트 한 장 = 배율 하나). 원래 그림 방향·좌우 그대로(엔진 뒤집기 그대로 탐).
사용: python3 scripts/r1367-murder-gait.py   (원본: r96/runtime-text/assets/r104/bosses/*-p4.webp, 출력: assets/r1367/)
"""
import hashlib, json, math, sys
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import importlib.util
spec = importlib.util.spec_from_file_location("sw14", ROOT / "scripts/build-sw0014-motion.py")
sw14 = importlib.util.module_from_spec(spec); spec.loader.exec_module(sw14)
RT = ROOT / "r96/runtime-text"
OUT = RT / "assets/r1367"
N, FPS = 8, 8
# 발 위치(불투명 몸 상자 비율 u,v): 그림을 10% 격자로 보고 정함(qa/r1367/review.md 에 격자 그림).
# lift = 들린 발 높이, swing = 앞뒤 흔들 폭(몸 상자 비율). 넓은 망토·옷자락은 hem 으로 따라 흔든다.
ACTORS = {
    "mb-murder01": dict(size=(367, 418), left=(.36, .84), right=(.56, .95), swing=.060, lift=.040, hem=(.30, .62)),
    "mb-murder02": dict(size=(305, 412), left=(.40, .95), right=(.76, .86), swing=.060, lift=.040, hem=(.24, .70)),
    "murder04-mid": dict(size=(517, 471), left=(.40, .93), right=(.66, .76), swing=.055, lift=.045, hem=None),
    "mb-murder03": dict(size=(443, 416), left=(.36, .94), right=(.56, .86), swing=.055, lift=.040, hem=(.25, .62)),
    # 본보스 파란불(blue-executor): 서 있기(R1224 표)·돌진 준비(R1029 표, 걷는 동안 실제로 그려지는 쪽) 두 그림 모두.
    "blue-executor-idle": dict(src="assets/generated-story10-cycle-20261005/cyclic-murder/blue_executor_idle.png", rect=(270, 73, 768, 1134),
                               left=(.20, .95), right=(.65, .95), swing=.050, lift=.035, hem=(.50, .74)),
    "blue-executor-charge": dict(src="assets/generated-story10-cycle-20261005/cyclic-murder/blue_executor_charge.png", rect=(160, 26, 1054, 1210),
                                 left=(.12, .96), right=(.75, .93), swing=.050, lift=.035, hem=(.50, .74)),
}
SITE = None  # 큰 원본(파란불 PNG)은 runtime-text 에 없고 빌드된 사이트에만 있다 → 첫 인자로 사이트 경로

def controls(a, phase):
    s, c = math.sin(phase), math.cos(phase)
    L, R = a["left"], a["right"]
    sw, lf = a["swing"], a["lift"]
    # 화면에서 더 아래에 있는(앞쪽) 발이 몸의 발 줄을 정한다 → 그 발은 조금만 들어 칸 사이 발 줄이 흔들리지 않게.
    lL, lR = (lf*.25, lf) if L[1] >= R[1] else (lf, lf*.25)
    # 왼발은 c>0 일 때 들려 앞으로(+s), 오른발은 반대 박자. 무릎(발 위 .16)도 절반만 따라온다.
    k = [
        (L[0], L[1], .13, .12, sw*s, -lL*max(0, c)),
        (R[0], R[1], .13, .12, -sw*s, -lR*max(0, -c)),
        (L[0], L[1]-.17, .14, .12, .5*sw*s, -.5*lL*max(0, c)),
        (R[0], R[1]-.17, .14, .12, -.5*sw*s, -.5*lR*max(0, -c)),
        # 윗몸: 발과 반대로 살짝 흔들림 + 디딜 때 아주 조금 눌림
        (.50, .30, .30, .22, -.012*s, 0),
    ]
    if a["hem"]:
        k.append((a["hem"][0], a["hem"][1], .16, .14, .022*s, .010*c))
    return k


def build(actor, a):
    if "src" in a:
        rel, (x, y, w, h) = a["src"], a["rect"]
        src = RT / rel
        if not src.exists():
            src = Path(SITE) / rel
        with Image.open(src) as im:
            cell = im.convert("RGBA").crop((x, y, x+w, y+h))
        key = rel.replace("assets/", "", 1)+f"|{x},{y},{w},{h}"
    else:
        rel = f"assets/r104/bosses/{actor}-p4.webp"
        src = RT / rel
        with Image.open(src) as im:
            cell = im.convert("RGBA")
        assert cell.size == a["size"], (actor, cell.size)
        w, h = cell.size
        key = f"r104/bosses/{actor}-p4.webp|0,0,{w},{h}"
    bbox = sw14.body_box(cell)
    bounds = cell.getbbox()
    mx = math.ceil((bbox[2]-bbox[0])*.08); my = math.ceil((bbox[3]-bbox[1])*.08)
    crop = (bounds[0]-mx, bounds[1]-my, bounds[2]+mx, bounds[3]+my)
    cropped = cell.crop(crop)
    factor = min(1, 332/cropped.width, 344/cropped.height)
    size = (round(cropped.width*factor), round(cropped.height*factor))
    body = tuple((p-crop[i % 2])*size[i % 2]/cropped.size[i % 2] for i, p in enumerate(bbox))
    art = cropped.resize(size, Image.Resampling.LANCZOS)
    sheet = Image.new("RGBA", (size[0]*N, size[1]))
    for i in range(N):
        sheet.paste(sw14.remap(art, body, controls(a, 2*math.pi*i/N)), (size[0]*i, 0))
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{actor}-walk8.webp"
    sheet.save(target, "WEBP", quality=88, method=6)
    pad = [-crop[0]/w, -crop[1]/h, (crop[2]-w)/w, (crop[3]-h)/h]
    return {"actor": actor, "key": key, "source": rel, "sourceSha256": hashlib.sha256(src.read_bytes()).hexdigest(),
            "path": f"assets/r1367/{actor}-walk8.webp", "cw": size[0], "ch": size[1], "n": N, "fps": FPS,
            "pad": [round(p, 7) for p in pad], "kind": "gait", "bytes": target.stat().st_size,
            "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}


JS = r"""// R1367 제7부(윤하람~옥상순환) 중간보스 4종 걷기 — 사용자 2026-11-27 "윤하람-옥상순환쪽 보스들 … 이동모션을 안하는거 같더만".
//  헤드리스 실측(qa/r1367/walkprobe.mjs): 파란불 역주행 목격자·공실장부 당직감사·진술 봉쇄 인과핵·옥상 인과보관인은 걷는 동안
//  R1029 '떠서 이동' 시트(회수 자세 p4 한 장 + 발밑 검보라 안개 웅덩이 8칸)만 그렸다 → 다리가 그대로인 채 안개 위를 미끄러졌다.
//  이 보스들은 장화·구두·발톱이 있는 걷는 몸이라, 같은 p4 그림에서 관절 메시로 굽은 걷기 8칸(scripts/r1367-murder-gait.py,
//  SW-0014 remap 과 같은 방식)으로 R1029 표의 그 네 줄만 바꾼다. 그리는 길(R974 floatSwap: 몸 사각형 + pad, 같은 좌우·기울기)은 그대로.
//  kind 'walk': SW-0014 'gait' 는 보스가 시전 중(storyAttackUntil5·r61Action)이면 정지 그림으로 돌아가지만, 옛 안개 시트는 시전 중 걸음에도
//  그려졌다 → 같은 때 걷기 칸이 나오도록 'gait' 가 아닌 이름(R974 는 gait 만 시전 중 막음). 헤드리스 실측에서 gait 이면 걸음의 20%%가 정지 그림이었다.
//  원래 안개 시트(assets/r1029/float/*)는 지우지 않는다. 끄기: localStorage['storyworld.r1367.murderWalk']='{"on":false}' 뒤 새로고침.
(()=>{'use strict';const D=window.__STORYWORLD_MOVE_FLOAT_R1029_DATA__;if(!D||!D.arts||window.__STORYWORLD_MURDER_WALK_R1367__)return;
 let on=true;try{const s=JSON.parse(localStorage.getItem('storyworld.r1367.murderWalk')||'null');if(s&&s.on===false)on=false;}catch(_){}
 const W=%s;
 const prev={};if(on){const A={...D.arts};for(const [k,v] of Object.entries(W)){prev[k]=A[k]||null;A[k]=v;}window.__STORYWORLD_MOVE_FLOAT_R1029_DATA__={...D,revision:String(D.revision||'')+'+R1367',arts:A};}
 window.__STORYWORLD_MURDER_WALK_R1367__=Object.freeze({rev:'R1367-murder-walk-1',on,sheets:W,replaced:prev});})();
"""


def write_js(rows):
    W = {r["key"]: {"path": r["path"], "n": r["n"], "fps": r["fps"], "cw": r["cw"], "ch": r["ch"], "pad": r["pad"], "kind": "walk", "r1367": True} for r in rows}
    (ROOT / "r96/client-source/murder-boss-walk-r1367.js").write_text(JS % json.dumps(W, ensure_ascii=False), encoding="utf8")


def main():
    global SITE
    args = sys.argv[1:]
    if args and Path(args[0]).is_dir():
        SITE = args.pop(0)
    only = set(args)
    rows = [build(k, v) for k, v in ACTORS.items() if not only or k in only]
    (OUT / "walk8.json").write_text(json.dumps({"origin": "StoryWorld first-party R104 key pose art, R1367 walk derivatives",
                                                "method": "articulated mesh (SW-0014 remap), 8 frames", "sheets": rows}, indent=1, ensure_ascii=False)+"\n")
    if not only:
        write_js(rows)
    for r in rows:
        print(r["actor"], r["cw"], r["ch"], r["bytes"])


if __name__ == "__main__":
    main()
