/* ===================== الواجهة ===================== */
let DEMO=false;
const OPEN_LESSON=location.hash==='#demo',LS='almufeed-exam-v13',BACKUP=LS+'-backup';
let mem=null;
let recoveryUsed=false,storageWarning=false;
const validState=o=>o&&typeof o==='object'&&o.stages&&typeof o.stages==='object'&&Object.keys(STAGES).some(k=>o.stages[k]&&Array.isArray(o.stages[k].questions));
const store={get(k){try{return (k===LS&&mem)||localStorage.getItem(k);}catch{return k===LS?mem:null;}},set(v){mem=v;try{
 const old=localStorage.getItem(LS);if(old&&old!==v){try{const data=JSON.parse(old);if(validState(data))localStorage.setItem(BACKUP,old);}catch{}}
 localStorage.setItem(LS,v);mem=null;return true;}catch{return false;}}};
function loadState(){
 let raw=null;for(const k of [LS,BACKUP,'almufeed-exam-v12','almufeed-exam-v12-backup','almufeed-exam-v11','almufeed-exam-v11-backup','almufeed-exam-v10','almufeed-exam-v10-backup','almufeed-exam-v9','almufeed-exam-v9-backup','almufeed-exam-v7','almufeed-exam-v6','almufeed-exam-v5','almufeed-exam-v4','exam-studio-v3']){
  try{const o=JSON.parse(store.get(k)||'null');if(validState(o)){raw=o;recoveryUsed=k.endsWith('-backup');break;}}catch{}}
 const s={active:'primary',started:!!(raw&&raw.started),stages:{}};
 if(raw&&STAGES[raw.active])s.active=raw.active;
 for(const k of Object.keys(STAGES))s.stages[k]=raw&&raw.stages&&raw.stages[k]?normProject(raw.stages[k],k):makeProject(k);
 return s;
}
const S=loadState();
const desk=()=>matchMedia('(min-width:1024px)').matches;
const UI={view:'questions',open:null,more:{},lay:{},tableCells:{},adding:false,zoom:'fit'};
const P=()=>S.stages[S.active];
const ctx=()=>makeCtx(P(),S.active);
const findQ=id=>P().questions.find(q=>q.id===id);

/* ---------- الحفظ والتراجع: كل تغيير يمرّ من هنا ---------- */
let saveT,histT,paperT;const H={stack:[],idx:-1};
const snap=()=>JSON.stringify({active:S.active,started:S.started,stages:S.stages});
function pushHist(){clearTimeout(histT);const s=snap();if(H.stack[H.idx]===s)return;H.stack=H.stack.slice(0,H.idx+1);H.stack.push(s);
 let bytes=H.stack.reduce((n,v)=>n+v.length*2,0);while(H.stack.length>2&&(H.stack.length>80||bytes>20*1024*1024)){bytes-=H.stack[0].length*2;H.stack.shift();}
 H.idx=H.stack.length-1;updUndo();}
function save(){clearTimeout(saveT);if(DEMO){setStatus('saved');return;}const saved=store.set(JSON.stringify(S));setStatus(saved?'saved':'error');if(!saved&&!storageWarning){storageWarning=true;toast('الحفظ المحلي تعذّر. احفظ ملف المشروع الآن حتى لا يضيع عملك',{label:'حفظ ملف',run:download});}if(saved)storageWarning=false;}
function changed(o={}){setStatus('saving');clearTimeout(saveT);saveT=setTimeout(save,450);clearTimeout(histT);histT=setTimeout(pushHist,450);if(o.paper!==false){clearTimeout(paperT);paperT=setTimeout(renderPaper,160);}}
function commit(){changed({paper:false});pushHist();renderSide();renderPaper();}
function undo(dir){pushHist();const n=H.idx+dir;if(n<0||n>=H.stack.length)return;H.idx=n;const o=JSON.parse(H.stack[n]);S.active=o.active;S.started=o.started;S.stages=o.stages;UI.open=null;LAST=null;loadFont();save();renderAll();toast(dir<0?'تم التراجع':'تمت الإعادة');}
function updUndo(){$$('[data-act=undo]').forEach(b=>b.disabled=H.idx<=0);$$('[data-act=redo]').forEach(b=>b.disabled=H.idx>=H.stack.length-1);}
function setStatus(s){$$('.status').forEach(el=>{el.dataset.s=s;el.title=s==='saving'?'جارٍ الحفظ…':s==='error'?'ذاكرة المتصفح ممتلئة، احفظ ملف المشروع':'محفوظ تلقائياً';});}

/* ---------- تعديل القيم ---------- */
const bool=v=>v===true||v==='true';
function setPath(path,val){
 const [a,...r]=path.split('.'),p=P();
 if(a==='draft'){const q=blankQuestion('text',ctx().en);q.items[0].text=String(val);p.questions.push(q);p.pristine=false;
  $$('[data-k="draft"],[data-r="draft"]').forEach(el=>{if(el.dataset.k)el.dataset.k=`it.${q.id}.${q.items[0].id}.text`;else el.dataset.r=`it.${q.id}.${q.items[0].id}.text`;});return;}
 if(a==='meta'){const k=r[0];if(!(k in p.meta))return;const t=typeof p.meta[k];
  p.meta[k]=t==='number'?(+val||0):t==='boolean'?bool(val):val;
  if(k==='logoH')p.meta.logoH=Math.min(40,Math.max(8,p.meta.logoH));
  if(k==='title')p.meta.titleAuto=false;if(k==='subtitle')p.meta.subtitleAuto=false;
  if(['examKind','subject','grade'].includes(k)){autoTitles(p);syncField('meta.title',p.meta.title);syncField('meta.subtitle',p.meta.subtitle);}}
 else if(a==='show'){p.meta.show[r[0]]=bool(val);}
 else if(a==='p'){const k=r[0];p[k]=k==='size'?+val:(k==='rules'||k==='fit')?bool(val):val;}
 else if(a==='q'){const q=findQ(r[0]);if(!q)return;const f=r[1];
  if(f==='image'){if(q.image&&r[2])q.image[r[2]]=r[2]==='w'?+val:r[2]==='side'?bool(val):val;return;}
  if(f==='extra'){q.extra[+r[2]]=String(val);p.pristine=false;return;}
  if(f==='cols')val=Math.min(4,Math.max(-1,parseInt(val)));
  if(['boxed','showScore','breakBefore','shuffle'].includes(f))val=bool(val);
  q[f]=val;p.pristine=false;}
 else if(a==='it'){const q=findQ(r[0]),x=q&&q.items.find(i=>i.id===r[1]);if(!x)return;const f=r[2];
  if(f==='image'){if(x.image&&r[3])x.image[r[3]]=r[3]==='w'?+val:r[3]==='side'?bool(val):val;return;}
  if(f==='choice'){x.choices[+r[3]]=String(val);p.pristine=false;return;}
  if(f==='sub'){x.subs[+r[3]]=String(val);p.pristine=false;return;}
  if(f==='cell'){if(x.table&&x.table.rows[+r[3]])x.table.rows[+r[3]][+r[4]]=String(val);p.pristine=false;return;}
  if(f==='table'){if(x.table)x.table[r[3]]=r[3]==='align'?val:bool(val);p.pristine=false;return;}
  x[f]=f==='answerLines'?Math.min(12,Math.max(0,parseInt(val)||0)):(f==='choices'||f==='subs')?String(val).split('\n'):val;p.pristine=false;}
}
function syncField(path,v){const el=document.querySelector(`[data-b="${path}"]`);if(el&&el!==document.activeElement)el.value=v;
 const r=document.querySelector(`[data-r="${path}"]`);if(r&&r!==document.activeElement&&!r.contains(document.activeElement)){r.innerHTML=rteHTML(v);r.classList.toggle('ph-on',!String(v).trim());}}

/* ---------- الورقة والتقسيم على الصفحات ---------- */
let paperPending=false;
const GAPS={tight:[2.2,.5],normal:[2.8,1],airy:[4.6,1.9]};
function renderPaper(){
 clearTimeout(paperT);
 const ae=document.activeElement;if(composing||($('#eqdlg')&&$('#eqdlg').open)||(ae&&ae.closest&&ae.closest('#pages [data-k]'))){paperPending=true;return;}
 paperPending=false;
 const p=P();let n=layout(1),fitted=0;
 if(p.fit&&n===2)for(const s of [.96,.92,.88]){if(layout(s)===1){fitted=s;break;}}
 if(p.fit&&n===2&&!fitted)layout(1);
 const root=$('#pages'),c=ctx(),pages=$$('.page',root),tt=$$('.too-tall',root).length,cnt=p.questions.filter(q=>q.kind!=='section'&&q.kind!=='text').length;
 let wide=0;for(const pg of pages){const pin=$('.pin',pg),r=pin.getBoundingClientRect();let bad=false;
  for(const el of $$('table,.eqc,.qi,.hl,.hr>div,.subs,.cho',pin)){const b=el.getBoundingClientRect(),container=el.closest('.ix'),local=container?container.getBoundingClientRect():r;
   if(b.left<r.left-2||b.right>r.right+2||b.left<local.left-2||b.right>local.right+2){bad=true;el.classList.add('too-wide');}}
  if(bad){wide++;pg.classList.add('has-overflow');}}
 if(UI.open)$$(`#pages .qb[data-q="${UI.open}"]`).forEach(e=>e.classList.add('sel'));
 $('#pinfo').innerHTML=`<b>${pages.length===1?'صفحة واحدة':pages.length===2?'صفحتان':pages.length+' صفحات'}</b>`+(cnt?` · ${cnt} ${cnt>=3&&cnt<=10?'أسئلة':'سؤال'}`:'')+(fitted?' · مسافات مضغوطة':'')+(tt||wide?` <span class="warn">· محتوى خارج حدود الورقة، أصلحه قبل PDF</span>`:'');
 renderWriter();applyZoom();
}
function layout(scale){
 const p=P(),c=ctx(),root=$('#pages'),g=GAPS[p.density];
 root.className=paperClass(p);root.style.setProperty('--pf',FONTS[p.font].css);root.style.setProperty('--fs',Math.max(13,p.size*scale).toFixed(2)+'pt');
 root.style.setProperty('--gap',(g[0]*scale).toFixed(2)+'mm');root.style.setProperty('--rg',(g[1]*scale).toFixed(2)+'mm');
 root.innerHTML='';
 const mk=first=>{root.insertAdjacentHTML('beforeend',pageShell(p,c,first,'',flipHTML(p,c)));const el=root.lastElementChild;return{el,body:el.querySelector('.pbody'),bot:el.querySelector('.pbot')};};
 const over=b=>b.scrollHeight>b.clientHeight+1;
 let page=mk(true),n=0;
 const add=h=>{page.body.insertAdjacentHTML('beforeend',h);return page.body.lastElementChild;};
 /* تقسيم جدول الفرع بصفوفه، مع إبقاء مسارات الخلايا الأصلية والعناوين المتكررة. */
 const splitTable=(q,n,index,head)=>{
  const x=q.items[index],t=x.table;let row=0,first=true,loops=0;
  if(!t?.rows?.length)return false;
  while(row<t.rows.length&&loops++<40){
   let best=-1;
   for(let end=row+1;end<=t.rows.length;end++){
    if(first&&t.head&&t.rows.length>1&&end===1)continue;
    const part={from:row,to:end,cont:!first,last:end===t.rows.length};
    const test=add(blockHTML(q,n,c,p,index,index+1,head&&first,part));const overflow=over(page.body);test.remove();
    if(overflow)break;best=end;
   }
   if(best<0&&page.body.children.length){page=mk(false);continue;}
   if(best<0){
    const end=Math.min(t.rows.length,row+(first&&t.head?2:1));
    add(blockHTML(q,n,c,p,index,index+1,head&&first,{from:row,to:end,cont:!first,last:end===t.rows.length})).classList.add('too-tall');row=end;
   }else{
    add(blockHTML(q,n,c,p,index,index+1,head&&first,{from:row,to:best,cont:!first,last:best===t.rows.length}));row=best;
   }
   first=false;if(row<t.rows.length)page=mk(false);
  }
  return true;
 };
 for(const q of p.questions){
  if(q.kind!=='section'&&q.kind!=='text')n++;const len=q.items.length;
  if(q.breakBefore&&page.body.children.length)page=mk(false);
  let el=add(blockHTML(q,n,c,p,0,len,true));if(!over(page.body))continue;el.remove();
  if(page.body.children.length){page=mk(false);el=add(blockHTML(q,n,c,p,0,len,true));if(!over(page.body))continue;el.remove();}
  if(q.kind==='match'){add(blockHTML(q,n,c,p,0,len,true)).classList.add('too-tall');continue;}
  let start=0,head=true,gd=0;
  while(gd++<200){let best=-1;
   for(let k=start+1;k<=len;k++){const t=add(blockHTML(q,n,c,p,start,k,head));const o=over(page.body);t.remove();if(o)break;best=k;}
   if(best<0){const k=Math.min(len,start+1);if(q.items[start]?.table)splitTable(q,n,start,head);else add(blockHTML(q,n,c,p,start,k,head)).classList.add('too-tall');start=k;}else{add(blockHTML(q,n,c,p,start,best,head));start=best;}
   head=false;if(start<len)page=mk(false);else break;}
 }
 if(!p.questions.length)page.body.innerHTML='<div class="blank-writer" data-k="draft" data-rich="1" data-ph="اكتب محتواك هنا…" contenteditable="true" role="textbox" aria-label="محتوى الورقة الفارغة" aria-multiline="true" spellcheck="false"></div>';
 let pages=$$('.page',root),last=pages[pages.length-1],lb=last.querySelector('.pbot'),body=last.querySelector('.pbody');
 lb.innerHTML=footerHTML(p,c);let gg=0;
 while(over(body)&&body.children.length>1&&gg++<40){const np=mk(false);np.bot.innerHTML=footerHTML(p,c);lb.innerHTML=flipHTML(p,c);while(over(body)&&body.children.length>1)np.body.prepend(body.lastElementChild);lb=np.bot;body=np.body;}
 if(over(body))$$('.qb',body).slice(-1).forEach(e=>e.classList.add('too-tall'));
 for(const pg of $$('.page',root)){const pin=$('.pin',pg),r=pin.getBoundingClientRect();
  if([...pin.children].some(el=>el.getBoundingClientRect().bottom>r.bottom+2))pg.classList.add('too-tall');}
 pages=$$('.page',root);
 if(pages.length>1&&p.meta.show.pageNo!==false)pages.forEach((pg,i)=>pg.querySelector('.pbot').insertAdjacentHTML('beforeend',`<span class="pno">${c.D(String(i+1))} / ${c.D(String(pages.length))}</span>`));
 return pages.length;
}
function applyZoom(){const wrap=$('#zoomer'),view=$('#canvas');if(!wrap||!view)return;let z=UI.zoom;
 if(z==='fit'){const w=(view.clientWidth||innerWidth)-(desk()?64:20);z=Math.max(.3,Math.min(1.2,w/793.7));}
 wrap.style.zoom=z;$('#zval').textContent=Math.round(z*100)+'%';}

