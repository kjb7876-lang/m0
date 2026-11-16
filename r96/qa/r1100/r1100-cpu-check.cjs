// R1100 EGO 환도 그림 가드 CPU 검사: 빌드 연결 + 순수 계산 + 샌드박스(늦게 실린 환도 덧씌우기·잔상·컷인·RC151·끄기)
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..'),N='ego-guard-r1100.js',rd=f=>fs.readFileSync(f,'utf8');
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,300));}};
const SRC=rd(path.join(R,'client-source',N));
// ① 빌드 연결
{const html=rd(path.join(R,'runtime-text','index.html'));ok(html.includes('<script src="./ego-kit-r1094.js"></script>\n<script src="./ego-guard-r1100.js"></script>'),'태그: ego-kit-r1094 바로 뒤');
 ok(rd(path.join(R,'runtime-text',N))===SRC,'runtime-text 사본 = client-source');
 ok(/'ego-guard-r1100\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))),'공개 확인 목록');
 ok(/node r96\/qa\/r1100\/r1100-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))),'CI 검사 줄');
 const inp=rd(path.join(R,'runtime-inputs.json')),man=rd(path.join(R,'runtime-manifest.json'));ok(inp.includes(N)&&man.includes(N),'runtime-inputs·manifest 에 들어감');
 ok(!/drop-shadow|blur\(/.test(SRC)&&!/localStorage\.setItem\([^)]*save/i.test(SRC),'필터 금지어·저장 필드 없음');}
// 샌드박스
function sand(opt={}){const iv=[],listeners={};const store={};const sb={console,JSON,Object,Array,Number,String,Math,Set,Map,Date,isFinite,setTimeout:f=>f(),setInterval:f=>{iv.push(f);return iv.length;},
  localStorage:{getItem:k=>opt.store?.[k]??store[k]??null,setItem:(k,v)=>{store[k]=v;}},document:{readyState:'complete'},addEventListener(){}};sb.window=sb;vm.createContext(sb);
 vm.runInContext(`var ctx={commands:[]};var shown=[];var cut=0;
  function cmd(src,h,extra){return Object.assign({kind:'image',owner:{kind:'hero'},sourcePath:src,points:[[0,0],[10,0],[10,h],[0,h]],style:{globalAlpha:1}},extra||{});}
  // 엔진 영웅 그리기 + R1048(안쪽: 환도 몸을 EGO 로 바꿈)
  function drawHero(){ctx.commands.push(cmd('assets/hero-authored-v314rc5/hwando-action-atlas.png',80));const b=ctx.commands[ctx.commands.length-1];if(R1048_OK){b.sourcePath='assets/r1048/ego/idle-s.webp';}}
  var R1048_OK=true;
  function drawEffect(e){shown.push(e.type+':'+e.asset);}
  var FORM=${opt.form!==false},RC=${!!opt.rc};
  window.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>FORM,inspect:()=>({rc151:RC})};
  window.__STORYWORLD_EGO_MOTION_R1048__={bodyArt:p=>/hero_direction|hero-authored|assets\\/heroes\\/|r439\\/hwando\\/|r283\\/hwando\\/|r242\\/hwando\\/|r1048\\/|^blob:/.test(String(p||''))};
  window.__STORYWORLD_PASSIVE_CUTIN_R1033__=Object.freeze({allow:h=>true,fire(){cut++;}});`,sb);
 vm.runInContext(SRC,sb,{filename:N});
 // 늦게 실린 환도 덧씌우기(R283 피격 자세처럼 R1048 바깥에서 환도 몸을 다시 얹음) — 가드는 load 뒤 1초 설치라 그보다 바깥
 if(opt.lateBeforeGuard){}
 return{sb,iv,run:c=>vm.runInContext(c,sb),G:sb.__STORYWORLD_EGO_GUARD_R1100__};}
{const{G}=sand();ok(!!G&&/^R1100-ego-guard-/.test(G.revision),'모듈');
 ok(G.hwBody('assets/hero-authored-v314rc5/hwando-walk-atlas.png')&&G.hwBody('assets/r1063/r283/hwando/r242/hit-e.webp')&&G.hwBody('assets/r1063/r439/hwando/attack-e.webp')&&!G.hwBody('assets/r1048/ego/idle-s.webp')&&!G.hwBody('assets/r945/hwando-orchid-slash.webp')&&!G.hwBody('')&&!G.hwBody(null),'hwBody: 환도 몸 그림만(EGO·이펙트·빈 값 아님)');
 const cm=[{kind:'image',owner:{kind:'hero'},sourcePath:'assets/r1063/r283/hwando/r242/hit-e.webp',points:[[0,0],[1,0],[1,80],[0,80]],style:{globalAlpha:.9}},{kind:'image',owner:{kind:'hero'},sourcePath:'assets/r1048/ego/idle-s.webp',points:[[0,0],[1,0],[1,80],[0,80]],style:{globalAlpha:1}},
  {kind:'image',owner:{kind:'enemy'},sourcePath:'assets/heroes/hwando.png',points:[[0,0],[1,0],[1,80],[0,80]],style:{}},{kind:"image",owner:{kind:"hero"},sourcePath:"assets/heroes/hwando-icon.png",points:[[0,0],[1,0],[1,0],[0,0]],style:{}},{kind:'image',owner:{kind:'hero'},sourcePath:'assets/heroes/hwando.png',points:null,style:{}}];
 const k=G.hideIn(cm,0);ok(k===2&&cm[0].style.globalAlpha===0&&cm[1].style.globalAlpha===1&&cm[2].style.globalAlpha===undefined&&cm[3].style.globalAlpha===undefined&&cm[4].style.globalAlpha===0,'hideIn: 영웅 몫 환도 몸만 투명(점 없는 3D 명령 포함; EGO 몸·적·높이 0 명령은 그대로)',cm.map(c=>c.style));
 ok(G.hideIn(null,0)===0&&G.hideIn([],5)===0,'hideIn: 빈 입력 안전');}
