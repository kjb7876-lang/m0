// R1382 HF 보스 3D 7종 CPU 검사(사용자 2026-11-27 HF→Dots→Claude 개선 흐름, Dots SW-R1354B #12~18).
//  ① 새 오버레이 mob-3d-r1382.js: runtime-text 사본 같음, index.html 태그 1개(R1343 뒤), verify 목록, 표 3종(분노의 귀·나태 남자·루시퍼)·보스 표시.
//  ② 모습 맞추기: 분노의 귀·나태 남자는 FORM 그림(갑주 wrath_human·등짐 남자 phase0)일 때만 3D — 게임이 지금 그리는 청소부(b07-idle6)·왕좌 덩어리(sloth-burden-man) 경로에는 안 맞음.
//  ③ 루시퍼(ep1a11 천사의 가면, 2D 지역)는 기본 꺼짐, 7대죄 지역 규칙(R1326)은 ep1a11 을 3D 로 묶지 않음.
//  ④ 새 GLB 3종: 파일 SHA-256 고정, 스킨 1개 이상, 오버레이가 고르는 클립(idle·walk|float·attack·hit·death) 있음, 3MB 이하.
//  ⑤ 동작 중 늘어남: R1339 stretch-check 를 새 GLB 6종(R1382 3종 + R1339 hq6 3종)에 돌려 통과(slab ≤0.6·p99.9 ≤0.05·gap ≤0.02).
const fs=require('fs'),path=require('path'),assert=require('assert'),cp=require('child_process'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),RT=path.join(R,'runtime-text');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('ok',m);};
const F='mob-3d-r1382.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(fs.existsSync(path.join(RT,F))&&fs.readFileSync(path.join(RT,F),'utf8')===src,'runtime-text 사본 같음');
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok((html.match(/<script src="\.\/mob-3d-r1382\.js"><\/script>/g)||[]).length===1&&html.indexOf('"./mob-3d-r1382.js"')>html.indexOf('"./mob-3d-r1343.js"'),'index.html 태그 1개, R1343 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'mob-3d-r1382.js'"),'verify 목록');
for(const [k,name] of [['wrathEar','불을 지른 청소부 · 분노의 귀'],['slothMan','나태에 잠식된 남자'],['lucifer','루시퍼 · 가면 벗은 초천사']])ok(new RegExp(k+":\\['assets/r1382/[^']+\\.glb',/\\(\\?!\\)/,'"+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"',true\\]").test(src),'표 '+k+' '+name+' 보스');
const form=src.match(/const FORM=\{wrathEar:(\/[^\n]*?\/),slothMan:(\/[^\n]*?\/)\};/);ok(!!form,'FORM 표');
const toRe=s=>{const m=s.match(/^\/(.*)\/([a-z]*)$/);return new RegExp(m[1],m[2]);};const wre=toRe(form[1]),sre=toRe(form[2]);
ok(!wre.test('assets/r1147/bosses/b07-idle6.webp')&&!wre.test('assets/r104/bosses/b07-boss-p4.webp')&&wre.test('assets/generated-v31224/actors-normalized/aea8d7a3eb38_boss_wrath_human.webp'),'분노의 귀: 청소부 그림엔 3D 안 씀, 갑주 그림엔 씀');
ok(!sre.test('assets/r380/mobs/sloth-burden-man-v1.webp')&&!sre.test('assets/r1163/bosses/b02-idle6.webp')&&!sre.test('assets/generated-v31224/actors-normalized/62f51ebe2d08_boss_sloth_demon.webp')&&sre.test('assets/generated-v31224/actors-normalized/4d4341de35e5_ep1b02_sloth_man_phase0.webp'),'나태 남자: 왕좌 덩어리·악마엔 3D 안 씀, 0단계 남자엔 씀');
ok(/if\(KINDS\[kid\]\.form&&!ps\.some\(q=>KINDS\[kid\]\.form\.test\(q\)\)\)continue;/.test(src),'consume 이 FORM 으로 거름');
ok(/^let on=false;/m.test(src)&&/storyworld\.r1382\.boss3d/.test(src)&&/boss3d81/.test(src),'기본 꺼짐·설정 키·주소');
const zone=fs.readFileSync(path.join(R,'client-source','mob-3d-zone-r1326.js'),'utf8');ok(!/ep1a11/.test(zone),'R1326 3D 지역에 ep1a11 없음(루시퍼 기본 2D)');
const SHA={'assets/r1382/boss-ep1b07-wrath-ear.glb':'1fd17c7763fc5ffb37feba804baec52782170b5d06d0c755c06bb504243b555e','assets/r1382/boss-ep1b02-sloth-man.glb':'8e5df5b6e0c645de753364ced61dd6fc6576a1e6c0725e01585b5076d61109a2','assets/r1382/boss-ep1a11-lucifer.glb':'115b8f8df0cf2a11e4127ea98495f937a640dd268fa97c2913b99fd070be6f79'};
function glb(f){const b=fs.readFileSync(f);assert.strictEqual(b.readUInt32LE(0),0x46546c67);const j=JSON.parse(b.slice(20,20+b.readUInt32LE(12)).toString('utf8'));return {b,anims:(j.animations||[]).map(a=>a.name),skins:(j.skins||[]).length};}
for(const [p,h] of Object.entries(SHA)){const g=glb(path.join(RT,p));ok(crypto.createHash('sha256').update(g.b).digest('hex')===h,p+' SHA-256');ok(g.skins>=1&&g.b.length<=3e6,p+' 스킨·3MB 이하');
 for(const re of [/^idle$/i,/^(walk|float)$/i,/^attack/i,/^hit$/i,/^death$/i])ok(g.anims.some(a=>re.test(a)),p+' 클립 '+re);}
const files=[...Object.keys(SHA),'assets/r1339/boss-gluttony-demon-hq5.glb','assets/r1339/leviathan-hq5.glb','assets/r1339/boss-ep1a09-syringe-apparition-hq5.glb'].map(p=>path.join(RT,p));
const out=cp.execFileSync(process.execPath,[path.join(R,'qa','r1339','stretch-check.mjs'),...files],{encoding:'utf8'});process.stdout.write(out);
ok(!/FAIL/.test(out),'늘어남 검사 6종 통과');
console.log('R1382 cpu-check PASS',n);
