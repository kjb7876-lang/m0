#!/usr/bin/env python3
"""Wait for the native owned delay queue, without changing hit assertions/runtime."""
from pathlib import Path
p=Path('qa-r65/candidate-regression.mjs')
s=p.read_text()
needle='await new Promise(resolve=>setTimeout(resolve,3500));window.hitEnemy=base;'
replacement=r'''const queueR69=()=>delayed.filter(job=>job.owner==='qa-thread-motif-owner');
  const observeR69=()=>({wall:performance.now(),simulation:time,subHits:captured.filter(v=>Number.isInteger(v.subHit)).length,pending:queueR69().map(v=>({at:v.at,remaining:v.at-time})),player:{x:p.x,y:p.y,hp:p.hp},targets:targets.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,distance:distance(p,e)}))});
  const scheduledR69=observeR69();
  await new Promise(resolve=>setTimeout(resolve,3500));
  const wallDeadlineR69=observeR69(),maximumWaitR69=performance.now()+60000;
  while(queueR69().length){
    if(performance.now()>maximumWaitR69)throw Error('Native motif queue did not settle: '+JSON.stringify({scheduled:scheduledR69,at3500ms:wallDeadlineR69,current:observeR69()}));
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  const settledR69=observeR69();
  console.log('R69_NATIVE_MOTIF_QUEUE',JSON.stringify({scheduled:scheduledR69,at3500ms:wallDeadlineR69,settled:settledR69}));
  if(settledR69.simulation<scheduledR69.simulation)throw Error('Simulation clock reset during motif test');
  window.hitEnemy=base;'''
if s.count(needle)!=1:raise RuntimeError('Unexpected native-regression wait source')
new=s.replace(needle,replacement,1)
assertions=["assert.equal(motifRuntime.subHits,18", "assert.equal(motifRuntime.fractalHits,1", "assert.equal(motifRuntime.groupCount,6", "Math.abs(motifRuntime.ichidanRatio-1.35)<1e-8"]
for a in assertions:
    if s.count(a)!=1 or new.count(a)!=1:raise RuntimeError('Original assertion missing: '+a)
p.write_text(new)
print('R69_REGRESSION_WAIT: original 3500ms observation retained; native owned queue drains under a 60s bound; all exact hit/damage assertions unchanged; production files untouched')
