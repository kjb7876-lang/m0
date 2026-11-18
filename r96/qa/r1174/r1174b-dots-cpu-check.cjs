// R1174b CPU 검사: Dots CX-0153PC r1 적용(사용자 14:33Z "닷츠와협업", Dots 손질 지시 'CX-0153PC_클로드_개선적용_r1').
//  ① 상반신·각성 전신 = Dots 사본(r1174/), 상반신이 안 읽히면 rc133 임시로 물러남 ② (진) 쌍성 소멸 오른쪽 = 구 8칸 시트 한 번 재생
//  ③ 사몽 각성 고리 = 일식 고리 12칸 시트(CSS 주소 채움) ④ 사본 규격: 구 8×1 칸 192, 고리 6×2 칸 384, 칸 가장자리 투명
//  ⑤ 손질: 구 회색 연무 거의 없음·8칸 감쇠(완전 빈 칸 아님·7칸보다 옅음), 고리 순 빨강 잔티 없음 ⑥ sync 목록
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process');
const root=path.resolve(__dirname,'..','..'),CS=path.join(root,'client-source'),A=path.join(root,'runtime-text','assets','r1174');
const res=[];const check=(n,ok,d='')=>{res.push(!!ok);console.log((ok?'PASS ':'FAIL ')+n+(ok||d===''?'':' :: '+String(d).slice(0,300)));};
const src=fs.readFileSync(path.join(CS,'persona-cutin-r1174.js'),'utf8');
const sb={window:null,console,Math,JSON,Number,Array,Object,String,Set,Map,WeakMap,Boolean,Date,Error,RegExp,setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,addEventListener(){},player:null};sb.window=sb;
vm.createContext(sb);vm.runInContext(src,sb);const P=sb.__STORYWORLD_PERSONA_CUTIN_R1174__;
check('① 상반신 = Dots 사본',P&&P.art.bust.dots==='assets/r1174/persona-bust.webp'&&P.inspect().bust===P.art.bust.dots,P&&JSON.stringify(P.art.bust));
check('① 각성 전신 = Dots 사본',P&&P.art.awake.dots==='assets/r1174/persona-awake.webp'&&P.inspect().awakeArt===P.art.awake.dots);
check('① 상반신 못 읽으면 임시 그림으로(onerror)',/onerror=\(\)=>\{n\.onerror=null;n\.setAttribute\('src',U\(ART\.bust\.temp\)\)/.test(src));
check('② 쌍성 소멸 오른쪽 = 구 8칸 시트, 한 번 재생(steps 8, forwards)',P&&P.art.orbs&&P.art.orbs.path==='assets/r1174/persona-orbs8.webp'&&/\['orbs','merge'\]/.test(src)&&/r1174Sheet \.95s steps\(8,jump-none\) forwards/.test(src));
check('③ 각성 고리 = 일식 고리 12칸(12 칸 위치 + 주소 채움)',P&&P.art.sigil&&(src.match(/background-position:\d+%\s\d+%/g)||[]).length>=12&&/CSS\.replace\('__SIGIL__',U\(ART\.sigil\.path\)\)/.test(src));
// 이미지 검사(파이썬 PIL만 — CI 에 numpy 없음)
const py=`
import json
from PIL import Image
A=${JSON.stringify(A)}
O=Image.open(A+'/persona-orbs8.webp').convert('RGBA');S=Image.open(A+'/persona-sigil12.webp').convert('RGBA')
b=Image.open(A+'/persona-bust.webp');w=Image.open(A+'/persona-awake.webp')
def edge(im,C,cols,rows):
  al=im.getchannel('A');m=0
  for r in range(rows):
    for c in range(cols):
      x0,y0=c*C,r*C
      for box in ((x0,y0,x0+C,y0+1),(x0,y0+C-1,x0+C,y0+C),(x0,y0,x0+1,y0+C),(x0+C-1,y0,x0+C,y0+C)):
        m=max(m,al.crop(box).getextrema()[1])
  return float(m)
haze=0
for (r,g,bb,al) in O.getdata():
  mx=max(r,g,bb);mn=min(r,g,bb)
  if (mx-mn)/max(mx,1)<.28 and 40<al<200 and mx>120: haze+=1
C=192;oa=O.getchannel('A')
f7=float(sum(oa.crop((6*C,0,7*C,C)).getdata()));f8=float(sum(oa.crop((7*C,0,8*C,C)).getdata()))
hot=sum(1 for (r,g,bb,al) in S.getdata() if r>225 and g<60 and bb<60 and al>0)
print(json.dumps({'o':[O.size[1],O.size[0]],'s':[S.size[1],S.size[0]],'b':b.size,'w':w.size,'oe':edge(O,192,8,1),'se':edge(S,384,6,2),'haze':haze,'f7':f7,'f8':f8,'hot':hot}))`;
let m=null;try{m=JSON.parse(cp.execFileSync('python3',['-I','-c',py]).toString());}catch(e){check('④ 그림 읽기',false,e.message);}
if(m){check('④ 구 시트 8×1 칸 192 (1536×192)',m.o[0]===192&&m.o[1]===1536,JSON.stringify(m.o));
 check('④ 고리 시트 6×2 칸 384 (2304×768)',m.s[0]===768&&m.s[1]===2304,JSON.stringify(m.s));
 check('④ 상반신 576×768·각성 768×960',m.b[0]===576&&m.b[1]===768&&m.w[0]===768&&m.w[1]===960,JSON.stringify([m.b,m.w]));
 check('④ 칸 가장자리 투명(구·고리, 알파 ≤8)',m.oe<=8&&m.se<=8,JSON.stringify([m.oe,m.se]));
 check('⑤ 구 회색 연무 거의 없음(밝은 저채도 반투명 화소 < 300)',m.haze<300,m.haze);
 check('⑤ 구 8칸 감쇠: 빈 칸 아님, 7칸보다 옅음',m.f8>0&&m.f8<m.f7*.6,JSON.stringify([m.f7,m.f8]));
 check('⑤ 고리 순 빨강 잔티 없음',m.hot===0,m.hot);}
const man=fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8'),inp=fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8');
check('⑥ 4 그림 runtime-manifest·inputs',['bust','awake','orbs8','sigil12'].every(k=>man.includes('assets/r1174/persona-'+k+'.webp')&&inp.includes('assets/r1174/persona-'+k+'.webp')));
const f=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed:f}));process.exit(f?1:0);
