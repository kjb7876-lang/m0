// R1350 CPU 검사: 기억사수 Q 회상 광선포 — 3D 영웅일 때 광선이 3D 소총 끝(EmissionFX)에서 나가고, 소총 방향 = 광선·판정선 방향,
//  발사 중 걸어서 소총이 돌면 광선 시작점·방향·판정선이 따라간다. 3D 가 꺼지면(또는 {"muzzle3d":false}) 예전 2D 총구 그대로.
//  사용자 11-27 "기억사수 회상광선포 언제나 정확히 총구에서 나가게" · "총구방향바뀌면 총구계속따라가게".
//  node r96/qa/r1350/r1350-cpu-check.cjs   — 실제 화면(헤드리스) 측정은 r1350-browser.mjs
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),src=fs.readFileSync(path.join(R,'client-source','gunner-arms-r561.js'),'utf8');
let pass=0,fail=0;const ok=(n,c,d)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,600));}};
const TILE=64,D=Math.PI/180;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),ad=(a,b)=>Math.abs(wrap(a-b))/D;
const screenOf=a=>Math.atan2((Math.cos(a)+Math.sin(a))*.5,Math.cos(a)-Math.sin(a));
const groundFor=s=>{const dx=(Math.cos(s)+2*Math.sin(s))/2,dy=(2*Math.sin(s)-Math.cos(s))/2;return Math.atan2(dy,dx);};
// 가짜 three: 영웅 묶음(위치·Y 회전·크기) 안 소총 끝·받침점(몸 기준 좌표). 자세(R1320)는 장면 onBeforeRender 다음, 메시 onBeforeRender 전에 걸린다고 본다.
function V(x=0,y=0,z=0){return {x,y,z,set(a,b,c){this.x=a;this.y=b;this.z=c;return this;}};}
function fakeThree(sb){
 const TIP={x:-.18,y:1.32,z:.62},SUP={x:-.2,y:1.3,z:.2};// 몸 기준(앞 +Z): 오른쪽 어깨 앞 총구·받침
 const g={name:'r1305-gunner-3d-shared',visible:true,rotation:{y:Math.PI*.75},position:V(10,0,10),children:[],parent:null,updateMatrixWorld(){}};
 const world=l=>{const y=g.rotation.y,c=Math.cos(y),s=Math.sin(y);return V(g.position.x+l.x*c+l.z*s,g.position.y+l.y,g.position.z-l.x*s+l.z*c);};
 const tip={name:'EmissionFX',getWorldPosition:()=>world(TIP)},sup={name:'SW_MEMORY_ARC_RIFLE_MESH',getWorldPosition:()=>world(SUP)},mesh={name:'SW_MEMORY_ARC_RIFLE_MESH',isMesh:true,onBeforeRender:null};
 const mount={name:'r1313-gunner-weapon',traverse(f){f(mount);f(tip);f(sup);f(mesh);}};
 g.traverse=f=>{f(g);mount.traverse(f);};g.getObjectByName=n=>n==='r1313-gunner-weapon'?mount:null;
 const scene={children:[g],onBeforeRender:null};g.parent=scene;
 // 게임 투영과 같은 식(높이 h 는 화면 위로 TILE*zoom 만큼)
 const projection={worldToScreen:(x,y,h)=>({x:(x-y)*TILE+640,y:(x+y)*TILE*.5+360-h*TILE})};
 const r={scene,T:{Vector3:function(){return V();}},projection,camera:{}};
 sb.window.__STORYWORLD_PHASE1__={controller:{state:{three:r}}};
 // 한 번 렌더: 장면 onBeforeRender(내 몸 방향) → 메시 onBeforeRender(소총 끝 읽기). R1302 는 그 전에 자기 방향(4방향)을 다시 쓴다.
 const render=(r1302Yaw,late)=>{/* R1302 updateModel: 몸 자리 = 영웅 자리, 방향 = 자기 4방향 */g.position.x=sb.player.x;g.position.z=sb.player.y;if(r1302Yaw!=null)g.rotation.y=r1302Yaw;scene.onBeforeRender?.();/* R1314 처럼 내 고리 뒤에 방향을 또 쓰는 스크립트 */if(late&&r1302Yaw!=null){g.rotation.y=r1302Yaw;g.updateMatrixWorld(true);}mesh.onBeforeRender?.();};
 const tipScreen=()=>{const w=world(TIP);return projection.worldToScreen(w.x,w.z,w.y);};
 const gunGround=()=>{const a=world(TIP),b=world(SUP);return Math.atan2(a.z-b.z,a.x-b.x);};
 return {g,render,tipScreen,gunGround,mesh};}
