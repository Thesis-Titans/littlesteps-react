# Shared components

Build every screen from these components and the tokens in `src/styles/tokens.css`. Do not restyle buttons, fields, or status alerts inside feature screens.

- **Import:** `import { Button, ModalDialog, PasswordField, TextField } from "../components/common";`
- **See them live:** run `npm run dev` and open [`/dev/components`](http://localhost:5173/dev/components). It shows every component in every state and exists only in development builds.
- **Design reference:** Rules in the [UI/UX specification](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/ui-ux-design-specification.md) §2.5 (interaction), §2.6 (wording), §6 (tokens), and §7 (the five states).

`common/` holds shared UI primitives and `Logo`. `layout/` holds the responsive app shell and navigation.

## Components

| Component | Use it for | Key props | States and accessibility |
|---|---|---|---|
| `Button` | Every action | `variant`: `primary` (one per screen), `secondary`, `text`, `danger` (permanent deletes); `busy`; `fullWidth` | 48px tall (text buttons 44px). `busy` disables it and sets `aria-busy`. |
| `TextField` | Single-line input or multiline notes | `label` (always visible), `hint`, `error`, `maxLength`, `trailing` | Label is tied to the field; `error` sets `aria-invalid` and links via `aria-describedby`. Paste is never blocked. |
| `PasswordField` | Password entry with show/hide toggle | Same as `TextField` (omits `type`) | Accessible toggle button with `aria-pressed` state. |
| `Select` | Picking one option from a short list | `label`, `options`, `hint`, `error` | Native `<select>` for full keyboard and screen-reader support. |
| `Chip` | Filters and choices | `selected` | Toggle button with `aria-pressed` (48px tall). Wrap groups with `role="group"`. |
| `Card` | Grouping content | `as` (`div`, `section`, `article`, `li`), `elevated` | Use `elevated` only for cards on the page background. |
| `Badge` | Short status labels | `kind`: `source`, `completed`, `ai`, `private`, `offline` | Every AI-written result must show `<Badge kind="ai" />`. |
| `InlineAlert` | Errors, offline notices, and cautions | `kind`: `error`, `offline`, `info`, `caution`; `title`; `action` | Errors use `role="alert"`, the rest `role="status"`. Persists until resolved. |
| `SessionExpiredAlert` | Standard 401 session-ended notice | `message` (optional) | Reuses `InlineAlert kind="error"` consistently across all screens. |
| `Skeleton` | Loading state | `kind`: `card`, `row`, `profile`; `label` | Announces label once; shapes hidden from assistive technology; stops animation under reduced motion. |
| `EmptyState` | Empty lists | `title`, `children`, `action` | Calm guidance describing what appears here and how to start. |
| `ModalDialog` | Accessible native `<dialog>` wrapper | `open`, `labelledBy`, `onClose`, `className`, `returnFocusTo`, `fallbackFocusId` | Traps focus via `showModal()`, cancels on Escape, and restores focus on close. |
| `ConfirmDialog` | Permanent actions (deleting notes or accounts) | `open`, `title`, `confirmLabel`, `destructive`, `onConfirm`, `onCancel` | Built on `ModalDialog`. Cancel receives focus first; confirm button names the destructive action. |
| `UndoToast` | Reversible actions (mark complete) | `message`, `onUndo`, `onClose`, `durationMs` | Stays at least 10 seconds and pauses on hover or focus (`role="status"`). |
| `SuccessNotice` | Confirming a finished action | `message`, `onClose`, `durationMs` | Persistent `role="status"` region; moves focus to page `h1` when dismissed. |
| `Icon` | Tokenized SVG icons in `src/assets/icons` | `name`, `size`, `label` | Inherits text color; decorative by default (`aria-hidden`). |

## Five states on every screen

| State | Component |
|---|---|
| Populated | Cards and lists |
| Empty | `EmptyState` |
| Loading | `Skeleton` |
| Error or session expired | `InlineAlert kind="error"` / `SessionExpiredAlert` |
| Offline or AI fallback | `InlineAlert kind="offline"` or `InlineAlert kind="info"` / `"caution"` |

## Adding or changing a component

1. Use design tokens only: zero hardcoded hex colors, spacing, or radii outside `src/styles/tokens.css`.
2. Cover default, focus, disabled, and error states where applicable, and showcase variants in `/dev/components`.
3. Add or update tests inside `src/components/common/__tests__/`.
