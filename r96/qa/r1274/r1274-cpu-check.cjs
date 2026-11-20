// R1274 CPU 검사 — 서윤(붉은 하이힐, b05-boss) '붉은 조명' 스포트라이트 스킬 — seoyun-spotlight-r1274.js
//  사용자 2026-11-20 08:08Z "서윤 스킬 스포트라이트 쓰도록 자신에게 기본적으로 비추고 자신에게 비출때는 이로운버프 영웅에게 비출때는 디버프 밸런스맞게"
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='seoyun-spotlight-r1274.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
const srcPath=path.join(R,'client-source',F);ok(fs.existsSync(srcPath),'오버레이 파일 있음');
const src=fs.readFileSync(srcPath,'utf8');
ok(fs.existsSync(path.join(R,'runtime-text',F))&&src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
// ---- 빌드 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok(/\n<script src="\.\/sin-skills-r1263\.js"><\/script>\n<script src="\.\/seoyun-spotlight-r1274\.js"><\/script>\n<script src="\.\/synth-sfx-r1212\.js"><\/script>\n/.test(html),'index.html: 자기 줄, sin-skills-r1263 바로 뒤·synth-sfx-r1212 앞');
ok((html.match(/seoyun-spotlight-r1274\.js/g)||[]).length===1,'index.html 에 한 번만');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1274/r1274-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('/'+F+'"')||man.includes('"'+F+'"'),'runtime-manifest 에 들어감');
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1274/index.json'),'utf8'));
for(const k of ['spot-self24','spot-hero24']){const a='assets/r1274/'+k+'.webp';ok(src.includes(a)&&fs.existsSync(path.join(R,'runtime-text',a))&&man.includes(a),'프레임 시트 있음·manifest: '+a);
 ok(idx[k]&&idx[k].frames===24&&idx[k].final===false&&/michaela-grand-pillar/.test(idx[k].source),'시트 표: '+k+' 24칸·원천·임시 표시',idx[k]);
 ok(idx[k].cell[0]*idx[k].cols<=4096,'4096 한도: '+k);}
for(const a of ['assets/r100/sig-aura-red.webp','assets/r843/aura-loop8.webp'])ok(src.includes(a)&&fs.existsSync(path.join(R,'runtime-text',a)),'재사용 시트 있음: '+a);
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 에 drop-shadow·blur 안 씀');
// ---- 샌드박스 ----
const SHAPES=['arc','ellipse','fillRect','strokeRect','lineTo','stroke','fill','rect','quadraticCurveTo','bezierCurveTo'];
function sandbox(o={}){
 const calls={hurt:[],imgs:[],shapes:0,perFrame:[],floats:[]};
 const ctx=new Proxy({},{get:(ob,k)=>k in ob?ob[k]:(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k)?((...a)=>{if(SHAPES.includes(k))calls.shapes++;if(k==='drawImage')calls.imgs.push(a[0]&&a[0].src);}):undefined),set:(ob,k,v)=>{ob[k]=v;return true;}});
 calls.scopes=[];ctx.scope=(q,fn)=>{calls.scopes.push(q);fn();};
 const player={x:10,y:10,hp:1000,invincible:0};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{id:'ep1b05',enemies:[]},effects:[],W:960,H:540,TILE:34,zoom:.667,
  project:(x,y)=>({x:(x-y)*22+480,y:(x+y)*11+270}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:1536,height:1024,naturalWidth:1536,naturalHeight:1024}}),
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>39||y+r>39,hurt:(d,s)=>{calls.hurt.push(d);return 'hit';},floatText:(t,x,y,c)=>calls.floats.push(t),
  drawEffect(){},tick(dt){},settings:{},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 if(o.urlFor)sb.urlFor=(p)=>p;
 if(o.r1263)sb.window.__STORYWORLD_SIN_SKILLS_R1263__=o.r1263;
 sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__};}
