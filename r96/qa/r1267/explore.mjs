import {boot} from './boot.mjs';
const {b,p,errors}=await boot();
console.log(await p.evaluate(()=>[...document.querySelectorAll('canvas')].map(c=>({id:c.id,w:c.width,h:c.height,vis:getComputedStyle(c).display,op:getComputedStyle(c).opacity,ctx:c.__ctxType||'?'}))));
console.log(await p.evaluate(()=>({three:!!window.__STORYWORLD_PHASE1__,state:window.__STORYWORLD_PHASE1__?.controller?.state?.mode, reason:window.__STORYWORLD_PHASE1__?.controller?.state?.reason, room:room.id, n:room.enemies.length, time})));
console.log(errors);await b.close();
