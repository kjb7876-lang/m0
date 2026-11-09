import {chromium,boot,go} from '../r444/lib.mjs';
const zones=(process.argv[2]||'dist00').split(',');const SEC=+(process.env.SEC||30);const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:JSON.parse(process.env.INIT||'null')});
for(const z of zones){await go(p,z);await p.evaluate(()=>{player.hp=9e8;player.invincible=1e9;guide=true;});await p.waitForTimeout(3000);
 await p.evaluate(()=>{const T=window.__STORYWORLD_PHASE1__.controller.state.three;const R=T.renderer,gl=R.getContext();window.__L={links:0,ms:0,dels:0,keys:{},t0:time,f0:0};
  const lp=gl.linkProgram;gl.linkProgram=function(){window.__L.links++;return lp.apply(this,arguments);};const dp=gl.deleteProgram;gl.deleteProgram=function(){window.__L.dels++;return dp.apply(this,arguments);};
  // 첫 사용(링크 완료 기다림) 시간: getProgramParameter LINK_STATUS / getUniformLocation 첫 호출 근사 → onFirstUse 를 감싸기 어려워 getProgramInfoLog 시간 합
  const gi=gl.getProgramInfoLog;gl.getProgramInfoLog=function(){const t=performance.now();try{return gi.apply(this,arguments);}finally{window.__L.ms+=performance.now()-t;}};});
 await p.waitForTimeout(SEC*1000);const r=await p.evaluate(()=>{const L=window.__L,R=window.__STORYWORLD_PHASE1__.controller.state.three.renderer;return {links:L.links,deletes:L.dels,waitMs:+L.ms.toFixed(0),game:+(time-L.t0).toFixed(1),programsNow:R.info.programs.length};});
 console.log(z,JSON.stringify(r));}
await b.close();
