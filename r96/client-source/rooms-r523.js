// R523 방 꾸미기(본편 방 이름 지역) — 사용자 2026-11-10 02:55Z "병원맵 가구및조형물및사물 배치처럼 모든맵 배치 잘해서 실제 맵같게 해줘".
//  원인(헤드리스 전수 조사, main 9bce8ba, qa/r523/review.md): 방 이름이 붙은 본편 지역(R171 지도)은 방이 9×10~32×21칸인데 R449 가 방마다 뒤쪽 한 벽에 1~4점만 놓아
//   지역당 8~31점. 23×23칸 주사실에 가구 넉 점, 거실에 소파 한 점 — 벽과 바닥만 보여 방의 쓰임새가 읽히지 않았다. 그 가운데 일부는 정면 3/4 시점 그림이라 바닥 격자와 각도도 안 맞았다.
//  고침(그리기 전용 — 충돌·길찾기·몹·저장·문·목표·서사·room.props 그대로): 병원 본관 R521 의 방식을 방 이름이 있는 지역으로 넓힌다.
//   · 방 모양에서 화면에 보이는 뒤쪽 벽(북·서) 줄을 스스로 찾는다(바닥 칸과 벽 상자만 본다 — 문 틈·튀어나온 벽 덩어리는 줄을 끊는다).
//   · 방 이름 → 쓰임새 → 가구 묶음 줄: 가장 긴 벽에 그 방의 주된 가구(침대 줄·처치대·소파…), 다음 벽에 보조 가구(약장·수납), 안쪽 구석에 키 큰 장.
//   · 모든 가구는 등·머리를 벽에 붙인다(바닥 자리 ft 로 계산, R521 과 같은 식). 방 가운데(전투 공간)·문 틈·출입구·목표·상자·길잡이 길은 비운다.
//   · 각도 맞는 그림만(바닥 윤곽 기울기와 2:1 격자 차이 9.5° 안, 약장만 구석 전용 11.0°). 그림은 그려진 방향을 지키고, 두 방향 그림이 있으면 벽에 맞는 쪽을 쓴다.
//   · 맡은 방의 R449·R224 가구는 그리는 동안만 뺀다(자료는 그대로 — 끄면 예전 배치로 돌아간다). 보스 전투실·중앙 전투실·맘몬(ep1b06)·사몽·병원 본관(R521)은 손대지 않는다.
//  그리는 길: R521 과 같다 — draw() 동안만 room.props 뒤에 덧붙이고, 낮은 가구의 발밑 타원 끄기·밑동 맞춤 되돌리기·바닥 닿는 그림자는 R521 의 drawProp 감싸기(r521Ward 표시)를 그대로 탄다.
//  결정성: 난수 없음. 지도 자료만 보고 방마다 한 번 계획한다(몹·시간·R224 자리 안 봄). 같은 이름 방은 차례 번호로 묶음 순서만 돌린다.
//  끄기: localStorage['storyworld.r523.rooms']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_ROOMS_R523__)return;
const REV='R523-rooms-1',KEY='storyworld.r523.rooms';
const prefs={on:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={builds:0,rooms:0,placed:0,dropped:0,pushed:0,frames:0,shown:0,rested:0,reloads:0,errors:0};let lastError=null,dropLog=[],lastPlan=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const fin=Number.isFinite,SQ=Math.SQRT1_2,R2=Math.SQRT2,BACK=.5*SQ,RISE=Math.sqrt(3)/2,MW=20,MH=28;

// ---- 그림 ------------------------------------------------------------------------------------------
//  qa/r523/mkart.py 가 그림에서 잰 표(손으로 고치지 않는다). h = 그림 높이(px, zoom 전 — 영웅 키 66) · face = 그림이 등을 댄 벽('w' 서 / 'n' 북 / 's' 방향 없음)
//  ang 'iso' = 바닥 모서리가 2:1 격자와 맞는 가구(ft = 바닥 자리 [왼쪽·오른쪽·맨 아래 꼭짓점 가로 자리], 단위 = 화면 칸) · 'pole' = 기둥·더미처럼 방향이 없는 것(d = 벽에서 발까지)
//  r = 불투명한 부분의 사각형 [왼쪽, 오른쪽, 아래, 위](발 기준) · m = 그 안 20×28 알파 칸(16진수) · up = 그림 아래 여백(키에 대한 비) · pair = 다른 벽용으로 따로 그려진 짝
const ART=Object.freeze(/*ART*/{
 bed:{path:'assets/hospital-maze/bed.png',h:88,face:'w',ang:'iso',flat:true,up:0.018,ft:[-1.061,1.055,0.284],r:[-1.061,1.055,0,1.78],m:'0c0001c0003d8007fc00ff200ffb00ffc80ffe40fff20fffd0fffe07fff03fffb3ffff7ffff6ffff67fff63fff03fff007fe003fe003fc001f4000c4000c0000c0000c0000c0'},
 stretcher:{path:'assets/hospital-maze/stretcher.png',h:64,face:'n',ang:'iso',flat:true,up:0.011,ft:[-0.946,0.946,0.258],r:[-0.946,0.946,0,1.301],m:'02000118003cc007e200ff900ff840ffe607ff107ff883ffc01ffe01fff837ffc3fffc3afff6d7ff26bff237fe01bfe00dfc007f8003ec001cc0008c000c8000c0000c0000c0'},
 overbed:{path:'assets/r521/overbed-table.webp',h:48,face:'w',ang:'iso',flat:true,up:0.007,ft:[-0.411,0.533,0.15],r:[-0.533,0.533,0,0.985],m:'3c0007f000ffc00fff00fffc03fff00fffc03ffe00ffe003fc000f800038000180001c0001c01e1c03f1806dd81c0f83803c3001f3001f1001f00071000e0000c0000c0000c0'},
 medcab:{path:'assets/r521/medicine-cabinet.webp',h:86,face:'n',ang:'iso',flat:true,up:0.006,ft:[-0.489,0.495,0.224],r:[-0.495,0.495,0,1.766],m:'0f0003fe007ffc0ffff8ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcffff00ff8001f000030'},
 trolley:{path:'assets/r521/surgical-cart.webp',h:50,face:'n',ang:'iso',flat:true,up:0.006,ft:[-0.476,0.47,0.156],r:[-0.476,0.476,0,1.027],m:'0e0001a000730004f8005fe00fff00fffc07ffe65ffff47fff43fff47fff5ffff7fff9fffe1fffc1fffe1cfff9c7fff01fff00fff007ff001f3000e30006000060000e000040'},
 wheelchair:{path:'assets/hospital-maze/chair.png',h:52,face:'w',ang:'pole',up:0.01,d:0.9,r:[-0.459,0.459,0,1.062],m:'0180001c000040001c00c7c007fe001ff801ffc01fff01fff01ffe83fff87fff8ffff8ffff8ffff8ffff8fffbcffffcffefc7fe1c6763e37e1f3fe1f1ef3c00ff000fe000cc0'},
 monitor:{path:'assets/hospital-maze/monitor.png',h:60,face:'s',ang:'pole',up:0.01,d:0.55,r:[-0.278,0.278,0,1.222],m:'01e000ffc01fff01fff81fff83fff83fff83fff03dff03cff03cfc034f003cf803cf0018e0008e000de000de000760000e0000f0007ff07fffee0387e0187001800038000380'},
 iv:{path:'assets/hospital-maze/iv.png',h:74,face:'s',ang:'pole',up:0.013,d:0.5,r:[-0.303,0.303,0,1.499],m:'0060017f001866800630006fc006fc006fc006fc00ffc0067c00630006300063000620007100071000710006700060000600186301fff81ffb0ffffee0607e06030060000700'},
 stool:{path:'assets/hospital-maze/stool.png',h:32,face:'s',ang:'pole',up:0.016,d:1.5,r:[-0.256,0.258,0,0.645],m:'03fc00fff01fff81fff83fffc3fffc1fff81fff80ffe000f0000680007c0006c000600007000670007f040fffe0fffe7ffc7ffff7e0cfee0c1ce0c0e60c0e01e0e01e0e00c00'},
 lamp:{path:'assets/r521/exam-lamp.webp',h:74,face:'s',ang:'pole',up:0.006,d:0.6,r:[-0.604,0.608,0,1.52],m:'003000078000dc0019fc030fe060ff0e0ff0603f0401e04000040000e00004000040000400004000040000400004000278007f8007f8003fe0076300c2300c20000300002000'},
 crutches:{path:'assets/r521/crutches.webp',h:46,face:'s',ang:'pole',up:0.006,d:0.35,r:[-0.22,0.22,0,0.945],m:'780007ff003ffc030dff309ff2199c21b0c61b0861b187f6186ff10637f063cf026c603c6603c6c03c78078f0078f0078f0079e0031e0071e0061c00f1800f38000380003800'},
 curtain:{path:'assets/r523/curtain.webp',h:80,face:'w',ang:'pole',d:1.2,r:[-0.598,0.598,0,1.664],m:'20000380003c0003f0003fc003ff003ffc83fff83fff83fff83fff83fff83fff83fff83fff83fff83fff87fff8e3ff8c1ff8c07f8001f8000ff0003f0003f000300003000030'},
 chair145:{path:'assets/world-r80/r80-145.webp',h:56,face:'w',ang:'iso',flat:true,up:0.006,ft:[-0.358,0.388,-0.048],r:[-0.388,0.388,0,1.151],m:'00f8007f801ff803ffc07ffc0fffc0fffc0fff80ffc80fe080781c040fe043ff86fffe7ffff3ffff7ffff6fffb43fe140f0140c01408014080100c0100c0000c0000c0000c00'},
 table146:{path:'assets/world-r80/r80-146.webp',h:69,face:'n',ang:'iso',flat:true,up:0.008,ft:[-0.657,0.654,0.011],r:[-0.699,0.699,0,1.413],m:'00e0001f8003fc00fff01fff83fffefffffffffffffffffffffffffdfffbcfff3c3fc3c1f83c0702c0602c06024060240602c060200600006000060000600006000060000200'},
 sofa_sloth:{path:'assets/r523/sloth-sofa.webp',h:84,face:'n',ang:'iso',flat:true,ft:[-0.985,0.971,0.571],r:[-1.075,1.075,0,1.747],m:'0f0001f8001fc001fe001ff003ffc07fff0ffff8ffffeffffeffffeffffe7ffff7ffff7ffff7ffff7ffff7fffe7fffe1fffe03ffe01ffe00ffe003fe001f8000780001000010'},
 bed_sloth:{path:'assets/r523/sloth-bed.webp',h:89,face:'w',ang:'iso',flat:true,ft:[-1.042,1.042,0.368],r:[-1.049,1.049,0,1.851],m:'0100001000070001f0003f0003f000ff800ffc00fffc0fffe0fffe0ffff0ffff9ffffffffffffffffffffbffff1ffff0ffff03fff01fff00ffc00ff8001f0000e00004000040'},
 fridge_sloth:{path:'assets/r523/sloth-fridge.webp',h:97,face:'n',ang:'iso',flat:true,ft:[-0.579,0.579,-0.024],r:[-0.579,0.579,0,2.017],m:'01e0007fe03fff8ffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffe7ffff0fffe01e18'},
 tv_sloth:{path:'assets/r523/sloth-tv.webp',h:69,face:'n',ang:'iso',flat:true,ft:[-0.706,0.712,0.362],r:[-0.729,0.729,0,1.435],m:'038000fe001ff801ffc01ffe01ffe01fff01fff03fff03fff07ffe0fffe0ffffcffffefffffffffffffffffffffffff7ffff5ffff07fff01ffe007fe001f8000700003000010'},
 wardrobe_n:{path:'assets/r523/wardrobe-n.webp',h:104,face:'n',ang:'iso',flat:true,ft:[-0.473,0.49,0.182],pair:'wardrobe_w',r:[-0.49,0.49,0,2.163],m:'0f0007fe00fffc0ffff8ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7ffff7fffffffff7ffff0ffff01fff003f800060'},
 wardrobe_w:{path:'assets/r523/wardrobe-w.webp',h:98,face:'w',ang:'iso',flat:true,ft:[-0.474,0.49,-0.231],pair:'wardrobe_n',r:[-0.498,0.498,0,2.038],m:'001f001ffe1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc01fc000e000'},
 table_n:{path:'assets/r523/table-n.webp',h:60,face:'n',ang:'iso',flat:true,ft:[-0.724,0.724,0.29],pair:'table_w',r:[-0.742,0.742,0,1.248],m:'060000f0001f8003fc007fe00fff00fffc0fffe0ffff0ffff8dfffccffffc7fffc7fffc4fffc07ffc03ffc01fb00073000630006300063000630006200060000600006000060'},
 table_w:{path:'assets/r523/table-w.webp',h:60,face:'w',ang:'iso',flat:true,ft:[-0.785,0.792,-0.421],pair:'table_n',r:[-0.811,0.811,0,1.248],m:'00030000f8001f8007fc00ffe03ffe07fff1ffff3ffffffffffffffffffbffff3ffff3fff33ffe03df803de003cc003cc003cc000cc000cc0000c0000c0000c0000c0000c000'},
 suitcase_w:{path:'assets/r523/suitcase-w.webp',h:32,face:'w',ang:'iso',flat:true,ft:[-0.328,0.328,-0.236],pair:'suitcase_n',r:[-0.328,0.328,0,0.666],m:'0001c0033c00fff01fff03fff03fff0ffff3ffff7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffff8fffe0fff80ffe00ff8007e00038000'},
 suitcase_n:{path:'assets/r523/suitcase-n.webp',h:32,face:'n',ang:'iso',flat:true,ft:[-0.308,0.308,0.199],pair:'suitcase_w',r:[-0.308,0.308,0,0.666],m:'180003c0007fe00fff00fff80fffc0ffff0ffff8ffffeffffffffffffffffffffffffffffffffffffffffffffffffff7ffff1ffff07fff03fff00fff003ff000fe0003c0001c'},
 trash:{path:'assets/world-r80/r80-025.webp',h:35,face:'s',ang:'pole',up:0.008,d:0.7,r:[-0.502,0.502,0,0.716],m:'00180001800078000f8001fc001fc003fc007ff80fff83fff83fffc3fffc3fffe7fffe7fffffffffffffffffffffffe7fffe7fffe3fffe3ffff3fffc0fffc07ff403fc003600'},
 chair_n:{path:'assets/r523/chair-n.webp',h:45,face:'n',ang:'iso',flat:true,ft:[-0.272,0.26,-0.012],pair:'chair_w',r:[-0.272,0.272,0,0.936],m:'00300003e0003f80033f0030f007c3007fb0061f006070060601f0607fe61fffeffffeffffe7fffc7fffe63fc66ff06fbe06e0e06c07fec06e6c078300602006000060000600'},
 chair_w:{path:'assets/r523/chair-w.webp',h:45,face:'w',ang:'iso',flat:true,ft:[-0.26,0.272,-0.012],pair:'chair_n',r:[-0.272,0.272,0,0.936],m:'00c0007c001fc00fcc00f0c00c3e00dfe00f8600e06006060060f0067fe07fff87ffff7ffff3fffe7fffe63fc660ff6607ff607077fe0367603c1e0340600006000060000600'},
 chairb_n:{path:'assets/r523/chair-back-n.webp',h:38,face:'n',ang:'iso',flat:true,ft:[-0.257,0.272,0.002],pair:'chairb_w',r:[-0.272,0.272,0,0.79],m:'c0000e0000f8000fe000dfc00c7c0060e0078f807ffe06fff87fffefffff7fffe3fffe7fffe63fe663f866f70679f036078f603ffc03e3c03c34030300300003000030000200'},
 chairb_w:{path:'assets/r523/chair-back-w.webp',h:38,face:'w',ang:'iso',flat:true,ft:[-0.272,0.257,-0.022],pair:'chairb_n',r:[-0.272,0.272,0,0.79],m:'00003000070001f0007f003fb003e30070601f1e07ffe1fffe7fffefffff7fffe7fffc7fffe67fc661fc660ef6c0f9ef1e06ffc06c7c03c3c03c0c0200c0000c0000c0000400'}
}/*ART*/);
const sampMemo=new Map();
// 불투명 칸 → 발 기준 3D 점 [dx,dy,z] — 조형물 그림은 발을 지나 카메라를 향해 서고 위로 갈수록 뒤(-x·-y)로 30° 눕는 판(R412·R521 과 같은 식)
function samplesOf(key,flip){const k=key+(flip?'|f':'');let S=sampMemo.get(k);if(S)return S;S=[];const cols=new Map();const s=ART[key];if(s&&s.m){const[x0,x1,y0,y1]=s.r;
 for(let j=0;j<MH;j++)for(let i=0;i<MW;i++){const u=flip?MW-1-i:i,n=j*MW+u;if(!((parseInt(s.m[n>>2],16)>>(3-(n&3)))&1))continue;const sx=x0+(i+.5)/MW*(x1-x0),h=y1-(j+.5)/MH*(y1-y0);if(h<0)continue;S.push([sx*SQ-BACK*h,-sx*SQ-BACK*h,RISE*h]);
  let c=cols.get(i);if(!c){c={ax:sx*SQ,ay:-sx*SQ,pts:[],bmax:0};cols.set(i,c);}c.pts.push([BACK*h,RISE*h]);if(BACK*h>c.bmax)c.bmax=BACK*h;}}
 S.cols=[...cols.values()];/* 세로줄 묶음: 같은 줄의 점은 바닥에서 한 대각선 위에 있다(앞벽 가림 계산용) */sampMemo.set(k,S);return S;}
function embedOf(S,x,y,hit,stop){if(!S.length)return 0;const lim=stop>=0?stop*S.length:Infinity;let n=0;for(let i=0;i<S.length;i++){if(hit(x+S[i][0],y+S[i][1])&&++n>lim)return 1;/* 한도를 넘으면 더 세지 않는다 */}return n/S.length;}
// 앞벽(카메라 쪽 +x·+y)에 가린 비율 — R521 과 같은 값(벽 2.85칸 + 윗면 덮개까지 3.5칸, 4.5칸 앞까지)
const WALL_LOW=3.5,VIEW_RISE=.816,VIEW_FAR=4.5;
//  그림 점 (높이 z, 뒤로 누운 만큼 b)에서 카메라 쪽으로 t(.25~4.5칸) 나아간 바닥에 벽이 있고 그 벽이 점보다 높으면(z+.816t<3.5) 가린 것.
//  같은 세로줄의 점은 한 대각선을 같이 쓰므로 그 선을 .125칸 간격으로 한 번만 짚는다(점마다 따로 짚던 것의 1/7 질의).
const DU=.125,hitBuf=new Uint8Array(64),nextBuf=new Int16Array(65);
function hiddenOf(S,x,y,hit){if(!S.length)return 0;const C=S.cols;if(!C)return 0;let n=0;
 for(let ci=0;ci<C.length;ci++){const c=C[ci],u0=.25-c.bmax,K=Math.min(64,Math.floor((VIEW_FAR-u0)/DU)+1);let kmax=-1;
  for(let i=0;i<c.pts.length;i++){const b=c.pts[i][0],z=c.pts[i][1],k1=Math.min(K-1,Math.ceil((Math.min(VIEW_FAR,(WALL_LOW-z)/VIEW_RISE)-b-u0)/DU)-1);if(k1>kmax)kmax=k1;}
  if(kmax<0)continue;for(let k=0;k<=kmax;k++){const u=u0+k*DU;hitBuf[k]=hit(x+c.ax+u,y+c.ay+u)?1:0;}
  nextBuf[kmax+1]=32767;for(let k=kmax;k>=0;k--)nextBuf[k]=hitBuf[k]?k:nextBuf[k+1];
  for(let i=0;i<c.pts.length;i++){const b=c.pts[i][0],z=c.pts[i][1],k0=Math.max(0,Math.ceil((.25-b-u0)/DU-1e-9)),k1=Math.min(kmax,Math.ceil((Math.min(VIEW_FAR,(WALL_LOW-z)/VIEW_RISE)-b-u0)/DU)-1);if(k0<=k1&&nextBuf[k0]<=k1)n++;}}
 return n/S.length;}
const WALL_GAP=.06,EMBED_MAX=.01,HIDDEN_MAX=.2,PUSH_STEP=.1,PUSH_MAX=1.2;

// ---- 가구 묶음 --------------------------------------------------------------------------------------
//  묶음 = 벽을 따라 w 칸을 차지하는 한 자리. it = [그림, 묶음 시작에서 가운데까지, 벽에서 띄움(가구: 등과 벽 사이, 기본 0 = 붙임 / 기둥류: 발까지), 'p' = 벽과 직각으로 돌려 세움]
//  첫 줄이 그 묶음의 주인 — 주인이 못 놓이면(벽에 묻힘·가림·비울 자리) 딸린 것도 놓지 않는다(침대 없는 수액대가 남지 않게).
//  크기 기준 1칸 ≈ 1m: 침대 1.1×1.9, 들것 1.7×1.0, 약장 1.0×.4, 수레 .9×.45, 소파 2.2, 옷장 .95, 냉장고 .8.
const SCREEN_D=3.4;
const G=Object.freeze({
 // 의원
 bedMon:{w:2.25,it:[['bed',.62],['monitor',1.75]]},
 bedIv:{w:2.25,it:[['bed',.62],['iv',1.75]]},
 bedTray:{w:2.45,it:[['bed',.62],['overbed',1.75]]},
 bedScreen:{w:3.0,it:[['bed',.62],['monitor',1.75],['curtain',2.45],['curtain',.62,SCREEN_D,'p']]},
 treat:{w:3.0,it:[['stretcher',.95],['iv',2.15],['stool',2.3,1.45]]},
 treatLamp:{w:3.1,it:[['stretcher',.95],['lamp',2.2],['stool',1.2,1.75]]},
 cart:{w:1.1,it:[['trolley',.5]]},
 cab:{w:1.15,it:[['medcab',.55]]},
 cab2:{w:2.3,it:[['medcab',.55],['medcab',1.67]]},
 cabCart:{w:2.35,it:[['medcab',.55],['trolley',1.72]]},
 seats:{w:2.4,it:[['chair145',.4],['chair145',1.17],['chair145',1.94]]},
 seatsTable:{w:3.3,it:[['chair145',.4],['chair145',1.17],['table146',2.4,.15]]},
 wheel:{w:1.2,it:[['wheelchair',.55,1.0]]},
 crutch:{w:.7,it:[['crutches',.3]]},
 ivs:{w:1.4,it:[['iv',.35],['iv',.95,.62]]},
 parked:{w:2.1,it:[['stretcher',.95]]},
 // 집(나태): 낡은 소파·깨진 TV·때 묻은 침대·녹슨 냉장고(칠죄 방 그림 시트의 칸), 옷장·식탁(Dots 두 방향), 여행가방(Dots 두 방향), 나무 의자(드라이브 3D 모델을 등각으로 렌더)
 sofa:{w:2.5,lim:{sofa:1},it:[['sofa_sloth',1.15]]},
 sofaTrash:{w:3.4,lim:{sofa:1,trash:1},it:[['sofa_sloth',1.15],['trash',2.85,.75]]},
 dine:{w:2.1,lim:{table:1},it:[['table_n',.95],['chairb_n',.55,.78],['chairb_n',1.35,.78]]},
 tv:{w:1.8,lim:{tv:1},it:[['tv_sloth',.85]]},
 bedHome:{w:1.5,lim:{bed:1},it:[['bed_sloth',.6]]},
 bedCase:{w:2.4,lim:{bed:1,case:1},it:[['bed_sloth',.6],['suitcase_n',1.75]]},
 bedChair:{w:2.2,lim:{bed:1,chair:1},it:[['bed_sloth',.6],['chair_n',1.65]]},
 wardrobe:{w:1.15,lim:{wardrobe:1},it:[['wardrobe_n',.55]]},
 wardrobe2:{w:2.2,lim:{wardrobe:2},it:[['wardrobe_n',.55],['wardrobe_n',1.6]]},
 fridge:{w:1.05,lim:{fridge:1},it:[['fridge_sloth',.5]]},
 fridgeTrash:{w:2.3,lim:{fridge:1,trash:1},it:[['fridge_sloth',.5],['trash',1.6,.7]]},
 cases:{w:1.9,lim:{case:2},it:[['suitcase_n',.45],['suitcase_n',1.3,.25]]},
 case1:{w:1.0,lim:{case:1},it:[['suitcase_n',.45]]},
 chairs2:{w:1.5,lim:{chair:2},it:[['chair_n',.35],['chair_n',1.05]]},
 trash:{w:1.3,lim:{trash:1},it:[['trash',.6,.7]]}
});
// 한 방에 같은 물건이 되풀이되지 않게(사용자 2026-11-09 "같은 물건이 같은 간격으로 반복되는 현상은 줄이고"): 묶음의 lim 이 방마다 이 수를 넘으면 그 묶음은 건너뛴다
const LIMIT=Object.freeze({tv:1,sofa:2,table:1,trash:1,wardrobe:3,fridge:2,bed:3,case:3,chair:3});
const fits=(g,cnt)=>!g.lim||Object.keys(g.lim).every(k=>(cnt[k]||0)+g.lim[k]<=LIMIT[k]);
const take=(g,cnt,s)=>{if(g.lim)for(const k in g.lim)cnt[k]=(cnt[k]||0)+s*g.lim[k];};
// 쓰임새 = [큰 벽 줄(차례로 돌려 가며 채움), 옆 벽 줄, 안쪽 구석 가구, 큰 벽·옆 벽에 놓을 묶음 상한]
const USE=Object.freeze({
 inject:{main:['treat','cart','treatLamp','ivs','treat','cabCart'],side:['cab2','wheel','cart'],corner:'medcab',cap:[6,3]},
 wait:{main:['seats','seatsTable','seats','wheel'],side:['seats','crutch','wheel'],corner:null,cap:[6,4]},
 observe:{main:['bedScreen','bedIv','bedMon','bedTray'],side:['cabCart','wheel','parked'],corner:'medcab',cap:[6,3]},
 drug:{main:['cab2','cart','cab2','ivs','cab2','cart'],side:['cab2','parked','cab'],corner:'medcab',cap:[6,3]},
 ante:{main:['parked','wheel','crutch'],side:['wheel'],corner:null,cap:[3,1]},
 lobby:{main:['seats','seatsTable','wheel'],side:['seats','crutch'],corner:null,cap:[3,2]},/* 의원 입구 = 접수 앞 대기 자리 */
 living:{main:['sofaTrash','dine','sofa','chairs2'],side:['tv','wardrobe','case1'],corner:null,cap:[6,4]},
 bedroom:{main:['bedCase','wardrobe','bedChair','trash'],side:['wardrobe2','case1','chairs2'],corner:'wardrobe_n',cap:[5,3]},
 store:{main:['fridgeTrash','wardrobe2','cases','fridge','trash'],side:['wardrobe','cases','trash'],corner:'wardrobe_n',cap:[6,4]},
 foyer:{main:['case1','wardrobe','chairs2'],side:['trash','case1'],corner:null,cap:[3,2]},
 // 이름이 같은 '앞방' 아홉 곳은 세 가지로 돌려 쓴다: 앉는 방(소파·식탁·TV 한 대) / 짐 방(옷장·여행가방) / 남는 침실(침대·의자)
 den:{main:['sofa','dine','sofaTrash','wardrobe','chairs2'],side:['tv','case1','chairs2'],corner:null,cap:[6,4]},
 den2:{main:['wardrobe2','cases','chairs2','trash','case1'],side:['case1','wardrobe','chairs2'],corner:'wardrobe_n',cap:[6,4]},
 den3:{main:['bedChair','wardrobe','case1','bedCase','trash'],side:['chairs2','case1','wardrobe'],corner:null,cap:[5,3]},
 // 길목(방과 방 사이): 긴 벽 한 줄에 한 묶음만 — 지나는 길은 비운다
 hall:{main:['parked','wheel','crutch'],side:[],corner:null,cap:[1,0],min:5,more:false},
 passage:{main:['trash','case1'],side:[],corner:null,cap:[1,0],min:5,more:false}
});
// 지역 → [방 이름, 쓰임새]. 여기에 없는 방(길목·갈림길·마당·보스 전투실·중앙 전투실·입구·다음 구역 문)은 손대지 않는다.
const REGION=Object.freeze({
 ep1a09:[[/주사실/,'inject'],[/처치 대기실/,'wait'],[/관찰실/,'observe'],[/약품 보관실/,'drug'],[/^앞방$/,'ante'],[/^입구$/,'lobby'],[/^길목$/,'hall']],
 ep1b02:[[/거실/,'living'],[/작은 방/,'bedroom'],[/물품 보관실/,'store'],[/현관/,'foyer'],[/^앞방$/,['den','den2','den3']],[/^입구$/,'foyer'],[/^길목$/,'passage']]
});
const SKIP=/보스|전투실|다음 구역|갈림길|순환로|마당|쉼길/;
const enabled=r=>!!(prefs.on&&r&&REGION[r.id]&&(!r.layer||r.layer==='STORY')&&r.exploration&&Array.isArray(r.exploration.r224Rooms)&&Array.isArray(r.props)&&!r.exploration.samongR103&&!r.exploration.samongR115);
const useOf=(id,name,k=1)=>{name=String(name||'');if(!name||SKIP.test(name))return null;for(const[re,u]of REGION[id]||[])if(re.test(name))return Array.isArray(u)?u[(Math.max(1,k|0)-1)%u.length]:u;return null;};

// ---- 벽 줄 찾기 -------------------------------------------------------------------------------------
//  방 사각형 안 바닥 칸마다 북쪽(-y)·서쪽(-x)으로 반 칸 안에 벽(바닥 밖·벽 상자)이 있는지 본다. 벽 면 좌표가 같은 칸이 이어진 것이 한 줄.
//  끝이 안쪽 구석(옆 칸이 벽)이면 corner, 문 틈·바깥 모서리면 open(그쪽은 OPEN_KEEP 만큼 비운다).
const OPEN_KEEP=1.1,OPEN_SHORT=.6,RUN_MIN=2.4,DEPTH_NEED=3,GAP=.35,HIT_R=.02;/* HIT_R: 엔진 벽 판정은 반지름 0 이면 얇은 벽(두께 .24)을 못 본다 → 아주 작은 반지름으로 묻는다 */
function faceOf(hit,x,y,dx,dy){/* (x,y) 는 칸 가운데. (dx,dy) 쪽으로 .62칸 안의 첫 벽 면 */for(let t=.1;t<=.62;t+=.1)if(hit(x+dx*t,y+dy*t)){let u=t;while(u>t-.1&&hit(x+dx*(u-.02),y+dy*(u-.02)))u-=.02;return dx?x+dx*u:y+dy*u;}return null;}
function runsOf(q,hit){const out=[];
 for(const wall of['n','w']){const A0=wall==='n'?q.x0:q.y0,A1=wall==='n'?q.x1:q.y1,B0=wall==='n'?q.y0:q.x0,B1=wall==='n'?q.y1:q.x1;
  const P=(a,b)=>wall==='n'?[a,b]:[b,a];/* (줄 방향, 깊이 방향) → (x,y) */
  for(let b=B0;b<B1;b++){let cur=null;const close=()=>{if(cur){out.push(cur);cur=null;}};
   for(let a=A0;a<A1;a++){const[cx,cy]=P(a+.5,b+.5);let f=null,deep=0;
    if(!hit(cx,cy)){f=wall==='n'?faceOf(hit,cx,cy,0,-1):faceOf(hit,cx,cy,-1,0);
     if(f!=null)for(deep=1;deep<4;deep++){const[px,py]=P(a+.5,b+.5+deep);if(hit(px,py)||(wall==='n'?faceOf(hit,px,py,0,-1):faceOf(hit,px,py,-1,0))!=null)break;}}
    if(f==null||deep<DEPTH_NEED){close();continue;}
    if(cur&&[.3,.9,1.5,2.1].some(t=>{const[px,py]=P(a,f+t);return hit(px,py);}))close();/* 칸 사이에 가로지르는 얇은 벽: 줄을 끊는다 */
    if(cur&&Math.abs(cur.at-f)<.03)cur.a1=a+1;else{close();cur={wall,at:f,a0:a,a1:a+1,row:b,c0:null,c1:null};}}
   close();}}
 for(const r of out){const P=(a,b)=>r.wall==='n'?[a,b]:[b,a],[sx,sy]=P(r.a0+.5,r.row+.5),[ex,ey]=P(r.a1-.5,r.row+.5);
  r.c0=r.wall==='n'?faceOf(hit,sx,sy,-1,0):faceOf(hit,sx,sy,0,-1);r.c1=r.wall==='n'?faceOf(hit,ex,ey,1,0):faceOf(hit,ex,ey,0,1);r.len=r.a1-r.a0;}
 return out.filter(r=>r.len>=RUN_MIN).sort((p,q2)=>q2.len-p.len||p.row-q2.row||(p.wall<q2.wall?-1:1));}

// ---- 한 점 놓기 -------------------------------------------------------------------------------------
//  가구(iso): 바닥 자리 네모를 벽에 붙인다 — 벽 'n' 은 네모의 -y 변, 'w' 는 -x 변이 벽 면에서 WALL_GAP+d. 발(그림 아래 가운데)은 네모의 맨 아래 꼭짓점에서 구한다.
//  기둥류(pole): 발이 벽에서 d. 그림 점의 1% 넘게 벽 안이면 .1칸씩 띄우고(낮은 가구 .2칸, 키 큰 가구 .8칸, 기둥류 1.2칸까지), 그래도 묻히거나 앞벽에 20% 넘게 가리면 놓지 않는다.
function seat(key,wall,at,ac,d,perp,hit,cornerAt){let a=ART[key];if(!a)return null;if(a.pair&&a.face!==wall&&!perp&&ART[a.pair]){key=a.pair;a=ART[key];}
 const iso=a.ang==='iso'&&Array.isArray(a.ft),flip=a.face==='n'||a.face==='w'?(a.face!==wall)!==!!perp:false,S=samplesOf(key,flip);
 let sL=0,sR=0,sB=0,lenA=0,lenD=0;if(iso){[sL,sR,sB]=a.ft;if(flip)[sL,sR,sB]=[-sR,-sL,-sB];const lx=(sB-sL)*R2,ly=(sR-sB)*R2;lenA=wall==='n'?lx:ly;lenD=wall==='n'?ly:lx;}
 const d0=iso?WALL_GAP+(fin(+d)?+d:0):(fin(+d)?+d:a.d||.5),lim=iso?(a.h>80?.8:.2):PUSH_MAX,steps=Math.round(lim/PUSH_STEP),corner=fin(cornerAt)&&iso,cs=corner?steps:0;
 const a0=corner?cornerAt+WALL_GAP+lenA/2:ac;let x=0,y=0,dd=d0,ok=false,fr=null;
 search:for(let sum=0;sum<=steps+cs;sum++)for(let j=Math.min(sum,cs);j>=0;j--){const i=sum-j;if(i>steps)continue;dd=d0+i*PUSH_STEP;const al=a0+j*PUSH_STEP;
  if(iso){const bA=al+lenA/2,bD=at+dd+lenD,bx=wall==='n'?bA:bD,by=wall==='n'?bD:bA;x=bx-sB*SQ;y=by+sB*SQ;fr=[bx-(sB-sL)*R2,by-(sR-sB)*R2,bx,by];}
  else{x=wall==='n'?al:at+dd;y=wall==='n'?at+dd:al;}
  if(!fin(x+y))break search;if(embedOf(S,x,y,hit,EMBED_MAX)<=EMBED_MAX){ok=true;break search;}}
 return{key,a,flip,S,x,y,d:dd,pushed:dd>d0+1e-9,ok,fr,lenA,iso};}

// ---- 계획 ------------------------------------------------------------------------------------------
const DOORISH=p=>!!(p&&(p.r74Door||p.r81WardDoor||/portal|door/i.test(String(p.kind||''))));
const KEYISH=p=>!!(p&&(p.interactive||p.interact||p.npc||p.r75NPC||p.r75NarrativeNPC||p.chestR103||p.growthR103||p.r162Frag||p.r169Note||p.r161Sculpture||p.r115Clue||p.r105Record||p.objective||/chest|note|memory|clue|altar|shard/i.test(String(p.kind||'')+' '+String(p.id||''))));
const FURN=p=>!!(p&&(p.r224Furniture||p.r449Furniture));
// 비워 둘 자리(반지름 칸): 문·출입구·시작 자리·목표·제단 + 방에 이미 서 있는 다른 조형물(문 1.6, 상자·단서 1.5, 그 밖 1.1)
function keepClear(r){const L=r.exploration||{},out=[];
 for(const d of L.worldR74?.doors||[])if(fin(d.x+d.y))out.push([d.x,d.y,Math.max(2.6,(+d.width||6)/2+.6)]);
 for(const s of L.starts||[])if(s&&fin(s.x+s.y))out.push([s.x,s.y,3]);
 for(const q of[L.entry,L.entrance,L.gate,r.objective,r.altar])if(q&&fin(q.x+q.y))out.push([q.x,q.y,2.6]);
 const FB=fightOf(L);for(const p of r.props)if(p&&!rests(p,FB)&&p.visible!==false&&!p.r303Hide&&fin(p.x+p.y))out.push([+p.x,+p.y,DOORISH(p)?1.6:KEYISH(p)?1.5:1.1]);
 return out;}
const sigOf=r=>{let n=0;for(const p of r.props)if(p&&!FURN(p)&&p.visible!==false&&!p.r303Hide)n++;return n;};
function hitOf(r){const L=r.exploration,E=window.StoryPhase1&&typeof window.StoryPhase1.explorationBlocked==='function'?window.StoryPhase1.explorationBlocked:null;
 if(E)return(x,y)=>{try{return !!E(L,x,y,HIT_R);}catch(_){return true;}};
 if(typeof blocked==='function')return(x,y)=>{try{return !!blocked(x,y,HIT_R,r);}catch(_){return true;}};return()=>false;}
const capOf=(run,max)=>Math.min(max,Math.max(1,Math.round(run.len/2.4)));/* 벽 길이 2.4칸에 한 묶음 꼴 */
// 전투 구역: 보스 구역·모이는 방 테두리(±.5)와 이름이 보스/전투실인 방 사각형(±.5). 여기는 손대지 않는다(R438·R449 세트 그대로).
const FIGHT=/보스|전투실/,fightMemo=new WeakMap();
function fightOf(L){let f=fightMemo.get(L);if(f)return f;f=[];const W=L.worldWardR81||{};for(const b of[W.bossBounds,W.gatherBounds])if(Array.isArray(b)&&b.length===4&&fin(b[0]+b[1]+b[2]+b[3]))f.push([b[0]-.5,b[1]-.5,b[2]+.5,b[3]+.5]);
 const names=new Map((L.worldR74?.rooms||[]).map(q=>[q.id,q.name||q.purpose||'']));for(const q of L.r224Rooms||[])if(FIGHT.test(names.get(q.id)||''))f.push([q.x0-.5,q.y0-.5,q.x1+.5,q.y1+.5]);fightMemo.set(L,f);return f;}
const inFight=(F,x,y)=>{for(let i=0;i<F.length;i++){const b=F[i];if(x>b[0]&&x<b[2]&&y>b[1]&&y<b[3])return true;}return false;};
// 바닥 자리 네모의 테두리와 가운데 십자를 .12칸 간격으로 짚어 본다 — 얇은 벽이 가구 밑을 지나가면 놓지 않는다
function footHit(fr,hit){const[x0,y0,x1,y1]=fr,nx=Math.max(2,Math.ceil((x1-x0)/.12)),ny=Math.max(2,Math.ceil((y1-y0)/.12)),mx=(x0+x1)/2,my=(y0+y1)/2;
 for(let i=0;i<=nx;i++){const x=x0+(x1-x0)*i/nx;if(hit(x,y0)||hit(x,y1)||hit(x,my))return true;}for(let j=0;j<=ny;j++){const y=y0+(y1-y0)*j/ny;if(hit(x0,y)||hit(x1,y)||hit(mx,y))return true;}return false;}
function plan(r){const L=r.exploration,hit=hitOf(r),W=L.worldWardR81||{},F=fightOf(L),names=new Map((L.worldR74?.rooms||[]).map(q=>[q.id,q.name||q.purpose||'']));
 let path=null;try{path=window.__STORYWORLD_PLAY_R169__?.pathCells?.(r)||null;}catch(e){fail(e);}
 const onPath=(x,y)=>{if(!path)return false;const cx=Math.floor(x),cy=Math.floor(y);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(path.has((cx+dx)+','+(cy+dy))&&Math.hypot(cx+dx+.5-x,cy+dy+.5-y)<1.3)return true;return false;};
 const cand=[],rooms=[],log=[],nth={},ord={};let dropped=0,pushed=0,n=0;
 for(const q of L.r224Rooms){const name=names.get(q.id)||'',use=useOf(r.id,name,ord[name]=(ord[name]||0)+1);if(!use)continue;
  const b=[q.x0,q.y0,q.x1,q.y1];if([W.bossBounds,W.gatherBounds].some(B=>Array.isArray(B)&&B.length===4&&!(b[2]<=B[0]||b[0]>=B[2]||b[3]<=B[1]||b[1]>=B[3])))continue;
  const U=USE[use],k=nth[use]=(nth[use]||0)+1,runs=U?runsOf(q,hit).filter(x=>x.len>=(U.min||0)):[];if(!U||!runs.length){rooms.push({id:q.id,name,use,rect:b,count:0});continue;}
  const main=runs[0],side=runs.find(x=>x.wall!==main.wall)||null,rest=U.more===false?[]:runs.filter(x=>x!==main&&x!==side&&x.len>=3).slice(0,5),before=cand.length,taken=[],cnt={};
  // 한 점: 지도만 보고 정해지는 탈락(벽에 묻힘·발이 벽·보스 구역·길잡이 길·앞벽에 가림·다른 가구와 겹침)은 여기서, 조형물·문·상자 곁은 resolve 에서 가린다
  const put=(key,wall,at,ac,d,perp,cornerAt,tag,lead)=>{const s=seat(key,wall,at,ac,d,perp,hit,cornerAt);n++;if(!s)return-1;
   const box=s.fr||[s.x-.22,s.y-.22,s.x+.22,s.y+.22];
   const why=!s.ok?'wall':hit(s.x,s.y)||(s.fr&&footHit(s.fr,hit))?'foot':inFight(F,s.x,s.y)?'boss':onPath(s.x,s.y)?'path':hiddenOf(s.S,s.x,s.y,hit)>HIDDEN_MAX?'hidden':taken.some(t=>box[0]<t[2]+.03&&box[2]>t[0]-.03&&box[1]<t[3]+.03&&box[3]>t[1]-.03)?'overlap':'';
   if(why){dropped++;log.push(q.id+':'+tag+' '+key+'/'+wall+' '+why);return-1;}if(s.pushed)pushed++;taken.push(box);
   const a=s.a,p={id:'r523:'+r.id+':'+q.id+':'+n,path:a.path,x:+s.x.toFixed(3),y:+s.y.toFixed(3),height:a.h,solid:false,visible:true,enabled:true,presentationOnly:true,autoTargetEligible6:false,
    r521Ward:true,r521Flat:!!a.flat,r521Foot:a.flat&&s.fr?Object.freeze(s.fr.map(v=>+v.toFixed(3))):null,r521Up:a.up||0,r523Room:true,r523:Object.freeze({room:q.id,use,wall,art:s.key,d:+s.d.toFixed(2),tag,len:+s.lenA.toFixed(2)})};
   if(s.flip)p.r303Flip=true;cand.push({p,lead:fin(lead)?lead:-1});return cand.length-1;};
  const fill=(run,list,cap,withCorner,from,tag,shift=0,alt=null)=>{if(!run||!list.length)return;const keep=run.len<5?OPEN_SHORT:OPEN_KEEP;/* 짧은 벽 토막은 끝을 덜 비운다 */let a=Math.max(run.a0+(run.c0!=null?.15:keep),from||-1e9);const end=run.a1-(run.c1!=null?.15:keep);
   if(withCorner&&U.corner&&run.c0!=null&&!(from>run.a0)){const i=put(U.corner,run.wall,run.at,0,0,false,run.c0,'corner');if(i>=0){a=Math.max(a,run.c0+cand[i].p.r523.len+.5);if(/^wardrobe/.test(U.corner))cnt.wardrobe=(cnt.wardrobe||0)+1;}}
   // 들어갈 묶음을 먼저 세고, 남는 길이는 묶음 사이에 고르게(.35~.95칸) 나눈다 — 한쪽에 몰리지도, 띄엄띄엄 흩어지지도 않게
   const pick=[];let need=0;for(let i=0;pick.length<cap&&i<list.length*3;i++){const g=G[list[(i+k-1+shift)%list.length]];if(!g||need+g.w>end-a||!fits(g,cnt))continue;pick.push(g);take(g,cnt,1);need+=g.w+GAP;}
   if(!pick.length&&alt)for(let i=0;pick.length<cap&&i<alt.length;i++){const g=G[alt[i]];if(!g||need+g.w>end-a||!fits(g,cnt))continue;pick.push(g);take(g,cnt,1);need+=g.w+GAP;}/* 큰 묶음이 안 들어가는 짧은 벽: 다른 줄의 작은 묶음이라도 */
   if(!pick.length)return;const spare=Math.max(0,end-a-need+GAP),gap=GAP+Math.min(.4,spare/pick.length);let at0=a+Math.min(.5,spare/(pick.length+1));
   for(const g of pick){let lead=-2;for(const it of g.it){if(lead===-1)break;const i=put(it[0],run.wall,run.at,at0+it[1],it[2],it[3]==='p',undefined,tag,lead>=0?lead:undefined);if(lead===-2)lead=i;}if(lead===-1)take(g,cnt,-1);/* 첫 점이 못 놓였으면 그 몫은 다음 벽 줄에 돌려준다 */at0+=g.w+gap;}};
  // 옆 벽 줄이 큰 벽 줄과 같은 구석에서 만나면 큰 벽 가구의 깊이(침대 1.9칸)만큼 물려서 시작한다
  const meet=side&&main.c0!=null&&side.c0!=null&&Math.abs(main.c0-side.at)<.3&&Math.abs(side.c0-main.at)<.3;
  fill(main,U.main,capOf(main,U.cap[0]),true,0,'main',0,U.side);fill(side,U.side,side?capOf(side,U.cap[1]):0,!(main.c0!=null),meet?side.c0+2.6:0,'side',0,U.main);
  rest.forEach((run,i)=>fill(run,i%2?U.side:U.main,capOf(run,3),false,0,'more',i+1));/* 튀어나온 벽 덩어리 때문에 끊긴 나머지 벽 줄(3칸 이상, 다섯까지)에도 길이에 맞춰 세 묶음까지 */
  rooms.push({id:q.id,name,use,rect:b,count:cand.length-before,main:main.wall+'@'+main.at.toFixed(2)+':'+main.a0+'-'+main.a1,side:side?side.wall+'@'+side.at.toFixed(2)+':'+side.a0+'-'+side.a1:null});}
 stats.builds++;stats.rooms=rooms.length;stats.dropped=dropped;stats.pushed=pushed;dropLog=log;lastPlan={region:r.id,rooms};return{cand,rooms};}
// 조형물·문·상자가 바뀌면(개수) 이 가림만 다시 한다 — 벽 줄 찾기·묻힘 계산은 지역에 들어올 때 한 번
function resolve(r,cand){const clear=keepClear(r),keep=[],rows=[];for(let i=0;i<cand.length;i++){const{p,lead}=cand[i],ok=(lead<0||keep[lead])&&!clear.some(([cx,cy,cr])=>Math.hypot(cx-p.x,cy-p.y)<cr);keep.push(ok);if(ok)rows.push(p);}
 stats.placed=rows.length;return rows;}
const memo=new WeakMap();
function state(r){if(!enabled(r))return null;const L=r.exploration;let m=memo.get(r);
 if(!m||m.L!==L){m={L,sig:-1,cand:[],rows:[]};try{const res=plan(r);m.cand=res.cand;}catch(e){fail(e);}memo.set(r,m);}
 const sig=sigOf(r);if(m.sig!==sig){m.sig=sig;try{m.rows=resolve(r,m.cand);}catch(e){fail(e);m.rows=[];}}return m;}
const list=r=>state(r)?.rows||[];

// ---- 그림 읽기 --------------------------------------------------------------------------------------
let asked=0;
function prime(r,rows){try{const paths=[...new Set(rows.map(p=>p.path))],reg=typeof regionById!=='undefined'?regionById?.[r.id]:null;if(reg?.paths)for(const p of paths)if(!reg.paths.includes(p))reg.paths.push(p);
 if(typeof readyImage!=='function')return;const want=paths.filter(p=>!readyImage(p));if(!want.length)return;const t=Date.now();if(t-asked<1500)return;asked=t;stats.reloads+=want.length;
 if(typeof ensureImages==='function')Promise.resolve(ensureImages(want)).catch(()=>{});else if(typeof addImage==='function')for(const p of want)addImage(p,'R523 rooms');}catch(e){fail(e);}}

// ---- 그리기 ----------------------------------------------------------------------------------------
//  가구는 화면 밖이어도 모두 덧붙인다: 벽 장식(R91)이 그리기 목록의 조형물 수가 바뀔 때마다 벽 장식을 다시 짜서, 카메라를 따라 수가 바뀌면 벽 장식이 계속 다시 만들어졌다(측정: 한 지역에서 23번).
//  그래서 목록에는 늘 모두 넣되, 화면 밖 가구는 visible=false 로만 둔다 — 엔진 drawProp 이 첫 줄에서 돌아가므로 그리는 일은 화면 근처 것만 한다(모두 그리면 헤드리스에서 프레임당 약 10ms 더 들었다).
function sight(rows){if(typeof project!=='function'||typeof W!=='number'||typeof H!=='number'){for(let i=0;i<rows.length;i++)rows[i].visible=true;return rows.length;}let n=0;
 for(let i=0;i<rows.length;i++){const p=rows[i],q=project(p.x,p.y),v=q.x>-130&&q.x<W+130&&q.y>-40&&q.y<H+150;p.visible=v;if(v)n++;}return n;}
// 쉬게 할 것(이 그리기 동안만): 보스 전투실·중앙 전투실 밖의 R449·R224 가구(방 사각형 변에 놓여 실제 벽과 떨어져 있었다)와, 정면 3/4 시점이라 바닥과 각도가 안 맞는 지역 장식 가구(R80·R81 장식과 R74 장식의 소파·장 그림)
const OFF_ANGLE=/world-r80\/(?:refined-r85-)?r80-(?:024|027|051|144|148)\.webp$/;
const skinOf=p=>String(p.path||(p.r81NativeSkin&&p.r81NativeSkin.path)||'');/* R74 장식은 path 없이 r81NativeSkin 그림으로 그려진다 */
const rests=(p,F)=>!!p&&fin(p.x+p.y)&&(FURN(p)||((p.r80Dressing===true||!!p.r74Prop)&&OFF_ANGLE.test(skinOf(p))))&&!inFight(F,p.x,p.y);
try{if(typeof draw==='function'){const base=draw;draw=function(...a){let r=null,m=null,rows=null;try{r=typeof room!=='undefined'?room:null;m=r?state(r):null;if(m&&m.rows.length){prime(r,m.rows);rows=m.rows;stats.shown=sight(rows);}}catch(e){fail(e);m=null;}
 if(!m||!m.rows.length)return base.apply(this,a);
 const original=r.props,FB=fightOf(r.exploration);let kept=original,rested=0;try{kept=original.filter(p=>!rests(p,FB)||(rested++,false));}catch(e){fail(e);kept=original;}stats.rested=rested;
 r.props=kept.concat(rows);stats.frames++;try{return base.apply(this,a);}finally{r.props=original;}};}}catch(e){fail(e);}

function set(o){if(o&&typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_ROOMS_R523__=Object.freeze({revision:REV,ART,G,USE,REGION,LIMIT,samplesOf,embedOf,hiddenOf,runsOf,seat,useOf,enabled,plan,resolve,list,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,dropLog:dropLog.slice(),plan:lastPlan,collisionChanged:false,savesTouched:false,
  room:typeof room!=='undefined'&&room&&enabled(room)?list(room).map(p=>({id:p.id,art:p.r523.art,use:p.r523.use,x:p.x,y:p.y,flip:!!p.r303Flip})):null})});
})();
