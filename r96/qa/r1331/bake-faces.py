#!/usr/bin/env python3
"""R1331 인간형 3D 몹 얼굴 데칼 굽기 — 그 몹의 2D 게임 그림에서 눈·눈썹·코끝 그늘·입만 따서
정면 얼굴 틀(눈 .30/.70·.36, 입 .50·.80)로 옮긴 256×256 RGBA 를 만든다.
  python3 r96/qa/r1331/bake-faces.py <2D 그림 폴더> <출력 폴더>
2D 원본 일부(Cloudflare storyworld-m0-assets, generated-v31224/actors-normalized)는 저장소에 없어 폴더로 받는다.
v2(사용자 11-26 '이목구비 조금 더 개선'): 원본을 8배 Lanczos 로 키운 뒤 언샤프로 또렷하게, 이목구비 알파를 진하게(감마 .75·이득 1.25, 창 가장자리 부드럽게),
눈·눈썹 색을 먹빛 쪽으로 당겨 작은 화면에서 읽히게. 옆얼굴 원본(약방 아낙 흉상)은 가까운 눈을 좌우 뒤집어 두 눈으로 쓴다."""
import sys, os, hashlib
from PIL import Image, ImageFilter
import numpy as np  # 굽기 도구 전용(CI 검사에서는 쓰지 않음)

N = 256; UP = 8
CANON = {'eyeL': (.30 * N, .36 * N), 'eyeR': (.70 * N, .36 * N), 'mouth': (.50 * N, .80 * N)}
# box: 원본에서 얼굴 둘레 크롭, marks: 크롭 좌표 왼눈·오른눈·입 중심, skin: 피부 기준 칸(크롭 좌표 x0,y0,x1,y1)
# eye/mouth: 이목구비 창 반지름(크롭 px), mouthA·noseA: 입·코 그늘 세기(호텔 회장 2D 입 둘레는 수염 그늘이라 약하게). mirror: 'L' 이면 왼눈을 뒤집어 오른눈으로(옆얼굴 원본).
FACES = {
  'seoyun': dict(src='6861c5126992_ep1b05_lust_seoyun_puppet_phase0.webp', box=(326, 98, 356, 130),
                 marks=[(11.5, 10.0), (18.6, 9.8), (14.2, 20.6)], skin=(8, 12, 12, 16), eye=(3.0, 2.7), mouth=(3.4, 1.7)),
  'sirenMor': dict(src='b19d67bb1973_siren_idle.webp', box=(311, 108, 341, 140),
                   marks=[(5.6, 9.0), (14.6, 8.6), (12.6, 19.6)], skin=(8, 11, 13, 15), eye=(3.0, 2.7), mouth=(3.4, 1.7)),
  'hotelChairman': dict(src='2456ba9c46b6_ep1b08_pride_chairman_phase0.webp', box=(318, 96, 348, 128),
                        marks=[(11.5, 13.2), (20.0, 13.2), (16.0, 22.2)], skin=(13, 16, 19, 19), eye=(3.2, 2.6), mouth=(3.0, 1.1), mouthA=.45, noseA=0),
  'herbwife': dict(src='herbwife-bust.webp', box=(280, 90, 380, 190),
                   marks=[(35.0, 33.0), (65.0, 33.0), (55.0, 70.0)], skin=(20, 50, 34, 62), eye=(11.0, 10.0), mouth=(13.0, 7.0), mirror='L'),
}
ALIAS = {'cyborgChairman': 'hotelChairman'}  # 같은 인물(호텔 회장 → 사이보그 회장), 같은 데칼

def affine(src, dst):
    A = np.hstack([np.array(src, float), np.ones((3, 1))])
    return np.linalg.solve(A, np.array(dst, float))

def sample(img, sx, sy):
    h, w = img.shape[:2]
    xa = np.clip(np.floor(sx).astype(int), 0, w - 2); ya = np.clip(np.floor(sy).astype(int), 0, h - 2)
    fx = np.clip(sx - xa, 0, 1)[..., None]; fy = np.clip(sy - ya, 0, 1)[..., None]
    return img[ya, xa] * (1 - fx) * (1 - fy) + img[ya, xa + 1] * fx * (1 - fy) + img[ya + 1, xa] * (1 - fx) * fy + img[ya + 1, xa + 1] * fx * fy

