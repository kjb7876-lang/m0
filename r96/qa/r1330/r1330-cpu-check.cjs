// R1330 Dots SW-3D-SIN7 v1 7대죄 3D 20종(사용자 11-26 "일단 7대죄는 다 3d로해줘") — 정적 회귀.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-3d-r1330.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src&&!!rt&&src.equals(rt),'오버레이 원본·runtime-text 사본 같음');
// Dots 원본 GLB 바이트 그대로(SHA-256 = 드라이브 SW-3D-SIN7_v1_클로드_먼저읽기).
const GLB={
 'assets/r1330/sw-sin7-01-sloth-shell-sentinel.glb':'bad1d628d9559fca91178329d953ff4c0faec5f655622d59dcb3f3ecf55c18dd',
 'assets/r1330/sw-sin7-02-long-serpent-shadow.glb':'27e6bc9113b3bf71a95625a1f1122a3238dfa1cfe75977de94567e26bb8e8d05',
 'assets/r1330/sw-sin7-03-lamenting-woman.glb':'4e713ea8cfc7f35a12dc76a0dcbe5c70e2836ef03ab425e36d1a3b9040fe287a',
 'assets/r1330/sw-sin7-04-cracked-comparison-echo.glb':'474c9d8a6f58eaf20a783ffefaa7108995edae25551ff7049f3115c936fcbfc6',
 'assets/r1330/sw-sin7-05-living-giant-stomach.glb':'fbff85a7482bc955bdf169cd585017d81c0cbba183548ec17b2106e48051a10a',
 'assets/r1330/sw-sin7-06-black-digestive-fluid.glb':'8ac9a41db6e152e4000b49d475fe04079933fdc04ea0c05d08e56a786bd4e730',
 'assets/r1330/sw-sin7-07-discarded-kitchen-overseer.glb':'54d2d56e946f4ead6b63a42298e67206c831911b016a2d68c5b6dc17ac5e005d',
 'assets/r1330/sw-sin7-08-lipstickbullet.glb':'9312b806930b3eeee96abd8d076c3bbfde3fd96825ba8284e744828e1865c270',
 'assets/r1330/sw-sin7-09-heartlight-stage-director.glb':'4b7fc463089aa09aca9fc9adcd738835f0221d00d54d629732ae0ff318539a89',
 'assets/r1330/sw-sin7-10-bladebanknote.glb':'4eb17ed09773b4d31668d014d8a97ef5f19e58d5277314eaef8831b845eee6d9',
 'assets/r1330/sw-sin7-11-taxidermiedfoxdemon.glb':'4177be80d8a31f5826cc9b52cc01e8704be73aecffb1c1c39b977001aa1cd6ef',
 'assets/r1330/sw-sin7-12-everysideisthebackcoin.glb':'d225c2f570a6b7462e5494e1730e7d2692298ecf5dc62cc7d3373685271174c4',
 'assets/r1330/sw-sin7-13-vault-ledger-watcher.glb':'4acf594d04d4a2c04c35a00055a27176e71c899f268bce9f6138f551319495e8',
 'assets/r1330/sw-sin7-14-mammon.glb':'51b6f8ca0ceb39595d87401c25ebae6be6e6452642f53f90adf4cfda16d51bd0',
 'assets/r1330/sw-sin7-15-fire-wolf.glb':'8116cdc033b138b099492dc182d0c814b5cfc4bc8204f730e0bb146cde380c73',
 'assets/r1330/sw-sin7-16-fire-dragon.glb':'a5a2fe3b303388aa547dcf8354650a6ef0bf48a715695e98abbb451557c1d0fb',
 'assets/r1330/sw-sin7-17-hotel-flame-knight.glb':'f8c3be156910ef8c8c4e72a9b2a60006f956c90415ba68f7e9e22a87114f5db0',
 'assets/r1330/sw-sin7-18-cursed-spear.glb':'2bbd0574e826d1a496a7d747139bceb7b33600057c029af592cd6085f2bf2e05',
 'assets/r1330/sw-sin7-19-occult-experiment.glb':'42d344218aab4cf21be86722fcd48ebb9a4c4c95a8c03247cc7d4b7cb4d2efe7',
 'assets/r1330/sw-sin7-20-necromancer-corpse-bodyguard.glb':'8557a8fde0679892b6a02617a03c5c7e4ceab05ce291d62987b9ec40f6a0feac'};
