// R1032 CPU 검사: 고유 장비 3종(J의 인장·장미 인장·영웅 고유무기) + 꿈의 조각 강화 + K 패시브 창 · I 장비/기억조각 창 · B 영웅 배치.
//  사용자 2026-11-14 10:59Z·11:01Z·11:09Z 지시, 11:08Z 카드 두 장(I=장비 창 어디서나 / 꿈의 조각은 사몽 층·무한생존에서만).
//  ① 빌드 연결 ② 순수 규칙(비용 n² · 효과 단계 · 조각 획득 · 획득 시점) ③ 가짜 엔진 위 동작(피해·치명·재발동·흡혈·방어·EGO·쿨·키·창)
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
let pass=0,fail=0;const ok=(c,n,x)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,x!==undefined?JSON.stringify(x).slice(0,240):'');}};
const near=(a,b,e=1e-9)=>Math.abs(a-b)<=e;
const F='gear-r1032.js',API='__STORYWORLD_GEAR_R1032__';
const src=rd(path.join(R,'client-source',F));ok(src.length>0,F+' 있음');
ok(src.length>0&&rd(path.join(R,'runtime-text',F))===src,'runtime-text 사본 = client-source');
try{new vm.Script(src);ok(src.length>0,'문법');}catch(e){ok(false,'문법 '+e.message);}
const html=rd(path.join(R,'runtime-text','index.html'));
ok(html.split('<script src="./'+F+'"></script>').length===2,'index.html 태그 한 번');
ok(html.includes('<script src="./tentacle-strike-r1028.js"></script>\n<script src="./'+F+'"></script>\n'),'태그는 tentacle-strike-r1028 바로 뒤, 자기 줄');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1032/r1032-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(R,'runtime-manifest.json')).includes(F)&&rd(path.join(R,'runtime-inputs.json')).includes(F),'runtime-manifest·inputs 등록');
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 에 drop-shadow·blur 없음');
ok(/bindings=\{z:'w',x:'e',c:'r'\}/.test(html),'전투 기술 키 묶음(z·x·c)은 그대로 — 기술 키를 늘리지 않음');