const seoyun=(o={})=>({id:'B5',nativeId:'b05-boss',name:'붉은 하이힐의 서윤',boss:true,hp:10000,maxHp:10000,damage:20,spawnState:'active',x:14,y:12,radius:.6,...o});
const run=(S,secs,dt=1/30,each)=>{for(let i=0;i<Math.round(secs/dt);i++){S.sb.time+=dt;S.sb.tick(dt);const m=S.sb.effects.find(x=>x&&x.type==='r1274-fx');if(m){const i0=S.calls.imgs.length;S.sb.drawEffect(m);S.calls.perFrame.push(S.calls.imgs.length-i0);}if(each)each(S,i);}};
const T=S=>S.A.tune;
// API·수치 범위(밸런스 가드)
{const S=sandbox(),A=S.A;ok(!!A&&typeof A.inspect==='function'&&typeof A.cast==='function','API window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__');
 const U=A.tune;ok(U.pattern.join(',')==='self,self,hero','기본은 자신: 순서 자신·자신·영웅(자신 2/3)',U.pattern);
 ok(U.cd>=14&&U.cd<=20,'재사용 14~20초',U.cd);ok(U.first>=5,'교전 뒤 첫 시전 5초 이상',U.first);
 ok(U.buff.dur<=6&&U.buff.taken>=.7&&U.buff.taken<1&&U.buff.dealt>1&&U.buff.dealt<=1.2,'자기 버프: 6초 이하, 받는 피해 0.7~1 배, 주는 피해 1~1.2 배',U.buff);
 ok(U.debuff.dur<=5&&U.debuff.taken>1&&U.debuff.taken<=1.25&&U.debuff.slow<=1.5,'영웅 디버프: 5초 이하, 받는 피해 1~1.25 배, 둔화 1.5초 이하',U.debuff);
 ok(U.lock>=.25&&U.land-U.lock>=.4,'영웅 조명: 따라오다 멈춘 뒤 0.4초 이상 피할 틈',{lock:U.lock,land:U.land});
 ok(A.which(seoyun())==='seoyun'&&A.which({nativeId:'b04-boss',name:'베엘제붑'})===null&&A.which({nativeId:'b05-boss',r61Clone:true})===null&&A.which(null)===null,'서윤(b05-boss)만 알아봄');}
// 다른 보스·멀리·끄기·서사 장면·공격 중·R1263 시전 중엔 안 씀
{const S=sandbox(),A=S.A;S.sb.room.enemies.push({id:'B4',nativeId:'b04-boss',name:'베엘제붑',boss:true,hp:900,maxHp:900,damage:20,spawnState:'active',x:14,y:12});run(S,30);ok(A.inspect().casts===0,'다른 보스는 안 씀');}
{const S=sandbox(),A=S.A;S.sb.room.enemies.push(seoyun({x:35,y:35}));S.player.x=3;S.player.y=3;run(S,30);ok(A.inspect().casts===0,'멀면(13칸 밖) 안 씀');}
{const S=sandbox(),A=S.A;S.sb.room.enemies.push(seoyun());A.set({on:false});run(S,30);ok(A.inspect().casts===0&&S.sb.hurt(10,{})!==undefined&&S.calls.hurt[0]===10,'끄면 안 쓰고 피해 그대로');}
{const S=sandbox(),A=S.A;S.sb.room.enemies.push(seoyun());S.sb.storyScene={};run(S,30);ok(A.inspect().casts===0,'서사 장면 중엔 멈춤');}
{const S=sandbox(),A=S.A,b=seoyun({attack:{}});S.sb.room.enemies.push(b);run(S,T(S).first+2);ok(A.inspect().casts===0,'근접 공격 중엔 시작 안 함');delete b.attack;run(S,.5);ok(A.inspect().casts===1,'공격 끝나면 시작');}
{let casting=true;const S=sandbox({r1263:{inspect:()=>({casting})}}),A=S.A;S.sb.room.enemies.push(seoyun());run(S,T(S).first+2);ok(A.inspect().casts===0,'R1263 매혹의 빛 시전 중엔 겹치지 않음');casting=false;run(S,.5);ok(A.inspect().casts===1,'R1263 끝나면 시작');}
// 순서: 첫 시전 = 자신, 둘째 = 자신, 셋째 = 영웅
{const S=sandbox(),A=S.A,b=seoyun();S.sb.room.enemies.push(b);const seq=[];let last=0;
 run(S,T(S).first+T(S).cd*2+3,1/30,()=>{const i=A.inspect();if(i.casts>last){last=i.casts;seq.push(i.target);}});
 ok(seq.join(',')==='self,self,hero','시전 순서 자신→자신→영웅',seq);
 const c=S.calls.imgs.map(p=>String(p));ok(c.some(p=>/spot-self24/.test(p))&&c.some(p=>/spot-hero24/.test(p))&&c.some(p=>/sig-aura-red/.test(p))&&c.some(p=>/aura-loop8/.test(p)),'조명 시트 둘·버프/디버프 기운 시트 모두 그림');
 ok(S.calls.shapes===0,'코드 도형 0 — 프레임 시트만',S.calls.shapes);
 ok(S.calls.scopes.length>0&&S.calls.scopes.every(q=>q.kind==='effect'&&q.groundAligned===false&&q.enemy===true&&q.ownerType==='enemy'),'바닥 예고 장판 없음(세워 그림)·적 이펙트 표시');
 ok(Math.max(...S.calls.perFrame)<=8,'한 화면 그림 호출 ≤ 8',Math.max(...S.calls.perFrame));
 ok(S.calls.floats.includes('주연의 조명')&&S.calls.floats.includes('무대 위의 노출'),'버프·디버프 글자 표시',S.calls.floats);}
