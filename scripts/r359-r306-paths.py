#!/usr/bin/env python3
# R359: R306 픽셀 모드 표에 R290/R359 손그림 시트 경로를 더한다.
# R306 은 몹을 그릴 때 row.paths(그 몹의 원래 그림 경로) 와 맞는 drawImage 만 픽셀 시트로 바꾼다. R290 첫 5종은 R306 조사 때 이미 들어갔지만
# R359 20종은 그 뒤에 생겨 빠져 있었다(픽셀 모드인데 손그림이 그대로 나옴). R248 픽셀 경로가 같은 줄마다 R290 시트 경로와 12칸 프레임(칸 256×320, 4×3,
# pivot [128,300], visibleHeight=ART body — R290 첫 5종과 같은 형식)을 더한다. 여러 번 돌려도 결과가 같다.
import json,re,sys,pathlib
R=pathlib.Path(__file__).resolve().parents[1]/'r96'
src=(R/'client-source/mob-art-r290.js').read_text()
art={m.group(1):int(m.group(2)) for m in re.finditer(r"\b(m\d{3}):Object\.freeze\(\{file:'m\d{3}\.webp',body:(\d+),",src)}
p=R/'client-source/mob-art-variants-r306-data.js';s=p.read_text();head,body=s.split('=',1);body=body.rstrip();semi=body.endswith(';');d=json.loads(body.rstrip(';'))
added=0
for row in d['rows'].values():
  m=re.fullmatch(r'assets/r248/mobs/(m\d{3})\.webp',row['pixel']['path'])
  if not m or m.group(1) not in art:continue
  sid=m.group(1);path=f'assets/r290/mobs/{sid}.webp'
  if path not in row['paths']:row['paths']=sorted(set(row['paths'])|{path});added+=1
  have={json.dumps(f,sort_keys=True) for f in row['frames']}
  for i in range(12):
    f={'path':path,'sourceRect':[i%4*256,i//4*320,256,320],'pivot':[128,300],'visibleHeight':art[sid]}
    if json.dumps(f,sort_keys=True) not in have:row['frames'].append(f)
p.write_text(head+'='+json.dumps(d,ensure_ascii=False,separators=(',',':'))+(';' if semi else '')+'\n')
print('rows touched',added)
