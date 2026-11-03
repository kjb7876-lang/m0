"""R248 몹 재활용 정리표 — 헤드리스 전수 조사(지역마다 몹 이름 → drawEnemy 안에서 실제로 그려진 그림 파일, JSON 줄)로 새 시트를 배정한다.
 · 본편(STORY): 그림마다 본편 순서로 처음 나오는 이름 하나만 원래 그림을 지킨다. 같은 그림을 쓰는 다른 이름은 새 시트(키 = 이름).
 · 사몽(DREAM): 본편 이름이 그대로 나온 몹(기증 몹 이름이 남은 것)은 사몽 안에서만 새 시트(키 = '사몽:'+이름, 게임에서는 가능하면 그 구역 사몽 몹 이름으로 바꿈).
   사몽 전용 이름인데 본편 그림·다른 이름의 그림·공용 '꼭두각시 자아' 시트를 쓰는 몹도 새 시트(키 = 이름).
사용: python3 -I scripts/r248-mob-assign.py <census.jsonl> <assign.json> <report.json>"""
import sys, json, re, collections
rows=[json.loads(l) for l in open(sys.argv[1],encoding='utf8') if l.strip()]
SKIP=re.compile(r'shadow|glow|ring|^canvas|vfx|fx-|/fx/|hp-?bar|sculpture|^ERR',re.I)
PUPPET=re.compile(r'puppet-ego')
TOWER=re.compile(r'^세뇌당한 기억의 조각$|피의 육망성 조형물|^발록의 소환진$')
def base(n):
    n=re.sub(r'\[[BM]\]$','',n);n=re.sub(r'^(중간보스|준보스)\s*·\s*','',n);n=re.sub(r'\s*·\s*짙은 형상$','',n);n=re.sub(r'\s*(후속 증원|증원|추격대)$','',n);n=re.sub(r'\s+\d+$','',n);return n.strip()
L={'STORY':collections.OrderedDict(),'DREAM':collections.OrderedDict()}
for r in rows:
    z=r.get('z','');lay='DREAM' if z.startswith('sz') else 'STORY'
    for n,ims in (r.get('mobs') or {}).items():
        b=base(n)
        if not b or TOWER.search(b):continue
        I=L[lay].setdefault(b,{'zones':[],'imgs':set(),'major':False});I['zones'].append(z);I['imgs'].update(i for i in ims if not SKIP.search(i));I['major']|=bool(re.search(r'\[[BM]\]$',n))
owner={}
for lay in ('STORY','DREAM'):
    for b,I in L[lay].items():
        for im in sorted(I['imgs']):
            if not PUPPET.search(im):owner.setdefault(im,(lay,b))
story_imgs=set().union(*[I['imgs'] for I in L['STORY'].values()]) if L['STORY'] else set()
need=[]
for b,I in L['STORY'].items():
    r=['「%s」 그림 %s'%(owner[im][1],im) for im in I['imgs'] if not PUPPET.search(im) and owner.get(im)!=('STORY',b)]
    if any(PUPPET.search(i) for i in I['imgs']):r.append('공용 꼭두각시 시트')
    if r:need.append(('STORY',b,b,r))
for b,I in L['DREAM'].items():
    if b in L['STORY']:need.append(('DREAM','사몽:'+b,b,['본편 몹 이름·그림이 사몽에 그대로 나옴']));continue
    r=[]
    for im in I['imgs']:
        if PUPPET.search(im):r.append('공용 꼭두각시 시트')
        elif im in story_imgs:r.append('본편 그림 '+im)
        elif owner.get(im)!=('DREAM',b):r.append('「%s」 그림 %s'%(owner[im][1],im))
    if r:need.append(('DREAM',b,b,sorted(set(r))))
assign=[{'id':'m%03d'%(i+1),'key':k,'name':n,'layer':lay} for i,(lay,k,n,_) in enumerate(need)]
json.dump(assign,open(sys.argv[2],'w',encoding='utf8'),ensure_ascii=False,indent=0)
json.dump({'storyNames':len(L['STORY']),'samongNames':len(L['DREAM']),'reassigned':len(need),'storyNameList':list(L['STORY'].keys()),
 'rows':[{'id':a['id'],'key':a['key'],'layer':a['layer'],'zones':sorted(set(L[a['layer']][a['name']]['zones']))[:6],'major':L[a['layer']][a['name']]['major'],'why':why} for a,(_,_,_,why) in zip(assign,need)],
 'kept':{im:b for im,(lay,b) in owner.items()}},open(sys.argv[3],'w',encoding='utf8'),ensure_ascii=False,indent=1)
print('story',len(L['STORY']),'samong',len(L['DREAM']),'reassigned',len(need))
