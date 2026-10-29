/* R119 시각 다듬기 (사용자 2026-10-29 "시각적 개선 중점으로 플레이")
 * 1) 영웅·몹을 가리는 벽을 더 투명하게: 렌더러(R54/R73)는 배우를 가리는 벽을 42%까지만 흐리게 해서, 짙은 산울타리·돌벽
 *    뒤에서 싸우면 영웅과 보스가 거의 보이지 않았다(dist00 뿌리의 문지기 전투에서 확인). 흐림 계산이 끝난 뒤, 실제로
 *    그리기 전에(updateGlows 직전) 흐려진 벽의 불투명도를 다시 매겨 가장 흐린 값을 22%로 낮춘다. 흐림 여부·속도는 그대로.
 * 판정·충돌·배치는 건드리지 않는다(재질의 불투명도만). 설정 키 r119.visual. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 const C=window.StoryPhase1?.ThreeRenderer?.prototype;
 if(window.__STORYWORLD_VISUAL_R119__||!C||typeof C.updateGlows!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r119.visual';
 const prefs={seeThrough:true,heroArt:true,angelArt:true,heroFit:false,heroBlood:true,earlyGrace:true,walkCycle:true,gunnerHit:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of ['seeThrough','heroArt','angelArt','heroFit','heroBlood','earlyGrace','walkCycle','gunnerHit'])if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
 const NATIVE_MIN=.42,MIN=.22,stats={frames:0,walls:0};let lastError=null;
 const remap=a=>a>=.995?a:Math.max(MIN,1-(1-a)*((1-MIN)/(1-NATIVE_MIN)));
 const base=C.updateGlows;
 C.updateGlows=function(...args){
  if(prefs.seeThrough){try{let n=0;for(const entry of this.wallRows?.values?.()||[]){const st=entry?.mesh?.userData?.occlusion54;if(!st||!(st.alpha<.995))continue;const a=remap(st.alpha);
     st.materials.forEach((m,i)=>{m.opacity=st.baseOpacity[i]*a;});n++;}stats.frames++;stats.walls=n;}catch(e){lastError=String(e?.message||e);}}
  return base.apply(this,args);};
 // 2) 영웅 그림 일관성: 기억사수의 북쪽(위를 볼 때·위로 겨눌 때) 그림만 가늘고 작은 다른 화풍이라 7방향과 어긋났다.
 //    같은 화풍·같은 키·같은 발 위치로 다시 그린 뒷모습(ChatGPT 2026-10-29, 원본 앞모습·대각선 그림을 참조)으로 바꿔 보낸다.
 //    원본 파일은 그대로 두고 이미지 주소만 바꾼다(캐시 키·그림 크기 512·발밑 피벗 동일).
 const SWAP=Object.freeze(Object.fromEntries(['gunner','seoha','neon','michaela','hunter'].map(h=>['assets/hero_direction337/'+h+'/n.webp','assets/r119/heroes/'+h+'-n.webp']).concat(
  // R121: 기억사수 동작 프레임 중 흰 스티커 테두리·검은 번짐이 있는 세대를 정리한 사본(scripts/r121-gunner-clean.py)으로 바꿔 8방향 그림과 화풍을 맞춘다.
  ['aim_back','aim_front','attack_left','attack_right','guard_left','guard_right','player_aim','player_aimup','player_crouch','player_idle','player_run1','player_run2','run_back_a','run_back_b','run_front_a','run_front_b','run_left_a','run_left_b','run_right_a','run_right_b'].map(n=>['assets/heroes/normalized/gunner/'+n+'.webp','assets/r121/heroes/gunner/'+n+'.webp']))));// R119: 윤서하·네온·미카엘라·헌터도 북쪽이 정면에서 무기를 치켜든 그림이라 같은 방식으로 뒷모습 교체
 //    원래 그림이 캐시에 정상으로 올라온 뒤에 새 그림을 따로 받아, 다 받아지면 같은 캐시 칸의 그림만 바꾼다(실패하면 원래 그림 유지).
 const swapState=new Map();
 if(typeof readyImage==='function'&&typeof imageCache!=='undefined'){const readyBase=readyImage;readyImage=function(path,...rest){const row=readyBase.apply(this,arguments);
  try{if(prefs.heroArt&&row?.image){const k=typeof cleanPath==='function'?cleanPath(path):String(path).replace(/^\.\//,''),to=SWAP[k];
    if(to&&!swapState.has(k)){swapState.set(k,'loading');const im=new Image();im.decoding='async';im.onload=()=>{const r=imageCache.get(k);if(r&&prefs.heroArt){r.r119Original=r.image;r.image=im;if(typeof imageCrop==='function'){r.r119Crop=r.crop;r.crop=imageCrop(im);}/* R121: 게임이 처음 그림으로 재 둔 내용 상자(crop)를 새 그림으로 다시 잰다 — 안 하면 바깥이 잘린다 */swapState.set(k,'swapped');stats.swaps=(stats.swaps||0)+1;}};im.onerror=()=>swapState.set(k,'failed');im.src=typeof urlFor==='function'?urlFor(to):to;}}}catch(_){}
  return row;};}
 // 3) 보라 날개 타락천사(a11-c1, 첫 정원부터 나옴): 공격할 때만 공용 공격 묶음의 다른 캐릭터(해골 투구 기사, rc137 01 #940,0)로
 //    바뀌어 긴 은발 천사와 해골 기사가 번갈아 보였다. 같은 캐릭터로 새로 그린 공격 4동작(들어올림·내려베기·마무리·복귀,
 //    ChatGPT 2026-10-29, 대기 그림 참조, 오른쪽을 봄)으로 그 칸만 바꿔 그린다. 좌우 판단(R110 표 'L' = 오른쪽을 보는 그림)은 그대로.
 const ANGEL={path:'assets/r119/mobs/a11c1-attack.png',cell:[183,161],pivot:[79.89,160.05],visibleHeight:150};
 let angelLoad=null;
 if(typeof drawAssetFrame3==='function'){const frameBase=drawAssetFrame3;drawAssetFrame3=function(path,frame,x,y,height,opt,...rest){
  try{const r=frame?.assetFrame?.sourceRect;if(prefs.angelArt&&r&&r[0]===940&&r[1]===0&&/rc137\/mob-attacks-01\.png$/.test(String(path))){
    const row=typeof readyImage==='function'?readyImage(ANGEL.path):null;
    if(!row){if(!angelLoad&&typeof ensureImages==='function'){angelLoad=Promise.resolve(ensureImages([ANGEL.path])).catch(()=>{});}}
    else{const k=Number.isFinite(frame.r54Frame)?frame.r54Frame:2,i=k<=1?0:k===2?1:(frame.r54Phase==='recovery'&&(typeof time==='number'?time:0)%0.5>.25?3:2);
     const [cw,ch]=ANGEL.cell,f={...frame,path:ANGEL.path,assetFrame:{...frame.assetFrame,sourceRect:[i*cw,0,cw,ch],pivot:[...ANGEL.pivot],visibleHeight:ANGEL.visibleHeight,bakedFacing:'right'}};
     stats.angel=(stats.angel||0)+1;const res=frameBase.call(this,ANGEL.path,f,x,y,height,opt,...rest);if(res!==false)return res;}}}catch(_){}
  return frameBase.apply(this,arguments);};}
 // 4) (R121 철회) 그림을 불러온 뒤 키를 맞춰 다시 그려 넣던 보정은 뺐다: 이 게임은 원본 그림 기준의 자르기 상자로 영웅을 그려서
 //    다시 그린 그림의 바깥이 잘렸다. 키 맞추기는 R114 fitHero(몸 비율 실측)가 하고, R119·R121 교체 그림도 거기서 알아보게 했다.
 const fitState=new Map();function fitHero(){}
 // 5) 영웅이 맞을 때 흰 빛 대신 피 (사용자 2026-10-29 "피격 시 왜 하얀빛, 상대 색이나 붉은 피 튀기는 느낌으로"):
 //    한 번 맞을 때 주황 충돌 그림(burst-impact) 10~20장이 더하기 합성으로 겹쳐 하얗게 타 버렸다. 영웅 몸에 생긴
 //    이 충돌 그림들은 그리지 않고, 맞은 순간 하나만 어두운 붉은 피 튀김(때린 적의 고유색을 조금 섞음)을 보통 합성으로 그린다.
 //    피해량·판정·적에게 생기는 이펙트는 그대로. 설정 heroBlood.
 const HURT_TYPES=new Set(['bloodR52','regionalContactR58','contactR61','burst','e568HeroImpact']),blood={at:-9,rgb:[150,16,22],seed:0,sa:0};
 const onHero=f=>typeof player==='object'&&player&&Number.isFinite(f?.x)&&Math.hypot(f.x-player.x,f.y-player.y)<.45&&(f.r52Player||f.type!=='e568HeroImpact')&&typeof time==='number'&&time-blood.at<.6;
 if(typeof hurt==='function'){const hurtBase=hurt;hurt=function(damage,source,...rest){const before=player?.hp;const r=hurtBase.call(this,damage,source,...rest);
  try{if(prefs.heroBlood&&Number.isFinite(before)&&player.hp<before){const owner=(room?.enemies||[]).find(e=>e===source||e.id===source?.owner||e.id===source?.ownerId||e===source?.owner)||null;
   const c=window.__STORYWORLD_POLISH_R100__?.colourOf?.(owner),rgb=c&&window.__STORYWORLD_POLISH_R100_DATA__?.sigColours?.[c];
   blood.rgb=Array.isArray(rgb)?[Math.round(130+rgb[0]*.25),Math.round(rgb[1]*.22+8),Math.round(rgb[2]*.22+12)]:[150,16,22];
   const from=owner||(Number.isFinite(source?.x)?source:null);blood.sa=from?Math.atan2(player.y-from.y,player.x-from.x):Math.random()*6.28;if(time-blood.at>.12){blood.at=time;blood.seed=Math.random()*99;}}}catch(_){}return r;};}
 function drawBlood(){if(typeof ctx==='undefined'||typeof project!=='function')return;const t=(time-blood.at)/.45;if(!(t>=0&&t<1))return;
  const q=project(player.x,player.y),z=(typeof Z==='function'?Z():1),lift=46*z,k=1-t,[r,g,b]=blood.rgb,rnd=i=>{const s=Math.sin(blood.seed+i*12.9898)*43758.5453;return s-Math.floor(s);};
  ctx.save();ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=`rgba(${r},${g},${b},${.32*k*k})`;ctx.beginPath();ctx.ellipse(q.x,q.y-lift,16*z*(.6+.6*t),12*z*(.6+.6*t),0,0,6.283);ctx.fill();
  for(let i=0;i<9;i++){const a=Math.atan2(Math.sin(blood.sa)*.6,Math.cos(blood.sa))+(rnd(i)-.5)*2.2,d=(10+30*rnd(i+20))*z*(.25+.9*Math.sqrt(t)),fall=22*z*t*t*rnd(i+40),rr=(1.6+2.8*rnd(i+60))*z*(1-.45*t);
   ctx.fillStyle=`rgba(${Math.min(255,r+30*rnd(i))},${g},${b},${.9*k})`;ctx.beginPath();ctx.ellipse(q.x+Math.cos(a)*d,q.y-lift+Math.sin(a)*d*.7+fall,rr*1.5,rr,a,0,6.283);ctx.fill();}
  ctx.restore();stats.bloods=(stats.bloods||0)+1;}
 if(typeof drawEffect==='function'){const drawBase=drawEffect;drawEffect=function(f,...a){try{if(prefs.heroBlood&&HURT_TYPES.has(f?.type)&&onHero(f)){if(!blood.drawnAt||blood.drawnAt!==time){blood.drawnAt=time;drawBlood();}return;}}catch(_){}return drawBase.call(this,f,...a);};}
 // 7) 노말 초반 피해 완화 (사용자 2026-10-29 "노말인데 첫 정원 엘리트 무리에게 금방 쓰러짐"): 노말에서만 영웅 레벨이 낮을 때
 //    받는 피해를 줄인다. Lv1 65% -> 레벨마다 +7% -> Lv6부터 원래대로 100%. 이지·하드, Lv6 이상은 그대로. 설정 earlyGrace.
 const graceOf=()=>{try{const co=window.__STORYWORLD_COOP_SIM_R62__;if(co?.mode&&co.mode()!=='off')return 1;/* 협동에서는 피해가 여러 영웅에게 나뉘므로 적용하지 않음(Codex 리뷰) */const C=window.__STORYWORLD_CAMPAIGN_R63R1__,m=typeof C?.mode==='function'?C.mode():C?.mode;if(m!=='normal')return 1;
  const lv=Number(player?.level)||1;return Math.min(1,.65+.07*Math.max(0,lv-1));}catch(_){return 1;}};
 if(typeof hurt==='function'){const hurtGrace=hurt;hurt=function(damage,...rest){let d=damage;try{if(prefs.earlyGrace&&Number.isFinite(d)&&d>0){const g=graceOf();if(g<1){d=d*g;stats.graced=(stats.graced||0)+1;}}}catch(_){}return hurtGrace.call(this,d,...rest);};}
 // 8) 걷기 동작 (사용자 2026-10-29 "왼·오·위·아래로 움직일 때 잘린 그림만 나오고 동작이 이어지지 않고 한 그림으로 진행"):
 //    R114가 이동 중 그림을 '마지막에 그린 한 장'(걷기 묶음의 한 칸이나 정지 그림)으로 바꿔 두어, 걸음이 멈춘 한 장으로 보이고
 //    방향마다 키가 59~104px로 달랐다. 영웅을 다 그린 뒤(기록된 그리기 명령) 이동 중이고 공격·스킬·맞음·대시·방어가 아니면,
 //    화면에서 실제 움직이는 방향(8방향)의 R91 걷기 묶음(4x2, 8프레임)을 걸은 거리에 맞춰 차례로 끼운다.
 //    칸마다 실제 몸 테두리로 잘라 키를 actorHeight x 0.98(R114 서 있기 기준)로 맞추고 발밑은 그대로. 그림이 없는 방향은 가까운 방향/좌우반전.
 const WALK_DIR='assets/r91/walk/',walkPlan={},walkBox=new Map(),walkMissing=new Set(),walkLoading=new Set(),walkState={d:0,x:null,y:null,dir:'s'};
 try{if(typeof fetch==='function')fetch((typeof urlFor==='function'?urlFor(WALK_DIR+'index.json'):WALK_DIR+'index.json')).then(r=>r.ok?r.json():null).then(j=>{if(j?.plan)Object.assign(walkPlan,j.plan);}).catch(()=>{});}catch(_){}
 const DIR8=['e','se','s','sw','w','nw','n','ne'],NEAR={n:['ne','nw'],s:['se','sw'],e:['ne','se'],w:['nw','sw'],ne:['e','n'],nw:['w','n'],se:['e','s'],sw:['w','s']};
 // R121: 기억사수는 서 있기(R93 치비 비율)와 같은 비율로 새로 그린 4프레임 걷기(ChatGPT 2026-10-29, scripts/r121-gunner-walk.py)를 쓴다.
 const OWN_WALK={gunner:{s:['s',0],se:['e8',0],e:['e8',0],ne:['ne',0],n:['n',0],sw:['e8',1],w:['e8',1],nw:['ne',1]}};// R121: 아래 대각선은 4장 대각선이 어색해(사용자) 옆 8장으로 대체// 옆(e8)은 무거운 보병 행군 원리로 다시 그린 8프레임(2줄)
 const preloadWalk=()=>{try{if(typeof ensureImages==='function'&&typeof player==='object'&&player?.hero&&OWN_WALK[player.hero]){const ps=[...new Set(Object.values(OWN_WALK[player.hero]).map(v=>'assets/r121/walk/walk-'+player.hero+'-'+v[0]+'.png'))];if(ps.some(p=>!walkLoading.has(p))){ps.forEach(p=>walkLoading.add(p));Promise.resolve(ensureImages(ps)).catch(()=>ps.forEach(p=>walkMissing.add(p)));}}}catch(_){}};// 처음 걸을 때 예전 그림이 잠깐 보이지 않게 미리 받는다
 function sheetFor(hero,dir){const own=OWN_WALK[hero]?.[dir];if(own){const p='assets/r121/walk/walk-'+hero+'-'+own[0]+'.png';if(!walkMissing.has(p)){const n=own[0].endsWith('12')?12:own[0].endsWith('8')?8:4;return{path:p,mirror:!!own[1],cols:4,rows:n/4,frames:n,own8:n>4};}}
  if(dir==='n'){const ab=Math.floor(walkState.d*3.2)%2?'b':'a',p='assets/heroes/normalized/'+hero+'/run_back_'+ab+'.webp';if(!walkMissing.has(p))return{path:p,mirror:false,single:true};}/* R121: 위쪽 걷기 묶음이 없어 정면 위로 갈 때 뒷모습 달리기 2장 */const plan=walkPlan[hero];const tryDir=d=>{const p=plan?.[d];if(p&&p.use)return{path:WALK_DIR+'walk-'+hero+'-'+p.use+'.png',mirror:!!p.mirror};if(!plan)return{path:WALK_DIR+'walk-'+hero+'-'+d+'.png',mirror:false};return null;};
  for(const d of [dir,...(NEAR[dir]||[])]){const s=tryDir(d);if(s&&!walkMissing.has(s.path))return s;}return null;}
 function cellBox(row,path,i,cols=4,rows=2){const k=path+'|'+i;if(walkBox.has(k))return walkBox.get(k);const im=row.image,W=im.naturalWidth||im.width,H=im.naturalHeight||im.height,one=i<0,cw=one?W:W/cols,ch=one?H:H/rows,sx=one?0:(i%cols)*cw,sy=one?0:Math.floor(i/cols)*ch;
  let box=[sx,sy,cw,ch];try{const c=document.createElement('canvas');c.width=Math.ceil(cw);c.height=Math.ceil(ch);const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sx,sy,cw,ch,0,0,cw,ch);const d=g.getImageData(0,0,c.width,c.height).data;
   let x0=c.width,y0=c.height,x1=-1,y1=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
   if(x1>=x0)box=[sx+Math.max(0,x0-1),sy+Math.max(0,y0-1),Math.min(cw,x1-x0+3),Math.min(ch,y1-y0+3)];}catch(_){}walkBox.set(k,box);return box;}
 // 영웅 몸 그림만 고른다: 반자동이 공명 방어를 쓰면 영웅 위에 큰 방어막 그림(barrier-sigil)이 함께 그려져, '가장 큰 영웅 그림'을
 // 몸으로 잘못 골라 방어막을 걷기 그림으로 바꾸고 몸은 정지 그림으로 남던 버그(사용자 2026-10-29 "길잡이·반자동 켜면 이미지 버그")를 막는다.
 const BODY_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|awakening|^blob:/;
 const bodyMemo=new WeakMap();
 function bodyFracOf(im,rect){if(!im||!rect)return null;let m=bodyMemo.get(im);if(!m){m=new Map();bodyMemo.set(im,m);}const k=rect.map(Math.round).join(',');if(m.has(k))return m.get(k);let f=null;
  try{const [sx,sy,sw,sh]=rect,s=Math.min(1,160/Math.max(sw,sh)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(sw*s));c.height=Math.max(1,Math.round(sh*s));const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);
   const d=g.getImageData(0,0,c.width,c.height).data;let y0=c.height,y1=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>24){if(y<y0)y0=y;if(y>y1)y1=y;}if(y1>=y0)f=(y1-y0+1)/c.height;}catch(_){}m.set(k,f);return f;}
 // 서 있을 때 실제 몸 키(그린 높이 x 몸 비율)를 actorHeight 비율로 기억해 걸을 때 같은 키로 그린다(사용자: 멈추면 커짐, 서 있는 크기가 자연스러움).
 const standRatio={v:null};
 if(typeof drawHero==='function'){const heroDraw=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=heroDraw.apply(this,a);
  try{if(!prefs.walkCycle||st<0||!player)return r;let mv=0;if(walkState.x!=null){const dx=player.x-walkState.x,dy=player.y-walkState.y,d=Math.hypot(dx,dy);
     if(d>1e-4&&d<1.2){walkState.d+=d;mv=d;if(d>.004)walkState.movedAt=typeof time==='number'?time:0;if(typeof project==='function'){const q0=project(walkState.x,walkState.y),q1=project(player.x,player.y),ang=Math.atan2(q1.y-q0.y,q1.x-q0.x);walkState.dir=DIR8[((Math.round(ang/(Math.PI/4))%8)+8)%8];}}}
   walkState.x=player.x;walkState.y=player.y;
   const busy=player.attackAnim>0||player.skillAnim>0||player.hurtAnim>0||player.dashAnim>0||player.ultimateAnim>0||player.guard;
   // 이동 중 기본 사격·방어(반자동은 걸으면서 계속 쏜다)에는 걷기를 이어 간다 — 걷기 그림도 총을 앞으로 든 자세라 정지 그림이 미끄러지던 것보다 자연스럽다.
   const busyMove=player.skillAnim>0||player.hurtAnim>0||player.dashAnim>0||player.ultimateAnim>0;
   preloadWalk();
   // 반자동 비켜서기·물러나기·길잡이처럼 '이동 중' 표시 없이 위치만 옮기는 경우도 걷기로 본다(사용자: 반자동 켜고 움직이면 동작 없이 이동).
   const movingNow=player.moving||((typeof time==='number'?time:0)-(walkState.movedAt??-9)<.15);
   if(!movingNow){if(!busy&&typeof actorHeight==='function'){let sb=null,sbh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||'')))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>sbh){sbh=h;sb=c;}}
     const fr=sb&&bodyFracOf(sb.image,sb.sourceRect);if(fr&&sbh>6){const v=sbh*fr/actorHeight();if(v>.6&&v<1.6){standRatio.v=standRatio.v==null?v:standRatio.v*.9+v*.1;stats.standRatio=Math.round(standRatio.v*1000)/1000;}}}return r;}
   if(busyMove)return r;
   const sh=sheetFor(player.hero,walkState.dir);if(!sh)return r;const row=typeof readyImage==='function'?readyImage(sh.path):null;
   if(!row){if(!walkLoading.has(sh.path)&&typeof ensureImages==='function'){walkLoading.add(sh.path);Promise.resolve(ensureImages([sh.path])).catch(()=>walkMissing.add(sh.path));}return r;}
   let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||'')))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
   if(!best)return r;const frame=sh.single?-1:Math.floor(walkState.d*(sh.frames===4?3.2:sh.frames===12?9.6:sh.own8?6.4:5))%(sh.frames||8),box=cellBox(row,sh.path,frame,sh.cols||4,sh.rows||2),im=row.image,want=(typeof actorHeight==='function'?actorHeight():bh)*(standRatio.v||.98),w=want*box[2]/box[3];
   // 걸음 무게감: 발을 디딘 직후 살짝 내려앉고(-1.5%), 다리가 엇갈릴 때 올라간다(+2.5%). 8프레임: 2·6번째가 가장 낮고 3·7번째가 가장 높다.
   const n=sh.frames||8,ph=(n===12?[0,-1,-.4,1,.4,0,-1,-.4,1,.4,0,0][frame]:n===8?[0,-1,1,.4,0,-1,1,.4][frame]:[0,1,0,1][frame])??0,bob=(ph>0?.025*ph:.015*ph)*want;
   const P=best.points,fx=(P[2][0]+P[3][0])/2,fy=Math.max(P[2][1],P[3][1])-bob,f=sh.mirror?-1:1;
   Object.assign(best,{image:im,sourcePath:im.src||sh.path,immutableTint:null,sourceRect:box.slice(),imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],
    points:[[fx-f*w/2,fy-want],[fx+f*w/2,fy-want],[fx+f*w/2,fy],[fx-f*w/2,fy]],r121Walk:true});stats.walk=(stats.walk||0)+1;stats.walkDir=walkState.dir;}catch(e){lastError=String(e?.message||e);}
  return r;};}
 // 9) 기억사수 적중 표시 (사용자 2026-10-29 "공격 적중 시 / 이펙트는 없애고 원형이나 십자가로"): 기본 적중 그림(gunner-memory-impact,
 //    대각선 파편 베기 모양) 대신 하늘색 원이 퍼지며 사라지고 가운데에 짧은 십자가 반짝인다. 적 그림의 가운데(R115)에 그린다. 다른 영웅은 그대로. 설정 gunnerHit.
 function drawGunnerHit(f){if(typeof ctx==='undefined'||typeof project!=='function')return false;const life=finite(f.life)||.3,t=Math.min(1,Math.max(0,finite(f.age)/life)),k=1-t;
  let q=project(f.x,f.y),cy=q.y-26;const tgt=f.targetIdE568&&(room?.enemies||[]).find(e=>String(e.id)===String(f.targetIdE568)),v=tgt&&window.__STORYWORLD_PLAY_R115__?.centreOf?.(tgt);if(v){q={x:v.cx,y:q.y};cy=v.cy;}
  const z=typeof zoom==='number'?zoom:1,R=(6+16*Math.sqrt(t))*z,c=Math.max(3,9*z*(1-t*.6));ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  ctx.strokeStyle=`rgba(120,230,255,${.85*k})`;ctx.lineWidth=Math.max(1.2,2.6*z*k);ctx.beginPath();ctx.ellipse(q.x,cy,R,R*.72,0,0,6.283);ctx.stroke();
  ctx.strokeStyle=`rgba(225,250,255,${.95*k*k})`;ctx.lineWidth=Math.max(1,2.2*z*k);ctx.beginPath();ctx.moveTo(q.x-c,cy);ctx.lineTo(q.x+c,cy);ctx.moveTo(q.x,cy-c);ctx.lineTo(q.x,cy+c);ctx.stroke();
  ctx.fillStyle=`rgba(200,245,255,${.5*k*k})`;ctx.beginPath();ctx.arc(q.x,cy,2.4*z*k+1,0,6.283);ctx.fill();ctx.restore();stats.gunnerHits=(stats.gunnerHits||0)+1;return true;}
 const finite=v=>Number.isFinite(+v)?+v:0;
 const nearGunnerHit=f=>typeof effects!=='undefined'&&effects.some(g=>g!==f&&g.type==='e568HeroImpact'&&g.heroIdE568==='gunner'&&finite(g.age)<.45&&Math.hypot(g.x-f.x,g.y-f.y)<.9);
 if(typeof drawEffect==='function'){const hitBase=drawEffect;drawEffect=function(f,...a){try{if(prefs.gunnerHit&&f){
   if(f.type==='e568HeroImpact'&&(f.heroIdE568==='gunner'||/gunner-memory-impact/.test(String(f.asset||'')))&&drawGunnerHit(f))return;
   // 같은 적중에 함께 생기는 주황 별빛 폭발(burst)·플레이어 근접 불꽃(X자 pxf 묶음)도 사선처럼 보여 기억사수 적중에서는 그리지 않는다.
   if(player?.hero==='gunner'&&(f.type==='burst'||(f.type==='pxfSprite'&&/player-atlas/.test(String(f.asset||''))))&&nearGunnerHit(f)){stats.gunnerHitHidden=(stats.gunnerHitHidden||0)+1;return;}}}catch(_){}return hitBase.call(this,f,...a);};}
 // 6) Esc로 메뉴·설정 창 닫기 (사용자 2026-10-29): 열린 창(openPanel)의 '계속/닫기'(.close) 단추를 대신 누른다.
 //    입력칸에 글을 쓰는 중이거나 열린 창이 없으면 원래 Esc 동작 그대로.
 if(typeof addEventListener==='function')addEventListener('keydown',ev=>{try{if(ev.key!=='Escape'||ev.repeat)return;const t=ev.target;if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable))return;
  const btn=[...document.querySelectorAll('button.close')].reverse().find(b=>b.offsetParent!==null&&!b.disabled);if(!btn)return;
  ev.preventDefault();ev.stopImmediatePropagation();btn.click();stats.escCloses=(stats.escCloses||0)+1;}catch(_){}},true);
 function set(p={}){if(typeof p.gunnerHit==='boolean')prefs.gunnerHit=p.gunnerHit;if(typeof p.walkCycle==='boolean')prefs.walkCycle=p.walkCycle;if(typeof p.earlyGrace==='boolean')prefs.earlyGrace=p.earlyGrace;if(typeof p.heroBlood==='boolean')prefs.heroBlood=p.heroBlood;if(typeof p.heroFit==='boolean')prefs.heroFit=p.heroFit;if(typeof p.angelArt==='boolean')prefs.angelArt=p.angelArt;if(typeof p.heroArt==='boolean')prefs.heroArt=p.heroArt;if(typeof p.seeThrough==='boolean')prefs.seeThrough=p.seeThrough;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 window.__STORYWORLD_VISUAL_R119__=Object.freeze({revision:'R119-visual-1',nativeMin:NATIVE_MIN,min:MIN,remap,prefs:()=>({...prefs}),set,swap:SWAP,inspect:()=>({prefs:{...prefs},stats:{...stats},swapState:Object.fromEntries(swapState),fitState:Object.fromEntries(fitState),lastError,collisionChanged:false})});
})();
