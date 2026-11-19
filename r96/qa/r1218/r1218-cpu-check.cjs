// R1218 CPU 검사 — 보스·몹 '메아리 던지기'(R61 echo) 스킬이 지금 보이는 몸 그림 대신 옛 스토리 그림(rc140 아틀라스 등)을 띄우던 문제.
//  실측(헤드리스 sz115-RC-3 재판관 mb-ep1b03): 몸은 R380 reverse-m089 시트인데 echo 동안 drawEnemy 안에서 rc140 mb-ep1b03-atlas-v2 가 34프레임 그려짐.
//  고침(boss-echo-look-r1218.js): echo 행동이 잡히면 R462 가 기억한 '실제로 그린 몸 그림'(lookOf)으로 a.path·a.frame 을 바꾼다 → 잔상·날아가는 메아리 모두 같은 그림.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),F='boss-echo-look-r1218.js',SRC=path.join(R,'client-source',F);
const checks=[];const ok=(n,p,d)=>checks.push({n,p:!!p,d});
const code=fs.existsSync(SRC)?fs.readFileSync(SRC,'utf8'):'';
ok('오버레이 파일 있음',!!code);
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok('index.html 태그(R1206b 다음 줄)',/<script src="\.\/samong-props-r1206b\.js"><\/script>\n<script src="\.\/boss-echo-look-r1218\.js"><\/script>\n/.test(html));
ok('runtime-text 사본·runtime-inputs·공개 확인 목록',fs.existsSync(path.join(R,'runtime-text',F))&&fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===code&&fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes(F)&&fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes(F));
// ---- 동작 ----
const ATLAS='assets/rc140/story-cycle-motions/mb-ep1b03-atlas-v2.png',OWN='assets/r380/mobs/reverse-m089-v4-right.webp';
function mk(stored){const seen=[];const looks=new Map();const act=new Map();
 const sb={window:{},console,Math,JSON,Object,Array,Set,Map,WeakMap,WeakSet,Number,String,Date,localStorage:{getItem:()=>stored??null,setItem(){}},
  readyImage:p=>p?{image:{}}:null};sb.window=sb;
 sb.__STORYWORLD_FIELDS_R61__={activeAction:e=>act.get(e.id)||null};// 엔진 R61 이 echo 행동을 갖는다(R54 activeAction 은 다른 것)
 sb.__STORYWORLD_STORY_COMBAT_R54__={activeAction:()=>null};
 sb.__STORYWORLD_MOB_DEATH_R462__={lookOf:id=>{const l=looks.get(id);return l?{...l}:null;}};
 sb.drawEnemy=function(e){const a=act.get(e.id);seen.push(a?[a.kind,a.path,a.frame?.path||null]:['none']);return 'd';};
 vm.createContext(sb);if(code)vm.runInContext(code,sb);return {sb,seen,looks,act};}
