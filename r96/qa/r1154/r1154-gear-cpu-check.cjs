'use strict';
// R1154 CPU 검사 — 고유무기(R1032) 강화 단계·이름·그림을 EGO·페르소나가 환도·라우렌과 따로 쓴다.
//  사용자 2026-11-18 07:59Z·08:00Z "같은 몸 … 개선 … 모든모드에서 구분되게 각각 독립적이게", 08:12Z 카드 '상태만 따로'.
//  가짜 엔진은 R1032 CPU 검사의 mk() 를 그대로 가져와 형상 API(EGO R1046·페르소나 R1113)만 덧붙인다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..');let n=0,bad=0;
const ok=(c,m,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x).slice(0,300));}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const F='gear-r1032.js',API='__STORYWORLD_GEAR_R1032__',src=rd(path.join(R,'client-source',F));
const t=rd(path.join(R,'qa/r1032/r1032-cpu-check.cjs'));const a0=t.indexOf('const HEROES='),a1=t.indexOf('\n// ── ② 순수 규칙 ──');
const mkText=t.slice(a0,a1).replace('vm.createContext(sb);','if(o.pre)o.pre(sb);vm.createContext(sb);');
const {mk}=new Function('vm','src','API',mkText+'\nreturn {mk};')(vm,src,API);
function forms(sb,on=true){const mkF=(field,base)=>Object.freeze({field,base,unlocked:()=>on,formActive:()=>!!(on&&sb.player&&sb.player.hero===base&&sb.player[field]===true)});
 sb.__STORYWORLD_EGO_SOVEREIGN_R1046__=mkF('egoSovereignR1046','hwando');sb.__STORYWORLD_PERSONA_HERO_R1113__=mkF('personaHeroR1113','lauren');}
const M=(o={})=>mk({...o,survival:true,svLv:30,pre:sb=>forms(sb,o.on!==false)});

ok(src.length>0&&rd(path.join(R,'runtime-text',F))===src,'runtime-text 사본 = client-source');
// EGO 로 강화 → 환도 단계는 그대로
{const m=M({hero:'hwando'}),A=m.api,sb=m.sb;A.qaGive(1e6);
 sb.player.egoSovereignR1046=true;let r=A.upgrade('weapon');
 ok(r.ok&&r.hero==='ego'&&A.levels().weapon.ego===1&&A.levels().weapon.hwando===0,'EGO 형상으로 강화 → EGO 무기 1단계, 환도 0단계',{r,w:A.levels().weapon});
 ok(A.inspect().levels.weapon===1,'EGO 일 때 적용 단계 = EGO 것(1)');
 sb.player.egoSovereignR1046=false;ok(A.inspect().levels.weapon===0,'환도로 바꾸면 적용 단계 = 환도 것(0)');
 r=A.upgrade('weapon');r=A.upgrade('weapon');ok(A.levels().weapon.hwando===2&&A.levels().weapon.ego===1,'환도 강화는 EGO 단계를 바꾸지 않음',A.levels().weapon);
 sb.player.hero='lauren';sb.player.personaHeroR1113=true;r=A.upgrade('weapon');
 ok(r.ok&&r.hero==='persona'&&A.levels().weapon.persona===1&&A.levels().weapon.lauren===0,'페르소나 강화 → 페르소나 1, 라우렌 0',A.levels().weapon);
 sb.player.personaHeroR1113=false;ok(A.inspect().levels.weapon===0,'라우렌으로 바꾸면 라우렌 단계(0)');
 // 저장 → 다시 읽기
 const m2=M({hero:'hwando',store:JSON.parse(m.store['storyworld.r1032.gear'])});m2.sb.player.egoSovereignR1046=true;
 ok(m2.api.levels().weapon.ego===1&&m2.api.levels().weapon.persona===1&&m2.api.levels().weapon.hwando===2&&m2.api.inspect().levels.weapon===1,'저장·다시 읽기에서도 EGO·페르소나 단계 따로 유지',m2.api.levels().weapon);}
// 장비 창: 이름·그림이 따로, 페르소나 칸에 라우렌 흔적 없음
{const m=M({hero:'hwando'}),A=m.api,sb=m.sb;sb.player.egoSovereignR1046=true;const h=String(A.gearHtml());
 ok(/data-r1032w="ego"/.test(h)&&!/data-r1032w="hwando"/.test(h)&&/EGO/.test(h),'EGO 장비 칸 = EGO 무기(그림 칸 ego)',h.slice(0,200));
 sb.player.hero='lauren';sb.player.egoSovereignR1046=false;sb.player.personaHeroR1113=true;const h2=String(A.gearHtml());
 ok(/data-r1032w="persona"/.test(h2)&&/페르소나/.test(h2)&&!/라우렌|쌍둥이 기사창/.test(h2),'페르소나 장비 칸에 라우렌 이름·무기 없음',h2.slice(0,300));
 const W=A.pure.WEAPONS;ok(!!W.ego&&!!W.persona&&W.ego.img!==W.hwando.img&&W.persona.img!==W.lauren.img,'EGO·페르소나 무기 그림은 원래 영웅 것과 다름');}
// 회귀: 해금 안 됐거나 형상 아닐 때는 예전 그대로
{const m=M({hero:'hwando',on:false}),A=m.api,sb=m.sb;A.qaGive(1e6);sb.player.egoSovereignR1046=true;const r=A.upgrade('weapon');
 ok(r.ok&&r.hero==='hwando'&&A.levels().weapon.hwando===1&&!A.levels().weapon.ego,'EGO 미해금이면 환도 것으로(예전 동작)',A.levels().weapon);}
{const m=mk({hero:'neon',survival:true,svLv:30}),A=m.api;A.qaGive(1e6);const r=A.upgrade('weapon');ok(r.ok&&r.hero==='neon'&&A.inspect().levels.weapon===1,'형상 API 없어도 다른 영웅은 예전 그대로');}
console.log('\n'+(n-bad)+'/'+n+(bad?' — 실패 '+bad:' — 모두 통과'));process.exit(bad?1:0);
