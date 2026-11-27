// R1329d 브라우저 검사(헤드리스 SwiftShader, 그래픽 검증 아님): 거미동굴에서 장면 캡처마다 짝 안 맞는 save 를 일부러 하나 남겨도
// 3D 가 멈추지 않고(실패 상태·멈춤 창 없음) 몸 그림이 계속 그려지며, 주인 id 가 오류 기록에 남는지. 끄면(R1329d off) 예전처럼 멈추는지도 본다.
import {chromium,boot,go} from '../r444/lib.mjs';
let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await go(p,'dist01');
const st=()=>p.evaluate(()=>{const c=window.__STORYWORLD_PHASE1__.controller;return {failed:!!c.state.failed,reason:String(c.state.reason||''),modal:!!modal,three:!!c.state.three,api:window.__STORYWORLD_DRAW_BALANCE_R1329D__.inspect(),t:time};});
let s=await st();ok(s.api.wrapped&&!s.failed,'R1329d 감쌈, 3D 정상 시작 '+JSON.stringify({w:s.api.wrapped,f:s.failed}));
// 그리기 하나가 restore 를 건너뛴 상황을 만든다: 장면 캡처가 시작될 때(reset 뒤) 몹 주인으로 save 하나를 남긴다.
await p.evaluate(()=>{const P=window.StoryPhase1.DrawCommands.prototype,r=P.reset;window.__leak=true;P.reset=function(){const x=r.apply(this,arguments);if(window.__leak&&this.recording!==false)this.scope({id:'enemy:test:leak',kind:'enemy'},()=>this.save());return x;};});
const t0=(await st()).t;await p.waitForFunction(t0=>time>t0+1.2,t0,{timeout:180000});
s=await st();ok(!s.failed&&!s.modal&&s.three,'짝 안 맞는 save 가 매 프레임 있어도 3D 멈춤 없음 '+JSON.stringify({failed:s.failed,modal:s.modal,reason:s.reason.slice(0,80)}));
ok(s.api.leaks>10&&s.api.last?.owners?.includes('enemy:test:leak'),'짝 안 맞음 감지·풀기 '+s.api.leaks+'회, 주인 '+JSON.stringify(s.api.last?.owners));
const log=await p.evaluate(()=>{try{return JSON.stringify(window.__STORYWORLD_ERROR_LOG_R1288__.list());}catch(e){return String(e);}});
ok(/R1329d/.test(log)&&/enemy:test:leak/.test(log),'오류 기록에 주인 id 남음 (logged '+s.api.logged+')');
const n=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(c){h.commands.render=base;res(c.filter(x=>x.kind==='image'&&String(x.owner?.id||'').startsWith('enemy:')).length);return base.apply(this,arguments);};});});
ok(n>0,'몹 그림 명령이 계속 그려짐('+n+')');
// 대조: R1329d 를 끄면 예전처럼 멈춘다(재현 확인)
await p.evaluate(()=>window.__STORYWORLD_DRAW_BALANCE_R1329D__.set(false));const t1=(await st()).t;
await p.waitForFunction(()=>{const c=window.__STORYWORLD_PHASE1__.controller;return /Unbalanced/.test(String(c.state.reason||''))||c.state.failed;},null,{timeout:120000}).catch(()=>{});
s=await st();ok(/Unbalanced/.test(s.reason),'대조: 끄면 Unbalanced 로 실패(원래 증상) — '+s.reason.slice(0,90));
await p.evaluate(()=>{window.__leak=false;window.__STORYWORLD_DRAW_BALANCE_R1329D__.set(true);});
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));
console.log(fail?'R1329D BROWSER FAIL '+fail:'R1329D BROWSER ALL OK');await b.close();process.exit(fail?1:0);
