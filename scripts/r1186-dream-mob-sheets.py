#!/usr/bin/env python3
"""R1186: Dots CX-0161DR r1 ROUGH(꿈 층 R248 임시 도트 몹 → 칠한 걷기·공격 시트) DR-05 m032·DR-07 m049.
사용자 11-18 22:06Z "부족한거 닷츠랑계속협업"(전수조사 2026-11-19 요청안). R248 칸 그대로(256×320, 4×3, 걷기 0-7·공격 8-11, 발 128,300, 오른쪽 보기).
손질: 알파 16 이하 0. body 는 0칸 보이는 키(R248 이 body 로 키를 맞추므로 예전 임시 시트와 화면 키가 같다). 원본은 두고 파생본만 assets/r1186/mobs/.
usage: python3 scripts/r1186-dream-mob-sheets.py <raw 폴더(<m>_walk-attack.png)>"""
import sys, json, hashlib
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'r96/runtime-text/assets/r1186/mobs'
MOBS = [('m032', 'DR-05', '인간의 뇌를 닮은 투명 연산 장치'), ('m049', 'DR-07', '시간핵의 명령 잔류')]
def sha(b): return hashlib.sha256(b).hexdigest()
def main(raw):
    raw = Path(raw); OUT.mkdir(parents=True, exist_ok=True); rec = []; art = {}
    for m, dr, name in MOBS:
        f = raw / f'{m}_walk-attack.png'; im = Image.open(f).convert('RGBA'); assert im.size == (1024, 960), im.size
        a = im.getchannel('A').point(lambda v: 0 if v <= 16 else v); im.putalpha(a)
        c0 = im.crop((0, 0, 256, 320)); b = c0.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox(); body = b[3] - b[1]
        p = OUT / f'{m}.webp'; im.save(p, lossless=True, method=6); by = p.read_bytes()
        art[m] = {'path': 'assets/r1186/mobs/' + p.name, 'body': body, 'name': name}
        rec.append({'file': 'assets/r1186/mobs/' + p.name, 'id': m, 'name': name, 'source': f'Dots CX-0161DR {dr} {m} walk-attack r1 ROUGH', 'sourceSha256': sha(f.read_bytes()), 'sha256': sha(by), 'bytes': len(by), 'body': body, 'use': 'R248 시트 표 path·body 덧씌우기(R1179 방식)', 'finalArt': False})
    (OUT / 'index.json').write_text(json.dumps({'schema': 'storyworld.r1186.dots/v1', 'request': 'CX-0161DR r1 ROUGH', 'assets': rec}, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
    print(json.dumps(art, ensure_ascii=False))
if __name__ == '__main__': main(sys.argv[1])