const own={path:OWN,frame:{path:OWN,assetFrame:{sourceRect:[0,0,160,128],pivot:[80,120],visibleHeight:180}},flip:false,h:3};
{const {sb,seen,looks,act}=mk();const e={id:'b1',hp:10};looks.set('b1',own);
 ok('반환값 그대로',sb.drawEnemy(e)==='d');sb.drawEnemy(e);// 행동 없는 프레임: 몸 그림 기억
 const a={kind:'echo',path:ATLAS,frame:{path:ATLAS,assetFrame:{sourceRect:[0,0,10,10]}}};act.set('b1',a);looks.set('b1',{path:ATLAS,frame:a.frame,h:3});// echo 중엔 R462 도 아틀라스를 잡을 수 있다
 sb.drawEnemy(e);
 ok('echo: 행동 그림이 지금 몸 그림(R380)으로 바뀜(잔상·날아가는 메아리 같은 그림)',a.path===OWN&&a.frame?.assetFrame?.sourceRect?.[2]===160&&seen[seen.length-1][1]===OWN,seen);
 ok('echo 중 R462 가 아틀라스를 잡아도 행동 전 기억을 씀',a.path!==ATLAS);}
{const {sb,looks,act}=mk();const e={id:'b2',hp:10};looks.set('b2',own);sb.drawEnemy(e);const a={kind:'prop',path:'assets/r61/props/chair.webp',frame:null};act.set('b2',a);sb.drawEnemy(e);
 ok('회귀: 조형물 던지기(prop)는 그대로',a.path==='assets/r61/props/chair.webp');}
{const {sb,looks,act}=mk();const e={id:'b3',hp:10};looks.set('b3',{path:ATLAS,frame:{path:ATLAS,assetFrame:{sourceRect:[0,0,10,10]}},h:3});sb.drawEnemy(e);
 const a={kind:'echo',path:ATLAS,frame:{path:ATLAS}};act.set('b3',a);sb.drawEnemy(e);
 ok('회귀: 몸 그림이 원래 그 그림이면(덧씌우기 없음) 그대로',a.path===ATLAS);}
{const {sb,act}=mk();const e={id:'b4',hp:10};const a={kind:'echo',path:ATLAS,frame:{path:ATLAS}};act.set('b4',a);sb.drawEnemy(e);
 ok('경계: 기억한 몸 그림이 없으면 그대로',a.path===ATLAS);}
{const {sb,looks,act}=mk('{"on":false}');const e={id:'b5',hp:10};looks.set('b5',own);sb.drawEnemy(e);const a={kind:'echo',path:ATLAS,frame:{path:ATLAS}};act.set('b5',a);sb.drawEnemy(e);
 ok('끄기 storyworld.r1218.echoLook {"on":false}',a.path===ATLAS);}
{const {sb,act}=mk();const PUP='assets/r161/puppet/puppet-ego-walk-right-8.webp';const e={id:'b6',hp:10};
 const base=sb.drawEnemy;// R248·꼭두각시처럼 그리는 동안 e.r1206Look 을 남기는 바깥 덧씌우기(R462 가 매 프레임 비운 뒤 다시 채움)
 e.__own={path:PUP,frame:{assetFrame:{sourceRect:[0,0,96,128],pivot:[48,120],visibleHeight:120}},h:3};
 sb.__STORYWORLD_MOB_DEATH_R462__={lookOf:()=>({path:ATLAS,frame:{path:ATLAS},h:3})};
 const real=sb.__STORYWORLD_BOSS_ECHO_LOOK_R1218__;// 이미 감싼 drawEnemy 안쪽에 r1206Look 남기기를 끼우려면 새 판에서 다시 만든다
 const vm2=require('vm');const sb2={...sb,window:null};sb2.window=sb2;const acts=new Map();sb2.__STORYWORLD_FIELDS_R61__={activeAction:x=>acts.get(x.id)||null};sb2.__STORYWORLD_STORY_COMBAT_R54__={};
 sb2.__STORYWORLD_BOSS_ECHO_LOOK_R1218__=undefined;sb2.drawEnemy=function(x){x.r1206Look=null;x.r1206Look=x.__own;return 'd';};vm2.createContext(sb2);vm2.runInContext(code,sb2);
 sb2.drawEnemy(e);const a={kind:'echo',path:ATLAS,frame:{path:ATLAS}};acts.set('b6',a);sb2.drawEnemy(e);
 ok('R248·꼭두각시 몸(e.r1206Look)이 R462 기억보다 먼저(이번 프레임에 실제로 그린 그림)',a.path===PUP&&a.frame?.assetFrame?.sourceRect?.[2]===96,[a.path]);}
ok('가장 바깥에서 감싸도록 load 뒤 설치(R462·R248 이 남긴 값을 읽음)',/document\.readyState==='complete'\)install\(\);else window\.addEventListener\?\.\('load'/.test(code));
{const vm2=require('vm');const acts=new Map();const sb3={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Date,localStorage:{getItem:()=>null,setItem(){}},readyImage:p=>p?{image:{}}:null};sb3.window=sb3;
 sb3.__STORYWORLD_FIELDS_R61__={activeAction:x=>acts.get(x.id)||null};sb3.__STORYWORLD_MOB_DEATH_R462__={lookOf:()=>null};// 실측: 재판관은 R462 기억이 비어 있었다
 sb3.__STORYWORLD_STORY_COMBAT_R54__={frameFor:(x,f)=>acts.get(x.id)?f:{path:OWN,assetFrame:{sourceRect:[0,0,160,128],pivot:[80,120],visibleHeight:180}}};
 sb3.drawEnemy=function(){return 'd';};vm2.createContext(sb3);vm2.runInContext(code,sb3);const e={id:'b7',hp:10};sb3.drawEnemy(e);const a={kind:'echo',path:ATLAS,frame:{path:ATLAS}};acts.set('b7',a);sb3.drawEnemy(e);
 ok('R380 등 frameFor 사슬 덧씌우기 몸(R462 기억이 비어도)',a.path===OWN,[a.path]);}
const pass=checks.filter(c=>c.p).length;for(const c of checks)console.log((c.p?'PASS ':'FAIL ')+c.n+(c.p?'':' '+String(JSON.stringify(c.d)??'').slice(0,400)));
console.log(`R1218 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
