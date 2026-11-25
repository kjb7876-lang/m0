// R1313 3D 영웅 무기(미카엘라·헌터·기억사수·환도·EGO) + 슬레이어 왼손 보조 — 정적 회귀.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='hero-weapons-3d-r1313.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src&&src.equals(rt||Buffer.alloc(0)),'오버레이 원본 = runtime-text 사본');
for(const id of ['hwando','ego','michaela','hunter','gunner'])ok(new RegExp('\\n '+id+':\\{glb:DIR\\+').test(s),'무기 표: '+id);
ok(!/\n slayer:/.test(s),'슬레이어는 R1309 가 맡음(표에 없음)');
ok(/ego:\{[^\n]*joseon-hwando\.glb[^\n]*socket:'Weapon_Socket_R'/.test(s),'EGO = 환도 칼, 오른손 소켓');
ok(/michaela:[^\n]*orient:'up'/.test(s)&&/hunter:[^\n]*orient:'string'/.test(s)&&/gunner:[^\n]*orient:'forward'/.test(s),'방향 규칙: 하트 위·시위 몸 뒤 쪽·총구 앞');
ok(/scene\.onBeforeRender=function/.test(s)&&/prev\?\.apply\(this,a\)/.test(s)&&/LAYER=2/.test(s)&&/r1304-hanji-tone-v1/.test(s),'렌더 직전 훅·몸과 같은 레이어·한지 톤');
ok(!/hwando3d|localStorage|new T\.WebGLRenderer/.test(s),'별도 설정·렌더러 없음(3D 설정을 따름)');
const h3=String(rd('client-source/hwando-3d-r1302.js')||'');ok(/HELD=\{/.test(h3),'원래 무기 숨김(R1305 HELD)은 그대로');
const sb=String(rd('client-source/slayer-blade-3d-r1309.js')||'');ok(/ASSIST_MAX=\.45,ASSIST_TOL=\.006/.test(sb)&&/solve\(k\.ra,k\.rb,k\.rc,r\)/.test(sb)&&/mountQ0/.test(sb),'슬레이어: 못 닿으면 오른손을 당겨 두 손이 만남(칼 회전은 mount 로 지킴)');
const html=String(rd('runtime-text/index.html')||'');ok(html.split('<script src="./'+F+'"></script>').length===2&&html.indexOf('"./slayer-blade-3d-r1309.js"')<html.indexOf('"./'+F+'"'),'index.html 태그 1개, R1309 뒤');
const SHA={'joseon-hwando.glb':'e40aff16e38922e9415357f9c827d66be3ffc694e8ebcf6750c46eeb767bb336','hunter-oxblood-bow.glb':'6a0e75a2a8cb219b2f4c2a2f3c62741e7b1b580415cacb8b377c21c15137f8fa','memory-arc-rifle.glb':'9a585b2059518e12c43fa15c0e83d4ad4b5f88de11314fdf5b575f06b00768cc','michaela-heart-wand.glb':'1f811fa318d524aaa62279177e4f2b0ce9ade17cf42b938caa02b6eaefa388ba'};
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));
for(const [n,h] of Object.entries(SHA)){const b=rd('runtime-text/assets/r1313/'+n);ok(b&&crypto.createHash('sha256').update(b).digest('hex')===h,n+' = 드라이브 Armory 원본 바이트');
 if(b){const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());ok(!(j.extensionsRequired||[]).length,n+' 필수 확장 없음');}
 ok(paths.has('assets/r1313/'+n)&&ver.includes("'assets/r1313/"+n+"'"),n+' manifest·공개 확인 목록');}
ok(paths.has(F)&&ver.includes("'"+F+"'"),'스크립트 manifest·공개 확인 목록');
console.log(fail?'R1313 FAIL '+fail:'R1313 ALL OK');process.exit(fail?1:0);