/* ---------- مكوّنات صغيرة ---------- */
const FILE='M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6';
const IC={'undo-2':'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11','redo-2':'m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13','ellipsis-vertical':'M12 5h.01M12 12h.01M12 19h.01','ellipsis':'M5 12h.01M12 12h.01M19 12h.01',
 'wand-sparkles':'M3 21 14 10M15 3v3M15 12v3M11 7.5H8M22 7.5h-3M18.5 4l-1.5 1.5M18.5 11 17 9.5','download':'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3','upload':'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
 'folder-open':'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','folder':'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
 'file-down':FILE+'M12 12v6M9 15l3 3 3-3','file-plus-2':FILE+'M12 12v6M9 15h6','file-text':FILE+'M8 13h8M8 17h5','list-ordered':'M10 6h11M10 12h11M10 18h11M4 4v4M3 18h3l-3 3h3M3 12h2',
 'eye':'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6','eye-off':'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.7M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6',
 'palette':'M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.8-.6-1.2-.6-2s.7-1.4 1.5-1.4H17a4 4 0 0 0 4-4c0-5-4-9-9-9zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01','minus':'M5 12h14','plus':'M12 5v14M5 12h14','x':'M18 6 6 18M6 6l12 12',
 'chevron-down':'m6 9 6 6 6-6','chevron-up':'m18 15-6-6-6 6','arrow-up':'M12 19V5M5 12l7-7 7 7','arrow-down':'M12 5v14M19 12l-7 7-7-7','arrow-right':'M5 12h14M12 5l7 7-7 7','arrow-left':'M19 12H5M12 19l-7-7 7-7',
 'copy':'M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1','trash-2':'M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
 'sigma':'M18 7V4H6l6 8-6 8h12v-3','image-plus':'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7M16 5h6M19 2v6M21 15l-5-5L5 21M9 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2','pencil':'M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z',
 'layout-grid':'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z','rotate-ccw':'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5','locate-fixed':'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2v4M12 18v4M2 12h4M18 12h4','check':'M20 6 9 17l-5-5',
 'type':'M4 7V4h16v3M9 20h6M12 4v16','settings-2':'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6','panel-top':'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 9h18',
 'panel-bottom':'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 15h18','text':'M17 6H3M21 12H3M15 18H3','layout-template':'M3 3h18v7H3zM3 14h9v7H3zM16 14h5v7h-5z','file-plus':FILE+'M12 12v6M9 15h6'};
IC.omega='M4 20h4.5v-2.2A7 7 0 1 1 15.5 17.8V20H20';IC.table='M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M3 15h18M9 3v18M15 3v18';
IC.bold='M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z';IC.underline='M7 4v6a5 5 0 0 0 10 0V4M5 20h14';IC['link-2']='M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8';
const ic=(n,s=18)=>`<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[n]||IC.plus}"/></svg>`;
const seg=(path,cur,opts,cls='')=>`<div class="seg ${cls}" role="group">${opts.map(([v,l])=>`<button type="button" data-act="set" data-path="${path}" data-v="${v}" aria-pressed="${String(cur)===String(v)}">${l}</button>`).join('')}</div>`;
const inp=(path,val,o={})=>o.area?`<textarea data-b="${path}" rows="${o.rows||1}" placeholder="${esc(o.ph||'')}" dir="auto">${esc(val)}</textarea>`:`<input data-b="${path}" value="${esc(val)}" placeholder="${esc(o.ph||'')}" dir="auto"${o.cls?` class="${o.cls}"`:''}${o.type?` type="${o.type}" inputmode="decimal"`:''}>`;
const fld=(label,path,val,o={})=>`<label class="fld${o.w?' '+o.w:''}"><span>${label}</span>${inp(path,val,o)}</label>`;
const chk=(label,path,val)=>`<label class="chk"><input type="checkbox" data-b="${path}"${val?' checked':''}><span>${label}</span></label>`;
const eye=(k,on)=>`<button type="button" class="eye" data-act="eye" data-k="${k}" aria-pressed="${on}" title="${on?'ظاهر في الورقة، اضغط للإخفاء':'مخفي، اضغط للإظهار'}">${ic(on?'eye':'eye-off',17)}</button>`;
const sec=(title,body,open=true,icon='')=>`<details class="sec"${open?' open':''}><summary>${icon?ic(icon,18):''}<span>${title}</span>${ic('chevron-down',18)}</summary><div class="sec-b">${body}</div></details>`;

/* ---------- لوحة الأسئلة ---------- */
function questionsView(p,c){
 let n=0;
 const rows=p.questions.map((q,i)=>{if(q.kind!=='section'&&q.kind!=='text')n++;const open=UI.open===q.id,num=q.kind==='section'?'§':q.kind==='text'?'نص':(q.title.trim()||qnum(n,c,p));
  return`<li class="qc${open?' open':''}" data-qid="${q.id}"><button type="button" class="qc-h" data-act="toggle" data-q="${q.id}" aria-expanded="${open}">
   <span class="qbadge">${esc(num)}</span><span class="qc-t">${esc(q.prompt||(q.items[0]&&q.items[0].text)||'سؤال بلا نص').replace(/\$+[^$]*\$+/g,'∑')}</span>${q.showScore&&q.score?`<span class="qc-s">${esc(scoreText(q.score,c.en,c.D,false))}</span>`:''}${ic(open?'chevron-up':'chevron-down',18)}</button>
   ${open?qEditor(q,c,i,p):''}</li>`;}).join('');
 return`<div class="pad">
  <div class="bar"><h2>المحتوى</h2><button type="button" class="btn soft" data-act="adding">${ic(UI.adding?'x':'plus',18)}${UI.adding?'إغلاق':'إضافة'}</button></div>
  ${UI.adding?addSheet():''}
  ${p.questions.length?`<ol class="qlist">${rows}</ol>`:`<div class="empty write-welcome"><b>ابدأ بمحتواك، مو بمثال جاهز</b><span>اكتب مباشرة على الورقة، أو أضف سؤالاً فارغاً واختر نوعه.</span><button type="button" class="btn primary" data-act="startWriting">الكتابة على الورقة</button><button type="button" class="text-link" data-act="demo">فتح تجربة بأمثلة</button></div>`}
 </div>`;
}
const addSheet=()=>`<div class="addsheet">${Object.entries(KIND_INFO).map(([k,[t,d]])=>`<button type="button" class="kind" data-act="addQ" data-kind="${k}"><b>${t}</b><small>${d}</small></button>`).join('')}</div>`;
function imgCtl(img,path){
 return`<div class="imgctl"><img src="${img.src}" alt=""><div class="imgctl-b">
  <label class="rng"><span>الحجم <b>${img.w}%</b></span><input type="range" min="10" max="100" step="5" value="${img.w}" data-b="${path}.image.w"></label>
  <div class="row">${seg(`${path}.image.align`,img.align,[['start','يمين'],['center','وسط'],['end','يسار']],'sm')}${chk('بجانب النص',`${path}.image.side`,img.side)}</div></div>
  <button type="button" class="ib danger" data-act="imgDel" data-path="${path}" title="حذف الصورة">${ic('trash-2',17)}</button></div>`;
}
/* محرر نصي غني صغير: نص عادي، عريض، تسطير، ومعادلات تظهر داخل السطر كما في وورد */
const rteHTML=t=>richHTML(t,x=>x,'ar',true);
const rte=(path,val,ph='',cls='')=>`<div class="rte${cls?' '+cls:''}${String(val||'').trim()?'':' ph-on'}" role="textbox" aria-label="${esc(ph||'نص قابل للتحرير')}" aria-multiline="true" contenteditable="true" data-r="${path}" data-ph="${esc(ph)}" dir="auto" spellcheck="false">${rteHTML(val)}</div>`;
function itemTools(path,x,q,i){
 return`<div class="iact">
  <button type="button" class="tag keep" data-act="eq" data-for="${path}.text">${ic('sigma',16)}معادلة</button>
  <button type="button" class="tag keep" data-act="symOpen">${ic('omega',16)}رمز</button>
  <button type="button" class="tag" data-act="img" data-path="${path}">${ic('image-plus',16)}صورة</button>
  <button type="button" class="tag${UI.more[x.id]?' on':''}" data-act="more" data-i="${x.id}">${ic('ellipsis',16)}المزيد</button></div>`;
}
function choicesEd(path,x,c){
 const ch=x.choices.length?x.choices:[];
 return`<div class="chs">${ch.map((s,j)=>`<div class="chr"><span class="chn">${esc(c.L(j))}</span>${rte(`${path}.choice.${j}`,s,c.en?'Choice':'الخيار')}<button type="button" class="ib sm" data-act="chDel" data-path="${path}" data-j="${j}" title="حذف الخيار">${ic('x',16)}</button></div>`).join('')}
  <button type="button" class="ghost sm" data-act="chAdd" data-path="${path}">${ic('plus',16)}خيار</button></div>`;
}
function tableEd(path,t){
 const pos=UI.tableCells[path]||[0,0],r=Math.min(pos[0],t.rows.length-1),c=Math.min(pos[1],t.rows[0].length-1);
 return`<div class="tbed"><div class="tbed-g" style="--tc:${t.rows[0].length}">${t.rows.map((r,i)=>r.map((v,j)=>rte(`${path}.cell.${i}.${j}`,v,t.head&&i===0?'عنوان':'',t.head&&i===0?'th':'')).join('')).join('')}</div>
  <div class="tbed-a"><button type="button" class="tb" data-act="tbRow" data-path="${path}" data-d="1" title="إضافة صف">${ic('plus',15)}صف</button><button type="button" class="tb" data-act="tbRow" data-path="${path}" data-d="-1" title="حذف آخر صف"${t.rows.length<2?' disabled':''}>${ic('minus',15)}صف</button>
  <button type="button" class="tb" data-act="tbCol" data-path="${path}" data-d="1" title="إضافة عمود"${t.rows[0].length>=8?' disabled':''}>${ic('plus',15)}عمود</button><button type="button" class="tb" data-act="tbCol" data-path="${path}" data-d="-1" title="حذف آخر عمود"${t.rows[0].length<2?' disabled':''}>${ic('minus',15)}عمود</button>
  <span class="sp"></span><button type="button" class="tb danger" data-act="tbDel" data-path="${path}" title="حذف الجدول">${ic('trash-2',15)}</button></div>
  <div class="row wrap">${chk('الصف الأول عناوين',`${path}.table.head`,t.head)}${chk('بعرض السطر كاملاً',`${path}.table.full`,t.full)}</div>
  <div class="opt"><span>محاذاة خلايا الجدول</span>${seg(path+'.table.align',t.align||'center',[['right','يمين'],['center','وسط'],['left','يسار']],'sm')}</div>
  <details class="table-edit-more"><summary>التحكم بالصف والعمود المحدد</summary><p class="hint" data-cell-info="${path}">الصف ${r+1}، العمود ${c+1}. اضغط على خلية لتحديدها.</p>
  <div class="table-actions">${[['rowBefore','صف قبله'],['rowAfter','صف بعده'],['colBefore','عمود قبله'],['colAfter','عمود بعده'],['delRow','حذف الصف'],['delCol','حذف العمود']].map(([op,label])=>`<button type="button" class="btn sm${op.startsWith('del')?' danger-t':''}" data-act="tbEdit" data-path="${path}" data-op="${op}">${label}</button>`).join('')}</div></details></div>`;
}
function subsEd(path,x,c){
 return`<div class="fld"><span>فقرات داخل الفرع</span>${x.subs.map((v,j)=>`<div class="chr"><span class="chn">${esc(c.lab(x.subLabel,j))}</span>${rte(path+'.sub.'+j,v,'فقرة داخلية')}<button type="button" class="ib sm" data-act="subDel" data-path="${path}" data-j="${j}" title="حذف الفقرة">${ic('x',16)}</button></div>`).join('')}
 <button type="button" class="ghost sm" data-act="subAdd" data-path="${path}">${ic('plus',16)}فقرة داخلية</button></div>`;
}
function qEditor(q,c,qi,p){
 const foot=`<div class="qfoot"><button type="button" class="ib" data-act="qUp" data-q="${q.id}" title="نقل للأعلى"${qi===0?' disabled':''}>${ic('arrow-up')}</button><button type="button" class="ib" data-act="qDown" data-q="${q.id}" title="نقل للأسفل"${qi===p.questions.length-1?' disabled':''}>${ic('arrow-down')}</button><button type="button" class="ib" data-act="qDup" data-q="${q.id}" title="تكرار">${ic('copy')}</button><span class="sp"></span><button type="button" class="btn danger-t" data-act="qDel" data-q="${q.id}">${ic('trash-2',16)}حذف السؤال</button></div>`;
 if(q.kind==='section')return`<div class="qed"><div class="row">${fld('عنوان القسم',`q.${q.id}.prompt`,q.prompt)}${fld('الدرجة',`q.${q.id}.score`,q.score,{w:'xs',type:'text'})}</div>${foot}</div>`;
 const isM=q.kind==='match',ph=c.en?'Type here':'اكتب هنا';
 const items=q.items.map((x,i)=>{const path=`it.${q.id}.${x.id}`,more=UI.more[x.id],isMcq=q.kind==='mcq'||x.choices.length;
  const order=`<div class="tools"><button type="button" class="tb" data-act="itUp" data-q="${q.id}" data-i="${x.id}"${i===0?' disabled':''} title="للأعلى">${ic('chevron-up',16)}</button><button type="button" class="tb" data-act="itDown" data-q="${q.id}" data-i="${x.id}"${i===q.items.length-1?' disabled':''} title="للأسفل">${ic('chevron-down',16)}</button><button type="button" class="tb danger" data-act="itDel" data-q="${q.id}" data-i="${x.id}" title="حذف">${ic('trash-2',16)}</button></div>`;
  if(isM)return`<li class="item mi" data-iid="${x.id}"><div class="mrow"><span class="ibadge">${esc(c.lab(q.label==='none'?'n-dot':q.label,i))}</span>${rte(path+'.text',x.text,c.en?'Column A':'العمود (أ)')}<span class="mlink" aria-hidden="true">${ic('arrow-left',16)}</span>${rte(path+'.pair',x.pair,c.en?'Its match':'ما يناسبه في (ب)')}</div><div class="mrow-a"><button type="button" class="tag" data-act="img" data-path="${path}">${ic('image-plus',16)}صورة</button>${order}</div>${x.image?imgCtl(x.image,path):''}</li>`;
  return`<li class="item" data-iid="${x.id}">
   <div class="item-r"><span class="ibadge">${esc(c.lab(q.label,i)||'•')}</span>${rte(path+'.text',x.text,c.en?'Branch text':'نص الفرع، والمعادلة تُدرج في أي موضع منه')}</div>
   ${isMcq?choicesEd(path,x,c):''}
   ${itemTools(path,x,q,i)}
   ${more?`<div class="drawer">
    ${isMcq?'':`<div class="row wrap"><button type="button" class="btn soft sm" data-act="chAdd" data-path="${path}">${ic('list-ordered',16)}إضافة خيارات</button></div>`}
    ${x.table?tableEd(path,x.table):`<button type="button" class="btn soft sm tbadd" data-act="tbAdd" data-path="${path}">${ic('table',16)}إدراج جدول</button>`}
    ${subsEd(path,x,c)}
    <div class="opt"><span>محاذاة نص الفرع</span>${seg(path+'.align',x.align||'auto',[['auto','تلقائي'],['right','يمين'],['center','وسط'],['left','يسار']],'sm')}</div>
    <div class="opt"><span>مساحة للإجابة بعد الفرع</span>${seg(path+'.answerLines',x.answerLines||0,[[0,'بلا'],[2,'سطران'],[4,'٤ أسطر'],[6,'٦ أسطر']],'sm')}</div>
    <div class="row al-end">${fld('درجة الفرع',path+'.score',x.score,{w:'xs',ph:'10'})}${order}</div>
   </div>`:''}
   ${x.image?imgCtl(x.image,path):''}
  </li>`;}).join('');
 const hasCh=q.kind==='mcq'||q.items.some(x=>x.choices.some(s=>s.trim()));
 const chOpts=hasCh?`<div class="opt"><span>مكان الخيارات</span>${seg(`q.${q.id}.chLayout`,q.chLayout,[['inline','بين قوسين بعد السؤال'],['line','في سطر مستقل'],['grid','أعمدة'],['stack','كل خيار في سطر']],'sm')}</div>
   <div class="opt"><span>شكل الخيارات</span>${seg(`q.${q.id}.chStyle`,q.chStyle,[['letters',c.en?'a- b-':'أ- ب-'],['dash','بلا حروف'],['plain','مفصولة بنقطة']],'sm')}</div>`:'';
 const mOpts=isM?`<div class="opt"><span>شكل الوصل</span>${seg(`q.${q.id}.mStyle`,q.mStyle,[['table','جدول بأقواس للإجابة'],['lists','عمودان للتوصيل بخط']],'sm')}</div>
   ${chk('خلط ترتيب العمود (ب) تلقائياً',`q.${q.id}.shuffle`,q.shuffle)}
   <div class="row">${fld('عنوان العمود الأول',`q.${q.id}.colA`,q.colA,{ph:c.en?'Column A':'العمود (أ)'})}${fld('عنوان العمود الثاني',`q.${q.id}.colB`,q.colB,{ph:c.en?'Column B':'العمود (ب)'})}</div>`:'';
 return`<div class="qed">
  <div class="fld"><span>نص السؤال</span>${rte(`q.${q.id}.prompt`,q.prompt,'مثل: عرّف خمساً مما يأتي:')}</div>
  <div class="row al-end">${fld('الدرجة',`q.${q.id}.score`,q.score,{w:'xs',ph:'10'})}<label class="chk"><input type="checkbox" data-b="q.${q.id}.showScore"${q.showScore?' checked':''}><span>إظهار الدرجة</span></label><span class="sp"></span><button type="button" class="ib keep" data-act="eq" data-for="q.${q.id}.prompt" title="معادلة في نص السؤال">${ic('sigma',18)}</button><button type="button" class="ib" data-act="img" data-path="q.${q.id}" title="صورة للسؤال">${ic('image-plus',18)}</button></div>
  ${q.image?imgCtl(q.image,`q.${q.id}`):''}
  <div class="sub-h">${isM?'أزواج الوصل: كل سطر عبارة وما يقابلها':'الأفرع والفقرات'}</div>
  <ol class="items">${items}</ol>
  ${isM?`<div class="fld"><span>إجابات زائدة في العمود (ب) للتمويه</span>${q.extra.map((v,k)=>`<div class="chr">${rte(`q.${q.id}.extra.${k}`,v,'إجابة زائدة')}<button type="button" class="ib sm" data-act="exDel" data-q="${q.id}" data-j="${k}" title="حذف">${ic('x',16)}</button></div>`).join('')}<button type="button" class="ghost sm" data-act="exAdd" data-q="${q.id}">${ic('plus',16)}إجابة زائدة</button></div>`:''}
  <div class="row2"><button type="button" class="ghost" data-act="addItem" data-q="${q.id}">${ic('plus',17)}${isM?'إضافة زوج':'إضافة فرع'}</button>${isM?'':`<button type="button" class="ghost" data-act="addEqItem" data-q="${q.id}">${ic('sigma',17)}فرع معادلة</button>`}</div>
  <details class="sec in"${UI.lay[q.id]?' open':''} data-lay="${q.id}"><summary>${ic('layout-grid',17)}<span>ترتيب السؤال</span>${ic('chevron-down',17)}</summary><div class="sec-b">
   ${isM?mOpts:`<div class="opt"><span>توزيع الأفرع</span>${seg(`q.${q.id}.cols`,q.cols,[[-1,'تلقائي'],[1,'سطر لكل فرع'],[2,'عمودان'],[3,'٣'],[4,'٤']],'sm')}</div>`}
   <div class="opt"><span>الترقيم</span>${seg(`q.${q.id}.label`,q.label,Object.keys(LABELS).map(k=>[k,k==='none'?'بلا':c.lab(k,0)]),'sm')}</div>
   ${chOpts}
   <div class="row wrap">${isM?'':chk('الأفرع داخل مربعات',`q.${q.id}.boxed`,q.boxed)}${chk('يبدأ في صفحة جديدة',`q.${q.id}.breakBefore`,q.breakBefore)}</div>
   ${fld('رقم مخصص (اختياري)',`q.${q.id}.title`,q.title,{w:'sm',ph:qnum(qi+1,c,p)})}
  </div></details>
  ${foot}
 </div>`;
}

