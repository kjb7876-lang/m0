// R1393 3D 몹 크기·방향 전수: 지역마다 몹을 영웅 앞에 모아 싸우게 두고, 3D 인스턴스마다
//  ① 화면 키 h(실제 꼭짓점 투영, measure) ÷ 2D 보이는 키 target  ② target ÷ 영웅 화면 키  ③ 공격 자세일 때 몸 yaw 와 영웅 쪽 각의 차(도)를 잰다.
// 사용: SW_URL=... node r96/qa/r1393/census.mjs <out.json> zone ...
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2],ZONES=process.argv.slice(3);const res={};
const b=await chromium.launch();
const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};
const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'}});
for(const z of ZONES){try{await go(p,z);
 await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;let i=0;for(const e of room.enemies){if(!(e.hp>0))continue;if(i<8){e.spawnState='active';e.hidden=false;e.engaged=true;e.hp=e.maxHp=1e8;const a=i/8*Math.PI*2;e.x=player.x+Math.cos(a)*1.6;e.y=player.y+Math.sin(a)*1.6;}else{e.x=player.x+300;e.y=player.y+300;e.speed=0;}i++;}});
 const t0=Date.now();const S={};
 while(Date.now()-t0<45000){await p.waitForTimeout(700);await skip(p);
  const snap=await p.evaluate(()=>{const M=Object.keys(window).filter(k=>/^__STORYWORLD_(MOB3D|BOSS3D|BALROG3D)_R1/.test(k));const out=[];
   const hero=typeof actorHeight==='function'?actorHeight():null;
   for(const k of M){const A=window[k];let I;try{I=A.inspect?.();}catch(_){continue;}for(const i of I?.instances||[]){if(!i.visible)continue;
    const e=room.enemies.find(e=>String(e.id)===String(i.id)||('enemy:'+e.id)===String(i.id));let m=null;try{m=A.measure?.(i.id);}catch(_){}
    const want=e?Math.atan2(player.x-e.x,player.y-e.y):null;
    out.push({mod:k.replace('__STORYWORLD_','').replace('__',''),kind:i.kind,name:e?.name||null,boss:!!e?.boss,pose:i.pose,yaw:i.yaw,want,h:m?.h??null,target:m?.target??i.target??null,hero});}}
   return out;});
  for(const s of snap){const key=s.mod+'|'+s.kind;const r=S[key]=S[key]||{mod:s.mod,kind:s.kind,name:s.name,boss:s.boss,ratio:[],rel:[],atkDev:[],poses:{}};
   r.poses[s.pose]=(r.poses[s.pose]||0)+1;
   if(s.h>4&&s.target>4&&(s.pose==='idle'||s.pose==='walk'))r.ratio.push(s.h/s.target);
   if(s.target>4&&s.hero>4)r.rel.push(s.target/s.hero);
   if(s.pose==='attack'&&Number.isFinite(s.yaw)&&Number.isFinite(s.want)){let d=Math.abs(s.yaw-s.want)%(2*Math.PI);if(d>Math.PI)d=2*Math.PI-d;r.atkDev.push(d*180/Math.PI);}}
 }
 const med=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return +s[s.length>>1].toFixed(3);};
 const mx=a=>a.length?+Math.max(...a).toFixed(1):null;
 res[z]=Object.values(S).map(r=>({mod:r.mod,kind:r.kind,name:r.name,boss:r.boss,n:r.ratio.length,ratioMed:med(r.ratio),ratioMin:r.ratio.length?+Math.min(...r.ratio).toFixed(3):null,ratioMax:r.ratio.length?+Math.max(...r.ratio).toFixed(3):null,relHero:med(r.rel),atkN:r.atkDev.length,atkDevMed:med(r.atkDev),atkDevMax:mx(r.atkDev),poses:r.poses}));
 console.log(z,JSON.stringify(res[z]));
 await p.screenshot({path:OUT.replace(/\.json$/,'')+'-'+z+'.png'});
 fs.writeFileSync(OUT,JSON.stringify(res,null,1));
}catch(e){console.log('ERR',z,String(e).slice(0,200));}}
await b.close();
