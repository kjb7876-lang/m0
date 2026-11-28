// R1365·R1366 조형물 정리·밑동 그림자·윤하람 도로 바닥 — 정적·CPU 검사(화면 검증 아님, GPU·실기기 미검증).
//  사용자 2026-11-27: ① 새빛호텔 안 판잣집(폐허 시장 좌판) 조형물 ② "꼭 필요한 소품만, 계단은 맵 전환하는 곳에만, 남발되는 조형물 삭제"
//  ③ "조형물 아래 원 그림자 때문에 떠다니는 것 같다" ④ 윤하람 맵 바닥을 횡단보도·도로 느낌으로.
const fs=require('fs'),path=require('path'),vm=require('vm'),R=path.join(__dirname,'..','..');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok   ':'FAIL ')+m+(d!==undefined?': '+JSON.stringify(d).slice(0,240):''));};
const F='props-declutter-r1366.js',src=path.join(R,'client-source',F),rt=path.join(R,'runtime-text',F);
ok(fs.existsSync(src),'오버레이 파일이 있음',F);
const S=fs.existsSync(src)?fs.readFileSync(src,'utf8'):'';
ok(fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===S,'client-source 와 runtime-text 사본이 같음');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.includes('<script src="./'+F+'"></script>'),'index.html 에 스크립트 태그');
const ver=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');ok(ver.includes(F),'공개 검증 기대 목록에 있음');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes(F),'runtime-manifest 에 있음');
const pages=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');ok(pages.includes('qa/r1366/r1366-cpu-check.cjs'),'pages.yml CI 검사 줄');

// ---- 모듈을 가짜 전역에 올려 순수 함수만 꺼낸다 ----
const win={};const ctx={window:win,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,RegExp,Error,performance:{now:()=>0}};ctx.window=win;
let M=null;try{vm.runInNewContext(S,ctx,{filename:F});M=win.__STORYWORLD_PROPS_DECLUTTER_R1366__;}catch(e){ok(false,'모듈 실행',String(e).slice(0,200));}
ok(!!M&&typeof M.plan==='function'&&typeof M.contact==='function'&&typeof M.crossings==='function','plan·contact·crossings 를 내보냄');
if(!M){console.log('\nR1366 cpu: '+(n-bad)+'/'+n);process.exit(1);}

const door=(x,y,i)=>({id:'r74:z:door-'+i,r74Door:true,x,y,solid:false});
const mk=(id,extra)=>({id,x:extra.x??10.5,y:extra.y??10.5,solid:false,visible:true,...extra});
function roomOf(zone,props,doors=[[20,20],[85.5,64],[5,6]]){return{id:zone,layer:'STORY',props,exploration:{entry:{x:50,y:90},worldR74:{doors:doors.map(([x,y],i)=>({x,y,id:'door-'+i}))}}};}
const hid=(r)=>Object.fromEntries(r.props.filter(p=>p.r303Hide).map(p=>[p.id,p.r303Hide]));

// ① 새빛호텔: R81 이 바깥 그림을 빌려 입힌 장식(판잣집·가로등)은 숨는다, 짐수레는 실내 소품이라 남을 수 있다
{const r=roomOf('murder02',[
  mk('r74:murder02:scenery:4',{x:91.5,y:57.5,r74Prop:'empty-bed',r81NativeSkin:{path:'assets/props/v290/ruined_market.webp',height:86}}),
  mk('r74:murder02:scenery:3',{x:78.5,y:7.5,r74Prop:'cabinet',r81NativeSkin:{path:'assets/world-r80/r80-054.webp',height:73.6},r303Skin:{path:'assets/props/v290/broken_street_lamp.webp',height:86}}),
  mk('murder02-prop-4',{x:30,y:40,path:'assets/props/v290/ruined_market.webp',kind:'regional-scene-prop',sourceZoneProp:'x'}),
  mk('named-market',{x:40,y:40,path:'assets/props/v290/ruined_market.webp',name:'서사 좌판'}),
 ]);M.plan(r);const h=hid(r);
 ok(!!h['r74:murder02:scenery:4'],'호텔: 판잣집(폐허 시장) 그림을 빌려 입은 장식 숨김',h);
 ok(!!h['r74:murder02:scenery:3'],'호텔: 부서진 가로등 그림(r303Skin)을 입은 장식 숨김');
 ok(!!h['murder02-prop-4'],'호텔: 이름 없는 엔진 폐허 시장 소품 숨김');
 ok(!h['named-market'],'이름 붙은 서사 소품은 그림이 바깥 것이어도 지킴');}
