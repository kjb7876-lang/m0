// R1153 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님). 실행: node dots-status-browser.mjs <출력 폴더>
//  ⓐ 영웅 9종 상태 + 적 둘(서로 다른 상태)이 각각 따로 그려짐 ⓑ 사몽 발현 문양 4영웅 ⓒ 기억사수 R 조준 고리 ⓓ 오류 없음
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const Z='__STORYWORLD_DOTS_STATUS_R1153__';
await go(p,'murder01');await p.waitForTimeout(1500);
await p.evaluate(()=>{player.maxHp=player.hp=99999;const T=__STORYWORLD_PHASE1__.controller.state.three,O=T.render;window.__fx=[];
 T.render=function(f){const R=O.apply(this,arguments);try{for(const c of f.commands){const id=String(c?.owner?.id||'');if(!/^r1153:/.test(id)||c.kind!=='image')continue;window.__fx.push({id,img:String(c.sourcePath||'').replace(/^https?:\/\/[^/]+\//,'').replace(/^.*?assets\//,'assets/')});}}catch(e){}return R;};});
const waitT=async dt=>{const t0=await p.evaluate(()=>time);for(let i=0;i<900;i++){if(await p.evaluate(t0=>time-t0,t0)>=dt)return;await p.waitForTimeout(50);}};
const calm=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 live.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;if(i<2){e.x=player.x+2.2+i*1.6;e.y=player.y-.6+i*1.4;}else{e.x=player.x+30;e.y=player.y+30;}});return live.slice(0,2).map(e=>e.id);});
// ⓐ 상태이상
{const ids=await calm();await p.evaluate(ids=>{const F=window.__STORYWORLD_THEME_FX_R430__,Z=window.__STORYWORLD_DOTS_STATUS_R1153__;for(const k of Z.ORDER){F.afflict(player,k);}
  const [a,b]=ids.map(id=>room.enemies.find(e=>e.id===id));for(const e of [a,b])if(e)e.hp=e.maxHp=1e9;if(a){Z.mark(a,'burn',30);Z.mark(a,'chill',30);}if(b){Z.mark(b,'poison',30);Z.mark(b,'curse',30);Z.mark(b,'shock',30);}
  window.__fx.length=0;},ids);
 await waitT(.5);await p.screenshot({path:`${OUT}/status-all.png`,clip:{x:180,y:40,width:600,height:380}});
 const fx=await p.evaluate(()=>window.__fx.slice());const st=await p.evaluate(Z=>window[Z].inspect(),Z);
 const me=st.active.find(r=>r.keys.length>=8)||st.active[0];
 ok(st.active.length>=3,'ⓐ 상태 표시 대상 '+st.active.length+'명(영웅 + 적 둘): '+JSON.stringify(st.active));
 ok(me&&me.keys.length===9,'ⓐ 영웅: 9종 모두 따로 ('+(me&&me.keys.join(','))+')');
 const ov=fx.filter(x=>/status-overlay/.test(x.img)),ic=fx.filter(x=>/status-icons/.test(x.img));
 const ovKeys=new Set(ov.map(x=>x.id.split(':').pop()));ok(ovKeys.size>=9,'ⓐ 몸 위 오버레이가 상태마다 따로 그려짐 ('+[...ovKeys].join(',')+')');
 const hud=await p.evaluate(()=>{const c=document.getElementById('r1153-status-hud');if(!c)return null;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n;});
 ok(ic.length===0&&hud>500&&st.stats.icons>=14,'ⓐ 머리 위 아이콘: 화면 HUD 캔버스에 영웅 9 + 적 5칸 (칠해진 화소 '+hud+', 누적 '+st.stats.icons+')');
 ok(st.stats.errors===0,'ⓐ 오류 없음 ('+st.lastError+')');}
// ⓑ 사몽 발현 문양
for(const h of ['lauren','hunter','slayer','gunner']){await p.evaluate(async h=>{await ensureImages(heroPaths(h));player.hero=h;player.samong=6;window.__fx.length=0;},h);await waitT(.4);
 await p.screenshot({path:`${OUT}/sigil-${h}.png`,clip:{x:330,y:120,width:300,height:300}});const fx=await p.evaluate(()=>window.__fx.slice());
 const sg=fx.filter(x=>x.img===`assets/r1153/sigil-${h}.webp`);ok(sg.some(x=>/-back$/.test(x.id))&&sg.some(x=>/-front$/.test(x.id)),`ⓑ ${h} 사몽 문양 Dots 시트(뒤·앞) 그려짐 (${sg.length}개)`);}
await p.evaluate(()=>{player.samong=0;});
// ⓒ 기억사수 R 조준 고리
{await p.evaluate(()=>{player.hero='gunner';const P=window.__STORYWORLD_PROGRESSION_R62__,st=P?.state?.(player);if(st)for(const s of 'QWER')st.ranks['skill'+s+'R663']=1;window.__fx.length=0;});
 const r=await p.evaluate(()=>window.__STORYWORLD_GUNNER_ARMS_R561__?.fire?.('r',false));await waitT(.5);await p.screenshot({path:`${OUT}/gunner-reticle.png`,clip:{x:180,y:40,width:600,height:380}});
 const fx=await p.evaluate(()=>window.__fx.slice());ok(r===true&&fx.some(x=>/gunner-reticle/.test(x.img)),'ⓒ 기억사수 R 폭격 대기 동안 Dots 조준 고리 (발사 '+r+', '+fx.filter(x=>/gunner-reticle/.test(x.img)).length+'개)');}
ok(errs.length===0,'ⓓ 페이지 오류 없음 '+JSON.stringify(errs.slice(0,3)));
await b.close();console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
