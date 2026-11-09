const f=process.argv[2];const o=require('./'+f);
for(const [z,rows] of Object.entries(o)){if(!Array.isArray(rows))continue;const by={};for(const r of rows)(by[r.id]??=[]).push(r);
 let walk=0,bad=0,atk=0,abad=0,face=0,flips=0,frames=0;const own={};
 for(const L of Object.values(by)){let prev=null;for(let i=0;i<L.length;i++){const r=L[i],d=r.dir;if(d!=='left'&&d!=='right')continue;frames++;if(prev&&prev!==d)flips++;prev=d;
  if(r.phase||r.atk){if(r.atk){atk++;if(r.atk!==d)abad++;}continue;}
  // 0.25초 창(앞뒤) 실제 이동
  let sx=0,sy=0;for(const q of L)if(Math.abs(q.t-r.t)<=.15&&!q.phase){sx+=q.sx;sy+=q.sy;}
  if(Math.abs(sx)>.06&&Math.abs(sx)>Math.abs(sy)*.8){if(r.f&&r.f.owner==='face'){face++;continue;}walk++;if((sx>0?'right':'left')!==d){bad++;const k=r.f?r.f.owner:'none';own[k]=(own[k]||0)+1;}}}}
 console.log(z,JSON.stringify({frames,walk,walkBad:bad,pct:(100*bad/Math.max(1,walk)).toFixed(1),strafeFace:face,atk,atkBad:abad,flipsPerFrame:(flips/Math.max(1,frames)).toFixed(3),badOwners:own}));}