// 같은 그림이라도 바깥 지역(무너진 성)에서는 ①번 규칙으로 숨기지 않는다
{const r=roomOf('dist03',[mk('dist03-prop-2',{path:'assets/props/v290/moss_boulders.webp',kind:'regional-scene-prop',sourceZoneProp:'x'})]);M.plan(r);ok(!hid(r)['dist03-prop-2'],'바깥 지역의 바위는 그대로');}
// 병원(주사실)도 같은 새는 길: 짐수레·가로등·빈 비석 장식
{const r=roomOf('ep1a09',[mk('r74:ep1a09:scenery:2',{r74Prop:'statue',r81NativeSkin:{path:'assets/props/v290/hotel_luggage_cart.webp',height:86}}),mk('r74:ep1a09:scenery:3',{x:30,r74Prop:'cabinet',r81NativeSkin:{path:'assets/props/v290/broken_street_lamp.webp',height:86}})]);M.plan(r);const h=hid(r);
 ok(Object.keys(h).length===2,'병원: 빌려 입은 짐수레·가로등 장식 숨김',h);}

// ② 계단은 맵 전환 자리(문·입구·제단) 곁에만
{const r=roomOf('murder04',[mk('st-far',{x:40,y:40,path:'assets/props/v290/collapsed_stairs.webp',kind:'regional-scene-prop',sourceZoneProp:'x'}),
  mk('st-door',{x:21.5,y:21,path:'assets/props/v290/collapsed_stairs.webp',kind:'regional-scene-prop',sourceZoneProp:'x'}),
  mk('st-r80',{x:60,y:60,path:'assets/world-r80/r80-055.webp',r80Dressing:true,r80Art:'r80-055'}),
  mk('st-entry',{x:51,y:88,path:'assets/world-r80/r80-032.webp',r80Dressing:true,r80Art:'r80-032'})]);M.plan(r);const h=hid(r);
 ok(h['st-far']&&h['st-r80'],'전환 자리에서 먼 계단 2점 숨김',h);ok(!h['st-door']&&!h['st-entry'],'문 곁·입구 곁 계단은 남김');
 const r2=roomOf('murder04',[mk('st-edge',{x:23.4,y:20,path:'assets/props/v290/collapsed_stairs.webp',kind:'regional-scene-prop',sourceZoneProp:'x'}),mk('st-out',{x:23.6,y:20,path:'assets/props/v290/collapsed_stairs.webp',kind:'regional-scene-prop',sourceZoneProp:'x'})]);M.plan(r2);
 ok(!hid(r2)['st-edge']&&hid(r2)['st-out'],'경계값: 문에서 3.5칸 안은 남고 바깥은 숨김',hid(r2));}

// ③ 같은 그림 남발: 지역에 같은 그림은 장면 장식 2점·가구 3점까지, 서로 떨어진 것을 남긴다
{const ps=[];for(let i=0;i<8;i++)ps.push(mk('r81:scene:murder02:'+i,{x:8+i*10,y:20+(i%2)*30,path:'assets/world-r80/r80-054.webp',r80Dressing:true,r80Art:'r80-054'}));
 for(let i=0;i<10;i++)ps.push(mk('r449:furn:murder02:'+i,{x:5+i*8,y:70,path:'assets/world-r80/r80-027.webp',r80Dressing:true,r449Furniture:true}));
 const r=roomOf('murder02',ps);M.plan(r);const v=r.props.filter(p=>!p.r303Hide);
 const c54=v.filter(p=>/r80-054/.test(p.path)),c27=v.filter(p=>/r80-027/.test(p.path));
 ok(c54.length===2,'장면 장식(보안 단말) 8점 → 2점',c54.map(p=>p.id));ok(c27.length===3,'가구(난로) 10점 → 3점',c27.map(p=>p.id));
 const dmin=a=>{let m=1e9;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)m=Math.min(m,Math.hypot(a[i].x-a[j].x,a[i].y-a[j].y));return m;};
 ok(dmin(c27)>=20,'남긴 가구는 서로 떨어져 있음(20칸 이상)',dmin(c27));
 // 결정성: 순서를 뒤섞어도 같은 결과
 const r2=roomOf('murder02',JSON.parse(JSON.stringify(ps)).reverse());M.plan(r2);ok(JSON.stringify(Object.keys(hid(r2)).sort())===JSON.stringify(Object.keys(hid(r)).sort()),'소품 순서를 뒤집어도 같은 것을 남김');
 const before=JSON.stringify(hid(r));M.plan(r);ok(JSON.stringify(hid(r))===before,'두 번 돌려도 같음(멱등)');}
