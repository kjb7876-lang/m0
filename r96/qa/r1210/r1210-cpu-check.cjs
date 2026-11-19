// R1210 CPU 검사 — 사몽 S-06 디스토피아 적의 미래형 원거리 공격(레이저·방사능·음파), dys-ranged-r1210.js
//  사용자 2026-11-19 07:25Z "디스토피아 적들이 레이저공격이나 방사능공격 음파공격등 미래기술에 맞는 원거리 공격들을 사용하도록"
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='dys-ranged-r1210.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
// ---- 빌드 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8'),t=s=>html.indexOf('<script src="./'+s+'"></script>');
ok(t(F)>0&&t(F)>t('mob-feet-ink-r1195.js')&&t(F)<t('boot-lean-r1038.js')&&/\n<script src="\.\/dys-ranged-r1210\.js"><\/script>\n/.test(html),'index.html: 자기 줄, mob-feet-ink-r1195 뒤·boot-lean-r1038 앞');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1210/r1210-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('"'+F+'"')||man.includes('/'+F+'"'),'runtime-manifest 에 들어감');
// 재사용 시트는 실제로 있어야 한다(지어낸 경로 금지)
/* 사용자 지시 동작 변경(11-19 07:39Z 프레임 애니메이션, Dots CX-0167RA 레이저 r1 도착): 레이저는 R600 빛줄기 대신 Dots 전용 시트 */
for(const a of ['assets/r1210/laser-aim6.webp','assets/r1210/laser-charge8.webp','assets/r1210/laser-body8.webp','assets/r1210/laser-impact8.webp','assets/r1210/sonic-ring.webp','assets/r562/neon-toxic-mist.webp','assets/r562/dots/neon-toxic-pool.webp'])
 ok(src.includes(a)&&fs.existsSync(path.join(R,'runtime-text',a)),'재사용 시트 있음: '+a);
{const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1210/index.json'),'utf8'));ok(idx['laser-body8']?.frames===8&&idx['laser-charge8']?.frames===8&&idx['laser-impact8']?.frames===8&&idx['laser-aim6']?.frames===6&&['laser-aim6','laser-charge8','laser-body8','laser-impact8'].every(k=>/CX-0167RA_machine-laser-/.test(idx[k].source))&&idx['sonic-ring']?.frames===24,'Dots CX-0167RA 레이저 시트 4장 표',idx);}
// 주황 예고 도형 금지(#712): 코드 안 색 문자열에 주황·노랑 계열이 없어야 한다
{const hexes=[...src.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].map(m=>m[1]),rgbs=[...src.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map(m=>[+m[1],+m[2],+m[3]]);
 const toRgb=h=>h.length===3?[...h].map(c=>parseInt(c+c,16)):[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
 const hue=([r,g,b])=>{const M=Math.max(r,g,b),m=Math.min(r,g,b);if(M-m<40)return null;let h=M===r?((g-b)/(M-m))%6:M===g?(b-r)/(M-m)+2:(r-g)/(M-m)+4;return (h*60+360)%360;};
 const orange=[...hexes.map(toRgb),...rgbs].filter(c=>{const h=hue(c);return h!==null&&h>=15&&h<=55;});ok(orange.length===0,'주황·노랑 색 없음',orange);}
// ---- 샌드박스 ----
function sandbox(){
 const calls={hurt:[],shot:[],base:0,draw:[],imgs:[]};
 const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k)?((...a)=>{calls.draw.push(k);if(k==='drawImage')calls.imgs.push(a[0]&&a[0].src);}):undefined),set:(o,k,v)=>{o[k]=v;return true;}});
 const player={x:10,y:10,hp:100,invincible:0};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{enemies:[]},effects:[],W:960,H:540,
  project:(x,y)=>({x:(x-y)*32+480,y:(x+y)*16}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:2048,height:1024,naturalWidth:2048}}),
  clearLine:()=>true,blocked:()=>false,facing:()=>'right',hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1210]);return 'hit';},
  enemyShot:()=>{calls.shot.push(1);return {};},drawEffect(){},tick(dt){},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 sb.ranged3=function(e){calls.base++;};sb.window.window=sb.window;
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_DYS_RANGED_R1210__};
}
const mob=(name,o={})=>({id:'e'+Math.random(),name,hp:100,maxHp:100,damage:10,ai:'melee',weapon:'ranged',spawnState:'active',x:14,y:10,radius:.3,cd:0,...o});
const step=(S,secs,dt=1/30,draw=false)=>{for(let i=0;i<secs/dt;i++){S.sb.time+=dt;S.sb.tick(dt);if(draw){const m=S.sb.effects.find(x=>x&&x.type==='r1210-fx');if(m)S.sb.drawEffect(m);}}};
{const {A}=sandbox();ok(!!A&&typeof A.kindFor==='function','API window.__STORYWORLD_DYS_RANGED_R1210__');
 const want={'프리즘 저격병':'laser','중장 광선포병 3':'laser','외계 침공군':'laser','외계 침공군 12':'laser','전선 절단자 · 짙은 형상':'laser','낫팔 잠복체':'laser',
  '두족류 생체기계 침공병':'radiation','변이된 사냥개 괴수 2':'radiation','포낭 곡사체':'radiation','배양 공병':'radiation',
  '폐선로 태엽 군단병':'sonic','펄스 척후병':'sonic','막익 급습체':'sonic','방벽 돌진체 4':'sonic','원반 포획체':'sonic','심해 연산거수 · 짙은 형상':'sonic'};
 for(const [k,v] of Object.entries(want))ok(A.kindFor(k)===v,'종류: '+k+' → '+v,A.kindFor(k));
 for(const k of ['세뇌당한 기억의 조각','상대 초인','지휘 개체 7','숲 고블린','검은 명령선','',null])ok(A.kindFor(k)===null,'디스토피아 일반 몹 아님: '+k);
 // 보스·중간보스는 이름이 맞아도 제외
 ok(!A.eligible(mob('프리즘 저격병',{boss:true}))&&!A.eligible(mob('프리즘 저격병',{midboss:true}))&&A.eligible(mob('프리즘 저격병')),'보스·중간보스 제외, 일반 몹 포함');
 ok(!A.eligible(mob('프리즘 저격병',{hp:0}))&&!A.eligible(mob('프리즘 저격병',{spawnState:'hidden'})),'죽었거나 안 나온 몹 제외');
 // ---- 수치(난이도 튀지 않게) ----
 const T=A.tune;for(const k of ['laser','radiation','sonic']){const u=T[k];ok(u&&u.min>=2.4&&u.max<=7.5&&u.max>u.min,k+': 사거리 띠 2.4~7.5칸 안('+u.min+'~'+u.max+')',u);
  ok(u.dmg>0&&u.dmg<=.9,k+': 한 번 피해 ≤ 근접 피해의 0.9배',u.dmg);ok(u.windup>=.5&&u.windup<=1,k+': 예고 0.5~1초',u.windup);
  const total=u.dmg*(u.ticks||1);ok(total<=1.0,k+': 다 맞아도 근접 한 대 이하',total);
  const dps=total/(u.cd+u.windup),engine=1/(2.1+.55);ok(dps<=engine*.5,k+': 근접형 몹에 붙는 원거리 압박 ≤ 엔진 원거리 몹의 절반',{dps,engine});}
 ok(Array.isArray(A.firstDelay)&&A.firstDelay[0]>=.5&&A.firstDelay[1]<=3,'방 들어선 뒤 첫 사격 지연 0.5~3초',A.firstDelay);
 ok(A.maxLive>=1&&A.maxLive<=3,'동시에 겨누는 몹 3마리 이하',A.maxLive);
 // ---- 판정 기하(순수) ----
 const L=A.laserHits;ok(L(0,0,0,7,4,0,.4)&&L(0,0,0,7,4,.3,.4),'레이저: 선 위·폭 안 맞음');ok(!L(0,0,0,7,4,.75,.4),'레이저: 폭 밖 빗나감');
 ok(!L(0,0,0,7,-1,0,.4),'레이저: 뒤쪽 빗나감');ok(!L(0,0,0,7,7.8,0,.4)&&L(0,0,0,7,6.9,0,.4),'레이저: 길이 끝 경계');ok(L(0,0,Math.PI/2,7,0,5,.4),'레이저: 각도 반영');
 const W=A.waveHits;ok(W(0,0,0,3,3,0,.45,.6),'음파: 고리 띠·부채꼴 안 맞음');ok(!W(0,0,0,3,1.5,0,.45,.6),'음파: 아직 안 닿은 거리 빗나감');
 ok(!W(0,0,0,3,0,3,.45,.6),'음파: 부채꼴 밖 빗나감');ok(W(0,0,Math.PI,3,-3,.2,.45,.6),'음파: 왼쪽 방향');
 const P=A.poolHits;ok(P(0,0,1.1,.8,.5)&&!P(0,0,1.1,1.5,0),'방사능 웅덩이 반지름');}
