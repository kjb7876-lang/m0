// R1339 고품질 3D 몹 바꿔치기 CPU 검사.
//  ① 켜짐: 표에 있는 옛 GLB 요청은 새 GLB 로 바뀐다(상대·절대 주소, Request 객체 모두). 표에 없는 요청·다른 파일은 그대로.
//  ② 꺼짐(localStorage·?hq39=0): 모두 그대로.
//  ③ 표의 새 GLB 는 실제 파일이 있고, 옛 GLB 와 애니메이션 이름 집합이 같고, 뼈대(스킨) 메시가 있다(오버레이가 클립 이름으로 고르므로).
//  ④ 새 GLB 는 3MB 이하(Pages 용량), 옛 파일은 지우지 않는다(원본 보존).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const ROOT=path.join(__dirname,'..','..');const SRC=path.join(ROOT,'client-source','mob-3d-hq-r1339.js');const RT=path.join(ROOT,'runtime-text');
function boot(store={},search=''){const calls=[];const win={location:{search,href:'https://x.test/m0/'+search},document:{baseURI:'https://x.test/m0/',getElementById:()=>null},
 localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
 fetch:(u,o)=>{calls.push(typeof u==='string'?u:u.url);return Promise.resolve({ok:true});},Request:class{constructor(u){this.url=u;}}};
 win.window=win;vm.runInNewContext(fs.readFileSync(SRC,'utf8'),win);return {win,calls};}
function glbInfo(file){const b=fs.readFileSync(file);assert.strictEqual(b.readUInt32LE(0),0x46546c67,file+' 는 GLB 가 아님');const len=b.readUInt32LE(12);const j=JSON.parse(b.slice(20,20+len).toString('utf8'));
 return {anims:(j.animations||[]).map(a=>a.name).sort(),skins:(j.skins||[]).length,size:b.length};}
let n=0;const ok=m=>{n++;console.log('ok',m);};
const {win,calls}=boot();const api=win.__STORYWORLD_MOB3D_HQ_R1339__;assert(api,'API 없음');assert.strictEqual(api.on(),true,'기본 켜짐이어야 함');
const map=api.map();const keys=Object.keys(map);assert(keys.length>=1,'바꿔치기 표가 비었음');ok('표 '+keys.length+'종');
const [oldp,newp]=[keys[0],map[keys[0]]];
win.fetch(oldp);win.fetch('./'+oldp);win.fetch('https://x.test/m0/'+oldp);win.fetch(new win.Request('https://x.test/m0/'+oldp));win.fetch('assets/other/a.glb');win.fetch(oldp+'.bak');
assert.deepStrictEqual(calls.slice(0,4).map(u=>u.endsWith(newp)),[true,true,true,true],'옛 경로가 새 경로로 안 바뀜: '+calls.slice(0,4));
assert.strictEqual(calls[4],'assets/other/a.glb');assert.strictEqual(calls[5],oldp+'.bak');ok('켜짐 바꿔치기·경계(다른 파일·접미어) 통과');
for(const [st,se] of [[{'storyworld.r1339.hq':'off'},''],[{},'?hq39=0']]){const b=boot(st,se);b.win.fetch(oldp);assert.strictEqual(b.calls[0],oldp,'꺼짐인데 바뀜');}
const b2=boot({'storyworld.r1339.hq':'off'},'?hq39=1');b2.win.fetch(oldp);assert(b2.calls[0].endsWith(newp),'주소 ?hq39=1 이 우선해야 함');ok('끄기·주소 우선 통과');
for(const k of keys){const of=path.join(RT,k),nf=path.join(RT,map[k]);assert(fs.existsSync(of),'옛 파일 사라짐(원본 보존 위반): '+k);assert(fs.existsSync(nf),'새 파일 없음: '+map[k]);
 const a=glbInfo(of),b=glbInfo(nf);assert.deepStrictEqual(b.anims,a.anims,k+' 클립 이름 다름 '+b.anims+' / '+a.anims);assert(b.skins>=1,map[k]+' 스킨 없음');assert(b.size<=3e6,map[k]+' 3MB 초과 '+b.size);}
ok('새 GLB '+keys.length+'종: 파일·클립·스킨·크기 통과');
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');const F='mob-3d-hq-r1339.js';assert.strictEqual(html.split('<script src="./'+F+'"></script>').length,2,'index.html 태그 1개');
['mob-3d-r1312.js','mob-3d-r1315.js','mob-3d-r1316.js','mob-3d-r1317.js','mob-3d-r1322.js','mob-3d-r1322c.js'].forEach(o=>{const j=html.indexOf('"./'+o+'"');if(j>=0)assert(html.indexOf('"./'+F+'"')<j,'태그 자리: '+o+' 앞이어야 함');});
assert(fs.existsSync(path.join(RT,F)),'runtime-text 에 '+F+' 없음(sync 안 됨)');ok('index.html 태그·자리·sync 통과');
console.log('R1339 hq-cpu-check PASS',n);