// R74 일반 장식(다른 소품 그림을 빌려 입는 자리채움)은 모두 쉰다
{const r=roomOf('kair04',[mk('r74:kair04:scenery:2',{r74Prop:'statue',r81NativeSkin:{path:'assets/props/v290/bone_heap.webp',height:86}})]);M.plan(r);ok(!!hid(r)['r74:kair04:scenery:2'],'바깥 지역도 빌려 입은 R74 자리채움 장식은 숨김');}
// 기준 맵(에피소드1·7대죄·불면귀)은 개수 정리를 하지 않는다(사용자 2026-11-27 "그쪽이 잘 되어 있으니 참고")
{const ps=[mk('r74:dist01:scenery:2',{r74Prop:'statue',r81NativeSkin:{path:'assets/props/v290/bone_heap.webp',height:86}})];for(let i=0;i<5;i++)ps.push(mk('r81:scene:ep1b04:'+i,{x:i*9,path:'assets/world-r80/r80-027.webp',r80Dressing:true}));
 for(const z of ['dist01','ep1b04','last302']){const q=JSON.parse(JSON.stringify(ps)),r=roomOf(z,q);M.plan(r);ok(Object.keys(hid(r)).length===0,'기준 맵 '+z+': 자리채움·같은 그림 그대로',hid(r));}}

// ④ 지키는 것: 판정 있는 것·이름·상호작용·상자·문·보스방·사몽·꿈·맘몬, 다른 모듈이 숨긴 표시
{const keep=[mk('solid-1',{solid:true,path:'assets/props/v290/ruined_market.webp',kind:'regional-scene-prop',sourceZoneProp:'x'}),
  mk('inter-1',{interactive:true,path:'assets/props/v290/ruined_market.webp'}),mk('chest-1',{chestR103:true,path:'assets/props/chest-closed.png'}),door(20,20,0),
  mk('boss-1',{r406Boss:true,path:'assets/world-r80/r80-027.webp',r80Dressing:true}),mk('npc-1',{r75NPC:true,path:'x.webp'}),mk('clue-1',{r115Clue:true,path:'assets/props/v290/collapsed_stairs.webp'})];
 for(let i=0;i<5;i++)keep.push(mk('boss-dup'+i,{r406Boss:true,x:i,path:'assets/world-r80/r80-054.webp',r80Dressing:true}));
 const other=mk('other-hide',{path:'assets/world-r80/r80-054.webp',r80Dressing:true,r303Hide:'r449'});
 const r=roomOf('murder02',[...keep,other]);const snap=JSON.stringify(keep);M.plan(r);
 ok(JSON.stringify(keep)===snap,'판정·이름·상호작용·상자·문·보스방·NPC·단서는 하나도 안 건드림');ok(other.r303Hide==='r449','다른 모듈의 숨김 표시는 그대로');
 for(const z of ['ep1b06'])
 {const q=[mk('m1',{r74Prop:'statue',r81NativeSkin:{path:'assets/props/v290/ruined_market.webp'}})];const rr=roomOf(z,q);M.plan(rr);ok(!q[0].r303Hide,'맘몬 지역(ep1b06)은 손대지 않음');}
 {const q=[mk('d1',{r74Prop:'statue',r81NativeSkin:{path:'assets/props/v290/ruined_market.webp'}})];const rr=roomOf('murder02',q);rr.layer='DREAM';M.plan(rr);ok(!q[0].r303Hide,'꿈 층은 손대지 않음');}
 {const q=[mk('s1',{r74Prop:'statue',r81NativeSkin:{path:'assets/props/v290/ruined_market.webp'}})];const rr=roomOf('murder02',q);rr.samongR115={zone:'sz115-S01-1'};M.plan(rr);ok(!q[0].r303Hide,'사몽 구역은 손대지 않음');}}
