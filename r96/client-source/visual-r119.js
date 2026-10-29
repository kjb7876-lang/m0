/* R119 시각 다듬기 (사용자 2026-10-29 "시각적 개선 중점으로 플레이")
 * 1) 영웅·몹을 가리는 벽을 더 투명하게: 렌더러(R54/R73)는 배우를 가리는 벽을 42%까지만 흐리게 해서, 짙은 산울타리·돌벽
 *    뒤에서 싸우면 영웅과 보스가 거의 보이지 않았다(dist00 뿌리의 문지기 전투에서 확인). 흐림 계산이 끝난 뒤, 실제로
 *    그리기 전에(updateGlows 직전) 흐려진 벽의 불투명도를 다시 매겨 가장 흐린 값을 22%로 낮춘다. 흐림 여부·속도는 그대로.
 * 판정·충돌·배치는 건드리지 않는다(재질의 불투명도만). 설정 키 r119.visual. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 const C=window.StoryPhase1?.ThreeRenderer?.prototype;
 if(window.__STORYWORLD_VISUAL_R119__||!C||typeof C.updateGlows!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r119.visual';
 const prefs={seeThrough:true,heroArt:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of ['seeThrough','heroArt'])if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
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
 const SWAP=Object.freeze({'assets/hero_direction337/gunner/n.webp':'assets/r119/heroes/gunner-n.webp'});
 //    원래 그림이 캐시에 정상으로 올라온 뒤에 새 그림을 따로 받아, 다 받아지면 같은 캐시 칸의 그림만 바꾼다(실패하면 원래 그림 유지).
 const swapState=new Map();
 if(typeof readyImage==='function'&&typeof imageCache!=='undefined'){const readyBase=readyImage;readyImage=function(path,...rest){const row=readyBase.apply(this,arguments);
  try{if(prefs.heroArt&&row?.image){const k=typeof cleanPath==='function'?cleanPath(path):String(path).replace(/^\.\//,''),to=SWAP[k];
    if(to&&!swapState.has(k)){swapState.set(k,'loading');const im=new Image();im.decoding='async';im.onload=()=>{const r=imageCache.get(k);if(r&&prefs.heroArt){r.r119Original=r.image;r.image=im;swapState.set(k,'swapped');stats.swaps=(stats.swaps||0)+1;}};im.onerror=()=>swapState.set(k,'failed');im.src=typeof urlFor==='function'?urlFor(to):to;}}}catch(_){}
  return row;};}
 function set(p={}){if(typeof p.heroArt==='boolean')prefs.heroArt=p.heroArt;if(typeof p.seeThrough==='boolean')prefs.seeThrough=p.seeThrough;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 window.__STORYWORLD_VISUAL_R119__=Object.freeze({revision:'R119-visual-1',nativeMin:NATIVE_MIN,min:MIN,remap,prefs:()=>({...prefs}),set,swap:SWAP,inspect:()=>({prefs:{...prefs},stats:{...stats},swapState:Object.fromEntries(swapState),lastError,collisionChanged:false})});
})();
