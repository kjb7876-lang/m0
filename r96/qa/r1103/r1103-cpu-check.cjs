// R1103 CPU 검사: 공격할 때 바닥에 깔리던 주황 '도형' 예고(FINAL42 251 공격 예고 고리·260 돌진 예고를 공격 길·부채꼴로 잘라 깐 띠,
//  R98 바닥 발자국 도형 채우기·선)를 3D 기록기(DrawCommands.push)에서 지운다. 판정·피해·시간은 손대지 않는다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const NAME='warning-shapes-r1103.js',F=path.join(R,'client-source',NAME);ok(fs.existsSync(F),'overlay exists');const src=fs.readFileSync(F,'utf8');
function world({pref=null,data=true}={}){const store={};if(pref!==null)store['storyworld.r1103.shapes']=pref;
 class DrawCommands{constructor(){this.commands=[];this.owner={id:'scene',kind:'scene'};this.globalAlpha=1;}push(kind,data){if(this.globalAlpha<=0)return;this.commands.push({kind,owner:{...this.owner},...data});}scope(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}}}
 const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,console,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 class ThreeRenderer{render(frame){this.last=frame.commands.slice();return frame.commands.length;}}
 ctx.StoryPhase1={DrawCommands,ThreeRenderer};const inst=new ThreeRenderer();const own=inst.render;inst.render=function(f){return own.call(this,f);};/* perf-r97 처럼 인스턴스에 render 복사 */
 ctx.__STORYWORLD_PHASE1__={controller:{state:{three:inst}}};ctx.setInterval=fn=>{ctx.__tick=fn;return 1;};
 if(data)ctx.__STORYWORLD_FINAL42_DATA_R88__={effects:{F101:{id:'F101',sourceIndex:101,kind:'impact'},F251:{id:'F251',sourceIndex:251,kind:'warning'},F260:{id:'F260',sourceIndex:260,kind:'warning'},F250:{id:'F250',sourceIndex:250,kind:'status'}}};
 vm.runInContext(src,ctx);W0=ctx;return {ctx,DC:DrawCommands};}
