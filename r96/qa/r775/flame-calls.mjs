import {chromium,boot,go} from '/home/user/m0/r96/qa/r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{});await go(p,'dist03');await p.waitForTimeout(1000);
const r=await p.evaluate(()=>{const F=VFX.burnFlame;const tx=texture;let n=0;texture=function(q){if(q===F)n++;return tx.apply(this,arguments);};const out={};
 const fx={type:'enemyBurnDeath',sourceId:'zz-none',x:player.x,y:player.y,age:.1,life:.72,boss:true,bodyPath:null,embers:[{delay:0,spread:.1,side:1,phase:0,scale:1}]};
 drawBurnDeath3(fx);out.off=n;out.embersAfter=fx.embers.length;const M=window.__STORYWORLD_MOB_DEATH_R462__;M.set?.({flame:true});n=0;const fx2={...fx,embers:[{delay:0,spread:.1,side:1,phase:0,scale:1}]};drawBurnDeath3(fx2);out.on=n;M.set?.({flame:false});texture=tx;out.texIsGlobal=typeof window.texture;return out;});
console.log(JSON.stringify(r));await b.close();
