'use strict';
// Dependency-free CI gate; native raster parity is a separate, documented fixture.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(R,f),'utf8'),checks=[];
const check=(name,value)=>{checks.push({name,passed:!!value});assert.ok(value,name);};
(async()=>{
const html=read('runtime-text/index.html');check('overlay loaded once before player',html.split('src="./fx-performance-r190.js"').length===2&&html.indexOf('./fx-performance-r190.js')<html.indexOf('./pixelfx-r163.js'));
for(const n of ['fx-performance-r190.js','pixelfx-r163.js'])check('canonical/runtime equality: '+n,read('client-source/'+n)===read('runtime-text/'+n));
const s={zone:'ep1a08',console,localStorage:{getItem:()=>null,setItem(){}},fetch:async()=>({ok:true,json:async()=>({effects:{core:{frame:[100,100],pivot:[50,50],frames:10,columns:5,fps:10},hit:{frame:[100,100],pivot:[50,50],frames:10,columns:5,fps:10}}})}),time:1,effects:[],tick(dt){s.time+=dt},drawEffect(){},enterRegion:async()=>{},readyImage:()=>null,ensureImages:async()=>{},ctx:{},project:(x,y)=>({x,y})};s.window=s;vm.createContext(s);
vm.runInContext(read('client-source/fx-performance-r190.js'),s);vm.runInContext(read('client-source/pixelfx-r163.js'),s);await new Promise(r=>setImmediate(r));
const P=s.__STORYWORLD_PIXELFX_R163__,F=s.__STORYWORLD_FX_R190__,m={frame:[100,100],pivot:[0,50]},I={a:1,b:0,c:0,d:1,e:0,f:0};const C={canvas:{width:960,height:640},getTransform:()=>I,filter:'none',globalCompositeOperation:'source-over'};
check('pilot on in hospital',F.active());check('inside preserved',!F.cull(m,400,300,1,false,C));check('fully outside culled',F.cull(m,10000,300,1,false,C));
check('intersecting left edge preserved',!F.cull(m,-50,300,1,false,C));check('flipped pivot bounds respected',F.cull(m,-50,300,1,true,C));
I.e=-10000;check('parent translation into viewport preserved',!F.cull(m,10000,300,1,false,C));I.e=0;
C.globalCompositeOperation='destination-in';check('mask operation kept',!F.cull(m,10000,300,1,false,C));C.globalCompositeOperation='source-over';C.shadowBlur=10;check('blurred effects kept',!F.cull(m,10000,300,1,false,C));C.shadowBlur=0;
const core=P.play('core',100,100,{key:'core',loop:true});for(let i=0;i<63;i++)P.play('hit',200,200);check('overflow refused without dropping core',P.play('hit',200,200)===null&&P.inspect().active.includes('core')&&P.inspect().active.length===64);check('key refresh allowed at capacity',P.play('core',120,130,{key:'core'})===core&&core.x===120);
s.tick(1.1);check('ended effects free slots',P.inspect().active.length===1&&!!P.play('hit',200,200));
check('finite loop deadline fades',Math.abs(F.alpha({loop:true,until:2.16},2.1)-.5)<1e-9);check('nonloop timing unchanged',F.alpha({loop:false,until:2.16},2.1)===1);
s.zone='dist00';check('other maps inactive',!F.active()&&!F.cull(m,10000,300,1,false,C));s.zone='ep1a08';F.setEnabled(false);check('runtime rollback',!F.active());
await s.enterRegion();check('transition clears visual list',P.inspect().active.length===0);
console.log(JSON.stringify({checks,passed:true},null,2));
})().catch(e=>{console.error(JSON.stringify({checks,passed:false,error:e.stack},null,2));process.exitCode=1;});
