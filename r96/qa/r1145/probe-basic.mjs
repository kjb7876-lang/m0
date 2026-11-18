// R1145 탐색: 페르소나 형상 기본 공격 중 그려지는 명령 중 라우렌 흔적(경로·보라색·이름) 찾기. node probe-basic.mjs <out> [lauren]
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.',AS_LAUREN=process.argv[3]==='lauren';const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async([A,L])=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].setForm(!L);},[A,AS_LAUREN]);
await go(p,'murder01');await p.waitForTimeout(2000);
await p.evaluate(()=>{player.maxHp=player.hp=99999;const live=room.enemies.filter(e=>e.hp>0);live.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;e.x=player.x+(i<3?1.6+i*.4:30);e.y=player.y+(i<3?(i-1)*.5:30);});
 const T=__STORYWORLD_PHASE1__.controller.state.three,O=T.render;window.__seen=new Map();window.__fxd=[];
 const purple=s=>{const m=String(s||'').match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/);if(!m)return false;const [r,g,bl]=m.slice(1).map(Number);return bl>r+30&&bl>g+40;};
 T.render=function(f){const R=O.apply(this,arguments);for(const c of f.commands){try{const o=c?.owner||{};if(o.kind==='enemy'||o.kind==='ground'||o.kind==='objective')continue;const sp=String(c.sourcePath||'').replace(/^https?:\/\/[^/]+\//,'');const id=String(o.id||'');
  if(/^fx:/.test(id)&&!sp&&c.image?.toDataURL&&(window.__fxi=window.__fxi||[]).length<4)window.__fxi.push(c.image.toDataURL());if(/^final/.test(id)&&(window.__fin=window.__fin||new Set()))window.__fin.add(id.replace(/:[\d.]+$/,'')+' '+JSON.stringify(c.sourceRect||''));if(/^fx:/.test(id)&&window.__fxd.length<8)window.__fxd.push(Object.keys(o).join(',')+' :: '+['type','name','hero','pxfHero','pxfEvent','pxfStage','pxfSide'].map(k=>k+'='+String(o[k])).join(' ')+' img='+(c.image?.width)+'x'+(c.image?.height)+' '+String(c.image?.src||c.image?.__storyworldStaticTint?.path||'').slice(-60)+' filter='+(c.style?.filter||''));
  const lauren=/lauren/i.test(sp)||/lauren/i.test(id);const pc=c.kind!=='image'&&(purple(c.style?.fill)||purple(c.style?.stroke)||purple(c.style?.color));const txt=c.kind==='text'&&/라우렌/.test(String(c.text||''));
  if(!(lauren||pc||txt||(c.kind==='image'&&o.kind==='effect')))continue;const k=[c.kind,o.kind||'',id.replace(/\d+/g,'#').slice(0,60),sp.replace(/\d{2,}/g,'#').slice(0,90),c.style?.filter||'',pc?(c.style?.fill||c.style?.stroke):'',txt?c.text:''].join(' | ');window.__seen.set(k,(window.__seen.get(k)||0)+1);}catch(e){}}return R;};});
const waitT=async dt=>{const t0=await p.evaluate(()=>time);for(let i=0;i<900;i++){if(await p.evaluate(t0=>time-t0,t0)>=dt)return;await p.waitForTimeout(40);}};
for(let k=0;k<9;k++){await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0&&Math.hypot(e.x-player.x,e.y-player.y)<4);if(e)player.direction=e.x>player.x?'right':'left';basicAttack();});await waitT(.12);if(k%3===1)await p.screenshot({path:`${OUT}/basic-${AS_LAUREN?'lauren':'persona'}-${k}.png`,clip:{x:230,y:90,width:520,height:330}});await waitT(.25);}
for(const [k,n] of await p.evaluate(()=>[...window.__seen.entries()].sort((a,b)=>b[1]-a[1])))console.log(n,k);
console.log('FXD\n'+(await p.evaluate(()=>window.__fxd)).join('\n'));
const fxi=await p.evaluate(()=>window.__fxi||[]);const fs=await import('fs');fxi.forEach((d,i)=>fs.writeFileSync(`${OUT}/fx-${AS_LAUREN?'l':'p'}-${i}.png`,Buffer.from(d.split(',')[1],'base64')));console.log('FIN',JSON.stringify([...await p.evaluate(()=>[...(window.__fin||[])])].slice(0,12)));
await b.close();
