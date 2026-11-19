import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
for(const z of ['dist06','ep1a09b']){await go(p,z);console.log(z,await p.evaluate(()=>JSON.stringify({ah:actorHeight(),W,H,st:window.__STORYWORLD_MOTION_FX_R1229__.inspect().stats.balrogRatio})));}
await b.close();
