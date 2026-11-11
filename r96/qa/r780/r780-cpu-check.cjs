// R780 CPU 검사: 스토리월드풍 마우스 포인터(cursor-r780.js) — 사용자 2026-11-11 "마우스 포인터 롤처럼 느낌있게 참조해서 스토리월드풍으로 녹여내셈 지정상호작용도".
//  ① 상태별 커서: 바닥(이동) · 적(공격) · 사람(대화) · 문·상자·제단·출구(사용) · 구슬·쪽지(줍기) · 오른쪽 단추 누름(조준) · 막힌 바닥(이동 불가) · 창·로딩(기본).
//     적 판정은 엔진 클릭 판정(index.html canvas pointerdown)과 똑같아야 한다 — 커서가 '공격'이면 클릭도 그 적을 친다.
//  ② 클릭 표시: 엔진이 클릭을 처리한 뒤 결과(route·command)를 보고 이동(금실 고리)·공격(붉은 고리, 적을 따라감)·막힘(붉은 끊긴 고리)·조준 표시를 남긴다.
//  ③ 경계: 죽은 적·교전 전 보스는 공격 아님, 판정 상자 바로 밖은 아님, 열린 상자는 사용 아님, 터치는 커서 안 바꿈, 끄기 설정, 표시 개수 상한, 수명.
//  ④ 렉: 커서 style 은 상태가 바뀔 때만 쓴다, 판정은 프레임마다가 아니라 짧은 간격으로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','cursor-r780.js');ok(fs.existsSync(F),'cursor-r780.js exists');const src=fs.readFileSync(F,'utf8');

function fakeCtx(log){const c={log,save(){},restore(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},bezierCurveTo(){},arc(){},ellipse(){},rect(){},fill(){log.push('fill');},stroke(){log.push('stroke');},
 fillRect(){},clearRect(){log.push('clear');},translate(){},rotate(){},scale(){},setTransform(){},setLineDash(){},createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};},fillText(){},drawImage(){}};return c;}
