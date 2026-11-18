// R1120 실패 먼저(사용자 11-17 09:15Z "아직 라우렌으로나오는데 스킬이랑 모션이랑 그리고 걷기 모션이너무빠름").
// 헤드리스 실측(r1120/probe.mjs): 형상일 때 몸 한 장만 바뀌고 ▸ 가림 유령·잔상·대시 몸 시트(r130 actions-…-lauren-move)·R409 테두리 복제가 라우렌 그대로
//  ▸ 막기(D) 땐 더 큰 방벽(barrier.webp)을 몸으로 잘못 골라 라우렌 막기 몸이 남음 ▸ 라우렌 스킬 그림(중력 우물·붕괴·분쇄 소용돌이 r561)이 모양 그대로
//  ▸ EGO 오라(r111:ego-*)·에덴 불(r108eden 라우렌 보라)·순간이동(…:lauren:blink) 은 보라 그대로 ▸ 걷기 칸 넘김이 거리 1당 약 6칸(엔진 영웅 3.2칸의 1.8배).
// 검사: ① 걷기 칸 넘김 = 거리 1당 3.2칸(엔진 WALK_RATE_R148) ② 빠르게 걸어도 렌더마다 1칸 이하 ③ 막기 때 방벽이 아니라 라우렌 몸을 바꿈
//       ④ 같은 자리 라우렌 몸 복제(가림 유령·테두리) → 페르소나 같은 칸 ⑤ 떨어진 잔상 → 페르소나 칸을 그만큼 옮겨서 ⑥ 대시 몸 시트(fx) → 페르소나
//       ⑦ 순간이동 빛(fx/lauren/blink)은 몸이 아님 — 그림 그대로, 언주 색 ⑧ 중력 우물 뒤·분쇄 → 페르소나 소용돌이 시트, 붕괴 → 일식(앞 16칸 비행 루프, 뒤 8칸 소멸 6칸), 언주 돌리기 안 함
//       ⑨ EGO 오라·라우렌 에덴 불(보라 계열 팔레트 164,98,255·150,70,255) → 언주, 다른 영웅 색 에덴 불은 그대로
//       ⑭ 픽셀 이펙트(R163 play — 라우렌 특수기 폭발 pvfx-warm-explosion 등)에 넘기는 라우렌 보라 색조 → 언주, 다른 색조·형상 아님은 그대로
//          단 frameAt(R102 영웅 이펙트 안에서 그려 그 명령째 언주 색 돌리기를 받는 돌 결정 등)은 그대로 — 두 번 바꾸면 초록이 된다(헤드리스 Q 장면에서 확인)
//       ⑬ 중력 우물 코어·원반(r561 선·채우기 — 보라 구에 흰 심)의 보라 색 → 언주 명암(알파 유지), 검정·회색은 그대로 ⑩ 몸 바꾸기 실패(그림 준비 전)면 복제도 안 건드림 ⑪ 형상이 아니면(라우렌) 아무것도 안 바꿈 ⑫ CI 연결
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-hero-r1113.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(FILE,'utf8');
const hooks=fs.readFileSync(path.join(ROOT,'client-source/ego-sovereign-r1046.js'),'utf8');
function world(o={}){
 const store=o.store||{},images=[];let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>[...p]),style:c.style&&{...c.style}}));}};
 const document={createElement:t=>({tagName:t,width:0,height:0,getContext:()=>({drawImage(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})}),baseURI:'http://x/m0/',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}}};
 class Img{constructor(){images.push(this);}set src(v){this._src=v;}get src(){return this._src;}}
 const player={hero:'lauren',x:10,y:10,hp:100,direction:'front',attackAnim:0,skillAnim:0,ultimateAnim:0};
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Date,time:0,player,room:{id:'cult04'},loading:false,storyScene:null,modal:false,started:true,
  zoom:1,actorHeight:()=>66,project:(x,y)=>({x:500+(x-y)*16,y:300+(x+y)*8}),toast:()=>{},
  setInterval:()=>0,setTimeout:()=>0,StoryPhase1:{ThreeRenderer:{prototype:proto}},document,Image:Img,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
 C.setHudTextR63R2=()=>{};C.tick=function(){};C.serializeSave=()=>({player:{}});C.restoreSave=async()=>{};C.__STORYWORLD_CHEAT777__={active:()=>true};
 C.pfx=[];C.__STORYWORLD_PIXELFX_R163__=Object.freeze({has:()=>true,play:(n,x,y,o)=>{C.pfx.push(o);return 1;},frameAt:(n,u,x,y,o)=>{C.pfxF.push(o);return 1;}});C.pfxF=[];
 C.window=C;vm.createContext(C);vm.runInContext(hooks,C);vm.runInContext(SRC,C);
 const load=()=>{for(const im of images)if(im._src&&!im._done&&im.onload){im._done=true;const s=im._src;im.naturalWidth=/walk/.test(s)?4096:/persona-idle/.test(s)?1152:/r1119\/fx-[a-z-]+-flight/.test(s)?2048:/r1119\/fx-[a-z-]+-contact/.test(s)?1536:344;im.naturalHeight=/walk/.test(s)?512:/r1119|persona-idle/.test(s)?256:400;im.onload();}};
 const frame=cmds=>{proto.render.call({}, {commands:cmds});return seen;};
 const step=(dt=1/30)=>{C.time+=dt;C.tick();};
 return {C,player,frame,load,step,api:()=>C.__STORYWORLD_PERSONA_HERO_R1113__};}
