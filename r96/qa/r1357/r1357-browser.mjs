// R1357 헤드리스 장면(SwiftShader — 그래픽 검증 아님): 광폭화 보스 몸 뒤 Dots D07 오라. 2D 보스(발록 dist06)·3D 보스(레비아탄 ep1b03).
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1357/r1357-browser.mjs /tmp/r1357
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const out=process.argv[2]||'/tmp/r1357';let fail=0;const ok=(c,m,d)=>{console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?' '+JSON.stringify(d):''));if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
for(const [zone,re,tag] of [['dist06',/발록/,'balrog'],['ep1b03',/레비아탄/,'leviathan']]){
 await go(p,zone);if(zone==='ep1b03')await skip(p);
 const r=await p.evaluate(([src])=>{const re=new RegExp(src);const B=room.enemies.find(e=>e.boss&&re.test(e.name||''))||room.enemies.find(e=>e.boss);if(!B)return null;
  for(const e of room.enemies)if(e!==B){e.x+=60;e.homeX=e.x;e.speed=0;}player.x=B.x+3;player.y=B.y+1.2;room.engaged=true;B.spawnState='active';B.visible=true;B.disabled=false;B.maxHp=1e8;B.hp=2e7;B.speed=0;
  clearInterval(window.__hold);window.__hold=setInterval(()=>{try{player.x=B.x+3;player.y=B.y+1.2;player.hp=player.maxHp=1e7;player.invincible=99;if(B.hp<1e7)B.hp=2e7;if(modal&&!storyScene)closePanel(true);}catch(_){}},200);window.__B=B;return {name:B.name};},[re.source]);
 ok(!!r,tag+' 보스 찾음',r);
 await p.waitForTimeout(5000);
 const s=await p.evaluate(()=>({enr:!!window.__B.r205Enraged,a:window.__STORYWORLD_ENRAGE_AURA_R1357__.inspect()}));
 ok(s.enr,tag+' 광폭화 들어감');ok(s.a.ready&&s.a.drawn>0&&s.a.errors===0,tag+' D07 오라 그림',s.a);
 await p.screenshot({path:`${out}-${tag}.png`});}
ok(errs.length===0,'페이지 오류 0',errs.slice(0,3));
await b.close();console.log(fail?`R1357 browser FAIL ${fail}`:'R1357 browser OK');process.exit(fail?1:0);
