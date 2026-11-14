// 촉수 장면 전후: 사몽 보스 촉수 패턴(R162 와 같은 장판 16개 + 같은 재생 호출)·탑 육망성(R170 장판)을 영웅 둘레에 깔고,
//  피해 순간(age = warning) + extra 초에서 게임 시간을 멈춰 찍는다. node tentshot.mjs <url> <zone> <kind: samong|hex> <extra> <out.png>
import {chromium,boot,go} from '../r444/lib.mjs';
const [,,url,zone,kind,extra,out]=process.argv;// url 은 SW_URL 환경 변수로 넘긴다(lib.mjs)
const b=await chromium.launch();const VP=(process.env.VP||'960x540').split('x').map(Number);const {p}=await boot(b,{vp:{width:VP[0],height:VP[1]}});await go(p,zone);await p.waitForTimeout(5000);// 지역 들어간 직후 한 번 더 들어가며(복원) pixelfx 목록을 비우는 것을 피한다
await p.evaluate(([kind,extra])=>{for(const e of room.enemies)e.hp=0;auto=false;guide=false;player.invincible=0;player.hp=player.maxHp=9e6;
 window.__freeze=false;const tb=tick;tick=function(dt,...a){return tb.call(this,window.__freeze?dt*1e-4:dt,...a);};
 const P=player,X=()=>window.__STORYWORLD_PIXELFX_R163__;const H=[];
 if(kind==='samong'){const pts=[];[[0,1],[1.1,6],[2.1,9]].forEach(([R,n],ring)=>{for(let k=0;k<n;k++){const a=k*Math.PI*2/n+ring*.3,px=P.x+Math.cos(a)*R,py=P.y+Math.sin(a)*R,w=.75+ring*.35;pts.push({x:px,y:py,warn:w,ring});
   if(blocked(px,py,.1,room))continue;const h={id:++uid,type:'field',owner:'none',x:px,y:py,radius:.72,age:0,warning:w,life:w+.95,asset:VFX.mark,damage:1,lastHit:-99,samongPattern:'tentacles'};hazards.push(h);H.push(h);}});
  pts.forEach((p,k)=>X().play('tendrils-blood',p.x,p.y,{delay:p.warn-.12,rate:2.2,k:p.ring===0?1.35:1.05-.1*p.ring,flip:k%3===0}));}
 else{const h={id:++uid,type:'field',owner:'none',x:P.x,y:P.y,radius:1.7,age:0,warning:1.3,life:2.2,asset:VFX.mark,damage:1,lastHit:-99,samongPattern:'r170-hex',r170:{tower:'none',pal:{main:{a:[120,8,16],b:[255,80,80]},sub:{a:[60,4,10],b:[200,40,60]}},seed:.4,burst:false}};hazards.push(h);H.push(h);}
 window.__H0=H[0];window.__ext=+extra;},[kind,extra]);
await p.waitForFunction(()=>window.__H0.age>=window.__H0.warning+window.__ext,null,{timeout:120000,polling:16});await p.evaluate(()=>{window.__freeze=true;});
await p.waitForTimeout(400);await p.screenshot({path:out});
const info=await p.evaluate(()=>({age:+window.__H0.age.toFixed(3),warn:window.__H0.warning,meta:(window.__STORYWORLD_PIXELFX_R163__.meta()["enemy-tendrils-r1028"]||window.__STORYWORLD_PIXELFX_R163__.meta()["tendrils-blood"]).frame,ts:window.__STORYWORLD_TENTACLE_STRIKE_R1028__?.inspect?.().stats||null,px:window.__STORYWORLD_PIXELFX_R163__.inspect?.().stats,img:!!readyImage("assets/r163/pixelfx/"+window.__STORYWORLD_PIXELFX_R163__.meta()["tendrils-blood"].file)}));console.log(JSON.stringify(info));await b.close();
