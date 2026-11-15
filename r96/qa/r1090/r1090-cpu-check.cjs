// R1090 CPU 검사: 캐릭터 담묵 필터(ink-chars-r1090.js) — 브라우저 없이 실제 모듈을 가짜 DOM 에서 돌린다.
//  ① 연결(태그·sync·공개 확인 목록·CI 줄) ② 필터 문자열은 Three 기록기가 아는 종류만(saturate·contrast), 색 계산이 채도를 반쯤 낮추고 범위 안
//  ③ 고르기: 영웅·몹 그림 명령만, 이펙트·소품·바닥·글자·더하기 혼합·바닥 붙음·이펙트 시트는 그대로, 기존 필터 뒤에 덧붙임, 두 번 붙이지 않음, 원래 style 객체는 안 바꿈
//  ④ 켜고 끄기: 기본 켜짐, '0' 끔, 이상한 저장값, 저장소 오류, 맵 수묵화풍(R1055)이 꺼졌거나 쉬는 단계면 같이 쉼
//  ⑤ 설정 창 줄 ⑥ 렌더러 감싸기(프로토타입·인스턴스, 한 프레임 한 번, 오류가 나도 원래 render 는 돈다) ⑦ 새 키 입력·ctx.filter·판정 변경 없음.
//  실제 화면은 r1090-browser.mjs(헤드리스)가 잰다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return '';}};
const res=[];const ok=(n,c,d='')=>{res.push(!!c);console.log((c?'PASS ':'FAIL ')+n+(c||d===''?'':' :: '+d));};
const done=()=>{const failed=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed,method:'node vm + tiny fake DOM'}));process.exit(failed?1:0);};
const NAME='ink-chars-r1090.js',F=path.join(R,'client-source',NAME);const src=rd(F);
ok('client-source/'+NAME+' exists',src.length>0);
// ---- ① 연결 ----
const html=rd(path.join(R,'runtime-text','index.html'));
ok('runtime copy identical to client-source',src.length>0&&rd(path.join(R,'runtime-text',NAME))===src);
ok('index.html loads it exactly once',(html.match(/<script src="\.\/ink-chars-r1090\.js"><\/script>/g)||[]).length===1);
{const a=html.indexOf(NAME),b=html.indexOf('<script src="./combat-r118.js">'),c=html.indexOf('ink-wash-r1055.js'),d=html.indexOf('hero-visibility-r350.js'),e=html.indexOf('depth-overlap-r448.js');
 ok('before combat-r118·world-tiles-r118 (끝 두 태그 규칙)',a>0&&b>a);
 ok('after ink-wash-r1055 (맵 수묵 상태를 읽음)',a>c&&c>0);
 void d;void e;}
ok('verify-r96-public.py expects it',/'ink-chars-r1090\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))));
ok('runtime-inputs/manifest list it',/ink-chars-r1090\.js/.test(rd(path.join(R,'runtime-inputs.json'))+rd(path.join(R,'runtime-text','runtime-inputs.json')))&&/ink-chars-r1090\.js/.test(rd(path.join(R,'runtime-manifest.json'))+rd(path.join(R,'runtime-text','runtime-manifest.json'))));
ok('pages.yml runs this check',/node r96\/qa\/r1090\/r1090-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))));
if(!src)done();
// ---- 가짜 세계 ----
const KEY='storyworld.r1090.inkChars';
function world(stored,opt={}){
 const store=new Map(stored===undefined?[]:[[KEY,stored]]);
 const mk=tag=>{const e={tagName:tag.toUpperCase(),children:[],parentNode:null,id:'',textContent:'',checked:false,type:'',className:'',style:{},
  appendChild(c){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);c.parentNode=this;this.children.push(c);return c;},
  _all(){const o=[];const w=x=>x.children.forEach(c=>{o.push(c);w(c);});w(this);return o;}};return e;};
 const docEl=mk('html'),body=mk('body'),panel=mk('section');panel.id='panel';docEl.appendChild(body);body.appendChild(panel);
 const document={documentElement:docEl,body,readyState:'complete',createElement:mk,getElementById:id=>docEl._all().find(e=>e.id===id)||null,addEventListener(){}};
 const localStorage={getItem:k=>{if(opt.throws)throw Error('denied');return store.has(k)?store.get(k):null;},setItem:(k,v)=>{if(opt.throws)throw Error('denied');store.set(k,String(v));},removeItem:k=>{if(opt.throws)throw Error('denied');store.delete(k);}};
 const ink={mode:opt.inkMode??'all',k:opt.inkK??1};
 const calls={base:0};function Renderer(){}Renderer.prototype.render=function(frame){calls.base++;calls.last=frame;if(opt.baseThrows)throw Error('base boom');return 'drawn';};
 const inst=new Renderer();if(opt.instOwn!==false)inst.render=Renderer.prototype.render;
 const timers=[],ivals=[];
 const w={document,localStorage,console,setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout(){},setInterval:f=>{ivals.push(f);return ivals.length;},clearInterval(){},
  queueMicrotask:f=>timers.push(f),requestAnimationFrame:f=>timers.push(f),addEventListener(){},
  StoryPhase1:{ThreeRenderer:Renderer},__STORYWORLD_PHASE1__:{controller:{state:{three:opt.lateInst?null:inst}}},
  showSettings(){panel.children=[];const s=mk('section');s.id='combatScreenR1021';panel.appendChild(s);if(opt.inkRow!==false){const r=mk('div');r.id='inkRowR1055';s.appendChild(r);}return 'base';}};
 if(opt.noInk!==true)w.__STORYWORLD_INK_WASH_R1055__={prefs:()=>({mode:ink.mode,style:'jg'}),inspect:()=>({k:ink.k,prefs:{mode:ink.mode}})};
 w.window=w;w.globalThis=w;const ctx=vm.createContext(w);let err=null;try{vm.runInContext(src,ctx,{filename:NAME});}catch(e){err=e;}
 return {w,ctx,docEl,panel,store,err,ink,calls,inst,Renderer,api:w.__STORYWORLD_INK_CHARS_R1090__,flush(){for(let i=0;i<50&&timers.length;i++)timers.shift()();},tick(){ivals.forEach(f=>f());}};}
