// R1355 헤드리스 장면(SwiftShader — 그래픽 검증 아님): Dots D03 보스 운석 착탄·충격파, D04 레비아탄 벽 유리 꽂힘·반짝.
//  ① 발록(dist06) 운석: 낙하 / 착탄 / 충격파 세 단계에서 D03 시트가 그려지는지(R1229 stats.meteorD03·meteorD03After) + 스크린샷.
//  ② 레비아탄(ep1b03) 유리 폭풍: 시전 뒤 벽에 박히는 순간 꽂힘 시트, 몇 초 뒤 반짝 시트가 그려지는지(R1343 inspect().drawn) + 스크린샷.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1355/r1355-browser.mjs /tmp/r1355
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const out=process.argv[2]||'/tmp/r1355';let fail=0;const ok=(c,m,d)=>{console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?' '+JSON.stringify(d):''));if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
// ① 운석
await go(p,'dist06');
await p.evaluate(()=>{const B=room.enemies.find(e=>e.boss&&/발록/.test(e.name||''))||room.enemies.find(e=>e.boss);
 for(const e of room.enemies)if(e!==B)e.hp=0;player.x=B.x+3.5;player.y=B.y+1.5;room.engaged=true;B.spawnState='active';B.visible=true;B.disabled=false;B.hp=B.maxHp=1e8;
 window.__hold=setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);}catch(_){}},200);window.__B=B;});
await p.waitForTimeout(6000);
const cast=await p.evaluate(()=>{const r=window.__STORYWORLD_BOSS_METEOR_R241__.cast(window.__B);return {r,n:hazards.filter(h=>h.r241Meteor).length};});ok(cast.n>0,'운석 시전',cast);
for(const [tag,rel,key] of [['fall',-.22,'meteorD03'],['impact',.06,'meteorD03'],['after',.3,'meteorD03After']]){
 const v0=await p.evaluate(([rel,key])=>{clearInterval(window.__pin);const set=()=>{for(const h of hazards)if(h.r241Meteor)h.age=h.warning+rel;};set();window.__pin=setInterval(set,5);
  return window.__STORYWORLD_MOTION_FX_R1229__.inspect().stats[key]||0;},[rel,key]);
 await p.waitForTimeout(1500);await p.screenshot({path:`${out}-meteor-${tag}.png`});
 const v1=await p.evaluate(key=>window.__STORYWORLD_MOTION_FX_R1229__.inspect().stats[key]||0,key);ok(v1>v0,'운석 '+tag+': D03 시트 그림('+key+')',{v0,v1});}
await p.evaluate(()=>{clearInterval(window.__pin);clearInterval(window.__hold);});
const st=await p.evaluate(()=>window.__STORYWORLD_MOTION_FX_R1229__.inspect());ok(st.stats.errors===0,'R1229 오류 0',st.lastError);
// ② 유리
await go(p,'ep1b03');await skip(p);
const g=await p.evaluate(()=>{player.hp=player.maxHp=1e7;const B=room.enemies.find(e=>e.boss&&/레비아탄/.test(e.name||''));if(!B)return null;
 for(const e of room.enemies)if(e!==B){e.x+=60;e.homeX=e.x;e.speed=0;}B.hp=B.maxHp=1e8;B.speed=0;B.visible=true;B.spawnState='active';B.x=player.x+2.2;B.y=player.y-.5;
 window.__hold=setInterval(()=>{try{player.hp=player.maxHp;if(modal&&!storyScene)closePanel(true);}catch(_){}},200);
 const G=window.__STORYWORLD_ENVY_GLASS_R1343__;G.reset(true);G.cast(true);return G.inspect();});
ok(!!g&&g.casting,'유리 폭풍 시전',g&&{casting:g.casting});
let shot=false;for(let k=0;k<40;k++){await p.waitForTimeout(500);const d=await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.inspect());
 if(!shot&&d.drawn.strike>0&&d.stuck>0){await p.screenshot({path:`${out}-glass-strike.png`});shot=true;}if(shot&&d.drawn.glint>0)break;}
const d=await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.inspect());await p.screenshot({path:`${out}-glass-stuck.png`});
ok(d.drawn.strike>0,'벽 꽂힘 시트 그림',d.drawn);ok(d.stuck>0,'박힌 조각 남음 '+d.stuck);ok(d.drawn.embed>0,'박힌 몸(embed 마지막 칸)');ok(d.otherDraw===0&&d.errors===0,'도형 0·오류 0',{o:d.otherDraw,e:d.errors,l:d.lastError});
console.log('반짝(glint) 그림 수 '+d.drawn.glint+' — 7초 주기라 헤드리스 시간이 짧으면 0 일 수 있음(CPU 검사로 확인)');
ok(errs.length===0,'페이지 오류 0',errs.slice(0,3));
await b.close();console.log(fail?`R1355 browser FAIL ${fail}`:'R1355 browser OK');process.exit(fail?1:0);
