// R1241 CPU 검사 — 솔로몬의 봉인식 '교만의 잔향 · 제72문' 보스 스킬 '72 그림자 소환'(boss72-shadows-r1241.js)
//  사용자 2026-11-19 12:16Z "검은그림자같은 형체 작은것들 72개 소환하는 느낌으로(밑에서 솟아올랐다 가라앉았다 6번해서 12개 해서72번) 보스방가득찬 장판형 프레임이펙트로 스킬구현해서 적용"
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='boss72-shadows-r1241.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const srcPath=path.join(R,'client-source',F);ok(fs.existsSync(srcPath),'오버레이 파일 있음');
const src=fs.readFileSync(srcPath,'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
// ---- 빌드 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8'),t=s=>html.indexOf('<script src="./'+s+'"></script>');
ok(t(F)>0&&t(F)>t('dys-ranged-r1210.js')&&t(F)<t('boot-lean-r1038.js')&&/\n<script src="\.\/boss72-shadows-r1241\.js"><\/script>\n/.test(html),'index.html: 자기 줄, dys-ranged-r1210 뒤·boot-lean-r1038 앞');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1241/r1241-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('/'+F+'"')||man.includes('"'+F+'"'),'runtime-manifest 에 들어감');
for(const a of ['assets/r1241/shadow-rise12.webp','assets/r1241/shadow-seal8.webp','assets/r1241/shadow-burst12.webp'])
 ok(src.includes(a)&&fs.existsSync(path.join(R,'runtime-text',a))&&man.includes(a),'프레임 시트 있음·manifest: '+a);
{const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1241/index.json'),'utf8'));
 ok(idx['shadow-rise12']?.frames===12&&idx['shadow-seal8']?.frames===8&&idx['shadow-rise12'].final===false,'시트 표: 그림자 12칸(솟음 6+가라앉음 6)·인장 8칸, 임시(최종 아님) 표시',idx);}
// 주황 예고 도형 금지(#712)
{const hexes=[...src.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].map(m=>m[1]),rgbs=[...src.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map(m=>[+m[1],+m[2],+m[3]]);
 const toRgb=h=>h.length===3?[...h].map(c=>parseInt(c+c,16)):[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
 const hue=([r,g,b])=>{const M=Math.max(r,g,b),m=Math.min(r,g,b);if(M-m<40)return null;let h=M===r?((g-b)/(M-m))%6:M===g?(b-r)/(M-m)+2:(r-g)/(M-m)+4;return (h*60+360)%360;};
 const orange=[...hexes.map(toRgb),...rgbs].filter(c=>{const h=hue(c);return h!==null&&h>=15&&h<=55;});ok(orange.length===0,'주황·노랑 색 없음',orange);}
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 에 drop-shadow·blur 안 씀(Three.js Legacy 검게 됨)');
// ---- 샌드박스 ----
function sandbox(o={}){
 const calls={hurt:[],imgs:[],draw:0,perFrame:[]};
 const ctx=new Proxy({},{get:(ob,k)=>k in ob?ob[k]:(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k)?((...a)=>{calls.draw++;if(k==='drawImage')calls.imgs.push(a[0]&&a[0].src);}):undefined),set:(ob,k,v)=>{ob[k]=v;return true;}});
 /* 엔진 기록기 scope 는 fn 을 부른다(빈 함수로 두면 아무것도 안 그려짐) — 받은 owner 를 기록 */
 calls.scopes=[];ctx.scope=(o,fn)=>{calls.scopes.push(o);fn();};
 const player={x:10,y:10,hp:100,invincible:0};
 const walls=o.walls||(()=>false);
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{id:'ep1b01',enemies:[]},effects:[],W:960,H:540,TILE:34,zoom:.667,N:40,
  project:(x,y)=>({x:(x-y)*22+480,y:(x+y)*11+270}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:2304,height:256,naturalWidth:2304}}),
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>39||y+r>39||walls(x,y),hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1241]);return 'hit';},
  drawEffect(){},tick(dt){},settings:{},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_BOSS72_SHADOWS_R1241__};}
