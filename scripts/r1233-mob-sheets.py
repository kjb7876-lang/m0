"""R1233 (지금은 Dots RC42 시트로 바뀜 — 이 스크립트는 처음 임시본 기록용, 다시 돌리면 덮어쓰니 쓰지 말 것): 임시로 얹은 R248 이름 시트(R410 상자머리 인형 후보 등)를 같은 지역 테마 그림으로 바꾸는 시트를 만든다.
 usage: python3 -I scripts/r1233-mob-sheets.py <빌드된 사이트 assets 루트 r96/hospital-three-pc/site/assets> <출력 r96/runtime-text/assets/r1233/mobs>
 출력 = R290 규격(칸 256x320, 4x3, 걷기 0-7 · 공격 8-11, pivot 128,300, 오른쪽을 봄) 무손실 WebP + index.json(원본 경로·해시·색 변경).
 · 피리 고블린(m044, 마지막 길 last305): 같은 지역 '숲 고블린'과 같은 엔진 고블린 그림(r198 M047 이동 2칸, r92 M047 공격 4칸)을 쓰되,
   둘이 겹치지 않게 초록 피부만 차가운 잿빛 청록으로 옮긴다(붉은 두건·쇠 갑옷·칼은 그대로). 원본 그림은 왼쪽을 봐서 좌우로 뒤집어 넣는다.
   피리를 든 제대로 된 그림은 Dots 요청(받으면 이 줄만 바꾼다).
 · 칸 맞추기: 모든 칸을 같은 배율로 키우고, 칸마다 발 줄(알파 아래 12%)의 가운데를 x=128, 맨 아래 불투명 줄을 y=298 에 둔다.
 PIL 만 쓴다."""
import sys,os,json,hashlib,colorsys
from PIL import Image
A=sys.argv[1];OUT=sys.argv[2];os.makedirs(OUT,exist_ok=True)
CW,CH,FOOT,PX=256,320,298,128
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
def frames(path,n):
    im=Image.open(path).convert('RGBA');w,h=im.size;fw=w//n;return [im.crop((i*fw,0,(i+1)*fw,h)) for i in range(n)]
def bbox_a(im,th=40):
    a=im.getchannel('A').point(lambda v:255 if v>=th else 0);return a.getbbox()
def foot_center(im):
    a=im.getchannel('A');bb=bbox_a(im);x0,y0,x1,y1=bb;band=max(3,int((y1-y0)*.12));xs=[];
    px=a.load()
    for y in range(y1-band,y1):
        for x in range(x0,x1):
            if px[x,y]>=40:xs.append(x)
    return (sum(xs)/len(xs) if xs else (x0+x1)/2),y1
def recolor_green(im,to_h=.52,sat=.38,val=.92):
    im=im.copy();px=im.load();w,h=im.size;n=0
    for y in range(h):
        for x in range(w):
            r,g,b,a=px[x,y]
            if a==0:continue
            hh,ss,vv=colorsys.rgb_to_hsv(r/255,g/255,b/255)
            if .11<=hh<=.45 and ss>=.25:# 초록·누런 초록 피부만(붉은 두건·잿빛 쇠는 그대로)
                nr,ng,nb=colorsys.hsv_to_rgb(to_h,ss*sat,vv*val);px[x,y]=(int(nr*255),int(ng*255),int(nb*255),a);n+=1
    return im,n
def build(key,cfg):
    walk=[f for f in cfg['walk']];atk=cfg['attack'];allf=walk+atk
    # 같은 배율: 가장 큰 칸이 칸 안에 들게(위 여백 12px), 그리고 cfg 배율 상한
    s=cfg['scale']
    for f in allf:
        x0,y0,x1,y1=bbox_a(f)
        s=min(s,(FOOT-12)/(y1-y0+1e-6),(CW-8)/(x1-x0+1e-6))
    sheet=Image.new('RGBA',(CW*4,CH*3),(0,0,0,0));bodies=[];recol=0
    for i,f in enumerate(allf):
        if cfg.get('mirror'):f=f.transpose(Image.FLIP_LEFT_RIGHT)
        f=f.resize((max(1,round(f.size[0]*s)),max(1,round(f.size[1]*s))),Image.LANCZOS)
        if cfg.get('recolor'):f,n=recolor_green(f,**cfg['recolor']);recol+=n
        cx,by=foot_center(f);ox=round(PX-cx);oy=round(FOOT-by)
        cell=Image.new('RGBA',(CW,CH),(0,0,0,0));cell.paste(f,(ox,oy),f)
        sheet.alpha_composite(cell,((i%4)*CW,(i//4)*CH));bb=bbox_a(cell)
        if i<8 and bb:bodies.append(bb[3]-bb[1])
    out=os.path.join(OUT,key+'.webp');sheet.save(out,'WEBP',lossless=True,method=6)
    body=sorted(bodies)[len(bodies)//2]
    return {'id':key,'name':cfg['name'],'file':key+'.webp','body':body,'scale':round(s,4),'mirror':bool(cfg.get('mirror')),'recolorPixels':recol,
            'recolor':cfg.get('recolor'),'sources':[{'path':p,'sha256':sha(os.path.join(A,p[len('assets/'):]))} for p in cfg['src']],'sha256':sha(out),'bytes':os.path.getsize(out),'finalArt':False}
G=lambda p:os.path.join(A,p[len('assets/'):])
move=frames(G('assets/r198/mobs/M047-move.png'),2);attack=frames(G('assets/r92/mobs/M047-attack.png'),4)
CFG={'m044':{'name':'피리 고블린','src':['assets/r198/mobs/M047-move.png','assets/r92/mobs/M047-attack.png'],
  'walk':[move[0],move[0],move[0],move[0],move[1],move[1],move[1],move[1]],'attack':attack,'scale':1.3,'mirror':True,'recolor':{'to_h':.52,'sat':.38,'val':.92}}}
rows=[build(k,c) for k,c in CFG.items()]
json.dump({'schema':'storyworld.r1233.mobs/v1','note':'R1233 임시 후보 시트 → 지역 테마 그림(scripts/r1233-mob-sheets.py)','mobs':rows},open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
for r in rows:print(r['id'],r['name'],'body',r['body'],'scale',r['scale'],'recolor',r['recolorPixels'],r['bytes'])
