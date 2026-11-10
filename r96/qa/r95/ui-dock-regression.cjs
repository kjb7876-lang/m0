'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),source=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'client-source/visual-r93-ui.js');
const report={schema:'r95-ui-dock-regression/v1',source:path.relative(root,source),method:'Actual overlay in Node VM with native HUD parent structure, DOM move semantics and mobile-live class transitions. Does not measure browser layout or pixels.',checks:[]};
function check(name,passed){report.checks.push({name,passed:!!passed});console.log(passed?'PASS':'FAIL',name);}
const nodes=new Map(),timers=[];
class Node{
 constructor(tag,id=''){this.tagName=tag.toUpperCase();this.id=id;this.children=[];this.parentNode=null;this.style={};const tokens=new Set();this.classList={contains:x=>tokens.has(x),add:x=>tokens.add(x),remove:x=>tokens.delete(x),toggle:(x,on)=>{if(on??!tokens.has(x))tokens.add(x);else tokens.delete(x);}};if(id)nodes.set(id,this);}
 get parentElement(){return this.parentNode;}
 get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null;}
 get isConnected(){return this===body||this===head||!!this.parentNode?.isConnected;}
 appendChild(n){n.remove();this.children.push(n);n.parentNode=this;return n;}
 append(n){this.appendChild(n);}
 prepend(n){this.insertBefore(n,this.children[0]||null);}
 insertBefore(n,b){if(b===n)return n;n.remove();const i=b?this.children.indexOf(b):-1;if(i<0)this.children.push(n);else this.children.splice(i,0,n);n.parentNode=this;return n;}
 remove(){if(this.parentNode){const a=this.parentNode.children;a.splice(a.indexOf(this),1);this.parentNode=null;}}
}
const body=new Node('body','body'),head=new Node('head','head'),header=new Node('header','header'),stage=new Node('div','stage'),footer=new Node('footer','footer'),region=new Node('div','region'),nav=new Node('nav','nav'),right=new Node('div','right');
body.append(header);body.append(stage);body.append(footer);header.append(region);header.append(nav);footer.append(right);
const quest=new Node('section','quest'),mini=new Node('div','mini'),gold=new Node('div','goldHudR72'),wer=new Node('div','story-wer-controls'),code=new Node('button','story-code-button');
for(const n of [quest,mini,wer,gold])stage.append(n);body.append(code);code.onclick=()=>true;const handler=code.onclick;
const selectors={'footer':footer,'header .region':region,'header .topnav':nav,'footer .footRight':right};
const doc={body,head,hidden:false,querySelector:s=>selectors[s]||null,getElementById:id=>nodes.get(id)?.isConnected?nodes.get(id):null,createElement:tag=>new Node(tag),querySelectorAll:()=>[],addEventListener(){}};
const saved=new Map(),h={document:doc,window:{},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},setInterval:(f,ms)=>timers.push({f,ms}),console};
vm.createContext(h);vm.runInContext(fs.readFileSync(source,'utf8'),h,{filename:source});const api=h.window.__STORYWORLD_VISUAL_R93_UI__,pulse=()=>timers.find(t=>t.ms===500).f();
check('Desktop docks existing controls into the native header/footer',quest.parentNode===region&&gold.parentNode===nav&&code.parentNode===nav&&wer.parentNode===right);
api.set({dockUi:false});
check('Dock OFF restores all four native parents',quest.parentNode===stage&&gold.parentNode===stage&&wer.parentNode===stage&&code.parentNode===body);
check('Dock OFF restores native sibling order and event identity',stage.children.map(n=>n.id).join(',')==='quest,mini,story-wer-controls,goldHudR72'&&code.onclick===handler);
for(let i=0;i<10;i++){api.set({dockUi:true});api.set({dockUi:false});}
check('Repeated docking does not duplicate nodes or lose event listeners',stage.children.length===4&&body.children.length===4&&code.onclick===handler&&new Set(stage.children).size===4);
api.set({dockUi:true});body.classList.add('mobile-live-r63');pulse();
check('Fullscreen mobile restores controls outside hidden header/footer',quest.parentNode===stage&&gold.parentNode===stage&&wer.parentNode===stage&&code.parentNode===body);
check('Mobile effective docking does not overwrite user preference',api.prefs().dockUi===true&&!body.classList.contains('r93-dock')&&JSON.parse(saved.get(api.storageKey)).dockUi===true);
body.classList.remove('mobile-live-r63');pulse();
check('Returning to desktop reapplies user-selected docking',body.classList.contains('r93-dock')&&gold.parentNode===nav&&wer.parentNode===right);
api.set({dockUi:false});body.classList.add('mobile-live-r63');pulse();body.classList.remove('mobile-live-r63');pulse();
check('User-disabled docking stays disabled across mobile transitions',!body.classList.contains('r93-dock')&&gold.parentNode===stage&&wer.parentNode===stage);
check('Dock lifecycle leaves the overlay error ledger clear',api.inspect().stats.errors===0);
report.passed=report.checks.every(c=>c.passed);fs.writeFileSync(path.join(__dirname,'ui-dock-results.json'),JSON.stringify(report,null,2)+'\n');if(!report.passed)process.exitCode=1;
