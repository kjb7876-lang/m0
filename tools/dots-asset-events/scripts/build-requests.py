#!/usr/bin/env python3
"""R289 임시 자산(직접 그린 것) → dots 그림 요청 묶음(JSON).
출처: r96/runtime-text/assets/{r248/mobs,r184/s06,r251,r186}/index.json (저장소 출처표). 서사·이름은 그대로 쓰고 새로 짓지 않는다.
사용: python3 -I tools/dots-asset-events/scripts/build-requests.py <저장소 루트> > requests.json"""
import json, sys, os
root = sys.argv[1] if len(sys.argv) > 1 else '.'
A = os.path.join(root, 'r96', 'runtime-text', 'assets')
KIND = {'plant':'root-and-vine bound creature','winged':'winged creature','spider':'giant spider','human':'humanoid figure','wraith':'ghostly wraith','quad':'four-legged beast','mask':'floating mask entity','blade':'living blade shards','slime':'slime creature','coin':'living coin/disc object','candy':'cursed candy creature','mech':'clockwork machine','fog':'black fog entity','paper':'living paper figure','crystal':'crystal entity','puppet':'stitched puppet/mannequin','golem':'massive city golem'}
WEAPON = {'blade':'holding a sword','lantern':'carrying a lantern','claws':'with long claws','needle':'holding a syringe/needle','gun':'holding a gun','none':''}
STYLE = ('Dark gothic fantasy, hand-painted look (Diablo II / Dark Eden mood), muted colors with blood-red and black accents, soft painted shading, '
         'no outlines of cartoon style, no text, no watermark, no ground shadow, fully transparent background.')
AVOID = '글씨·워터마크·서명·바닥 그림자·배경·카툰체·밝은 원색·다른 게임 캐릭터 모방'
MOB_SPEC = ('PNG/WebP 투명 배경. 칸 256×320 px, 가로 4칸 × 세로 3줄 = 12칸: 1~8칸 걷기(한 바퀴), 9~12칸 공격. '
            '발 기준점 (128,300) — 모든 칸에서 발이 같은 높이. 오른쪽을 보는 옆모습(왼쪽은 게임이 반전). 몸 키 칸 높이의 65~80%.')
out = []
d = json.load(open(os.path.join(A, 'r248', 'mobs', 'index.json'), encoding='utf8'))
for k, v in d['mobs'].items():
    layer = '본편' if v['layer'] == 'STORY' else '사몽(꿈)'
    w = WEAPON.get(v.get('weapon', 'none'), '')
    out.append({'asset_id': 'r248-' + k, 'category': 'mob', 'name': v['name'], 'spec': MOB_SPEC,
      'brief': f"{v['name']} — {layer} 몹, 형태 {v['kind']}" + (f", 무기 {v['weapon']}" if w else ''),
      'prompt': f"Sprite sheet of an enemy called \"{v['name']}\" ({'story' if v['layer']=='STORY' else 'nightmare dream'} world), a {KIND.get(v['kind'], v['kind'])} {w}. "
                f"Side view facing right, 12 frames on a 4x3 grid of 256x320 cells: frames 1-8 a looping walk cycle, frames 9-12 an attack. "
                f"Feet on the same baseline (y=300) in every frame. {STYLE}",
      'avoid': AVOID, 'replaces': 'assets/r248/mobs/' + v['file']})
s6 = json.load(open(os.path.join(A, 'r184', 's06', 'index.json'), encoding='utf8'))
for sh in s6['sheets']:
    nm = sh['use']; aid = 'r184-' + sh['file'].split('-')[1]
    out.append({'asset_id': aid, 'category': 'mob', 'name': nm, 'spec': MOB_SPEC, 'brief': f'{nm} — 사몽 S-06 디스토피아 구역 몹(원문 외형 그대로)',
      'prompt': f'Sprite sheet of a dystopian sci-fi enemy: {nm}. Side view facing right, 12 frames on a 4x3 grid of 256x320 cells: frames 1-8 walk cycle, 9-12 attack. Feet on baseline y=300. {STYLE}',
      'avoid': AVOID, 'replaces': 'assets/r184/s06/' + sh['file']})
out.append({'asset_id': 'r251-circle', 'category': 'prop', 'name': '발록의 소환진', 'spec': 'PNG/WebP 투명 배경. 칸 384×256 px × 4칸 가로 한 줄(맥동 애니메이션), 기준점 (192,176). 바닥에 깔린 원형 마법진을 비스듬히 위에서 본 모습(납작한 타원).',
  'brief': '스토리 발록이 남긴 소환진 — 처치하면 부술 수 있는 원거리 타워형 유닛의 바닥', 'prompt': f'4-frame pulsing animation of a blood-red demonic summoning circle on the ground, seen from an isometric 3/4 top view (flattened ellipse), 384x256 cells in one row. {STYLE}', 'avoid': AVOID, 'replaces': 'assets/r251/circle.webp'})
out.append({'asset_id': 'r251-hands', 'category': 'fx', 'name': '붉은 손', 'spec': 'PNG/WebP 투명 배경. 칸 256×320 px × 8칸(가로 4 × 세로 2), 기준점 (128,288) = 손이 솟는 바닥 지점.',
  'brief': '영웅 발밑에서 솟아오르는 기괴한 붉은 손(소환진의 공격)', 'prompt': f'8-frame animation of grotesque blood-red hands erupting from the ground and grasping upward, then sinking back, 256x320 cells on a 4x2 grid. {STYLE}', 'avoid': AVOID, 'replaces': 'assets/r251/hands.webp'})
out.append({'asset_id': 'r186-flesh-void', 'category': 'tile', 'name': '살덩이 빈 공간 타일', 'spec': 'PNG/WebP 512×512 px, 상하좌우 이음매 없이 반복되는 타일(불투명).',
  'brief': '사몽 구역 바닥 밖 검은 빈 공간을 채우는 뇌·내장 주름 살덩이', 'prompt': 'Seamless tileable 512x512 texture of dark wet brain-like and intestine-like flesh folds, deep crimson and near-black, painted, horror, no text.', 'avoid': '이음매, 글씨, 밝은 색', 'replaces': 'assets/r186/flesh-void.webp'})
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
