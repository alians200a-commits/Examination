/* ===== رسم الورقة (نص HTML فقط، يصلح للمتصفح وللاختبار) ===== */
function makeCtx(p,stage){
 const dg=p.digits==='auto'?autoNumbering(stage,p.meta.subject):p.digits;
 const en=p.dir==='ltr'||(p.dir==='auto'&&isForeign(p.meta.subject));
 const ar=dg==='arabic'&&!en;
 const D=s=>ar?toAr(s):toLa(s);
 const L=i=>(ar?PART_AR[i]:PART_EN[i])||D(String(i+1));
 const lab=(f,i)=>f==='none'?'':f.startsWith('n')?D(String(i+1))+({'n-dash':'-','n-dot':'.','n-paren':')'}[f]):L(i)+(f==='l-paren'?')':'-');
 return{dg,en,ar,D,L,lab,rich:t=>richHTML(t,D,ar?'ar':'en'),richEd:t=>richHTML(t,D,ar?'ar':'en',true),edit:true};
}
const visLen=t=>String(t||'').replace(/\$\$?([^$]*)\$\$?/g,(m,x)=>'x'.repeat(Math.min(72,Math.ceil(x.replace(/\\[a-z]+|[{}]/gi,'').length*.7)))).replace(/\*\*|__/g,'').trim().length;
function autoCols(q){
 if(q.cols>0)return q.cols;
 const xs=q.items;if(!xs.length||q.kind==='text')return 1;
 if(q.kind==='match'||xs.some(x=>x.choices.some(s=>s.trim())||x.subs.some(s=>s.trim())||x.image||x.table||x.answerLines))return 1;
 const max=Math.max(...xs.map(x=>visLen(x.text)+(x.score.trim()?6:0))),n=xs.length;
 if(n>=3&&max<=26)return 3;
 if(n>=2&&max<=38)return 2;
 return 1;
}
function ed(c,path,text,cls='',ph=''){
 if(!c.edit)return`<span class="${cls}">${c.rich(text)}</span>`;
 return`<span class="${cls}${hasRich(text)?' rich':''}" data-k="${path}" data-rich="1" data-ph="${esc(ph)}" contenteditable="true" spellcheck="false">${c.richEd(text)}</span>`;
}
const vis=(m,k)=>m.show[k]!==false;
const logoHTML=m=>`<span class="lg" style="height:${m.logoH}mm;transform:translate(${m.logoDx}mm,${m.logoDy}mm)"><img src="${m.logo}" alt="" draggable="false"><span class="lg-h" title="اسحب لتغيير الحجم"></span></span>`;
function noteHTML(c,m){return vis(m,'note')&&m.note?`<div class="pnote"><span class="nt"><b class="nl">${ed(c,'meta.noteLabel',m.noteLabel)}</b> ${ed(c,'meta.note',m.note)}</span></div>`:'';}
function nameHTML(c,m){return vis(m,'name')?`<div class="pname">${ed(c,'meta.nameLabel',m.nameLabel,'lbl')}<span class="dots"></span></div>`:'';}
function headerHTML(p,c){
 const m=p.meta,L=(lp,l,vp,v,cls='')=>`<div class="hl ${cls}">${ed(c,lp,l,'lbl')} ${ed(c,vp,v,'val kp','..................')}</div>`;
 const right=[vis(m,'country')&&`<div>${ed(c,'meta.country',m.country)}</div>`,vis(m,'ministry')&&`<div>${ed(c,'meta.ministry',m.ministry)}</div>`,
  vis(m,'directorate')&&m.directorate&&`<div>${ed(c,'meta.directorate',m.directorate)}</div>`,vis(m,'school')&&L('meta.schoolLabel',m.schoolLabel,'meta.school',m.school)].filter(Boolean).join('');
 const mid=[vis(m,'logo')&&m.logo&&`<div class="lgw">${logoHTML(m)}</div>`,vis(m,'title')&&`<div class="ttl">${ed(c,'meta.title',m.title)}</div>`,
  vis(m,'year')&&L('meta.yearLabel',m.yearLabel,'meta.year',m.year,'yr'),
  vis(m,'round')&&hasRound(m.examKind)&&m.round&&`<div class="rnd">${ed(c,'meta.round',m.round)}</div>`].filter(Boolean).join('');
 const left=[vis(m,'subtitle')&&`<div class="sub grade">${ed(c,'meta.subtitle',m.subtitle)}</div>`,vis(m,'subject')&&L('meta.subjectLabel',m.subjectLabel,'meta.subject',m.subject),
  vis(m,'time')&&m.time&&L('meta.timeLabel',m.timeLabel,'meta.time',m.time),vis(m,'hijri')&&m.hijri&&`<div class="hl">${ed(c,'meta.hijri',m.hijri,'val')}</div>`].filter(Boolean).join('');
 const box=true;
 return`<header class="ph${box?' box':''}"><div class="hg"><div class="hr">${right}</div><div class="hm">${mid}</div><div class="hlft">${left}</div></div>${box?nameHTML(c,m).replace('pname','pname in'):''}</header>${box?'':'<div class="hrule"></div>'}${noteHTML(c,m)}${box?'':nameHTML(c,m)}`;
}
function footerHTML(p,c){
 const m=p.meta;
 const t=vis(m,'teacher')?`<span class="ft">${ed(c,'meta.teacherLabel',m.teacherLabel,'lbl')} ${m.teacher?ed(c,'meta.teacher',m.teacher,'val'):'<span class="dots short"></span>'}</span>`:'';
 const l=vis(m,'footLeft')&&(m.footLeftLabel||m.footLeft)?`<span class="ft">${ed(c,'meta.footLeftLabel',m.footLeftLabel,'lbl')} ${ed(c,'meta.footLeft',m.footLeft,'val')}</span>`:'';
 const cl=vis(m,'closing')&&m.closing?`<span class="cl">${ed(c,'meta.closing',m.closing)}</span>`:'';
 if(!t&&!l&&!cl)return'';
 return`<div class="pf">${cl}<span class="sg">${l}${t}</span></div>`;
}
const flipHTML=(p,c)=>vis(p.meta,'flip')?`<div class="pflip"><span class="ln"></span>${ed(c,'meta.flip',p.meta.flip)}<span class="ln"></span></div>`:'';
function imgHTML(img){return`<figure class="qi al-${img.align}${img.side?' side':''}" style="width:${img.w}%"><img src="${img.src}" alt="" style="aspect-ratio:${img.r}"></figure>`;}
function qnum(n,c,p){const N=c.D(String(n)),s=c.en?'Q':'س';return{slash:`${s}${N}/`,paren:`${s}${N})`,colon:`${s}${N}:`,pre:`${s}:${N})`}[p.qStyle];}
const scoreH=(raw,c,p,cls='qs')=>{const t=scoreText(raw,c.en,c.D,p.style==='source');return t?`<span class="${cls}">${esc(t)}</span>`:'';};
function itemHTML(q,x,i,c,p,cols,part){
 const lb=c.lab(q.label,i),img=x.image?imgHTML(x.image):'',side=x.image&&x.image.side;
 const chIdx=x.choices.map((s,j)=>s.trim()?j:-1).filter(j=>j>=0),ch=chIdx.map(j=>x.choices[j].trim());
 const cE=j=>ed(c,`it.${q.id}.${x.id}.choice.${chIdx[j]}`,ch[j]);
 const letter=j=>q.chStyle==='letters'?`${c.ar?(PART_AR[j]||c.D(j+1)):(PART_EN[j]||String(j+1))}- `:'';
 let chH='',chB='';
 if(ch.length&&q.chLayout==='inline')chH=` <span class="ch">( ${q.chStyle==='letters'?ch.map((s,j)=>letter(j)+cE(j)).join(c.en?' , ':' ، '):ch.map((s,j)=>cE(j)).join(q.chStyle==='dash'?' – ':' ، ')} )</span>`;
 else if(ch.length){const lay=q.chLayout,long=Math.max(...ch.map(visLen)),cc=lay==='grid'?(long<=14&&ch.length>=4?4:long<=30&&ch.length>=3?3:2):0;
  chB=`<div class="chl${lay==='grid'?' grid':lay==='stack'?' stack':''}"${cc?` style="--cc:${Math.min(cc,ch.length)}"`:''}>${ch.map((s,j)=>`<span class="cho">${letter(j)?`<span class="il">${esc(letter(j).trim())}</span> `:''}${cE(j)}${q.chStyle==='plain'&&lay==='line'?' .':''}</span>`).join('')}</div>`;}
 const tb=x.table?tableHTML(x.table,c,`it.${q.id}.${x.id}`,part):'';
 if(part&&part.cont)return`<div class="ir table-cont" data-item="${x.id}"><div class="ix">${tb}${part.last&&x.answerLines?`<div class="answer-lines">${'<div></div>'.repeat(x.answerLines)}</div>`:''}</div></div>`;
 const subs=x.subs.map((s,j)=>({s:s.trim(),j})).filter(v=>v.s);
 const subH=subs.length?`<div class="subs">${subs.map((v,k)=>`<span class="sb"><span class="il">${esc(c.lab(x.subLabel,k))}</span> ${ed(c,`it.${q.id}.${x.id}.sub.${v.j}`,v.s)}</span>`).join('')}</div>`:'';
 const strong=q.label.startsWith('l')&&cols===1;
 const answer=x.answerLines&&(!part||part.last)?`<div class="answer-lines" aria-label="${c.en?'Answer space':'مساحة الإجابة'}">${'<div></div>'.repeat(x.answerLines)}</div>`:'';
 return`<div class="ir${strong?' br':''}">${lb?`<span class="il">${esc(lb)}</span>`:''}<div class="ix"${x.align&&x.align!=='auto'?` style="text-align:${x.align}"`:''}>${side?img:''}${ed(c,`it.${q.id}.${x.id}.text`,x.text,'',c.en?'Type here':'اكتب هنا')}${chH}${x.score.trim()?' '+scoreH(x.score,c,p,'qs in'):''}${chB}${side?'':img}${subH}${tb}${answer}</div></div>`;
}
function tableHTML(t,c,path,part){
 const from=part?.from??0,to=part?.to??t.rows.length;
 const indices=Array.from({length:Math.max(0,to-from)},(_,i)=>from+i);
 if(part?.cont&&t.head&&from>0)indices.unshift(0);
 const hasHeader=t.head&&indices.includes(0);
 const row=i=>`<tr data-table-row="${i}">${t.rows[i].map((v,j)=>{const tag=hasHeader&&i===0?'th':'td';return`<${tag}${tag==='th'?' scope="col"':''}>${ed(c,`${path}.cell.${i}.${j}`,v)}</${tag}>`;}).join('')}</tr>`;
 return`<table class="qtab${t.full?' full':' ctr'}" data-table="${path}" style="--ta:${t.align||'center'}" aria-label="${c.en?'Exam question table':'جدول السؤال'}">${hasHeader?`<thead>${row(0)}</thead>`:''}<tbody>${indices.filter(i=>!(hasHeader&&i===0)).map(row).join('')}</tbody></table>`;
}
/* ترتيب العمود (ب) مخلوط بشكل ثابت حسب رقم السؤال حتى لا يتغير مع كل عرض */
function matchOrder(q){
 const b=q.items.map((x,i)=>({v:x.pair,k:i})).concat(q.extra.map((v,i)=>({v,k:100+i})).filter(o=>o.v.trim()));
 if(!q.shuffle)return b;
 let h=0;for(const ch of q.id)h=(h*31+ch.charCodeAt(0))>>>0;
 const r=()=>{h=(h*1664525+1013904223)>>>0;return h/4294967296;};
 for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]];}
 if(b.length>2&&b.every((o,i)=>o.k===i))b.push(b.shift());
 return b;
}
function matchHTML(q,c,from,to){
 const B=matchOrder(q),last=to>=q.items.length,end=last?Math.max(to,B.length):to;
 const A=c.en?'Column A':'العمود (أ)',Bh=c.en?'Column B':'العمود (ب)';
 const ha=ed(c,`q.${q.id}.colA`,q.colA||A),hb=ed(c,`q.${q.id}.colB`,q.colB||Bh);
 const bl=j=>c.L(j)+'-';
 const rows=[];for(let i=from;i<end;i++){const x=q.items[i],y=B[i];rows.push({a:x?{lb:c.lab(q.label==='none'?'n-dot':q.label,i),h:ed(c,`it.${q.id}.${x.id}.text`,x.text)+(x.image?imgHTML(x.image):'')}:null,b:y?{lb:bl(i),h:ed(c,y.k<100?`it.${q.id}.${q.items[y.k].id}.pair`:`q.${q.id}.extra.${y.k-100}`,y.v)}:null});}
 if(q.mStyle==='lists')return`<div class="mlist">${from===0?`<span class="mh">${ha}</span><span></span><span class="mh">${hb}</span>`:''}${rows.map(r=>`<span class="ma">${r.a?`<span><span class="il">${esc(r.a.lb)}</span> ${r.a.h}</span><span class="dot"></span>`:''}</span><span></span><span class="mb">${r.b?`<span class="dot"></span><span><span class="il">${esc(r.b.lb)}</span> ${r.b.h}</span>`:''}</span>`).join('')}</div>`;
 return`<table class="mtab">${from===0?`<tr><th>${ha}</th><th class="ans"></th><th>${hb}</th></tr>`:''}${rows.map(r=>`<tr><td>${r.a?`<span class="il">${esc(r.a.lb)}</span>${r.a.h}`:''}</td><td class="ans">${r.a?'(&emsp;&ensp;)':''}</td><td>${r.b?`<span class="il">${esc(r.b.lb)}</span>${r.b.h}`:''}</td></tr>`).join('')}</table>`;
}
function blockHTML(q,n,c,p,from,to,head,part){
 if(q.kind==='text'&&!q.prompt.trim()&&!q.showScore){
  return`<section class="qb free-block" data-q="${q.id}" dir="${c.en?'ltr':'rtl'}"><div class="qbody" style="--cols:1">${q.items.slice(from,to).map((x,k)=>itemHTML(q,x,from+k,c,p,1,part)).join('')}</div></section>`;
 }
 if(q.kind==='section')return`<section class="qb sec" data-q="${q.id}"><span class="sec-t">${ed(c,`q.${q.id}.prompt`,q.prompt,'','عنوان القسم')}${q.showScore&&q.score?` (${esc(scoreText(q.score,c.en,c.D,false))})`:''}</span></section>`;
 const cols=part?1:autoCols(q);let h='';
 if(head)h+=`<div class="qh"><span class="qmk"></span><h2><span class="qn">${esc(q.title.trim()?c.D(q.title.trim()):qnum(n,c,p))}</span> ${ed(c,`q.${q.id}.prompt`,q.prompt,'',c.en?'Question':'نص السؤال')}</h2>${q.showScore?scoreH(q.score,c,p):''}</div>`;
 else h+=`<div class="qcontinue">${esc(q.title.trim()?c.D(q.title.trim()):qnum(n,c,p))} ${c.en?'(continued)':'(تابع)'}</div>`;
 if(head&&q.image)h+=imgHTML(q.image);
 const items=q.items.slice(from,to);
 if(q.kind==='match'){if(items.length||(head&&q.extra.length))h+=`<div class="qbody" style="--cols:1">${matchHTML(q,c,from,to)}</div>`;return`<section class="qb${head?'':' cont'}" data-q="${q.id}" dir="${c.en?'ltr':'rtl'}">${h}</section>`;}
 if(items.length)h+=`<div class="qbody${q.boxed?' boxed':''}" style="--cols:${cols}">${items.map((x,k)=>itemHTML(q,x,from+k,c,p,cols,part)).join('')}</div>`;
 return`<section class="qb${head?'':' cont'}" data-q="${q.id}" dir="${c.en?'ltr':'rtl'}">${h}</section>`;
}
function pageShell(p,c,first,inner,bottom){
 return`<article class="page"><div class="pin">${first?headerHTML(p,c):''}<div class="pbody">${inner||''}</div><div class="pbot">${bottom||''}</div></div></article>`;
}
function paperClass(p){return`pages st-source th-${p.theme} dn-${p.density}`;}