const boss=(o={})=>({id:'b72',nativeId:'mb-ep1b01',name:'교만의 잔향 · 제72문',boss:true,hp:1000,maxHp:1000,damage:20,spawnState:'active',x:14,y:12,radius:.6,...o});
const run=(S,secs,dt=1/30,each)=>{for(let i=0;i<Math.round(secs/dt);i++){S.sb.time+=dt;S.sb.tick(dt);const m=S.sb.effects.find(x=>x&&x.type==='r1241-fx');if(m){const d0=S.calls.draw,i0=S.calls.imgs.length;S.sb.drawEffect(m);S.calls.perFrame.push(S.calls.imgs.length-i0);}if(each)each(S,i);}};
{const S=sandbox(),A=S.A;ok(!!A&&typeof A.isBoss==='function'&&typeof A.planWave==='function','API window.__STORYWORLD_BOSS72_SHADOWS_R1241__');
 ok(A.isBoss(boss())&&A.isBoss(boss({nativeId:undefined}))&&A.isBoss(boss({nativeId:'x',name:'교만의 잔향 · 제72문 2'})),'제72문 보스 알아봄(nativeId·이름)');
 for(const e of [boss({nativeId:'mb-ep1b02',name:'나태의 껍데기 파수'}),boss({nativeId:'dist06-boss',name:'발록 (Balrog)'}),{name:'유리망령',hp:10,spawnState:'active'},null])ok(!A.isBoss(e),'다른 적은 아님: '+(e&&e.name));
 ok(A.waves===6&&A.perWave===12&&A.waves*A.perWave===72,'6파 × 12 = 72',{w:A.waves,p:A.perWave});
 // ---- 배치(순수) ----
 const all=[];for(let w=0;w<6;w++){const pts=A.planWave({x:14,y:12},{x:10,y:10},w,7);ok(pts.length===12,'파 '+w+': 12개');all.push(...pts);
  ok(pts.every(p=>!S.sb.blocked(p.x,p.y,.3)),'파 '+w+': 모두 막히지 않은 바닥');
  let md=9;for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)md=Math.min(md,Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y));ok(md>=.9,'파 '+w+': 서로 0.9칸 이상 떨어짐',md);
  ok(pts.some(p=>Math.hypot(p.x-10,p.y-10)<=1.2),'파 '+w+': 영웅 자리 노리는 그림자 있음');
  // 피할 곳: 영웅 둘레 2.5칸 안에 그림자 판정 원이 덮지 않는 빈 점이 있어야 한다
  let free=0;for(let a=0;a<24;a++)for(const r of [1.2,1.8,2.4]){const x=10+Math.cos(a/24*6.283)*r,y=10+Math.sin(a/24*6.283)*r;if(pts.every(p=>Math.hypot(p.x-x,p.y-y)>A.hitRadius+.3))free++;}ok(free>=8,'파 '+w+': 2.5칸 안에 피할 자리 있음',free);}
 const xs=all.map(p=>p.x),ys=all.map(p=>p.y);ok(Math.max(...xs)-Math.min(...xs)>=10&&Math.max(...ys)-Math.min(...ys)>=10,'72개가 방을 넓게 채움(가로·세로 10칸 이상)',[Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)]);
 // 벽 많은 방에서도 막힌 칸에 안 놓음
 const S2=sandbox({walls:(x,y)=>((Math.floor(x)+Math.floor(y))%3===0)});const p2=S2.A.planWave({x:14,y:12},{x:10.5,y:10.5},0,3);ok(p2.length===12&&p2.every(p=>!S2.sb.blocked(p.x,p.y,.3)),'벽 많은 방: 12개 모두 바닥',p2.length);
 ok(A.planWave({x:14,y:12},{x:10,y:10},2,7).map(p=>p.x.toFixed(3)).join()===A.planWave({x:14,y:12},{x:10,y:10},2,7).map(p=>p.x.toFixed(3)).join(),'같은 시드 같은 배치(협동 화면 맞춤)');
 // ---- 수치 ----
 const U=A.tune;ok(U.tele>=.7&&U.tele<=1.2,'예고 0.7~1.2초',U.tele);ok(U.dmg>0&&U.dmg<=.45,'한 그림자 피해 ≤ 보스 근접 0.45배',U.dmg);ok(U.cap<=1.5,'한 번 시전 총 피해 ≤ 보스 근접 1.5대',U.cap);
 ok(U.cd>=12,'재사용 12초 이상',U.cd);ok(A.hitRadius>=.5&&A.hitRadius<=.85,'판정 반지름 0.5~0.85칸',A.hitRadius);}
