// 좌우 바뀜 집계: 바뀐 횟수, 게임초당, 0.5초 안에 되돌아온 '갈팡질팡'(A→B→A) 횟수
const d=require(require('path').resolve(process.argv[2]));
for(const [z,o] of Object.entries(d)){if(!o.rows){console.log(z,o.err);continue;}const R=o.rows.filter(r=>r.id===o.tgt&&r.flip!=null);if(!R.length){console.log(z,'no rows',o.err);continue;}
 let fl=[],prev=R[0].flip;for(const r of R){if(r.flip!==prev){fl.push(r);prev=r.flip;}}
 const dur=R[R.length-1].t-R[0].t;let back=0,quick=0;for(let i=1;i<fl.length;i++){const g=fl[i].t-fl[i-1].t;if(g<.5)back++;if(g<1.0)quick++;}
 const byOwn={};for(const f of fl)byOwn[f.own+'/'+(f.ph||'-')]=(byOwn[f.own+'/'+(f.ph||'-')]||0)+1;
 const sideFl=(()=>{let n=0,pv=R[0].side;for(const r of R){if(r.side!==pv){n++;pv=r.side;}}return n;})();
 const mism=R.filter(r=>r.side&&((r.side==='left')!==r.flip)).length;
 console.log(JSON.stringify({z,name:R[0].n,frames:R.length,dur:+dur.toFixed(1),flips:fl.length,perSec:+(fl.length/Math.max(dur,1e-3)).toFixed(2),back05:back,within1s:quick,r444flips:sideFl,flipNeR444:mism,byOwn,src:[...new Set(R.map(r=>r.src))].slice(0,4)}));}
