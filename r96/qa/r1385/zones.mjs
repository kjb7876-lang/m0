import {chromium,boot} from '../r444/lib.mjs';import fs from 'node:fs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const r=await p.evaluate(()=>{const o={};for(const [k,v] of Object.entries(regionById||{})){const ro=(v.roster||[]).map(x=>typeof x==='string'?x:(x?.name||x?.id||JSON.stringify(x).slice(0,60)));o[k]={name:v.name||v.title||'',layer:v.layer||'',roster:ro,boss:v.boss?.name||v.bossName||null};}return o;});
fs.writeFileSync(process.argv[2],JSON.stringify(r,null,1));console.log(Object.keys(r).length);await b.close();