const STYLE=o=>({globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'#080e16',filter:'none',lineWidth:1,...o});
const cmd=(kind,ownerKind,o={})=>({kind,key:'k'+Math.random(),owner:{id:ownerKind+':1',kind:ownerKind,groundAligned:false,...(o.owner||{})},order:1,sourcePath:o.path??'assets/r763/villagers/fisher-walk.webp',spatialRole:o.role??null,style:STYLE(o.style)});
// ---- ④ 켜고 끄기(기본) ----
const A=world();ok('module loads without throwing',!A.err,String(A.err&&A.err.stack));const api=A.api;
ok('api present (revision·FILTER·process·active·enabled·set·inspect)',!!api&&/^R1090/.test(api.revision||'')&&typeof api.FILTER==='string'&&['process','active','enabled','set','inspect'].every(k=>typeof api[k]==='function'));if(!api)done();
const FIL=api.FILTER;
// ---- ② 필터 문자열 ----
{const pieces=[...FIL.matchAll(/([a-z-]+)\(([^)]+)\)/gi)];
 ok('FILTER 는 Three 기록기가 아는 종류만(saturate·contrast·brightness), 조각이 문자열 전체와 같음',pieces.length>=1&&pieces.every(p=>['saturate','contrast','brightness'].includes(p[1]))&&pieces.map(p=>p[0]).join('')===FIL.replace(/\s/g,''),FIL);
 ok('drop-shadow·blur·url 없음(Legacy 로 떨어져 화면이 검어지는 종류)',!/drop-shadow|blur|url|sepia|invert|opacity/.test(FIL));
 const sat=pieces.find(p=>p[1]==='saturate'),con=pieces.find(p=>p[1]==='contrast');
 ok('채도는 반쯤(0.4~0.6), 대비는 살짝(1.0~1.15)',!!sat&&+sat[2]>=.4&&+sat[2]<=.6&&(!con||(+con[2]>=1&&+con[2]<=1.15)),FIL);
 // phase1.js filterMatrix 와 같은 식으로 색을 계산해 본다
 const apply=(rgb)=>{let c=rgb.slice();for(const [,k,a] of pieces){const n=parseFloat(a);if(k==='brightness')c=c.map(v=>v*n);else if(k==='contrast')c=c.map(v=>v*n+.5*(1-n));else{const l=.213*c[0]+.715*c[1]+.072*c[2];c=c.map(v=>l+(v-l)*n);}}return c;};
 const chroma=c=>Math.max(...c)-Math.min(...c);const red=[.8,.15,.12],out=apply(red);
 ok('붉은 옷(0.8,0.15,0.12): 채도 40~65% 남음, 색상 순서 유지',chroma(out)/chroma(red)>=.4&&chroma(out)/chroma(red)<=.65&&out[0]>out[1]&&out[1]>=out[2]-1e-9,JSON.stringify(out));
 const g=apply([.5,.5,.5]);ok('중간 회색은 거의 그대로(±0.03)',g.every(v=>Math.abs(v-.5)<.03),JSON.stringify(g));
 const wv=apply([.95,.93,.9]),bk=apply([.04,.04,.05]);ok('밝은 옷·검은 옷이 범위를 크게 벗어나지 않음(-0.05~1.06) — 환도 흰 옷이 날아가지 않게',wv.every(v=>v<=1.06)&&bk.every(v=>v>=-.05),JSON.stringify([wv,bk]));
 const lum=c=>.213*c[0]+.715*c[1]+.072*c[2];ok('밝기 순서 유지(흰 옷 > 붉은 옷 > 검은 옷), 밝기 변화 15% 안',lum(wv)>lum(out)&&lum(out)>lum(bk)&&Math.abs(lum(out)-lum(red))<.15*Math.max(.2,lum(red))+.03);}
