// R1325b 브라우저 검사(헤드리스 Chromium + SwiftShader — 그래픽 검증 아님).
//  ① 태엽 수집자(cult06): 3D 몹 설정을 켜도 2D 그대로(사용자 "위세개는 a가낫고")
//  ② 붉은 하이힐의 서윤(ep1b05): 3D 보스는 나오되 R1325 손질이 안 붙음(사용자 "서윤과 회장은 b가더 나아")
//  ③ 효과 따로 켜기: setParts('bi') 뒤 다른 3D 몹 재질 캐시 키가 '-bi'(명암·먹만), 넷 다 끄면 손질 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1325b/r1325b-browser.mjs`
import {chromium,boot,go,skip} from '../r444/lib.mjs';
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r1322.mob3d':'on','storyworld.r1322c.boss3d':'on','storyworld.r1325.mobstyle':'on'}});p.on('pageerror',e=>errs.push(String(e)));
const pick=async(zone,name,boss)=>{await go(p,zone);await skip(p);return p.evaluate(([name,boss])=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
 const s=room.enemies.find(e=>(boss||!e.boss)&&e.hp>0&&String(e.name).replace(/^중간보스 · /,'')===name);if(!s)return null;
 s.hp=s.maxHp=1e7;s.speed=0;s.visible=true;if('spawnState'in s)s.spawnState='active';s.x=player.x+.9;s.y=player.y-1.1;s.homeX=s.x;s.homeY=s.y;s.nav=[];return String(s.id);},[name,boss]);};
const keys=(G)=>p.evaluate(G=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three;const out=[];for(const g of r.scene.children)if(G.test(g.name))g.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))out.push(m.customProgramCacheKey?String(m.customProgramCacheKey()):'');});return out;},G);
// ① 태엽 수집자
const c1=await pick('cult06','태엽 수집자',0);ok(!!c1,'cult06 태엽 수집자 찾음');
await p.waitForTimeout(8000);
const r1=await p.evaluate(id=>({inst:window.__STORYWORLD_MOB3D_R1322__.inspect().instances.filter(x=>x.id===id).length,use2D:window.__STORYWORLD_MOB3D_STYLE_R1325__.use2D('clockwork')}),c1);
ok(r1.use2D&&r1.inst===0,'태엽 수집자는 3D 로 안 바뀜(2D 그대로) '+JSON.stringify(r1));
// ③ 효과 따로 — cult05 'ID 배양 점액체'(3D, R1322)
await pick('cult05','ID 배양 점액체',0);
const any=await p.waitForFunction(()=>window.__STORYWORLD_MOB3D_R1322__.inspect().instances.some(x=>x.visible),null,{timeout:200000}).then(()=>true).catch(()=>false);
if(any){await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.setParts('bi'));await p.waitForTimeout(1500);
 const k=(await keys(/^r1322-mob3d:/)).filter(s=>s.includes('r1325'));ok(k.length>0&&k.every(s=>/-bi$/.test(s)),'setParts(bi) → 손질 키가 명암·먹만('+k.length+')');
 await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.setParts('-'));await p.waitForTimeout(1500);
 ok((await keys(/^r1322-mob3d:/)).every(s=>!s.includes('r1325')),'넷 다 끄면 손질 0');
 await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.setParts('fbit'));}
else ok(false,'cult05 3D 몹 안 나옴');
// ② 서윤
const c2=await pick('ep1b05','붉은 하이힐의 서윤',1);ok(!!c2,'ep1b05 서윤 찾음');
const vis=await p.waitForFunction(id=>window.__STORYWORLD_BOSS3D_R1322C__.inspect().instances.some(x=>x.id===id&&x.visible),c2,{timeout:200000}).then(()=>true).catch(()=>false);
ok(vis,'서윤 3D 는 나옴(B)');await p.waitForTimeout(2500);
const k2=await keys(new RegExp('^r1322c-mob3d:'+c2+'$'));ok(k2.length>0&&k2.every(s=>!s.includes('r1325')),'서윤 재질에 R1325 손질 없음('+k2.length+')');
const ins=await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.inspect());ok(!ins.lastError&&!errs.length,'오류 0 '+(ins.lastError||errs[0]||''));
await b.close();console.log(fail?'R1325b browser FAIL '+fail:'R1325b browser ALL OK');process.exit(fail?1:0);