const LB='r409:outline:hero:u:http://x/m0/assets/r130/lauren/directions-lauren-front.webp:181,55,150,421:20';
const Q=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const body=(sp=LB,q=Q(480,240,26,61))=>({kind:'image',key:'hero:2:0',order:5,owner:{id:'hero:2',kind:'hero'},sourcePath:sp,sourceRect:[0,0,192,463],style:{filter:'none'},points:q});
const img=(id,kind,sp,q,extra={})=>({kind:'image',key:id+':0',order:4,owner:{id,kind},sourcePath:sp,sourceRect:[0,0,256,256],style:{filter:'none',globalAlpha:.4},points:q,...extra});
const hue=c=>/hue-rotate/.test(c?.style?.filter||'');
const ready=(o)=>{const w=world(o);w.api().setForm(true);w.frame([body()]);w.load();w.step();w.frame([body()]);w.load();return w;};
// ①②
{const run=(speed,n=90)=>{const w=ready();let dist=0,adv=0,maxJ=0,prev=null;w.player.direction='left';
  for(let i=0;i<n;i++){const d=speed/30;w.player.x-=d*Math.SQRT1_2;w.player.y+=d*Math.SQRT1_2;dist+=d;w.step();const b=w.frame([body()]).find(c=>c.owner.kind==='hero');const m=/persona-walk-\w+\.webp:(\d)/.exec(b.sourcePath||'');
   if(m){const f=+m[1];if(prev!=null){const j=(f-prev+8)%8;adv+=j;maxJ=Math.max(maxJ,j);}prev=f;}else prev=null;}
  return {rate:adv/dist,maxJ};};
 const A=run(2.4),B=run(6);
 ok(Math.abs(A.rate-3.2)/3.2<.15,'① 걷기 칸 넘김 거리 1당 '+A.rate.toFixed(2)+'칸 (엔진 영웅 3.2)');
 ok(B.maxJ<=1,'② 빠르게(6/초) 걸어도 렌더마다 최대 '+B.maxJ+'칸');}
// ③
{const w=ready();const bar=body('http://x/m0/assets/r100/barrier.webp',Q(470,220,48,90));bar.key='hero:2:bar';const g=body('assets/r130/guard/lauren/guard-s.webp');
 const out=w.frame([bar,g]);const ob=out.find(c=>c.key==='hero:2:bar'),og=out.find(c=>c.key==='hero:2:0');
 ok(/barrier\.webp$/.test(ob.sourcePath)&&/^r1113:/.test(og.sourcePath),'③ 막기: 방벽 그대로('+ob.sourcePath.slice(-12)+'), 라우렌 막기 몸 → '+og.sourcePath.slice(0,40));}