// ---- ③ 고르기 ----
ok('기본: 켜짐·작동 중(맵 수묵 켜짐)',api.enabled()===true&&api.active()===true);
{const hero=cmd('image','hero',{path:'assets/r283/hwando/r271/walk-e.webp'}),mob=cmd('image','enemy'),body=cmd('image','enemy',{role:'body',path:'assets/episode1b/generated-v394/bulmyeongwi_b.webp'});
 const hs=hero.style,cs=[hero,mob,body];const n=api.process(cs);
 ok('영웅·몹 그림 명령에 필터가 붙음(3개)',n===3&&cs.every(c=>c.style.filter===FIL),JSON.stringify(cs.map(c=>c.style.filter)));
 ok('원래 style 객체는 바꾸지 않고 새 객체로(다른 명령과 함께 쓰는 style 을 망치지 않게), 다른 값은 그대로',hs.filter==='none'&&hero.style!==hs&&hero.style.globalAlpha===1&&hero.style.globalCompositeOperation==='source-over'&&hero.style.fillStyle==='#080e16');
 ok('다시 돌려도 두 번 붙지 않음',api.process(cs)===0&&cs.every(c=>c.style.filter===FIL));}
{const flash=cmd('image','enemy',{style:{filter:'brightness(1.8) saturate(.5)'}}),dream=cmd('image','hero',{style:{filter:'brightness(1.13)'}});api.process([flash,dream]);
 ok('기존 필터(피격 번쩍임·사몽) 뒤에 덧붙임 — 번쩍임은 그대로 보임',flash.style.filter==='brightness(1.8) saturate(.5) '+FIL&&dream.style.filter==='brightness(1.13) '+FIL,flash.style.filter);}
{const keep=[cmd('image','effect'),cmd('image','scene'),cmd('image','prop',{role:'body'}),cmd('image','ground'),cmd('image','contact'),cmd('image','projectile'),
  cmd('fill','hero'),cmd('text','enemy'),cmd('stroke','enemy'),
  cmd('image','enemy',{style:{globalCompositeOperation:'lighter'}}),cmd('image','hero',{style:{globalCompositeOperation:'screen'}}),
  cmd('image','enemy',{owner:{groundAligned:true}}),cmd('image','hero',{owner:{r350:true}}),
  cmd('image','enemy',{path:'assets/painted-vfx-r87/mark.webp'}),cmd('image','hero',{path:'assets/r292/fx/hwando/slash.webp'}),cmd('image','enemy',{path:'assets/r163/pixelfx/hit.png'}),cmd('image','enemy',{path:'assets/dynamic-vfx-r84/x.webp'})];
 const before=keep.map(c=>c.style);const n=api.process(keep);
 ok('이펙트·장면·소품·바닥·접촉·탄, 채우기·글자·선, 더하기 혼합, 바닥 붙음, R350 피, 이펙트 시트(vfx·fx·pixelfx)는 그대로',n===0&&keep.every((c,i)=>c.style===before[i]&&c.style.filter==='none'),String(n)+' '+keep.map((c,i)=>c.style.filter==='none'?'':i).join(''));}
{const g1={...cmd('image','effect',{owner:{r350:true}}),key:'r350:ghost:hero:1'},g2={...cmd('image','effect',{owner:{r350:true,r448:true}}),key:'r448:ghost:hero:1'},over={...cmd('image','effect',{owner:{r350:true,r448:true}}),key:'r448:over:prop:3'},blood={...cmd('image','effect',{owner:{r350:true}}),key:'r350:blood:1'};
 const n=api.process([g1,g2,over,blood]);
 ok('영웅 다시 보이기 사본(R350·R448 ghost — 그 모듈들이 먼저 돌아 사본이 이미 있음)에도 같은 필터, 소품 덮개(r448:over)·피 튐은 그대로',n===2&&g1.style.filter===FIL&&g2.style.filter===FIL&&over.style.filter==='none'&&blood.style.filter==='none',String(n));}
{let threw=null,n=-1;try{n=api.process([null,undefined,7,'x',{},{kind:'image'},{kind:'image',owner:null},{kind:'image',owner:{kind:'hero'}},{kind:'image',owner:{kind:'enemy'},style:null},{kind:'image',owner:{kind:'enemy'},style:{filter:42}},{kind:'image',owner:{kind:'hero'},style:{filter:''},sourcePath:null}]);api.process(null);api.process(undefined);api.process({});}catch(e){threw=e;}
 ok('이상한 명령(null·style 없음·filter 가 숫자)에도 예외 없음, 빈 필터는 none 처럼',!threw&&n>=0,String(threw));}
{const c=cmd('image','hero',{style:{filter:''}});api.process([c]);ok("filter '' 는 none 처럼 다뤄 앞에 빈칸이 안 붙음",c.style.filter===FIL,JSON.stringify(c.style.filter));}
{const cs=Array.from({length:400},(_,i)=>cmd('image',i%2?'enemy':'hero'));const t=Date.now();for(let i=0;i<50;i++){cs.forEach(c=>{c.style=STYLE();delete c.r1090;});api.process(cs);}const ms=(Date.now()-t)/50;
 ok('400개 명령 한 프레임 처리 2ms 미만(평균)',ms<2,ms.toFixed(3)+'ms');}
