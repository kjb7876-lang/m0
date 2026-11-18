# R1153 — Dots CX-0146ST·0148SG·0149SE·0150MX 결과를 게임용 webp 로 손질한다.
# 입력: /mnt/project-files/dots-results/cx0141-0150/raw/ (원본은 그대로 둔다)  출력: argv[1] (r96/runtime-text/assets/r1153)
import sys, json, hashlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

RAW = Path('/mnt/project-files/dots-results/cx0141-0150/raw')
OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
rows = []

def load(p):
    return np.array(Image.open(RAW / p).convert('RGBA')).astype(np.float32)

def save(arr, name, src, note):
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    a = arr[..., 3]; arr[a <= 16] = 0  # 낮은 알파 정리
    im = Image.fromarray(arr, 'RGBA')
    p = OUT / name
    im.save(p, 'WEBP', quality=88, method=6, exact=True)
    b = p.read_bytes()
    rows.append({'file': name, 'source': src, 'sourceSha256': hashlib.sha256((RAW / src).read_bytes()).hexdigest(),
                 'size': list(im.size), 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'fix': note})

def halo(arr, rgb, strength, radius):
    """그림 둘레에 옅은 빛 테를 깐다(어두운 바닥에서 검은 부분이 안 묻히게). 그림 뒤에 합성."""
    a = Image.fromarray(arr[..., 3].astype(np.uint8))
    g = np.array(a.filter(ImageFilter.MaxFilter(radius * 2 + 1)).filter(ImageFilter.GaussianBlur(radius * .8))).astype(np.float32) / 255
    ha = g * strength
    fa = arr[..., 3] / 255
    oa = fa + ha * (1 - fa)
    out = np.zeros_like(arr)
    for i in range(3):
        out[..., i] = np.where(oa > 0, (arr[..., i] * fa + rgb[i] * ha * (1 - fa)) / np.maximum(oa, 1e-6), 0)
    out[..., 3] = oa * 255
    return out

# ---- 1. 상태이상 아이콘 9종(1152×128): 타락 눈물이 어두운 바닥 32px 에서 사라짐(HOLD) → 9개 모두 같은 상아빛 테 2px
ic = load('0146ST/icons/CX-0146ST_icons_r1.png')
save(halo(ic, (236, 226, 204), .78, 2), 'status-icons.webp', '0146ST/icons/CX-0146ST_icons_r1.png',
     '9개 공통 상아빛 테(2px, 알파 .78) — 타락 검은 눈물·속박 먹 촉수가 어두운 바닥에서도 읽히게(HOLD 해소)')

# ---- 2. 몸 위 오버레이 9×6(1536×2304, 칸 256): 속박(5행)·타락(8행)은 어두운 바닥에서 안 보임(HOLD) → 줄별 밑빛 + 밝기
ov = load('0146ST/overlay/CX-0146ST_B_overlays_all9_6f.png')
fix = {4: ((168, 120, 228), .55, 3, 1.35), 7: ((214, 74, 96), .5, 3, 1.25)}  # 행 번호(0부터): 밑빛 색, 세기, 반지름, 밝기 배율
for r, (rgb, s, rad, lift) in fix.items():
    band = ov[r * 256:(r + 1) * 256].copy()
    band[..., :3] = np.clip(band[..., :3] * lift + 18, 0, 255) * (band[..., 3:4] > 0)
    for c in range(6):
        cell = band[:, c * 256:(c + 1) * 256]
        band[:, c * 256:(c + 1) * 256] = halo(cell, rgb, s, rad)
    ov[r * 256:(r + 1) * 256] = band
save(ov, 'status-overlay.webp', '0146ST/overlay/CX-0146ST_B_overlays_all9_6f.png',
     '속박·타락 줄에 보라·검붉은 밑빛(3px)과 밝기 +25~35% — 나머지 7줄은 원본 그대로')

