import type { JSONContent } from '@tiptap/core';
import { defaultLogo, defaults, STORAGE_KEY, THEME_OPTIONS } from './data';
import type { ExamMeta, LogoSettings, Project, Theme } from './data';
import { sanitizeStructured } from './formExam';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const isTheme = (v: unknown): v is Theme => THEME_OPTIONS.some(t => t.id === v);

/** يتحقق من أي مشروع قادم من الملف أو التخزين المحلي ويُرجع نسخة آمنة، أو null إذا لم يكن مشروعًا صالحًا. */
export function sanitizeProject(value: unknown): Partial<Project> | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 2) return null;

  const doc = raw.document as JSONContent | undefined;
  if (!doc || doc.type !== 'doc') return null;

  const meta: Partial<ExamMeta> = {};
  if (typeof raw.meta === 'object' && raw.meta !== null) {
    for (const key of Object.keys(defaults) as (keyof ExamMeta)[]) {
      const v = (raw.meta as Record<string, unknown>)[key];
      if (typeof v === 'string') {
        if(key==='customFontSrc' && v && (!/^data:(font\/[^;,]+|application\/(font-woff|x-font-ttf|x-font-opentype|octet-stream));base64,[A-Za-z0-9+/=]+$/i.test(v)||v.length>1_600_000))return null;
        Object.assign(meta, { [key]: v });
      }
    }
  }

  let logo: LogoSettings = { ...defaultLogo };
  const l = raw.logo as Partial<LogoSettings> | undefined;
  if (l && typeof l.src === 'string' && l.src.startsWith('data:image/')) {
    logo = {
      src: l.src,
      name: typeof l.name === 'string' ? l.name : '',
      x: clamp(Number(l.x) || defaultLogo.x, 4, 96),
      y: clamp(Number(l.y) || defaultLogo.y, 4, 96),
      width: clamp(Number(l.width) || defaultLogo.width, 6, 30),
      ratio: clamp(Number(l.ratio) || 1, 0.2, 5),
    };
  }

  const structured = raw.structured === undefined ? undefined : sanitizeStructured(raw.structured);
  if (raw.structured !== undefined && !structured) return null;
  const mode = raw.mode === 'free' || raw.mode === 'form' ? raw.mode : undefined;
  return { version: 2, meta: meta as ExamMeta, theme: isTheme(raw.theme) ? raw.theme : 'official', logo, document: doc, mode, structured: structured || undefined };
}

export function loadProject(): Partial<Project> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return (raw && sanitizeProject(JSON.parse(raw))) || {};
  } catch {
    return {};
  }
}

export function saveProject(project: Project): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}
