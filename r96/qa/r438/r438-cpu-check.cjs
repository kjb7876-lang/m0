// R438 CPU check — 칠죄 보스방 조형물 정리(R224 공용 가구 빼기·지역 그림만·틀 밖 장면 장식 빼기) + R92 보스방 한가운데 등불 금지.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='bossroom-tidy-r438.js',src=C(F);
ok('runtime copy matches client source',RT(F)===src);
ok('visual-r92 runtime copy matches',RT('visual-r92.js')===C('visual-r92.js'));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once, right after surface-r435',html.split('"./'+F+'"').length===2&&/<script src="\.\/surface-r435\.js"><\/script><script src="\.\/bossroom-tidy-r438\.js"><\/script>/.test(html));
ok('loads after sin-room-art and cave-r204',html.indexOf('sin-room-art.js')<html.indexOf(F)&&html.indexOf('cave-r204.js')<html.indexOf(F));
ok('listed in verify-r96-public.py',/'bossroom-tidy-r438\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('Mammon ep1b06 untouched',!/'ep1b06'/.test(src.replace(/\/\/.*$/mg,'')));
ok('presentation only: no hp/save/collision writes',!/\.hp\s*=[^=]|saveGame|\.walls\s*=|floorCells\s*=/.test(src));
const r92=C('visual-r92.js');
ok('R92: lamp posts deeper than 1.5 tiles inside a sin boss room frame become ceiling light (pool kept, post not drawn)',/l\.ceiling438=true/.test(r92)&&/bb=L0\?\.sinRoomArt&&r\?\.id!=='ep1b06'/.test(r92)&&/if\(l\.ceiling438\|\|!sightOk\(l\)\)return;/.test(r92)&&!/ceiling438/.test(r92.slice(r92.indexOf('lightPoints:'),r92.indexOf('lightPoints:')+200)));
// 규칙 동작 — 가짜 방으로 tidy() 를 돌린다.
const ctxObj={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},setInterval:()=>0,console};ctxObj.window=ctxObj;vm.createContext(ctxObj);vm.runInContext(src,ctxObj);
const api=ctxObj.__STORYWORLD_BOSSROOM_TIDY_R438__;ok('api exported',!!api&&typeof api.tidy==='function');
const P=(id,x,y,extra)=>({id,x,y,...extra});
const mk=(id)=>({id,layer:'STORY',exploration:{sinRoomArt:'sin-room-art-v1',worldWardR81:{bossBounds:[6,6,28,20]}},props:[
 P('r224:furn:'+id+':0',20.3,6.85,{r224Furniture:true,r80Dressing:true,path:'assets/world-r80/r80-027.webp'}),
 P('r224:furn:'+id+':1',26.7,6.85,{r224Furniture:true,r80Dressing:true,path:'assets/world-r80/r80-026.webp'}),
 P('r224:furn:'+id+':2',1.85,50,{r224Furniture:true,r80Dressing:true,path:'assets/world-r80/r80-027.webp'}),
 P('r224:furn:'+id+':3',1.85,60,{r224Furniture:true,r80Dressing:true,path:'assets/world-r80/r80-026.webp'}),
 P('r81:scene:'+id+':4',30.5,8.5,{r80Dressing:true,path:'assets/world-r80/r80-026.webp'}),
 P('r81:scene:'+id+':5',18,12,{r80Dressing:true,path:'assets/world-r80/r80-026.webp'}),
 P('sin-art:'+id+':console',18.5,7,{sinArt:true}),P('r74:'+id+':door-0',20,20,{r74Door:true}),P('r103chest:STORY:'+id,26,8,{})]});
