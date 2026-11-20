// R1250 CPU 검사: 외부 제안 검토 ③ "난이도는 사망 횟수와 교전 시간을 함께. 스토리는 첫 중간보스까지 걸린 시간과 예고를 보고 회피한 비율,
//  무한생존·777 은 도달 구간과 코어 파괴를 기록" → 이 기기 안에만(localStorage) 남기는 가벼운 플레이 기록.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');const F='play-log-r1250.js',KEY='storyworld.r1250.playlog';
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,400):''));};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok('client-source/'+F+' 있음',!!src);
function boot(o={}){const store=new Map(Object.entries(o.store||{}));const intervals=[];
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Error,isFinite,Date,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},performance:{now:()=>0},
  document:{readyState:'complete',getElementById:()=>null,querySelector:()=>null,head:{appendChild(){}},addEventListener(){},createElement:()=>({style:{},appendChild(){},setAttribute(){}})},
  addEventListener(){},setInterval:(f,ms)=>{intervals.push(ms);return 0;},setTimeout:()=>0,
  started:false,loading:false,modal:null,storyScene:null,layer:'STORY',time:0,zone:'hub',hazards:[],
  player:{x:5,y:5,hp:100,hero:'hwando'},room:{id:'hub',enemies:[]}};
 sb.window=sb;
 sb.hurt=function(d,src){if(sb.player.invincible)return 'invulnerable';sb.player.hp=Math.max(0,sb.player.hp-d);return sb.player.hp>0?'hit':'dead';};
 sb.newGame=async function(h){sb.started=true;sb.time=0;sb.player.hp=100;return true;};
 if(o.survival)sb.__STORYWORLD_SURVIVAL_R600__=o.survival;
 vm.createContext(sb);try{vm.runInContext(src,sb);}catch(e){console.log('load error',e.message);}return {sb,store,intervals,A:sb.__STORYWORLD_PLAY_LOG_R1250__};}
