// R281 드라이브 자산(사용자 2026-11-03 14:14~15:14 UTC 업로드) 적용 — 모두 "조건부·최종 아님"(드라이브 Limited-Candidate/CONDITIONAL 문서).
//  원천·해시·크기·용도는 assets/r281/index.json, 파생본은 scripts/r281-drive-assets.py 로 만든다(드라이브 원본은 읽기만).
//  ① 보스 이동 6칸: 뿌리의 문지기(dist00-boss)·무의 기억포식자(mb-ep1a07)·늪의 뿔악마 군주(mb-dist02).
//     R104 는 이동할 때도 회복 자세(p4) 한 장을 썼다 → 움직이는 동안(공격·준비·피격·사망이 아닐 때)만 새 6칸을 프로필 move 칸으로 잠깐 내준다.
//     기존 공격4·피격·사망 그림, 판정·체력·이동 속도·저장은 그대로. 그림은 오른쪽을 본다(bakedFacing right → 엔진이 왼쪽일 때 뒤집음).
//     크기는 드라이브 문서가 제안한 공통 축척(visibleHeight = 새 그림 최대 몸 키 → 원래 p4 몸 키와 같게), 발 기준점은 칸마다 잰 가장 낮은 줄
//     (기억포식자는 떠 있는 몸이라 문서 피벗 하나).
//  ② 정원 흙띠(바깥 배치 변형): cave-r204 dist00 바닥 데칼 목록에 한 줄(그 파일에서 처리).
//  보류: 환도 Q 발도 검흔 FX — 게임 안 A/B 에서 기존 R106/R269 환도 Q(발도) 연출과 겹치고(이중 검흔) 작게 묻힘. 기존 연출을 대체할지(단일 레이어) 정해야 해 넣지 않음.
//  끄기: localStorage['storyworld.r281.drive']='{"bossWalk":false}'
(()=>{'use strict';
if(window.__STORYWORLD_DRIVE_R281__)return;
const REV='R281-drive-1',KEY='storyworld.r281.drive',INDEX='assets/r281/index.json';
let prefs={bossWalk:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={walkDraws:0,walkSkipped:0,waiting:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:performance.now()/1000;
let IDX=null;
if(typeof fetch==='function')fetch(INDEX).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.bosses)IDX=j;}).catch(fail);
const asked=new Map();
function img(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image?.naturalWidth>0)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}stats.waiting++;return null;}
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
// ---- ① 보스 이동 6칸 --------------------------------------------------------------------------------
const frameCache=new Map();
function walkFrame(e,B){const n=B.frames,k=Math.floor((T()*1000)/B.frameMs+hash(e.id||e.nativeId)*n)%n,key=e.nativeId+':'+k;let f=frameCache.get(key);
 if(!f){const [cw,ch]=B.cell;f=Object.freeze({path:B.path,r281Walk:k,assetFrame:Object.freeze({sourceRect:Object.freeze([k*cw,0,cw,ch]),pivot:Object.freeze([B.pivotX,B.pivotY[k]]),visibleHeight:B.visibleHeight,bakedFacing:B.facing||'right'})});frameCache.set(key,f);}
 return f;}
function walking(e){return !!(e&&e.moving&&!e.attack&&!(e.rangedWindup>0)&&!(e.hitTimer>0)&&e.hp>0&&e.spawnState!=='dead');}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){
 let fr=null,had=false,desc=null;
 try{const B=prefs.bossWalk&&IDX?.bosses?.[e?.nativeId];if(B&&walking(e)){fr=e.profile?.frames;
   if(fr&&typeof fr==='object'&&!Object.isFrozen(fr)&&img(B.path)){desc=Object.getOwnPropertyDescriptor(fr,'move');had=!!desc;
    if(!desc||desc.configurable||desc.writable){Object.defineProperty(fr,'move',{configurable:true,enumerable:true,writable:true,value:walkFrame(e,B)});stats.walkDraws++;}else{fr=null;stats.walkSkipped++;}}
   else{fr=null;stats.walkSkipped++;}}}catch(err){fr=null;fail(err);}
 try{return base.call(this,e,...a);}
 finally{if(fr){try{if(had)Object.defineProperty(fr,'move',desc);else delete fr.move;}catch(err){fail(err);}}}};}
window.__STORYWORLD_DRIVE_R281__=Object.freeze({revision:REV,index:()=>IDX,
 inspect:()=>({revision:REV,prefs:{...prefs},ready:!!IDX,stats:{...stats},lastError}),
 set:o=>{prefs={...prefs,...(o||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();
