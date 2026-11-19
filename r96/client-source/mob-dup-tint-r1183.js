/* R1183 중복 몹 색조 구분(임시) — 사용자 2026-11-19 "중복나오는몹은 닷츠에게 요청하고 어려우면 코드로 색이라도 바꿔".
 * 이름이 다른데 같은 몸 그림을 쓰는 몹(전수조사 2-A)과, 스토리 몹이 사몽 쪽에 같은 그림으로 나오는 경우(2-B)에서
 * '새로 그릴 쪽'만 몸 그림에 색조 필터를 덧씌워 구분한다. Dots CX-0163DU 그림이 오면 그림으로 바꾸고 이 표에서 뺀다.
 * 몸 그림(ctx.drawImage)만 바꾼다: 체력 줄·글자·이펙트·판정·이동·보상 그대로. 맞은 번쩍 등 원래 필터 뒤에 이어 붙인다.
 * 필터는 Three.js 기록기가 받는 것만(hue-rotate·saturate·brightness·contrast·grayscale).
 * 끄기: localStorage['storyworld.r1183.dupTint']='{"on":false}'
 * R1187: Dots CX-0163DU 새 그림이 온 몹(DU-05·07~12)은 겹치던 원래 시트를 그릴 때 같은 칸 배치의 새 시트로 바꿔 그리고 색조는 얹지 않는다.
 *        새 시트가 아직 안 읽혔으면 그 동안만 색조로 구분한다(원래 동작). 원본 시트·다른 몹은 그대로.
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_DUP_TINT_R1183__)return;
const REV='R1183-dup-tint-2-r1187',KEY='storyworld.r1183.dupTint';
// 2-A(다른 이름)는 그림 조건 없이 이름으로, 2-B(같은 이름)는 겹치는 그 그림을 그릴 때만.
// [이름 앞부분, 구역 조건(정규식, 없으면 어디서나), 그린 몸 그림 경로 조건(없으면 무엇이든 — 같은 몹이 층마다 다른 그림을 써도 따라감), 필터, 메모]
const RULES=Object.freeze([
 ['창처럼 날아오는 역십자가',null,null,'hue-rotate(-32deg) saturate(1.3) brightness(.92)','DU-01 흑마법사의 저주창과 구분'],
 ['전극을 두른 좀비 수호기사',null,null,'hue-rotate(75deg) saturate(.75) brightness(.9)','DU-02 전극기계수호기사와 구분'],
 ['기계화 감옥 공명기사',null,null,'hue-rotate(180deg) saturate(.85) contrast(1.08)','DU-03 감옥 공명기사와 구분'],
 ['면도날 종이 아이',null,/u2_void_wraith/,'grayscale(.65) brightness(1.15) contrast(1.12)','DU-04 기억 공백 망령과 구분'],
 ['기운 누더기 골렘',null,null,'hue-rotate(28deg) saturate(.7) brightness(.88) contrast(1.12)','DU-05 꿰맨 아기 인형과 구분'],
 ['적 지휘 개체',null,null,'hue-rotate(-60deg) saturate(1.2)','DU-06 적 지휘 기체와 구분'],
 ['제출되지 못한 문장',/-RF-/,/m053/,'hue-rotate(-35deg) saturate(1.2) contrast(1.06)','DU-07 사몽 역행판'],
 ['찢어진 사진의 망령',/-RC-/,/m088/,'hue-rotate(-35deg) saturate(1.2) contrast(1.06)','DU-08 사몽 역행판'],
 ['백은 없는 그림자',/-S0?7-/,/m082|silverless/,'hue-rotate(-40deg) saturate(1.25)','DU-09 사몽 에피소드판'],
 ['부정의 잔영',/-P-/,/m066|M016/,'hue-rotate(-40deg) saturate(1.15) brightness(.9)','DU-10 사몽 에피소드판'],
 ['거짓천국 근위천사',/-M-/,/m099|false-heaven/,'saturate(.55) brightness(.92) contrast(1.1)','DU-11 미카엘라 엔딩판'],
 ['뿌리에서 쏟아진 잔영',/-S-?0?1-/,/m063/,'hue-rotate(-30deg) saturate(1.2) contrast(1.05)','DU-12 사몽 S-01판']]);
// R1187 [DU, 겹치던 원래 그림(정규식), 새 시트] — 새 시트는 원래 시트와 크기·칸 수·칸 순서·발 자리가 같다(scripts/r1187-dup-mob-sheets.py).
const ART=Object.freeze({
 'DU-05':[/r380\/mobs\/r200-stitched-golem-v2\.webp/,'assets/r1187/mobs/du05-rag-golem.webp'],
 'DU-07':[/r290\/mobs\/m053\.webp/,'assets/r1187/mobs/du07-reverse-paper.webp'],
 'DU-08':[/r290\/mobs\/m088\.webp/,'assets/r1187/mobs/du08-reverse-photo.webp'],
 'DU-09':[/r290\/mobs\/m082\.webp/,'assets/r1187/mobs/du09-vermilion-wraith.webp'],
 'DU-10':[/r290\/mobs\/m066\.webp/,'assets/r1187/mobs/du10-ink-echo.webp'],
 'DU-11':[/r410\/mobs\/m099\.webp/,'assets/r1187/mobs/du11-faded-guard.webp'],
 'DU-12':[/r410\/mobs\/m063\.webp/,'assets/r1187/mobs/du12-root-rag.webp']});
const IMGS=new Map();
function artImg(path){let im=IMGS.get(path);if(!im){if(typeof Image!=='function')return null;im=new Image();im.decoding='async';im.src=path;IMGS.set(path,im);}return im.complete&&im.naturalWidth>0?im:null;}
const duOf=rule=>String(rule&&rule[4]||'').slice(0,5);
let active=false;
const SKIP=/assets\/(?:vfx|r190|r411|r438|rc144|r163)\//;
const stats={tinted:0,draws:0,wraps:0,errors:0,swapped:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
// 사몽 장(에피소드·역행·엔딩)은 바탕 지도의 room.id(예: ep1b05) 위에 room.samongR103.zone(예: sz115-S01-2)을 얹는다 → 그 값을 먼저 본다.
const zoneId=()=>{try{const r=typeof room!=='undefined'?room:null;if(!r)return '';const z=r.samongR103&&r.samongR103.zone;return String((z&&(typeof z==='string'?z:z.id))||r.id||'');}catch(_){return '';}};
const baseName=e=>String(e&&e.name||'').replace(/^중간보스 · /,'').trim();
function ruleFor(e,zone){if(!on||!e||e.boss)return null;const n=baseName(e),p=String(e.path||'');
 for(const r of RULES){if(!n.startsWith(r[0]))continue;if(r[1]&&!r[1].test(zone))continue;return r;}return null;}
function srcOf(img){try{return String(img&&(img.currentSrc||img.src)||'');}catch(_){return '';}}
function tintCall(c,rule,base,args){const img=args[0],src=srcOf(img);
 // 몸 그림만: 이펙트 폴더는 건너뜀, 경로 조건이 있으면 그 그림만. 경로를 모르는 그림(캔버스 등)은 경로 조건이 없을 때만.
 const isBody=src?(!SKIP.test(src)&&(!rule[2]||rule[2].test(src))):!rule[2];
 if(!isBody)return base.apply(c,args);
 const art=ART[duOf(rule)];if(art&&src&&art[0].test(src)){const im=artImg(art[1]);if(im){stats.swapped++;const a2=args.slice();a2[0]=im;return base.apply(c,a2);}}
 const prev=c.filter;stats.draws++;try{c.filter=(prev&&prev!=='none'?prev+' ':'')+rule[3];return base.apply(c,args);}finally{c.filter=prev;}}
// R1196: 다시 감싸기는 최대 MAX_WRAPS 번. 맨 바깥을 고집하는 R613 걷기(1초마다)와 서로 번갈아 감싸 사슬이 1시간에 수천 겹이 되어 스택이 넘쳤다.
//  색조는 사슬 어디에 있어도 ctx.drawImage 를 바꿔 끼우므로 맨 바깥일 필요가 없다.
const MAX_WRAPS=4;
function wrap(){if(typeof drawEnemy!=='function'||drawEnemy.__r1183)return typeof drawEnemy==='function';if(stats.wraps>=MAX_WRAPS)return true;const base=drawEnemy;
 // 다른 덧씌우기가 우리 껍데기를 감싸면 다시 감싸게 되어 사슬에 여러 번 들어간다 → 이미 칠하는 중이면 그냥 넘긴다(겹쳐 칠하기 방지).
 const w=function(e,...a){if(active)return base.apply(this,[e,...a]);let rule=null;try{rule=ruleFor(e,zoneId());}catch(err){fail(err);}
  const c=rule&&typeof ctx!=='undefined'?ctx:null;if(!c||typeof c.drawImage!=='function')return base.apply(this,[e,...a]);
  const own=Object.prototype.hasOwnProperty.call(c,'drawImage'),d=c.drawImage;stats.tinted++;
  try{c.drawImage=function(...args){try{return tintCall(c,rule,d,args);}catch(err){fail(err);return d.apply(c,args);}};}catch(err){fail(err);return base.apply(this,[e,...a]);}
  active=true;try{return base.apply(this,[e,...a]);}finally{active=false;try{if(own)c.drawImage=d;else delete c.drawImage;}catch(err){fail(err);}}};
 w.__r1183=true;try{drawEnemy=w;stats.wraps++;}catch(err){fail(err);}return true;}
wrap();setInterval(()=>{try{wrap();}catch(err){fail(err);}},1500);
window.__STORYWORLD_DUP_TINT_R1183__=Object.freeze({revision:REV,rules:RULES.map(r=>({name:r[0],zone:r[1]&&String(r[1]),path:r[2]&&String(r[2]),filter:r[3],note:r[4]})),art:Object.fromEntries(Object.entries(ART).map(([k,v])=>[k,{orig:String(v[0]),path:v[1]}])),ruleFor:(e,z)=>{const r=ruleFor(e,z==null?zoneId():z);return r?r[3]:null;},
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},inspect:()=>({revision:REV,on,stats:{...stats},lastError})});
})();
