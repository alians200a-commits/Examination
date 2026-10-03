(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const AR='٠١٢٣٤٥٦٧٨٩',FA='۰۱۲۳۴۵۶۷۸۹';
const toAr=s=>String(s).replace(/[0-9]/g,d=>AR[d]).replace(/[۰-۹]/g,d=>AR[FA.indexOf(d)]);
const toLa=s=>String(s).replace(/[٠-٩]/g,d=>AR.indexOf(d)).replace(/[۰-۹]/g,d=>FA.indexOf(d));
/*MATH*/

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
 math:['سؤال معادلات','كسور، جذور، قسمة طويلة، كيمياء وفيزياء'],
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
