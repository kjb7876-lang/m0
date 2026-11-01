'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {fixture}=require('./pixelfx-fixture.cjs');
const baseline=execFileSync('git',['show','4473f2a5f48b8abf175119dd924f3ba0859d6327:r96/client-source/pixelfx-r163.js'],{encoding:'utf8'});
const checks=[];function check(name,condition){checks.push({name,passed:!!condition});assert.ok(condition,name);}
const tint={a:[100,6,16],b:[255,90,90]};
(async()=>{
for(const scene of ['visible','edge','flip','transformed','offscreen','raised']){
 const a=await fixture({source:baseline}),b=await fixture({overlay:true});
 for(const f of [a,b]){if(scene==='transformed'){f.ctx.translate(250,150);f.ctx.rotate(.7);f.ctx.scale(1.5,1.5);}
 const x=scene==='offscreen'?10000:scene==='edge'?-30:scene==='raised'?1000:350;
 f.P.play('dark-explosion-blood',x,scene==='raised'?900:350,{k:1.1,flip:scene==='flip',z:scene==='raised'?700:0,tint});f.step(.3);f.draw();}
 check(scene+' pixels identical',Buffer.from(a.ctx.getImageData(0,0,960,640).data).equals(Buffer.from(b.ctx.getImageData(0,0,960,640).data)));
 if(scene==='offscreen'){check('offscreen performs no draw or recolor',b.counts().draws===0&&b.counts().reads===0);check('offscreen keeps lifetime',b.P.inspect().active.length===1);}
}
const b=await fixture({overlay:true});const core=b.P.play('core-orb-teal',100,100,{loop:true,key:'core',until:4});for(let i=0;i<64;i++)b.P.play('pvfx-electric-impact',200,200);
check('saturated pool retains live core',b.P.inspect().active.includes('core-orb-teal'));check('pool remains bounded at 64',b.P.inspect().active.length===64);check('key refresh still works at capacity',b.P.play('core-orb-teal',110,120,{key:'core',until:5})===core&&core.x===110&&core.until===5);
b.step(1);check('expired one shots free admission capacity',b.P.inspect().active.length===1&&!!b.P.play('pvfx-electric-impact',200,200));
const g=b.s.__STORYWORLD_FX_R190__;check('deadline has smooth tail',g.alpha({loop:true,until:2.1},2)>.8&&g.alpha({loop:true,until:2.1},2.05)<.5&&g.alpha({loop:true,until:2.1},2.1)===0);
check('ordinary one shots unchanged',g.alpha({loop:false,until:2.1},2.05)===1);
const elsewhere=await fixture({overlay:true,zone:'dist00'});elsewhere.P.play('core-orb-teal',100,100,{loop:true});for(let i=0;i<64;i++)elsewhere.P.play('pvfx-electric-impact',100,100);check('other maps preserve existing admission behavior',!elsewhere.P.inspect().active.includes('core-orb-teal'));
await b.s.enterRegion();check('map transition clears only visual list',b.P.inspect().active.length===0);
// frameAt must account for parent transforms (a raw offscreen coordinate can be on screen).
const f=await fixture({overlay:true});f.ctx.translate(-1000,0);check('frameAt translated into view draws',f.P.frameAt('pvfx-electric-impact',.3,1300,300,{tint})&&f.counts().draws===1);
f.s.__STORYWORLD_FX_R190__.setEnabled(false);f.P.frameAt('pvfx-electric-impact',.3,10000,10000,{tint});check('disable restores draw path',f.counts().draws===2);
const mask=await fixture({overlay:true});mask.ctx.globalCompositeOperation='destination-in';mask.P.frameAt('pvfx-electric-impact',.3,10000,10000);check('mask blends keep original draw semantics',mask.counts().draws===1);
fs.writeFileSync('docs/r190/regression.json',JSON.stringify({checks,passed:true},null,2)+'\n');console.log(checks.length+' checks passed');
})().catch(e=>{fs.writeFileSync('docs/r190/regression.json',JSON.stringify({checks,passed:false,error:String(e.stack)},null,2));console.error(e);process.exitCode=1;});
