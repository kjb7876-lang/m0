#!/usr/bin/env python3
# R363: R306 픽셀 모드 표에 레거시 다시 그림 시트(assets/r363/mobs/L*.webp) 경로를 더한다.
# R306 은 몹 몸 그림 경로가 row.paths 에 있을 때만 픽셀 시트로 바꾼다. R363 몹은 R248 시트 그리기로 새 경로를 그리므로, 그 몹의 본편 줄
# ('STORY|nativeId|이름')에 경로와 12칸 프레임(칸 256×320, 4×3, pivot [128,300], visibleHeight=body — R359 줄과 같은 형식)을 더한다.
# 사몽(DREAM) 줄과 같은 nativeId 의 다른 이름 줄은 건드리지 않는다. 여러 번 돌려도 결과가 같다. (공실 표기 잔재 m052 는 R290 표 줄이라 scripts/r359-r306-paths.py 가 맡는다.)
import json,re,pathlib
R=pathlib.Path(__file__).resolve().parents[1]/'r96'
src=(R/'client-source/mob-legacy-r363.js').read_text()
rows={m.group(1):dict(file=m.group(2),body=int(m.group(3)),name=m.group(4),nativeId=m.group(5)) for m in re.finditer(r"\b(L\d{3}):Object\.freeze\(\{file:'(L\d{3}\.webp)',body:(\d+),name:'([^']+)',nativeId:'([^']+)'",src)}
assert rows,'no rows'
p=R/'client-source/mob-art-variants-r306-data.js';s=p.read_text();head,body=s.split('=',1);body=body.rstrip();semi=body.endswith(';');d=json.loads(body.rstrip(';'))
touched=0
for id,r in rows.items():
  aid=d['actors'].get('STORY|%s|%s'%(r['nativeId'],r['name']));assert aid,(id,'no R306 actor');row=d['rows'][aid];path='assets/r363/mobs/'+r['file']
  if path not in row['paths']:row['paths']=sorted(set(row['paths'])|{path});touched+=1
  have={json.dumps(f,sort_keys=True) for f in row['frames']}
  for i in range(12):
    f={'path':path,'sourceRect':[i%4*256,i//4*320,256,320],'pivot':[128,300],'visibleHeight':r['body']}
    if json.dumps(f,sort_keys=True) not in have:row['frames'].append(f)
p.write_text(head+'='+json.dumps(d,ensure_ascii=False,separators=(',',':'))+(';' if semi else '')+'\n')
print('rows touched',touched)
