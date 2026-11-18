// R1153 혼합 이펙트 장면(헤드리스 — 그래픽 검증 아님): 낙인 1~5 · 서하 톱니 · 연쇄 레이저 · 배치 고리 3색을 영웅 곁에 실제 그리기 길(API)로 그려 찍는다.
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.',ONLY=process.argv[3]||'brand,gears,chain,deploy';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await go(p,'murder01');await p.waitForTimeout(1000);
await p.evaluate(async(ONLY)=>{const W_=new Set(ONLY.split(','));player.maxHp=player.hp=99999;for(const e of room.enemies){e.x=player.x+40;e.y=player.y+40;e.speed=0;}const Z=window.__STORYWORLD_DOTS_STATUS_R1153__;await ensureImages(Object.values(Z.paths));
 const S={type:'mix-probe',x:player.x,y:player.y,age:0,life:Infinity};effects.push(S);const base=drawEffect;
 drawEffect=function(e,...a){if(e!==S)return base.apply(this,[e,...a]);const t=time,H=actorHeight();
  if(W_.has('brand'))for(let n=1;n<=5;n++){const q=project(player.x-3+n*1.1,player.y-1.5);Z.brand({id:'b'+n,x:player.x-3+n*1.1,y:player.y-1.5},n,q.x,q.y-H*1.25,t);}
  const g=project(player.x+2.5,player.y+.5);if(W_.has('gears'))Z.gears(g.x,g.y,H*.5,t,1,1,player.x+2.5,player.y+.5);
  const A=project(player.x-2,player.y+2),m=project(player.x,player.y+3.2),c=project(player.x+2,player.y+2.4);if(W_.has('chain'))Z.chain(A.x,A.y-H*.45,m.x+10,m.y-H*.45-18,c.x,c.y-H*.45,H,1,t,'probe',player.x,player.y+2.6);
  if(W_.has('deploy'))['#d9a441','#6fb4ff','#ff5a7a'].forEach((col,i)=>{const d=project(player.x-1.5+i*1.5,player.y-3.5);const o={id:'probe:dep'+i,kind:'effect',x:player.x-1.5+i*1.5,y:player.y-3.5,groundAligned:true},f=()=>Z.deploy(d.x,d.y,TILE*zoom,col,t,i);ctx.save();try{if(ctx.scope)ctx.scope(o,f);else f();}finally{ctx.restore();}});};},ONLY);
await p.waitForTimeout(1200);await p.screenshot({path:`${OUT}/mix-${ONLY.replace(/,/g,'-')}.png`,clip:{x:180,y:40,width:600,height:440}});const err=await p.evaluate(()=>window.__STORYWORLD_DOTS_STATUS_R1153__.inspect());console.log(ONLY,JSON.stringify(err.stats),err.lastError);await b.close();
