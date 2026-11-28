'use strict';
// R1386 CPU 검사 — 사용자 2026-11-28 01:51Z "기억사수 2d만 q스킬 레이져있으니까 8방향공격모션적용해"
//  R1374(2D 영웅 좌우 공격만) 의 예외: 2D 기억사수 몸은 공격·스킬·궁극기 중(과 끝난 뒤 짧은 겨눔 유지 동안)
//  좌·우로 꺾지 않고 8방향 공격 칸을 그대로 쓴다(R143 표적·R991 칸 고르기 그대로). 이동은 여전히 블링크만, 걷는 자세 없음.
//  다른 2D 영웅은 계속 좌·우만. 끄기 storyworld.r1374.hero2d {"gunner8":false}.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..');let n=0,bad=0;
const ok=(c,m,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x));}else console.log('ok  ',m);};
const NAME='hero2d-rules-r1374.js',src=fs.readFileSync(path.join(R,'client-source',NAME),'utf8');
function env(o={}){
 const seen=[];const effects=[];const h3on=o.h3on!==false;
 const sb={console,Math,JSON,Number,Object,Array,String,Set,Map,WeakMap,WeakSet,Error,
  localStorage:{_s:{...(o.ls||{})},getItem(k){return k in this._s?this._s[k]:null;},setItem(k,v){this._s[k]=String(v);}},
  document:{readyState:'complete'},addEventListener(){},time:0,target:null,effects,heroArt:{},VFX:{blink:'vfx-blink'}};
 sb.window=sb;sb.fx=(type,x,y,opt={})=>effects.push({type,x,y,...opt});
 sb.drawHero=function(){const p=sb.player,H=sb.__STORYWORLD_TARGET_HOLD_R1295__;
  seen.push({x:p.x,y:p.y,direction:p.direction,moving:p.moving,hero:p.hero,foe:H&&H.foe?H.foe():null,side:sb.__STORYWORLD_HERO2D_RULES_R1374__.sideOnly()});};
 sb.drawHero.__r1304=true;
 sb.__STORYWORLD_HWANDO3D_R1302__={on:()=>h3on,heroes:()=>['hwando','seoha','hunter','slayer','gunner']};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:NAME});return {sb,seen,effects};
}
const ally=(hero,x,y,extra={})=>{const b={hero,x,y,direction:'back',moving:false,moveVX150:0,moveVY150:0,attackAnim:0,skillAnim:0,ultimateAnim:0,...extra};Object.defineProperty(b,'r720Ally',{value:true,enumerable:false});return b;};
const draw=(E,p,t)=>{E.sb.time=t;E.sb.player=p;E.sb.drawHero();return E.seen[E.seen.length-1];};
const sideFoe=s=>!!(s.foe&&s.foe.r1374Side);

