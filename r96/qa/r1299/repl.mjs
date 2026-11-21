// R1299 조사용 상주 브라우저: POST /eval (본문 = async 함수 몸) → JSON, GET /shot?f=경로 → 스크린샷
import {chromium,boot,go} from '../r444/lib.mjs';import http from 'node:http';
const scene3d=process.env.S3D==='1';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:scene3d?{'storyworld.r183.scene3d':'{"on":true}'}:null});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
http.createServer(async(q,r)=>{let body='';q.on('data',d=>body+=d);q.on('end',async()=>{try{const u=new URL(q.url,'http://x');let out;
 if(u.pathname==='/eval')out=await p.evaluate(new Function('return (async()=>{'+body+'})()'));
 else if(u.pathname==='/go'){await go(p,u.searchParams.get('z'));out='ok';}
 else if(u.pathname==='/shot'){await p.screenshot({path:u.searchParams.get('f'),quality:85});out='ok';}
 else if(u.pathname==='/errs'){out=errs.splice(0);}
 r.end(JSON.stringify(out===undefined?null:out));}catch(e){r.statusCode=500;r.end(String(e).slice(0,2000));}});}).listen(+(process.env.PORT||4499));
console.log('READY');
