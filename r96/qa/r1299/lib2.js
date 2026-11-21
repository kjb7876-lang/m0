window.__BODY=/assets\/(r130|r128|hero-authored|r1[0-9]{3}\/hero|heroes?)\/|actions-|HTMLCanvasElement|walk-atlas|idle-|\/g-[a-z]+\.webp/;
window.__bodyStat=(from,to,filt)=>{const R=window.__R1299.rows.filter(r=>r.t>=from&&r.t<=to&&(!filt||r.who.startsWith(filt)));const by={};
 for(const r of R){const o=by[r.who]||(by[r.who]={frames:0,body:0,noBody:[],srcs:{}});o.frames++;const b=r.img.filter(m=>__BODY.test(m.src));if(b.length)o.body++;else if(o.noBody.length<6)o.noBody.push({t:r.t,img:r.img.map(m=>m.src+'@'+m.dh+'a'+m.alpha)});
  for(const m of r.img)o.srcs[m.src]=(o.srcs[m.src]||0)+1;}
 for(const k in by)by[k].srcs=Object.entries(by[k].srcs).sort((a,b)=>b[1]-a[1]).slice(0,8);return by;};return 'ok';
