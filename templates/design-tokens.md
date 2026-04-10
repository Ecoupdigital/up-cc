# Design Tokens — {PROJECT_NAME}

Referencia visual do projeto. Gerado pelo up-system-designer durante o Estagio 2 (Arquitetura).
Usado pelo up-visual-critic como baseline para avaliar consistencia visual.

---

## Colors

### Primary
- `--color-primary`: {valor} — Acao principal, CTA, links
- `--color-primary-hover`: {valor} — Hover da cor primaria
- `--color-primary-foreground`: {valor} — Texto sobre cor primaria

### Secondary
- `--color-secondary`: {valor} — Acoes secundarias
- `--color-secondary-hover`: {valor}
- `--color-secondary-foreground`: {valor}

### Neutral
- `--color-background`: {valor} — Fundo geral
- `--color-foreground`: {valor} — Texto principal
- `--color-muted`: {valor} — Fundos sutis
- `--color-muted-foreground`: {valor} — Texto secundario
- `--color-border`: {valor} — Bordas
- `--color-input`: {valor} — Fundo de inputs
- `--color-card`: {valor} — Fundo de cards

### Semantic
- `--color-success`: {valor} — Sucesso, confirmacao
- `--color-warning`: {valor} — Alerta, atencao
- `--color-error`: {valor} — Erro, destrutivo
- `--color-info`: {valor} — Informativo

## Typography

### Font Family
- `--font-sans`: {valor} — Texto geral (ex: Inter, Geist, system-ui)
- `--font-mono`: {valor} — Codigo (ex: JetBrains Mono, Fira Code)

### Font Size Scale
| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 12px | Labels, captions |
| `--text-sm` | 14px | Body secundario, inputs |
| `--text-base` | 16px | Body principal |
| `--text-lg` | 18px | Subtitulos |
| `--text-xl` | 20px | Section headers |
| `--text-2xl` | 24px | Page titles |
| `--text-3xl` | 30px | Hero sections |
| `--text-4xl` | 36px | Display |

### Font Weight
| Token | Weight | Usage |
|-------|--------|-------|
| `--font-normal` | 400 | Body text |
| `--font-medium` | 500 | Labels, emphasis |
| `--font-semibold` | 600 | Subtitles, buttons |
| `--font-bold` | 700 | Titles, headings |

## Spacing

### Scale (base: 4px)
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Inline gaps, icon padding |
| `--space-2` | 8px | Tight element spacing |
| `--space-3` | 12px | Input padding, small gaps |
| `--space-4` | 16px | Card padding, standard gap |
| `--space-5` | 20px | Section padding (mobile) |
| `--space-6` | 24px | Section gaps |
| `--space-8` | 32px | Section padding (desktop) |
| `--space-10` | 40px | Large section spacing |
| `--space-12` | 48px | Page margins |
| `--space-16` | 64px | Hero spacing |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Badges, tags |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, modals |
| `--radius-xl` | 16px | Large cards, sheets |
| `--radius-full` | 9999px | Avatars, pills |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Inputs, subtle elevation |
| `--shadow-md` | 0 4px 6px rgba(0,0,0,0.07) | Cards, dropdowns |
| `--shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) | Modals, popovers |
| `--shadow-xl` | 0 20px 25px rgba(0,0,0,0.15) | Dialogs, sheets |

## Breakpoints

| Token | Value | Usage |
|-------|-------|-------|
| `--bp-sm` | 640px | Mobile landscape |
| `--bp-md` | 768px | Tablet |
| `--bp-lg` | 1024px | Desktop |
| `--bp-xl` | 1280px | Wide desktop |
| `--bp-2xl` | 1536px | Ultra wide |

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-dropdown` | 50 | Dropdowns, selects |
| `--z-sticky` | 100 | Sticky headers |
| `--z-overlay` | 200 | Overlays, backdrops |
| `--z-modal` | 300 | Modals, dialogs |
| `--z-popover` | 400 | Popovers, tooltips |
| `--z-toast` | 500 | Toast notifications |

## Component Tokens

### Buttons
- Height: 36px (sm), 40px (md), 44px (lg)
- Padding horizontal: 12px (sm), 16px (md), 24px (lg)
- Font size: 13px (sm), 14px (md), 15px (lg)
- Border radius: `--radius-md`
- Transition: 150ms ease

### Inputs
- Height: 36px (sm), 40px (md), 44px (lg)
- Padding horizontal: 12px
- Font size: 14px
- Border: 1px solid `--color-border`
- Border radius: `--radius-md`
- Focus ring: 2px `--color-primary` with offset

### Cards
- Padding: `--space-4` (mobile), `--space-6` (desktop)
- Border: 1px solid `--color-border`
- Border radius: `--radius-lg`
- Shadow: `--shadow-sm`

### Tables
- Header bg: `--color-muted`
- Row height: 48px
- Cell padding: `--space-3` horizontal
- Border: 1px solid `--color-border` (bottom only)

---

**Nota:** Este arquivo e referencia para o visual critic. Os valores reais sao definidos em:
- Tailwind: `tailwind.config.ts` (theme.extend)
- CSS: `globals.css` (CSS custom properties)
- shadcn: `components.json` + `lib/utils.ts`
