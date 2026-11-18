'use strict';
// R1148 CPU 검사 — 무한 생존 영웅 배치 창(R720)에서 777 → 히든 영웅 EGO·페르소나 해금·배치·교대.
//  사용자 2026-11-18 07:35Z "무한생존모드에서 영웅배치 칸에서 777그냥 누르면 히든영웅에고 랑 페르소나영웅 추가되고 배치및 전환 가능하게 버그없이 서사순서상관없이 잘적용해줘"
//  ① 빌드 연결 ② 777(키·모바일 제목 7연타)·경계값 ③ 순수 규칙(형상 영웅 목록·가격·교대) — R1148b(사용자 07:59Z): 같은 몸 금지 규칙은 없앴다(환도·EGO·라우렌·페르소나는 서로 다른 영웅)
//  ④ 가짜 엔진 위 동작(몸 = 원래 영웅 + 형상 표식, 교대, 엔진 영웅 창 전환, asHero·has) ⑤ 회귀(해금 전 목록 그대로)
//  가짜 엔진은 R720 CPU 검사의 mk() 를 그대로 가져와 형상 API(EGO R1046·페르소나 R1113)와 시계만 덧붙인다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x));}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='hero-defense-r720.js',src=rd(path.join(R,'client-source',NAME));
const t720=rd(path.join(R,'qa/r720/r720-cpu-check.cjs'));
const a0=t720.indexOf('const HEROES='),a1=t720.indexOf('\nconst base=mk();');
let mkText=t720.slice(a0,a1).replace('vm.createContext(sb);','if(o.pre)o.pre(sb);vm.createContext(sb);').replace('return {sb,sv,key,','return {sb,sv,key,listeners,');
const {HEROES,mk}=new Function('vm','src','NAME',mkText+'\nreturn {HEROES,mk};')(vm,src,NAME);

// ── ① 빌드 연결 ──
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1148/r1148-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(/R1148/.test(src),'R720 파일에 R1148 표시');

// 형상 API 흉내: unlock(이유) 기록, 끄기(off)면 해금돼도 안 보임
function forms(sb,o={}){const mkF=(field,base,name,portrait,on)=>{const s={on,off:false,reasons:[]};return {s,api:Object.freeze({field,base,unlocked:()=>!s.off&&s.on,unlock:r=>{s.reasons.push(r);s.on=true;return true;},profile:{name,portrait,color:'#cc3428'},data:{profile:{name,portrait,color:'#c8323f'}}})};};
 const e=mkF('egoSovereignR1046','hwando','EGO','assets/r1046/ego-portrait.webp',!!o.ego),p=mkF('personaHeroR1113','lauren','페르소나','assets/rc133/art/awake-0.png',!!o.persona);
 sb.__STORYWORLD_EGO_SOVEREIGN_R1046__=e.api;sb.__STORYWORLD_PERSONA_HERO_R1113__=p.api;return {ego:e.s,persona:p.s};}