// ④⑤⑥⑦
{const w=ready();const dup=body(LB);dup.key='hero:2:dup';dup.order=9;dup.style={filter:'none',globalAlpha:.35};
 const trail=img('r350:ghost:hero:4','effect','http://x/m0/assets/r130/lauren/walk-e.webp',Q(500,250,26,61));
 const dash=img('fx:31','effect','http://x/m0/assets/r130/lauren/actions-v3126-lauren-move-front.webp',Q(470,236,30,66));
 const blink=img('r412:lauren:blink:1.2','effect','http://x/m0/assets/r412/fx/lauren/blink.webp',Q(460,230,60,60));
 const out=w.frame([body(),dup,trail,dash,blink]);const B=out.find(c=>c.key==='hero:2:0'),D=out.find(c=>c.key==='hero:2:dup'),T=out.find(c=>c.owner.id==='r350:ghost:hero:4'),S=out.find(c=>c.owner.id==='fx:31'),K=out.find(c=>c.owner.id==='r412:lauren:blink:1.2');
 const same=(a,b,dx=0,dy=0)=>a&&b&&a.points.every((p,i)=>Math.abs(p[0]-b.points[i][0]-dx)<.01&&Math.abs(p[1]-b.points[i][1]-dy)<.01);
 ok(/^r1113:/.test(B.sourcePath),'④ 몸 바뀜');
 ok(D&&D.sourcePath===B.sourcePath&&same(D,B)&&D.style.globalAlpha===.35&&D.order===9,'④ 같은 자리 라우렌 몸 복제 → 페르소나 같은 칸(투명도·순서 유지) '+(D&&D.sourcePath));
 ok(T&&T.sourcePath===B.sourcePath&&same(T,B,20,10),'⑤ 떨어진 잔상 → 페르소나 칸을 (20,10) 옮겨서 '+(T&&T.sourcePath));
 ok(S&&/^r1113:/.test(S.sourcePath),'⑥ 대시 몸 시트 → 페르소나 '+(S&&S.sourcePath));
 ok(K&&/blink\.webp$/.test(K.sourcePath)&&hue(K),'⑦ 순간이동 빛은 그림 그대로 + 언주 색');}
// ⑧
{const w=ready();const W='http://x/m0/assets/r561/lauren/';
 const cell=(name,i,id)=>img(id,'effect',W+name+'.webp',Q(400,200,120,80),{sourceRect:[(i%6)*256,Math.floor(i/6)*256,256,256],imageSize:[1536,1024]});
 const cmds=[body(),cell('lauren-gravity-well-back',9,'r561:well:1.0:back'),cell('lauren-gravity-well-front',9,'r561:well:1.0:front'),cell('lauren-collapse',3,'r561:collapse:a'),cell('lauren-collapse',20,'r561:collapse:b'),cell('lauren-crush-vortex',14,'r561:crush:1')];
 w.frame(cmds.map(c=>({...c})));w.load();const out=w.frame(cmds.map(c=>({...c})));const by=id=>out.find(c=>c.owner.id===id);
 const wb=by('r561:well:1.0:back'),ca=by('r561:collapse:a'),cb=by('r561:collapse:b'),cr=by('r561:crush:1'),wf=by('r561:well:1.0:front');
 ok(/fx-vortex-flight/.test(wb.sourcePath)&&wb.sourceRect.join()==='256,0,256,256'&&!hue(wb),'⑧ 중력 우물 뒤 9칸 → 소용돌이 비행 1칸('+wb.sourcePath+' '+wb.sourceRect+')');
 ok(/fx-eclipse-flight/.test(ca.sourcePath)&&ca.sourceRect[0]===3*256&&!hue(ca),'⑧ 붕괴 3칸 → 일식 비행 3칸('+ca.sourcePath+')');
 ok(/fx-eclipse-contact/.test(cb.sourcePath)&&cb.sourceRect[0]===3*256,'⑧ 붕괴 20칸 → 일식 소멸 3칸('+cb.sourcePath+' '+cb.sourceRect+')');
 ok(/fx-vortex-flight/.test(cr.sourcePath)&&cr.sourceRect[0]===6*256,'⑧ 분쇄 소용돌이 14칸 → 소용돌이 6칸');
 ok(wb.points.every((p,i)=>p[0]===Q(400,200,120,80)[i][0]&&p[1]===Q(400,200,120,80)[i][1]),'⑧ 자리·크기 그대로');
 ok(/gravity-well-front/.test(wf.sourcePath)&&hue(wf),'⑧ 우물 앞 고리는 그림 그대로 언주 색');}
