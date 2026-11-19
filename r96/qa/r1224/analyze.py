# R1224 census.json → 보스별 문제 표(이동 모션·크기 튐·몸 겹침·사망 그림·픽셀 그림)
import json,sys,re,collections,statistics as st
d=json.load(open(sys.argv[1]))
PIX=re.compile(r'pixel|r163|r306/.*pix|8bit|dot-',re.I)
def art(s):
  b=s['bodies'][0];src=re.sub(r'(\.(webp|png|jpg)).*$',r'\1',b['src']);return src+'#'+','.join(map(str,b['sr'] or []))
rows=[]
for z,v in d.items():
  for B in v.get('bosses',[]):
    if B.get('err'):rows.append((z,B['id'],B['name'],'측정 실패 '+B['err']));continue
    mv=[s for s in B['mv'] if s and s.get('bodies')]
    moving=[]
    for a,b in zip(mv,mv[1:]):
      if not b['busy'] and abs(b['ex']-a['ex'])+abs(b['ey']-a['ey'])>0.05:moving.append(b)
    keys=collections.Counter(s['bodies'][0]['src']+'#'+','.join(map(str,s['bodies'][0]['sr'] or [])) for s in moving)
    tags=collections.Counter(s['bodies'][0]['tag'] for s in moving)
    issues=[]
    if len(moving)<2: issues.append(f'이동 안 함({len(moving)})')
    elif len(keys)==1: issues.append('이동 모션 없음(한 장 미끄러짐): '+list(keys)[0].split('/')[-1])
    allS=[s for s in B['mv']+B['cb'] if s and s.get('bodies') and not s['bodies'][0]['tag']]
    # 같은 상태에서 그림이 바뀔 때 키 변화
    hs=collections.defaultdict(list)
    for s in allS: hs[art(s)].append(s['bodies'][0]['h'])
    med={k:st.median(v) for k,v in hs.items()}
    if len(med)>1:
      mx,mn=max(med.values()),min(med.values())
      if mn>0 and mx/mn>1.3: issues.append(f'그림 사이 키 튐 {mn:.0f}→{mx:.0f}px({mx/mn:.2f}배)')
    for k,v in hs.items():
      if len(v)>2 and min(v)>0 and max(v)/min(v)>1.25: issues.append(f'같은 그림 키 흔들림 {k.split("/")[-1][:30]} {min(v):.0f}~{max(v):.0f}')
    ov=[s for s in B['mv']+B['cb'] if s and s.get('nb',0)>=2 and len(s['bodies'])>=2 and s['bodies'][1]['ar']>0.35*s['bodies'][0]['ar']]
    if ov: issues.append(f'몸 그림 두 장 겹침 {len(ov)}회: '+ov[0]['bodies'][1]['src'].split('/')[-1][:40])
    px=[k for k in med if PIX.search(k)]
    if px: issues.append('픽셀 그림: '+px[0].split('/')[-1])
    dd=[s for s in B['dd'] if s]
    if dd and all(not s['dead'] for s in dd): issues.append('사망 미측정(죽지 않음)')
    elif dd:
      dk=collections.Counter(art(s) for s in dd if s.get('bodies'))
      if dk: issues.append('사망 중 그림: '+', '.join(k.split('/')[-1][:34] for k in dk))
    srcs=sorted(set(k.split('#')[0] for k in med))
    rows.append((z,B['id'],B['name'],'; '.join(issues) or '-', ' | '.join(srcs)))
for r in rows: print('\t'.join(map(str,r)))
