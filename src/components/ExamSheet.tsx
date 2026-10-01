import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from 'react';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { Grip } from 'lucide-react';
import { logoBand } from '../data';
import type { ExamMeta, LogoSettings, Theme } from '../data';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface Props {
  editor: Editor | null;
  body?: ReactNode;
  closing?: string;
  showNameLine?: boolean;
  meta: ExamMeta;
  theme: Theme;
  logo: LogoSettings;
  setLogo: Dispatch<SetStateAction<LogoSettings>>;
}

export function ExamSheet({ editor, body, closing, showNameLine = true, meta, theme, logo, setLogo }: Props) {
  const headerRef = useRef<HTMLDivElement>(null);

  const dragLogo = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId) || !headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    setLogo(v => ({
      ...v,
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 4, 96),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 4, 96),
    }));
  };

  return (
    <div className={`exam-paper theme-${theme}`} dir="rtl">
      <div className="paper-header" ref={headerRef} style={logo.src ? { paddingTop: `${logoBand(logo.width, logo.ratio)}%` } : undefined}>
        {logo.src && (
          <div
            className="paper-logo"
            style={{ left: `${logo.x}%`, top: `${logo.y}%`, width: `${logo.width}%` }}
            onPointerDown={e => e.currentTarget.setPointerCapture(e.pointerId)}
            onPointerMove={dragLogo}
          >
            <img src={logo.src} alt={logo.name || 'شعار'} draggable={false} />
            <span className="logo-handle" title="اسحب لتحريك الشعار"><Grip size={12} /></span>
          </div>
        )}
        <div className="header-government">
          <strong>{meta.country}</strong>
          <span>{meta.ministry}</span>
          <span>{meta.directorate}</span>
          {meta.schoolFooter !== 'yes' && <span>المدرسة: {meta.school || '..................'}</span>}
        </div>
        <div className="header-center">
          <h1>{meta.examTitle}</h1>
          {meta.examDate && <strong>العام الدراسي <bdi dir="ltr">{meta.examDate}</bdi></strong>}
          <span>{meta.round}</span>
        </div>
        <div className="header-details">
          <span><b>المادة:</b> {meta.subject}</span>
          <span><b>الصف:</b> {meta.grade}</span>
          <span><b>الوقت:</b> {meta.duration}</span>
          {meta.day && <span><b>التاريخ:</b> {meta.day}</span>}
        </div>
      </div>
      {meta.note && <div className="exam-note">{meta.note}</div>}
      {showNameLine && <div className="name-line"><b>اسم الطالب/ة:</b><span className="dotted-line" /></div>}
      {body || <EditorContent editor={editor} />}
      <footer className="paper-footer">
        <span>مدرس المادة: {meta.teacher || '........................'}</span>
        <span>{closing || 'مع تمنياتنا لكم بالتوفيق والنجاح'}{meta.schoolFooter === 'yes' && <span className="footer-school">إدارة المدرسة: {meta.school || '..................'}</span>}</span>
      </footer>
    </div>
  );
}
