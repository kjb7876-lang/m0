// R832 나무 전후: 지역 들어간 첫 자리·문 앞 두 장면. SW_URL·ZONES·OUT·TAG
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.OUT||'/tmp/r832-trees',TAG=process.env.TAG||'after';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
for(const z of (process.env.ZONES||'last302,last303').split(',')){await go(p,z);await p.waitForTimeout(4000);await skip(p);
 const st=await p.evaluate(()=>{const st=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.__r204;return{trees:window.__STORYWORLD_CAVE_R204__?.inspect?.()?.stats?.trees,zone:room.id,grove:window.__STORYWORLD_GROVE_R481__?.inspect?.()?.stats};});
 console.log(TAG,JSON.stringify(st));await p.screenshot({path:`${OUT}/${z}-${TAG}-0.png`});
 for(const [k,dx,dy] of [[1,6,-6],[2,-8,4]]){await p.evaluate(([dx,dy])=>{const x=player.x+dx,y=player.y+dy;if(!window.StoryPhase1?.explorationBlocked?.(room.exploration,x,y,.35)){player.x=x;player.y=y;}},[dx,dy]);await p.waitForTimeout(2500);await skip(p);await p.screenshot({path:`${OUT}/${z}-${TAG}-${k}.png`});}}
await b.close();
