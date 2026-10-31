/* R119 시각 다듬기 (사용자 2026-10-29 "시각적 개선 중점으로 플레이")
 * 1) 영웅·몹을 가리는 벽을 더 투명하게: 렌더러(R54/R73)는 배우를 가리는 벽을 42%까지만 흐리게 해서, 짙은 산울타리·돌벽
 *    뒤에서 싸우면 영웅과 보스가 거의 보이지 않았다(dist00 뿌리의 문지기 전투에서 확인). 흐림 계산이 끝난 뒤, 실제로
 *    그리기 전에(updateGlows 직전) 흐려진 벽의 불투명도를 다시 매겨 가장 흐린 값을 22%로 낮춘다. 흐림 여부·속도는 그대로.
 * 판정·충돌·배치는 건드리지 않는다(재질의 불투명도만). 설정 키 r119.visual. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 const C=window.StoryPhase1?.ThreeRenderer?.prototype;
 if(window.__STORYWORLD_VISUAL_R119__||!C||typeof C.updateGlows!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r119.visual';
 const prefs={seeThrough:true,heroArt:true,angelArt:true,heroFit:false,heroBlood:true,earlyGrace:true,walkCycle:true,gunnerHit:true,gunnerSheet:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of ['seeThrough','heroArt','angelArt','heroFit','heroBlood','earlyGrace','walkCycle','gunnerHit','gunnerSheet'])if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
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
 // R128: 기억사수를 Gemini 시트(Drive StoryWorld-HERO-gunner-sheet-20261030, 7.5~8등신 다크 판타지, scripts/r128-gunner-sheet.py)로 바꾼다.
 //    기존 정지·동작 그림(만화체) 59장 각각을 같은 동작·방향 프레임으로 만든 대체본(같은 512 캔버스·발 위치·몸 키)으로 보낸다. 설정 gunnerSheet.
 // R130: 같은 방식을 영웅마다(scripts/r130-hero-sheet.py). keep: 그림에 특수 효과가 들어 있어 원래 그림을 두는 동작(미카엘라 궁극기 날개·방향 막기 방패).
 const SHEETS={gunner:{dir:'assets/r128/gunner/',keep:null},michaela:{dir:'assets/r130/michaela/',keep:/ultimate-|actions-directional\/michaela-guard-/},
  seoha:{dir:'assets/r130/seoha/',keep:/ultimate-/},lauren:{dir:'assets/r130/lauren/',keep:/ultimate-/},
  neon:{dir:'assets/r130/neon/',keep:/ultimate-/},hunter:{dir:'assets/r130/hunter/',keep:/ultimate-/},slayer:{dir:'assets/r130/slayer/',keep:/ultimate-|actions-directional\/slayer-guard-/},
  hwando:{dir:'assets/r130/hwando/',keep:/./}};// 환도: 서 있기 그림이 좋아 걷기만 새 시트(정지·동작 그림은 그대로)// R131: 서하·로렌(궁극기 그림은 큰 효과가 들어 있어 원래 그림)
 const RUN164={michaela:'assets/r164/michaela/run-'},walkPath=(hero,v)=>RUN164[hero]&&prefs.run164!==false?RUN164[hero]+v+'.webp':SHEETS[hero].dir+'walk-'+v+'.webp';
 const sheetRe=Object.fromEntries(Object.keys(SHEETS).map(h=>[h,new RegExp('^assets\\/(?:hero_direction33[478]\\/'+h+'\\/|heroes\\/normalized\\/'+h+'\\/|heroes\\/normalized\\/(?:directions|actions-(?:consistent|v3126|directional))\\/'+h+'-)[^/]+\\.webp$')]));
 const swap128=k0=>{if(!prefs.gunnerSheet)return null;const k=String(k0).replace(/^assets\/r99\/clean\//,'');/* R131: R99 정리 사본(assets/r99/clean/assets/…)도 같은 대체본 */for(const h in SHEETS){if(!sheetRe[h].test(k)||SHEETS[h].keep?.test(k))continue;if(/actions-directional\//.test(k)&&(h==='gunner'||!/-attack-(?:left|right)\.webp$/.test(k)))return null;/* R159: 방향 동작 대체본은 R130 시트의 공격 좌·우뿐(기억사수 R128 은 없음) — 없는 대체본(스킬 좌·우 등)을 매번 받으려다 404 나던 것을 묻지 않는다(원래 그림 그대로) */const parts=k.split('/');return SHEETS[h].dir+(/\/hero_direction338\//.test(k)?'d338-':'')/* R134: 337·338 묶음 이름 겹침(로렌) */+parts[parts.length-2].replace(h,'g')+'-'+parts[parts.length-1].replace(/\.webp$/,'')+'.webp';}return null;};
 const swapState=new Map();
 // R131: 바꿔 넣을 그림을 미리 받아 두고, 준비됐으면 그 자리에서 바로 바꾼다(예전엔 원래 그림이 먼저 그려진 뒤 바뀌어 옛 그림이 잠깐 보였고,
 //       지역 이동으로 그림 캐시가 비면 '이미 바꿈'으로 기억해 옛 그림이 그대로 남았다). 캐시 줄마다 매번 확인한다.
 const art=new Map();// 새 그림 주소 -> {img, state, keys}
 function wantArt(to,k){let e=art.get(to);if(!e){e={img:new Image(),state:'loading',keys:new Set()};e.img.decoding='async';
   e.img.onload=()=>{e.state='ready';for(const kk of e.keys){const r=typeof imageCache!=='undefined'?imageCache.get(kk):null;if(r)applyArt(r,e);}};e.img.onerror=()=>{e.state='failed';};
   art.set(to,e);e.img.src=typeof urlFor==='function'?urlFor(to):to;}if(k)e.keys.add(k);return e;}
 function applyArt(r,e){if(!r||r.image===e.img)return;if(!r.r119Original)r.r119Original=r.image;r.image=e.img;if(typeof imageCrop==='function'){r.r119Crop=r.crop;r.crop=imageCrop(e.img);}stats.swaps=(stats.swaps||0)+1;}
 const swapTo=k=>swap128(k)||(prefs.heroArt?SWAP[k]:null);
 if(typeof readyImage==='function'&&typeof imageCache!=='undefined'){const readyBase=readyImage;readyImage=function(path,...rest){const row=readyBase.apply(this,arguments);
  try{if(row?.image){const k=typeof cleanPath==='function'?cleanPath(path):String(path).replace(/^\.\//,''),to=swapTo(k);
    if(to){const e=wantArt(to,k);swapState.set(k,e.state==='ready'?'swapped':e.state);if(e.state==='ready')applyArt(row,e);}}}catch(_){}
  return row;};}
 // 영웅을 고르거나 바꾸면 그 영웅의 대체 그림·걷기·서 있기 시트를 미리 받는다.
 const preloaded=new Set();
 function preloadHeroArt(){try{const h=typeof player==='object'&&player?.hero;if(!h||preloaded.has(h)||typeof heroPaths!=='function')return;preloaded.add(h);
  for(const p of heroPaths(h)){const k=String(p).replace(/^\.\//,''),to=swapTo(k);if(to)wantArt(to,k);}
  if(SHEETS[h]&&prefs.gunnerSheet){for(const d of ['s','se','e','ne','n'])wantArt(walkPath(h,d));loadSheetIndex(h);}}catch(_){}}
 const sheetIdx=new Map(),sheetSwap=new Map(),ATLAS_HEROES=new Set(['slayer']);// 아틀라스로 그리는 영웅: 동작 그림을 미리 다 받아 둔다(첫 공격부터 새 그림)
 function loadSheetIndex(h){if(sheetIdx.has(h)||typeof fetch!=='function')return;sheetIdx.set(h,null);const u=SHEETS[h].dir+'index.json';
  fetch(typeof urlFor==='function'?urlFor(u):u).then(r=>r.ok?r.json():null).then(j=>{if(j?.swap){sheetSwap.set(h,j.swap);if(ATLAS_HEROES.has(h)){const ks=Object.keys(j.swap);for(const k of ks)wantArt(j.swap[k].path,k);if(typeof ensureImages==='function')Promise.resolve(ensureImages(ks.filter(k=>!(typeof imageCache!=='undefined'&&imageCache.get(k))))).catch(()=>{});}}if(j?.idle){sheetIdx.set(h,j.idle);for(const it of Object.values(j.idle))wantArt(it.path);}}).catch(()=>{});}
 // R93 서 있기(visual-r93)가 이 영웅의 새 8방향 서 있기 시트를 쓰게 알려 준다. 준비 전에는 null(R93 원래 그림).
 const OPP={e:'w',w:'e',se:'sw',sw:'se',ne:'nw',nw:'ne',s:'s',n:'n'};
 window.__STORYWORLD_HERO_SHEETS__=Object.freeze({idleItem(h,dir,mirrored){if(!prefs.gunnerSheet||!SHEETS[h])return null;loadSheetIndex(h);const m=sheetIdx.get(h);if(!m)return null;
   const it=m[mirrored?OPP[dir]||dir:dir]||m.s;const e=it&&wantArt(it.path);return e&&e.state==='ready'?{...it,image:e.img}:null;},heroes:()=>Object.keys(SHEETS)});
 // R131: 슬레이어는 게임이 옛 그림 묶음(hero-authored-v314rc5 동작·걷기 아틀라스)의 칸으로 그려서 새 시트로 바꾼 정지·동작 그림이
 //  쓰이지 않았다(브라우저 측정: 공격 때 옛 그림). 영웅 그림이 지나는 R83 표시 단계에서 그 칸을 같은 상태·방향의 새 그림(발 위치·몸 키는
 //  index.json frame)으로 바꾼다. 새 그림이 아직 준비되지 않았으면 원래 칸을 그대로 그린다(영웅이 사라지지 않게). 환도는 원래 그림 유지.
 const ATLAS_RE=/hero-authored-v314rc5\/([a-z]+)-(?:action|walk)-atlas\.png$/,SIDE4={front:'front',back:'back',left:'left',right:'right'};
 function atlasSwap(frame){const n=frame?.nativeHero5,m=ATLAS_RE.exec(String(frame?.path||''));if(!n||!m||m[1]!==n.hero||!SHEETS[n.hero]||n.hero==='hwando'||!prefs.gunnerSheet)return null;
  loadSheetIndex(n.hero);const sw=sheetSwap.get(n.hero),side=SIDE4[n.direction];if(!sw||!side)return null;const h=n.hero,N='assets/heroes/normalized/',swing=Number(n.atlasFrame)>=4;
  const orig=n.state==='hit'?`${N}actions-v3126/${h}-hurt-${side}.webp`:n.state==='move'?`${N}actions-v3126/${h}-move-${side}.webp`:n.state==='dash'?`${N}actions-consistent/${h}-dash-${side}.webp`
   :n.state==='guard'?`${N}actions-consistent/${h}-guard-${side}.webp`:n.state==='attack'||n.state==='ultimate'?`${N}actions-consistent/${h}-${swing||n.state==='ultimate'?'attack':'skill'}-${side}.webp`
   :n.state==='skill'?`${N}actions-consistent/${h}-${swing?'attack':'skill'}-${side}.webp`:`${N}directions/${h}-${side}.webp`;
  const it=sw[orig];if(!it?.frame)return null;const e=wantArt(it.path,orig);if(e.state!=='ready')return null;
  // R134: 게임 그림 기억에 아직 없으면(처음 쓰는 기술·피격, 지역 이동 직후) 옛 아틀라스가 보였다 — 미리 받은 새 그림을 그 주소로 기억에 넣고 바로 그린다.
  const key=typeof cleanPath==='function'?cleanPath(it.path):it.path;
  try{if(typeof imageCache!=='undefined'&&!imageCache.get(key)?.ready)imageCache.set(key,{path:key,image:e.img,ready:true,error:null,promise:Promise.resolve(),crop:typeof imageCrop==='function'?imageCrop(e.img):null,attempts153:[],r134Injected:true});}catch(_){return null;}
  if(!(typeof readyImage==='function'&&readyImage(it.path)))return null;
  const [W]=it.frame.size,[px,py]=it.frame.pivot,half=Math.max(8,Math.min(px,W-px));stats.atlasSwap=(stats.atlasSwap||0)+1;
  // 자르기 상자를 발 기준 좌우 대칭·발 높이까지로 둔다(걷기·서 있기 덧그림이 상자 밑 가운데를 발로 본다)
  return{...frame,path:it.path,assetFrame:{...frame.assetFrame,sourceRect:[px-half,0,half*2,py],pivot:[half,py],visibleHeight:it.frame.visibleHeight,bakedFacing:side==='left'?'left':'right',muzzle:null},
   nativeHero5:{...n,flip:false,swordTip:null,clip:null,r131Atlas:it.path}};}
 // R134: 대체본 몸이 원래 그림의 자르기 상자보다 커서 머리·발이 잘려 보였다(로렌 달리기 앞모습 머리 44px, 미카엘라 옆 공격, 네온 막기).
 //  대체본이 실제로 그려질 때만 자르기 상자를 대체본 테두리까지 넓힌다. 발 기준점·키 비율은 그대로라 위치·크기는 같다.
 function cropSwap(frame){const n=frame?.nativeHero5,a=frame?.assetFrame;if(!n||!a||!SHEETS[n.hero]||!prefs.gunnerSheet||n.r131Atlas)return null;
  const k=String(frame.path||'').replace(/^\.\//,'').replace(/^assets\/r99\/clean\//,''),it=sheetSwap.get(n.hero)?.[k],bb=it?.frame?.bbox;if(!bb)return null;
  const row=typeof readyImage==='function'?readyImage(frame.path):null,e=art.get(it.path);if(!row||!e||row.image!==e.img)return null;
  const [x,y,w,h]=a.sourceRect,W=e.img.naturalWidth||it.frame.size[0],H=e.img.naturalHeight||it.frame.size[1],nx=Math.max(0,Math.min(x,bb[0]-2)),ny=Math.max(0,Math.min(y,bb[1]-2)),nx1=Math.min(W,Math.max(x+w,bb[2]+2)),ny1=Math.min(H,Math.max(y+h,bb[3]+2));
  if(nx===x&&ny===y&&nx1===x+w&&ny1===y+h)return null;stats.cropSwap=(stats.cropSwap||0)+1;
  return{...frame,assetFrame:{...a,sourceRect:[nx,ny,nx1-nx,ny1-ny],pivot:[a.pivot[0]+(x-nx),a.pivot[1]+(y-ny)]},nativeHero5:{...n,clip:null,swordTip:null}};}
 {const r83=window.StoryHeroPresentationR83;if(r83&&typeof r83.present==='function'){const base=r83.present;
  window.StoryHeroPresentationR83=Object.freeze({...r83,present(frame){const res=base.call(r83,frame);try{const f=atlasSwap(res?.frame||frame)||cropSwap(res?.frame||frame);if(f)return{...(res||{heightScale:1}),frame:f};}catch(e){lastError=String(e?.message||e);}return res;}});}}
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
  const q=project(player.x,player.y),z=(typeof zoom==='number'&&zoom>0?zoom:1),lift=46*z,k=1-t,[r,g,b]=blood.rgb,rnd=i=>{const s=Math.sin(blood.seed+i*12.9898)*43758.5453;return s-Math.floor(s);};
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
 const WALK_RATE_R148=3.2;
 const DIR8=['e','se','s','sw','w','nw','n','ne'],NEAR={n:['ne','nw'],s:['se','sw'],e:['ne','se'],w:['nw','sw'],ne:['e','n'],nw:['w','n'],se:['e','s'],sw:['w','s']};
 // R121: 기억사수는 서 있기(R93 치비 비율)와 같은 비율로 새로 그린 4프레임 걷기(ChatGPT 2026-10-29, scripts/r121-gunner-walk.py)를 쓴다.
 // R128: 기억사수 걷기는 Gemini 시트의 5방향 8프레임 한 줄(왼쪽 3방향은 반전). gunnerSheet 를 끄면 R121 걷기.
 const WALK5={s:['s',0],se:['se',0],e:['e',0],ne:['ne',0],n:['n',0],sw:['se',1],w:['e',1],nw:['ne',1]},OWN_WALK128=Object.fromEntries(Object.keys(SHEETS).map(h=>[h,WALK5]));
 const OWN_WALK={gunner:{s:['s',0],se:['e6',0],e:['e6',0],ne:['ne',0],n:['n',0],sw:['e6',1],w:['e6',1],nw:['ne',1]}};// R121: 옆은 윤서하 걸음을 따라 그린 6프레임(사용자)// R121: 아래 대각선은 4장 대각선이 어색해(사용자) 옆 8장으로 대체// 옆(e8)은 앞으로 나가는 다리가 무릎을 접어 들었다 내딛는 8프레임(2줄, 사용자 제안)
 // 지역을 옮기면 게임이 그림 기억(캐시)을 비워 걷기 그림도 사라졌는데, '이미 받음'으로 기억해 다시 받지 않아 정지 그림으로 이동했다
 // (사용자: 길잡이 켜면 그림 하나로 고정된 채 이동 — 길잡이가 지역을 자주 옮겨 더 자주 보였다). 준비 안 됐으면 1초마다 다시 받는다.
 const askAt=new Map(),wantImage=p=>{if(walkMissing.has(p)||typeof ensureImages!=='function')return;const t0=Date.now();if(t0-(askAt.get(p)||0)<1000)return;askAt.set(p,t0);Promise.resolve(ensureImages([p])).catch(()=>walkMissing.add(p));};
 // R164: 미카엘라 이동 그림은 드라이브 'Michaela-movement-v1-review'의 달리기 8칸 5방향(보폭 큰 달리기, assets/r164/michaela; 출처·해시는 그 index.json).
 //  R130 걷기는 다리를 거의 벌리지 않는 종종걸음이었다(사용자 '어그적어그적'). 칸·발 기준점이 같아 그림 경로만 바꾼다. storyworld.r119.visual {run164:false} 로 예전 걷기.
 const ownWalk=hero=>prefs.gunnerSheet&&OWN_WALK128[hero]?{map:OWN_WALK128[hero],path:v=>walkPath(hero,v),r128:true}:OWN_WALK[hero]?{map:OWN_WALK[hero],path:v=>'assets/r121/walk/walk-'+hero+'-'+v+'.png'}:null;
 const preloadWalk=()=>{try{const o=typeof player==='object'&&player?.hero?ownWalk(player.hero):null;if(typeof readyImage==='function'&&o)for(const v of new Set(Object.values(o.map).map(v=>o.path(v[0]))))if(!readyImage(v))wantImage(v);}catch(_){}};// 처음 걸을 때 예전 그림이 잠깐 보이지 않게 미리 받는다
 function sheetFor(hero,dir){const ow=ownWalk(hero),own=ow?.map[dir];if(own&&ow.r128){const p=ow.path(own[0]);if(!walkMissing.has(p))return{path:p,mirror:!!own[1],cols:8,rows:1,frames:8,own8:true,r128:true};}
  if(own&&!ow.r128){const p=ow.path(own[0]);if(!walkMissing.has(p)){const n=own[0].endsWith('12')?12:own[0].endsWith('8')?8:own[0].endsWith('6')?6:4,cols=n===6?3:4;return{path:p,mirror:!!own[1],cols,rows:n/cols,frames:n,own8:n>4};}}
  if(dir==='n'){const ab=Math.floor(walkState.d*3.2)%2?'b':'a',p='assets/heroes/normalized/'+hero+'/run_back_'+ab+'.webp';if(!walkMissing.has(p))return{path:p,mirror:false,single:true};}/* R121: 위쪽 걷기 묶음이 없어 정면 위로 갈 때 뒷모습 달리기 2장 */const plan=walkPlan[hero];const tryDir=d=>{const p=plan?.[d];if(p&&p.use)return{path:WALK_DIR+'walk-'+hero+'-'+p.use+'.png',mirror:!!p.mirror};if(!plan)return{path:WALK_DIR+'walk-'+hero+'-'+d+'.png',mirror:false};return null;};
  for(const d of [dir,...(NEAR[dir]||[])]){const s=tryDir(d);if(s&&!walkMissing.has(s.path))return s;}return null;}
 function cellBox(row,path,i,cols=4,rows=2){const k=path+'|'+i;if(walkBox.has(k))return walkBox.get(k);const im=row.image,W=im.naturalWidth||im.width,H=im.naturalHeight||im.height,one=i<0,cw=one?W:W/cols,ch=one?H:H/rows,sx=one?0:(i%cols)*cw,sy=one?0:Math.floor(i/cols)*ch;
  let box=[sx,sy,cw,ch];try{const c=document.createElement('canvas');c.width=Math.ceil(cw);c.height=Math.ceil(ch);const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sx,sy,cw,ch,0,0,cw,ch);const d=g.getImageData(0,0,c.width,c.height).data;
   let x0=c.width,y0=c.height,x1=-1,y1=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
   if(x1>=x0)box=[sx+Math.max(0,x0-1),sy+Math.max(0,y0-1),Math.min(cw,x1-x0+3),Math.min(ch,y1-y0+3)];}catch(_){}walkBox.set(k,box);return box;}
 // 영웅 몸 그림만 고른다: 반자동이 공명 방어를 쓰면 영웅 위에 큰 방어막 그림(barrier-sigil)이 함께 그려져, '가장 큰 영웅 그림'을
 // 몸으로 잘못 골라 방어막을 걷기 그림으로 바꾸고 몸은 정지 그림으로 남던 버그(사용자 2026-10-29 "길잡이·반자동 켜면 이미지 버그")를 막는다.
 const BODY_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r128\/gunner\/|r130\/[a-z]+\/|awakening|^blob:/;
 const bodyMemo=new WeakMap();
 function bodyFracOf(im,rect){if(!im||!rect)return null;let m=bodyMemo.get(im);if(!m){m=new Map();bodyMemo.set(im,m);}const k=rect.map(Math.round).join(',');if(m.has(k))return m.get(k);let f=null;
  try{const [sx,sy,sw,sh]=rect,s=Math.min(1,160/Math.max(sw,sh)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(sw*s));c.height=Math.max(1,Math.round(sh*s));const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);
   const d=g.getImageData(0,0,c.width,c.height).data;let y0=c.height,y1=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>24){if(y<y0)y0=y;if(y>y1)y1=y;}if(y1>=y0)f=(y1-y0+1)/c.height;}catch(_){}m.set(k,f);return f;}
 // 서 있을 때 실제 몸 키(그린 높이 x 몸 비율)를 actorHeight 비율로 기억해 걸을 때 같은 키로 그린다(사용자: 멈추면 커짐, 서 있는 크기가 자연스러움).
 const standRatio={v:null},tightMemo=new WeakMap();
 function tightBox(im,rect){let m=tightMemo.get(im);if(!m){m=new Map();tightMemo.set(im,m);}const k=rect.map(Math.round).join(',');if(m.has(k))return m.get(k);let box=rect.slice();
  try{const [sx,sy,sw,sh]=rect,c=document.createElement('canvas');c.width=Math.ceil(sw);c.height=Math.ceil(sh);const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);const d=g.getImageData(0,0,c.width,c.height).data;
   let x0=c.width,y0=c.height,x1=-1,y1=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
   if(x1>=x0)box=[sx+Math.max(0,x0-1),sy+Math.max(0,y0-1),Math.min(sw,x1-x0+3),Math.min(sh,y1-y0+3)];}catch(_){}m.set(k,box);return box;}
 // R140: Gemini 걷기 시트는 '몸 키 180px, 발 226'(SPEC)로 그렸는데, 라우렌 시트는 몸이 더 커서(약 205px) 걸을 때만 14% 크게 보였다(서 있기·동작 53.7px, 걷기 61.4px).
 //  시트마다 칸들의 머리 꼭대기 중앙값으로 발(226)~머리 키를 한 번 재서 그 키로 맞춘다(SPEC 180 근처면 그대로).
 const sheetMemo=new WeakMap();
 function sheetMeasure(im,cols,rows){let v=sheetMemo.get(im);if(v)return v;v={body:180,foot:226};try{const W=im.naturalWidth||im.width,H=im.naturalHeight||im.height;rows=Math.max(1,Math.round(H/256));cols=Math.max(1,Math.round(W/192));const cw=W/cols,ch=H/rows,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const d=g.getImageData(0,0,W,H).data,hs=[],fs=[];
   for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){const x0=Math.round(k*cw+96-50),x1=Math.round(k*cw+96+50),y0=Math.round(r*ch),yh=Math.round(ch);let top=-1,bot=-1;for(let y=y0;y<y0+yh&&top<0;y++)for(let x=x0;x<x1;x+=2)if(d[(y*W+x)*4+3]>24){top=y-y0;break;}for(let y=y0+yh-1;y>=y0&&bot<0;y--)for(let x=x0;x<x1;x+=2)if(d[(y*W+x)*4+3]>24){bot=y-y0;break;}if(top>=0&&bot>top){hs.push(226-top);fs.push(bot);}}
   hs.sort((a,b)=>a-b);fs.sort((a,b)=>a-b);const m=hs[hs.length>>1],f=fs[fs.length>>1];if(m>=150&&m<=240)v.body=m;stats.sheetBody=v.body;/* 발은 SPEC 226 그대로 — 맨 아래 알파는 늘어진 칼끝·옷자락일 수 있다(슬레이어 옆 걷기) */}catch(_){}sheetMemo.set(im,v);return v;}
 const sheetBody=(im,cols,rows)=>sheetMeasure(im,cols,rows).body;
 if(typeof drawHero==='function'){const heroDraw=drawHero;drawHero=function(...a){preloadHeroArt();const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=heroDraw.apply(this,a);
  // R136: 맞은 뒤 '피격 보호' 동안 몸 전체가 84% 불투명으로 그려져, 전투 중 거의 내내 영웅이 반투명해 보였다(사용자 '투명화'). 몸은 불투명하게.
  try{if(st>=0&&player&&player.invincible>0){for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind==='image'&&c.owner?.kind==='hero'&&BODY_ART.test(String(c.sourcePath||c.image?.src||''))&&c.style&&c.style.globalAlpha<1&&c.style.globalAlpha>=.8){c.style.globalAlpha=1;stats.opaqueHit=(stats.opaqueHit||0)+1;}}}}catch(_){}
  try{if(!prefs.walkCycle||st<0||!player)return r;const co=window.__STORYWORLD_COOP_SIM_R62__;if(co?.mode&&co.mode()!=='off')return r;/* 협동에서는 한 번에 여러 영웅을 그려 다른 영웅 그림을 바꿀 수 있어 건너뜀(Codex 리뷰) */let mv=0;if(walkState.x!=null){const dx=player.x-walkState.x,dy=player.y-walkState.y,d=Math.hypot(dx,dy);
     if(d>1e-4&&d<1.2){walkState.d+=d;mv=d;if(d>.004)walkState.movedAt=typeof time==='number'?time:0;if(typeof project==='function'){const q0=project(walkState.x,walkState.y),q1=project(player.x,player.y),sx=(walkState.sx||0)*.7+(q1.x-q0.x)*.3,sy=(walkState.sy||0)*.7+(q1.y-q0.y)*.3;walkState.sx=sx;walkState.sy=sy;let cand=DIR8[((Math.round(Math.atan2(sy,sx)/(Math.PI/4))%8)+8)%8];
      // R131: 움직이는 입력 방향(moveVX150)이 있으면 그것을 쓴다 — 위치 변화로 짐작하면 몇 장면 늦게 바뀌어 위로 가는데 옆 걷기가 보였다. 2장면 이어지면 바꾼다.
      const mvx=+player.moveVX150||0,mvy=+player.moveVY150||0;let fast=false;if(Math.hypot(mvx,mvy)>.05){const a0=project(player.x,player.y),b0=project(player.x+mvx,player.y+mvy);cand=DIR8[((Math.round(Math.atan2(b0.y-a0.y,b0.x-a0.x)/(Math.PI/4))%8)+8)%8];fast=true;}
      // 길잡이 경로와 직접 조작이 겹치면 한 장면씩 방향이 튀어 그림이 좌우로 뒤집혔다(사용자): 화면 이동을 부드럽게 모으고, 새 방향이 3장면 이어질 때만 바꾼다.
      if(cand===walkState.dir)walkState.pend=0;else if(cand===walkState.pendDir){if(++walkState.pend>=(fast?2:3)){walkState.dir=cand;walkState.pend=0;}}else{walkState.pendDir=cand;walkState.pend=1;}}}}
   walkState.x=player.x;walkState.y=player.y;
   const busy=player.attackAnim>0||player.skillAnim>0||player.hurtAnim>0||player.dashAnim>0||player.ultimateAnim>0||player.guard;
   // 이동 중 기본 사격·방어(반자동은 걸으면서 계속 쏜다)에는 걷기를 이어 간다 — 걷기 그림도 총을 앞으로 든 자세라 정지 그림이 미끄러지던 것보다 자연스럽다.
   const busyMove=player.skillAnim>0||player.hurtAnim>0||player.dashAnim>0||player.ultimateAnim>0;
   preloadWalk();
   // 반자동 비켜서기·물러나기·길잡이처럼 '이동 중' 표시 없이 위치만 옮기는 경우도 걷기로 본다(사용자: 반자동 켜고 움직이면 동작 없이 이동).
   // R134: '이동 중' 표시만 켜지고 실제로는 막혀 제자리인 경우(적·벽에 막힘)에도 걷기 그림이 한 장면씩 끼어 공격 자세와 번갈아 깜빡였다(제자리 걸음).
   //  실제로 움직였을 때만 걷기로 본다(반자동 비켜서기처럼 표시 없이 움직인 경우는 그대로 걷기).
   const movingNow=((typeof time==='number'?time:0)-(walkState.movedAt??-9)<.15);
   if(!movingNow){if(!busy&&typeof actorHeight==='function'){let sb=null,sbh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||'')))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>sbh){sbh=h;sb=c;}}
     // 멈춘 직후에도 R91 걷기 칸(여백 포함 칸 전체)이 한두 장면 그려져 몸이 갑자기 커졌다(사용자: 네온 이동 후 멈춤이 이상) — 몸 테두리로 잘라 서 있기 키로 그린다.
     if(sb&&/r91\/walk\//.test(String(sb.sourcePath||''))&&!sb.r121Walk&&sb.sourceRect){const im=sb.image,b=tightBox(im,sb.sourceRect),P=sb.points,fx=(P[2][0]+P[3][0])/2,fy=Math.max(P[2][1],P[3][1]),f=P[1][0]<P[0][0]?-1:1,want=actorHeight()*(standRatio.v||.98),w=want*b[2]/b[3];
      Object.assign(sb,{sourceRect:b,points:[[fx-f*w/2,fy-want],[fx+f*w/2,fy-want],[fx+f*w/2,fy],[fx-f*w/2,fy]],r121Walk:true});stats.walkStops=(stats.walkStops||0)+1;return r;}
     // R140: 같은 서 있기 그림을 같은 자리에 두 번 그리던 것(환도 R93) — 한 장만 남긴다(겹쳐 그리면 반투명 테두리가 진해진다).
     if(sb)for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==sb&&c.kind==='image'&&c.owner?.kind==='hero'&&c.image===sb.image&&String(c.sourceRect)===String(sb.sourceRect)&&String(c.points)===String(sb.points)){rec.commands.splice(i,1);stats.dupBodies=(stats.dupBodies||0)+1;}}
     const fr=sb&&bodyFracOf(sb.image,sb.sourceRect);if(fr&&sbh>6){const v=sbh*fr/actorHeight();if(v>.6&&v<1.6){standRatio.v=standRatio.v==null?v:standRatio.v*.9+v*.1;stats.standRatio=Math.round(standRatio.v*1000)/1000;}}}return r;}
   if(busyMove)return r;
   const sh=sheetFor(player.hero,walkState.dir);if(!sh)return r;let row=typeof readyImage==='function'?readyImage(sh.path):null;
   // R131: 게임 캐시에 아직 없으면 미리 받아 둔 그림을 바로 쓴다(환도: 첫 몇 장면 옛 R91 걷기 그림이 보였다).
   if(!row){wantImage(sh.path);const pe=art.get(sh.path);if(pe?.state!=='ready')return r;row={image:pe.img};}
   let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||'')))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
   // R148: 걸음 박자 — Gemini 시트(8칸 한 줄)를 1칸당 6.4장(이동 6.47칸/초에 41장/초 = 초당 10걸음)으로 넘겨 다리가 종종거리고,
   //  화면이 초당 20장 안팎이면 한 번에 2칸씩 건너뛰어 8칸 중 홀수(또는 짝수) 4칸만 보여 뚝뚝 끊긴 '어기적' 걸음이 됐다(사용자 2026-10-30).
   //  1칸당 3.2장(초당 약 2.6바퀴·5걸음, 21장/초)으로 늦춰 30장/초 화면에서도 칸을 건너뛰지 않게 한다.
   if(!best)return r;const frame=sh.single?-1:Math.floor(walkState.d*(sh.frames===4?3.2:sh.frames===6?4.8:sh.frames===12?9.6:sh.r128?WALK_RATE_R148:sh.own8?6.4:5))%(sh.frames||8),box=cellBox(row,sh.path,frame,sh.cols||4,sh.rows||2),im=row.image,want=(typeof actorHeight==='function'?actorHeight():bh)*(standRatio.v||.98),w=want*box[2]/box[3];
   // 걸음 무게감: 발을 디딘 직후 살짝 내려앉고(-1.5%), 다리가 엇갈릴 때 올라간다(+2.5%). 8프레임: 2·6번째가 가장 낮고 3·7번째가 가장 높다.
   const n=sh.frames||8,ph=(n===6?[.2,-1,1,.2,-1,1][frame]:n===12?[0,-1,-.4,1,.4,0,-1,-.4,1,.4,0,0][frame]:n===8?[.6,1,.3,-1,.6,1,.3,-1][frame]:[0,1,0,1][frame])??0,bob=sh.r128?0:(ph>0?.025*ph:.015*ph)*want;/* R148: Gemini 시트는 칸마다 머리가 4~5px 오르내리게 이미 그려져 있다 — 옛 R91 시트용 출렁임을 반대 박자로 더해 몸이 들쭉날쭉 튀었다 */
   // R134: 발은 실제 영웅 위치(띄움 포함)에 맞춘다 — 바탕 그림 상자의 밑변을 발로 보면, 멈춘 직후 바탕이 서 있기 시트(칸 아래 여백)일 때
   //  걷기 그림이 7~8px 아래로 툭 떨어졌다가(슬레이어는 좌우로도 6px) 서 있기로 바뀌었다.
   const P=best.points,q0=typeof project==='function'?project(player.x,player.y):null,lift=Math.min(Math.max(+player.visualLiftPx||0,0),want*.65),fx=q0?q0.x:(P[2][0]+P[3][0])/2,fy=(q0?q0.y-lift:Math.max(P[2][1],P[3][1]))-bob,f=sh.mirror?-1:1;
   // R134: Gemini 시트(칸 192x256, 모든 칸 발 가운데 96,226, 몸 키 180 — SPEC)는 칸마다 테두리 가운데·테두리 키로 맞추면 무기·코트가 흔들릴 때
   //  몸이 좌우로 미끄러지고(기억사수·슬레이어 테두리 가운데가 20px 넘게 움직임) 무기를 든 칸에서 몸이 작아졌다 — 칸의 발 기준점·고정 배율로 그린다.
   let pts=[[fx-f*w/2,fy-want],[fx+f*w/2,fy-want],[fx+f*w/2,fy],[fx-f*w/2,fy]];
   if(sh.r128&&frame>=0){const cw=(im.naturalWidth||im.width)/(sh.cols||8),ax=(frame%(sh.cols||8))*cw+96,ay=226,k=want/sheetBody(im,sh.cols||8,sh.rows||2),X=v=>fx+f*(v-ax)*k,Y=v=>fy+(v-ay)*k;
    pts=[[X(box[0]),Y(box[1])],[X(box[0]+box[2]),Y(box[1])],[X(box[0]+box[2]),Y(box[1]+box[3])],[X(box[0]),Y(box[1]+box[3])]];stats.walkAnchor=(stats.walkAnchor||0)+1;}
   Object.assign(best,{image:im,sourcePath:im.src||sh.path,immutableTint:null,sourceRect:box.slice(),imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],
    points:pts,r121Walk:true});stats.walk=(stats.walk||0)+1;stats.walkDir=walkState.dir;
   // R140: 몸을 두 번 그리는 영웅(환도: 몸 + 겹친 사본)은 R91 걷기·R93 서 있기가 두 장을 모두 바꿔, 여기서 큰 한 장만 새 걷기로 바꾸면
   //  나머지 한 장(옛 R91 걷기·공격 아틀라스 조각)이 함께 보였다(사용자 '두 개 동시에'). 걷기로 바꾼 뒤 같은 그리기의 다른 몸 그림은 지운다.
   for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&BODY_ART.test(String(c.sourcePath||c.image?.src||''))){rec.commands.splice(i,1);stats.extraBodies=(stats.extraBodies||0)+1;}}}catch(e){lastError=String(e?.message||e);}
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
 function set(p={}){if(typeof p.gunnerSheet==='boolean')prefs.gunnerSheet=p.gunnerSheet;if(typeof p.gunnerHit==='boolean')prefs.gunnerHit=p.gunnerHit;if(typeof p.walkCycle==='boolean')prefs.walkCycle=p.walkCycle;if(typeof p.earlyGrace==='boolean')prefs.earlyGrace=p.earlyGrace;if(typeof p.heroBlood==='boolean')prefs.heroBlood=p.heroBlood;if(typeof p.heroFit==='boolean')prefs.heroFit=p.heroFit;if(typeof p.angelArt==='boolean')prefs.angelArt=p.angelArt;if(typeof p.heroArt==='boolean')prefs.heroArt=p.heroArt;if(typeof p.seeThrough==='boolean')prefs.seeThrough=p.seeThrough;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 window.__STORYWORLD_VISUAL_R119__=Object.freeze({revision:'R119-visual-1',nativeMin:NATIVE_MIN,min:MIN,remap,prefs:()=>({...prefs}),set,swap:SWAP,swap128,ownWalk,sheetFor,inspect:()=>({prefs:{...prefs},stats:{...stats},swapState:Object.fromEntries(swapState),fitState:Object.fromEntries(fitState),lastError,collisionChanged:false})});
})();