/* ---------- لوحة الورقة: كل عنصر أمامه زر إظهار وإخفاء ---------- */
function rowF(k,label,body){const m=P().meta,on=m.show[k]!==false;return`<div class="frow${on?'':' off'}">${eye(k,on)}<div class="frow-b"><span class="frow-l">${label}</span>${body}</div></div>`;}
function paperView(p,c){
 const m=p.meta;
 return`<div class="pad">
  <div class="bar"><h2>الورقة</h2><button type="button" class="btn soft" data-act="wizard">${ic('wand-sparkles',17)}المرحلة والمادة</button></div>
  <div class="summary"><span>${STAGES[S.active].label}</span><span>${esc(m.grade)}</span><span>${esc(m.subject)}</span><span>${esc(m.examKind)}${hasRound(m.examKind)?' · '+esc(m.round):''}</span></div>
  ${sec('الترويسة',`
   ${rowF('country','السطر الأول',inp('meta.country',m.country))}
   ${rowF('ministry','السطر الثاني',inp('meta.ministry',m.ministry))}
   ${rowF('directorate','السطر الثالث',inp('meta.directorate',m.directorate,{ph:'المديرية العامة للتربية'}))}
   ${rowF('school','المدرسة',`<div class="pair">${inp('meta.schoolLabel',m.schoolLabel,{cls:'lb'})}${inp('meta.school',m.school,{ph:'تبقى نقاطاً إن تُركت'})}</div>`)}
   ${rowF('logo','الشعار',m.logo?`<div class="logo-row"><img src="${m.logo}" alt=""><label class="rng"><span>الارتفاع <b>${m.logoH}</b> ملم</span><input type="range" min="8" max="40" value="${m.logoH}" data-b="meta.logoH"></label><button type="button" class="ib" data-act="logoReset" title="إرجاع الموضع">${ic('locate-fixed',17)}</button><button type="button" class="ib danger" data-act="logoDel" title="إزالة">${ic('trash-2',17)}</button></div><p class="hint">اسحب الشعار داخل الورقة لتحريكه، ومن زاويته لتغيير حجمه.</p>`:`<button type="button" class="btn soft sm" data-act="logo">${ic('image-plus',16)}رفع شعار</button>`)}
   ${rowF('title','العنوان',`<div class="pair">${inp('meta.title',m.title)}${m.titleAuto?'':`<button type="button" class="ib" data-act="autoTitle" title="عنوان تلقائي">${ic('rotate-ccw',17)}</button>`}</div>`)}
   ${rowF('subtitle','الصف، يسار الترويسة',`<div class="pair">${inp('meta.subtitle',m.subtitle)}${m.subtitleAuto?'':`<button type="button" class="ib" data-act="autoSub" title="تلقائي">${ic('rotate-ccw',17)}</button>`}</div>`)}
   ${hasRound(m.examKind)?rowF('round','الدور',seg('meta.round',m.round,[['الدور الأول','الأول'],['الدور الثاني','الثاني']],'sm')):''}
   ${rowF('subject','المادة',`<div class="pair">${inp('meta.subjectLabel',m.subjectLabel,{cls:'lb'})}${inp('meta.subject',m.subject)}</div>`)}
   ${rowF('year','العام الدراسي، وسط الترويسة',`<div class="pair">${inp('meta.yearLabel',m.yearLabel,{cls:'lb'})}${inp('meta.year',m.year)}</div>`)}
   ${rowF('time','الوقت',`<div class="pair">${inp('meta.timeLabel',m.timeLabel,{cls:'lb'})}${inp('meta.time',m.time,{ph:'ساعتان'})}</div>`)}
   ${rowF('hijri','التاريخ الهجري',inp('meta.hijri',m.hijri,{ph:'١٤٤٨ هـ'}))}`,true,'panel-top')}
  ${sec('تحت الترويسة',`
   ${rowF('name','سطر اسم الطالب',inp('meta.nameLabel',m.nameLabel))}
   ${rowF('note','الملاحظة',`<div class="pair">${inp('meta.noteLabel',m.noteLabel,{cls:'lb'})}${inp('meta.note',m.note,{area:1,ph:'الإجابة عن خمسة أسئلة فقط'})}</div>`)}`,false,'text')}
  ${sec('التذييل',`
   ${rowF('closing','العبارة الختامية',inp('meta.closing',m.closing))}
   ${rowF('teacher','التوقيع',`<div class="pair">${inp('meta.teacherLabel',m.teacherLabel,{cls:'lb'})}${inp('meta.teacher',m.teacher,{ph:'تبقى نقاطاً إن تُركت'})}</div>`)}
   ${rowF('footLeft','توقيع ثانٍ',`<div class="pair">${inp('meta.footLeftLabel',m.footLeftLabel,{cls:'lb',ph:'لجنة المادة:'})}${inp('meta.footLeft',m.footLeft)}</div>`)}
   ${rowF('flip','نهاية الصفحة غير الأخيرة',inp('meta.flip',m.flip))}
   ${rowF('pageNo','أرقام الصفحات','<span class="hint">تظهر عند وجود أكثر من صفحة</span>')}`,false,'panel-bottom')}
  ${sec('الملف',`<div class="row wrap"><button type="button" class="btn" data-act="save">${ic('download',17)}حفظ المشروع</button><button type="button" class="btn" data-act="open">${ic('folder-open',17)}فتح مشروع</button><button type="button" class="btn" data-act="new">${ic('file-plus-2',17)}ورقة فارغة</button></div><p class="hint">التصدير النهائي PDF من زر PDF. ملف المشروع يحفظ عملك لتكمل تحريره لاحقاً.</p>`,false,'folder')}
 </div>`;
}