// ── 가짜 엔진 ──
const HEROES={hwando:{name:'환도',passive:'세 번째 베기',special:'정화 연참',resource:'검의 기세'},seoha:{name:'윤서하',passive:'p',special:'s',resource:'집중'},neon:{name:'네온',passive:'p',special:'s'},michaela:{name:'미카엘라',passive:'p',special:'s'},lauren:{name:'라우렌',passive:'p',special:'s'},hunter:{name:'헌터',passive:'p',special:'s'},slayer:{name:'슬레이어',passive:'p',special:'s'},gunner:{name:'기억사수',passive:'p',special:'s'}};
function mk(o={}){
 const L={doc:[],win:[],load:[]},els={};
 const el=(tag)=>{const e={tagName:String(tag||'DIV').toUpperCase(),id:'',style:{},dataset:{},className:'',children:[],classList:{add(){},remove(){},toggle(){},contains(){return false;}},appendChild(c){this.children.push(c);if(c.id)els[c.id]=c;return c;},insertBefore(c){this.children.push(c);if(c.id)els[c.id]=c;return c;},removeChild(){},querySelector(){return null;},querySelectorAll(){return[];},setAttribute(){},getAttribute(){return null;},addEventListener(){},remove(){},textContent:'',innerHTML:'',isConnected:true};return e;};
 const store={};if(o.store)store['storyworld.r1032.gear']=JSON.stringify(o.store);
 const sv={here:o.survival===true,lv:o.svLv||1,diff:o.svDiff||'normal',i:0,loop:0,phase:'pre'};
 const sb={console,Math,Number,Object,Array,Set,Map,WeakMap,JSON,String,Date,Promise,Boolean,isFinite,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,performance:{now:()=>0},
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},
  document:{readyState:'loading',getElementById:id=>els[id]||null,head:el('head'),body:el('body'),createElement:el,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(t,f,c)=>{if(t==='keydown')L.doc.push({f,c:!!c});}},
  addEventListener:(t,f)=>{if(t==='keydown')L.win.push(f);if(t==='load')L.load.push(f);},
  HEROES,started:true,modal:false,loading:false,storyScene:null,time:10,layer:o.layer||'STORY',zone:o.zone||'dist00',
  progress:{STORY:Object.fromEntries((o.done||[]).map(z=>[z,true])),DREAM:{}},visited:new Set(),
  regionById:{dist00:{index:0},samong01:{index:10},last305:{index:31}},
  player:{hero:o.hero||'hwando',x:5,y:5,hp:100,level:1,ego:0,egoCD:0,specialCD:0,blinkCD:0,resonance:40,storyWER:{ready:{},buffs:{}}},
  room:{id:o.zone||'dist00',difficultyR63:o.diff||'normal',enemies:[],props:[]},
  calls:{open:[],close:0,hit:[],hurt:[],kill:[],toast:[],r720:0,book:0},
 };
 sb.completed=(id,l=sb.layer)=>sb.progress[l]?.[id]===true;
 sb.maxHP=()=>200;
 sb.openPanel=h=>{sb.modal=true;sb.calls.open.push(String(h));};sb.closePanel=()=>{sb.modal=false;sb.calls.close++;};
 sb.toast=t=>{sb.calls.toast.push(String(t));};sb.floatText=()=>{};sb.fx=()=>{};
 sb.killEnemy=function(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;sb.calls.kill.push(e.id);};
 sb.hitEnemy=function(e,v){if(!e||e.hp<=0||!(v>0)||!Number.isFinite(v))return false;sb.calls.hit.push({id:e.id,v});const a=Math.min(e.hp,v);e.hp-=a;if(e.hp<=0)sb.killEnemy(e);return true;};
 sb.hurt=function(d,s){if(!Number.isFinite(d)||d<=0)return'ignored';sb.calls.hurt.push(d);sb.player.hp-=d;return'hit';};
 sb.ego=function(){if(sb.player.egoCD>0||sb.player.ego>0||sb.player.resonance<30)return;sb.player.resonance-=30;sb.player.ego=3;sb.player.egoCD=6;};
 sb.tick=function(dt){sb.time+=dt;};
 sb.window=sb;sb.self=sb;
 sb.__STORYWORLD_SURVIVAL_R600__={here:()=>sv.here,state:()=>({lv:sv.lv,diff:sv.diff,i:sv.i,loop:sv.loop,phase:sv.phase})};
 sb.__STORYWORLD_HERO_DEFENSE_R720__={toggle:()=>{sb.calls.r720++;return true;}};
 sb.__STORYWORLD_PLAY_R169__={book:()=>[{key:'story:a',title:'첫 쪽지',place:'악마화 나무의 정원'},{key:'story:b',title:'둘째 <b>',place:'거미동굴'}],showBook:()=>{sb.calls.book++;}};
 sb.__STORYWORLD_PASSIVE_UNLOCK_R1025__={mode:()=>sv.here?'survival':'story',level:()=>sv.here?sv.lv:sb.player.level,table:()=>({hwando:[{kinds:['moon'],at:5,open:true},{kinds:['clones'],at:15,open:false},{kinds:['trio'],at:30,open:false}]}),names:()=>({moon:'묵월',clones:'칠묵영',trio:'삼협묵희'})};
 sb.__STORYWORLD_PASSIVE_GROWTH_R971__={rank:()=>3};
 vm.createContext(sb);vm.runInContext(src,sb);for(const f of L.load)f();
 const key=(k,x={})=>{const ev={key:k,code:'Key'+k.toUpperCase(),repeat:false,ctrlKey:false,metaKey:false,altKey:false,target:{tagName:'CANVAS'},prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},stopPropagation(){this.stopped=true;},...x};
  for(const l of L.doc.filter(l=>l.c))l.f(ev);if(!ev.stopped){for(const l of L.doc.filter(l=>!l.c))l.f(ev);for(const f of L.win)f(ev);}return ev;};
 const run=(sec,step=.05)=>{for(let t=0;t<sec-1e-9;t+=step)sb.tick(step);};
 return {sb,sv,store,key,run,api:sb[API]};}

