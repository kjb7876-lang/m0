#!/usr/bin/env python3
"""R114 몹·보스 고유색(1)·보조색(2) 표.

사용자 기준(2026-10-28 05:37/05:38): 고유색은 몹 자신의 그림에서 가장 많이 쓰인 색, 보조색은 두 번째로 많이 쓰인 색.
이름에 색이 들어간 몹·보스는 그 색이 고유색(1순위)이고, 그림에서 가장 많이 쓰인 색이 보조색(이름 색과 비슷하면 두 번째 색).
- 투명(알파<128)과 어두운 그늘·외곽선(가장 밝은 채널<72), 거의 흰 무채색은 배경·외곽선으로 보고 세지 않는다.
- RGB를 채널당 8단계(512칸)로 묶어 세고, 칸의 실제 평균색을 쓴다. 두 번째 색은 첫 색과 충분히 다른 칸(거리 ≥ 70) 가운데 가장 많은 칸.
사용: python3 scripts/r114-mob-palette.py <enemies.json> <site 디렉터리> <출력 js>
"""
import sys, json, re, os
from PIL import Image

NAME_COLOURS=[  # (정규식, 색, 이름)
(r'(?<!눈)보라|보랏빛|자줏', (138,79,208),'보라'),
 (r'핏빛|피냄새|피로 꿰맨|피의|선혈', (158,22,34),'핏빛'),
 (r'붉은|적색|진홍', (200,32,44),'붉은'),
 (r'흑장미|흑마술|검은|흑색|칠흑', (52,30,58),'검은'),
 (r'백색|백의|흰 |하얀|흰색|순백', (240,238,230),'흰'),
 (r'청람', (61,95,176),'청람'),
 (r'파란|푸른|청색', (47,125,255),'파란'),
 (r'황금|금빛', (230,184,60),'금빛'),
 (r'은빛|은색', (200,206,214),'은빛'),
 (r'초록|녹색|푸른 숲', (60,170,80),'초록'),
 (r'회색|잿빛', (128,128,132),'잿빛'),
 (r'노란|황색', (240,210,60),'노란'),
]
def name_colour(name):
    for rx,rgb,label in NAME_COLOURS:
        if re.search(rx,name or ''):return rgb,label
    return None,None

def top_colours(im):
    im=im.convert('RGBA');im.thumbnail((160,160))
    bins={}
    for r,g,b,a in (im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata()):
        if a<128:continue
        mx=max(r,g,b);mn=min(r,g,b)
        if mx<72:continue                       # 어두운 그늘·외곽선(이펙트 색으로 쓰면 안 보임)
        if mn>225 and mx-mn<18:continue          # 거의 흰 무채색(하이라이트)
        k=(r>>5,g>>5,b>>5);s=bins.setdefault(k,[0,0,0,0]);s[0]+=1;s[1]+=r;s[2]+=g;s[3]+=b
    rows=sorted(bins.values(),key=lambda s:-s[0])
    cols=[(round(s[1]/s[0]),round(s[2]/s[0]),round(s[3]/s[0]),s[0]) for s in rows]
    return cols

def dist(a,b):return sum((x-y)**2 for x,y in zip(a[:3],b[:3]))**.5

def main():
    rows=json.load(open(sys.argv[1]));site=sys.argv[2];out={};miss=[]
    cache={}
    for r in rows:
        p=os.path.join(site,r['path'] or '')
        if not r['path'] or not os.path.exists(p):miss.append(r['path']);continue
        key=(r['path'],tuple(r['rect'] or ()))
        if key not in cache:
            im=Image.open(p)
            if r['rect']:x,y,w,h=r['rect'];im=im.crop((x,y,x+w,y+h))
            cache[key]=top_colours(im)
        cols=cache[key]
        if not cols:continue
        first=cols[0];second=next((c for c in cols[1:] if dist(c,first)>=70),cols[1] if len(cols)>1 else first)
        nc,label=name_colour(r['name'])
        if nc:
            primary=nc;sec=first if dist(first,nc)>=70 else second
            src='name:'+label
        else:
            primary=first[:3];sec=second[:3];src='art'
        ent={'name':r['name'],'zone':r['zone'],'p':list(primary[:3]),'s':list(sec[:3]),'src':src,'path':r['path']}
        for k in filter(None,[r['nativeId'],r['path']+('#'+','.join(map(str,r['rect'])) if r['rect'] else '')]):
            out.setdefault(k,ent)
    js='/* R114 몹·보스 고유색(p)·보조색(s) — scripts/r114-mob-palette.py 생성. 이름에 색이 있으면 그 색이 고유색. */\nwindow.__STORYWORLD_PALETTE_R114_DATA__='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n'
    open(sys.argv[3],'w',encoding='utf-8').write(js)
    print(len(out),'keys',len(rows),'rows','missing',len(miss),miss[:5])
main()
