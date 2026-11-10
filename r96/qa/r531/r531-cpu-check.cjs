'use strict';
// R531 — 보라검천사(거미동굴 dist01 중간보스)가 R61 부하 소환으로 '망각의 거미'를 불러내던 버그(사용자 2026-11-10 "보라검천사보스 망각거미소환버그").
//  R380 은 지역을 만들 때만 망각의 거미를 개명했고, R61 makeUnit 은 지역 명단(regionById.dist01.roster)에서 actor3 로 새 몹을 만들어 옛 이름·옛 그림이 그대로 나왔다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const src=CS('approved-mobs-r380.js'),html=RT('index.html');
ok(RT('approved-mobs-r380.js')===src,'runtime-text 사본 = client-source');
// 훅 자리 회귀 방지: R61 이 부하·분신을 actor3 로 만들고 id 가 '<지역>:r61-summon:' 으로 시작한다.
ok(html.includes("const e=actor3(profile,id,owner.x,owner.y,false,r.layer,def,false);")&&html.includes("const id=room.id+':r61-summon:'+(++serial)"),'R61 makeUnit 이 actor3·r61-summon id 를 씀(훅 자리)');
const idx=JSON.parse(RT('assets/r380/mobs/index.json'));
const made=[];
function mkCtx(prefs){const ctx={window:{__STORYWORLD_STORY_COMBAT_R54__:{frameFor:()=>({path:'base'})}},localStorage:{getItem:k=>k==='storyworld.r380.mobs'&&prefs?JSON.stringify(prefs):null,setItem(){}},performance:{now:()=>0},time:1,layer:'STORY',room:{id:'dist01'},player:{x:0,y:0},
 readyImage:()=>({image:{naturalWidth:10}}),setTimeout:()=>0,makeRoom:()=>({enemies:[]})};ctx.window.window=ctx.window;
 ctx.actor3=function(d,id,x,y,boss,l,def,mid=false){made.push(id);return{id,nativeId:d.id,name:d.name,path:d.path,boss,midboss:mid,profile:d,x,y,hp:10,maxHp:10};};
 vm.createContext(ctx);vm.runInContext('var window=this.window;'+src.replace("if(typeof fetch==='function')","window.__idx=(j)=>{idx=j};if(false)"),ctx);ctx.window.__idx(idx);return ctx;}
const ctx=mkCtx(null),A=ctx.window.__STORYWORLD_APPROVED_MOBS_R380__,S=ctx.window.__STORYWORLD_STORY_COMBAT_R54__;
const def={id:'dist01',index:1,chapterIndex:0},sp1={id:'dist01-sp1',name:'망각의 거미',path:'assets/r275/mobs/oblivion-spider.webp'},sp2={id:'dist01-sp2',name:'보랏빛 알집지기',path:'x'},angel={id:'mb-dist01',name:'보라검천사',path:'a'};
const call=(c,d,id,l='STORY',df=def)=>c.actor3(d,id,1,1,false,l,df,false);
// 정상 경로
const m=call(ctx,sp1,'dist01:r61-summon:3');
ok(m.name==='재 나방','dist01 R61 소환 망각의 거미 → 재 나방 (지금: '+m.name+')');
ok(m.r248Key==='망각의 거미'&&m.nativeId==='dist01-sp1'&&m.id==='dist01:r61-summon:3'&&m.r380From==='망각의 거미','공격 효과 키·nativeId·id 그대로(밸런스·저장 불변)');
ok(S.frameFor(m,null)?.r380Mob==='ash-moth-v2','소환된 몹이 재 나방 승인 그림(ash-moth-v2)으로 그려짐 (지금: '+(S.frameFor(m,null)?.r380Mob||S.frameFor(m,null)?.path)+')');
ok(made.includes('dist01:r61-summon:3'),'원래 actor3 를 그대로 부름');
// 경계·회귀
ok(call(ctx,sp2,'dist01:r61-summon:4').name==='보랏빛 알집지기','다른 승인 종(알집지기) 소환은 그대로');
ok(call(ctx,angel,'dist01:r61-summon:5').name==='보라검천사','분신(보스 프로필)은 이름 그대로 — R61 이 뒤에 " · 분신" 을 붙임');
ok(call(ctx,sp1,'dist01:r61-summon:6','DREAM').name==='망각의 거미','DREAM 층은 R380 처럼 그대로');
ok(call(ctx,sp1,'dist01:mb-like-row').name==='망각의 거미','R61 소환이 아닌 actor3(지역 만들기)는 이 훅이 건드리지 않음(R380 relocate 몫)');
ok(call(ctx,sp1,'u202:r61-summon:7','STORY',{id:'u202',index:9,chapterIndex:3}).name==='망각의 거미','다른 지역 id 는 건드리지 않음');
ok(call(ctx,{...sp1,name:'망각의 거미 증원'},'dist01:r61-summon:8').name==='재 나방','이름 꼬리(증원)가 붙어도 개명');
{const before=ctx.actor3;A.installRoom?.();ok(ctx.actor3===before&&ctx.actor3.__r531===true,'다시 설치해도 한 번만 감쌈');}
{const off=mkCtx({on:false});ok(call(off,sp1,'dist01:r61-summon:9').name==='망각의 거미','storyworld.r380.mobs {on:false} 면 끔');}
ok(A.inspect().stats.summonRenamed>=2,'통계 summonRenamed');
console.log(`R531 cpu check: ${n-bad}/${n} pass`);process.exit(bad?1:0);
