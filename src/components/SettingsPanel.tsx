import { useState } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { ImagePlus, RotateCcw, Trash2, X } from 'lucide-react';
import { defaultLogo, logoHome, paperPresets, THEME_OPTIONS } from '../data';
import type { ExamMeta, LogoSettings, Theme } from '../data';

type Tab = 'details' | 'logo' | 'theme' | 'presets';
const TABS: [Tab, string][] = [['details', 'البيانات'], ['logo', 'الشعار'], ['theme', 'الثيم'], ['presets', 'نماذج']];

const FIELDS: [keyof ExamMeta, string][] = [
  ['country', 'الدولة'], ['ministry', 'الوزارة'], ['directorate', 'المديرية'], ['school', 'المدرسة'],
  ['examTitle', 'عنوان الامتحان'], ['grade', 'الصف'], ['subject', 'المادة'], ['examDate', 'العام الدراسي'], ['day', 'التاريخ'],
  ['round', 'الدور'], ['duration', 'الوقت'], ['teacher', 'مدرس المادة'],
];

interface Props {
  open: boolean;
  onClose: () => void;
  meta: ExamMeta;
  onMeta: (key: keyof ExamMeta, value: string) => void;
  theme: Theme;
  onTheme: (t: Theme) => void;
  logo: LogoSettings;
  setLogo: Dispatch<SetStateAction<LogoSettings>>;
  onPickLogo: () => void;
  onPreset: (id: string) => void;
}

export function SettingsPanel({ open, onClose, meta, onMeta, theme, onTheme, logo, setLogo, onPickLogo, onPreset }: Props) {
  const [tab, setTab] = useState<Tab>('details');
  const slider = (key: 'x' | 'y' | 'width', label: string, min: number, max: number) => (
    <label>
      <span>{label}</span>
      <input type="range" min={min} max={max} value={logo[key]} onChange={(e: ChangeEvent<HTMLInputElement>) => setLogo(v => ({ ...v, [key]: +e.target.value }))} />
    </label>
  );

  return (
    <>
      {open && <div className="backdrop" onClick={onClose} />}
      <aside className={`inspector ${open ? 'open' : ''}`} aria-label="إعدادات الامتحان">
        <div className="inspector-head">
          <div className="seg" role="tablist">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          <button type="button" className="icon-btn close-panel" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>

        <div className="inspector-body">
          {tab === 'details' && (
            <div className="fields-grid">
              {FIELDS.map(([key, label]) => (
                <label key={key}><span>{label}</span><input dir="auto" value={meta[key]} onChange={e => onMeta(key, e.target.value)} /></label>
              ))}
              <label className="full-span"><span>ملاحظة الامتحان</span><textarea rows={3} value={meta.note} onChange={e => onMeta('note', e.target.value)} /></label>
            </div>
          )}

          {tab === 'logo' && (
            <div className="logo-panel">
              <p className="panel-help">ارفع الشعار ثم اسحبه داخل الترويسة بإصبعك أو بالماوس، أو اضبطه بالمنزلقات.</p>
              <div className="row-actions">
                <button type="button" className="btn" onClick={onPickLogo}><ImagePlus size={16} /> {logo.src ? 'تغيير الشعار' : 'رفع شعار'}</button>
                {logo.src && <button type="button" className="btn" onClick={() => setLogo(v => ({ ...v, ...logoHome(v.width, v.ratio) }))}><RotateCcw size={16} /> إعادة الموضع</button>}
                {logo.src && <button type="button" className="btn danger" onClick={() => setLogo(defaultLogo)}><Trash2 size={16} /> حذف</button>}
              </div>
              {logo.src && (
                <div className="slider-group">
                  {slider('x', 'أفقي', 4, 96)}
                  {slider('y', 'عمودي', 4, 96)}
                  {slider('width', 'الحجم', 6, 30)}
                </div>
              )}
            </div>
          )}

          {tab === 'theme' && (
            <div className="theme-grid">
              {THEME_OPTIONS.map(t => (
                <button key={t.id} type="button" className={`theme-tile ${theme === t.id ? 'chosen' : ''}`} onClick={() => onTheme(t.id)}>
                  <span className="swatch" style={{ background: `linear-gradient(135deg,${t.colors[0]} 0 55%,${t.colors[1]} 55% 100%)` }} />
                  <span><strong>{t.label}</strong><small>{t.description}</small></span>
                </button>
              ))}
            </div>
          )}

          {tab === 'presets' && (
            <div className="preset-list">
              {paperPresets.map(p => (
                <button key={p.id} type="button" className="preset-card" onClick={() => onPreset(p.id)}>
                  <strong>{p.label}</strong><small>{p.summary}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