// 충돌·길: 계획은 자리·판정·보임 값을 바꾸지 않는다(그림만 쉼)
{const ps=[];for(let i=0;i<6;i++)ps.push(mk('r81:scene:murder01:'+i,{x:i*7,y:3,path:'assets/world-r80/r80-051.webp',r80Dressing:true}));const fields=()=>JSON.stringify(ps.map(p=>[p.x,p.y,p.solid,p.visible,p.radius,p.enabled]));
 const b=fields(),r=roomOf('murder01',ps);M.plan(r);ok(fields()===b,'자리·solid·visible·radius 그대로(충돌·길찾기 불변)');}

// ⑤ 밑동 접촉 그림자: 그림 밑면 폭에 붙고 납작하다(떠 보이던 넓은 원 대신)
{const flat=Array.from({length:64},(_,i)=>i<4?.62:.4),diamond=Array.from({length:64},(_,i)=>Math.min(.96,.06+i*.045)),pole=Array.from({length:64},(_,i)=>i<3?.3:.05);
 const a=M.contact(flat,1,100,60),b=M.contact(diamond,1,100,60),c=M.contact(pole,.5,120,40);
 ok(a&&Math.abs(a.rx-.62*60/2)<3&&a.lift<2,'밑이 평평한 그림: 밑면 폭에 맞고 바닥에 붙음',a);
 ok(b&&b.lift>8&&b.lift<=30&&b.rx>20,'마름모 밑면: 양옆 모서리 높이로 올리고 그 폭에 맞춤',b);
 ok(c&&c.rx<=40*.32&&c.rx>=3,'가로등 같은 가는 받침: 받침 폭만큼만',c);
 for(const [k,s] of [['a',a],['b',b],['c',c]])ok(s.ry<=Math.max(2.2,s.rx*.2)&&s.alpha>=.3&&s.alpha<=.6,'접촉 그림자 '+k+': 납작하고 진함(ry≤rx·0.2)',s);
 ok(M.contact([],1,100,60)===null&&M.contact(flat,1,0,60)===null,'경계값: 폭 자료 없음·키 0 이면 그리지 않음');}
// cave-r204 바닥 둥근 그늘(r204-prop-shadows)은 R1366 이 켜져 있으면 만들지 않는다
{const cave=fs.readFileSync(path.join(R,'client-source','cave-r204.js'),'utf8');ok(/function propShadowMesh\(T,F,rm\)\{if\(window\.__STORYWORLD_PROPS_DECLUTTER_R1366__\?\.noBlob\?\.\(\)\)return null;/.test(cave),'R204 둥근 그늘 판을 R1366 이 끔');
 ok(typeof M.noBlob==='function'&&M.noBlob()===true,'기본값: 둥근 그늘 끔');}

// ⑥ 윤하람(murder01): 젖은 아스팔트 바닥 + 길목마다 횡단보도·차선
{const tiles=fs.readFileSync(path.join(R,'client-source','world-tiles-r118.js'),'utf8');ok(/murder01:\{file:'asphalt',floor:0x[0-9a-f]{6}\}/.test(tiles),'R118 표: murder01 바닥 = 아스팔트');
 const cells=[];const add=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)cells.push([x,y]);};
 add(2,2,12,12);add(12,6,40,9);add(40,2,50,14);add(44,14,47,40);// 방 - 가로 길(폭3,28칸) - 방 - 세로 길(폭3,26칸)
 const cs=M.crossings(cells),key=new Set(cells.map(([x,y])=>x+':'+y));
 const zebra=cs.filter(s=>s.kind==='zebra'),lane=cs.filter(s=>s.kind==='lane');
 ok(zebra.length>=10,'가로·세로 길마다 횡단보도 줄무늬',zebra.length);ok(lane.length>=4,'길 가운데 점선 차선',lane.length);
 ok(cs.every(s=>{for(const [px,py] of [[s.x0,s.y0],[s.x1,s.y1],[s.x0,s.y1],[s.x1,s.y0]])if(!key.has(Math.floor(px-1e-6*(px%1===0&&px===s.x1?1:0))+':'+Math.floor(py-1e-6*(py%1===0&&py===s.y1?1:0))))return false;return true;}),'모든 줄은 바닥 칸 안');
 const hz=zebra.filter(s=>s.y0>=6&&s.y1<=9),vz=zebra.filter(s=>s.x0>=44&&s.x1<=47);ok(hz.length&&vz.length,'가로 길과 세로 길 둘 다',[hz.length,vz.length]);
 ok(hz.every(s=>s.x1-s.x0>s.y1-s.y0)&&vz.every(s=>s.y1-s.y0>s.x1-s.x0),'줄무늬는 길 방향으로 길쭉(건너는 방향과 직각)');
 ok(M.crossings([]).length===0&&M.crossings(cells.filter(([x,y])=>x<12)).filter(s=>s.kind==='zebra').length===0,'경계값: 바닥 없음·방만 있음 → 횡단보도 없음');}

