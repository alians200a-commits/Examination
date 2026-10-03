# Visual design references — AlMufeed v15

This native HTML/CSS application was reviewed against free MIT-licensed [shadcn/ui](https://github.com/shadcn-ui/ui), [Tabler](https://github.com/tabler/tabler), and [Tabler Icons](https://github.com/tabler/tabler-icons). The implementations are independent: no third-party runtime was added and no external template was copied. Layout principles informed the three-step workflow, restrained cards, focus states, contextual tools, compact status summaries and clear tables.

## Non-negotiable palette
White, navy, true blue and cool slate for the app; pale rose only for grade and warning badges. No green, mint, teal, petrol or olive anywhere in application UI or printable themes. Old saved themes named `teal` are displayed as steel blue via migration. `tests/palette.js` scans source colors on every push.

## Printed sheet
A4 white paper; formal three-column header framed in navy; light blue-gray question strips; pale rose mark badges. The on-screen DOM is the printed DOM. Long tables split on full rows and reprint header rows on continued pages. Font notices remain under `fonts/FONT-NOTICES.txt`.