// ---- ④ 켜고 끄기 ----
{const c=cmd('image','hero');api.set(false);const n=api.process([c]);ok('set(false): 끔 — 명령을 건드리지 않음, 저장 "0"',n===0&&c.style.filter==='none'&&api.enabled()===false&&api.active()===false&&A.store.get(KEY)==='0');
 api.set(true);ok('set(true): 다시 켜짐, 저장값 지움',api.enabled()===true&&api.active()===true&&!A.store.has(KEY));
 for(const v of [undefined,null,NaN,0,'0',{}])api.set(v);ok('set(불리언 아님)은 무시',api.enabled()===true);}
ok("저장 '0': 꺼진 채 시작",(()=>{const x=world('0');const c=cmd('image','enemy');return !x.err&&x.api.enabled()===false&&x.api.process([c])===0&&c.style.filter==='none';})());
for(const bad of ['','1','{','null','{"on":false}','off','0 ','NaN'])ok(`이상한 저장값 ${JSON.stringify(bad)}: 기본(켜짐), 오류 없음`,(()=>{const x=world(bad);return !x.err&&x.api.enabled()===true&&x.api.inspect().errors===0;})());
ok('localStorage 가 막혀도(예외) 켜진 채, set 도 예외 없이',(()=>{const x=world(undefined,{throws:true});if(x.err||!x.api.enabled())return false;x.api.set(false);return x.api.enabled()===false;})());
ok('맵 수묵화풍이 꺼져 있으면(R1055 mode off) 같이 쉼 — 색 맵 위에 먹빛 캐릭터가 따로 놀지 않게',(()=>{const x=world(undefined,{inkMode:'off',inkK:0});const c=cmd('image','hero');return x.api.enabled()===true&&x.api.active()===false&&x.api.process([c])===0&&c.style.filter==='none';})());
ok('맵 수묵이 쉬는 성능 단계(k=0)면 같이 쉼',(()=>{const x=world(undefined,{inkMode:'all',inkK:0});const c=cmd('image','enemy');return x.api.active()===false&&x.api.process([c])===0;})());
ok('맵 수묵이 켜지는 중(k 0.3)에는 아직 쉼, 다 켜지면(k 1) 작동 — 경계값',(()=>{const x=world(undefined,{inkK:.3});const a=x.api.active();x.ink.k=1;x.api.refresh();return a===false&&x.api.active()===true;})());
ok('맵 수묵을 게임 중에 끄면 다음 확인 때 따라 꺼짐',(()=>{const x=world();const c1=cmd('image','hero');x.api.process([c1]);x.ink.mode='off';x.ink.k=0;x.api.refresh();const c2=cmd('image','hero');return c1.style.filter===x.api.FILTER&&x.api.process([c2])===0;})());
ok('R1055 모듈이 없으면 쉼(오류 없음)',(()=>{const x=world(undefined,{noInk:true});return !x.err&&x.api.active()===false&&x.api.inspect().errors===0;})());
ok('R1055 inspect 가 예외를 던져도 쉼(게임은 계속)',(()=>{const x=world();x.w.__STORYWORLD_INK_WASH_R1055__.inspect=()=>{throw Error('x');};x.api.refresh();return x.api.active()===false;})());
ok('inspect: 숫자는 모두 유한',(()=>{const i=api.inspect();return i&&Object.values(i).every(v=>typeof v!=='number'||Number.isFinite(v));})());
ok('두 번 읽어도 한 번만(API 그대로)',(()=>{vm.runInContext(src,A.ctx);return A.w.__STORYWORLD_INK_CHARS_R1090__===api;})());
// ---- ⑤ 설정 창 줄 ----
{const x=world();x.w.showSettings();x.flush();const row=x.w.document.getElementById('inkCharsRowR1090'),box=x.w.document.getElementById('inkCharsOnR1090');
 ok("설정 창 '전투 화면' 구역에 '캐릭터 담묵' 줄(체크 상자), 맵 수묵화풍 줄 바로 뒤",!!row&&!!box&&row.parentNode.id==='combatScreenR1021'&&box.type==='checkbox'&&box.checked===true&&/캐릭터/.test(JSON.stringify(row._all().map(e=>e.textContent)))&&row.parentNode.children.indexOf(row)===row.parentNode.children.findIndex(e=>e.id==='inkRowR1055')+1);
 if(box){box.checked=false;box.onchange&&box.onchange({target:box});ok('체크를 풀면 꺼지고 저장',x.api.enabled()===false&&x.store.get(KEY)==='0');x.w.showSettings();x.flush();
  ok('다시 열면 풀린 채, 줄은 하나',x.w.document.getElementById('inkCharsOnR1090').checked===false&&x.panel._all().filter(e=>e.id==='inkCharsRowR1090').length===1);}
 ok('showSettings 의 원래 반환값 유지',x.w.showSettings()==='base');
 const y=world(undefined,{inkRow:false});y.w.showSettings();y.flush();ok('맵 수묵화풍 줄이 없어도 구역 끝에 붙음',!!y.w.document.getElementById('inkCharsRowR1090'));}
