#!/usr/bin/env python3
"""R930 카이로노미콘 조형물 — Dots CX-0081KC 결과(512x512 RGBA PNG, 발끝 y=486)를 게임 조형물 규격으로 맞춘다.
게임 조형물 그림(assets/props/v290)은 512x512 에 그림 발끝이 맨 아래 줄(y=512)에 닿고 가로 가운데다. 엔진은 그림 전체 높이를 조형물 높이로 쓴다.
 → 알파 경계로 잘라, 정한 높이(px)로 줄이고, 512x512 바닥 가운데에 붙여 webp 로 저장한다. 그림 내용은 손대지 않는다(색·모양 그대로).
쓰기: python3 scripts/r930-kairo-dots-props.py <Dots PNG 폴더>   (원본은 드라이브 결과 폴더에 그대로 있다)
"""
import sys, os, json, hashlib
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'r96', 'runtime-text', 'assets', 'r930', 'props')
# 게임 이름: (Dots 파일 줄기, 방향, 512 안에서 그림 높이 px, 가로 한계 px)
PIECES = {
    'kc-terminal-pillar-a': ('2A_terminal-pillar', 'a', 470, 480), 'kc-terminal-pillar-b': ('2A_terminal-pillar', 'b', 470, 480),
    'kc-command-console-a': ('2B_command-console', 'a', 400, 480), 'kc-command-console-b': ('2B_command-console', 'b', 400, 480),
    'kc-clock-generator-a': ('2C_clock-generator', 'a', 330, 496), 'kc-clock-generator-b': ('2C_clock-generator', 'b', 330, 496),
    'kc-neon-streetlamp-a': ('2D_neon-streetlamp', 'a', 508, 480),
    'kc-cable-duct-a': ('2E_cable-duct', 'a', 330, 440), 'kc-cable-duct-b': ('2E_cable-duct', 'b', 330, 440),
    'kc-brass-manifold-a': ('2F_brass-manifold', 'a', 400, 440), 'kc-brass-manifold-b': ('2F_brass-manifold', 'b', 400, 440),
    'kc-data-gravestone-a': ('2G_data-gravestone', 'a', 430, 480), 'kc-data-gravestone-b': ('2G_data-gravestone', 'b', 430, 480),
    'kc-black-sand-wreck-a': ('2H_black-sand-wreck', 'a', 330, 440), 'kc-black-sand-wreck-b': ('2H_black-sand-wreck', 'b', 330, 440),
    'kc-synapse-arch-a': ('2I_synapse-arch', 'a', 470, 480), 'kc-synapse-arch-b': ('2I_synapse-arch', 'b', 470, 480),
    'kc-drainage-pump-a': ('2J_drainage-pump', 'a', 400, 440), 'kc-drainage-pump-b': ('2J_drainage-pump', 'b', 400, 440),
    'kc-mold-ladle-a': ('2L_mold-ladle', 'a', 330, 440), 'kc-mold-ladle-b': ('2L_mold-ladle', 'b', 330, 440),
}
def main():
    src = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    index = {'dots': 'CX-0081KC', 'round': 'r1', 'temporary': False, 'canvas': [512, 512], 'foot': 'bottom-center', 'pieces': {}}
    for name, (stem, d, h, wmax) in PIECES.items():
        f = os.path.join(src, f'CX-0081KC_{stem}_{d}_r1.png')
        raw = open(f, 'rb').read()
        im = Image.open(f).convert('RGBA')
        assert im.size == (512, 512), (f, im.size)
        bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        cut = im.crop(bb)
        s = min(h / cut.height, wmax / cut.width)
        w2, h2 = max(1, round(cut.width * s)), max(1, round(cut.height * s))
        cut = cut.resize((w2, h2), Image.LANCZOS)
        page = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
        page.alpha_composite(cut, ((512 - w2) // 2, 512 - h2))
        out = os.path.join(OUT, name + '.webp')
        page.save(out, 'WEBP', quality=90, method=6, exact=True)
        index['pieces'][name] = {'source': os.path.basename(f), 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'sourceBytes': len(raw), 'sourceBox': list(bb),
                                 'drawn': [w2, h2], 'bytes': os.path.getsize(out), 'sha256': hashlib.sha256(open(out, 'rb').read()).hexdigest()}
        print(name, bb, (w2, h2), os.path.getsize(out))
    index['notApplied'] = {'2Dprime_indoor-wall-lamp': '벽에 다는 등 — 조형물은 바닥에 서는 자리뿐이라 벽 부착 자리가 생길 때까지 보류',
                           '2K_command-dais': '밟고 올라서는 단 — 지나갈 수 있는 장식 자리에 두면 발이 단을 뚫고 지나가 보류(충돌을 바꾸지 않는다)'}
    json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=1, sort_keys=True)
if __name__ == '__main__':
    main()
