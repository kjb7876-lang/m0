// R975 브라우저 확인(헤드리스 소프트웨어 렌더링, 귀로 듣는 검증·GPU 검증 아님): 실제 엔진 ep1a08 보스 앞에서 환도 E 를 써서
// 보스 우선 7타·좌우 베기·타마다 효과음 요청·E 돌진 그대로인지 본다. SW_URL 로 정적 서버 지정(기본 127.0.0.1:4410/m0/).
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.env.SHOT_DIR||'.';let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});p.on('pageerror',e=>errs.push(String(e)));
await go(p,process.env.ZONE||'ep1a08');
const r=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;
 if(player.hero!=='hwando')await switchHero('hwando');await wait(800);modal=null;player.hp=player.maxHp=99999;
 const boss=room.enemies.find(e=>e.boss&&e.hp>0)||room.enemies.find(e=>e.midboss&&e.hp>0);if(!boss)return {noBoss:room.enemies.length};
 boss.spawnState='active';boss.speed=0;boss.moveSpeed=0;boss.hp=boss.maxHp=Math.max(boss.hp,500000);
 for(const e of room.enemies)if(e!==boss){e.speed=0;e.moveSpeed=0;}
 // 보스 쪽으로 4칸 떨어진 빈 자리(벽 없음)
 let spot=null;for(let k=0;k<32&&!spot;k++){const a=k/32*Math.PI*2,x=boss.x+Math.cos(a)*4,y=boss.y+Math.sin(a)*4;if(!blocked(x,y,.3,room)&&clearLine({x,y},boss,room))spot={x,y};}
 if(!spot)return {noSpot:true};player.x=spot.x;player.y=spot.y;target=boss;
 const hits=[];const H=hitEnemy;hitEnemy=function(e,v,s){if(s&&s.r975)hits.push({boss:e===boss,i:s.multiHit?.i,v:Math.round(v),t:+time.toFixed(3)});return H.apply(this,arguments);};
 const snd=[];const S0=sound;sound=function(k,...a){if(/^r975/.test(k))snd.push({k,t:+time.toFixed(3)});return S0.call(this,k,...a);};
 const p0={x:player.x,y:player.y};const cast=__STORYWORLD_WER__.cast('e');const t0=time;window.__r975t0=t0;
 const st=Date.now();while(time-t0<1.6&&Date.now()-st<40000)await wait(50);
 hitEnemy=H;sound=S0;const C=window.__STORYWORLD_SFX_COMFORT__?.inspect?.();
 return {cast:!!cast,bossName:boss.name,moved:+Math.hypot(player.x-p0.x,player.y-p0.y).toFixed(2),hits,snd,api:window.__STORYWORLD_HWANDO_ILSEOM_R975__.inspect(),r590:window.__STORYWORLD_HWANDO_CHAIN_R590__.inspect().stats,
  plays:(C?.audit||[]).filter(x=>x.kind==='play'&&/r975/.test(x.path||'')).map(x=>x.path.split('/').pop())};});
console.log(JSON.stringify(r,null,0).slice(0,2500));
ok(!r.noBoss&&!r.noSpot,'보스·빈 자리 있음 '+(r.bossName||''));
ok(r.cast,'E 시전됨');ok(r.moved>0.5,'E 돌진으로 영웅이 움직임(돌진 그대로) '+r.moved);
const hb=(r.hits||[]).filter(h=>h.boss);ok(hb.length===7,'보스 7타 ('+hb.length+')');
ok(r.api?.stats?.bossFirst>=1,'보스 우선 잡음');ok((r.api?.lastCuts||[]).map(c=>c.dir).join()==='1,-1,1,-1,1,-1,1','좌우 번갈아 7번');
ok((r.snd||[]).length===7,'타마다 효과음 요청 7개 ('+(r.snd||[]).length+')');
ok(!errs.length&&!r.api?.stats?.errors,'페이지·R975 오류 0 '+errs.slice(0,2));
if(process.env.SHOT_DIR){for(const k of [2,3,7]){await p.evaluate(()=>{const A=window.__STORYWORLD_HWANDO_ILSEOM_R975__;const b=room.enemies.find(e=>e.boss&&e.hp>0);let s=null;for(let i=0;i<32&&!s;i++){const a=i/32*Math.PI*2,x=b.x+Math.cos(a)*4,y=b.y+Math.sin(a)*4;if(!blocked(x,y,.3,room)&&clearLine({x,y},b,room))s={x,y};}player.x=s.x;player.y=s.y;target=b;player.specialCD=0;for(const k in player)if(/CD$|Cd$|cooldown/i.test(k)&&typeof player[k]==='number')player[k]=0;window.__c0=A.inspect().stats.cuts;__STORYWORLD_WER__.cast('e');});
  await p.waitForFunction(k=>window.__STORYWORLD_HWANDO_ILSEOM_R975__.inspect().stats.cuts>=window.__c0+k,k,{timeout:60000,polling:5}).catch(()=>{});await p.screenshot({path:OUT+'/r975-cut'+k+'.png'});}}
console.log(`\nR975 browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
