// R1213 CPU 검사 — 기계 계열 나머지 지역 몹 원거리(레이저·방사능·음파·폭탄), dys-ranged-r1210.js 확장
//  사용자 2026-11-19 07:31Z "기계는 방사능 폭탄 레이져 음파", 07:41Z "일반몹은 하나의 원거리 공격만해 / 각몹에맞게", 07:56Z "최대한 다채롭게 + 그맵의 보스는 그맵 몹들의 원거리공격 동시에 66프로"
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='dys-ranged-r1210.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1213/r1213-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('r1213/bomb-blast24.webp'),'runtime-manifest 에 폭탄 시트');
{const a='assets/r1213/bomb-blast24.webp';ok(src.includes(a)&&fs.existsSync(path.join(R,'runtime-text',a)),'폭탄 터짐 시트 있음');
 const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1213/index.json'),'utf8'));ok(idx['bomb-blast24']?.frames===24&&idx['bomb-blast24'].final===false&&/r411/.test(idx['bomb-blast24'].source),'시트 표: 24칸·재채색 임시본·원본 경로',idx);}
// ---- 샌드박스(R1210 검사와 같은 모양 + filter 기록) ----
function sandbox(){
 const calls={hurt:[],base:0,draw:[],imgs:[],filters:[]};
 const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k)?((...a)=>{calls.draw.push(k);if(k==='drawImage')calls.imgs.push(a[0]&&a[0].src);}):undefined),set:(o,k,v)=>{if(k==='filter')calls.filters.push(v);o[k]=v;return true;}});
 const player={x:10,y:10,hp:100,invincible:0};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{enemies:[]},effects:[],W:960,H:540,
  project:(x,y)=>({x:(x-y)*32+480,y:(x+y)*16}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:1536,height:1024,naturalWidth:1536}}),
  clearLine:()=>true,blocked:()=>false,facing:()=>'right',hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1210]);return 'hit';},
  enemyShot:()=>({}),drawEffect(){},tick(dt){},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 sb.ranged3=function(e){calls.base++;};sb.window.window=sb.window;
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_DYS_RANGED_R1210__};
}
const mob=(name,o={})=>({id:'e'+Math.random(),name,hp:100,maxHp:100,damage:10,ai:'melee',weapon:'ranged',spawnState:'active',x:14,y:10,radius:.3,cd:0,...o});
const step=(S,secs,dt=1/30,draw=false)=>{for(let i=0;i<secs/dt;i++){S.sb.time+=dt;S.sb.tick(dt);if(draw){const m=S.sb.effects.find(x=>x&&x.type==='r1210-fx');if(m)S.sb.drawEffect(m);}}};
const {A}=sandbox();
// ---- 지역별 몹(헤드리스 makeRoom 전수 11-19, 꼬리 뗀 이름) — 몹마다 한 종류, 지역마다 2종류 이상 ----
const REG={ep1b09:['강철 턱의 사이보그 개','걸어다니는 소형 로봇','설원 잠복 보행기','태엽 수집자'],
 u201:['전쟁기억 정찰드론','전쟁기계사냥개','참호 공명기사','태엽 수집자'],u202:['기계화 망각거미','복종 봉인구','감옥 공명기사','가짜 자비 수집가','태엽 수집자'],
 u204:['기계화 첫 기억 청람잔영','기계화 기억 공백 망령','기계화 문턱 관측거미','태엽 수집자'],u205:['학대기록 공허체','관리자 추적견','역전기록 수집가','태엽 수집자'],
 u206:['기계화 기억이주 연결자','기계화 공명술사','입양기억 청람잔영','태엽 수집자'],u203:['이동문 청람잔영','이동문 공허잔영','최종문 공명기사','태엽 수집자'],
 cult02:['신경 케이블 포식체','합일 주파수 결정','과열 시냅스 점액체','기계화 제8단계 자비 교정관'],cult05:['ID 배양 점액체','생체기계 악몽','본능 추출 결정','설원 아래의 기계 다리'],
 cult06:['SUPER EGO 판결인장','기계재판 연결자','죄책감 압축결정','태엽 수집자']};