// ---- 동작: 가만히 서 있으면 맞되 상한 안, 멀리 있으면 아무 일 없음 ----
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);
 run(S,A.tune.first+.5);ok(A.inspect().casts===1,'교전 후 첫 시전',A.inspect());
 // 영웅이 계속 그림자 위에 서 있음(매 파 영웅 자리를 노림)
 run(S,12);const ins=A.inspect();ok(ins.spawned===72,'72개 모두 솟음',ins.spawned);ok(ins.wavesDone===6,'6파 모두 지남',ins.wavesDone);
 const tot=S.calls.hurt.reduce((a,h)=>a+h[0],0);ok(S.calls.hurt.length>=2,'가만히 서 있으면 맞음',S.calls.hurt.length);ok(tot<=b.damage*A.tune.cap+1e-6,'총 피해 ≤ 상한',{tot,cap:b.damage*A.tune.cap});
 ok(S.calls.hurt.every(h=>h[1]==='shadow'),'피해 출처 표시 r1241');
 const per=S.calls.perFrame.filter(x=>x>0);ok(per.length>50,'시전 중 그려짐',per.length);ok(Math.max(...per)<=64,'한 프레임 그림 호출 ≤ 64(모바일)',Math.max(...per));
 ok(S.calls.imgs.some(s=>/shadow-rise12/.test(s))&&S.calls.imgs.some(s=>/shadow-seal8/.test(s))&&S.calls.imgs.some(s=>/shadow-burst12/.test(s)),'그림자·인장·먹 흩어짐 시트 모두 씀');
 ok(ins.errors===0,'오류 없음',ins.lastError);
 /* 회귀(브라우저에서 몸이 바닥에 납작하게 깔렸던 것): 그림자 몸은 세워서(groundAligned:false), 인장·먹은 바닥에(true) */
 const sc=S.calls.scopes;ok(sc.some(o=>/^r1241:f/.test(o.id)&&o.groundAligned===false&&o.kind==='effect'),'그림자 몸 = 세운 effect');ok(sc.filter(o=>/^r1241:(g|floor)/.test(o.id)).every(o=>o.groundAligned===true)&&sc.some(o=>o.id==='r1241:floor'),'인장·먹·장판 = 바닥에 눕힘');
 ok(sc.every(o=>Number.isFinite(o.x)&&Number.isFinite(o.y)),'scope 좌표 유한');}
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);// 예고를 보고 비키는 영웅: 매 프레임 가장 가까운 예고에서 멀리
 run(S,A.tune.first+12,1/30,(S)=>{const live=A.inspect().liveTele||[];let best=null,bd=-1;for(let a=0;a<16;a++)for(const r of [1,1.6,2.2]){const x=10+Math.cos(a/16*6.283)*r,y=10+Math.sin(a/16*6.283)*r;const d=Math.min(9,...live.map(p=>Math.hypot(p.x-x,p.y-y)));if(d>bd){bd=d;best={x,y};}}
  if(live.some(p=>Math.hypot(p.x-S.player.x,p.y-S.player.y)<A.hitRadius+.2)&&best){S.player.x=best.x;S.player.y=best.y;}});
 ok(S.calls.hurt.length===0,'예고를 보고 비키면 안 맞음',S.calls.hurt.length);}
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);S.player.x=36;S.player.y=36;run(S,A.tune.first+2);ok(A.inspect().casts===0,'영웅이 멀면(교전 거리 밖) 시전 안 함');}
{const S=sandbox(),A=S.A,b=boss({hp:0});S.sb.room.enemies.push(b);run(S,A.tune.first+2);ok(A.inspect().casts===0,'죽은 보스는 시전 안 함');}
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);run(S,A.tune.first+1.5);b.hp=0;run(S,.2);run(S,6);ok(A.inspect().live===0&&!A.inspect().casting,'보스가 죽으면 남은 그림자 사라짐',A.inspect().live);}
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);run(S,A.tune.first+1.5);S.sb.room={id:'ep1b02',enemies:[]};run(S,.6);ok(A.inspect().live===0,'방을 옮기면 사라짐');}
{const S=sandbox(),A=S.A,b=boss();A.set({on:false});S.sb.room.enemies.push(b);run(S,A.tune.first+3);ok(A.inspect().casts===0&&S.calls.hurt.length===0,'끄기 storyworld.r1241.shadows');}
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);S.sb.modal=true;run(S,A.tune.first+3);ok(A.inspect().casts===0,'창이 열려 있으면 멈춤');}
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);run(S,A.tune.first+.1);const c0=A.inspect().casts;run(S,9);ok(A.inspect().casts===c0,'시전 중 겹쳐 시전 안 함');run(S,A.tune.cd+1);ok(A.inspect().casts===c0+1,'재사용 뒤 다시 시전',A.inspect().casts);}
// 시전 시작 때 보스는 잠깐 멈춰 부른다(읽히는 예비 동작)
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);run(S,A.tune.first+.1);b.x=20;b.moving=true;run(S,.1);ok(b.x===14&&b.moving===false,'시전 시작 부르기 동안 보스 제자리',{x:b.x,m:b.moving});}
console.log('R1241 cpu: '+n+' passed');
