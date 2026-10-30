// R139 CPU check: samong ultimate pulses replace the R75 line storm; Lauren meteor violet + cross ground marker; guide altar/exit/portal fixes present.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of['samong-ult-r139.js','fx-eden-r108.js','polish-r101.js','fx-sprites-r106.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
// sandbox the samong overlay
const hits=[],fxs=[];const boss={id:'b',hp:1000,maxHp:1000,x:2,y:0,spawnState:'active',boss:true},mob={id:'m',hp:50,maxHp:50,x:1,y:1,spawnState:'active'},far={id:'f',hp:50,maxHp:50,x:30,y:0,spawnState:'active'};
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},time:0,player:{hero:'lauren',x:0,y:0,hp:10,samong:0},room:{enemies:[boss,mob,far]},
 E568_HERO_VFX:{lauren:{ultimate:'u.webp'}},attackPower:()=>100,safeRegion:()=>false,
 fx:(t,x,y,o)=>fxs.push(t),delay:(s,fn)=>fn(),tick(){},drawEffect:()=>'drawn',hitEnemy:(e,v,s)=>{hits.push([e.id,v,s?.kind]);e.hp-=v;return true;}};
sb.window.StoryPhase1={CURRENT_PUBLIC_HERO_DATA:{heroActions:{lauren:{r:'r.webp'}}}};
vm.createContext(sb);vm.runInContext(C('samong-ult-r139.js'),sb);
sb.tick(1/60);ok('no pulse without samong',!hits.length);
sb.player.samong=7;sb.time=1;sb.tick(1/60);
ok('ultimate effect at activation',fxs.includes('e568HeroUltimate')&&fxs.includes('storySourceSkill'),fxs.join());
ok('ordinary mob in range dies',mob.hp<=0,JSON.stringify(hits));
ok('boss takes ultimate damage (attack x2.4), not instakill',hits.some(h=>h[0]==='b'&&Math.abs(h[1]-240)<1e-9)&&boss.hp>0);
ok('enemy beyond 9 tiles untouched',far.hp===50);
const n=hits.length;sb.time=1.5;sb.tick(1/60);ok('next pulse waits 1.4 s',hits.length===n);sb.time=2.5;sb.tick(1/60);ok('pulse repeats',hits.length>n);
ok('storm line hidden',sb.drawEffect({type:'samongStormR75'})===undefined&&sb.drawEffect({type:'x'})==='drawn');
ok('storm hit blocked',sb.hitEnemy(boss,5,{kind:'hero-samong-storm-r75'})===false);
const eden=C('fx-eden-r108.js');
ok('meteor uses violet tint and runecross marker',/clip\('fire\.fly'[^;]*tint:VIOLET/.test(eden)&&/clip\('fire\.boom'[^;]*tint:VIOLET/.test(eden)&&/S\('runecross',F,q\.x,q\.y,h\*2\.6\*k/.test(eden)&&!/S\('rune',F,q\.x,q\.y,h\*2\.6\*k/.test(eden));
ok('runecross texture registered',/"runecross":\[512,512/.test(C('fx-sprites-r106.js'))&&fs.existsSync(path.join(R,'runtime-text/assets/r106/fx/runecross.webp')));
const pol=C('polish-r101.js');
ok('guide: altar retarget, exit after clear, ward door, portal auto-entry',/guideAltar/.test(pol)&&/guideExitAfter/.test(pol)&&/guideWardDoor/.test(pol)&&/guidePortalAuto/.test(pol)&&/function objectiveBlocked/.test(pol));
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok('scripts loaded before audio-r98',html.indexOf('story-batch-r139.js')>0&&html.indexOf('story-batch-r139.js')<html.indexOf('./audio-r98.js')&&html.indexOf('samong-ult-r139.js')>0&&html.indexOf('samong-ult-r139.js')<html.indexOf('./audio-r98.js'));
// story batching
{const played=[];const sb2={window:{},localStorage:{getItem:()=>null,setItem(){}},started:true,layer:'STORY',zone:'dist00',room:{},safeRegion:()=>false,
 playScenes(sc,done){played.push(sc.map(s=>s.key));if(done)done();},travel:async d=>'went:'+d};
 vm.createContext(sb2);ok('story batch runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','story-batch-r139.js'),'utf8')===C('story-batch-r139.js'));vm.runInContext(C('story-batch-r139.js'),sb2);
 let doneCalled=0;sb2.playScenes([{key:'STORY:dist00:pre:0',text:'a'}],()=>doneCalled++);
 sb2.playScenes([{key:'STORY:dist00:pre:0',text:'a'},{key:'DREAM:sz115:sz115-S01-2:boss:0',text:'b'}],()=>doneCalled++);
 ok('mid-map scenes are queued, not shown',played.length===0&&sb2.window.__STORYWORLD_STORY_BATCH_R139__.inspect().queued===2,JSON.stringify([played,sb2.window.__STORYWORLD_STORY_BATCH_R139__.inspect()]));
 setImmediate(()=>{ok('their progress callbacks still run',doneCalled===2);
  sb2.playScenes([{key:'DREAM:sm105:x:1',text:'c'}],null);ok('player-opened records show at once',played.length===1&&played[0][0]==='DREAM:sm105:x:1');
  sb2.playScenes([{key:'STORY:dist00:post:0',text:'d'}],null);ok('map-clear scene plays the queue in one reader, in order',JSON.stringify(played[1])===JSON.stringify(['STORY:dist00:pre:0','DREAM:sz115:sz115-S01-2:boss:0','STORY:dist00:post:0']));
  sb2.playScenes([{key:'STORY:dist00:pre:1',text:'e'}],null);sb2.travel('e').then(r=>{ok('leaving by portal shows the queue first',JSON.stringify(played[2])===JSON.stringify(['STORY:dist00:pre:1'])&&r==='went:e');
   sb2.safeRegion=()=>true;sb2.playScenes([{key:'STORY:hub:body:0',text:'f'}],null);ok('safe regions are untouched',JSON.stringify(played[3])===JSON.stringify(['STORY:hub:body:0']));finish();});});}
function finish(){
const fails=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' :: '+c.detail));console.log(fails.length?'FAIL':'PASS',checks.length-fails.length+'/'+checks.length,'r139 checks');if(fails.length)process.exit(1);
}
