import {chromium,boot,go,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {ctx,p}=await boot(b,{vp:{width:960,height:540}});
const r=await p.evaluate(()=>{const o={};for(const [k,v] of Object.entries(regionById||{}))o[k]={name:v.name||v.title||'',roster:(v.roster||[]).length,layer:v.layer||''};return {cur:room.id,regions:o};});
console.log(JSON.stringify(r));await b.close();
