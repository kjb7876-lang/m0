// R378 CPU check — 미카엘라 쉼터 발레리나 오르골: 빌드 연결·자산·정본 근거·그리기 제약, 그리고 곡 목록/페이드/상호작용 분기를 가짜 엔진에서 돌려 본다.
//   node r96/qa/r378/r378-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');
let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL '+m);}else console.log('PASS '+m);};
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const src=fs.readFileSync(path.join(R,'client-source','music-box-r378.js'),'utf8');
ok(src===RT('music-box-r378.js'),'runtime-text copy matches client-source');
const html=RT('index.html');
ok(/<script src="\.\/mob-dots-r375\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*<script src="\.\/music-box-r378\.js"><\/script>(?:<script src="\.\/approved-mobs-r380\.js"><\/script>)?(?:<script src="\.\/voice-r381-data\.js"><\/script><script src="\.\/voice-r381\.js"><\/script>)?(?:<script src="\.\/cinema-sync-r384\.js"><\/script>)?(?:<script src="\.\/mob-moves-r385\.js"><\/script>)?(?:<script src="\.\/aggro-chase-r390\.js"><\/script>)?(?:<script src="\.\/guide-clear-r426\.js"><\/script>)?<script src="\.\/mammon-bossroom\.js"><\/script><script src="\.\/seven-sins-bossrooms\.js"><\/script><script src="\.\/sin-room-art\.js"><\/script>(<script src="\.\/props-place-r406\.js"><\/script>)?(<script src="\.\/mob-art-r410\.js"><\/script>)?(<script src="\.\/skill-sheets-r411\.js"><\/script>)?(<script src="\.\/theme-fx-r430\.js"><\/script>)?(<script src="\.\/boss-arena-r431\.js"><\/script>)?(?:<script src="\.\/fx-more-r438\.js"><\/script>)?(<script src="\.\/props-tidy-r412\.js"><\/script>)?(<script src="\.\/doors-fit-r413\.js"><\/script>)?(<script src="\.\/drive-buildings-r414\.js"><\/script>)?(<script src="\.\/access-r420\.js"><\/script>(?:<script src="\.\/readability-r434\.js"><\/script>)?(?:<script src="\.\/surface-r435\.js"><\/script>)?(?:<script src="\.\/bossroom-tidy-r438\.js"><\/script>)?(?:<script src="\.\/props-space-r449\.js"><\/script>)?(?:<script src="\.\/enemy-face-r444\.js"><\/script>)?)?(<script src="\.\/combat-read-r409\.js"><\/script>)?(<script src="\.\/slayer-blood-r425\.js"><\/script><script src="\.\/combat-flow-r425\.js"><\/script>(?:<script src="\.\/neon-lauren-r437\.js"><\/script>)?(?:<script src="\.\/perf-r441\.js"><\/script>)?(?:<script src="\.\/skill-attack-r440\.js"><\/script>)?(?:<script src="\.\/enemy-skill-pose-r442\.js"><\/script>)?(?:<script src="\.\/depth-overlap-r448\.js"><\/script>)?(?:<script src="\.\/cinema-run-r461\.js"><\/script>)?(?:<script src="\.\/mob-death-r462\.js"><\/script>)?(?:<script src="\.\/sin-boss-art-r463-data\.js"><\/script><script src="\.\/sin-boss-art-r463\.js"><\/script>)?(<script src="\.\/samong-rooms-r511\.js"><\/script>)?(?:<script src="\.\/weather-r450\.js"><\/script><script src="\.\/local-light-r451\.js"><\/script><script src="\.\/ground-fringe-r452\.js"><\/script><script src="\.\/actor-tone-r453\.js"><\/script>(?:<script src="\.\/hwando-chain-r590\.js"><\/script>)?(?:<script src="\.\/[a-z-]+-r56[1-4]\.js"><\/script>)*(?:<script src="\.\/samong-theme-r572\.js"><\/script>)?(?:<script src="\.\/samong-surge-r571\.js"><\/script>)?(?:<script src="\.\/survival-r600\.js"><\/script>)?(?:<script src="\.\/slayer-sheets-r585\.js"><\/script>)?(?:<script src="\.\/slayer-berserk-r586\.js"><\/script>)?(?:<script src="\.\/enemy-attack-tempo-r601\.js"><\/script>)?(?:<script src="\.\/hit-feel-r750\.js"><\/script>)?)?)?\s*<script src="\.\/combat-r118\.js">/.test(html)&&html.split('music-box-r378.js').length===2,'script tag once, right after mob-dots-r375 (before combat-r118)');
ok(html.indexOf('"./music-box-r378.js"')>html.indexOf('"./bgm-map-r308.js"')&&html.indexOf('"./music-box-r378.js"')>html.indexOf('"./crates-r108.js"')&&html.indexOf('"./music-box-r378.js"')>html.indexOf('"./play-r169.js"'),'loads after R308 (musicTick), R108 (interact) and R169 (pathCells)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'music-box-r378.js',"),'verify-r96-public lists music-box-r378.js');
ok(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r378/r378-cpu-check.cjs'),'pages.yml runs this check');
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')),man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'));
const rows=Object.fromEntries(man.files.map(f=>[f.path,f]));
const assets=[...[0,1,2,3,4,5,6,7].map(i=>'assets/r378/orgel-'+i+'.webp'),...[0,1,2,3,4,5,6,7].map(i=>'assets/r378/table-orgel-'+i+'.webp')];
for(const a of ['music-box-r378.js',...assets]){const b=fs.readFileSync(path.join(R,'runtime-text',a));
 ok(inputs.textPaths.includes(a)&&rows[a]&&rows[a].sha256===crypto.createHash('sha256').update(b).digest('hex'),'runtime inputs/manifest carry '+a);}
// 그림: webp, 8장 같은 크기
const dims=f=>{const b=fs.readFileSync(path.join(R,'runtime-text',f));if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8L'){const v=b.readUInt32LE(21);return[1+(v&0x3fff),1+((v>>14)&0x3fff)];}if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return null;};
for(const set of ['orgel','table-orgel']){const d=[0,1,2,3,4,5,6,7].map(i=>dims('assets/r378/'+set+'-'+i+'.webp'));ok(d.every(x=>x&&x[0]===d[0][0]&&x[1]===d[0][1]),set+' frames are 8 webp of one size '+JSON.stringify(d[0]));}
// 정본 근거: [12 · dreamRest] 에서 미카엘라가 처음 나온다
const canon=fs.readFileSync(path.join(ROOT,'story-source','hapil-canon-r106-improved.txt'),'utf8');const at=canon.indexOf('[12 · dreamRest]'),first=canon.indexOf('그녀의 이름은 미카엘라였다');
ok(at>0&&first>at&&first-at<1200,'canon: Michaela first appears in [12 · dreamRest]');
// 그리기 제약(Three.js 기록기): filter·setLineDash·그라데이션 없음
const code=src.replace(/^\s*\/\/.*$/mg,'');
ok(!/ctx\.filter|setLineDash|createRadialGradient|createLinearGradient|drop-shadow|blur\(/.test(code),'no ctx.filter / setLineDash / canvas gradients');
ok(/globalCompositeOperation='lighter'/.test(code),'warm light uses lighter ellipses');
ok(!/localStorage\.setItem/.test(code),'does not write saves/settings');
// ---- 가짜 엔진에서 돌리기 ----
const idx=JSON.parse(RT('assets/r308/bgm/index.json'));
function engine(){const log=[];const sb={console,Math,JSON,Date,Number,String,Object,Array,Set,Map,WeakSet,Promise,setTimeout,clearTimeout,performance:{now:()=>sb.__now},__now:0};
 sb.window=sb;sb.globalThis=sb;
 sb.localStorage={getItem:()=>null,setItem:()=>{}};
 sb.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve(idx)});
 class Audio{constructor(){this.paused=true;this.volume=0;this.currentTime=0;this.src='';}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}sb.Audio=Audio;
 const els=[];const mk=tag=>{const e={tagName:tag,children:[],style:{},dataset:{},attrs:{},innerHTML:'',textContent:'',setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(){},remove(){const i=els.indexOf(this);if(i>=0)els.splice(i,1);},querySelector:()=>mk('x'),querySelectorAll:()=>[],appendChild(c){els.push(c);}};return e;};
 sb.document={hidden:false,head:mk('head'),body:mk('body'),createElement:mk,getElementById:id=>els.find(e=>e.id===id)||null,addEventListener(){}};
 sb.addEventListener=()=>{};sb.matchMedia=()=>({matches:false});sb.Image=class{};
 sb.settings={music:true,bgm:.5};sb.started=true;sb.loading=false;sb.modal=false;sb.layer='STORY';
 sb.player={x:0,y:0,hp:10};
 const floor=[];for(let x=10;x<30;x++)for(let y=8;y<24;y++)floor.push([x,y]);
 sb.room={id:'dreamRest',objective:{x:15,y:13},exploration:{entry:{x:15,y:19},floorCells:floor},props:[{id:'dreamRest:michaela-r75',x:17.4,y:14}]};
 sb.visited=new Set(['STORY:hub','STORY:dist00','STORY:dist01','STORY:dreamRest']);
 sb.regionById={hub:{order:0},dist00:{order:1},dist01:{order:2},dreamRest:{order:13}};
 sb.__STORYWORLD_PLAY_R169__={pathCells:()=>new Set(['15,19','15,18','15,17','15,16','15,15','15,14','15,13'])};
 sb.StoryPhase1={explorationBlocked:(L,x,y)=>!(x>=10&&x<30&&y>=8&&y<24)};
 sb.__STORYWORLD_BGM_MAP_R308__={resolve:(z,ix)=>{const m=ix.maps[z];return m?{zone:z,track:m.track}:{zone:z,track:ix.fallbackTrack};}};
 sb.musicTick=function(){log.push({music:sb.settings.music,bgm:sb.settings.bgm});};
 sb.interact=function(){log.push('baseInteract');};sb.tick=function(){};sb.drawProp=function(){};sb.enterRegion=async function(){};
 sb.addImage=()=>{};sb.readyImage=()=>true;sb.project=(x,y)=>({x:(x-y)*64,y:(x+y)*32});sb.zoom=1;
 sb.ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(()=>({width:10})),set:(t,k,v)=>{t[k]=v;return true;}});
 vm.createContext(sb);vm.runInContext(src,sb,{filename:'music-box-r378.js'});return{sb,log,M:sb.__STORYWORLD_MUSIC_BOX_R378__};}
