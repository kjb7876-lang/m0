'use strict';
// R1374 CPU 검사 — 사용자 2026-11-27 07:16~07:17Z
//  "이제부터 영웅은 3d가 기본이고 다 3d기준", "2d랑 3d영웅을 별도 개별로 취급",
//  "2d영웅은 좌우공격모션만 하도록 어떤상황에서던지 이동은 블링크로만".
//  2D 영웅 몸(서하 평행세계 소집·EGO R 소환·헌터 분대·무한생존 배치 타워 = r720Ally 몸, 협동 동료, 3D 를 끈 조종 영웅)을
//  그릴 때: ① 방향은 좌·우만(앞·뒤 → 표적 쪽 또는 마지막 좌우) ② 걷는 자세·흔들림 없음(moving=false)
//  ③ 그림 자리는 블링크로만 바뀜(걷는 동안 제자리, 멈추면·공격 시작·2칸 넘게 벌어지면 블링크 연출과 함께 한 번에)
//  ④ 3D 로 그려지는 조종 영웅은 손대지 않음 ⑤ 그린 뒤 판정용 값(x·y·direction·moving)은 원래대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..');let n=0,bad=0;
const ok=(c,m,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x));}else console.log('ok  ',m);};
const NAME='hero2d-rules-r1374.js',FILE=path.join(R,'client-source',NAME);
if(!fs.existsSync(FILE)){ok(false,'오버레이 파일 있음 '+NAME);console.log(`RESULT FAIL ${bad}/${n}`);process.exit(1);}
const src=fs.readFileSync(FILE,'utf8');
function env(o={}){
 const seen=[];const effects=[];let h3on=o.h3on!==false;
 const sb={console,Math,JSON,Number,Object,Array,String,Set,Map,WeakMap,WeakSet,Error,
  localStorage:{_s:{...(o.ls||{})},getItem(k){return k in this._s?this._s[k]:null;},setItem(k,v){this._s[k]=String(v);}},
  document:{readyState:'complete'},addEventListener(){},time:0,target:null,effects,
  heroArt:{hunter:{dash:{left:'dash-l',right:'dash-r',front:'dash-f',back:'dash-b'}},slayer:{dash:{left:'sd-l',right:'sd-r',front:'sd-f',back:'sd-b'}}},
  VFX:{blink:'vfx-blink'},sounds:[]};
 sb.window=sb;
 sb.fx=function(type,x,y,opt={}){effects.push({type,x,y,...opt});};
 sb.sound=k=>sb.sounds.push(k);
 sb.drawHero=function(){const p=sb.player;sb.__seenHold=sb.__STORYWORLD_TARGET_HOLD_R1295__&&sb.__STORYWORLD_TARGET_HOLD_R1295__.foe?sb.__STORYWORLD_TARGET_HOLD_R1295__.foe():null;sb.__seenSide=sb.__STORYWORLD_HERO2D_RULES_R1374__?sb.__STORYWORLD_HERO2D_RULES_R1374__.sideOnly():null;if(o.nest&&!sb.__in){sb.__in=true;const ox=p.x;p.x+=.5;try{sb.drawHero();}finally{p.x=ox;sb.__in=false;}}if(sb.ctx&&Array.isArray(sb.ctx.commands))sb.ctx.commands.push({kind:'image',x:p.x});seen.push({x:p.x,y:p.y,direction:p.direction,moving:p.moving,vx:p.moveVX150,vy:p.moveVY150,hero:p.hero});};
 sb.drawHero.__r1304=true;sb.drawHero.tag='base';
 sb.__STORYWORLD_HWANDO3D_R1302__={on:()=>h3on,heroes:()=>['hwando','seoha','hunter','slayer']};
 if(o.rec)sb.ctx={commands:[]};
 if(o.coop)sb.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host',localPlayer:()=>o.coop.local};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:NAME});
 return {sb,seen,effects,setH3:v=>{h3on=v;}};
}
const ally=(hero,x,y,extra={})=>{const b={hero,x,y,direction:'front',moving:false,moveVX150:0,moveVY150:0,attackAnim:0,skillAnim:0,...extra};Object.defineProperty(b,'r720Ally',{value:true,enumerable:false});return b;};
const draw=(E,p,t)=>{E.sb.time=t;E.sb.player=p;E.sb.drawHero();return E.seen[E.seen.length-1];};
const blinks=E=>E.effects.filter(e=>e.type==='sigil'&&e.asset==='vfx-blink');

