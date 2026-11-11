// 사몽 발현 중 네온·미카엘라·서하 몸 둘레 문양(Dots CX-0064T 시트) 헤드리스 장면 + 시트 그리기 확인. OUT=접두어.
import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.env.OUT||'/tmp/sigil';let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r183.scene3d':'{"on":true}'}});
await go(p,'dist00');
const API={neon:'__STORYWORLD_NEON_TOXIC_R562__',michaela:'__STORYWORLD_MICHAELA_GENESIS_R563__',seoha:'__STORYWORLD_SEOHA_CHRONO_R564__'};
for(const hero of ['neon','michaela','seoha']){
 await p.evaluate(async(hero)=>{await ensureImages(heroPaths(hero));player.hero=hero;player.hp=99999;player.samong=30;room.enemies.forEach(e=>{if(!e.boss){e.hp=0;e.dead=true;}});
  const pre={neon:'r562',michaela:'r563',seoha:'r564'}[hero];await ensureImages(['back','front'].map(L=>`assets/${pre}/dots/${hero}-sigil-${L}.webp`));},hero);
 const t0=await p.evaluate(()=>time);await p.waitForFunction(t0=>time>t0+.6,t0,{timeout:120000}).catch(()=>{});
 const n=await p.evaluate(a=>window[a].inspect().stats.sigils||0,API[hero]);ok(hero+': sigil sheet drawn during samong surge ('+n+')',n>0);
 const err=await p.evaluate(a=>window[a].inspect().stats.errors,API[hero]);ok(hero+': no errors',err===0);
 await p.screenshot({path:`${out}-${hero}.jpg`,quality:85,clip:{x:330,y:120,width:300,height:300}});}
await b.close();process.exit(fail?1:0);
