# ADIAK Design System 1.0

Strict monochrome visual specification for the ADIAK app (white · black · charcoal · neutral grey).

- **PDF (13 boards):** `ADIAK_Design_System_1.0.pdf`
- **Boards (PNG, 2×):** `boards-png/`
- **Live boards:** `boards.html` (serve the repo root, open `/docs/design-system/boards.html`)
- **Spec, decisions, implementation plan:** `SPEC.md`
- **Tokens (source of truth):** `tokens.css` · reference components: `components.css`

Rebuild (from repo root, needs Playwright + Pillow; not part of the website or APK build):

```sh
python3 -m http.server 8765 &
node docs/design-system/tools/render.js
python3 -I docs/design-system/tools/hue_scan.py docs/design-system/boards-png/*.png   # must print OK for every board
python3 -I docs/design-system/tools/make_pdf.py
```

Inter is © The Inter Project Authors, SIL Open Font License 1.1 (`fonts/LICENSE-Inter.txt`).