function mk(opt={}){const hits=[],img=[],intervals=[];const stack=[],st={tx:0,ty:0,rot:0};
 const ctx={globalAlpha:1,globalCompositeOperation:'source-over',save(){stack.push({...st});},restore(){Object.assign(st,stack.pop()||{});},translate(x,y){st.tx+=x;st.ty+=y;},rotate(a){st.rot+=a;},scale(){},transform(){},
  drawImage(im){img.push({tag:im&&im.tag,tx:st.tx,ty:st.ty,rot:st.rot});},scope(m,f){f();}};
 const enemies=[];
 const store=opt.pref?{[ 'storyworld.r561.gunner']:JSON.stringify(opt.pref)}:{};
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,WeakSet,Number,String,Infinity,Date,performance:{now:()=>sb.time*1000},
  localStorage:{getItem:k=>store[k]??null,setItem(k,v){store[k]=v;}},window:{},setTimeout:()=>0,setInterval:f=>{intervals.push(f);return intervals.length;},addEventListener(){},
  auto:false,guide:false,started:true,modal:null,loading:false,storyScene:null,settings:{},time:10,COMBAT_RHYTHM_R26:1,shake:0,ctx,zoom:1,TILE,
  project:(x,y)=>({x:(x-y)*TILE+640,y:(x+y)*TILE*.5+360}),actorHeight:()=>66,
  player:{hero:'gunner',x:10,y:10,hp:100,specialCD:0,direction:'right',skillAnim:0,poseStarted5:{},poseDuration5:{},storyWER:{ready:{},buffs:{}},moveVX150:0,moveVY150:0,moving:false},
  maxHP:()=>200,attackPower:()=>40,rank:()=>0,clearLine:()=>true,blocked:()=>false,effects:[],sound(){},HEROES:{gunner:{name:'기억사수',special:'기억 재현',range:8.2}},room:{enemies},liveEnemies:()=>enemies.filter(e=>e.hp>0),
  hitEnemy:(e,v)=>{hits.push({id:e.id,t:sb.time});return true;},special(){},serializeSave:()=>({}),tick(){},drawEffect(){},updateHUD(){},restoreSave(){},
  readyImage:p=>opt.noSheet&&opt.noSheet.test(p)?null:({image:{tag:p,src:''}})};
 sb.window.__STORYWORLD_WER__=Object.freeze({cast:()=>'base',defs:{}});
 sb.window.__STORYWORLD_FX_SPRITES_R106__={draw(){},along(){},warm(){}};
 // R1302 API(가짜): 몸 무게
 let weights={idle:1,walk:0,attack:0};sb.window.__STORYWORLD_HWANDO3D_R1302__=Object.freeze({inspect:()=>({hero:'gunner',weights:{...weights}}),set(){},on:()=>true});
 const F=opt.no3d?null:fakeThree(sb);
 vm.createContext(sb);vm.runInContext(src,sb);
 const A=()=>sb.window.__STORYWORLD_GUNNER_ARMS_R561__;A().set({chain:false});
 const pump=()=>{for(const f of intervals)f();};pump();
 // 한 프레임 = 틱 → 그리기(광선 명령) → 렌더(R1302 4방향 → 내 몸 방향 → 소총 끝)
 let yaw1302=F?F.g.rotation.y:0;
 const frame=(dt=.02)=>{sb.time=+(sb.time+dt).toFixed(4);sb.tick(dt);img.length=0;st.tx=st.ty=st.rot=0;stack.length=0;sb.drawEffect({type:'r561-fx'});const beam=img.find(i=>/q-(beam|dots-body)\.webp/.test(i.tag||''));const pre=F?F.tipScreen():null;if(F)F.render(yaw1302,opt.late);pump();return {beam,img:img.slice(),tipDraw:pre,tip:F?F.tipScreen():null,gun:F?F.gunGround():null,fx:A().inspect().effects.find(e=>e.kind==='q'),all:A().inspect().effects,q:sb.project(sb.player.x,sb.player.y)};};
 const cast=(scr,dist=6)=>{const a=groundFor(scr*D);enemies.length=0;enemies.push({id:'t',x:sb.player.x+Math.cos(a)*dist,y:sb.player.y+Math.sin(a)*dist,hp:1e9,maxHp:1e9,radius:.3,spawnState:'active'});sb.player.specialCD=0;sb.special();return a;};
 const castK=(k,scr,dist=6)=>{const a=groundFor(scr*D);enemies.length=0;enemies.push({id:'t',x:sb.player.x+Math.cos(a)*dist,y:sb.player.y+Math.sin(a)*dist,hp:1e9,maxHp:1e9,radius:.3,spawnState:'active',boss:true});const ok=A().fire(k,false);return ok?a:null;};
 return {sb,F,A,frame,cast,castK,hits,set1302:y=>{yaw1302=y;},setWeights:w=>{weights=w;},api:()=>sb.window.__STORYWORLD_HWANDO3D_R1302__};}

