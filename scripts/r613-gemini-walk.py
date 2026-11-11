#!/usr/bin/env python3
"""R613: 뿌리 추적자(dist00) 걷기 4칸 — 제미나이(gemini-3-pro-image, ElevenLabs 경유) 시안을 R380 시트 뒤에 붙인다.
원본 시트(root-stalker-r74-plain.webp)는 그대로 두고 새 파일 root-stalker-r74-walk-g1.webp 를 만든다(칸 0~3 원본, 4~7 걷기).
쓰는 법: python3 scripts/r613-gemini-walk.py <제미나이 결과 png>
검은 배경을 투명으로 빼고, 바닥 회색 줄(510~512행)을 지우고, 원본 0칸과 같은 키·발끝·몸 가운데로 맞춘다."""
import sys, json, hashlib, pathlib
import numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1] / 'r96' / 'runtime-text'
IDX = ROOT / 'assets/r380/mobs/index.json'
SRC = 'assets/r380/mobs/root-stalker-r74-plain.webp'
OUT = 'assets/r380/mobs/root-stalker-r74-walk-g1.webp'

def bbox(alpha, thr=24):
    ys, xs = np.where(alpha > thr)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def main(gen_png):
    g = np.asarray(Image.open(gen_png).convert('RGB')).astype(np.float32)
    mx = g.max(2)
    alpha = np.clip((mx - 10) / 26, 0, 1)
    gray = (np.abs(g[..., 0] - g[..., 1]) < 12) & (np.abs(g[..., 1] - g[..., 2]) < 12)
    alpha[505:516][gray[505:516]] = 0          # 바닥 줄
    # 검은 배경에서 뺀 어두운 가장자리 색을 되살린다(검정과 섞인 만큼 나눔)
    rgb = np.where(alpha[..., None] > 0, np.clip(g / np.maximum(alpha[..., None], 1e-3), 0, 255), 0)
    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    cols = [(0, 340), (340, 690), (690, 1010), (1010, 1376)]
    src = Image.open(ROOT / SRC).convert('RGBA')
    cw, ch = 288, 176
    ref = np.asarray(src.crop((0, 0, cw, ch)))[..., 3]
    rx0, ry0, rx1, ry1 = bbox(ref)
    H = ry1 - ry0; cx = (rx0 + rx1) / 2; foot = ry1
    refA = np.asarray(src.crop((0, 0, cw, ch))).astype(np.float32)
    refMask = refA[..., 3] > 128; refMass = refMask.sum()
    refMean = refA[refMask][:, :3].mean(0); refStd = refA[refMask][:, :3].std(0)
    sheet = Image.new('RGBA', (cw * 8, ch), (0, 0, 0, 0))
    sheet.paste(src, (0, 0))
    for i, (a, b) in enumerate(cols):
        cell = rgba[:, a:b]
        x0, y0, x1, y1 = bbox(cell[..., 3].astype(np.float32))
        c = cell[y0:y1, x0:x1].astype(np.float32)
        m = c[..., 3] > 128
        # 색 맞추기: 원본 0칸의 채널 평균·편차로(몸 질감은 두고 밝기·채도만)
        mean = c[m][:, :3].mean(0); std = c[m][:, :3].std(0)
        c[..., :3] = np.clip((c[..., :3] - mean) / np.maximum(std, 1) * refStd + refMean, 0, 255)
        im = Image.fromarray(c.astype(np.uint8), 'RGBA')
        # 크기 맞추기: 몸 넓이(불투명 픽셀 수)를 원본 0칸과 같게 — 키로 맞추면 똑바로 선 자세가 더 가늘어 보인다
        k = min((refMass / max(1, m.sum())) ** .5, H * 1.12 / (y1 - y0))
        im = im.resize((max(1, round(im.width * k)), round(im.height * k)), Image.LANCZOS)
        sheet.alpha_composite(im, (cw * (4 + i) + round(cx - im.width / 2), foot - im.height))
    out = ROOT / OUT
    sheet.save(out, 'WEBP', quality=90, method=6)
    data = out.read_bytes()
    idx = json.loads(IDX.read_text())
    row = next(m for m in idx['mobs'] if m['id'] == 'root-stalker-r74-plain')
    row.update(path=OUT, cols=8, move=[4, 5, 6, 7], bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
               walkSource={'tool': 'gemini-3-pro-image (ElevenLabs creative)', 'round': 'R613', 'note': '시안 — Dots CX-0067MV 정식본 오면 교체', 'genSha256': hashlib.sha256(pathlib.Path(gen_png).read_bytes()).hexdigest()})
    IDX.write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')
    print(json.dumps({'out': OUT, 'bytes': len(data), 'refH': int(H), 'foot': int(foot), 'cx': float(cx)}))

if __name__ == '__main__':
    main(sys.argv[1])