def bake(cfg, src_dir):
    im = Image.open(os.path.join(src_dir, cfg['src'])).convert('RGBA').crop(cfg['box'])
    big = im.resize((im.width * UP, im.height * UP), Image.LANCZOS)
    rgbI = Image.fromarray(np.asarray(big)[..., :3]).filter(ImageFilter.UnsharpMask(radius=UP * .9, percent=160, threshold=1))
    arr = np.dstack([np.asarray(rgbI), np.asarray(big)[..., 3]]).astype(np.float64) / 255.0
    x0, y0, x1, y1 = cfg['skin']
    skin = np.asarray(im, dtype=np.float64)[y0:y1, x0:x1, :3].reshape(-1, 3).mean(0) / 255.0
    marks = [tuple(m) for m in cfg['marks']]
    uu, vv = np.meshgrid(np.arange(N) + .5, np.arange(N) + .5)
    mirror = cfg.get('mirror')
    if mirror == 'L':
        # 오른쪽 절반(u>.5)은 왼눈 자리를 거울로 본다: u → 1-u, 원본 눈 = 왼눈
        uu_src = np.where(uu > N / 2, N - uu, uu)
        use_eye = np.where(uu > N / 2, 1, 0)
    else:
        uu_src = uu
    M = affine([CANON['eyeL'], CANON['eyeR'], CANON['mouth']], marks)
    P = np.stack([uu_src, vv, np.ones_like(uu)], -1) @ M
    sx, sy = P[..., 0], P[..., 1]
    c = sample(arr, sx * UP - .5, sy * UP - .5)
    rgb = c[..., :3]
    lum = rgb @ np.array([.2126, .7152, .0722]); slum = skin @ np.array([.2126, .7152, .0722])
    dark = np.clip((slum - lum - .04) / .26, 0, 1)
    red = np.clip(((rgb[..., 0] - rgb[..., 1]) - (skin[0] - skin[1]) - .04) / .16, 0, 1)
    f = np.maximum(dark, red * .95)
    (lx, ly), (rx_, ry_), (mx, my) = marks
    if mirror == 'L':
        rx_, ry_ = lx, ly  # 거울 쪽도 왼눈 창
    ew, mw = cfg['eye'], cfg['mouth']
    def win(cx, cy, ax, ay):
        e = ((sx - cx) / ax) ** 2 + ((sy - cy) / ay) ** 2
        return np.clip((1.0 - e) / .6, 0, 1) ** 1.5
    nx, ny = (lx + marks[1][0]) / 2 * .4 + mx * .6, (ly + my) / 2 + (my - ly) * .2
    eyes = np.maximum(win(lx, ly - ew[1] * .3, *ew), win(rx_, ry_ - ew[1] * .3, *ew))
    mask = np.maximum.reduce([eyes, win(mx, my, *mw) * cfg.get('mouthA', 1), win(nx, ny, ew[0] * .55, ew[1] * .5) * cfg.get('noseA', .5)])
    a = np.clip(np.clip(f, 0, 1) ** .75 * 1.25, 0, 1) * mask * c[..., 3]
    # 눈·눈썹은 먹빛 쪽으로(작은 화면에서 또렷하게), 입술은 원래 색을 진하게
    ink = np.array([.10, .06, .06])
    eyek = (eyes * (1 - red * .8))[..., None] * .55
    out = rgb * (1 - eyek) + ink * eyek
    out = np.clip((out - .5) * 1.2 + .5 - .05, 0, 1)
    img = Image.fromarray((np.dstack([out, a]) * 255 + .5).astype(np.uint8), 'RGBA')
    return img

def main():
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    for kind, cfg in FACES.items():
        img = bake(cfg, src_dir)
        p = os.path.join(out_dir, f'face-{kind}.png'); img.save(p, optimize=True)
        print(kind, p, os.path.getsize(p), 'src sha256', hashlib.sha256(open(os.path.join(src_dir, cfg['src']), 'rb').read()).hexdigest()[:16])

if __name__ == '__main__':
    main()