const a=boot();const A=a.A;
ok('전역 API __STORYWORLD_PLAY_LOG_R1250__ (tick·current·runs·summary·clear·set)',!!A&&['tick','current','runs','summary','clear','set'].every(k=>typeof A[k]==='function'));
ok('폴링 간격 500ms 이상(성능 부담 없음)',a.intervals.length>0&&a.intervals.every(ms=>ms>=500),a.intervals);
if(A){const {sb}=a;const step=(dt,k=1)=>{for(let i=0;i<k;i++){sb.time+=dt;A.tick();}};
 A.tick();ok('시작 전에는 기록 없음',A.current()===null);
 sb.newGame('hwando');sb.room={id:'dist00',enemies:[]};sb.zone='dist00';A.tick();
 const c0=A.current();ok('newGame 뒤 스토리 기록 시작',c0&&c0.mode==='story'&&c0.hero==='hwando',c0);
 step(.5,20);// 10초 교전 없음
 sb.room.enemies=[{x:8,y:5,hp:10}];step(.5,40);// 20초 교전
 ok('교전 시간 = 적이 9칸 안에 있던 게임 시간(≈20초)',Math.abs(A.current().combatSecs-20)<=1,A.current());
 ok('전체 플레이 시간도 셈(≈30초)',Math.abs(A.current().playSecs-30)<=1,A.current());
 // 예고 회피: 위협받은 예고 2개 중 1개 맞음
 const h1={id:1,type:'field',x:5,y:5,radius:2,age:0,warning:1.2,life:2,damage:10},h2={id:2,type:'field',x:5.5,y:5,radius:2,age:0,warning:1.2,life:2,damage:10},h3={id:3,type:'field',x:30,y:30,radius:2,age:0,warning:1.2,life:2,damage:10},h4={id:4,type:'field',x:5,y:5,radius:2,age:0,warning:1.2,life:2,damage:0};
 sb.hazards=[h1,h2,h3,h4];A.tick();
 sb.player.x=9;for(const h of sb.hazards)h.age=1.3;A.tick();// h2 피함(경계 밖으로 나감)
 sb.player.x=5;sb.hurt(10,h1);for(const h of sb.hazards)h.age=2.1;A.tick();sb.hazards=[];A.tick();
 let c=A.current();ok('예고 본 수 = 영웅을 위협한 피해 예고만(먼 예고·피해 0 예고 빼고) 2',c.telegraphs===2,c);
 ok('예고 회피 비율 = 1/2',c.telegraphs===2&&c.dodged===1&&Math.abs(c.dodgeRate-.5)<1e-9,c);
 // 회피 무적으로 막은 예고 = 피함
 const h5={id:5,type:'field',x:5,y:5,radius:2,age:0,warning:1,life:2,damage:10};sb.hazards=[h5];A.tick();sb.player.invincible=1;sb.hurt(10,h5);sb.player.invincible=0;h5.age=2.1;A.tick();sb.hazards=[];A.tick();
 c=A.current();ok('회피 무적으로 받아낸 예고는 피한 것으로',c.telegraphs===3&&c.dodged===2,c);
 // 빔 예고
 const b1={id:6,type:'beam',x:0,y:5,angle:0,reach:10,width:.38,age:0,warning:1,life:2,damage:10};sb.hazards=[b1];A.tick();b1.age=2.1;A.tick();sb.hazards=[];A.tick();
 c=A.current();ok('빔(직선) 예고 위 영웅도 위협받은 것으로 셈',c.telegraphs===4,c);
 // 첫 중간보스
 sb.room.enemies=[{x:8,y:5,hp:10},{x:9,y:6,hp:500,boss:true,name:'정원의 악마'}];step(.5,2);
 c=A.current();ok('첫 중간보스 도달 시간(게임 시간, 약 31초) 기록',c.firstBoss&&Math.abs(c.firstBoss.secs-31)<=1.5&&c.firstBoss.zone==='dist00',c.firstBoss);
 step(.5,4);ok('첫 중간보스 시간은 한 번만(덮어쓰지 않음)',Math.abs(A.current().firstBoss.secs-31)<=1.5);
 // 사망
 sb.hurt(500,{});ok('사망 1회',A.current().deaths===1,A.current());
 sb.hurt(10,{});ok('이미 쓰러진 뒤 더 맞아도 사망은 그대로',A.current().deaths===1);
 sb.player.hp=100;sb.hurt(500,{});ok('다시 일어나서 또 쓰러지면 2회',A.current().deaths===2);
 // 시간 되감기(지역 이동으로 time 이 줄어듦) → 음수로 빼지 않음
 const p0=A.current().playSecs;sb.time=1;A.tick();ok('게임 시간이 줄어도 음수로 안 셈',A.current().playSecs>=p0);
 // 저장
 A.save();const st=JSON.parse(a.store.get(KEY)||'{}');ok('localStorage 에 저장',Array.isArray(st.runs)&&st.runs.length>=1&&st.runs[st.runs.length-1].mode==='story',st);
 // 요약
 const s=A.summary();ok('요약에 사망·교전·첫 중간보스·회피 비율이 함께',typeof s==='string'&&/사망/.test(s)&&/교전/.test(s)&&/중간보스/.test(s)&&/회피/.test(s),s);
 // 새 게임 = 새 기록
 sb.newGame('lauren');A.tick();ok('새 게임이면 새 기록',A.current().hero!=='hwando'||A.runs().length>=2,A.runs().length);
}
// R1250b(Codex 리뷰 #890): 숨은(spawnState≠active) 적은 교전·첫 보스로 세지 않음, footprint154 예고(병원 의료 공격)도 위협으로 셈
{const b=boot();const B=b.A,sb=b.sb;
 sb.footprintContains154=(g,x,y,r=0)=>g.shape==='circle'&&Math.hypot(x-g.x,y-g.y)<=g.radius+r;
 if(B){sb.newGame('hwando');sb.room={id:'murder01',enemies:[{x:7,y:5,hp:500,boss:true,name:'숨은 보스',spawnState:'hidden'}]};B.tick();
  for(let i=0;i<20;i++){sb.time+=.5;B.tick();}
  let c=B.current();ok('숨은 보스(spawnState hidden)는 첫 보스·교전 시간에 안 셈',c&&c.firstBoss===null&&c.combatSecs===0,c);
  sb.room.enemies[0].spawnState='active';sb.time+=.5;B.tick();sb.time+=.5;B.tick();c=B.current();
  ok('나타난 뒤(active)에는 첫 보스·교전 시간 셈',c.firstBoss&&c.firstBoss.name==='숨은 보스'&&c.combatSecs>0,c);
  sb.room.enemies=[];const t0=c.telegraphs;
  const m={id:'med',type:'medical20',x:9,y:9,age:0,warning:1,life:2,damage:12,footprint154:{shape:'circle',x:5,y:5,radius:1.2}};
  sb.hazards=[m];B.tick();sb.player.x=9;m.age=1.5;B.tick();sb.hazards=[];B.tick();c=B.current();
  ok('footprint154 만 가진 예고(병원 의료 공격) 안에 서 있다 피하면 본 수·피한 수에 들어감',c.telegraphs===t0+1&&c.dodged>=1,c);}
}
// 무한생존
{let st={active:true,diff:'hard',i:0,loop:0,ids:7,lv:1,hero:'ego',kills:0,over:false,core:{hp:100}};
 const surv={active:()=>!!st.active,state:()=>st.active?JSON.parse(JSON.stringify(st)):null,inspect:()=>({active:!!st.active})};
 const b=boot({survival:surv});const B=b.A;
 if(B){b.sb.started=true;b.sb.layer='STORY';B.tick();let c=B.current();ok('생존 기록 시작(난이도·영웅)',c&&c.mode==='survival'&&c.diff==='hard'&&c.hero==='ego',c);
  ok('EGO·페르소나(777 해금 영웅)는 secret777 표시',c&&c.secret777===true,c);
  st.i=3;st.loop=1;st.kills=120;st.lv=40;B.tick();c=B.current();ok('도달 구간 = 회차·단계 최고값',c.maxStage===3&&c.maxLoop===1&&c.stageLabel==='2회차 4/7',c);
  st.core.hp=0;st.over=true;B.tick();const runs=B.runs();const last=runs[runs.length-1];
  ok('코어 파괴로 끝나면 coreDestroyed=true 로 닫힘',last&&last.mode==='survival'&&last.coreDestroyed===true&&last.ended===true,last);
  ok('닫힌 뒤 current 는 비움',B.current()===null);
  const s=B.summary();ok('요약에 도달 구간·코어 파괴',/구간/.test(s)&&/코어/.test(s),s);}
}
// 손상된 저장·상한
{const b=boot({store:{[KEY]:'{oops'}});ok('깨진 저장도 멈추지 않고 비움',b.A&&Array.isArray(b.A.runs())&&b.A.runs().length===0);
 const many={v:1,runs:Array.from({length:80},(_,i)=>({mode:'story',id:i,ended:true}))};const c=boot({store:{[KEY]:JSON.stringify(many)}});ok('기록은 최근 50판까지만',c.A&&c.A.runs().length===50,c.A&&c.A.runs().length);
 c.A&&c.A.clear();ok('지우기',c.A&&c.A.runs().length===0&&!/"id"/.test(c.store.get(KEY)||''));}
{const b=boot();b.A&&b.A.set({on:false});b.sb.started=true;b.A&&b.A.tick();ok('끄기(on:false)면 기록 안 함',b.A&&b.A.current()===null);}
ok('서버·네트워크로 보내지 않음(fetch·XMLHttpRequest·WebSocket·sendBeacon 없음)',!/(fetch\(|XMLHttpRequest|WebSocket|sendBeacon)/.test(src));
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('runtime-text/index.html 스크립트 태그',idx.includes('src="./'+F+'"'));
ok('runtime-text 사본이 client-source 와 같음',(()=>{try{return fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src;}catch(_){return false;}})());
ok('verify-r96-public 기대 목록',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes(F));
ok('pages.yml 에 이 검사 줄',fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1250/r1250-cpu-check.cjs'));
console.log(`R1250 CPU ${bad?'FAILED':'PASSED'} ${n-bad}/${n}`);process.exit(bad?1:0);
