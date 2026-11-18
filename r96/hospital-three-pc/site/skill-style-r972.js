/* R972 — 영웅 스킬을 종류에 맞게 지속 피해(도트)·다단히트로 (사용자 2026-11-13 "스킬종류에 맞게 도트,다단히트도 넣어서 다양한 느낌들게 그거에 맞게 효과음도 들어가고").
 *  총피해는 지금과 같다. 한 번에 들어가던 피해를 나눌 뿐이다.
 *   - 도트(불꽃·독·출혈·감전·성화): 앞에서 (1-share) 만큼 바로, 나머지는 ticks 번에 gap 초마다 나눠 들어간다.
 *     같은 적에게 같은 종류가 다시 걸리면 남은 양에 더하고 틱 수를 새로 센다(한 적·한 종류에 흐름 하나).
 *   - 다단히트(연참·중력 압궤·시간 메아리): n 번으로 똑같이 나눠 gap 초마다.
 *   - 막타는 나누지 않는다(피해가 남은 체력 이상이면 그대로 한 번에).
 *  분류표(TABLE)는 스킬 이름·주제로 정했다(서사·설정 글은 바꾸지 않음):
 *   환도 Q 수묵 3연참·W 월섬 회천 → 연참 / 서하 Q 시계탄·R 최초명령 → 시간 메아리 / 네온 Q 전격 → 감전, R 보스 낙인 → 독 /
 *   미카엘라 Q 빛기둥·R 세라핌 대정화 → 성화 / 라우렌 Q 중력 붕괴 → 중력 압궤 / 헌터 Q 화살·W 바운스 화살 → 불꽃 /
 *   슬레이어 Q 적혈 회오리 → 연참(회오리 출혈은 원래 도트), R 적혈 십자가 폭발 → 출혈.
 *   그대로 한 방: 환도 E(돌진 자체 불변)·R(이미 55타), 라우렌 R 진명 심판(처형), 기억사수 전부(이미 연사), 모든 돌진 E, 평타, 확률 패시브, 기존 도트(R562 독·R535 불).
 *  알아보는 길: 본편 W·E·R = source.kind 'story-wer' + sourceSlot, Q = attackId9 'special:N'(투사체) · R561 붕괴 · R563 빛기둥 · R590 사슬(sourceSlot q),
 *   슬레이어 R425 'q-tornado'·'r-burst', 그리고 출처 없는 엔진 고유기 타격은 special() 안과 그 안에서 건 delay() 콜백 안에서만 Q 로 본다.
 *  이미 있던 도트(R562 독 웅덩이 독·R535 불화살 불·R425 회오리 출혈)는 피해를 그대로 두고 같은 간격 제한으로 틱 소리만 얹는다.
 *  나눈 뒤 타격은 source.kind 'r972-dot'/'r972-multi' 로 엔진 hitEnemy 를 다시 부른다(다시 나누지 않음, 보스·난도 규칙 그대로).
 *  소리: assets/r972/sfx(ElevenLabs, scripts/build-sfx-r972.py) 8종 × 2. 종류마다 간격 제한(도트 sgap .3~.45초, 다단 .07~.1초) → 많은 적이 타도 시끄럽지 않게.
 *  끄기: localStorage 'storyworld.r972.skillstyle' {"on":false}. 새 키·저장 필드·그림 없음. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SKILL_STYLE_R972__)return;
const REV='R972',KEY='storyworld.r972.skillstyle',DIR='assets/r972/sfx/',CAP=600;
let on=true;try{const p=JSON.parse(window.localStorage?.getItem(KEY)||'{}');if(p&&p.on===false)on=false;}catch(_){}
const TABLE=Object.freeze({
 hwando:Object.freeze({q:'slash',w:'slash'}),
 seoha:Object.freeze({q:'echo',r:'echo'}),
 neon:Object.freeze({q:'shock',r:'poison'}),
 michaela:Object.freeze({q:'holy',r:'holy'}),
 lauren:Object.freeze({q:'gravity'}),
 hunter:Object.freeze({q:'burn',w:'burn'}),
 slayer:Object.freeze({q:'slash',r:'bleed'}),
 gunner:Object.freeze({})});
const KINDS=Object.freeze({
 burn:Object.freeze({dot:true,ticks:4,gap:.5,share:.4,sgap:.36,gain:.32}),
 poison:Object.freeze({dot:true,ticks:5,gap:.6,share:.45,sgap:.42,gain:.32}),
 bleed:Object.freeze({dot:true,ticks:4,gap:.45,share:.4,sgap:.36,gain:.32}),
 shock:Object.freeze({dot:true,ticks:3,gap:.3,share:.35,sgap:.3,gain:.32}),
 holy:Object.freeze({dot:true,ticks:4,gap:.5,share:.4,sgap:.4,gain:.32}),
 slash:Object.freeze({dot:false,n:2,gap:.09,sgap:.07,gain:.4}),
 gravity:Object.freeze({dot:false,n:3,gap:.11,sgap:.09,gain:.4}),
 echo:Object.freeze({dot:false,n:2,gap:.16,sgap:.1,gain:.4})});
// 출처 kind → (영웅, 칸). sourceHero 가 있으면 그것이 먼저.
const CHAIN=Object.freeze({'r561-collapse':['lauren','q'],'r563-q-pillar':['michaela','q']});
// 슬레이어 Q·R 은 R425 가 엔진 대신 낸다(Q 적혈 회오리 'q-tornado', R 적혈 십자가 폭발 'r-burst'). Q 출혈(q-bleed)은 이미 도트라 소리만.
const R425=Object.freeze({'q-tornado':'q','r-burst':'r'});
// 이미 있던 도트(피해는 그대로)에는 틱 소리만 얹는다.
const SOUND_ONLY=Object.freeze({'r562-poison':'poison','r535-burn':'burn'}),SOUND_ONLY_R425=Object.freeze({'q-bleed':'bleed'});
const stats={extraTicks:0,seen:0,classified:0,received:0,delivered:0,split:0,dots:0,multis:0,ticks:0,follow:0,lethal:0,sounds:0,soundGated:0,dropped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let qDepth=0,base=null,roomRef=null;const queue=[];const streams=new Map();// key enemy → Map(type → stream)
const soundAt={};
const now=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const paused=()=>{try{return (typeof started!=='undefined'&&!started)||(typeof modal!=='undefined'&&!!modal)||(typeof loading!=='undefined'&&!!loading);}catch(_){return false;}};
const curRoom=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
function heroOf(s){if(s&&typeof s.sourceHero==='string')return s.sourceHero;try{return player&&player.hero;}catch(_){return null;}}
function classify(s){
 if(s&&(s.r972||s.r975Multi||s.multiHit||s.kind==='r972-dot'||s.kind==='r972-multi'))return null;
 let hero=heroOf(s),slot=null;
 if(s&&typeof s==='object'){
  if(s.kind==='story-wer'&&typeof s.sourceSlot==='string')slot=s.sourceSlot;
  else if(CHAIN[s.kind]){hero=s.sourceHero||CHAIN[s.kind][0];slot=CHAIN[s.kind][1];}
  else if(s.kind==='story-hwando-chain-r590'&&s.sourceSlot==='q')slot='q';
  else if(typeof s.attackId9==='string'&&/^special:/.test(s.attackId9))slot='q';
  else if(s.kind==='r425'&&R425[s.r425]){hero='slayer';slot=R425[s.r425];}
  else if(!s.kind&&!s.attackKind9&&qDepth>0&&!s.r535&&!s.r562)slot='q';
 }else if(s==null&&qDepth>0)slot='q';
 if(!slot||!hero||!TABLE[hero])return null;const type=TABLE[hero][slot];return type?{hero,slot,type}:null;}
function follow(s,type,hero,slot,dot){const o={kind:dot?'r972-dot':'r972-multi',friendly:true,owner:'hero',attackKind9:dot?'dot':'skill',sourceHero:hero,sourceSlot:slot,r972:type};
 if(s&&typeof s==='object'){for(const k of ['storyWER','visualAngleOct11'])if(k in s)o[k]=s[k];if(s.attackId9)o.attackId9=String(s.attackId9)+':r972';}return o;}
function push(job){if(queue.length>=CAP){stats.dropped++;return false;}queue.push(job);return true;}
function play(type){try{const k=KINDS[type],t=now();if(t-(soundAt[type]??-1e9)<k.sgap){stats.soundGated++;return;}soundAt[type]=t;
  if(typeof sound==='function'&&typeof soundProfiles!=='undefined'&&soundProfiles['r972_'+type]?.length){sound('r972_'+type);stats.sounds++;
   // 엔진 sound() 의 종류별 .38초 간격 대신 R972 자체 간격을 쓴다(다단히트가 한 소리로 뭉개지지 않게).
   try{if(typeof sfxCooldown!=='undefined'&&sfxCooldown?.set)sfxCooldown.set('r972_'+type,0);}catch(_){}}}catch(e){fail(e);}}
function land(e,v,src,type){if(!(v>0)||!Number.isFinite(v)||!e||!(e.hp>0))return false;const ok=base.call(window,e,v,src);if(ok){stats.delivered+=v;play(type);}return ok;}
function apply(e,v,s,c){const k=KINDS[c.type],t=now();stats.received+=v;
 if(k.dot){const first=v*(1-k.share),rest=v-first;const r=base.call(window,e,first,s);if(!r){stats.received-=v;return r;}stats.delivered+=first;stats.dots++;stats.split++;
  let m=streams.get(e);if(!m){m=new Map();streams.set(e,m);}const st=m.get(c.type);
  if(st&&st.left>0&&queue.includes(st.job)){st.pool+=rest;st.left=k.ticks;st.src=follow(s,c.type,c.hero,c.slot,true);}
  else{const n={pool:rest,left:k.ticks,src:follow(s,c.type,c.hero,c.slot,true),job:null};n.job={at:t+k.gap,e,dot:n,type:c.type,room:curRoom()};if(push(n.job))m.set(c.type,n);}
  return r;}
 const part=v/k.n,r=base.call(window,e,part,s);if(!r){stats.received-=v;return r;}stats.delivered+=part;stats.multis++;stats.split++;
 const src=follow(s,c.type,c.hero,c.slot,false);for(let i=1;i<k.n;i++)push({at:t+k.gap*i,e,v:part,src,type:c.type,room:curRoom()});return r;}
function wrapped(e,v,s,...rest){
 if(!on||!base)return base.call(this,e,v,s,...rest);
 stats.seen++;
 let c=null;try{c=(e&&e.hp>0&&v>0&&Number.isFinite(v))?classify(s):null;}catch(err){fail(err);c=null;}
 if(!c){const r=base.call(this,e,v,s,...rest);try{if(r&&s&&typeof s==='object'){const t=SOUND_ONLY[s.kind]||(s.kind==='r425'?SOUND_ONLY_R425[s.r425]:null);if(t){stats.extraTicks++;play(t);}}}catch(err){fail(err);}return r;}
 stats.classified++;
 if(v>=e.hp){stats.lethal++;return base.call(this,e,v,s,...rest);}
 try{return apply(e,v,s,c);}catch(err){fail(err);return base.call(this,e,v,s,...rest);}}
function run(){if(!queue.length)return;const r=curRoom();if(r!==roomRef){roomRef=r;}if(paused())return;const t=now();
 for(let i=0;i<queue.length;){const j=queue[i];
  if(j.room!==r||!j.e||!(j.e.hp>0)){queue.splice(i,1);if(j.dot){j.dot.left=0;}continue;}
  if(j.at>t+1e-9){i++;continue;}
  queue.splice(i,1);
  try{if(j.dot){const d=j.dot,amt=d.pool/Math.max(1,d.left);d.pool-=amt;d.left--;stats.ticks++;land(j.e,amt,d.src,j.type);
    if(d.left>0&&d.pool>1e-9&&j.e.hp>0){d.job={at:j.at+KINDS[j.type].gap,e:j.e,dot:d,type:j.type,room:j.room};push(d.job);}}
   else{stats.follow++;land(j.e,j.v,j.src,j.type);}}catch(err){fail(err);}}
 if(!queue.length)streams.clear();}
function profiles(){try{if(typeof soundProfiles==='undefined'||!soundProfiles)return;for(const t of Object.keys(KINDS))soundProfiles['r972_'+t]=[1,2].map(i=>({key:'r972-'+t+'-'+i,path:DIR+t+'-'+i+'.ogg',gain:KINDS[t].gain,r541:true}));}catch(e){fail(e);}}
// 감싸기는 모든 스크립트가 올라온 뒤(DOMContentLoaded) 한다 — 이 태그 뒤 긴 줄의 R425·R562·R586·R750 등도 hitEnemy 를 감싸므로
// 가장 바깥에 서야 그들이 바꿔 부르기 전의 원래 출처(story-wer·special:N)를 본다. special·delay 도 가장 바깥이어야 Q 문맥이 모든 Q 를 덮는다.
let installed=false;
function install(){if(installed||!on)return;installed=true;
 profiles();
 if(typeof setupAudio==='function'){const b=setupAudio;setupAudio=function(){const r=b.apply(this,arguments);profiles();return r;};}
 if(typeof hitEnemy==='function'){base=hitEnemy;hitEnemy=wrapped;}
 if(typeof special==='function'){const b=special;special=function(){qDepth++;try{return b.apply(this,arguments);}finally{qDepth--;}};}
 if(typeof delay==='function'){const b=delay;delay=function(sec,fn,...a){if(qDepth>0&&typeof fn==='function'){const f=fn;fn=function(){qDepth++;try{return f.apply(this,arguments);}finally{qDepth--;}};}return b.call(this,sec,fn,...a);};}
 if(typeof tick==='function'){const b=tick;tick=function(){const r=b.apply(this,arguments);try{run();}catch(e){fail(e);}return r;};}
}
try{if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{try{install();}catch(e){fail(e);}},{once:true});else install();}catch(e){fail(e);}
window.__STORYWORLD_SKILL_STYLE_R972__=Object.freeze({revision:REV,table:TABLE,kinds:KINDS,classify,
 set(v){on=!!v;try{window.localStorage?.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 qaReset(){queue.length=0;streams.clear();for(const k of Object.keys(stats))stats[k]=0;for(const k of Object.keys(soundAt))delete soundAt[k];},
 inspect:()=>({revision:REV,on,installed,pending:queue.length,cap:CAP,stats:{...stats},lastError,generated:'ElevenLabs text-to-sound v2 (2026-11-13), scripts/build-sfx-r972.py'})});
})();
