// R1318 3D 영웅 무기 쥐기 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 손에 쥠: 무기 손잡이(GripSocket)가 손(Weapon_Socket) 에 붙음 — 거리 ≤ 아래팔 길이의 10%, 대기·공격 모든 표본.
//  ② 기억사수 총 위아래: 총 위쪽(손잡이→총열 쪽, 무기 -X)이 몸 위(+Y) — 대기 + 공격 80% 이상.
//  ③ 방향이 자세에 따라 바뀌지 않음: 영웅을 걷기·공격 중에 바꿔 무기를 새로 붙여도 ②·총구 앞·하트 위·활시위 뒤가 그대로.
//  ④ 다른 영웅 회귀: 미카엘라 하트 위, 헌터 활시위 몸 뒤, 환도·EGO 칼끝이 손에서 멀리, 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1318/r1318-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
const metric=h=>p.evaluate(h=>{const st=window.__STORYWORLD_PHASE1__.controller.state.three,T=st.T,g=st.scene.getObjectByName('r1305-'+h+'-3d-shared');if(!g)return null;const m=g.getObjectByName('r1305-'+h+'-3d-model'),w=g.getObjectByName('r1313-'+h+'-weapon');if(!m||!w)return null;
 m.updateMatrixWorld(true);const L=o=>m.worldToLocal(o.getWorldPosition(new T.Vector3()));
 let sock=w.parent;while(sock&&!/^Weapon_Socket/.test(sock.name||''))sock=sock.parent;if(!sock)return null;
 let root=null,tipN=null,strN=null;w.traverse(o=>{const n=o.name||'';if(!root&&/^SW_/.test(n)&&!/_MESH$/.test(n))root=o;if(!tipN&&/^(BladeTip|UpperTip|EmissionFX|HeartFX)/.test(n))tipN=o;if(!strN&&/^StringCenter/.test(n))strN=o;});
 const grip=L(root||w),hand=L(sock),fore=hand.distanceTo(L(sock.parent));
 const rm=new T.Matrix4().copy(m.matrixWorld).invert().multiply((root||w).matrixWorld);const up=new T.Vector3(-1,0,0).transformDirection(rm);
 const tip=tipN?L(tipN).sub(grip):null,str=strN?L(strN).sub(grip):null;const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();
 return {pose:i.renderedPose,wa:i.weights?.attack??0,off:grip.distanceTo(hand)/fore,upY:up.y,tip:tip?.toArray(),len:tip?tip.length():0,strZ:str?str.z:null};},h);
const pick=async(h,{moving=false,attack=false}={})=>{await p.evaluate(async([h,moving])=>{const base=h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.egoSovereignR1046=h==='ego';player.personaHeroR1113=false;player.hero=base;player.moving=moving;},[h,moving]);
 const t0=Date.now();while(Date.now()-t0<240000){if(attack)await p.evaluate(()=>{player.attackAnim=(+player.attackAnim||0)+1;});const v=await p.evaluate(h=>window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect().active[h]?.visible,h);if(v)break;await p.waitForTimeout(40);}
 if(attack)for(let i=0;i<8;i++){await p.evaluate(()=>{player.attackAnim=(+player.attackAnim||0)+1;});await p.waitForTimeout(60);}
 await p.evaluate(()=>{player.moving=false;});await p.waitForTimeout(900);};
const sample=async h=>{let idle=null;for(let i=0;i<120;i++){idle=await metric(h);if(idle?.pose==='idle'&&idle.wa<.05)break;await p.waitForTimeout(100);}const atk=[];for(let k=0;k<2;k++){await p.evaluate(()=>{player.attackAnim=(+player.attackAnim||0)+1;});for(let i=0;i<10;i++){await p.waitForTimeout(80);const v=await metric(h);if(v?.pose==='attack'&&v.wa>.6)atk.push(v);}}return {idle,atk};};
const dirChecks=(h,tag,{idle,atk})=>{const all=[idle,...atk].filter(Boolean);
 if(h==='gunner'){ok(idle&&idle.upY>0,`② ${tag}기억사수: 대기에서 총 위쪽이 몸 위 (y ${(idle?.upY??NaN).toFixed(2)})`);const u=atk.filter(v=>v.upY>0).length;ok(atk.length&&u/atk.length>=.8,`② ${tag}기억사수: 공격에서 총 위쪽이 몸 위 ${u}/${atk.length}`);
  const f=atk.filter(v=>v.tip[2]>0).length;ok(atk.length&&f/atk.length>=.8,`④ ${tag}기억사수: 공격에서 총구가 몸 앞 ${f}/${atk.length}`);}
 if(h==='michaela')ok(idle&&idle.tip[1]>0,`④ ${tag}미카엘라: 대기에서 하트가 위 (y ${(idle?.tip[1]??NaN).toFixed(3)})`);
 if(h==='hunter'){const f=all.filter(v=>v.strZ<0).length;ok(f===all.length,`④ ${tag}헌터: 활시위가 몸 뒤 쪽 ${f}/${all.length}`);}
 if(h==='hwando'||h==='ego')ok(idle&&idle.len>0,`④ ${tag}${h}: 칼끝이 손에서 떨어짐 (길이 ${(idle?.len??0).toFixed(3)})`);};
for(const h of ['gunner','michaela','hunter','hwando','ego']){
 await pick(h);const r=await sample(h);ok(r.atk.length>0,`${h}: 공격 표본 ${r.atk.length}`);
 const all=[r.idle,...r.atk].filter(Boolean),worst=Math.max(...all.map(v=>v.off));ok(all.length&&worst<=.1,`① ${h}: 손잡이가 손에 붙음(최대 거리 ${worst.toFixed(3)} × 아래팔 ≤ .1)`);
 dirChecks(h,'',r);
}
// ③ 걷기·공격 중에 영웅을 바꿔 무기를 새로 붙임
for(const h of ['gunner','michaela','hunter']){await pick('hwando');await p.evaluate(()=>{room.__r1318=1;});
 for(const how of [{moving:true},{attack:true}]){await pick(h==='gunner'?'michaela':'gunner');await pick(h,how);dirChecks(h,`③ ${how.moving?'걷다가':'공격 중'} 바꾼 `,await sample(h));}}
const s=await p.evaluate(()=>window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect());ok(s.errors===0,'오류 0 ('+s.errors+(s.lastError?' '+s.lastError:'')+')');
const h3=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect());ok(h3.errors===0,'R1305 3D 오류 0 ('+h3.errors+')');
await b.close();console.log(fail?'R1318 browser FAIL '+fail:'R1318 browser ALL OK');process.exit(fail?1:0);