// ⑥ 2차(11-28): 교단·관리자 장 고유 조형물은 제 장에서만 여러 점, 다른 장에선 한 점 / 청록빌라에서 호텔 출입 단말 뺌
{const sc=(id,x,y,a)=>mk(id,{x,y,path:'assets/world-r80/'+a+'.webp',kind:'regional-scene-prop',sourceZoneProp:'x'});
 const r=roomOf('cult01',[sc('a1',10,10,'r80-069'),sc('a2',40,40,'r80-069'),sc('b1',12,60,'r80-061'),sc('b2',60,12,'r80-061'),sc('c1',30,70,'r80-075'),sc('c2',70,30,'r80-075')]);M.plan(r);const h=hid(r);
 ok(['a1','a2'].filter(k=>h[k]==='r1366-foreign').length===1,'교단1장: 5장 기록판(r80-069)은 한 점만 남김',h);
 ok(!h.b1&&!h.b2,'교단1장: 제 장 칩 제단(r80-061) 두 점은 그대로',h);
 ok(!h.c1&&!h.c2,'공용 그림(r80-075)은 장 규칙 밖(같은 그림 상한만)',h);
 const r5=roomOf('cult05',[sc('a1',10,10,'r80-069'),sc('a2',40,40,'r80-069')]);M.plan(r5);ok(!Object.keys(hid(r5)).length,'교단5장: 제 장 기록판 두 점 그대로',hid(r5));
 const u=roomOf('u203',[sc('m1',10,10,'r80-002'),sc('m2',50,50,'r80-002')]);M.plan(u);ok(Object.values(hid(u)).filter(v=>v==='r1366-foreign').length===1,'관리자 기억의 문: 이주 받침(r80-002) 한 점만',hid(u));
 const u6=roomOf('u206',[sc('m1',10,10,'r80-002'),sc('m2',50,50,'r80-002')]);M.plan(u6);ok(!Object.keys(hid(u6)).length,'중앙 코어 이주실: 이주 받침 그대로',hid(u6));
 const v=roomOf('murder04',[sc('h1',10,10,'r80-054'),sc('h2',50,50,'r80-056'),sc('h3',30,60,'r80-024')]);M.plan(v);const hv=hid(v);
 ok(hv.h1==='r1366-theme'&&!hv.h2&&!hv.h3,'청록빌라: 호텔 출입 단말만 빼고 화재경보함·소파는 남김',hv);
 const f=roomOf('kair04',[sc('k1',10,10,'r80-069'),sc('k2',50,50,'r80-069')]);M.plan(f);ok(!Object.values(hid(f)).includes('r1366-foreign'),'다른 집안 지역에는 장 규칙을 쓰지 않음',hid(f));}

console.log('\nR1366 cpu: '+(n-bad)+'/'+n);process.exit(bad?1:0);
