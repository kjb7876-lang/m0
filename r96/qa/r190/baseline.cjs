'use strict';
const fs=require('node:fs');const {fixture}=require('./pixelfx-fixture.cjs');
(async()=>{
const report={kind:'Native Canvas CPU fixture; no browser/GPU/FPS claim',scenarios:[]};
for(const offscreen of [false,true]){const f=await fixture();for(let i=0;i<48;i++)f.P.play('dark-explosion-blood',offscreen?10000:150+(i%8)*90,offscreen?10000:180+Math.floor(i/8)*70,{tint:{a:[100,6,16],b:[255,90,90]},k:.7});f.step(.2);let t=performance.now();f.draw();const cold=performance.now()-t;const samples=[];for(let i=0;i<120;i++){t=performance.now();f.draw();samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);report.scenarios.push({offscreen,coldMs:cold,p50Ms:samples[60],p95Ms:samples[114],...f.counts()});}
const f=await fixture();const first=f.P.play('core-orb-teal',100,100,{key:'core',loop:true});for(let i=0;i<64;i++)f.P.play('pvfx-electric-impact',200,200);report.overflow={coreSurvives:f.P.inspect().active.includes('core-orb-teal'),active:f.P.inspect().active.length};
fs.writeFileSync('docs/r190/baseline.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