// 늦게 실린 덧씌우기가 환도 몸을 다시 얹는 경우(측정 ②) — 가드 설치 전에 감쌌으므로 가드가 바깥
{const{sb,run,G}=sand();run(`(()=>{})()`);/* 가드는 load 뒤 설치(setTimeout 즉시) → 이미 설치됨. 더 안쪽에 늦은 덧씌우기를 넣어 재현하려면 설치 전 감싸야 하므로 새 샌드박스로 */}
{const iv=[];const sb={console,JSON,Object,Array,Number,String,Math,Set,Map,Date,isFinite,setTimeout:f=>{sb.__later=f;},setInterval:f=>{iv.push(f);return 1;},localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'complete'},addEventListener(){}};sb.window=sb;vm.createContext(sb);
 vm.runInContext(`var ctx={commands:[]};var shown=[];
  function cmd(src,h){return {kind:'image',owner:{kind:'hero'},sourcePath:src,points:[[0,0],[10,0],[10,h],[0,h]],style:{globalAlpha:1}};}
  function drawHero(){const c=cmd('assets/hero-authored-v314rc5/hwando-action-atlas.png',80);ctx.commands.push(c);c.sourcePath='assets/r1048/ego/idle-s.webp';}
  function drawEffect(e){shown.push(e.type+':'+e.asset);}
  window.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>FORM,inspect:()=>({rc151:false,commit:COMMIT})};var FORM=true,COMMIT=null;var player={hero:'hwando'};
  window.__STORYWORLD_EGO_MOTION_R1048__={bodyArt:p=>/hero-authored|r283\\/hwando\\/|r1048\\//.test(String(p||''))};
  window.__STORYWORLD_PASSIVE_CUTIN_R1033__=Object.freeze({allow:h=>true});`,sb);
 vm.runInContext(SRC,sb,{filename:N});
 // 가드 설치 전(load 전) 늦은 덧씌우기: R1048 뒤에 환도 피격 자세를 다시 얹음
 vm.runInContext(`var b0=drawHero;drawHero=function(){b0();ctx.commands.push(cmd('assets/r1063/r283/hwando/r242/hit-e.webp',82));};`,sb);
 sb.__later();const G=sb.__STORYWORLD_EGO_GUARD_R1100__;
 vm.runInContext('ctx.commands.length=0;drawHero();',sb);let C=vm.runInContext('ctx.commands',sb);
 ok(C.length===2&&C[0].style.globalAlpha===1&&C[1].style.globalAlpha===0&&G.inspect().stats.hidden===1,'늦게 실린 환도 덧씌우기가 R1048 뒤에 얹은 환도 몸 → 투명(EGO 몸은 그대로)',C.map(c=>[c.sourcePath,c.style.globalAlpha]));
 vm.runInContext(`drawEffect({type:'ghost',asset:'assets/hero-authored-v314rc5/hwando-walk-atlas.png'});drawEffect({type:'ghost',asset:'assets/r1048/ego/walk-s.webp'});drawEffect({type:'burst',asset:'assets/vfx/generated/v300/burst-impact.webp'});`,sb);
 ok(JSON.stringify(vm.runInContext('shown',sb))==='["ghost:assets/r1048/ego/walk-s.webp","burst:assets/vfx/generated/v300/burst-impact.webp"]'&&G.inspect().stats.ghostsSkipped===1,'환도 그림 잔상만 안 그림(EGO 잔상·다른 이펙트는 그대로)',vm.runInContext('shown',sb));
 ok(sb.__STORYWORLD_PASSIVE_CUTIN_R1033__.allow('hwando')===false&&sb.__STORYWORLD_PASSIVE_CUTIN_R1033__.allow('lauren')===true&&G.inspect().stats.cutinBlocked===1,'EGO 형상: 환도 컷인만 막음(다른 영웅 컷인 그대로)');
 for(const f of iv)f();vm.runInContext('ctx.commands.length=0;drawHero();',sb);ok(G.inspect().stats.hidden===2,'1초 재설치가 겹쳐 감싸지 않음(한 번만 숨김 셈)');
 vm.runInContext('FORM=false;ctx.commands.length=0;drawHero();shown.length=0;drawEffect({type:"ghost",asset:"assets/hero-authored-v314rc5/hwando-walk-atlas.png"});',sb);C=vm.runInContext('ctx.commands',sb);
 ok(C[1].style.globalAlpha===1&&vm.runInContext('shown.length',sb)===1&&sb.__STORYWORLD_PASSIVE_CUTIN_R1033__.allow('hwando')===true,'EGO 형상이 아니면(평범한 환도) 아무것도 안 바꿈');
 vm.runInContext('COMMIT=true;ctx.commands.length=0;drawHero();',sb);C=vm.runInContext('ctx.commands',sb);ok(C[1].style.globalAlpha===0,'게임 시작 첫 프레임: EGO 칸 고르고 시작한 뒤 형상 켜지기 전(commit)도 환도 몸 숨김');
 vm.runInContext('player.hero="lauren";ctx.commands.length=0;drawHero();',sb);C=vm.runInContext('ctx.commands',sb);ok(C[1].style.globalAlpha===1,'commit 이어도 환도가 아니면 그대로');vm.runInContext('player.hero="hwando";COMMIT=null;',sb);
 vm.runInContext('FORM=true;',sb);G.set(false);vm.runInContext('ctx.commands.length=0;drawHero();',sb);C=vm.runInContext('ctx.commands',sb);ok(C[1].style.globalAlpha===1,'끄기(storyworld.r1100.egoGuard off) → 그대로');}
{const{sb,run,G}=sand({rc:true});run('ctx.commands.length=0;drawHero();ctx.commands.push(cmd("assets/heroes/hwando.png",80));');ok(G.inspect().form===false,'RC151 변신 중엔 가드 꺼짐(그쪽 그림표)');}
console.log(`\nR1100 CPU ${n-bad}/${n} 통과`);process.exitCode=bad?1:0;
