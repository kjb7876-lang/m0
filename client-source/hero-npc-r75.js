/* Reuse the exact native hero routes and authored foot pivots. A state bitmap
 * is not advertised as a multi-frame animation when its source has one frame. */
(()=>{'use strict';
 const names=Object.freeze({hwando:'환도',seoha:'윤서하',neon:'네온 성기사',michaela:'미카엘라',lauren:'라우렌',hunter:'악몽 사냥꾼 · 궁수',slayer:'악몽 사냥꾼 · 검사',gunner:'기억사수'}),owners=Object.freeze({'lance-owner':'neon','shaman-owner':'lauren'}),events=[];
 const note=row=>{events.push(row);if(events.length>48)events.shift();};
 function paths(id,states=['idle','move','attack']){return[...new Set(Object.values(portable.heroNativePresentation5.routes).filter(r=>r.hero===id&&states.includes(r.state)).flatMap(r=>[r.path,...(r.variants||[]).map(v=>v.path)]))];}
 function requireArt(r,id){if(!r||!names[id])return;for(const p of paths(id))if(!r.paths.includes(p))r.paths.push(p);}
 function pose(p,id){const state=time-(p.attackAt??-99)<.45?'attack':p.moving?'move':'idle',direction=['front','back','left','right'].includes(p.direction)?p.direction:'front',frame=window.__STORYWORLD_PHASE1_ART__?.heroFrame(id,state,direction);return{state,direction,frame};}
 function draw(p,id){if(!names[id])return false;const {state,direction,frame}=pose(p,id);if(!frame)return false;const q=project(p.x,p.y),paint=()=>drawAssetFrame3(frame.path,frame,q.x,q.y,actorHeight(),{alpha:1,flip:frame.nativeHero5?.flip===true}),meta={id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:frame.path,alive:true,hero:id,state,direction};return ctx.scope?ctx.scope(meta,paint):paint();}
 const compileBase=compileWorld;compileWorld=function(...a){const result=compileBase.apply(this,a);note({kind:'native-hero-source',files:162,routes:520,repository:'kjb7876-lang/hapil1',verifiedAt:'59598c41d747819590ca4b0c90cb0cd3b5f3c4b0'});return result;};
 window.__STORYWORLD_HERO_NPC_R75__=Object.freeze({names,owners,paths,requireArt,pose,draw,inspect:()=>({owners:{...owners},events:[...events],originalPixelsEdited:false,distinctAttackBAvailable:false})});
})();