# ---- 3. 사몽 문양 4영웅(6×4, 칸 192 → 192×224): 바닥 타원이 3.4~3.6:1 로 납작(HOLD) → 고리 띠만 세로로 늘려 약 2.5:1
#      위쪽(몸 뒤로 오르는 무늬)은 모양 그대로 위로 옮기고, 헌터 불깃 윗변 잘림은 위 6줄을 부드럽게 지운다.
SIG = {  # 이름: (원본, 고리 중심 y, 고리 윗변 y, 늘림 배율)
    'lauren': ('0148SG_A-B/A-lauren/CX-0148SG_A-lauren_REVIEW.png', 150, 122, 1.42),
    'hunter': ('0148SG_A-B/B-hunter/CX-0148SG_B-hunter_r1.png', 146.5, 119, 1.36),
    'slayer': ('0148SG_C-D/C-slayer/CX-0148SG_C-slayer_r1_REVIEW.png', 150, 124, 1.38),
    'gunner': ('0148SG_C-D/D-gunner/CX-0148SG_D-gunner_r1.png', 132, 110, 1.0),
}
CH, PAD = 224, 22
sig_meta = {}
for name, (src, yc, y0, k) in SIG.items():
    sh = load(src)
    out = np.zeros((4 * CH, 6 * 192, 4), np.float32)
    s = (yc - y0) * (k - 1)
    def fwd(y): return y + PAD - s if y < y0 else PAD - s + y0 + (y - y0) * k
    # 출력 줄 → 원본 줄(역함수, 선형 보간)
    yo = np.arange(CH, dtype=np.float32)
    ysrc = np.where(yo < fwd(y0), yo - PAD + s, y0 + (yo - (PAD - s + y0)) / k)
    for fr in range(24):
        cell = sh[(fr // 6) * 192:(fr // 6) * 192 + 192, (fr % 6) * 192:(fr % 6) * 192 + 192].copy()
        if name == 'hunter':
            for y in range(6): cell[y, :, 3] *= y / 6.0  # 원본 칸 윗변 잘림을 부드럽게
        pm = cell.copy(); pm[..., :3] *= pm[..., 3:4] / 255  # 미리 곱한 알파로 보간
        y0i = np.floor(ysrc).astype(int); w = (ysrc - y0i)[:, None, None]
        valid = (ysrc >= 0) & (ysrc <= 191)
        a_ = pm[np.clip(y0i, 0, 191)]; b_ = pm[np.clip(y0i + 1, 0, 191)]
        res = (a_ * (1 - w) + b_ * w) * valid[:, None, None]
        rgb = np.where(res[..., 3:4] > 0, res[..., :3] * 255 / np.maximum(res[..., 3:4], 1e-6), 0)
        res[..., :3] = rgb
        out[(fr // 6) * CH:(fr // 6) * CH + CH, (fr % 6) * 192:(fr % 6) * 192 + 192] = res
    piv = round(fwd(144), 1)
    sig_meta[name] = {'cell': [192, CH], 'pivot': [96, piv], 'stretch': k}
    save(out, f'sigil-{name}.webp', src, f'고리 띠 세로 {k}배(위 무늬는 모양 그대로 옮김), 칸 192×{CH}, 발 피벗 (96,{piv})' + (', 윗변 6줄 부드럽게 지움' if name == 'hunter' else ''))

# ---- 4. 서하 톱니바퀴·초침(6칸 256) — 그대로(낮은 알파만), 역회전 맞물림은 미검증으로 남김
ck = load('0149SE/B-clockwork/CX-0149SE_B-clockwork6_r1.png')
save(ck, 'seoha-clockwork.webp', '0149SE/B-clockwork/CX-0149SE_B-clockwork6_r1.png', '손질 없음(낮은 알파 정리만)')

# ---- 5. 슬레이어 낙인 방울(6칸) — 4개 단계가 없음(HOLD) → 1·2·3·4·5·5(빛) 6칸으로 다시 엮음. 4개 = 5개 장에서 맨 왼쪽 방울을 지운 것
mk = load('0150MX/B-mark/CX-0150MX_B-mark_r1_REVIEW_HOLD.png')
cells = [mk[:, i * 256:(i + 1) * 256].copy() for i in range(6)]
f5 = cells[4].copy(); colsum = f5[..., 3].sum(0)
cut = 95 + int(np.argmin(colsum[95:113]))
four = f5.copy(); four[:, :cut + 1] = 0
seq = [cells[0], cells[1], cells[2], four, cells[4], cells[5]]
save(np.concatenate(seq, 1), 'slayer-brand.webp', '0150MX/B-mark/CX-0150MX_B-mark_r1_REVIEW_HOLD.png',
     f'칸 = 낙인 1·2·3·4·5·5(맥박). 4개 칸은 5개 칸에서 x<={cut} 방울 하나를 지움(새로 그린 화소 없음)')

# ---- 6. 기억사수 R 조준 고리(8칸) — 반투명 사각 막(HOLD) → 알파 60 이하 막을 걷어 냄(고리·눈금은 남김)
rt = load('0150MX/C-reticle/CX-0150MX_C-reticle_r1_DIAGNOSTIC.png')
a = rt[..., 3]; rt[..., 3] = np.clip((a - 60) / (255 - 60), 0, 1) * 255
save(rt, 'gunner-reticle.webp', '0150MX/C-reticle/CX-0150MX_C-reticle_r1_DIAGNOSTIC.png',
     '알파 재매핑 (a-60)/195 — 사각 막 제거. 1→8칸 좁혀짐은 R 폭격 대기(1.6초) 한 번에 맞춰 한 번만 재생(루프 이음매 문제 없음)')

# ---- 7. 기억사수 연쇄 레이저 몸통(8칸 256×128 가로 타일) — 좌우 끝 RGBA 불일치(HOLD) → 양끝 24px 를 두 끝 평균 단면으로 섞음
ch = load('0150MX/D-chain/CX-0150MX_D-chain_r1_HOLD.png')
pm = ch.copy(); pm[..., :3] *= pm[..., 3:4] / 255
for i in range(8):
    c = pm[:, i * 256:(i + 1) * 256]
    mid = (c[:, 0] + c[:, 255]) / 2
    for x in range(24):
        w = 1 - x / 24
        c[:, x] = c[:, x] * (1 - w) + mid * w
        c[:, 255 - x] = c[:, 255 - x] * (1 - w) + mid * w
ch = pm.copy(); ch[..., :3] = np.where(pm[..., 3:4] > 0, pm[..., :3] * 255 / np.maximum(pm[..., 3:4], 1e-6), 0)
save(ch, 'gunner-chain.webp', '0150MX/D-chain/CX-0150MX_D-chain_r1_HOLD.png', '각 칸 양끝 24px 를 좌우 끝 평균 단면으로 섞어 이음매 맞춤')

# ---- 8. 배치 발밑 고리(8칸, 흰·회색) — 그대로. 영웅 색은 게임이 구워 얹음
dp = load('0150MX/F-deploy/CX-0150MX_F-deploy8_r1.png')
save(dp, 'deploy-ring.webp', '0150MX/F-deploy/CX-0150MX_F-deploy8_r1.png', '손질 없음 — 영웅색 고리(R720 코드) 위에 lighter 로 얹음(캔버스 굽기는 Three 기록기가 못 받아 뺌)')

(OUT / 'index.json').write_text(json.dumps({'round': 'R1153', 'sigils': sig_meta, 'files': rows}, ensure_ascii=False, indent=1) + '\n')
for r in rows: print(r['file'], r['size'], r['bytes'])
