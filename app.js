(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const AR='٠١٢٣٤٥٦٧٨٩',FA='۰۱۲۳۴۵۶۷۸۹';
const toAr=s=>String(s).replace(/[0-9]/g,d=>AR[d]).replace(/[۰-۹]/g,d=>AR[FA.indexOf(d)]);
const toLa=s=>String(s).replace(/[٠-٩]/g,d=>AR.indexOf(d)).replace(/[۰-۹]/g,d=>FA.indexOf(d));
/* ===== محرك الرياضيات: صيغة LaTeX مبسطة تُرسم HTML حقيقي ===== */
const SYM={times:'×',div:'÷',pm:'±',mp:'∓',cdot:'·',le:'≤',leq:'≤',ge:'≥',geq:'≥',ne:'≠',neq:'≠',approx:'≈',equiv:'≡',sim:'~',to:'→',rightarrow:'→',leftarrow:'←',Rightarrow:'⇒',Leftrightarrow:'⇔',leftrightarrow:'↔',rightleftharpoons:'⇌',lor:'∨',land:'∧',neg:'~',lnot:'~',cap:'∩',cup:'∪',in:'∈',notin:'∉',subset:'⊂',subseteq:'⊆',supset:'⊃',emptyset:'∅',varnothing:'∅',infty:'∞',angle:'∠',triangle:'△',degree:'°',circ:'°',perp:'⊥',parallel:'∥',therefore:'∴',because:'∵',forall:'∀',exists:'∃',sum:'∑',int:'∫',prod:'∏',partial:'∂',nabla:'∇',prime:'′',ldots:'…',cdots:'⋯',
 alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',theta:'θ',lambda:'λ',mu:'μ',pi:'π',rho:'ρ',sigma:'σ',tau:'τ',phi:'φ',omega:'ω',Delta:'Δ',Gamma:'Γ',Theta:'Θ',Lambda:'Λ',Pi:'Π',Sigma:'Σ',Phi:'Φ',Omega:'Ω'};
Object.assign(SYM,{varepsilon:'ε',vartheta:'ϑ',varphi:'φ',eta:'η',kappa:'κ',nu:'ν',xi:'ξ',chi:'χ',psi:'ψ',zeta:'ζ',Psi:'Ψ',ell:'ℓ',AA:'Å',deg:'°',permil:'‰',bullet:'•',star:'⋆',leftrightharpoons:'⇋',rightharpoonup:'⇀',mapsto:'↦',implies:'⇒',iff:'⇔',ni:'∋',setminus:'∖',sqcup:'⊔',top:'⊤',bot:'⊥',cong:'≅',simeq:'≃',ll:'≪',gg:'≫',dagger:'†',measuredangle:'∡',square:'□',Box:'□',lozenge:'◊'});
Object.assign(SYM,{uparrow:'↑',downarrow:'↓',longrightarrow:'⟶',longleftarrow:'⟵',Leftarrow:'⇐',nearrow:'↗',searrow:'↘',propto:'∝',hbar:'ℏ',ohm:'Ω'});
const AR_FN={sin:'جا',cos:'جتا',tan:'ظا',cot:'ظتا',sec:'قا',csc:'قتا',arcsin:'جا⁻¹',arccos:'جتا⁻¹',arctan:'ظا⁻¹',log:'لو'};
const FUNCS=new Set(['sin','cos','tan','cot','sec','csc','log','ln','exp','min','max','det','mod','arcsin','arccos','arctan','sinh','cosh','tanh']);
const OPS='+-−×÷=<>≤≥≠±∓≈≡→←⇌⇒⇔↔⟶∨∧∩∪∈∉⊂⊆⊃∝·';
const REL='=<>≤≥≠≈≡→←⇌⇒⇔↔⟶∈∉⊂⊆⊃∝';
function texToHTML(src,lang){
 const problem=texProblem(src);if(problem)return`<span class="mx math-error" title="${esc(problem)}">${esc(src)}</span>`;
 const D=lang==='ar'?toAr:toLa,s=String(src);let i=0,guard=0;
 const sp=()=>{while(s[i]===' ')i++;};
 function group(stop){let out='';while(i<s.length&&!stop()){if(++guard>20000)break;out+=atom();}return out;}
 function braced(){sp();if(s[i]==='{'){i++;const r=group(()=>s[i]==='}');i++;return r;}return base();}
 function rawBraced(){sp();if(s[i]!=='{')return'';i++;let d=1,o='';while(i<s.length){const c=s[i++];if(c==='{')d++;else if(c==='}'&&!--d)break;o+=c;}return o;}
 function atom(){
  let b=base(),sup=null,sub=null;
  for(;;){if(s[i]==='^'){i++;sup=braced();}else if(s[i]==='_'){i++;sub=braced();}else break;}
  if(sup===null&&sub===null)return b;
  if(b.startsWith('<span class="mlim'))return`<span class="mul${sup!==null?' ht':''}${sub!==null?' hb':''}">${sup!==null?`<span class="mul-t">${sup}</span>`:''}${b}${sub!==null?`<span class="mul-b">${sub}</span>`:''}</span>`;
  const tall=/^<span class="(mf|mfence|mr|mg"><span class="mfence)/.test(b),big=b.startsWith('<span class="mint');
  if(sup!==null&&sub!==null)return`${b}<span class="mss${big?' int':''}${tall?' hi':''}"><span>${sup}</span><span>${sub}</span></span>`;
  return sup!==null?`${b}<sup class="msup${tall?' hi':''}">${sup}</sup>`:`${b}<sub class="msub${big?' int':''}">${sub}</sub>`;
 }
 const cell=h=>h&&h.trim()?h:'<span class="m-gap"></span>';
 const fence=(o,c,inner)=>{const f=d=>d==='.'||!d?'':`<span class="mfz" data-d="${esc(d)}">${fenceSVG(d)}</span>`;return`<span class="mfence">${f(o)}<span class="mfc">${inner}</span>${f(c)}</span>`;};
 function delim(){sp();if(s[i]==='\\'){if(s[i+1]==='{'||s[i+1]==='}'){i+=2;return s[i-1];}if(s.startsWith('\\|',i)){i+=2;return'‖';}}return s[i++]||'.';}
 function base(){
  const c=s[i];if(c===undefined)return'';
  if(c==='{'){i++;const r=group(()=>s[i]==='}');i++;return`<span class="mg">${r}</span>`;}
  if(c==='\\'){
   i++;let name='';while(i<s.length&&/[A-Za-z]/.test(s[i]))name+=s[i++];
   if(name&&!['left','right'].includes(name))while(s[i]===' '&&name!=='text')i++;
   if(!name){const ch=s[i++]||'';return ch===','?'<span class="m-th"></span>':ch===' '?' ':ch===';'?'<span class="m-sp"></span>':esc(ch);}
   switch(name){
    case'frac':case'dfrac':case'tfrac':{const a=braced(),b=braced();return`<span class="mf"><span>${cell(a)}</span><span>${cell(b)}</span></span>`;}
    case'sqrt':{sp();let n='';if(s[i]==='['){i++;n=group(()=>s[i]===']');i++;}const x=braced();const deg=n&&!/^\s*[2٢]\s*$/.test(n);return`<span class="mr${deg?' ix':''}">${deg?`<span class="mr-i">${n}</span>`:''}<span class="mr-s">${rootSVG()}</span><span class="mr-u">${cell(x)}</span></span>`;}
    case'isotope':{const a=braced(),z=braced(),x=braced().replace(/<\/?i>/g,'');return`<span class="miso"><span class="mss pre"><span>${a}</span><span>${z}</span></span>${x}</span>`;}
    case'system':{const a=braced(),b=braced();return`<span class="mfence msys-w"><span class="mfz">${fenceSVG('{')}</span><span class="msys"><span>${a}</span><span>${b}</span></span></span>`;}
    case'lim':return`<span class="mlim mfn">${lang==='ar'?'نها':'lim'}</span>`;
    case'sum':return`<span class="mlim mbig">∑</span>`;
    case'prod':return`<span class="mlim mbig">∏</span>`;
    case'int':return`<span class="mint">∫</span>`;
    case'oint':return`<span class="mint">∮</span>`;
    case'dot':return`<span class="mdot">${braced()}</span>`;
    case'hat':return`<span class="mhat">${braced()}</span>`;
    case'unit':return`<span class="munit">${braced()}</span>`;
    case'qty':{const v=braced(),u=braced().replace(/<\/?i>/g,'');return`${v}<span class="munit">${u}</span>`;}
    case'longdiv':{const a=rawBraced(),b=rawBraced(),q=rawBraced();sp();const st=s[i]==='{'?rawBraced():'';return ldHTML(a,b,q,st==='1',lang,D);}
    case'text':case'mathrm':case'textrm':case'mbox':return`<span class="mtx">${esc(D(rawBraced()))}</span>`;
    case'overline':case'bar':return`<span class="mov">${braced()}</span>`;
    case'vec':case'overrightarrow':return`<span class="mvec">${braced()}</span>`;
    case'abs':return`|${braced()}|`;
    case'left':{const o=delim();const inner=group(()=>s.startsWith('\\right',i));if(s.startsWith('\\right',i))i+=6;const cl=delim();return fence(o,cl,inner);}
    case'right':return'';
    case'quad':return'<span class="m-q"></span>';case'qquad':return'<span class="m-q"></span><span class="m-q"></span>';
    case'xrightarrow':case'xrightleftharpoons':case'xleftarrow':{sp();let b='';if(s[i]==='['){i++;b=group(()=>s[i]===']');i++;}const a=braced();const k=name==='xrightarrow'?'r':name==='xleftarrow'?'l':'eq';return`<span class="marr"><span class="ma-t">${a||'&nbsp;'}</span><span class="ma-l">${arrowSVG(k)}</span><span class="ma-b">${b||'&nbsp;'}</span></span>`;}
    case'ce':return`<span class="mce" dir="ltr">${ceHTML(rawBraced(),D)}</span>`;
    case'mathbb':{const t=rawBraced();return esc({R:'ℝ',N:'ℕ',Z:'ℤ',Q:'ℚ',C:'ℂ'}[t]||t);}
   }
   if(FUNCS.has(name))return`<span class="mfn">${lang==='ar'&&AR_FN[name]||name}</span>`;
   if(SYM[name]){const v=SYM[name];return OPS.includes(v)?`<span class="mo${REL.includes(v)?' rel':''}">${v}</span>`:/[α-ω]/.test(v)?`<i>${v}</i>`:v;}
   return`<span class="math-error" title="صيغة غير مدعومة: ${esc(name)}">${esc('\\'+name)}</span>`;
  }
  i++;
  if(c===' '){while(s[i]===' ')i++;const pv=s[i-2]||'',nx=s[i]||'';return /[\u0600-\u06FF]/.test(pv)||/[\u0600-\u06FF]/.test(nx)?'<span class="m-sp"></span>':'';}
  if(c==='}')return'';
  if(/[A-Za-z]/.test(c))return`<i>${c}</i>`;
  if(/[0-9٠-٩۰-۹]/.test(c))return esc(D(c));
  if(c==='-'||c==='−'||c==='+'){let j=i-2;while(j>=0&&s[j]===' ')j--;const pv=j<0?'':s[j];const un=!pv||'({[=<>≤≥≠±+-−×÷,،^_'.includes(pv)||/\\left.$/.test(s.slice(0,j+1));return`<span class="mo${un?' un':''}">${c==='+'?'+':'−'}</span>`;}
  if(c==='*')return'<span class="mo">×</span>';
  if(c===','||c==='،')return`<span class="mc">${lang==='ar'?'،':','}</span>`;
  if(c==='.'&&/[0-9٠-٩]/.test(s[i]||'')&&/[0-9٠-٩]/.test(s[i-2]||''))return lang==='ar'?'٫':'.';
  if(OPS.includes(c))return`<span class="mo${REL.includes(c)?' rel':''}">${esc(c)}</span>`;
  return esc(c);
 }
 const out=group(()=>false);
 return`<span class="mx mx-${lang}" dir="${lang==='ar'?'rtl':'ltr'}">${out}</span>`;
}
function fenceSVG(d){
 const p={'(':'M9 1 Q1 20 9 39',')':'M1 1 Q9 20 1 39','[':'M9 1 H3 V39 H9',']':'M1 1 H7 V39 H1','|':'M5 1 V39','‖':'M3 1 V39 M7 1 V39','{':'M9 1 Q4 1 5 10 Q5 19 1 20 Q5 21 5 30 Q4 39 9 39','}':'M1 1 Q6 1 5 10 Q5 19 9 20 Q5 21 5 30 Q6 39 1 39'}[d];
 return p?`<svg viewBox="0 0 10 40" preserveAspectRatio="none" aria-hidden="true"><path d="${p}" fill="none" stroke="currentColor" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>`:esc(d);
}
function rootSVG(){return`<svg viewBox="0 0 12 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0.2 23.6 L2.7 21.3 L6.6 34.6 L11.25 0.2 L11.95 0.75 L7.05 39.8 L6.25 39.8 L1.95 24.4 L0.75 25.2 Z" fill="currentColor"/></svg>`;}

/* النص الغني: $$عربي$$ و $English$ و **عريض** و __مسطر__ وصيغة كسر( ) القديمة */
const RICH_RE=/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
const FN={'كسر':'frac','frac':'frac','جذر':'sqrt','sqrt':'sqrt','أس':'pow','pow':'pow','قسمة':'ld','longdiv':'ld'};
const FN_RE=/(كسر|frac|جذر|sqrt|أس|pow|قسمة|longdiv)\(/g;
function matchParen(s,open){let d=0;for(let i=open;i<s.length;i++){if(s[i]==='(')d++;else if(s[i]===')'){d--;if(!d)return i;}}return -1;}
function splitArgs(s){const out=[];let d=0,cur='';for(const c of s){if(c==='(')d++;if(c===')')d--;if(d===0&&(c===','||c==='،')){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out.map(x=>x.trim());}
function legacyToTex(src){
 let out='',i=0;
 while(i<src.length){FN_RE.lastIndex=i;const m=FN_RE.exec(src);if(!m){out+=src.slice(i);break;}
  const st=m.index,prev=src[st-1],open=st+m[0].length-1;
  if(prev&&/[\p{L}\p{M}]/u.test(prev)){out+=src.slice(i,open+1);i=open+1;continue;}
  const close=matchParen(src,open);if(close<0){out+=src.slice(i);break;}
  const a=splitArgs(src.slice(open+1,close)).map(legacyToTex),t=FN[m[1]];
  out+=src.slice(i,st)+(t==='frac'?`\\frac{${a[0]||''}}{${a[1]||''}}`:t==='sqrt'?(a[1]?`\\sqrt[${a[1]}]{${a[0]}}`:`\\sqrt{${a[0]||''}}`):t==='pow'?`{${a[0]||''}}^{${a[1]||''}}`:`\\longdiv{${a[0]||''}}{${a[1]||''}}{${a[2]||''}}`);
  i=close+1;}
 return out;
}
const hasLegacy=s=>{FN_RE.lastIndex=0;let m;const t=String(s);while((m=FN_RE.exec(t))){const p=t[m.index-1];if(!p||!/[\p{L}\p{M}]/u.test(p))return true;}return false;};
const hasRich=s=>{const t=String(s||'');RICH_RE.lastIndex=0;return RICH_RE.test(t)||/\*\*.+?\*\*|__.+?__/.test(t)||hasLegacy(t);};
const chipHTML=(tex,l,h)=>`<span class="eqc" contenteditable="false" data-l="${l}" data-tex="${esc(tex)}">${h}</span>`;
function richHTML(text,D,lang,chips){
 const tokens=[];
 const stash=(tex,l)=>{const h=texToHTML(tex,l);tokens.push(chips?chipHTML(tex,l,h):h);return'\uE200'+String.fromCharCode(0xE300+tokens.length-1)+'\uE201';};
 const t=String(text??'').replace(new RegExp(RICH_RE.source,'g'),(m,a,b)=>stash(a??b,a!==undefined?'ar':'en'));
 const mark=h=>h.replace(/\*\*([\s\S]+?)\*\*/g,'<b>$1</b>').replace(/__([\s\S]+?)__/g,'<u>$1</u>').replace(/\n/g,'<br>');
 const plain=seg=>{
  if(!hasLegacy(seg))return esc(D(seg));
  let o='',j=0;
  while(j<seg.length){FN_RE.lastIndex=j;const m=FN_RE.exec(seg);if(!m){o+=esc(D(seg.slice(j)));break;}
   const st=m.index,prev=seg[st-1],open=st+m[0].length-1;
   if(prev&&/[\p{L}\p{M}]/u.test(prev)){o+=esc(D(seg.slice(j,open+1)));j=open+1;continue;}
   const close=matchParen(seg,open);if(close<0){o+=esc(D(seg.slice(j)));break;}
   {const tx=legacyToTex(seg.slice(st,close+1)),lg=D('1')==='1'&&lang==='en'?'en':'ar';o+=esc(D(seg.slice(j,st)))+stash(tx,lg);}
   j=close+1;}
  return o;
 };
 return mark(plain(t)).replace(/\uE200([\s\S])\uE201/g,(m,c)=>tokens[c.charCodeAt(0)-0xE300]??m);
}

function ceHTML(raw,D){
 /* صيغ كيميائية: معاملات عادية، أدلة سفلية، شحنات فوق الدليل، حالات المادة، وأسهم بشرط */
 let o='',k=0;const t=String(raw);
 const grp=()=>{let g='';if(t[k]==='{'){k++;while(k<t.length&&t[k]!=='}')g+=t[k++];k++;}else{while(k<t.length&&/[0-9+\-]/.test(t[k]))g+=t[k++];}return esc(g.replace(/-/g,'−'));};
 const cond=()=>{if(t[k]!=='[')return'';const e=t.indexOf(']',k);const c=t.slice(k+1,e<0?t.length:e);k=e<0?t.length:e+1;return c;};
 const arr=(kind,top)=>top?`<span class="marr"><span class="ma-t">${esc(top)}</span><span class="ma-l">${arrowSVG(kind)}</span><span class="ma-b">&nbsp;</span></span>`:`<span class="mo rel">${kind==='eq'?'⇌':'→'}</span>`;
 while(k<t.length){const c=t[k];
  if(c==='^'){k++;o+=`<sup class="msup">${grp()}</sup>`;continue;}
  if(/[0-9]/.test(c)&&k>0&&/[A-Za-z)\]]/.test(t[k-1])){let g='';while(k<t.length&&/[0-9]/.test(t[k]))g+=t[k++];
   if(t[k]==='^'){k++;o+=`<span class="mss"><span>${grp()}</span><span>${g}</span></span>`;}else o+=`<sub class="msub">${g}</sub>`;continue;}
  if(c==='('&&k>0&&/^\((s|l|g|aq)\)/.test(t.slice(k))){const mm=t.slice(k).match(/^\((s|l|g|aq)\)/);o+=`<sub class="msub st">${mm[0]}</sub>`;k+=mm[0].length;continue;}
  if(t.startsWith('<=>',k)||t.startsWith('<->',k)){k+=3;o+=arr('eq',cond());continue;}
  if(t.startsWith('->',k)){k+=2;o+=arr('r',cond());continue;}
  if(c==='+'&&(k===0||t[k-1]===' ')){o+='<span class="mo">+</span>';k++;continue;}
  if(c==='='){o+='<span class="mo rel">=</span>';k++;continue;}
  if(c===' '){o+=' ';k++;while(t[k]===' ')k++;continue;}
  o+=esc(c);k++;}
 return o.replace(/ +(<span class="(mo|marr))/g,'$1').replace(/(<\/span>) +/g,'$1');
}


/* القسمة الطويلة بشكل الكتب المدرسية: الحاصرة، والناتج فوق المقسوم، وخطوات الحل اختيارياً */
function ldSteps(a,b){
 a=toLa(String(a));b=toLa(String(b));if(!/^\d{1,12}$/.test(a)||!/^\d{1,9}$/.test(b)||+b===0)return{q:'',rows:[],error:'القسمة تتطلب أعداداً صحيحة ومقسوم عليه أكبر من صفر'};
 const d=a.split('').map(Number),v=+b,rows=[];let cur=0,started=false,q='';
 for(let i=0;i<d.length;i++){cur=cur*10+d[i];if(!started&&cur<v&&i<d.length-1)continue;started=true;
  const qd=Math.floor(cur/v),prod=qd*v;q+=qd;rows.push({t:'p',v:String(prod),end:i});const rem=cur-prod;
  rows.push({t:'r',v:i<d.length-1?String(rem)+d[i+1]:String(rem),end:i<d.length-1?i+1:i});cur=rem;}
 return{q:q.replace(/^0+(?=\d)/,''),rows};
}
function ldHTML(a,b,q,steps,lang,D){
 const A=toLa(String(a).trim()),B=toLa(String(b).trim()),Q=toLa(String(q).trim()),ar=lang==='ar';
 const num=/^\d{1,12}$/.test(A),n=num?A.length:1;
 let rows=[],quot=Q;
 if(num&&/^\d{1,9}$/.test(B)&&+B>0&&steps){const r=ldSteps(A,B);rows=r.rows;if(!quot)quot=r.q;}
 const dc=k=>ar?k+1:k+4,mc=ar?n+1:3,bc=ar?n+2:2,vc=ar?n+3:1;
 const cell=(r,c,t,cls='')=>`<span class="dg ${cls}" style="grid-row:${r};grid-column:${c}">${t}</span>`;
 let h='';
 if(quot){const qs=quot.split('');qs.forEach((x,k)=>{const col=n-qs.length+k;if(col>=0)h+=cell(1,dc(col),esc(D(x)));});}
 else h+=cell(1,dc(0),'&nbsp;');
 if(num)A.split('').forEach((x,k)=>{h+=cell(2,dc(k),esc(D(x)),'top');});else h+=`<span class="dg top" style="grid-row:2;grid-column:${dc(0)}">${esc(D(a))}</span>`;
 h+=cell(2,mc,'','top');
 h+=`<span class="ld-br" style="grid-row:2;grid-column:${bc}"><svg viewBox="0 0 10 40" preserveAspectRatio="none" aria-hidden="true"><path d="M1.5 0.6 Q10.5 20 1.5 39.4" fill="none" stroke="currentColor" stroke-width="1.3" vector-effect="non-scaling-stroke"/></svg></span>`;
 h+=cell(2,vc,esc(D(b)),'dv');
 rows.forEach((rw,k)=>{const r=k+3,ds=rw.v.split(''),st=rw.end-ds.length+1;
  ds.forEach((x,j)=>{h+=cell(r,dc(st+j),esc(D(x)),rw.t==='p'?'ul':'');});
  if(rw.t==='p'){const mcol=ar?(rw.end+1>=n?mc:dc(rw.end+1)):(st-1<0?mc:dc(st-1));h+=cell(r,mcol,'−','ul mn');}
 });
 return`<span class="ldg${ar?' ar':''}" style="grid-template-columns:repeat(${n+3},auto)">${h}</span>`;
}
/* تحويل المعادلة إلى قطع قابلة للتعديل، والعكس */
function readGroup(s,i){if(s[i]!=='{')return[null,i];let d=1,o='';i++;while(i<s.length){const c=s[i++];if(c==='{')d++;else if(c==='}'&&!--d)break;o+=c;}return[o,i];}
function parseLegacyPieces(tex){
 const s=String(tex||''),out=[];let i=0,txt='';
 const flush=()=>{if(txt.trim())out.push({t:'text',v:txt.trim()});txt='';};
 while(i<s.length){
  if(s.startsWith('\\frac',i)){flush();let a,b;[a,i]=readGroup(s,i+5);[b,i]=readGroup(s,i);out.push({t:'frac',a:a||'',b:b||''});continue;}
  if(s.startsWith('\\sqrt',i)){flush();i+=5;let n='';if(s[i]==='['){const e=s.indexOf(']',i);n=s.slice(i+1,e);i=e+1;}let x;[x,i]=readGroup(s,i);out.push({t:'root',n,x:x||''});continue;}
  if(s.startsWith('\\qty{',i)){flush();let v,u;[v,i]=readGroup(s,i+4);[u,i]=readGroup(s,i);out.push({t:'unit',v:v||'',u:u||''});continue;}
  if(s.startsWith('\\isotope',i)){flush();let a,z,x;[a,i]=readGroup(s,i+8);[z,i]=readGroup(s,i);[x,i]=readGroup(s,i);out.push({t:'iso',a:a||'',z:z||'',x:x||''});continue;}
  if(s.startsWith('\\system',i)){flush();let a,b;[a,i]=readGroup(s,i+7);[b,i]=readGroup(s,i);out.push({t:'sys',a:a||'',b:b||''});continue;}
  if(s.startsWith('\\log_{',i)){flush();let b,x;[b,i]=readGroup(s,i+5);[x,i]=readGroup(s,i);out.push({t:'log',b:b||'',x:x||''});continue;}
  if(s.startsWith('\\lim_{',i)){flush();let v,x;[v,i]=readGroup(s,i+5);[x,i]=readGroup(s,i);const pr=(v||'').split('\\to');out.push({t:'lim',v:(pr[0]||'').trim(),a:(pr[1]||'').trim(),x:x||''});continue;}
  if(s.startsWith('\\int_{',i)){flush();let a,b,f;[a,i]=readGroup(s,i+5);if(s[i]==='^')[b,i]=readGroup(s,i+1);[f,i]=readGroup(s,i);out.push({t:'int',a:a||'',b:b||'',f:f||''});continue;}
  if(s.startsWith('\\sum_{',i)){flush();let a,b,x;[a,i]=readGroup(s,i+5);if(s[i]==='^')[b,i]=readGroup(s,i+1);[x,i]=readGroup(s,i);out.push({t:'sum',a:a||'',b:b||'',x:x||''});continue;}
  if(s.startsWith('\\overline{',i)){flush();let x;[x,i]=readGroup(s,i+9);out.push({t:'bar',x:x||''});continue;}
  if(s.startsWith('\\longdiv',i)){flush();let a,b,q,st;[a,i]=readGroup(s,i+8);[b,i]=readGroup(s,i);[q,i]=readGroup(s,i);if(s[i]==='{')[st,i]=readGroup(s,i);out.push({t:'longdiv',a:a||'',b:b||'',q:q||'',steps:st==='1'});continue;}
  if(s.startsWith('\\left|',i)){flush();const e=s.indexOf('\\right|',i);const x=s.slice(i+6,e<0?s.length:e).trim();i=e<0?s.length:e+7;out.push({t:'abs',x});continue;}
  if(s.startsWith('\\left(',i)){flush();const e=s.indexOf('\\right)',i);const x=s.slice(i+6,e<0?s.length:e).trim();i=e<0?s.length:e+7;out.push({t:'paren',x});continue;}
  if(s.startsWith('\\xrightarrow',i)||s.startsWith('\\xrightleftharpoons',i)){flush();const rev=s.startsWith('\\xrightleftharpoons',i);i+=rev?19:12;let b='';if(s[i]==='['){const e=s.indexOf(']',i);b=s.slice(i+1,e);i=e+1;}let a;[a,i]=readGroup(s,i);out.push({t:'arrow',a:a||'',b,rev});continue;}
  if(s.startsWith('\\vec{',i)){flush();let x;[x,i]=readGroup(s,i+4);out.push({t:'vec',x:x||''});continue;}
  if(s.startsWith('\\ce',i)){flush();let x;[x,i]=readGroup(s,i+3);out.push({t:'chem',x:x||''});continue;}
  if(s[i]==='{'){const [g,j]=readGroup(s,i);
   if(s.startsWith('\\frac',j)){flush();let a,b,k;[a,k]=readGroup(s,j+5);[b,k]=readGroup(s,k);out.push({t:'mixed',w:g,a:a||'',b:b||''});i=k;continue;}
   const pm=/^\\left\( ([\s\S]*) \\right\)$/.exec(g||'');
   if(pm&&s[j]==='^'){flush();let e;[e,i]=readGroup(s,j+1);out.push({t:'ppow',x:pm[1],e:e||''});continue;}
   if(s[j]==='^'||s[j]==='_'){flush();let k=j,e='',sb='';while(s[k]==='^'||s[k]==='_'){const c=s[k];let v;[v,k]=readGroup(s,k+1);if(v===null){v=s[k]||'';k++;}if(c==='^')e=v;else sb=v;}
    out.push(e&&sb?{t:'powsub',x:g,e,s:sb}:e?{t:'pow',x:g,e}:{t:'sub',x:g,s:sb});i=k;continue;}
  }
  txt+=s[i++];
 }
 flush();return out;
}
function piecesToTex(ps){
 return ps.map(p=>({text:()=>p.v,frac:()=>`\\frac{${p.a}}{${p.b}}`,mixed:()=>`{${p.w}}\\frac{${p.a}}{${p.b}}`,sqrt:()=>`\\sqrt{${p.x}}`,nroot:()=>`\\sqrt[${p.n}]{${p.x}}`,root:()=>p.n&&!/^\s*[2٢]?\s*$/.test(p.n)?`\\sqrt[${p.n}]{${p.x}}`:`\\sqrt{${p.x}}`,
  unit:()=>`\\qty{${p.v}}{${p.u}}`,iso:()=>`\\isotope{${p.a}}{${p.z}}{${p.x}}`,sys:()=>`\\system{${p.a}}{${p.b}}`,log:()=>`\\log_{${p.b}}{${p.x}}`,lim:()=>`\\lim_{${p.v} \\to ${p.a}}{${p.x}}`,
  int:()=>`\\int_{${p.a}}^{${p.b}}{${p.f}}`,
  trig:()=>`\\${['sin','cos','tan','cot','sec','csc','arcsin','arccos','arctan'].includes(p.fn)?p.fn:'sin'}${p.e?`^{${p.e}}`:''}{${p.x}}`,
  identity:()=>`\\sin^{2}{${p.x}}+\\cos^{2}{${p.x}}=1`,
  deriv:()=>`\\frac{${p.d}}{${p.d}${p.v}}\\left(${p.f}\\right)`,
  deriv2:()=>`\\frac{${p.d}^{2}}{${p.d}${p.v}^{2}}\\left(${p.f}\\right)`,
  partialderiv:()=>`\\frac{\\partial}{\\partial ${p.v}}\\left(${p.f}\\right)`,
  intindef:()=>`\\int{${p.f}}\\,${p.d}${p.v}`,
  intdef:()=>`\\int_{${p.a}}^{${p.b}}{${p.f}}\\,${p.d}${p.v}`,
  sum:()=>`\\sum_{${p.a}}^{${p.b}}{${p.x}}`,bar:()=>`\\overline{${p.x}}`,ppow:()=>`{\\left( ${p.x} \\right)}^{${p.e}}`,
  pow:()=>`{${p.x}}^{${p.e}}`,sub:()=>`{${p.x}}_{${p.s}}`,powsub:()=>`{${p.x}}^{${p.e}}_{${p.s}}`,longdiv:()=>`\\longdiv{${p.a}}{${p.b}}{${p.q}}{${p.steps?1:0}}`,
  arrow:()=>`\\${p.rev?'xrightleftharpoons':'xrightarrow'}${p.b?`[${p.b}]`:''}{${p.a}}`,vec:()=>`\\vec{${p.x}}`,abs:()=>`\\left| ${p.x} \\right|`,paren:()=>`\\left( ${p.x} \\right)`,chem:()=>`\\ce{${p.x}}`}[p.t]||(()=>''))()).join(' ');
}
/* لا ندخل المحلل القديم مع أقواس ناقصة: كان يتوقف إلى الأبد في sqrt[ بلا ]. */
function texProblem(tex){
 const t=String(tex||'');if(t.length>12000)return'المعادلة طويلة جداً';
 const stack=[];for(let i=0;i<t.length;i++){const c=t[i];if(c==='\\'&&'{}[]'.includes(t[i+1]||'\0')){i++;continue;}
  if(c==='{'||c==='['){stack.push(c);if(stack.length>40)return'التداخل عميق جداً';}
  else if(c==='}'||c===']'){if(stack.pop()!==(c==='}'?'{':'['))return'أكمل الأقواس في المعادلة';}}
 if(stack.length)return'أكمل الأقواس في المعادلة';
 if(/\\(?:dfrac|tfrac|frac)\{[^{}]*\}\{[0٠۰]+\}/.test(t)||/\\longdiv\{[^{}]*\}\{[0٠۰]+\}/.test(t))return'القسمة على صفر غير معرّفة';
 return'';
}
/* Recognize native calculus templates when reopening a saved inline equation.
   Compare with the canonical serialization to avoid silently mangling user-edited expressions. */
function parseAdvancedPiece(raw){
 const s=String(raw||'').trim();let p=null;
 const tr=/^\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan)(?:\^\{([^{}]+)\})?\{([\s\S]*)\}$/.exec(s);
 if(tr)p={t:'trig',fn:tr[1],e:tr[2]||'',x:tr[3]};
 const id=/^\\sin\^\{2\}\{([\s\S]+)\}\+\\cos\^\{2\}\{\1\}=1$/.exec(s);
 if(id)p={t:'identity',x:id[1]};
 const der=/^\\frac\{(d|د)(\^\{2\})?\}\{\1([^{}]+?)(\^\{2\})?\}\\left\(([\s\S]*)\\right\)$/.exec(s);
 if(der&&Boolean(der[2])===Boolean(der[4]))p={t:der[2]?'deriv2':'deriv',d:der[1],v:der[3],f:der[5]};
 const par=/^\\frac\{\\partial\}\{\\partial ([^{}]+)\}\\left\(([\s\S]*)\\right\)$/.exec(s);
 if(par)p={t:'partialderiv',v:par[1],f:par[2]};
 if(s.startsWith('\\int')){
   let i=4,a='',b='';
   if(s[i]==='_'){[a,i]=readGroup(s,i+1);if(a===null)return null;}
   if(s[i]==='^'){[b,i]=readGroup(s,i+1);if(b===null)return null;}
   let f;[f,i]=readGroup(s,i);if(f===null)return null;
   const end=/^\\,(d|د)(.+)$/.exec(s.slice(i));
   if(end)p=a||b?{t:'intdef',a,b,f,d:end[1],v:end[2]}:{t:'intindef',f,d:end[1],v:end[2]};
 }
 return p&&piecesToTex([p])===s?p:null;
}
function parsePieces(tex){
 const t=String(tex||'');if(!t.trim())return[];
 if(texProblem(t))return[{t:'text',v:t}];
 const advanced=parseAdvancedPiece(t);if(advanced)return[advanced];
 const ps=parseLegacyPieces(t),back=piecesToTex(ps);
 /* المعادلات المتداخلة أو غير المدعومة تبقى بصيغتها الأصلية، لا نغير معناها لتناسب القوالب. */
 const compact=x=>x.replace(/\s+/g,'').replace(/\\sqrt\[[2٢]\]/g,'\\sqrt');
 return compact(back)===compact(t)&&!/\s[\^_]/.test(back)?ps:[{t:'text',v:t}];
}
if(typeof module!=='undefined')module.exports={texToHTML,richHTML,chipHTML,hasRich,parsePieces,piecesToTex,ldSteps,texProblem};

function arrowSVG(k){
 const p=k==='eq'?'M1 7 H39 M33 2 L39 7 M1 13 H39 M7 18 L1 13':k==='l'?'M1 10 H39 M7 4 L1 10 L7 16':'M1 10 H39 M33 4 L39 10 L33 16';
 return`<svg viewBox="0 0 40 20" preserveAspectRatio="none" aria-hidden="true"><path d="${p}" fill="none" stroke="currentColor" stroke-width="1.3" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}


/* ===== المنهج العراقي ===== */
const STAGES={
 primary:{label:'الابتدائية',hint:'الرابع إلى السادس',grades:['الرابع الابتدائي','الخامس الابتدائي','السادس الابتدائي']},
 intermediate:{label:'المتوسطة',hint:'الأول إلى الثالث',grades:['الأول المتوسط','الثاني المتوسط','الثالث المتوسط']},
 preparatory:{label:'الإعدادية',hint:'العلمي والأدبي',grades:['الرابع العلمي','الرابع الأدبي','الخامس العلمي','الخامس الأدبي','السادس العلمي','السادس الأدبي']}
};
function subjectsFor(stage,grade){
 grade=String(grade||'');
 if(stage==='primary')return grade.includes('الرابع')?['اللغة العربية','الرياضيات']:['التربية الإسلامية','اللغة العربية','اللغة الإنكليزية','الرياضيات','العلوم','الاجتماعيات'];
 if(stage==='intermediate')return['التربية الإسلامية','اللغة العربية','اللغة الإنكليزية','الرياضيات','الأحياء','الكيمياء','الفيزياء','الاجتماعيات','الحاسوب'];
 const base=['التربية الإسلامية','اللغة العربية','اللغة الإنكليزية','الرياضيات'];
 if(grade.includes('الأدبي'))return[...base,'التاريخ','الجغرافية',
  ...(grade.includes('الرابع')?['علم الاجتماع','الحاسوب']:grade.includes('الخامس')?['الاقتصاد','الفلسفة وعلم النفس','الحاسوب']:['الاقتصاد'])];
 return[...base,'الفيزياء','الكيمياء','الأحياء',...(grade.includes('الخامس')?['علم الأرض']:[]),...(grade.includes('السادس')?[]:['الحاسوب'])];
}
const KINDS=['الشهر الأول','الشهر الثاني','نصف السنة','نهاية السنة'];
const hasRound=k=>k==='نهاية السنة'||k==='نصف السنة';
const AR_SUBJ=['الإسلامية','العربية','الاجتماعيات','التاريخ','الجغرافية','الاقتصاد','علم الاجتماع'];
const isForeign=s=>/الإنكليزية|الانكليزية|الإنجليزية|English|الفرنسية/i.test(s||'');
function autoNumbering(stage,subject){if(stage==='primary')return isForeign(subject)?'latin':'arabic';return AR_SUBJ.some(k=>String(subject).includes(k))?'arabic':'latin';}
const kindTitle=k=>({'نهاية السنة':'أسئلة امتحانات نهاية السنة','نصف السنة':'أسئلة امتحانات نصف السنة','الشهر الأول':'أسئلة امتحانات الشهر الأول','الشهر الثاني':'أسئلة امتحانات الشهر الثاني'}[k]||(k?'أسئلة امتحان '+k:'أسئلة الامتحان'));
const PART_AR=['أ','ب','ج','د','هـ','و','ز','ح','ط','ي','ك','ل','م','ن','س','ع','ف','ص','ق','ر'];
const PART_EN='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
function scoreText(raw,en,D,paren){
 const s=String(raw||'').trim();if(!s)return'';
 const n=toLa(s);let out;
 if(/^\d+(\.\d+)?$/.test(n)){const v=parseFloat(n);out=en?`${D(n)} ${v===1?'Mark':'Marks'}`:v===1?'درجة واحدة':v===2?'درجتان':`${D(n)} ${(v>=3&&v<=10&&Number.isInteger(v))?'درجات':'درجة'}`;}
 else out=D(s.replace(/^\((.*)\)$/,'$1'));
 return paren?`(${out})`:out;
}

/* ===== الألوان: مشتقة من ورقة المصدر، فاتحة وصالحة للطباعة ===== */
const THEMES={
 source:{label:'كحلي'},
 sky:{label:'أزرق سماوي'},
 steel:{label:'أزرق فولاذي'},
 gray:{label:'رمادي'},
 ink:{label:'أسود'}
};
const FONTS={
 sans:{label:'نوتو سانس',css:"'Noto Sans Arabic',Tahoma,sans-serif"},
 times:{label:'تايمز',css:"'Times New Roman',Tinos,'Noto Naskh Arabic',serif"},
 naskh:{label:'نوتو نسخ',css:"'Noto Naskh Arabic',serif"},
 cairo:{label:'القاهرة',css:"'Cairo',sans-serif"},
 amiri:{label:'أميري',css:"'Amiri',serif"},
 custom:{label:'خطي',css:"'ExamUserFont','Noto Sans Arabic',sans-serif"}
};
const LABELS={'n-dot':'1.','n-dash':'1-','n-paren':'1)','l-dash':'أ-','l-paren':'أ)','none':'بلا'};
// Stable exam numbering: teachers should never have to type 'س:١)' themselves.
// Legacy style keys are retained only so older JSON project files can still be opened.
const QSTYLES={slash:'س1/',paren:'س1)',colon:'س1:',pre:'س:1)'};
const EXAM_NUMBER_PREFIX=/^\s*(?:س|سؤال|Q(?:uestion)?)\s*[:：\/]\s*[0-9٠-٩۰-۹]+\s*(?:[-–ـ]\s*(?:[A-Z]|[أ-ي])\s*\)|[.)])\s*[-:]?\s*/iu;
function stripExamNumberPrefix(value){return String(value??'').replace(EXAM_NUMBER_PREFIX,'').trimStart();}
function stripExamItemPrefix(value,kind){const text=stripExamNumberPrefix(value);if(kind==='definitions')return text.replace(/^\s*[0-9٠-٩۰-۹]+\s*[.)-]\s*/u,'').trimStart();if(['branches','enumerate'].includes(kind))return text.replace(/^\s*(?:[A-Z]|[أبجدهـوزحطيكلمنسعفصقر])\s*[)-]\s*/iu,'').trimStart();return text;}

const KIND_INFO={
 definitions:['إضافة تعاريف','كل تعريف في حقل مستقل وجدول منسق تلقائيًا'],
 blanks:['فراغات','عبارات فيها نقاط للإكمال'],
 mcq:['اختيار من متعدد','خيارات بين قوسين'],
 branches:['سؤال بأفرع','ترقيم تلقائي: س:١- أ) أو س:1- A)'],
 enumerate:['عدّد','أفرع قصيرة في سطر واحد'],
 truefalse:['صح أو خطأ','عبارات للحكم عليها'],
 match:['وصل وزاوج','عمود (أ) وعمود (ب) للربط بينهما'],
 math:['سؤال رياضيات ومعادلات','دوال مثلثية، تفاضل، تكامل، كسور، جذور وقسمة طويلة'],
 text:['نص حر','فقرة أو نص قراءة'],
 section:['عنوان قسم','مثل: القرآن الكريم (40 درجة)']
};

/* ===== النماذج حسب المادة: خمسة أسئلة تملأ صفحة A4 ===== */
const it=(text='',x={})=>({id:uid(),text,choices:x.choices||[],subs:x.subs||[],subLabel:x.subLabel||'n-dot',score:x.score||'',pair:x.pair||'',table:x.table||null,align:x.align||'auto',answerLines:0,image:null});
const Q=(kind,prompt,score,o={},items=[])=>({id:uid(),kind,prompt,score,showScore:true,title:'',cols:o.cols??-1,label:o.label||'n-dot',chStyle:o.ch||'letters',chLayout:o.lay||'inline',boxed:o.boxed??kind==='definitions',breakBefore:false,image:null,
 colA:o.colA||'',colB:o.colB||'',extra:o.extra||[],mStyle:o.mStyle||'table',shuffle:o.shuffle??true,items});
const pairs=(arr)=>arr.map(([a,b])=>it(a,{pair:b}));
const TABLE=(r=3,c=3)=>({head:true,full:false,rows:Array.from({length:r},(_,i)=>Array.from({length:c},(_,j)=>i===0?'':''))});
function family(s){s=String(s||'');if(isForeign(s))return'en';if(s.includes('الرياضيات'))return'math';if(s.includes('الإسلامية'))return'islamic';if(s.includes('الفيزياء'))return'physics';if(s.includes('الكيمياء'))return'chem';if(s.includes('الأحياء'))return'bio';if(s.includes('الحاسوب'))return'computer';if(s.includes('علم الأرض'))return'earth';if(s.includes('العلوم'))return'science';return'arabic';}
function starter(stage,grade,subject){
 const f=family(subject),prim=stage==='primary',S=prim?'10':'20',B='10';
 if(f==='en')return[
  Q('definitions','Define five of the following:',S,{label:'n-dot'},['Noun','Verb','Adjective','Adverb','Pronoun','Preposition'].map(t=>it(t))),
  Q('blanks','Fill in the blanks with the correct words:',S,{label:'n-dot'},[it('I ............ to school every day.'),it('She ............ a letter yesterday.'),it('They are ............ football now.'),it('We ............ in Baghdad.')]),
  Q('mcq','Choose the correct answer:',S,{label:'n-dot'},[it('He ............ a doctor.',{choices:['is','are']}),it('My sister ............ tea.',{choices:['like','likes']}),it('There ............ two books.',{choices:['is','are']})]),
  Q('branches','Answer the following:',S,{label:'l-dash'},[it('Write five sentences about your school.'),it('What do you do in the morning?')]),
  Q('enumerate','Write the opposite of:',S,{label:'l-dash'},[it('big'),it('hot'),it('happy')])];
 if(f==='math'&&prim)return[
  Q('math','أجب عما يأتي:',S,{cols:1,label:'l-dash'},[it('جد ناتج القسمة $$\\longdiv{٨٤}{٤}{}{0}$$ ثم حلّل الناتج إلى عوامله الأولية.'),it('جد ناتج القسمة $$\\longdiv{٩٦٣}{٣}{}{0}$$ ثم تحقّق من صحة الحل بالضرب.')]),
  Q('math','جد ناتج ما يأتي بأبسط صورة:',S,{cols:2,label:'n-dot'},[it('$$\\frac{٣}{٤} + \\frac{١}{٤} =$$ ......'),it('$$\\frac{٥}{٦} - \\frac{١}{٣} =$$ ......'),it('$${٢}\\frac{١}{٢} + {١}\\frac{١}{٤} =$$ ......'),it('$$\\frac{٢}{٣} × \\frac{٣}{٥} =$$ ......')]),
  Q('blanks','املأ الفراغات الآتية بما يناسبها:',S,{label:'n-dot'},[it('العدد الذي يلي ٩٩٩ هو ( .............. ).'),it('ناتج ٧ × ٨ = ( .............. ).'),it('القيمة المكانية للرقم ٥ في العدد ٣٥٢ هي ( .............. ).')]),
  Q('mcq','اختر الإجابة الصحيحة من بين الأقواس:',S,{label:'n-dot'},[it('ناتج ٤٥ ÷ ٥ =',{choices:['٨','٩']}),it('الكسر المكافئ للكسر نصف هو',{choices:['$$\\frac{٢}{٤}$$','$$\\frac{٢}{٣}$$']})]),
  Q('branches','حل المسألة الآتية:',S,{label:'none'},[it('اشترى أحمد ٣ أقلام بسعر ٢٥٠ ديناراً للقلم الواحد، كم ديناراً دفع؟')])];
 if(f==='math')return[
  Q('math','جد ناتج ما يأتي بأبسط صورة:',S,{cols:3,label:'n-paren'},[it('$\\sqrt[3]{-27}+\\sqrt[4]{16}$'),it('$6\\sqrt{5}+2\\sqrt{5}$'),it('$\\sqrt[3]{54}-\\sqrt[3]{16}$')]),
  Q('math','جد ناتج ما يأتي:',S,{cols:2,label:'n-paren'},[it('$\\frac{-1}{5}\\times\\frac{25}{-3}+\\frac{3}{2}\\times\\frac{8}{21}$'),it('$4\\frac{1}{3}+3\\frac{2}{5}-\\frac{8}{15}$')]),
  Q('math','حل المعادلات الآتية:',S,{cols:2,label:'n-paren'},[it('$2^{x^{2}-2x+1}=4^{x+3}$'),it('$|x-6| \\le 1$')]),
  Q('math','بسّط ما يأتي:',S,{cols:2,label:'n-paren'},[it('$5\\sqrt{12}-7\\sqrt{32}$'),it('$\\sqrt{5}(\\sqrt{10}+\\sqrt{3})$')]),
  Q('math','أثبت أن:',S,{label:'none'},[it('$\\sin 30^{\\circ} \\cos 60^{\\circ} + \\sin 60^{\\circ} \\cos 30^{\\circ} = 1$')])];
 if(f==='islamic')return[
  Q('section','القرآن الكريم',prim?'20':'40'),
  Q('branches','أجب عن أحد الفرعين:',B,{label:'l-dash'},[it('عرّف المد، مع ذكر حروفه الثلاث، واذكر مثالاً لكل حرف.'),it('عيّن القلقلة وبيّن نوعها في الآيات الكريمة الآتية.')]),
  Q('branches','اكتب ما تحفظه من سورة الانفطار من قوله تعالى (إِذَا السَّمَاءُ انْفَطَرَتْ) إلى قوله تعالى (فَسَوَّاكَ فَعَدَلَكَ).',B,{label:'none'},[]),
  Q('section','التربية الإسلامية',prim?'20':'50'),
  Q('branches','أجب عما يأتي لفرع واحد فقط:',B,{label:'l-dash'},[it('اكتب حديثاً نبوياً شريفاً عن السنة الحسنة والسيئة.'),it('اكتب حديثاً نبوياً شريفاً عن النهي عن الحسد.')]),
  Q('blanks','املأ الفراغات الآتية (لأربع فقط):',prim?'10':'40',{label:'n-dot'},[it('مرت الدعوة الإسلامية بمرحلتين هما .................. و ..................'),it('العبادة هي ..................'),it('من شروط الوضوء .................. و ..................'),it('الصلاة هي ..................')])];
 if(f==='physics')return[
  Q('definitions','عرّف خمساً مما يأتي:',S,{},['الكتلة','الوزن','السرعة','التعجيل','الشغل','القدرة'].map(t=>it(t))),
  Q('mcq','اختر الإجابة الصحيحة لكل مما يأتي:',S,{lay:'line'},[it('وحدة قياس القوة في النظام الدولي للوحدات هي:',{choices:['الجول','النيوتن','الواط']}),it('إذا تضاعفت سرعة جسم فإن طاقته الحركية:',{choices:['تتضاعف','تزداد أربع مرات','تقل إلى النصف']}),it('الكمية المتجهة من بين الكميات الآتية هي:',{choices:['الكتلة','الزمن','الإزاحة']})]),
  Q('branches','حل المسائل الآتية:',S,{label:'l-dash'},[it('جسم كتلته $m=5\\,\\text{kg}$ يتحرك بتعجيل مقداره $a=2\\,\\text{m/s}^{2}$ ، احسب مقدار القوة المحصلة المؤثرة فيه.'),it('سقط حجر سقوطاً حراً من السكون لمدة $t=3\\,\\text{s}$ ، احسب سرعته النهائية علماً أن $g=10\\,\\text{m/s}^{2}$ .')]),
  Q('blanks','املأ الفراغات الآتية بما يناسبها:',S,{},[it('حاصل ضرب القوة في الإزاحة باتجاهها يسمى ( .................... ).'),it('المعدل الزمني لتغير السرعة يسمى ( .................... ).'),it('وحدة قياس القدرة هي ( .................... ).')]),
  Q('match','صل بين الكمية الفيزيائية في العمود (أ) ووحدة قياسها في العمود (ب):',S,{extra:['$\\text{m/s}$']},pairs([['القوة','$\\text{N}$'],['الشغل','$\\text{J}$'],['القدرة','$\\text{W}$'],['الضغط','$\\text{Pa}$']]))];
 if(f==='chem')return[
  Q('definitions','عرّف خمساً مما يأتي:',S,{},['العنصر','المركب','العدد الذري','العدد الكتلي','الأيون','النظائر'].map(t=>it(t))),
  Q('math','وازن المعادلات الكيميائية الآتية:',S,{cols:1,label:'n-paren'},[it('$\\ce{H2 + O2 -> H2O}$'),it('$\\ce{Fe + HCl -> FeCl2 + H2}$'),it('$\\ce{N2 + H2 <=> NH3}$')]),
  Q('mcq','اختر الإجابة الصحيحة لكل مما يأتي:',S,{lay:'line'},[it('عدد البروتونات في نواة ذرة $\\isotope{12}{6}{C}$ يساوي:',{choices:['6','12','18']}),it('الصيغة الكيميائية لكبريتات الصوديوم هي:',{choices:['$\\ce{Na2SO4}$','$\\ce{NaSO4}$','$\\ce{Na2SO3}$']}),it('المحلول الذي قيمة الأس الهيدروجيني $\\text{pH}$ له تساوي 7 يكون:',{choices:['حامضياً','قاعدياً','متعادلاً']})]),
  Q('blanks','املأ الفراغات الآتية بما يناسبها:',S,{},[it('تسمى الأعمدة الرأسية في الجدول الدوري ( .................... ).'),it('شحنة أيون الكبريتات $\\ce{SO4^{2-}}$ تساوي ( .................... ).'),it('الغاز المتصاعد في التفاعل $\\ce{Zn + 2HCl -> ZnCl2 + H2 ↑}$ هو ( .................... ).')]),
  Q('match','زاوج بين العنصر في العمود (أ) ورمزه الكيميائي في العمود (ب):',S,{extra:['$\\ce{Cu}$']},pairs([['الصوديوم','$\\ce{Na}$'],['الحديد','$\\ce{Fe}$'],['الكالسيوم','$\\ce{Ca}$'],['البوتاسيوم','$\\ce{K}$']]))];
 if(f==='bio')return[
  Q('definitions','عرّف خمساً مما يأتي:',S,{},['الخلية','النسيج','الانقسام الخيطي','البناء الضوئي','الإنزيم','الهرمون'].map(t=>it(t))),
  Q('blanks','املأ الفراغات الآتية بما يناسبها:',S,{},[it('الوحدة الأساسية للتركيب والوظيفة في الكائن الحي هي ( .................... ).'),it('العضية المسؤولة عن تحرير الطاقة في الخلية هي ( .................... ).'),it('تحدث عملية البناء الضوئي في ( .................... ).')]),
  Q('mcq','اختر الإجابة الصحيحة لكل مما يأتي:',S,{lay:'line'},[it('الخلية هي:',{choices:['كل شيء يشغل حيزاً من الفراغ','الوحدة الوظيفية والتركيبية للكائن الحي']}),it('الصبغة الخضراء في النبات هي:',{choices:['الكلوروفيل','الهيموغلوبين','الميلانين']})]),
  Q('branches','علّل ما يأتي:',S,{label:'l-dash'},[it('تعد الميتوكوندريا مصنع الطاقة في الخلية.'),it('يحتاج النبات الأخضر إلى ضوء الشمس.')]),
  Q('match','صل بين العضية في العمود (أ) ووظيفتها في العمود (ب):',S,{extra:['نقل الأوكسجين']},pairs([['النواة','السيطرة على فعاليات الخلية'],['الميتوكوندريا','تحرير الطاقة'],['البلاستيدات الخضراء','البناء الضوئي'],['الرايبوسومات','بناء البروتين']]))];
 if(f==='earth')return[
  Q('definitions','عرّف ما يأتي:',S,{},['الغلاف الجوي','الطقس','المناخ','الزلزال','التجوية'].map(t=>it(t))),
  Q('blanks','املأ الفراغات الآتية بما يناسبها:',S,{},[it('يقاس الضغط الجوي بجهاز ( ............. ).'),it('يسمى تفتت الصخور وتحللها في موضعها ( ............. ).'),it('من مصادر التلوث البيئي ( ............. ).')]),
  Q('mcq','اختر الإجابة الصحيحة لكل مما يأتي:',S,{lay:'line'},[it('تفتت الصخور دون تغير تركيبها الكيميائي يُعد:',{choices:['تجوية ميكانيكية','تجوية كيميائية','تحولاً صخرياً']}),it('تسجيل الاهتزازات الأرضية يتم بواسطة:',{choices:['السيزموجراف','البارومتر','الثرمومتر']})]),
  Q('branches','أجب عما يأتي:',S,{label:'l-dash'},[it('ما الفرق بين الطقس والمناخ؟'),it('اذكر ثلاثة من آثار التلوث البيئي.')]),
  Q('match','صل بين الظاهرة في العمود (أ) وما يناسبها في العمود (ب):',S,{extra:['تغير حالة الجو خلال مدة قصيرة']},pairs([['الزلزال','اهتزاز مفاجئ للقشرة الأرضية'],['البركان','اندفاع مواد منصهرة إلى سطح الأرض'],['التجوية','تفكك الصخور وتحللها في موضعها'],['التعرية','نقل فتات الصخور من مكان إلى آخر']]))];
 if(f==='computer')return[
  Q('definitions','عرّف ما يأتي:',S,{},['نظام التشغيل','الذاكرة الرئيسة','البرمجيات','وحدة المعالجة المركزية','الشبكة'].map(t=>it(t))),
  Q('blanks','املأ الفراغات الآتية بما يناسبها:',S,{},[it('من وحدات إدخال البيانات في الحاسوب ( ............. ).'),it('تُستخدم الطابعة لـ ( ............. ).'),it('تسمى البرامج التي تدير موارد الحاسوب ( ............. ).')]),
  Q('mcq','اختر الإجابة الصحيحة لكل مما يأتي:',S,{lay:'line'},[it('الجهاز المستخدم لإدخال النصوص هو:',{choices:['لوحة المفاتيح','الشاشة','الطابعة']}),it('الذاكرة التي تفقد محتواها عند انقطاع الطاقة هي:',{choices:['RAM','ROM','القرص الصلب']})]),
  Q('branches','أجب عما يأتي:',S,{label:'l-dash'},[it('اذكر مثالين لأجهزة الإدخال ومثالين لأجهزة الإخراج.'),it('ما الفرق بين المكونات المادية والبرمجيات؟')]),
  Q('match','صل بين الجهاز في العمود (أ) ووظيفته في العمود (ب):',S,{extra:['معالجة البيانات']},pairs([['لوحة المفاتيح','إدخال النصوص'],['الشاشة','عرض المعلومات'],['الطابعة','إخراج المعلومات على الورق'],['الماسح الضوئي','إدخال الصور إلى الحاسوب']]))];
 if(f==='science')return[
  Q('definitions','عرّف خمساً مما يأتي:',S,{label:'n-dot'},['التكاثر الخضري','التطعيم','الفسيلة','العمود الفقري','الجهاز العصبي','غلاف البذرة'].map(t=>it(t))),
  Q('blanks','املأ الفراغات الآتية بما يناسبها:',S,{label:'n-dot'},[it('تركيب يوجد داخل البذرة ويعد غذاءً للجنين يسمى ( .................... ).'),it('تسمى المراحل التي تمر بها البذرة أثناء نموها ( .................... ).'),it('يسمى نوع من أنواع الفسائل ينمو مرتفعاً على الساق ( .................... ).'),it('الجزء الأول من أجزاء الجهاز العصبي المركزي هو ( .................... ).'),it('يتكون العمود الفقري من ( ........ ) فقرة.')]),
  Q('branches','أجب عما يأتي:',S,{label:'l-dash'},[it('ارسم مع التأشير أجزاء بذرة الفاصوليا.'),it('اذكر وظائف العظام في كل مما يأتي:',{subs:['عظام الجمجمة','عظام العمود الفقري','عظام الصدر','عظام الحوض والذراعين']})]),
  Q('mcq','اختر الإجابة الصحيحة من بين الأقواس:',S,{label:'n-dot'},[it('من البذور ذوات الفلقة الواحدة:',{choices:['الفاصوليا','الذرة']}),it('نبات يتكاثر بوساطة الدرنات وله استخدامات طبية:',{choices:['اليانسون','السوس']}),it('من النباتات التي يتم تكثيرها بالتطعيم:',{choices:['البرتقال','الموز']}),it('جنس النخلة الناتجة من فسيلة مأخوذة من شجرة مؤنثة:',{choices:['مذكرة','مؤنثة']}),it('يبلغ عدد العظام في جسم الإنسان البالغ:',{choices:['206 عظمة','306 عظمة']})]),
  Q('enumerate','عدّد فقط:',S,{label:'l-dash'},[it('طرائق انتشار البذور؟'),it('أنواع فسائل نخلة التمر؟'),it('أقسام الجهاز العصبي؟')])];
 return[
  Q('definitions','عرّف ما يأتي:',S,{label:'n-dot'},['المصطلح الأول','المصطلح الثاني','المصطلح الثالث','المصطلح الرابع','المصطلح الخامس','المصطلح السادس'].map(t=>it(t))),
  Q('blanks','املأ الفراغات الآتية بما يناسبها:',S,{label:'n-dot'},[it('العبارة الأولى ( .................... ).'),it('العبارة الثانية ( .................... ).'),it('العبارة الثالثة ( .................... ).'),it('العبارة الرابعة ( .................... ).')]),
  Q('branches','أجب عما يأتي:',S,{label:'l-dash'},[it('السؤال الأول؟'),it('السؤال الثاني؟',{subs:['الفقرة الأولى','الفقرة الثانية','الفقرة الثالثة']})]),
  Q('mcq','اختر الإجابة الصحيحة من بين الأقواس:',S,{label:'n-dot'},[it('نص السؤال الأول:',{choices:['الخيار الأول','الخيار الثاني']}),it('نص السؤال الثاني:',{choices:['الخيار الأول','الخيار الثاني']}),it('نص السؤال الثالث:',{choices:['الخيار الأول','الخيار الثاني']})]),
  Q('enumerate','عدّد فقط:',S,{label:'l-dash'},[it('الأول؟'),it('الثاني؟'),it('الثالث؟')])];
}
function kindTemplate(kind,en){
 const S='10',B=(p,o,items)=>Q(kind,p,S,o,items);
 if(kind==='section')return Q('section',en?'Section title':'عنوان القسم','40');
 if(en)return({definitions:()=>B('Define the following:',{},[it('Term'),it('Term'),it('Term')]),blanks:()=>B('Fill in the blanks:',{},[it('Sentence ............'),it('Sentence ............')]),
  mcq:()=>B('Choose the correct answer:',{},[it('Question',{choices:['first','second']})]),branches:()=>B('Answer the following:',{label:'l-dash'},[it('First branch'),it('Second branch')]),
  enumerate:()=>B('List only:',{label:'l-dash'},[it('First'),it('Second'),it('Third')]),truefalse:()=>B('Write True or False:',{},[it('Statement.        (      )'),it('Statement.        (      )')]),
  match:()=>B('Match column A with column B:',{colA:'Column A',colB:'Column B',extra:['']},pairs([['First','One'],['Second','Two'],['Third','Three']])),
  math:()=>B('Solve:',{cols:2,label:'n-paren'},[it('$\\frac{1}{2}+\\frac{3}{4}$'),it('$x^{2}-4=0$')]),text:()=>B('',{label:'none'},[it('Text')])}[kind])();
 return({definitions:()=>B('عرّف ما يأتي:',{},[it('المصطلح الأول'),it('المصطلح الثاني'),it('المصطلح الثالث')]),
  blanks:()=>B('املأ الفراغات الآتية بما يناسبها:',{},[it('العبارة الأولى ( .................... ).'),it('العبارة الثانية ( .................... ).')]),
  mcq:()=>B('اختر الإجابة الصحيحة من بين الأقواس:',{},[it('نص السؤال:',{choices:['الخيار الأول','الخيار الثاني']})]),
  branches:()=>B('أجب عما يأتي:',{label:'l-dash'},[it('الفرع الأول؟'),it('الفرع الثاني؟')]),
  enumerate:()=>B('عدّد فقط:',{label:'l-dash'},[it('الأول؟'),it('الثاني؟'),it('الثالث؟')]),
  truefalse:()=>B('ضع كلمة (صح) أمام العبارة الصحيحة وكلمة (خطأ) أمام العبارة الخاطئة:',{},[it('العبارة الأولى.        (      )'),it('العبارة الثانية.        (      )')]),
  match:()=>B('صل بين ما في العمود (أ) وما يناسبه في العمود (ب):',{extra:['']},pairs([['العبارة الأولى','الجواب الأول'],['العبارة الثانية','الجواب الثاني'],['العبارة الثالثة','الجواب الثالث']])),
  math:()=>B('جد ناتج ما يأتي:',{cols:2,label:'l-dash'},[it('$$\\frac{٣}{٤} + \\frac{١}{٤} =$$ ......'),it('$$\\longdiv{٨٤}{٤}{}{0}$$')]),
  text:()=>B('',{label:'none'},[it('اكتب النص هنا.')])}[kind])();
}
const SHOW_KEYS=['country','ministry','directorate','school','title','subtitle','round','subject','year','time','hijri','name','note','logo','closing','teacher','footLeft','flip','pageNo'];
function baseMeta(stage){
 const m={country:'جمهورية العراق',ministry:'وزارة التربية',directorate:'المديرية العامة للتربية',schoolLabel:'المدرسة:',school:'',
  grade:{primary:'السادس الابتدائي',intermediate:'الأول المتوسط',preparatory:'الرابع العلمي'}[stage],subject:{primary:'العلوم',intermediate:'الكيمياء',preparatory:'الرياضيات'}[stage],
  subjectLabel:'المادة:',examKind:'الشهر الأول',round:'الدور الأول',yearLabel:'العام الدراسي:',year:'2026 - 2027',timeLabel:'الوقت:',time:stage==='primary'?'ساعة واحدة':'ساعتان',hijri:'',
  title:'',titleAuto:true,subtitle:'',subtitleAuto:true,noteLabel:'ملاحظة:',note:'',
  nameLabel:'اسم الطالب/ـة:',logo:'',logoH:16,logoDx:0,logoDy:0,
  closing:'مع تمنياتنا لكم بالنجاح والتوفيق',teacherLabel:'معلم المادة:',teacher:'',footLeftLabel:'',footLeft:'',flip:'اقلب الصفحة',
  show:{}};
 SHOW_KEYS.forEach(k=>m.show[k]=!['directorate','time','hijri','note','footLeft'].includes(k)||(k==='note'&&stage!=='primary')||(k==='time'&&stage!=='primary'));
 m.show.directorate=true;
 return m;
}
function autoTitles(p){const m=p.meta;if(m.titleAuto)m.title=kindTitle(m.examKind)+(m.subject?' في مادة '+m.subject:'');if(m.subtitleAuto)m.subtitle=m.grade?'للصف '+String(m.grade).replace(/^الصف\s+/,''):'';}
function makeProject(stage,blank){
 if(blank===undefined)blank=true;
 const p={meta:baseMeta(stage),style:'source',theme:'source',font:'sans',customFont:null,size:13,density:'normal',digits:'auto',dir:'auto',qStyle:'pre',rules:true,fit:true,pristine:true,questions:[]};
 autoTitles(p);if(!blank)p.questions=starter(stage,p.meta.grade,p.meta.subject);return p;
}
function blankQuestion(kind,en){
 const q=kindTemplate(kind,en);q.score='';q.showScore=false;q.prompt='';
 q.items=kind==='section'?[]:[it('',{choices:kind==='mcq'?['','']:[]})];
 if(kind==='text'){q.label='none';q.cols=1;q.boxed=false;}
 return q;
}

/* ===== التحقق ===== */
const str=(v,max)=>typeof v==='string'?(max===undefined?v:v.slice(0,max)):(typeof v==='number'?String(v):'');
const okId=v=>typeof v==='string'&&/^[a-z0-9]+$/.test(v)?v:uid();
const imageData=s=>typeof s==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(s);
function normImg(x){if(!x||typeof x!=='object'||!imageData(x.src))return null;
 return{src:x.src,w:Math.min(100,Math.max(10,+x.w||40)),r:Number.isFinite(+x.r)&&+x.r>0?+x.r:1,align:['start','center','end'].includes(x.align)?x.align:'center',side:!!x.side};}
function normTable(t){if(!t||typeof t!=='object'||!Array.isArray(t.rows))return null;const rows=t.rows.slice(0,30).map(r=>Array.isArray(r)?r.slice(0,10).map(c=>str(c)):[]).filter(r=>r.length);
 if(!rows.length)return null;const w=Math.max(...rows.map(r=>r.length));rows.forEach(r=>{while(r.length<w)r.push('');});return{head:t.head!==false,full:!!t.full,align:['right','center','left'].includes(t.align)?t.align:'center',rows};}
function normItem(x){if(!x||typeof x!=='object')return null;const arr=a=>Array.isArray(a)?a.filter(s=>typeof s==='string').slice(0,40):[];
 return{id:okId(x.id),text:str(x.text),choices:arr(x.choices),subs:arr(x.subs),subLabel:LABELS[x.subLabel]&&x.subLabel!=='none'?x.subLabel:'n-dot',score:str(x.score),pair:str(x.pair),table:normTable(x.table),align:['right','center','left'].includes(x.align)?x.align:'auto',answerLines:Math.max(0,Math.min(12,parseInt(x.answerLines)||0)),image:normImg(x.image)};}
function normQ(q){if(!q||typeof q!=='object')return null;
 const lab=LABELS[q.label]?q.label:q.label==='l-paren'?'l-paren':q.label==='letter'?'l-dash':q.label==='none'?'none':'n-dot';
 const c=+q.cols;const cols=Number.isInteger(c)&&c>=-1&&c<=4?(c===0?-1:c):-1;
 return{id:okId(q.id),kind:KIND_INFO[q.kind]?q.kind:'branches',prompt:str(q.prompt),score:str(q.score),showScore:q.showScore!==false,title:str(q.title),
  cols,label:lab,chStyle:['dash','plain'].includes(q.chStyle)?q.chStyle:'letters',chLayout:['inline','line','grid','stack'].includes(q.chLayout)?q.chLayout:'inline',
  colA:str(q.colA),colB:str(q.colB),extra:Array.isArray(q.extra)?q.extra.filter(v=>typeof v==='string').slice(0,10):[],mStyle:q.mStyle==='lists'?'lists':'table',shuffle:q.shuffle!==false,boxed:!!q.boxed,breakBefore:!!q.breakBefore,image:normImg(q.image),items:(Array.isArray(q.items)?q.items:[]).slice(0,80).map(normItem).filter(Boolean)};}
function normProject(p,stage){
 if(!p||typeof p!=='object')return makeProject(stage);
 const base=baseMeta(stage),meta={...base,show:{...base.show}};
 if(p.meta&&typeof p.meta==='object'){for(const k of Object.keys(base)){if(k==='show')continue;const v=p.meta[k],t=typeof base[k];
   if(t==='boolean'){if(typeof v==='boolean')meta[k]=v;}else if(t==='number'){if(Number.isFinite(+v))meta[k]=+v;}else if(typeof v==='string')meta[k]=v;}
  if(p.meta.show&&typeof p.meta.show==='object')SHOW_KEYS.forEach(k=>{if(typeof p.meta.show[k]==='boolean')meta.show[k]=p.meta.show[k];});
  if(typeof p.meta.showName==='boolean')meta.show.name=p.meta.showName;}
 if(meta.logo&&!imageData(meta.logo))meta.logo='';
 meta.logoH=Math.min(40,Math.max(8,meta.logoH));
 const pick=(v,list,d)=>list.includes(v)?v:d;
 const cf=p.customFont&&typeof p.customFont.src==='string'&&/^data:(font\/[\w.+-]+|application\/[\w.+-]+|);base64,[A-Za-z0-9+/]+={0,2}$/.test(p.customFont.src)?{name:str(p.customFont.name,120),src:p.customFont.src}:null;
 const out={meta,style:'source',theme:pick(p.theme==='teal'?'steel':p.theme,Object.keys(THEMES),'source'),font:pick(p.font,Object.keys(FONTS),'sans'),customFont:cf,
  size:pick(+p.size,[13,14,15],13),density:pick(p.density,['tight','normal','airy'],'normal'),digits:pick(p.digits,['auto','arabic','latin'],'auto'),dir:pick(p.dir,['auto','rtl','ltr'],'auto'),
  qStyle:'pre',/* Old question formats normalize on display. */rules:p.rules!==false,fit:p.fit!==false,pristine:!!p.pristine,questions:(Array.isArray(p.questions)?p.questions:[]).slice(0,80).map(normQ).filter(Boolean)};
 const ids=new Set();const unique=x=>{while(ids.has(x.id))x.id=uid();ids.add(x.id);};
 out.questions.forEach(q=>{unique(q);q.items.forEach(unique);});
 if(out.font==='custom'&&!cf)out.font='sans';autoTitles(out);return out;
}
function convertV05(o){
 const m=o.meta||{},stage=STAGES[m.stage]?m.stage:'primary',p=makeProject(stage,true);
 Object.assign(p.meta,{country:str(m.country)||p.meta.country,ministry:str(m.ministry)||p.meta.ministry,directorate:str(m.directorate)||p.meta.directorate,school:str(m.school),
  grade:str(m.grade).replace(/^الصف\s+/,'')||p.meta.grade,subject:str(m.subject)||p.meta.subject,examKind:KINDS.includes(m.examKind)?m.examKind:p.meta.examKind,
  round:str(m.round)||p.meta.round,year:str(m.examDate)||p.meta.year,hijri:str(m.hijriDate),time:str(m.duration)||p.meta.time,teacher:str(m.teacher),note:str(m.note).replace(/^ملاحظة:\s*/,'')});
 p.meta.show.note=!!p.meta.note;p.pristine=false;autoTitles(p);
 p.questions=((o.structured&&o.structured.questions)||[]).map(q=>normQ({kind:'branches',prompt:str(q.prompt)||str(q.title),score:q.score!=null?String(q.score):'',
  label:(q.parts||[]).length>1?'l-dash':'none',items:(q.parts||[]).map(x=>({text:str(x.text)+(x.formula&&x.formula.value?(x.formula.language==='latin'?' $'+x.formula.value+'$':' $$'+x.formula.value+'$$'):''),subs:x.subItems||[],score:x.score!=null?String(x.score):''}))})).filter(Boolean);
 return{stage,project:p};
}

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
// One canonical exam prefix; imported legacy slash/paren formats render consistently.
function qnum(n,c){return `س:${c.D(String(n))})`;}
function branchNumber(q,n,i,c){
 if(q.label==='none')return '';
 if(['branches','enumerate'].includes(q.kind)){const label=q.label.startsWith('l')?c.L(i):c.lab(q.label,i).replace(/[.)-]$/,'');return `س:${c.D(String(n))}- ${label})`;}
 return c.lab(q.label,i);
}
function numberedTitle(q,n,c){
 const custom=String(q.title||'').trim();
 if(custom&&!/^(?:س|Q)?\s*[:：\/]?\s*[0-9٠-٩۰-۹]+[.)\/]?$/.test(custom))return c.D(custom);
 return qnum(n,c);
}
const scoreH=(raw,c,p,cls='qs')=>{const t=scoreText(raw,c.en,c.D,p.style==='source');return t?`<span class="${cls}">${esc(t)}</span>`:'';};
function itemHTML(q,x,i,c,p,cols,part,n){
 const lb=branchNumber(q,n,i,c),img=x.image?imgHTML(x.image):'',side=x.image&&x.image.side;
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
 return`<div class="ir${strong?' br':''}">${lb?`<span class="il">${esc(lb)}</span>`:''}<div class="ix"${x.align&&x.align!=='auto'?` style="text-align:${x.align}"`:''}>${side?img:''}${ed(c,`it.${q.id}.${x.id}.text`,stripExamItemPrefix(x.text,q.kind),'',c.en?'Type here':'اكتب هنا')}${chH}${x.score.trim()?' '+scoreH(x.score,c,p,'qs in'):''}${chB}${side?'':img}${subH}${tb}${answer}</div></div>`;
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
  return`<section class="qb free-block" data-q="${q.id}" dir="${c.en?'ltr':'rtl'}"><div class="qbody" style="--cols:1">${q.items.slice(from,to).map((x,k)=>itemHTML(q,x,from+k,c,p,1,part,n)).join('')}</div></section>`;
 }
 if(q.kind==='section')return`<section class="qb sec" data-q="${q.id}"><span class="sec-t">${ed(c,`q.${q.id}.prompt`,q.prompt,'','عنوان القسم')}${q.showScore&&q.score?` (${esc(scoreText(q.score,c.en,c.D,false))})`:''}</span></section>`;
 const cols=part?1:autoCols(q);let h='';
 if(head)h+=`<div class="qh"><span class="qmk"></span><h2><span class="qn">${esc(numberedTitle(q,n,c))}</span> ${ed(c,`q.${q.id}.prompt`,stripExamNumberPrefix(q.prompt),'',c.en?'Question':'نص السؤال')}</h2>${q.showScore?scoreH(q.score,c,p):''}</div>`;
 else h+=`<div class="qcontinue">${esc(numberedTitle(q,n,c))} ${c.en?'(continued)':'(تابع)'}</div>`;
 if(head&&q.image)h+=imgHTML(q.image);
 const items=q.items.slice(from,to);
 if(q.kind==='match'){if(items.length||(head&&q.extra.length))h+=`<div class="qbody" style="--cols:1">${matchHTML(q,c,from,to)}</div>`;return`<section class="qb${head?'':' cont'}" data-q="${q.id}" dir="${c.en?'ltr':'rtl'}">${h}</section>`;}
 if(items.length)h+=`<div class="qbody${q.boxed?' boxed':''}" style="--cols:${cols}">${items.map((x,k)=>itemHTML(q,x,from+k,c,p,cols,part,n)).join('')}</div>`;
 return`<section class="qb${head?'':' cont'}" data-q="${q.id}" dir="${c.en?'ltr':'rtl'}">${h}</section>`;
}
function pageShell(p,c,first,inner,bottom){
 return`<article class="page"><div class="pin">${first?headerHTML(p,c):''}<div class="pbody">${inner||''}</div><div class="pbot">${bottom||''}</div></div></article>`;
}
function paperClass(p){return`pages st-source th-${p.theme} dn-${p.density}`;}

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
const currentStep=()=>['paper','style'].includes(UI.view)?'paper':['questions','write'].includes(UI.view)?'questions':'preview';
function examStats(p){
 const questions=p.questions.filter(q=>q.kind!=='text'&&q.kind!=='section');
 const toNumber=value=>String(value??'').trim()?Number(String(value).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).trim()):NaN;
 const scores=questions.map(q=>toNumber(q.score));
 const invalid=scores.filter(v=>!Number.isFinite(v)||v<0).length;
 const empty=questions.filter(q=>!q.prompt?.trim()&&!q.items.some(x=>x.text?.trim())).length;
 const issues=[],missingDefinitions=[];
 questions.forEach((q,index)=>{
  if(q.kind==='definitions'){
   const filled=q.items.filter(x=>stripExamItemPrefix(x.text,q.kind).trim());
   const blanks=q.items.length-filled.length;
   if(filled.length>0&&blanks)missingDefinitions.push({id:q.id,number:index+1,count:blanks});
  }
  const used=q.items.filter(x=>x.text?.trim()||x.choices?.some(t=>t.trim())||x.table||x.image||x.subs?.some(t=>t.trim()));
  const filled=used.filter(x=>String(x.score??'').trim());
  if(!filled.length)return; // Assigning branch marks is optional.
  const values=filled.map(x=>toNumber(x.score));
  let issue='';
  if(values.some(n=>!Number.isFinite(n)||n<0))issue='إحدى درجات الأفرع غير صالحة';
  else if(filled.length!==used.length)issue='بعض الأفرع بلا درجة؛ أكمل توزيع الدرجات';
  else if(!Number.isFinite(toNumber(q.score))||toNumber(q.score)<0)issue='حدّد درجة السؤال لمقارنتها بدرجات الأفرع';
  else {
   const sum=values.reduce((a,b)=>a+b,0),total=toNumber(q.score);
   if(Math.abs(sum-total)>0.001)issue=`مجموع الأفرع ${sum.toLocaleString('ar-IQ')}، ودرجة السؤال ${total.toLocaleString('ar-IQ')}`;
  }
  if(issue)issues.push({id:q.id,number:index+1,message:issue});
 });
 return {count:questions.length,marks:scores.reduce((n,v)=>n+(Number.isFinite(v)&&v>=0?v:0),0),invalid,empty,issues,missingDefinitions};
}
function examStatsMarkup(stats){
 return `<span class="stat-main"><b>${stats.count.toLocaleString('ar-IQ')}</b> ${stats.count===1?'سؤال':stats.count<11?'أسئلة':'سؤالاً'}</span><span class="stat-divider"></span><span><b>${stats.marks.toLocaleString('ar-IQ')}</b> مجموع الدرجات</span>${stats.invalid?`<span class="stat-alert">${stats.invalid} درجة غير صالحة</span>`:''}${stats.empty?`<span class="stat-alert">${stats.empty} سؤال غير مكتمل</span>`:''}${stats.issues.length?`<span class="stat-alert">${stats.issues.length} تنبيه توزيع درجات</span>`:''}${stats.missingDefinitions.length?`<span class="stat-alert">${stats.missingDefinitions.length} سؤال تعاريف فيه خانات فارغة</span>`:''}`;
}
function gradeAuditMarkup(stats){
 if(!stats.issues.length)return '';
 return `<details class="grade-audit"><summary><span class="grade-audit-icon" aria-hidden="true">!</span> تدقيق درجات الأفرع <b>${stats.issues.length.toLocaleString('ar-IQ')}</b><span class="grade-audit-hint">اضغط لمراجعة الأسئلة</span></summary><div class="grade-audit-body">${stats.issues.map(item=>`<button type="button" data-act="jumpQuestion" data-target="${esc(item.id)}"><b>س${toAr(item.number)}</b><span>${esc(item.message)}</span></button>`).join('')}</div></details>`;
}
function definitionAuditMarkup(stats){
 if(!stats.missingDefinitions.length)return '';
 return `<details class="content-audit"><summary>تعريفات تحتاج إكمالاً <b>${stats.missingDefinitions.length.toLocaleString('ar-IQ')}</b><small>راجع الحقول الفارغة قبل طباعة الامتحان</small></summary><div>${stats.missingDefinitions.map(item=>`<button type="button" data-act="jumpQuestion" data-target="${esc(item.id)}">سؤال ${toAr(item.number)}: ${toAr(item.count)} تعريف فارغ</button>`).join('')}</div></details>`;
}
function refreshStats(){const stats=examStats(P());const node=document.querySelector('.exam-statline');if(node)node.innerHTML=examStatsMarkup(stats);const audit=document.getElementById('gradeAudit');if(audit){const expanded=!!audit.querySelector('details[open]');audit.innerHTML=gradeAuditMarkup(stats);if(expanded&&audit.querySelector('details'))audit.querySelector('details').open=true;}const content=document.getElementById('contentAudit');if(content)content.innerHTML=definitionAuditMarkup(stats);}

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
function changed(o={}){setStatus('saving');refreshStats();clearTimeout(saveT);saveT=setTimeout(save,450);clearTimeout(histT);histT=setTimeout(pushHist,450);if(o.paper!==false){clearTimeout(paperT);paperT=setTimeout(renderPaper,160);}}
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
  q[f]=f==='prompt'?stripExamNumberPrefix(val):val;p.pristine=false;}
 else if(a==='it'){const q=findQ(r[0]),x=q&&q.items.find(i=>i.id===r[1]);if(!x)return;const f=r[2];
  if(f==='image'){if(x.image&&r[3])x.image[r[3]]=r[3]==='w'?+val:r[3]==='side'?bool(val):val;return;}
  if(f==='choice'){x.choices[+r[3]]=String(val);p.pristine=false;return;}
  if(f==='sub'){x.subs[+r[3]]=String(val);p.pristine=false;return;}
  if(f==='cell'){if(x.table&&x.table.rows[+r[3]])x.table.rows[+r[3]][+r[4]]=String(val);p.pristine=false;return;}
  if(f==='table'){if(x.table)x.table[r[3]]=r[3]==='align'?val:bool(val);p.pristine=false;return;}
  x[f]=f==='text'&&q.kind!=='text'?stripExamItemPrefix(val,q.kind):f==='answerLines'?Math.min(12,Math.max(0,parseInt(val)||0)):(f==='choices'||f==='subs')?String(val).split('\n'):val;p.pristine=false;}
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
 const rows=p.questions.map((q,i)=>{if(q.kind!=='section'&&q.kind!=='text')n++;const open=UI.open===q.id,num=q.kind==='section'?'§':q.kind==='text'?'نص':numberedTitle(q,n,c);
  return`<li class="qc${open?' open':''}" data-qid="${q.id}"><button type="button" class="qc-h" data-act="toggle" data-q="${q.id}" aria-expanded="${open}">
   <span class="qbadge">${esc(num)}</span><span class="qc-t">${esc(q.prompt||(q.items[0]&&q.items[0].text)||'سؤال بلا نص').replace(/\$+[^$]*\$+/g,'∑')}</span>${q.showScore&&q.score?`<span class="qc-s">${esc(scoreText(q.score,c.en,c.D,false))}</span>`:''}${ic(open?'chevron-up':'chevron-down',18)}</button>
   ${open?qEditor(q,c,i,p):''}</li>`;}).join('');
 const stats=examStats(p);
 return`<div class="pad pad-questions">
  <header class="work-heading"><span class="step-kicker">الخطوة ٢ من ٣</span><div class="bar"><h2>اكتب أسئلة الامتحان</h2><button type="button" class="btn soft" data-act="adding" aria-expanded="${UI.adding}">${ic(UI.adding?'x':'plus',18)}${UI.adding?'إغلاق الأنواع':'إضافة سؤال'}</button></div><p>اختر نوع السؤال، ثم اكتب كل تعريف أو فرع في حقل مستقل؛ الرقم والدرجة يظهران تلقائيًا في الورقة.</p></header>
  <div class="exam-statline" role="status" aria-live="polite">${examStatsMarkup(stats)}</div>
  <div id="gradeAudit">${gradeAuditMarkup(stats)}</div>
  <div id="contentAudit">${definitionAuditMarkup(stats)}</div>
  ${UI.adding?addSheet():''}
  ${p.questions.length?`<ol class="qlist">${rows}</ol>`:UI.adding?`<p class="pick-hint">اختر النوع، ثم اضغط على «إضافة تعريف» أو «إضافة فرع» بقدر ما تحتاج.</p>`:`<div class="empty write-welcome"><b>ابدأ بسؤالك الأول</b><span>مثلًا، اختر «تعاريف» وأضف كل مصطلح في حقل مستقل. الترقيم والتنسيق تلقائيان.</span><button type="button" class="btn primary" data-act="adding">${ic('plus',17)}اختيار نوع السؤال</button></div>`}
  <div class="step-footer"><button type="button" class="btn primary" data-act="view" data-v="preview">معاينة الامتحان وطباعته ${ic('arrow-left',17)}</button></div>
 </div>`;
}
const addSheet=()=>{
 const primary=['definitions','branches','blanks','mcq','math','text'];
 const cards=keys=>keys.filter(k=>KIND_INFO[k]).map(k=>{const[t,d]=KIND_INFO[k];return`<button type="button" class="kind" data-act="addQ" data-kind="${k}"><b>${esc(t)}</b><small>${esc(d)}</small></button>`;}).join('');
 return`<section class="question-picker" aria-label="اختيار نوع السؤال"><div class="picker-title"><strong>شنو تريد تضيف للورقة؟</strong><small>اضغط على النوع لتظهر حقوله مباشرةً</small></div><div class="addsheet">${cards(primary)}</div><details class="picker-more"><summary>${ic('layout-grid',16)}أنواع إضافية${ic('chevron-down',17)}</summary><div class="addsheet">${cards(Object.keys(KIND_INFO).filter(k=>!primary.includes(k)))}</div></details></section>`;
};
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
 const cols=t.rows[0].length,ctxNow=ctx();
 const headers=Array.from({length:cols},(_,i)=>`<span class="tbed-col-head" role="columnheader">${ctxNow.D(String(i+1))}</span>`).join('');
 const cells=t.rows.map((row,i)=>`<span class="tbed-row-head" role="rowheader">${ctxNow.D(String(i+1))}</span>`+row.map((v,j)=>`<div class="tbed-cell${r===i&&c===j?' current':''}${t.head&&i===0?' table-heading-cell':''}" role="gridcell" aria-label="صف ${i+1}، عمود ${j+1}">${rte(`${path}.cell.${i}.${j}`,v,t.head&&i===0?'عنوان العمود':'محتوى الخلية',t.head&&i===0?'th':'')}</div>`).join('')).join('');
 return`<section class="tbed" aria-label="محرّر جدول السؤال">
  <div class="tbed-head"><b>جدول السؤال</b><span>${ctxNow.D(String(t.rows.length))} صفوف × ${ctxNow.D(String(cols))} أعمدة</span></div>
  <p class="tbed-help">حدد خلية ثم أضف صفًا أو عمودًا قبلها أو بعدها. مرر الجدول أفقيًا عند الحاجة.</p>
  <div class="tbed-scroll" role="region" tabindex="0" aria-label="خلايا الجدول، يمكن التمرير أفقيًا"><div class="tbed-g" role="grid" style="--tc:${cols}"><span class="tbed-corner" aria-hidden="true">صف / عمود</span>${headers}${cells}</div></div>
  <div class="tbed-a"><button type="button" class="tb" data-act="tbRow" data-path="${path}" data-d="1" title="إضافة صف"${t.rows.length>=30?' disabled':''}>${ic('plus',15)}صف</button><button type="button" class="tb" data-act="tbRow" data-path="${path}" data-d="-1" title="حذف آخر صف"${t.rows.length<2?' disabled':''}>${ic('minus',15)}صف</button>
  <button type="button" class="tb" data-act="tbCol" data-path="${path}" data-d="1" title="إضافة عمود"${cols>=10?' disabled':''}>${ic('plus',15)}عمود</button><button type="button" class="tb" data-act="tbCol" data-path="${path}" data-d="-1" title="حذف آخر عمود"${cols<2?' disabled':''}>${ic('minus',15)}عمود</button>
  <span class="sp"></span><button type="button" class="tb danger" data-act="tbDel" data-path="${path}" title="حذف الجدول">${ic('trash-2',15)}</button></div>
  <div class="row wrap">${chk('الصف الأول عناوين',`${path}.table.head`,t.head)}${chk('بعرض السطر كاملاً',`${path}.table.full`,t.full)}</div>
  <div class="opt"><span>محاذاة خلايا الجدول</span>${seg(path+'.table.align',t.align||'center',[['right','يمين'],['center','وسط'],['left','يسار']],'sm')}</div>
  <details class="table-edit-more"><summary>تخصيص الصف والعمود المحدد</summary><p class="hint" data-cell-info="${path}">الصف ${r+1}، العمود ${c+1}. اضغط على خلية لتحديدها.</p>
  <div class="table-actions">${[['rowBefore','صف قبله'],['rowAfter','صف بعده'],['colBefore','عمود قبله'],['colAfter','عمود بعده'],['delRow','حذف الصف'],['delCol','حذف العمود']].map(([op,label])=>`<button type="button" class="btn sm${op.startsWith('del')?' danger-t':''}" data-act="tbEdit" data-path="${path}" data-op="${op}">${label}</button>`).join('')}</div></details></section>`;
}
function subsEd(path,x,c){
 return`<div class="fld"><span>فقرات داخل الفرع</span>${x.subs.map((v,j)=>`<div class="chr"><span class="chn">${esc(c.lab(x.subLabel,j))}</span>${rte(path+'.sub.'+j,v,'فقرة داخلية')}<button type="button" class="ib sm" data-act="subDel" data-path="${path}" data-j="${j}" title="حذف الفقرة">${ic('x',16)}</button></div>`).join('')}
 <button type="button" class="ghost sm" data-act="subAdd" data-path="${path}">${ic('plus',16)}فقرة داخلية</button></div>`;
}
function qEditor(q,c,qi,p){
 const foot=`<div class="qfoot"><button type="button" class="ib" data-act="qUp" data-q="${q.id}" title="نقل للأعلى"${qi===0?' disabled':''}>${ic('arrow-up')}</button><button type="button" class="ib" data-act="qDown" data-q="${q.id}" title="نقل للأسفل"${qi===p.questions.length-1?' disabled':''}>${ic('arrow-down')}</button><button type="button" class="ib" data-act="qDup" data-q="${q.id}" title="تكرار">${ic('copy')}</button><span class="sp"></span><button type="button" class="btn danger-t" data-act="qDel" data-q="${q.id}">${ic('trash-2',16)}حذف السؤال</button></div>`;
 if(q.kind==='section')return`<div class="qed"><div class="row">${fld('عنوان القسم',`q.${q.id}.prompt`,q.prompt)}${fld('الدرجة',`q.${q.id}.score`,q.score,{w:'xs',type:'text'})}</div>${foot}</div>`;
 const isM=q.kind==='match',ph=c.en?'Type here':'اكتب هنا';
 const questionNo=p.questions.slice(0,qi+1).filter(v=>!['text','section'].includes(v.kind)).length;
 const items=q.items.map((x,i)=>{const path=`it.${q.id}.${x.id}`,more=UI.more[x.id],isMcq=q.kind==='mcq'||x.choices.length;
  const order=`<div class="tools"><button type="button" class="tb" data-act="itUp" data-q="${q.id}" data-i="${x.id}"${i===0?' disabled':''} title="للأعلى">${ic('chevron-up',16)}</button><button type="button" class="tb" data-act="itDown" data-q="${q.id}" data-i="${x.id}"${i===q.items.length-1?' disabled':''} title="للأسفل">${ic('chevron-down',16)}</button><button type="button" class="tb danger" data-act="itDel" data-q="${q.id}" data-i="${x.id}" title="حذف">${ic('trash-2',16)}</button></div>`;
  if(q.kind==='definitions')return`<li class="def-entry" data-iid="${x.id}">
   <div class="def-entry-head"><span class="def-counter">التعريف ${c.D(String(i+1))}</span><span class="def-entry-hint">حقل مستقل؛ سيُرتَّب في جدول تلقائيًا</span>${order}</div>
   ${rte(path+'.text',stripExamItemPrefix(x.text,q.kind),'اكتب اسم المصطلح هنا','definition-input')}
   <div class="def-entry-actions"><button type="button" class="btn sm" data-act="eq" data-for="${path}.text">${ic('sigma',15)}معادلة</button><button type="button" class="btn sm" data-act="img" data-path="${path}">${ic('image-plus',15)}صورة</button><label class="def-score"><span>درجته (اختياري)</span>${inp(path+'.score',x.score,{ph:'مثلاً ٢'})}</label></div>
   ${x.image?imgCtl(x.image,path):''}
  </li>`;
  if(isM)return`<li class="item mi data-iid="${x.id}"><div class="mrow"><span class="ibadge">${esc(c.lab(q.label==='none'?'n-dot':q.label,i))}</span>${rte(path+'.text',x.text,c.en?'Column A':'العمود (أ)')}<span class="mlink" aria-hidden="true">${ic('arrow-left',16)}</span>${rte(path+'.pair',x.pair,c.en?'Its match':'ما يناسبه في (ب)')}</div><div class="mrow-a"><button type="button" class="tag" data-act="img" data-path="${path}">${ic('image-plus',16)}صورة</button>${order}</div>${x.image?imgCtl(x.image,path):''}</li>`;
  return`<li class="item" data-iid="${x.id}">
   <div class="item-r"><span class="ibadge">${esc(branchNumber(q,questionNo,i,c)||'•')}</span>${rte(path+'.text',stripExamItemPrefix(x.text,q.kind),c.en?'Branch text':'اكتب نص الفرع؛ رقمه يُضاف تلقائيًا')}</div>
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
  <div class="fld"><span>نص السؤال <small class="field-help">لا تكتب «س:١)»؛ التطبيق يضيفها تلقائيًا</small></span>${rte(`q.${q.id}.prompt`,stripExamNumberPrefix(q.prompt),'مثل: عرّف خمسة مما يأتي:')}</div>
  <div class="row al-end">${fld('الدرجة',`q.${q.id}.score`,q.score,{w:'xs',ph:'10'})}<label class="chk"><input type="checkbox" data-b="q.${q.id}.showScore"${q.showScore?' checked':''}><span>إظهار الدرجة</span></label><span class="sp"></span><button type="button" class="ib keep" data-act="eq" data-for="q.${q.id}.prompt" title="معادلة في نص السؤال">${ic('sigma',18)}</button><button type="button" class="ib" data-act="img" data-path="q.${q.id}" title="صورة للسؤال">${ic('image-plus',18)}</button></div>
  ${q.image?imgCtl(q.image,`q.${q.id}`):''}
  <div class="sub-h">${isM?'أزواج الوصل: كل سطر عبارة وما يقابلها':q.kind==='definitions'?'حقول التعاريف — كل مصطلح في خانة منفصلة':'الأفرع والفقرات'}</div>
  <ol class="items${q.kind==='definitions'?' definitions-list':''}">${items}</ol>
  ${isM?`<div class="fld"><span>إجابات زائدة في العمود (ب) للتمويه</span>${q.extra.map((v,k)=>`<div class="chr">${rte(`q.${q.id}.extra.${k}`,v,'إجابة زائدة')}<button type="button" class="ib sm" data-act="exDel" data-q="${q.id}" data-j="${k}" title="حذف">${ic('x',16)}</button></div>`).join('')}<button type="button" class="ghost sm" data-act="exAdd" data-q="${q.id}">${ic('plus',16)}إجابة زائدة</button></div>`:''}
  ${q.kind==='text'?`<div class="free-convert"><b>كتبت سؤالًا يدويًا؟</b><span>حوّله إلى سؤال مرقّم بدون نسخ النص أو إعادة كتابته.</span><button type="button" class="btn soft sm" data-act="convertFree" data-q="${q.id}">تحويل إلى سؤال: س:١)</button></div>`:''}
  <div class="row2"><button type="button" class="ghost" data-act="addItem" data-q="${q.id}">${ic('plus',17)}${isM?'إضافة زوج':q.kind==='definitions'?'إضافة تعريف':'إضافة فرع'}</button>${isM||q.kind==='definitions'?'':`<button type="button" class="ghost" data-act="addEqItem" data-q="${q.id}">${ic('sigma',17)}فرع معادلة</button>`}</div>
  <details class="sec in"${UI.lay[q.id]?' open':''} data-lay="${q.id}"><summary>${ic('layout-grid',17)}<span>ترتيب السؤال</span>${ic('chevron-down',17)}</summary><div class="sec-b">
   ${isM?mOpts:`<div class="opt"><span>${q.kind==='definitions'?'عدد أعمدة التعاريف في الورقة':'توزيع الأفرع'}</span>${seg(`q.${q.id}.cols`,q.cols,[[-1,'تلقائي'],[1,'سطر لكل فرع'],[2,'عمودان'],[3,'٣'],[4,'٤']],'sm')}</div>`}
   <div class="opt"><span>${q.kind==='definitions'?'ترقيم التعاريف':'ترقيم الأفرع'}</span>${seg(`q.${q.id}.label`,q.label,Object.keys(LABELS).map(k=>[k,k==='none'?'بلا':c.lab(k,0)]),'sm')}</div>
   ${chOpts}
   <div class="row wrap">${isM?'':chk(q.kind==='definitions'?'التعاريف داخل مربعات':'الأفرع داخل مربعات',`q.${q.id}.boxed`,q.boxed)}${chk('يبدأ في صفحة جديدة',`q.${q.id}.breakBefore`,q.breakBefore)}</div>
   <p class="hint">رقم السؤال يحدّثه البرنامج تلقائيًا عند إضافة أو ترتيب الأسئلة. لا حاجة لإدخاله يدويًا.</p>
  </div></details>
  ${foot}
 </div>`;
}

/* ---------- لوحة الورقة: كل عنصر أمامه زر إظهار وإخفاء ---------- */
function rowF(k,label,body){const m=P().meta,on=m.show[k]!==false;return`<div class="frow${on?'':' off'}">${eye(k,on)}<div class="frow-b"><span class="frow-l">${label}</span>${body}</div></div>`;}
function paperView(p,c){
 const m=p.meta;
 return`<div class="pad pad-setup">
  <header class="work-heading"><span class="step-kicker">الخطوة ١ من ٣</span><div class="bar"><h2>إعداد الورقة</h2><button type="button" class="btn soft" data-act="wizard">${ic('settings-2',17)}تغيير المرحلة والمادة</button></div><p>راجع بيانات الترويسة، ثم اختر مظهر الورقة وانتقل إلى كتابة الأسئلة.</p></header>
  <div class="setup-appearance"><div><b>مظهر الامتحان</b><small>الثيم، نوع الخط، الحجم والهوامش</small></div><button type="button" class="btn sm" data-act="view" data-v="style">${ic('palette',16)}تخصيص المظهر</button></div>
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
  ${sec('إدارة الملف',`<div class="row wrap"><button type="button" class="btn" data-act="save">${ic('download',17)}حفظ المشروع</button><button type="button" class="btn" data-act="open">${ic('folder-open',17)}فتح مشروع</button><button type="button" class="btn" data-act="new">${ic('file-plus-2',17)}ورقة فارغة</button></div><p class="hint">التصدير النهائي PDF من زر PDF. ملف المشروع يحفظ عملك لتكمل تحريره لاحقاً.</p>`,false,'folder')}
  <div class="step-footer"><button type="button" class="btn primary" data-act="view" data-v="questions">التالي: كتابة الأسئلة ${ic('arrow-left',17)}</button></div>
 </div>`;
}

/* ---------- لوحة التنسيق ---------- */
function styleView(p,c){
 return`<div class="pad pad-style"><header class="work-heading"><span class="step-kicker">تخصيص إعداد الورقة</span><div class="bar"><h2>المظهر والخطوط</h2><button type="button" class="btn soft" data-act="view" data-v="paper">${ic('arrow-right',17)}عودة</button></div><p>غيّر الألوان والخطوط والمسافات دون المساس بمحتوى الأسئلة أو بيانات الترويسة.</p></header>
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
   <p class="hint">ترقيم السؤال تلقائي وثابت: س:١) أو س:1)، والفرع س:١- أ) أو س:1- A).</p>`,false,'settings-2')}
  <div class="step-footer"><button type="button" class="btn" data-act="view" data-v="paper">${ic('arrow-right',17)}إعداد الورقة</button><button type="button" class="btn primary" data-act="view" data-v="questions">الانتقال للأسئلة ${ic('arrow-left',17)}</button></div>
 </div>`;
}
function renderSide(){
 const p=P(),c=ctx(),body=$('#sideBody'),st=body.scrollTop,v=['preview','write'].includes(UI.view)?'questions':UI.view;
 const step=currentStep();
 $$('[data-act=view]').forEach(b=>{const active=b.dataset.v===UI.view||((b.closest('.nav')||b.closest('.workflow'))&&b.dataset.v===step);b.setAttribute('aria-current',String(!!active));if(b.closest('.workflow'))b.setAttribute('aria-current',active?'step': 'false');});
 const context=$('#docContext');if(context)context.textContent=[STAGES[S.active].label,p.meta.grade,p.meta.subject].filter(Boolean).join(' · ');
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
  const heading=q.kind==='text'?'':q.kind==='section'?'عنوان قسم':numberedTitle(q,n,c);
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
 ['تعاريف بحقول واضحة','اضغط «إضافة تعاريف»، واكتب كل مصطلح وحده؛ يظهر الجدول وتُرقّم التعاريف تلقائيًا.'],
 ['المعادلة بمكانها','كسور وجذور وأسُس وقسمة طويلة، ورموز للفيزياء والكيمياء، داخل الجملة أو في فرع مستقل.'],
 ['جداول ومساحات إجابة','اكتب في الخلايا، أضف الصفوف والأعمدة، ووزّع الجدول الطويل على الصفحات مع عناوينه.'],
 ['راجع قبل الطباعة','معاينة A4 وتنبيه عند تجاوز الحدود، ثم إخراج PDF من طباعة المتصفح.'],
 ['شغلك يبقى إلك','حفظ محلي، وملف مشروع للرجوع لاحقاً، وتراجع عن التعديلات. ما يحتاج إنشاء حساب.']
 ];
 host.innerHTML=`<div class="welcome-inner"><nav class="welcome-nav" aria-label="تنقل البداية"><div class="welcome-brand"><span class="mark">م</span><span>المفيد<br><small>في تنضيد الامتحانات</small></span></div><div class="welcome-actions"><button type="button" class="btn sm" data-act="homeLearn">دليل الاستخدام</button>${S.started?'<button type="button" class="btn sm" data-act="continueProject">متابعة مشروعي</button>':''}</div></nav>
 <section class="welcome-hero"><div><p class="eyebrow">تنضيد أوراق الامتحانات العراقية</p><h1>المفيد<span>في تنضيد الامتحانات</span></h1><p class="intro">أسئلتك، بترتيب واضح وجاهز للطباعة.<br>جهّز الترويسة، أضف الأسئلة، وراجع الورقة قبل إخراجها بصيغة PDF.</p><div class="welcome-actions"><button type="button" class="btn primary" data-act="homeNew">${ic('plus',18)}مشروع جديد</button><button type="button" class="btn" data-act="demo">${ic('pencil',18)}جرّب وتعلّم</button><button type="button" class="btn" data-act="homeOpen">${ic('folder-open',18)}فتح ملف مشروع</button></div><p class="trust">لا يحتاج حساباً. ملفاتك تبقى على جهازك.</p><div class="home-flow" aria-label="خطوات إنشاء الامتحان"><span><b>١</b>إعداد الورقة</span><span><b>٢</b>كتابة الأسئلة</span><span><b>٣</b>معاينة PDF</span></div></div>
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
const EQG=[['الدوال المثلثية',['trig','identity']],['التفاضل',['deriv','deriv2','partialderiv']],['التكامل',['intindef','intdef','lim','sum']],['أساسيات',['frac','mixed','root','pow','sub','powsub','ppow','paren','abs']],['حساب',['longdiv','sys','log','int','bar']],['علوم',['chem','iso','arrow','vec','unit']],['نص',['text']]];
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
  trig:['دالة مثلثية',[['fn','اختر الدالة'],['x','الزاوية أو التعبير'],['e','أس الدالة (اختياري)']],{fn:'sin',x:'س',e:''},{fn:'sin',x:'x',e:''}],
  identity:['هوية مثلثية',[['x','الزاوية أو المتغير']],{x:'س'},{x:'x'}],
  deriv:['المشتقة الأولى',[['f','الدالة المراد اشتقاقها'],['v','متغير الاشتقاق']],{f:'س^{٢}+٣س',v:'س',d:'د'},{f:'x^{2}+3x',v:'x',d:'d'}],
  deriv2:['المشتقة الثانية',[['f','الدالة المراد اشتقاقها'],['v','متغير الاشتقاق']],{f:'س^{٣}',v:'س',d:'د'},{f:'x^{3}',v:'x',d:'d'}],
  partialderiv:['مشتقة جزئية',[['f','الدالة'],['v','متغير الاشتقاق']],{f:'س^{٢}+ص',v:'س'},{f:'x^{2}+y',v:'x'}],
  intindef:['تكامل غير محدد',[['f','الدالة تحت إشارة التكامل'],['v','متغير التكامل']],{f:'س^{٢}',v:'س',d:'د'},{f:'x^{2}',v:'x',d:'d'}],
  intdef:['تكامل محدد',[['a','الحد الأدنى'],['b','الحد الأعلى'],['f','الدالة تحت إشارة التكامل'],['v','متغير التكامل']],{a:'٠',b:'١',f:'س^{٢}',v:'س',d:'د'},{a:'0',b:'1',f:'x^{2}',v:'x',d:'d'}],
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
  if(sel.t==='trig'&&f==='fn')return`<label class="fld"><span>${l}</span><select data-eq="fn" aria-label="اختر الدالة المثلثية">${[['sin','جا / sin'],['cos','جتا / cos'],['tan','ظا / tan'],['cot','ظتا / cot'],['sec','قا / sec'],['csc','قتا / csc'],['arcsin','جا العكسية / arcsin'],['arccos','جتا العكسية / arccos'],['arctan','ظا العكسية / arctan']].map(([v,n])=>`<option value="${v}"${sel.fn===v?' selected':''}>${n}</option>`).join('')}</select></label>`;
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
  <div class="math-fast" aria-label="أدوات الرياضيات المتقدمة"><b>رياضيات: أضف الصيغة</b><div class="math-fast-scroll">${[['trig','جا / sin'],['identity','جا² + جتا²'],['deriv','المشتقة'],['deriv2','المشتقة الثانية'],['partialderiv','∂ مشتقة جزئية'],['intindef','∫ غير محدد'],['intdef','∫ بحدود']].map(([k,n])=>`<button type="button" data-act="eqAdd" data-t="${k}">${n}</button>`).join('')}</div></div>
  <details class="eqtemplates"${e.pieces.length?'':' open'}><summary>${e.pieces.length?'إضافة صيغة أخرى':'اختر صيغة المعادلة'}${ic('chevron-down',16)}</summary><div class="eqgal">${EQG.map(([g,ks])=>`<div class="gal-g"><span class="gal-h">${g}</span><div class="gal">${ks.map(k=>{const [n,,smp,enSmp]=EQT[k],preview=e.lang==='en'&&enSmp?enSmp:smp;return`<button type="button" class="gt" data-act="eqAdd" data-t="${k}"><span class="gt-v" dir="${ar&&!['chem','iso','int','lim','sum','unit'].includes(k)?'rtl':'ltr'}">${texToHTML(pieceTex({t:k,...toPieceDigits(preview,['chem','iso','int','lim','sum','unit'].includes(k)?'en':e.lang),steps:false}),['chem','iso','int','lim','sum','unit'].includes(k)?'en':e.lang)}</span><small>${n}</small></button>`;}).join('')}</div></div>`).join('')}</div></details>
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
  const optional={root:['n'],arrow:['a','b'],longdiv:['q'],int:['a','b'],trig:['e']};
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
 if(!['jumpQuestion','symOpen','symTab','symClose','eqRoot','eqRemove','fmt','rEq','rSym','view','toggle','adding','more','zin','zout','zfit','eq','eqEdit','eqAdd','eqSel','eqMove','eqDel','eqClose','eqOk','eqTab','wz','wzNext','wzBack','wzClose','img','logo','font','open','save','print','wizard','undo','redo'].includes(a))pushHist();
 switch(a){
  case'view':setView(b.dataset.v);break;
  case'jumpQuestion':{const target=b.dataset.target;UI.open=target;UI.view='questions';renderSide();requestAnimationFrame(()=>{$(`.qc[data-qid="${target}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});});break;}
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
  case'addQ':{if(p.questions.length>=80){toast('الحد ٨٠ سؤالاً لكل مرحلة، احفظ امتحاناً جديداً');break;}const n=DEMO?kindTemplate(b.dataset.kind,ctx().en):blankQuestion(b.dataset.kind,ctx().en);if(!DEMO&&['branches','enumerate'].includes(n.kind))n.label='l-paren';p.questions.push(n);p.pristine=false;UI.open=n.id;UI.adding=false;UI.view='questions';commit();requestAnimationFrame(()=>{const r=$(`.qc[data-qid="${n.id}"]`);r&&r.scrollIntoView({block:'start',behavior:'smooth'});});break;}
  case'startWriting':startWriting();break;
  case'rQuestion':UI.view='questions';UI.adding=true;renderSide();break;
  case'demo':startLesson();break;
  case'qUp':move(p.questions,qi,-1);p.pristine=false;commit();break;
  case'qDown':move(p.questions,qi,1);p.pristine=false;commit();break;
  case'qDup':{const d=JSON.parse(JSON.stringify(q));d.id=uid();d.items.forEach(x=>x.id=uid());p.questions.splice(qi+1,0,d);UI.open=d.id;p.pristine=false;commit();break;}
  case'qDel':p.questions.splice(qi,1);p.pristine=false;commit();toast('حُذف السؤال',{label:'تراجع',run:()=>undo(-1)});break;
  case'convertFree':{
   if(!q||q.kind!=='text')break;
   const first=q.items[0]||it('');const lines=String(first.text||'').split(/\r?\n/);
   const manualHeading=stripExamNumberPrefix(q.prompt||lines.shift()||'');
   if(!manualHeading.trim()){toast('اكتب نص السؤال أولاً ثم حوّله إلى سؤال مرقّم');break;}
   q.kind='branches';q.label='l-paren';q.prompt=manualHeading;
   const remainder=q.prompt===stripExamNumberPrefix(String(first.text||''))?'':lines.join('\n');
   q.items=q.items.length?q.items:[it('')];q.items[0].text=remainder;
   q.showScore=!!String(q.score).trim();q.boxed=false;p.pristine=false;UI.open=q.id;
   commit();toast('صار السؤال مرقّمًا تلقائيًا؛ أضف الأفرع عند الحاجة');break;
  }
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
  case'eqAdd':{const [,,smp]=EQT[b.dataset.t];const np={t:b.dataset.t,steps:false};EQT[b.dataset.t][1].forEach(([f])=>np[f]='');if(b.dataset.t==='text')np.v='';if(b.dataset.t==='trig')np.fn='sin';if(['deriv','deriv2','intindef','intdef'].includes(b.dataset.t)){np.v=EQ.lang==='ar'?'س':'x';np.d=EQ.lang==='ar'?'د':'d';}if(b.dataset.t==='partialderiv')np.v=EQ.lang==='ar'?'س':'x';if(['chem','iso','unit'].includes(b.dataset.t))EQ.lang='en';EQ.pieces.splice(EQ.sel+1,0,np);EQ.sel++;EQ.focusKey=null;EQ.autofocus=true;renderEq();break;}
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
 if(m){UI.tableCells[m[1]]=[+m[2],+m[3]];const info=$(`[data-cell-info="${m[1]}"]`);if(info)info.textContent=`الصف ${+m[2]+1}، العمود ${+m[3]+1}. اضغط على خلية لتحديدها.`;const grid=e.target.closest('.tbed-g');if(grid){$$('.tbed-cell.current',grid).forEach(el=>el.classList.remove('current'));e.target.closest('.tbed-cell')?.classList.add('current');}}
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
