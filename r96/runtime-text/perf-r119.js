/* R119 렉 줄이기 · 이펙트 묶기 (사용자 2026-10-29 "시각적 개선 및 렉 개선 중점으로 플레이 개선")
 * 측정(노멀·길잡이·전투 위주 진행, dist00~dist02): 평소 55~70fps, 무리 전투 순간 이펙트가 160개 가까이 쌓이며 22~24fps.
 * R118 기본 광역 때문에 한 번 휘두르면 맞은 몹마다 명중 폭발·접촉 표시·데미지 숫자·흡혈 회복 문양이 하나씩 생겨
 * 같은 그림이 같은 자리에 수십 장 겹쳤다(burst 30 + text 36 + 회복 문양 30 + 영웅 명중 13 ...).
 * 여기서는 fx() 생성만 거른다: 같은 종류가 가까운 자리(0.55칸)에서 0.09초 안에 또 생기면 버리고, 종류마다 동시에 살아 있는
 * 수를 제한하고, 회복 문양은 0.35초에 하나, 데미지 숫자는 같은 자리의 것을 하나로 합친다(숫자는 더해서 보여 줌).
 * 판정·피해·회복 수치·상태이상은 건드리지 않는다(그림만). 설정 키 r119.perf. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_PERF_R119__||typeof fx!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r119.perf';
 const prefs={mergeFx:true,cull:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of ['mergeFx','cull'])if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
 const stats={culled:0,seen:0,kept:0,dropNear:0,dropCap:0,dropHeal:0,mergedText:0};
 // 종류별 동시 개수 상한(가벼운 표시 기준). 없는 종류는 상한 없음.
 const CAP={burst:10,bloodR52:6,regionalContactR58:5,contactR61:5,e568HeroImpact:8,pxfSprite:14,text:14,sigil:6};
 const NEAR=.55,WINDOW=.09,HEAL_GAP=.35;
 const recent=new Map();// type -> [{x,y,t}]
 let healAt=-9;
 const T=()=>typeof time==='number'?time:0;
 const healAsset=()=>typeof VFX!=='undefined'?VFX.heal:null;
 function count(type){let n=0;for(const e of effects)if(e&&e.type===type&&e.age<e.life)n++;return n;}
 function nearRecent(type,x,y,t){const list=recent.get(type);if(!list)return false;for(let i=list.length-1;i>=0;i--){const r=list[i];if(t-r.t>WINDOW){list.splice(0,i+1);break;}if(Math.abs(r.x-x)<NEAR&&Math.abs(r.y-y)<NEAR)return true;}return false;}
 function note(type,x,y,t){let list=recent.get(type);if(!list){list=[];recent.set(type,list);}list.push({x,y,t});if(list.length>40)list.shift();}
 function mergeText(x,y,opt){const v=Number(String(opt?.text??'').replace(/[^0-9.-]/g,''));if(!Number.isFinite(v)||!/^\s*-?\d/.test(String(opt?.text??'')))return false;
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];if(!e||e.type!=='text'||e.age>.25||e.color!==opt.color)continue;if(Math.abs(e.x-x)>NEAR*1.6||Math.abs(e.y-y)>NEAR*1.6)continue;
   const w=Number(String(e.text).replace(/[^0-9.-]/g,''));if(!Number.isFinite(w)||!/^\s*-?\d/.test(String(e.text)))continue;e.text=String(Math.round(w+v));e.age=Math.min(e.age,.05);e.r119Merged=(e.r119Merged||1)+1;return true;}return false;}
 const base=fx;
 fx=function(type,x,y,opt={}){stats.seen++;
  if(prefs.mergeFx&&typeof type==='string'&&Number.isFinite(x)&&Number.isFinite(y)){try{const t=T();
   if(type==='sigil'&&opt?.asset&&opt.asset===healAsset()){if(t-healAt<HEAL_GAP){stats.dropHeal++;return;}healAt=t;}
   else if(type==='text'){if(mergeText(x,y,opt)){stats.mergedText++;return;}if(count('text')>=CAP.text){stats.dropCap++;return;}}
   else if(CAP[type]!=null){if(nearRecent(type,x,y,t)){stats.dropNear++;return;}if(count(type)>=CAP[type]){stats.dropCap++;return;}note(type,x,y,t);}
  }catch(_){}}
  stats.kept++;return base.apply(this,arguments);};
 // 화면 밖 몹은 그리지 않는다: dist01에서 39마리 중 평균 30.6마리가 화면 밖인데 매 프레임 그림 명령을 만들었다.
 // 몸 높이의 2배만큼 여유를 두고(큰 그림·그림자·이름표가 가장자리에서 잘리지 않게), 공격·환영 준비 중이거나 보스급이면 늘 그린다.
 const major=e=>!!(e?.boss||e?.midboss||e?.persona||e?.cosmic||e?.trial);
 // 실제 화면 프레임(draw) 안에서만 생략한다: 다른 코드·검사가 drawEnemy를 직접 부르면 늘 그린다.
 let inFrame=false;if(typeof draw==='function'){const frameBase=draw;draw=function(...a){inFrame=true;try{return frameBase.apply(this,a);}finally{inFrame=false;}};}
 if(typeof drawEnemy==='function'&&typeof project==='function'){const drawBase=drawEnemy;
  drawEnemy=function(e,...rest){if(prefs.cull&&inFrame&&e&&!major(e)&&!e.attack&&!e.r61Action&&!(e.rangedWindup>0)&&e.hp>0){try{const q=project(e.x,e.y),h=(typeof actorHeight==='function'?actorHeight():60)*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1),m=h*2+40,w=typeof W==='number'?W:innerWidth,hh=typeof H==='number'?H:innerHeight;
    if(q.x<-m||q.x>w+m||q.y<-m*.6||q.y>hh+m*1.6){stats.culled++;return;}}catch(_){}}
   return drawBase.call(this,e,...rest);};}
 function set(p={}){if(typeof p.cull==='boolean')prefs.cull=p.cull;if(typeof p.mergeFx==='boolean')prefs.mergeFx=p.mergeFx;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 window.__STORYWORLD_PERF_R119__=Object.freeze({revision:'R119-perf-1',caps:{...CAP},near:NEAR,window:WINDOW,healGap:HEAL_GAP,prefs:()=>({...prefs}),set,
  inspect:()=>({prefs:{...prefs},stats:{...stats},alive:effects.length,gameplayChanged:false})});
})();