function M(o={}){let F=null;const clock={t:1000};const m=mk({...o,pre:sb=>{F=forms(sb,o);sb.performance={now:()=>clock.t};if(o.p)Object.assign(sb.player,o.p);}});m.F=F;m.clock=clock;
 m.seven=(extra={})=>m.key('7',{code:'Digit7',...extra});
 m.tapTitle=(onTitle=true)=>{const ev={type:'click',target:{closest:s=>onTitle&&/#r720Panel h2/.test(s)?{}:null}};for(const f of m.listeners.click||[])f(ev);};
 m.lastHtml=()=>m.sb.calls.open[m.sb.calls.open.length-1]||'';return m;}

// ── ② 777 ──
{const m=M();const A=m.api;
 ok(!A.pure.order().includes('ego')&&!A.pure.order().includes('persona'),'해금 전: 배치 목록에 EGO·페르소나 없음',A.pure.order());
 // 창이 닫혀 있으면(전투 중 7 = 스킬 키) 세지 않는다
 m.seven();m.clock.t+=100;m.seven();m.clock.t+=100;m.seven();
 ok(m.F.ego.reasons.length===0&&m.F.persona.reasons.length===0,'배치 창이 닫혀 있으면 777 무시');
 ok(A.open()===true,'배치 창 열림');
 ok(!/data-r720buy="ego"/.test(m.lastHtml()),'해금 전 창에 EGO 칸 없음');
 // 경계: 간격 1.5초 넘음 → 처음부터
 m.seven();m.clock.t+=1501;m.seven();m.clock.t+=1501;m.seven();
 ok(m.F.ego.reasons.length===0,'간격 1.5초 초과면 해금 안 됨');
 // 다른 키가 끼면 처음부터
 m.clock.t+=5000;m.seven();m.clock.t+=100;m.key('8',{code:'Digit8'});m.clock.t+=100;m.seven();m.clock.t+=100;m.seven();
 ok(m.F.ego.reasons.length===0,'7·8·7·7 은 해금 안 됨');
 // 자동 반복·수정 키 낀 7 은 세지 않음
 m.clock.t+=5000;m.seven();m.clock.t+=100;m.seven({repeat:true});m.clock.t+=100;m.seven({shiftKey:true});
 ok(m.F.ego.reasons.length===0,'자동 반복·Shift 7 은 세지 않음');
 // 정상: 1.5초 간격 정확히(경계 포함)
 m.clock.t+=5000;m.seven();m.clock.t+=1500;m.seven();m.clock.t+=1500;const opens=m.sb.calls.open.length;m.seven();
 ok(m.F.ego.reasons.includes('secret-777')&&m.F.persona.reasons.includes('secret-777'),'777 → EGO·페르소나 둘 다 해금(이유 secret-777)',{e:m.F.ego.reasons,p:m.F.persona.reasons});
 ok(m.sb.calls.open.length>opens&&/data-r720buy="ego"/.test(m.lastHtml())&&/data-r720buy="persona"/.test(m.lastHtml()),'창을 다시 그려 EGO·페르소나 영입 칸이 바로 보임');
 ok(/EGO/.test(m.lastHtml())&&/페르소나/.test(m.lastHtml()),'칸 이름 EGO·페르소나');
 ok(A.pure.order().slice(-2).join()==='ego,persona','해금 뒤 목록 끝에 EGO·페르소나',A.pure.order());
 const ev=m.seven();ok(ev.prevented===true,'창 안 7 은 기본 동작 막음(스킬 키로 새지 않게)');}
// 텐키 7 도 된다 / 모바일 제목 7연타
{const m=M();m.api.open();for(let i=0;i<3;i++){m.key('7',{code:'Numpad7'});m.clock.t+=200;}ok(m.F.ego.reasons.length===1,'텐키 7·7·7 도 해금');}
{const m=M();m.api.open();for(let i=0;i<6;i++){m.tapTitle();m.clock.t+=200;}ok(m.F.ego.reasons.length===0,'제목 6번 탭은 아직');
 m.tapTitle(false);m.clock.t+=200;for(let i=0;i<6;i++){m.tapTitle();m.clock.t+=200;}ok(m.F.ego.reasons.length===0,'다른 곳 탭이 끼면 처음부터');
 m.tapTitle();ok(m.F.ego.reasons.includes('secret-777')&&m.F.persona.reasons.includes('secret-777'),'제목 7연타(모바일) → 둘 다 해금');}
// 서사 순서 무관: 스토리 진행 값 없이도(이미 다른 길로 해금돼 있어도) 같은 결과, 두 번 눌러도 문제 없음
{const m=M({ego:true});m.api.open();for(let k=0;k<2;k++)for(let i=0;i<3;i++){m.seven();m.clock.t+=100;}
 ok(m.F.persona.reasons.length>=1&&m.api.pure.order().filter(x=>x==='ego').length===1,'EGO 만 해금돼 있던 상태에서도 777 → 페르소나 추가, EGO 중복 없음');}

// ── ③ 순수 규칙 ──
{const m=M({ego:true,persona:true}),P=m.api.pure;
 ok(P.order(HEROES).join()==='hwando,seoha,neon,michaela,lauren,hunter,slayer,gunner,ego,persona','해금 뒤 순서: 기본 8 + EGO + 페르소나',P.order(HEROES));
 ok(P.price('ego',HEROES)===300&&P.price('persona',HEROES)===300,'가격: 새 영웅 기본값 300');
 ok(P.price('michaela',HEROES)===280&&P.tier('michaela',HEROES)===1+.04*7,'기존 영웅 가격·위력 배수 그대로');
 ok(P.slotStats({hero:'ego',lv:1,rangeLv:0,radiusLv:0},HEROES).range===HEROES.hwando.range&&P.slotStats({hero:'persona',lv:1,rangeLv:0,radiusLv:0},HEROES).melee===true,'EGO 사거리=환도, 페르소나 근거리=라우렌');
 ok(P.baseOf('ego')==='hwando'&&P.baseOf('persona')==='lauren'&&P.baseOf('neon')==='neon','형상 → 원래 영웅');
 ok(P.idOf({hero:'hwando',egoSovereignR1046:true})==='ego'&&P.idOf({hero:'lauren',personaHeroR1113:true})==='persona'&&P.idOf({hero:'hwando',personaHeroR1113:true})==='hwando'&&P.idOf({hero:'hwando'})==='hwando','플레이어 → 배치 id(형상 표식은 맞는 원래 영웅일 때만)');
 const env={centre:{x:0,y:0},range:5};
 let st=P.fresh('hwando');st.crystals=9999;ok(P.doBuy(st,'ego',HEROES).ok,'EGO 영입');
 let r=P.doPlace(st,'ego',{x:2,y:0},env);ok(r.ok,'R1148b: 환도 조종 중에도 EGO 배치 가능',r);
 st=P.fresh('hunter');st.crystals=9999;P.doBuy(st,'ego',HEROES);P.doBuy(st,'hwando',HEROES);P.doBuy(st,'persona',HEROES);P.doBuy(st,'lauren',HEROES);
 ok(P.doPlace(st,'ego',{x:2,y:0},env).ok,'헌터 조종 중 EGO 배치 가능');
 r=P.doPlace(st,'hwando',{x:-2,y:0},env);ok(r.ok,'R1148b: EGO 배치 중 환도도 배치 가능',r);
 ok(P.doPlace(st,'persona',{x:0,y:2},env).ok,'페르소나 배치 가능');
 r=P.doReplace(st,0,'lauren',HEROES);ok(r.ok&&st.slots[0].hero==='lauren'&&st.slots.some(x=>x.hero==='persona'),'R1148b: 페르소나가 다른 자리에 있어도 라우렌으로 바꾸기 가능(둘 다 배치)',st.slots);
 r=P.doReplace(st,1,'lauren',HEROES);ok(!r.ok&&r.why==='placed','이미 배치된 영웅(라우렌)으로는 바꾸지 않음',r);
 // 교대: 형상으로 바꾸면 같은 몸 자리의 영웅과 맞바꿈
 st=P.fresh('hunter');st.crystals=9999;P.doBuy(st,'ego',HEROES);P.doPlace(st,'ego',{x:2,y:0},env);
 r=P.onHeroChange(st,'ego');ok(r.swapped&&st.main==='ego'&&st.slots[0].hero==='hunter','EGO 로 교대 → 헌터가 EGO 자리',st);
 r=P.onHeroChange(st,'hwando');ok(!r.swapped&&st.main==='hwando'&&st.slots[0].hero==='hunter'&&st.owned.ego===true,'EGO→환도(같은 몸) 바꾸기: 자리 그대로, 보유 유지',st);
 st=P.fresh('hunter');P.doBuy(Object.assign(st,{crystals:999}),'ego',HEROES);P.doPlace(st,'ego',{x:2,y:0},env);
 r=P.onHeroChange(st,'hwando');ok(!r.swapped&&st.main==='hwando'&&st.slots[0].hero==='ego','R1148b: EGO 배치 중 엔진 창으로 환도 고름 → EGO 는 자리에 그대로(서로 다른 영웅)',st);}

// ── ④ 가짜 엔진 위 동작 ──
{const m=M({ego:true,persona:true,hero:'hunter'}),A=m.api,sb=m.sb;A.qaGive(2000);
 let r=A.buy('ego');ok(r.ok&&r.placed===false||r.ok,'창에서 EGO 영입',r);
 if(!A.state().slots.length){sb.player.x=52;sb.player.y=50;A.placeHere('ego');}
 ok(A.state().slots[0]?.hero==='ego','EGO 가 자리 0 에',A.state().slots);
 sb.room.enemies=[{id:'e1',x:sb.room.survivalR600.centre.x+2,y:sb.room.survivalR600.centre.y+.5,hp:1e6,maxHp:1e6}];
 m.run(1.5);const b=A.bodies()[0];
 ok(!!b&&b.hero==='hwando'&&b.egoSovereignR1046===true&&b.personaHeroR1113!==true,'EGO 몸 = 환도 + EGO 표식',b&&{h:b.hero,e:b.egoSovereignR1046,p:b.personaHeroR1113});
 ok(sb.calls.attack.some(c=>c.ally&&c.hero==='hwando'),'EGO 몸이 엔진 공격을 부름');
 ok(sb.player.hero==='hunter'&&sb.player.egoSovereignR1046!==true,'조종 영웅(헌터)은 그대로');
 ok(sb.calls.ensure.some(p=>p.includes('hwando/i')),'EGO 그림 읽기는 환도 그림 경로로');
 let seen=null;A.asHero('hwando',()=>{seen=sb.player;});ok(seen===b,'asHero(환도) → EGO 몸으로 돈다(환도 덧씌우기 이어 가기)');
 ok(A.has('hwando')===true&&A.has('ego')===true,'has(환도)·has(ego) 참');
 // 교대: EGO 를 조종 영웅으로
 (async()=>{const s=await A.swapTo(0);const t=A.state();
  ok(s.ok&&sb.player.hero==='hwando'&&sb.player.egoSovereignR1046===true&&sb.player.personaHeroR1113!==true&&t.main==='ego'&&t.slots[0].hero==='hunter','교대 단추: 조종 = EGO(환도+표식), 헌터가 그 자리',{s,t,h:sb.player.hero,e:sb.player.egoSovereignR1046});
  m.run(.2);ok(A.state().main==='ego'&&A.state().slots[0].hero==='hunter','다음 틱에도 EGO 유지(되돌림 없음)',A.state());
  // EGO 조종 중 헌터 몸에는 EGO 표식이 새지 않음
  const hb=A.bodies()[0];ok(!!hb&&hb.hero==='hunter'&&hb.egoSovereignR1046!==true,'헌터 몸에 EGO 표식 없음',hb&&{h:hb.hero,e:hb.egoSovereignR1046});
  // 엔진 영웅 창으로 페르소나 고름(라우렌 + 표식) — 같은 몸 겹침 없는 보통 교대
  sb.player.hero='lauren';sb.player.egoSovereignR1046=false;sb.player.personaHeroR1113=true;m.run(.1);
  ok(A.state().main==='persona'&&A.state().owned.ego===true,'엔진 창에서 페르소나로 바꾸면 조종 = 페르소나',A.state());
  // 페르소나를 자리에 놓고 다시 교대
  A.qaGive(2000);sb.player.hero='neon';sb.player.personaHeroR1113=false;m.run(.1);
  ok(A.state().main==='neon','네온으로 바꿈');
  sb.player.x=sb.room.survivalR600.centre.x-2;sb.player.y=sb.room.survivalR600.centre.y;const pl=A.placeHere('persona');
  ok(pl.ok,'보유한 페르소나 배치',pl);m.run(.5);const pb=A.bodies().find(x=>x&&x.hero==='lauren');
  ok(!!pb&&pb.personaHeroR1113===true&&pb.egoSovereignR1046!==true,'페르소나 몸 = 라우렌 + 페르소나 표식',pb&&{p:pb.personaHeroR1113,e:pb.egoSovereignR1046});
  const i=A.state().slots.findIndex(s=>s.hero==='persona');const s2=await A.swapTo(i);
  ok(s2.ok&&sb.player.hero==='lauren'&&sb.player.personaHeroR1113===true&&A.state().main==='persona'&&A.state().slots[i].hero==='neon','페르소나로 교대 → 네온이 그 자리',A.state());
  // 형상 조종 중 일반 영웅으로 교대하면 형상 표식이 꺼진다
  const j=A.state().slots.findIndex(s=>s.hero==='hunter');const s3=await A.swapTo(j);
  ok(s3.ok&&sb.player.hero==='hunter'&&sb.player.personaHeroR1113!==true&&A.state().main==='hunter','페르소나→헌터 교대: 표식 꺼짐',{h:sb.player.hero,p:sb.player.personaHeroR1113,t:A.state()});
  finish();})();}
// 처음부터 EGO 로 시작한 판: 조종 = ego, 환도 영입 칸은 같은 몸이라 배치 불가
{const m=M({ego:true,hero:'hwando',p:{egoSovereignR1046:true}});m.api.open();
 ok(m.api.state().main==='ego','EGO 로 시작한 판의 조종 = ego',m.api.state());
 ok(/조종 중/.test(m.lastHtml())&&!/data-r720buy="ego"/.test(m.lastHtml()),'EGO 칸은 조종 중으로 표시');}
// 렌더 감싸기 처리기(페르소나 R1113.process·EGO R1139b/R1139/R1099.process)를 배치 몸의 그리기 명령에만, 몸을 player 로 끼운 채 돌린다
{const m=M({persona:true,hero:'hunter'}),A=m.api,sb=m.sb;sb.ctx.commands=[{kind:'image',owner:{kind:'hero',id:'hero:main'},tag:'before'}];
 const seen=[];const P0=sb.__STORYWORLD_PERSONA_HERO_R1113__;sb.__STORYWORLD_PERSONA_HERO_R1113__=Object.freeze({...P0,process:cmds=>{seen.push({hero:sb.player.hero,form:sb.player.personaHeroR1113===true,ally:sb.player.r720Ally===true,tags:cmds.map(c=>c.tag)});for(const c of cmds)if(c.tag==='body')c.swapped=true;return 1;}});
 const dh=sb.drawHero;sb.drawHero=()=>{dh();sb.ctx.commands.push({kind:'image',owner:{kind:'hero',id:'hero:ally'},tag:'body',points:[[0,0],[1,0],[1,1],[0,1]]});};
 A.qaGive(999);sb.player.x=52.5;sb.player.y=51;A.buy('persona');m.run(.3);
 const prop=sb.room.props.find(q=>q&&q.r720AllyProp);ok(!!prop,'페르소나 몸 소품 있음');if(prop)sb.drawProp(prop);
 ok(seen.length>=1&&seen.every(x=>x.hero==='lauren'&&x.form&&x.ally),'처리기는 페르소나 몸(라우렌+표식)을 player 로 둔 채 돈다',seen);
 ok(seen.length>=1&&seen.every(x=>!x.tags.includes('before')&&x.tags.includes('body')),'처리기에는 그 몸이 쌓은 명령만 넘어간다(앞선 조종 영웅 명령 제외)',seen);
 ok(sb.ctx.commands[0].tag==='before'&&!sb.ctx.commands[0].swapped&&sb.ctx.commands.some(c=>c.tag==='body'&&c.swapped),'처리 결과가 프레임 명령에 되돌아감',sb.ctx.commands.map(c=>[c.tag,!!c.swapped]));
 ok(sb.player.hero==='hunter'&&sb.player.r720Ally!==true,'그린 뒤 조종 영웅 복귀');
 // 일반 영웅 몸에는 처리기를 부르지 않는다
 const n0=seen.length;A.qaGive(999);sb.player.x=47.5;sb.player.y=51;A.buy('neon');m.run(.3);const pn=sb.room.props.filter(q=>q&&q.r720AllyProp)[1];if(pn)sb.drawProp(pn);
 ok(seen.length===n0,'일반 영웅(네온) 몸은 형상 처리기 안 탐',seen.length-n0);}
// R1148b asOwner·alive: 이어지는 기술은 쓴 몸으로만
{const m=M({ego:true,hero:'hwando'}),A=m.api,sb=m.sb;A.qaGive(999);sb.player.x=52.5;sb.player.y=51;const r=A.buy('ego');m.run(.3);const eb=A.bodies()[0],main=sb.player;
 ok(r.ok&&!!eb&&eb.hero==='hwando'&&eb.egoSovereignR1046===true&&main.hero==='hwando'&&main.egoSovereignR1046!==true,'환도 조종 + EGO 배치(몸 둘 다 환도 기술 틀)',r);
 ok(A.asOwner(eb,()=>sb.player)===eb&&sb.player===main,'asOwner(EGO 몸) → 그 몸으로 돌고 조종 환도로 복귀');
 ok(A.asOwner(main,()=>sb.player)===main,'asOwner(조종 환도) → 조종 환도로');
 ok(A.asOwner(eb,()=>A.asOwner(main,()=>sb.player))===main&&sb.player===main,'몸 안에서 조종 영웅 몫을 부르면 조종 영웅으로 잠깐 돌아감');
 ok(A.alive(eb)&&A.alive(main)&&!A.alive({hero:'hwando'}),'alive: 조종·배치 몸은 참, 판에 없는 몸은 거짓');
 const stale={hero:'hwando'};ok(A.asOwner(stale,()=>1)===undefined,'판에 없는 몸의 일은 부르지 않음');
 A.remove(0);ok(!A.alive(eb)&&A.asOwner(eb,()=>1)===undefined,'배치 해제된 몸의 일은 부르지 않음');}
// ⑤ 회귀: 형상 API 가 없거나 꺼져 있으면 예전과 똑같다
{const m=mk({});ok(m.api.pure.order().join()==='hwando,seoha,neon,michaela,lauren,hunter,slayer,gunner','형상 API 없으면 목록 8명 그대로');
 m.api.open();for(let i=0;i<3;i++)m.key('7',{code:'Digit7'});ok(m.api.inspect().lastError===null,'API 없을 때 777 도 오류 없음',m.api.inspect().lastError);}
{const m=M({ego:true,persona:true});m.F.ego.off=true;ok(!m.api.pure.order().includes('ego')&&m.api.pure.order().includes('persona'),'EGO 끄기(off)면 목록에서 빠짐');}
function finish(){console.log('\n'+(n-bad)+'/'+n+(bad?' — 실패 '+bad:' — 모두 통과'));process.exit(bad?1:0);}
