// R177 CPU check: 저절로 뜨던 서사 → 바닥 수집물(진료기록·기억 조각·누군가의 보고서·쪽지), 진행은 바로 이어짐, 주우면 모음에 쌓임, 직접 연 기록·엔딩은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('story-collect-r177 runtime copy matches and loads before samong-hud-r177',fs.readFileSync(path.join(R,'runtime-text','story-collect-r177.js'),'utf8')===C('story-collect-r177.js')&&/story-collect-r177\.js"><\/script>(<script src="\.\/balance-r179\.js"><\/script>)?<script src="\.\/samong-hud-r177\.js"/.test(fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8')));
const played=[],kept=[];const room={id:'ep1a09',props:[],enemies:[]};
const sb={window:{__STORYWORLD_PLAY_R169__:{collect:n=>kept.push(n)}},localStorage:{getItem(){return null;},setItem(){}},document:{getElementById(){return null;},createElement(){return{style:{},setAttribute(){},appendChild(){}};},head:{appendChild(){}},body:{appendChild(){}}},
 setInterval(){},performance:{now:()=>0},started:true,loading:false,room,player:{x:5,y:5,hp:100},readScenes:new Set(),regionById:{ep1a09:{title:'주사실'}},blocked:()=>false,toast(){},
 playScenes(s,d){played.push(s);if(d)d();},drawProp(){},drawEffect(){},effects:[],advanceScene(){},interact(){},tick(){},async enterRegion(){return true;},Promise,Math,JSON,String,Array,Set,Map,Object,Number};
Object.defineProperty(sb,'time',{value:1,writable:true});vm.createContext(sb);vm.runInContext(C('story-collect-r177.js'),sb);const X=sb.window.__STORYWORLD_STORY_COLLECT_R177__;
ok('forms follow the narrative: medical chart, memory shard, report (no narrator), note',X.formOf([{narrator:'윤서하의 진료기록',text:'a'}])==='chart'&&X.formOf([{narrator:'〈미카엘라의 기억〉',text:'a'}])==='shard'&&X.formOf([{text:'a',key:'STORY:x:pre:0'}])==='report'&&X.formOf([{narrator:'〈강재헌〉',text:'a',key:'STORY:x:pre:0'}])==='note');
let doneCalled=false;vm.runInContext("playScenes([{key:'DREAM:sz115:sz115-S05-2:cue:0',narrator:'〈미카엘라의 기억〉',title:'주사실',text:'원문 문장.'}],()=>{globalThis.__done=true;})",sb);
setImmediate(()=>{doneCalled=!!sb.__done;
 const docs=X.inspect().docs();
 ok('an automatic scene with nothing waiting on it is not shown as a blocking window: it drops a collectible near the hero (not into the map props), is marked read, and the banner follow-up still runs',played.length===0&&docs.length===1&&room.props.length===0&&docs[0].form==='shard'&&docs[0].text==='원문 문장.'&&sb.readScenes.has('DREAM:sz115:sz115-S05-2:cue:0')&&doneCalled,{played:played.length,docs:docs.length,doneCalled});
 sb.player.x=docs[0].x;sb.player.y=docs[0].y;vm.runInContext('tick()',sb);
 ok('walking onto it picks it up into the note book (form name in the title, canon text unchanged)',X.inspect().docs().length===0&&kept.length===1&&/^기억 조각 · /.test(kept[0].title)&&kept[0].text==='원문 문장.');
 vm.runInContext("playScenes([{key:'STORY:ep1a09:door:0',text:'문 앞 서사'}],()=>{})",sb);
 ok('a scene that progress waits on (boss door, exit, finale) is still shown right away',played.length===1&&X.inspect().docs().length===0);
 vm.runInContext("playScenes([{key:'STORY:ep1a09:clue:0',text:'단서'}],null);playScenes([{key:'DREAM:sm103:ending:M2:0',text:'끝'}],null)",sb);
 ok('player-opened records (clue) and the ending still show right away',played.length===3&&X.inspect().docs().length===0);
 vm.runInContext("playScenes([{key:'STORY:ep1a09:post:0',text:'정리 서사'}],null)",sb);
 vm.runInContext('enterRegion("x")',sb);
 ok('leaving the map without picking up keeps it in the note book',kept.length===2&&X.inspect().docs().length===0);
 let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
 if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');});