const used=new Set();
for(const [r,L] of Object.entries(REG)){const ks=L.map(x=>A.kindFor(x));ok(ks.every(k=>['laser','radiation','sonic','bomb'].includes(k)),r+': 모든 일반 몹이 기계 종류 하나',Object.fromEntries(L.map((x,i)=>[x,ks[i]])));
 ok(new Set(ks).size>=2,r+': 지역 안 2종류 이상(다채롭게)',ks);ks.forEach(k=>used.add(k));}
ok(used.size===4,'기계 네 종류 모두 쓰임',[...used]);
for(const [nm,k] of [['전쟁기억 정찰드론 우두머리','laser'],['태엽 수집자 후속 증원','bomb'],['기계화 망각거미 3','radiation'],['참호 공명기사 추격대','sonic'],['복종 봉인구 증원','laser'],['기계화 감옥 공명기사 우두머리','sonic'],['전극기계수호기사 추격대','laser']])
 ok(A.kindFor(nm)===k,'꼬리 뗀 이름: '+nm+' → '+k,A.kindFor(nm));
for(const nm of ['숲 고블린','늪의 염소머리 악마','검은기둥 주문사','유리 망령','시간수문장 03','잠식된 어부 우두머리','제8단계 자비 교정관'])ok(A.kindFor(nm)===null,'기계 몹 아님: '+nm);
// ---- 폭탄 수치 ----
{const u=A.tune.bomb;ok(u&&u.min>=2.4&&u.max<=7.5&&u.dmg>0&&u.dmg<=.9&&u.windup>=.5&&u.windup<=1,'폭탄: 사거리·한 번 피해·예고 띠',u);
 const dps=u.dmg/(u.cd+u.windup),engine=1/(2.1+.55);ok(dps<=engine*.5,'폭탄: 원거리 압박 ≤ 엔진 원거리 몹의 절반',{dps,engine});
 ok(Math.abs(A.scaled('bomb').radius-u.radius*1.66)<1e-9,'보스 폭탄 반지름 1.66배');}
// ---- 폭탄 동작 ----
{const S=sandbox();const e=mob('걸어다니는 소형 로봇');S.sb.room.enemies.push(e);for(let i=0;i<120&&e.r1210?.mode!=='windup';i++)step(S,1/30);
 ok(e.r1210?.mode==='windup'&&e.r1210.kind==='bomb','폭탄 몹이 겨누기 시작',e.r1210);const hx=e.x;step(S,.3);ok(e.x===hx,'겨누는 동안 제자리');
 S.calls.draw.length=0;S.sb.drawEffect(S.sb.effects.find(x=>x.type==='r1210-fx'));ok(S.calls.imgs.some(p=>/r1213\/bomb-warning8/.test(p||'')),'폭탄 예고: Dots 먹 고리 시트');
 for(let i=0;i<60&&!(e.r1210.count>=1);i++)step(S,1/30);ok(e.r1210.count===1,'폭탄 던짐');ok(S.calls.hurt.length===0,'날아가는 동안엔 안 맞음');
 S.calls.imgs.length=0;step(S,1.2,1/30,true);ok(S.calls.hurt.length===1&&S.calls.hurt[0][1]==='bomb','떨어진 자리에서 한 번 터져 맞음',S.calls.hurt);
 ok(S.calls.hurt[0][0]<=e.damage*.9+1e-9,'폭탄 피해 ≤ 근접 0.9배');ok(S.calls.imgs.some(p=>/r1213\/bomb-blast24/.test(p||''))&&S.calls.imgs.some(p=>/r1213\/ink-dispersal12/.test(p||''))&&S.calls.imgs.some(p=>/r1213\/orb-flight8/.test(p||'')),'통·터짐·먹 흩어짐 시트로 그림',[...new Set(S.calls.imgs)]);
 ok(S.calls.filters.some(f=>/^hue-rotate\(-?\d+deg\)$/.test(f))||A.hueOf('걸어다니는 소형 로봇')===0,'몹 색조 돌리기(hue-rotate)만 씀',S.calls.filters);
 ok(S.calls.filters.every(f=>f===''||f==='none'||/^hue-rotate\(-?\d+deg\)$/.test(f)),'drop-shadow·blur 필터 안 씀(Three.js 기록기)',S.calls.filters);}
{const S=sandbox();const e=mob('태엽 수집자');S.sb.room.enemies.push(e);for(let i=0;i<120&&e.r1210?.mode!=='windup';i++)step(S,1/30);
 step(S,.4);S.player.x=10;S.player.y=13.5;step(S,2);ok(e.r1210.count>=1&&S.calls.hurt.length===0,'폭탄: 예고 보고 떨어질 자리 밖으로 비키면 안 맞음',S.calls.hurt);}
{const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1213/index.json'),'utf8'));
 for(const [k,nf] of [['bomb-warning8',8],['ink-dispersal12',12],['orb-flight8',8],['capsule-flight8',8],['green-warning8',8],['sonic-charge6',6]])ok(idx[k]?.frames===nf&&/^CX-0167RA_machine-/.test(idx[k].source)&&src.includes('assets/r1213/'+k+'.webp')&&fs.existsSync(path.join(R,'runtime-text/assets/r1213',k+'.webp')),'Dots 시트 적용: '+k);}
