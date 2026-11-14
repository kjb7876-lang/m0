'use strict';
// R1039 영웅 EGO 오라·피격/적중 — 코드 그림(R106 1장 그림·선 줄기)을 손그림 프레임 시트(R100 sig-aura·sig-gather 12칸)로 — CPU 검사.
// 사용자 2026-11-14 12:10Z·13:53Z "영웅들 스킬이펙트 … 코드로 아직 스킬 구현해서 어색한 것 … 프레임 애니메이션으로, 가장 시급하게".
//  ① 빌드 연결(사본·태그 위치·verify 목록·pages.yml·manifest)
//  ② EGO 범위(r111:ego-back/front) 안: R106 1장 그림이 하나도 안 그려지고, 영웅색 sig-aura(12칸 반복)·sig-gather(발동 1회) 칸이 시간에 따라 바뀜
//  ③ R101 피격·적중 범위(r101:N) 안: 선 줄기(stroke)·R106 고리가 빠지고, 범위를 나오면 stroke 가 원래대로
//  ④ 그림이 아직 없으면 원래 그림 그대로(효과가 사라지지 않음), 끄기 설정이면 손대지 않음, NaN 좌표에도 던지지 않음
//  ⑤ 시트: 8영웅 색 sig-aura·sig-gather 파일이 있고 칸마다 그림이 있어 서로 다름(정지 그림 아님)
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='ego-paint-r1039.js',src=rd(path.join(R,'client-source',NAME));
// ① 빌드 연결
ok(src.length>0,NAME+' 존재');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html')),tag='<script src="./'+NAME+'"></script>';
ok(html.includes(tag)&&html.indexOf(tag)>html.indexOf('<script src="./play-r111.js">')&&html.indexOf(tag)>html.indexOf('<script src="./polish-r101.js">')&&html.indexOf(tag)<html.indexOf('<script src="./combat-r118.js">'),'index.html 태그(play-r111·polish-r101 뒤, combat-r118 앞)');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1039/r1039-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=rd(path.join(R,'runtime-manifest.json')),inp=rd(path.join(R,'runtime-inputs.json'));
ok(man.includes(NAME)&&inp.includes(NAME),'runtime-manifest·runtime-inputs 에 모듈');
// ⑤ 시트(R100 손그림 원화 F248·F114 를 영웅색으로 칠한 12칸)
const COL={hwando:'pale',seoha:'cyan',neon:'teal',michaela:'magenta',lauren:'violet',hunter:'orange',slayer:'red',gunner:'blue'};
for(const c of new Set(Object.values(COL)))for(const k of ['aura','gather']){const p='assets/r100/sig-'+k+'-'+c+'.webp';ok(fs.existsSync(path.join(R,'runtime-text',p))&&man.includes(p),`시트 ${p} 있음·manifest 등록`);}
const stats=(()=>{try{return JSON.parse(rd(path.join(__dirname,'sheet-stats.json')));}catch(_){return null;}})();
ok(!!stats&&Object.keys(stats).length>=16,'시트 칸 통계(sheet-stats.json, scripts/r1039-sheet-stats.py) 16장');
for(const [p,s] of Object.entries(stats||{}))ok(s.frames===12&&s.alpha.every(a=>a>0)&&s.distinct>=8,`${p} 12칸 모두 그림·서로 다른 칸 ${s.distinct}/11`);
// ②~④ 게임 전역을 흉내 낸 상자
function sandbox({prefs,images=true,hero='michaela'}={}){const store=new Map();if(prefs)store.set('storyworld.r1039.paint',prefs);
 const filters=[],r106=[],drawn=[];
 const S106={addFilter:f=>{filters.push(f);return filters.length;},draw:(name)=>{for(const f of filters)if(f(name,{})===false)return true;r106.push(name);return true;}};
 class DC{constructor(){this.commands=[];this.globalAlpha=1;this.globalCompositeOperation='source-over';this.filter='none';}
  scope(o,fn){return fn();}save(){}restore(){}stroke(){this.commands.push('stroke');}fill(){this.commands.push('fill');}
  drawImage(im,...a){drawn.push({path:im.path,sx:a[0],sy:a[1],sw:a[2],sh:a[3],dx:a[4],dy:a[5],dw:a[6],dh:a[7],alpha:this.globalAlpha});}}
 const ctx=new DC();
 const w={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Date,Promise,Error,isFinite,setTimeout:()=>0,clearTimeout:()=>0,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  StoryPhase1:{DrawCommands:DC},__STORYWORLD_FX_SPRITES_R106__:S106,
  player:{hero,x:10,y:10,visualLiftPx:0},time:5,ctx,project:(x,y)=>({x:x*32,y:y*32}),actorHeight:()=>60,
  readyImage:p=>images?{image:{path:p,width:2304,height:192}}:null,addImage:()=>{},tick:function(){}};
 w.window=w;w.globalThis=w;vm.createContext(w);let err=null;try{vm.runInContext(src,w,{filename:NAME});}catch(e){err=e;}
 return {w,ctx,r106,drawn,err};}
