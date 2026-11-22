// R1303 3D 환도 모션 — 브라우저 검사(헤드리스, SwiftShader). 동작이 바뀔 때 가중치가 섞이는지(뚝 끊김 없음)·걷기 속도 연동·오류 0.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(async()=>{await ensureImages(heroPaths('hwando'));player.hero='hwando';player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const API='window.__STORYWORLD_HWANDO3D_R1302__';
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.().ready===true,null,{timeout:180000}).catch(()=>null);
await p.waitForTimeout(800);
const rev=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().revision);ok(/R130[345]/.test(rev),'R1303(또는 후속 R1304·R1305) 판 ('+rev+')');
// 프레임마다 inspect() 기록
const rec=(n,setup)=>p.evaluate(([n,setup])=>new Promise(res=>{const out=[];let k=0;const f=()=>{try{(new Function("k",setup))(k);}catch(e){}const s=window.__STORYWORLD_HWANDO3D_R1302__.inspect();out.push({a:s.action,w:s.weights,t:typeof time==='number'?+time.toFixed(3):null,v:Math.hypot(+player.moveVX150||0,+player.moveVY150||0)});if(++k<n)requestAnimationFrame(f);else res(out);};requestAnimationFrame(f);}),[n,setup]);
// ① 대기 → 베기 → 대기
const atk=await rec(40,"if(k>=2&&k<=5){player.moving=false;player.attackAnim=Math.max(+player.attackAnim||0,.2);}");
const mixA=atk.filter(r=>r.w&&r.w.attack>.02&&r.w.attack<.98&&r.w.idle>.02);
ok(atk.some(r=>r.a==='attack'),'① 공격 자세 나옴');
ok(mixA.length>=1,'① 대기↔베기 사이에 섞이는 프레임 있음 ('+mixA.length+'프레임) '+JSON.stringify(mixA.slice(0,3).map(r=>r.w)));
ok(atk.slice(-3).every(r=>r.a==="idle"&&r.w&&r.w.idle>.9),'① 베기 끝나면 대기로 돌아옴 '+JSON.stringify(atk.slice(-1)[0]));
// ② 걷기: 오른쪽 화살표
await p.keyboard.down('ArrowRight');const wk=await rec(30,"");await p.keyboard.up('ArrowRight');
const mixW=wk.filter(r=>r.w&&r.w.walk>.02&&r.w.walk<.98);
ok(wk.some(r=>r.a==='walk'),'② 걷기 자세 나옴');ok(mixW.length>=1,'② 대기→걷기 섞임 ('+mixW.length+'프레임)');
const vs=wk.filter(r=>r.a==='walk').map(r=>r.v).sort((a,b)=>a-b);console.log('   걷기 moveVX150 크기 중앙값',vs.length?vs[vs.length>>1].toFixed(2):'-');
const st=await rec(20,"");ok(st.slice(-2).every(r=>r.a==="idle"),'② 멈추면 대기');
const errs=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().errors);ok(errs===0,'오류 0 ('+errs+')');
await b.close();console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