// ── ② 순수 규칙 ──
{const m=mk(),A=m.api,P=A&&A.pure;ok(!!A&&!!P,'API·순수 함수 노출');
 if(P){
 ok(P.cost(1)===P.BASE&&P.cost(2)===4*P.BASE&&P.cost(7)===49*P.BASE,'강화 비용 = 기본값 × n² (1→'+P.BASE+', 2→4배, 7→49배)',[P.cost(1),P.cost(2),P.cost(7)]);
 ok(P.MAX===7,'단계 0~7(패시브 강화 #533 과 같은 7단계)');
 ok(P.cost(0)===Infinity&&P.cost(8)===Infinity&&P.cost(NaN)===Infinity&&P.cost(-1)===Infinity,'범위 밖 단계 비용은 Infinity(살 수 없음)');
 const e0=P.effects({seal:0,rose:0,weapon:0}),e7=P.effects({seal:7,rose:7,weapon:7}),eX=P.effects({seal:99,rose:NaN,weapon:-3});
 ok(e7.lifesteal>e0.lifesteal&&e7.defense>e0.defense&&e7.ego>e0.ego,'J의 인장 강화: 흡혈·방어·EGO 지속이 오른다',[e0,e7]);
 ok(e7.critChance>e0.critChance&&e7.critMult>e0.critMult,'장미 인장 강화: 치명 확률·치명 피해가 오른다');
 ok(e7.damage>e0.damage&&e7.cdr>e0.cdr&&e0.damage===0&&e0.cdr===0,'고유무기 강화: 모든 피해·쿨 감소가 오른다(0단계는 0)');
 ok(near(eX.lifesteal,e7.lifesteal)&&near(eX.critChance,e0.critChance)&&eX.damage===0,'단계 99→7, NaN·음수→0 으로 자름');
 ok(e7.critChance<=.3&&e7.defense<=.25&&e7.lifesteal<=.08&&e7.cdr<=.25&&e7.critMult<=2.5,'상한(치명 ≤30%, 방어 ≤25%, 흡혈 ≤8%, 쿨 ≤25%, 치명 피해 ≤2.5배)',e7);
 ok(e7.echo>0&&e7.echo<1,'재발동 피해 비율 0~1',e7.echo);
 // 조각 획득: 사몽 층·무한생존만(11:08Z 카드)
 const g=(x)=>P.gain(x);
 ok(g({layer:'STORY',kind:'mob',diff:'normal',index:0})===0&&g({layer:'STORY',kind:'boss',diff:'hard',index:30})===0,'스토리 본편(사몽 전)에서는 조각이 안 나옴');
 const mob=g({layer:'DREAM',kind:'mob',diff:'normal',index:0}),boss=g({layer:'DREAM',kind:'boss',diff:'normal',index:0}),quest=g({layer:'DREAM',kind:'quest',diff:'normal',index:0});
 ok(mob>0&&boss>mob&&quest>mob,'사몽 층: 몹 < 보스, 서사 지역 완료도 조각',[mob,boss,quest]);
 ok(g({layer:'DREAM',kind:'mob',diff:'easy',index:0})<mob&&g({layer:'DREAM',kind:'mob',diff:'hard',index:0})>mob,'난이도 비례(쉬움 < 보통 < 어려움)');
 ok(g({layer:'DREAM',kind:'mob',diff:'normal',index:20})>mob,'뒤 지역일수록 더 많이');
 ok(g({survival:true,kind:'mob',diff:'normal',index:0})>0&&g({survival:true,kind:'mob',diff:'combat',index:0})>g({survival:true,kind:'mob',diff:'easy',index:0}),'무한생존에서도 얻고 난이도 비례');
 const bad=g({layer:'DREAM',kind:'mob',diff:'??',index:NaN});ok(Number.isFinite(bad)&&bad>=0,'모르는 난이도·NaN 지역도 유한값',bad);
 ok(g({layer:'DREAM',kind:'boss',diff:'hard',index:1e9})<=200,'지역 배수 상한(보스 한 마리 ≤200)');
 // 획득 시점
 ok(P.owned('seal',{mode:'story',done:[]})===false&&P.owned('seal',{mode:'story',done:['ep1a11']})===true,'J의 인장 = 스토리 ep1a11(천사의 가면과 의목사 후보생) 뒤');
 ok(P.owned('rose',{mode:'story',done:['ep1a11']})===false&&P.owned('rose',{mode:'story',done:['last305']})===true,'장미 인장 = last305(고블린 두목과 장미 인장) 뒤');
 ok(P.owned('seal',{mode:'survival',lv:1})===false&&P.owned('seal',{mode:'survival',lv:2})===true&&P.owned('rose',{mode:'survival',lv:3})===false&&P.owned('rose',{mode:'survival',lv:4})===true,'무한생존은 서사 없이 생존 레벨 2·4 에 얻음');
 ok(P.owned('weapon',{mode:'story',done:[]})===true,'고유무기는 처음부터');
 // 무기 이름표
 const W=P.WEAPONS;ok(Object.keys(HEROES).every(h=>W[h]&&W[h].name&&W[h].shape),'8영웅 모두 무기 이름·모양');ok(W.hwando.name==='환도','환도 영웅 무기 = 환도');
 ok(/소총/.test(W.gunner.name)&&/창/.test(W.lauren.name)&&/활|궁/.test(W.hunter.name)&&/대검/.test(W.slayer.name),'무기 모양 = 실제 든 무기(기억사수 소총·라우렌 창·헌터 활·슬레이어 대검)');
 // 인장 그림: 원 + 똑바른 십자(세로·가로 막대 가운데) + 오른쪽 아래 J
 const s=P.sealSvg();ok(/<circle/.test(s)&&/data-cross="v"/.test(s)&&/data-cross="h"/.test(s)&&/>J</.test(s),'J의 인장 그림: 원·십자·J',s.slice(0,120));
 const v=/data-cross="v"[^>]*?\sx="([\d.]+)"[^>]*?\swidth="([\d.]+)"/.exec(s),h=/data-cross="h"[^>]*?\sy="([\d.]+)"[^>]*?\sheight="([\d.]+)"/.exec(s);
 ok(v&&h&&near(+v[1]+ +v[2]/2,50,.01)&&near(+h[1]+ +h[2]/2,48,6),'십자는 똑바로(세로 막대 가운데 x=50, 기울임 없음)',[v&&v.slice(1),h&&h.slice(1)]);
 ok(!/rotate|skew/.test(s),'십자에 회전·기울임 없음');
 const j=/<text[^>]*x="([\d.]+)"[^>]*y="([\d.]+)"[^>]*>J</.exec(s);ok(j&&+j[1]>62&&+j[2]>70,'J 이니셜은 오른쪽 아래',j&&j.slice(1));
 }}

