if(window.__R1299){window.__R1299.rows.length=0;return 'already';}
const M=window.__R1299={rows:[],on:true,real:player,base:new Set(room.enemies)};
const tag=b=>b.r1157Summon?'r1157':b.r952Summon?'r952':b.r949Summon?'r949':b.r945Clone?'r945':b.r720Ally?'r720':'other';
function spy(kind,who,fn,self,args){const c=ctx;if(!M.on||!c)return fn.apply(self,args);const o=c.drawImage,rec=[];
 c.drawImage=function(im,...a){try{const T=typeof c.getTransform==='function'?c.getTransform():null;const n=a.length;const dw=n>=8?a[6]:n>=4?a[2]:im.width,dh=n>=8?a[7]:n>=4?a[3]:im.height;
  rec.push({src:String(im&&(im.currentSrc||im.src)||im&&im.constructor&&im.constructor.name||'').replace(/^.*\/m0\//,''),dw:Math.round(dw*(T?Math.hypot(T.a,T.b):1)),dh:Math.round(dh*(T?Math.hypot(T.c,T.d):1)),flip:T?T.a*(dw<0?-1:1)<0:dw<0,alpha:+c.globalAlpha.toFixed(2),filter:c.filter&&c.filter!=='none'?c.filter:''});}catch(e){}return o.apply(c,arguments);};
 let r;try{r=fn.apply(self,args);}finally{c.drawImage=o;}
 M.rows.push({t:+time.toFixed(3),kind,who,n:rec.length,img:rec.sort((x,y)=>y.dw*y.dh-x.dw*x.dh).slice(0,8)});if(M.rows.length>20000)M.rows.splice(0,5000);return r;}
const dh=drawHero;drawHero=function(...a){if(player===M.real)return dh.apply(this,a);const b=player;return spy('hero',tag(b)+':'+b.hero+':'+(b.id||''),dh,this,a);};
const de=drawEnemy;drawEnemy=function(e,...a){if(!e||M.base.has(e))return de.call(this,e,...a);const w=(e.r61Summoned?'r61'+(e.r61Clone?'clone':'')+':':e.r953Ally?'r953:':e.trial?'trial:':'new:')+(e.nativeId||e.id)+':'+(e.name||'');return spy('enemy',w,de,this,[e,...a]);};
return 'ok';