// ---- 동작: 근접형 디스토피아 몹이 겨누고 쏜다 ----
for(const [name,kind] of [['프리즘 저격병','laser'],['펄스 척후병','sonic'],['포낭 곡사체','radiation']]){
 const S=sandbox();const e=mob(name);S.sb.room.enemies.push(e);step(S,.4);ok(!e.r1210?.mode,name+': 방에 들어서자마자는 안 쏨(첫 지연)');for(let i=0;i<(S.A.firstDelay[1]+.1)*30&&e.r1210?.mode!=='windup';i++)step(S,1/30);
 ok(e.r1210&&e.r1210.mode==='windup'&&e.r1210.kind===kind,name+': 4칸 거리에서 첫 지연 안에 겨누기 시작('+kind+')',e.r1210);
 ok(S.sb.effects.some(x=>x&&x.type==='r1210-fx'),name+': 그리기 표지 등록');
 const cnt=S.calls.draw.length;S.sb.drawEffect(S.sb.effects.find(x=>x.type==='r1210-fx'));ok(S.calls.draw.length>cnt,name+': 예고 그림 그림');
 const hx=e.x,hy=e.y;step(S,.3);ok(Math.abs(e.x-hx)<1e-9&&Math.abs(e.y-hy)<1e-9,name+': 겨누는 동안 제자리');
 S.calls.imgs.length=0;step(S,2.6,1/30,true);const seen=[...S.calls.imgs];ok(S.calls.hurt.length>=1,name+': 가만히 선 영웅이 맞음',S.calls.hurt);
 const d=S.calls.hurt.reduce((a,b)=>a+b[0],0);ok(d>0&&d<=e.damage*1.0+1e-9,name+': 피해 합 ≤ 근접 한 대('+d.toFixed(2)+')');
 ok(S.calls.hurt.every(h=>h[1]===kind),name+': 피해 출처에 종류 표시');
 ok(seen.some(p=>kind==='laser'?/r1210\/laser-(body|charge|impact|aim)/.test(p||''):/r1210\/sonic-ring|r562/.test(p||'')),name+': 날아가는 동안 재사용 시트로 그림',[...new Set(seen)]);
 // 쿨다운: 바로 다시 겨누지 않음
 const shots=e.r1210.count;step(S,2);ok(e.r1210.count===shots,name+': 쿨다운 동안 다시 안 쏨');
}
{// 레이저: 쏘는 순간 시트 그림
 const S=sandbox();const e=mob('중장 광선포병');S.sb.room.enemies.push(e);for(let i=0;i<400&&!(e.r1210?.count>=1);i++)step(S,1/30);ok(e.r1210?.count===1,'레이저 한 번 쏨');
 S.calls.imgs.length=0;S.sb.drawEffect(S.sb.effects.find(x=>x.type==='r1210-fx'));ok(S.calls.imgs.some(p=>/r1210\/laser-body8/.test(p||''))&&S.calls.imgs.some(p=>/r1210\/laser-impact8/.test(p||'')),'레이저: Dots 몸통·적중 시트로 그림',S.calls.imgs);}
{// 피하면 안 맞음(레이저 조준은 겨누기 시작 때 고정)
 const S=sandbox();const e=mob('프리즘 저격병');S.sb.room.enemies.push(e);for(let i=0;i<400&&e.r1210?.mode!=='windup';i++)step(S,1/30);S.player.y=12.5;step(S,1.5);ok(S.calls.hurt.length===0,'레이저: 예고 보고 옆으로 피하면 안 맞음');}
{// 거리 밖·근접 거리에서는 안 쏨
 const S=sandbox();const a=mob('프리즘 저격병',{x:20}),b=mob('펄스 척후병',{x:11.2});S.sb.room.enemies.push(a,b);step(S,4);ok(!a.r1210?.mode&&!b.r1210?.mode&&S.calls.hurt.length===0,'10칸 밖·1.2칸 근접에서는 원거리 안 함',[a.r1210,b.r1210]);}
{// 엔진 공격 중이면 안 함, 시야 막히면 안 함
 const S=sandbox();const a=mob('프리즘 저격병',{attack:{elapsed:0}});S.sb.room.enemies.push(a);step(S,4);ok(!a.r1210?.mode,'엔진 근접 공격 중엔 안 겨눔');
 const S2=sandbox();S2.sb.clearLine=()=>false;const c=mob('프리즘 저격병');S2.sb.room.enemies.push(c);step(S2,4);ok(!c.r1210?.mode,'시야 막히면 안 겨눔');}
{// 동시 상한
 const S=sandbox();for(let i=0;i<8;i++)S.sb.room.enemies.push(mob('프리즘 저격병',{y:10+(i-4)*.2,x:14}));let mx=0;for(let i=0;i<120;i++){step(S,1/30);mx=Math.max(mx,S.sb.room.enemies.filter(e=>e.r1210?.mode==='windup'||e.r1210?.mode==='fire').length);}
 ok(mx>=1&&mx<=S.A.maxLive,'동시에 겨누기·쏘기 ≤ '+S.A.maxLive,mx);}
{// 디스토피아 아닌 몹·보스는 그대로
 const S=sandbox();const a=mob('숲 고블린'),b=mob('프리즘 저격병',{boss:true});S.sb.room.enemies.push(a,b);step(S,4);ok(!a.r1210?.mode&&!b.r1210?.mode&&S.calls.hurt.length===0,'다른 몹·보스 손대지 않음');}
{// 엔진 원거리(hybrid·ranged) 몹: 엔진 탄 대신 미래형 공격으로
 const S=sandbox();const e=mob('두족류 생체기계 침공병',{ai:'hybrid',rangedAim:Math.PI});S.sb.room.enemies.push(e);S.sb.ranged3(e);
 ok(S.calls.base===0&&S.calls.shot.length===0,'hybrid 디스토피아 몹: 엔진 기본 탄 대신');ok(e.r1210&&e.r1210.kind==='radiation'&&(e.r1210.mode==='lob'||e.r1210.mode==='fire'),'hybrid: 바로 방사능 투척',e.r1210);
 step(S,3);ok(S.calls.hurt.length>=1,'hybrid: 방사능 웅덩이가 맞힘');
 const g=mob('숲 고블린',{ai:'hybrid'});S.sb.ranged3(g);ok(S.calls.base===1,'다른 hybrid 몹은 엔진 그대로');
 // hybrid 몹에는 자체 겨누기를 따로 걸지 않는다(엔진 원거리와 겹쳐 두 배가 되지 않게)
 const S2=sandbox();const h=mob('프리즘 저격병',{ai:'hybrid'});S2.sb.room.enemies.push(h);step(S2,4);ok(!h.r1210||h.r1210.mode!=='windup','hybrid 몹은 자체 겨누기 없음(엔진 원거리 차례만 바꿈)',h.r1210);}
{// 회귀(헤드리스 실측): 몹이 처음엔 '외계 침공군'(레이저)으로 나왔다가 R200·R380 이 이름을 바꾸면 종류도 바뀐 이름을 따라야 한다
 const S=sandbox();const e=mob('외계 침공군');S.sb.room.enemies.push(e);step(S,.1);e.name='방벽 돌진체';for(let i=0;i<120&&!(e.r1210?.count>=1);i++)step(S,1/30);
 ok(e.r1210?.kind==='sonic','이름이 바뀌면 종류도(외계 침공군→방벽 돌진체 = 음파)',e.r1210);
 // 쿨다운: 20초 동안 한 마리 발사 수 ≤ 20/(cd+windup)+1
 const S2=sandbox();const f=mob('프리즘 저격병');S2.sb.room.enemies.push(f);step(S2,20);const u=S2.A.tune.laser;ok(f.r1210.count<=Math.floor(20/(u.cd+u.windup))+1,'20초 발사 수 쿨다운 지킴',f.r1210.count);}
{// 회귀(헤드리스 실측): 엔진은 지역을 옮기면 안 쓰는 그림을 내린다 → readyImage 가 비면 addImage 로 다시 부른다(부팅·로딩 중엔 안 부름)
 const S=sandbox();const asked=new Set();S.sb.readyImage=()=>null;S.sb.addImage=p=>{asked.add(p);return {};};const e=mob('프리즘 저격병');S.sb.room.enemies.push(e);step(S,.2);
 ok(['assets/r1210/laser-body8.webp','assets/r1210/sonic-ring.webp','assets/r562/dots/neon-toxic-pool.webp'].every(p=>asked.has(p)),'디스토피아 몹이 보이면 시트를 미리 부름',[...asked]);
 const S2=sandbox();const asked2=[];S2.sb.readyImage=()=>null;S2.sb.addImage=p=>asked2.push(p);S2.sb.loading=true;S2.sb.room.enemies.push(mob('프리즘 저격병'));step(S2,.2);ok(asked2.length===0,'로딩 중엔 부르지 않음');}
{// 보스(사용자 11-19 07:56Z "그맵의 보스는 그맵 몹들의 그런원거리공격 동시에 사용함 이펙트범위크기 66프로증가")
 const S=sandbox();const A=S.A;ok(A.bossScale===1.66,'보스판 크기·범위 1.66배');
 const boss=mob('상대 초인',{boss:true,damage:15,x:15}),m1=mob('프리즘 저격병',{x:30}),m2=mob('포낭 곡사체',{x:30}),dead=mob('펄스 척후병',{hp:0,spawnState:'dead',x:30});
 S.sb.room.enemies.push(boss,m1,m2,dead);
 ok(JSON.stringify(A.mapKinds(S.sb.room).sort())===JSON.stringify(['laser','radiation','sonic']),'맵 몹 종류(죽은 몹 포함)',A.mapKinds(S.sb.room));
 let fired=false;for(let i=0;i<400&&!fired;i++){step(S,1/30);fired=boss.r1210?.count>=1;}ok(fired,'보스가 맵 몹들의 원거리 공격을 씀',boss.r1210);
 ok(JSON.stringify([...boss.r1210.kinds].sort())===JSON.stringify(['laser','radiation','sonic']),'보스는 세 종류를 동시에',boss.r1210.kinds);
 const lv=A.inspect().liveDetail.filter(x=>x.owner===boss.id);ok(lv.length===3&&lv.every(x=>x.scale===1.66),'세 공격이 같은 순간·1.66배',lv);
 step(S,3);const bd=S.calls.hurt.reduce((a,b)=>a+b[0],0);ok(bd>0&&bd<=boss.damage*1.5+1e-9,'보스 한 번 동시 사격 피해 합 ≤ 보스 근접 1.5대('+bd.toFixed(1)+')');
 const lw=A.tune.laser,u=A.scaled('laser');ok(Math.abs(u.width-lw.width*1.66)<1e-9&&Math.abs(u.len-lw.len*1.66)<1e-9,'보스 레이저 폭·길이 1.66배');
 ok(Math.abs(A.scaled('radiation').radius-A.tune.radiation.radius*1.66)<1e-9&&Math.abs(A.scaled('sonic').band-A.tune.sonic.band*1.66)<1e-9,'보스 방사능 반지름·음파 띠 1.66배');
 const S2=sandbox();const b2=mob('숲의 왕',{boss:true});S2.sb.room.enemies.push(b2,mob('숲 고블린'));step(S2,4);ok(!b2.r1210?.count,'디스토피아 몹이 없는 맵의 보스는 그대로');}
{// 끄기
 const S=sandbox();S.A.set({on:false});const e=mob('프리즘 저격병'),h=mob('배양 공병',{ai:'hybrid'});S.sb.room.enemies.push(e);step(S,4);S.sb.ranged3(h);
 ok(!e.r1210?.mode&&S.calls.base===1,'끄면 원래대로(겨누기 없음, 엔진 탄)');ok(JSON.parse(S.sb.localStorage.store['storyworld.r1210.dys']).on===false,'끄기 저장');}
{// 멈춤(모달·로딩) 동안 진행 안 함, 오류 0
 const S=sandbox();S.sb.modal=true;const e=mob('프리즘 저격병');S.sb.room.enemies.push(e);step(S,4);ok(!e.r1210?.mode,'창 열림 동안 안 함');ok(S.A.inspect().stats.errors===0,'오류 0',S.A.inspect());}
console.log(`\nR1210 CPU ${n} 통과`);
