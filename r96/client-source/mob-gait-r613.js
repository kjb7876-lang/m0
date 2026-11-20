// R613 걷기 그림이 한 장뿐인 몹의 임시 걸음 — 사용자 2026-11-10 "이동모션이없는 몹들도 전수조사해서 … 생성개선적용".
//  정식본은 Dots 걷기 시트(요청서 CX-0067MV, r96/qa/r613/CX-0067MV-request.txt). 시트가 오기 전까지만 쓰는 코드 걸음이며 최종 그림이 아니다.
//  ① 판정(그리기에서 직접): 몹이 걷는 동안 drawEnemy 가 그린 몸 그림(이미지+칸)을 모아, 0.6초·20번 이상 본 뒤 한 가지뿐이면 'gait',
//     두 가지 이상(각 2번 이상)이면 'frames'(손대지 않음). 맞음·공격·조준·돌진 중 그림은 판정에서 뺀다. 판정은 몹 하나하나에(같은 이름도 그림이 다를 수 있음), 몸 그림은 그리기 기록기 명령(원본 경로·칸)을 먼저 본다.
//     → 나중에 Dots 걷기 시트가 붙으면 그 몹은 저절로 'frames' 가 되어 이 걸음이 꺼진다.
//  ② 걸음: R52 applyBodyPose 사슬(발 위치에서 몸에 거는 변형)에 덧붙인다. 위상은 '지나간 거리'로 정해 발이 미끄러지지 않는다(0.42칸에 한 걸음).
//     걷는 몹 = 걸음마다 발 디딤(최대 3.2px 뜸)·좌우 기울기(±3.2°)·디딜 때 아주 작은 눌림(세로 3.5%)·가는 쪽으로 1.4° 숙임.
//     떠 있는 몹(나방·망령·그림자 등, R109 fly/hover) = 위로만 부드럽게 오르내림(최대 3.6px)·작은 기울기, 눌림 없음.
//     멈추면 0.15초 안에 서서히 0 으로 돌아간다. R109 '꿀렁임 금지'(늘였다 줄였다 출렁임)는 지킨다 — 몸 전체를 굳은 채 들고 기울인다.
//  손대지 않음: 보스·중간보스·페르소나, 고정형(탑·인형·포탑), 병원(ep1a08, R51 전용 자세), 공격·조준·R286 돌진 중, 죽은 몹.
//  끄기: localStorage['storyworld.r613.gait']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_MOB_GAIT_R613__)return;
const REV='R613-gait-2',KEY='storyworld.r613.gait';
const STRIDE=.42,LIFT=3.2,FLOAT=3.6,TILT=.056,LEAN=.024,SQUASH=.035,TAU=.12,MIN_N=20,MIN_SPAN=.6;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={samples:0,decided:0,poses:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const zoneId=()=>{try{return (typeof room!=='undefined'&&room?.id)||(typeof zone!=='undefined'?zone:'')||'';}catch(_){return '';}};
const hospital=()=>{try{return typeof zone!=='undefined'&&zone==='ep1a08';}catch(_){return false;}};
const major=e=>!!(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongBoss||e.combatProfile?.major||/중간보스/.test(String(e.name||'')));
const fixed=e=>!!(e.stationary||e.r75Tower||e.r170Tower||e.r446Pillar||e.turret||e.rooted||e.immobile||e.r251Circle||e.r193Doll);
const busy=e=>!!(e.attack||e.rangedWindup>0||e.r268Dash||e.r286?.mode||e.hitTimer>0||e.stunned>0||e.frozen>0);
const baseName=e=>String(e?.name||'').replace(/^중간보스 · /,'').replace(/\s*\d+$/,'').replace(/ (후속 증원|증원|우두머리|추격대)$/,'').replace(/ (후속 증원|증원|우두머리|추격대)$/,'').trim();
const FLOATY=/나방|박쥐|망령|유령|영혼|잔영|환영|그림자|눈알|원반|막익|날개|혼령|안개/;
function floats(e){if(e.r613Float||e.flying||e.fly||e.hover||e.levitate)return true;try{const k=window.__STORYWORLD_MOBS_R109__?.trackFor?.(e)?.kind;if(k==='fly'||k==='hover')return true;}catch(_){}return FLOATY.test(String(e.name||''));}
function eligible(e){return !!(prefs.on&&e&&e.hp>0&&e.spawnState!=='dead'&&e.visible!==false&&!e.disabled&&!major(e)&&!fixed(e)&&!hospital());}
// ---- 판정 ----
// 판정은 몹 하나하나에 매긴다: 같은 이름이라도 그림이 다를 수 있다(dist00 뿌리 추적자 = R380 시트 몹과 R74 지도 그림 몹이 섞여 나옴).
let vZone=null,V=new WeakMap();const names=new Map();// names: 보고용 이름 → {gait,frames}
function rec(e){const z=zoneId();if(z!==vZone){vZone=z;V=new WeakMap();names.clear();}let r=V.get(e);if(!r)V.set(e,r={keys:new Map(),n:0,t0:null,verdict:null,probeAt:-9,baked:false,name:baseName(e)});return r;}
function verdict(e){if(!e)return null;const z=zoneId();if(z!==vZone)return null;return V.get(e)?.verdict||null;}
function note(r){const c=names.get(r.name)||{gait:0,frames:0};c[r.verdict]++;names.set(r.name,c);}
const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura/i;
function sample(r,key){if(!key)return;stats.samples++;r.n++;if(r.t0==null)r.t0=T();r.keys.set(key,(r.keys.get(key)||0)+1);
 const multi=[...r.keys.values()].filter(v=>v>=2).length;if(multi>=2){r.verdict='frames';stats.decided++;note(r);return;}
 if(!r.verdict&&r.n>=MIN_N&&T()-r.t0>=MIN_SPAN&&r.keys.size===1){r.verdict='gait';stats.decided++;note(r);}}
// 그리기 기록기(Three.js 쪽 ctx.commands)에 남은 몸 그림: 오프스크린 캔버스로 합성해 그리는 몹도 원래 그림 경로·칸이 여기 남는다.
//  캔버스뿐이라 원본을 알 수 없는 그림은 판정하지 않는다(= 걸음 안 줌, 보수적으로).
function currentBody(C,st){let best=null,area=0;for(let i=st;i<C.length;i++){const c=C[i];
 if(c?.kind!=='image'||!Array.isArray(c.points)||c.points.length<4||c.r620Ghost||c.r760Ghost)continue;
 const path=String(c.sourcePath||c.image?.src||'').replace(/^.*\/m0\//,'');
 if(!path||path==='original-actor-canvas'||FX.test(path))continue;
 const P=c.points,a=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));
 if(a>area){area=a;best={c,path};}}return best;}
