# Line family: brand and status colors (final, 2026-11-08)

## Brand colors
| Tool | Accent (logo tile, buttons, accents on light) | Bright (on dark backgrounds) | Why |
|---|---|---|---|
| Hitline | #7F56D9 violet | #B692F6 | Tracking, the family's lead color |
| Serpline | #2563EB blue | #93C5FD | Search: the familiar link and search blue |
| Rivaline | #0E7490 teal | #67E8F9 | Competitor radar |
| Foldline | #C11574 pink | #FAA7E0 | CRO: energetic, action |
| Markline | #FACC15 yellow | #FDE68A | Marker and highlighter |

Old colors, no longer used anywhere: #15803D, #86EFAC (old Serpline green), #C2410C, #FDBA74 (old Rivaline orange), #A16207, #FDE047 (old Foldline ochre), #A21CAF, #F0ABFC (short-lived fuchsia). Note: Serpline's new color is Markline's old blue, and Rivaline's new color is the teal that Serpline had for a short time.

### Markline yellow rules
- Yellow is never used as text on white (contrast 1.5:1).
- On the yellow tile and yellow buttons the glyph and text are ink #101828 (11.6:1).
- In the wordmark "Mark" and "line" are both ink. "line" gets a yellow marker highlight behind its lower half: `linear-gradient(transparent 42%, #FACC15 42%, #FACC15 74%, transparent 74%)`.
- On dark backgrounds the tile is #FDE68A with an ink glyph, and "line" is #FDE68A (no highlight).

## Logos
Every tool keeps its own glyph inside the rounded tile (never a letter):
- Hitline: a pulse line
- Serpline: a magnifier with a line
- Rivaline: a radar with a sweep and a dot
- Foldline: a page with a dashed fold line
- Markline: crop corners with a squiggle

Source of truth: the Logo component (`design/Logo.dc.html`). Tile radius is 26% of size, glyph 64%, the wordmark is 66% of the tile size and 800 weight.

## Status colors (same in every tool)
| Status | Text | Background | Border |
|---|---|---|---|
| OK | #067647 | #ECFDF3 | #ABEFC6 |
| Problem | #B42318 | #FEF3F2 | #FECDCA |
| Warning | #B54708 | #FFFAEB | #FEDF89 |
| Neutral | #475467 | #EEEDF3 | |

## Rules
- Status colors are only for statuses and always come with an icon and a label.
- A brand color is never used for a status. A status color is never used as brand decoration.
- No tool is green, orange, brown or red, because those are status colors.
- Shared lime accent #C6F36B (text on lime #1A2E05) is for the main contact CTA in every tool.

## Shared landing rules
- Dark hero (#120D24) with glows in the tool's accent and lime. White cards inside keep dark text.
- Hero headline accent: the highlighted words use the tool's light color (Hitline #B692F6, Serpline #93C5FD, Rivaline #67E8F9, Foldline #FAA7E0, Markline #FDE68A) with a solid lime #C6F36B underline bar under them (6px high, radius 6px, 4px below the baseline box, full word width). Same logic on every landing.
- Hero marquee cards are translucent on the dark hero (bg rgba(255,255,255,.06), inset border rgba(255,255,255,.13), blur 8px, text #EDEAF8); platform icons stay on their light tint squares.
- Hover lift never clips: the marquee track has 6px vertical padding inside its `overflow: hidden` box, and the tab bar wrapper has at least 2px padding so its 1px ring survives `overflow-x: auto`.
- Sticky dark header (rgba(18,13,36,.94), blur). No `overflow: hidden` on its ancestors (use `overflow-x: clip`).
- "Free Chrome extension" pill: height 32px, padding 0 14px 0 12px, gap 8px, 13px/600, green pulsing dot 8px #12B76A.
