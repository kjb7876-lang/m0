#!/usr/bin/env python3
"""R1188: Dots CX-0164CR r1 ROUGH — 칸 밖으로 잘리던 사몽 잔영(R200) 다시 그린 시트 손질(먼저 3종: 유령 승객·두족류 침공병·식탁 마네킹).
사용자 11-19 03:37Z "너무 심각한것들은 다시 재창조해서 개선 적용해 닷츠랑 협업해서".
새 시트: 칸 256×256 11칸(이동 0~4, 공격 5~10), 발 (128,236). 손질: 알파 16 이하 0, 칸마다 발(몸 아래 끝)을 y=236 에 맞춤(세로 이동만).
보이는 키(visibleHeight)는 화면 크기가 예전과 같도록 예전 vh × 새 몸 키 / 예전 몸 키(이동 칸 중앙값). 원본(r200)은 두고 파생본만 assets/r1188/shades/.
usage: python3 scripts/r1188-uncut-shades.py <raw 폴더(cr01_tram-passenger.png …)>"""
import sys, json, hashlib, statistics as st
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]; RT = ROOT / 'r96/runtime-text'; OUT = RT / 'assets/r1188/shades'
JOBS = [('CR01', 'tram-passenger', 'cr01_tram-passenger.png'), ('CR03', 'cephalopod-invader', 'cr03_cephalopod-invader.png'), ('CR04', 'mannequin', 'cr04_mannequin.png')]
W = H = 256; FOOT = 236
def bb(c): return c.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
def sha(b): return hashlib.sha256(b).hexdigest()
def main(raw):
    raw = Path(raw); OUT.mkdir(parents=True, exist_ok=True)
    idx = {m['id']: m for m in json.loads((RT / 'assets/r200/shades/index.json').read_text(encoding='utf8'))['mobs']}
    rec = []; table = {}
    for cr, sid, fn in JOBS:
        f = raw / fn; a = Image.open(f).convert('RGBA'); assert a.size == (W * 11, H), (cr, a.size)
        old = idx[sid]; ow, oh = old['cell']; o = Image.open(RT / old['path']).convert('RGBA')
        out = Image.new('RGBA', a.size); hs = []; xs = []; edge = 99
        for k in range(11):
            c = a.crop((k * W, 0, k * W + W, H)); c.putalpha(c.getchannel('A').point(lambda v: 0 if v <= 16 else v)); b = bb(c)
            dy = FOOT - b[3] if b else 0; out.paste(c, (k * W, dy))
            if b:
                edge = min(edge, b[0], W - b[2], b[1] + dy)
                if k in old['move']: hs.append(b[3] - b[1]); xs.append((b[0] + b[2]) / 2)
        ohs = [(lambda b: b[3] - b[1])(bb(o.crop((k * ow, 0, k * ow + ow, oh)))) for k in old['move']]
        vh = round(old['visibleHeight'] * st.median(hs) / st.median(ohs), 1)
        name = f'{sid}.webp'; p = OUT / name; out.save(p, lossless=True, method=6); by = p.read_bytes()
        table[sid] = {'path': 'assets/r1188/shades/' + name, 'cell': [W, H], 'pivot': [round(st.median(xs), 1), FOOT], 'visibleHeight': vh}
        rec.append({'cr': cr, 'id': sid, 'file': 'assets/r1188/shades/' + name, 'replaces': old['path'], 'source': f'Dots CX-0164CR {cr} walk-attack r1 ROUGH', 'sourceSha256': sha(f.read_bytes()),
                    'sha256': sha(by), 'bytes': len(by), 'minEdgeMargin': edge, **table[sid], 'finalArt': False})
    (OUT / 'index.json').write_text(json.dumps({'schema': 'storyworld.r1188.dots/v1', 'request': 'CX-0164CR r1 ROUGH (CR01·03·04)', 'assets': rec}, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
    print(json.dumps(table, ensure_ascii=False)); print([(r['id'], r['minEdgeMargin']) for r in rec])
if __name__ == '__main__': main(sys.argv[1])