ok('runtime-text 사본이 client-source 와 같음',fs.readFileSync(path.join(R,'runtime-text','gunner-arms-r561.js'),'utf8')===src);
ok('pages.yml 에 R1350 검사 단계',/node r96\/qa\/r1350\/r1350-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('hwando-3d-r1302.js(해시 고정)·R1320 은 이 라운드에서 고치지 않음(오버레이로만)',!/R1350/.test(fs.readFileSync(path.join(R,'client-source','hwando-3d-r1302.js'),'utf8'))&&!/R1350/.test(fs.readFileSync(path.join(R,'client-source','hero-stance-3d-r1320.js'),'utf8')));

// ① 3D: 16방향 + 칸 경계·정 위 30° 경계 — 열린 광선(충전 뒤)의 시작점 = 그 프레임 렌더의 소총 끝(≤.5px), 판정선 각 = 소총 방향(≤1°), 표적을 정확히(≤1°)
{const bad=[];for(const scr of [0,45,90,135,180,-135,-90,-45,22.5,67.5,112.5,157.5,-157.5,-112.5,-67.5,-22.5,-59,-61,-119,-121,-89.9,179.9]){
  const T=mk();T.set1302(Math.PI*.75);const a=T.cast(scr);let rows=[];for(let i=0;i<40;i++){const f=T.frame();if(f.beam&&f.fx)rows.push(f);}
  const r=rows.slice(2);if(r.length<10){bad.push({scr,n:r.length});continue;}
  const dS=Math.max(...r.map(f=>Math.hypot(f.beam.tx-f.tip.x,f.beam.ty-f.tip.y))),dG=Math.max(...r.map(f=>ad(f.fx.a,f.gun))),dA=Math.max(...r.map(f=>ad(f.fx.a,a))),dR=Math.max(...r.map(f=>ad(f.beam.rot,screenOf(f.fx.a))));
  if(dS>.5||dG>1||dA>1||dR>.5)bad.push({scr,dS:+dS.toFixed(2),dG:+dG.toFixed(2),dA:+dA.toFixed(2),dR:+dR.toFixed(2)});}
 ok('3D 22방향(8방향·칸 경계·정 위 ±30° 경계·좌우 끝): 시작점 = 렌더 순간 소총 끝(≤.5px), 판정선 = 소총 방향(≤1°), 표적 정확히(≤1°), 그린 각 = 판정선 각',bad.length===0,bad.slice(0,4));}
// ①b 내 고리 뒤에서 몸 방향을 또 쓰는 스크립트(R1314 순서)가 있어도 광선 동안 소총은 광선 방향
{const bad=[];for(const scr of [45,-90,157.5]){const T=mk({late:true});T.set1302(Math.PI*.75);const a=T.cast(scr);const r=[];for(let i=0;i<40;i++){const f=T.frame();if(f.beam&&f.fx)r.push(f);}const rr=r.slice(2);
  const dS=Math.max(...rr.map(f=>Math.hypot(f.beam.tx-f.tip.x,f.beam.ty-f.tip.y))),dA=Math.max(...rr.map(f=>ad(f.gun,a)));if(!(rr.length>=10&&dS<=.5&&dA<=1))bad.push({scr,n:rr.length,dS,dA});}
 ok('다른 스크립트가 뒤에서 몸 방향을 다시 써도(R1314 순서) 소총·광선 시작점이 광선 방향 유지',bad.length===0,bad);}
// ② 그리는 순간의 예측(이번 프레임 몸 방향으로 되돌린 소총 끝)이 렌더 결과와 같다 — 몸이 빨리 도는 첫 프레임들 포함
{const T=mk();T.set1302(-Math.PI*.25);T.cast(180);let worst=0,n=0;for(let i=0;i<40;i++){const f=T.frame();if(f.beam){n++;worst=Math.max(worst,Math.hypot(f.beam.tx-f.tip.x,f.beam.ty-f.tip.y));}}
 ok('3D 반대쪽(180° 돌기)에서 쏴도 프레임마다 시작점 = 그 프레임 소총 끝(≤.5px, 도는 중 포함)',n>=10&&worst<=.5,{n,worst});}
// ③ 발사 중 걷기: 소총이 걷는 쪽으로 돌고 광선 시작점·판정선이 따라감, 멈추면 그 방향 유지
{const T=mk();T.set1302(Math.PI*.75);const a0=T.cast(0);for(let i=0;i<14;i++)T.frame();const before=T.frame();
 const up=groundFor(-90*D);T.sb.player.moving=true;T.sb.player.moveVX150=Math.cos(up)*3;T.sb.player.moveVY150=Math.sin(up)*3;const rows=[];for(let i=0;i<8;i++){T.sb.player.x+=T.sb.player.moveVX150*.02;T.sb.player.y+=T.sb.player.moveVY150*.02;rows.push(T.frame());}
 T.sb.player.moving=false;T.sb.player.moveVX150=T.sb.player.moveVY150=0;const after=[];for(let i=0;i<6;i++)after.push(T.frame());
 const all=rows.concat(after).filter(f=>f.beam&&f.fx),dS=Math.max(...all.map(f=>Math.hypot(f.beam.tx-f.tip.x,f.beam.ty-f.tip.y))),dG=Math.max(...all.map(f=>ad(f.fx.a,f.gun)));
 const turned=ad(rows[rows.length-1].fx.a,a0),toward=ad(rows[rows.length-1].fx.a,up),kept=ad(after[after.length-1].fx.a,up);
 ok('발사 중 걸으면 소총이 걷는 쪽으로 돌고(≥80°) 광선 시작점(≤.5px)·판정선(≤1°)이 매 프레임 따라감',all.length>=10&&turned>=80&&toward<=1&&dS<=.5&&dG<=1,{turned,toward,dS,dG,n:all.length,before:before.fx?.a});
 ok('멈춘 뒤에는 돈 방향을 유지(표적 쪽으로 튀지 않음)',kept<=1,{kept});}
// ④ 판정선: 돈 쪽 적만 맞음
{const T=mk();T.set1302(Math.PI*.75);T.cast(0);for(let i=0;i<14;i++)T.frame();const up=groundFor(-90*D);T.sb.room.enemies.push({id:'u',x:T.sb.player.x+Math.cos(up)*3,y:T.sb.player.y+Math.sin(up)*3,hp:1e9,maxHp:1e9,radius:.3,spawnState:'active'});
 T.sb.player.moving=true;T.sb.player.moveVX150=Math.cos(up)*.5;T.sb.player.moveVY150=Math.sin(up)*.5;const h0=T.hits.length;for(let i=0;i<20;i++)T.frame();const after=T.hits.slice(h0);
 ok('돈 뒤 판정선은 새 소총 방향의 적을 맞힘(옛 방향에 남지 않음)',after.some(h=>h.id==='u'),{after});}
// ⑤ 견착: 광선 동안 R1302 무게가 공격 쪽(R1320 견착 자세), 끝나면 원래대로
{const T=mk();T.set1302(Math.PI*.75);T.cast(45);const w=[];for(let i=0;i<70;i++){T.frame();w.push(T.api().inspect().weights);}
 ok('광선 동안 3D 몸 무게 = 공격(견착 자세) 1, 광선이 끝나고 .12초 뒤 원래(대기 1)',w.slice(6,40).every(x=>Math.abs(x.attack-1)<1e-6&&x.idle<1e-6)&&Math.abs(w[w.length-1].idle-1)<1e-6&&w[w.length-1].attack<1e-6,{mid:w[20],end:w[w.length-1]});}
// ⑥ 끝나면 몸 방향을 R1302 방향으로 부드럽게 돌려줌(튀지 않음)
{const T=mk();T.set1302(Math.PI*.75);T.cast(-90);for(let i=0;i<55;i++)T.frame();const ys=[];for(let i=0;i<40;i++){T.frame();ys.push(T.F.g.rotation.y);}
 const jumps=ys.slice(1).map((y,i)=>ad(y,ys[i]));ok('광선 뒤 몸 방향이 R1302 방향으로 돌아감(한 프레임 ≤20° 씩, 마지막 = R1302)',Math.max(...jumps)<=20&&ad(ys[ys.length-1],Math.PI*.75)<.5,{max:Math.max(...jumps),last:ys[ys.length-1]});}
// ⑦ 3D 몸이 안 보이면(2D) 예전 그대로: 판정선 = 2D 칸 각(8방향 칸 가운데), 몸 방향을 건드리지 않음
{const T=mk();T.F.g.visible=false;T.set1302(Math.PI*.75);const a=T.cast(22.5);let f;for(let i=0;i<20;i++)f=T.frame();
 const SEC=[0,45,90,135,180,-135,-90,-45].map(d=>d*D),sec=screenOf(f.fx.a);
 ok('2D(3D 몸 숨김): 판정선은 2D 겨눔 칸 각(8방향) 그대로, 3D 몸 방향을 바꾸지 않음',SEC.some(s=>ad(sec,s)<.5)&&f.fx.m3===false&&Math.abs(T.F.g.rotation.y-Math.PI*.75)<1e-9,{sec:sec/D,m3:f.fx.m3});}
// ⑧ 발사 중 3D→2D: 그 순간부터 2D 칸 각으로
{const ref=mk();ref.F.g.visible=false;ref.cast(22.5);let r2;for(let i=0;i<5;i++)r2=ref.frame();/* 같은 표적, 처음부터 2D 일 때의 겨눔 칸 각 */
 const T=mk();T.set1302(Math.PI*.75);T.cast(22.5);for(let i=0;i<20;i++)T.frame();const a3=T.frame().fx.a;T.F.g.visible=false;const f=T.frame();
 ok('발사 중 3D 를 끄면 다음 틱부터 2D 칸 각(처음부터 2D 로 쐈을 때와 같은 겨눔)으로',f.fx.m3===false&&ad(f.fx.a,r2.fx.a)<.01&&ad(a3,groundFor(22.5*D))<1,{a3,a2:f.fx.a,ref:r2.fx.a});}
// ⑨ 끄기 {"muzzle3d":false}: 3D 가 보여도 예전(2D) 거동
{const T=mk({pref:{muzzle3d:false}});T.set1302(Math.PI*.75);T.cast(22.5);let f;for(let i=0;i<20;i++)f=T.frame();
 ok('{"muzzle3d":false} 면 3D 소총 추적을 끔(예전 2D 각, 몸 방향 그대로)',f.fx.m3===false&&Math.abs(T.F.g.rotation.y-Math.PI*.75)<1e-9);}
// ⑩ 값이 깨져도(NaN 이동 속도·위치) 그리기 좌표가 유한
{const T=mk();T.set1302(Math.PI*.75);T.cast(0);for(let i=0;i<12;i++)T.frame();T.sb.player.moving=true;T.sb.player.moveVX150=NaN;T.sb.player.moveVY150=NaN;let f;for(let i=0;i<5;i++)f=T.frame();
 ok('이동 속도 NaN 이어도 광선 각·시작점 유한',f.fx&&Number.isFinite(f.fx.a)&&f.beam&&Number.isFinite(f.beam.tx+f.beam.ty),{a:f.fx?.a,b:f.beam});}
// ⑪ R1350b W 저격(3D): 쏘는 순간 탄 출발점 = 그 프레임 3D 총구(≤.5px), 탄 각 = 소총 방향(≤1°) = 표적(≤1°), 겨누는 .35초 동안 몸이 돌아 맞춤
{const bad=[];for(const scr of [0,45,90,135,180,-135,-90,-45,22.5,-112.5,-61,157.5]){const T=mk();T.set1302(Math.PI*.75);const a=T.castK('w',scr);if(a==null){bad.push({scr,cast:false});continue;}let got=null;
  for(let i=0;i<40&&!got;i++){const f=T.frame(),w=f.all.find(e=>e.kind==='w');if(w&&w.fired&&w.mo&&Math.abs(w.tf-T.sb.time)<1e-9)got={w,f};}
  if(!got){bad.push({scr,fired:false});continue;}const {w,f}=got,d=Math.hypot(f.q.x+w.mo.x-f.tip.x,f.q.y+w.mo.y-f.tip.y),dg=ad(w.a,f.gun),dt=ad(w.a,a);if(!(d<=.5&&dg<=1&&dt<=1&&w.m3))bad.push({scr,d,dg,dt,m3:w.m3});}
 ok('W 저격 3D 12방향: 탄 출발점 = 쏜 프레임 3D 총구(≤.5px), 탄 각 = 소총(≤1°) = 표적(≤1°)',bad.length===0,bad.slice(0,4));}
// ⑫ E 연사(3D): 모든 발 출발점 = 그 프레임 3D 총구, 각 = 소총(±연사 흔들림 2°), 첫 발부터(시전 순간 몸을 바로 돌림)
{const bad=[];for(const scr of [0,90,180,-90,45,-135,22.5,-157.5]){const T=mk();T.set1302(-Math.PI*.25);const a=T.castK('e',scr);if(a==null){bad.push({scr,cast:false});continue;}const seen=new Set();let n=0;
  const chk=f=>{const e=f.all.find(x=>x.kind==='e');if(!e)return;for(const r of e.rounds){if(seen.has(r.t)||Math.abs(r.t-T.sb.time)>1e-9)continue;seen.add(r.t);n++;const d=r.mo?Math.hypot(f.q.x+r.mo.x-f.tip.x,f.q.y+r.mo.y-f.tip.y):99,dg=ad(r.a,f.gun),dt=ad(r.a,a);if(!(r.m3&&d<=.5&&dg<=2.1&&dt<=2.1))bad.push({scr,n,d,dg,dt,m3:r.m3});}};
  /* 첫 발은 시전(틱 밖)에서 — 시전 직후 렌더로 확인 */const f0=T.frame();chk(f0);for(let i=0;i<40;i++)chk(T.frame());if(n<7)bad.push({scr,n});}
 ok('E 연사 3D 8방향: 매 발 출발점 = 그 프레임 3D 총구(≤.5px), 각 = 소총·표적(≤2.1°, 연사 흔들림 포함)',bad.length===0,bad.slice(0,4));}
// ⑬ E 연사 중 걷기: 다음 발들이 소총을 따라 걷는 쪽으로
{const T=mk();T.set1302(Math.PI*.75);const a=T.castK('e',0);for(let i=0;i<8;i++)T.frame();const up=groundFor(-90*D);T.sb.player.moving=true;T.sb.player.moveVX150=Math.cos(up)*3;T.sb.player.moveVY150=Math.sin(up)*3;
 let last=null,bad=0;for(let i=0;i<30;i++){T.sb.player.x+=T.sb.player.moveVX150*.02;T.sb.player.y+=T.sb.player.moveVY150*.02;const f=T.frame(),e=f.all.find(x=>x.kind==='e');if(!e)continue;const r=e.rounds[e.rounds.length-1];if(r&&Math.abs(r.t-T.sb.time)<1e-9){last=r;if(Math.hypot(f.q.x+r.mo.x-f.tip.x,f.q.y+r.mo.y-f.tip.y)>.5||ad(r.a,f.gun)>2.1)bad++;}}
 ok('E 연사 중 걸으면 다음 발이 소총을 따라 걷는 쪽(≤3°)으로, 출발점 = 그 순간 총구',last&&ad(last.a,up)<=3&&bad===0,{last:last&&ad(last.a,up),bad});}
// ⑭ 2D(3D 숨김): W·E 는 예전 그대로(8방향 칸 각, 3D 몸 안 돌림)
{const T=mk();T.F.g.visible=false;T.set1302(Math.PI*.75);T.castK('w',22.5);let w=null;for(let i=0;i<30;i++){const f=T.frame();w=f.all.find(e=>e.kind==='w')||w;}
 const SEC=[0,45,90,135,180,-135,-90,-45].map(d=>d*D);ok('2D: W 탄 각은 8방향 칸 그대로, 3D 몸 방향 안 바꿈',w&&SEC.some(s=>ad(screenOf(w.a),s)<.5)&&!w.m3&&Math.abs(T.F.g.rotation.y-Math.PI*.75)<1e-9,{a:w&&screenOf(w.a)/D});}
// ⑮ R1350c: 광선 그림 = Dots SW-R1352-D06(기억사수 파랑으로 색만 바꿈) — 몸통 12칸 반복은 총구에서, 섬광은 총구에, 끝은 광선 끝에. 시트가 없으면 예전 R561 시트.
{const bad=[];for(const [vis,scr] of [[true,0],[true,-90],[true,135],[false,0],[false,-112.5]]){const T=mk();T.F.g.visible=vis;T.set1302(Math.PI*.75);T.cast(scr);const rows=[];for(let i=0;i<48;i++){const f=T.frame();if(f.fx&&f.beam)rows.push(f);}
  const body=rows.filter(f=>/r561\/gunner-q-dots-body\.webp/.test(f.beam.tag||'')),old=rows.filter(f=>f.img.some(i=>/q-beam\.webp/.test(i.tag||''))),fl=rows.filter(f=>f.img.some(i=>/q-dots-flash\.webp/.test(i.tag||''))),tp=rows.filter(f=>f.img.some(i=>/q-dots-tip\.webp/.test(i.tag||'')));
  const flD=Math.max(0,...fl.map(f=>{const i=f.img.find(i=>/q-dots-flash/.test(i.tag));return Math.hypot(i.tx-f.beam.tx,i.ty-f.beam.ty);})),tpA=Math.max(0,...tp.map(f=>{const i=f.img.find(i=>/q-dots-tip/.test(i.tag));return Math.hypot(i.tx-f.beam.tx,i.ty-f.beam.ty)<2?0:ad(Math.atan2(i.ty-f.beam.ty,i.tx-f.beam.tx),f.beam.rot);}));
  if(!(rows.length>=10&&body.length===rows.length&&old.length===0&&fl.length>=2&&flD<=.5&&tp.length>=5&&tpA<=1))bad.push({vis,scr,n:rows.length,body:body.length,old:old.length,fl:fl.length,flD,tp:tp.length,tpA});}
 ok('R1350c 광선 = Dots D06 몸통 시트(총구에서 시작)·섬광(총구)·끝(광선 끝 방향), 예전 몸통 시트 안 씀 — 3D 3방향·2D 2방향',bad.length===0,bad);}
{const T=mk({noSheet:/gunner-q-dots-/});T.set1302(Math.PI*.75);T.cast(45);const rows=[];for(let i=0;i<48;i++){const f=T.frame();if(f.fx&&f.beam)rows.push(f);}
 ok('R1350c 시트를 못 읽으면 예전 R561 광선 시트로(빈 화면 없음)',rows.length>=10&&rows.every(f=>/r561\/gunner-q-beam\.webp/.test(f.beam.tag||'')),{n:rows.length});}
console.log(fail?`R1350 CPU: ${fail} FAIL / ${pass} PASS`:`R1350 CPU: ALL ${pass} PASS`);process.exit(fail?1:0);
