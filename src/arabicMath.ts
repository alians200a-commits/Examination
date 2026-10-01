/**
 * Arabic-first mathematical notation. Users type familiar Arabic symbols and ٠-٩;
 * we parse a conservative subset and render actual fractions, radicals and powers
 * through KaTeX. Invalid input is reported rather than silently typeset incorrectly.
 */

const WESTERN = '0123456789';
const ARABIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

export function arabicDigits(value: string): string {
  return value.replace(/[0-9۰-۹]/g, digit => {
    const code = WESTERN.indexOf(digit);
    return ARABIC[code < 0 ? PERSIAN.indexOf(digit) : code] || digit;
  });
}

export type ArabicMathResult = { latex: string; error: string | null };
type Token = { kind: 'number' | 'identifier' | 'operator' | 'end'; text: string; at: number };

const IDENT = /[\p{L}\p{M}]/u;
const DIGIT = /[0-9٠-٩۰-۹]/;
const SPECIAL = new Set(['+', '-', '−', '×', '*', '÷', '/', '^', '_', '=', '≠', '≈', '<', '>', '≤', '≥', '(', ')', '[', ']', '√', '∛', '²', '³', '⁴', '°', '±', '|', '∈', '∉', '∪', '∩', '∞', '∑', '∫', ',', '،']);

export function normalizeArabicEquation(value: string): string {
  return arabicDigits(value.replace(/[\u200e\u200f\u2066-\u2069]/g, '').replace(/\u2212/g, '-').replace(/\u00d7/g, '×'));
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/u.test(c)) { i += 1; continue; }
    if (DIGIT.test(c)) {
      const start = i;
      while (i < source.length && DIGIT.test(source[i])) i++;
      if (['.', '٫'].includes(source[i]) && DIGIT.test(source[i + 1] || '')) {
        i++;
        while (i < source.length && DIGIT.test(source[i])) i++;
      }
      tokens.push({ kind: 'number', text: source.slice(start, i), at: start });
      continue;
    }
    if (IDENT.test(c)) {
      const start = i;
      while (i < source.length && IDENT.test(source[i])) i++;
      tokens.push({ kind: 'identifier', text: source.slice(start, i), at: start });
      continue;
    }
    if (SPECIAL.has(c)) {
      tokens.push({ kind: 'operator', text: c, at: i });
      i++;
      continue;
    }
    throw new Error(`الرمز «${c}» غير مدعوم عند الموضع ${i + 1}.`);
  }
  tokens.push({ kind: 'end', text: '', at: source.length });
  return tokens;
}

const LIMIT = 600;
const BINARY: Record<string, { precedence: number; sign: string; rightAssociative?: boolean }> = {
  '=': { precedence: 1, sign: '=' },
  '≠': { precedence: 1, sign: '\\ne ' },
  '≈': { precedence: 1, sign: '\\approx ' },
  '<': { precedence: 1, sign: '<' },
  '>': { precedence: 1, sign: '>' },
  '≤': { precedence: 1, sign: '\\leq ' },
  '≥': { precedence: 1, sign: '\\geq ' },
  '∈': { precedence: 1, sign: '\\in ' },
  '∉': { precedence: 1, sign: '\\notin ' },
  '+': { precedence: 2, sign: '+' },
  '-': { precedence: 2, sign: '-' },
  '±': { precedence: 2, sign: '\\pm ' },
  '∪': { precedence: 2, sign: '\\cup ' },
  '∩': { precedence: 2, sign: '\\cap ' },
  '×': { precedence: 3, sign: '\\times ' },
  '*': { precedence: 3, sign: '\\cdot ' },
  '÷': { precedence: 3, sign: '\\div ' },
  '/': { precedence: 3, sign: '/' },
  '^': { precedence: 5, sign: '^', rightAssociative: true },
  '_': { precedence: 5, sign: '_', rightAssociative: true },
};

function escapeText(value: string): string {
  return value.replace(/[\\{}%$#&_]/g, match => ({
    '\\': '\\backslash ', '{': '\\{', '}': '\\}', '%': '\\%', '$': '\\$', '#': '\\#', '&': '\\&', '_': '\\_',
  })[match] || match);
}

function ungroup(latex: string): string {
  return latex.startsWith('\\left(') && latex.endsWith('\\right)') ? latex.slice(6, -7) : latex;
}

