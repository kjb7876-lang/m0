'use strict';
// R706 — 실검무(자동 실 춤) 중에도 본체는 직접 조종, 타격 자리에는 분신만
//  (사용자 2026-11-12 "분신 모습만 잠깐 나왔다가 사라지는 거, 본체는 항상 본체쪽에서 작동 모든영웅", "기본모드 실입력해도 가끔 위치고정", "뭔가 벽이 있는 느낌 앞으로 갔다 되돌아오는").
//  원인: 엔진 실검무(R63/R74)가 타격마다 영웅을 적 곁으로 옮기고 끝나면 시작 자리로 되돌린다 → 그동안 걸어도 끌려갔다 돌아온다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='dance-free-r706.js',src=rd(path.join(R,'client-source',NAME)),html=rd(path.join(R,'runtime-text/index.html')),r113=rd(path.join(R,'client-source/play-r113.js'));
ok(src.length>0,'client-source/'+NAME+' 있음');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
ok(/<script src="\.\/boss-motion-r620\.js"><\/script>\s*<script src="\.\/dance-free-r706\.js"><\/script>/.test(html),'index.html: boss-motion-r620 바로 뒤에 dance-free-r706 태그');
ok(html.indexOf(NAME)>html.indexOf('play-r113.js')&&html.indexOf(NAME)<html.indexOf('"./combat-r118.js"'),'play-r113 뒤·combat-r118 앞');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r706/dance-free-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(R,'runtime-manifest.json')).includes(NAME)&&rd(path.join(R,'runtime-inputs.json')).includes(NAME),'runtime-manifest·inputs 등록');
ok(/__STORYWORLD_DANCE_FREE_R706__/.test(r113),'play-r113 원거리 고정점이 R706 을 묻는다(끝에 시작 자리로 되돌리지 않음)');

