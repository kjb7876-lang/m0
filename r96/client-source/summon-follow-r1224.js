// R1224 보스 소환 몹이 '지금 그 방의 몹'을 따르게 — 사용자 2026-11-19 "모든보스들 몹소환하는거 전수조사해서 예전 몹이 소환되지 않도록 이거 새로운몹 적용할때도 일괄적으로 적용되게".
//  원인(실측 qa/r1224/summon-follow.mjs·roster-diff.mjs): 보스 소환(R61 makeUnit 등)은 지역 원본 명단(regionById[id].roster)으로 actor3 를 새로 부른다.
//   몹 교체·개명(R380 RENAME·R290·R410·R1179 등)은 '방을 만들 때' 일반 몹에만 덧씌우므로, 소환 몹은 그 길을 안 거쳐 옛 이름·옛 그림으로 나왔다
//   (예 dist02 '늪에서 되살아난 전우'·'진흙등 거미', dist03 '쓰러진 수호병', ep1b08 '전극을 두른 좀비 수호기사', u204 '첫 기억 청람잔영', last302 '포구 검은 안개').
//   R531 이 거미동굴 한 곳만 따로 고쳤던 것과 같은 구조다.
//  규칙(일괄): 방이 다 만들어진 뒤 지역 명단의 일반 몹 종류로 actor3 가 불리면(보스·분신·방 만들기 중은 제외), 그 방에 실제로 서 있는 같은 종류(profile.id)의
//   일반 몹을 '본보기'로 삼는다. 새로 만든 몹의 이름·그림 경로가 본보기들과 같으면 그대로 두고, 다르면 본보기의 profile 로 다시 만들고 본보기 이름(분대 꼬리 뺀 것)과
//   그림 식별 표시(r248Key 같은 rNNN 문자열·참거짓 값)를 옮긴다. 같은 종류가 방에 없으면 방의 일반 몹 가운데 하나(id 로 정해짐)를 본보기로 한다.
//   → 앞으로 몹을 새로 바꿀 때 방 만들기 쪽만 바꾸면 소환 몹도 저절로 따라간다(따로 표를 고칠 필요 없음).
//  판정·피해 비율·체력 맞춤(R61 normalize)·저장 형식은 그대로(그 뒤 단계가 그대로 돈다). 끄기: localStorage['storyworld.r1224.summonFollow']='{"on":false}'.
//  점검: window.__STORYWORLD_SUMMON_FOLLOW_R1224__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_SUMMON_FOLLOW_R1224__)return;
const REV='R1224-summon-follow-1',KEY='storyworld.r1224.summonFollow';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={calls:0,checked:0,kept:0,followed:0,noModel:0,errors:0};let last=null,lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const strip=n=>String(n||'').replace(/^중간보스\s*·\s*/,'').replace(/\s*(우두머리|증원|추격대|후속 증원|후속)$/,'').replace(/\s*\d+$/,'').trim();
// 그림을 고르는 쪽이 읽는 식별 표시만 옮긴다(수치·위치·무리·저장 표시는 옮기지 않음)
const SKIP=/^r(40|61|74|75|81|373)[A-Z]|^r(40|61|74|75|81|373)$|Hp|Max|Damage|Wave|Pack|Group|Leash|Order|At$|Clock|Timer/;
const flagKeys=m=>Object.keys(m).filter(k=>/^r\d+[A-Za-z0-9]*$/.test(k)&&!SKIP.test(k)&&(typeof m[k]==='string'||typeof m[k]==='boolean'));
let building=0;
const curRoom=()=>{try{return typeof room==='object'&&room&&Array.isArray(room.enemies)?room:null;}catch(_){return null;}};
const regular=e=>!!e&&!e.boss&&!e.midboss&&!e.persona&&!e.cosmic&&!e.trial&&!e.r61Summoned&&!e.hospitalSummonR53&&!e.r170Tower&&!e.r251Circle&&!e.r1224Follow&&e.profile&&typeof e.name==='string';
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
function rosterOf(r){try{const d=regionById?.[r.id];return Array.isArray(d?.roster)?d.roster:[];}catch(_){return [];}}
// 이 actor3 호출이 '방이 선 뒤 지역 명단 일반 몹 종류로 새 몹을 만드는' 호출인가
const isLoading=()=>{try{return typeof loading!=='undefined'&&!!loading;}catch(_){return false;}};
function applies(d,boss,def){if(!prefs.on||building>0||isLoading()||boss||!d||d.boss||d.midboss)return null;const r=curRoom();if(!r||!r.enemies.length)return null;
 if(def&&typeof def==='object'&&def.id&&def.id!==r.id)return null;
 const ros=rosterOf(r);if(!ros.length||!ros.some(x=>x===d||(x&&d.id&&x.id===d.id)))return null;return r;}