/* ---------- لوحة التنسيق ---------- */
function styleView(p,c){
 return`<div class="pad">
  <div class="bar"><h2>التنسيق</h2></div>
  ${sec('الثيمات',`<div class="themes">${Object.entries(THEMES).map(([k,t])=>`<button type="button" class="theme th-${k}" data-act="set" data-path="p.theme" data-v="${k}" aria-pressed="${p.theme===k}"><span class="sw"><span style="background:var(--p)"></span><span style="background:var(--score)"></span><span style="background:var(--soft);border:1px solid var(--line)"></span></span><b>${t.label}</b></button>`).join('')}</div>`,true,'palette')}
  ${sec('الخط',`<div class="fonts">${Object.entries(FONTS).filter(([k])=>k!=='custom'||p.customFont).map(([k,f])=>`<button type="button" data-act="set" data-path="p.font" data-v="${k}" aria-pressed="${p.font===k}"><span style="font-family:${f.css.replace(/"/g,'&quot;')}">أبجد هوز Abc</span><small>${k==='custom'?esc(p.customFont.name):f.label}</small></button>`).join('')}</div>
   <button type="button" class="btn soft sm" data-act="font">${ic('upload',16)}${p.customFont?'تبديل الخط المرفوع':'رفع خط خاص'}</button>
   <div class="opt"><span>حجم الخط</span>${seg('p.size',p.size,[[13,'13'],[14,'14'],[15,'15']])}</div>
   <div class="opt"><span>المسافات</span>${seg('p.density',p.density,[['tight','مضغوطة'],['normal','متوازنة'],['airy','واسعة']])}</div>
   ${chk('ملاءمة تلقائية لتتسع الأسئلة في صفحة واحدة','p.fit',p.fit)}
   <p class="hint">تُضغط المسافات عند الحاجة. حجم النص لا ينزل عن ١٣، والمحتوى الزائد ينتقل لصفحة جديدة.</p>`,true,'type')}
  ${sec('متقدم',`<div class="opt"><span>الأرقام والحروف</span>${seg('p.digits',p.digits,[['auto','تلقائي'],['arabic','١ ، أ'],['latin','1 ، A']],'sm')}</div>
   <p class="hint">التلقائي: الابتدائية عربي عدا الإنكليزية، والمتوسطة والإعدادية إنكليزي عدا الإسلامية والعربية والاجتماعيات والتاريخ والجغرافية والاقتصاد.</p>
   <div class="opt"><span>اتجاه الأسئلة</span>${seg('p.dir',p.dir,[['auto','تلقائي'],['rtl','عربي'],['ltr','English']],'sm')}</div>
   <div class="opt"><span>رقم السؤال</span>${seg('p.qStyle',p.qStyle,Object.keys(QSTYLES).map(k=>[k,qnum(1,c,{qStyle:k})]),'sm')}</div>`,false,'settings-2')}
 </div>`;
}
function renderSide(){
 const p=P(),c=ctx(),body=$('#sideBody'),st=body.scrollTop,v=['preview','write'].includes(UI.view)?'questions':UI.view;
 $$('[data-act=view]').forEach(b=>b.setAttribute('aria-current',String(b.closest('.nav')?b.dataset.v===UI.view:b.dataset.v===v)));
 body.innerHTML=v==='paper'?paperView(p,c):v==='style'?styleView(p,c):questionsView(p,c);
 body.scrollTop=st;$$('textarea',body).forEach(grow);icons();updUndo();
 $('#app').dataset.view=UI.view;
}
const grow=t=>{t.style.height='auto';t.style.height=Math.min(t.scrollHeight+2,300)+'px';};
const icons=()=>{$$('i[data-lucide]').forEach(el=>{el.outerHTML=ic(el.dataset.lucide,+el.getAttribute('width')||18);});$$('button[title]').forEach(b=>{if(!b.hasAttribute('aria-label'))b.setAttribute('aria-label',b.title);});};
function renderAll(){renderSide();renderPaper();}
function renderWriter(){
 const host=$('#mobileWriter');if(!host)return;
 if(UI.view!=='write'||desk()){host.innerHTML='';return;}
 if(host.contains(document.activeElement)||$('#eqdlg').open)return;
 const p=P(),c=ctx();let n=0;
 const text=p.questions.map(q=>{
  if(!['text','section'].includes(q.kind))n++;
  const heading=q.kind==='text'?'':q.kind==='section'?'عنوان قسم':qnum(n,c,p);
  return`<div class="write-question">${heading?`<h3>${esc(heading)}</h3>`:''}${q.kind!=='text'?rte(`q.${q.id}.prompt`,q.prompt,'عنوان السؤال'):''}
   ${q.items.map(x=>rte(`it.${q.id}.${x.id}.text`,x.text,'اكتب هنا…')+x.choices.map((v,j)=>`<div class="chr"><span class="chn">${esc(c.L(j))}</span>${rte(`it.${q.id}.${x.id}.choice.${j}`,v,'خيار')}</div>`).join('')+(q.kind==='match'?rte(`it.${q.id}.${x.id}.pair`,x.pair,'ما يقابله'): '')+(x.table?tableEd(`it.${q.id}.${x.id}`,x.table):'')).join('')}</div>`;
 }).join('');
 host.innerHTML=`<div class="sheet-meta">${esc(p.meta.grade)} · ${esc(p.meta.subject)}<br>${esc(p.meta.examKind)} · ${esc(p.meta.year)}</div>${p.questions.length?text:rte('draft','','اكتب محتواك هنا…')}<div class="sheet-note">الكتابة بحجم مريح. افتح «المعاينة» لرؤية ورقة A4 كما تُطبع.</div>`;
}
function setView(v){document.activeElement?.blur();UI.view=v;renderSide();$('#sideBody').scrollTop=0;requestAnimationFrame(renderPaper);}
function startWriting(){
 if(!P().questions.length){setView('write');requestAnimationFrame(()=>$(desk()?'[data-k="draft"]':'#mobileWriter [data-r="draft"]')?.focus());return;}
 setView('write');requestAnimationFrame(()=>$(desk()?'#pages [data-k^="it."]':'#mobileWriter [data-r^="it."]')?.focus());
}
function writerTarget(){
 const last=LAST&&document.body.contains(LAST.el)?LAST:null;if(last)return last;
 const draft=$(desk()?'#pages [data-k="draft"]':'#mobileWriter [data-r="draft"]');if(draft){draft.focus();return{el:draft,range:null};}return null;
}

/* ---------- معالج البداية: مرحلة ← صف ومادة ← تفاصيل ---------- */
const LESSONS=[
 ['الترويسة أولاً','افتح «الورقة» وعدّل المدرسة والصف واسم المدرّس. جرّب زر العين لإخفاء أي عنصر؛ السنة في الوسط والصف يسار.','paper'],
 ['اكتب السؤال وأفرعه','افتح «المحتوى»، واضغط السؤال الأول وعدّل عبارته. أضف فرعاً أو سؤالاً جديداً؛ هذا النموذج للتعلّم ومسموح تغييره بالكامل.','questions'],
 ['معادلة داخل الجملة','ضع المؤشر داخل نص فرع، واضغط «معادلة». اختر كسراً أو جذراً واملأ خاناته، ثم أدرجه؛ اضغط المعادلة لاحقاً لتعديلها.','questions'],
 ['رتّب الخيارات والجداول','من «ترتيب السؤال» غيّر مكان الخيارات إلى سطر مستقل. من «المزيد» أدرج جدولاً أو مساحة للإجابة، ثم جرّب التراجع.','questions'],
 ['راجع الورقة واحفظها','افتح «المعاينة» على الهاتف أو راقب الورقة على الحاسوب. عالج أي تحديد أحمر، ثم PDF للطباعة و«حفظ ملف المشروع» لمتابعة العمل لاحقاً.','preview']
];
let lessonIndex=0;
let realSession=null,lessonSession=null;
function startLesson(){
 if(DEMO)return;
 save();pushHist();realSession={state:JSON.parse(JSON.stringify(S)),history:{stack:[...H.stack],idx:H.idx},view:UI.view};
 clearTimeout(saveT);clearTimeout(histT);clearTimeout(paperT);
 const demo=lessonSession||{active:'primary',started:true,stages:Object.fromEntries(Object.keys(STAGES).map(k=>[k,makeProject(k,false)]))};
 Object.assign(S,JSON.parse(JSON.stringify(demo)));DEMO=true;H.stack=[];H.idx=-1;LAST=null;UI.open=P().questions[0]?.id;UI.adding=false;lessonIndex=0;
 $('#welcome').hidden=true;document.body.classList.add('demo-mode');$('.brand b').textContent='المفيد · تعليم';$('.brand small').textContent='تجربة قابلة للتعديل';$('#app').classList.add('has-lesson');
 loadFont();renderLesson();pushHist();
}
function endLesson(){
 if(!DEMO)return;
 lessonSession=JSON.parse(JSON.stringify(S));clearTimeout(saveT);clearTimeout(histT);clearTimeout(paperT);
 if(realSession){Object.assign(S,realSession.state);H.stack=realSession.history.stack;H.idx=realSession.history.idx;}
 DEMO=false;realSession=null;LAST=null;UI.open=null;$('#lessonBar').hidden=true;$('#lessonBar').innerHTML='';$('#app').classList.remove('has-lesson');document.body.classList.remove('demo-mode');$('.brand b').textContent='المفيد';$('.brand small').textContent='في تنضيد الامتحانات';loadFont();renderAll();
}
function renderLesson(){
 const [title,text,v]=LESSONS[lessonIndex],bar=$('#lessonBar');bar.hidden=false;
 bar.innerHTML=`<p><strong>${lessonIndex+1} / ${LESSONS.length} · ${title}</strong><br>${text}</p><button type="button" class="btn sm" data-act="lessonPrev"${lessonIndex===0?' disabled':''}>السابق</button><button type="button" class="btn primary sm" data-act="lessonNext"${lessonIndex===LESSONS.length-1?' disabled':''}>التالي</button><button type="button" class="btn sm" data-act="home">مشروعي</button>`;
 UI.view=v==='preview'&&desk()?'questions':v;renderAll();
}
function showWelcome(){
 if(DEMO)endLesson();
 document.activeElement?.blur();const host=$('#welcome');host.hidden=false;
 const features=[
 ['ترويسة عراقية، بترتيبك','الدولة والمديرية والمدرسة والصف والسنة والشعار. عدّل التفاصيل أو أخفِ ما لا تحتاجه.'],
 ['أسئلة بأكثر من شكل','تعريفات وفراغات واختيارات وأفرع ووصل. رتّب الأفرع القصيرة في أعمدة أو خصص سطراً لكل فرع.'],
 ['المعادلة بمكانها','كسور وجذور وأسُس وقسمة طويلة، ورموز للفيزياء والكيمياء، داخل الجملة أو في فرع مستقل.'],
 ['جداول ومساحات إجابة','اكتب في الخلايا، أضف الصفوف والأعمدة، ووزّع الجدول الطويل على الصفحات مع عناوينه.'],
 ['راجع قبل الطباعة','معاينة A4 وتنبيه عند تجاوز الحدود، ثم إخراج PDF من طباعة المتصفح.'],
 ['شغلك يبقى إلك','حفظ محلي، وملف مشروع للرجوع لاحقاً، وتراجع عن التعديلات. ما يحتاج إنشاء حساب.']
 ];
 host.innerHTML=`<div class="welcome-inner"><nav class="welcome-nav" aria-label="تنقل البداية"><div class="welcome-brand"><span class="mark">م</span><span>المفيد<br><small>في تنضيد الامتحانات</small></span></div><div class="welcome-actions"><button type="button" class="btn sm" data-act="homeLearn">دليل الاستخدام</button>${S.started?'<button type="button" class="btn sm" data-act="continueProject">متابعة مشروعي</button>':''}</div></nav>
 <section class="welcome-hero"><div><p class="eyebrow">تنضيد أوراق الامتحانات العراقية</p><h1>المفيد<span>في تنضيد الامتحانات</span></h1><p class="intro">أسئلتك، بترتيب واضح وجاهز للطباعة.<br>جهّز الترويسة، أضف الأسئلة، وراجع الورقة قبل إخراجها بصيغة PDF.</p><div class="welcome-actions"><button type="button" class="btn primary" data-act="homeNew">${ic('plus',18)}مشروع جديد</button><button type="button" class="btn" data-act="demo">${ic('pencil',18)}جرّب وتعلّم</button><button type="button" class="btn" data-act="homeOpen">${ic('folder-open',18)}فتح ملف مشروع</button></div><p class="trust">لا يحتاج حساباً. ملفاتك تبقى على جهازك.</p></div>
 <div class="welcome-preview" aria-label="مثال توضيحي لورقة امتحان"><header>أسئلة امتحان الشهر الأول<small>٢٠٢٦ - ٢٠٢٧ · نموذج توضيحي</small></header><div class="preview-question"><b>س١/ أجب عما يأتي:</b><p>أ- اشرح الفكرة بأسلوبك، مع ذكر مثال.</p><div class="writing-lines"></div></div><div class="preview-question"><b>س٢/ اختر الإجابة الصحيحة:</b><p>أ- الخيار الأول &nbsp; ب- الخيار الثاني</p></div><div class="preview-question"><b>س٣/ حل المسألة الآتية:</b><p dir="ltr" style="text-align:center">x² + 2x − 3 = 0</p><div class="writing-lines"></div></div></div></section>
 <section class="welcome-section"><p class="eyebrow">أدوات التنضيد</p><h2>من الترويسة إلى آخر سؤال</h2><div class="features">${features.map(([title,text],i)=>`<article class="feature"><div><h3>${title}</h3><p>${text}</p></div></article>`).join('')}</div></section>
 <section class="welcome-section learn-section" id="learnSection"><div><p class="eyebrow">دليل عملي</p><h2>افتح النموذج وجرّب عليه</h2><p>خمس خطوات داخل المحرر نفسه. غيّر السؤال، أدرج معادلة وجرّب الجدول. ارجع إلى مشروعك متى تريد، من دون أن تتغيّر بياناته.</p><button type="button" class="btn" data-act="demo">ابدأ التعليم العملي</button></div><ol class="learn-steps"><li>إعداد الترويسة ومعلومات الامتحان.</li><li>إدخال الأسئلة والأفرع والاختيارات.</li><li>إضافة المعادلات والجداول.</li><li>المعاينة والحفظ بصيغة PDF.</li></ol></section>
 <section id="filePanel" class="file-panel" hidden aria-label="فتح ملف مشروع"><div><h2>فتح مشروع محفوظ</h2><p>اختر ملف <b>JSON</b> الذي حفظته من المفيد. الملف المضغوط يضم البرنامج؛ مو ملف امتحان.</p></div><input id="homeFileIn" type="file" accept=".json,application/json" aria-label="اختيار ملف مشروع JSON"><p id="fileFeedback" role="status">المشروع الحالي لن يتغيّر إلا بعد قراءة ملف صالح.</p></section>
 <footer class="welcome-footer">المفيد أداة تنضيد، لا يصحّح الإجابات ولا يحلّ المسائل. تنزيل ملف المشروع يحمي عملك عند تغيير المتصفح أو حذف بياناته.</footer></div>`;
 icons();
 $('#homeFileIn').addEventListener('change',e=>{const f=e.target.files[0];if(f){$('#fileFeedback').textContent='جارٍ فتح: '+f.name;importFile(f);}e.target.value='';});
 host.scrollTop=0;
}
function showFilePanel(){
 const panel=$('#filePanel');if(!panel){showWelcome();return showFilePanel();}
 panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'center'});$('#homeFileIn').focus({preventScroll:true});
}
function fileFeedback(message){const el=$('#fileFeedback');if(el){el.textContent=message;el.classList.add('file-error');}toast(message);}
let W=null;
function openWizard(step=1){
 const m=P().meta;W={step,stage:S.active,grade:m.grade,subject:m.subject,kind:m.examKind,round:m.round,year:m.year,time:m.time,school:m.school,teacher:m.teacher,country:m.country,ministry:m.ministry,directorate:m.directorate,hijri:m.hijri,note:m.note,replace:false,newProject:false};
 renderWizard();$('#wizard').hidden=false;document.body.classList.add('wz-open');
}
function renderWizard(){
 const w=W,grades=STAGES[w.stage].grades,subs=subjectsFor(w.stage,w.grade);
 const steps=['المرحلة','الصف والمادة','تفاصيل الامتحان'];
 const head=`<div class="wz-steps">${steps.map((s,i)=>`<span class="${i+1===w.step?'cur':i+1<w.step?'done':''}"><i>${i+1<w.step?'✓':i+1}</i>${s}</span>`).join('')}</div>`;
 let body='';
 if(w.step===1)body=`<h2>اختر المرحلة الدراسية</h2><p class="lead">كل مرحلة تحتفظ بامتحانها الخاص.</p><div class="stagecards">${Object.entries(STAGES).map(([k,s])=>`<button type="button" class="stagecard" data-act="wz" data-f="stage" data-v="${k}" aria-pressed="${w.stage===k}"><b>${s.label}</b><small>${s.hint}</small></button>`).join('')}</div>`;
 if(w.step===2)body=`<h2>الصف والمادة</h2><div class="sub-h">الصف</div><div class="chips">${grades.map(g=>`<button type="button" class="chip" data-act="wz" data-f="grade" data-v="${esc(g)}" aria-pressed="${w.grade===g}">${esc(g)}</button>`).join('')}</div>
  <div class="sub-h">المادة</div><div class="chips">${subs.map(g=>`<button type="button" class="chip" data-act="wz" data-f="subject" data-v="${esc(g)}" aria-pressed="${w.subject===g}">${esc(g)}</button>`).join('')}</div>
  <label class="fld"><span>مادة أخرى</span><input data-wz="subject" value="${subs.includes(w.subject)?'':esc(w.subject)}" placeholder="اكتب اسم المادة"></label>`;
 if(w.step===3)body=`<h2>تفاصيل الامتحان</h2><div class="sub-h">نوع الامتحان</div><div class="chips">${KINDS.map(k=>`<button type="button" class="chip" data-act="wz" data-f="kind" data-v="${k}" aria-pressed="${w.kind===k}">${k}</button>`).join('')}</div>
  ${hasRound(w.kind)?`<div class="sub-h">الدور</div><div class="chips">${['الدور الأول','الدور الثاني'].map(k=>`<button type="button" class="chip" data-act="wz" data-f="round" data-v="${k}" aria-pressed="${w.round===k}">${k}</button>`).join('')}</div>`:''}
  <div class="row"><label class="fld"><span>العام الدراسي</span><input data-wz="year" value="${esc(w.year)}"></label><label class="fld"><span>الوقت</span><input data-wz="time" value="${esc(w.time)}" placeholder="ساعتان"></label></div>
  <div class="row"><label class="fld"><span>المدرسة</span><input data-wz="school" value="${esc(w.school)}" placeholder="اختياري"></label><label class="fld"><span>اسم المدرس</span><input data-wz="teacher" value="${esc(w.teacher)}" placeholder="اختياري"></label></div>
  <details class="sec in"><summary><span>بيانات الترويسة والملاحظة</span>${ic('chevron-down',17)}</summary><div class="sec-b">
   ${['country','ministry','directorate','hijri','note'].map((k,i)=>`<label class="fld"><span>${['الدولة','الوزارة','المديرية','التاريخ الهجري، اختياري','ملاحظة الامتحان، اختيارية'][i]}</span><input data-wz="${k}" value="${esc(w[k]||'')}"></label>`).join('')}
   <p class="hint">يمكن رفع الشعار وتعديل كل عنصر وإظهاره أو إخفاؤه بعد إنشاء المشروع، من قسم «الورقة».</p></div></details>
  ${S.started&&S.stages[w.stage].questions.length?`<label class="chk"><input type="checkbox" data-wz="replace"${w.replace?' checked':''}><span>بدء ورقة فارغة في هذه المرحلة، مع إمكانية التراجع</span></label>`:'<p class="hint">ستفتح ورقة فارغة للكتابة، بدون أسئلة جاهزة.</p>'}`;
 const ok=w.step===1?!!w.stage:w.step===2?!!(w.grade&&w.subject):true;
 $('#wizard').innerHTML=`<div class="wz-card" role="dialog" aria-modal="true" aria-label="إعداد الامتحان"><div class="wz-top"><span class="mark">م</span><b>المفيد في تنضيد الامتحانات</b><button type="button" class="ib" data-act="wzClose" title="إغلاق">${ic('x')}</button></div>${head}<div class="wz-body">${body}</div>
  <div class="wz-foot">${w.step>1?`<button type="button" class="btn" data-act="wzBack">${ic('arrow-right',17)}السابق</button>`:'<span></span>'}<button type="button" class="btn primary" data-act="wzNext"${ok?'':' disabled'}>${w.step<3?`التالي${ic('arrow-left',17)}`:`${ic('check',17)}إنشاء الورقة`}</button></div></div>`;
 icons();
}
function finishWizard(){
 const w=W;pushHist();
 if(w.newProject&&S.stages[w.stage].questions.length){
  try{localStorage.setItem('almufeed-before-new-v12',JSON.stringify({app:'almufeed-exam',version:12,stage:S.active,project:P(),stages:S.stages}));}catch{toast('تعذّر حفظ المشروع السابق. نزّل ملفه أولاً');return;}
 }
 if(w.newProject)S.stages[w.stage]=makeProject(w.stage,true);
 S.active=w.stage;const p=P(),m=p.meta;
 const timeChanged=m.time!==w.time;
 Object.assign(m,{grade:w.grade,subject:w.subject,examKind:w.kind,round:w.round,year:w.year,time:w.time,school:w.school,teacher:w.teacher,country:w.country,ministry:w.ministry,directorate:w.directorate,hijri:w.hijri,note:w.note});
 if(w.newProject){m.show.hijri=!!w.hijri;m.show.note=!!w.note;}
 if(!S.started||timeChanged)m.show.time=!!w.time;autoTitles(p);
 if(w.replace){p.questions=[];p.pristine=true;}
 S.started=true;$('#wizard').hidden=true;document.body.classList.remove('wz-open');UI.open=null;UI.view='questions';UI.adding=!p.questions.length;$('#welcome').hidden=true;loadFont();commit();
 toast('الترويسة جاهزة. اختر نوع السؤال وابدأ إدخاله');
}

