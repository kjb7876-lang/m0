// R208 — 스토리 초반 일반 몹 그림 교체(사용자 2026-11-01 "몹자산 10프레임 이상되는거 위주로 교체 (구글드라이브 신규자산위주),
//  특히 맨처음구간에나오는 보라검 검은날개 타락천사 근위 제거").
//  Drive 몹 스프라이트시트 15·16(사용자 업로드)에서 11칸짜리 5종을 따냈다(assets/r208/mobs, scripts/r200-samong-shades.py story 모드).
//   dist00 악마화 나무의 정원: "악마화 나무의 침식 근위"·"뿌리에 묶인 근위의 기억"(보라 검·검은 날개 타락천사 그림) → 뿌리에 감긴 망자 그림
//   dist01 거미동굴: "거미줄에 묶인 수호병" → 거미줄에 묶인 해골 수호병 그림
//   dist03: "쓰러진 수호병" → 미늘창 망자 그림, "피냄새 추적자" → 잿불 사냥개 그림
//   dist04: "피로 꿰맨 전령" → 두 머리 꿰맨 시체 그림
//  · 이름·판정·체력·공격·보상·저장은 그대로(정본 이름 유지). 그림만 엔진 그림 선택 사슬(__STORYWORLD_STORY_COMBAT_R54__.frameFor)에 내준다.
//  · 이동 1~6칸(왕복), 공격 7~11칸(공격 진행도). 그림은 오른쪽을 본다 → 영웅 쪽으로 뒤집는다.
//  · 땅을 걷는 몹이다: 그릴 때 R109 호버(날개 몹 띄우기)를 막고, R206 접지(그림자 없음)를 따른다.
//  · 보스·페르소나와 이름 붙은 중간보스(보라검천사 등)는 건드리지 않는다. storyworld.r208.mobs {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_STORY_MOBS_R208__)return;
const REV='R223-mobs-3',KEY='storyworld.r208.mobs',INDEX='assets/r208/mobs/index.json';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={assigned:0,frames:0,grounded:0,reinstalls:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 지역·이름 → 그림 id. 정본 이름("…증원/추격대/후속 증원", "중간보스 · …" 변형 포함)으로 고른다.
const RULES=[
 {zone:'dist00',re:/침식 근위|근위의 기억/,id:'root-bound-ghoul'},
 {zone:'dist01',re:/거미줄에 묶인 수호병/,id:'web-bound-skeleton'},
 {zone:'dist03',re:/쓰러진 수호병/,id:'halberd-revenant'},
 {zone:'dist03',re:/피냄새 추적자/,id:'ember-hound'},
 {zone:'dist04',re:/피로 꿰맨 전령/,id:'twin-head-corpse'},
 // R223(사용자 2026-11-02 "최근몹들"): Drive 일반몹 시트 21~28 에서 이름이 게임 안 몹과 맞는 9종(assets/r223/mobs, scripts/r223-drive-mobs.py).
 {zone:'dist01',re:/망각의 거미/,id:'oblivion-spider'},
 {zone:'ep1a09',re:/주사실 감시환각/,id:'thread-nurse'},
 {zone:'ep1a09',re:/갈망의 약병핵/,id:'vial-collector'},
 {zone:'ep1b05',re:/얼굴 없는 남자의 박수/,id:'curtain-mannequin'},
 {zone:'hando01',re:/성벽 침식 봉인병/,id:'ash-mason'},
 {zone:'murder01',re:/빗속 횡단보도의 기억 잔향/,id:'signal-golem'},
 {zone:'cult01',re:/흑장미 귀막은 신도/,id:'censer-priest'},
 {zone:'cult06',re:/기계재판 연결자/,id:'superego-inquisitor'},
 {zone:'kair01',re:/최초명령 훈련파동/,id:'clockwork-sentinel'}];
const INDEX2='assets/r223/mobs/index.json';
let idx=null;const byId=id=>idx?.mobs?.find(m=>m.id===id)||null;
if(typeof fetch==='function')for(const url of [INDEX,INDEX2])fetch(url).then(r=>r.ok?r.json():null).then(j=>{if(j?.mobs){idx={...(idx||{}),mobs:[...(idx?.mobs||[]),...j.mobs.filter(m=>!idx?.mobs?.some(o=>o.id===m.id))]};/* 그림은 처음 그 몹을 그릴 때 읽는다(assign → ensureImages) — 시작 때 23장을 한꺼번에 읽지 않게 */if(url===INDEX)try{if(typeof ensureImages==='function')Promise.resolve(ensureImages(j.mobs.map(m=>m.path))).catch(()=>{});}catch(_){}}}).catch(fail);
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return (h>>>0)/4294967296;};
const major=e=>!!(e&&(e.boss||e.persona||e.cosmic||e.trial||e.samongR103));
const zoneOf=()=>{try{return String(typeof room==='object'&&room?(room.id||''):'');}catch(_){return '';}};
function ruleFor(e){if(!e||major(e))return null;const z=zoneOf(),n=String(e.r200OrigName||e.name||'');
 for(const r of RULES)if((z===r.zone||z.startsWith(r.zone+'-')||z.startsWith(r.zone+':'))&&r.re.test(n))return r;return null;}
