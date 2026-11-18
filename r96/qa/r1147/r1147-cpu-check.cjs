// R1147 CPU 검사: Dots CX-0142BI 보스 대기 6칸 시트(분노 b07 · 루시퍼 a11 · 발록 dist06) + CX-0147BI 2차 자비 교정관 u202를 R620 보스 움직임에 붙인다.
//  · 게임이 대기 때 실제로 그리는 그림(헤드리스 조사 qa/r1147/idle-census.mjs: r104 p4 한 장)이면 대기 6칸 시트 칸으로 바꾼다.
//  · 피격 시트는 아직 HOLD 라 없다 → 맞을 때는 원래 그림(코드 밀림)으로, 오류 없이.
//  · 걷기·공격 중에는 시트를 쓰지 않는다. 다른 그림(b02 R380 시트·b04 사람 형태 phase0)은 건드리지 않는다.
//  · 시트 파일: 칸 크기 = 원본 p4 크기, 6칸 가로 한 줄, 칸마다 발 줄·키(±5%)·원본과 겹침(IoU≥0.65)·색(평균 차 ≤6)이 원본과 맞고, 알파 1~16 잔티 0.
//  · 레비아탄(b03) 기존 대기·피격 시트는 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','boss-motion-r620.js');const src=fs.readFileSync(F,'utf8');
const BOSSES={b07:[411,473],a11:[466,432],dist06:[508,501],u202:[509,525]};
const P4=id=>'assets/r104/bosses/'+id+(id==='u202'?'-mid':'-boss')+'-p4.webp';
function world(p4,W,H,{ready=true}={}){const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:'z'},player={x:0,y:0},ctx={commands:[]};var __ready=${ready},__added=[];function addImage(p){__added.push(p);}
  function readyImage(p){if(/assets\\/r(620|1147)\\//.test(p))return __ready?{ready:true,image:{src:p}}:null;return {ready:true,image:{src:p}};}
  function drawEnemy(e){const p=e.attack?${JSON.stringify(p4.replace('-p4.','-p2.'))}:${JSON.stringify(p4)};ctx.commands.push({kind:'image',owner:{kind:'enemy'},image:{src:p},sourcePath:p,sourceRect:[0,0,${W},${H}],style:{globalAlpha:1},points:[[50,100],[150,100],[150,200],[50,200]]});}`,ctx);
 vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
function frames(c,e,secs,{dt=1/30,step=null}={}){const out=[];for(let t=0;t<secs-1e-9;t+=dt){run(c,`time+=${dt}`);if(step)step(e,t);run(c,'ctx.commands.length=0');c.drawEnemy(e);const b=run(c,'ctx.commands').find(k=>k.kind==='image'&&!k.r620Ghost);out.push({src:b.sourcePath,rect:[...b.sourceRect],pts:b.points.map(p=>[...p])});}return out;}
const boss=o=>({id:'b',boss:true,x:3,y:3,hp:100,hitTimer:0,...o});
for(const [id,[W,H]] of Object.entries(BOSSES)){
 const p4=P4(id);
 {const c=world(p4,W,H),e=boss({nativeId:id+'-boss'});const L=frames(c,e,1.6);
  ok(L.every(f=>f.src==='assets/r1147/bosses/'+id+'-idle6.webp'),id+': idle uses R1147 idle6 sheet');
  const cells=new Set(L.map(f=>f.rect[0]));ok(cells.size===6,id+': idle cycles 6 cells ('+cells.size+')');
  ok(L.every(f=>f.rect[1]===0&&f.rect[2]===W&&f.rect[3]===H&&f.rect[0]%W===0&&f.rect[0]<=W*5),id+': cell rects inside 6x'+W+' strip');
  ok(L.every(f=>f.pts.flat().every(Number.isFinite)),id+': finite points');
  // 피격: 시트가 없으니 원래 그림 + 오류 0, 끝나면 다시 대기 시트
  e.hitTimer=.14;const Lh=frames(c,e,.6,{step:e=>{e.hitTimer=Math.max(0,e.hitTimer-1/30);}});
  ok(Lh.slice(0,3).every(f=>f.src===p4),id+': hit (no hit sheet yet) keeps original art');ok(Lh[Lh.length-1].src.includes('r1147'),id+': back to idle sheet after hit');
  ok(c.__STORYWORLD_BOSS_MOTION_R620__.inspect().stats.errors===0,id+': no errors through hit');
  // 걷기: 시트 안 씀
  const Lw=frames(c,e,1,{step:e=>{e.x+=.05;}});ok(Lw.slice(15).every(f=>!f.src.includes('r1147')),id+': walking keeps engine art');
  // 공격: 시트 안 씀
  e.attack={elapsed:0,angle:0};const La=frames(c,e,.3,{step:e=>{e.attack.elapsed+=1/30;}});ok(La.every(f=>!f.src.includes('r1147')),id+': attack keeps key poses');}
 {const c=world(p4,W,H,{ready:false}),e=boss();const L=frames(c,e,.3);ok(L.every(f=>f.src===p4),id+': sheet not loaded yet → original');ok(run(c,'__added').some(p=>p.includes('r1147/bosses/'+id+'-idle6')),id+': sheet requested');}
}
{// 회귀(헤드리스 실측): 게임의 드로우 기록은 sourcePath 를 절대 주소(http://…/m0/assets/…)로 남긴다 → 그래도 시트를 찾아야 한다(b03 포함)
 for(const [p,W,H,want] of [['http://127.0.0.1:4410/m0/assets/r104/bosses/dist06-boss-p4.webp',508,501,'r1147/bosses/dist06-idle6'],['https://kjb7876-lang.github.io/m0/assets/generated-v31224/actors-normalized/1a8ca2c5759b_ep1b03_envy_sister_phase0.webp',672,384,'r620/bosses/b03-idle6']]){
  const c=world(p,W,H),L=frames(c,boss(),1);ok(L.every(f=>f.src.includes(want)),'absolute URL sourcePath still finds sheet: '+want);}}
{// 경계값·회귀: 다른 보스 그림·b03 기존 시트는 그대로
 for(const [p,W,H] of [['assets/r380/mobs/sloth-burden-man-v1.webp',256,256],['assets/generated-v31224/actors-normalized/fbc0132dd447_ep1b04_glutton_head_chef_phase0.webp',672,384],['assets/r104/bosses/b07-boss-p1.webp',411,473]]){
  const c=world(p,W,H),L=frames(c,boss(),1);ok(L.every(f=>f.src===p),'untouched: '+p.split('/').pop());}
 const P3='assets/generated-v31224/actors-normalized/1a8ca2c5759b_ep1b03_envy_sister_phase0.webp';const c=world(P3,672,384),e=boss();const L=frames(c,e,1);ok(L.every(f=>/r620\/bosses\/b03-idle6/.test(f.src)),'b03 idle sheet still used');
 e.hitTimer=.14;const Lh=frames(c,e,.2,{step:e=>{e.hitTimer=Math.max(0,e.hitTimer-1/30);}});ok(/b03-hit4/.test(Lh[0].src),'b03 hit sheet still used');
 // 같은 화면 시각에 두 번 그려도(dt=0) 유한
 const c2=world('assets/r104/bosses/a11-boss-p4.webp',466,432),e2=boss();frames(c2,e2,.2);run(c2,'ctx.commands.length=0');c2.drawEnemy(e2);c2.drawEnemy(e2);ok(run(c2,'ctx.commands').every(k=>k.points.flat().every(Number.isFinite)),'dt=0 finite');}
{// 시트 파일 검수(파이썬 Pillow 로 화소 측정)
 const py=`
import json,sys
from PIL import Image
A=lambda im:im.getchannel('A')
out={}
for k,(W,H) in json.loads(sys.argv[1]).items():
  sh=Image.open(f'${R}/runtime-text/assets/r1147/bosses/{k}-idle6.webp').convert('RGBA');src=Image.open(f'${R}/runtime-text/assets/r104/bosses/{k}-'+('mid' if k=='u202' else 'boss')+'-p4.webp').convert('RGBA')
  def info(im):
    a=A(im).point(lambda v:255 if v>16 else 0);b=a.getbbox();px=a.load();y0=b[3]-max(2,int((b[3]-b[1])*.06));xs=c=0
    for y in range(y0,b[3]):
      for x in range(b[0],b[2]):
        if px[x,y]:xs+=x;c+=1
    d=[p for p in im.getdata() if p[3]>16];return {'bb':b,'fx':xs/c,'rgb':[sum(p[j] for p in d)/len(d) for j in range(3)],'low':sum(1 for p in im.getdata() if 0<p[3]<=16)}
  s=info(src);fr=[info(sh.crop((i*W,0,(i+1)*W,H))) for i in range(6)]
  sa=list(A(src).point(lambda v:255 if v>16 else 0).getdata())
  for i,f in enumerate(fr):
    fa=list(A(sh.crop((i*W,0,(i+1)*W,H))).point(lambda v:255 if v>16 else 0).getdata());f['iou']=sum(1 for a,b in zip(sa,fa) if a and b)/max(1,sum(1 for a,b in zip(sa,fa) if a or b))
  out[k]={'size':list(sh.size),'src':s,'fr':fr}
print(json.dumps(out))`;
 let M=null;try{M=JSON.parse(cp.execFileSync('python3',['-I','-c',py,JSON.stringify(BOSSES)],{encoding:'utf8',maxBuffer:1<<24}));}catch(err){ok(false,'sheet files measurable: '+String(err.message).slice(0,200));}
 for(const [id,[W,H]] of Object.entries(BOSSES)){const m=M[id];ok(m.size[0]===W*6&&m.size[1]===H,id+': sheet '+W*6+'x'+H+' ('+m.size+')');const s=m.src,vh=s.bb[3]-s.bb[1];
  for(const [i,f] of m.fr.entries()){const fvh=f.bb[3]-f.bb[1];ok(Math.abs(f.bb[3]-s.bb[3])<=0,id+' f'+i+': foot line '+f.bb[3]+' = '+s.bb[3]);ok(Math.abs(fvh-vh)/vh<=.05,id+' f'+i+': height within 5%');ok(f.iou>=.65,id+' f'+i+': silhouette overlap with p4 '+f.iou.toFixed(3)+' >= 0.65');
   const dc=f.rgb.reduce((a,v,j)=>a+Math.abs(v-s.rgb[j]),0)/3;ok(dc<=6,id+' f'+i+': colour mean diff '+dc.toFixed(1)+' <= 6');ok(f.low===0,id+' f'+i+': no alpha 1..16 fringe');ok(f.bb[0]>=1&&f.bb[1]>=1&&f.bb[2]<=W-1,id+' f'+i+': not touching cell edge');}}}
{// 연결: 새 자산이 runtime-inputs 에 있고 Pages 가 이 검사를 돈다
 const ri=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');for(const id of Object.keys(BOSSES))ok(ri.includes('assets/r1147/bosses/'+id+'-idle6.webp'),'runtime-inputs lists '+id+' sheet');
 ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('qa/r1147/r1147-cpu-check.cjs'),'pages.yml runs this check');}
console.log('R1147 boss idle sheets CPU check: '+n+' ok');
