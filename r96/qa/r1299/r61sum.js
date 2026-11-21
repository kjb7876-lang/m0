const R=window.__R1299.rows;const by={};const FX=/lights|aura|petal|shadow|r251\/atlas|fx|effect/i;
for(const r of R){const im=r.img.filter(m=>!FX.test(m.src));const h=im.length?Math.max(...im.map(m=>m.dh)):0;const o=by[r.who]=by[r.who]||{n:0,empty:0,h:[],flips:0,alpha:[],src:{}};o.n++;if(!h)o.empty++;else{o.h.push(h);const m=im.find(m=>m.dh===h);if(m.flip)o.flips++;o.alpha.push(m.alpha);o.src[m.src]=(o.src[m.src]||0)+1;}}
const q=(a,p)=>{a=[...a].sort((x,y)=>x-y);return a.length?a[Math.floor(p*(a.length-1))]:null;};
const out={};for(const k in by){const o=by[k];out[k]={n:o.n,empty:o.empty,h:[q(o.h,0),q(o.h,.5),q(o.h,1)],flipPct:Math.round(100*o.flips/Math.max(1,o.h.length)),alpha:[q(o.alpha,0),q(o.alpha,.5)],src:Object.entries(o.src).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]+'×'+x[1])};}
return out;
