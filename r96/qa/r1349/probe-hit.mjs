// R1349 진단: 보스 피격 중 drawEnemy 가 쌓은 몸 명령의 경로·이미지 종류(R1337 표가 못 알아보는 경로 없는 캔버스 찾기)
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [Z,ID]=process.argv.slice(2);const b=await chromium.launch();
{const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);c.setDefaultNavigationTimeout(240000);return c;};}
const {p}=await boot(b,{vp:{width:640,height:360}});await go(p,Z);await skip(p);
const out=await p.evaluate(async ID=>{const e=room.enemies.find(x=>x.nativeId===ID);if(!e)return 'none';player.hp=player.maxHp=1e9;e.hp=e.maxHp=1e8;e.x=player.x+2.5;e.y=player.y;e.speed=0;
 const seen={};const base=drawEnemy;
 window.__n=0;drawEnemy=function(x,...a){window.__n++;if(x===e)window.__ne=(window.__ne||0)+1,window.__ht=Math.max(window.__ht||0,x.hitTimer||0);const cm=ctx?.commands,s0=cm?.length??0;const r=base.apply(this,[x,...a]);if(x===e&&cm)for(let i=s0;i<cm.length;i++){const c=cm[i];if(c?.kind!=='image')continue;const im=c.image;const k=[String(c.sourcePath||'').slice(-60),im?.constructor?.name,im?.__storyworldStaticSource?.path?.slice(-60),(c.sourceRect||[]).map(Math.round).join(','),Math.round(Math.abs(c.points[3][1]-c.points[0][1]))].join(' | ');seen[k]=(seen[k]||0)+1;}return r;};
 for(let i=0;i<40;i++){try{hitEnemy(e,1,{kind:'qa'});}catch(_){e.hitTimer=.14;}await new Promise(r=>setTimeout(r,400));}
 drawEnemy=base;seen.n=window.__n;seen.ne=window.__ne;seen.ht=window.__ht;seen.hp=e.hp;seen.ctx=typeof ctx;seen.cmd=Array.isArray(ctx?.commands);seen.ctor=ctx?.constructor?.name;return seen;},ID);
console.log(JSON.stringify(out,null,1));await b.close();