const a=mk('ep1b03');api.tidy(a);const ids=a.props.map(q=>q.id);
ok('envy: shared furniture inside boss frame+3 removed',!ids.includes('r224:furn:ep1b03:0')&&!ids.includes('r224:furn:ep1b03:1'));
ok('envy: off-theme stove elsewhere removed, envy mirror elsewhere kept',!ids.includes('r224:furn:ep1b03:2')&&ids.includes('r224:furn:ep1b03:3'));
ok('scene dressing in the dark margin removed, inside frame kept',!ids.includes('r81:scene:ep1b03:4')&&ids.includes('r81:scene:ep1b03:5'));
ok('authored set, doors, chest kept',ids.includes('sin-art:ep1b03:console')&&ids.includes('r74:ep1b03:door-0')&&ids.includes('r103chest:STORY:ep1b03'));
const m=mk('ep1b06');api.tidy(m);ok('Mammon room unchanged',m.props.length===9);
const s=mk('ep1a09');api.tidy(s);ok('non-sin region unchanged',s.props.length===9);
const w=mk('ep1b07');api.tidy(w);const wi=w.props.map(q=>q.id);ok('wrath: boss-room furniture removed, no theme filter elsewhere',!wi.includes('r224:furn:ep1b07:0')&&wi.includes('r224:furn:ep1b07:2'));
const sra=C('sin-room-art.js');ok('wrath loose chairs moved out of the boss room to the pre-boss gather room north wall',/prop\('chairs',9\.6,26\.1,2\.2,1\.5,132,1\.1\)/.test(sra)&&/prop\('table',13\.1,7\.3,/.test(sra)&&RT('sin-room-art.js')===sra);
ok('wrath dining-table set repeated at the two gather-room spots, same orientation, same atlas cell (no new manifest cells)',/\{\.\.\.prop\('table2',9\.1,30\.3,3\.9,1\.7,170,1\.05\),cell:'table'\},\{\.\.\.prop\('table3',19\.3,32\.1,3\.9,1\.7,170,1\.05\),cell:'table'\}/.test(sra)&&!/table2:cell/.test(sra)&&/sinArtCell:p\.cell\|\|p\.key/.test(sra));
ok('R443: lamp posts deeper than 1.5 tiles inside the gather room (gatherBounds) also become ceiling light',/gb=L0\?\.sinRoomArt&&r\?\.id!=='ep1b06'&&L0\?\.worldWardR81\?\.gatherBounds/.test(r92)&&/l\.y<gb\[3\]&&Math\.min\(l\.x-gb\[0\],gb\[2\]-l\.x,l\.y-gb\[1\],gb\[3\]-l\.y\)>1\.5\)l\.ceiling438=true/.test(r92));
{const L={id:'ep1b05',layer:'STORY',exploration:{sinRoomArt:'sin-room-art-v1',worldWardR81:{bossBounds:[6,6,26,20],gatherBounds:[4,27,28,39]}},props:[
 ...['lounge-seats','cocktail-table','red-heels','stage-spot','red-curtain','mask-panel','veiled-mirror','stage-long'].map((k,i)=>P('r406:ep1b05:'+k,14+i*.3,15,{r406Boss:k,r80PresentationOnly:true,r303Flip:i%2===0})),
 P('r224:furn:ep1b05:5',8.9,25.9,{r224Furniture:true,r80Dressing:true,path:'assets/world-r80/r80-051.webp'}),P('r224:furn:ep1b05:41',31.9,3.6,{r224Furniture:true,r80Dressing:true,path:'assets/world-r80/r80-056.webp'})]};
 api.tidy(L);const by=k=>L.props.find(q=>q.r406Boss===k),ids=L.props.map(q=>q.id);
 ok('R450 lust (user 2026-11-09 10:08Z): seats along the west wall facing right/into the room (6.5,14.4, art default facing) · glasses table right of the booth sofa front (25.0,11.8) · heels 15.1,15.6 · spot 25.5,15.8 flipped',by('lounge-seats').x===6.5&&by('lounge-seats').y===14.4&&!by('lounge-seats').r303Flip&&by('cocktail-table').x===25.0&&by('cocktail-table').y===11.8&&by('red-heels').x===15.1&&by('stage-spot').x===25.5&&by('stage-spot').r303Flip===true);
 ok('R443 lust: pinned props stay visible even inside the R169 path-clearing band',['lounge-seats','cocktail-table','red-heels','stage-spot'].every(k=>by(k).visible!==false&&by(k).r169Hidden===true));
 ok('R443 lust: mask panel, veiled mirror, long stage and the wall curtain hidden but kept as objects (R406 does not respawn them)',['mask-panel','veiled-mirror','stage-long','red-curtain'].every(k=>by(k)&&by(k).visible===false));
 ok('R443 lust: shared R224 furniture in the gather room removed, far room kept',!ids.includes('r224:furn:ep1b05:5')&&ids.includes('r224:furn:ep1b05:41'));
 ok('R450 lust: liquor display (backbar) removed, booth 23.3,8.5 kept, trolley moved before the booth sofa (21.7,10.9)',!/prop\('backbar'/.test(sra)&&/prop\('bar',13\.1,7\.15,4\.0,1\.5,170,1\.3\),\{\.\.\.prop\('booth',23\.3,8\.5,1\.65,3\.5,165,1\.4,true\),wall:'west'\},\{\.\.\.prop\('trolley',21\.7,10\.9,1\.25,1\.4,112,\.95,true\),wall:'west'\}\]/.test(sra));
 const r83=fs.readFileSync(path.join(__dirname,'../../client-source/world-doors-r83.js'),'utf8');ok('R443 lust: boss door-0 leaves drawn as the red stage curtain (door state/collision untouched, switchable)',/CURTAIN_PATH='assets\/r408\/props\/red-curtain\.webp',CURTAIN_DOORS=\{ep1b05:'door-0'\}/.test(r83)&&/const cur=!clinical&&curtainFor\(r,d\);if\(cur\)affinePatch\(cur,/.test(r83)&&/storyworld\.r443\.curtainDoor/.test(r83));}
console.log(n-bad+'/'+n+' ok');process.exit(bad?1:0);
