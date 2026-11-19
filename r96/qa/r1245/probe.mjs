// R1245 탐색: 스토리·스토리 사몽(꿈 층)·사몽 에피소드의 카메라 기본 시야(zoom·보이는 칸·영웅 화면 위치)를 잰다. 헤드리스.
import {chromium,boot,skip,go} from '../r444/lib.mjs';
const b=await chromium.launch();const kind=process.env.KIND||'pc';
const vp=kind==='mobile'?{width:844,height:390}:{width:1280,height:720};
const {ctx,p}=await boot(b,{vp});
const m=()=>p.evaluate(async()=>{const t0=time;await new Promise(r=>{const st=performance.now();const f=()=>{if(time-t0>1.2||performance.now()-st>30000)r();else requestAnimationFrame(f)};requestAnimationFrame(f)});
 const q=project(player.x,player.y),c=window.__STORYWORLD_CAMERA_R63__.inspect();
 return {zone,layer,zoom:+zoom.toFixed(4),r81:!!window.__STORYWORLD_WORLD_PRESENTATION_R81__?.ownsCamera?.(),base:c.baseZoom,actual:c.actual,range:{u:+c.worldRange.u.toFixed(2),v:+c.worldRange.v.toFixed(2)},heroPx:{x:+(q.x-W/2).toFixed(1),y:+(q.y-H/2).toFixed(1)},W,H};});
const out=[];
await go(p,'murder01');out.push(['story',await m()]);
await p.evaluate(()=>enterRegion('murder01',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000}).catch(()=>{});await skip(p);out.push(['dream',await m()]);
await p.evaluate(async()=>{const SM=__STORYWORLD_SAMONG_R103__;await SM.go(SM.episodes.findIndex(e=>e.key==='S-01'),null,{});});await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip(p);out.push(['episode',await m()]);
for(const r of out)console.log(kind,r[0],JSON.stringify(r[1]));
await b.close();
