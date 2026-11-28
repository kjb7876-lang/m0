"""R1337 2D 보스 동작 일관성 수치(PIL 만). 칸 하나 = (RGBA 이미지).
- mass: 불투명(알파>40)을 칸 높이 2% 로 깎은(칼·뿌리 같은 가는 부분 뺌) 넓이의 제곱근 = 몸통 크기
- foot: 발 점 = 알파 아래끝 y, 깎은 몸통 아래 30% 의 무게중심 x (칸 크기 비율)
- color: 불투명 픽셀 RGB 평균·표준편차(목·몸 색)
"""
from PIL import Image, ImageStat, ImageFilter

def mask_of(im):
    return im.getchannel('A').point(lambda a: 255 if a > 40 else 0)

def measure(im):
    im = im.convert('RGBA'); m = mask_of(im)
    bb = m.getbbox()
    if not bb:
        return None
    k = max(3, int(im.height * .02) | 1)
    core = m.filter(ImageFilter.MinFilter(k))
    area = core.histogram()[255]
    x0, y0, x1, y1 = bb
    # 가로 발 자리: 칼끝·망토 자락에 덜 흔들리게, 깎은 몸통(core)의 아래 30% 무게중심 x
    cb = core.getbbox() or bb
    cy0 = int(cb[3] - (cb[3] - cb[1]) * .30)
    col = core.crop((0, cy0, im.width, cb[3])).resize((im.width, 1), Image.BOX)
    w = list(col.getdata()); tot = sum(w)
    fx = sum(i * v for i, v in enumerate(w)) / tot if tot else (x0 + x1) / 2
    rgb = im.convert('RGB')
    st = ImageStat.Stat(rgb, m)
    return {'mass': area ** .5, 'footY': y1 / im.height, 'footX': fx / im.width, 'mean': st.mean, 'std': st.stddev,
            'h': (y1 - y0) / im.height, 'w': im.width, 'H': im.height}

def cells(path, n=1):
    im = Image.open(path).convert('RGBA')
    if n <= 1:
        return [im]
    w = im.width // n
    return [im.crop((i * w, 0, (i + 1) * w, im.height)) for i in range(n)]

def compare(ref, f):
    """ref·f = measure() 결과. 칸 크기가 다르면 mass 는 칸 높이로 나눠 비교한다."""
    ms = (f['mass'] / f['H']) / (ref['mass'] / ref['H'])
    dmean = max(abs(a - b) for a, b in zip(f['mean'], ref['mean']))
    sr = [a / b if b else 1 for a, b in zip(f['std'], ref['std'])]
    return {'massRatio': ms, 'footDy': abs(f['footY'] - ref['footY']), 'footDx': abs(f['footX'] - ref['footX']),
            'meanDiff': dmean, 'stdRatioDev': max(abs(1 - r) for r in sr)}

LIMITS = {'massRatio': (0.94, 1.06), 'footDy': 0.012, 'footDx': 0.04, 'meanDiff': 6.0, 'stdRatioDev': 0.12}

def verdict(c):
    bad = []
    if not (LIMITS['massRatio'][0] <= c['massRatio'] <= LIMITS['massRatio'][1]): bad.append('mass')
    for k in ('footDy', 'footDx', 'meanDiff', 'stdRatioDev'):
        if c[k] > LIMITS[k]: bad.append(k)
    return bad
