// Repeated icon refreshes reuse the same IMG elements. A once listener on an
// already-complete, unchanged source never fires and accumulated every refresh.
const domEvidenceLoadsR73=new WeakMap();
function recordDomImages5(root,prefix){
 for(const img of root?.querySelectorAll?.('img')||[]){
  let row=domEvidenceLoadsR73.get(img);
  if(!row){
   row={prefixes:new Set(),note:null};
   row.note=()=>{if(!img.complete||!img.naturalWidth)return;const path=imagePathFromElement5(img);if(path)for(const scope of row.prefixes)recordEvidence5(scope+':'+(img.id||img.alt||'image'),path,{renderer:'dom-img',dimensions:[img.naturalWidth,img.naturalHeight]});};
   domEvidenceLoadsR73.set(img,row);img.addEventListener('load',row.note);
  }
  row.prefixes.add(prefix);row.note();
 }
}
