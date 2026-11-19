import {chromium,boot,go,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,'dist06');
await p.evaluate(()=>keys.add('ArrowRight'));
for(let i=0;i<4;i++){await p.waitForTimeout(700);await p.screenshot({path:`/tmp/claude-0/r1229/walk${i}.png`,clip:{x:380,y:150,width:200,height:200}});}
console.log(await p.evaluate(()=>JSON.stringify({hero:player.hero,skin:player.skin,ego:player.ego, keys:Object.keys(player).filter(k=>/skin|ego|form|costume|look/i.test(k))})));
await b.close();
