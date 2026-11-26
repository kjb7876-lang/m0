// R1336 리뷰 P2 — 7대죄 지역(ep1b02~08)은 3D 몹 저장값이 꺼져 있어도 R1326 이 3D 를 강제로 켠다. 그 기본 플레이에서도
//  3D 몹이 죽을 때 2D 그림(R462 실루엣·Dots 죽음 시트 칸)이 화면에 남지 않고 3D 몸이 죽음 동작으로 보여야 한다(사용자 영상 버그).
//  브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님). 3D 몹 저장값은 건드리지 않는다(기본값).
//  기대: ① 죽은 뒤 1.5초 동안 r1336 이 다시 단 죽음 몸 명령이 3D 로 넘어가 렌더 직전 명령에 0개, 그 몹의 2D 몸 경로도 0개.
//        ② 3D 인스턴스가 죽음 동작으로 .8초 이상 보임. ③ 2.5초 뒤 숨김.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1336/r1336-mob-death-sin-browser.mjs` (ZONES=ep1b02,ep1b05)
import {chromium,boot,go} from '../r444/lib.mjs';
const ZONES=(process.env.ZONES||'ep1b02,ep1b05').split(',');
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const APIS=()=>Object.keys(window).filter(k=>/^__STORYWORLD_MOB3D_R\d+[A-Za-z]?__$/.test(k));
for(const z of ZONES){
 await go(p,z);
 await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
 const found=await p.waitForFunction(src=>{const apis=(0,eval)(src)();for(const k of apis){try{const i=window[k].inspect().instances.find(i=>i.visible&&room.enemies.some(e=>String(e.id)===String(i.id)&&e.hp>0&&!e.boss));if(i)return {k,id:String(i.id)};}catch(_){}}
  for(const e of room.enemies)if(e.hp>0&&!e.boss){e.x=player.x+1.5;e.y=player.y-1.2;}return false;},'('+APIS.toString()+')',{timeout:180000,polling:500}).then(h=>h.jsonValue()).catch(()=>null);
 ok(!!found,`준비 ${z}: 저장값 기본에서 3D 로 보이는 몹 (${found?found.k+' '+found.id:'없음'}, 저장값 ${await p.evaluate(()=>JSON.stringify(Object.keys(localStorage).filter(k=>/mob3d/i.test(k)).map(k=>k+'='+localStorage.getItem(k))))})`);
 if(!found)continue;
 const {k,id}=found;
 await p.evaluate(([k,id])=>{const e=room.enemies.find(e=>String(e.id)===id);e.x=player.x+1.5;e.y=player.y-1.2;},[k,id]);await p.waitForTimeout(600);
 const p2=await p.evaluate(id=>new Promise(res=>{const sc=window.__STORYWORLD_PHASE1__.controller.state.three.commands,base=sc.render;const w=function(cmds){const c=cmds.find(c=>c?.kind==='image'&&String(c.owner?.id||'')==='enemy:'+id&&!c.owner.r350);if(c){sc.render=base;res((String(c.sourcePath||'').match(/^.*?\.(webp|png)/i)||[''])[0].replace(/^.*\/assets\//,'assets/'));}return base.apply(this,arguments);};w.__r1304=true;sc.render=w;setTimeout(()=>{sc.render=base;res('');},60000);}),id);
 await p.evaluate(([k,id,path])=>{const sc=window.__STORYWORLD_PHASE1__.controller.state.three.commands,base=sc.render;const key=s=>(String(s||'').match(/^.*?\.(webp|png)/i)||[String(s||'')])[0].replace(/^.*\/assets\//,'assets/');
  const q=window.__r1336S={id,path,log:[],t0:null,base};const w=function(cmds){const out=base.apply(this,arguments);const M=window[k].inspect().instances.find(i=>String(i.id)===id);
   // 3D 상한 안팎으로 오가는 순간을 피해, 방금 그린 프레임에서 3D 로 보인 바로 그때 죽인다.
   if(q.t0===null){if(M?.visible){q.visAtKill=true;q.t0=time;const e=room.enemies.find(e=>String(e.id)===id);hitEnemy(e,e.hp+99999,{});}else if(!q.wait0){q.wait0=time;}else if(time-q.wait0>8){q.visAtKill=false;q.t0=time;const e=room.enemies.find(e=>String(e.id)===id);hitEnemy(e,e.hp+99999,{});}return out;}
   q.log.push({a:time-q.t0,body:cmds.filter(c=>c?.kind==='image'&&path&&key(c.sourcePath)===path&&c.owner?.kind!=='enemy').length/* 살아 있는 같은 종류(2D 로 그려지는 다른 몹)는 enemy 주인 — 죽음 실루엣(scene 주인)만 센다 */,dying:cmds.filter(c=>c?.owner?.r1336Dying).length,vis:!!M?.visible,pose:M?.pose||null});return out;};w.__r1304=true;sc.render=w;
},[k,id,p2]);
 await p.waitForFunction(()=>window.__r1336S.t0!==null&&time-window.__r1336S.t0>2.6,null,{timeout:240000});
 const q=await p.evaluate(()=>{const q=window.__r1336S;window.__STORYWORLD_PHASE1__.controller.state.three.commands.render=q.base;window.__r1336S=null;delete q.base;return {...q,st:window.__STORYWORLD_MOB3D_DEATH_R1336__.inspect().stats};});
 ok(q.visAtKill,`준비 ${z}: 죽인 프레임에 3D 로 보임`);const early=q.log.filter(x=>x.a<=1.5);
 ok(early.length>3&&early.every(x=>x.body===0&&x.dying===0),`① ${z}: 죽은 뒤 1.5초 2D 몸·죽음 시트 0 (2D ${early.filter(x=>x.body).length}·남은 죽음 명령 ${early.filter(x=>x.dying).length}/${early.length} 프레임 ${JSON.stringify(early.filter(x=>x.dying||x.body).map(x=>[+x.a.toFixed(2),x.vis,x.pose]))}, 경로 ${p2}, 죽일 때 3D ${q.visAtKill}, ${JSON.stringify(q.st)})`);
 const dv=q.log.filter(x=>x.vis&&x.pose==='death'),span=dv.length?dv[dv.length-1].a-dv[0].a:0;
 ok(span>=.8,`② ${z}: 3D 몸이 죽음 동작으로 보임 (${span.toFixed(2)}초, 마지막 자세 ${q.log.filter(x=>x.vis).map(x=>x.pose).slice(-1)[0]})`);
 const last=q.log[q.log.length-1];ok(last&&last.a>=2.5&&!last.vis,`③ ${z}: 2.5초 뒤 3D 숨김`);}
console.log(fail?`R1336 7대죄 몹 죽음 실패 ${fail}`:'R1336 7대죄 몹 죽음 통과');await b.close();process.exit(fail?1:0);
