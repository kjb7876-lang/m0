// R1065 Dots 몹 공격 시트 적용 — 사용자 2026-11-15 14:55Z 밤샘 지시 "몹들 모션 … 닷츠랑 협업", 22:47Z "부족한 그림은 Dots 에".
//  Dots CX-0112MA r1(11-16 00:10Z 수령) 7종: MA-02 붉은 하이힐 칼날 · MA-03 공중을 가르는 립스틱 탄환 · MA-04 불길 속의 용 · MA-06 강철 턱의 사이보그 개 ·
//  MA-07 시간수문장 28 · MA-08 끊어진 통화의 인과 잔향 · MA-10 태엽 수집자. 원화(3×2 512칸·조립본)를 발 기준으로 맞춰 6칸 가로 시트로 다시 짜 둠(assets/r1065/mobs).
//  ① 엔진 frameFor 사슬 맨 바깥에서, 바탕 프레임(걷기 시트) 경로가 표에 있는 몹이 공격하는 동안 이 시트의 칸(진행도×6)으로 바꾼다. 원거리 조준(rangedWindup) 동안은 준비 2칸째(조준 자세, RA-08~17).
//  ② 크기·발 줄: 바탕 프레임의 visibleHeight·pivot 을 몸 키 비율(새 시트 몸 키 / 그 걷기 시트 몸 키)로 옮긴다 → 걷기 때와 같은 키·같은 발 자리.
//  ③ 좌우는 R444 한 곳(시트는 오른쪽을 봄). 판정·피해·시간·세이브는 그대로. 공격 그림이 생기므로 R1064 는 저절로 'art', R286 은 covers() 로 'full'.
//  태엽 수집자는 공격 줄(y640)을 이미 쓰는 구역에서는 손대지 않는다. 그림이 안 읽혔거나 바탕 pivot 이 없으면 바탕 그대로.
//  R1065c(11-16 06:45Z 수령분): CX-0117MA AT-03 생체기계 악몽 공격 6칸(cult05) + CX-0116RA 조준 4칸 RA-01 흑장미 눈가린 신도 · RA-03 설원 아래의 기계 다리.
//   조준 시트(kind:'aim')는 rangedWindup 동안만 쓰고(손 올림 2칸 → 유지 2칸 반복), 공격 그림이 아니므로 covers()·R286 'full' 판정에는 넣지 않는다.
//  끄기: localStorage['storyworld.r1065.mobatk']='{"on":false}'. 점검: window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__)return;
const REV='R1065-mob-attack-dots-2',KEY='storyworld.r1065.mobatk';
const SHEETS={"MA-02":{"path":"assets/r1065/mobs/ma-02-red-heel-blade-attack.webp","cell":[226,259],"cells":6,"anchor":[76,216],"bodyH":208,"bases":{"r380/mobs/ep1b-red-heel-blade-walk-d1.webp":{"bodyH":208,"bottom":320,"footX":149.0}}},"MA-03":{"path":"assets/r1065/mobs/ma-03-lipstick-bullet-attack.webp","cell":[192,188],"cells":6,"anchor":[82,157],"bodyH":151,"bases":{"r92/mobs/M027-move.png":{"bodyH":151,"bottom":156,"footX":92.5}}},"MA-04":{"path":"assets/r1065/mobs/ma-04-wrath-dragon-attack.webp","cell":[282,340],"cells":6,"anchor":[104,283],"bodyH":277,"bases":{"episode1b/generated-v394/wrath_satan.webp":{"bodyH":277,"bottom":418,"footX":195.0},"r1029/float/wrath-satan.webp":{"bodyH":155,"bottom":244,"footX":141.5}}},"MA-06":{"path":"assets/r1065/mobs/ma-06-steel-jaw-hound-attack.webp","cell":[327,390],"cells":6,"anchor":[160,325],"bodyH":319,"bases":{"r380/mobs/ep1b-steel-jaw-hound-walk-d1.webp":{"bodyH":187,"bottom":288,"footX":159.0},"r1019/move/steel-jaw-hound-down.webp":{"bodyH":319,"bottom":344,"footX":186.0}}},"MA-07":{"path":"assets/r1065/mobs/ma-07-time-guardian-28-attack.webp","cell":[174,192],"cells":6,"anchor":[68,160],"bodyH":154,"bases":{"r92/mobs/M088-move.png":{"bodyH":149,"bottom":161,"footX":89.0},"generated-v3125/kair-guardians/guardian_28.webp":{"bodyH":154,"bottom":173,"footX":101.5}}},"MA-08":{"path":"assets/r1065/mobs/ma-08-rooftop-echo-attack.webp","cell":[298,362],"cells":6,"anchor":[109,302],"bodyH":296,"bases":{"r380/mobs/murder-rooftop-echo-float-d1.webp":{"bodyH":296,"bottom":312,"footX":113.0}}},"MA-10":{"path":"assets/r1065/mobs/ma-10-clockwork-collector-attack.webp","cell":[173,268],"cells":6,"anchor":[58,223],"bodyH":217,"bases":{"r410/mobs/m033.webp":{"bodyH":217,"bottom":300,"footX":133.0,"rows":[0,320]}}},"AT-03":{"path":"assets/r1065/mobs/at-03-biomech-nightmare-attack.webp","cell":[197,223],"cells":6,"anchor":[84,186],"bodyH":180,"bases":{"r380/mobs/legacy-m134-nightmare-v4-walk-d1.webp":{"bodyH":180,"bottom":214,"footX":94.5}}},"RA-01":{"path":"assets/r1065/mobs/ra-01-black-rose-blindfold-aim.webp","cell":[178,319],"cells":4,"anchor":[73,266],"bodyH":260,"bases":{"r363/mobs/L128.webp":{"bodyH":260,"bottom":298,"footX":121.8}},"kind":"aim"},"RA-03":{"path":"assets/r1065/mobs/ra-03-cult-mech-legs-aim.webp","cell":[167,268],"cells":4,"anchor":[71,223],"bodyH":216,"bases":{"r380/mobs/cult-mech-legs-walk-d1.webp":{"bodyH":216,"bottom":319,"footX":151.0}},"kind":"aim"}};
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={clamped:0,frames:0,attackFrames:0,aimFrames:0,waiting:0,installs:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const BASE=new Map();for(const [id,s] of Object.entries(SHEETS))for(const [p,b] of Object.entries(s.bases))BASE.set(p,{id,s,b});
const norm=p=>String(p||'').split('?')[0].replace(/^.*?assets\//,'').replace(/^\.\//,'');
const ready=p=>{try{return typeof readyImage==='function'&&readyImage(p)?.image?.naturalWidth>0;}catch(_){return false;}};
const asked=new Set();function want(p){if(asked.has(p))return;asked.add(p);try{if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>asked.delete(p));}catch(_){asked.delete(p);}}
const covered=new WeakMap();const now=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const realAtk=e=>!!(e&&e.attack&&!e.attack.r286Fake&&Number.isFinite(e.attack.elapsed));
function progress(e){const sh=e.attack.shape154||e.combatProfile?.attackShape||{},tot=Math.max(.2,(e.attack.castWindup150??sh.windup??.45)+(sh.active??.15)+(sh.recovery??.35));return Math.min(.999,Math.max(0,e.attack.elapsed/tot));}
function pick(e,base){const af=base&&base.assetFrame;if(!af)return null;const hit=BASE.get(norm(base.path));if(!hit)return null;
 const sr=af.sourceRect;if(hit.b.rows&&Array.isArray(sr)&&!hit.b.rows.includes(Math.round(+sr[1]||0)))return null;return hit;}
const aimT=new WeakMap();
// 조준 시트(RA, 4칸): 손 올림 2칸을 한 번 → 유지 2칸 반복(Dots 제안 150/150/250/250ms, 게임 시간).
function aimK(e,n){const t=now();let t0=aimT.get(e);if(t0===undefined||t<t0){t0=t;aimT.set(e,t0);}const d=t-t0;return d<.15?0:d<.30?1:Math.min(n-1,2+(Math.floor((d-.30)/.25)%2));}
function frame(e,base){const hit=pick(e,base);if(!hit)return base;const aim=hit.s.kind==='aim';if(!aim&&!covered.has(e)){covered.set(e,hit.id);if(!ready(hit.s.path))want(hit.s.path);}/* 처음 볼 때 미리 읽기 — 첫 공격이 옛 걷기 칸으로 나가지 않게 */if(!prefs.on||!(e.hp>0))return base;
 let k=-1;if(aim){if(!realAtk(e)&&e.rangedWindup>0&&!e.attack){if(!ready(hit.s.path))want(hit.s.path);k=aimK(e,hit.s.cells);stats.aimFrames++;}else aimT.delete(e);}
 else if(realAtk(e)){k=Math.floor(progress(e)*hit.s.cells);stats.attackFrames++;}else if(e.rangedWindup>0&&!e.attack){k=1;stats.aimFrames++;}if(k<0)return base;
 const af=base.assetFrame,bp=af.pivot,vh=+af.visibleHeight;if(!Array.isArray(bp)||!Number.isFinite(+bp[0])||!Number.isFinite(+bp[1])||!(vh>0))return base;
 if(!ready(hit.s.path)){want(hit.s.path);stats.waiting++;return base;}
 const [W,H]=hit.s.cell,[PX,PY]=hit.s.anchor,r=hit.s.bodyH/hit.b.bodyH;if(!(r>0)||!Number.isFinite(r))return base;
 let px=PX+(bp[0]-hit.b.footX)*r,py=PY+(bp[1]-hit.b.bottom)*r;const nv=vh*r;if(![px,py,nv].every(Number.isFinite))return base;
 // 엔진 drawAssetFrame3 는 pivot 이 칸 밖이면 그리기를 거절하고 시트 전체를 그린다 → 칸 안으로(아래 여백 20% 를 두고 짜서 보통은 안 걸림)
 if(px<0||px>W||py<0||py>H){stats.clamped++;px=Math.min(W,Math.max(0,px));py=Math.min(H,Math.max(0,py));}
 let flip=!!base.flip;try{const L=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);if(typeof L==='boolean')flip=L;}catch(_){}
 const rect=[k*W,0,W,H];stats.frames++;
 return {...base,path:hit.s.path,assetFrame:{...af,sourceRect:rect,pivot:[px,py],visibleHeight:nv},sourceAlphaCore:rect.slice(),
  normalizedFullRectangleExtents:[-px/nv,-py/nv,(W-px)/nv,(H-py)/nv],flip,sourcePixelsEdited:false,r1065Sheet:hit.id};}
