/* R119 시각 다듬기 (사용자 2026-10-29 "시각적 개선 중점으로 플레이")
 * 1) 영웅·몹을 가리는 벽을 더 투명하게: 렌더러(R54/R73)는 배우를 가리는 벽을 42%까지만 흐리게 해서, 짙은 산울타리·돌벽
 *    뒤에서 싸우면 영웅과 보스가 거의 보이지 않았다(dist00 뿌리의 문지기 전투에서 확인). 흐림 계산이 끝난 뒤, 실제로
 *    그리기 전에(updateGlows 직전) 흐려진 벽의 불투명도를 다시 매겨 가장 흐린 값을 22%로 낮춘다. 흐림 여부·속도는 그대로.
 * 판정·충돌·배치는 건드리지 않는다(재질의 불투명도만). 설정 키 r119.visual. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 const C=window.StoryPhase1?.ThreeRenderer?.prototype;
 if(window.__STORYWORLD_VISUAL_R119__||!C||typeof C.updateGlows!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r119.visual';
 const prefs={seeThrough:true,heroArt:true,angelArt:true,heroFit:true,heroBlood:true,earlyGrace:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of ['seeThrough','heroArt','angelArt','heroFit','heroBlood','earlyGrace'])if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
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
    if(to&&!swapState.has(k)){swapState.set(k,'loading');const im=new Image();im.decoding='async';im.onload=()=>{const r=imageCache.get(k);if(r&&prefs.heroArt){r.r119Original=r.image;r.image=im;swapState.set(k,'swapped');stats.swaps=(stats.swaps||0)+1;fitState.delete(k);fitHero(k,r);}};im.onerror=()=>swapState.set(k,'failed');im.src=typeof urlFor==='function'?urlFor(to):to;}}}catch(_){}
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
 // 4) 영웅 키 맞추기 (사용자 2026-10-29 "기억사수 크기 이상"): 영웅 그림은 여러 세대가 섞여 512 칸 안의 실제 키가
 //    위·아래 서기 94%, 옆·대각선 70~85%, 달리기 61%로 달라서 멈추거나 방향을 틀 때마다 몸이 커졌다 작아졌다.
 //    그림이 캐시에 올라오면 발밑 줄은 그대로 두고 보이는 키가 FIT(74%)이 되게 같은 크기 칸에 다시 그려 넣는다.
 //    구르기·대시·웅크리기(원래 낮은 자세)와 무기·이펙트 그림은 건드리지 않는다. 설정 heroFit.
 const FIT=.74,FIT_RE=/^assets\/(?:hero_direction33\d\/[a-z]+\/[a-z]+|heroes\/normalized\/[a-z]+\/(?!.*(?:roll|dash|crouch))[a-z_0-9]+|heroes\/normalized\/actions-v3126\/[a-z]+-(?:hurt|move)-[a-z]+|r119\/heroes\/[a-z]+-n)\.webp$/,fitState=new Map();
 function fitHero(k,row){const im=row.image;if(fitState.has(k)||!im||!(im.naturalWidth||im.width))return;fitState.set(k,'measuring');
  try{const W=im.naturalWidth||im.width,H=im.naturalHeight||im.height,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
   const d=g.getImageData(0,0,W,H).data;let top=H,foot=-1,x0=W,x1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>16){if(y<top)top=y;if(y>foot)foot=y;if(x<x0)x0=x;if(x>x1)x1=x;}
   if(foot<0){fitState.set(k,'empty');return;}const s=FIT*H/(foot-top+1);if(Math.abs(s-1)<.04){fitState.set(k,'kept');return;}
   const cx=(x0+x1)/2,o=document.createElement('canvas');o.width=W;o.height=H;const q=o.getContext('2d');q.imageSmoothingQuality='high';q.translate(cx,foot);q.scale(s,s);q.drawImage(im,-cx,-foot);
   o.toBlob(b=>{if(!b)return;const n=new Image();n.decoding='async';n.onload=()=>{const r=imageCache.get(k);if(r&&prefs.heroFit&&r.image===im){r.r119Unfit=im;r.image=n;fitState.set(k,'fit '+s.toFixed(2));stats.fits=(stats.fits||0)+1;}};n.src=URL.createObjectURL(b);});
  }catch(e){fitState.set(k,'error');lastError=String(e?.message||e);}}
 if(typeof readyImage==='function'&&typeof imageCache!=='undefined'){const readyFit=readyImage;readyImage=function(path){const row=readyFit.apply(this,arguments);
  try{if(prefs.heroFit&&row?.image){const k=typeof cleanPath==='function'?cleanPath(path):String(path).replace(/^\.\//,'');if(FIT_RE.test(k)){const im=row.image;
    if(im.complete&&im.naturalWidth)fitHero(k,row);else if(!fitState.has(k))im.addEventListener?.('load',()=>fitHero(k,imageCache.get(k)||row),{once:true});}}}catch(_){}
  return row;};}
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
 const graceOf=()=>{try{const C=window.__STORYWORLD_CAMPAIGN_R63R1__,m=typeof C?.mode==='function'?C.mode():C?.mode;if(m!=='normal')return 1;
  const lv=Number(player?.level)||1;return Math.min(1,.65+.07*Math.max(0,lv-1));}catch(_){return 1;}};
 if(typeof hurt==='function'){const hurtGrace=hurt;hurt=function(damage,...rest){let d=damage;try{if(prefs.earlyGrace&&Number.isFinite(d)&&d>0){const g=graceOf();if(g<1){d=d*g;stats.graced=(stats.graced||0)+1;}}}catch(_){}return hurtGrace.call(this,d,...rest);};}
 // 6) Esc로 메뉴·설정 창 닫기 (사용자 2026-10-29): 열린 창(openPanel)의 '계속/닫기'(.close) 단추를 대신 누른다.
 //    입력칸에 글을 쓰는 중이거나 열린 창이 없으면 원래 Esc 동작 그대로.
 if(typeof addEventListener==='function')addEventListener('keydown',ev=>{try{if(ev.key!=='Escape'||ev.repeat)return;const t=ev.target;if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable))return;
  const btn=[...document.querySelectorAll('button.close')].reverse().find(b=>b.offsetParent!==null&&!b.disabled);if(!btn)return;
  ev.preventDefault();ev.stopImmediatePropagation();btn.click();stats.escCloses=(stats.escCloses||0)+1;}catch(_){}},true);
 function set(p={}){if(typeof p.earlyGrace==='boolean')prefs.earlyGrace=p.earlyGrace;if(typeof p.heroBlood==='boolean')prefs.heroBlood=p.heroBlood;if(typeof p.heroFit==='boolean')prefs.heroFit=p.heroFit;if(typeof p.angelArt==='boolean')prefs.angelArt=p.angelArt;if(typeof p.heroArt==='boolean')prefs.heroArt=p.heroArt;if(typeof p.seeThrough==='boolean')prefs.seeThrough=p.seeThrough;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 window.__STORYWORLD_VISUAL_R119__=Object.freeze({revision:'R119-visual-1',nativeMin:NATIVE_MIN,min:MIN,remap,prefs:()=>({...prefs}),set,swap:SWAP,inspect:()=>({prefs:{...prefs},stats:{...stats},swapState:Object.fromEntries(swapState),fitState:Object.fromEntries(fitState),fit:FIT,lastError,collisionChanged:false})});
})();