// ── ③ 가짜 엔진 위 동작 ──
// 강화: 조각 부족 → 거절, 충분 → 단계+1·조각 차감, 최대 → 거절, 저장
{const m=mk({store:{frags:0}}),A=m.api;if(A){
 ok(A.upgrade('weapon').ok===false&&A.levels().weapon.hwando===0,'조각 부족이면 강화 거절');
 A.qaGive(10000);const f0=A.frags();const r=A.upgrade('weapon');ok(r.ok&&A.levels().weapon.hwando===1&&A.frags()===f0-A.pure.cost(1),'강화: 단계 1·비용 차감',r);
 for(let i=0;i<10;i++)A.upgrade('weapon');ok(A.levels().weapon.hwando===7&&A.upgrade('weapon').ok===false,'7단계에서 멈춤');
 ok(A.levels().weapon.seoha===0,'무기 단계는 영웅마다 따로');
 ok(A.upgrade('seal').ok===false,'아직 얻지 못한 인장은 강화 못 함(스토리 ep1a11 전)');
 const saved=JSON.parse(m.store['storyworld.r1032.gear']||'{}');ok(saved.weapon&&saved.weapon.hwando===7,'단계·조각을 저장',saved);
 const m2=mk({store:saved});ok(m2.api.levels().weapon.hwando===7&&m2.api.frags()===A.frags(),'다시 불러와도 그대로');
 const m3=mk({store:{frags:'x',weapon:{hwando:1e9,evil:3},seal:NaN}});ok(m3.api.frags()===0&&m3.api.levels().weapon.hwando===7&&m3.api.levels().seal===0&&!('evil' in m3.api.levels().weapon),'깨진 저장값은 잘라 읽음',m3.api.levels());}}
