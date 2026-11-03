// R255 — 진행이 걸린 서사 창을 쪽지·기억 조각 모양으로(배경·인물 그림 빼고 오른쪽 작은 종이), 보스 구역 '전투 전'은 짧은 코드 연출부터.
//  엔진 창(storyScene)·멈춤·진행 순서는 그대로 둔다(진행 코드·옛 검사 그대로).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('story-fragments-r255.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const cls=()=>{const s=new Set();return{add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),contains:x=>s.has(x),list:()=>[...s]};};
function mk(){const panel={classList:cls(),querySelector:q=>q==='.storyText'?{}:q==='h2'?{parentNode:{insertBefore(){}}}:null},modal={classList:cls()},canv=[];
 const sb={console,Math,JSON,Object,Array,Number,String,Set,localStorage:{getItem:()=>null,setItem(){}},window:{__STORYWORLD_STORY_COLLECT_R177__:{formOf:rows=>/기억/.test(rows[0].narrator||'')?'shard':'note'}},
  document:{getElementById:id=>id==='panel'?panel:id==='modal'?modal:id==='stage'?{}:null,createElement:t=>{const e={style:{},remove(){},className:'',textContent:''};if(t==='canvas')canv.push(e);return e;},head:{appendChild(){}},body:{appendChild(){}}},
  performance:{now:()=>0},requestAnimationFrame(){},devicePixelRatio:1,innerWidth:800,innerHeight:600,layer:'STORY',storyScene:null,room:{enemies:[{boss:true,hp:5,name:'발록 · 지옥의 문지기'}]},
  regionById:{dist06:{title:'지옥의 문',bosses:[{name:'발록'}]},hub:{title:'쉼터',bosses:[]}},openPanel(){},closePanel(){},advanceScene(){}};
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,panel,modal,canv};}
{const {sb,panel,modal,canv}=mk();sb.storyScene={id:'hub',key:'STORY:hub:a',part:'body',text:'x',narrator:'나'};sb.advanceScene();
 ok('a story window is restyled as a note (no map/portrait art, small paper on the side), the engine window/pause stay',panel.classList.contains('r255-doc')&&panel.classList.contains('f-note')&&modal.classList.contains('r255')&&canv.length===0);
 sb.storyScene={id:'hub',key:'DREAM:x',part:'body',text:'x',narrator:'기억'};sb.advanceScene();ok('memory narrators become a memory fragment (same forms as R177)',panel.classList.contains('f-shard')&&!panel.classList.contains('f-note'));
 sb.storyScene={id:'hub',key:'journal:hub:0',part:'body',text:'x'};sb.advanceScene();ok('reading from the memory book (journal:) keeps the book window',!panel.classList.contains('r255-doc'));
 sb.storyScene={id:'hub',key:'k',text:'x'};sb.advanceScene();sb.openPanel('<h2>설정</h2>');ok('other windows never keep the note look',!panel.classList.contains('r255-doc')&&!modal.classList.contains('r255'));}
{const {sb,canv}=mk();sb.storyScene={id:'dist06',key:'STORY:dist06:pre:0',part:'pre',text:'x'};sb.advanceScene();const n1=canv.length;sb.storyScene={id:'dist06',key:'STORY:dist06:pre:1',part:'pre',text:'y'};sb.advanceScene();
 ok('boss area "before battle": a short code-drawn cinematic plays once per visit (not again on the next page)',n1===1&&canv.length===1);
 sb.storyScene={id:'hub',key:'STORY:hub:pre',part:'pre',text:'z'};sb.advanceScene();ok('no cinematic where the region has no boss',canv.length===1);}
ok('cinematic: letterbox, blood ink, crack, region + boss name from the game data; click skips',/function cinema\(info\)/.test(src)&&/c\.onclick=end/.test(src)&&/fillText\(info\.region/.test(src)&&/fillText\(info\.boss/.test(src)&&/live\?\.name\|\|r\.bosses\[0\]\?\.name/.test(src));
ok('runtime copy matches; loads after the other new overlays',RT('story-fragments-r255.js')===src&&/summoning-r251\.js"><\/script><script src="\.\/story-fragments-r255\.js">/.test(RT('index.html')));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R255 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