// 자기 버프: 받는 피해 줄임(모든 피해 경로 — hp 감소분 일부 되돌림), 주는 피해 늘림, 시간 지나면 끝
{const S=sandbox(),A=S.A,b=seoyun();S.sb.room.enemies.push(b);const U=T(S);
 run(S,U.first-.5);b.hp-=100;run(S,.1);ok(near(b.hp,9900,1e-6),'버프 전: 피해 그대로',b.hp);
 run(S,.4+U.land+.1);ok(A.inspect().buff>0,'자기 조명 내려오면 버프 걸림',A.inspect());
 const h0=b.hp;b.hp-=200;run(S,1/30);ok(near(b.hp,h0-200*U.buff.taken,1e-6),'버프 중: 받는 피해 ×'+U.buff.taken,{h0,hp:b.hp});
 S.calls.hurt.length=0;S.sb.hurt(10,b);S.sb.hurt(10,{owner:b.id});S.sb.hurt(10,{ownerId:b.id});S.sb.hurt(10,{owner:'mob7'});
 ok(near(S.calls.hurt[0],10*U.buff.dealt)&&near(S.calls.hurt[1],10*U.buff.dealt)&&near(S.calls.hurt[2],10*U.buff.dealt)&&S.calls.hurt[3]===10,'버프 중: 서윤이 주는 피해만 ×'+U.buff.dealt,S.calls.hurt);
}
{const S=sandbox(),A=S.A,b=seoyun({hp:50});S.sb.room.enemies.push(b);A.cast('self');run(S,A.tune.land+.1);ok(A.inspect().buff>0,'체력 50 서윤도 버프');b.hp-=80;run(S,1/30);ok(b.hp<=0,'치명타는 되돌리지 않음(죽으면 죽음)',b.hp);}
{const S=sandbox(),A=S.A,b=seoyun();S.sb.room.enemies.push(b);const U=T(S);run(S,U.first+U.land+U.buff.dur+.3);ok(A.inspect().buff===0,'버프는 '+U.buff.dur+'초 뒤 끝',A.inspect());
 const h0=b.hp;b.hp-=100;run(S,1/30);ok(near(b.hp,h0-100),'버프 끝나면 피해 그대로');S.calls.hurt.length=0;S.sb.hurt(10,b);ok(S.calls.hurt[0]===10,'버프 끝나면 주는 피해 그대로');}