// ⑨
{const w=ready();const eb=img('r111:ego-back','effect','http://x/m0/assets/r100/sig-aura-violet.webp',Q(0,0,9,9)),ef=img('r111:ego-front','effect','http://x/m0/assets/r100/sig-aura-violet.webp',Q(0,0,9,9));
 const fire=img('r106d2s:7','effect','r108eden:fire#164,98,255|226,232,242',Q(0,0,9,9)),fire2=img('r106d2s:9','effect','r108eden:fire#150,70,255|232,214,255',Q(0,0,9,9)),other=img('r106d2s:8','effect','r108eden:fire#255,120,40|255,230,180',Q(0,0,9,9));
 const out=w.frame([body(),eb,ef,fire,fire2,other]);const by=id=>out.find(c=>c.owner.id===id);
 ok(hue(by('r111:ego-back'))&&hue(by('r111:ego-front')),'⑨ EGO 오라 → 언주');ok(hue(by('r106d2s:7'))&&hue(by('r106d2s:9'))&&!hue(by('r106d2s:8')),'⑨ 라우렌 보라 에덴 불만 언주, 다른 색은 그대로');}
// ⑬
{const mk=(on)=>{const w=ready();if(!on)w.api().setForm(false);const own={id:'r561:well:1.15:disk',kind:'effect',pxfSide:'hero'};
  const disk={kind:'fill',key:'r561:well:1.15:disk:0',owner:own,paths:[],style:{globalAlpha:.82,fillStyle:{kind:'radial',args:[0,0,0,0,0,9],stops:[{offset:0,color:'rgba(8,2,16,.95)'},{offset:.45,color:'rgba(74,26,120,.55)'},{offset:1,color:'rgba(74,26,120,0)'}]},strokeStyle:'#000',filter:'none'}};
  const ring={kind:'stroke',key:'r561:well:1.15:disk:1',owner:own,paths:[],style:{strokeStyle:'rgba(200,160,223,.75)',fillStyle:'#080e16',filter:'none'}};
  const core={kind:'fill',key:'r561:well:1.15:core:23',owner:{id:'r561:well:1.15:core',kind:'effect',pxfSide:'hero'},paths:[],style:{fillStyle:'rgba(4,0,10,.96)',strokeStyle:'rgba(240,216,255,.9)',filter:'none'}};
  const grey={kind:'stroke',key:'r561:well:1.15:core:2',owner:{id:'r561:well:1.15:core',kind:'effect'},paths:[],style:{strokeStyle:'rgba(200,200,200,.5)'}};
  return w.frame([body(),disk,ring,core,grey]);};
 const rgba=s=>{const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(String(s));return m?[+m[1],+m[2],+m[3],m[4]==null?1:+m[4]]:null;};
 const red=c=>c&&c[0]>c[2]&&c[0]>=c[1];
 const out=mk(true),d=out.find(c=>c.key==='r561:well:1.15:disk:0'),r=out.find(c=>c.key==='r561:well:1.15:disk:1'),k=out.find(c=>c.key==='r561:well:1.15:core:23'),g=out.find(c=>c.key==='r561:well:1.15:core:2');
 const mid=rgba(d.style.fillStyle.stops[1].color),edge=rgba(d.style.fillStyle.stops[2].color),rc=rgba(r.style.strokeStyle),kc=k?rgba(k.style.strokeStyle):[255,0,0,1],kf=k?rgba(k.style.fillStyle):[0,0,0,1]; // R1120b(사용자 11-17 10:12Z "문제 다 고쳐"): 코어 선·채우기는 일식 시트 칸으로 바뀌어 빠질 수 있다 → 빠졌으면 통과
 ok(red(mid)&&mid[3]===.55&&edge[3]===0,'⑬ 우물 원반 보라 → 언주(알파 유지) '+d.style.fillStyle.stops.map(s=>s.color).join(' '));
 ok(red(rc)&&rc[3]===.75&&red(kc),'⑬ 우물 테·코어 테두리 → 언주 '+r.style.strokeStyle+' / '+(k?k.style.strokeStyle:'코어는 일식 시트로'));
 ok(kf&&kf[0]+kf[1]+kf[2]<40&&(g?g.style.strokeStyle==='rgba(200,200,200,.5)':!k),'⑬ 검정 심·회색은 그대로('+(k?k.style.fillStyle:'코어는 일식 시트로')+', '+(g?g.style.strokeStyle:'-')+')');
 const off=mk(false);ok(off.find(c=>c.key==='r561:well:1.15:disk:1').style.strokeStyle==='rgba(200,160,223,.75)','⑬ 형상이 아니면 그대로');}
