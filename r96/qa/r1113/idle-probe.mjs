// R1113d 헤드리스: 대기 6칸 4방향, 서기→걷기→서기 때 발·키 튐 (소프트웨어 렌더링, 그래픽 검증 아님)
import {chromium,boot} from '../r444/lib.mjs';
const OUT=process.argv[2]||'/tmp';const b=await chromium.launch();
const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r1055.inkWash':JSON.stringify({mode:process.env.INK||'off'})}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].setForm(true);},A);
await p.evaluate(()=>{window.__log=[];const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;T.render=function(f){const r=O.apply(this,arguments);try{const c=f.commands.find(c=>c.kind==='image'&&c.owner?.kind==='hero'&&c.r1113);if(c){const P=c.points,g=project(player.x,player.y),sr=c.sourceRect;window.__log.push({t:+time.toFixed(3),src:String(c.sourcePath).replace(/^r1113:assets\//,''),flip:P[1][0]<P[0][0],gx:+g.x.toFixed(1),gy:+g.y.toFixed(1),x0:+P[0][0].toFixed(1),y0:+P[0][1].toFixed(1),y3:+P[3][1].toFixed(1),w:sr[2],h:sr[3]});if(window.__log.length>4000)window.__log.shift();}}catch(e){}return r;};});
await p.waitForTimeout(1500);const R={};
for(const [k,d] of [['ArrowDown','front'],['ArrowLeft','left'],['ArrowRight','right'],['ArrowUp','back']]){await p.keyboard.down(k);await p.waitForTimeout(1500);await p.keyboard.up(k);await p.waitForTimeout(1800);
 R[d]=await p.evaluate(A=>window[A].inspect().stats.last,A);await p.screenshot({path:OUT+'/r1113d-idle-'+d+'.png'});}
R.log=await p.evaluate(()=>window.__log);console.log(JSON.stringify(R));await b.close();