(async()=>{const {sb,log,M}=engine();await new Promise(r=>setTimeout(r,5));
 const run=(sec)=>{for(let i=0;i<Math.round(sec*30);i++){sb.__now+=1000/30;sb.musicTick();}};
 run(.1);let a=M.inspect();
 ok(a.orgel&&a.orgel.solid===false&&a.orgel.presentationOnly&&sb.room.props.filter(p=>p.r378Orgel).length===1,'one presentation-only orgel placed in dreamRest');
 const o=sb.room.props.find(p=>p.r378Orgel),dm=Math.hypot(o.x-17.4,o.y-14),dObj=Math.hypot(o.x-15,o.y-13),pathMin=Math.min(...[...sb.__STORYWORLD_PLAY_R169__.pathCells()].map(k=>{const[c,d]=k.split(',').map(Number);return Math.hypot(c+.5-o.x,d+.5-o.y);}));
 ok(dm>=1.6&&dm<=3.2&&dObj>=4.2&&pathMin>=1.6,'spot near Michaela, away from altar and path '+JSON.stringify({x:o.x,y:o.y,dm:+dm.toFixed(2),dObj:+dObj.toFixed(2),pathMin:+pathMin.toFixed(2)}));
 const other={...sb.room,id:'hub',props:[]};const saved=sb.room;sb.room=other;run(.1);ok(!other.props.some(p=>p.r378Orgel),'no orgel outside dreamRest');sb.room=saved;
 // far → engine interact
 sb.player.x=o.x+3;sb.player.y=o.y;sb.interact();ok(log.includes('baseInteract')&&!M.inspect().open,'interact beyond 1.7 cells falls through to engine');
 // near the altar → engine (guidance/altar keeps priority)
 log.length=0;sb.player.x=15.5;sb.player.y=13.5;sb.interact();ok(log.includes('baseInteract')&&!M.inspect().open,'interact near altar stays with engine');
 // near → open
 log.length=0;sb.player.x=o.x+.8;sb.player.y=o.y+.5;sb.interact();a=M.inspect();ok(a.open&&!log.includes('baseInteract'),'interact within 1.7 cells opens the music box');
 ok(JSON.stringify(a.tracks)===JSON.stringify(['air','toccata','beethoven-malinconia']),'list = visited maps tracks in region order, no duplicates '+JSON.stringify(a.tracks));
 ok(a.track==='beethoven-malinconia','starts on the rest area track');
 run(.5);a=M.inspect();ok(a.bgmGain>0&&a.bgmGain<1&&a.fade===0,'map BGM fading down first ('+a.bgmGain+')');
 const mid=log.filter(x=>x.bgm!==undefined).slice(-1)[0];ok(mid&&mid.music===true&&mid.bgm<.5&&mid.bgm>0,'during fade musicTick sees scaled settings.bgm '+JSON.stringify(mid));
 run(.6);a=M.inspect();const last=log.slice(-1)[0];ok(a.bgmGain===0&&last.music===false,'after 0.8 s map BGM runs with music off (paused, position kept)');
 ok(sb.settings.music===true&&sb.settings.bgm===.5,'real settings restored after each musicTick');
 run(.9);a=M.inspect();ok(a.fade===1&&!a.elPaused&&a.orgelVolume>0,'orgel faded in and playing');
 M.next();ok(M.inspect().track==='air','next wraps around');M.prev();ok(M.inspect().track==='beethoven-malinconia','prev');run(.9);
 M.pause();run(.85);a=M.inspect();ok(a.fade===0&&a.elPaused&&a.bgmGain<.2,'pause: orgel fades out first '+JSON.stringify({f:a.fade,p:a.elPaused,g:a.bgmGain}));run(.9);a=M.inspect();ok(a.bgmGain===1&&log.slice(-1)[0].music===true&&log.slice(-1)[0].bgm===.5,'then map BGM back to full');
 M.play();run(2);sb.settings.music=false;run(.2);a=M.inspect();ok(!a.want&&a.stats.muted>=1,'music off in settings stops the orgel');sb.settings.music=true;
 M.play();run(2);sb.settings.bgm=0;run(.2);ok(!M.inspect().want,'BGM volume 0 also counts as off');sb.settings.bgm=.5;
 M.play();run(2);sb.room={...sb.room,id:'hub'};run(.1);a=M.inspect();ok(!a.open&&!a.want&&a.stats.autoClose>=1,'leaving the map closes it');
 run(2);ok(M.inspect().bgmGain===1,'map BGM fully back after leaving');
 console.log(fails?`FAIL ${fails}/${n}`:`ALL ${n} PASS`);process.exit(fails?1:0);})().catch(e=>{console.log('FAIL crash',e);process.exit(1);});