function models(r,d){const mobs=r.enemies.filter(regular);const same=mobs.filter(m=>m.profile?.id===d.id);return {mobs,same};}
function wrapActor(){if(typeof actor3!=='function')return false;if(actor3.__r1224)return true;const base=actor3;
 const w=function(d,id,x,y,boss,...a){const e=base.call(this,d,id,x,y,boss,...a);stats.calls++;
  try{const r=applies(d,boss,a[1]);if(!r||!e||e.boss||e.midboss)return e;stats.checked++;
   const {mobs,same}=models(r,d);const pool=same.length?same:mobs;if(!pool.length){stats.noModel++;return e;}
   const names=new Set(pool.map(m=>strip(m.name))),paths=new Set(pool.map(m=>m.path));
   if(same.length&&names.has(strip(e.name))&&paths.has(e.path)){stats.kept++;return e;}
   const M=pool[hash(id)%pool.length];const e2=M.profile&&M.profile!==d?base.call(this,M.profile,id,x,y,boss,...a):e;if(!e2)return e;
   const from=e.name;e2.name=strip(M.name)||e2.name;if(typeof M.path==='string'&&M.path)e2.path=M.path;for(const k of flagKeys(M))if(e2[k]===undefined)e2[k]=M[k];
   e2.r1224Follow={from,model:String(M.id||''),pid:String(d.id||'')};stats.followed++;last={id:String(id||''),from,to:e2.name,model:M.id};return e2;
  }catch(err){fail(err);return e;}};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r1224=true;try{actor3=w;}catch(_){return false;}try{window.actor3=w;}catch(_){}return true;}
function wrapRoom(){if(typeof makeRoom!=='function')return false;if(makeRoom.__r1224)return true;const base=makeRoom;
 const w=function(...a){building++;try{return base.apply(this,a);}finally{building--;}};for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r1224=true;
 try{makeRoom=w;}catch(_){return false;}try{window.makeRoom=w;}catch(_){}return true;}
// 다른 덧씌우기가 나중에 actor3·makeRoom 을 또 감싸도 이 규칙은 그 바깥에서 결과만 본다 → 불러온 뒤 한 번, 그리고 첫 몇 초 동안 바깥이 바뀌면 다시 씌운다(최대 6번).
let tries=0;const install=()=>{try{wrapRoom();}catch(err){fail(err);}try{wrapActor();}catch(err){fail(err);}};
install();if(typeof setTimeout==='function'){setTimeout(install,0);const again=()=>{if(++tries>6)return;try{if(typeof actor3==='function'&&!actor3.__r1224)install();if(typeof makeRoom==='function'&&!makeRoom.__r1224)install();}catch(_){}setTimeout(again,1500);};setTimeout(again,1500);}
window.__STORYWORLD_SUMMON_FOLLOW_R1224__=Object.freeze({rev:REV,strip,inspect:()=>({rev:REV,prefs:{...prefs},stats:{...stats},last,lastError,wrapped:{actor3:!!(typeof actor3==='function'&&actor3.__r1224),makeRoom:!!(typeof makeRoom==='function'&&makeRoom.__r1224)}}),
 set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();