function fromCommands(C,st){const b=C&&st>=0?currentBody(C,st):null;return b?b.path+'|'+String(b.c.sourceRect||''):null;}

// SW-0014: 본편에서 한 장만 확인한 몸 칸의 4프레임 파생 시트.
// 지금 그려지는 경로·칸과 정확히 일치하고 실제로 걸을 때만 바꾼다.
const WALK_ROWS=/*SW0014_WALK_ROWS_START*/[
 ["black-robed-nightmare-demon","assets/cult-v3123/black_robed_nightmare_demon.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:cult02:c102-e1"],""],
 ["black-rose-crystal-guardian","assets/cult-v3123/black_rose_crystal_guardian.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:cult02:c102-e2"],""],
 ["corrupted-guardian","assets/episode1a/corrupted_guardian.webp",[0,0,512,512],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:dist02:dist02-g1"],""],
 ["gargoyle-mob-bloodied","assets/episode1a/generated-v31342-rc39/gargoyle_mob_bloodied.webp",[0,0,1536,1024],[191,127],[0.0650887573964497,0.061946902654867256],["STORY:dist05:dist05-c1"],""],
 ["ego-corrosion-vessel","assets/episode1a/generated-v392/ego_corrosion_vessel.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:ep1a11:a11-d1"],""],
 ["horned-swamp-demon-pilgrim","assets/episode1a/horned_swamp_demon.webp",[0,0,512,512],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:dist05:dist05-h1"],"r1226-tint-pilgrim"],
 ["greed-fox-hound","assets/episode1b/generated-v394/greed_fox_hound.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:ep1b06:b06-f1"],""],
 ["greed-mammon","assets/episode1b/generated-v394/greed_mammon.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:ep1b06:b06-c1","STORY:ep1b06:b06-c1"],""],
 ["lust-asmodai","assets/episode1b/generated-v394/lust_asmodai.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:ep1b05:b05-a1"],""],
 ["seal-residual","assets/episode1b/generated-v394/seal_residual.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:ep1b01:b01-r1"],""],
 ["wrath-satan","assets/episode1b/generated-v394/wrath_satan.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:ep1b07:b07-s1"],""],
 ["guardian-01","assets/generated-v3125/kair-guardians/guardian_01.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair04:kair-guardian-01"],""],
 ["guardian-02","assets/generated-v3125/kair-guardians/guardian_02.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair04:kair-guardian-02"],""],
 ["guardian-04","assets/generated-v3125/kair-guardians/guardian_04.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair04:kair-guardian-04"],""],
 ["guardian-06","assets/generated-v3125/kair-guardians/guardian_06.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair04:kair-guardian-06"],""],
 ["guardian-09","assets/generated-v3125/kair-guardians/guardian_09.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair05:kair-guardian-09"],""],
 ["guardian-11","assets/generated-v3125/kair-guardians/guardian_11.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair05:kair-guardian-11"],""],
 ["guardian-12","assets/generated-v3125/kair-guardians/guardian_12.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair05:kair-guardian-12"],""],
 ["guardian-14","assets/generated-v3125/kair-guardians/guardian_14.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair06:kair-guardian-14"],""],
 ["guardian-17","assets/generated-v3125/kair-guardians/guardian_17.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair06:kair-guardian-17"],""],
 ["guardian-19","assets/generated-v3125/kair-guardians/guardian_19.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair07:kair-guardian-19"],""],
 ["guardian-21","assets/generated-v3125/kair-guardians/guardian_21.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair07:kair-guardian-21"],""],
 ["guardian-22","assets/generated-v3125/kair-guardians/guardian_22.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair07:kair-guardian-22"],""],
 ["guardian-29","assets/generated-v3125/kair-guardians/guardian_29.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair08:kair-guardian-29"],""],
 ["guardian-30","assets/generated-v3125/kair-guardians/guardian_30.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair08:kair-guardian-30"],""],
 ["guardian-31","assets/generated-v3125/kair-guardians/guardian_31.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair09:kair-guardian-31"],""],
 ["guardian-32","assets/generated-v3125/kair-guardians/guardian_32.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair09:kair-guardian-32"],""],
 ["guardian-33","assets/generated-v3125/kair-guardians/guardian_33.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair09:kair-guardian-33"],""],
 ["guardian-35","assets/generated-v3125/kair-guardians/guardian_35.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair09:kair-guardian-35"],""],
 ["guardian-37","assets/generated-v3125/kair-guardians/guardian_37.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair10:kair-guardian-37"],""],
 ["guardian-38","assets/generated-v3125/kair-guardians/guardian_38.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair10:kair-guardian-38"],""],
 ["guardian-39","assets/generated-v3125/kair-guardians/guardian_39.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:kair10:kair-guardian-39","STORY:kair10:kair-guardian-39"],""],
 ["guardian-41","assets/generated-v3125/kair-guardians/guardian_41.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair10:kair-guardian-41"],""],
 ["guardian-42","assets/generated-v3125/kair-guardians/guardian_42.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair10:kair-guardian-42"],""],
 ["guardian-45","assets/generated-v3125/kair-guardians/guardian_45.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:kair02:kair-guardian-45"],""],
 ["guardian-47","assets/generated-v3125/kair-guardians/guardian_47.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:kair02:kair-guardian-47","STORY:kair02:kair-guardian-47"],""],
 ["guardian-48","assets/generated-v3125/kair-guardians/guardian_48.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:kair02:kair-guardian-48"],""],
 ["guardian-49","assets/generated-v3125/kair-guardians/guardian_49.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair04:kair-elite-49"],""],
 ["guardian-50","assets/generated-v3125/kair-guardians/guardian_50.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair04:kair-elite-50"],""],
 ["guardian-51","assets/generated-v3125/kair-guardians/guardian_51.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair05:kair-elite-51"],""],
 ["guardian-53","assets/generated-v3125/kair-guardians/guardian_53.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair07:kair-elite-53"],""],
 ["guardian-54","assets/generated-v3125/kair-guardians/guardian_54.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair07:kair-elite-54"],""],
 ["guardian-56","assets/generated-v3125/kair-guardians/guardian_56.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair09:kair-elite-56"],""],
 ["guardian-57","assets/generated-v3125/kair-guardians/guardian_57.webp",[0,0,192,192],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair09:kair-elite-57"],""],
 ["connector","assets/kair/enemies/connector.png",[0,0,362,362],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair03:kair-academy-wave-2"],""],
 ["resonance-slave","assets/kair/enemies/resonance-slave.png",[0,0,362,362],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:kair03:kair-academy-wave-3"],""],
 ["monsters-0-0","assets/r74/monsters.png",[0,0,291,320],[174,191],[0.06493506493506493,0.0650887573964497],["DREAM:dist00:a11-c1","DREAM:dist02:dist02-h1","DREAM:dist02:dist02-m1","DREAM:dist03:dist03-c1","DREAM:dist03:dist03-g1","DREAM:dist03:dist03-s1","DREAM:dist04:dist04-c1","DREAM:dist04:dist04-g1","DREAM:dist04:dist04-s1","DREAM:dist05:dist05-c1","DREAM:dist05:dist05-m1","DREAM:dist06:dist06-c1","DREAM:dist06:dist06-h1","DREAM:ep1a09b:dist03-c1","DREAM:ep1a09b:dist03-g1","DREAM:ep1a09b:dist03-s1","DREAM:ep1b06b:b06b-f1","DREAM:ep1b06b:b06b-h1","DREAM:ep1b06b:b06b-v1","DREAM:hando01:h101-s1","DREAM:hando01:h101-s2","DREAM:hando01:h101-t1","DREAM:hando02:h102-s1","DREAM:hando02:h102-t1","DREAM:hando03:h103-c1","DREAM:hando03:h103-s1","DREAM:hando03:h103-t1","DREAM:kair01:kair-academy-wave-1","DREAM:kair03:kair-academy-wave-1","DREAM:kair03:kair-academy-wave-2","DREAM:kair03:kair-academy-wave-3","DREAM:kair05:kair-guardian-07","DREAM:kair05:kair-guardian-08","DREAM:kair05:kair-guardian-10","DREAM:kair06:kair-guardian-13","DREAM:kair06:kair-guardian-15","DREAM:kair06:kair-guardian-16","DREAM:kair09:kair-guardian-34","DREAM:kair10:kair-guardian-40","DREAM:last303:l302-e1","DREAM:last304:l304-e1","DREAM:last304:l304-e2","DREAM:last304:l304-e3","DREAM:last305:l305-e1","DREAM:last305:l305-e2"],""],
 ["monsters-0-0-pilgrim","assets/r74/monsters.png",[0,0,291,320],[174,191],[0.06493506493506493,0.0650887573964497],["DREAM:dist05:dist05-h1"],"r1226-tint-pilgrim"],
 ["memory-excision-connector","assets/r99/clean/assets/hando-v3123/memory_excision_connector.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["DREAM:hando02:h102-c1"],""],
 ["order-seal-officer","assets/r99/clean/assets/hando-v3123/order_seal_officer.webp",[0,0,418,418],[191,191],[0.0650887573964497,0.0650887573964497],["STORY:hando02:h102-s2"],""]
]/*SW0014_WALK_ROWS_END*/;
const WALK=new Map();
for(const [name,base,rect,cell,pad,targets,tint] of WALK_ROWS){
 const row={path:'assets/sw0014/ordinary-walk/'+name+'.webp',base,match:tint?base+'#'+tint:base,rect,cell,pad,tint};
 for(const target of targets){const rows=WALK.get(target)||[];rows.push(row);WALK.set(target,rows);}
}
const asked=new Map();
function sheet(row){
 const im=typeof readyImage==='function'?readyImage(row.path)?.image:null;
 const w=im?.naturalWidth||im?.width,h=im?.naturalHeight||im?.height;
 if(w>0&&h>0&&w%4===0)return {im,w,h};
 const now=T(),prior=asked.get(row.path);
 if(typeof addImage==='function'&&(prior==null||now<prior||now-prior>3)){
   asked.set(row.path,now);addImage(row.path,'SW-0014 ordinary walk');}
 return null;
}
const sameRect=(a,b)=>Array.isArray(a)&&a.length===4&&a.every((x,i)=>Math.abs(x-b[i])<=1);
function preferred(e,b){
 if(b.c.r974||b.c.r1029)return true;
 const d=window.__STORYWORLD_MOVE_DIR_R974_DATA__?.enemies?.[e.nativeId];
 if(d&&[d,...(d.alt||[])].some(v=>v.idle?.some(f=>b.path===f.path&&sameRect(b.c.sourceRect,f.rect))))return true;
 return !!window.__STORYWORLD_MOVE_FLOAT_R1029_DATA__?.arts?.[b.path+'|'+String(b.c.sourceRect)];
}
function replaceWalk(e,s,cmds,st,rows){
 const b=currentBody(cmds,st);
 if(!b||b.c.owner?.kind!=='enemy'||preferred(e,b))return false;
 const row=rows.find(v=>v.match===b.path&&sameRect(b.c.sourceRect,v.rect));
 if(!row)return false;
 const im=sheet(row);
 if(!im)return false;
 const c=b.c,[a,p,,d]=c.points,[px,py]=row.pad,u=[p[0]-a[0],p[1]-a[1]],v=[d[0]-a[0],d[1]-a[1]];
 const at=(x,y)=>[a[0]+u[0]*x+v[0]*y,a[1]+u[1]*x+v[1]*y];
 const frame=Math.floor(s.dist/.84*4)%4,w=im.w/4;
 c.points=[at(-px,-py),at(1+px,-py),at(1+px,1+py),at(-px,1+py)];
 c.image=im.im;c.sourcePath=row.path;c.imageSize=[im.w,im.h];c.sourceRect=[w*frame,0,w,im.h];
 c.mutable=false;c.immutableTint=row.tint?{path:row.path,immutable:true,r1226Tint:true,r1226Src:row.base}:null;c.owner={...c.owner,bodyPath:row.path};c.r613Walk=true;
 stats.baked=(stats.baked||0)+1;return true;
}
// ---- 걸음 상태 ----
const W=new WeakMap();
function stepState(e){const now=T();let s=W.get(e);if(!s){W.set(e,s={lx:e.x,ly:e.y,dist:0,amp:0,at:now,movedAt:-1,dir:1});return s;}
 const dt=Math.max(0,Math.min(.25,now-s.at));if(dt<=0&&s.at===now&&s.lx===e.x&&s.ly===e.y)return s;
 const dx=e.x-s.lx,dy=e.y-s.ly,d=Math.hypot(dx,dy);if(d>1e-5&&d<.6){s.dist+=d;s.movedAt=now;const sx=dx-dy;if(Math.abs(sx)>1e-5)s.dir=sx>0?1:-1;}
 s.lx=e.x;s.ly=e.y;const walking=e.moving!==false&&now-s.movedAt<=.08&&s.movedAt>=0;const k=1-Math.exp(-dt/(walking?TAU:TAU/4));s.amp+=((walking?1:0)-s.amp)*k;if(s.amp<.05&&!walking)s.amp=0;s.at=now;s.walking=walking;s.displaced=dt>0&&d>1e-5&&d<.6;return s;}
let scoped=null;
function pose(c,e){const s=W.get(e);if(!s||!(s.amp>.02)||busy(e)||verdict(e)!=='gait'||V.get(e)?.baked)return false;
 const z=typeof Z==='function'?Z():(typeof zoom==='number'&&zoom>0?zoom:1),a=s.amp,ph=s.dist/STRIDE*Math.PI;
 if(floats(e)){const lift=(.5-.5*Math.cos(ph*.5))*FLOAT*z*a;c.translate(0,-lift);c.rotate((Math.sin(ph*.5)*TILT*.5+s.dir*LEAN*.6)*a);}
 else{const st=Math.sin(ph),up=Math.abs(st),lift=up*LIFT*z*a,contact=Math.pow(1-up,3);c.translate(0,-lift);c.rotate((st*TILT+s.dir*LEAN)*a);if(contact>.01)c.scale(1+SQUASH*.6*contact*a,1-SQUASH*contact*a);}
 stats.poses++;return true;}
// ---- 사슬 연결 ----
function installPose(){const chain=window.__STORYWORLD_HOSPITAL_CHARGE_R52__;if(!chain||typeof chain.applyBodyPose!=='function'||chain.__r613)return !!chain?.__r613;
 window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({...chain,__r613:true,
  applyBodyPose(c,hero=false){const r=chain.applyBodyPose(c,hero);if(hero||!c||!scoped)return r;try{if(pose(c,scoped))return {...(r||{shear:0,scaleY:1}),phase:'r613-gait'};}catch(err){fail(err);}return r;},
  hasMotion(e){try{const s=e&&W.get(e);if(s&&s.amp>.02&&verdict(e)==='gait')return true;}catch(_){}return chain.hasMotion?chain.hasMotion(e):false;}});return true;}
// 바깥에 늦게 감싼 그림 공급자(sin-boss-art-r463 등)가 그리는 몸까지 보려면 이 감싸기가 맨 바깥이어야 한다 → 1초마다 맨 위가 아니면 다시 감싼다.
//  안쪽에 남은 옛 감싸기는 depth 로 그냥 통과시킨다(두 번 판정·두 번 자세 없음).
let depth=0;
// R1196: 다시 감싸기 상한. 다른 덧씌우기도 '맨 바깥이 아니면 다시 감싸기'를 하면 둘이 번갈아 감싸 사슬이 끝없이 길어진다(R1183 과 1시간 4800겹 → 스택 넘침).
const MAX_WRAPS=12;
function installDraw(){if(typeof drawEnemy!=='function')return false;if(drawEnemy.__r613)return true;if((stats.wraps||0)>=MAX_WRAPS)return true;const base=drawEnemy;
 const w=function(e,...a){if(depth>0||!eligible(e))return base.call(this,e,...a);depth++;try{return draw.call(this,base,e,a);}finally{depth--;}};
 w.__r613=true;try{drawEnemy=w;}catch(_){}try{window.drawEnemy=w;}catch(_){}stats.wraps=(stats.wraps||0)+1;return true;}
function draw(base,e,a){let s=null,r=null,hook=null,best=null,rows=null;
  try{s=stepState(e);r=rec(e);
   const activeWalk=s.walking&&e.moving===true&&!busy(e);
   if(!activeWalk&&r.baked)s.amp=0;
   const cmds=typeof ctx!=='undefined'&&Array.isArray(ctx?.commands)?ctx.commands:null;
   const start=cmds?cmds.length:-1;
   const matches=activeWalk&&cmds&&s.displaced?WALK.get((typeof layer==='string'?layer:'STORY')+':'+zoneId()+':'+e.nativeId):null;
   if(matches)rows={cmds,start,matches};
   else if(!activeWalk)r.baked=false;
   const review=!r.verdict||r.verdict==='gait'&&T()-r.probeAt>.25;
   if(review&&activeWalk&&typeof ctx!=='undefined'&&ctx&&typeof ctx.drawImage==='function'){
    r.probeAt=T();const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage')?c.drawImage:null,f=c.drawImage;
    c.drawImage=function(img,...q){try{let sx=0,sy=0,dw,dh;if(q.length>=8){sx=q[0];sy=q[1];dw=q[6];dh=q[7];}else if(q.length>=4){dw=q[2];dh=q[3];}else{dw=img?.width||0;dh=img?.height||0;}
      const path=img?.currentSrc||img?.src||img?.__path||'';const src=String(path||('cv'+img?.width+'x'+img?.height)).replace(/^.*\/m0\//,'');const area=Math.abs((dw||0)*(dh||0));if(!FX.test(src)&&(!best||area>best.area))best={area,key:src+'|'+sx+','+sy,canvas:!path};}catch(_){}return f.apply(this,arguments);};
    hook=()=>{if(own)c.drawImage=own;else delete c.drawImage;};}}catch(err){fail(err);}
  const C0=hook&&Array.isArray(ctx.commands)?ctx.commands:null,st0=C0?C0.length:-1;
  const prev=scoped;scoped=e;try{return base.call(this,e,...a);}finally{
  scoped=prev;if(hook)hook();
  try{
    if(hook){const k=fromCommands(C0,st0)||(best&&!best.canvas?best.key:null);if(k)sample(r,k);}
    if(rows)r.baked=replaceWalk(e,s,rows.cmds,rows.start,rows.matches);
  }catch(err){fail(err);}
 }}
installPose();installDraw();
const reinstall=()=>{const a=installPose(),b=installDraw();return a&&b;};
if(typeof setInterval==='function')setInterval(()=>{try{reinstall();}catch(err){fail(err);}},1000);
window.__STORYWORLD_MOB_GAIT_R613__=Object.freeze({revision:REV,verdict,baseName,reinstall,floats:e=>floats(e),
 set(on){prefs.on=!!on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}},
 inspect:()=>({revision:REV,prefs:{...prefs},zone:vZone,gaitNames:[...names].filter(([,c])=>c.gait).map(([k])=>k),frameNames:[...names].filter(([,c])=>c.frames).map(([k])=>k),
  names:Object.fromEntries(names),stats:{...stats},lastError})});
})();
