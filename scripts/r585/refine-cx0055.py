# CX-0055 슬레이어 이펙트 초안(Dots) 다듬기 — 인계 메모 문제점 수정 후 게임용 webp 시트로.
# 입력: 압축 푼 초안 폴더(신뢰하지 않는 데이터, 이미지 파일만 읽음). 출력: out/ 아래 webp + index.json + 비교 그림.
import json, os, sys, hashlib
import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
CELL, N, COLS = 256, 24, 6
OUTCELL = 192  # 게임용은 0.75배(메모리·용량)


def load(name):
    for d in os.listdir(SRC):
        p = os.path.join(SRC, d, name)
        if os.path.exists(p):
            return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255.0
    raise FileNotFoundError(name)


def cells(a):
    return [a[(i // COLS) * CELL:(i // COLS + 1) * CELL, (i % COLS) * CELL:(i % COLS + 1) * CELL].copy() for i in range(N)]


def premul(c):
    o = c.copy(); o[..., :3] *= o[..., 3:4]; return o


def unpremul(c):
    o = c.copy(); a = np.maximum(o[..., 3:4], 1e-6); o[..., :3] = np.where(o[..., 3:4] > 0, o[..., :3] / a, 0); return np.clip(o, 0, 1)


def blend(a, b, w):  # 프리멀티 보간
    return unpremul(premul(a) * (1 - w) + premul(b) * w)


def scale_about(c, s, px, py, sy=None):
    """피벗(px,py) 기준 확대/축소(sy 따로 주면 세로만 다르게). 프리멀티로 리샘플."""
    sy = s if sy is None else sy
    im = Image.fromarray((premul(c) * 255).round().astype(np.uint8), 'RGBA')
    w, h = max(1, round(CELL * s)), max(1, round(CELL * sy))
    im2 = im.resize((w, h), Image.LANCZOS)
    out = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    out.paste(im2, (round(px - px * s), round(py - py * sy)))
    return unpremul(np.asarray(out).astype(np.float32) / 255.0)


def clean_alpha(c, lo=16 / 255.0):
    """저알파 잔여·번짐 제거: lo 아래는 0, 그 위는 부드럽게 다시 펼친다(가장자리·피방울 보존)."""
    a = c[..., 3]
    na = np.clip((a - lo) / (1 - lo), 0, 1)
    c[..., 3] = na
    return c


def feather_edges(c, px=10):
    """셀 경계에서 잘린 듯 보이지 않게 가장자리 px 픽셀을 0으로 서서히."""
    r = np.minimum(np.arange(CELL), np.arange(CELL)[::-1]).astype(np.float32)
    m = np.clip(r / px, 0, 1)
    c[..., 3] *= m[:, None] * m[None, :]
    return c


def ellipse_mask(cx, cy, rx, ry, inner, feather=0.35):
    """타원 안은 inner(남길 알파 비율), 바깥은 1. 가장자리는 부드럽게."""
    y, x = np.mgrid[0:CELL, 0:CELL].astype(np.float32)
    d = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    t = np.clip((d - (1 - feather)) / feather, 0, 1)
    t = t * t * (3 - 2 * t)
    return inner + (1 - inner) * t


def loop_fix(frames, k=4):
    """루프 끝(23)→처음(0) 튐 줄이기: 마지막 k장을 처음 k장에 섞어 넣고 N-k 장 루프로."""
    n = len(frames); out = []
    for j in range(k):
        w = (j + 1) / (k + 1)
        out.append(blend(frames[n - k + j], frames[j], w))
    out += frames[k:n - k]
    return out


def seam_ratio(frames):
    d = [np.abs(frames[i][..., 3] - frames[(i + 1) % len(frames)][..., 3]).mean() for i in range(len(frames))]
    return float(d[-1] / max(1e-6, np.median(d[:-1])))


def unwhite(c, W=None):
    """흰(밝은 회색) 바탕 위에 그려진 그림에서 바탕을 빼 투명도로 바꾼다(색 분리)."""
    rgb = c[..., :3]
    if W is None:
        W = np.median(np.concatenate([rgb[:6, :, :].reshape(-1, 3), rgb[-6:, :, :].reshape(-1, 3)]), axis=0)
    # 알파 = 바탕에서 얼마나 멀어졌나(가장 많이 어두워진 채널 기준)
    a = np.max((W[None, None, :] - rgb) / np.maximum(W[None, None, :], 1e-3), axis=2)
    a = np.clip(a * 1.08, 0, 1)
    fg = (rgb - (1 - a[..., None]) * W[None, None, :]) / np.maximum(a[..., None], 1e-3)
    o = np.zeros_like(c); o[..., :3] = np.clip(fg, 0, 1); o[..., 3] = a
    o[..., 3] = np.where(a < 0.06, 0, o[..., 3])
    return o


def retime(frames, mapping):
    out = []
    for m in mapping:
        if isinstance(m, tuple):  # (i, j, w) 보간
            i, j, w = m; out.append(blend(frames[i], frames[j], w))
        else:
            out.append(frames[m].copy())
    return out


def resample(frames, lo, hi, n):
    """frames[lo..hi] 를 n 장으로 (보간)."""
    out = []
    for k in range(n):
        f = lo + (hi - lo) * (k / (n - 1) if n > 1 else 0)
        i = int(np.floor(f)); w = f - i
        out.append(frames[i].copy() if w < 1e-3 or i + 1 > hi else blend(frames[i], frames[i + 1], w))
    return out


def save_sheet(name, frames, meta):
    cols = COLS; rows = (len(frames) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * OUTCELL, rows * OUTCELL), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        f = f.copy(); f[..., 3] = np.where(f[..., 3] < 3 / 255, 0, f[..., 3])
        im = Image.fromarray((premul(f) * 255).round().astype(np.uint8), 'RGBA').resize((OUTCELL, OUTCELL), Image.LANCZOS)
        a = np.asarray(im).astype(np.float32) / 255.0
        im = Image.fromarray((unpremul(a) * 255).round().astype(np.uint8), 'RGBA')
        sheet.paste(im, ((i % cols) * OUTCELL, (i // cols) * OUTCELL))
    p = os.path.join(OUT, name + '.webp')
    sheet.save(p, 'WEBP', quality=82, method=6, exact=False)
    raw = open(p, 'rb').read()
    meta = dict(meta, file=name + '.webp', frames=len(frames), cell=OUTCELL, cols=cols, rows=rows,
                bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(), seam=round(seam_ratio(frames), 2) if meta.get('loop') and not meta.get('pingpong') else None)
    return meta


def contact(name, frames, bg=(36, 40, 48)):
    cols = COLS; rows = (len(frames) + cols - 1) // cols; s = 128
    im = Image.new('RGB', (cols * s, rows * s), bg)
    for i, f in enumerate(frames):
        t = Image.fromarray((f * 255).round().astype(np.uint8), 'RGBA').resize((s, s), Image.LANCZOS)
        im.paste(t, ((i % cols) * s, (i // cols) * s), t)
    im.save(os.path.join(OUT, 'contact-' + name + '.jpg'), quality=82)


index = {}
report = []


def emit(name, frames, meta, src):
    frames = [feather_edges(clean_alpha(f)) for f in frames]
    m = save_sheet(name, frames, dict(meta, source=src))
    index[name] = m
    contact(name, frames)
    report.append(f"{name}: {m['frames']}f {m['bytes']}B seam={m.get('seam')}")
    return frames


# ---------------- SL01 R 십자가 v2: frame8 완전 성장, 9~13 팽창, 13 타격, 14~23 붕괴. 정십자(회전·반전 없음)
c = cells(load('slayer-r-cross-v2.png'))
grow = [c[round(i * 13 / 8)] for i in range(9)]  # 0..8 ← 원본 0..13 (완전 성장을 8에)
swell = [scale_about(c[13], 1 + 0.012 * (i + 1), 128, 224) for i in range(5)]  # 9..13 팽창(최대 1.06배)
swell[-1][..., :3] = np.clip(swell[-1][..., :3] * 1.18 + 0.04, 0, 1)  # 13 타격: 한 번 밝게
cross = grow + swell + [c[i] for i in range(14, 24)]
emit('slayer-r-cross', cross, dict(loop=False, hit=13, pivot=[128, 224], fps=23.6, note='R 큰·작은 십자가 공용, 십자가 높이=셀 75%'), 'slayer-r-cross-v2 (HOLD) 재타이밍')

# ---------------- SL02 피 폭발: 큰 판(타격 5, 경계 깃털) · 작은 판(최고점 3으로 당김)
c = cells(load('slayer-blood-burst-big-v1.png'))
emit('slayer-burst-big', c, dict(loop=False, hit=5, pivot=[128, 224], fps=18), 'slayer-blood-burst-big-v1')
c = cells(load('slayer-blood-burst-small-v1.png'))
small = [c[0], c[2], c[4], c[6]] + resample(c, 7, 23, 20)
emit('slayer-burst-small', small, dict(loop=False, hit=3, pivot=[128, 224], fps=18), 'slayer-blood-burst-small-v1 재타이밍(최고점 6→3)')

# ---------------- SL03 R 적혈 오라 뒤·앞 (루프 이음매)
b = cells(load('slayer-r-aura-back-v1.png')); f = cells(load('slayer-r-aura-front-v1.png'))
hero_hole = ellipse_mask(128, 150, 34, 78, 0.35)  # 앞층은 얼굴·몸을 가리지 않게
f = [x * np.dstack([np.ones((CELL, CELL, 3)), hero_hole[..., None]]).astype(np.float32) for x in f]
emit('slayer-r-aura-back', loop_fix(b), dict(loop=True, pivot=[128, 224], fps=12.5), 'slayer-r-aura-back-v1 루프 이음매')
emit('slayer-r-aura-front', loop_fix(f), dict(loop=True, pivot=[128, 224], fps=12.5), 'slayer-r-aura-front-v1 루프 이음매·몸 가림 줄임')

# ---------------- SL04 Q 시전 고리 뒤·앞: 앞 고리 끝점·높이를 뒤 고리에 맞춤 + 루프
b = cells(load('slayer-q-spin-back-v2.png')); f = cells(load('slayer-q-spin-front-v2.png'))


def arc_box(frames, ymax):
    xs0, xs1, ys = [], [], []
    for x in frames:
        m = x[:ymax, :, 3] > 0.25
        if m.any():
            yy, xx = np.where(m); xs0.append(xx.min()); xs1.append(xx.max()); ys.append(yy.mean())
    return np.median(xs0), np.median(xs1), np.median(ys)


# 뒤 고리(위쪽 반 타원, 웅덩이 제외 y<190) · 앞 고리(아래쪽 반 타원) 가로 끝점 비교
bx0, bx1, _ = arc_box(b, 190); fx0, fx1, _ = arc_box(f, 256)
sx = (bx1 - bx0) / max(1, (fx1 - fx0)); cxb = (bx0 + bx1) / 2; cxf = (fx0 + fx1) / 2
report.append(f'Q spin endpoints back=({bx0:.0f},{bx1:.0f}) front=({fx0:.0f},{fx1:.0f}) sx={sx:.3f} dx={cxb - cxf:.1f}')


def fit_front(x):
    im = Image.fromarray((premul(x) * 255).round().astype(np.uint8), 'RGBA')
    w = round(CELL * sx); im2 = im.resize((w, CELL), Image.LANCZOS)
    out = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); out.paste(im2, (round(cxb - cxf * sx), 0))
    return unpremul(np.asarray(out).astype(np.float32) / 255.0)


f = [fit_front(x) for x in f]
emit('slayer-q-spin-back', loop_fix(b), dict(loop=True, pivot=[128, 224], fps=40), 'slayer-q-spin-back-v2 루프')
emit('slayer-q-spin-front', loop_fix(f), dict(loop=True, pivot=[128, 224], fps=40), 'slayer-q-spin-front-v2 끝점 맞춤·루프')

# ---------------- SL05 Q 토네이도 뒤·앞: 겹침 대신 보완(앞이 진한 곳은 뒤를 빼기) + 루프
b = cells(load('slayer-q-tornado-back-v1.png')); f = cells(load('slayer-q-tornado-front-v1.png'))
ov0 = np.mean([np.minimum(x[..., 3], y[..., 3]).sum() / max(1, y[..., 3].sum()) for x, y in zip(b, f)])
b2 = []
for x, y in zip(b, f):
    x = x.copy(); x[..., 3] *= (1 - 0.85 * np.clip(y[..., 3] * 1.4, 0, 1)); b2.append(x)
ov1 = np.mean([np.minimum(x[..., 3], y[..., 3]).sum() / max(1, y[..., 3].sum()) for x, y in zip(b2, f)])
report.append(f'Q tornado overlap(front 기준) {ov0:.2f} -> {ov1:.2f}')
emit('slayer-q-tornado-back', loop_fix(b2), dict(loop=True, pivot=[128, 232], fps=24), 'slayer-q-tornado-back-v1 보완층·루프')
emit('slayer-q-tornado-front', loop_fix(f), dict(loop=True, pivot=[128, 232], fps=24), 'slayer-q-tornado-front-v1 루프')

# ---------------- SL06 Q 출혈 방울: 대비 올리고 위쪽 절반 밖은 서서히 지움
c = cells(load('slayer-bleed-drip-v1.png'))
yy = np.arange(CELL, dtype=np.float32)[:, None]
upper = np.clip((yy - 96) / 48, 0, 1)
bl = []
for x in c:
    x = x.copy(); x[..., 3] = np.clip(x[..., 3] ** 0.6 * 1.25, 0, 1) * upper
    x[..., :3] = np.clip((x[..., :3] - 0.5) * 1.25 + 0.5, 0, 1); x[..., 1:3] *= 0.8; bl.append(x)
emit('slayer-bleed', bl, dict(loop=False, pivot=[128, 224], fps=16), 'slayer-bleed-drip-v1 대비·아래 절반')

# ---------------- SL07 W 피의 희생: 세워진 십자가 → 바닥에 눕힌 정십자(세로 0.5배, 긴 팔이 화면 아래)
c = cells(load('slayer-w-sacrifice-v1.png'))
ref = c[6][..., 3] > 0.2
ys, xs = np.where(ref); X0, X1, Y0, Y1 = xs.min() - 6, xs.max() + 6, ys.min() - 6, ys.max() + 6
# 십자가 교차점(가로 팔 높이) 찾기: 가로로 가장 넓은 줄
rowsw = (c[6][..., 3] > 0.2).sum(axis=1); cyc = int(np.argmax(rowsw))
report.append(f'W cross bbox x{X0}-{X1} y{Y0}-{Y1} crossbar y={cyc}')
box = np.zeros((CELL, CELL), np.float32); box[Y0:Y1, X0:X1] = 1
w2 = []
for x in c:
    crossl = x.copy(); crossl[..., 3] *= box
    rest = x.copy(); rest[..., 3] *= (1 - box)
    lay = scale_about(crossl, 1.45, 128, 192, sy=0.55)  # 바닥에 누운 모양: 가로 넓게·세로 눌러 2:1 바닥 문양(긴 팔은 그대로 화면 아래)
    lay[..., 3] *= 0.85
    # 교차점이 발밑(피벗)으로 오게 위치 보정
    shift = round(-(cyc - 192) * 0.55)
    lay = np.roll(lay, shift, axis=0)
    w2.append(unpremul(premul(rest) + premul(lay) * (1 - premul(rest)[..., 3:4])))
emit('slayer-w-sacrifice', w2, dict(loop=False, hit=8, pivot=[128, 192], fps=14), 'slayer-w-sacrifice-v1 바닥 투영·경계')

# ---------------- SL08 E 피의 대시: 흰 바탕 제거(알파 0 픽셀 0개 → 투명), 끝 웅덩이 페이드
c = cells(load('slayer-e-blood-dash-v1.png'))
e2 = []
for i, x in enumerate(c):
    o = unwhite(x)
    if i >= 17:
        o[..., 3] *= max(0.0, 1 - (i - 16) / 7.5)
    e2.append(o)
report.append('E alpha0 px per frame ' + ','.join(str(int((f[..., 3] == 0).sum())) for f in e2[:3]))
emit('slayer-e-dash', e2, dict(loop=False, hit=12, pivot=[128, 208], fps=16, trail=[0.05, 0.95]), 'slayer-e-blood-dash-v1 흰 바탕 제거·웅덩이 페이드')

# ---------------- SL09 D 공명방어 막: 가운데(영웅 자리) 더 투명 + 루프 이음매
c = cells(load('slayer-d-guard-v1.png'))
hole = ellipse_mask(128, 140, 46, 84, 0.25)
d2 = [x * np.dstack([np.ones((CELL, CELL, 3)), hole[..., None]]).astype(np.float32) for x in c]
emit('slayer-d-guard', loop_fix(d2) if seam_ratio(d2) > 1.3 else d2, dict(loop=True, pivot=[128, 224], fps=12.5), 'slayer-d-guard-v1 가운데 투명')

# ---------------- SL10 F EGO 진입(가운데 가림 줄이고 위 잘림 깃털) · 지속 루프(이음매)
c = cells(load('slayer-f-ego-enter-v1.png'))
hole = ellipse_mask(128, 150, 34, 80, 0.4)
emit('slayer-ego-enter', [x * np.dstack([np.ones((CELL, CELL, 3)), hole[..., None]]).astype(np.float32) for x in c], dict(loop=False, hit=8, pivot=[128, 224], fps=14), 'slayer-f-ego-enter-v1 가림·위 잘림')
c = cells(load('slayer-f-ego-loop-v1.png'))
hole = ellipse_mask(128, 150, 32, 78, 0.3)
c = [x * np.dstack([np.ones((CELL, CELL, 3)), hole[..., None]]).astype(np.float32) for x in c]
emit('slayer-ego-loop', c, dict(loop=True, pingpong=True, pivot=[128, 224], fps=10), 'slayer-f-ego-loop-v1 왕복 재생(이음매 없음)·가운데 가림 줄임')

json.dump(dict(schema='storyworld.r532.slayer-sheets.v1', request='CX-0055', author='Dots 초안 + Claude 보정', sourceCell=CELL, sheets=index), open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=1)
print('\n'.join(report))
print('total bytes', sum(v['bytes'] for v in index.values()))
