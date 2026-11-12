// R853 잠들지 못하는 마을(last302) 기억 글 자리 — 입장(해안 영상 뒤) ①② · 보스 문 앞 ③ · 처치 뒤 없음. 정본 문단 그대로.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R96=path.join(__dirname,'..','..');let pass=0;const ok=(c,m)=>{assert.ok(c,m);pass++;};
const src=f=>fs.readFileSync(path.join(R96,f),'utf8');
const FILE='story-order-r853.js';
ok(fs.existsSync(path.join(R96,'client-source',FILE)),'client-source/'+FILE+' 있음');
ok(src('client-source/'+FILE)===src('runtime-text/'+FILE),'runtime-text 사본이 같음');
function boot(o={}){
 const played=[];
 const ctx={console,Math,JSON,Object,Array,Set,Map,String,Number,Error,Date,performance:{now:()=>ctx.__wall},__wall:0};
 ctx.window=ctx;
 vm.createContext(ctx);
 vm.runInContext(src('client-source/story-canon-r106-data.js'),ctx);
 vm.runInContext(`var started=true,loading=false,modal=false,storyScene=null,storyQueue=[],zone='last302',layer='STORY',time=0,readScenes=new Set(),progress={STORY:{}},saved=0;
  function completed(id,l=layer){return progress[l]?.[id]===true}
  function saveGame(){saved++;return true}
  function nextScenes(def,part){return [{id:def.id,part,text:'BASE-'+def.id+'-'+part,title:'T',narrator:'〈환도의 기억〉',chapter:'C',key:layer+':'+def.id+':'+part+':0'}]}
  function playScenes(list,done){__played.push(list);if(done)done();}
  function tick(dt){time+=dt;}`,ctx);
 ctx.__played=played;
 ctx.__phase=o.phase||'route';ctx.__want=o.want??null;ctx.__open=o.open??null;
 ctx.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>({phase:ctx.__phase}),controlled:()=>true};
 ctx.__STORYWORLD_HWANDO_FALL_VIDEO_R617__={want:()=>ctx.__want,inspect:()=>({open:ctx.__open,pending:ctx.__want})};
 vm.runInContext(src('client-source/'+FILE),ctx);
 return {ctx,played,run:s=>vm.runInContext(s,ctx)};
}
const C=(()=>{const c={window:{}};c.window=c;vm.createContext(c);vm.runInContext(src('client-source/story-canon-r106-data.js'),c);return c.__STORYWORLD_STORY_CANON_R106__;})();
const P=C.zones.last302.blocks.flatMap(b=>b.paras);
ok(P.length===3,'정본 last302 는 3문단');
ok(/젖은 모래 해안/.test(P[0])&&/잠에 들지도 못하고/.test(P[1])&&/보이지 않는 실에 끌리는/.test(P[2]),'문단 내용 확인');
{const {ctx,played,run}=boot();
 ctx.__phase='door';const door=run(`nextScenes({id:'last302'},'pre')`);ctx.__phase='route';
 ok(door.length===1&&door[0].text===P[2],'보스 문(전투 전)은 ③ 주민 습격 문단 그대로');
 ok(!/젖은 모래/.test(door.map(s=>s.text).join('')),'보스 문 글에 해안 깨어남이 없음');
 ok(/r853/.test(door[0].key),'보스 문 장면 열쇠가 새것(옛 세이브의 읽음 표시와 섞이지 않음)');
 ctx.__phase='exit';ok(run(`nextScenes({id:'last302'},'post')`).length===0,'보스 처치 뒤 글 없음(다음 지역이 이어 받음)');ctx.__phase='route';
 ok(run(`nextScenes({id:'last303'},'pre')`)[0].text==='BASE-last303-pre','다른 지역은 그대로');
 ok(run(`nextScenes({id:'last301'},'post')`)[0].text==='BASE-last301-post','last301 처치 뒤 글 그대로');
 run(`tick(0.3)`);ok(played.length===0,'들어오자마자는 아직(0.8초 기다림)');
 run(`tick(0.6)`);ok(played.length===1,'입장 뒤 ①② 기억 글이 한 번 나옴');
 const arrive=played[0];ok(arrive.map(s=>s.text).join('\n\n')===P[0]+'\n\n'+P[1],'입장 글은 ①② 정본 그대로');
 ok(arrive.every(s=>/r853-arrive/.test(s.key)),'입장 장면 열쇠');
 ok([...arrive,...door].map(s=>s.text).join('\n\n')===P.join('\n\n'),'입장+보스 문 = 정본 3문단 순서 그대로, 새 문장 없음');
 run(`for(const s of __played[0])readScenes.add(s.key)`);run(`tick(1)`);ok(played.length===1,'읽은 뒤 다시 안 나옴');}
{const {ctx,played,run}=boot({want:'beach'});run(`tick(2)`);ok(played.length===0,'해안 영상 차례면 기다림');
 ctx.__want=null;ctx.__open='beach';run(`tick(2)`);ok(played.length===0,'영상 재생 중 기다림');
 ctx.__open=null;run(`tick(0.5)`);ok(played.length===0,'영상 끝난 뒤 0.8초 기다림');run(`tick(0.4)`);ok(played.length===1,'영상 뒤 입장 글');}
{const {played,run}=boot({phase:'door'});run(`tick(2)`);ok(played.length===0,'문 단계 이후(옛 세이브)는 입장 글을 끼우지 않음');}
{const {played,run}=boot();run(`modal=true`);run(`tick(2)`);ok(played.length===0,'다른 창이 열려 있으면 기다림');run(`modal=false;tick(0.1)`);ok(played.length===0,'창 닫힌 뒤에도 0.8초 기다림');run(`tick(0.8)`);ok(played.length===1,'창 닫히고 0.8초 뒤 나옴');}
{const {played,run}=boot();run(`layer='DREAM'`);run(`tick(2)`);ok(played.length===0,'스토리 층에서만');ok(run(`nextScenes({id:'last302'},'pre')`)[0].text==='BASE-last302-pre','다른 층 글은 그대로');}
{const {played,run}=boot();run(`progress.STORY.last302=true`);run(`tick(2)`);ok(played.length===0,'깬 지역은 안 나옴');}
// Codex 리뷰(#479): 영화 모드(R384)는 길·집결 단계에서 'pre' 를 바로 흘린다 → 그때는 ①②③ 순서 전체, 읽음 표시로 입장·문 앞 글은 다시 안 나옴.
{const {ctx,played,run}=boot();const route=run(`nextScenes({id:'last302'},'pre')`);
 ok(route.map(s=>s.text).join('\n\n')===P.join('\n\n'),'길·집결 단계의 pre 요청(영화 모드)은 ①②③ 순서 그대로');
 ctx.__phase='boss';ok(run(`nextScenes({id:'last302'},'post')`).length===0,'영화 모드 보스 단계 post 없음');ctx.__phase='route';
 run(`for(const s of nextScenes({id:'last302'},'pre'))readScenes.add(s.key)`);run(`tick(2)`);ok(played.length===0,'영화 모드가 읽은 뒤 입장 글 다시 안 나옴');
 ctx.__phase='door';ok(run(`nextScenes({id:'last302'},'pre').filter(s=>!readScenes.has(s.key))`).length===0,'영화 모드가 읽은 뒤 보스 문 글도 건너뜀');}
