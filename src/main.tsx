import React from 'react';
import { createRoot } from 'react-dom/client';
// الخطوط مضمّنة محليًا: تعمل بدون إنترنت وداخل تطبيقات WebView، وتظهر بنفس الشكل في الـ PDF.
import '@fontsource/cairo/arabic-400.css';
import '@fontsource/cairo/arabic-600.css';
import '@fontsource/cairo/arabic-700.css';
import '@fontsource/cairo/latin-400.css';
import '@fontsource/cairo/latin-700.css';
import '@fontsource/noto-naskh-arabic/arabic-400.css';
import '@fontsource/noto-naskh-arabic/arabic-700.css';
import '@fontsource/noto-naskh-arabic/latin-400.css';
import 'katex/dist/katex.min.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