function world({store={},enemies=[],props=[],objective={x:20,y:20},blockedFn=null,started=true,modal=null,loading=false,engineAfter=false}={}){
 const listeners={},raf=[],docListeners={};const log=[];let made=0;
 const mk=(tag)=>{const el={tagName:String(tag).toUpperCase(),style:{},children:[],width:0,height:0,id:'',textContent:'',appendChild(c){this.children.push(c);c.parentElement=this;return c;},
   getContext(){return fakeCtx(log);},toDataURL(){made++;return 'data:image/png;base64,ICON'+made;},addEventListener(){},setAttribute(k,v){this[k]=v;},remove(){}};return el;};
 const canvas=mk('canvas');canvas.id='game';canvas.style.cursor='crosshair';canvas.clientWidth=1280;canvas.clientHeight=676;
 canvas.addEventListener=(t,f,o)=>{(listeners[t]||(listeners[t]=[])).push(f);};canvas.getBoundingClientRect=()=>({left:0,top:44,width:1280,height:676});
 const stage=mk('div');stage.id='stage';const head=mk('head');
 const document={createElement:mk,head,body:mk('body'),getElementById:id=>id==='game'?canvas:id==='stage'?stage:id==='r780Cursor'?head.children.find(c=>c.id==='r780Cursor')||null:null,
  addEventListener:(t,f)=>{(docListeners[t]||(docListeners[t]=[])).push(f);},hidden:false};
 const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,RegExp,Date,console,document,devicePixelRatio:1,
  performance:{now:()=>ctx.__now},__now:0,requestAnimationFrame:f=>{raf.push(f);return raf.length;},addEventListener:(t,f)=>{(docListeners['w:'+t]||(docListeners['w:'+t]=[])).push(f);},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},setTimeout:f=>{f();return 1;}};ctx.window=ctx;vm.createContext(ctx);
 ctx.canvas=canvas;ctx.__enemies=enemies;ctx.__props=props;ctx.__objective=objective;ctx.__blocked=blockedFn||(()=>false);
 vm.runInContext(`var started=${started},modal=${JSON.stringify(modal)},loading=${loading},storyScene=null,W=1280,H=676,TILE=32,zoom=1,cam={x:10,y:10},time=0,
  player={x:10,y:10,hp:100},route=[],command=null,target=null,zone='z1',regionById={z1:{exits:{n:'z2'}}},
  room={id:'z1',engaged:false,enemies:__enemies,props:__props,objective:__objective};
  function project(x,y){return{x:(x-y-cam.x+cam.y)*TILE*zoom+W/2,y:(x+y-cam.x-cam.y)*TILE*.5*zoom+H*.52}}
  function unproject(x,y){const a=(x-W/2)/(TILE*zoom)+cam.x-cam.y,b=(y-H*.52)/(TILE*.5*zoom)+cam.x+cam.y;return{x:(a+b)/2,y:(b-a)/2}}
  function actorHeight(){return 66*zoom}
  function liveEnemies(){return(room?.enemies||[]).filter(e=>e.hp>0&&(!e.boss||room.engaged))}
  function exitPoint(d){return d==='n'?{x:15,y:1.35}:{x:28.65,y:15}}
  function blocked(x,y){return __blocked(x,y);}
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  `,ctx);const ENGINE=`
  // 엔진 클릭(index.html 416 그대로의 판정)
  canvas.addEventListener('pointerdown',ev=>{if(!started||modal||loading)return;const rect=canvas.getBoundingClientRect(),x=ev.clientX-rect.left,y=ev.clientY-rect.top;let chosen=null,best=Infinity;if(ev.button!==2)for(const e of liveEnemies()){const q=project(e.x,e.y),h=actorHeight()*(e.boss?2.05:1);if(Math.abs(x-q.x)<h*.48&&y>q.y-h&&y<q.y+9){const d=Math.hypot(x-q.x,y-(q.y-h*.5));if(d<best){chosen=e;best=d}}}if(chosen){target=chosen.id;command=chosen.id;route=[];}else{const p=unproject(x,y);route=__blocked(p.x,p.y)?[]:[p];command=null;target=null;}});`;
 if(engineAfter){vm.runInContext(src,ctx);vm.runInContext(ENGINE,ctx);}else{vm.runInContext(ENGINE,ctx);vm.runInContext(src,ctx);}
 const fire=(t,ev)=>{const e={preventDefault(){},stopPropagation(){},pointerType:'mouse',button:0,buttons:0,target:canvas,...ev};for(const f of listeners[t]||[])f(e);for(const f of docListeners['w:'+t]||[])f(e);};// 캔버스(대상 단계) → window(거품 단계)
 const api=ctx.__STORYWORLD_CURSOR_R780__;
 const frame=(dt=.1)=>{ctx.__now+=dt*1000;const fs=raf.splice(0);for(const f of fs)f(ctx.__now);};
 return {ctx,api,canvas,stage,head,fire,frame,log,run:s=>vm.runInContext(s,ctx)};}
// 화면 좌표(캔버스 안) ↔ 클라이언트 좌표(위 44px 머리줄)
const at=(w,x,y)=>{const q=w.run(`project(${x},${y})`);return q;};
const move=(w,sx,sy,ev={})=>{w.fire('pointermove',{clientX:sx,clientY:sy+44,...ev});w.frame();};

