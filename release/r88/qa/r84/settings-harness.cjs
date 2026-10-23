'use strict';
// The native gameplay harness deliberately has a small DOM spy. For UI
// placement checks only, add real tree movement/detachment semantics before
// executing the actual shipped scripts. No product source is overlaid.
const fs=require('fs'),path=require('path'),Module=require('module');
const file=path.resolve(__dirname,'../harness.cjs');let source=fs.readFileSync(file,'utf8');
const dom=`
function setConnectedR84(node,value){node.isConnected=value;for(const child of node.children||[])setConnectedR84(child,value);}
const innerHTMLDescriptorR84=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
Object.defineProperty(Element.prototype,'innerHTML',{get:innerHTMLDescriptorR84.get,set(value){for(const child of this.children.slice())child.remove();innerHTMLDescriptorR84.set.call(this,value);}});
Element.prototype.appendChild=function(e){if(!e)return e;if(e.parentNode){const siblings=e.parentNode.children,index=siblings.indexOf(e);if(index>=0)siblings.splice(index,1);}this.children.push(e);e.parentNode=this;e.parentElement=this;setConnectedR84(e,!!this.isConnected);return e;};
Element.prototype.remove=function(){if(this.parentNode){const list=this.parentNode.children,index=list.indexOf(this);if(index>=0)list.splice(index,1);}this.parentNode=this.parentElement=null;setConnectedR84(this,false);};
Element.prototype.contains=function(e){return e===this||this.children.some(child=>child.contains?.(e));};
Element.prototype.querySelector=function(selector){if(selector.startsWith('#')){const e=elements.get(selector.slice(1));return e&&this.contains(e)?e:null;}const id=(this.id||'node')+':query:'+selector;let e=elements.get(id);if(!e){e=new Element('div');e.id=id;}if(e.parentNode!==this)this.appendChild(e);return e;};
`;
source=source.replace('this.isConnected=true;','this.isConnected=false;');
source=source.replace("let e=elements.get(m[2]);if(!e){e=new Element(m[1]);e.id=m[2];this.appendChild(e);}", "const e=new Element(m[1]);e.id=m[2];this.appendChild(e);");
source=source.replace("const document=events(",dom+"\nconst document=events(");
source=source.replace("getElementById:id=>elements.get(id)||null", "getElementById:id=>elements.get(id)?.isConnected?elements.get(id):null");
source=source.replace("e.id='portable-data';}", "e.id='portable-data';document.body.appendChild(e);}");
source=source.replace("for(const m of html.replace(/<script", "document.body.isConnected=document.head.isConnected=document.documentElement.isConnected=true;\nfor(const m of html.replace(/<script");
source=source.replace("const e=new Element(m[1]);e.id=m[2];}\n{const e=new Element('script');", "const e=new Element(m[1]);e.id=m[2];document.body.appendChild(e);}\nif(elements.get('modal')&&elements.get('panel'))elements.get('modal').appendChild(elements.get('panel'));\n{const e=new Element('script');");
const mod=new Module(file,module);mod.filename=file;mod.paths=module.paths;mod._compile(source,file);module.exports=mod.exports;
