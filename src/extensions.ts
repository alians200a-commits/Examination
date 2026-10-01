import { Extension, Node, mergeAttributes } from '@tiptap/core';

export const Direction = Extension.create({
  name: 'textDirection',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'listItem', 'tableCell', 'tableHeader'],
        attributes: {
          dir: {
            default: null,
            parseHTML: element => element.getAttribute('dir'),
            renderHTML: attrs => (attrs.dir ? { dir: attrs.dir } : {}),
          },
        },
      },
    ];
  },
});

export const FontAttributes = Extension.create({
  name: 'fontAttributes',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => (element as HTMLElement).style.fontSize || null,
            renderHTML: attrs => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
          },
          fontFamily: {
            default: null,
            parseHTML: element => (element as HTMLElement).style.fontFamily || null,
            renderHTML: attrs => (attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {}),
          },
        },
      },
    ];
  },
});

/** فاصل صفحة: يظهر خطًا متقطعًا في المعاينة ويبدأ صفحة جديدة عند الطباعة. */
export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break', class: 'page-break' })];
  },
});
