'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'runtime-text/assets/r163/pixelfx');
async function fixture({overlay=false,source,zone='ep1a08'}={}){
 const meta=JSON.parse(fs.readFileSync(path.join(D,'index.json'))),images=new Map();
 for(const name of ['dark-explosion-blood','pvfx-electric-impact','core-orb-teal']){const file=meta.effects[name].file;images.set('assets/r163/pixelfx/'+file,await loadImage(path.join(D,file)));}
 const canvas=createCanvas(960,640),ctx=canvas.getContext('2d');let draws=0,reads=0,pixels=0;
 const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(...a)=>{draws++;return draw(...a)};
 const s={window:null,console,document:{createElement(){const c=createCanvas(1,1),get=c.getContext.bind(c);c.getContext=(...a)=>{const g=get(...a),read=g.getImageData.bind(g);g.getImageData=(x,y,w,h)=>{reads++;pixels+=w*h;return read(x,y,w,h)};return g;};return c;}},localStorage:{getItem:()=>null,setItem(){}},fetch:async()=>({ok:true,json:async()=>meta}),readyImage:p=>images.has(p)?{image:images.get(p)}:null,ensureImages:async()=>{},ctx,W:960,H:640,zone,time:1,actorHeight:()=>64,project:(x,y)=>({x,y}),drawEffect(){},tick(dt){s.time+=dt;},enterRegion:async()=>{},effects:[],performance};
 s.window=s;vm.createContext(s);
 if(overlay)vm.runInContext(fs.readFileSync(path.join(R,'client-source/fx-performance-r190.js'),'utf8'),s);
 vm.runInContext(source||fs.readFileSync(path.join(R,'client-source/pixelfx-r163.js'),'utf8'),s);await new Promise(r=>setImmediate(r));
 return {s,P:s.__STORYWORLD_PIXELFX_R163__,canvas,ctx,counts:()=>({draws,reads,pixels}),draw(){ctx.clearRect(0,0,960,640);s.drawEffect({type:'r163-pixelfx'});},step(dt){s.tick(dt);}};
}
module.exports={fixture};
