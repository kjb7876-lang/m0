#!/usr/bin/env python3
"""R1371 원본 방향 표를 사람이 맞추기 위한 접촉 시트: 시트마다 공격 칸(뒤집지 않은 원본)을 늘어놓고, 지금 게임이 가정하는 방향(implied)을 적는다.
사용: face-lab.py <site> <out-prefix> <probe.json…>"""
import json,re,sys,collections,os
from PIL import Image,ImageDraw
site,pre=sys.argv[1],sys.argv[2]
cells=collections.defaultdict(dict);imp=collections.defaultdict(collections.Counter);names={}
for f in sys.argv[3:]:
    for z,v in json.load(open(f)).items():
        if re.search(r'mammon|^ep1b06$',z):continue
        for mob in v.get('mobs',[]):
            for r in mob.get('rows',[]):
                rc=r.get('rec')
                if not rc or not rc.get('art') or r['kind'] not in('atk','wind','idle'):continue
                a=rc['art'];src=rc['src'];m=re.search(r'\.(?:png|webp|jpe?g)(?:#[^:]*)?:(-?[\d.]+),(-?[\d.]+),([\d.]+),([\d.]+):',src)
                if m:rect=[round(float(x)) for x in m.groups()]
                elif rc.get('sr'):rect=rc['sr']
                else:continue
                key=(a['path'],a.get('cell'))
                cells[a['path']][a.get('cell')]=(rect,r['kind'])
                names.setdefault(a['path'],f"{z} {mob['name']}{' B' if mob.get('boss') else ' M' if mob.get('mid') else ''}")
                if r['kind']!='idle' and (r['kind']=='wind' or r.get('frac',1)>=.3):imp[a['path']]['R' if (r['side']=='R')!=rc['mir'] else 'L']+=1
skip=set(json.load(open(os.environ['SKIP'])) ) if os.environ.get('SKIP') else set()
paths=sorted(p for p in cells if p not in skip and not any(k.startswith(p+'#') for k in skip));H=150;rows=[]
for p in paths:
    fp=os.path.join(site,'assets',p)
    if not os.path.exists(fp):continue
    try:im=Image.open(fp).convert('RGBA')
    except Exception:continue
    cs=sorted(cells[p].items(),key=lambda kv:(kv[1][1]=='idle',kv[0] or ''))
    atk=[c for c in cs if c[1][1]!='idle'][:5];idl=[c for c in cs if c[1][1]=='idle'][:1]
    tiles=[]
    for cell,(rect,kind) in atk+idl:
        x,y,w,h=rect
        if w<=0 or h<=0:continue
        c=im.crop((x,y,x+w,y+h));c.thumbnail((int(H*1.3),H));bg=Image.new('RGBA',c.size,(205,205,205,255));bg.alpha_composite(c);tiles.append((bg.convert('RGB'),('I ' if kind=='idle' else '')+str(cell)))
    if not tiles:continue
    i=imp[p];rows.append((p,names[p],(i.most_common(1)[0][0] if i else '-')+(' MIX' if len(i)>1 else ''),tiles))
per=8
for k in range(0,len(rows),per):
    chunk=rows[k:k+per];W=max(sum(t[0].width+4 for t in r[3]) for r in chunk)+4;W=max(W,500)
    out=Image.new('RGB',(W,len(chunk)*(H+30)),(240,240,240));d=ImageDraw.Draw(out)
    for j,(p,n,i,tiles) in enumerate(chunk):
        y=j*(H+30);d.text((4,y+2),f"#{k+j} now={i} | {p} | {n}",fill=(180,0,0));x=4
        for t,lab in tiles:out.paste(t,(x,y+16));d.text((x+2,y+H+16-12),lab,fill=(0,0,180));x+=t.width+4
    out.save(f'{pre}{k//per:02d}.jpg',quality=88)
json.dump([[k,p,n,i] for k,(p,n,i,_) in enumerate(rows)],open(pre+'index.json','w'),ensure_ascii=False,indent=0)
print(len(rows),'sheets')
