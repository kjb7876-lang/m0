// R1152 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님). 실행: node persona-dots-browser.mjs <출력 폴더>
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const A='__STORYWORLD_PERSONA_HERO_R1113__',Z='__STORYWORLD_PERSONA_WER_R1144__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].setForm(true);},A);
await go(p,'murder01');await p.waitForTimeout(2000);
await p.evaluate(async Z=>{await ensureImages(Object.values(window[Z].sheets).map(s=>s.path));const P=window.__STORYWORLD_PROGRESSION_R62__,st=P.state(player);for(const s of 'QWER')st.ranks['skill'+s+'R663']=1;player.maxHp=player.hp=99999;
 const T=__STORYWORLD_PHASE1__.controller.state.three,O=T.render;window.__fx=[];
 T.render=function(f){const R=O.apply(this,arguments);try{for(const c of f.commands){const id=String(c?.owner?.id||'');if(!/^(r1144:|r946:violet:laser)/.test(id)||c.kind!=='image')continue;window.__fx.push({id:id.split(':').slice(0,3).join(':'),img:String(c.sourcePath||'').replace(/^https?:\/\/[^/]+\//,'').slice(0,70),f:c.style?.filter||'none'});}}catch(e){}return R;};},Z);
const waitT=async dt=>{const t0=await p.evaluate(()=>time);for(let i=0;i<900;i++){if(await p.evaluate(t0=>time-t0,t0)>=dt)return;await p.waitForTimeout(50);}};
const calm=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 live.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;if(i<4){const a=i*1.57+.4;e.x=player.x+Math.cos(a)*1.6;e.y=player.y+Math.sin(a)*1.6;}else{e.x=player.x+30;e.y=player.y+30;}});player.storyWER.ready={};});
const fx=()=>p.evaluate(()=>window.__fx.splice(0));
const has=(r,re,k)=>r.filter(x=>x.id.startsWith('r1144:'+k)||x.id.startsWith(k)).filter(x=>re.test(x.img));
async function shoot(slot,dts,tag){await calm();await fx();await p.evaluate(s=>window.__STORYWORLD_WER__.cast(s),slot);let last=0,i=0;for(const dt of dts){await waitT(dt-last);last=dt;await p.screenshot({path:`${OUT}/${tag}-${i++}.png`,clip:{x:250,y:110,width:460,height:300}});}return fx();}
{const r=await shoot('w',[.35,.6,1.5],'w');ok(has(r,/(^|\/)assets\/r1152\/w-chain/,'chain').length>0,'ⓐ W 번개 = Dots 먹 번개, 굽지 않음 ('+has(r,/w-chain/,'chain').length+')');ok(has(r,/(^|\/)assets\/r1152\/w-mark/,'mark').length>0,'ⓐ W 표식 눈');ok(has(r,/(^|\/)assets\/r1152\/w-hit/,'hit').length>0,'ⓐ W 적중 섬광');}
{const r=await shoot('e',[.3,.6,1.6],'e');ok(has(r,/(^|\/)assets\/r1152\/r-orb/,'orb').length>0&&has(r,/(^|\/)assets\/r1152\/r-tail/,'orbtail').length>0,'ⓑ E 구슬·꼬리 = Dots');ok(has(r,/(^|\/)assets\/r1152\/e-ember/,'burn').length>0,'ⓑ E 화상 불씨 = Dots');}
{const r=await shoot('r',[.5,1.2,2.4],'r');ok(has(r,/(^|\/)assets\/r1152\/r-orb/,'orbit').length>0&&has(r,/(^|\/)assets\/r1152\/r-tail/,'orbittail').length>0,'ⓒ R 도는 구슬·꼬리 = Dots');}
{await calm();await fx();await p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));live.slice(0,4).forEach((e,i)=>{e.x=player.x+2.4+1.2*i;e.y=player.y+(i%2?.2:-.2);});
  const Z=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;Z.qaReset();Z.qaForce('violet');hitEnemy(live[0],1,{kind:'basic',sourceHero:'lauren'});});
 let i=0;for(const dt of [.65,.8,.95,1.15]){await waitT(i?.15:dt);await p.screenshot({path:`${OUT}/laser-${i++}.png`,clip:{x:150,y:60,width:660,height:400}});}
 const r=await fx(),L=r.filter(x=>x.id.startsWith('r946:violet:laser'));ok(['laser-start','laser-body','laser-end'].every(n=>L.some(x=>x.img.endsWith("assets/r1152/"+n+".webp"))),'ⓓ (진) 레이저 시작·몸통·끝 = Dots, 굽지 않음 ('+[...new Set(L.map(x=>x.img))].join(',')+')');
 ok((await p.evaluate(Z=>window[Z].inspect().stats.laserKills||0,Z))>=1,'ⓓ 일반 몹 즉사 그대로');}
const s=await p.evaluate(Z=>window[Z].inspect(),Z);ok(s.stats.errors===0&&Object.values(s.dots).every(Boolean),'ⓔ 오류 0, Dots 시트 아홉 장 모두 읽힘 ('+JSON.stringify(s.dots)+')');
ok(errs.length===0,'ⓕ 페이지 오류 0 ('+errs.slice(0,2).join(' | ')+')');
console.log(fails?('FAILED '+fails):'ALL PASS (헤드리스)');await b.close();process.exit(fails?1:0);
