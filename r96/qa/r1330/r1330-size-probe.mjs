import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const waitGame=async(p,sec)=>{const t0=await p.evaluate(()=>time);for(let n=0;n<200;n++){await skip(p);if(await p.evaluate(t=>time>t,t0+sec))break;await p.waitForTimeout(700);}};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540},init:{}});
const L=[['01','ep1b02','나태의 껍데기 파수'],['02','ep1b03','긴 뱀의 그림자'],['03','ep1b03','추녀의 한탄'],['04','ep1b03','금이 간 비교잔영'],['05','ep1b04','살아 있는 거대한 위장'],['06','ep1b04','끓어오르는 검은 소화액'],['07','ep1b04','폐기주방 감독'],
 ['08','ep1b05','공중을 가르는 립스틱 탄환'],['09','ep1b05','심장빛 무대감독'],['10','ep1b06','칼날이 된 지폐'],['11','ep1b06','박제된 여우의 악마'],['12','ep1b06','모든 면이 뒷면인 동전'],['13','ep1b06','금고 장부감시자'],['14','ep1b06','B:회장에게 고용된 총지배인 · 맘몬'],
 ['15','ep1b07','불길 속의 늑대'],['16','ep1b07','불길 속의 용'],['17','ep1b07','호텔 화염기사'],['18','ep1b08','흑마법사의 저주창'],['19','ep1b08','육망성의 흑마술 실험체'],['20','ep1b08','흑마법사의 시체경호체']];
let zone=null;const out={};
for(const [nn,z,raw] of L){const boss=raw.startsWith('B:'),name=raw.replace(/^B:/,'');
 if(z!==zone){await go(p,z);await skip(p);zone=z;}
 const id=await p.evaluate(([name,boss])=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
  const s=room.enemies.find(e=>(!!e.boss===boss)&&e.hp>0&&String(e.name)===name);if(!s)return null;
  s.hp=s.maxHp=1e7;s.speed=0;s.visible=true;if('spawnState'in s)s.spawnState='active';
  for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<9){o.x+=30;o.homeX=o.x;}
  window.__s=s;window.__pin=()=>{s.x=player.x+2.0;s.y=player.y-.6;s.homeX=s.x;s.homeY=s.y;s.nav=[];};window.__pin();
  const r=window.__STORYWORLD_PHASE1__.controller.state.three,sc=r.commands;
  if(!sc.__probe){const base=sc.render;sc.render=function(cmds){try{if(window.__cap){const want='enemy:'+window.__s.id;window.__rows=cmds.filter(c=>c?.kind==='image'&&c.owner&&String(c.owner.id)===want).map(c=>{const P=c.points||[];const xs=P.map(q=>q[0]),ys=P.map(q=>q[1]);return {src:String(c.sourcePath||''),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),x:Math.min(...xs),y:Math.min(...ys)};});}}catch(e){window.__perr=String(e);}return base.apply(this,arguments);};sc.__probe=1;}
  return String(s.id);},[name,boss]);
 if(!id){out[nn]={missing:true};continue;}
 await p.evaluate(()=>{window.__STORYWORLD_MOB3D_ZONE_R1326__.set(false);window.__cap=1;});await waitGame(p,.5);await p.evaluate(()=>window.__pin());await p.waitForTimeout(400);
 const rows=await p.evaluate(()=>window.__rows);
 await p.evaluate(()=>{window.__cap=0;window.__STORYWORLD_MOB3D_ZONE_R1326__.set(true);});
 await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1330__.inspect().instances.some(x=>x.id===id&&x.visible),id,{timeout:240000}).catch(()=>0);
 await waitGame(p,.8);await p.evaluate(()=>window.__pin());await p.waitForTimeout(400);
 const m=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1330__.measure(id),id);
 out[nn]={name,rows,m3:m&&{h:Math.round(m.h),w:Math.round(m.right-m.left),target:m.target}};console.log(nn,name,JSON.stringify(out[nn]).slice(0,400));
 await p.evaluate(()=>{const s=window.__s;if(s){s.x+=30;s.homeX=s.x;s.speed=0;}});}
fs.writeFileSync(process.env.OUT||'probe.json',JSON.stringify(out,null,1));await b.close();