// 조각 획득: 스토리 본편 0, 사몽 층·생존은 처치·보스·지역 완료
{const m=mk(),A=m.api;if(A){const e={id:'a',hp:5};m.sb.killEnemy(e);ok(A.frags()===0,'스토리 본편 처치 → 조각 없음');}}
{const m=mk({layer:'DREAM',zone:'samong01'}),A=m.api;if(A){const E=[{id:'a',hp:5},{id:'b',hp:5,boss:true}];
 m.sb.killEnemy(E[0]);const f1=A.frags();ok(f1>0,'사몽 층 몹 처치 → 조각',f1);m.sb.killEnemy(E[0]);ok(A.frags()===f1,'같은 적 두 번 처치해도 한 번만');
 m.sb.killEnemy(E[1]);ok(A.frags()-f1>=5*(f1),'보스는 몹보다 훨씬 많이',A.frags());
 const f2=A.frags();m.sb.progress.DREAM.samong01=true;m.run(.3);ok(A.frags()>f2,'사몽 지역 완료(서사 진행) → 조각');const f3=A.frags();m.run(.3);ok(A.frags()===f3,'같은 지역 완료는 한 번만');}}
{const m=mk({survival:true,svLv:1}),A=m.api;if(A){m.sb.killEnemy({id:'s',hp:3});ok(A.frags()>0,'무한생존 처치 → 조각');const f=A.frags();m.sv.phase='clear';m.run(.2);ok(A.frags()>f,'무한생존 지역 정화 → 조각');}}
// 피해: 무기 배수 · 치명 · 재발동(연쇄 없음) · NaN
{const m=mk({store:{frags:0,weapon:{hwando:7}}}),A=m.api;if(A){const e={id:'t',hp:1e6};A.qaRoll(()=>0.99);
 m.sb.hitEnemy(e,100);const ef=A.effects();ok(near(m.sb.calls.hit[0].v,100*(1+ef.damage),1e-6),'고유무기 7단계: 피해 ×(1+'+ef.damage+')',m.sb.calls.hit);
 m.sb.hitEnemy(e,NaN);m.sb.hitEnemy(e,Infinity);ok(m.sb.calls.hit.length===1,'NaN·Infinity 피해는 엔진에 넘기지 않음');}}
{const m=mk({done:['last305'],store:{rose:7}}),A=m.api;if(A){const e={id:'t',hp:1e6};const ef=A.effects();
 A.qaRoll(()=>0);m.sb.hitEnemy(e,100);ok(near(m.sb.calls.hit[0].v,100*ef.critMult,1e-6),'치명: 피해 × 치명 배수',m.sb.calls.hit[0]);
 ok(m.sb.calls.hit.length===1,'재발동은 바로가 아니라 잠깐 뒤');m.run(.3);
 ok(m.sb.calls.hit.length===2&&near(m.sb.calls.hit[1].v,100*ef.critMult*ef.echo,1e-6),'크리티컬 시 같은 공격이 한 번 더(피해 = 치명 피해 × '+ef.echo+')',m.sb.calls.hit);
 m.run(1);ok(m.sb.calls.hit.length===2,'재발동은 다시 재발동을 부르지 않음(주사위가 늘 치명이어도)');
 A.qaRoll(()=>0.999);m.sb.hitEnemy(e,100);m.run(.5);ok(m.sb.calls.hit.length===3&&near(m.sb.calls.hit[2].v,100),'치명 아님 → 그대로 한 번');
 A.qaRoll(()=>0);const n0=m.sb.calls.hit.length;for(let i=0;i<500;i++)m.sb.hitEnemy(e,1);m.run(.5);const echoes=m.sb.calls.hit.length-n0-500;
 ok(echoes>0&&echoes<=A.pure.ECHO_MAX,'재발동은 묶음 상한('+A.pure.ECHO_MAX+') 안 — 렉 방지',echoes);
 const d={id:'d',hp:50};A.qaRoll(()=>0);m.sb.hitEnemy(d,100);const n1=m.sb.calls.hit.length;m.run(.5);ok(m.sb.calls.hit.length===n1,'죽은 적에게는 재발동 안 함');}}
{const m=mk({store:{rose:7}}),A=m.api;if(A){A.qaRoll(()=>0);m.sb.hitEnemy({id:'t',hp:1e6},100);ok(near(m.sb.calls.hit[0].v,100),'장미 인장을 얻기 전(스토리 last305 전)에는 치명 없음');}}
// 흡혈 · 방어 · EGO
{const m=mk({done:['ep1a11'],store:{seal:7}}),A=m.api;if(A){const ef=A.effects();m.sb.player.hp=50;A.qaRoll(()=>.99);
 m.sb.hitEnemy({id:'t',hp:1e6},100);ok(near(m.sb.player.hp,50+100*ef.lifesteal,1e-6),'흡혈: 준 피해 × '+ef.lifesteal,m.sb.player.hp);
 m.sb.player.hp=50;for(let i=0;i<200;i++)m.sb.hitEnemy({id:'t'+i,hp:1e6},1e4);ok(m.sb.player.hp-50<=m.sb.maxHP()*A.pure.LS_CAP+1e-6,'흡혈 초당 상한(최대 체력의 '+A.pure.LS_CAP+')',m.sb.player.hp);
 m.sb.player.hp=m.sb.maxHP();m.sb.hitEnemy({id:'z',hp:1e6},1e4);ok(m.sb.player.hp<=m.sb.maxHP(),'최대 체력을 넘지 않음');
 m.sb.hurt(100,{});ok(near(m.sb.calls.hurt[0],100*(1-ef.defense),1e-6),'방어: 받는 피해 ×(1-'+ef.defense+')',m.sb.calls.hurt);
 m.sb.hurt(NaN,{});ok(m.sb.calls.hurt.length===1,'NaN 피해는 그대로 엔진이 거름');
 m.sb.ego();ok(near(m.sb.player.ego,3*(1+ef.ego),1e-6),'EGO 지속 3초 ×(1+'+ef.ego+')',m.sb.player.ego);
 const before=m.sb.player.ego;m.sb.ego();ok(m.sb.player.ego===before,'EGO 가 이미 켜져 있으면 다시 늘리지 않음');}}
{const m=mk({store:{seal:7}}),A=m.api;if(A){m.sb.hurt(100,{});ok(near(m.sb.calls.hurt[0],100),'인장을 얻기 전에는 방어 효과 없음');}}
// 쿨 감소
{const m=mk({store:{weapon:{hwando:7}}}),A=m.api;if(A){const ef=A.effects();m.sb.player.specialCD=10;m.sb.player.storyWER.ready['hwando:w']=m.sb.time+10;
 const m0=mk();m0.sb.player.specialCD=10;
 m.run(1);m0.run(1);ok(m0.sb.player.specialCD===10&&near(10-m.sb.player.specialCD,1/(1-ef.cdr)-1,1e-6),'쿨 감소 '+ef.cdr+': 1초에 쿨이 1/(1-cdr) 배로 빨리 참(엔진 감소분 별도)',m.sb.player.specialCD);
 const rem=m.sb.player.storyWER.ready['hwando:w']-m.sb.time;ok(near(rem,9-(1/(1-ef.cdr)-1),1e-6),'W·E·R 대기(남은 시간)도 같이 빨리 줄어듦',rem);
 m.sb.player.specialCD=0.01;m.run(1);ok(m.sb.player.specialCD===0,'쿨은 0 아래로 내려가지 않음');}}