/* ---------- محرر المعادلات: تختار الصيغة ثم تملأ خاناتها، والناتج يدخل داخل السطر ---------- */
const EQG=[['أساسيات',['frac','mixed','root','pow','sub','powsub','ppow','paren','abs']],['حساب',['longdiv','sys','log','lim','int','sum','bar']],['علوم',['chem','iso','arrow','vec','unit']],['نص',['text']]];
const EQT={
 frac:['كسر',[['a','البسط (فوق)'],['b','المقام (تحت)']],{a:'١',b:'٢'}],
 mixed:['عدد كسري',[['w','العدد الصحيح'],['a','البسط'],['b','المقام']],{w:'٢',a:'١',b:'٣'}],
 root:['جذر',[['n','درجة الجذر'],['x','ما تحت الجذر']],{n:'',x:'٩'}],
 pow:['أُس',[['x','الأساس'],['e','الأس (فوق)']],{x:'س',e:'٢'}],
 sub:['دليل سفلي',[['x','الأساس'],['s','الدليل (تحت)']],{x:'س',s:'١'}],
 powsub:['أس ودليل',[['x','الأساس'],['e','فوق'],['s','تحت']],{x:'v',e:'٢',s:'٠'}],
 ppow:['قوس مرفوع لأس',[['x','داخل القوس'],['e','الأس']],{x:'س+١',e:'٢'}],
 paren:['أقواس كبيرة',[['x','داخل الأقواس']],{x:'\\frac{١}{٢}'}],
 abs:['قيمة مطلقة',[['x','داخل الخطين']],{x:'س'}],
 longdiv:['قسمة طويلة',[['a','المقسوم'],['b','المقسوم عليه'],['q','الناتج (اتركه فارغاً للطالب)']],{a:'٨٤',b:'٤',q:''}],
 sys:['معادلتان',[['a','المعادلة الأولى'],['b','المعادلة الثانية']],{a:'س+ص=٥',b:'س-ص=١'}],
 log:['لوغاريتم',[['b','الأساس'],['x','العدد']],{b:'٢',x:'٨'}],
 lim:['غاية',[['v','المتغير'],['a','يقترب من'],['x','الدالة']],{v:'x',a:'2',x:'x^{2}'}],
 int:['تكامل',[['a','الحد الأدنى'],['b','الحد الأعلى'],['f','الدالة مع dx']],{a:'0',b:'1',f:'2x\\,dx'}],
 sum:['مجموع',[['a','من (تحت)'],['b','إلى (فوق)'],['x','الحد العام']],{a:'i=1',b:'n',x:'i'}],
 bar:['خط علوي',[['x','الرمز (قطعة، عدد دوري)']],{x:'AB'}],
 chem:['صيغة كيميائية',[['x','اكتب: 2H2 + O2 -> 2H2O أو <=> للمتزن، و ->[Δ] لشرط']],{x:'H2O'}],
 iso:['نظير',[['a','العدد الكتلي (فوق)'],['z','العدد الذري (تحت)'],['x','الرمز']],{a:'14',z:'6',x:'C'}],
 arrow:['سهم بشرط',[['a','فوق السهم'],['b','تحت السهم']],{a:'Δ',b:''}],
 vec:['متجه',[['x','الرمز']],{x:'F'}],
 unit:['قيمة ووحدة',[['v','القيمة'],['u','الوحدة']],{v:'9.8',u:'m/s^{2}'}],
 text:['نص ورموز',[['v','اكتب أو استعمل لوحة الرموز']],{v:'='}]
};
const ROOTS=[['','تربيعي'],['3','تكعيبي'],['4','رابع'],['5','خامس'],['n','نوني']];
const SYMS={
 'أساسية':['+','−','×','÷','=','±','∓','·','′','″','°','%','‰','…','∞','( .......... )'],
 'مقارنة':['≠','<','>','≤','≥','≈','≡','≅','∝','~','≪','≫'],
 'أسهم':['→','←','↑','↓','↔','⇒','⇐','⇔','⟶','⇌','⇋','↗','↘','↦'],
 'هندسة':['∠','∡','△','⊥','∥','°','\\overline{AB}','\\vec{AB}','π','□','⊙'],
 'وحدات':['\\text{m}','\\text{cm}','\\text{km}','\\text{s}','\\text{kg}','\\text{g}','\\text{N}','\\text{J}','\\text{W}','\\text{Pa}','\\text{V}','\\text{A}','\\text{Ω}','\\text{C}','\\text{F}','\\text{T}','\\text{Hz}','\\text{K}','\\text{eV}','\\text{kWh}','\\text{m/s}','\\text{m/s}^{2}','\\text{km/h}','\\text{N/C}','\\text{N·m}','\\text{kg/m}^{3}','\\text{rad/s}','^{\\circ}\\text{C}','\\text{mol}','\\text{L}','\\text{mL}','\\text{g/mol}','\\text{mol/L}'],
 'فيزياء':['Δ','Ω','μ','λ','θ','ω','α','β','γ','ρ','ε','η','τ','φ','ν','ℏ','\\Delta x','\\Delta t','\\Delta v','v_{0}','v_{f}','\\vec{F}','\\vec{v}','\\vec{a}','F_{net}','E_{k}','E_{p}','P_{E}','R_{eq}','\\varepsilon_{0}','\\mu_{0}','g','c','e^{-}','\\text{Å}','\\propto'],
 'كيمياء':['→','⇌','↑','↓','\\xrightarrow{\\Delta}','_{(s)}','_{(l)}','_{(g)}','_{(aq)}','^{+}','^{-}','^{2+}','^{2-}','^{3+}','^{3-}','e^{-}','\\Delta H','\\Delta G','\\Delta S','K_{c}','K_{p}','K_{a}','K_{b}','K_{w}','K_{sp}','\\text{pH}','\\text{pOH}','[\\text{H}^{+}]','[\\text{OH}^{-}]','\\text{M}','N_{A}','\\text{STP}','\\ce{H2O}','\\ce{CO2}','\\ce{H2SO4}','\\ce{NaCl}','\\ce{NH3}'],
 'منطق ومجموعات':['∩','∪','∈','∉','⊂','⊆','⊃','∅','∨','∧','~','∀','∃','∴','∵','\\mathbb{R}','\\mathbb{N}','\\mathbb{Z}','\\mathbb{Q}'],
 'حروف':['α','β','γ','δ','θ','λ','μ','π','σ','φ','ω','Δ','Σ','Ω','Φ','Ψ','س','ص','ع','ل','م','ن','أ','ب','ج','د']
};
const SYM_TEX=s=>s.includes('\\')||/[\^_]/.test(s);
const SYM_LABEL=s=>({'( .......... )':'فراغ','\\mathbb{R}':'ℝ','\\mathbb{N}':'ℕ','\\mathbb{Z}':'ℤ','\\mathbb{Q}':'ℚ','\\propto':'∝','\\overline{AB}':'AB̅','\\vec{AB}':'AB⃗'}[s])||null;
const symBtn=s=>{const l=SYM_LABEL(s);return`<button type="button" class="sy keep" data-sym="${esc(s)}" title="${esc(s)}">${l?esc(l):SYM_TEX(s)?texToHTML(s,'en'):esc(s)}</button>`;};
let EQ=null,LAST=null;
const toPieceDigits=(o,lang)=>{const r={};for(const k in o)r[k]=lang==='en'?toLa(o[k]):o[k];return r;};
/* target: {el: الحقل الغني, chip: معادلة موجودة أو لا شيء, range: موضع المؤشر} */
function markedText(el,chip,range){
 if(chip){const o=chip.dataset.tex;chip.dataset.tex='\uE001';const v=serClean(el);chip.dataset.tex=o;return v;}
 const r=placeRange(el,range).cloneRange(),fragment=r.extractContents(),m=document.createTextNode('\uE000');r.insertNode(m);const v=serClean(el);m.replaceWith(fragment);return v;
}
function openEq(t){
 if(!t||!t.el)return;
 if((t.el.dataset.k||t.el.dataset.r)==='draft'){setPath('draft','');}
 const chip=t.chip||null,lang=chip?chip.dataset.l:(ctx().ar?'ar':'en');
 const pieces=chip?parsePieces(chip.dataset.tex):[];
 const path=t.el.dataset.r||t.el.dataset.k;
 EQ={t,path,marked:markedText(t.el,chip,t.range),lang,pieces,sel:pieces.length?0:-1,focusKey:null,edit:!!chip,tab:EQ&&EQ.tab||'أساسية'};
 renderEq();const d=$('#eqdlg');if(!d.open)d.showModal();
}
function pieceTex(p){return piecesToTex([p]);}
function renderEq(){
 const e=EQ,ar=e.lang==='ar',sel=e.pieces[e.sel];
 const old=e.focusKey&&$('#eqdlg [data-eq="'+e.focusKey+'"]');
 const caret=old&&old.type!=='checkbox'?{key:e.focusKey,a:old.selectionStart,b:old.selectionEnd}:e.caret;
 const prev=e.pieces.length?texToHTML(piecesToTex(e.pieces),e.lang):`<span class="ph">اختر صيغة من الأسفل، ثم املأ خاناتها</span>`;
 const strip=e.pieces.map((p,i)=>`<button type="button" class="pc${i===e.sel?' sel':''}" data-act="eqSel" data-i="${i}">${texToHTML(pieceTex(p),e.lang)}</button>`).join('');
 const D=v=>ar?toAr(v):toLa(v);
 const field=(f,l)=>{
  if(sel.t==='root'&&f==='n'){const cur=ROOTS.some(([v])=>v===toLa(sel.n||'')&&v!=='n')?toLa(sel.n||''):'n';
   return`<div class="fld wide"><span>${l}</span><div class="seg sm" role="group">${ROOTS.map(([v,n])=>`<button type="button" data-act="eqRoot" data-v="${v}" aria-pressed="${cur===v}">${n}${v&&v!=='n'?` <small>${D(v)}</small>`:''}</button>`).join('')}</div>${cur==='n'?`<input data-eq="n" value="${esc(sel.n??'')}" dir="${ar?'rtl':'ltr'}" placeholder="${ar?'ن أو ٦':'n or 6'}" autocomplete="off">`:''}</div>`;}
  return`<label class="fld"><span>${l}</span><input data-eq="${f}" value="${esc(sel[f]??'')}" dir="${ar?'rtl':'ltr'}" autocomplete="off"></label>`;};
 const form=sel?`<div class="eqform"><div class="eqform-h"><b>${EQT[sel.t]?EQT[sel.t][0]:''}</b><span class="sp"></span><button type="button" class="ib" data-act="eqMove" data-d="-1" title="تقديم"${e.sel===0?' disabled':''}>${ic(ar?'arrow-right':'arrow-left',17)}</button><button type="button" class="ib" data-act="eqMove" data-d="1" title="تأخير"${e.sel===e.pieces.length-1?' disabled':''}>${ic(ar?'arrow-left':'arrow-right',17)}</button><button type="button" class="ib danger" data-act="eqDel" title="حذف الجزء">${ic('trash-2',17)}</button></div>
  <div class="eqfields">${(EQT[sel.t]?EQT[sel.t][1]:[]).map(([f,l])=>field(f,l)).join('')}
  ${sel.t==='longdiv'?`<label class="chk"><input type="checkbox" data-eq="steps"${sel.steps?' checked':''}><span>إظهار خطوات الحل تحت المقسوم</span></label>`:''}${sel.t==='arrow'?`<label class="chk"><input type="checkbox" data-eq="rev"${sel.rev?' checked':''}><span>سهم انعكاسي ⇌ (تفاعل متزن)</span></label>`:''}</div></div>`:'';
 const tab=e.tab||'أساسية';
 $('#eqdlg').innerHTML=`<div class="eq" dir="rtl">
  <header><b>${e.edit?'تعديل المعادلة':'إدراج معادلة'}</b>${seg('eqlang',e.lang,[['ar','عربية ١٢٣'],['en','English 123']],'sm')}<button type="button" class="ib" data-act="eqClose" title="إغلاق">${ic('x',20)}</button></header>
  <div class="eqprev" dir="${ar?'rtl':'ltr'}">${prev}</div>
  ${e.pieces.length>1?`<div class="strip" dir="${ar?'rtl':'ltr'}">${strip}</div>`:''}
  ${form}
  <details class="eqtemplates"${e.pieces.length?'':' open'}><summary>${e.pieces.length?'إضافة صيغة أخرى':'اختر صيغة المعادلة'}${ic('chevron-down',16)}</summary><div class="eqgal">${EQG.map(([g,ks])=>`<div class="gal-g"><span class="gal-h">${g}</span><div class="gal">${ks.map(k=>{const [n,,smp]=EQT[k];return`<button type="button" class="gt" data-act="eqAdd" data-t="${k}"><span class="gt-v" dir="${ar&&!['chem','iso','int','lim','sum','unit'].includes(k)?'rtl':'ltr'}">${texToHTML(pieceTex({t:k,...toPieceDigits(smp,['chem','iso','int','lim','sum','unit'].includes(k)?'en':e.lang),steps:false}),['chem','iso','int','lim','sum','unit'].includes(k)?'en':e.lang)}</span><small>${n}</small></button>`;}).join('')}</div></div>`).join('')}</div></details>
  <div class="sub-h">الرموز، تُكتب في الخانة المحددة</div>
  <div class="symtabs">${Object.keys(SYMS).map(k=>`<button type="button" data-act="eqTab" data-k="${k}" aria-pressed="${tab===k}">${k}</button>`).join('')}</div>
  <div class="syms">${SYMS[tab].map(symBtn).join('')}</div>
  <p class="eq-error" id="eqError" role="status" hidden></p>
  <footer>${e.edit?`<button type="button" class="btn danger-t" data-act="eqRemove">${ic('trash-2',16)}حذف</button><span class="sp"></span>`:''}<button type="button" class="btn" data-act="eqClose">إلغاء</button><button type="button" class="btn primary" data-act="eqOk"${e.pieces.length?'':' disabled'}>${ic('check',17)}${e.edit?'حفظ التعديل':'إدراج في السطر'}</button></footer>
 </div>`;
 icons();
 if(caret&&e.focusKey===caret.key){const el=$('#eqdlg [data-eq="'+caret.key+'"]');if(el&&el.type!=='checkbox')el.setSelectionRange(caret.a??el.value.length,caret.b??el.value.length);e.caret=caret;}
 const first=$('#eqdlg [data-eq]');if(first&&EQ.autofocus){first.focus();EQ.autofocus=false;}
}
function eqLive(){$('#eqdlg .eqprev').innerHTML=EQ.pieces.length?texToHTML(piecesToTex(EQ.pieces),EQ.lang):'';const b=$$('#eqdlg .pc')[EQ.sel];if(b)b.innerHTML=texToHTML(pieceTex(EQ.pieces[EQ.sel]),EQ.lang);const err=$('#eqError');if(err)err.hidden=true;}
function eqSym(s){
 let el=EQ.focusKey?$('#eqdlg [data-eq="'+EQ.focusKey+'"]'):null;
 if(!el){const sel=EQ.pieces[EQ.sel];if(!sel||sel.t!=='text'){EQ.pieces.splice(EQ.sel+1,0,{t:'text',v:''});EQ.sel++;renderEq();}el=$('#eqdlg [data-eq]');}
 const a=el.selectionStart??el.value.length,b=el.selectionEnd??a;el.value=el.value.slice(0,a)+s+el.value.slice(b);el.focus();el.setSelectionRange(a+s.length,a+s.length);el.dispatchEvent(new Event('input',{bubbles:true}));
}
function eqOk(remove){
 const tex=remove?'':piecesToTex(EQ.pieces).trim(),lang=EQ.lang;
 const err=remove?'':equationProblem(EQ.pieces,tex);if(err){const el=$('#eqError');el.textContent=err;el.hidden=false;return;}
 $('#eqdlg').close();if(!remove&&!tex)return;
 const tok=remove?'':lang==='ar'?`$$${tex}$$`:`$${tex}$`;
 let v=EQ.marked;
 v=EQ.edit?v.replace(/\$\$\uE001\$\$|\$\uE001\$/,()=>tok):v.replace(/ ?\uE000 ?/,()=>tok?' '+tok+' ':'');
 v=v.replace(/^ +| +$/g,'');
 const ae=document.activeElement;if(ae&&ae.blur)ae.blur();
 pushHist();setPath(EQ.path,v);P().pristine=false;commit();
}
function equationProblem(pieces,tex){
 if(!tex)return'أضف جزءاً للمعادلة أولاً';
 const bad=texProblem(tex);if(bad)return bad;
 if(texToHTML(tex,EQ?.lang||'en').includes('class="math-error"'))return'توجد صيغة غير مدعومة. استخدم القوالب أو الرموز المتاحة.';
 if(tex.includes('$'))return'لا تضع علامات الدولار داخل المعادلة';
 for(const p of pieces){
  if(p.t==='root'){const n=toLa(p.n||'').trim();if(n&&!/^(?:[2-9]|[1-9]\d+|n|ن)$/.test(n))return'درجة الجذر: عدد صحيح ٢ أو أكثر، أو ن';}
  if(p.t==='longdiv'&&/^[0٠]+$/.test(String(p.b).trim()))return'القسمة على صفر غير معرّفة';
  const optional={root:['n'],arrow:['a','b'],longdiv:['q'],int:['a','b']};
  for(const [f,l] of EQT[p.t]?.[1]||[]){if(!(optional[p.t]||[]).includes(f)&&!String(p[f]??'').trim())return'أكمل خانة: '+l;}
 }
 return'';
}
/* إدراج عقدة في موضع المؤشر داخل حقل غني */
function placeRange(el,range){
 if(range&&el.contains(range.startContainer)&&el.contains(range.endContainer))return range;
 const r=document.createRange();r.selectNodeContents(el);r.collapse(false);return r;
}
function insertNodeAt(el,node,range){
 const r=placeRange(el,range);r.deleteContents();
 const sp=document.createTextNode(' ');
 const prev=r.startContainer.nodeType===3?r.startContainer.nodeValue.slice(0,r.startOffset):'';
 r.insertNode(sp);r.insertNode(node);if(prev&&!/\s$/.test(prev))node.before(document.createTextNode(' '));
 const s=getSelection(),nr=document.createRange();nr.setStartAfter(sp);nr.collapse(true);s.removeAllRanges();s.addRange(nr);
 LAST={el,range:nr.cloneRange()};
}
function insertChip(el,tex,lang,range){
 const w=document.createElement('span');w.innerHTML=chipHTML(tex,lang,texToHTML(tex,lang));insertNodeAt(el,w.firstChild,range);
}
function insertText(el,txt,range){
 const r=placeRange(el,range);r.deleteContents();const n=document.createTextNode(txt);r.insertNode(n);
 const s=getSelection(),nr=document.createRange();nr.setStartAfter(n);nr.collapse(true);s.removeAllRanges();s.addRange(nr);LAST={el,range:nr.cloneRange()};
}
/* تحويل محتوى الحقل الغني إلى النص المخزّن */
function ser(node){
 let o='';
 for(const n of node.childNodes){
  if(n.nodeType===3){o+=n.nodeValue.replace(/\u200b/g,'').replace(/\u00a0/g,' ');continue;}
  if(n.nodeType!==1)continue;
  if(n.classList.contains('eqc')){o+=n.dataset.l==='ar'?`$$${n.dataset.tex}$$`:`$${n.dataset.tex}$`;continue;}
  const t=n.tagName,fw=n.style&&n.style.fontWeight,td=n.style&&n.style.textDecorationLine||n.style&&n.style.textDecoration||'';
  if(t==='BR'){o+='\n';continue;}
  let inner=ser(n);
 if(t==='B'||t==='STRONG'||fw==='bold'||+fw>=600)inner=inner.trim()?`**${inner}**`:inner;
 if(t==='U'||/underline/.test(td))inner=inner.trim()?`__${inner}__`:inner;
  if((t==='DIV'||t==='P')&&o&&!o.endsWith('\n'))o+='\n';
  o+=inner;
 }
 return o;
}
const serClean=el=>ser(el).replace(/\*\*\*\*/g,'').replace(/____/g,'').replace(/\n+$/,'').replace(/[ \t]+$/,'');
function fireEdit(el){
 const v=serClean(el);el.classList.toggle('ph-on',!v.trim());
 if(el.dataset.r){setPath(el.dataset.r,v);changed();return;}
 if(el.dataset.k){setPath(el.dataset.k,v);syncField(el.dataset.k,v);changed({paper:false});paperPending=true;}
}
/* ورقة الرموز السريعة: تُدرج الرمز مكان المؤشر مباشرة */
function symPop(open){
 const el=$('#sympop');if(open===false||(!open&&!el.hidden)){el.hidden=true;return;}
 const tab=UI.symTab||'أساسية';
 el.innerHTML=`<div class="sp-h"><b>رموز</b><div class="symtabs">${Object.keys(SYMS).map(k=>`<button type="button" class="keep" data-act="symTab" data-k="${k}" aria-pressed="${tab===k}">${k}</button>`).join('')}</div><button type="button" class="ib keep" data-act="symClose" title="إغلاق">${ic('x',18)}</button></div><div class="syms">${SYMS[tab].map(symBtn).join('')}</div>`;
 el.hidden=false;
}
function useSym(s){
 if($('#eqdlg').open){eqSym(s);return;}
 const t=LAST&&document.body.contains(LAST.el)?LAST:null;
 if(!t){toast('ضع المؤشر داخل نص أولاً');return;}
 if(SYM_TEX(s))insertChip(t.el,s,'en',t.range);else insertText(t.el,s,t.range);
 fireEdit(t.el);
}

