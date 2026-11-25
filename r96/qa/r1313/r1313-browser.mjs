// R1313 3D 영웅 무기 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 3D 꺼짐: 무기 GLB 요청 0. ② 영웅마다 3D 가 보이면 그 무기를 원래 무기 자리(소켓 아래)에 붙임, 오류 0.
//  ③ 방향(몸 좌표): 미카엘라 하트 위, 기억사수 총구 앞(공격 표본 80% 이상), 헌터 활시위가 몸 뒤(쏘는 사람) 쪽, 환도·EGO 칼끝이 손에서 멀리.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1313/r1313-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
const req=[];p.on('request',r=>{const m=/\/assets\/r1313\/([\w-]+\.glb)/.exec(r.url());if(m)req.push(m[1]);});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
await p.waitForTimeout(2000);ok(req.length===0,'① 3D 꺼짐: 무기 GLB 요청 0 ('+req.length+')');
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
const metric=h=>p.evaluate(h=>{const st=window.__STORYWORLD_PHASE1__.controller.state.three,T=st.T,g=st.scene.getObjectByName('r1305-'+h+'-3d-shared');if(!g)return null;const m=g.getObjectByName('r1305-'+h+'-3d-model'),w=g.getObjectByName('r1313-'+h+'-weapon');if(!m||!w)return null;
 m.updateMatrixWorld(true);const L=v=>m.worldToLocal(v);const at=re=>{let n=null;w.traverse(o=>{if(!n&&re.test(o.name||''))n=o;});return n?L(n.getWorldPosition(new T.Vector3())):null;};
 const grip=L(w.getWorldPosition(new T.Vector3())),tip=at(/^(BladeTip|UpperTip|EmissionFX|HeartFX)/),str=at(/^StringCenter/),c=m.getObjectByName('Spine_Chest');const ch=c?L(c.getWorldPosition(new T.Vector3())):null;
 let sock=false;for(let n=w.parent;n;n=n.parent)if(/^Weapon_Socket/.test(n.name||''))sock=true;
 const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();
 return {pose:i.renderedPose,wa:i.weights?.attack??0,sock,tip:tip?tip.clone().sub(grip).toArray():null,len:tip?tip.distanceTo(grip):0,str:str?str.clone().sub(grip).z:null};},h);
for(const h of ['michaela','hunter','gunner','hwando','ego']){
 await p.evaluate(async h=>{const base=h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.egoSovereignR1046=h==='ego';player.personaHeroR1113=false;player.hero=base;player.moving=false;},h);
 await p.waitForFunction(h=>window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect().active[h]?.visible,h,{timeout:240000}).catch(()=>null);
 await p.waitForTimeout(600);const idle=await metric(h);
 ok(idle&&idle.sock,`② ${h}: 무기가 손 소켓 아래에 붙음`);
 const atk=[];for(let k=0;k<2;k++){await p.evaluate(()=>{player.attackAnim=(+player.attackAnim||0)+1;});for(let i=0;i<10;i++){await p.waitForTimeout(80);const v=await metric(h);if(v?.pose==='attack'&&v.wa>.6)atk.push(v);}}
 ok(atk.length>0,`③ ${h}: 공격 표본 ${atk.length}`);
 if(h==='michaela')ok(idle&&idle.tip[1]>0,'③ 미카엘라: 대기에서 하트가 위 (y '+(idle?.tip[1]??NaN).toFixed(3)+')');
 if(h==='gunner'){const f=atk.filter(v=>v.tip[2]>0).length;ok(atk.length&&f/atk.length>=.8,`③ 기억사수: 공격에서 총구가 몸 앞 ${f}/${atk.length}`);}
 if(h==='hunter'){const f=[idle,...atk].filter(v=>v&&v.str<0).length;ok(f===atk.length+1,`③ 헌터: 활시위가 몸 뒤 쪽 ${f}/${atk.length+1}`);}
 if(h==='hwando'||h==='ego')ok(idle&&idle.len>0,`③ ${h}: 칼끝이 손에서 떨어짐 (길이 ${(idle?.len??0).toFixed(3)})`);
}
const s=await p.evaluate(()=>window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect());ok(s.errors===0,'오류 0 ('+s.errors+(s.lastError?' '+s.lastError:'')+')');
ok(new Set(req).size===4&&req.length===4,'무기 GLB 4개 각 1번(환도·EGO 같은 칼) '+req.join(','));
const h3=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect());ok(h3.errors===0,'R1305 3D 오류 0 ('+h3.errors+')');
await b.close();console.log(fail?'R1313 browser FAIL '+fail:'R1313 browser ALL OK');process.exit(fail?1:0);