// ---- ⑥ 렌더러 감싸기 ----
{const x=world();const c=cmd('image','hero');const r=x.inst.render({commands:[c]});
 ok('인스턴스 render 를 감쌈: 명령에 필터가 붙고 원래 render 가 한 번 돌고 반환값 유지',r==='drawn'&&x.calls.base===1&&c.style.filter===x.api.FILTER);
 const c2=cmd('image','enemy');x.Renderer.prototype.render.call(new x.Renderer(),{commands:[c2]});ok('프로토타입 render 도 감쌈',c2.style.filter===x.api.FILTER);
 ok('프로토타입·인스턴스 둘 다 감싸도 한 render 에 한 번만 처리',(()=>{const before=x.api.inspect().frames;x.inst.render({commands:[cmd('image','hero')]});return x.api.inspect().frames===before+1;})());
 ok('commands 없는 프레임도 그대로 통과',x.inst.render({})==='drawn'&&x.inst.render(null)==='drawn');
 const z=world(undefined,{lateInst:true});const inst2=new z.Renderer();inst2.render=z.Renderer.prototype.render;const raw=cmd('image','hero');z.w.__STORYWORLD_PHASE1__.controller.state.three=inst2;z.tick();inst2.render({commands:[raw]});
 ok('나중에 생긴 렌더러 인스턴스도 주기 확인으로 감쌈',raw.style.filter===z.api.FILTER);
 const t=world(undefined,{baseThrows:true});let threw=false;try{t.inst.render({commands:[cmd('image','hero')]});}catch(e){threw=/base boom/.test(String(e));}
 ok('원래 render 의 예외는 그대로 전달, 그 뒤에도 다음 프레임 처리됨(깊이 세기 복구)',threw&&(()=>{const c=cmd('image','hero');try{t.inst.render({commands:[c]});}catch(_){}return c.style.filter===t.api.FILTER;})());
 const bad=world();const getter={kind:'image',owner:{kind:'hero'},get style(){throw Error('style boom');}};
 ok('명령 처리 중 예외가 나도 원래 render 는 돈다(오류만 셈)',bad.inst.render({commands:[getter]})==='drawn'&&bad.api.inspect().errors>=1);}
// ---- ⑦ 하지 않는 것 ----
ok('ctx.filter·캔버스 그리기·키 입력·판정 값(hp·damage·speed)을 건드리지 않음',!/ctx\.filter|getContext|addEventListener\(\s*['"]key|\.hp\s*[-+*]?=|damage\s*[-+*]?=|\.speed\s*[-+*]?=/.test(src));
ok('외부 주소·eval 없음',!/https?:\/\/|eval\(|new Function/.test(src.replace(/\/\/.*$/gm,'')));
done();
