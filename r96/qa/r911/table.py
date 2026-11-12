# census/*.json → 투사체 전수표(markdown). 크기는 R911 measure()(확대 전 몸통 긴 변, 화면 px), 기준은 영웅 화면 키 절반.
import json,glob,collections
rows={}
for f in sorted(glob.glob('census/census-*.json')):
  d=json.load(open(f))
  for k,s in d['seen'].items():
    key=(s['side'],s['who'] if s['side']!='mob' else s['who'].rstrip('0123456789 '),s['asset'],s['marks'])
    r=rows.setdefault(key,{'n':0,'sizes':[],'half':s['hero']/2,'zones':set(),'shot':s.get('shot')})
    r['n']+=s['n'];r['sizes']+=s['sizes'];r['zones'].add(s['zone'])
    if not r['shot'] and s.get('shot'):r['shot']=s['shot']
order={'hero':0,'boss':1,'mob':2}
out=['| 구분 | 주인 | 그림 | 표식 | 그려진 수 | 현재 크기(px, 긴 변) | 기준(영웅 키 절반) | 판정 | 지역 |','|---|---|---|---|---|---|---|---|---|']
for (side,who,asset,marks),r in sorted(rows.items(),key=lambda x:(order[x[0][0]],x[0][1],x[0][2])):
  sz=sorted(r['sizes']);med=sz[len(sz)//2] if sz else None
  verdict='측정 못 함' if med is None else ('충분' if med>=r['half']-.5 else '작음 → R911 확대')
  out.append(f"| {dict(hero='영웅',boss='보스',mob='몹')[side]} | {who} | {asset} | {marks or '-'} | {r['n']} | {'-' if med is None else f'{min(sz):.0f}~{max(sz):.0f} (중앙 {med:.0f})'} | {r['half']:.1f} | {verdict} | {','.join(sorted(r['zones']))[:40]} |")
print('\n'.join(out));print(f"\n종류 {len(rows)}개, 작음 {sum(1 for r in rows.values() if r['sizes'] and sorted(r['sizes'])[len(r['sizes'])//2]<r['half']-.5)}개")
