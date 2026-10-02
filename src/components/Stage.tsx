import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
const SHEET=210*96/25.4;
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
/** A4 pages exist independently in the DOM. The exact same nodes are printed at 100%, never repaginated. */
export function Stage({children}:{children:ReactNode}) {
  const viewport=useRef<HTMLDivElement>(null),pages=useRef<HTMLDivElement>(null);
  const [available,setAvailable]=useState(720),[height,setHeight]=useState(297*96/25.4),[zoom,setZoom]=useState<number|'fit'>('fit');
  useEffect(()=>{
    if(!viewport.current||!pages.current)return;
    const v=viewport.current,p=pages.current;
    const ob1=new ResizeObserver(()=>setAvailable(v.clientWidth));
    const ob2=new ResizeObserver(()=>setHeight(p.getBoundingClientRect().height / (Number(p.dataset.scale)||1)));
    ob1.observe(v);ob2.observe(p);
    return ()=>{ob1.disconnect();ob2.disconnect()};
  },[]);
  const fit=clamp((available-28)/SHEET,.28,1);
  const scale=zoom==='fit'?fit:zoom;
  const step=(delta:number)=>setZoom(clamp(Math.round((scale+delta)*100)/100,.28,2));
  return <div className="stage">
    <div className="stage-scroll" ref={viewport}><div className="sheet-box" style={{width:SHEET*scale,height:height*scale}}>
      <div className="sheet-scale" ref={pages} data-scale={scale} style={{transform:`scale(${scale})`}}>{children}</div>
    </div></div>
    <div className="zoom-bar" role="group" aria-label="مقياس المعاينة"><button onClick={()=>step(-.1)} aria-label="تصغير"><ZoomOut size={16}/></button><span>{Math.round(scale*100)}%</span><button onClick={()=>step(.1)} aria-label="تكبير"><ZoomIn size={16}/></button><button className={zoom==='fit'?'on':''} onClick={()=>setZoom('fit')} aria-label="ملاءمة الشاشة"><Maximize2 size={15}/></button></div>
  </div>;
}