// ── 동작(vm): 엔진 실검무를 흉내 낸 가짜 춤 — 타격마다 영웅을 적 곁으로 옮기고 끝나면 시작 자리(home)로 되돌린다.
function mk(o={}){
 const store=Object.assign({},o.store||{});
 const sb={console,Math,Number,Object,Array,Set,Map,JSON,String,
  localStorage:{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  time:0,started:true,modal:null,loading:false,room:{id:'z'},
  player:{hero:o.hero||'slayer',x:10,y:10,hp:100,direction:'front',blinkCD:0},
  heroArt:{slayer:{attack:{front:'atk-front'}},michaela:{attack:{front:'m-atk'}}},
  ghosts:[],strikes:[],input:{x:0,y:0},wall:o.wall??1e9,
  blocked:(x,y)=>x>sb.wall,
  moveActor(a,dx,dy){if(!sb.blocked(a.x+dx,a.y))a.x+=dx;if(!sb.blocked(a.x,a.y+dy))a.y+=dy;},
  fx(type,x,y,opt){if(type==='ghost')sb.ghosts.push({x,y,asset:opt?.asset,life:opt?.life});},
  blink(){sb.player.x+=3;sb.player.blinkCD=1;},
  dance:null,// {home,foe,until}
  tick(dt){sb.time+=dt;const p=sb.player;
   if(sb.input.x||sb.input.y)sb.moveActor(p,sb.input.x*dt*5,sb.input.y*dt*5);
   if(sb.castDash){sb.castDash=false;const o={x:p.x,y:p.y};sb.moveActor(p,3.8,0);sb.dashSeen={from:o,to:{x:p.x,y:p.y}};}
   const d=sb.dance;if(d){if(sb.time<d.until){p.x=d.foe.x-.8;p.y=d.foe.y;sb.strikes.push({x:p.x,y:p.y});}else{p.x=d.home.x;p.y=d.home.y;sb.dance=null;}}},
  __STORYWORLD_DANCES_R74__:{moving:()=>!!sb.dance,nativeActive:()=>!!sb.dance}};
 sb.startDance=(fx,fy,dur)=>{sb.dance={home:{x:sb.player.x,y:sb.player.y},foe:{x:fx,y:fy},until:sb.time+dur};};
 sb.window=sb;vm.createContext(sb);
 if(src)vm.runInContext(src,sb,{filename:NAME});
 if(o.off&&sb.__STORYWORLD_DANCE_FREE_R706__)sb.__STORYWORLD_DANCE_FREE_R706__.set(false);
 sb.run=(k,dt=.05)=>{for(let i=0;i<k;i++)sb.tick(dt);};
 return sb;}
const near=(a,b,e=1e-6)=>Math.abs(a-b)<e;
// 1. 춤 중 오른쪽으로 걷기: 본체는 걸은 만큼만 움직이고(끌려가지 않음), 끝나도 시작 자리로 돌아가지 않는다.
{const s=mk();s.startDance(18,10,1);s.input={x:1,y:0};s.run(10);// 0.5초
 ok(near(s.player.x,10+.5*5)&&near(s.player.y,10),'춤 중에도 본체는 입력대로 걷는다(x='+s.player.x.toFixed(2)+', 적 곁 17.2 로 끌려가지 않음)');
 s.run(20);ok(!s.dance&&near(s.player.x,10+1.5*5),'춤이 끝나도 시작 자리(10)로 되돌아가지 않고 걷던 자리 그대로(x='+s.player.x.toFixed(2)+')');}
// 2. 가만히 서 있으면 본체는 제자리, 타격은 적 곁에서 일어난다(피해는 적 자리).
{const s=mk();s.startDance(18,10,1);s.run(10);ok(near(s.player.x,10)&&near(s.player.y,10),'입력 없으면 본체는 제자리');
 ok(s.strikes.length>0&&s.strikes.every(k=>near(k.x,17.2)),'타격은 적 곁(17.2)에서 일어난다 — 피해 자리는 그대로');
 ok(s.ghosts.length>=1&&s.ghosts.every(g=>near(g.x,17.2)&&near(g.y,10)&&g.asset==='atk-front'&&g.life>0&&g.life<=.5),'타격 자리에 영웅 분신이 잠깐(0.5초 이하) 나타난다: '+s.ghosts.length+'개');
 ok(s.ghosts.length<=8,'분신 수 상한(1초 춤에 8개 이하)');}
// 3. 벽: 춤 중 걸어도 벽을 넘지 않는다.
{const s=mk({wall:11});s.startDance(18,10,1);s.input={x:1,y:0};s.run(20);ok(s.player.x<=11+1e-9,'춤 중에도 벽(x=11)을 넘지 않는다(x='+s.player.x.toFixed(2)+')');}
// 4. 블링크: 춤 중 블링크로 옮긴 자리는 유지된다.
{const s=mk();s.startDance(18,10,1);s.run(2);s.blink();s.run(4);ok(near(s.player.x,13),'춤 중 블링크(+3)한 자리 유지(x='+s.player.x.toFixed(2)+')');}
// 5. 춤이 없을 땐 아무것도 바꾸지 않는다.
{const s=mk();s.input={x:1,y:0};s.run(10);ok(near(s.player.x,12.5)&&s.ghosts.length===0,'춤 없음: 평소 이동 그대로·분신 없음');}
// 6. 지역이 바뀌면 기억한 자리를 버린다(새 지역 자리 덮어쓰지 않음).
{const s=mk();s.startDance(18,10,5);s.run(3);s.room={id:'z2'};s.dance=null;s.player.x=40;s.player.y=40;s.run(3);ok(near(s.player.x,40)&&near(s.player.y,40),'지역 이동 뒤 옛 자리로 끌어오지 않음');}
// 7. 끄면 예전 동작(끌려갔다 돌아옴).
{const s=mk({off:true});s.startDance(18,10,1);s.input={x:1,y:0};s.run(10);ok(near(s.player.x,17.2),'R706 끔 → 예전처럼 적 곁으로 옮겨짐');
 ok(s.localStorage.getItem('storyworld.r706.danceFree')==='0','끄기 저장');}
// 8. 원거리 영웅도 같다(모든 영웅).
{const s=mk({hero:'michaela'});s.startDance(18,10,1);s.input={x:0,y:1};s.run(30);ok(near(s.player.x,10)&&near(s.player.y,10+1.5*5),'미카엘라: 춤 중·뒤 모두 입력대로(y='+s.player.y.toFixed(2)+')');}
// 9. 대시(E, 한 번에 3.8칸): 춤 중 자동 시전(tick 안) — 시전 코드가 바로 읽는 끝점이 실제 끝점이고, 그 자리가 유지된다.
{const s=mk();s.startDance(18,10,1);s.run(3);s.castDash=true;s.run(1);
 ok(s.dashSeen&&near(s.dashSeen.to.x,13.8)&&near(s.dashSeen.to.y,10),'tick 안 대시: 시전 코드가 읽는 끝점 = 본체+3.8(x='+(s.dashSeen?.to.x??NaN).toFixed(2)+')');
 s.run(4);ok(near(s.player.x,13.8),'tick 안 대시 뒤 그 자리 유지(x='+s.player.x.toFixed(2)+')');}
// 10. 대시를 직접 누름(tick 밖): 다음 tick 에 되돌려지지 않는다.
{const s=mk();s.startDance(18,10,1);s.run(3);s.moveActor(s.player,3.8,0);ok(near(s.player.x,13.8),'tick 밖 대시: 바로 옮겨짐');
 s.run(4);ok(near(s.player.x,13.8),'tick 밖 대시 뒤 다음 tick 에 되돌려지지 않음(x='+s.player.x.toFixed(2)+')');}
// 11. 새 게임으로 시계가 0 으로 돌아가도 분신이 다시 나온다.
{const s=mk();s.time=500;s.startDance(18,10,1);s.run(30);const g0=s.ghosts.length;s.time=0;s.startDance(18,10,1);s.run(10);
 ok(g0>0&&s.ghosts.length>g0,'시계가 되감겨도 분신이 나온다('+g0+' → '+s.ghosts.length+')');}
console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
