// R830 지역 양식별 문짝(doors-theme-r830 + world-doors-r83 훅) · 불면귀 마을 나무 세트(cave-r204 trees:'joseon') CPU 검사
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;else console.log('FAIL',n,d===undefined?'':JSON.stringify(d));};
function load(opt={}){const store={},loads=[];if(opt.off)store['storyworld.r830.doors']='{"on":false}';
 const imgs=opt.imgs||{};const g={console,Math,Object,JSON,Set,Map,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;}},
  readyImage:p=>imgs[p]?{image:imgs[p]}:null,addImage:(p)=>loads.push(p),loads};g.window=g;vm.createContext(g);vm.runInContext(CS('doors-theme-r830.js'),g);
 const api=g.__STORYWORLD_DOOR_THEME_R830__;if(opt.ready)for(const f of opt.ready)api.READY.add(f);return{g,api};}
// 1) 표: 맘몬·무대·병원 진료문 지역은 빠지고, 요청서 묶음 글자만
{const {api}=load();const Z=api.ZONE;for(const z of ['ep1b06','ep1b06b','ep1b05','ep1a08'])ok('excluded '+z,!(z in Z));
 const fams=new Set(Object.values(Z));for(const f of fams)ok('family letter '+f,/^(A|B|C|D|D2|E|F|G|H|I|J|K|L)$/.test(f));ok('joseon village is A',Z.last302==='A'&&Z.last303==='A');ok('zones >= 50',Object.keys(Z).length>=50,Object.keys(Z).length);}
// 2) 그림이 검수 통과(READY) 전에는 원래 문짝 — null
{const {api,g}=load();ok('not ready (B) -> null',api.leaf({id:'ep1a09',layer:'STORY'})===null);ok('no load before ready',g.loads.length===0);
 ok('only reviewed families ready',[...api.READY].every(f=>fs.existsSync(path.join(R,'runtime-text','assets','r830','doors',f+'-a.webp'))&&fs.existsSync(path.join(R,'runtime-text','assets','r830','doors',f+'-b.webp'))),[...api.READY]);ok('A ready',api.READY.has('A'));}
// 3) READY 인데 그림이 아직 안 읽힘 → 읽기만 요청하고 null
{const {api,g}=load({ready:['A']});ok('pending -> null',api.leaf({id:'last302',layer:'STORY'})===null);ok('requests both leaves',g.loads.length===2&&g.loads.every(p=>/^assets\/r830\/doors\/A-[ab]\.webp$/.test(p)),g.loads);}
// 4) 읽힘 → 가로:세로(층 단위 환산) 와 두 장
{const im={naturalWidth:1024,naturalHeight:704};const {api}=load({ready:['A'],imgs:{'assets/r830/doors/A-a.webp':im,'assets/r830/doors/A-b.webp':im}});const L=api.leaf({id:'last303',layer:'STORY'});
 ok('leaf',L&&L.family==='A'&&L.images.length===2,L&&{f:L.family,n:L.images.length});const Z=Math.sqrt(1.5)/Math.sqrt(1.25);ok('aspect',L&&Math.abs(L.aspect*Z-1024/704)<1e-9,L&&L.aspect);
 ok('other layer -> null',api.leaf({id:'last303',layer:'DREAM'})===null);ok('unlisted zone -> null',api.leaf({id:'ep1b06',layer:'STORY'})===null);}
// 5) 끄기
{const im={naturalWidth:1024,naturalHeight:704};const {api}=load({off:true,ready:['A'],imgs:{'assets/r830/doors/A-a.webp':im}});ok('off -> null',api.leaf({id:'last302',layer:'STORY'})===null);}
// 6) R83 훅: 문짝 그림 가로:세로로 칸을 나누고, 칸마다 a·b 번갈아, 열린 짝은 반쪽
{const s=CS('world-doors-r83.js');ok('hook reads R830',/__STORYWORLD_DOOR_THEME_R830__/.test(s));ok('themeLeaf drawn before oak fallback',/else if\(!clinical&&themeLeaf\(THEME\(r\),part,ps\)\)\{\}else\{/.test(s));
 ok('bay index on closed leaves',/source:'leaf',bay:i\}/.test(s));ok('aspect object supported',/if\(k&&typeof k==='object'\)return k\.aspect;/.test(s));ok('clinical untouched',/const th=!clinical&&THEME/.test(s));}
// 7) 불면귀 마을 나무: last302·last303 이 joseon 세트, 그림 12장 모두 있음
{const s=CS('cave-r204.js');for(const z of ['last302','last303']){const i=s.indexOf(' '+z+':{'),line=s.slice(i,s.indexOf('\n',i));ok(z+' trees joseon',/trees:'joseon'/.test(line));}
 for(let i=0;i<12;i++){const f=path.join(R,'runtime-text','assets','r99','outdoor','tree-joseon-'+String(i).padStart(2,'0')+'.webp');ok('tree file '+i,fs.existsSync(f)&&fs.statSync(f).size>10000);}}
// 8) 스크립트 태그
{const h=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok('index tag',h.includes('<script src="./doors-theme-r830.js"></script>'));}
console.log(JSON.stringify({check:'R830',pass,total}));if(pass!==total)process.exit(1);