for(const [name,kind,re] of [['포낭 곡사체','radiation',/r1213\/(green-warning8|capsule-flight8)/],['펄스 척후병','sonic',/r1213\/sonic-charge6/]]){const S=sandbox();const e=mob(name);S.sb.room.enemies.push(e);S.calls.imgs.length=0;step(S,3.5,1/30,true);ok(S.calls.imgs.some(p=>re.test(p||'')),name+': Dots '+kind+' 시트로 예고·날아감',[...new Set(S.calls.imgs)]);}
// ---- 다채롭게: 몹마다 색조 ----
{const hs=Object.values(REG).flat().map(x=>A.hueOf(x));ok(hs.every(h=>h>=-35&&h<=35),'색조 돌리기 -35°~+35°(차가운 계열 안)',hs);ok(new Set(hs).size>=10,'몹마다 색조가 다름',new Set(hs).size);
 ok(A.hueOf('태엽 수집자 우두머리')===A.hueOf('태엽 수집자'),'같은 몹 꼬리 달라도 같은 색조');}
// ---- 보스: 그 맵 몹 종류 동시, 네 종류면 피해 줄임 ----
{const S=sandbox();const boss=mob('제8단계 자비 교정관',{boss:true,damage:15,x:15});S.sb.room.enemies.push(boss,...['기계화 망각거미 1','복종 봉인구','감옥 공명기사','가짜 자비 수집가 우두머리'].map(x=>mob(x,{x:30})));
 ok(JSON.stringify(S.A.mapKinds(S.sb.room).sort())===JSON.stringify(['bomb','laser','radiation','sonic']),'u202 맵 종류 넷',A.mapKinds(S.sb.room));
 let fired=false;for(let i=0;i<400&&!fired;i++){step(S,1/30);fired=boss.r1210?.count>=1;}ok(fired&&boss.r1210.kinds.length===4,'보스가 네 종류를 동시에',boss.r1210);
 const lv=S.A.inspect().liveDetail.filter(x=>x.owner===boss.id);ok(lv.length===4&&lv.every(x=>x.scale===1.66),'네 공격 1.66배',lv);
 S.player.invincible=0;step(S,3);const bd=S.calls.hurt.reduce((a,b)=>a+b[0],0);ok(bd>0&&bd<=boss.damage*1.5+1e-9,'보스 동시 사격 피해 합 ≤ 보스 근접 1.5대('+bd.toFixed(1)+')');
 ok(A.bossK(['laser','radiation','sonic'])===.6&&A.bossK(['laser','radiation','sonic','bomb'])<.6,'종류 셋까지는 0.6배 그대로, 넷이면 줄임',[A.bossK(['laser','radiation','sonic']),A.bossK(['laser','radiation','sonic','bomb'])]);}
// ---- hybrid 기계 몹: 엔진 탄 차례만 바꿈 ----
{const S=sandbox();const e=mob('전쟁기계사냥개',{ai:'hybrid',rangedAim:Math.PI});S.sb.room.enemies.push(e);S.sb.ranged3(e);ok(S.calls.base===0&&S.A.inspect().stats.engine===1&&S.A.inspect().stats.fires.radiation===1,'hybrid 기계 몹: 엔진 탄 대신 자기 종류(방사능)',S.A.inspect().stats);}
ok(sandbox().A.inspect().stats.errors===0,'오류 0');
console.log('R1213 CPU check '+n+' PASS');