const B=sandbox(),A=B.w.__STORYWORLD_EGO_PAINT_R1039__;
ok(!B.err&&!!A&&typeof A.inspect==='function','전역 __STORYWORLD_EGO_PAINT_R1039__ (inspect)');
const ego=(box,id,t)=>{box.w.time=t;box.ctx.scope({id,kind:'effect',x:10,y:10},()=>{for(const nm of ['glow','ring','flame','flame','spike','spike','spark','bolt'])box.w.__STORYWORLD_FX_SPRITES_R106__.draw(nm);});};
// ② EGO
for(let i=0;i<30;i++){ego(B,'r111:ego-back',5+i/30);ego(B,'r111:ego-front',5+i/30);}
ok(B.r106.length===0,`EGO 범위 안 R106 1장 그림 0 (그려진 것 ${B.r106.length})`);
const aura=B.drawn.filter(d=>d.path==='assets/r100/sig-aura-magenta.webp'),gather=B.drawn.filter(d=>d.path==='assets/r100/sig-gather-magenta.webp');
ok(aura.length>=30,`미카엘라 EGO = 핏빛 장미(magenta) sig-aura 그림 (${aura.length}번)`);
ok(new Set(aura.map(d=>d.sx)).size>=8,`sig-aura 칸이 시간 따라 바뀜(서로 다른 칸 ${new Set(aura.map(d=>d.sx)).size})`);
ok(gather.length>0&&new Set(gather.map(d=>d.sx)).size>=6,`발동 순간 sig-gather 소용돌이 1회(칸 ${new Set(gather.map(d=>d.sx)).size}종)`);
ok(B.drawn.every(d=>[d.dx,d.dy,d.dw,d.dh].every(Number.isFinite)&&d.dw>0&&d.dh>0&&d.alpha>=0&&d.alpha<=1),'그린 좌표·크기 유한, 알파 0~1');
ok(aura.every(d=>d.dw>=60*1.5&&d.dw<=60*3),'EGO 오라 크기 = 영웅 키 1.5~3배');
const B2=sandbox({hero:'neon'});for(let i=0;i<5;i++)ego(B2,'r111:ego-back',5+i/10);
ok(B2.drawn.some(d=>d.path==='assets/r100/sig-aura-teal.webp')&&!B2.drawn.some(d=>/magenta/.test(d.path)),'네온 EGO = 민트(teal) sig-aura');
// EGO 밖 R106 은 그대로
B.r106.length=0;B.ctx.scope({id:'r101:aura-back:hero',kind:'effect',r101:true},()=>B.w.__STORYWORLD_FX_SPRITES_R106__.draw('halo'));
ok(B.r106.length===1,'EGO·피격 밖(상시 오라 후광) R106 그림은 그대로');
// ③ R101 피격·적중
B.ctx.commands.length=0;B.r106.length=0;
B.ctx.scope({id:'r101:42',kind:'effect',x:10,y:10,r101:true},()=>{B.ctx.stroke();B.ctx.stroke();B.ctx.fill();B.w.__STORYWORLD_FX_SPRITES_R106__.draw('ring');});
ok(B.ctx.commands.filter(c=>c==='stroke').length===0&&B.r106.length===0,'R101 피격·적중 범위: 선 줄기·R106 고리 0');
ok(B.ctx.commands.includes('fill'),'R101 범위의 채우기(손그림 sig 바탕 원)는 그대로');
B.ctx.commands.length=0;B.ctx.stroke();ok(B.ctx.commands.includes('stroke')&&!Object.prototype.hasOwnProperty.call(B.ctx,'stroke'),'범위를 나오면 stroke 원래대로(인스턴스에 흔적 없음)');
// ④ 그림 없음·끔·NaN
const N=sandbox({images:false});for(let i=0;i<5;i++)ego(N,'r111:ego-back',5+i/10);
ok(N.r106.length>0&&N.drawn.length===0,'그림이 아직 없으면 원래 R106 오라 그대로(효과 안 사라짐)');
const O=sandbox({prefs:'off'});for(let i=0;i<5;i++)ego(O,'r111:ego-back',5+i/10);O.ctx.scope({id:'r101:3',r101:true},()=>O.ctx.stroke());
ok(O.r106.length>0&&O.drawn.length===0&&O.ctx.commands.includes('stroke'),'끔 설정(storyworld.r1039.paint=off)이면 손대지 않음');
const X=sandbox();X.w.player.x=NaN;let threw=false;try{ego(X,'r111:ego-back',5);X.w.time=NaN;ego(X,'r111:ego-front',NaN);}catch(_){threw=true;}
ok(!threw&&X.drawn.every(d=>[d.dx,d.dy,d.dw,d.dh].every(Number.isFinite)),'NaN 좌표·시간에도 던지지 않고 NaN 을 그리지 않음');
ok(A&&A.frameLoop(12,NaN)===0&&A.frameOnce(12,-1,.9)===11&&A.frameOnce(12,.45,.9)===6&&A.frameLoop(12,1e9)>=0&&A.frameLoop(12,1e9)<12,'칸 번호 경계(NaN·음수·큰 시간)');
// 금지 필터·뒤집기(Three 기록기 Legacy 낙하·십자가 뒤집힘 방지)
ok(!/drop-shadow|blur\(/.test(src),'blur·drop-shadow 필터 없음');
ok(!/flipY|scale\([^)]*-1\s*\)/.test(src),'뒤집기(flipY·scale -1) 없음');
console.log(`\n${n-bad}/${n} 통과`);process.exitCode=bad?1:0;