/* ---------- تنبيهات ---------- */
let toastT;
function toast(msg,action){const t=$('#toast');t.innerHTML=`<span>${esc(msg)}</span>${action?`<button type="button" id="toastAct">${esc(action.label)}</button>`:''}`;
 t.hidden=false;t.classList.remove('out');void t.offsetWidth;t.classList.add('in');if(action)$('#toastAct').onclick=()=>{action.run();hideToast();};
 clearTimeout(toastT);toastT=setTimeout(hideToast,action?6500:2400);}
function hideToast(){const t=$('#toast');t.classList.remove('in');t.classList.add('out');setTimeout(()=>{t.hidden=true;},180);}

/* ---------- الملفات والصور والخطوط ---------- */
function download(){pushHist();save();const p=P();const blob=new Blob([JSON.stringify({app:'almufeed-exam',version:13,stage:S.active,project:p,stages:S.stages})],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`امتحان-${p.meta.subject}-${p.meta.grade}.json`.replace(/\s+/g,'-');document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);toast('حُفظ ملف المشروع');}
async function importFile(f){if(f.size>50*1024*1024){fileFeedback('حجم المشروع أكبر من ٥٠ ميغابايت. قلّل الصور قبل فتحه');return;}let o;try{o=JSON.parse(await f.text());}catch{fileFeedback('اختر ملف مشروع JSON محفوظ من المفيد، وليس ملف PDF أو ZIP');return;}
 if(DEMO)endLesson();
 let stage=S.active,proj=null;
 if(o&&o.app==='almufeed-exam'&&o.stages&&typeof o.stages==='object'&&Object.keys(STAGES).every(k=>o.stages[k]&&typeof o.stages[k]==='object')){
  pushHist();S.active=STAGES[o.stage]?o.stage:stage;
  for(const k of Object.keys(STAGES))S.stages[k]=normProject(o.stages[k],k);
  S.started=true;UI.open=null;LAST=null;$('#welcome').hidden=true;UI.view='questions';loadFont();commit();toast('فُتحت امتحانات المراحل الثلاث',{label:'تراجع',run:()=>undo(-1)});return;}
 if(o&&/^(almufeed-exam|exam-studio)$/.test(o.app)&&o.project){if(STAGES[o.stage])stage=o.stage;proj=normProject(o.project,stage);proj.pristine=false;}
 else if(o&&o.structured){const r=convertV05(o);stage=r.stage;proj=r.project;}
 if(!proj){fileFeedback('الملف لا يحتوي مشروعاً صالحاً من المفيد');return;}
 pushHist();S.active=stage;S.stages[stage]=proj;S.started=true;UI.open=null;$('#welcome').hidden=true;UI.view='questions';loadFont();commit();toast('فُتح المشروع',{label:'تراجع',run:()=>undo(-1)});}
