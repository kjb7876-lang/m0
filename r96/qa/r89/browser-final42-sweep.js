/* R89 QA (browser): play each FINAL42 effect once in the running game as a
 * presentation FIXTURE (api.play at the hero; no damage, no native event) and
 * measure that it actually reaches the WebGL canvas. For every effect the same
 * crop is captured just before and ~40% into its main clip; the per-pixel
 * difference must be non-trivial. A 7x6 contact sheet is posted as evidence.
 * Requires browser-helpers.js. This is NOT a natural-combat verification. */
(()=>{'use strict';
 const Q=window.__R89QA__,api=window.__STORYWORLD_FINAL42_R88__,DATA=window.__STORYWORLD_FINAL42_DATA_R88__;
 function crop(cx,cy,w,h){const gl=document.getElementById('phase1-webgl');window.__STORYWORLD_PHASE1__.controller.draw();const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(gl,cx-w/2,cy-h/2,w,h,0,0,w,h);return c;}
 // Deterministic clock: native tick(1/60) + one Three draw per step, so the sweep
 // also works while the browser pane is hidden (rAF paused).
 // The native tick() is skipped while document.hidden, so the fixture advances the
 // presentation clock itself (no combat simulation is needed for api.play fixtures).
 function step(seconds){const n=Math.max(1,Math.round(seconds*60));for(let i=0;i<n;i++){time+=1/60;api.tick(1/60,{now:time});window.__STORYWORLD_PHASE1__.controller.draw();}}
 async function ready(id){for(let i=0;i<4;i++){if(await api.ensure(id))return true;await Q.sleep(250);}return false;}
 function diff(a,b){const A=a.getContext('2d').getImageData(0,0,a.width,a.height).data,B=b.getContext('2d').getImageData(0,0,b.width,b.height).data;let n=0,sum=0;for(let i=0;i<A.length;i+=4){const d=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);if(d>24)n++;sum+=d;}return{changedPixels:n,meanDelta:+(sum/(A.length/4)).toFixed(2)};}
 async function sweep(tag='dark',{cols=7,cell=180}={}){
  const keys=Object.keys(DATA.effects).sort(),rows=[],k=document.getElementById('phase1-webgl').width/Math.max(1,W);
  const sheet=document.createElement('canvas');sheet.width=cols*cell;sheet.height=Math.ceil(keys.length/cols)*(cell+16);const g=sheet.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,sheet.width,sheet.height);g.font='12px sans-serif';
  for(let i=0;i<keys.length;i++){const id=keys[i],spec=DATA.effects[id];
   const ok=await ready(id);const p=project(player.x,player.y),cx=p.x*k,cy=(p.y-actorHeight()*.4)*k,w=360,h=320;
   step(.1);const before=crop(cx,cy,w,h);
   const main=spec.clips?.emerge?'emerge':spec.clips?.main?'main':Object.keys(spec.clips||{})[0];const dur=spec.clips?.[main]?.duration||spec.duration||.6;
   const handle=api.play(id,{x:player.x,y:player.y,scale:1.2,height:actorHeight(),anchor:'feet',layer:'overlay',sourceKey:'r89-sweep:'+tag+':'+id+':'+Date.now()});
   step(Math.max(.06,dur*.4));const after=crop(cx,cy,w,h);const d=diff(before,after);
   rows.push({id,sourceIndex:spec.sourceIndex,ready:ok,played:!!handle,clip:main,clipSeconds:dur,...d,rendered:!!handle&&d.changedPixels>40});
   const x=(i%cols)*cell,y=Math.floor(i/cols)*(cell+16);g.drawImage(after,0,0,w,h,x,y,cell,cell*h/w);g.fillStyle=rows.at(-1).rendered?'#9fe0a0':'#f08080';g.fillText(id+(rows.at(-1).rendered?'':' ✗'),x+4,y+cell*h/w+12);
   if(handle)api.remove(handle);step(Math.max(.15,dur*.7));await Q.sleep(30);
  }
  await Q.post('final42-sweep-'+tag+'.png',sheet.toDataURL('image/png'));
  const summary={schema:'storyworld.r89.final42-sweep/v1',tag,at:new Date().toISOString(),zone,effects:rows.length,rendered:rows.filter(r=>r.rendered).length,notRendered:rows.filter(r=>!r.rendered).map(r=>r.id),method:'fixture api.play at hero; presentation clock advanced by the sweep (time+=1/60, FINAL42 api.tick, Three draw; no combat simulation); crop diff before vs ~40% of main clip; threshold 40 changed pixels (sum RGB delta > 24)',paneHidden:document.hidden||null,fixture:true,rows};
  await Q.post('final42-sweep-'+tag+'.json',JSON.stringify(summary,null,2));return{tag,effects:rows.length,rendered:summary.rendered,notRendered:summary.notRendered};
 }
 window.__R89SWEEP__=Object.freeze({sweep});
})();
