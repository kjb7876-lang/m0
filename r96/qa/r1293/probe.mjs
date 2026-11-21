// R1293 미카엘라 실제 플레이 이펙트 전수조사(헤드리스 소프트웨어 렌더·3D 기록기).
//  실제 입구(기본공격 basicAttack·Q special·W/E = WER.cast → R247 성흔 광시/성광주·R = WER.cast('r')·확률 패시브 R948 qaForce·EGO ego())로 쓰고
//  게임 시간 0~2초 동안 기록기에 들어간(대체 규칙을 거친 뒤) 그림 명령을 owner id·그림별로 세고, 정해진 순간에 멈춰 찍는다.
//  OUT=… SC=A,Q,W,E,R,volley,tower,bloom,F  VW=640  →  OUT/census.json, OUT/<SC>-<t>.png
import fs from 'node:fs';import {boot} from '../r1267/boot.mjs';
const OUT=process.env.OUT||'out/r1293',VW=+(process.env.VW||640),VH=Math.round(VW*9/16);fs.mkdirSync(OUT,{recursive:true});
const SCS=(process.env.SC||'A,Q,W,E,R,volley,tower,bloom,F').split(',');const AT=(process.env.AT||'.2,.45,.8,1.2').split(',').map(Number),SPAN=+(process.env.SPAN||2);
const {b,p,errors}=await boot({w:VW,h:VH});
await p.evaluate(()=>{const S=window.__sc={virt:false,freeze:false};let lastReal=-1,virt=0;const raf=window.requestAnimationFrame.bind(window);
 window.requestAnimationFrame=function(cb){return raf(ts=>{if(ts!==lastReal){lastReal=ts;if(S.virt&&!S.freeze)virt+=1000/60;else if(!S.virt)virt=ts;}return cb(virt);});};
 const W=window.__pr={on:false,img:{},kinds:{}};
 const own=c=>{const id=String(c?.owner?.id||c?.owner?.kind||'?');return id.replace(/(^|[:|_-])[\d.]+(?=$|[:|_-])/g,'$1#').slice(0,48)+(c?.owner?.r106?'[r106]':'');};
 const rec=c=>{try{if(!W.on)return;const o=own(c),k=c?.kind||'?';if(k==='image'){let s=String(c.sourcePath||c.image?.src||(c.image?.getContext?'CANVAS':'?')).replace(/^.*?(assets\/)/,'$1').split('?')[0];s=s.replace(/^(r106fx:[a-z-]+):.*/,'$1');
   const key=o+' :: '+s;const r=W.img[key]||(W.img[key]={n:0,a:0,add:0});r.n++;r.a+=+(c.style?.globalAlpha??c.alpha??1)||0;if(/lighter|screen|add/.test(String(c.style?.globalCompositeOperation||c.composite||c.blend||'')))r.add++;}
  else{const key=o+' :: '+k;W.kinds[key]=(W.kinds[key]||0)+1;}}catch(e){W.err=String(e);}};
 const dh=drawHero;drawHero=function(...a){try{const C=ctx?.commands;if(Array.isArray(C)&&!C.r1293){C.r1293=true;const pb=C.push;C.push=function(...items){for(const c of items)rec(c);if(W.hide){items=items.filter(c=>!W.hide.test(String(c?.owner?.id||'')));if(!items.length)return this.length;}return pb.apply(this,items);};}}catch(e){W.err=String(e);}return dh.apply(this,a);};
 for(const e of room.enemies){if(e.hp>0){e.hp=1e7;e.maxHp=1e7;}}const es=room.enemies.filter(v=>v.hp>0&&!v.boss);es.slice(6).forEach(v=>{v.x=player.x-60;v.y=player.y-60;v.speed=0;});
 es.slice(0,6).forEach((e,i)=>{e.x=player.x+2+(i%3)*.9;e.y=player.y-1.2+Math.floor(i/3)*1.4;e.speed=0;e.attack=null;});room.engaged=true;player.invincible=999;});
const RES={};
for(const sc of SCS){
 const t0=await p.evaluate(async(sc0)=>{const W=window.__pr;const [sc,hd]=sc0.split('~');W.hide=hd?new RegExp('^(?:'+hd+')'):null;clearInterval(window.__iv);player.hp=maxHP();player.ego=0;player.egoCD=0;await new Promise(r=>setTimeout(r,900));
  W.img={};W.kinds={};W.on=true;window.__sc.virt=true;const atk=()=>{window.__iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},60);};
  if(sc==='A')atk();else if(sc==='Q'){player.specialCD=0;special();}else if(sc==='W')window.__STORYWORLD_WER__.cast('w');else if(sc==='E')window.__STORYWORLD_WER__.cast('e');
  else if(sc==='R')window.__STORYWORLD_WER__.cast('r');else if(['volley','tower','bloom'].includes(sc)){window.__STORYWORLD_MICHAELA_HEART_R948__.qaForce(sc);atk();}
  else if(sc==='F'){player.resonance=100;ego();atk();}
  return time;},sc);
 for(const a of AT){await p.waitForFunction(t=>time>=t,t0+a,{timeout:3000000});await p.evaluate(()=>{window.__sc.freeze=true;});await p.waitForTimeout(300);
  const q=await p.evaluate(()=>project(player.x+1,player.y-.4));const s=VW/960;
  await p.screenshot({path:`${OUT}/${sc}-${a.toFixed(2)}.png`,clip:{x:Math.max(0,q.x-280*s),y:Math.max(0,q.y-330*s),width:Math.min(VW,560*s),height:Math.min(VH,400*s)}});
  await p.evaluate(()=>{window.__sc.freeze=false;});}
 await p.waitForFunction(t=>time>=t,t0+SPAN,{timeout:3000000});
 RES[sc]=await p.evaluate(()=>{const W=window.__pr;W.on=false;clearInterval(window.__iv);window.__STORYWORLD_MICHAELA_HEART_R948__?.qaForce?.(null);return{img:W.img,kinds:W.kinds,err:W.err};});
 console.log(sc,Object.keys(RES[sc].img).length,'images');}
fs.writeFileSync(`${OUT}/census.json`,JSON.stringify({errors,RES},null,1));console.log('errors',errors);await b.close();
