# DevCollective Design System

The interior product UI uses a small set of reusable primitives so pages can share the same geometry without changing their data or behavior.

## Visual language

- Neo-brutalist editorial UI with soft pastel surfaces.
- 2px semantic borders using `--outline-variant`.
- Hard shadows remain part of the identity.
- Inter for product/display typography and Space Mono for labels.
- Public landing visuals remain independent from interior workspace geometry.

## Geometry tokens

| Token | Value | Use |
| --- | ---: | --- |
| `--dc-radius-section` | 24px | Large page sections / hero surfaces |
| `--dc-radius-card` | 18px | Cards, panels, content surfaces |
| `--dc-radius-control` | 12px | Buttons, inputs, controls |
| `--dc-radius-small` | 10px | Small utility surfaces |
| pill | 9999px | Badges, avatars, status chips |

## Shadow tokens

Use semantic shadows instead of hardcoding a color into reusable components:

- `--dc-shadow-sm` — compact controls
- `--dc-shadow-md` — cards
- `--dc-shadow-lg` — primary surfaces

Dark mode intentionally uses a dark shadow color rather than mapping shadows to `--outline-variant`, because that token becomes light in dark mode.

## UI primitives

Located in `src/components/ui/`:

- `DcButton`
- `DcCard`
- `DcBadge`
- `DcSectionHeader`
- `DcEmptyState`

Primitives should own repeated geometry and semantics. Page components should continue to own page-specific data, API calls, Supabase interactions, and business rules.

## Migration rule

Migrate one page at a time. Start with Dashboard and Community, validate with `npm run lint` and `npm run build`, then continue to the next page.

Do not modify Supabase schema, authentication, REP logic, routing, or community backend as part of a visual component migration.

## State and behavior

UI primitives should be presentational and accept state/handlers through props. React recommends keeping a single source of truth for coordinated state and composing reusable components for repeated UI. See the React documentation for [sharing state](https://react.dev/learn/sharing-state-between-components) and [component composition](https://react.dev/learn/your-first-component).