function readImage(f,max){return new Promise((res,rej)=>{if(!f||!/^image\/(png|jpeg|webp)$/.test(f.type)){rej();return;}const img=new Image(),url=URL.createObjectURL(f);
 img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height)),cv=document.createElement('canvas');cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);URL.revokeObjectURL(url);res({src:cv.toDataURL(f.type==='image/png'?'image/png':'image/jpeg',.86),r:+(cv.width/cv.height).toFixed(4)});};
 img.onerror=()=>{URL.revokeObjectURL(url);rej();};img.src=url;});}
let imgTarget=null;
async function onImage(f){const target=imgTarget,stage=S.active,project=P();try{const {src,r}=await readImage(f,1400);const [a,qid,iid]=target.split('.');const q=project.questions.find(q=>q.id===qid);if(!q||S.stages[stage]!==project)return;const img={src,r,w:35,align:'center',side:false};
 if(a==='q')q.image=img;else{const x=q.items.find(i=>i.id===iid);if(!x)return;x.image=img;}project.pristine=false;commit();}catch{toast('اختر صورة PNG أو JPG أو WEBP');}}
let fontLoaded='',fontFace=null,fontRequest=0,fontReady=Promise.resolve();
function loadFont(){const cf=P().customFont;if(cf&&fontLoaded===cf.src)return fontReady;
 const req=++fontRequest; if(fontFace){document.fonts.delete(fontFace);fontFace=null;}fontLoaded='';
 if(!cf){fontReady=Promise.resolve();return fontReady;}const src=cf.src;
 try{fontReady=new FontFace('ExamUserFont',`url(${src})`).load().then(x=>{if(req!==fontRequest)return;document.fonts.add(x);fontFace=x;fontLoaded=src;renderPaper();}).catch(()=>{if(req===fontRequest)toast('تعذّر تحميل الخط، اختر خطاً آخر');});}catch{fontReady=Promise.resolve();toast('تعذّر تحميل الخط');}return fontReady;
}
function onFont(f){if(!/\.(ttf|otf|woff2?)$/i.test(f.name)||f.size>2500000){toast('الخط: TTF أو OTF أو WOFF وأقل من 2.5 ميغابايت');return;}
 const stage=S.active,project=P(),r=new FileReader();r.onload=()=>{if(S.stages[stage]!==project)return;project.customFont={name:f.name.replace(/\.[^.]+$/,''),src:String(r.result)};project.font='custom';if(S.active===stage)loadFont();commit();};r.onerror=()=>toast('تعذّرت قراءة ملف الخط');r.readAsDataURL(f);}
async function doPrint(){try{await fontReady;await document.fonts.ready;}catch{}const ae=document.activeElement;if(ae&&ae.blur)ae.blur();
 await Promise.all($$('#pages img').map(img=>img.decode?img.decode().catch(()=>{}):Promise.resolve()));renderPaper();
 if($$('#pages .math-error').length){toast('PDF متوقف: توجد معادلة غير مكتملة، صحّحها أولاً');return;}
 if($$('#pages .too-tall,#pages .too-wide').length){toast('PDF متوقف: قلّل حجم المحتوى المحدّد بالأحمر أو وزّعه حتى لا يُقص');return;}
 setTimeout(()=>window.print(),80);}