// 키·창
{const m=mk(),A=m.api;if(A){let ev=m.key('k');ok(m.sb.calls.open.length===1&&/패시브/.test(m.sb.calls.open[0])&&ev.prevented,'K → 패시브 스킬 창');
 ok(m.sb.calls.open[0].includes('세 번째 베기')&&m.sb.calls.open[0].includes('묵월')&&m.sb.calls.open[0].includes('칠묵영')&&/3\s*\/\s*7/.test(m.sb.calls.open[0]),'패시브 창에 영웅 패시브·특수 패시브 갈래(해금 상태)·강화 단계',m.sb.calls.open[0].slice(0,200));
 m.key('k');ok(m.sb.calls.close===1&&!m.sb.modal,'다시 K → 닫힘');
 ev=m.key('i');ok(m.sb.calls.open.length===2&&/고유 장비/.test(m.sb.calls.open[1])&&/기억 조각/.test(m.sb.calls.open[1]),'I → 고유 장비 + 기억 조각 목록');
 ok(m.sb.calls.open[1].includes('첫 쪽지')&&m.sb.calls.open[1].includes('둘째 &lt;b&gt;')&&!m.sb.calls.open[1].includes('둘째 <b>'),'기억 조각 목록(쪽지 모음)을 보여 주고 글은 이스케이프');
 ok(m.sb.calls.open[1].includes('환도')&&m.sb.calls.open[1].includes('꿈의 조각'),'창에 고유무기·꿈의 조각 수');
 m.key('i');ok(!m.sb.modal,'다시 I → 닫힘');
 m.key('I');ok(m.sb.modal,'대문자 I 도 열림');m.key('i');
 const n=m.sb.calls.open.length;m.key('i',{repeat:true});m.key('k',{ctrlKey:true});m.key('i',{target:{tagName:'INPUT'}});ok(m.sb.calls.open.length===n,'키 반복·Ctrl·입력칸에서는 열지 않음');
 m.sb.modal=true;m.key('i');ok(m.sb.calls.open.length===n&&m.sb.modal,'다른 창이 열려 있으면 덮지도 닫지도 않음');m.sb.modal=false;
 m.sb.storyScene={};m.key('k');ok(m.sb.calls.open.length===n,'서사 장면 중에는 열지 않음');m.sb.storyScene=null;
 m.sb.loading=true;m.key('k');ok(m.sb.calls.open.length===n,'불러오는 중에는 열지 않음');m.sb.loading=false;
 m.sb.started=false;m.key('i');ok(m.sb.calls.open.length===n,'시작 화면에서는 열지 않음');m.sb.started=true;
 ev=m.key('b');ok(m.sb.calls.r720===0&&!ev.prevented,'스토리에서 B 는 아무 일도 안 함');}}
{const m=mk({survival:true}),A=m.api;if(A){const ev=m.key('i');ok(/고유 장비/.test(m.sb.calls.open[0]||'')&&ev.stopped&&m.sb.calls.r720===0,'무한생존에서도 I → 장비 창(영웅 배치 I 는 막음)');
 ok(/영웅 배치/.test(m.sb.calls.open[0]||''),'생존 장비 창 안에 영웅 배치 단추');m.key('i');
 const b=m.key('b');ok(m.sb.calls.r720===1&&b.prevented,'무한생존 B → 영웅 배치 창(11:09Z 지시)');
 const m2=mk({survival:true});m2.sb.modal=true;m2.key('b');ok(m2.sb.calls.r720===1,'B 는 배치 창 토글(R720 이 열기·닫기 판단)');}}
// 업그레이드 창 단추가 실제로 강화
{const m=mk(),A=m.api;if(A){A.qaGive(1000);const html=A.gearHtml();ok(/data-r1032up="weapon"/.test(html),'창에 무기 강화 단추');ok(/data-r1032up="seal"[^>]*disabled/.test(html),'얻지 못한 인장 단추는 잠김');}}
console.log(`\nR1032 CPU: ${pass} 통과 / ${fail} 실패`);process.exit(fail?1:0);