let mine=null;
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(mine&&S.frameFor===mine)return true;if(stats.installs>60)return false;
 const inner=S.frameFor;mine=function(e,f){let b;b=inner.call(this,e,f);try{return frame(e,b);}catch(err){fail(err);return b;}};
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r1065:true,frameFor:mine});stats.installs++;return true;}
install();try{setInterval(install,700);}catch(_){}
// R286 kindOf 는 그리기(frameFor) 전에 불려 3초 캐시된다 → 처음 보는 몹은 여기서 바탕 프레임을 한 번 물어 본다(몹마다 한 번).
// 지역을 막 만들 때(그림 공급자가 아직 목록을 못 읽음)는 바탕 경로가 달라 보일 수 있어 1초(게임 시간)마다 다시 물어 본다.
const probed=new WeakMap();
function covers(e){if(!prefs.on||!e)return false;if(covered.has(e))return true;const t=probed.get(e);if(t===undefined||Math.abs(now()-t)>=1){probed.set(e,now());try{const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(S?.frameFor)S.frameFor(e,e.profile?.frames?.idle||null);}catch(err){fail(err);}}return covered.has(e);}
// R248(몹 고유 시트, r363·r248 그림)는 frameFor 를 거치지 않고 자기 시트(256×320, 발 128,300)를 직접 그린다 → 조준 시트가 있으면 그 한 번만 이 칸으로.
function aimR248(e,p){if(!prefs.on||!e||!(e.hp>0)||realAtk(e)||!(e.rangedWindup>0)||e.attack)return null;const hit=BASE.get(norm(p));if(!hit||hit.s.kind!=='aim')return null;
 if(!ready(hit.s.path)){want(hit.s.path);stats.waiting++;return null;}let img=null;try{img=readyImage(hit.s.path).image;}catch(_){}if(!img)return null;
 const [W,H]=hit.s.cell,[AX,AY]=hit.s.anchor,r=hit.b.bodyH/hit.s.bodyH;if(!(r>0)||!Number.isFinite(r))return null;const k=aimK(e,hit.s.cells);stats.aimFrames++;stats.frames++;
 return {img,sx:k*W,sy:0,w:W,h:H,dx:-AX+(hit.b.footX-128)/r,dy:-AY+(hit.b.bottom-300)/r,r,id:hit.id,cell:k};}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__=Object.freeze({revision:REV,set,install,covers,aimR248,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},sheets:JSON.parse(JSON.stringify(SHEETS)),lastError})});
})();
