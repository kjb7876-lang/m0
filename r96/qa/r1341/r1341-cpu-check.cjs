// R1341 CPU 검사 — 사용자 2026-11-26 "천사의 가면과 의목사 후보생 보스몹 모션과 일관성 강화, 이맵에 나오는 검을든천사몹은 2d로 다시 일관성있게,
//  그리고 이맵에서 보스처치시 나오는 npc 남자의목사가아니라 미카엘라가 나오게".
//  ① ep1a11 보스 처치 뒤 제단 곁 인물 = 미카엘라(정본 개선본 "침대 곁을 보니 미카엘라가 앉아 있었다 … 의사이면서 목사인 사람"). 남자 의목사 그림·흉상·이름이 나오지 않는다.
//  ② ep1a11 은 3D 몹 설정이 켜져 있어도 늘 2D(근위천사 등 모든 몹·보스). 불면귀 마을·7대죄 규칙은 그대로.
//  ③ 루시퍼·초천사의 웃는 가면·거짓천국 근위천사 2D 일관성 표가 R1337 오버레이에 실려 있고 사본 그림이 있다.
//  정상·경계(다른 지역 그대로, ep1a10 의료진 그대로)·회귀(세이브 낱말 heardWorlds 그대로, 옛 기록 읽힘).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const J=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v,ok=(c,m)=>{assert.ok(c,m);n++;},eq=(a,b,m)=>{assert.deepStrictEqual(J(a),J(b),m);n++;};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
{const y=rd('../.github/workflows/pages.yml').split('\n'),i=y.findIndex(l=>l.includes('node r96/qa/r1341/r1341-cpu-check.cjs'));ok(i>0,'pages.yml CPU 검사 줄');ok(/^\s+- name: /.test(y[i-1])&&!y[i-1].replace(/^\s+- name: /,'').includes(': '),'단계 이름에 콜론+빈칸 없음');}
const man=rd('runtime-manifest.json');
// ── ① 미카엘라 ──
const src=rd('client-source/npc-r790.js');ok(rd('runtime-text/npc-r790.js')===src,'runtime-text 사본 같음');
const h791=rd('qa/r791/r791-cpu-check.cjs'),a=h791.indexOf('function world('),b=h791.indexOf("\n{const w=world();ok(w.api.zones()");ok(a>0&&b>a,'R791 검사 틀');
const world=new Function('vm','src','J','return '+h791.slice(a,b).trim())(vm,src,J);
const BUST='assets/r1341/npc/michaela-bust.webp',SHEET='assets/r710/michaela/idle-s.webp';
for(const f of [BUST,SHEET]){ok(fs.existsSync(path.join(R,'runtime-text',f)),f+' 파일');ok(man.includes(f),f+' 목록');}
{const w=world({zoneId:'ep1a11'});w.run('tick(.1)');const p=w.run('room.props.find(p=>p.r790NPC)');ok(p,'보스 뒤 제단 곁에 선다');eq(p.r790NPC,'michaela','인물 종류');ok(Math.hypot(p.x-15,p.y-13)<=2.4,'제단 곁');
 w.run('tick(2);drawProp(room.props.find(p=>p.r790NPC))');const d=w.log().drawn.at(-1);eq(d.path,SHEET,'미카엘라 그림');const r=d.frame.assetFrame.sourceRect;ok(r[0]%192===0&&r[0]>=0&&r[0]<1152&&r[2]===192&&r[3]===256,'칸 '+r);
 const xs=new Set();for(let i=0;i<20;i++){w.run('tick(.1);drawProp(room.props.find(p=>p.r790NPC))');xs.add(w.log().drawn.at(-1).frame.assetFrame.sourceRect[0]);}ok(xs.size>=4,'숨쉬기 칸이 돈다 '+[...xs]);
 ok(!/physician/.test(JSON.stringify(w.log().drawn)),'남자 의목사 그림 안 씀');
 // R1341b 크기: 보이는 키 = 엔진 actorHeight × 비율. 다른 사람 인물(1.04~1.06)과 영웅 2D(두건 포함 약 1.06)와 같은 띠 안(1.12 는 6% 커 보였다)
 {const hh=w.log().drawn.at(-1).h/w.run('actorHeight()');ok(hh>=1.03&&hh<=1.07,'미카엘라 보이는 키 비율 '+hh.toFixed(3));}
 w.run('interact()');const h=w.log().panel[0];ok(h.includes('미카엘라'),'창 이름');ok(h.includes('./'+BUST),'창 흉상 = 미카엘라');ok(!h.includes('physician'),'남자 흉상 아님');ok(!/남자/.test(h),'남자라는 말 없음');ok(h.includes('이야기를 듣는다'),'답 그대로');
 w.run('__btn.npcTakeR790()');ok(w.api.taken(),'받음');eq(w.run('serializeSave().npcR790'),{version:1,rooms:{'STORY:ep1a11':{heardWorlds:true}}},'세이브 낱말 그대로(heardWorlds)');}
{const w=world({zoneId:'ep1a11'});w.run('tick(.1);player.x=5.5;player.y=8;interact()');ok(/미카엘라/.test(w.log().toast.at(-1)||''),'출구 문 알림 '+w.log().toast.at(-1));}
{const w=world({zoneId:'ep1a11'});w.run('tick(.1);updateHUD()');ok(/미카엘라/.test(w.run('__el.questText.textContent')),'목표 글');}
{const w=world({zoneId:'ep1a11'});w.run(`restoreSave({npcR790:{version:1,rooms:{'STORY:ep1a11':{heardWorlds:true}}}})`);ok(w.api.taken(),'옛 세이브 기록 읽힘');}
{const w=world({zoneId:'ep1a10'});w.run('tick(.1);drawProp(room.props.find(p=>p.r790NPC))');eq(w.log().drawn.at(-1).path,'assets/r790/npc/medic-idle6.webp','ep1a10 의료진 그대로');}
// ── ② ep1a11 늘 2D ──
function zone(id,layer='STORY',store={}){const c={Math,String,Number,Set,Object,JSON,RegExp,location:{search:''},localStorage:{getItem:k=>store[k]??null,setItem:()=>{}}};c.window=c;c.room={id,layer};vm.createContext(c);vm.runInContext(rd('client-source/mob-3d-zone-r1326.js'),c);return c.__STORYWORLD_MOB3D_ZONE_R1326__;}
eq(zone('ep1a11').pick(true),false,'ep1a11: 3D 설정 켜도 2D');eq(zone('ep1a11').pick(false),false,'ep1a11: 꺼져도 2D');
eq(zone('ep1a10').pick(true),true,'ep1a10 은 설정 그대로');eq(zone('ep1a10').pick(false),false,'ep1a10 꺼짐 그대로');
eq(zone('last303').pick(true),false,'불면귀 그대로 2D');eq(zone('ep1b04').pick(false),true,'7대죄 그대로 3D');
eq(zone('ep1a11',undefined,{'storyworld.r1326.zone3d':'off'}).pick(true),true,'규칙 끄면 설정 그대로');
ok(rd('runtime-text/mob-3d-zone-r1326.js')===rd('client-source/mob-3d-zone-r1326.js'),'R1326 사본 같음');
// ── ③ 일관성 표 ──
const ov=rd('client-source/boss-2d-consistency-r1337.js');ok(rd('runtime-text/boss-2d-consistency-r1337.js')===ov,'R1337 사본 같음');
const m=/window\.__STORYWORLD_BOSS2D_R1337_DATA__=(\{.*?\});\/\/ @@TABLE@@/.exec(ov);ok(m,'표');const D=JSON.parse(m[1]);
for(const k of ['root','blood','balrog','lucifer','mask'])ok(D.bosses[k],'표에 '+k);
for(const k of ['lucifer','mask']){const B=D.bosses[k];ok(B.frames.length>=3,k+' 칸 3개 이상');for(const f of B.frames){ok(fs.existsSync(path.join(R,'runtime-text',f.out)),f.out+' 파일');ok(man.includes(f.out),f.out+' 목록');}}
ok(/'a11-c1':Object\.freeze\(\{name:'거짓천국 근위천사',path:'assets\/r380\/mobs\/false-heaven-guard-v1\.webp'/.test(ov),'근위천사(일반 몹) 서 있기 고정 표');
{const L=D.bosses.lucifer;ok(L.walk&&L.walk.dark,'루시퍼 걷기: 밝은·어두운 판');ok(L.frames.some(f=>f.dark)&&L.frames.filter(f=>f.dark).every(f=>/a11-dark/.test(f.out)),'어두운 단계 사본은 어두운 판');
 const fl=L.frames.find(f=>/r1029\/float/.test(f.path));ok(fl&&fl.cell&&fl.cell[1]===256,'떠서 이동 칸 크기 따로');ok(!L.float&&!D.bosses.mask.float,'떠서 이동은 배율만이 아니라 사본으로');}
// 근위천사 서 있기: 오버레이를 vm 에 올려 drawEnemy 를 흉내 — 서 있으면 칸 0 고정·숨쉬기, 걸으면·공격하면 그대로.
{const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,RegExp,performance:{now:()=>0},setInterval:()=>0,localStorage:{getItem:()=>null,setItem:()=>{}}};c.window=c;vm.createContext(c);
 vm.runInContext(`var time=1,ctx={commands:[]};function drawEnemy(e){ctx.commands.push({kind:'image',sourcePath:'assets/r380/mobs/false-heaven-guard-v1.webp',sourceRect:[e.__sx,0,256,256],points:[[0,0],[100,0],[100,100],[0,100]],owner:{id:'enemy:'+e.id}});}`,c);
 vm.runInContext(ov,c);
 const run=(e,t)=>vm.runInContext(`time=${t};ctx.commands.length=0;drawEnemy(__e);ctx.commands[0]`,Object.assign(c,{__e:e}));
 const e={id:'a',nativeId:'a11-c1',x:5,y:5,hp:10,__sx:256};let r=run(e,1);r=run(e,1.05);eq(r.sourceRect,[0,0,256,256],'서 있으면 칸 0');const h1=r.points[0][1];r=run(e,1.5);ok(Math.abs(r.points[0][1]-h1)>.05&&Math.abs(r.points[3][1]-100)<1e-6,'숨쉬기(발 줄 고정)');
 e.attack={elapsed:.1};r=run(e,1.6);eq(r.sourceRect,[256,0,256,256],'공격 중 그대로');e.attack=null;
 e.moving=true;r=run(e,1.7);eq(r.sourceRect,[256,0,256,256],'걸으면 그대로');e.moving=false;
 const o={id:'b',nativeId:'a11-o1',x:5,y:5,hp:10,__sx:256};r=run(o,1.8);eq(r.sourceRect,[256,0,256,256],'다른 몹 그대로');
 e.hp=0;r=run(e,1.9);eq(r.sourceRect,[256,0,256,256],'죽으면 그대로');}
// 사본 칸 몸통 크기(깎은 넓이) 기준 대비 ±0.6% 안(process-report, 손질 스크립트가 두 번 재서 맞춘다)
{const rep=JSON.parse(rd('qa/r1337/process-report.json'));for(const [o,v] of Object.entries(rep)){if(!/assets\/r1341\//.test(o))continue;for(const c_ of v.cells)ok(Math.abs(c_.after.massRatio-1)<=.006,o+' 칸 '+c_.i+' 몸통 '+c_.after.massRatio);}}
console.log('R1341 CPU OK',n);