// R1103c(병합 줄 CI): 기록은 남기고(FINAL42·R86 기존 검사가 기록을 본다) 3D 렌더러에 넘기는 단계에서만 뺀다.
//  draw() = 기록 → 인스턴스 render(perf-r97 복사본)에 넘긴 뒤 화면에 간 명령 수. rec() = 기록된 명령 수.
let W0=null;const draw=(DC,owner,kind='image')=>{const r=new DC();if(owner)r.scope(owner,()=>r.push(kind,{}));else r.push(kind,{});const three=W0.__STORYWORLD_PHASE1__.controller.state.three;W0.__tick?.();three.render({commands:r.commands});return three.last.length;};
const rec=(DC,owner,kind='image')=>{const r=new DC();r.scope(owner,()=>r.push(kind,{}));return r.commands.length;};
const f42=(i,extra={})=>({id:'final42-r88:1:2:F'+i,kind:'hazard',x:1,y:2,groundAligned:true,r88Final42:true,r88SourceIndex:i,r88EffectSource:i===251?'251-attack-warning-ring':i===260?'storyworld-260-charge-warning':'x',...extra});
{const {ctx,DC}=world();const api=ctx.__STORYWORLD_WARNING_SHAPES_R1103__;ok(api&&typeof api.inspect==='function'&&typeof api.set==='function','API');
 // 지울 것: 공격 예고 고리(251)를 바닥 발자국 모양으로 자른 그림 — 직사각형 띠·부채꼴 띠로 보이던 것
 ok(draw(DC,f42(251))===0,'F251 attack-warning-ring (ground footprint clip) dropped');
 ok(rec(DC,f42(251))===1&&rec(DC,{id:'r98:1:g',kind:'hazard',r98:true},'fill')===1&&rec(DC,{id:'r100:nav',kind:'hazard'},'fill')===1,'still recorded for native hook checks (dropped only on the way to the screen)');
 {const C=ctx.StoryPhase1.ThreeRenderer,t=new C(),r=new DC();r.scope(f42(251),()=>r.push('image',{}));r.push('fill',{});t.render({commands:r.commands});ok(t.last.length===1,'prototype render also filtered');}
 ok(draw(DC,f42(251,{kind:'effect',groundAligned:false}))===0,'F251 also dropped when not ground hazard');
 ok(draw(DC,f42(260,{kind:'effect',groundAligned:false,r88Layer:'afterActor'}))===0,'F260 charge-warning dropped');
 // 지울 것: R98 바닥 도형(발자국 채우기·선)
 ok(draw(DC,{id:'r98:12:g',kind:'hazard',x:1,y:1,groundAligned:true,r98:true},'fill')===0,'R98 ground footprint fill dropped');
 ok(draw(DC,{id:'r98:12:g',kind:'hazard',x:1,y:1,groundAligned:true,r98:true},'stroke')===0,'R98 ground footprint stroke dropped');
 // 지울 것: R98 이 숨김 표시만 해 둔 범위 예고(태그가 남은 명령)
 ok(draw(DC,{id:'e1',kind:'hazard',r98Telegraph:true},'fill')===0,'R98-tagged telegraph fill dropped');
 ok(draw(DC,{id:'e1',kind:'hazard',r98Telegraph:true},'image')===0,'R98-tagged telegraph image dropped');
 // 남길 것: 일반 이펙트·상태 그림·영웅 길잡이·몸·땅
 ok(draw(DC,f42(101,{kind:'effect'}))===1,'F101 impact kept');ok(draw(DC,f42(250,{kind:'effect'}))===1,'F250 status kept');
 ok(draw(DC,{id:'r98:3:a',kind:'effect',r98:true},'image')===1,'R98 air sheet kept');
 ok(draw(DC,{id:'r98:3:g',kind:'hazard',r98:true,groundAligned:true},'image')===1,'R98 ground sheet image kept (not a code shape)');
 // R1103b(사용자 07:08 "지워"): 몹 근처에 보이던 작은 주황 삼각형 = R100 길잡이 바닥 화살표(쉐브론) — 지운다(나침반 HUD 는 그대로)
 ok(draw(DC,{id:'r100:nav',kind:'hazard',groundAligned:true,r100:true},'fill')===0,'R100 ground nav chevrons dropped');
 ok(draw(DC,{id:'r100:other',kind:'hazard',groundAligned:true,r100:true},'fill')===1,'other R100 ground draws kept');
 ok(draw(DC,{id:'enemy:1',kind:'enemy'},'fill')===1&&draw(DC,{id:'hero:1',kind:'hero'},'image')===1,'enemy/hero kept');
 ok(draw(DC,null,'fill')===1,'default scene owner kept');
 ok(draw(DC,{id:'odd',kind:'hazard',r88Final42:true,r88SourceIndex:'251'})===0,'string source index boundary');
 ok(draw(DC,{id:'odd',kind:'hazard',r88Final42:true,r88SourceIndex:NaN})===1,'NaN source index kept');
 const s=api.inspect();ok(s.stats.dropped>=9&&s.stats.navTrail>=1&&s.on===true&&s.warningIndices.includes(251)&&s.warningIndices.includes(260)&&!s.warningIndices.includes(250),'stats/warning set from data');
 // 다시 불러도 두 번 감싸지 않는다
 vm.runInContext(src,ctx);ok(draw(DC,f42(101,{kind:'effect'}))===1&&draw(DC,f42(251))===0,'idempotent load');
 // 끄기
 api.set(false);ok(draw(DC,f42(251))===1&&draw(DC,{id:'r98:1:g',kind:'hazard',r98:true},'fill')===1,'set(false) restores drawing');api.set(true);ok(draw(DC,f42(251))===0,'set(true) removes again');}
{const {DC}=world({pref:'off'});ok(draw(DC,f42(251))===1,'pref off keeps original');}
{const {ctx,DC}=world({data:false});ok(draw(DC,f42(251))===0&&draw(DC,f42(260))===0&&ctx.__STORYWORLD_WARNING_SHAPES_R1103__.inspect().warningIndices.length===2,'fallback warning set without data');}
{const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,localStorage:{getItem:()=>null,setItem(){}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);ok(!!ctx.__STORYWORLD_WARNING_SHAPES_R1103__,'no recorder: loads without throwing');}
// 판정 코드에 손대지 않음
ok(!/hurt\s*=|hitEnemy\s*=|footprint154\s*=|\.damage\s*=|tick\s*=/.test(src),'no gameplay hooks');
// 빌드 연결
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8'),t=f=>html.indexOf('<script src="./'+f+'"></script>');
ok(t(NAME)>0&&/<script src="\.\/persona-ink-r1097\.js"><\/script>\n<script src="\.\/warning-shapes-r1103\.js"><\/script>\n<script src="\.\/boot-lean-r1038\.js"><\/script>\n<script src="\.\/story-reader-r122\.js">/.test(html),'index.html tag after persona-ink-r1097, before boot-lean-r1038');
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),inp=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
ok(JSON.stringify(man).includes(NAME)&&JSON.stringify(inp).includes(NAME),'runtime manifest/inputs');
ok(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+NAME+"'"),'verify-r96-public expects file');
ok(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1103/r1103-cpu-check.cjs'),'pages.yml runs this check');
console.log('R1103 warning-shape CPU check passed:',n);