function assign(e){if(!prefs.on||!idx||!e)return null;if(e.r208Mob)return byId(e.r208Mob);if(e.r208Checked)return null;
 const r=ruleFor(e);if(!idx)return null;e.r208Checked=true;if(!r)return null;const m=byId(r.id);if(!m)return null;e.r208Mob=m.id;stats.assigned++;return m;}
const T=()=>typeof time==='number'?time:performance.now()/1000;
function cellFor(e,m){const n=m.move.length;
 if(e.attack&&Number.isFinite(e.attack.elapsed)){const sh=e.attack.shape154||e.combatProfile?.attackShape||{},tot=Math.max(.2,(e.attack.castWindup150??sh.windup??.45)+(sh.active??.15)+(sh.recovery??.35));const u=Math.min(.999,Math.max(0,e.attack.elapsed/tot));return m.attack[Math.floor(u*m.attack.length)];}
 if(e.rangedWindup>0)return m.attack[Math.floor(T()*6)%Math.min(3,m.attack.length)];
 if(!(e.hp>0)||e.hitTimer>0)return m.move[0];
 if(e.moving){const seq=n>1?[...Array(n).keys(),...Array.from({length:n-2},(_,i)=>n-2-i)]:[0],k=Math.floor(T()*9+hash(e.id)*8)%seq.length;return m.move[seq[k]];}
 return m.move[Math.floor(T()*1.6+hash(e.id)*2)%2];}
function frameOf(e,m){const [cw,ch]=m.cell,[px,py]=m.pivot,vh=m.visibleHeight||150,k=cellFor(e,m);
 return {path:m.path,assetFrame:{sourceRect:[k*cw,0,cw,ch],pivot:[px,py],visibleHeight:vh},sourceAlphaCore:[k*cw,0,cw,ch],metricThreshold:16,sourcePixelsEdited:false,
  normalizedFullRectangleExtents:[-px/vh,-py/vh,(cw-px)/vh,(ch-py)/vh],r208Mob:m.id,flip:((()=>{const r444=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);return typeof r444==='boolean'?r444:!!(typeof player!=='undefined'&&player&&(player.x-player.y)<(e.x-e.y));})())!==(m.facing==='left')};}/* R223: 왼쪽을 보는 그림은 반대로 */
// 다른 덧씌우기가 나중에 frameFor 를 바꿔 끼워도 가장 바깥에 다시 선다(20초 동안 확인).
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(S.__r208)return true;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r208:true,frameFor(e,f){try{const m=prefs.on?assign(e):null;if(m){
   if(typeof readyImage!=='function'||!(readyImage(m.path)?.image?.naturalWidth>0)){if(typeof ensureImages==='function')Promise.resolve(ensureImages([m.path])).catch(()=>{});stats.waiting=(stats.waiting||0)+1;return S.frameFor(e,f);}/* 그림이 읽히기 전에는 원래 그림(몸이 비지 않게) */
   stats.frames++;return frameOf(e,m);}}catch(err){fail(err);}return S.frameFor(e,f);}});stats.reinstalls++;return true;}
// R211(Codex #132): 실제 좌우는 R51 몸짓의 flip() 이 정한다. R100 이 원래 그림 표(근위 = 왼쪽을 봄)로 뒤집어 새 그림(오른쪽을 봄)이 영웅 반대쪽을 봤다
//  → R208(그리고 같은 방식의 R200 잔영) 칸은 그 칸이 계산한 flip(영웅이 왼쪽이면 뒤집음)을 그대로 쓴다.
function installFlip(){const M=window.__STORYWORLD_ENEMY_MOTION_R51__;if(!M||typeof M.flip!=='function')return false;if(M.__r208)return true;const base=M.flip;
 window.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({...M,__r208:true,flip(e,f,fallback){if(prefs.on&&f&&(f.r208Mob||f.r200Shade)&&typeof f.flip==='boolean'){stats.flips=(stats.flips||0)+1;return f.flip;}return base.call(this,e,f,fallback);}});return true;}
let tries=0;(function arm(){try{install();installFlip();}catch(e){fail(e);}if(++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
// 땅에 붙이기: R109 호버는 visualLiftPx 가 이미 양수면 손대지 않는다 → 아주 작은 값(0.001px)을 잠깐 넣어 막는다. R206 은 0.5px 이하를 접지로 본다.
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){let lift=null;
 try{if(prefs.on&&e&&e.r208Mob&&e.hp>0){const own=Object.prototype.hasOwnProperty.call(e,'visualLiftPx');lift={own,old:e.visualLiftPx};e.visualLiftPx=.001;stats.grounded++;}}catch(err){fail(err);}
 try{return base.call(this,e,...a);}finally{if(lift){if(lift.own)e.visualLiftPx=lift.old;else delete e.visualLiftPx;}}};}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_STORY_MOBS_R208__=Object.freeze({revision:REV,set,assign,ruleFor,rules:RULES.map(r=>({zone:r.zone,re:String(r.re),id:r.id})),
 inspect:()=>({revision:REV,prefs:{...prefs},loaded:!!idx,mobs:idx?.mobs?.map(m=>m.id)||[],stats:{...stats},lastError})});
})();
