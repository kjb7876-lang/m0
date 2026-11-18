#!/usr/bin/env python3
"""R1174: Dots CX-0153PC r1 (페르소나 컷인·사몽 각성) 원본 PNG -> 게임 사본 webp.
원본은 /mnt/project-files/dots-results/cx0153pc-r1/ 에 보존(읽기만). 사본만 손질:
 01 상반신·02 각성: 거의 불투명(알파 246~253)인 몸 화소를 255 로, 크기 3/4.
 03 구 8칸: 회색 연무(채도 낮은 반투명)를 검붉게 물들이고 알파 .55배, 8칸이 갑자기 비지 않게 7칸을 .35 알파로 이어 붙임(감쇠). 칸 192.
 04 일식 고리 12칸: 테두리의 순 빨강(#ff0000 계열) 잔티를 언주(#cc3428)로 눌러 줌. 칸 384.
사용: python3 scripts/r1174-persona-dots.py <원본 폴더> <출력 폴더>"""
import sys, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
def load(n): return np.array(Image.open(f"{src}/CX-0153PC_{n}_r1.png").convert('RGBA')).astype(np.float32)
def save(a, name, size=None, q=88):
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    if size: im = im.resize(size, Image.LANCZOS)
    im.save(f"{out}/{name}", 'WEBP', quality=q, method=6)
def solid(a):
    al = a[..., 3]; al[al >= 240] = 255; return a
save(solid(load('01_bust')), 'persona-bust.webp', (576, 768))
save(solid(load('02_awake')), 'persona-awake.webp', (768, 960))
# 03 구 8칸
o = load('03_orbs8'); rgb = o[..., :3]; al = o[..., 3]
mx, mn = rgb.max(-1), rgb.min(-1); sat = (mx - mn) / np.maximum(mx, 1)
haze = (sat < .28) & (al < 200) & (mx > 60)          # 밝은 회색 연무만(검은 구 몸통은 어두워서 제외)
t = np.array([90, 12, 18], np.float32)
rgb[haze] = rgb[haze] * .35 + t * .65; al[haze] *= .55
C = 256
f7 = o[:, 6*C:7*C].copy(); f7[..., 3] *= .35
o[:, 7*C:8*C] = np.where(o[:, 7*C:8*C, 3:4] > f7[..., 3:4], o[:, 7*C:8*C], f7)
save(o, 'persona-orbs8.webp', (8*192, 192))
# 04 일식 고리 12칸
# 줄인 뒤에 누른다(줄이기·손실 압축이 새 순 빨강을 만들므로 한 번 더, 무손실 저장)
s = np.array(Image.fromarray(load('04_sigil12').astype(np.uint8), 'RGBA').resize((6*384, 2*384), Image.LANCZOS)).astype(np.float32)
r, g, b = s[..., 0], s[..., 1], s[..., 2]
hot = (r > 200) & (g < 80) & (b < 80) & (r - g > 150)
s[hot, 0] = 204; s[hot, 1] = 52; s[hot, 2] = 40
Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA').save(f"{out}/persona-sigil12.webp", 'WEBP', lossless=True, method=6)
print('ok', int(haze.sum()), 'haze px,', int(hot.sum()), 'hot px')