// ⑭
{const w=ready();const P=()=>w.C.__STORYWORLD_PIXELFX_R163__;const L={a:[90,54,140],b:[226,232,242]},O={a:[140,66,22],b:[255,230,180]};
 P().play('pvfx-warm-explosion',1,1,{tint:L,k:1.35});P().play('pvfx-x',1,1,{tint:O});w.api().setForm(false);P().play('pvfx-warm-explosion',1,1,{tint:L});
 const [a,b,c]=w.C.pfx;ok(a&&a.tint.a[0]>a.tint.a[2]&&a.k===1.35&&a.tint.b.join()==='226,232,242','⑭ 라우렌 보라 색조 → 언주('+JSON.stringify(a&&a.tint)+'), 다른 옵션 유지');
 ok(b&&b.tint.a.join()==='140,66,22'&&c&&c.tint.a.join()==='90,54,140','⑭ 다른 색조·형상 아님은 그대로');
 w.api().setForm(true);P().frameAt('mob-stone',.5,1,1,{tint:L});const f=w.C.pfxF[0];ok(f&&f.tint.a.join()==='90,54,140','⑭ frameAt(영웅 이펙트 안 돌 결정)은 색조 그대로 — 언주 돌리기와 겹치지 않게('+JSON.stringify(f&&f.tint)+')');}
// ⑩
{const w=world();w.api().setForm(true);const dup=body(LB);dup.key='hero:2:dup';const out=w.frame([body(),dup]);
 ok(out.every(c=>!/^r1113:/.test(c.sourcePath)),'⑩ 그림 준비 전엔 몸·복제 모두 원래대로');}
// ⑪
{const w=ready();w.api().setForm(false);const W='http://x/m0/assets/r561/lauren/';const dup=body(LB);dup.key='hero:2:dup';
 const out=w.frame([body(),dup,img('r561:well:1:back','effect',W+'lauren-gravity-well-back.webp',Q(0,0,9,9)),img('r111:ego-back','effect','x/sig-aura-violet.webp',Q(0,0,9,9))]);
 ok(out.every(c=>!/^r1113:|r1119/.test(c.sourcePath)&&!hue(c)),'⑪ 라우렌(형상 아님)이면 아무것도 안 바꿈');}
// ⑫
{const y=fs.readFileSync(path.join(ROOT,'../.github/workflows/pages.yml'),'utf8');ok(y.includes('node r96/qa/r1120/persona-hero-own-cpu-check.cjs'),'⑫ CI(pages.yml)에 이 검사 줄');}
console.log(fails?'R1120 persona-hero-own FAILED '+fails:'R1120 persona-hero-own OK');process.exit(fails?1:0);
