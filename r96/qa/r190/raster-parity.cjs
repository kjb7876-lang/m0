'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{fixture}=require('./pixelfx-fixture.cjs');
(async()=>{const a=await fixture({source:execFileSync('git',['show','4473f2a5f48b8abf175119dd924f3ba0859d6327:r96/client-source/pixelfx-r163.js'],{encoding:'utf8'})}),b=await fixture({overlay:true});let seed=190;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const rows=[];
for(let i=0;i<120;i++){
 const width=i%2?390:960,height=i%2?844:640,angle=(rnd()-.5)*6.2,scale=.25+rnd()*2.5,tx=(rnd()-.5)*500,ty=(rnd()-.5)*400,x=(rnd()-.25)*width*2,y=(rnd()-.25)*height*2,flip=rnd()>.5,u=rnd();
 for(const f of [a,b]){f.canvas.width=width;f.canvas.height=height;f.ctx.setTransform(1,0,0,1,0,0);f.ctx.translate(tx,ty);f.ctx.rotate(angle);f.ctx.scale(scale,scale);f.P.frameAt('pvfx-electric-impact',u,x,y,{h:40,flip});}
 const same=Buffer.from(a.ctx.getImageData(0,0,width,height).data).equals(Buffer.from(b.ctx.getImageData(0,0,width,height).data));rows.push({i,width,height,same});assert.ok(same,'transformed raster parity '+i);
}
fs.writeFileSync('docs/r190/raster-parity.json',JSON.stringify({passed:true,cases:rows.length,method:'Exact RGBA comparisons in native CPU Canvas; alternating 390x844/960x640 raster buffers, randomized transforms/positions/flip/frame; not mobile browser or GPU.',rows},null,2)+'\n');console.log('120 transformed raster comparisons passed');})().catch(e=>{console.error(e);process.exitCode=1});
