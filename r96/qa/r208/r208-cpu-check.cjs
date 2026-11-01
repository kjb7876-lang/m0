// R208 CPU check: 초반 스토리 몹(dist00 침식 근위 등) 그림을 Drive 시트 15·16 의 11칸 몹으로 바꾸고, 땅에 붙여 그린다. 이름·판정은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html'),pos=f=>idx.indexOf('./'+f);
ok('story-mobs-r208 loads after mob-ground-r206 and before combat-r118',pos('story-mobs-r208.js')>pos('mob-ground-r206.js')&&pos('mob-ground-r206.js')>0&&pos('story-mobs-r208.js')<pos('combat-r118.js'));
ok('runtime copy matches',RT('story-mobs-r208.js')===C('story-mobs-r208.js'));
ok('in the public verify list and the CI workflow',/'story-mobs-r208\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r208\/r208-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const J=JSON.parse(RT('assets/r208/mobs/index.json'));
ok('5 mobs, each with 10+ frames (move+attack), files present with matching sha256',J.mobs.length===5&&J.mobs.every(m=>m.frames>=10&&m.move.length+m.attack.length===m.frames&&(()=>{const b=fs.readFileSync(path.join(R,'runtime-text',m.path));return b.length===m.bytes&&crypto.createHash('sha256').update(b).digest('hex')===m.sha256;})()),J.mobs.map(m=>[m.id,m.frames]));
const sb={console,Math,JSON,String,Number,Object,Promise,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},window:{},calls:[],time:1,room:{id:'dist00'},player:{x:10,y:0},
 readyImage:()=>({image:{naturalWidth:9}}),fetch:()=>Promise.resolve({ok:true,json:()=>J}),setTimeout:(f)=>0};vm.createContext(sb);
vm.runInContext(`window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:(e,f)=>({path:'orig'})});
 function shadow(x,y,r,opt){calls.push(['shadow']);} function drawEnemy(e){calls.push(['lift',e.visualLiftPx]);if(!(e.visualLiftPx>0))e.__hovered=true;shadow(e.x,e.y,18,{});}`,sb);
vm.runInContext(C('mob-ground-r206.js'),sb);vm.runInContext(C('story-mobs-r208.js'),sb);
(async()=>{await new Promise(r=>setImmediate(r));
 const ff=js=>vm.runInContext(`window.__STORYWORLD_STORY_COMBAT_R54__.frameFor(${js},null)`,sb);
 const a=ff(`globalThis.A={id:'m1',name:'악마화 나무의 침식 근위 3',x:1,y:1,hp:5}`);
 ok('dist00 침식 근위 → root-bound-ghoul (name kept)',a.path==='assets/r208/mobs/root-bound-ghoul.webp'&&vm.runInContext('A.name',sb)==='악마화 나무의 침식 근위 3',a);
 ok('midboss variant of 침식 근위 also replaced',ff(`{id:'m2',name:'중간보스 · 악마화 나무의 침식 근위 5',x:1,y:1,hp:5}`).r208Mob==='root-bound-ghoul');
 ok('boss untouched',ff(`{id:'b',name:'뿌리의 문지기',boss:true,x:1,y:1,hp:5}`).path==='orig');
 ok('other mobs untouched',ff(`{id:'c',name:'뿌리 추적자',x:1,y:1,hp:5}`).path==='orig');
 sb.room.id='dist01';ok('dist01 거미줄에 묶인 수호병 → web-bound-skeleton; 보라검천사 untouched',ff(`{id:'d',name:'거미줄에 묶인 수호병 추격대',x:1,y:1,hp:5}`).r208Mob==='web-bound-skeleton'&&ff(`{id:'e',name:'보라검천사',midboss:true,x:1,y:1,hp:5}`).path==='orig');
 ok('rule is per zone (dist00 name in dist01 untouched)',ff(`{id:'f',name:'악마화 나무의 침식 근위 1',x:1,y:1,hp:5}`).path==='orig');
 sb.room.id='dist03';ok('dist03 쓰러진 수호병·피냄새 추적자 replaced',ff(`{id:'g',name:'쓰러진 수호병',x:1,y:1,hp:5}`).r208Mob==='halberd-revenant'&&ff(`{id:'h',name:'피냄새 추적자 증원',x:1,y:1,hp:5}`).r208Mob==='ember-hound');
 sb.room.id='dist04';ok('dist04 피로 꿰맨 전령 replaced',ff(`{id:'i',name:'피로 꿰맨 전령',x:1,y:1,hp:5}`).r208Mob==='twin-head-corpse');
 const m=J.mobs.find(q=>q.id==='root-bound-ghoul');sb.room.id='dist00';
 const atk=ff(`{id:'m1b',name:'침식 근위',x:1,y:1,hp:5,attack:{elapsed:.9}}`),cw=m.cell[0],cell=atk.assetFrame.sourceRect[0]/cw;
 ok('attack uses attack cells; walking uses move cells',m.attack.includes(cell)&&m.move.includes(ff(`{id:'m1c',name:'침식 근위',x:1,y:1,hp:5,moving:true}`).assetFrame.sourceRect[0]/cw),cell);
 ok('faces the hero (flip when hero is on the left)',ff(`{id:'m1d',name:'침식 근위',x:20,y:0,hp:5}`).flip===true&&ff(`{id:'m1e',name:'침식 근위',x:0,y:0,hp:5}`).flip===false);
 sb.calls.length=0;vm.runInContext(`globalThis.G={id:'m1',name:'침식 근위',x:1,y:1,hp:5,r208Mob:'root-bound-ghoul'};drawEnemy(G)`,sb);
 ok('drawn grounded: tiny lift blocks R109 hover, no contact shadow, lift restored',sb.calls.length===1&&sb.calls[0][1]===.001&&!vm.runInContext('G.__hovered',sb)&&!('visualLiftPx' in vm.runInContext('G',sb)),sb.calls);
 ok('R206 treats R208 mobs as grounded',sb.window.__STORYWORLD_MOB_GROUND_R206__.floating({r208Mob:'x',name:'날개'},{})===false);
 sb.window.__STORYWORLD_STORY_MOBS_R208__.set({on:false});vm.runInContext("globalThis.readyImage=p=>p==='assets/r208/mobs/root-bound-ghoul.webp'?{image:{naturalWidth:0}}:{image:{naturalWidth:9}}",sb);ok('before the sheet is loaded the original art is used (no empty body)',ff(`{id:'w1',name:'침식 근위',x:1,y:1,hp:5}`).path==='orig');vm.runInContext('globalThis.readyImage=()=>({image:{naturalWidth:9}})',sb);
ok('switching off restores the original art',ff(`{id:'z',name:'침식 근위',x:1,y:1,hp:5}`).path==='orig');
 let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
 if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');})();
