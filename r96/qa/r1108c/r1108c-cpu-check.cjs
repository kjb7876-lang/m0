// R1108c 서하 좌우 걷기(E·W) Dots 새 시트 적용 — CPU 검사.  node r96/qa/r1108c/r1108c-cpu-check.cjs
//  서하 walk-e 그리기 명령만 assets/r1108c/seoha/walk-e.webp 로 바꾼다. 대각·위·아래·다른 영웅·그림 미준비·NaN·r1108 이 바꾼 대각 그림은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const F='hero-walk-r1108c.js',NEW='assets/r1108c/seoha/walk-e.webp',OLD='assets/r130/seoha/walk-e.webp';
const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
{const h=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok(h.split('"./'+F+'"').length===2&&h.indexOf(F)>h.indexOf('hero-consist-r1108.js'),'스크립트 태그 한 번, hero-consist-r1108 뒤');}
for(const k of ['runtime-inputs.json','runtime-manifest.json'])ok(fs.readFileSync(path.join(R,k),'utf8').includes(F),k+' 에 등록');
ok(fs.existsSync(path.join(R,'runtime-text',NEW)),'새 시트 파일 있음');
function load(pref,opt={}){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,String,isFinite,console,Date,Promise,setInterval:()=>0,
 readyImage:q=>opt.noImage?null:({image:{naturalWidth:1536,naturalHeight:256,src:q,tag:'NEW'}}),addImage(){},player:{hero:opt.hero||'seoha'},ctx:{commands:[]},drawHero:opt.base||function(){}};
 win.addEventListener=(t,f)=>{if(t==='load')win.__load=f;};vm.createContext(sb);vm.runInContext(src,sb);win.__load&&win.__load();return {api:win.__STORYWORLD_HERO_WALK_R1108C__,win,sb};}
const near=(a,b,e=1e-6)=>Math.abs(a-b)<e;
const cmd=(p,fr,mir,sr)=>{const k=.25,x0=400,y0=200,s=sr||[fr*192,0,192,256],w=s[2]*k*(mir?-1:1),h=s[3]*k;return {kind:'image',owner:{kind:'hero'},sourcePath:p,image:{tag:'OLD'},sourceRect:s,points:[[x0,y0],[x0+w,y0],[x0+w,y0+h],[x0,y0+h]]};};
const FOLD=102.2,FNEW=95.8;
for(const mir of [false,true])for(const fr of [0,3,7]){const o=load(null),c=cmd(OLD,fr,mir),k=.25,f=mir?-1:1,before=400+f*FOLD*k;
 ok(o.api.test.swap(c)===true&&c.sourcePath===NEW&&c.image.tag==='NEW','E'+(mir?'(W 반전)':'')+' 칸'+fr+' → 새 시트');
 ok(c.sourceRect[0]===fr*192&&c.sourceRect[2]===192&&c.sourceRect[3]===256,'같은 칸 번호·칸 전체');
 const P=c.points,after=P[0][0]+(P[1][0]-P[0][0])*FNEW/192;ok(near(after,before,1e-6)&&near(Math.abs(P[1][0]-P[0][0]),192*k)&&near(P[3][1]-P[0][1],256*k),'발 가운데 같은 자리·같은 배율',{before,after});
 ok((P[1][0]<P[0][0])===mir,'반전 유지');}
{const o=load(null),sr=[5*192+49,47,87,184],k=.24,c=cmd('http://x/m0/'+OLD,5,false,sr);c.points=[[300,150],[300+87*k,150],[300+87*k,150+184*k],[300,150+184*k]];
 const Y0=150-47*k,before=300+(102.2-49)*k;ok(o.api.test.swap(c)===true&&JSON.stringify(c.sourceRect)==='[960,0,192,256]','R119 상자 그림 → 칸 전체');
 ok(near(c.points[0][1],Y0)&&near(c.points[0][0]+(c.points[1][0]-c.points[0][0])*FNEW/192,before,1e-6),'상자 배율·발 자리 그대로');}
{const o=load(null);for(const p of ['assets/r130/seoha/walk-se.webp','assets/r130/seoha/walk-ne.webp','assets/r130/seoha/walk-s.webp','assets/r130/seoha/walk-n.webp','assets/r130/seoha/idle-e.webp','assets/r130/neon/walk-e.webp','assets/r143/attack/seoha/attack-e.webp',NEW]){const c=cmd(p,2,false),j=JSON.stringify(c);ok(o.api.test.swap(c)===false&&JSON.stringify(c)===j,'그대로: '+p);}}
{const o=load(null),c=cmd(OLD,1,false);c.r1108Side='se';const j=JSON.stringify(c);ok(o.api.test.swap(c)===false&&JSON.stringify(c)===j,'r1108 이 대각에서 바꾼 walk-e 는 그대로(대각 HOLD)');}
{const o=load(null,{noImage:true}),c=cmd(OLD,1,false),j=JSON.stringify(c);ok(o.api.test.swap(c)===false&&JSON.stringify(c)===j,'새 시트 준비 전이면 옛 그림 그대로');}
{const o=load(null),c=cmd(OLD,1,false);c.points[1][0]=NaN;const j=JSON.stringify(c);ok(o.api.test.swap(c)===false&&JSON.stringify(c)===j,'NaN 은 손대지 않음');}
{const mk=(hero,pref)=>{const c=cmd(OLD,3,true),o=load(pref,{hero});const sb={};let r;{const o2=(()=>{const win={};const sbx={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,String,isFinite,console,Date,Promise,setInterval:()=>0,readyImage:q=>({image:{naturalWidth:1536,naturalHeight:256,src:q,tag:'NEW'}}),addImage(){},player:{hero},ctx:{commands:[]}};sbx.drawHero=function(){sbx.ctx.commands.push(c);return 'R';};win.addEventListener=(t,f)=>{if(t==='load')win.__load=f;};vm.createContext(sbx);vm.runInContext(src,sbx);win.__load();return sbx;})();r=o2.drawHero();}return {c,r};};
 let x=mk('seoha',null);ok(x.r==='R'&&x.c.sourcePath===NEW,'감싼 drawHero: 서하만, 값 그대로');
 for(const [h,p] of [['neon',null],['seoha',{on:false}]]){x=mk(h,p);ok(x.c.sourcePath===OLD,'그대로: '+h+' '+JSON.stringify(p));}}
{const o=load(null);const s=JSON.stringify(o.api.inspect());ok(/presentationOnly":true/.test(s)&&/gameplayChanged":false/.test(s),'판정·세이브 안 바꿈 표시');}
console.log(JSON.stringify({passed:n}));