function mathText(value: string): string {
  return `\\text{${escapeText(arabicDigits(value))}}`;
}

class Parser {
  private pos = 0;
  private depth = 0;
  private insideAbsolute = false;
  constructor(private readonly tokens: Token[]) {}
  private peek(): Token { return this.tokens[this.pos]; }
  private take(): Token { return this.tokens[this.pos++]; }
  private accept(value: string): boolean { if (this.peek().text === value) { this.take(); return true; } return false; }
  private expect(value: string) { if (!this.accept(value)) throw new Error(`المتوقّع «${value}» قرب الموضع ${this.peek().at + 1}.`); }
  private atomAhead(): boolean {
    const t = this.peek();
    return t.kind === 'identifier' || t.kind === 'number' || ['(', '[', '√', '∛', '|'].includes(t.text);
  }
  parse(): string {
    if (this.peek().kind === 'end') return '';
    const latex = this.expression(0);
    if (this.peek().kind !== 'end') throw new Error(`تأكد من الرمز «${this.peek().text}» عند الموضع ${this.peek().at + 1}.`);
    return latex;
  }
  private expression(min: number): string {
    if (++this.depth > 100) throw new Error('المعادلة متداخلة بصورة كبيرة.');
    let left = this.atom();
    for (;;) {
      const token = this.peek();
      if (token.text === '|' && this.insideAbsolute) break;
      if (['²', '³', '⁴', '°'].includes(token.text)) {
        if (5 < min) break;
        this.take();
        left = token.text === '°' ? `${left}^{\\circ}` : `{${left}}^{${mathText(({ '²': '٢', '³': '٣', '⁴': '٤' } as Record<string, string>)[token.text])}}`;
        continue;
      }
      const implicit = this.atomAhead();
      const op = implicit ? { precedence: 3, sign: '' } : BINARY[token.text];
      if (!op || op.precedence < min) break;
      if (!implicit) this.take();
      const right = this.expression(op.precedence + (token.text === '_' ? 1 : ('rightAssociative' in op && op.rightAssociative ? 0 : 1)));
      if (token.text === '/' && !implicit) left = `\\frac{${ungroup(left)}}{${ungroup(right)}}`;
      else if (token.text === '^' && !implicit) left = `{${left}}^{${right}}`;
      else if (token.text === '_' && !implicit) left = `{${left}}_{${right}}`;
      else left = `${left}${op.sign}${right}`;
    }
    this.depth--;
    return left;
  }
  private atom(): string {
    const token = this.take();
    switch (token.kind) {
      case 'number': return mathText(token.text.replace('.', '٫'));
      case 'identifier': {
        if (token.text === 'π') return '\\pi ';
        return mathText(token.text);
      }
      case 'operator': {
        if (token.text === '+') return this.atom();
        if (token.text === '-') return `-${this.atom()}`;
        if (token.text === '√' || token.text === '∛') {
          const radicand = ungroup(this.atom());
          return token.text === '∛' ? `\\sqrt[${mathText('٣')}]{${radicand}}` : `\\sqrt{${radicand}}`;
        }
        if (token.text === '∞') return '\\infty ';
        if (token.text === '∑') return '\\sum ';
        if (token.text === '∫') return '\\int ';
        if (token.text === '(' || token.text === '[') {
          const closing = token.text === '(' ? ')' : ']';
          const inside = this.expression(0);
          this.expect(closing);
          return `\\left${token.text}${inside}\\right${closing}`;
        }
        if (token.text === '|') {
          this.insideAbsolute = true;
          const inside = this.expression(0);
          this.insideAbsolute = false;
          this.expect('|');
          return `\\left|${inside}\\right|`;
        }
      }
    }
    throw new Error(`المعادلة غير مكتملة عند الموضع ${token.at + 1}.`);
  }
}

export function arabicEquationToLatex(raw: string): ArabicMathResult {
  try {
    const value = normalizeArabicEquation(raw).trim();
    if (value.length > LIMIT) throw new Error('الحد الأقصى للمعادلة هو ٦٠٠ حرف.');
    const latex = new Parser(tokenize(value)).parse();
    return { latex, error: null };
  } catch (error) {
    return { latex: '', error: error instanceof Error ? error.message : 'صيغة المعادلة غير صالحة.' };
  }
}
