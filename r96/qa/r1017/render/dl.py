import json,sys,urllib.request,urllib.parse,hashlib,os
out=sys.argv[1]; rows=[]
for id in sys.argv[2:]:
    d=json.load(urllib.request.urlopen('https://patch.gg/api/v1/assets/'+urllib.parse.quote(id,safe='')))
    v=[x for x in d['variants'] if x['name']=='web'][0]['files'][0]
    b=urllib.request.urlopen(urllib.request.Request(v['url'],headers={'User-Agent':'Mozilla/5.0'})).read()
    h=hashlib.sha256(b).hexdigest(); assert h==v['sha256'],(id,h)
    fn=os.path.join(out,v['name']); open(fn,'wb').write(b)
    rows.append(dict(id=id,title=d['title'],license=d['license']['spdx'],source=d['source']['url'],creators=d.get('creators'),file=v['name'],sha256=h,size=len(b),ai=d.get('ai'),generated_by=d.get('generated_by')))
    print(id,len(b),h[:12])
json.dump(rows,open(os.path.join(out,'..','dl-meta.json'),'w'),indent=1,ensure_ascii=False)
