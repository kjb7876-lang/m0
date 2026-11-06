'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}};
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=fs.readFileSync(path.join(R,'client-source','mob-dots-r374.js'),'utf8');
ok(RT('mob-dots-r374.js')===src,'runtime-text 사본 = client-source');
const html=RT('index.html');ok(/<script src="\.\/mob-squads-r373\.js"><\/script><script src="\.\/mob-dots-r374\.js"><\/script>/.test(html)&&html.split('mob-dots-r374.js').length===2,'스크립트 태그 한 번, R373 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'mob-dots-r374.js',"),'공개 확인 목록');
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));ok(inputs.textPaths.includes('mob-dots-r374.js'),'런타임 입력 목록');
const idx=JSON.parse(RT('assets/r374/mobs/index.json'));ok(idx.mobs.length===7,'7종');
for(const m of idx.mobs){const p=path.join(R,'runtime-text',m.path);ok(fs.existsSync(p),m.id+' 파일');if(!fs.existsSync(p))continue;const b=fs.readFileSync(p);
 ok(crypto.createHash('sha256').update(b).digest('hex')===m.sha256&&b.length===m.bytes,m.id+' 해시·크기');ok(m.actor.layer==='STORY'&&/^u20[35]-/.test(m.actor.nativeId),m.id+' STORY u203/u205 한정');
 ok(m.move.length>=4&&m.attack.length===4&&m.finalArt===false,m.id+' 칸·임시 표기');}
ok(fs.readFileSync(path.join(R,'client-source','mob-unique-r248.js'),'utf8').includes('s=sheetOf(e);if(s&&window.__STORYWORLD_MOB_DOTS_R374__?.assign?.(e))s=null;'),'R248 이 R374 액터를 덮어 그리지 않음');
// 런타임 흉내
const frames=[];const S0={frameFor:(e,f)=>({path:'base',e})};
const ctx={window:{__STORYWORLD_STORY_COMBAT_R54__:S0},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},time:1,layer:'STORY',player:{x:0,y:0},
 readyImage:()=>({image:{naturalWidth:10}}),setTimeout:()=>0,fetch:undefined};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext('var window=this.window;'+src.replace("if(typeof fetch==='function')","window.__idx=(j)=>{idx=j};if(false)"),ctx);
ctx.window.__idx(idx);const D=ctx.window.__STORYWORLD_MOB_DOTS_R374__,S=ctx.window.__STORYWORLD_STORY_COMBAT_R54__;
const mk=(nativeId,name,o={})=>({id:name+Math.random(),nativeId,name,hp:10,x:1,y:1,...o});
ok(S.frameFor(mk('u203-e2','이동문 공허잔영 우두머리'),null)?.r374Mob==='u203-e2-mech','우두머리 이름도 같은 그림');
ok(S.frameFor(mk('u203-e2','태엽 수집자'),null)?.path==='base','같은 nativeId 다른 이름(태엽 수집자)은 그대로');
ok(S.frameFor(mk('u203-e1','이동문 청람잔영'),null)?.path==='base','u203-e1(승인 안 됨)은 그대로');
ok(S.frameFor(mk('u205-mid','제14단계 역전 관리자',{midboss:true}),null)?.r374Mob==='u205-mid-new','u205 중간보스');
ctx.layer='DREAM';ok(S.frameFor(mk('u205-e1','학대기록 공허체'),null)?.path==='base','DREAM 층은 그대로');ctx.layer='STORY';
const boss=mk('u203-boss','컨트롤러 · 기억의 문',{boss:true});
S0.frameFor=(e,f)=>({path:'assets/generated-v31224/actors-normalized/c5859bd35492_controller_idle.webp'});ok(S.frameFor(boss,null)?.r374Mob==='u203-boss-mech','보스 idle → 새 그림');
S0.frameFor=(e,f)=>({path:'assets/generated-v31224/actors-normalized/543a490d2cf2_controller_transition.webp'});ok(S.frameFor(boss,null)?.r374Mob===undefined,'보스 전환 상태 → 원래 그림');
S0.frameFor=(e,f)=>({path:'assets/generated-v31224/actors-normalized/12ca1a97fb0a_controller_rain.webp'});ok(S.frameFor(boss,null)?.r374Mob===undefined,'보스 비 상태 → 원래 그림');
S0.frameFor=(e,f)=>({path:'assets/generated-v31224/actors-normalized/c4c64ee058cc_controller_attack.webp'});ok(S.frameFor({...boss,attack:{elapsed:.1}},null)?.r374Mob==='u203-boss-mech','보스 일반공격 → 새 그림');
ok(S.frameFor({...boss,hitTimer:.2},null)?.r374Mob===undefined,'보스 경직 → 원래 그림');
S0.frameFor=(e,f)=>({path:'base'});const at=mk('u205-e2','관리자 추적견',{x:5,y:0,attack:{elapsed:.1,angle:0}});ctx.player={x:0,y:0};
ok(D.faceLeft(at)===false&&S.frameFor(at,null).flip===false,'공격 중: 정해진 공격 방향(오른쪽)을 본다 — 영웅이 왼쪽이어도');
ok(D.faceLeft({...at,attack:null})===true,'공격 아닐 때: 영웅 쪽(왼쪽)');
ok(fs.readFileSync(path.join(R,'client-source','mob-preload-r260.js'),'utf8').includes('__STORYWORLD_MOB_DOTS_R374__?.assign?.(e);if(d?.path){out.push(d.path);return out;}'),'R260 미리 읽기가 R374 시트를 기다림');
console.log(`R374 CPU ${n-bad}/${n}`);if(bad)process.exit(1);