// Codex 리뷰(#479): R78 이 맡지 않는 방(협동 등, 상태 null)은 원래 정본 자리 그대로.
{const {ctx,played,run}=boot();ctx.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>null,controlled:()=>false};
 ok(run(`nextScenes({id:'last302'},'pre')`)[0].text==='BASE-last302-pre','R78 밖(협동)은 pre 원래대로');
 ok(run(`nextScenes({id:'last302'},'post')`)[0].text==='BASE-last302-post','R78 밖(협동)은 post 원래대로');
 run(`tick(2)`);ok(played.length===0,'R78 밖은 입장 글 없음');}
const html=src('runtime-text/index.html'),at=f=>html.indexOf('<script src="./'+f+'"></script>');
ok(at(FILE)>at('hwando-fall-video-r617.js')&&at('hwando-fall-video-r617.js')>0,'스크립트가 해안 영상 뒤');
ok(at(FILE)>html.indexOf('story-canon-r106.js')&&html.indexOf('world-combat-r78.js')<at(FILE),'정본·R78 뒤');
ok(src('../scripts/verify-r96-public.py').includes("'"+FILE+"'"),'공개 검증 목록');
ok(src('../.github/workflows/pages.yml').includes('qa/r853/r853-cpu-check.cjs'),'CI 검사 줄');
console.log('R853 story order: '+pass+' passed');