/* ---------- الأحداث ---------- */
const move=(arr,i,d)=>{const j=i+d;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];};
document.addEventListener('click',e=>{
 const sy=e.target.closest('[data-sym]');if(sy){useSym(sy.dataset.sym);return;}
 const chip=e.target.closest('.eqc');if(chip){const host=chip.closest('[data-r],#pages [data-k]');if(host){e.preventDefault();openEq({el:host,chip});return;}}
 if(!e.target.closest('#sympop')&&!e.target.closest('.keep')&&!$('#sympop').hidden)symPop(false);
 $$('details.menu[open]').forEach(d=>{if(!d.contains(e.target)||e.target.closest('.menu-m [data-act]'))d.open=false;});
 const b=e.target.closest('[data-act]');
 if(!b){const qb=e.target.closest('#pages .qb');if(qb&&!e.target.closest('[data-k]')&&!e.target.closest('.lg')){UI.open=qb.dataset.q;UI.view='questions';renderSide();renderPaper();requestAnimationFrame(()=>{const r=$(`.qc[data-qid="${qb.dataset.q}"]`);r&&r.scrollIntoView({block:'start',behavior:'smooth'});});}return;}
 if(b.disabled)return;
 const a=b.dataset.act,p=P(),q=b.dataset.q?findQ(b.dataset.q):null,qi=q?p.questions.indexOf(q):-1,ii=q&&b.dataset.i?q.items.findIndex(x=>x.id===b.dataset.i):-1;
 if(a==='qDup'&&p.questions.length>=80){toast('الحد ٨٠ سؤالاً لكل مرحلة');return;}
 if(a==='addEqItem'&&q.items.length>=80){toast('الحد ٨٠ فرعاً لكل سؤال');return;}
 if(a==='exAdd'&&q.extra.length>=10){toast('الحد ١٠ إجابات زائدة');return;}
 if(a==='chAdd'){const [,qid,iid]=b.dataset.path.split('.'),x=findQ(qid)?.items.find(i=>i.id===iid);if(x&&x.choices.length>=40){toast('الحد ٤٠ خياراً');return;}}
 if(!['symOpen','symTab','symClose','eqRoot','eqRemove','fmt','rEq','rSym','view','toggle','adding','more','zin','zout','zfit','eq','eqEdit','eqAdd','eqSel','eqMove','eqDel','eqClose','eqOk','eqTab','wz','wzNext','wzBack','wzClose','img','logo','font','open','save','print','wizard','undo','redo'].includes(a))pushHist();
 switch(a){
  case'view':setView(b.dataset.v);break;
  case'home':showWelcome();break;
  case'continueProject':$('#welcome').hidden=true;UI.view='questions';renderAll();break;
  case'homeNew':openWizard(1);W.newProject=true;renderWizard();break;
  case'homeOpen':showFilePanel();break;
  case'restorePrevious':{const raw=localStorage.getItem('almufeed-before-new-v12');if(!raw){toast('لا توجد نسخة مشروع سابقة');break;}importFile(new File([raw],'previous.json',{type:'application/json'}));break;}
  case'homeLearn':$('#learnSection').scrollIntoView({behavior:'smooth'});break;
  case'lessonNext':lessonIndex=Math.min(LESSONS.length-1,lessonIndex+1);renderLesson();break;
  case'lessonPrev':lessonIndex=Math.max(0,lessonIndex-1);renderLesson();break;
  case'set':if(b.dataset.path==='eqlang'){EQ.lang=b.dataset.v;EQ.pieces=EQ.pieces.map(x=>{const y={...x};for(const k in y)if(typeof y[k]==='string'&&k!=='t')y[k]=EQ.lang==='ar'?toAr(y[k]):toLa(y[k]);return y;});renderEq();break;}
   setPath(b.dataset.path,b.dataset.v);commit();break;
  case'eye':{const k=b.dataset.k;p.meta.show[k]=!(p.meta.show[k]!==false);commit();break;}
  case'toggle':UI.open=UI.open===q.id?null:q.id;renderSide();renderPaper();break;
  case'adding':UI.adding=!UI.adding;renderSide();break;
  case'addQ':{if(p.questions.length>=80){toast('الحد ٨٠ سؤالاً لكل مرحلة، احفظ امتحاناً جديداً');break;}const n=DEMO?kindTemplate(b.dataset.kind,ctx().en):blankQuestion(b.dataset.kind,ctx().en);p.questions.push(n);p.pristine=false;UI.open=n.id;UI.adding=false;UI.view='questions';commit();requestAnimationFrame(()=>{const r=$(`.qc[data-qid="${n.id}"]`);r&&r.scrollIntoView({block:'start',behavior:'smooth'});});break;}
  case'startWriting':startWriting();break;
  case'rQuestion':UI.view='questions';UI.adding=true;renderSide();break;
  case'demo':startLesson();break;
  case'qUp':move(p.questions,qi,-1);p.pristine=false;commit();break;
  case'qDown':move(p.questions,qi,1);p.pristine=false;commit();break;
  case'qDup':{const d=JSON.parse(JSON.stringify(q));d.id=uid();d.items.forEach(x=>x.id=uid());p.questions.splice(qi+1,0,d);UI.open=d.id;p.pristine=false;commit();break;}
  case'qDel':p.questions.splice(qi,1);p.pristine=false;commit();toast('حُذف السؤال',{label:'تراجع',run:()=>undo(-1)});break;
  case'addItem':{if(q.items.length>=80){toast('الحد ٨٠ فرعاً لكل سؤال');break;}const n=it('',{choices:q.kind==='mcq'?['','']:[]});q.items.push(n);p.pristine=false;commit();requestAnimationFrame(()=>{const t=$(`[data-r="it.${q.id}.${n.id}.text"]`);t&&t.focus();});break;}
  case'addEqItem':{const n=it('');q.items.push(n);p.pristine=false;commit();requestAnimationFrame(()=>{const el=$(`[data-r="it.${q.id}.${n.id}.text"]`);el&&openEq({el});});break;}
  case'more':UI.more[b.dataset.i]=!UI.more[b.dataset.i];renderSide();break;
  case'itUp':move(q.items,ii,-1);commit();break;case'itDown':move(q.items,ii,1);commit();break;
  case'itDel':q.items.splice(ii,1);p.pristine=false;commit();toast('حُذف الفرع',{label:'تراجع',run:()=>undo(-1)});break;
  case'wrap':{const t=document.querySelector(`[data-b="${b.dataset.for}"]`);if(!t)break;const w=b.dataset.w,s0=t.selectionStart,s1=t.selectionEnd,mid=t.value.slice(s0,s1)||'نص';t.value=t.value.slice(0,s0)+w+mid+w+t.value.slice(s1);t.dispatchEvent(new Event('input',{bubbles:true}));commit();break;}
  case'eq':{const el=$(`[data-r="${b.dataset.for}"]`);if(el)openEq({el,range:LAST&&LAST.el===el?LAST.range:null});break;}
  case'rEq':{const t=writerTarget();if(!t){toast('ضع المؤشر داخل النص أولاً');break;}openEq({el:t.el,range:t.range});break;}
  case'eqRemove':eqOk(true);break;
  case'eqRoot':{const sel=EQ.pieces[EQ.sel],v=b.dataset.v,ar=EQ.lang==='ar';sel.n=v==='n'?(ar?'ن':'n'):ar?toAr(v):v;renderEq();break;}
  case'symOpen':case'rSym':{const t=writerTarget();if((t?.el.dataset.k||t?.el.dataset.r)==='draft')setPath('draft','');if(t)LAST=t;symPop(true);break;}
  case'symTab':UI.symTab=b.dataset.k;symPop(true);break;
  case'symClose':symPop(false);break;
  case'fmt':{const t=LAST&&document.body.contains(LAST.el)?LAST:null;if(!t){toast('حدد نصاً أولاً');break;}t.el.focus();const s=getSelection();s.removeAllRanges();s.addRange(t.range);document.execCommand(b.dataset.c,false,null);fireEdit(t.el);break;}
  case'rTable':{const t=writerTarget();if((t?.el.dataset.k||t?.el.dataset.r)==='draft')setPath('draft','');const m=t&&/^it\.([a-z0-9]+)\.([a-z0-9]+)\./.exec(t.el.dataset.r||t.el.dataset.k||'');if(!m){toast('ضع المؤشر داخل النص ليُضاف الجدول إليه');break;}const qq=findQ(m[1]),x=qq&&qq.items.find(i=>i.id===m[2]);if(!x)break;if(!x.table)x.table=TABLE(3,3);UI.open=qq.id;UI.more[x.id]=true;UI.view='questions';p.pristine=false;commit();toast('أُضيف الجدول');break;}
  case'chAdd':{const [,qid,iid]=b.dataset.path.split('.');const x=findQ(qid).items.find(i=>i.id===iid);x.choices.push('');if(x.choices.length<2)x.choices.push('');p.pristine=false;commit();requestAnimationFrame(()=>{const r=$(`[data-r="${b.dataset.path}.choice.${x.choices.length-1}"]`);r&&r.focus();});break;}
  case'chDel':{const [,qid,iid]=b.dataset.path.split('.');const x=findQ(qid).items.find(i=>i.id===iid);x.choices.splice(+b.dataset.j,1);commit();break;}
  case'subAdd':case'subDel':{const [,qid,iid]=b.dataset.path.split('.'),x=findQ(qid).items.find(i=>i.id===iid);if(a==='subAdd'){if(x.subs.length>=40){toast('الحد ٤٠ فقرة داخلية');break;}x.subs.push('');}else x.subs.splice(+b.dataset.j,1);p.pristine=false;commit();break;}
  case'exAdd':q.extra.push('');commit();break;
  case'exDel':q.extra.splice(+b.dataset.j,1);commit();break;
  case'tbEdit':{const [,qid,iid]=b.dataset.path.split('.'),x=findQ(qid)?.items.find(i=>i.id===iid);if(!x?.table)break;
   const rows=x.table.rows,pos=UI.tableCells[b.dataset.path]||[0,0],ri=Math.min(pos[0],rows.length-1),ci=Math.min(pos[1],rows[0].length-1),op=b.dataset.op;
   if(op==='rowBefore'||op==='rowAfter'){if(rows.length>=30){toast('الحد ٣٠ صفاً');break;}rows.splice(ri+(op==='rowAfter'?1:0),0,Array(rows[0].length).fill(''));}
   else if(op==='colBefore'||op==='colAfter'){if(rows[0].length>=10){toast('الحد ١٠ أعمدة');break;}rows.forEach(r=>r.splice(ci+(op==='colAfter'?1:0),0,''));}
   else if(op==='delRow'){if(rows.length===1){toast('الجدول يحتاج صفاً واحداً على الأقل');break;}rows.splice(ri,1);}
   else if(op==='delCol'){if(rows[0].length===1){toast('الجدول يحتاج عموداً واحداً على الأقل');break;}rows.forEach(r=>r.splice(ci,1));}
   UI.tableCells[b.dataset.path]=[Math.min(ri,rows.length-1),Math.min(ci,rows[0].length-1)];p.pristine=false;commit();if(op.startsWith('del'))toast('حُذف '+(op==='delRow'?'الصف':'العمود'),{label:'تراجع',run:()=>undo(-1)});break;}
  case'tbAdd':case'tbRow':case'tbCol':case'tbDel':{const [,qid,iid]=b.dataset.path.split('.');const x=findQ(qid).items.find(i=>i.id===iid);if(!x)break;
   if(a==='tbAdd')x.table=TABLE(3,3);else if(a==='tbDel')x.table=null;
   else if(a==='tbRow'){const w=x.table.rows[0].length;if(+b.dataset.d>0){if(x.table.rows.length>=30){toast('الحد ٣٠ صفاً، وزّع المحتوى على أكثر من جدول');break;}x.table.rows.push(Array(w).fill(''));}else if(x.table.rows.length>1)x.table.rows.pop();}
   else{if(+b.dataset.d>0)x.table.rows.forEach(r=>r.push(''));else if(x.table.rows[0].length>1)x.table.rows.forEach(r=>r.pop());}
   p.pristine=false;commit();if(a==='tbDel')toast('حُذف الجدول',{label:'تراجع',run:()=>undo(-1)});break;}
  case'eqAdd':{const [,,smp]=EQT[b.dataset.t];const np={t:b.dataset.t,steps:false};EQT[b.dataset.t][1].forEach(([f])=>np[f]='');if(b.dataset.t==='text')np.v='';if(['chem','iso','unit'].includes(b.dataset.t))EQ.lang='en';EQ.pieces.splice(EQ.sel+1,0,np);EQ.sel++;EQ.focusKey=null;EQ.autofocus=true;renderEq();break;}
  case'eqSel':EQ.sel=+b.dataset.i;EQ.focusKey=null;EQ.autofocus=true;renderEq();break;
  case'eqMove':{const d=+b.dataset.d;move(EQ.pieces,EQ.sel,d);EQ.sel=Math.max(0,Math.min(EQ.pieces.length-1,EQ.sel+d));EQ.focusKey=null;renderEq();break;}
  case'eqDel':EQ.pieces.splice(EQ.sel,1);EQ.sel=Math.min(EQ.sel,EQ.pieces.length-1);EQ.focusKey=null;renderEq();break;
  case'eqTab':EQ.tab=b.dataset.k;renderEq();break;
  case'eqOk':eqOk();break;case'eqClose':$('#eqdlg').close();break;
  case'img':imgTarget=b.dataset.path;$('#imgIn').click();break;
  case'imgDel':{const [x,qid,iid]=b.dataset.path.split('.');const qq=findQ(qid);if(x==='q')qq.image=null;else qq.items.find(i=>i.id===iid).image=null;commit();break;}
  case'autoTitle':p.meta.titleAuto=true;autoTitles(p);commit();break;
  case'autoSub':p.meta.subtitleAuto=true;autoTitles(p);commit();break;
  case'logo':$('#logoIn').click();break;case'logoDel':p.meta.logo='';commit();break;
  case'logoReset':Object.assign(p.meta,{logoDx:0,logoDy:0,logoH:16});commit();break;
  case'font':$('#fontIn').click();break;
  case'undo':undo(-1);break;case'redo':undo(1);break;
  case'save':download();break;case'open':$('#fileIn').click();break;case'print':doPrint(false);break;
  case'new':{const fresh=JSON.parse(JSON.stringify(p));fresh.questions=[];fresh.pristine=false;S.stages[S.active]=fresh;UI.open=null;LAST=null;commit();toast('ورقة فارغة، احتفظت بالترويسة والتنسيق',{label:'تراجع',run:()=>undo(-1)});break;}
  case'wizard':openWizard(1);break;
  case'wz':{const f=b.dataset.f,v=b.dataset.v;W[f]=v;if(f==='stage'){const pr=S.stages[v].meta;W.replace=false;W.grade=pr.grade;W.subject=pr.subject;W.kind=pr.examKind;W.round=pr.round;W.year=pr.year;W.time=pr.time;W.school=pr.school;W.teacher=pr.teacher;}
   if(f==='stage'){const m=S.stages[v].meta;for(const k of ['country','ministry','directorate','hijri','note'])W[k]=m[k];}
   if(f==='grade'){const subs=subjectsFor(W.stage,v);if(!subs.includes(W.subject))W.subject=subs[0];}renderWizard();break;}
  case'wzNext':if(W.step<3){W.step++;renderWizard();}else finishWizard();break;
  case'wzBack':W.step--;renderWizard();break;
  case'wzClose':$('#wizard').hidden=true;document.body.classList.remove('wz-open');break;
  case'zin':UI.zoom=Math.min(1.6,(typeof UI.zoom==='number'?UI.zoom:parseFloat($('#zoomer').style.zoom)||1)+.1);applyZoom();break;
  case'zout':UI.zoom=Math.max(.3,(typeof UI.zoom==='number'?UI.zoom:parseFloat($('#zoomer').style.zoom)||1)-.1);applyZoom();break;
  case'zfit':UI.zoom='fit';applyZoom();break;
 }
});
document.addEventListener('focusin',e=>{if(EQ&&e.target.dataset&&e.target.dataset.eq!==undefined&&e.target.type!=='checkbox'){EQ.focusKey=e.target.dataset.eq;EQ.caret=null;}
 const path=e.target.dataset?.r||e.target.dataset?.k,m=path&&/^(it\.[a-z0-9]+\.[a-z0-9]+)\.cell\.(\d+)\.(\d+)$/.exec(path);
 if(m){UI.tableCells[m[1]]=[+m[2],+m[3]];const info=$(`[data-cell-info="${m[1]}"]`);if(info)info.textContent=`الصف ${+m[2]+1}، العمود ${+m[3]+1}. اضغط على خلية لتحديدها.`;}
});
document.addEventListener('input',e=>{
 const el=e.target;
 if(el.dataset&&el.dataset.eq!==undefined){const p=EQ.pieces[EQ.sel];if(!p)return;p[el.dataset.eq]=el.type==='checkbox'?el.checked:el.value;eqLive();return;}
 if(el.dataset&&el.dataset.wz){W[el.dataset.wz]=el.type==='checkbox'?el.checked:el.value;if(el.dataset.wz==='subject'&&el.value.trim()){W.subject=el.value.trim();$$('#wizard [data-f=subject]').forEach(c=>c.setAttribute('aria-pressed','false'));$('#wizard [data-act=wzNext]').disabled=false;}return;}
 if(el.dataset&&el.dataset.b){
  const path=el.dataset.b;setPath(path,el.type==='checkbox'?el.checked:el.value);
  if(el.tagName==='TEXTAREA')grow(el);
  if(el.type==='checkbox'){commit();return;}
  if(el.type==='range'){const s=el.parentElement.querySelector('b');if(s)s.textContent=el.value;}
  changed();return;
 }
 const r=el.closest&&el.closest('[data-r]');if(r){fireEdit(r);return;}
 const k=el.closest&&el.closest('#pages [data-k]');
 if(k)fireEdit(k);
});
const pagesEl=$('#pages');
$('#eqdlg').addEventListener('close',()=>{if(paperPending)setTimeout(renderPaper,0);});
pagesEl.addEventListener('keydown',e=>{const k=e.target.closest('[data-k]');if(!k)return;if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();k.blur();}if(e.key==='Escape')k.blur();});
document.addEventListener('paste',e=>{const k=e.target.closest&&e.target.closest('#pages [data-k],[data-r]');if(!k)return;e.preventDefault();
 const text=(e.clipboardData||window.clipboardData).getData('text/plain').replace(/\r\n?/g,'\n'),path=k.dataset.r||k.dataset.k;
 const cell=/^(it\.[a-z0-9]+\.[a-z0-9]+)\.cell\.(\d+)\.(\d+)$/.exec(path);
 if(cell&&text.includes('\t')){pasteTable(cell,text);return;}
 pushHist();document.execCommand('insertText',false,text);fireEdit(k);
});
function pasteTable(m,text){
 const [,qid,iid]=m[1].split('.'),x=findQ(qid)?.items.find(i=>i.id===iid);if(!x?.table)return;
 const grid=text.replace(/\n$/,'').split('\n').map(r=>r.split('\t')),r0=+m[2],c0=+m[3],w=Math.max(...grid.map(r=>r.length));
 if(r0+grid.length>30||c0+w>10){toast('اللصق يتجاوز الحد: ٣٠ صفاً و١٠ أعمدة. لم يتغير الجدول');return;}
 pushHist();const rows=x.table.rows,target=Math.max(rows[0].length,c0+w);
 rows.forEach(r=>{while(r.length<target)r.push('');});while(rows.length<r0+grid.length)rows.push(Array(target).fill(''));
 grid.forEach((r,i)=>r.forEach((v,j)=>rows[r0+i][c0+j]=v));P().pristine=false;commit();toast('لُصقت البيانات في خلايا الجدول',{label:'تراجع',run:()=>undo(-1)});
}
pagesEl.addEventListener('focusout',()=>{setTimeout(()=>{const ae=document.activeElement;if(paperPending&&!(ae&&ae.closest&&ae.closest('#pages [data-k]'))){pushHist();renderPaper();renderSide();}},0);});
document.addEventListener('selectionchange',()=>{const s=getSelection();if(!s||!s.rangeCount)return;const n=s.anchorNode,e=n&&(n.nodeType===1?n:n.parentElement);const el=e&&e.closest&&e.closest('[data-r],#pages [data-k]');if(el)LAST={el,range:s.getRangeAt(0).cloneRange()};});
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('.keep')){if(e.pointerType!=='touch')e.preventDefault();captureSelection();}});
function captureSelection(){const s=getSelection();if(!s||!s.rangeCount)return;const r=s.getRangeAt(0),n=r.commonAncestorContainer,el=(n.nodeType===1?n:n.parentElement).closest('[data-r],#pages [data-k]');if(el)LAST={el,range:r.cloneRange()};}
document.addEventListener('focusin',e=>{if(e.target.closest&&e.target.closest('[data-r],#pages [data-k]'))captureSelection();});
let composing=false;
document.addEventListener('compositionstart',()=>{composing=true;});
document.addEventListener('compositionend',e=>{composing=false;const el=e.target.closest&&e.target.closest('[data-r],#pages [data-k]');if(el)fireEdit(el);});
document.addEventListener('toggle',e=>{if(e.target.dataset&&e.target.dataset.lay)UI.lay[e.target.dataset.lay]=e.target.open;},true);
const laidImages=new Set();
pagesEl.addEventListener('load',e=>{if(e.target.tagName==='IMG'&&!laidImages.has(e.target.src)){laidImages.add(e.target.src);clearTimeout(paperT);paperT=setTimeout(renderPaper,100);}},true);
window.addEventListener('pagehide',save);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();});
let drag=null;
pagesEl.addEventListener('pointerdown',e=>{const lg=e.target.closest('.lg');if(!lg)return;e.preventDefault();const m=P().meta,pg=lg.closest('.page').getBoundingClientRect();
 drag={lg,resize:!!e.target.closest('.lg-h'),x:e.clientX,y:e.clientY,dx:m.logoDx,dy:m.logoDy,h:m.logoH,pxmm:pg.width/210};lg.setPointerCapture(e.pointerId);lg.classList.add('drag');});
pagesEl.addEventListener('pointermove',e=>{if(!drag)return;const m=P().meta,ddx=(e.clientX-drag.x)/drag.pxmm,ddy=(e.clientY-drag.y)/drag.pxmm;
 if(drag.resize){m.logoH=Math.round(Math.min(40,Math.max(8,drag.h+ddy))*2)/2;drag.lg.style.height=m.logoH+'mm';}
 else{m.logoDx=Math.round((drag.dx+ddx)*2)/2;m.logoDy=Math.round((drag.dy+ddy)*2)/2;drag.lg.style.transform=`translate(${m.logoDx}mm,${m.logoDy}mm)`;}});
const endDrag=()=>{if(!drag)return;drag.lg.classList.remove('drag');drag=null;commit();};
pagesEl.addEventListener('pointerup',endDrag);pagesEl.addEventListener('pointercancel',endDrag);
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)importFile(f);});
$('#logoIn').addEventListener('change',async e=>{const f=e.target.files[0],stage=S.active,project=P();e.target.value='';if(!f)return;try{const {src}=await readImage(f,500);if(S.stages[stage]!==project)return;Object.assign(project.meta,{logo:src,logoDx:0,logoDy:0});project.meta.show.logo=true;commit();}catch{toast('اختر صورة PNG أو JPG أو WEBP');}});
$('#imgIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)onImage(f);});
$('#fontIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)onFont(f);});
document.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.eq!==undefined){e.preventDefault();return;}
 if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.r){e.preventDefault();document.execCommand('insertLineBreak');return;}
 if(e.key==='Escape'&&!$('#sympop').hidden){symPop(false);return;}
 const mod=e.ctrlKey||e.metaKey;if(!mod)return;const inField=e.target.closest&&e.target.closest('input,textarea,[contenteditable]'),k=e.key.toLowerCase();
 if(k==='s'){e.preventDefault();download();}else if(k==='p'){e.preventDefault();doPrint(false);}
 else if(k==='z'&&!$('#eqdlg').open){e.preventDefault();document.activeElement&&document.activeElement.blur();undo(e.shiftKey?1:-1);}else if(k==='y'&&!$('#eqdlg').open){e.preventDefault();document.activeElement&&document.activeElement.blur();undo(1);}
});
let rzT;window.addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{if(desk()&&UI.view==='preview')UI.view='questions';$('#app').dataset.view=UI.view;applyZoom();},120);});
if(document.fonts){document.fonts.ready.then(()=>renderPaper()).catch(()=>{});document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',()=>renderPaper());}
loadFont();renderAll();pushHist();
showWelcome();
if(recoveryUsed)toast('استُعيدت آخر نسخة محلية سليمة. احفظ ملف مشروع احتياطياً',{label:'حفظ ملف',run:download});
if(OPEN_LESSON)startLesson();
})();