let total=0;
for(const [p,h] of Object.entries(GLB)){const b=rd('runtime-text/'+p);
 ok(b&&crypto.createHash('sha256').update(b).digest('hex')===h,p+' = Dots 원본 바이트');if(!b)continue;total+=b.length;
 const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name);
 ok(['idle','walk','attack','hit','death'].every(n=>names.includes(n)),p+' 클립 idle·walk·attack·hit·death');
 ok((j.extensionsRequired||[]).every(x=>['EXT_meshopt_compression','KHR_mesh_quantization','EXT_texture_webp','KHR_texture_transform'].includes(x)),p+' 필수 확장은 로더가 아는 것만');
 ok((j.skins||[]).length>=1,p+' 스킨 있음');ok(s.includes("'"+p+"'"),'오버레이가 '+p+' 를 씀');}
ok(Object.keys(GLB).length===20,'20종');ok(total<=16000000,'GLB 합계 16MB 이하('+total+')');
for(const n of ['나태의 껍데기 파수','긴 뱀의 그림자','추녀의 한탄','금이 간 비교잔영','살아 있는 거대한 위장','끓어오르는 검은 소화액','폐기주방 감독','공중을 가르는 립스틱 탄환','심장빛 무대감독','칼날이 된 지폐','박제된 여우의 악마','모든 면이 뒷면인 동전','금고 장부감시자','불길 속의 늑대','불길 속의 용','호텔 화염기사','흑마법사의 저주창','육망성의 흑마술 실험체','흑마법사의 시체경호체'])
 ok(s.includes("/(?!)/,'"+n+"']"),n+' (일반 몹·수호, 보스 표시 없음)');
ok(s.includes("/(?!)/,'회장에게 고용된 총지배인 · 맘몬',true]"),'맘몬만 보스 표시');
ok(/KINDS\.mammon\.deny=\/greed\[_-\]demon/.test(s)&&/if\(KINDS\[kid\]\.deny&&b\.rows\.some\(/.test(s),'맘몬은 인간형 0페이즈만(악마형·후속 형태 2D 그대로)');
ok(!/나태에 잠식된 남자|레비아탄|분노의 귀|베엘제붑|붉은 하이힐의 서윤|호텔 그룹 회장/.test(s.replace(/\/\/.*$/mg,'')),'본보스·기존 3D(나태·질투·분노·베엘제붑·서윤·회장)는 이 묶음 밖');
ok(/const SIZE=\{/.test(s)&&(s.match(/const SIZE=\{[\s\S]*?\};/)[0].match(/\w+:\//g)||[]).length>=18&&/const re=k\.size\|\|k\.test;/.test(s),'크기 재기용 2D 경로 표(18종 이상, 3D 가 2D 키에 맞게)');
ok(/kindOfPath=p=>\{[^\n]*KINDS\[id\]\.test\.test\(s\)/.test(s)&&!/kindOfPath=p=>\{[^\n]*\.size/.test(s),'크기 경로는 종류 판정에 안 씀(같은 그림 쓰는 다른 몹은 2D 그대로)');
ok(/pick\(\/\^idle\$\/i\)/.test(s)&&/pick\(\/\^death\$\/i\)/.test(s),'소문자 클립 이름');
ok(/const active=\(\)=>\(window\.__STORYWORLD_MOB3D_ZONE_R1326__\?\.pick\?\.\(on\)\?\?on\)&&/.test(s),'R1326 7대죄 규칙(pick)을 따름');
ok(/NO3D=new Set\(\['last302','last303'\]\)/.test(s),'불면귀 마을 2D');
ok(/r1055Skip=true/.test(s)&&/userData\.r451=true/.test(s)&&/function atkYaw/.test(s),'R1323 수묵·국소광 제외, 공격 방향');
ok(/__STORYWORLD_MOB3D_STYLE_R1325__\?\.hold\?\.\(i,t\)/.test(s)&&/__STORYWORLD_MOB3D_STYLE_R1325__\?\.sample\?\.\(i,b\.rows\)/.test(s),'R1325 색 맞춤·고르기 훅');
ok(/GROUP30=\/\^r1330-mob3d:\//.test(String(rd('client-source/mob-3d-style-r1325.js'))),'R1325 색 맞춤 대상에 r1330 포함');
ok(/storyworld\.r1330\.sin7/.test(s)&&/sin7mob30=/.test(s)&&/__STORYWORLD_MOB3D_R1330__/.test(s),'설정 키·주소·API');
const html=String(rd('runtime-text/index.html'));ok(html.split('<script src="./'+F+'"></script>').length===2,'index.html 태그 1개');
ok(html.indexOf('"./mob-3d-r1322c.js"')<html.indexOf('"./'+F+'"'),'태그 자리: mob-3d-r1322c 뒤');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));ok(man.files.some(v=>v.path===F)&&Object.keys(GLB).every(p=>man.files.some(v=>v.path===p)),'runtime-manifest(js·GLB 20)');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&ver.includes("'assets/r1330/'"),'공개 확인 목록');
ok(String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'))).includes('node r96/qa/r1330/r1330-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1330 FAIL '+fail:'R1330 ALL OK');process.exit(fail?1:0);
