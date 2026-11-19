# summon.json → 소환 몹이 그 지역 일반 몹(지금 이름·그림)에 없으면 '옛 몹' 의심
import json,sys,re
d=json.load(open(sys.argv[1]))
def base(n):return re.sub(r'\s*(우두머리|증원|추격대|후속 증원|후속|분대장)$','',re.sub(r'^중간보스\s*·\s*','',n or '')).strip()
def img(a):return re.sub(r'(\.(webp|png|jpg)).*$',r'\1',a or '').split('/')[-1]
for z,v in d.items():
  if 'bosses' not in v:continue
  names={base(m['name']) for m in v['mobs']};arts={img(m['art']) for m in v['mobs'] if m['art']}
  for B in v['bosses']:
    for s in B['summons']:
      if s.get('boss'):continue
      bad=[]
      if s['r61']=='clone':continue
      if base(s['name']) not in names:bad.append('이름')
      if s['art'] and img(s['art']) not in arts:bad.append('그림')
      if not s['art']:bad.append('그림 미측정')
      print('\t'.join([z,B['id'],B['name'][:16],s['name'],img(s['art']),s['r61'] or '-',','.join(bad) or 'OK']))
