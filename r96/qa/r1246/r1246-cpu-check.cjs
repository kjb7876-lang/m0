// R1246 CPU 검사 — 공격·스킬 중 맞아도 공격 모션 유지(attack-over-hurt-r1246.js).
//  가짜 drawHero 로 감싸기를 돌려: 그리는 동안만 hurtAnim 을 0 으로 보이고 끝나면(예외여도) 되돌리는지, 맞기만 할 땐·대시·막기·사망·끄기·협동은 그대로인지,
//  안쪽(분신) 재호출·다시 감싸기 겹침·NaN 을 본다. 빌드 연결 다섯 곳(태그·runtime-text 사본·manifest·공개 확인 목록·CI 줄)도 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='attack-over-hurt-r1246.js',API='__STORYWORLD_ATTACK_OVER_HURT_R1246__';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok(!!src,'① 오버레이 파일 있음');
function mk(extra={}){const seen=[];const store={};const win={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},setInterval:()=>0,addEventListener:()=>{},...extra};
 const ctx={window:win,Math,Number,Object,String,JSON,console,document:{readyState:'complete'},...win};ctx.window=ctx;
 ctx.player={hp:100,hurtAnim:.2,attackAnim:.15,skillAnim:0,ultimateAnim:0,dashAnim:0,guard:false};
 ctx.drawHero=function(){seen.push(ctx.player.hurtAnim);if(ctx.__throw)throw new Error('boom');if(ctx.__nest){ctx.__nest=false;ctx.drawHero();}return 7;};
 vm.createContext(ctx);try{vm.runInContext(src,ctx);}catch(e){console.log('load error',e.message);}return {ctx,seen,api:ctx[API]};}
if(src){
 {const {ctx,seen,api}=mk();ok(!!api&&typeof api.inspect==='function','① API '+API);
  const r=ctx.drawHero();ok(r===7&&seen[0]===0,'② 기본공격 중 맞음: 그리는 동안 hurtAnim 0 ('+seen[0]+')');ok(ctx.player.hurtAnim===.2,'② 그린 뒤 실제 값 되돌림('+ctx.player.hurtAnim+')');
  ctx.player.attackAnim=0;ctx.player.skillAnim=.4;seen.length=0;ctx.drawHero();ok(seen[0]===0&&ctx.player.hurtAnim===.2,'② 스킬 중 맞음도 공격 모션 쪽');
  ctx.player.skillAnim=0;ctx.player.ultimateAnim=.5;seen.length=0;ctx.drawHero();ok(seen[0]===0&&ctx.player.hurtAnim===.2,'② 궁극기 중 맞음도 공격 모션 쪽');
  ctx.player.ultimateAnim=0;seen.length=0;ctx.drawHero();ok(seen[0]===.2,'③ 맞기만 할 땐 피격 그대로('+seen[0]+')');
  ctx.player.attackAnim=.1;ctx.player.dashAnim=.2;seen.length=0;ctx.drawHero();ok(seen[0]===.2,'③ 대시 중은 그대로');ctx.player.dashAnim=0;
  ctx.player.guard=true;seen.length=0;ctx.drawHero();ok(seen[0]===.2,'③ 막기 중은 그대로');ctx.player.guard=false;
  ctx.player.hp=0;seen.length=0;ctx.drawHero();ok(seen[0]===.2,'③ 쓰러짐은 그대로');ctx.player.hp=100;
  ctx.player.hurtAnim=0;seen.length=0;ctx.drawHero();ok(seen[0]===0&&ctx.player.hurtAnim===0,'③ 안 맞았으면 손대지 않음');
  ctx.player.hurtAnim=NaN;seen.length=0;ctx.drawHero();ok(Number.isNaN(ctx.player.hurtAnim),'③ NaN 은 그대로 둠(맞음으로 안 봄)');
  ctx.player.hurtAnim=.2;ctx.__throw=true;let threw=false;try{ctx.drawHero();}catch(_){threw=true;}ctx.__throw=false;ok(threw&&ctx.player.hurtAnim===.2,'④ 그리다 예외가 나도 되돌림');
  ctx.__nest=true;seen.length=0;ctx.drawHero();ok(seen.length===2&&seen.every(v=>v===0)&&ctx.player.hurtAnim===.2,'④ 안쪽 재호출(분신)도 같은 값, 끝나면 되돌림 '+JSON.stringify(seen));
  const w1=ctx.drawHero;api.install();ok(ctx.drawHero===w1,'④ 이미 감쌌으면 다시 감싸지 않음');
  const outer=function(){return w1.apply(this,arguments);};outer.__r1246=w1.__r1246;ctx.drawHero=outer;api.install();ok(ctx.drawHero===outer,'④ 표식을 옮긴 바깥 감싸기 위로는 겹치지 않음');
  const plain=function(){return w1.apply(this,arguments);};ctx.drawHero=plain;api.install();ok(ctx.drawHero!==plain&&ctx.drawHero.__r1246,'④ 표식 없는 새 바깥 감싸기 위에는 다시 감쌈(맨 바깥 유지)');
  api.set(false);ctx.drawHero=w1;seen.length=0;ctx.drawHero();ok(seen[0]===.2,'⑤ 끄기(storyworld.r1246.atkOverHurt=0) 면 그대로');api.set(true);
  const i=api.inspect();ok(i.masked>=4&&i.errors===0&&i.gameplayChanged===false,'⑤ inspect '+JSON.stringify(i));}
 {const {ctx,seen}=mk({__STORYWORLD_COOP_SIM_R62__:{mode:()=>'host'}});ctx.drawHero();ok(seen[0]===.2,'⑤ 협동(멀티) 모드는 그대로');}
}
// 빌드 연결
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};
const html=RT('index.html');
ok(html.split('"./'+F+'"').length===2&&html.includes('<script src="./blink-camera-r1236.js"></script>\n<script src="./'+F+'"></script>'),'⑦ index.html 태그 한 번(blink-camera-r1236 바로 뒤, 로드 뒤 맨 바깥에서 감쌈)');
ok(!!src&&RT(F)===src,'⑦ runtime-text 사본 = client-source');
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}ok(man.includes('"'+F+'"'),'⑦ runtime-manifest 에 실림');
let ver='';try{ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');}catch(_){}ok(ver.includes("'"+F+"'"),'⑦ 공개 확인 목록');
let ci='';try{ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');}catch(_){}ok(ci.includes('r96/qa/r1246/r1246-cpu-check.cjs'),'⑦ CI 검사 줄');
console.log(JSON.stringify({total:n,failed:bad,method:'node vm + fake drawHero; real game run by collect.mjs + motion-judge.cjs (headless)'}));process.exit(bad?1:0);
