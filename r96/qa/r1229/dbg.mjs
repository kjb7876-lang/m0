import {chromium,boot,go,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const r=await p.evaluate(()=>({mod:!!window.__STORYWORLD_MOTION_FX_R1229__,ins:window.__STORYWORLD_MOTION_FX_R1229__?.inspect(),dE:!!drawEnemy.__r1229,dF:!!drawEffect.__r1229,three:!!window.__STORYWORLD_PHASE1__?.controller?.state?.three?.render?.__r1229,rel:!!releaseImageMemory.__r1229}));
console.log(JSON.stringify(r));
await go(p,'ep1a09b');
const r2=await p.evaluate(()=>{const B=room.enemies.find(e=>/발록/.test(e.name||''));return {name:B?.name,boss:B?.boss,id:B?.id,isB:window.__STORYWORLD_MOTION_FX_R1229__.isBalrog(B),ins:window.__STORYWORLD_MOTION_FX_R1229__.inspect(),dE:!!drawEnemy.__r1229,dF:!!drawEffect.__r1229};});
console.log(JSON.stringify(r2));await b.close();