// 영웅 조명: 가만히 있으면 디버프(받는 피해 ↑, 둔화), 피하면 안 걸림, 무적이면 안 걸림
const heroCast=(S,b)=>{S.sb.room.enemies.push(b);run(S,.1);S.A.cast('hero');};
{const S=sandbox(),A=S.A,b=seoyun(),U=T({A:S.A});heroCast(S,b);run(S,U.land+.1);const i=A.inspect();
 ok(i.debuff>0,'영웅 조명: 서 있으면 디버프',i);ok(S.player.heroSlowUntil150>S.sb.time&&S.player.heroSlowUntil150<=S.sb.time+U.debuff.slow+1e-6,'디버프: 엔진 둔화 '+U.debuff.slow+'초',S.player.heroSlowUntil150-S.sb.time);
 S.calls.hurt.length=0;S.sb.hurt(10,{owner:'mob7'});ok(near(S.calls.hurt[0],10*U.debuff.taken),'디버프: 모든 피해 ×'+U.debuff.taken,S.calls.hurt);
 ok(A.inspect().buff===0,'영웅에게 비추면 서윤 버프는 없음');
 run(S,U.debuff.dur);S.calls.hurt.length=0;S.sb.hurt(10,{});ok(A.inspect().debuff===0&&S.calls.hurt[0]===10,'디버프 '+U.debuff.dur+'초 뒤 끝');}
{const S=sandbox(),A=S.A,b=seoyun(),U=S.A.tune;heroCast(S,b);run(S,U.lock+.05);S.player.x+=2.5;run(S,U.land);ok(A.inspect().debuff===0&&A.inspect().dodged===1,'조명이 멈춘 뒤 비켜서면 안 걸림',A.inspect());}
{const S=sandbox(),A=S.A,b=seoyun(),U=S.A.tune;heroCast(S,b);run(S,U.lock*.4);S.player.x+=1.5;run(S,U.land);ok(A.inspect().debuff>0,'조명은 멈추기 전엔 영웅을 따라옴',A.inspect());}
{const S=sandbox(),A=S.A,b=seoyun(),U=S.A.tune;heroCast(S,b);S.player.invincible=5;run(S,U.land+.1);ok(A.inspect().debuff===0,'무적(회피·피격 보호) 중엔 안 걸림');}
// 버프·디버프 겹침 = 곱
{const S=sandbox(),A=S.A,b=seoyun(),U=S.A.tune;heroCast(S,b);run(S,U.land+.1);A.cast('self');run(S,U.land+.1);S.calls.hurt.length=0;S.sb.hurt(10,b);ok(near(S.calls.hurt[0],10*U.debuff.taken*U.buff.dealt),'겹치면 곱(서윤 주는 피해 × 영웅 받는 피해)',S.calls.hurt);}
// 보스 죽음·방 바뀜·시간 되감기 → 남은 버프/디버프 없음
{const S=sandbox(),A=S.A,b=seoyun(),U=S.A.tune;S.sb.room.enemies.push(b);A.cast('self');run(S,U.land+.1);b.hp=0;run(S,.1);ok(A.inspect().buff===0&&!A.inspect().casting,'서윤 죽으면 버프 끝');}
{const S=sandbox(),A=S.A,b=seoyun(),U=S.A.tune;heroCast(S,b);run(S,U.land+.1);S.sb.room={id:'ep1b06',enemies:[]};run(S,.1);S.calls.hurt.length=0;S.sb.hurt(10,{});ok(A.inspect().debuff===0&&S.calls.hurt[0]===10,'방 바뀌면 디버프 끝');}
{const S=sandbox(),A=S.A,b=seoyun(),U=S.A.tune;S.sb.room.enemies.push(b);A.cast('self');run(S,U.land+.1);S.sb.time-=5;run(S,.1);ok(A.inspect().buff===0&&!A.inspect().casting&&A.inspect().next<=S.sb.time+U.cd+1e-6,'시간 되감기: 옛 버프·예약 없음',A.inspect());}
// 밸런스 요약(보고용)
{const U=sandbox().A.tune,up=U.buff.dur*2/(U.cd*3);const ehp=1/(1-up*(1-U.buff.taken)),dps=1+up*(U.buff.dealt-1);
 console.log('BALANCE',JSON.stringify({selfUptime:+up.toFixed(3),bossEHP:+ehp.toFixed(3),bossDPS:+dps.toFixed(3)}));ok(ehp<1.1&&dps<1.06,'평균 효과 상한: 서윤 유효체력 +10% 미만·주는 피해 +6% 미만',{ehp,dps});}

// ---- 서윤 공격(꽃잎 뿌리기) 그림 좌우반전 — 사용자 08:14Z "서윤공격시 뿌리는 모션 지금과 반대로 나와야해 뿌리는쪽에 영웅이 있어야지" / "좌우반전하면됨" ----
{const ATK='assets/generated-v31224/actors-normalized/53c9ce212489_lust-human-attack.webp',MIR='assets/r1274/lust-human-attack-mirror.webp';
 ok(fs.existsSync(path.join(R,'runtime-text',MIR))&&man.includes(MIR),'좌우반전 공격 그림 있음·manifest');
 ok(idx['lust-human-attack-mirror']&&/r700\/clean/.test(idx['lust-human-attack-mirror'].source)&&/mirror|좌우/.test(idx['lust-human-attack-mirror'].source),'표: 원천 = R700 정리본, 좌우반전',idx['lust-human-attack-mirror']);
 const mk=()=>{const S=sandbox({urlFor:true});return S;};
 {const S=mk(),u=S.sb.urlFor;ok(u(ATK)===MIR,'공격 그림 주소 → 좌우반전본',u(ATK));ok(u('./'+ATK)===MIR&&u('assets/r99/clean/'+ATK)===MIR&&u('assets/r425/clean/'+ATK)===MIR&&u('assets/r700/clean/'+ATK)===MIR,'사본 접두사가 붙어도 알아봄');
  ok(u('assets/generated-v31224/actors-normalized/6861c5126992_ep1b05_lust_seoyun_puppet_phase0.webp')==='assets/generated-v31224/actors-normalized/6861c5126992_ep1b05_lust_seoyun_puppet_phase0.webp','대기 그림·다른 그림은 그대로');
  ok(u('assets/generated-v31224/actors-normalized/9f845f4d58bf_envy-human-attack.webp')==='assets/generated-v31224/actors-normalized/9f845f4d58bf_envy-human-attack.webp','다른 보스 공격 그림 그대로');
  S.A.set({mirror:false});ok(u(ATK)===ATK,'끄기 {"mirror":false} 면 원래대로');}}
console.log('R1274 CPU 검사 '+n+'개 통과');
