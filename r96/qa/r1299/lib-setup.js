window.__arrange=(n=7,dx=3.4)=>{const live=room.enemies.filter(e=>!e.boss&&!e.midboss&&e.hp>0).slice(0,n);const c={x:player.x+dx,y:player.y+.3};
 live.forEach((e,i)=>{const a=i*2*Math.PI/live.length,r=i===0?0:1.8*(.5+(i%3)*.35);e.x=c.x+Math.cos(a)*r;e.y=c.y+Math.sin(a)*r;e.spawnState='active';e.hidden=false;e.hp=e.maxHp=9e6;e.damage=0;e.speed=0;e.moveSpeed=0;});
 player.hp=player.maxHp=9e6;player.invincible=1e9;return live.length;};
window.__waitG=async s=>{const t0=time;for(let i=0;i<20000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));return time-t0;};
window.__sum=(from,to,filt)=>{const R=window.__R1299.rows.filter(r=>r.t>=from&&r.t<=to&&(!filt||r.who.startsWith(filt)));const by={};
 for(const r of R){const k=r.who;const o=by[k]||(by[k]={frames:0,empty:0,flips:0,h:[],alpha:[],src:{}});o.frames++;if(!r.n)o.empty++;const m=r.img[0];if(m){if(m.flip)o.flips++;o.h.push(m.dh);o.alpha.push(m.alpha);o.src[m.src]=(o.src[m.src]||0)+1;}}
 for(const k in by){const o=by[k];const h=o.h.sort((a,b)=>a-b);o.h=h.length?[h[0],h[h.length>>1],h[h.length-1]]:[];const a=o.alpha.sort((x,y)=>x-y);o.alpha=a.length?[a[0],a[a.length-1]]:[];o.src=Object.entries(o.src).sort((x,y)=>y[1]-x[1]).slice(0,4);}
 return by;};
return 'ok';
