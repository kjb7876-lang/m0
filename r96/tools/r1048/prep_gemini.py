# R1048 제미나이가 만든 깃털·머리 그림(초록 #00FF00 배경)을 렌더용 카드 텍스처로 바꾼다.
# 실행: python3 prep_gemini.py <gemini_dir> <out_dir>
#  · feather_*.png / hair_*.png 를 찾아 초록 배경을 알파로 빼고(초록 번짐도 지움), 그림 둘레로 잘라
#    세로가 꽉 차게 512×2048(머리는 512×1024) 가운데 맞춤으로 저장한다.
#  · 깃털 폭 비율(FILL = 그림 반폭 / 카드 반폭)을 fill.txt 에 적는다 → ego2_dress.py --fill 로 넘긴다.
#  · 천(coat_fabric.png)은 이음매를 없앤 회색조 높이맵 coat_height.png 로, 금장(gold_trim.png)은 문양 띠만 잘라
#    한 주기 정수배로 끊고 좌우를 섞어 가로로 이어지게, 얼굴(face_front.png)은 그대로 넘긴다.
import sys, os, glob
import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)

def key(im):
    a = np.asarray(im.convert('RGB')).astype(float) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    greenness = g - np.maximum(r, b)                      # 초록 우세 정도
    alpha = np.clip(1 - (greenness - .03) / .22, 0, 1)    # 확실한 초록 = 0
    # 배경색은 정확히 #00FF00 이 아니다 → 확실한 배경 픽셀 평균으로 잰다
    bgm = greenness > .6
    bg = a[bgm].mean(0) if bgm.any() else np.array([0, 1, 0.])
    # 반투명 가장자리: 배경과 섞인 색을 풀어낸다(c = a·fg + (1-a)·bg)
    al = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((a - (1 - alpha[..., None]) * bg) / al, 0, 1)
    fg = np.where(alpha[..., None] > .02, fg, 0)
    r, g, b = fg[..., 0], fg[..., 1], fg[..., 2]
    # 남은 초록 번짐 제거: 원래 초록기가 있던 가장자리는 g ≤ (r+b)/2, 나머지는 g ≤ max(r,b)
    g2 = np.where(greenness > -.02, np.minimum(g, (r + b) / 2 + .03), np.minimum(g, np.maximum(r, b) + .02))
    rgb = np.dstack([r, g2, b])
    return rgb, alpha

def card(path, size):
    rgb, al = key(Image.open(path))
    ys, xs = np.where(al > .5)
    if not len(ys): print('빈 그림', path); return None, 0
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    cx = (x0 + x1) / 2; hw = max(cx - x0, x1 - cx) * 1.06
    h = y1 - y0; ar = size[0] / size[1]
    half = max(hw, h * ar / 2)                           # 카드 비율에 맞는 반폭
    L, R = int(cx - half), int(cx + half)
    pad = np.zeros((h, R - L, 4))
    sx0, sx1 = max(L, 0), min(R, rgb.shape[1])
    pad[:, sx0 - L:sx1 - L, :3] = rgb[y0:y1, sx0:sx1]; pad[:, sx0 - L:sx1 - L, 3] = al[y0:y1, sx0:sx1]
    img = Image.fromarray((pad * 255).astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS)
    return img, hw / half

fills = []
for p in sorted(glob.glob(os.path.join(SRC, 'feather_*.png'))):
    img, f = card(p, (512, 2048))
    if img: img.save(os.path.join(OUT, os.path.basename(p))); fills.append(f); print('깃털', os.path.basename(p), round(f, 3))
for p in sorted(glob.glob(os.path.join(SRC, 'hair_*.png'))):
    img, f = card(p, (512, 1024))
    if img: img.save(os.path.join(OUT, os.path.basename(p))); print('머리', os.path.basename(p))
def tileable(a, k=.18):
    """가장자리 이음매를 없앤다: 반 칸 민 사본을 가장자리 쪽에만 섞는다(가운데는 원본, 가장자리는 이어지는 사본)."""
    h, w = a.shape[:2]
    rolled = np.roll(np.roll(a, h // 2, 0), w // 2, 1)
    wy = np.clip(np.minimum(np.arange(h), h - 1 - np.arange(h)) / (k * h), 0, 1)
    wx = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / (k * w), 0, 1)
    m = np.minimum(wy[:, None], wx[None, :]); m = m * m * (3 - 2 * m)
    if a.ndim == 3: m = m[..., None]
    return a * m + rolled * (1 - m)

cf = os.path.join(SRC, 'coat_fabric.png')
if os.path.exists(cf):  # 천: 회색조 높이맵, 대비를 펴고 이음매 없앤 1024
    g = np.asarray(Image.open(cf).convert('L')).astype(float) / 255
    lo, hi = np.percentile(g, [1, 99]); g = np.clip((g - lo) / (hi - lo), 0, 1)
    g = tileable(g)
    Image.fromarray((g * 255).astype(np.uint8)).resize((1024, 1024), Image.LANCZOS).save(os.path.join(OUT, 'coat_height.png')); print('천 높이맵(이음 보정)')
gt = os.path.join(SRC, 'gold_trim.png')
if os.path.exists(gt):  # 금장: 문양 띠만 잘라(세로 비율 유지) 한 주기 정수배로 끊고 좌우 이음을 섞는다
    a = np.asarray(Image.open(gt).convert('RGB')).astype(float) / 255
    lum = a.mean(2); rows = np.where(lum.mean(1) > .02)[0]
    y0, y1 = max(rows.min() - 2, 0), min(rows.max() + 3, a.shape[0]); b = a[y0:y1]
    B = b.mean(2) - b.mean()
    per = max(range(150, b.shape[1] // 2), key=lambda s_: (B[:, :-s_] * B[:, s_:]).mean())  # 문양 주기(자기상관)
    reps = max(1, min(2, (b.shape[1] - per) // per))         # 두 주기(해상도 우선), 한쪽 여유 한 주기를 남긴다
    col = b.mean((0, 2)); x0 = per // 2 + int(np.argmin(col[per // 2: per // 2 + per]))  # 문양 빈 곳에서 끊기
    x0 = min(x0, b.shape[1] - reps * per)
    band = b[:, x0:x0 + reps * per].copy(); K = 24
    if x0 >= K:  # 오른 끝을 왼 끝 바로 앞 칸과 섞어 이음 없앰
        w_ = np.linspace(0, 1, K)[None, :, None]
        band[:, -K:] = band[:, -K:] * (1 - w_) + b[:, x0 - K:x0] * w_
    H_ = int(round(1024 * band.shape[0] / band.shape[1] / 4)) * 4
    Image.fromarray((np.clip(band, 0, 1) * 255).astype(np.uint8)).resize((1024, H_), Image.LANCZOS).save(os.path.join(OUT, 'gold_trim.png'))
    print('금장 띠', f'y{y0}-{y1}', '주기', per, '×', reps, '→ 1024×', H_)
ff = os.path.join(SRC, 'face_front.png')
if os.path.exists(ff):  # 얼굴: 참고 그림 그대로(투영은 ego2_dress.py 가 눈 위치에 맞춰 한다)
    Image.open(ff).convert('RGB').save(os.path.join(OUT, 'face_front.png')); print('얼굴 참고')
if fills:
    open(os.path.join(OUT, 'fill.txt'), 'w').write(f'{np.median(fills):.3f}\n'); print('FILL', round(float(np.median(fills)), 3))
