import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { ImagePlus, RotateCcw, Trash2, X } from 'lucide-react';
import { defaultLogo, logoHome, THEME_OPTIONS } from '../data';
import type { LogoSettings, Theme } from '../data';
interface Props {
  open:boolean;onClose:()=>void;theme:Theme;onTheme:(theme:Theme)=>void;
  logo:LogoSettings;setLogo:Dispatch<SetStateAction<LogoSettings>>;onPickLogo:()=>void;
}
export function SettingsPanel({open,onClose,theme,onTheme,logo,setLogo,onPickLogo}:Props) {
  const [tab,setTab]=useState<'logo'|'theme'>('theme');
  const slider=(key:'x'|'y'|'width',label:string,min:number,max:number)=><label><span>{label}</span><input type="range" min={min} max={max} value={logo[key]} onChange={(e:ChangeEvent<HTMLInputElement>)=>setLogo(v=>({...v,[key]:+e.target.value}))}/></label>;
  return <>{open&&<div className="backdrop" onClick={onClose}/>}<aside className={`inspector ${open?'open':''}`} aria-label="الشعار والثيمات">
    <div className="inspector-head"><div className="seg" role="tablist">
      <button role="tab" aria-selected={tab==='theme'} className={tab==='theme'?'on':''} onClick={()=>setTab('theme')}>الثيمات</button>
      <button role="tab" aria-selected={tab==='logo'} className={tab==='logo'?'on':''} onClick={()=>setTab('logo')}>الشعار</button>
    </div><button className="icon-btn close-panel" title="إغلاق" onClick={onClose}><X size={18}/></button></div>
    <div className="inspector-body">{tab==='theme'?<div className="theme-grid">{THEME_OPTIONS.map(t=><button type="button" key={t.id} className={`theme-tile ${theme===t.id?'chosen':''}`} onClick={()=>onTheme(t.id)}>
      <span className="swatch" style={{background:`linear-gradient(135deg,${t.colors[0]} 0 55%,${t.colors[1]} 55% 100%)`}}/><span><strong>{t.label}</strong><small>{t.description}</small></span>
    </button>)}</div>:<div className="logo-panel">
      <p className="panel-help">الشعار يظهر في ترويسة الصفحة الأولى فقط. ارفعه ثم اسحبه داخل الترويسة أو عدّل موضعه وحجمه.</p>
      <div className="row-actions"><button className="btn" onClick={onPickLogo}><ImagePlus size={16}/>{logo.src?'تغيير الشعار':'رفع شعار'}</button>
      {logo.src&&<button className="btn" onClick={()=>setLogo(v=>({...v,...logoHome(v.width,v.ratio)}))}><RotateCcw size={16}/> إعادة الموضع</button>}
      {logo.src&&<button className="btn danger" onClick={()=>setLogo(defaultLogo)}><Trash2 size={16}/> حذف</button>}</div>
      {logo.src&&<div className="slider-group">{slider('x','الموضع الأفقي',4,96)}{slider('y','الموضع العمودي',4,96)}{slider('width','الحجم',6,30)}</div>}
    </div>}</div>
  </aside></>;
}
