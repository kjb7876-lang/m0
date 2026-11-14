// R1034b 환도 수묵 검흔 — CPU 검사(정적 + 가짜 엔진). node r96/qa/r1034/r1034-ink-trace-cpu-check.cjs
//  사용자 2026-11-14 14:50Z "환도수묵화감성 많이살려줘 검흔": 환도 베기 자국을 Dots HI-07 먹 붓 획(한지 테두리 구운 시트)으로 남긴다.
//  기본 공격: 맞은 적을 가로지르는 먹 붓 획 한 줄. W 월섬 회천: 원 안 정십자가·분신 정십자가 자리마다 먹 붓 세로·가로 획(똑바른 십자만).
//  그림만 — 피해·판정·쿨다운은 건드리지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='hwando-ink-trace-r1034.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');const code=strip(src);
// ---- 정적 ----
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 일치');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok(html.split('"./'+F+'"').length===2,'index.html 스크립트 태그 한 번');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r1034\/r1034-ink-trace-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(/assets\/r945\/hwando-ink-sweep\.webp/.test(code)&&fs.existsSync(path.join(R,'runtime-text','assets','r945','hwando-ink-sweep.webp')),'Dots HI-07 먹 붓 획 시트를 씀(저장소에 있음)');
ok(!/hitEnemy/.test(code),'피해를 넣지 않음(hitEnemy 를 부르지도 감싸지도 않음, 그림만)');
// ---- 가짜 엔진 ----
function engine({hero='hwando',coop=null,lowFx=false,w348=true}={}){let clock=10;const imgs=[];
 const room={id:'r1',enemies:[{id:'a',x:21,y:20,hp:100,radius:.3},{id:'b',x:30,y:30,hp:100,radius:.3}]};const W={};
 const g={window:W,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,Set,Map,WeakMap,Array,Object,String,Number,Error,Promise,
  get time(){return clock;},TILE:32,zoom:1,room,settings:{lowFx},effects:[],
  player:{x:20,y:20,hp:100,hero,direction:'right',attackCD:0},project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,
  liveEnemies:()=>room.enemies.filter(e=>e.hp>0),readyImage:p=>({image:{src:p,width:2048,height:512}}),ensureImages:()=>Promise.resolve(),
  hitEnemy:(e,v)=>{e.hp-=v;return true;},
  basicAttack(){const p=g.player;if(p.attackCD>0)return;const e=room.enemies[0];if(Math.hypot(e.x-p.x,e.y-p.y)>3)return;p.attackCD=.5;g.hitEnemy(e,10,{kind:'basic'});},
  fx:()=>{},drawEffect:()=>{},tick:()=>{},enterRegion:async()=>true,
  ctx:{_a:0,_st:[],filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',commands:[],save(){this._st.push([this._a,this.filter,this.globalAlpha]);},restore(){const s=this._st.pop();if(s)[this._a,this.filter,this.globalAlpha]=s;},
   translate(){},scale(){},rotate(a){this._a+=a;},drawImage(im){imgs.push({src:im&&im.src,ang:this._a,filter:this.filter,alpha:this.globalAlpha});}}};
 if(coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 if(w348){W.__STORYWORLD_HWANDO_W_CROSS_R348__={config:{crossLife:.5,cloneIn:.2,hold:.7,slashLife:.42,ringCell:115/384*10,splash:1.5},on:()=>true,
  inspect:()=>({casts:g.__casts||[]})};}
 const ctx=vm.createContext(g);vm.runInContext(src,ctx,{filename:F});const api=W.__STORYWORLD_HWANDO_INK_TRACE_R1034__;
 const run=(s,dt=.033)=>{for(let t=0;t<s;t+=dt){clock+=dt;g.player.attackCD=Math.max(0,g.player.attackCD-dt);ctx.tick(dt);}};
 const frame=()=>{imgs.length=0;const S=g.effects.find(e=>e&&e.r1034Sentinel);if(S)ctx.drawEffect(S);return imgs.filter(i=>/hwando-ink-sweep/.test(i.src||''));};
 return {g,ctx,api,run,frame,imgs,setClock:v=>clock=v,clock:()=>clock};}
const DEG=a=>Math.abs(((a*180/Math.PI)%180+180)%180);
{const E=engine();ok(E.api&&E.api.on(),'전역 __STORYWORLD_HWANDO_INK_TRACE_R1034__ 켜짐');}
// 기본 공격
{const E=engine();E.ctx.basicAttack();let I=E.api.inspect();ok(I.stats.attack===1&&I.live===1,'환도 기본 공격이 맞으면 먹 검흔 한 줄');
 E.run(.15);const d=E.frame();ok(d.length>=1,'먹 붓 획 시트로 그림('+d.length+')');ok(d.every(x=>!/blur|drop/.test(x.filter||'')),'허용 필터만');
 E.run(1.5);I=E.api.inspect();ok(I.live===0&&!E.g.effects.some(e=>e&&e.r1034Sentinel),'검흔은 사라지고 표지도 뺌');}
{const E=engine();E.g.room.enemies[0].x=40;E.ctx.basicAttack();ok(E.api.inspect().stats.attack===0,'헛휘두름(아무도 안 맞음)은 검흔 없음');}
{const E=engine({hero:'seoha'});E.ctx.basicAttack();ok(E.api.inspect().stats.attack===0,'다른 영웅은 그대로');}
{const E=engine();E.g.room.enemies[0].x=NaN;E.g.hitEnemy=(e)=>true;E.ctx.basicAttack();E.run(.1);E.frame();const I=E.api.inspect();ok(I.errors===0,'적 좌표 NaN: 오류 0, 검흔 '+I.stats.attack);}
{const E=engine();for(let i=0;i<20;i++){E.g.player.attackCD=0;E.ctx.basicAttack();}ok(E.api.inspect().live<=E.api.config.max,'동시 검흔 상한 '+E.api.config.max);}
{const E=engine({lowFx:true});for(let i=0;i<20;i++){E.g.player.attackCD=0;E.ctx.basicAttack();}ok(E.api.inspect().live<=E.api.config.maxLow,'저사양 상한 '+E.api.config.maxLow);}
// W 월섬 회천: 정십자가 먹 획
{const E=engine();E.g.__casts=[{id:'wer:1',x:20,y:20,age:0,clones:[{x:25,y:20},{x:20,y:25}]}];
 E.ctx.fx('storySourceSkill',20,20,{storyWER:true,sourceHero:'hwando',sourceSlot:'w',stage:'release',castId:'wer:1'});
 E.ctx.fx('storySourceSkill',20,20,{storyWER:true,sourceHero:'hwando',sourceSlot:'w',stage:'release',castId:'wer:1'});
 ok(E.api.inspect().stats.wCasts===1,'W 시전 한 번만 받음(같은 castId)');
 E.run(.2);let d=E.frame();ok(d.length===2&&d.every(x=>DEG(x.ang)<1e-6||Math.abs(DEG(x.ang)-90)<1e-6),'원 안 정십자가 자리 먹 획 세로·가로 둘(기울기 없음)');
 const segs=E.api.inspect().lastSegs;const V=segs.find(s=>Math.abs(s.x0-s.x1)<1e-6),Hh=segs.find(s=>Math.abs(s.y0-s.y1)<1e-6);
 ok(V&&Hh&&V.y1>V.y0&&Hh.x1>Hh.x0,'세로는 위→아래, 가로는 왼→오른');const by=Hh.y0,top=by-V.y0,bot=V.y1-by;ok(top>0&&top/bot>.45&&top/bot<.6,'정십자가 비율(위 짧고 아래 긴) '+(top/bot).toFixed(2));
 E.g.__casts[0].age=1.0;E.run(.85);d=E.frame();ok(d.length===4&&d.every(x=>DEG(x.ang)<1e-6||Math.abs(DEG(x.ang)-90)<1e-6),'분신 둘 자리마다 정십자 먹 획(4)');
 E.run(2);ok(E.api.inspect().live===0,'W 먹 획 정리');}
{const E=engine();E.g.__casts=[{id:'wer:2',x:20,y:20,clones:[]}];E.ctx.fx('storySourceSkill',20,20,{storyWER:true,sourceHero:'hwando',sourceSlot:'e',stage:'release',castId:'e1'});ok(E.api.inspect().stats.wCasts===0,'W 말고 다른 슬롯은 없음');}
{const E=engine({w348:false});E.ctx.fx('storySourceSkill',20,20,{storyWER:true,sourceHero:'hwando',sourceSlot:'w',stage:'release',castId:'x'});E.run(.2);E.frame();ok(E.api.inspect().errors===0,'R348 없을 때도 오류 0(원 안 십자만)');}
{const E=engine();E.api.set(false);E.ctx.basicAttack();ok(E.api.inspect().stats.attack===0,'끄기 storyworld.r1034.inkTrace');E.api.set(true);}
{const E=engine();E.ctx.basicAttack();E.run(.1);E.g.ctx.commands=[{kind:'image',owner:{kind:'effect'}}];const cm=E.g.ctx.commands;const S=E.g.effects.find(e=>e&&e.r1034Sentinel);
 const di=E.g.ctx.drawImage;E.g.ctx.drawImage=function(im){cm.push({kind:'image',owner:{kind:'effect'}});return di.apply(this,arguments);};E.ctx.drawEffect(S);ok(cm.slice(1).every(c=>c.owner.r350===true),'검흔 명령은 R350 영웅 가림에서 뺌(owner.r350)');}
console.log(JSON.stringify({ok:true,checks:n,method:'static+fake-engine'}));
