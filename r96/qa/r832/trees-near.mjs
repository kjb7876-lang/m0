// R832 나무 가까이: r204-trees 스프라이트 몇 그루 앞에 영웅을 세우고 찍는다. SW_URL·ZONES·OUT·TAG
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.OUT||'/tmp/r832-trees',TAG=process.env.TAG||'after';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
for(const z of (process.env.ZONES||'last302,last303').split(',')){await go(p,z);await p.waitForTimeout(3000);await skip(p);
 const pts=await p.evaluate(()=>{const t=window.__STORYWORLD_PHASE1__.controller.state.three;let g=null;t.spatialRoot.traverse(o=>{if(o.name==='r204-trees')g=o;});if(!g)return[];
  const L=room.exploration,out=[];for(const s of g.children){const x=s.position.x,y=s.position.z;for(let r=1.5;r<6;r+=.5){let ok=null;for(const [dx,dy] of [[1,1],[1,0],[0,1],[-1,1],[1,-1]]){const q=[x+dx*r,y+dy*r];if(!window.StoryPhase1.explorationBlocked(L,q[0],q[1],.4)){ok=q;break;}}if(ok){out.push(ok);break;}}if(out.length>=3)break;}return out;});
 console.log(TAG,z,JSON.stringify(pts));
 for(let k=0;k<pts.length;k++){await p.evaluate(([x,y])=>{player.x=x;player.y=y;},pts[k]);await p.waitForTimeout(2500);await skip(p);await p.screenshot({path:`${OUT}/${z}-${TAG}-near${k}.png`});}}
await b.close();