{// 1. 2D 기억사수 소환 몸: 공격 중 위쪽 표적 → 좌·우로 꺾지 않음, 가상 좌우 표적 없음, 칸 고르기 좌우 제한 없음
 const E=env();const b=ally('gunner',5,5,{direction:'back',attackAnim:.3});E.sb.target={x:4,y:4,hp:9};/* 화면 정 위 */
 const s=draw(E,b,1);
 ok(s.direction==='back','공격 중 기억사수 방향은 원래 방향(뒤) 그대로 — 좌·우로 안 꺾음',s);
 ok(!sideFoe(s),'기억사수 공격 그림은 가상 좌·우 표적을 보지 않음(R143 8방향 시트)',s.foe);
 ok(s.side===false,'그리는 동안 sideOnly 거짓(R991 8방향 칸)',s);
 ok(s.moving===false,'걷는 자세는 여전히 없음',s);
 ok(b.direction==='back','그린 뒤 원래 값');
}
{// 2. 스킬(Q 레이저)·궁극기 중에도 8방향
 const E=env();const b=ally('gunner',5,5,{direction:'front',skillAnim:.5});E.sb.target={x:7,y:7,hp:9};
 let s=draw(E,b,1);ok(s.direction==='front'&&!sideFoe(s)&&s.side===false,'Q 스킬 중 아래 표적 — 앞 방향 그대로·8방향',s);
 b.skillAnim=0;b.ultimateAnim=.5;s=draw(E,b,1.05);ok(s.direction==='front'&&!sideFoe(s),'궁극기 중에도 8방향',s);
}
{// 3. 틱(그리기 밖)에서 player 가 2D 기억사수 몸이면 sideOnly 거짓, 다른 2D 영웅은 참
 const E=env(),A=E.sb.__STORYWORLD_HERO2D_RULES_R1374__;
 E.sb.player=ally('gunner',0,0,{attackAnim:.2});ok(A.sideOnly()===false,'틱: 2D 기억사수 소환 몸이 쏠 때 8방향 칸');
 E.sb.player=ally('hunter',0,0,{attackAnim:.2});ok(A.sideOnly()===true,'틱: 2D 헌터 소환 몸은 여전히 좌·우만');
 const E2=env({h3on:false});E2.sb.player={hero:'gunner',x:0,y:0,attackAnim:.2};ok(E2.sb.__STORYWORLD_HERO2D_RULES_R1374__.sideOnly()===false,'3D 끈 조종 기억사수(2D)도 8방향');
}
{// 4. 다른 2D 영웅(회귀): 공격 중 뒤 방향이면 여전히 좌·우 + 가상 좌우 표적
 const E=env();for(const h of ['hunter','slayer','hwando','michaela']){const b=ally(h,5,5,{direction:'back',attackAnim:.3});E.sb.target={x:3,y:5,hp:9};
  const s=draw(E,b,1+Math.random());ok(s.direction==='left'&&sideFoe(s)&&s.side===true,`${h}: 2D 는 좌·우 공격만 유지`,s);}
}
{// 5. 겨눔 유지: 공격 끝난 뒤 0.6초 안은 8방향 서 있기, 그 뒤엔 좌·우
 const E=env();const b=ally('gunner',5,5,{direction:'back',attackAnim:.2});E.sb.target={x:4,y:4,hp:9};
 draw(E,b,1);b.attackAnim=0;let s=draw(E,b,1.4);ok(s.direction==='back'&&!sideFoe(s),'공격 끝 0.4초: 겨눈 방향 유지',s);
 s=draw(E,b,1.75);ok(s.direction==='left'||s.direction==='right','공격 끝 0.75초: 다시 좌·우 서 있기',s);
 const c=ally('gunner',5,5,{direction:'back'});s=draw(E,c,5);ok(s.direction==='left'||s.direction==='right','한 번도 안 쏜 기억사수 서 있기는 좌·우',s);
}
{// 6. 이동은 여전히 블링크만
 const E=env();const b=ally('gunner',0,0,{direction:'right'});draw(E,b,1);
 b.x=.5;let s=draw(E,b,1.05);ok(Math.abs(s.x)<1e-9,'걷는 동안 그림은 떠난 자리',s);
 s=draw(E,b,1.3);ok(Math.abs(s.x-.5)<1e-9&&E.effects.some(e=>e.asset==='vfx-blink'),'멈추면 블링크로 옮김',s);
}
{// 7. 끄기 {"gunner8":false} → 예전 R1374(좌·우만)
 const E=env({ls:{'storyworld.r1374.hero2d':'{"gunner8":false}'}});const b=ally('gunner',5,5,{direction:'back',attackAnim:.3});E.sb.target={x:4,y:4,hp:9};
 const s=draw(E,b,1);ok((s.direction==='left'||s.direction==='right')&&sideFoe(s)&&s.side===true,'gunner8 끄면 기억사수도 좌·우만',s);
 ok(E.sb.__STORYWORLD_HERO2D_RULES_R1374__.inspect().prefs.gunner8===false,'inspect 에 gunner8 설정 보임');
}
{// 8. 3D 조종 기억사수는 손대지 않음(R1374 그대로)
 const E=env();const p={hero:'gunner',x:1,y:1,direction:'back',moving:true,attackAnim:.3};const s=draw(E,p,1);
 ok(s.direction==='back'&&s.moving===true&&!sideFoe(s),'3D 조종 기억사수는 통과',s);
}
{// 9. R991 칸 고르기는 여전히 sideOnly 를 따름(기억사수 예외는 sideOnly 쪽에서)
 const s991=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');ok(/sideOnlyR1374\(\)\?\['e'\]:SHEETS/.test(s991),'R991 pick 은 sideOnly 로 좌우 제한');
 ok(/R1386/.test(src),'R1374 파일에 R1386 예외 표기');
}
console.log(`RESULT ${bad?'FAIL':'PASS'} ${n-bad}/${n}`);process.exit(bad?1:0);