{const w=world();ok(w.api&&typeof w.api.classify==='function','API classify');ok(typeof w.api.inspect==='function','API inspect');
 const K=w.api.kinds;for(const k of ['move','attack','talk','use','pickup','aim','blocked','ui'])ok(K.includes(k),'kind '+k);
 // 모든 커서: 그림(data:image/png) + 찍는 점 + 예비 키워드. 바늘 끝(왼쪽 위)이 찍는 점, 조준만 가운데.
 for(const k of K){const c=w.api.css(k);ok(/^url\("data:image\/png[^"]+"\) \d+ \d+, [a-z-]+$/.test(c),'css '+k+' = '+c.slice(0,60));}
 const hs=k=>w.api.css(k).match(/\) (\d+) (\d+),/).slice(1).map(Number);
 for(const k of ['move','attack','talk','use','pickup','blocked','ui'])ok(hs(k)[0]<=4&&hs(k)[1]<=4,'hotspot at needle tip for '+k+' '+hs(k));
 ok(hs('aim')[0]>=12&&hs('aim')[1]>=12,'aim hotspot centred '+hs('aim'));
 ok(new Set(K.map(k=>w.api.css(k).match(/base64,(\w+)/)[1])).size===K.length,'every state has its own picture');
 // 창·단추에도 같은 그림체(기본 바늘·누르는 바늘)
 const st=w.head.children.find(c=>c.id==='r780Cursor');ok(st&&/url\("data:image\/png/.test(st.textContent)&&/button/.test(st.textContent),'page style gives HUD/buttons the needle cursor');
 ok(/input\[type=text\]|textarea/.test(st.textContent),'text fields keep the text caret');
 // 겹 캔버스: 무대 안, 클릭을 가로채지 않음
 const ov=w.stage.children.find(c=>c.id==='r780Marks');ok(ov&&ov.style.pointerEvents==='none','overlay canvas in stage with pointer-events none');}

{// ① 적 위 = 공격, 판정은 엔진과 같다
 const E={id:'e1',x:12,y:11,hp:10};const w=world({enemies:[E]});const q=at(w,12,11);
 move(w,q.x,q.y-30);ok(w.api.inspect().hover.kind==='attack','over enemy body → attack');ok(w.api.inspect().hover.targetId==='e1','hover target id');
 ok(w.canvas.style.cursor===w.api.css('attack'),'canvas cursor set to attack');
 // 같은 자리 클릭 → 엔진도 그 적을 고른다(커서와 클릭이 같은 답)
 w.fire('pointerdown',{clientX:q.x,clientY:q.y-30+44});ok(w.run('command')==='e1','engine targets the same enemy');
 const m=w.api.markers().at(-1);ok(m&&m.kind==='attack'&&m.targetId==='e1','attack click marker follows the enemy');
 // 경계: 판정 상자 바로 바깥(가로 0.48h, 아래 +9)
 const h=66;move(w,q.x+h*.48+1,q.y-30);ok(w.api.inspect().hover.kind!=='attack','just outside the hit box (x) → not attack');
 move(w,q.x,q.y+10);ok(w.api.inspect().hover.kind!=='attack','just below the feet (+10) → not attack');
 move(w,q.x+h*.48-1,q.y+8);ok(w.api.inspect().hover.kind==='attack','inside edge → attack');
 // 죽은 적
 E.hp=0;move(w,q.x,q.y-30);ok(w.api.inspect().hover.kind!=='attack','dead enemy → not attack');}
{// 교전 전 보스는 엔진도 클릭 대상이 아니다 → 공격 아님, 교전 후엔 공격(보스는 판정 키 2.05배)
 const B={id:'b',x:12,y:11,hp:100,boss:true};const w=world({enemies:[B]});const q=at(w,12,11);
 move(w,q.x,q.y-100);ok(w.api.inspect().hover.kind!=='attack','boss before engage → not attack');
 w.run('room.engaged=true');move(w,q.x,q.y-100);ok(w.api.inspect().hover.kind==='attack','engaged boss tall hit box → attack');}
{// 겹친 적: 엔진처럼 몸 가운데에 가장 가까운 적
 const A={id:'a',x:12,y:11,hp:5},B={id:'b',x:12.3,y:11.3,hp:5};const w=world({enemies:[A,B]});const qb=at(w,12.3,11.3);
 move(w,qb.x,qb.y-33);ok(w.api.inspect().hover.targetId==='b','nearest body centre wins like the engine');}

{// 사람(대화)·문·상자·출구·제단(사용)·구슬·쪽지(줍기)
 const npc={id:'n1',x:13,y:9,r75NPC:true},door={id:'d1',x:8,y:12,r74Door:true},chest={id:'c1',x:11,y:7,chestR103:'k1'},open={id:'c2',x:7,y:7,chestR103:'k2'},orb={id:'o1',x:9,y:9,r108Orb:true},hid={id:'n2',x:6,y:13,r75FortPerson:true,visible:false};
 const w=world({props:[npc,door,chest,open,orb,hid]});w.run(`window.__STORYWORLD_GROWTH_R103__={state:()=>({opened:['k2']})};window.__STORYWORLD_STORY_COLLECT_R177__={inspect:()=>({docs:()=>[{key:'q',x:14,y:12}]})};`);
 const t=(x,y,lift=20)=>{const q=at(w,x,y);move(w,q.x,q.y-lift);return w.api.inspect().hover;};
 ok(t(13,9).kind==='talk','NPC → talk');ok(t(8,12).kind==='use','door → use');ok(t(11,7).kind==='use','closed chest → use');
 ok(t(7,7).kind!=='use','opened chest → not use');ok(t(9,9,6).kind==='pickup','orb → pickup');ok(t(14,12,6).kind==='pickup','note on floor → pickup');
 ok(t(6,13).kind!=='talk','hidden NPC → not talk');
 // 목표(제단·기억 표식)·출구
 const w2=world({objective:{x:12,y:12}});const q=at(w2,12,12);move(w2,q.x,q.y-20);ok(w2.api.inspect().hover.kind==='use','objective → use');
 const qe=at(w2,15,1.35);move(w2,qe.x,qe.y-5);ok(w2.api.inspect().hover.kind==='use','exit → use');
 // 적이 사람보다 앞선다(같은 자리면 클릭이 공격이므로)
 const w3=world({enemies:[{id:'e',x:13,y:9,hp:3}],props:[{id:'n',x:13,y:9,r75NPC:true}]});const q3=at(w3,13,9);move(w3,q3.x,q3.y-20);ok(w3.api.inspect().hover.kind==='attack','enemy outranks NPC on the same spot');}

{// 바닥: 이동 / 막힌 곳: 이동 불가 / 오른쪽 단추 누름: 조준 / 창·로딩: 기본
 const w=world({blockedFn:(x,y)=>x<9});const q=at(w,12,12);move(w,q.x,q.y);ok(w.api.inspect().hover.kind==='move','open floor → move');
 const qb=at(w,5,12);move(w,qb.x,qb.y);ok(w.api.inspect().hover.kind==='blocked','deep in a wall → blocked');
 const qe=at(w,9.3,12);move(w,qe.x,qe.y);ok(w.api.inspect().hover.kind==='move','floor next to a wall (still reachable) → move');
 move(w,q.x,q.y,{buttons:2});ok(w.api.inspect().hover.kind==='aim','right button held → aim');
 // 막힌 곳 클릭 → 엔진 route 비고 command 없음 → 막힘 표시
 w.fire('pointerdown',{clientX:qb.x,clientY:qb.y+44});ok(w.api.markers().at(-1)?.kind==='blocked','blocked click → broken-ring marker');
 w.fire('pointerdown',{clientX:q.x,clientY:q.y+44});const mm=w.api.markers().at(-1);ok(mm?.kind==='move'&&Math.abs(mm.x-12)<.01&&Math.abs(mm.y-12)<.01,'move click → gold marker at the clicked floor point');
 w.fire('pointerdown',{clientX:q.x,clientY:q.y+44,button:2});ok(w.api.markers().at(-1)?.kind==='aim','right click → aim marker');
 // 수명·상한
 for(let i=0;i<20;i++)w.fire('pointerdown',{clientX:q.x+i,clientY:q.y+44});ok(w.api.markers().length<=6,'markers capped ('+w.api.markers().length+')');
 for(let i=0;i<12;i++)w.frame(.1);ok(w.api.markers().length===0,'markers expire');
 // 창이 떠 있으면 기본 커서, 클릭 표시 없음
 w.run("modal='menu'");move(w,q.x,q.y);ok(w.api.inspect().hover.kind==='ui','modal open → plain needle');const before=w.api.markers().length;w.fire('pointerdown',{clientX:q.x,clientY:q.y+44});ok(w.api.markers().length===before,'no marker while modal');
 w.run("modal=null;loading=true");move(w,q.x,q.y);ok(w.api.inspect().hover.kind==='ui','loading → plain needle');}

{// 회귀(헤드리스 실측): 클릭 결과를 엔진 처리 전에 읽으면 적 클릭이 '막힘'으로 보였다 → 리스너 순서와 상관없이 엔진 뒤에 읽는다
 const E={id:'e1',x:12,y:11,hp:10};const w=world({enemies:[E],engineAfter:true});const q=at(w,12,11);
 w.fire('pointerdown',{clientX:q.x,clientY:q.y-30+44});ok(w.run('command')==='e1','engine (registered later) targets the enemy');ok(w.api.markers().at(-1)?.kind==='attack','marker reads the engine result even when the engine listener is added later');
 const g=at(w,12.5,12.5);w.fire('pointerdown',{clientX:g.x,clientY:g.y+44});ok(w.api.markers().at(-1)?.kind==='move','ground click after a later engine listener → move');
 // 다른 대상(창 단추 등)을 누른 것은 표시하지 않는다
 const n0=w.api.markers().length;w.fire('pointerdown',{clientX:g.x,clientY:g.y+44,target:{id:'panelBtn'}});ok(w.api.markers().length===n0,'pointerdown on another element → no marker');}
{// 렉: style 은 바뀔 때만, 판정은 간격을 두고
 const w=world();const q=at(w,12,12);move(w,q.x,q.y);const s0=w.api.inspect().styleWrites;for(let i=0;i<30;i++)move(w,q.x+i,q.y);ok(w.api.inspect().styleWrites===s0,'no style writes while state unchanged');
 const c0=w.api.inspect().classifies;for(let i=0;i<10;i++){w.fire('pointermove',{clientX:q.x+i,clientY:q.y+44});}ok(w.api.inspect().classifies===c0,'pointermove itself does not classify');
 w.ctx.__now+=10;const f0=w.api.inspect().classifies;w.frame(.01);ok(w.api.inspect().classifies===f0,'classify throttled inside 50ms');}
{// 터치: 커서 안 바꿈(표시는 남김) · 마우스가 캔버스를 떠나면 지움
 const w=world();const q=at(w,12,12);const c0=w.canvas.style.cursor;w.fire('pointermove',{clientX:q.x,clientY:q.y+44,pointerType:'touch'});w.frame();ok(w.canvas.style.cursor===c0,'touch move leaves cursor alone');
 w.fire('pointerdown',{clientX:q.x,clientY:q.y+44,pointerType:'touch'});ok(w.api.markers().at(-1)?.kind==='move','touch tap still shows the move marker');
 move(w,q.x,q.y);w.fire('pointerleave',{});w.frame();ok(w.api.inspect().hover===null,'pointer leaves → no hover');}
{// 끄기: 설정 off 면 엔진 그대로(십자선), 표시 없음
 const w=world({store:{'storyworld.r780.cursor':'off'}});const q=at(w,12,12);move(w,q.x,q.y);ok(w.canvas.style.cursor==='crosshair','off → engine crosshair kept');
 w.fire('pointerdown',{clientX:q.x,clientY:q.y+44});ok(w.api.markers().length===0,'off → no markers');ok(!w.head.children.find(c=>c.id==='r780Cursor'),'off → no page style');}
{// 그리기: 표시가 있을 때만 그리고, 없으면 한 번 지운 뒤 쉰다
 const w=world({enemies:[{id:'e1',x:12,y:11,hp:10}]});const q=at(w,12,12);w.fire('pointerdown',{clientX:q.x,clientY:q.y+44});w.log.length=0;w.frame(.05);ok(w.log.includes('stroke'),'marker drawn');
 for(let i=0;i<12;i++)w.frame(.1);w.log.length=0;w.frame(.1);w.frame(.1);ok(!w.log.includes('stroke')&&w.log.filter(x=>x==='clear').length===0,'idle: no drawing, no clearing');
 const qe=at(w,12,11);move(w,qe.x,qe.y-30);w.log.length=0;w.frame(.05);ok(w.log.includes('stroke'),'hovered enemy gets a ground ring');}
console.log('R780 cursor CPU check passed: '+n+' assertions');
