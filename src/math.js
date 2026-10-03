/* ===== محرك الرياضيات: صيغة LaTeX مبسطة تُرسم HTML حقيقي ===== */
const SYM={times:'×',div:'÷',pm:'±',mp:'∓',cdot:'·',le:'≤',leq:'≤',ge:'≥',geq:'≥',ne:'≠',neq:'≠',approx:'≈',equiv:'≡',sim:'~',to:'→',rightarrow:'→',leftarrow:'←',Rightarrow:'⇒',Leftrightarrow:'⇔',leftrightarrow:'↔',rightleftharpoons:'⇌',lor:'∨',land:'∧',neg:'~',lnot:'~',cap:'∩',cup:'∪',in:'∈',notin:'∉',subset:'⊂',subseteq:'⊆',supset:'⊃',emptyset:'∅',varnothing:'∅',infty:'∞',angle:'∠',triangle:'△',degree:'°',circ:'°',perp:'⊥',parallel:'∥',therefore:'∴',because:'∵',forall:'∀',exists:'∃',sum:'∑',int:'∫',prod:'∏',iint:'∬',iiint:'∭',oint:'∮',partial:'∂',nabla:'∇',prime:'′',ldots:'…',cdots:'⋯',
 alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',theta:'θ',lambda:'λ',mu:'μ',pi:'π',rho:'ρ',sigma:'σ',tau:'τ',phi:'φ',omega:'ω',Delta:'Δ',Gamma:'Γ',Theta:'Θ',Lambda:'Λ',Pi:'Π',Sigma:'Σ',Phi:'Φ',Omega:'Ω'};
Object.assign(SYM,{varepsilon:'ε',vartheta:'ϑ',varphi:'φ',eta:'η',kappa:'κ',nu:'ν',xi:'ξ',chi:'χ',psi:'ψ',zeta:'ζ',Psi:'Ψ',ell:'ℓ',AA:'Å',deg:'°',permil:'‰',bullet:'•',star:'⋆',leftrightharpoons:'⇋',rightharpoonup:'⇀',mapsto:'↦',implies:'⇒',iff:'⇔',ni:'∋',setminus:'∖',sqcup:'⊔',top:'⊤',bot:'⊥',cong:'≅',simeq:'≃',ll:'≪',gg:'≫',dagger:'†',measuredangle:'∡',square:'□',Box:'□',lozenge:'◊'});
Object.assign(SYM,{uparrow:'↑',downarrow:'↓',longrightarrow:'⟶',longleftarrow:'⟵',Leftarrow:'⇐',nearrow:'↗',searrow:'↘',propto:'∝',hbar:'ℏ',ohm:'Ω'});
const AR_FN={sin:'جا',cos:'جتا',tan:'ظا',cot:'ظتا',sec:'قا',csc:'قتا',arcsin:'جا⁻¹',arccos:'جتا⁻¹',arctan:'ظا⁻¹',sinh:'sinh',cosh:'cosh',tanh:'tanh',log:'لو'};
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
    case'binom':{const a=braced(),b=braced();return`<span class="mbinom"><span class="mbinom-br">${fenceSVG('(')}</span><span class="mbinom-stack"><span>${cell(a)}</span><span>${cell(b)}</span></span><span class="mbinom-br">${fenceSVG(')')}</span></span>`;}
    case'mat':case'detmatrix':{
      const nr=Number(rawBraced()),nc=Number(rawBraced()),style=name==='detmatrix'?'v':rawBraced();
      if(!Number.isInteger(nr)||!Number.isInteger(nc)||nr<1||nc<1||nr>4||nc>4||!['p','b','v','n'].includes(style))return'<span class="math-error">مصفوفة غير صالحة</span>';
      const data=[];for(let k=0;k<nr*nc;k++){sp();if(s[i]!=='{')return'<span class="math-error">مصفوفة غير مكتملة</span>';data.push(rawBraced());}
      const l=style==='p'?'(':style==='b'?'[':'',r=style==='p'?')':style==='b'?']':'';
      return`<span class="mmat mmat-${style}" role="math" aria-label="${style==='v'?'محدد':'مصفوفة'} ${nr} × ${nc}">${l?`<span class="mmat-br">${fenceSVG(l)}</span>`:''}<span class="mmat-grid" style="grid-template-columns:repeat(${nc},minmax(0,max-content));direction:${lang==='ar'?'rtl':'ltr'}">${data.map(v=>`<span class="mmat-cell">${cell(texToHTML(v,lang))}</span>`).join('')}</span>${r?`<span class="mmat-br">${fenceSVG(r)}</span>`:''}</span>`;
    }
    case'cases':case'aligned':{
      const nr=Number(rawBraced());if(!Number.isInteger(nr)||nr<1||nr>6)return'<span class="math-error">عدد أسطر غير صالح</span>';
      const data=[];for(let k=0;k<nr;k++){sp();if(s[i]!=='{')return'<span class="math-error">أسطر غير مكتملة</span>';const a=rawBraced();sp();if(s[i]!=='{')return'<span class="math-error">أسطر غير مكتملة</span>';data.push([a,rawBraced()]);}
      return name==='cases'?`<span class="mcases"><span class="mcases-br">${fenceSVG('{')}</span><span class="mcases-grid">${data.map(pair=>`<span class="mcases-row"><span>${cell(texToHTML(pair[0],lang))}</span><span class="mcases-cond">${pair[1]?texToHTML(pair[1],lang):''}</span></span>`).join('')}</span></span>`:
        `<span class="maligned">${data.map(pair=>`<span class="maligned-row"><span>${cell(texToHTML(pair[0],lang))}</span><span>${cell(texToHTML(pair[1],lang))}</span></span>`).join('')}</span>`;
    }
    case'overbrace':case'underbrace':{
      const body=braced(),label=braced();return`<span class="mbrace mbrace-${name==='overbrace'?'over':'under'}">${name==='overbrace'?`<span class="mbrace-label">${label}</span>`:''}<span class="mbrace-main">${cell(body)}</span>${name==='underbrace'?`<span class="mbrace-label">${label}</span>`:''}</span>`;
    }
    case'isotope':{const a=braced(),z=braced(),x=braced().replace(/<\/?i>/g,'');return`<span class="miso"><span class="mss pre"><span>${a}</span><span>${z}</span></span>${x}</span>`;}
    case'system':{const a=braced(),b=braced();return`<span class="mfence msys-w"><span class="mfz">${fenceSVG('{')}</span><span class="msys"><span>${a}</span><span>${b}</span></span></span>`;}
    case'lim':case'limsup':case'liminf':return`<span class="mlim mfn">${name==='lim'?(lang==='ar'?'نها':'lim'):name==='limsup'?'lim sup':'lim inf'}</span>`;
    case'sum':return`<span class="mlim mbig">∑</span>`;
    case'prod':return`<span class="mlim mbig">∏</span>`;
    case'int':case'iint':case'iiint':return`<span class="mint">${name==='int'?'∫':name==='iint'?'∬':'∭'}</span>`;
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
function matTex(p){
 const r=Math.max(1,Math.min(4,Number(p.r)||2)),c=Math.max(1,Math.min(4,Number(p.c)||2));
 const style=p.t==='det'?'v':(['p','b','v','n'].includes(p.style)?p.style:'p');
 return`\\mat{${r}}{${c}}{${style}}`+Array.from({length:r*c},(_,i)=>`{${p.cells?.[i]??''}}`).join('');
}
function rowsTex(p){
 const n=Math.max(1,Math.min(6,Number(p.n)||2));
 return`\\${p.t}{${n}}`+Array.from({length:n},(_,i)=>`{${p.lines?.[i]?.[0]??''}}{${p.lines?.[i]?.[1]??''}}`).join('');
}
function piecesToTex(ps){
 return ps.map(p=>({text:()=>p.v,frac:()=>`\\frac{${p.a}}{${p.b}}`,mixed:()=>`{${p.w}}\\frac{${p.a}}{${p.b}}`,sqrt:()=>`\\sqrt{${p.x}}`,nroot:()=>`\\sqrt[${p.n}]{${p.x}}`,root:()=>p.n&&!/^\s*[2٢]?\s*$/.test(p.n)?`\\sqrt[${p.n}]{${p.x}}`:`\\sqrt{${p.x}}`,
  unit:()=>`\\qty{${p.v}}{${p.u}}`,iso:()=>`\\isotope{${p.a}}{${p.z}}{${p.x}}`,sys:()=>`\\system{${p.a}}{${p.b}}`,log:()=>`\\log_{${p.b}}{${p.x}}`,lim:()=>`\\lim_{${p.v} \\to ${p.a}}{${p.x}}`,
  int:()=>`\\int_{${p.a}}^{${p.b}}{${p.f}}`,
  trig:()=>`\\${['sin','cos','tan','cot','sec','csc','arcsin','arccos','arctan','sinh','cosh','tanh'].includes(p.fn)?p.fn:'sin'}${p.e?`^{${p.e}}`:''}{${p.x}}`,
  identity:()=>`\\sin^{2}{${p.x}}+\\cos^{2}{${p.x}}=1`,
  deriv:()=>`\\frac{${p.d}}{${p.d}${p.v}}\\left(${p.f}\\right)`,
  deriv2:()=>`\\frac{${p.d}^{2}}{${p.d}${p.v}^{2}}\\left(${p.f}\\right)`,
  partialderiv:()=>`\\frac{\\partial}{\\partial ${p.v}}\\left(${p.f}\\right)`,
  intindef:()=>`\\int{${p.f}}\\,${p.d}${p.v}`,
  intdef:()=>`\\int_{${p.a}}^{${p.b}}{${p.f}}\\,${p.d}${p.v}`,
  iint:()=>`\\iint${p.a?`_{${p.a}}`:''}${p.b?`^{${p.b}}`:''}{${p.f}}\\,${p.d}${p.v}`,
  iiint:()=>`\\iiint${p.a?`_{${p.a}}`:''}${p.b?`^{${p.b}}`:''}{${p.f}}\\,${p.d}${p.v}`,
  oint:()=>`\\oint${p.a?`_{${p.a}}`:''}${p.b?`^{${p.b}}`:''}{${p.f}}\\,${p.d}${p.v}`,
  derivn:()=>`\\frac{${p.d}^{${p.n}}}{${p.d}${p.v}^{${p.n}}}\\left(${p.f}\\right)`,
  partialn:()=>`\\frac{\\partial^{${p.n}}}{\\partial ${p.v}^{${p.n}}}\\left(${p.f}\\right)`,
  matrix:()=>matTex(p),det:()=>matTex(p),cases:()=>rowsTex(p),aligned:()=>rowsTex(p),
  binom:()=>`\\binom{${p.a}}{${p.b}}`,
  overbrace:()=>`\\overbrace{${p.x}}{${p.l}}`,underbrace:()=>`\\underbrace{${p.x}}{${p.l}}`,
  limsup:()=>`\\limsup_{${p.v} \\to ${p.a}}{${p.x}}`,liminf:()=>`\\liminf_{${p.v} \\to ${p.a}}{${p.x}}`,
  prod:()=>`\\prod_{${p.a}}^{${p.b}}{${p.x}}`,
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
 if(s.startsWith('\\prod_{')){let i=6,a,b='',x;[a,i]=readGroup(s,i);if(s[i]==='^')[b,i]=readGroup(s,i+1);[x,i]=readGroup(s,i);if(i===s.length)p={t:'prod',a,b,x};}
 const matrix=/^\\(?:mat|detmatrix)\{/.test(s);
 if(matrix){
   const cmd=s.startsWith('\\detmatrix')?'detmatrix':'mat';let i=cmd==='detmatrix'?10:4,r,c,style;
   [r,i]=readGroup(s,i);[c,i]=readGroup(s,i);if(cmd==='mat')[style,i]=readGroup(s,i);else style='v';
   const rows=Number(r),cols=Number(c);if(Number.isInteger(rows)&&Number.isInteger(cols)&&rows>=1&&rows<=4&&cols>=1&&cols<=4&&['p','b','v','n'].includes(style)){
     const cells=[];for(let j=0;j<rows*cols;j++){let val;[val,i]=readGroup(s,i);if(val===null)return null;cells.push(val);}
     if(i===s.length)p={t:style==='v'?'det':'matrix',r:String(rows),c:String(cols),style,cells};
   }
 }
 const layout=/^\\(?:cases|aligned)\{/.test(s);
 if(layout){
   const cmd=s.startsWith('\\cases')?'cases':'aligned';let i=cmd==='cases'?6:8,n;[n,i]=readGroup(s,i);const count=Number(n);
   if(Number.isInteger(count)&&count>=1&&count<=6){const lines=[];
     for(let j=0;j<count;j++){let a,b;[a,i]=readGroup(s,i);[b,i]=readGroup(s,i);if(a===null||b===null)return null;lines.push([a,b]);}
     if(i===s.length)p={t:cmd,n:String(count),lines};
   }
 }
 const choose=/^\\binom\{/.test(s);
 if(choose){let a,b,i;[a,i]=readGroup(s,6);[b,i]=readGroup(s,i);if(i===s.length)p={t:'binom',a,b};}
 const braces=/^\\(?:overbrace|underbrace)\{/.exec(s);
 if(braces){const cmd=s.startsWith('\\overbrace')?'overbrace':'underbrace';let a,b,i;[a,i]=readGroup(s,cmd.length+1);[b,i]=readGroup(s,i);if(i===s.length)p={t:cmd,x:a,l:b};}
 const multi=/^\\(iint|iiint|oint)(?:_\{([^{}]+)\})?(?:\^\{([^{}]+)\})?\{([\s\S]*)\}\\,(d|د)(.+)$/.exec(s);
 if(multi)p={t:multi[1],a:multi[2]||'',b:multi[3]||'',f:multi[4],d:multi[5],v:multi[6]};
 const nth=/^\\frac\{(d|د)\^\{([^{}]+)\}\}\{\1([^{}]+)\^\{\2\}\}\\left\(([\s\S]*)\\right\)$/.exec(s);
 if(nth)p={t:'derivn',d:nth[1],n:nth[2],v:nth[3],f:nth[4]};
 const pnth=/^\\frac\{\\partial\^\{([^{}]+)\}\}\{\\partial ([^{}]+)\^\{\1\}\}\\left\(([\s\S]*)\\right\)$/.exec(s);
 if(pnth)p={t:'partialn',n:pnth[1],v:pnth[2],f:pnth[3]};
 const limsup=/^\\(limsup|liminf)_\{([^{}]+) \\to ([^{}]+)\}\{([\s\S]*)\}$/.exec(s);
 if(limsup)p={t:limsup[1],v:limsup[2],a:limsup[3],x:limsup[4]};
 const tr=/^\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh)(?:\^\{([^{}]+)\})?\{([\s\S]*)\}$/.exec(s);
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