{// 0. 공개 객체·감싸기
 const E=env();const A=E.sb.__STORYWORLD_HERO2D_RULES_R1374__;
 ok(!!A&&typeof A.inspect==='function','공개 객체 __STORYWORLD_HERO2D_RULES_R1374__');
 ok(E.sb.drawHero.__r1374===true&&E.sb.drawHero.__r1304===true,'drawHero 를 감싸고 R1302 감싼 표시를 이어받음(재감싸기 핑퐁 방지)');
}
{// 1. 소환 몸: 앞·뒤 방향 → 좌·우, 걷기 끔, 그린 뒤 원래 값
 const E=env();const b=ally('hunter',5,5,{direction:'front',moving:true,moveVX150:.7,moveVY150:.7});
 const s=draw(E,b,1);
 ok(s.direction==='left'||s.direction==='right','소환 몸 앞 방향 → 좌·우로 그림',s);
 ok(s.moving===false&&s.vx===0&&s.vy===0,'소환 몸 걷는 자세 안 씀(moving·이동 벡터 0)',s);
 ok(b.direction==='front'&&b.moving===true&&b.moveVX150===.7,'그린 뒤 판정용 방향·moving 원래대로',{d:b.direction,m:b.moving});
 for(const d of ['back','front']){b.direction=d;const q=draw(E,b,1.01);ok(q.direction==='left'||q.direction==='right',`'${d}' → 좌·우`,q);}
 b.direction='left';ok(draw(E,b,1.02).direction==='left','좌 방향은 그대로 좌');
 b.direction='right';ok(draw(E,b,1.03).direction==='right','우 방향은 그대로 우');
 b.direction='back';ok(draw(E,b,1.04).direction==='right','앞·뒤인데 표적 없으면 마지막 좌우(우) 유지');
}
{// 2. 공격 중 앞·뒤면 표적 화면 쪽으로
 const E=env();const b=ally('slayer',5,5,{direction:'back',attackAnim:.3});
 E.sb.target={x:3,y:5,hp:10};/* 화면 x ∝ x-y → 왼쪽 */ok(draw(E,b,1).direction==='left','공격 중 뒤 방향 + 표적 왼쪽 → 왼쪽 공격');
 E.sb.target={x:5,y:3,hp:10};/* x-y 증가 → 오른쪽 */b.attackAnim=.3;ok(draw(E,b,1.1).direction==='right','공격 중 뒤 방향 + 표적 오른쪽 → 오른쪽 공격');
 E.sb.target={x:6,y:6,hp:10};/* 화면 x 같음(정면 위) → 마지막 좌우 */ok(draw(E,b,1.2).direction==='right','표적이 정확히 위·아래면 마지막 좌우');
}
{// 3. 이동은 블링크로만
 const E=env();const b=ally('hunter',0,0,{direction:'right'});
 draw(E,b,0);// 첫 그림 = 그 자리
 let moves=0,prev=null,maxStep=0;const path=[];
 for(let i=1;i<=6;i++){b.x=i*.3;b.moving=true;const s=draw(E,b,i*.05);path.push([s.x,s.y]);}
 ok(path.every(([x,y])=>x===0&&y===0),'걷는 동안(1.8칸 안) 그림은 제자리',path);
 ok(blinks(E).length===0,'걷는 동안 블링크 없음');
 // 계속 걸어 2칸 넘게 벌어지면 블링크
 b.x=2.1;const s1=draw(E,b,.35);ok(Math.abs(s1.x-2.1)<1e-9,'2칸 넘게 벌어지면 한 번에 지금 자리로',s1);
 ok(blinks(E).length===1,'그때 블링크 연출 1번',blinks(E).length);
 const g=E.effects.find(e=>e.type==='ghost');ok(!!g&&g.x===0&&g.y===0&&g.asset==='dash-r','떠난 자리에 잔상(돌진 그림)',g);
 // 경계: 정확히 2칸 미만(1.99)은 걷는 중이면 블링크 안 함
 b.x=2.1+1.99;draw(E,b,.40);ok(blinks(E).length===1,'경계 1.99칸 벌어짐은 걷는 중 블링크 안 함');
 // 멈추면(0.12초 넘게 자리 그대로) 블링크
 draw(E,b,.45);ok(blinks(E).length===1,'멈춘 지 0.05초는 아직');
 const s2=draw(E,b,.60);ok(Math.abs(s2.x-4.09)<1e-9&&blinks(E).length===2,'멈춘 지 0.12초 넘으면 블링크로 도착',{s2,n:blinks(E).length});
 const s3=draw(E,b,.7);ok(blinks(E).length===2&&s3.x===s2.x,'도착 뒤엔 더 블링크 없음');
 ok(!E.sb.sounds.length,'소환 몸 블링크는 소리 안 냄(난사 방지)');
}
{// 4. 공격 시작 순간 블링크(공격은 그림 자리 = 실제 자리에서)
 const E=env();const b=ally('slayer',0,0,{direction:'left'});draw(E,b,0);
 b.x=-.8;b.moving=true;draw(E,b,.05);ok(blinks(E).length===0,'공격 전 걷는 중 블링크 없음');
 b.attackAnim=.3;const s=draw(E,b,.1);ok(s.x===-.8&&blinks(E).length===1,'공격 시작 → 블링크로 실제 자리에서 공격',s);
 b.x=-1.0;const s2=draw(E,b,.15);ok(s2.x===-.8&&blinks(E).length===1,'공격 중 밀려도 그림은 공격 자리 고정');
}
{// 5. 아주 작은 어긋남(0.05칸 이하)은 연출 없이 맞춤, 방 이동처럼 먼 순간이동은 연출 없이
 const E=env();const b=ally('hunter',0,0);draw(E,b,0);b.x=.04;draw(E,b,.3);const s=draw(E,b,.5);
 ok(s.x===.04&&blinks(E).length===0,'0.04칸 밀림은 조용히 맞춤',s);
 b.x=40;const s2=draw(E,b,.6);ok(s2.x===40&&blinks(E).length===0,'방이 바뀌어 수십 칸 옮겨지면 조용히 맞춤');
 E.sb.time=.1;b.x=41;const s3=draw(E,b,.1);ok(s3.x===41,'게임 시간이 거꾸로 가면(새 판) 새로 시작');
}
{// 6. 3D 조종 영웅은 손대지 않음, 3D 를 끄면 조종 영웅도 2D 규칙
 const E=env();const p={hero:'hunter',x:0,y:0,direction:'front',moving:true,moveVX150:1,moveVY150:0};
 const s=draw(E,p,0);ok(s.direction==='front'&&s.moving===true,'3D 조종 영웅 그리기는 그대로(앞 방향·걷기 유지)');
 p.x=1;const s1=draw(E,p,.05);ok(s1.x===1,'3D 조종 영웅 자리 그대로');
 const E2=env({h3on:false});const q={hero:'hunter',x:0,y:0,direction:'back',moving:true,moveVX150:1,moveVY150:0};
 const t=draw(E2,q,0);ok((t.direction==='left'||t.direction==='right')&&t.moving===false,'3D 끈 조종 영웅 = 2D 규칙');
 q.x=1;ok(draw(E2,q,.05).x===0,'3D 끈 조종 영웅도 걷는 동안 그림 제자리');
 const E3=env();const r={hero:'neon',x:0,y:0,direction:'front',moving:true};ok(draw(E3,r,0).moving===false,'3D 모델 없는 영웅(목록 밖)은 2D 규칙');
}
{// 7. 협동: 내 몸이 3D 면 그대로, 동료 몸은 2D 규칙
 const me={hero:'hunter',x:0,y:0,direction:'front',moving:true},mate={hero:'slayer',x:3,y:3,direction:'front',moving:true};
 const E=env({coop:{local:me}});
 ok(draw(E,me,0).moving===true,'협동 내 3D 몸 그대로');ok(draw(E,mate,0).moving===false&&['left','right'].includes(E.seen.at(-1).direction),'협동 동료 몸 = 2D 규칙');
}
{// 8. 겹친 그리기(분신 R767·R945 가 drawHero 안에서 자리만 옮겨 또 부름)는 자리 계산을 다시 하지 않음
 const E=env({nest:true});const b=ally('hunter',0,0,{direction:'right'});draw(E,b,0);
 b.x=1;b.moving=true;const before=E.seen.length;E.sb.time=.05;E.sb.player=b;E.sb.drawHero();
 const inner=E.seen.slice(before);ok(inner.length===2,'바깥·안쪽 두 번 그림',inner.length);
 ok(inner.every(s=>s.direction==='right'&&s.moving===false),'안쪽(분신) 그림도 좌우·걷기 없음',inner);
 ok(blinks(E).length===0,'안쪽 그림 때문에 블링크가 생기지 않음',blinks(E).length);
 ok(inner[0].x===.5&&inner[1].x===0,'안쪽은 바깥 그림 자리에서 옮긴 만큼만(자리 다시 계산 안 함)',inner);
 ok(b.x===1,'끝난 뒤 실제 자리 원래대로');
}
{// 9. 끄기
 const E=env({ls:{'storyworld.r1374.hero2d':'{"on":false}'}});const b=ally('hunter',0,0,{direction:'front',moving:true});
 const s=draw(E,b,0);ok(s.direction==='front'&&s.moving===true,'끄기 설정이면 원래대로');
}
{// 11. 블링크 그림에서 위치 변화로 걷기를 짐작하는 그리기(R119)가 블링크를 걸음으로 읽지 않게: 먼 자리에서 한 번 보이지 않게 그리고 지움
 const E=env({rec:true});const b=ally('slayer',0,0,{direction:'right'});draw(E,b,0);const c0=E.sb.ctx.commands.length;
 b.x=.6;draw(E,b,.05);const n1=E.seen.length;const s=draw(E,b,.3);/* 멈춤 → 블링크 */
 const calls=E.seen.slice(n1);ok(calls.length===2,'블링크 그림에서 그리기 2번(숨은 1번 + 보이는 1번)',calls.length);
 ok(calls[0].x>1000&&calls[1].x===.6,'숨은 그리기는 아주 먼 자리, 보이는 그리기는 새 자리',calls.map(c=>c.x));
 ok(E.sb.ctx.commands.every(c=>c.x<1000),'숨은 그리기의 기록 명령은 남지 않음',E.sb.ctx.commands.length);
 ok(E.sb.ctx.commands.length===c0+2,'보이는 그림 명령은 그대로 남음',E.sb.ctx.commands.length-c0);
 const n2=E.seen.length;draw(E,b,.35);ok(E.seen.length===n2+1,'블링크 다음 그림부터는 한 번만 그림');
 const E2=env();const b2=ally('slayer',0,0);draw(E2,b2,0);b2.x=.6;draw(E2,b2,.05);const m=E2.seen.length;draw(E2,b2,.3);
 ok(E2.seen.length===m+1,'그림 기록기 없는 캔버스에선 숨은 그리기 안 함(보이는 그림이 남으므로)');
}
{// 12. 공격 시트를 '겨눈 적'으로 고르는 그리기(R143·R991)가 2D 몸을 그리는 동안 좌·우만 보게
 const E=env();const orig={revision:'x',foe:()=>({x:9,y:9,hp:5})};E.sb.__STORYWORLD_TARGET_HOLD_R1295__=orig;
 const b=ally('slayer',5,5,{direction:'left'});draw(E,b,0);const f=E.sb.__seenHold;
 ok(!!f&&Math.abs((f.x-5)+(f.y-5))<1e-9&&(f.x-5)-(f.y-5)<0,'그리는 동안 표적 = 몸 정확히 왼쪽(화면 가로)',f);
 ok(E.sb.__seenSide===true,'그리는 동안 sideOnly() 참(R991 좌우 칸만)');
 ok(E.sb.__STORYWORLD_TARGET_HOLD_R1295__===orig&&E.sb.__STORYWORLD_HERO2D_RULES_R1374__.sideOnly()===false,'그린 뒤 원래 표적 객체·sideOnly 거짓으로');
 b.direction='right';draw(E,b,.01);ok((E.sb.__seenHold.x-5)-(E.sb.__seenHold.y-5)>0,'오른쪽이면 표적도 오른쪽');
 const E2=env();const b2=ally('slayer',0,0);draw(E2,b2,0);ok(!('__STORYWORLD_TARGET_HOLD_R1295__' in E2.sb),'원래 없던 표적 객체는 그린 뒤 지움');
 const E3=env();E3.sb.__STORYWORLD_TARGET_HOLD_R1295__=orig;const me={hero:'hunter',x:0,y:0,direction:'front'};draw(E3,me,0);
 ok(E3.sb.__seenHold.x===9&&E3.sb.__seenSide===false,'3D 조종 영웅 그리기는 원래 표적 그대로');
}
{// 13. R991 기억사수 시트 고르기가 sideOnly 를 따름
 const src991=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
 ok(/sideOnlyR1374\(\)\?\['e'\]:SHEETS/.test(src991),'R991 pick: 2D 몸이면 e(반전 포함)만');
}
{// 10. 빌드 연결(태그·검사 목록·sync 목록·CI 줄)
 const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
 ok(idx.includes('<script src="./'+NAME+'"></script>'),'index.html 스크립트 태그');
 const ver=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');ok(ver.includes(NAME),'verify-r96-public.py 기대 목록');
 const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes(NAME),'runtime-manifest.json');
 const wf=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');ok(wf.includes('qa/r1374/r1374-cpu-check.cjs'),'pages.yml CPU 검사 줄');
}
console.log(bad?`RESULT FAIL ${bad}/${n}`:`RESULT PASS ${n}`);process.exit(bad?1:0);
